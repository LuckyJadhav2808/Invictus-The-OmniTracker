import { describe, expect, it } from "vitest";
import { computeMonthlyBudgetStats, computeDailyBudgetStats, isCashTransaction } from "./budget-rollover";
import { type Transaction, type Category } from "@/types";

describe("isCashTransaction", () => {
  it("detects exact cash variations and words", () => {
    expect(isCashTransaction("cash")).toBe(true);
    expect(isCashTransaction("Cash")).toBe(true);
    expect(isCashTransaction("CASH")).toBe(true);
    expect(isCashTransaction("cash payment")).toBe(true);
    expect(isCashTransaction("Paid with cash")).toBe(true);
    expect(isCashTransaction("petty cash")).toBe(true);
  });

  it("returns false for non-cash payment methods", () => {
    expect(isCashTransaction("upi")).toBe(false);
    expect(isCashTransaction("UPI")).toBe(false);
    expect(isCashTransaction("GPay")).toBe(false);
    expect(isCashTransaction("Credit Card")).toBe(false);
    expect(isCashTransaction("Net Banking")).toBe(false);
    expect(isCashTransaction(undefined)).toBe(false);
    expect(isCashTransaction("")).toBe(false);
  });
});

describe("computeMonthlyBudgetStats", () => {
  const sampleTransactions: Transaction[] = [
    // Current month transactions (2026-09)
    { id: "1", amount: 200, date: "2026-09-02", type: "expense", categoryId: "cat1", isRecurring: false, paymentMethod: "upi" },
    { id: "2", amount: 100, date: "2026-09-05", type: "expense", categoryId: "cat2", isRecurring: false, paymentMethod: "cash" },
    { id: "3", amount: 50, date: "2026-09-10", type: "income", categoryId: "cat3", isRecurring: false, paymentMethod: "upi" },
    // Previous month transactions (2026-08)
    { id: "4", amount: 400, date: "2026-08-15", type: "expense", categoryId: "cat1", isRecurring: false, paymentMethod: "upi" },
    { id: "5", amount: 50, date: "2026-08-20", type: "expense", categoryId: "cat2", isRecurring: false, paymentMethod: "cash" },
  ];

  const sampleCategories: Category[] = [
    { id: "cat1", name: "Food", type: "expense", color: "amber", icon: "🍔", monthlyBudget: 600, archived: false },
    { id: "cat2", name: "Transport", type: "expense", color: "mint", icon: "🚗", monthlyBudget: 200, archived: false },
    { id: "cat3", name: "Salary", type: "income", color: "mint", icon: "💰", monthlyBudget: 0, archived: false },
  ];

  it("computes stats with rollover enabled (strictly isolated to UPI, cash runs as envelope)", () => {
    const stats = computeMonthlyBudgetStats({
      transactions: sampleTransactions,
      categories: sampleCategories,
      targetMonthKey: "2026-09",
      baseUpiBudget: 1000,
      baseCashBudget: 500,
      enableRollover: true,
      previousMonthUpiBudget: 1000,
      previousMonthCashBudget: 500,
    });

    // Prev month (August): UPI budget 1000 - spent 400 = 600 saved
    // Cash does NOT rollover into monthly surplus: cashRolloverSurplus = 0
    // Total rollover = 600 (strictly UPI)
    expect(stats.upiRolloverSurplus).toBe(600);
    expect(stats.cashRolloverSurplus).toBe(0);
    expect(stats.rolloverSurplus).toBe(600);

    // Effective base budget (Digital) = 1000
    // Total available digital budget = 1000 base UPI + 600 rollover = 1600
    // Option 3 Decoupling: Top-line budget strictly tracks digital/UPI budget
    expect(stats.baseBudget).toBe(1000);
    expect(stats.totalAvailableBudget).toBe(1600);
    expect(stats.totalCombinedBudget).toBe(2100);

    // Current month expenses: 200 UPI + 100 Cash = 300
    expect(stats.monthlyExpense).toBe(300);
    expect(stats.onlineExpense).toBe(200);
    expect(stats.upiExpense).toBe(200);
    expect(stats.cashExpense).toBe(100);

    // Running Cash Envelope: August cash (50) + September cash (100) = 150 / 500
    expect(stats.envelopeCashExpense).toBe(150);
    expect(stats.remainingCashBudget).toBe(350);

    // Remaining top-line digital budget: 1600 - 200 = 1400 (airtight arithmetic!)
    expect(stats.remainingBudget).toBe(1400);
    // Combined overall portfolio: 1400 digital + 350 cash = 1750
    expect(stats.totalCombinedRemaining).toBe(1750);
  });

  it("continues cash used across months until budget limit is reached", () => {
    const cashTransactions: Transaction[] = [
      { id: "c1", amount: 352, date: "2026-09-12", type: "expense", categoryId: "cat2", isRecurring: false, paymentMethod: "cash" },
      { id: "c2", amount: 300, date: "2026-10-15", type: "expense", categoryId: "cat2", isRecurring: false, paymentMethod: "cash" },
    ];

    // In September: 352 used out of 2000
    const septStats = computeMonthlyBudgetStats({
      transactions: cashTransactions,
      targetMonthKey: "2026-09",
      baseUpiBudget: 10000,
      baseCashBudget: 2000,
    });
    expect(septStats.envelopeCashExpense).toBe(352);
    expect(septStats.remainingCashBudget).toBe(1648);
    expect(septStats.cashRolloverSurplus).toBe(0);

    // In October before spending: if no Oct cash tx existed, it would continue showing 352.
    // With Oct cash tx of 300, cumulative cash used is 352 + 300 = 652 out of 2000!
    const octStats = computeMonthlyBudgetStats({
      transactions: cashTransactions,
      targetMonthKey: "2026-10",
      baseUpiBudget: 10000,
      baseCashBudget: 2000,
    });
    expect(octStats.envelopeCashExpense).toBe(652);
    expect(octStats.remainingCashBudget).toBe(1348);
    expect(octStats.cashRolloverSurplus).toBe(0);
    expect(octStats.rolloverSurplus).toBe(0);
  });

  it("computes stats with rollover disabled", () => {
    const stats = computeMonthlyBudgetStats({
      transactions: sampleTransactions,
      categories: sampleCategories,
      targetMonthKey: "2026-09",
      baseUpiBudget: 1000,
      baseCashBudget: 500,
      enableRollover: false,
    });

    expect(stats.rolloverSurplus).toBe(0);
    expect(stats.upiRolloverSurplus).toBe(0);
    expect(stats.cashRolloverSurplus).toBe(0);
    expect(stats.baseBudget).toBe(1000);
    expect(stats.totalAvailableBudget).toBe(1000);
    // Remaining digital budget = 1000 base UPI - 200 UPI expense = 800
    expect(stats.remainingBudget).toBe(800);
    // Combined overall portfolio = 800 UPI + 350 Cash envelope = 1150
    expect(stats.totalCombinedRemaining).toBe(1150);
  });

  it("handles missing categories and transactions gracefully without throwing", () => {
    expect(() => {
      const stats = computeMonthlyBudgetStats({
        targetMonthKey: "2026-09",
        baseUpiBudget: 1000,
        baseCashBudget: 500,
      });
      expect(stats.monthlyExpense).toBe(0);
      expect(stats.rolloverSurplus).toBe(0);
      expect(stats.remainingBudget).toBe(1000);
      expect(stats.totalCombinedRemaining).toBe(1500);
    }).not.toThrow();
  });

  it("handles custom currency symbol in burn pace message", () => {
    const stats = computeMonthlyBudgetStats({
      transactions: [
        { id: "1", amount: 950, date: "2026-09-02", type: "expense", categoryId: "cat1", isRecurring: false, paymentMethod: "upi" },
      ],
      categories: sampleCategories,
      targetMonthKey: "2026-09",
      baseUpiBudget: 1000,
      baseCashBudget: 0,
      enableRollover: false,
      currencySymbol: "$",
    });

    if (stats.burnPaceStatus === "fast") {
      expect(stats.burnPaceMessage).toContain("$");
      expect(stats.burnPaceMessage).not.toContain("₹");
    }
  });

  it("Khushi Roongta Option 3: Decouples Monthly UPI Budget from Physical Cash Till", () => {
    // 58 transactions audit mock:
    // October UPI spent: 9433 against 10000 budget -> 567 saved
    // September Cash spent: 352
    // October Cash spent: 300
    // Total Cash spent in envelope: 652 out of 2000
    // November 2026: 0 expenses logged yet
    const khushiTransactions: Transaction[] = [
      { id: "k-sep-c", amount: 352, date: "2026-09-15", type: "expense", categoryId: "c2", isRecurring: false, paymentMethod: "cash" },
      { id: "k-oct-u", amount: 9433, date: "2026-10-10", type: "expense", categoryId: "c1", isRecurring: false, paymentMethod: "upi" },
      { id: "k-oct-c", amount: 300, date: "2026-10-20", type: "expense", categoryId: "c2", isRecurring: false, paymentMethod: "cash" },
    ];

    const stats = computeMonthlyBudgetStats({
      transactions: khushiTransactions,
      targetMonthKey: "2026-11",
      baseUpiBudget: 10000,
      baseCashBudget: 2000,
      previousMonthUpiBudget: 10000,
      enableRollover: true,
    });

    // 1. Rollover strictly from October UPI savings
    expect(stats.upiRolloverSurplus).toBe(567);
    expect(stats.cashRolloverSurplus).toBe(0);
    expect(stats.rolloverSurplus).toBe(567);

    // 2. Top-line Monthly Budget (UPI/Digital only)
    expect(stats.baseBudget).toBe(10000);
    expect(stats.totalAvailableBudget).toBe(10567);
    expect(stats.onlineExpense).toBe(0);
    expect(stats.monthlyExpense).toBe(0);

    // 3. AIRTIGHT ARITHMETIC: Budget (10,567) - Spent (0) = Remaining (10,567)
    expect(stats.remainingBudget).toBe(10567);
    expect(stats.budgetUsedPercentage).toBe(0);

    // 4. Independent Physical Cash Till
    expect(stats.envelopeCashExpense).toBe(652);
    expect(stats.remainingCashBudget).toBe(1348);
    expect(stats.cashBudgetUsedPercentage).toBe(33); // Math.round((652/2000)*100) = 33%
    expect(stats.isCashEnvelopeExhausted).toBe(false);

    // 5. Total combined portfolio available
    expect(stats.totalCombinedBudget).toBe(12567);
    expect(stats.totalCombinedRemaining).toBe(11915);
  });

  it("handles cash till refill reset when cashRefillDate is provided", () => {
    const cashTransactions: Transaction[] = [
      { id: "c1", amount: 352, date: "2026-09-12", type: "expense", categoryId: "cat2", isRecurring: false, paymentMethod: "cash" },
      { id: "c2", amount: 300, date: "2026-10-15", type: "expense", categoryId: "cat2", isRecurring: false, paymentMethod: "cash" },
    ];

    // User withdrew cash from ATM on 2026-11-01
    const stats = computeMonthlyBudgetStats({
      transactions: cashTransactions,
      targetMonthKey: "2026-11",
      baseUpiBudget: 10000,
      baseCashBudget: 2000,
      cashRefillDate: "2026-11-01T00:00:00.000Z",
    });

    // September and October cash expenses are now archived prior to refill
    expect(stats.envelopeCashExpense).toBe(0);
    expect(stats.remainingCashBudget).toBe(2000);
    expect(stats.cashBudgetUsedPercentage).toBe(0);
  });
});

