import { type Category, type Habit } from "@/types";
import { format, addDays, isToday, isTomorrow, differenceInCalendarDays } from "date-fns";
import * as chrono from "chrono-node";
import { detectCategoryFromNote } from "./merchant-categorizer";
import { evaluateExpression } from "./calculator-engine";

export type ThoughtPriority = "p1" | "p2" | "p3";
export type ThoughtType = "expense" | "task" | "habit" | "thought";

export interface ParsedThought {
  originalLine: string;
  cleanTitle: string;
  amount?: number;
  priority?: ThoughtPriority;
  dueDate?: string; // YYYY-MM-DD
  dueDateLabel?: string; // "Today", "Tomorrow", "Friday", etc.
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  // Habit-specific metadata
  habitId?: string;
  habitName?: string;
  habitIcon?: string;
  habitAction?: "complete" | "progress";
  habitValue?: number;
  habitUnit?: string;
  type: ThoughtType;
  isConverted: boolean;
}

export interface ScratchpadAnalysis {
  lines: ParsedThought[];
  taskCount: number;
  habitCount: number;
  expenseCount: number;
  totalExpenseAmount: number;
  convertedCount: number;
}

// Common wellness & habit keywords
const HABIT_KEYWORDS = [
  "water", "hydrate", "hydration",
  "workout", "gym", "pushup", "pushups", "pullup", "pullups", "squat", "squats", "reps",
  "running", "run", "walk", "walking", "steps",
  "meditation", "meditate", "cold shower",
  "reading", "read", "book", "pages",
  "sleep", "stretching", "stretch", "floss", "journal", "deep work",
];

const HABIT_ACTION_VERBS = [
  "did", "done", "finished", "completed", "drank", "logged", "crushed", "read", "took",
];

const EXPENSE_ACTION_VERBS = [
  "coffee", "chai", "tea", "swiggy", "zomato", "uber", "ola", "rapido", "cab", "metro",
  "lunch", "dinner", "breakfast", "meal", "grocery", "groceries", "supermarket",
  "blinkit", "zepto", "instamart", "bill", "recharge", "rent", "wifi", "paid", "spent",
  "cost", "bought", "buy", "fee", "ticket", "petrol", "fuel", "diesel",
];

/**
 * Parses a single line from the scratchpad using a deterministic regex AST.
 * Extracts amount, priority, relative/weekday date, mapped category, habit metadata, and clean note.
 */
