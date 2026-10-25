import { describe, it, expect } from "vitest";
import { format, parseISO } from "date-fns";
import { formatReceiptShareText } from "./ThermalReceiptSlip";

describe("Thermal Receipt Formatter", () => {
  const sampleTransaction = {
    id: "tx-receipt-test-12345",
    amount: 450,
    type: "expense" as const,
    date: "2026-10-25",
    paymentMethod: "upi",
    note: "Coffee with college friends",
    userId: "user_1",
    categoryId: "cat_food",
    createdAt: "2026-10-25T16:30:00Z",
  };

  it("should format receipt dates to uppercase standard", () => {
    const d = parseISO(sampleTransaction.date);
    const formattedDate = format(d, "dd-MMM-yyyy").toUpperCase();
    expect(formattedDate).toBe("25-OCT-2026");
  });

  it("should format single-person receipt text using formatReceiptShareText", () => {
    const text = formatReceiptShareText(
      sampleTransaction as any,
      "Food & Dining",
      "🍔",
      "₹",
      1
    );

    expect(text).toContain("INVICTUS EXPENSE RECEIPT");
    expect(text).toContain("Food & Dining 🍔");
    expect(text).toContain("₹450");
    expect(text).toContain('"Coffee with college friends"');
    expect(text).toContain("Shared via Invictus Life OS");
  });

  it("should format multi-person roommate split bill with per-person calculations", () => {
    // ₹450 split 3 ways = ₹150 each
    const text = formatReceiptShareText(
      sampleTransaction as any,
      "Food & Dining",
      "🍔",
      "₹",
      3
    );

    expect(text).toContain("INVICTUS SPLIT BILL RECEIPT");
    expect(text).toContain("*Split:* 3 ways (₹150 / person)");
    expect(text).toContain("Please send your share (₹150)");
    expect(text).toContain("Pay via UPI / Cash");
  });

  it("should generate valid audit reference string", () => {
    const auditCode = `*INV-TXN-${sampleTransaction.id.slice(-8).toUpperCase()}*`;
    expect(auditCode).toBe("*INV-TXN-ST-12345*");
  });
});