describe("computeDailyBudgetStats", () => {
  const mockMonthlyStats = {
    dailySafeToSpend: 250,
  } as any;

  const mockTransactions: Transaction[] = [
    { id: "t1", amount: 80, date: "2026-09-14", type: "expense", categoryId: "c1", isRecurring: false, paymentMethod: "upi" },
    { id: "t2", amount: 40, date: "2026-09-14", type: "expense", categoryId: "c2", isRecurring: false, paymentMethod: "cash" },
    { id: "t3", amount: 500, date: "2026-09-14", type: "income", categoryId: "c3", isRecurring: false, paymentMethod: "upi" },
    { id: "t4", amount: 150, date: "2026-09-13", type: "expense", categoryId: "c1", isRecurring: false, paymentMethod: "upi" },
    { id: "t5", amount: 200, date: "2026-09-12", type: "expense", categoryId: "c1", isRecurring: false, paymentMethod: "upi" },
  ];

  it("calculates today expense and remaining within safe spend target", () => {
    const daily = computeDailyBudgetStats({
      transactions: mockTransactions,
      monthlyStats: mockMonthlyStats,
      customDailyBudget: null,
      referenceDate: new Date("2026-09-14T12:00:00Z"),
    });

    expect(daily.dailyBudgetTarget).toBe(250);
    expect(daily.isCustomTarget).toBe(false);
    expect(daily.todayExpense).toBe(120); // 80 UPI + 40 Cash
    expect(daily.todayUpiExpense).toBe(80);
    expect(daily.todayCashExpense).toBe(40);
    expect(daily.todayRemaining).toBe(130); // 250 - 120
    expect(daily.isOverDailyBudget).toBe(false);
    expect(daily.overDailyAmount).toBe(0);
    expect(daily.todayUsedPercentage).toBe(48); // (120/250)*100
  });

  it("respects custom daily budget cap and detects over-budget", () => {
    const daily = computeDailyBudgetStats({
      transactions: mockTransactions,
      monthlyStats: mockMonthlyStats,
      customDailyBudget: 100, // custom cap of 100
      referenceDate: new Date("2026-09-14T12:00:00Z"),
    });

    expect(daily.dailyBudgetTarget).toBe(100);
    expect(daily.isCustomTarget).toBe(true);
    expect(daily.todayExpense).toBe(120);
    expect(daily.todayRemaining).toBe(-20);
    expect(daily.isOverDailyBudget).toBe(true);
    expect(daily.overDailyAmount).toBe(20); // 120 - 100
    expect(daily.todayUsedPercentage).toBe(100);
  });

  it("generates 7 days trend items ending on reference date", () => {
    const daily = computeDailyBudgetStats({
      transactions: mockTransactions,
      monthlyStats: mockMonthlyStats,
      customDailyBudget: 250,
      referenceDate: new Date("2026-09-14T12:00:00Z"),
    });

    expect(daily.last7Days).toHaveLength(7);
    const lastDay = daily.last7Days[6];
    expect(lastDay.date).toBe("2026-09-14");
    expect(lastDay.isToday).toBe(true);
    expect(lastDay.expense).toBe(120);

    const prevDay = daily.last7Days[5];
    expect(prevDay.date).toBe("2026-09-13");
    expect(prevDay.expense).toBe(150);
  });
});

