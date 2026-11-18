import { type Transaction, type Category } from "@/types";
import { parseISO, differenceInDays } from "date-fns";

export interface FrequentExpenseItem {
  name: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  paymentMethod: string;
  frequency: number;
  icon: string;
  isHabit: boolean;
}

export const STARTER_SUGGESTIONS: FrequentExpenseItem[] = [
  {
    name: "Chai & Snack",
    amount: 40,
    categoryId: "food",
    categoryName: "Food & Dining",
    paymentMethod: "upi",
    frequency: 1,
    icon: "☕",
    isHabit: false,
  },
  {
    name: "Canteen / Lunch",
    amount: 120,
    categoryId: "food",
    categoryName: "Food & Dining",
    paymentMethod: "upi",
    frequency: 1,
    icon: "🍛",
    isHabit: false,
  },
  {
    name: "Metro / Auto",
    amount: 50,
    categoryId: "transport",
    categoryName: "Transport",
    paymentMethod: "upi",
    frequency: 1,
    icon: "🚇",
    isHabit: false,
  },
  {
    name: "Groceries / Quick-Mart",
    amount: 180,
    categoryId: "groceries",
    categoryName: "Groceries",
    paymentMethod: "upi",
    frequency: 1,
    icon: "🛒",
    isHabit: false,
  },
  {
    name: "Books & Prints",
    amount: 150,
    categoryId: "education",
    categoryName: "Education",
    paymentMethod: "upi",
    frequency: 1,
    icon: "📚",
    isHabit: false,
  },
];

/**
 * Maps a title or category name to a semantic, recognizable emoji icon
 */
export function inferExpenseIcon(name: string, categoryName: string = ""): string {
  const text = `${name} ${categoryName}`.toLowerCase();

  if (/chai|tea|coffee|cafe|latte|starbucks|blue tokai/.test(text)) return "☕";
  if (/lunch|dinner|mess|canteen|food|dining|swiggy|zomato|pizza|burger|snack|biryani|dosa/.test(text)) return "🍛";
  if (/metro|auto|rapido|uber|ola|cab|fuel|petrol|diesel|bus|train|flight|commute|transport/.test(text)) return "🚇";
  if (/zepto|blinkit|instamart|grocery|groceries|supermarket|dmart|milk|veggies|fruits/.test(text)) return "🛒";
  if (/book|print|xerox|stationery|copy|exam|tuition|course|notes|education/.test(text)) return "📚";
  if (/gym|fitness|protein|creatine|workout|badminton|turf/.test(text)) return "⚡";
  if (/recharge|jio|airtel|wifi|broadband|electricity|bill|rent/.test(text)) return "📱";
  if (/movie|cinema|netflix|spotify|prime|game|gaming/.test(text)) return "🎬";

  return "💳";
}

/**
 * Computes mode (most frequent item) in an array
 */
function getMode<T>(arr: T[], fallback: T): T {
  if (!arr.length) return fallback;
  const countMap = new Map<T, number>();
  let maxCount = 0;
  let mode = fallback;

  for (const item of arr) {
    const c = (countMap.get(item) || 0) + 1;
    countMap.set(item, c);
    if (c > maxCount) {
      maxCount = c;
      mode = item;
    }
  }

  return mode;
}

/**
 * Mines user transactions for genuine frequent habits (Frequency * Recency).
 * Gracefully falls back to starter suggestions when fewer transactions exist.
 */
export function computeFrequentExpenses(
  transactions: Transaction[] = [],
  categories: Category[] = [],
  limit: number = 5,
  referenceDate: Date = new Date()
): FrequentExpenseItem[] {
  const categoryMap = new Map<string, Category>();
  categories.forEach((cat) => categoryMap.set(cat.id, cat));

  // Default expense category fallback
  const defaultExpenseCategory =
    categories.find((c) => c.type === "expense" && !c.archived) || categories[0];

  // 1. Group valid expenses by normalized title
  const groupMap = new Map<
    string,
    {
      displayNames: string[];
      amounts: number[];
      categoryIds: string[];
      paymentMethods: string[];
      dates: string[];
    }
  >();

  transactions.forEach((tx) => {
    if (tx.type !== "expense") return;
    const amount = Number(tx.amount || 0);
    if (amount <= 0) return;

    const rawNote = (tx.note || "").replace(/\s*\(copy\)\s*$/i, "").trim();
    if (rawNote.length < 2) return;

    const key = rawNote.toLowerCase();
    let group = groupMap.get(key);
    if (!group) {
      group = {
        displayNames: [],
        amounts: [],
        categoryIds: [],
        paymentMethods: [],
        dates: [],
      };
      groupMap.set(key, group);
    }

    group.displayNames.push(rawNote);
    group.amounts.push(amount);
    if (tx.categoryId) group.categoryIds.push(tx.categoryId);
    if (tx.paymentMethod) group.paymentMethods.push(tx.paymentMethod.toLowerCase());
    if (tx.date) group.dates.push(tx.date);
  });

  // 2. Score and transform each group
  const candidates: Array<FrequentExpenseItem & { score: number }> = [];

  groupMap.forEach((group) => {
    const frequency = group.amounts.length;
    // Find most common display title
    const displayName = getMode(group.displayNames, group.displayNames[0]);
    // Find most common amount (mode), fallback to latest amount
    const typicalAmount = getMode(group.amounts, group.amounts[group.amounts.length - 1]);
    // Find most common category
    const categoryId = getMode(
      group.categoryIds,
      defaultExpenseCategory?.id || "general"
    );
    const categoryObj = categoryMap.get(categoryId) || defaultExpenseCategory;
    const categoryName = categoryObj?.name || "Expense";
    // Find most common payment method
    const paymentMethod = getMode(group.paymentMethods, "upi");

    // Recency weighting: past 14 days get 1.5x boost, past 45 days 1.0x, older 0.7x
    let recencyMultiplier = 0.7;
    if (group.dates.length > 0) {
      const sortedDates = [...group.dates].sort().reverse();
      try {
        const latestDate = parseISO(sortedDates[0]);
        const daysDiff = Math.max(0, differenceInDays(referenceDate, latestDate));
        if (daysDiff <= 14) recencyMultiplier = 1.5;
        else if (daysDiff <= 45) recencyMultiplier = 1.0;
      } catch {}
    }

    const score = frequency * recencyMultiplier;
    const isHabit = frequency >= 2;
    const icon = inferExpenseIcon(displayName, categoryName);

    candidates.push({
      name: displayName,
      amount: typicalAmount,
      categoryId,
      categoryName,
      paymentMethod,
      frequency,
      icon,
      isHabit,
      score,
    });
  });

  // 3. Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Take top mined items
  const result: FrequentExpenseItem[] = candidates.slice(0, limit).map(({ score, ...item }) => item);

  // 4. If fewer than limit items, gracefully backfill with starter suggestions
  if (result.length < limit) {
    const existingKeys = new Set(result.map((r) => r.name.toLowerCase()));

    for (const starter of STARTER_SUGGESTIONS) {
      if (result.length >= limit) break;
      if (!existingKeys.has(starter.name.toLowerCase())) {
        // Try to match starter with user's real categories
        const matchedCat =
          categories.find(
            (c) =>
              c.type === "expense" &&
              !c.archived &&
              c.name.toLowerCase().includes(starter.categoryName.toLowerCase().split(" ")[0])
          ) || defaultExpenseCategory;

        result.push({
          ...starter,
          categoryId: matchedCat?.id || starter.categoryId,
          categoryName: matchedCat?.name || starter.categoryName,
        });
        existingKeys.add(starter.name.toLowerCase());
      }
    }
  }

  return result;
}
