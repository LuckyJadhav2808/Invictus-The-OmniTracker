import { format, parseISO, subMonths, endOfMonth, differenceInDays } from "date-fns";
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
  return clean === "cash";
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
  transactions,
  categories,
  targetMonthKey,
  baseBudget,
  baseUpiBudget,
  baseCashBudget = 0,
  enableRollover = true,
}: {
  transactions: Transaction[];
  categories: Category[];
  targetMonthKey: string;
  baseBudget?: number;
  baseUpiBudget?: number;
  baseCashBudget?: number;
  enableRollover?: boolean;
}): MonthlyBudgetStats {
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
  const targetMonthTxs = transactions.filter(
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
  const prevMonthTxs = transactions.filter(
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

  // Independent Rollover Calculations
  const previousMonthUpiSavings = Math.max(0, effectiveUpiBudget - previousMonthUpiExpense);
  const previousMonthCashSavings =
    effectiveCashBudget > 0 ? Math.max(0, effectiveCashBudget - previousMonthCashExpense) : 0;
  const previousMonthSavings = previousMonthUpiSavings + previousMonthCashSavings;

  const upiRolloverSurplus = enableRollover && prevMonthTxs.length > 0 ? previousMonthUpiSavings : 0;
  const cashRolloverSurplus = enableRollover && prevMonthTxs.length > 0 ? previousMonthCashSavings : 0;
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
  let burnPaceMessage = "Spending is on track with your monthly calendar.";
  const paceDiff = budgetUsedPercentage - percentDaysPassed;

  if (isCurrentCalendarMonth && monthlyExpense > 0) {
    if (paceDiff > 15 || remainingBudget < 0) {
      burnPaceStatus = "fast";
      burnPaceMessage = `⚠️ Fast Burn: Used ${budgetUsedPercentage}% budget in ${percentDaysPassed}% of month. Cap to ~₹${dailySafeToSpend}/day.`;
    } else if (paceDiff < -10) {
      burnPaceStatus = "frugal";
      burnPaceMessage = `🟢 Frugal Pace: Spending ${Math.abs(paceDiff)}% below expected monthly burn pace!`;
    } else {
      burnPaceStatus = "on_track";
      burnPaceMessage = `✨ Balanced Pace: Daily spending velocity matches your calendar pace.`;
    }
  } else if (!isCurrentCalendarMonth) {
    burnPaceStatus = remainingBudget >= 0 ? "on_track" : "fast";
    burnPaceMessage = remainingBudget >= 0 ? "Month closed under budget! Surplus rolled over." : "Month closed over budget.";
  }

  // 5. Deep "Where did you save?" Audit (Category breakdown of previous month)
  const categorySavingsAudit: CategorySavingsItem[] = [];
  let totalCategorySavings = 0;

  categories
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
