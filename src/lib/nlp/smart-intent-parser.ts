import nlp from "compromise";
import * as chrono from "chrono-node";

export type ParsedIntentDomain = "MONEY_EXPENSE" | "HABIT_ROUTINE" | "TASK";

export interface ParsedMoneyExpense {
  amount: number;
  currency: string;
  merchant?: string;
  category?: string;
  date?: string; // ISO date string YYYY-MM-DD
  note: string;
}

export interface ParsedHabitRoutine {
  title: string;
  reminderTime?: string; // e.g. "07:00 AM"
  zone?: "morning" | "forge" | "evening";
  frequency: "daily" | "weekly";
}

export interface ParsedTask {
  title: string;
  dueDate?: string; // ISO date string
  dueTime?: string;
  priority: "high" | "medium" | "low";
}

export interface ParsedSmartIntent {
  rawText: string;
  domain: ParsedIntentDomain;
  confidence: number;
  expense?: ParsedMoneyExpense;
  habit?: ParsedHabitRoutine;
  task?: ParsedTask;
}

// Category heuristics for expense detection
const EXPENSE_CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ["lunch", "dinner", "breakfast", "coffee", "cafe", "starbucks", "swiggy", "zomato", "groceries", "food", "pizza", "burger", "mess", "supermarket"],
  Travel: ["uber", "ola", "cab", "auto", "metro", "flight", "petrol", "diesel", "fuel", "train", "irctc", "bus"],
  Shopping: ["amazon", "flipkart", "myntra", "clothes", "shoes", "decathlon", "bought", "shopping", "store"],
  Bills: ["recharge", "wifi", "broadband", "electricity", "rent", "subscription", "netflix", "spotify", "bill"],
  Fitness: ["gym", "whey", "creatine", "supplement", "membership", "cult"],
};

/**
 * Intelligent on-device intent parser combining compromise (grammar & entities)
 * and chrono-node (natural language date/time).
 * 100% offline, zero API latency, zero token cost.
 */
