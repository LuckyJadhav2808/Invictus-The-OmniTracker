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

  // Page dimensions & margins
  const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  let y = margin;

  // Safe currency text (Standard PDF fonts require ASCII currency text like "Rs." or "$")
  const safeCurrency = currencySymbol === "₹" ? "Rs. " : `${currencySymbol} `;

  // Helper: Format currency text safely
  const formatMoney = (val: number) => {
    const absVal = Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return val < 0 ? `-${safeCurrency}${absVal}` : `${safeCurrency}${absVal}`;
  };

  // Helper: Draw Neobrutalist border box
  const drawNeobrutalistBox = (
    x: number,
    boxY: number,
    w: number,
    h: number,
    fillColor: [number, number, number] = [255, 255, 255],
    strokeColor: [number, number, number] = [22, 21, 20]
  ) => {
    pdf.setFillColor(...fillColor);
    pdf.setDrawColor(...strokeColor);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(x, boxY, w, h, 2, 2, "FD");
  };

  // 1. HEADER SECTION
  // Background Hero Header Box
  drawNeobrutalistBox(margin, y, contentWidth, 32, [250, 248, 245]);

  // Brand Badge Box
  pdf.setFillColor(206, 244, 49); // #CEF431
  pdf.setDrawColor(22, 21, 20);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(margin + 4, y + 4, 10, 8, 1.5, 1.5, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(22, 21, 20);
  pdf.text("INV", margin + 5.2, y + 9.5);

  pdf.setFontSize(11);
  pdf.text("INVICTUS OMNITRACKER", margin + 17, y + 9.5);

  // Title & Metadata
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  pdf.text("LEDGER & FINANCIAL STATEMENT", margin + 4, y + 20);

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(70, 70, 70);
  const genTime = format(new Date(), "yyyy-MM-dd HH:mm");
  const cleanUserName = sanitizeText(userName) || "Invictus Explorer";
  pdf.text(`Account Holder: ${cleanUserName}  •  Generated: ${genTime}`, margin + 4, y + 26);

  // Statement Period Badge
  const periodBoxWidth = 54;
  const periodBoxX = margin + contentWidth - periodBoxWidth - 4;
  drawNeobrutalistBox(periodBoxX, y + 4, periodBoxWidth, 24, [206, 244, 49]);

  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(22, 21, 20);
  pdf.text("STATEMENT PERIOD", periodBoxX + 4, y + 10);

  pdf.setFontSize(8.5);
  const cleanPeriod = sanitizeText(periodLabel) || "CURRENT STATEMENT";
  pdf.text(cleanPeriod.slice(0, 24), periodBoxX + 4, y + 18);

  y += 38;

  // 2. CASHFLOW SUMMARY KPI CARDS
  const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + (t.amount || 0), 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + (t.amount || 0), 0);
  const net = income - expense;

  const cardW = (contentWidth - 9) / 4; // 4 cards

  // Card 1: Income
  drawNeobrutalistBox(margin, y, cardW, 16, [255, 255, 255]);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(100, 100, 100);
  pdf.text("INCOME (+)", margin + 3, y + 5);
  pdf.setFontSize(9.5);
  pdf.setTextColor(3, 160, 80); // Green
  pdf.text(`+${safeCurrency}${income.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, margin + 3, y + 12);

  // Card 2: Expense
  const card2X = margin + cardW + 3;
  drawNeobrutalistBox(card2X, y, cardW, 16, [255, 255, 255]);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(100, 100, 100);
  pdf.text("EXPENSE (-)", card2X + 3, y + 5);
  pdf.setFontSize(9.5);
  pdf.setTextColor(225, 29, 72); // Rose
  pdf.text(`-${safeCurrency}${expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, card2X + 3, y + 12);

  // Card 3: Net Flow
  const card3X = margin + (cardW + 3) * 2;
  const netBgColor: [number, number, number] = net >= 0 ? [206, 244, 49] : [253, 230, 138];
  drawNeobrutalistBox(card3X, y, cardW, 16, netBgColor);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(22, 21, 20);
  pdf.text("NET FLOW", card3X + 3, y + 5);
  pdf.setFontSize(9.5);
  pdf.setTextColor(22, 21, 20);
  pdf.text(formatMoney(net), card3X + 3, y + 12);

  // Card 4: Record Count
  const card4X = margin + (cardW + 3) * 3;
  drawNeobrutalistBox(card4X, y, cardW, 16, [255, 255, 255]);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(100, 100, 100);
  pdf.text("TOTAL LOGS", card4X + 3, y + 5);
  pdf.setFontSize(9.5);
  pdf.setTextColor(22, 21, 20);
  pdf.text(`${transactions.length} Records`, card4X + 3, y + 12);

  y += 22;

  // 3. CATEGORY SPENDING BREAKDOWN
  const categoryStats = categories
    .map((cat) => {
      const catTxs = transactions.filter((t) => t.categoryId === cat.id);
      const totalAmount = catTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
      return { ...cat, count: catTxs.length, totalAmount };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount);

  if (categoryStats.length > 0) {
    pdf.setFontSize(8.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(22, 21, 20);
    pdf.text("CATEGORY SPENDING BREAKDOWN", margin, y);
    y += 4;

    let catX = margin;
    categoryStats.slice(0, 6).forEach((c) => {
      const cleanCatName = sanitizeText(c.name) || "Category";
      const label = `${cleanCatName}: ${safeCurrency}${c.totalAmount.toLocaleString()}`;
      const textWidth = pdf.getTextWidth(label) + 6;

      if (catX + textWidth > margin + contentWidth) {
        catX = margin;
        y += 7;
      }

      drawNeobrutalistBox(catX, y, textWidth, 5.5, [250, 248, 245]);
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(22, 21, 20);
      pdf.text(label, catX + 3, y + 4);
      catX += textWidth + 3;
    });

    y += 10;
  }

  // 4. CHRONOLOGICAL TRANSACTION TABLE
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(22, 21, 20);
  pdf.text("DETAILED TRANSACTION LEDGER", margin, y);
  y += 4;

  const renderTableHeader = (currentY: number) => {
    drawNeobrutalistBox(margin, currentY, contentWidth, 7, [22, 21, 20]);
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.text("DATE", margin + 3, currentY + 4.8);
    pdf.text("TYPE", margin + 30, currentY + 4.8);
    pdf.text("CATEGORY & NOTE", margin + 55, currentY + 4.8);
    pdf.text("METHOD", margin + 130, currentY + 4.8);
    pdf.text("AMOUNT", margin + contentWidth - 3, currentY + 4.8, { align: "right" });
    return currentY + 7;
  };

  y = renderTableHeader(y);

  // Sort transactions chronologically (newest first)
  const sortedTxs = [...transactions].sort((a, b) => {
    const dA = a.date || "";
    const dB = b.date || "";
    return dB.localeCompare(dA);
  });

  sortedTxs.forEach((tx, idx) => {
    // Check page break cutoff
    if (y > pageHeight - 20) {
      pdf.addPage();
      y = margin;
      y = renderTableHeader(y);
    }

    const cat = categories.find((c) => c.id === tx.categoryId);
    const rawCatName = cat?.name || "Uncategorized";
    const cleanCatName = sanitizeText(rawCatName) || "Uncategorized";
    const cleanNote = sanitizeText(tx.note);
    const noteText = cleanNote ? ` (${cleanNote})` : "";
    const fullCatText = `${cleanCatName}${noteText}`;
    const truncatedCatText = fullCatText.length > 38 ? fullCatText.slice(0, 35) + "..." : fullCatText;

    const rowBg: [number, number, number] = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    drawNeobrutalistBox(margin, y, contentWidth, 7, rowBg);

    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(22, 21, 20);

    // Date
    const dateStr = tx.date ? tx.date.split("T")[0] : format(new Date(), "yyyy-MM-dd");
    pdf.text(dateStr, margin + 3, y + 4.8);

    // Type Badge
    pdf.setFont("helvetica", "bold");
    if (tx.type === "income") {
      pdf.setTextColor(3, 160, 80);
      pdf.text("INCOME", margin + 30, y + 4.8);
    } else {
      pdf.setTextColor(225, 29, 72);
      pdf.text("EXPENSE", margin + 30, y + 4.8);
    }

    // Category & Note
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(22, 21, 20);
    pdf.text(truncatedCatText, margin + 55, y + 4.8);

    // Method
    const cleanMethod = sanitizeText(tx.paymentMethod) || "UPI";
    pdf.text(cleanMethod, margin + 130, y + 4.8);

    // Amount
    pdf.setFont("helvetica", "bold");
    if (tx.type === "income") {
      pdf.setTextColor(3, 160, 80);
      pdf.text(`+${safeCurrency}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, margin + contentWidth - 3, y + 4.8, { align: "right" });
    } else {
      pdf.setTextColor(225, 29, 72);
      pdf.text(`-${safeCurrency}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, margin + contentWidth - 3, y + 4.8, { align: "right" });
    }

    y += 7;
  });

  // 5. FOOTER ON LAST PAGE
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(120, 120, 120);
  pdf.text(`Invictus OmniTracker Enterprise Statement • Page 1 of ${pdf.getNumberOfPages()}`, margin, pageHeight - 8);

  // Trigger vector PDF download
  pdf.save(filename);
}
