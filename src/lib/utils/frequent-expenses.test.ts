import { describe, it, expect } from "vitest";
import {
  computeFrequentExpenses,
  inferExpenseIcon,
} from "./frequent-expenses";
import { type Transaction, type Category } from "@/types";

describe("frequent-expenses mining engine", () => {
  const mockCategories: Category[] = [
    { id: "cat-food", name: "Food & Dining", type: "expense", color: "amber", icon: "Utensils", archived: false },
    { id: "cat-travel", name: "Travel & Commute", type: "expense", color: "blue", icon: "Car", archived: false },
    { id: "cat-groceries", name: "Groceries", type: "expense", color: "green", icon: "ShoppingBag", archived: false },
  ];

  it("returns fallback starter suggestions when transaction list is empty", () => {
    const habits = computeFrequentExpenses([], mockCategories, 4);
    expect(habits.length).toBe(4);
    expect(habits[0].isHabit).toBe(false);
    expect(habits.map((h) => h.name)).toContain("Chai & Snack");
  });

  it("mines repeated transactions and prioritizes higher frequency", () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const transactions: Transaction[] = [
      // Zepto: 3 times @ 149
      { id: "t1", amount: 149, type: "expense", categoryId: "cat-groceries", date: todayStr, note: "Zepto" },
      { id: "t2", amount: 149, type: "expense", categoryId: "cat-groceries", date: todayStr, note: "Zepto" },
      { id: "t3", amount: 149, type: "expense", categoryId: "cat-groceries", date: todayStr, note: "Zepto" },
      // Metro: 2 times @ 40
      { id: "t4", amount: 40, type: "expense", categoryId: "cat-travel", date: todayStr, note: "Metro Card Recharge" },
      { id: "t5", amount: 40, type: "expense", categoryId: "cat-travel", date: todayStr, note: "Metro Card Recharge" },
      // One-off iPhone purchase: 1 time @ 80000
      { id: "t6", amount: 80000, type: "expense", categoryId: "cat-travel", date: todayStr, note: "Apple Store" },
    ];

    const habits = computeFrequentExpenses(transactions, mockCategories, 3);
    expect(habits[0].name).toBe("Zepto");
    expect(habits[0].amount).toBe(149);
    expect(habits[0].frequency).toBe(3);
    expect(habits[0].isHabit).toBe(true);

    expect(habits[1].name).toBe("Metro Card Recharge");
    expect(habits[1].amount).toBe(40);
    expect(habits[1].frequency).toBe(2);
    expect(habits[1].isHabit).toBe(true);
  });

  it("computes the mode amount for an item with slight variance", () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const transactions: Transaction[] = [
      { id: "t1", amount: 90, type: "expense", categoryId: "cat-food", date: todayStr, note: "Canteen Lunch" },
      { id: "t2", amount: 90, type: "expense", categoryId: "cat-food", date: todayStr, note: "Canteen Lunch" },
      { id: "t3", amount: 110, type: "expense", categoryId: "cat-food", date: todayStr, note: "Canteen Lunch" },
    ];

    const habits = computeFrequentExpenses(transactions, mockCategories, 2);
    expect(habits[0].name).toBe("Canteen Lunch");
    expect(habits[0].amount).toBe(90); // 90 was logged 2x vs 110 logged 1x
  });

  it("infers accurate semantic emoji icons", () => {
    expect(inferExpenseIcon("Starbucks Latte")).toBe("☕");
    expect(inferExpenseIcon("Swiggy Biryani")).toBe("🍛");
    expect(inferExpenseIcon("Rapido Ride")).toBe("🚇");
    expect(inferExpenseIcon("Blinkit Express")).toBe("🛒");
    expect(inferExpenseIcon("College Xerox Notes")).toBe("📚");
    expect(inferExpenseIcon("Gold's Gym Membership")).toBe("⚡");
  });
});
