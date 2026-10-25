"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FileText,
  Trash2,
  Wallet,
  CheckSquare,
  Sparkles,
  Zap,
  Calendar,
  CheckCheck,
  RotateCcw,
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
import { type Category } from "@/types";

interface RetroStickyScratchpadProps {
  categories?: Category[];
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
    }>
  ) => void;
  className?: string;
}

const STORAGE_KEY = "invictus_sticky_scratchpad";

export function RetroStickyScratchpad({
  categories = [],
  onConvertToTask,
  onConvertToExpense,
  onBatchConvert,
  className,
}: RetroStickyScratchpadProps) {
  const [content, setContent] = useState<string>("");
  const [isSaved, setIsSaved] = useState(true);
  const [cursorIndex, setCursorIndex] = useState<number>(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 1. Hydrate from localStorage safely on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setContent(saved);
      } catch {}
    }
  }, []);

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
    return parseScratchpad(content, categories);
  }, [content, categories]);

  // Determine active line index based on cursor position
  const activeLineIndex = useMemo(() => {
    if (!content) return 0;
    const textBeforeCursor = content.slice(0, cursorIndex);
    return textBeforeCursor.split("\n").length - 1;
  }, [content, cursorIndex]);

  const rawLines = useMemo(() => content.split("\n"), [content]);
  const activeRawLine = rawLines[activeLineIndex] || rawLines[0] || "";

  const activeLineParsed: ParsedThought = useMemo(() => {
    return parseThoughtLine(activeRawLine, categories);
  }, [activeRawLine, categories]);

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
    return parseThoughtLine(line, categories);
  }, [rawLines, targetLineIndex, categories]);

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

  // 6. Multi-line Batch Convert ("Convert All")
  const handleBatchConvertAll = () => {
    const eligibleLines = analysis.lines.filter(
      (l) => !l.isConverted && (l.cleanTitle || (l.amount && l.amount > 0))
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

    eligibleLines.forEach((item) => {
      if (item.type === "expense" && item.amount && item.amount > 0) {
        batchExpenses.push({
          amount: item.amount,
          note: item.cleanTitle,
          categoryId: item.categoryId,
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
      onBatchConvert(batchTasks, batchExpenses);
    } else {
      // Fallback: Dispatch individually if no batch handler
      batchTasks.forEach((t) => onConvertToTask?.(t));
      batchExpenses.forEach((e) => onConvertToExpense?.(e));
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

    toast.success(
      `Conquered ${batchTasks.length + batchExpenses.length} items! ⚡`,
      {
        description: `${batchTasks.length} task${batchTasks.length === 1 ? "" : "s"} & ${batchExpenses.length} expense${batchExpenses.length === 1 ? "" : "s"} recorded.`,
      }
    );
  };

  // 7. Cleanup converted lines
  const handleClearConverted = () => {
    soundFX.playPop();
    const cleaned = clearConvertedLines(content);
    setContent(cleaned);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, cleaned);
      } catch {}
    }
    toast.info("Cleared completed scratchpad notes");
  };

  // 8. Clear full note
  const handleClearAll = () => {
    soundFX.playPop();
    setContent("");
    setIsSaved(true);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    toast.info("Scratchpad cleared");
  };

  // Word statistics
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const eligibleItemCount = analysis.taskCount + analysis.expenseCount;

  // Active micro badges for target line
  const hasMicroBadges =
    targetParsed.amount !== undefined ||
    targetParsed.categoryName !== undefined ||
    targetParsed.dueDateLabel !== undefined ||
    targetParsed.priority !== undefined;

  return (
    <div
      className={cn(
        "relative bg-[#FEF9C3] rounded-2xl border-2 border-[#161514] p-4 sm:p-5 shadow-[4px_4px_0px_0px_#161514]",
        "sm:-rotate-1 hover:rotate-0 transition-transform duration-200 select-text flex flex-col justify-between",
        "min-h-[280px]",
        className
      )}
    >
      {/* Physical Washi Tape Strip Simulation at Top */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#E2E8F0]/90 border border-[#161514] rotate-2 shadow-sm rounded-sm pointer-events-none flex items-center justify-center">
        <span className="text-[9px] font-mono tracking-widest text-[#161514]/60 font-black uppercase">
          SCRATCHPAD
        </span>
      </div>

      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#161514]/20 pb-2 pt-1">
        <div className="flex items-center gap-1.5">
          <FileText className="size-4 stroke-[2.5] text-[#161514]" />
          <span className="font-heading font-black text-xs text-[#161514] uppercase tracking-wider">
            Quick Sticky Note
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#161514]/60 font-bold">
            {isSaved ? "Saved ✦" : "Typing…"}
          </span>
          {content && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-1 rounded-md hover:bg-[#161514]/10 text-[#161514]/50 hover:text-rose-600 transition-colors cursor-pointer"
              title="Clear scratchpad"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Ruled Ruled Writing Body */}
      <div className="flex-1 my-2 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onSelect={handleSelect}
          placeholder="Jot down in natural language... (e.g. 'Coffee 150 with Alex tomorrow p1' or 'Finish Lab on Friday')"
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

      {/* Reactive NLP Micro-Badges Tray (Detected tokens on current line) */}
      {hasMicroBadges && !targetParsed.isConverted && (
        <div className="mb-2.5 px-2 py-1.5 rounded-xl bg-white/70 border border-[#161514]/20 shadow-[1px_1px_0px_#161514]/20 flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-mono font-black uppercase text-[#161514]/50 flex items-center gap-0.5">
            <Sparkles className="size-2.5 text-amber-500" />
            Detected:
          </span>

          {/* Amount Badge */}
          {targetParsed.amount !== undefined && (
            <span className="text-[10px] font-mono font-black text-[#161514] bg-[#CEF431] px-1.5 py-0.5 rounded-md border border-[#161514] shadow-[0.5px_0.5px_0px_#161514]">
              💰 ₹{targetParsed.amount}
            </span>
          )}

          {/* Category Badge */}
          {targetParsed.categoryName && (
            <span className="text-[10px] font-mono font-bold text-[#161514] bg-[#FAF8F5] px-1.5 py-0.5 rounded-md border border-[#161514] shadow-[0.5px_0.5px_0px_#161514] flex items-center gap-1">
              <span>{targetParsed.categoryIcon || "🏷️"}</span>
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
          {/* Convert to Task */}
          <button
            type="button"
            onClick={handleCreateTaskFromNote}
            className="bg-white hover:bg-[#FAF8F5] text-[#161514] font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_#161514] active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
            title="Convert line to Task with parsed date & priority"
          >
            <CheckSquare className="size-3 stroke-[2.5]" />
            <span>To Task</span>
          </button>

          {/* Convert to Expense */}
          <button
            type="button"
            onClick={handleCreateExpenseFromNote}
            className="bg-[#CEF431] hover:bg-[#bde422] text-[#161514] font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_#161514] active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
            title="Convert line to Expense with parsed amount & category"
          >
            <Wallet className="size-3 stroke-[2.5]" />
            <span>To Expense</span>
          </button>

          {/* ⚡ Convert All Button (When multiple lines exist) */}
          {eligibleItemCount > 1 && (
            <button
              type="button"
              onClick={handleBatchConvertAll}
              className="bg-[#C084FC] hover:bg-[#A855F7] text-[#161514] font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_#161514] active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
              title={`Batch convert ${eligibleItemCount} thoughts into tasks & expenses`}
            >
              <Zap className="size-3 stroke-[3]" />
              <span>Convert All ({eligibleItemCount})</span>
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
              Clear converted ({analysis.convertedCount})
            </button>
          )}

          <span className="text-[10px] font-mono text-[#161514]/50 font-bold">
            {wordCount} words
          </span>
        </div>
      </div>
    </div>
  );
}
