import { describe, it, expect } from "vitest";
import { detectCategoryFromNote } from "./merchant-categorizer";
import { type Category } from "@/types";

describe("detectCategoryFromNote - Multi-Tier Intelligent Categorizer", () => {
  const mockCategories: Category[] = [
    {
      id: "cat_food",
      archived: false,
      name: "Food & Dining",
      type: "expense",
      color: "lime",
      icon: "🍔",
      monthlyBudget: 5000,
      createdAt: "2026-01-01",
    },
    {
      id: "cat_transport",
      archived: false,
      name: "Transport & Commute",
      type: "expense",
      color: "sky",
      icon: "🚕",
      monthlyBudget: 3000,
      createdAt: "2026-01-01",
    },
    {
      id: "cat_books",
      archived: false,
      name: "Books & Tuition",
      type: "expense",
      color: "amber",
      icon: "📚",
      monthlyBudget: 2000,
      createdAt: "2026-01-01",
    },
    {
      id: "cat_groceries",
      archived: false,
      name: "Groceries",
      type: "expense",
      color: "emerald",
      icon: "🛒",
      monthlyBudget: 4000,
      createdAt: "2026-01-01",
    },
    {
      id: "cat_health",
      archived: false,
      name: "Healthcare & Gym",
      type: "expense",
      color: "rose",
      icon: "💊",
      monthlyBudget: 2500,
      createdAt: "2026-01-01",
    },
    {
      id: "cat_salary",
      archived: false,
      name: "Salary & Allowance",
      type: "income",
      color: "lime",
      icon: "💰",
      monthlyBudget: 50000,
      createdAt: "2026-01-01",
    },
  ];

  it("auto-matches Indian food keywords to Food & Dining", () => {
    const cases = [
      "evening momos with friends",
      "hostel mess khana",
      "vadapav and cutting chai",
      "cheese burst pizza",
      "aloo paratha breakfast",
      "chicken biryani dinner",
      "swiggy late night order",
      "zomato delivery",
    ];

    for (const text of cases) {
      const result = detectCategoryFromNote(text, mockCategories);
      expect(result).not.toBeNull();
      expect(result?.categoryId).toBe("cat_food");
      expect(result?.categoryName).toBe("Food & Dining");
    }
  });

  it("auto-matches stationery and study items to Books & Tuition", () => {
    const cases = [
      "college stationary shop",
      "stationery & notebook",
      "exam pen and pencil",
      "algorithm books from library",
      "maths coaching tuition fee",
      "photocopy notes for midterms",
    ];

    for (const text of cases) {
      const result = detectCategoryFromNote(text, mockCategories);
      expect(result).not.toBeNull();
      expect(result?.categoryId).toBe("cat_books");
      expect(result?.categoryName).toBe("Books & Tuition");
    }
  });

  it("auto-matches commute items to Transport & Commute", () => {
    const cases = [
      "uber ride to campus",
      "metro smart card recharge",
      "rapido bike taxi",
      "petrol pump fuel",
      "ola cab to station",
    ];

    for (const text of cases) {
      const result = detectCategoryFromNote(text, mockCategories);
      expect(result).not.toBeNull();
      expect(result?.categoryId).toBe("cat_transport");
      expect(result?.categoryName).toBe("Transport & Commute");
    }
  });

  it("auto-matches quick-commerce items to Groceries", () => {
    const cases = [
      "blinkit morning milk and bread",
      "zepto 10 min grocery",
      "dmart monthly ration",
      "sabji mandi fresh fruits",
    ];

    for (const text of cases) {
      const result = detectCategoryFromNote(text, mockCategories);
      expect(result).not.toBeNull();
      expect(result?.categoryId).toBe("cat_groceries");
    }
  });

  it("prioritizes direct category names (Tier 1)", () => {
    const customCategories: Category[] = [
      ...mockCategories,
      {
        id: "cat_canteen",
        archived: false,
        name: "Campus Canteen",
        type: "expense",
        color: "coral",
        icon: "🥪",
        monthlyBudget: 1500,
        createdAt: "2026-01-01",
      },
    ];

    const result = detectCategoryFromNote("lunch at campus canteen", customCategories);
    expect(result).not.toBeNull();
    expect(result?.categoryId).toBe("cat_canteen");
    expect(result?.matchType).toBe("direct");
  });

  it("returns null for non-matching or empty notes", () => {
    expect(detectCategoryFromNote("", mockCategories)).toBeNull();
    expect(detectCategoryFromNote("   ", mockCategories)).toBeNull();
    expect(detectCategoryFromNote("random alphanumeric xyz12345", mockCategories)).toBeNull();
  });
});
