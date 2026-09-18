import { format, parseISO, subMonths, endOfMonth, differenceInDays, subDays } from "date-fns";
import { type Transaction, type Category } from "@/types";

export interface CategorySavingsItem {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  budget: number;
  spent: number;
  saved: number;
}

export interface MonthlyBudgetStats {
  targetMonthKey: string;
  targetMonthLabel: string;
  isCurrentCalendarMonth: boolean;
  baseBudget: number;
  baseUpiBudget: number;
  baseCashBudget: number;
  monthlyExpense: number;
  monthlyIncome: number;
  netMonthlyCashflow: number;
  // Online (UPI / Card / Bank) vs Cash Breakdown
  onlineExpense: number;
  cashExpense: number;
  upiExpense: number;
  onlineIncome: number;
  cashIncome: number;
  onlinePercentage: number;
  cashPercentage: number;
  // Rollover & Available Budget (Combined)
  previousMonthKey: string;
  previousMonthLabel: string;
  previousMonthExpense: number;
  previousMonthSavings: number;
  rolloverSurplus: number;
  totalAvailableBudget: number;
  remainingBudget: number;
  budgetUsedPercentage: number;
  daysRemainingInMonth: number;
  dailySafeToSpend: number;
  // Channel-Specific Budget Metrics (UPI/Digital vs Physical Cash)
  previousMonthUpiExpense: number;
  previousMonthCashExpense: number;
  previousMonthUpiSavings: number;
  previousMonthCashSavings: number;
  upiRolloverSurplus: number;
  cashRolloverSurplus: number;
  totalAvailableUpiBudget: number;
  totalAvailableCashBudget: number;
  remainingUpiBudget: number;
  remainingCashBudget: number;
  upiBudgetUsedPercentage: number;
  cashBudgetUsedPercentage: number;
  dailySafeToSpendUpi: number;
  dailySafeToSpendCash: number;
  // Intelligent Burn Pace
  burnPaceStatus: "fast" | "frugal" | "on_track";
  burnPaceMessage: string;
  percentDaysPassed: number;
  currentDayOfMonth: number;
  totalDaysInMonth: number;
  // Deep "Where did you save?" Audit
  categorySavingsAudit: CategorySavingsItem[];
  totalCategorySavings: number;
}

/**
 * Determine if a transaction payment method is Physical Cash
 */
export function isCashTransaction(method?: string | null): boolean {
  if (!method) return false;
  const clean = method.toLowerCase().trim();
  return clean === "cash" || /\bcash\b/i.test(clean);
}

/**
 * Determine if a transaction is Digital / Online (UPI, Card, Bank, NetBanking, Transfer)
 */
export function isOnlineTransaction(method?: string | null): boolean {
  return !isCashTransaction(method);
}

/**
 * Get Previous Month YYYY-MM key safely
 */
export function getPreviousMonthKey(monthKey: string): string {
  try {
    const d = parseISO(`${monthKey}-01`);
    return format(subMonths(d, 1), "yyyy-MM");
  } catch {
    return format(subMonths(new Date(), 1), "yyyy-MM");
  }
}

/**
 * Pure engine to compute monthly budget, rollover surplus, online vs cash breakdown,
 * and detailed "Where did you save?" audit with zero data loss.
 * Supports dual channels: UPI/Digital Budget and Physical Cash Budget.
 */
