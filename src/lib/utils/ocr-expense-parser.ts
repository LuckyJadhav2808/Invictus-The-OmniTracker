/**
 * Local OCR & Text Expense Parser for Invictus
 * 100% Client-side. Zero external API calls, zero data leaks.
 * Combines chrono-node (dates), compromise (merchant entities),
 * fuse.js (fuzzy OCR typo recovery), and currency.js (exact money math).
 */

import * as chrono from "chrono-node";
import nlp from "compromise";
import Fuse from "fuse.js";
import currency from "currency.js";

export interface ParsedExpenseItem {
  id: string;
  amount: number;
  originalAmount?: number;
  suggestedAmount?: number;
  phantomRupeeDetected?: boolean;
  isPhantomFixed?: boolean;
  note: string;
  categoryId: string;
  categoryName?: string;
  date: string; // YYYY-MM-DD
  paymentMethod: string; // "UPI" | "Cash" | "Card" | "Bank"
  type: "expense" | "income";
  selected: boolean;
  confidence?: "high" | "medium" | "low";
  rawSnippet?: string;
  isIncomplete?: boolean;
}

export interface CategoryReference {
  id: string;
  name: string;
  type: "income" | "expense";
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: [
    "chai", "tea", "coffee", "cafe", "restaurant", "bakery", "swiggy", "zomato", "zepto",
    "blinkit", "instamart", "grocery", "dmart", "food", "lunch", "dinner", "breakfast",
    "burger", "pizza", "snacks", "mcdonalds", "starbucks", "kfc", "dominos", "subway",
    "haldiram", "biryani", "dhaba", "sweets", "juice", "eat", "dining", "barbeque",
    "baker", "milk", "egg", "fruit", "vegetable", "zorko", "hotel", "bistro", "kitchen",
  ],
  Transport: [
    "uber", "ola", "rapido", "metro", "auto", "cab", "petrol", "fuel", "diesel",
    "parking", "toll", "fastag", "bus", "irctc", "train", "flight", "indigo", "air india",
    "railway", "transport", "ride", "cabs", "bpcl", "hpcl", "iocl", "shell", "cng", "trip", "commute",
  ],
  Shopping: [
    "amazon", "flipkart", "myntra", "ajio", "meesho", "zara", "h&m", "clothing", "apparel",
    "store", "mart", "mall", "electronics", "croma", "reliance digital", "decathlon",
    "shoes", "wear", "retail", "fashion", "purchase", "shopping", "bazaar", "florist",
    "flowers", "enterprises", "general store", "supermarket",
  ],
  Bills: [
    "electricity", "water", "gas", "bill", "recharge", "airtel", "jio", "vi", "vodafone",
    "wifi", "broadband", "rent", "maintenance", "tneb", "bescom", "mahadiscom", "cesc",
    "utility", "postpaid", "dth", "tata play", "piped gas", "cylinder", "indane", "hp gas",
  ],
  Health: [
    "pharmacy", "hospital", "clinic", "doctor", "medicine", "apollo", "1mg", "netmeds",
    "pharmeasy", "medplus", "dental", "pathology", "diagnostics", "gym", "cult.fit",
    "fitness", "supplement", "health", "wellness",
  ],
  Leisure: [
    "cinema", "pvr", "inox", "movie", "netflix", "prime video", "spotify", "steam",
    "game", "pub", "bar", "club", "drinks", "liquor", "wine", "beer", "theatre",
    "disney", "youtube premium", "entertainment", "concert", "bookmyshow",
  ],
  Rent: ["rent", "landlord", "flat", "society", "pg", "hostel", "deposit"],
  Salary: ["salary", "payroll", "stipend", "wages", "bonus", "freelance", "credited by employer"],
};

interface FuzzyKeywordEntry {
  keyword: string;
  groupName: string;
}

const FUZZY_KEYWORD_INDEX: FuzzyKeywordEntry[] = Object.entries(CATEGORY_KEYWORDS).flatMap(
  ([groupName, keywords]) => keywords.map((keyword) => ({ keyword, groupName }))
);

