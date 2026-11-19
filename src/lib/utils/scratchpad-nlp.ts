import { type Category } from "@/types";
import { format, addDays, isToday, isTomorrow, differenceInCalendarDays } from "date-fns";
import * as chrono from "chrono-node";
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