export function computeMonthlyBudgetStats({
  transactions = [],
  categories = [],
  targetMonthKey = format(new Date(), "yyyy-MM"),
  baseBudget,
  baseUpiBudget,
  baseCashBudget = 0,
  previousMonthUpiBudget,
  previousMonthCashBudget,
  enableRollover = true,
  currencySymbol = "₹",
}: {
  transactions?: Transaction[];
  categories?: Category[];
  targetMonthKey?: string;
  baseBudget?: number;
  baseUpiBudget?: number;
  baseCashBudget?: number;
  previousMonthUpiBudget?: number;
  previousMonthCashBudget?: number;
  enableRollover?: boolean;
  currencySymbol?: string;
}): MonthlyBudgetStats {
  const safeTransactions = transactions || [];
  const safeCategories = categories || [];
  const today = new Date();
  const currentCalMonthKey = format(today, "yyyy-MM");
  const isCurrentCalendarMonth = targetMonthKey === currentCalMonthKey;

  // Resolve Base Budgets with seamless fallback
  const effectiveUpiBudget = baseUpiBudget !== undefined ? baseUpiBudget : (baseBudget ?? 9000);
  const effectiveCashBudget = baseCashBudget ?? 0;
  const effectiveBaseBudget = effectiveUpiBudget + effectiveCashBudget;

  // Format Labels
  let targetMonthLabel = targetMonthKey;
  try {
    targetMonthLabel = format(parseISO(`${targetMonthKey}-01`), "MMMM yyyy");
  } catch {}

  const previousMonthKey = getPreviousMonthKey(targetMonthKey);
  let previousMonthLabel = previousMonthKey;
  try {
    previousMonthLabel = format(parseISO(`${previousMonthKey}-01`), "MMMM yyyy");
  } catch {}

  // 1. Current Selected Month Transactions
  const targetMonthTxs = safeTransactions.filter(
    (t) => t.date && t.date.startsWith(targetMonthKey)
  );

  const monthlyExpense = targetMonthTxs
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const monthlyIncome = targetMonthTxs
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const netMonthlyCashflow = monthlyIncome - monthlyExpense;

  // 2. Online/UPI vs Cash Breakdown for Target Month
  const cashExpense = targetMonthTxs
    .filter((t) => t.type === "expense" && isCashTransaction(t.paymentMethod))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const onlineExpense = targetMonthTxs
    .filter((t) => t.type === "expense" && isOnlineTransaction(t.paymentMethod))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const upiExpense = onlineExpense; // UPI and Digital pool

  const cashIncome = targetMonthTxs
    .filter((t) => t.type === "income" && isCashTransaction(t.paymentMethod))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const onlineIncome = targetMonthTxs
    .filter((t) => t.type === "income" && isOnlineTransaction(t.paymentMethod))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenseForPercent = monthlyExpense > 0 ? monthlyExpense : 1;
  const onlinePercentage = monthlyExpense > 0 ? Math.round((onlineExpense / totalExpenseForPercent) * 100) : 0;
  const cashPercentage = monthlyExpense > 0 ? 100 - onlinePercentage : 0;

  // 3. Previous Month Performance & Independent Rollover
  const prevMonthTxs = safeTransactions.filter(
    (t) => t.date && t.date.startsWith(previousMonthKey)
  );

  const previousMonthExpense = prevMonthTxs
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const previousMonthUpiExpense = prevMonthTxs
    .filter((t) => t.type === "expense" && isOnlineTransaction(t.paymentMethod))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const previousMonthCashExpense = prevMonthTxs
    .filter((t) => t.type === "expense" && isCashTransaction(t.paymentMethod))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Determine effective budgets for the previous month benchmark:
  const resolvedPrevUpiBudget =
    previousMonthUpiBudget !== undefined
      ? previousMonthUpiBudget
      : (prevMonthTxs.length > 0 ? effectiveUpiBudget : 0);

  // Cash rollover: only recognize previous month cash budget if:
  // 1. It was explicitly recorded in previousMonthCashBudget, OR
  // 2. The user actually logged cash expenses in that previous month.
  // If previous cash spend is 0 and no prior cash budget was set, resolvedPrevCashBudget MUST be 0
  // to avoid manufacturing a phantom 100% savings surplus on a newly set cash budget!
  const resolvedPrevCashBudget =
    previousMonthCashBudget !== undefined
      ? previousMonthCashBudget
      : (previousMonthCashExpense > 0 ? effectiveCashBudget : 0);

  // Independent Rollover Calculations
  const previousMonthUpiSavings =
    resolvedPrevUpiBudget > 0 ? Math.max(0, resolvedPrevUpiBudget - previousMonthUpiExpense) : 0;
  const previousMonthCashSavings =
    resolvedPrevCashBudget > 0 ? Math.max(0, resolvedPrevCashBudget - previousMonthCashExpense) : 0;
  const previousMonthSavings = previousMonthUpiSavings + previousMonthCashSavings;

  const upiRolloverSurplus =
    enableRollover && resolvedPrevUpiBudget > 0 && prevMonthTxs.length > 0 ? previousMonthUpiSavings : 0;
  const cashRolloverSurplus =
    enableRollover && resolvedPrevCashBudget > 0 ? previousMonthCashSavings : 0;
  const rolloverSurplus = upiRolloverSurplus + cashRolloverSurplus;

  // Channel-Specific Available & Remaining Pools
  const totalAvailableUpiBudget = effectiveUpiBudget + upiRolloverSurplus;
  const totalAvailableCashBudget = effectiveCashBudget + cashRolloverSurplus;
  const totalAvailableBudget = totalAvailableUpiBudget + totalAvailableCashBudget;

  const remainingUpiBudget = totalAvailableUpiBudget - onlineExpense;
  const remainingCashBudget = totalAvailableCashBudget - cashExpense;
  const remainingBudget = remainingUpiBudget + remainingCashBudget;

  const upiBudgetUsedPercentage =
    totalAvailableUpiBudget > 0
      ? Math.min(100, Math.round((onlineExpense / totalAvailableUpiBudget) * 100))
      : 0;

  const cashBudgetUsedPercentage =
    totalAvailableCashBudget > 0
      ? Math.min(100, Math.round((cashExpense / totalAvailableCashBudget) * 100))
      : 0;

  const budgetUsedPercentage =
    totalAvailableBudget > 0
      ? Math.min(100, Math.round((monthlyExpense / totalAvailableBudget) * 100))
      : 0;

  // 4. Daily Safe-to-Spend & Intelligent Burn Pace
  let daysRemainingInMonth = 1;
  let totalDaysInMonth = 30;
  let currentDayOfMonth = 1;
  let percentDaysPassed = 50;

  try {
    const monthDate = parseISO(`${targetMonthKey}-01`);
    const monthEnd = endOfMonth(monthDate);
    totalDaysInMonth = monthEnd.getDate();
    if (isCurrentCalendarMonth) {
      currentDayOfMonth = today.getDate();
      daysRemainingInMonth = Math.max(1, differenceInDays(monthEnd, today) + 1);
      percentDaysPassed = Math.round((currentDayOfMonth / totalDaysInMonth) * 100);
    } else {
      daysRemainingInMonth = 1;
      currentDayOfMonth = totalDaysInMonth;
      percentDaysPassed = 100;
    }
  } catch {
    daysRemainingInMonth = 1;
  }

  const dailySafeToSpendUpi =
    remainingUpiBudget > 0 ? Math.round(remainingUpiBudget / daysRemainingInMonth) : 0;
  const dailySafeToSpendCash =
    remainingCashBudget > 0 ? Math.round(remainingCashBudget / daysRemainingInMonth) : 0;
  const dailySafeToSpend =
    remainingBudget > 0 ? Math.round(remainingBudget / daysRemainingInMonth) : 0;

  // Pace Evaluation
  let burnPaceStatus: "fast" | "frugal" | "on_track" = "on_track";
  let burnPaceMessage = "Spending is on track with your monthly plan.";
  const paceDiff = budgetUsedPercentage - percentDaysPassed;

  if (isCurrentCalendarMonth && monthlyExpense > 0) {
    if (paceDiff > 15 || remainingBudget < 0) {
      burnPaceStatus = "fast";
      burnPaceMessage = `⚠️ Spending faster than planned (~${currencySymbol}${dailySafeToSpend}/day recommended).`;
    } else if (paceDiff < -10) {
      burnPaceStatus = "frugal";
      burnPaceMessage = `🟢 Under budget! You have room to spend comfortably.`;
    } else {
      burnPaceStatus = "on_track";
      burnPaceMessage = `✨ Spending is on track with your monthly plan.`;
    }
  } else if (!isCurrentCalendarMonth) {
    burnPaceStatus = remainingBudget >= 0 ? "on_track" : "fast";
    burnPaceMessage = remainingBudget >= 0 ? "Month closed under budget! Surplus rolled over." : "Month closed over budget.";
  }

  // 5. Deep "Where did you save?" Audit (Category breakdown of previous month)
  const categorySavingsAudit: CategorySavingsItem[] = [];
  let totalCategorySavings = 0;

  safeCategories
    .filter((c) => c.type === "expense")
    .forEach((cat) => {
      const catSpent = prevMonthTxs
        .filter((t) => t.categoryId === cat.id && t.type === "expense")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const catBudget = cat.monthlyBudget || 0;
      if (catBudget > 0 && catSpent < catBudget) {
        const saved = catBudget - catSpent;
        totalCategorySavings += saved;
        categorySavingsAudit.push({
          categoryId: cat.id,
          categoryName: cat.name,
          icon: cat.icon || "💳",
          color: cat.color || "orange",
          budget: catBudget,
          spent: catSpent,
          saved,
        });
      }
    });

  categorySavingsAudit.sort((a, b) => b.saved - a.saved);

  return {
    targetMonthKey,
    targetMonthLabel,
    isCurrentCalendarMonth,
    baseBudget: effectiveBaseBudget,
    baseUpiBudget: effectiveUpiBudget,
    baseCashBudget: effectiveCashBudget,
    monthlyExpense,
    monthlyIncome,
    netMonthlyCashflow,
    onlineExpense,
    cashExpense,
    upiExpense,
    onlineIncome,
    cashIncome,
    onlinePercentage,
    cashPercentage,
    previousMonthKey,
    previousMonthLabel,
    previousMonthExpense,
    previousMonthSavings,
    rolloverSurplus,
    totalAvailableBudget,
    remainingBudget,
    budgetUsedPercentage,
    daysRemainingInMonth,
    dailySafeToSpend,
    previousMonthUpiExpense,
    previousMonthCashExpense,
    previousMonthUpiSavings,
    previousMonthCashSavings,
    upiRolloverSurplus,
    cashRolloverSurplus,
    totalAvailableUpiBudget,
    totalAvailableCashBudget,
    remainingUpiBudget,
    remainingCashBudget,
    upiBudgetUsedPercentage,
    cashBudgetUsedPercentage,
    dailySafeToSpendUpi,
    dailySafeToSpendCash,
    burnPaceStatus,
    burnPaceMessage,
    percentDaysPassed,
    currentDayOfMonth,
    totalDaysInMonth,
    categorySavingsAudit,
    totalCategorySavings,
  };
}