export function parseSmartIntent(input: string): ParsedSmartIntent {
  const text = (input || "").trim();
  if (!text) {
    return {
      rawText: text,
      domain: "TASK",
      confidence: 0,
      task: { title: "", priority: "medium" },
    };
  }

  const doc = nlp(text);
  const lower = text.toLowerCase();

  // 1. Date/Time parsing via chrono-node
  const chronoParsed = chrono.parse(text);
  let parsedDate: Date | null = null;
  let parsedTimeStr: string | null = null;

  if (chronoParsed.length > 0) {
    const firstMatch = chronoParsed[0];
    parsedDate = firstMatch.date();
    const known = firstMatch.start.isCertain("hour");
    if (known) {
      const h = parsedDate.getHours();
      const m = parsedDate.getMinutes();
      const period = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const displayM = m < 10 ? `0${m}` : m;
      parsedTimeStr = `${displayH}:${displayM} ${period}`;
    }
  }

  // 2. Money Extraction
  // Look for currency symbols (₹, $, €, £, Rs, INR) and amounts
  const moneyRegex = /(?:₹|rs\.?|inr|\$|€|£)\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:rs|inr|rupees|bucks|dollars|euro)/i;
  const genericNumberMatch = text.match(/(?:paid|spent|cost|bought.*?for)\s+(\d+(?:[.,]\d+)?)/i);
  let extractedAmount: number | null = null;

  // Check if text mentions known expense categories (Food, Travel, Bills, etc.)
  let detectedCategory: string | null = null;
  for (const [cat, keywords] of Object.entries(EXPENSE_CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      detectedCategory = cat;
      break;
    }
  }

  const moneyMatch = text.match(moneyRegex);
  if (moneyMatch) {
    const rawVal = moneyMatch[1] || moneyMatch[2];
    extractedAmount = parseFloat(rawVal.replace(/,/g, ""));
  } else if (genericNumberMatch) {
    extractedAmount = parseFloat(genericNumberMatch[1].replace(/,/g, ""));
  } else if (detectedCategory) {
    // When an expense keyword is present with a standalone number (e.g. "Swiggy dinner 450", "Coffee 150")
    const numMatch = text.match(/\b(\d+(?:[.,]\d+)?)\b/);
    if (numMatch) {
      extractedAmount = parseFloat(numMatch[1].replace(/,/g, ""));
    }
  } else {
    // Check compromise numbers tagged with money words
    const compromiseNumbers = doc.numbers().json();
    if (compromiseNumbers.length > 0 && (lower.includes("paid") || lower.includes("spent") || lower.includes("cost"))) {
      const item = compromiseNumbers[0] as any;
      extractedAmount = typeof item.num === "number" ? item.num : (typeof item.number === "number" ? item.number : parseFloat(item.text || item.num));
    }
  }

  // 3. Domain Scoring
  const hasMoneyAction = /(paid|spent|cost|bought|purchase|transfer|sent to|bill|split)/i.test(lower);
  const hasHabitKeyword = /(every day|every morning|daily|routine|habit|streak|hydrate|sleep by|pages|cold shower)/i.test(lower);

  // If explicit money amount and expense verbs/categories exist -> MONEY_EXPENSE
  if (
    extractedAmount !== null &&
    (hasMoneyAction ||
      lower.includes("₹") ||
      lower.includes("rs") ||
      lower.includes("$") ||
      lower.includes("€") ||
      Boolean(detectedCategory))
  ) {
    // Extract person/merchant
    const people = doc.people().text();
    let merchantOrPerson = people.trim();

    if (!merchantOrPerson) {
      const forMatch = text.match(/(?:to|at|for|from)\s+([A-Za-z0-9&'\s]+?)(?:\s+(?:yesterday|today|tomorrow|\d)|$)/i);
      if (forMatch) {
        merchantOrPerson = forMatch[1].trim();
      }
    }

    // Determine category
    const matchedCategory = detectedCategory || "General";

    // Clean note
    let cleanNote = text;
    if (chronoParsed.length > 0) {
      cleanNote = cleanNote.replace(chronoParsed[0].text, "").trim();
    }

    return {
      rawText: text,
      domain: "MONEY_EXPENSE",
      confidence: 0.92,
      expense: {
        amount: extractedAmount,
        currency: lower.includes("$") ? "USD" : lower.includes("€") ? "EUR" : "INR",
        merchant: merchantOrPerson || undefined,
        category: matchedCategory,
        date: parsedDate ? parsedDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        note: cleanNote || text,
      },
    };
  }

  // If habit indicators exist -> HABIT_ROUTINE
  if (hasHabitKeyword || lower.startsWith("habit:") || lower.includes("every day") || lower.includes("daily")) {
    let cleanTitle = text
      .replace(/^(habit:\s*)/i, "")
      .replace(/(every day|daily|every morning|every night)/gi, "")
      .trim();

    if (chronoParsed.length > 0) {
      cleanTitle = cleanTitle.replace(chronoParsed[0].text, "").trim();
    }

    // Determine routine zone
    let zone: "morning" | "forge" | "evening" = "morning";
    if (lower.includes("night") || lower.includes("evening") || lower.includes("sleep")) {
      zone = "evening";
    } else if (lower.includes("afternoon") || lower.includes("work") || lower.includes("forge")) {
      zone = "forge";
    }

    return {
      rawText: text,
      domain: "HABIT_ROUTINE",
      confidence: 0.88,
      habit: {
        title: cleanTitle || text,
        reminderTime: parsedTimeStr || (zone === "morning" ? "07:30 AM" : zone === "evening" ? "09:30 PM" : "02:00 PM"),
        zone,
        frequency: "daily",
      },
    };
  }

  // Default: TASK
  let cleanTaskTitle = text;
  if (chronoParsed.length > 0) {
    cleanTaskTitle = cleanTaskTitle.replace(chronoParsed[0].text, "").trim();
  }
  cleanTaskTitle = cleanTaskTitle.replace(/^(todo:\s*|task:\s*)/i, "").trim();

  const isUrgent = /(urgent|asap|today|critical|important)/i.test(lower);

  return {
    rawText: text,
    domain: "TASK",
    confidence: 0.85,
    task: {
      title: cleanTaskTitle || text,
      dueDate: parsedDate ? parsedDate.toISOString() : undefined,
      dueTime: parsedTimeStr || undefined,
      priority: isUrgent ? "high" : "medium",
    },
  };
}