const keywordFuse = new Fuse(FUZZY_KEYWORD_INDEX, {
  keys: ["keyword"],
  threshold: 0.34,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 3,
});

/** Normalize common OCR digit-letter confusions (0->o, 1->l/i) for fuzzy lookup */
function normalizeOcrToken(token: string): string {
  return token.replace(/0/g, "o").replace(/1/g, "i");
}

const MONTH_MAP: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  january: "01", february: "02", march: "03", april: "04", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

/**
 * Safely parse a formatted currency string (e.g. "1,249.50") via currency.js
 */
function parseAmountSafe(raw: string): number {
  try {
    const val = currency(raw).value;
    return Number.isFinite(val) ? val : 0;
  } catch {
    return parseFloat(raw.replace(/,/g, "")) || 0;
  }
}

/**
 * Match merchant/note text to the most relevant user category.
 * Uses exact substring lookup first, then Fuse.js fuzzy matching for OCR typos (e.g. "Swlggy", "Z0mato").
 */
export function matchCategory(
  note: string,
  categories: CategoryReference[]
): { categoryId: string; categoryName: string } {
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const fallback = expenseCategories[0] || categories[0] || { id: "cat-food", name: "Food" };

  if (!note || note.trim().length === 0) {
    return { categoryId: fallback.id, categoryName: fallback.name };
  }

  const cleanNote = note.toLowerCase();

  // 1. Direct category name match
  for (const cat of expenseCategories) {
    if (cleanNote.includes(cat.name.toLowerCase())) {
      return { categoryId: cat.id, categoryName: cat.name };
    }
  }

  // 2. Exact keyword dictionary lookup
  for (const [groupName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => cleanNote.includes(kw))) {
      const matchedCat = expenseCategories.find(
        (c) =>
          c.name.toLowerCase().includes(groupName.toLowerCase()) ||
          groupName.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matchedCat) {
        return { categoryId: matchedCat.id, categoryName: matchedCat.name };
      }
    }
  }

  // 3. Fuse.js fuzzy token recovery for OCR character misreads (e.g. "Swlggy", "Amaz0n", "Ubcr")
  const tokens = cleanNote
    .split(/\s+/)
    .filter((t) => t.length >= 4)
    .map(normalizeOcrToken);
  for (const token of tokens) {
    const hits = keywordFuse.search(token);
    if (hits.length > 0 && hits[0].score !== undefined && hits[0].score <= 0.34) {
      const groupName = hits[0].item.groupName;
      const matchedCat = expenseCategories.find(
        (c) =>
          c.name.toLowerCase().includes(groupName.toLowerCase()) ||
          groupName.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matchedCat) {
        return { categoryId: matchedCat.id, categoryName: matchedCat.name };
      }
    }
  }

  // 4. Fuzzy match directly against user's custom category names
  if (expenseCategories.length > 0) {
    const catFuse = new Fuse(expenseCategories, {
      keys: ["name"],
      threshold: 0.35,
      ignoreLocation: true,
    });
    for (const token of tokens) {
      const catHits = catFuse.search(token);
      if (catHits.length > 0) {
        return { categoryId: catHits[0].item.id, categoryName: catHits[0].item.name };
      }
    }
  }

  return { categoryId: fallback.id, categoryName: fallback.name };
}

/**
 * Clean OCR noise words and extract a human-readable merchant name.
 * Falls back to compromise NLP entity/noun extraction for verbose receipt lines.
 */
