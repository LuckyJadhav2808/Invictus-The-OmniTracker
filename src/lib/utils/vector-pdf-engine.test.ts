import { describe, it, expect } from "vitest";
import { generateEnterpriseVectorPDF } from "./vector-pdf-engine";

describe("generateEnterpriseVectorPDF", () => {
  it("generates without throwing", () => {
    const mockTxs: any = [
      { id: "1", amount: 150, type: "expense", categoryId: "cat1", date: "2026-11-20T10:00:00Z", paymentMethod: "UPI", note: "Coffee" },
      { id: "2", amount: 5000, type: "income", categoryId: "cat2", date: "2026-11-19T10:00:00Z", paymentMethod: "Bank", note: "Salary" },
    ];
    const mockCats: any = [
      { id: "cat1", name: "Food & Drinks", monthlyBudget: 1000 },
      { id: "cat2", name: "Income" },
    ];

    expect(() => {
      generateEnterpriseVectorPDF({
        transactions: mockTxs,
        categories: mockCats,
        periodLabel: "NOVEMBER 2026",
        currencySymbol: "₹",
        userName: "Alex Vance",
        filename: "test.pdf",
      });
    }).not.toThrow();
  });
});
