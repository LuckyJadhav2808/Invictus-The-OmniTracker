/**
 * Local OCR & Text Expense Parser for Invictus
 * 100% Client-side. Zero external API calls, zero data leaks.
 * Extracts amounts, merchants, dates, and auto-classifies categories.
 */

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

// Pre-defined category keyword dictionaries for Indian and global expenses
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: [
    "chai", "tea", "coffee", "cafe", "restaurant", "bakery", "swiggy", "zomato", "zepto",
    "blinkit", "instamart", "grocery", "dmart", "food", "lunch", "dinner", "breakfast",
    "burger", "pizza", "snacks", "mcdonalds", "starbucks", "kfc", "dominos", "subway",
    "haldiram", "biryani", "dhaba", "sweets", "juice", "eat", "dining", "barbeque",
    "baker", "milk", "egg", "fruit", "vegetable", "zorko", "hotel"
  ],
  Transport: [
    "uber", "ola", "rapido", "metro", "auto", "cab", "petrol", "fuel", "diesel",
    "parking", "toll", "fastag", "bus", "irctc", "train", "flight", "indigo", "air india",
    "railway", "transport", "ride", "cabs", "bpcl", "hpcl", "iocil", "shell", "cng"
  ],
  Shopping: [
    "amazon", "flipkart", "myntra", "ajio", "meesho", "zara", "h&m", "clothing", "apparel",
    "store", "mart", "mall", "electronics", "croma", "reliance digital", "decathlon",
    "shoes", "wear", "retail", "fashion", "purchase", "shopping", "bazaar", "florist",
    "flowers", "enterprises", "general store"
  ],
  Bills: [
    "electricity", "water", "gas", "bill", "recharge", "airtel", "jio", "vi", "vodafone",
    "wifi", "broadband", "rent", "maintenance", "tneb", "bescom", "mahadiscom", "cesc",
    "utility", "postpaid", "dth", "tata play", "piped gas", "cylinder", "indane", "hp gas"
  ],
  Health: [
    "pharmacy", "hospital", "clinic", "doctor", "medicine", "apollo", "1mg", "netmeds",
    "pharmeasy", "medplus", "dental", "pathology", "diagnostics", "gym", "cult.fit",
    "fitness", "supplement", "health", "wellness"
  ],
  Leisure: [
    "cinema", "pvr", "inox", "movie", "netflix", "prime video", "spotify", "steam",
    "game", "pub", "bar", "club", "drinks", "liquor", "wine", "beer", "theatre",
    "disney", "youtube premium", "entertainment", "concert", "bookmyshow"
  ],
  Rent: ["rent", "landlord", "flat", "society", "pg", "hostel", "deposit"],
  Salary: ["salary", "payroll", "stipend", "wages", "bonus", "freelance", "credited by employer"],
};

const MONTH_MAP: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  january: "01", february: "02", march: "03", april: "04", may_long: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12"
};

/**
 * Match merchant/note text to the most relevant user category
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

  // 1. Direct name match
  for (const cat of expenseCategories) {
    if (cleanNote.includes(cat.name.toLowerCase())) {
      return { categoryId: cat.id, categoryName: cat.name };
    }
  }

  // 2. Keyword dictionary lookup
  for (const [groupName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const hasKeyword = keywords.some((kw) => cleanNote.includes(kw));
    if (hasKeyword) {
      const matchedCat = expenseCategories.find(
        (c) => c.name.toLowerCase().includes(groupName.toLowerCase()) || groupName.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matchedCat) {
        return { categoryId: matchedCat.id, categoryName: matchedCat.name };
      }
    }
  }

  return { categoryId: fallback.id, categoryName: fallback.name };
}

/**
 * Clean OCR noise words and extract a human-readable merchant name
 */
