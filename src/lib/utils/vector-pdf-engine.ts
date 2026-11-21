"use client";

import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { type Transaction, type Category } from "@/types";

interface VectorPDFOptions {
  transactions: Transaction[];
  categories: Category[];
  periodLabel: string;
  currencySymbol?: string;
  userName?: string;
  filename?: string;
}

// Helper: Strip non-ASCII unicode / emoji characters for 100% clean PDF standard font rendering
const sanitizeText = (str: string | undefined | null): string => {
  if (!str) return "";
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export function generateEnterpriseVectorPDF({
  transactions,
  categories,
  periodLabel,
  currencySymbol = "₹",
  userName = "Invictus Explorer",
  filename = "Invictus_Financial_Statement.pdf",
}: VectorPDFOptions) {
  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();   // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight();  // 297mm
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;           // 178mm

  let y = margin;

  // Safe currency text (Standard PDF fonts require ASCII)
  const safeCurrency = currencySymbol === "₹" ? "Rs." : currencySymbol;

  const fmtMoney = (val: number): string => {
    const abs = Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return val < 0 ? `-${safeCurrency}${abs}` : `${safeCurrency}${abs}`;
  };

  const fmtMoneySign = (val: number, type: string): string => {
    const abs = Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return type === "income" ? `+${safeCurrency}${abs}` : `-${safeCurrency}${abs}`;
  };

  // ── Color palette ──
  const ink: [number, number, number] = [22, 21, 20];
  const cream: [number, number, number] = [250, 248, 245];
  const white: [number, number, number] = [255, 255, 255];
  const lime: [number, number, number] = [206, 244, 49];
  const greenText: [number, number, number] = [3, 140, 70];
  const roseText: [number, number, number] = [200, 30, 60];
  const muted: [number, number, number] = [120, 120, 120];

  // ── Helpers ──
  const hairline = (x1: number, lineY: number, x2: number, color: [number, number, number] = [200, 200, 200]) => {
    pdf.setDrawColor(...color);
    pdf.setLineWidth(0.15);
    pdf.line(x1, lineY, x2, lineY);
  };

  const solidLine = (x1: number, lineY: number, x2: number) => {
    pdf.setDrawColor(...ink);
    pdf.setLineWidth(0.5);
    pdf.line(x1, lineY, x2, lineY);
  };

  // ═══════════════════════════════════════════════════════════════
  // 1. MASTHEAD — Clean executive header (no heavy bordered box)
  // ═══════════════════════════════════════════════════════════════

  // Brand name
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...ink);
  pdf.text("INVICTUS", margin, y + 4);

  // Period label — right-aligned
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...muted);
  const cleanPeriod = sanitizeText(periodLabel) || "CURRENT STATEMENT";
  pdf.text(cleanPeriod, margin + contentWidth, y + 4, { align: "right" });

  y += 7;

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(...ink);
  pdf.text("Financial Statement", margin, y + 6);

  y += 10;

  // Metadata line
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...muted);
  const genTime = format(new Date(), "MMMM d, yyyy 'at' h:mm a");
  const cleanUserName = sanitizeText(userName) || "Invictus Explorer";
  pdf.text(`${cleanUserName}  ·  Generated ${genTime}`, margin, y + 3);

  y += 7;

  // Thick separator
  solidLine(margin, y, margin + contentWidth);
  y += 6;

  // ═══════════════════════════════════════════════════════════════
  // 2. SUMMARY METRICS — 4 columns, clean flat layout
  // ═══════════════════════════════════════════════════════════════

  const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + (t.amount || 0), 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + (t.amount || 0), 0);
  const net = income - expense;

  const colW = contentWidth / 4;
  const metrics = [
    { label: "INCOME", value: `+${safeCurrency}${income.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: greenText },
    { label: "EXPENSES", value: `-${safeCurrency}${expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: roseText },
    { label: "NET FLOW", value: fmtMoney(net), color: ink },
    { label: "RECORDS", value: `${transactions.length}`, color: ink },
  ];

  metrics.forEach((m, i) => {
    const x = margin + colW * i;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...muted);
    pdf.text(m.label, x, y);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...m.color);
    pdf.text(m.value, x, y + 6);
  });

  y += 12;
  hairline(margin, y, margin + contentWidth);
  y += 5;

  // ═══════════════════════════════════════════════════════════════
  // 3. CATEGORY BREAKDOWN — inline pills
  // ═══════════════════════════════════════════════════════════════

  const categoryStats = categories
    .map((cat) => {
      const catTxs = transactions.filter((t) => t.categoryId === cat.id);
      const totalAmount = catTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
      return { ...cat, count: catTxs.length, totalAmount };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount);

  if (categoryStats.length > 0) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...muted);
    pdf.text("SPENDING BY CATEGORY", margin, y);
    y += 5;

    let catX = margin;
    categoryStats.slice(0, 8).forEach((c) => {
      const cleanName = sanitizeText(c.name) || "Other";
      const label = `${cleanName}: ${safeCurrency}${c.totalAmount.toLocaleString()}`;
      const tw = pdf.getTextWidth(label) + 5;

      if (catX + tw > margin + contentWidth) {
        catX = margin;
        y += 6;
      }

      // Light pill background
      pdf.setFillColor(...cream);
      pdf.setDrawColor(210, 210, 210);
      pdf.setLineWidth(0.15);
      pdf.roundedRect(catX, y - 3, tw, 5, 1.2, 1.2, "FD");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...ink);
      pdf.text(label, catX + 2.5, y + 0.5);

      catX += tw + 2.5;
    });

    y += 8;
    hairline(margin, y, margin + contentWidth);
    y += 5;
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. TRANSACTION TABLE — Clean bank-statement style
  // ═══════════════════════════════════════════════════════════════

  // Column positions
  const col = {
    date: margin,
    desc: margin + 28,
    method: margin + contentWidth - 50,
    amount: margin + contentWidth,
  };

  const renderTableHeader = (headerY: number): number => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...muted);
    pdf.text("DATE", col.date, headerY);
    pdf.text("DESCRIPTION", col.desc, headerY);
    pdf.text("METHOD", col.method, headerY);
    pdf.text("AMOUNT", col.amount, headerY, { align: "right" });

    solidLine(margin, headerY + 2, margin + contentWidth);
    return headerY + 5;
  };

  y = renderTableHeader(y);

  // Sort transactions chronologically (newest first)
  const sortedTxs = [...transactions].sort((a, b) => {
    const dA = a.date || "";
    const dB = b.date || "";
    return dB.localeCompare(dA);
  });

  const rowHeight = 6;
  const pageBottom = pageHeight - 18;

  sortedTxs.forEach((tx, idx) => {
    // Page break
    if (y + rowHeight > pageBottom) {
      pdf.addPage();
      y = margin;
      y = renderTableHeader(y);
    }

    const cat = categories.find((c) => c.id === tx.categoryId);
    const cleanCatName = sanitizeText(cat?.name) || "Uncategorized";
    const cleanNote = sanitizeText(tx.note);
    const isIncome = tx.type === "income";

    // Alternating row background
    if (idx % 2 === 0) {
      pdf.setFillColor(252, 252, 250);
      pdf.rect(margin, y - 3.5, contentWidth, rowHeight, "F");
    }

    // Date
    const dateStr = tx.date ? tx.date.split("T")[0] : format(new Date(), "yyyy-MM-dd");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...muted);
    pdf.text(dateStr, col.date, y);

    // Description: Category + note
    let descText = cleanCatName;
    if (cleanNote) {
      const maxDescW = col.method - col.desc - 4;
      const combined = `${cleanCatName} - ${cleanNote}`;
      descText = pdf.getTextWidth(combined) > maxDescW
        ? combined.slice(0, 42) + "..."
        : combined;
    }
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...ink);
    pdf.text(descText, col.desc, y);

    // Method
    const cleanMethod = sanitizeText(tx.paymentMethod) || "UPI";
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...muted);
    pdf.text(cleanMethod.toUpperCase(), col.method, y);

    // Amount — right-aligned, color-coded
    const amountText = fmtMoneySign(tx.amount || 0, tx.type);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...(isIncome ? greenText : roseText));
    pdf.text(amountText, col.amount, y, { align: "right" });

    y += rowHeight;

    // Hairline after each row
    hairline(margin, y - 2.5, margin + contentWidth, [235, 235, 235]);
  });

  // ═══════════════════════════════════════════════════════════════
  // 5. CLOSING TOTALS BAR
  // ═══════════════════════════════════════════════════════════════

  if (y + 10 > pageBottom) {
    pdf.addPage();
    y = margin;
  }

  y += 2;
  solidLine(margin, y, margin + contentWidth);
  y += 5;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...ink);
  pdf.text("NET TOTAL", col.desc, y);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...(net >= 0 ? greenText : roseText));
  pdf.text(fmtMoney(net), col.amount, y, { align: "right" });

  // ═══════════════════════════════════════════════════════════════
  // 6. FOOTER ON ALL PAGES — Page X of Y
  // ═══════════════════════════════════════════════════════════════

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    hairline(margin, pageHeight - 12, margin + contentWidth, [180, 180, 180]);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(...muted);
    pdf.text("Invictus · Financial Statement · Confidential", margin, pageHeight - 8);
    pdf.text(`Page ${i} of ${totalPages}`, margin + contentWidth, pageHeight - 8, { align: "right" });
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. BULLETPROOF DOWNLOAD TRIGGER
  // ═══════════════════════════════════════════════════════════════

  if (typeof window !== "undefined") {
    try {
      pdf.save(filename);
      const blob = pdf.output("blob");
      const blobUrl = window.URL.createObjectURL(blob);
      return { success: true, blob, blobUrl };
    } catch (browserErr) {
      console.warn("pdf.save fallback error:", browserErr);
      return { success: true };
    }
  } else {
    pdf.save(filename);
    return { success: true };
  }
}
