"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  FileText,
  Trash2,
  Wallet,
  CheckSquare,
  Sparkles,
  Zap,
  Calendar,
  Tag,
  ChevronDown,
  Target,
  Plus,
} from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  parseScratchpad,
  parseThoughtLine,
  markLineAsConverted,
  clearConvertedLines,
  type ParsedThought,
  type ThoughtPriority,
} from "@/lib/utils/scratchpad-nlp";
import { type Category, type Habit } from "@/types";

export interface RetroStickyScratchpadProps {
  categories?: Category[];
  habits?: Habit[];
  onConvertToTask?: (task: {
    title: string;
    priority?: ThoughtPriority;
    date?: string;
    category?: string;
    categoryId?: string;
  }) => void;
  onConvertToExpense?: (expense: {
    amount: number;
    note: string;
    categoryId?: string;
    date?: string;
  }) => void;
  onConvertToHabit?: (habit: {
    habitId?: string;
    title: string;
    action?: "complete" | "progress";
    value?: number;
    unit?: string;
    date?: string;
  }) => void;
  onBatchConvert?: (
    tasks: Array<{
      title: string;
      priority: ThoughtPriority;
      date?: string;
      category?: string;
      categoryId?: string;
    }>,
    expenses: Array<{
      amount: number;
      note: string;
      categoryId?: string;
      date?: string;
    }>,
    habits?: Array<{
      habitId?: string;
      title: string;
      action?: "complete" | "progress";
      value?: number;
      unit?: string;
      date?: string;
    }>
  ) => void;
  className?: string;
}

const STORAGE_KEY = "invictus_sticky_scratchpad";

const QUICK_EXAMPLES = [
  "💧 Drank 500ml water",
  "☕ Coffee 120",
  "🏋️ Workout done",
  "📖 Read 20 pages",
  "⚡ Finish assignment tomorrow p1",
  "🚇 Metro 40",
];