export interface DailyTrendItem {
  date: string; // "yyyy-MM-dd"
  dayLabel: string; // "Mon", "Tue", etc.
  dayNumber: number; // 1-31
  expense: number;
  isToday: boolean;
  isOverBudget: boolean;
}

export interface DailyBudgetStats {
  todayDate: string; // "yyyy-MM-dd"
  todayDateLabel: string; // "September 14, 2026"
  todayExpense: number;
  todayUpiExpense: number;
  todayCashExpense: number;
  dailyBudgetTarget: number;
  todayRemaining: number;
  todayUsedPercentage: number;
  isOverDailyBudget: boolean;
  overDailyAmount: number;
  isCustomTarget: boolean;
  last7Days: DailyTrendItem[];
}

export interface ComputeDailyBudgetStatsOptions {
  transactions: Transaction[];
  monthlyStats: MonthlyBudgetStats;
  customDailyBudget?: number | null;
  referenceDate?: Date;
}

/**
 * Compute Today's Daily Budget stats:
 * Evaluates today's expenses against either custom fixed daily target or dynamic safe-to-spend pace,
 * provides today's remaining spendable balance, channel split, and 7-day spending trend.
 */
export function computeDailyBudgetStats({
  transactions,
  monthlyStats,
  customDailyBudget = null,
  referenceDate = new Date(),
}: ComputeDailyBudgetStatsOptions): DailyBudgetStats {
  const todayKey = format(referenceDate, "yyyy-MM-dd");
  const todayLabel = format(referenceDate, "MMMM d, yyyy");

  // Determine Daily Budget Target: Custom fixed cap if set > 0, otherwise dynamic safe-to-spend pace
  const isCustomTarget = customDailyBudget !== null && customDailyBudget !== undefined && customDailyBudget > 0;
  const dailyBudgetTarget = isCustomTarget ? customDailyBudget : Math.max(0, monthlyStats.dailySafeToSpend);

  // Today's Expense transactions
  let todayExpense = 0;
  let todayUpiExpense = 0;
  let todayCashExpense = 0;

  transactions.forEach((tx) => {
    if (tx.type === "expense" && tx.date === todayKey) {
      const amt = Number(tx.amount) || 0;
      todayExpense += amt;
      if (isCashTransaction(tx.paymentMethod)) {
        todayCashExpense += amt;
      } else {
        todayUpiExpense += amt;
      }
    }
  });

  const todayRemaining = Math.max(0, dailyBudgetTarget - todayExpense);
  const isOverDailyBudget = todayExpense > dailyBudgetTarget && dailyBudgetTarget > 0;
  const overDailyAmount = isOverDailyBudget ? todayExpense - dailyBudgetTarget : 0;
  const todayUsedPercentage = dailyBudgetTarget > 0
    ? Math.min(100, Math.round((todayExpense / dailyBudgetTarget) * 100))
    : (todayExpense > 0 ? 100 : 0);

  // Compute 7-day trend (from 6 days ago to today)
  const last7Days: DailyTrendItem[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(referenceDate, i);
    const dateStr = format(d, "yyyy-MM-dd");
    const dayLabel = format(d, "EEE");
    const dayNumber = d.getDate();
    const isToday = i === 0;

    let dayExpense = 0;
    transactions.forEach((tx) => {
      if (tx.type === "expense" && tx.date === dateStr) {
        dayExpense += (Number(tx.amount) || 0);
      }
    });

    last7Days.push({
      date: dateStr,
      dayLabel,
      dayNumber,
      expense: dayExpense,
      isToday,
      isOverBudget: dailyBudgetTarget > 0 && dayExpense > dailyBudgetTarget,
    });
  }

  return {
    todayDate: todayKey,
    todayDateLabel: todayLabel,
    todayExpense,
    todayUpiExpense,
    todayCashExpense,
    dailyBudgetTarget,
    todayRemaining,
    todayUsedPercentage,
    isOverDailyBudget,
    overDailyAmount,
    isCustomTarget,
    last7Days,
  };
}