export function cleanMerchantName(line: string): string {
  let cleaned = line
    .replace(/^[^a-zA-Z0-9]+/g, " ") // remove leading symbols like &, ~, <, @, -, •
    .replace(/^[@®™~a-zA-Z\s]{1,3}\b/g, " ") // strip avatar initials like '@ ', 'a ', 'PD ', 'KM ', 'HM '
    .replace(/^(paid to|transfer to|to|sent to|received from|debited for|payment to|upi[:\s]*|completed|bill payment to)\s+/i, "")
    .replace(/(payment successful|completed|debited from|bank ref|upi ref|transaction id|txn|google pay|phonepe|paytm|cred).*$/i, "")
    .replace(/[₹$€£\d]+(?:\.\d{1,2})?/g, "") // remove stray amounts
    .replace(/[^a-zA-Z0-9\s&'.-]/g, " ")
    .replace(/[-+]+$/, "") // remove trailing minus or plus
    .trim();

  // Condense spaces
  cleaned = cleaned.replace(/\s+/g, " ");

  if (cleaned.length < 3) return "";
  // Capitalize first letters
  return cleaned
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Attempt to extract a YYYY-MM-DD date from OCR text line
 */
export function extractDate(text: string): string {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Pattern 1: DD MMM YYYY (e.g. "07 Sep 2026" or "7 September 2026")
  const ddmmyyyyText = text.match(/(\d{1,2})\s+([a-zA-Z]{3,10})\s+(\d{4})/i);
  if (ddmmyyyyText) {
    const day = ddmmyyyyText[1].padStart(2, "0");
    const mStr = ddmmyyyyText[2].toLowerCase();
    const mNum = MONTH_MAP[mStr] || MONTH_MAP[mStr.slice(0, 3)];
    if (mNum) {
      return `${ddmmyyyyText[3]}-${mNum}-${day}`;
    }
  }

  // Pattern 2: DD Month without year (e.g. "7 September", "05 Sep", "31 Aug")
  const ddmmText = text.match(/\b(\d{1,2})\s+([a-zA-Z]{3,10})\b/i);
  if (ddmmText) {
    const day = ddmmText[1].padStart(2, "0");
    const mStr = ddmmText[2].toLowerCase();
    const mNum = MONTH_MAP[mStr] || MONTH_MAP[mStr.slice(0, 3)];
    if (mNum) {
      return `${currentYear}-${mNum}-${day}`;
    }
  }

  // Pattern 3: DD/MM/YYYY or DD-MM-YYYY
  const slashDate = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slashDate) {
    const day = slashDate[1].padStart(2, "0");
    const month = slashDate[2].padStart(2, "0");
    const year = slashDate[3];
    return `${year}-${month}-${day}`;
  }

  return "";
}

// System noise regex (phone status bar, search headers, filter pills)
const SYSTEM_UI_NOISE = /\b(?:\d{1,2}:\d{2}|device|tdevice|vo\s*lte|wifi|battery|network|search\s+transactions|balance\s*&\s*history|payment\s+method|status\s*[~+]?|\bdate\b|filter|total\s+spent)\b/i;

/**
 * Detect phantom Rupee glyphs that Tesseract fuses into numbers
 * (e.g. ₹80 -> 380, ₹160 -> 2160, ₹32 -> 332, ₹99 -> 399)
 * Only flags if the OCR text snippet actually displays signs of glyph fusion or noise.
 */
export function detectPhantomRupee(amountVal: number, rawSnippet?: string): { phantomRupeeDetected: boolean; suggestedAmount?: number } {
  // If rawSnippet is provided, only flag if it exhibits OCR artifact markers or repeated symbols
  const hasGlyphArtifact = rawSnippet ? /[₹?~|=!\\/]\s*[23]\d+/i.test(rawSnippet) || /[₹?~|=!\\/][23]/.test(rawSnippet) : false;

  // Pattern 1: 3-digit amount starting with '3' (e.g. 380 -> 80, 332 -> 32, 399 -> 99)
  // When Tesseract (English) sees '₹' touching digits, it mistakes the top curve & crossbars for '3'
  if (hasGlyphArtifact && amountVal >= 310 && amountVal <= 399 && Number.isInteger(amountVal)) {
    const candidate = parseInt(String(amountVal).slice(1), 10);
    if (!isNaN(candidate) && candidate >= 10) {
      return { phantomRupeeDetected: true, suggestedAmount: candidate };
    }
  }

  // Pattern 2: 4-digit amount starting with '21' or '31' (e.g. 2160 -> 160, 2120 -> 120, 2150 -> 150)
  // Tesseract turns '₹' into '2' or '3' before a '1'
  if (hasGlyphArtifact && amountVal >= 2100 && amountVal <= 2199 && Number.isInteger(amountVal)) {
    const candidate = parseInt(String(amountVal).slice(1), 10);
    if (!isNaN(candidate) && candidate >= 100 && candidate <= 199) {
      return { phantomRupeeDetected: true, suggestedAmount: candidate };
    }
  }

  if (hasGlyphArtifact && amountVal >= 3100 && amountVal <= 3199 && Number.isInteger(amountVal)) {
    const candidate = parseInt(String(amountVal).slice(1), 10);
    if (!isNaN(candidate) && candidate >= 100 && candidate <= 199) {
      return { phantomRupeeDetected: true, suggestedAmount: candidate };
    }
  }

  return { phantomRupeeDetected: false };
}

/**
 * Main parser: Extracts multiple transactions from raw OCR text or pasted SMS / ledger lines.
 * Uses a robust 3-stage heuristic pipeline:
 *  1. UPI List Parser (Google Pay, PhonePe, Paytm, CRED transaction history)
 *  2. Inline / Bank SMS Alert Parser
 *  3. Global fallback scanner
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
  // Each entry has:
  //   Line 1: [Avatar initial] [Merchant Name] [Amount at right with optional +, -, ₹, Rs, ?, %]
  //   Line 2: [Date: e.g. "05 Sep", "Paid on 31 Aug"] [Optional subtitle / tag: "Travel", "Food"]
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (SYSTEM_UI_NOISE.test(line)) continue;

    // Pattern: Line ends with an amount: [Merchant words] [+ -] [optional currency or glyph artifact] [digits]
    const upiListMatch = line.match(/^(.+?)\s+([+−-]?)\s*(?:[₹$€£]|rs\.?|[?%~=]+)?\s*(\d+(?:\.\d{1,2})?)$/i);

    if (upiListMatch) {
      const rawMerchant = upiListMatch[1];
      let isCredit = upiListMatch[2] === "+";
      const amountVal = parseFloat(upiListMatch[3]);

      const cleanedName = cleanMerchantName(rawMerchant);
      // Validate that the merchant is not a UI header or short noise
      if (cleanedName.length >= 3 && !SYSTEM_UI_NOISE.test(cleanedName)) {
        // Look ahead for date and note/tag lines (e.g. "Paid on 05 Sep" / "Travel" / "Money Received")
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

        continue;
      }
    }
  }

  // If Stage 1 successfully extracted items, return them!
  if (parsedItems.length > 0) {
    return parsedItems;
  }

  // -------------------------------------------------------------
  // STAGE 2: Standard Bank SMS & Receipt Parser
  // -------------------------------------------------------------
  let currentMerchant = "";
  let currentDate = today;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (SYSTEM_UI_NOISE.test(line)) continue;

    // Check if line contains a date
    const foundDate = extractDate(line);
    if (foundDate !== today) {
      currentDate = foundDate;
    }

    // Check if line contains a merchant header
    const isMerchantHeader = /^(paid to|transfer to|to|sent to|received from|debited for|bill for)/i.test(line);
    if (isMerchantHeader) {
      const candidate = cleanMerchantName(line);
      if (candidate.length > 1) {
        currentMerchant = candidate;
      }
    }

    const isTimeOrRef = /\b\d{1,2}:\d{2}\b|\b\d{10,16}\b/.test(line);
    const hasCurrencyClue = /[₹$€£]|rs\.?|inr|paid|debited|spent|total/i.test(line);

    // Look for amounts
    const match =
      line.match(/(?:[₹$€£]|rs\.?|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i) ||
      (hasCurrencyClue && line.match(/(?:debited\s*(?:by|for)?|paid)\s*(?:[₹$€£]|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i)) ||
      (!isTimeOrRef && line.match(/^[-−]\s*(?:[₹$€£]|rs\.?)?\s*([0-9,]+(?:\.[0-9]{1,2})?)$/i));

    if (match && match[1]) {
      const numStr = match[1].replace(/,/g, "");
      const amountVal = parseFloat(numStr);

      if (!isNaN(amountVal) && amountVal > 0 && amountVal <= 500000 && amountVal !== 2024 && amountVal !== 2025 && amountVal !== 2026) {
        const inlineMerchantMatch = line.match(
          /(?:transfer\s+to|towards|paid\s+to|sent\s+to|at|for)\s+([a-zA-Z0-9\s&'.-]{2,35}?)(?=(?:\s+(?:upi|ref|on|a\/c|via|val|net|txn|using|\d{4,})|$))/i
        );

        let note = "";
        if (inlineMerchantMatch && inlineMerchantMatch[1]) {
          const cleanedInline = cleanMerchantName(inlineMerchantMatch[1]);
          if (cleanedInline.length >= 2) {
            note = cleanedInline;
          }
        }

        if (!note) {
          note = currentMerchant;
        }

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

        if (!note) {
          note = "Expense";
        }

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
          note: note,
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          date: currentDate,
          paymentMethod: "UPI",
          type: "expense",
          selected: isItemComplete,
          isIncomplete: !isItemComplete,
          confidence: isItemComplete ? (match[0].includes("₹") || match[0].toLowerCase().includes("rs") ? "high" : "medium") : "low",
          rawSnippet: line,
        });

        currentMerchant = "";
      }
    } else {
      if (!isTimeOrRef && line.length >= 3 && line.length <= 40 && !line.includes(":") && !/completed|successful|processing/i.test(line)) {
        const potential = cleanMerchantName(line);
        if (potential.length >= 3) {
          currentMerchant = potential;
        }
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
      const numStr = globalMatch[1].replace(/,/g, "");
      const amountVal = parseFloat(numStr);
      if (!isNaN(amountVal) && amountVal > 0 && amountVal <= 500000 && amountVal !== 2026) {
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
          note: note,
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          date: today,
          paymentMethod: "UPI",
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

/**
 * Fast Turbo Grid row item definition
 */
export interface TurboGridRow {
  id: string;
  amount: string;
  note: string;
  categoryId: string;
  paymentMethod: string;
}

/**
 * Creates empty rows for Turbo Grid
 */
export function createEmptyTurboRows(count: number, defaultCatId: string): TurboGridRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `grid_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
    amount: "",
    note: "",
    categoryId: defaultCatId,
    paymentMethod: "UPI",
  }));
}