export function cleanMerchantName(line: string): string {
  let cleaned = line
    .replace(/^[^a-zA-Z0-9]+/g, " ")
    .replace(/^[@®™~a-zA-Z\s]{1,3}\b/g, " ")
    .replace(/^(paid to|transfer to|to|sent to|received from|debited for|payment to|upi[:\s]*|completed|bill payment to|thank you for (?:dining|shopping) at|welcome to)\s+/i, "")
    .replace(/(payment successful|completed|debited from|bank ref|upi ref|transaction id|txn|google pay|phonepe|paytm|cred|gstin|fssai|invoice|bill no).*$/i, "")
    .replace(/[₹$€£\d]+(?:\.\d{1,2})?/g, "")
    .replace(/[^a-zA-Z0-9\s&'.-]/g, " ")
    .replace(/[-+]+$/, "")
    .replace(/\s+/g, " ")
    .trim();

  // If still long/noisy (> 5 words), extract primary organization or proper noun via compromise
  if (cleaned.split(" ").length > 5) {
    try {
      const doc = nlp(cleaned);
      const orgs = doc.organizations().out("array") as string[];
      const proper = doc.match("#ProperNoun+").out("array") as string[];
      const candidate = orgs[0] || proper[0];
      if (candidate && candidate.trim().length >= 3) {
        cleaned = candidate.trim();
      }
    } catch {}
  }

  if (cleaned.length < 3) return "";
  return cleaned
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Extract a YYYY-MM-DD date from OCR text.
 * Checks Indian DD/MM/YYYY explicitly first, then uses chrono-node for all natural/abbreviated formats.
 */
export function extractDate(text: string): string {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Pattern 1: DD MMM YYYY (e.g. "07 Sep 2026")
  const ddmmyyyyText = text.match(/(\d{1,2})\s+([a-zA-Z]{3,10})\s+(\d{4})/i);
  if (ddmmyyyyText) {
    const day = ddmmyyyyText[1].padStart(2, "0");
    const mStr = ddmmyyyyText[2].toLowerCase();
    const mNum = MONTH_MAP[mStr] || MONTH_MAP[mStr.slice(0, 3)];
    if (mNum) return `${ddmmyyyyText[3]}-${mNum}-${day}`;
  }

  // Pattern 2: DD Month without year (e.g. "7 September", "05 Sep")
  const ddmmText = text.match(/\b(\d{1,2})\s+([a-zA-Z]{3,10})\b/i);
  if (ddmmText) {
    const day = ddmmText[1].padStart(2, "0");
    const mStr = ddmmText[2].toLowerCase();
    const mNum = MONTH_MAP[mStr] || MONTH_MAP[mStr.slice(0, 3)];
    if (mNum) return `${currentYear}-${mNum}-${day}`;
  }

  // Pattern 3: Indian DD/MM/YYYY or DD-MM-YYYY (must run before chrono-node's US MM/DD bias)
  const slashDate = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (slashDate) {
    const dayNum = parseInt(slashDate[1], 10);
    const monthNum = parseInt(slashDate[2], 10);
    const yearStr = slashDate[3].length === 2 ? `20${slashDate[3]}` : slashDate[3];
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return `${yearStr}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    }
  }

  // Pattern 4: chrono-node natural language date parsing ("Yesterday", "Sep 5, 2026", "2026-11-27", etc.)
  try {
    const parsedDate = chrono.parseDate(text, now);
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      const y = parsedDate.getFullYear();
      const m = String(parsedDate.getMonth() + 1).padStart(2, "0");
      const d = String(parsedDate.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  } catch {}

  return "";
}

const SYSTEM_UI_NOISE =
  /\b(?:\d{1,2}:\d{2}|device|tdevice|vo\s*lte|wifi|battery|network|search\s+transactions|balance\s*&\s*history|payment\s+method|status\s*[~+]?|\bdate\b|filter|total\s+spent)\b/i;

const RECEIPT_INDICATORS =
  /\b(?:subtotal|sub\s*total|cgst|sgst|igst|gst|vat|tax|grand\s*total|net\s*payable|bill\s*total|amount\s*payable|invoice\s*no|cash\s*memo|qty|rate)\b/i;

const RECEIPT_TOTAL_LINE =
  /\b(?:grand\s*total|net\s*payable|bill\s*total|total\s*amount|amount\s*payable|net\s*amount|total\s*due|total)\b/i;

/**
 * Detect phantom Rupee glyphs that Tesseract fuses into numbers
 * (e.g. ₹80 -> 380, ₹160 -> 2160, ₹32 -> 332, ₹99 -> 399)
 */
export function detectPhantomRupee(
  amountVal: number,
  rawSnippet?: string
): { phantomRupeeDetected: boolean; suggestedAmount?: number } {
  const hasGlyphArtifact = rawSnippet
    ? /[₹?~|=!\\/]\s*[23]\d+/i.test(rawSnippet) || /[₹?~|=!\\/][23]/.test(rawSnippet)
    : false;

  if (hasGlyphArtifact && amountVal >= 310 && amountVal <= 399 && Number.isInteger(amountVal)) {
    const candidate = parseInt(String(amountVal).slice(1), 10);
    if (!isNaN(candidate) && candidate >= 10) {
      return { phantomRupeeDetected: true, suggestedAmount: candidate };
    }
  }

  if (
    hasGlyphArtifact &&
    ((amountVal >= 2100 && amountVal <= 2199) || (amountVal >= 3100 && amountVal <= 3199)) &&
    Number.isInteger(amountVal)
  ) {
    const candidate = parseInt(String(amountVal).slice(1), 10);
    if (!isNaN(candidate) && candidate >= 100 && candidate <= 199) {
      return { phantomRupeeDetected: true, suggestedAmount: candidate };
    }
  }

  return { phantomRupeeDetected: false };
}

function detectPaymentMethod(rawText: string): string {
  if (/\b(?:visa|mastercard|rupay|debit\s*card|credit\s*card|card\s*ending)\b/i.test(rawText)) {
    return "Card";
  }
  if (/\b(?:cash\s*paid|cash\s*tendered|by\s*cash)\b/i.test(rawText)) {
    return "Cash";
  }
  if (/\b(?:neft|imps|rtgs|net\s*banking|bank\s*transfer)\b/i.test(rawText)) {
    return "Bank";
  }
  return "UPI";
}

/**
 * Printed/Thermal Receipt Parser:
 * Extracts Merchant Header, Grand Total (ignoring subtotals & tax lines), Date, and Payment Method.
 */
function parsePrintedReceipt(
  lines: string[],
  rawText: string,
  categories: CategoryReference[],
  today: string
): ParsedExpenseItem | null {
  if (!RECEIPT_INDICATORS.test(rawText)) return null;

  // 1. Find Grand Total / Net Payable / Total line (preferring explicit Grand Total / Net Payable)
  let bestAmount = 0;
  let bestScore = -1;
  let bestLine = "";

  for (const line of lines) {
    if (!RECEIPT_TOTAL_LINE.test(line) || /\bsub\s*total\b/i.test(line)) continue;
    const amtMatch = line.match(/(?:[₹$€£]|rs\.?|inr)?\s*([0-9,]+\.?\d{0,2})\s*$/i);
    if (amtMatch && amtMatch[1]) {
      const val = parseAmountSafe(amtMatch[1]);
      if (val > 0 && val <= 500000) {
        let score = 1;
        if (/grand\s*total|net\s*payable|amount\s*payable/i.test(line)) score = 3;
        else if (/bill\s*total|total\s*amount/i.test(line)) score = 2;

        if (score > bestScore || (score === bestScore && val > bestAmount)) {
          bestScore = score;
          bestAmount = val;
          bestLine = line;
        }
      }
    }
  }

  if (bestAmount <= 0) return null;

  // 2. Merchant name from top 4 non-noise lines
  let merchant = "";
  for (const line of lines.slice(0, 5)) {
    if (SYSTEM_UI_NOISE.test(line) || /\d{4,}|gstin|invoice|date|bill|receipt/i.test(line)) continue;
    const candidate = cleanMerchantName(line);
    if (candidate.length >= 3) {
      merchant = candidate;
      break;
    }
  }
  if (!merchant) merchant = "Receipt Expense";

  // 3. Date via chrono-node / DD-MM-YYYY
  let receiptDate = today;
  for (const line of lines.slice(0, 8)) {
    const found = extractDate(line);
    if (found) {
      receiptDate = found;
      break;
    }
  }

  const cat = matchCategory(merchant, categories);
  const phantom = detectPhantomRupee(bestAmount, bestLine);

  return {
    id: `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    amount: bestAmount,
    originalAmount: bestAmount,
    suggestedAmount: phantom.suggestedAmount,
    phantomRupeeDetected: phantom.phantomRupeeDetected,
    isPhantomFixed: false,
    note: merchant,
    categoryId: cat.categoryId,
    categoryName: cat.categoryName,
    date: receiptDate,
    paymentMethod: detectPaymentMethod(rawText),
    type: "expense",
    selected: true,
    isIncomplete: false,
    confidence: "high",
    rawSnippet: bestLine,
  };
}

export interface OCRWordBox {
  text: string;
  confidence?: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export interface OCRBlockLike {
  paragraphs?: Array<{
    lines?: Array<{
      words?: OCRWordBox[];
    }>;
  }>;
}

/**
 * Spatial Bounding-Box Row Reconstruction:
 * Re-pairs left-column merchant/labels with right-column amounts on the same horizontal row,
 * solving Tesseract's multi-column block splitting on receipts & UPI history screenshots.
 */
export function reconstructVisualRowsFromBlocks(blocks: OCRBlockLike[] | null | undefined): string {
  if (!blocks || blocks.length === 0) return "";

  const words: Array<{ text: string; x0: number; midY: number; height: number }> = [];
  for (const block of blocks) {
    for (const para of block.paragraphs || []) {
      for (const line of para.lines || []) {
        for (const w of line.words || []) {
          const text = (w.text || "").trim();
          if (!text) continue;
          const height = Math.max(8, w.bbox.y1 - w.bbox.y0);
          const midY = (w.bbox.y0 + w.bbox.y1) / 2;
          words.push({ text, x0: w.bbox.x0, midY, height });
        }
      }
    }
  }

  if (words.length === 0) return "";

  // Sort top-to-bottom first
  words.sort((a, b) => a.midY - b.midY);

  const rows: Array<typeof words> = [];
  for (const w of words) {
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
      const rowMidY = lastRow.reduce((sum, item) => sum + item.midY, 0) / lastRow.length;
      const avgH = lastRow.reduce((sum, item) => sum + item.height, 0) / lastRow.length;
      if (Math.abs(w.midY - rowMidY) <= Math.max(10, avgH * 0.65)) {
        lastRow.push(w);
        continue;
      }
    }
    rows.push([w]);
  }

  return rows
    .map((row) =>
      row
        .sort((a, b) => a.x0 - b.x0)
        .map((w) => w.text)
        .join(" ")
    )
    .join("\n");
}

/**
 * Main parser: Extracts transactions from raw OCR text or pasted SMS / ledger lines.
 * Pipeline:
 *  1. UPI List Parser (Google Pay, PhonePe, Paytm, CRED transaction history)
 *  2. Printed Thermal Receipt Total Extractor (Grand Total + Merchant Header)
 *  3. Bank SMS & Multi-line Alert Parser
 *  4. Global Fallback Regex Scanner
 */
export function parseRawOCRText(
  rawText: string,
  categories: CategoryReference[]
): ParsedExpenseItem[] {
  if (!rawText || rawText.trim().length === 0) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parsedItems: ParsedExpenseItem[] = [];
  const today = new Date().toISOString().split("T")[0];

  // -------------------------------------------------------------
  // STAGE 1: UPI Transaction List Parser (Google Pay / PhonePe / Paytm)
  // -------------------------------------------------------------
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (SYSTEM_UI_NOISE.test(line)) continue;

    // Skip pure date lines (e.g. "Paid on 14 Nov 2026") so years aren't misread as amounts
    if (/^(?:paid\s+on|received\s+on|date[:\s])/i.test(line) || (extractDate(line) && !/[₹$€£]|rs\.?/i.test(line))) {
      continue;
    }

    // Skip receipt item/tax lines if this looks like a single printed receipt
    if (RECEIPT_INDICATORS.test(rawText) && /\b(?:subtotal|cgst|sgst|igst|gst|tax|qty)\b/i.test(line)) {
      continue;
    }

    const upiListMatch = line.match(
      /^(.+?)\s+([+−-]?)\s*(?:[₹$€£]|rs\.?|[?%~=]+)?\s*([0-9,]+(?:\.\d{1,2})?)$/i
    );

    if (upiListMatch) {
      const rawMerchant = upiListMatch[1];
      let isCredit = upiListMatch[2] === "+";
      const amountVal = parseAmountSafe(upiListMatch[3]);

      const cleanedName = cleanMerchantName(rawMerchant);
      if (
        amountVal > 0 &&
        amountVal <= 500000 &&
        cleanedName.length >= 3 &&
        !SYSTEM_UI_NOISE.test(cleanedName) &&
        !RECEIPT_TOTAL_LINE.test(cleanedName)
      ) {
        let itemDate = today;
        let noteExtra = "";
        let categoryHint = "";

        for (let offset = 1; offset <= 2; offset++) {
          if (i + offset < lines.length) {
            const nextLine = lines[i + offset];
            const candidateDate = extractDate(nextLine);
            if (candidateDate) {
              itemDate = candidateDate;
              const subParts = nextLine.split(/[-•·,]/);
              if (subParts.length > 1) {
                noteExtra = subParts.slice(1).join(" ").trim();
              }
            }
            if (/received\s+on|money\s+received/i.test(nextLine)) {
              isCredit = true;
            }
            if (/travel|food|shopping|bills|health|entertainment|grocery/i.test(nextLine)) {
              categoryHint = nextLine;
            }
          }
        }

        let finalNote = cleanedName;
        if (noteExtra && noteExtra.length > 1 && !SYSTEM_UI_NOISE.test(noteExtra)) {
          finalNote += ` • ${noteExtra}`;
        }

        const cat = matchCategory(categoryHint ? `${finalNote} ${categoryHint}` : finalNote, categories);
        const isItemComplete = amountVal > 0 && cleanedName.trim().length >= 2;
        const phantom = detectPhantomRupee(amountVal, line);

        parsedItems.push({
          id: `upi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          amount: amountVal,
          originalAmount: amountVal,
          suggestedAmount: phantom.suggestedAmount,
          phantomRupeeDetected: phantom.phantomRupeeDetected,
          isPhantomFixed: false,
          note: finalNote,
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          date: itemDate,
          paymentMethod: "UPI",
          type: isCredit ? "income" : "expense",
          selected: isItemComplete,
          isIncomplete: !isItemComplete,
          confidence: isItemComplete ? "high" : "low",
          rawSnippet: line,
        });
      }
    }
  }

  // If this looks like a single printed receipt (e.g. restaurant/store bill with GST & Grand Total),
  // prefer the clean Grand Total extraction over noisy line-item rows.
  const receiptItem = parsePrintedReceipt(lines, rawText, categories, today);
  if (receiptItem) {
    return [receiptItem];
  }

  if (parsedItems.length > 0) {
    return parsedItems;
  }

  // -------------------------------------------------------------
  // STAGE 2: Standard Bank SMS & Alert Parser
  // -------------------------------------------------------------
  let currentMerchant = "";
  let currentDate = today;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (SYSTEM_UI_NOISE.test(line)) continue;

    const foundDate = extractDate(line);
    if (foundDate && foundDate !== today) {
      currentDate = foundDate;
    }

    const isMerchantHeader = /^(paid to|transfer to|to|sent to|received from|debited for|bill for)/i.test(line);
    if (isMerchantHeader) {
      const candidate = cleanMerchantName(line);
      if (candidate.length > 1) {
        currentMerchant = candidate;
      }
    }

    const isTimeOrRef = /\b\d{1,2}:\d{2}\b|\b\d{10,16}\b/.test(line);
    const hasCurrencyClue = /[₹$€£]|rs\.?|inr|paid|debited|spent|total/i.test(line);

    const match =
      line.match(/(?:[₹$€£]|rs\.?|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i) ||
      (hasCurrencyClue &&
        line.match(/(?:debited\s*(?:by|for)?|paid|spent|total)\s*(?:[₹$€£]|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i)) ||
      (!isTimeOrRef && line.match(/^[-−]\s*(?:[₹$€£]|rs\.?)?\s*([0-9,]+(?:\.[0-9]{1,2})?)$/i));

    if (match && match[1]) {
      const amountVal = parseAmountSafe(match[1]);

      if (amountVal > 0 && amountVal <= 500000 && amountVal !== 2024 && amountVal !== 2025 && amountVal !== 2026) {
        const inlineMerchantMatch = line.match(
          /(?:transfer\s+to|towards|paid\s+to|sent\s+to|at|for)\s+([a-zA-Z0-9\s&'.-]{2,35}?)(?=(?:\s+(?:upi|ref|on|a\/c|via|val|net|txn|using|\d{4,})|$))/i
        );

        let note = "";
        if (inlineMerchantMatch && inlineMerchantMatch[1]) {
          const cleanedInline = cleanMerchantName(inlineMerchantMatch[1]);
          if (cleanedInline.length >= 2) note = cleanedInline;
        }
        if (!note) note = currentMerchant;
        if (!note) {
          for (let prev = Math.max(0, i - 2); prev <= Math.min(lines.length - 1, i + 1); prev++) {
            if (prev === i) continue;
            const cleaned = cleanMerchantName(lines[prev]);
            if (cleaned.length >= 3 && !cleaned.toLowerCase().includes("completed") && !cleaned.toLowerCase().includes("successful")) {
              note = cleaned;
              break;
            }
          }
        }
        if (!note) note = "Expense";

        const category = matchCategory(note, categories);
        const isItemComplete = amountVal > 0 && note.trim().length >= 2 && note !== "Expense";
        const phantom = detectPhantomRupee(amountVal, line);

        parsedItems.push({
          id: `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          amount: amountVal,
          originalAmount: amountVal,
          suggestedAmount: phantom.suggestedAmount,
          phantomRupeeDetected: phantom.phantomRupeeDetected,
          isPhantomFixed: false,
          note,
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          date: currentDate,
          paymentMethod: detectPaymentMethod(line),
          type: "expense",
          selected: isItemComplete,
          isIncomplete: !isItemComplete,
          confidence: isItemComplete
            ? match[0].includes("₹") || match[0].toLowerCase().includes("rs")
              ? "high"
              : "medium"
            : "low",
          rawSnippet: line,
        });

        currentMerchant = "";
      }
    } else if (!isTimeOrRef && line.length >= 3 && line.length <= 40 && !line.includes(":") && !/completed|successful|processing/i.test(line)) {
      const potential = cleanMerchantName(line);
      if (potential.length >= 3) {
        currentMerchant = potential;
      }
    }
  }

  // -------------------------------------------------------------
  // STAGE 3: Global Fallback Regex Scan
  // -------------------------------------------------------------
  if (parsedItems.length === 0) {
    const globalAmountRegex = /(?:[₹$]|rs\.?)\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi;
    let globalMatch;
    while ((globalMatch = globalAmountRegex.exec(rawText)) !== null) {
      const amountVal = parseAmountSafe(globalMatch[1]);
      if (amountVal > 0 && amountVal <= 500000 && amountVal !== 2026) {
        const start = Math.max(0, globalMatch.index - 40);
        const snippet = rawText.slice(start, globalMatch.index + 40).replace(/\r?\n/g, " ");
        const note = cleanMerchantName(snippet) || "Expense";
        const cat = matchCategory(note, categories);
        const isItemComplete = amountVal > 0 && note.trim().length >= 2 && note !== "Expense";
        const phantom = detectPhantomRupee(amountVal, snippet);

        parsedItems.push({
          id: `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          amount: amountVal,
          originalAmount: amountVal,
          suggestedAmount: phantom.suggestedAmount,
          phantomRupeeDetected: phantom.phantomRupeeDetected,
          isPhantomFixed: false,
          note,
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          date: extractDate(snippet) || today,
          paymentMethod: detectPaymentMethod(rawText),
          type: "expense",
          selected: isItemComplete,
          isIncomplete: !isItemComplete,
          confidence: "medium",
          rawSnippet: globalMatch[0],
        });
      }
    }
  }

  return parsedItems;
}

export interface TurboGridRow {
  id: string;
  amount: string;
  note: string;
  categoryId: string;
  paymentMethod: string;
}

export function createEmptyTurboRows(count: number, defaultCatId: string): TurboGridRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `grid_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
    amount: "",
    note: "",
    categoryId: defaultCatId,
    paymentMethod: "UPI",
  }));
}
