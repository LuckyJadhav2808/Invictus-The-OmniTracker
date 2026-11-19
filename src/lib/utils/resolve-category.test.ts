import { describe, it, expect } from "vitest";
import { resolveExpenseCategoryId } from "./resolve-category";
import { type Category } from "@/types";

const mockCategories: Category[] = [
  { id: "cat-salary", name: "Salary", type: "income", archived: false, icon: "💰", color: "#03D26F" },
  { id: "cat-freelance", name: "Freelance", type: "income", archived: false, icon: "💻", color: "#CEF431" },
  { id: "cat-food", name: "Food & Dining", type: "expense", archived: false, icon: "🍔", color: "#FF7849" },
  { id: "cat-groceries", name: "Groceries", type: "expense", archived: false, icon: "🛒", color: "#3B82F6" },
  { id: "cat-transport", name: "Transport & Commute", type: "expense", archived: false, icon: "🚗", color: "#EAB308" },
  { id: "cat-bills", name: "Bills & Utilities", type: "expense", archived: false, icon: "💡", color: "#A855F7" },
];

describe("resolveExpenseCategoryId", () => {
  it("resolves Chai with Food hint strictly to cat-food (never Salary)", () => {
    const categoryId = resolveExpenseCategoryId("Food", "Chai", mockCategories);
    expect(categoryId).toBe("cat-food");
    expect(categoryId).not.toBe("cat-salary");
  });

  it("resolves Chai without hint strictly to cat-food via NLP (never Salary)", () => {
    const categoryId = resolveExpenseCategoryId(undefined, "Chai", mockCategories);
    expect(categoryId).toBe("cat-food");
  });

  it("resolves Metro to cat-transport via alias and note", () => {
    const categoryId = resolveExpenseCategoryId("Travel", "Metro", mockCategories);
    expect(categoryId).toBe("cat-transport");
  });

  it("resolves Blinkit to cat-groceries via NLP note", () => {
    const categoryId = resolveExpenseCategoryId("Grocery", "Blinkit milk", mockCategories);
    expect(categoryId).toBe("cat-groceries");
  });

  it("guarantees an expense category is returned even with completely unknown note", () => {
    const categoryId = resolveExpenseCategoryId(undefined, "xyzrandomstuff99", mockCategories);
    expect(categoryId).toBe("cat-food");
    expect(categoryId).not.toBe("cat-salary");
    expect(categoryId).not.toBe("cat-freelance");
  });

  it("handles Mongoose document objects with _id seamlessly", () => {
    const mongooseCategories = [
      { _id: "mongo-salary", name: "Salary", type: "income" },
      { _id: "mongo-food", name: "Food & Dining", type: "expense" },
      { _id: "mongo-travel", name: "Transport", type: "expense" },
    ];
    const categoryId = resolveExpenseCategoryId("Food", "Chai", mongooseCategories);
    expect(categoryId).toBe("mongo-food");
  });

  it("prioritizes explicit manual category when provided", () => {
    // User types "metro" (travel keyword) but manually taps "Bills"
    const categoryId = resolveExpenseCategoryId("Bills", "metro recharge", mockCategories);
    expect(categoryId).toBe("cat-bills");
  });
});
