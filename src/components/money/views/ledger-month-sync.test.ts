import { describe, it, expect } from "vitest";
import { computeMonthlyBudgetStats } from "@/lib/utils/budget-rollover";
import { type Transaction, type Category } from "@/types";

describe("Financial Cockpit Historical Month Synchronization Engine", () => {
  const dummyCategories: Category[] = [
    { id: "cat-food", name: "Food & Dining", type: "expense", color: "coral", icon: "Coffee", monthlyBudget: 5000, archived: false },
    { id: "cat-rent", name: "Rent & Housing", type: "expense", color: "lavender", icon: "Home", monthlyBudget: 15000, archived: false },
  ];

  const dummyTransactions: Transaction[] = [
    // Current Month (2026-11)
    { id: "tx-1", amount: 500, type: "expense", categoryId: "cat-food", date: "2026-11-02", paymentMethod: "UPI" },
    { id: "tx-2", amount: 200, type: "expense", categoryId: "cat-food", date: "2026-11-03", paymentMethod: "Cash" },

    // Past Month 1 (2026-10)
    { id: "tx-3", amount: 3500, type: "expense", categoryId: "cat-food", date: "2026-10-15", paymentMethod: "UPI" },
    { id: "tx-4", amount: 1500, type: "expense", categoryId: "cat-food", date: "2026-10-20", paymentMethod: "Cash" },
    { id: "tx-5", amount: 10000, type: "income", categoryId: "cat-salary", date: "2026-10-01", paymentMethod: "Bank" },

    // Past Month 2 (2026-09)
    { id: "tx-6", amount: 2000, type: "expense", categoryId: "cat-rent", date: "2026-09-10", paymentMethod: "UPI" },
  ];

  it("computes current calendar month stats accurately", () => {
    const stats = computeMonthlyBudgetStats({
      transactions: dummyTransactions,
      categories: dummyCategories,
      targetMonthKey: "2026-11",
      baseUpiBudget: 8000,
      baseCashBudget: 2000,
    });

    expect(stats.targetMonthKey).toBe("2026-11");
    expect(stats.monthlyExpense).toBe(700);
    expect(stats.upiExpense).toBe(500);
    expect(stats.cashExpense).toBe(200);
    expect(stats.remainingUpiBudget).toBe(8000 - 500);
  });

  it("dynamically synchronizes and computes historical stats when a previous month is selected", () => {
    const stats = computeMonthlyBudgetStats({
      transactions: dummyTransactions,
      categories: dummyCategories,
      targetMonthKey: "2026-10",
      baseUpiBudget: 8000,
      baseCashBudget: 2000,
    });

    // Validates that Cockpit will show October 2026 stats, not current month
    expect(stats.targetMonthKey).toBe("2026-10");
    expect(stats.targetMonthLabel).toBe("October 2026");
    expect(stats.isCurrentCalendarMonth).toBe(false);

    // Historical expenses and income
    expect(stats.monthlyExpense).toBe(5000); // 3500 upi + 1500 cash
    expect(stats.monthlyIncome).toBe(10000);
    expect(stats.netMonthlyCashflow).toBe(5000);
    expect(stats.upiExpense).toBe(3500);
    expect(stats.cashExpense).toBe(1500);

    // Remaining budget for October 2026
    expect(stats.remainingUpiBudget).toBe(8000 - 3500);
  });

  it("isolates transactions strictly to the selected historical month", () => {
    const stats = computeMonthlyBudgetStats({
      transactions: dummyTransactions,
      categories: dummyCategories,
      targetMonthKey: "2026-09",
      baseUpiBudget: 8000,
      baseCashBudget: 2000,
    });

    expect(stats.targetMonthKey).toBe("2026-09");
    expect(stats.targetMonthLabel).toBe("September 2026");
    expect(stats.monthlyExpense).toBe(2000);
    expect(stats.monthlyIncome).toBe(0);
    expect(stats.netMonthlyCashflow).toBe(-2000);
    expect(stats.upiExpense).toBe(2000);
    expect(stats.cashExpense).toBe(0);
  });
});
