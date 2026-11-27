import { describe, it, expect } from "vitest";
import {
  parseRawOCRText,
  reconstructVisualRowsFromBlocks,
  matchCategory,
  extractDate,
  type CategoryReference,
} from "./ocr-expense-parser";

const MOCK_CATEGORIES: CategoryReference[] = [
  { id: "cat-food", name: "Food", type: "expense" },
  { id: "cat-transport", name: "Transport", type: "expense" },
  { id: "cat-shopping", name: "Shopping", type: "expense" },
  { id: "cat-bills", name: "Bills", type: "expense" },
];

describe("OCR Expense Parser (chrono-node + compromise + fuse.js + currency.js)", () => {
  it("recovers OCR typos via Fuse.js fuzzy matching", () => {
    expect(matchCategory("Swlggy Instamart", MOCK_CATEGORIES).categoryId).toBe("cat-food");
    expect(matchCategory("Z0mato Order", MOCK_CATEGORIES).categoryId).toBe("cat-food");
    expect(matchCategory("Ubcr Trip", MOCK_CATEGORIES).categoryId).toBe("cat-transport");
    expect(matchCategory("Amaz0n Retail", MOCK_CATEGORIES).categoryId).toBe("cat-shopping");
  });

  it("extracts Indian DD/MM/YYYY and natural dates via chrono-node", () => {
    expect(extractDate("27/11/2026")).toBe("2026-11-27");
    expect(extractDate("05 Sep 2026")).toBe("2026-09-05");
    expect(extractDate("Paid on Nov 14, 2026")).toBe("2026-11-14");
  });

  it("extracts single Grand Total, merchant, date, and card method from printed thermal receipts", () => {
    const receiptText = `
      STARBUCKS COFFEE INDIA
      Date: 27/11/2026
      Caramel Macchiato   350.00
      Subtotal            350.00
      CGST 2.5%             8.75
      SGST 2.5%             8.75
      Grand Total         367.50
      Paid via VISA Card
    `;

    const items = parseRawOCRText(receiptText, MOCK_CATEGORIES);
    expect(items).toHaveLength(1);
    expect(items[0].amount).toBe(367.5);
    expect(items[0].note).toContain("Starbucks Coffee India");
    expect(items[0].categoryId).toBe("cat-food");
    expect(items[0].date).toBe("2026-11-27");
    expect(items[0].paymentMethod).toBe("Card");
  });

  it("extracts multi-item UPI transaction lists with comma-formatted amounts", () => {
    const upiText = `
      Swlggy 1,249.50
      Paid on 14 Nov 2026
      Uber Rides 185
      Paid on 14 Nov 2026
    `;

    const items = parseRawOCRText(upiText, MOCK_CATEGORIES);
    expect(items).toHaveLength(2);
    expect(items[0].amount).toBe(1249.5);
    expect(items[0].categoryId).toBe("cat-food");
    expect(items[1].amount).toBe(185);
    expect(items[1].categoryId).toBe("cat-transport");
  });

  it("reconstructs split left/right columns into aligned rows via bounding boxes", () => {
    const mockBlocks = [
      {
        paragraphs: [
          {
            lines: [
              { words: [{ text: "Starbucks", bbox: { x0: 20, y0: 100, x1: 110, y1: 120 } }] },
              { words: [{ text: "Grand", bbox: { x0: 20, y0: 180, x1: 70, y1: 200 } }, { text: "Total", bbox: { x0: 75, y0: 180, x1: 120, y1: 200 } }] },
            ],
          },
        ],
      },
      {
        paragraphs: [
          {
            lines: [
              { words: [{ text: "367.50", bbox: { x0: 320, y0: 102, x1: 380, y1: 122 } }] },
              { words: [{ text: "367.50", bbox: { x0: 320, y0: 181, x1: 380, y1: 201 } }] },
            ],
          },
        ],
      },
    ];

    const reconstructed = reconstructVisualRowsFromBlocks(mockBlocks);
    expect(reconstructed).toContain("Starbucks 367.50");
    expect(reconstructed).toContain("Grand Total 367.50");
  });
});
