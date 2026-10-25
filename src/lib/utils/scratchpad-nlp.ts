import { type Category } from "@/types";
import { format, addDays, getDay } from "date-fns";
import { detectCategoryFromNote } from "./merchant-categorizer";

export type ThoughtPriority = "p1" | "p2" | "p3";
export type ThoughtType = "expense" | "task" | "thought";

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
  type: ThoughtType;
  isConverted: boolean;
}

export interface ScratchpadAnalysis {
  lines: ParsedThought[];
  taskCount: number;
  expenseCount: number;
  totalExpenseAmount: number;
  convertedCount: number;
}

const WEEKDAY_MAP: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

/**
 * Calculates the next occurrence of a target weekday from a given base date.
 */
function getNextWeekdayDate(baseDate: Date, targetDayIndex: number): Date {
  const currentDay = getDay(baseDate);
  let daysToAdd = (targetDayIndex - currentDay + 7) % 7;
  if (daysToAdd === 0) daysToAdd = 7; // Next week's occurrence if today is that day
  return addDays(baseDate, daysToAdd);
}

/**
 * Parses a single line from the scratchpad using a deterministic regex AST.
 * Extracts amount, priority, relative/weekday date, mapped category, and clean note.
 */
export function parseThoughtLine(
  line: string,
  categories: Category[] = [],
  baseDate: Date = new Date()
): ParsedThought {
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

  // 3. Extract Relative Dates ("today", "tomorrow", "day after tomorrow", "in N days", "friday")
  // "day after tomorrow"
  const dayAfterTomorrowRegex = /\b(?:due\s+|by\s+|on\s+)?day after tomorrow\b/i;
  // "today" / "tonight"
  const todayRegex = /\b(?:due\s+|by\s+|on\s+)?(today|tonight)\b/i;
  // "tomorrow" / "tmrw"
  const tomorrowRegex = /\b(?:due\s+|by\s+|on\s+)?(tomorrow|tmrw)\b/i;
  // "in N days"
  const inDaysRegex = /\b(?:due\s+|by\s+|in\s+)?in\s+(\d+)\s+days?\b/i;
  // Weekday ("due friday", "on monday", "friday")
  const weekdayRegex =
    /\b(?:due\s+|by\s+|on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i;

  if (dayAfterTomorrowRegex.test(workingText)) {
    const d = addDays(baseDate, 2);
    extractedDueDate = format(d, "yyyy-MM-dd");
    extractedDueDateLabel = "In 2 days";
    workingText = workingText.replace(dayAfterTomorrowRegex, "").trim();
  } else if (tomorrowRegex.test(workingText)) {
    const d = addDays(baseDate, 1);
    extractedDueDate = format(d, "yyyy-MM-dd");
    extractedDueDateLabel = "Tomorrow";
    workingText = workingText.replace(tomorrowRegex, "").trim();
  } else if (todayRegex.test(workingText)) {
    extractedDueDate = format(baseDate, "yyyy-MM-dd");
    extractedDueDateLabel = "Today";
    workingText = workingText.replace(todayRegex, "").trim();
  } else if (inDaysRegex.test(workingText)) {
    const match = workingText.match(inDaysRegex);
    if (match && match[1]) {
      const days = parseInt(match[1], 10);
      const d = addDays(baseDate, days);
      extractedDueDate = format(d, "yyyy-MM-dd");
      extractedDueDateLabel = `In ${days}d`;
      workingText = workingText.replace(inDaysRegex, "").trim();
    }
  } else if (weekdayRegex.test(workingText)) {
    const match = workingText.match(weekdayRegex);
    if (match && match[1]) {
      const dayName = match[1].toLowerCase();
      const targetDayIndex = WEEKDAY_MAP[dayName];
      if (targetDayIndex !== undefined) {
        const d = getNextWeekdayDate(baseDate, targetDayIndex);
        extractedDueDate = format(d, "yyyy-MM-dd");
        extractedDueDateLabel = format(d, "EEE");
        workingText = workingText.replace(weekdayRegex, "").trim();
      }
    }
  }

  // 4. Extract Amount (e.g. "₹250", "Coffee 150", "120 books", "$15")
  const currencyPrefixedRegex = /(?:₹|\$|€|£|rs\.?|inr)\s*(\d+(?:\.\d{1,2})?)/i;
  const currencySuffixedRegex = /(\d+(?:\.\d{1,2})?)\s*(?:₹|\$|€|£|rs\.?|inr|bucks|rupees)/i;
  const bareNumberRegex = /\b(\d+(?:\.\d{1,2})?)\b/;

  if (currencyPrefixedRegex.test(workingText)) {
    const match = workingText.match(currencyPrefixedRegex);
    if (match && match[1]) {
      extractedAmount = parseFloat(match[1]);
      workingText = workingText.replace(currencyPrefixedRegex, "").trim();
    }
  } else if (currencySuffixedRegex.test(workingText)) {
    const match = workingText.match(currencySuffixedRegex);
    if (match && match[1]) {
      extractedAmount = parseFloat(match[1]);
      workingText = workingText.replace(currencySuffixedRegex, "").trim();
    }
  } else if (bareNumberRegex.test(workingText)) {
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

  // 5. Category keyword semantic matching
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

  // 6. Classification: Expense vs Task vs Thought
  let type: ThoughtType = "thought";
  if (extractedAmount !== undefined && extractedAmount > 0) {
    type = "expense";
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
  baseDate: Date = new Date()
): ScratchpadAnalysis {
  if (!content || !content.trim()) {
    return {
      lines: [],
      taskCount: 0,
      expenseCount: 0,
      totalExpenseAmount: 0,
      convertedCount: 0,
    };
  }

  const rawLines = content.split("\n");
  const parsedLines: ParsedThought[] = [];

  let taskCount = 0;
  let expenseCount = 0;
  let totalExpenseAmount = 0;
  let convertedCount = 0;

  for (const rawLine of rawLines) {
    if (!rawLine.trim()) continue;
    const parsed = parseThoughtLine(rawLine, categories, baseDate);
    parsedLines.push(parsed);

    if (parsed.isConverted) {
      convertedCount++;
      continue;
    }

    if (parsed.type === "expense" && parsed.amount) {
      expenseCount++;
      totalExpenseAmount += parsed.amount;
    } else if (parsed.cleanTitle) {
      taskCount++;
    }
  }

  return {
    lines: parsedLines,
    taskCount,
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