export function RetroStickyScratchpad({
  categories = [],
  habits = [],
  onConvertToTask,
  onConvertToExpense,
  onConvertToHabit,
  onBatchConvert,
  className,
}: RetroStickyScratchpadProps) {
  const [content, setContent] = useState<string>("");
  const [isSaved, setIsSaved] = useState(true);
  const [cursorIndex, setCursorIndex] = useState<number>(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 1. Hydrate from localStorage safely on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setContent(saved);
        const savedCollapse = localStorage.getItem("invictus_scratchpad_collapsed");
        if (savedCollapse === "true") setIsCollapsed(true);
      } catch {}
    }
  }, []);

  const toggleCollapse = () => {
    soundFX.playPop();
    const next = !isCollapsed;
    setIsCollapsed(next);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("invictus_scratchpad_collapsed", String(next));
      } catch {}
    }
  };

  // 2. Debounced auto-save (300ms)
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setCursorIndex(e.target.selectionStart || 0);
    setIsSaved(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, val);
          setIsSaved(true);
        } catch {}
      }
    }, 300);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorIndex(e.currentTarget.selectionStart || 0);
  };

  // 3. NLP AST Parsing
  const analysis = useMemo(() => {
    return parseScratchpad(content, categories, habits);
  }, [content, categories, habits]);

  // Determine active line index based on cursor position
  const activeLineIndex = useMemo(() => {
    if (!content) return 0;
    const textBeforeCursor = content.slice(0, cursorIndex);
    return textBeforeCursor.split("\n").length - 1;
  }, [content, cursorIndex]);

  const rawLines = useMemo(() => content.split("\n"), [content]);
  const activeRawLine = rawLines[activeLineIndex] || rawLines[0] || "";

  const activeLineParsed: ParsedThought = useMemo(() => {
    return parseThoughtLine(activeRawLine, categories, habits);
  }, [activeRawLine, categories, habits]);

  // First eligible unconverted line (fallback if active line is empty/converted)
  const firstUnconvertedIndex = useMemo(() => {
    return rawLines.findIndex((line) => {
      const trimmed = line.trim();
      return (
        trimmed.length > 0 &&
        !/^~.*~/.test(trimmed) &&
        !/\(converted/i.test(trimmed)
      );
    });
  }, [rawLines]);

  const targetLineIndex =
    activeRawLine.trim() && !activeLineParsed.isConverted
      ? activeLineIndex
      : firstUnconvertedIndex !== -1
      ? firstUnconvertedIndex
      : 0;

  const targetParsed: ParsedThought = useMemo(() => {
    const line = rawLines[targetLineIndex] || "";
    return parseThoughtLine(line, categories, habits);
  }, [rawLines, targetLineIndex, categories, habits]);

  // 4. Quick Action: Convert target line to Task with NLP metadata
  const handleCreateTaskFromNote = () => {
    if (!targetParsed.cleanTitle || targetParsed.isConverted) {
      toast.error("Write a quick thought first to convert to a task");
      return;
    }

    soundFX.playPop();
    soundFX.vibrate(20);

    if (onConvertToTask) {
      onConvertToTask({
        title: targetParsed.cleanTitle,
        priority: targetParsed.priority || "p2",
        date: targetParsed.dueDate,
        category: targetParsed.categoryName,
        categoryId: targetParsed.categoryId,
      });
    }

    // Strike out converted line
    const updated = markLineAsConverted(content, targetLineIndex);
    setContent(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, updated);
      } catch {}
    }

    toast.success(`Task Created: "${targetParsed.cleanTitle}"`, {
      description: targetParsed.dueDateLabel
        ? `Scheduled for ${targetParsed.dueDateLabel} • ${targetParsed.priority?.toUpperCase() || "P2"}`
        : `Priority: ${targetParsed.priority?.toUpperCase() || "P2"}`,
    });
  };

  // 5. Quick Action: Convert target line to Expense with NLP metadata
  const handleCreateExpenseFromNote = () => {
    const amount = targetParsed.amount || 0;
    if (amount <= 0 && !targetParsed.cleanTitle) {
      toast.error("Write an expense amount first (e.g. 'Coffee 150')");
      return;
    }

    soundFX.playCashRegister();
    soundFX.vibrate(25);

    if (onConvertToExpense) {
      onConvertToExpense({
        amount,
        note: targetParsed.cleanTitle || "Quick Expense",
        categoryId: targetParsed.categoryId,
        date: targetParsed.dueDate,
      });
    }

    // Strike out converted line
    const updated = markLineAsConverted(content, targetLineIndex);
    setContent(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, updated);
      } catch {}
    }

    toast.success(
      `Expense Logged: ${amount > 0 ? `₹${amount} for ` : ""}"${targetParsed.cleanTitle}"`,
      {
        description: targetParsed.categoryName
          ? `Categorized under ${targetParsed.categoryName}`
          : undefined,
      }
    );
  };

  // 6. Quick Action: Convert target line to Habit with NLP metadata
  const handleCreateHabitFromNote = () => {
    if (!targetParsed.cleanTitle && !targetParsed.habitName) {
      toast.error("Write a habit thought first (e.g. 'Drank 500ml water' or 'Workout done')");
      return;
    }

    soundFX.playCompleteChime();
    soundFX.vibrate(25);

    if (onConvertToHabit) {
      onConvertToHabit({
        habitId: targetParsed.habitId,
        title: targetParsed.habitName || targetParsed.cleanTitle,
        action: "complete",
        value: targetParsed.habitValue,
        unit: targetParsed.habitUnit,
        date: targetParsed.dueDate,
      });
    }

    // Strike out converted line
    const updated = markLineAsConverted(content, targetLineIndex);
    setContent(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, updated);
      } catch {}
    }

    toast.success(`⚡ Habit Logged: "${targetParsed.habitName || targetParsed.cleanTitle}"!`, {
      description: targetParsed.habitValue
        ? `Metric: +${targetParsed.habitValue}${targetParsed.habitUnit || ""}`
        : "Crushed for today!",
    });
  };

  // 7. Multi-line Batch Convert ("Convert All")
  const handleBatchConvertAll = () => {
    const eligibleLines = analysis.lines.filter(
      (l) => !l.isConverted && (l.cleanTitle || (l.amount && l.amount > 0) || l.habitName)
    );

    if (eligibleLines.length === 0) {
      toast.info("No active lines left to convert!");
      return;
    }

    const batchTasks: Array<{
      title: string;
      priority: ThoughtPriority;
      date?: string;
      category?: string;
      categoryId?: string;
    }> = [];

    const batchExpenses: Array<{
      amount: number;
      note: string;
      categoryId?: string;
      date?: string;
    }> = [];

    const batchHabits: Array<{
      habitId?: string;
      title: string;
      action?: "complete" | "progress";
      value?: number;
      unit?: string;
      date?: string;
    }> = [];

    eligibleLines.forEach((item) => {
      if (item.type === "expense" && item.amount && item.amount > 0) {
        batchExpenses.push({
          amount: item.amount,
          note: item.cleanTitle,
          categoryId: item.categoryId,
          date: item.dueDate,
        });
      } else if (item.type === "habit") {
        batchHabits.push({
          habitId: item.habitId,
          title: item.habitName || item.cleanTitle,
          action: "complete",
          value: item.habitValue,
          unit: item.habitUnit,
          date: item.dueDate,
        });
      } else {
        batchTasks.push({
          title: item.cleanTitle,
          priority: item.priority || "p2",
          date: item.dueDate,
          category: item.categoryName,
          categoryId: item.categoryId,
        });
      }
    });

    soundFX.playCashRegister();
    soundFX.vibrate([20, 40, 60]);

    if (onBatchConvert) {
      onBatchConvert(batchTasks, batchExpenses, batchHabits);
    } else {
      // Fallback: Dispatch individually if no batch handler
      batchTasks.forEach((t) => onConvertToTask?.(t));
      batchExpenses.forEach((e) => onConvertToExpense?.(e));
      batchHabits.forEach((h) => onConvertToHabit?.(h));
    }

    // Strike out all active lines
    let updatedContent = content;
    rawLines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (
        trimmed &&
        !/^~.*~/.test(trimmed) &&
        !/\(converted/i.test(trimmed)
      ) {
        updatedContent = markLineAsConverted(updatedContent, idx);
      }
    });

    setContent(updatedContent);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, updatedContent);
      } catch {}
    }

    const totalConverted = batchTasks.length + batchExpenses.length + batchHabits.length;
    toast.success(
      `Processed ${totalConverted} notes with AI!`,
      {
        description: `${batchTasks.length} task${batchTasks.length === 1 ? "" : "s"}, ${batchHabits.length} habit${batchHabits.length === 1 ? "" : "s"} & ${batchExpenses.length} expense${batchExpenses.length === 1 ? "" : "s"}.`,
      }
    );
  };

  // 8. Cleanup converted lines
  const handleClearConverted = () => {
    soundFX.playPop();
    const previousLineCount = content.split("\n").filter((l) => l.trim().length > 0).length;
    const cleaned = clearConvertedLines(content);
    const newLineCount = cleaned.split("\n").filter((l) => l.trim().length > 0).length;
    const cleared = Math.max(1, previousLineCount - newLineCount);
    setContent(cleaned);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, cleaned);
      } catch {}
    }
    toast.info(`Cleared ${cleared} completed scratchpad items 🧹`);
  };

  // 9. Clear full note
  const handleClearAll = () => {
    soundFX.playPop();
    const count = content.split("\n").filter((l) => l.trim().length > 0).length;
    setContent("");
    setIsSaved(true);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    toast.info(`Desk scratchpad cleared (${count} thought${count === 1 ? "" : "s"}) 🧹`);
  };

  const handleInsertExample = (example: string) => {
    soundFX.playPop();
    setContent((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n${example}` : example;
    });
    setIsSaved(false);
  };

  // Word statistics
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const eligibleItemCount = analysis.taskCount + analysis.expenseCount + analysis.habitCount;

  // Active micro badges for target line
  const hasMicroBadges =
    targetParsed.amount !== undefined ||
    targetParsed.categoryName !== undefined ||
    targetParsed.dueDateLabel !== undefined ||
    targetParsed.priority !== undefined ||
    targetParsed.type === "habit" ||
    targetParsed.habitName !== undefined;

  return (
    <div
      className={cn(
        "relative bg-[#FEF9C3] rounded-2xl border-2 border-[#161514] p-3.5 sm:p-4 shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000]",
        "transition-all duration-200 select-text flex flex-col justify-between",
        isCollapsed ? "min-h-0" : "min-h-[260px] sm:-rotate-1 hover:rotate-0",
        className
      )}
    >
      {/* Physical Washi Tape Strip Simulation at Top */}
      {!isCollapsed && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#E2E8F0]/95 border border-[#161514] rotate-2 shadow-xs rounded-sm pointer-events-none flex items-center justify-center">
          <span className="text-[9px] font-mono tracking-widest text-[#161514]/70 font-black uppercase">
            DESK SCRATCHPAD
          </span>
        </div>
      )}

      {/* Header bar with toggle */}
      <div className={cn("flex items-center justify-between", !isCollapsed && "border-b border-[#161514]/20 pb-2 pt-1")}>
        <button
          type="button"
          onClick={toggleCollapse}
          className="flex items-center gap-2 cursor-pointer group text-left active:scale-[0.98] transition-transform"
          title={isCollapsed ? "Expand scratchpad" : "Minimize scratchpad"}
        >
          <FileText className="size-4 stroke-[2.5] text-[#161514]" />
          <span className="font-heading font-black text-xs text-[#161514] uppercase tracking-wider">
            Natural AI Desk Note
          </span>
          {content && (
            <span className="text-[10px] font-mono text-[#161514]/70 font-bold tabular-nums">
              ({wordCount} words{eligibleItemCount > 0 ? ` • ${eligibleItemCount} ready` : ""})
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-3.5 text-[#161514]/60 group-hover:text-[#161514] transition-transform duration-200",
              !isCollapsed && "rotate-180"
            )}
          />
        </button>

        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <span className="text-[10px] font-mono text-[#161514]/60 font-bold">
              {isSaved ? "Saved ✦" : "Typing…"}
            </span>
          )}
          {content && !isCollapsed && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-1 rounded-md hover:bg-[#161514]/10 text-[#161514]/50 hover:text-rose-600 transition-colors cursor-pointer"
              title="Clear scratchpad"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
          {isCollapsed && (
            <button
              type="button"
              onClick={toggleCollapse}
              className="text-[10px] font-mono font-bold text-[#161514]/70 hover:text-[#161514] underline cursor-pointer"
            >
              Open Pad
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Ruled Writing Body */}
          <div className="flex-1 my-2 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onSelect={handleSelect}
              placeholder="Jot down anything in plain English... (e.g. 'Drank 500ml water', 'Coffee 120', 'Finish assignment tomorrow p1', '50 pushups done')"
              className={cn(
                "w-full h-full min-h-[120px] bg-transparent resize-none outline-none font-mono text-xs leading-6 text-[#161514]",
                "placeholder:text-[#161514]/40 font-medium"
              )}
              style={{
                backgroundImage:
                  "repeating-linear-gradient(transparent, transparent 23px, rgba(22, 21, 20, 0.12) 24px)",
                backgroundAttachment: "local",
                lineHeight: "24px",
              }}
            />
          </div>

          {/* Quick Example Jots Toggle */}
          <div className="mb-2">
            <button
              type="button"
              onClick={() => setShowExamples((prev) => !prev)}
              className="text-[9px] font-mono font-bold text-[#161514]/60 hover:text-[#161514] flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="size-2.5 text-amber-600" />
              <span>{showExamples ? "Hide AI Shortcuts" : "💡 Fast Jot Suggestions"}</span>
            </button>

            {showExamples && (
              <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                {QUICK_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => handleInsertExample(ex)}
                    className="px-2 py-0.5 rounded-md bg-white/80 hover:bg-white text-[#161514] text-[9px] font-mono font-bold border border-[#161514]/30 hover:border-[#161514] active:scale-95 transition-all cursor-pointer shadow-2xs"
                  >
                    + {ex}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reactive NLP Micro-Badges Tray (Detected tokens on current line) */}
          {hasMicroBadges && !targetParsed.isConverted && (
            <div className="mb-2.5 px-2 py-1.5 rounded-xl bg-white/70 border border-[#161514]/20 shadow-[1px_1px_0px_#161514]/20 flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-mono font-black uppercase text-[#161514]/50 flex items-center gap-0.5">
                <Sparkles className="size-2.5 text-amber-500" />
                Detected:
              </span>

              {/* Habit Badge */}
              {(targetParsed.type === "habit" || targetParsed.habitName) && (
                <span className="text-[10px] font-mono font-black text-[#161514] bg-[#03D26F] px-1.5 py-0.5 rounded-md border border-[#161514] shadow-[0.5px_0.5px_0px_#161514] flex items-center gap-1">
                  <Target className="size-2.5 text-[#161514]" />
                  <span>Habit: {targetParsed.habitName || targetParsed.cleanTitle}</span>
                  {targetParsed.habitValue ? (
                    <span className="font-bold opacity-80">
                      (+{targetParsed.habitValue}{targetParsed.habitUnit || ""})
                    </span>
                  ) : null}
                </span>
              )}

              {/* Amount Badge */}
              {targetParsed.amount !== undefined && (
                <span className="text-[10px] font-mono font-black text-[#161514] bg-[#CEF431] px-1.5 py-0.5 rounded-md border border-[#161514] shadow-[0.5px_0.5px_0px_#161514] flex items-center gap-1">
                  <Wallet className="size-2.5 text-[#161514]" />
                  <span className="tabular-nums">₹{targetParsed.amount}</span>
                </span>
              )}

              {/* Category Badge */}
              {targetParsed.categoryName && (
                <span className="text-[10px] font-mono font-bold text-[#161514] bg-[#FAF8F5] px-1.5 py-0.5 rounded-md border border-[#161514] shadow-[0.5px_0.5px_0px_#161514] flex items-center gap-1">
                  {targetParsed.categoryIcon ? <span>{targetParsed.categoryIcon}</span> : <Tag className="size-2.5 text-[#161514]" />}
                  <span>{targetParsed.categoryName}</span>
                </span>
              )}

              {/* Due Date Badge */}
              {targetParsed.dueDateLabel && (
                <span className="text-[10px] font-mono font-bold text-[#161514] bg-amber-200 px-1.5 py-0.5 rounded-md border border-[#161514] shadow-[0.5px_0.5px_0px_#161514] flex items-center gap-1">
                  <Calendar className="size-2.5 stroke-[2.5]" />
                  <span>{targetParsed.dueDateLabel}</span>
                </span>
              )}

              {/* Priority Badge */}
              {targetParsed.priority && (
                <span
                  className={cn(
                    "text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md border border-[#161514] shadow-[0.5px_0.5px_0px_#161514] flex items-center gap-0.5",
                    targetParsed.priority === "p1"
                      ? "bg-rose-300 text-rose-950"
                      : targetParsed.priority === "p2"
                      ? "bg-amber-300 text-amber-950"
                      : "bg-cyan-200 text-cyan-950"
                  )}
                >
                  <Zap className="size-2.5 stroke-[2.5]" />
                  <span>{targetParsed.priority.toUpperCase()}</span>
                </span>
              )}
            </div>
          )}

          {/* 1-Click Conversion Chips & Telemetry Bar */}
          <div className="pt-2 border-t border-[#161514]/20 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Primary Action Button dynamically tailored to targetParsed.type */}
              {targetParsed.type === "habit" ? (
                <button
                  type="button"
                  onClick={handleCreateHabitFromNote}
                  className="bg-[#03D26F] hover:bg-[#02b35e] text-[#161514] font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_#161514] active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
                  title="Log habit progress or completion"
                >
                  <Target className="size-3 stroke-[2.5]" />
                  <span>Log Habit ✓</span>
                </button>
              ) : targetParsed.type === "expense" ? (
                <button
                  type="button"
                  onClick={handleCreateExpenseFromNote}
                  className="bg-[#CEF431] hover:bg-[#bde422] text-[#161514] font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_#161514] active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
                  title="Convert line to Expense with parsed amount & category"
                >
                  <Wallet className="size-3 stroke-[2.5]" />
                  <span>To Expense 💸</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateTaskFromNote}
                  className="bg-white hover:bg-[#FAF8F5] text-[#161514] font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_#161514] active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
                  title="Convert line to Task with parsed date & priority"
                >
                  <CheckSquare className="size-3 stroke-[2.5]" />
                  <span>To Task 📋</span>
                </button>
              )}

              {/* Secondary Alternatives for User Flexibility */}
              {targetParsed.type !== "habit" && (
                <button
                  type="button"
                  onClick={handleCreateHabitFromNote}
                  className="bg-white/80 hover:bg-[#03D26F]/20 text-[#161514] font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg border border-[#161514]/40 hover:border-[#161514] active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
                  title="Force convert to Habit"
                >
                  <Target className="size-2.5" />
                  <span>Habit</span>
                </button>
              )}
              {targetParsed.type !== "task" && (
                <button
                  type="button"
                  onClick={handleCreateTaskFromNote}
                  className="bg-white/80 hover:bg-slate-100 text-[#161514] font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg border border-[#161514]/40 hover:border-[#161514] active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
                  title="Force convert to Task"
                >
                  <CheckSquare className="size-2.5" />
                  <span>Task</span>
                </button>
              )}
              {targetParsed.type !== "expense" && (
                <button
                  type="button"
                  onClick={handleCreateExpenseFromNote}
                  className="bg-white/80 hover:bg-[#CEF431]/30 text-[#161514] font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg border border-[#161514]/40 hover:border-[#161514] active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
                  title="Force convert to Expense"
                >
                  <Wallet className="size-2.5" />
                  <span>Expense</span>
                </button>
              )}

              {/* ⚡ Convert All Button (When multiple lines exist) */}
              {eligibleItemCount > 1 && (
                <button
                  type="button"
                  onClick={handleBatchConvertAll}
                  className="bg-[#C084FC] hover:bg-[#A855F7] text-[#161514] font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_#161514] active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
                  title={`Batch convert ${eligibleItemCount} thoughts into tasks, habits & expenses`}
                >
                  <Zap className="size-3 stroke-[3]" />
                  <span>Convert All (<span className="tabular-nums font-mono">{eligibleItemCount}</span>)</span>
                </button>
              )}
            </div>

            {/* Footer Right: Telemetry & Converted Cleanup */}
            <div className="flex items-center gap-2">
              {analysis.convertedCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearConverted}
                  className="text-[9px] font-mono text-[#161514]/60 hover:text-rose-600 font-bold underline cursor-pointer"
                  title="Remove converted / struck-out lines"
                >
                  Clear converted (<span className="tabular-nums">{analysis.convertedCount}</span>)
                </button>
              )}

              <span className="text-[10px] font-mono text-[#161514]/50 font-bold">
                <span className="tabular-nums">{wordCount}</span> words
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