export function parseThoughtLine(
  line: string,
  categories: Category[] = [],
  habitsOrBaseDate?: Habit[] | Date,
  maybeBaseDate?: Date
): ParsedThought {
  let habits: Habit[] = [];
  let baseDate = new Date();

  if (habitsOrBaseDate instanceof Date) {
    baseDate = habitsOrBaseDate;
  } else if (Array.isArray(habitsOrBaseDate)) {
    habits = habitsOrBaseDate;
    if (maybeBaseDate instanceof Date) {
      baseDate = maybeBaseDate;
    }
  } else if (maybeBaseDate instanceof Date) {
    baseDate = maybeBaseDate;
  }

  const trimmed = line.trim();
  if (!trimmed) {
    return {
      originalLine: line,
      cleanTitle: "",
      type: "thought",
      isConverted: false,
    };
  }

  // 1. Check if line was already converted / struck out
  const isConverted =
    /^~.*~/.test(trimmed) ||
    /\[x\]/i.test(trimmed) ||
    /\(converted/i.test(trimmed);

  // Clean strikethrough wrappers for analysis
  let workingText = trimmed.replace(/^~|~$/g, "").trim();

  // Strip leading bullet marks: -, *, •, 1., etc.
  workingText = workingText.replace(/^[-*•]\s*|^\d+[\.)]\s*/, "");

  let extractedPriority: ThoughtPriority | undefined;
  let extractedDueDate: string | undefined;
  let extractedDueDateLabel: string | undefined;
  let extractedAmount: number | undefined;

  let extractedHabitId: string | undefined;
  let extractedHabitName: string | undefined;
  let extractedHabitIcon: string | undefined;
  let extractedHabitValue: number | undefined;
  let extractedHabitUnit: string | undefined;
  let isHabitDetected = false;

  // 2. Extract Priority (!p1, p1, urgent, !urgent, p2, p3, low)
  const priorityP1Regex = /\b(?:!p1|p1|!urgent|urgent|critical|high)\b/i;
  const priorityP2Regex = /\b(?:!p2|p2|medium)\b/i;
  const priorityP3Regex = /\b(?:!p3|p3|low)\b/i;

  if (priorityP1Regex.test(workingText)) {
    extractedPriority = "p1";
    workingText = workingText.replace(priorityP1Regex, "").trim();
  } else if (priorityP2Regex.test(workingText)) {
    extractedPriority = "p2";
    workingText = workingText.replace(priorityP2Regex, "").trim();
  } else if (priorityP3Regex.test(workingText)) {
    extractedPriority = "p3";
    workingText = workingText.replace(priorityP3Regex, "").trim();
  }

  // 3. Extract Natural Language Dates & Times (with colloquial day-after-tomorrow check)
  const dayAfterRegex = /\b(?:due\s+|by\s+|on\s+)?day after tomorrow\b/i;
  if (dayAfterRegex.test(workingText)) {
    const d = addDays(baseDate, 2);
    extractedDueDate = format(d, "yyyy-MM-dd");
    extractedDueDateLabel = "In 2 days";
    workingText = workingText.replace(dayAfterRegex, "").trim();
  } else {
    const chronoResults = chrono.parse(workingText, baseDate, { forwardDate: true });
    if (chronoResults.length > 0) {
      const result = chronoResults[0];
      const parsedDate = result.start.date();
      extractedDueDate = format(parsedDate, "yyyy-MM-dd");

      const inDaysMatch = result.text.match(/in\s+(\d+)\s+days?/i);
      const diffDays = differenceInCalendarDays(parsedDate, baseDate);

      if (inDaysMatch && inDaysMatch[1]) {
        extractedDueDateLabel = `In ${inDaysMatch[1]}d`;
      } else if (diffDays === 0 || isToday(parsedDate)) {
        extractedDueDateLabel = "Today";
      } else if (diffDays === 1 || isTomorrow(parsedDate)) {
        extractedDueDateLabel = "Tomorrow";
      } else if (diffDays === 2) {
        extractedDueDateLabel = "In 2 days";
      } else if (diffDays > 0 && diffDays < 7) {
        extractedDueDateLabel = format(parsedDate, "EEE");
      } else {
        extractedDueDateLabel = format(parsedDate, "MMM d");
      }

      // Cleanly slice out the matched date text from the working title
      workingText =
        workingText.slice(0, result.index) +
        " " +
        workingText.slice(result.index + result.text.length);
    } else {
      // Shorthand fallback: "tmrw"
      const tmrwRegex = /\b(?:due\s+|by\s+|on\s+)?tmrw\b/i;
      if (tmrwRegex.test(workingText)) {
        const d = addDays(baseDate, 1);
        extractedDueDate = format(d, "yyyy-MM-dd");
        extractedDueDateLabel = "Tomorrow";
        workingText = workingText.replace(tmrwRegex, "").trim();
      }
    }
  }

  const lowerWorking = workingText.toLowerCase();

  // 4. Extract Habit Telemetry & Metrics (e.g. "500ml water", "20 pages", "50 pushups", "10000 steps", "30 mins workout")
  const waterMatch = workingText.match(/\b(\d+(?:\.\d+)?)\s*(ml|l|litres?|liters?)\b/i);
  const pagesMatch = workingText.match(/\b(\d+)\s*(?:pages?|p|chapters?)\b/i) || workingText.match(/\bread\s+(\d+)\b/i);
  const pushupsMatch = workingText.match(/\b(\d+)\s*(?:pushups?|pullups?|squats?|reps?|sets?)\b/i);
  const stepsMatch = workingText.match(/\b(\d+)\s*(?:steps?|km|miles?)\b/i);
  const durationMatch = workingText.match(/\b(\d+)\s*(?:mins?|minutes?|hrs?|hours?)\b/i);

  if (waterMatch) {
    const rawVal = parseFloat(waterMatch[1]);
    const unit = waterMatch[2].toLowerCase();
    extractedHabitValue = unit.startsWith("l") ? rawVal * 1000 : rawVal;
    extractedHabitUnit = "ml";
    isHabitDetected = true;
    extractedHabitName = "Drink Water";
    extractedHabitIcon = "💧";
  } else if (pagesMatch) {
    extractedHabitValue = parseInt(pagesMatch[1], 10);
    extractedHabitUnit = "pages";
    isHabitDetected = true;
    extractedHabitName = "Reading";
    extractedHabitIcon = "📖";
  } else if (pushupsMatch) {
    extractedHabitValue = parseInt(pushupsMatch[1], 10);
    extractedHabitUnit = "reps";
    isHabitDetected = true;
    extractedHabitName = "Workout";
    extractedHabitIcon = "🏋️";
  } else if (stepsMatch) {
    extractedHabitValue = parseInt(stepsMatch[1], 10);
    extractedHabitUnit = stepsMatch[0].toLowerCase().includes("step") ? "steps" : "km";
    isHabitDetected = true;
    extractedHabitName = "Steps / Walk";
    extractedHabitIcon = "👟";
  } else if (durationMatch && (lowerWorking.includes("workout") || lowerWorking.includes("gym") || lowerWorking.includes("meditat") || lowerWorking.includes("study") || lowerWorking.includes("read"))) {
    extractedHabitValue = parseInt(durationMatch[1], 10);
    extractedHabitUnit = durationMatch[0].toLowerCase().includes("hr") || durationMatch[0].toLowerCase().includes("hour") ? "hrs" : "mins";
    isHabitDetected = true;
  }

  // Check matching against user's actual habit list
  if (habits && habits.length > 0) {
    for (const h of habits) {
      if (!h.title) continue;
      const hLower = h.title.toLowerCase();
      if (lowerWorking.includes(hLower) || (hLower.length >= 4 && lowerWorking.includes(hLower.slice(0, -1)))) {
        extractedHabitId = h.id;
        extractedHabitName = h.title;
        extractedHabitIcon = h.icon || "🎯";
        isHabitDetected = true;
        break;
      }
    }
  }

  // Check generic habit keywords if not yet matched
  if (!isHabitDetected) {
    const hasHabitWord = HABIT_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(lowerWorking));
    const hasHabitDone = HABIT_ACTION_VERBS.some((verb) => new RegExp(`\\b${verb}\\b`, "i").test(lowerWorking));
    if (hasHabitWord && (hasHabitDone || lowerWorking.includes("done") || lowerWorking.startsWith("did ") || !extractedPriority)) {
      isHabitDetected = true;
      if (lowerWorking.includes("water") || lowerWorking.includes("hydrat")) {
        extractedHabitName = "Drink Water";
        extractedHabitIcon = "💧";
      } else if (lowerWorking.includes("gym") || lowerWorking.includes("workout")) {
        extractedHabitName = "Workout";
        extractedHabitIcon = "🏋️";
      } else if (lowerWorking.includes("meditat")) {
        extractedHabitName = "Meditation";
        extractedHabitIcon = "🧘";
      } else if (lowerWorking.includes("cold shower")) {
        extractedHabitName = "Cold Shower";
        extractedHabitIcon = "🚿";
      } else if (lowerWorking.includes("read")) {
        extractedHabitName = "Reading";
        extractedHabitIcon = "📖";
      }
    }
  }

  // 5. Extract Amount for Expenses
  // Only extract amount if this is NOT a habit metric (e.g. NOT "500ml water" or "20 pages")
  const currencyPrefixedRegex = /(?:₹|\$|€|£|rs\.?|inr)\s*([\d\s+\-/*.,]+)/i;
  const currencySuffixedRegex = /([\d\s+\-/*.,]+)\s*(?:₹|\$|€|£|rs\.?|inr|bucks|rupees)/i;
  const bareNumberRegex = /\b(\d+(?:\.\d{1,2})?)\b/;

  let hasExplicitCurrency = false;

  if (currencyPrefixedRegex.test(workingText)) {
    const match = workingText.match(currencyPrefixedRegex);
    if (match && match[1]) {
      const expr = match[1].trim();
      try {
        extractedAmount = evaluateExpression(expr);
      } catch {
        extractedAmount = parseFloat(expr.replace(/,/g, ""));
      }
      hasExplicitCurrency = true;
      workingText = workingText.replace(currencyPrefixedRegex, "").trim();
    }
  } else if (currencySuffixedRegex.test(workingText)) {
    const match = workingText.match(currencySuffixedRegex);
    if (match && match[1]) {
      const expr = match[1].trim();
      try {
        extractedAmount = evaluateExpression(expr);
      } catch {
        extractedAmount = parseFloat(expr.replace(/,/g, ""));
      }
      hasExplicitCurrency = true;
      workingText = workingText.replace(currencySuffixedRegex, "").trim();
    }
  } else if (!isHabitDetected && bareNumberRegex.test(workingText)) {
    // If not a habit metric, check if number is an expense amount
    const match = workingText.match(bareNumberRegex);
    if (match && match[1]) {
      extractedAmount = parseFloat(match[1]);
      workingText = workingText.replace(bareNumberRegex, "").trim();
    }
  }

  // Clean residual punctuation & excess spaces
  let cleanTitle = workingText
    .replace(/^[-*•:,–—]+\s*/, "")
    .replace(/\s+[-*•:,–—]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // If clean title ended up empty (e.g. user just typed "150"), provide friendly fallback
  if (!cleanTitle && extractedAmount !== undefined) {
    cleanTitle = "Quick Expense";
  } else if (!cleanTitle) {
    cleanTitle = trimmed;
  }

  // 6. Category keyword semantic matching for Expenses
  let categoryId: string | undefined;
  let categoryName: string | undefined;
  let categoryIcon: string | undefined;

  if (categories && categories.length > 0) {
    const match = detectCategoryFromNote(cleanTitle, categories);
    if (match) {
      categoryId = match.categoryId;
      categoryName = match.categoryName;
      categoryIcon = (match.category as any)?.icon || "🏷️";
    }
  }

  // 7. Classification: Expense vs Habit vs Task vs Thought
  let type: ThoughtType = "thought";

  // Check if expense action words are explicitly present
  const hasExpenseWord = EXPENSE_ACTION_VERBS.some((v) => new RegExp(`\\b${v}\\b`, "i").test(cleanTitle.toLowerCase()));

  if (extractedAmount !== undefined && extractedAmount > 0 && (hasExplicitCurrency || hasExpenseWord || categoryName || !isHabitDetected)) {
    type = "expense";
  } else if (isHabitDetected) {
    type = "habit";
  } else if (extractedPriority || extractedDueDate || cleanTitle) {
    type = "task";
  }

  return {
    originalLine: line,
    cleanTitle,
    amount: extractedAmount,
    priority: extractedPriority,
    dueDate: extractedDueDate,
    dueDateLabel: extractedDueDateLabel,
    categoryId,
    categoryName,
    categoryIcon,
    habitId: extractedHabitId,
    habitName: extractedHabitName,
    habitIcon: extractedHabitIcon,
    habitAction: "complete",
    habitValue: extractedHabitValue,
    habitUnit: extractedHabitUnit,
    type,
    isConverted,
  };
}

/**
 * Parses full scratchpad markdown text into structured lines and composite statistics.
 */
export function parseScratchpad(
  content: string,
  categories: Category[] = [],
  habitsOrBaseDate?: Habit[] | Date,
  maybeBaseDate?: Date
): ScratchpadAnalysis {
  let habits: Habit[] = [];
  let baseDate = new Date();

  if (habitsOrBaseDate instanceof Date) {
    baseDate = habitsOrBaseDate;
  } else if (Array.isArray(habitsOrBaseDate)) {
    habits = habitsOrBaseDate;
    if (maybeBaseDate instanceof Date) {
      baseDate = maybeBaseDate;
    }
  } else if (maybeBaseDate instanceof Date) {
    baseDate = maybeBaseDate;
  }

  if (!content || !content.trim()) {
    return {
      lines: [],
      taskCount: 0,
      habitCount: 0,
      expenseCount: 0,
      totalExpenseAmount: 0,
      convertedCount: 0,
    };
  }

  const rawLines = content.split("\n");
  const parsedLines: ParsedThought[] = [];

  let taskCount = 0;
  let habitCount = 0;
  let expenseCount = 0;
  let totalExpenseAmount = 0;
  let convertedCount = 0;

  for (const rawLine of rawLines) {
    if (!rawLine.trim()) continue;
    const parsed = parseThoughtLine(rawLine, categories, habits, baseDate);
    parsedLines.push(parsed);

    if (parsed.isConverted) {
      convertedCount++;
      continue;
    }

    if (parsed.type === "expense" && parsed.amount) {
      expenseCount++;
      totalExpenseAmount += parsed.amount;
    } else if (parsed.type === "habit") {
      habitCount++;
    } else if (parsed.cleanTitle) {
      taskCount++;
    }
  }

  return {
    lines: parsedLines,
    taskCount,
    habitCount,
    expenseCount,
    totalExpenseAmount,
    convertedCount,
  };
}

/**
 * Strikes out a specific line in scratchpad text after conversion.
 */
export function markLineAsConverted(content: string, lineIndex: number): string {
  const lines = content.split("\n");
  if (lineIndex < 0 || lineIndex >= lines.length) return content;

  const targetLine = lines[lineIndex];
  if (!targetLine.trim() || /^~.*~$/.test(targetLine.trim())) {
    return content;
  }

  lines[lineIndex] = `~${targetLine.trim()}~ (Converted ✓)`;
  return lines.join("\n");
}

/**
 * Removes all converted lines from the scratchpad.
 */
export function clearConvertedLines(content: string): string {
  const lines = content.split("\n");
  const activeLines = lines.filter((l) => {
    const t = l.trim();
    return !(/^~.*~$/.test(t) || /\(converted/i.test(t));
  });
  return activeLines.join("\n");
}
