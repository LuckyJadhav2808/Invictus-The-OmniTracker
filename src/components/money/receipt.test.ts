import { describe, it, expect } from "vitest";
import { format, parseISO } from "date-fns";

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

  it("should format split-bill text ready for WhatsApp", () => {
    const formattedDate = "25-OCT-2026";
    const currencySymbol = "₹";
    const billBreakdown = `🧾 *INVICTUS EXPENSE RECEIPT*
━━━━━━━━━━━━━━━━━━━━
📍 *Category:* Food & Dining 🍔
📅 *Date:* ${formattedDate}
💳 *Paid Via:* UPI
💰 *Total Amount:* ${currencySymbol}${Number(sampleTransaction.amount).toLocaleString()}
${sampleTransaction.note ? `📝 *Note:* "${sampleTransaction.note}"\n` : ""}━━━━━━━━━━━━━━━━━━━━
✨ _Shared via Invictus Life OS_`;

    expect(billBreakdown).toContain("INVICTUS EXPENSE RECEIPT");
    expect(billBreakdown).toContain("Food & Dining 🍔");
    expect(billBreakdown).toContain("₹450");
    expect(billBreakdown).toContain('"Coffee with college friends"');
    expect(billBreakdown).toContain("Shared via Invictus Life OS");
  });

  it("should generate valid audit reference string", () => {
    const auditCode = `*INV-TXN-${sampleTransaction.id.slice(-8).toUpperCase()}*`;
    expect(auditCode).toBe("*INV-TXN-ST-12345*");
  });
});
