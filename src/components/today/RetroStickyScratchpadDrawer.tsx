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
  Tag,
  X,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface RetroStickyScratchpadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

const STORAGE_KEY = "invictus_sticky_scratchpad";

export function RetroStickyScratchpadDrawer({
  open,
  onOpenChange,
  categories = [],
  onConvertToTask,
  onConvertToExpense,
  onBatchConvert,
}: RetroStickyScratchpadDrawerProps) {
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

  // 2. Global Cmd+J / Ctrl+J Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        soundFX.playPop();
        onOpenChange(!open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Focus textarea when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [open]);

  // 3. Debounced auto-save (300ms)
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

  // 4. NLP AST Parsing
  const analysis = useMemo(() => {
    return parseScratchpad(content, categories);
  }, [content, categories]);

  const activeLinesCount = useMemo(() => {
    return analysis.lines.filter(
      (l) => !l.isConverted && (l.cleanTitle || (l.amount && l.amount > 0))
    ).length;
  }, [analysis]);

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

  // 5. Quick Actions
  const handleCreateTaskFromNote = () => {
    if (!targetParsed.cleanTitle || targetParsed.isConverted) {
      toast.error("Write a thought first to convert to a task");
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

    const updated = markLineAsConverted(content, targetLineIndex);
    setContent(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, updated);
      } catch {}
    }

    toast.success(`Task Created: "${targetParsed.cleanTitle}"`);
  };

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

    const updated = markLineAsConverted(content, targetLineIndex);
    setContent(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, updated);
      } catch {}
    }

    toast.success(`Expense Logged: ₹${amount} "${targetParsed.cleanTitle}"`);
  };

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
      batchTasks.forEach((t) => onConvertToTask?.(t));
      batchExpenses.forEach((e) => onConvertToExpense?.(e));
    }

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

    toast.success(`Conquered ${batchTasks.length + batchExpenses.length} items!`);
  };

  const handleClearConverted = () => {
    soundFX.playPop();
    const cleaned = clearConvertedLines(content);
    setContent(cleaned);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, cleaned);
      } catch {}
    }
    toast.info("Cleared completed lines");
  };

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

  return (
    <>
      {/* 1. Persistent Floating Action Dock Button (Anchored above mobile BottomNav) */}
      <button
        type="button"
        onClick={() => {
          soundFX.playPop();
          onOpenChange(true);
        }}
        className={cn(
          "fixed right-4 sm:right-6 z-40",
          "bottom-[calc(7.75rem+env(safe-area-inset-bottom,0px))] lg:bottom-6",
          "bg-white dark:bg-[#161514] hover:bg-[#FAF8F5] dark:hover:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#2A2724]",
          "size-11 sm:size-auto sm:px-3.5 sm:py-2.5 rounded-xl shadow-xs",
          "active:scale-95 flex items-center justify-center sm:gap-2",
          "font-heading font-bold text-xs cursor-pointer transition-all select-none"
        )}
        aria-label="Open Scratchpad (Cmd+J)"
        title="Open Scratchpad (Cmd+J)"
      >
        <div className="size-6 rounded-md bg-[#F1EFEA] dark:bg-[#252220] flex items-center justify-center shrink-0">
          <FileText className="size-4 text-[#161514] dark:text-[#FAF8F5] stroke-[2]" />
        </div>
        <span className="hidden sm:inline">Scratchpad</span>
        <kbd className="hidden sm:inline-block font-mono text-[10px] bg-[#F1EFEA] dark:bg-[#252220] border border-[#E8E5DF] dark:border-[#2A2724] px-1.5 py-0.5 rounded text-[#161514] dark:text-[#FAF8F5]">
          ⌘J
        </kbd>
        {activeLinesCount > 0 && (
          <span className="size-2 rounded-full bg-[#03D26F] animate-pulse" />
        )}
      </button>

      {/* 2. Slide-Over Sheet (Right Side) */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="bg-white dark:bg-[#161514] border-l border-[#E8E5DF] dark:border-[#2A2724] shadow-2xl w-full sm:max-w-md md:max-w-lg p-4 sm:p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] flex flex-col justify-between text-[#161514] dark:text-[#FAF8F5] space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E8E5DF] dark:border-[#2A2724] pb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-[#F1EFEA] dark:bg-[#252220] flex items-center justify-center text-[#161514] dark:text-[#FAF8F5]">
                <FileText className="size-4 stroke-[1.5]" />
              </div>
              <div>
                <SheetTitle className="font-heading font-black text-base text-[#161514] dark:text-[#FAF8F5] tracking-tight">
                  Desk Scratchpad
                </SheetTitle>
                <div className="flex items-center gap-2 text-xs font-mono text-[#6B6B6B] dark:text-[#FAF8F5]/60">
                  <span>{isSaved ? "Saved" : "Saving..."}</span>
                  <span>•</span>
                  <span>{activeLinesCount} active lines</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {analysis.convertedCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearConverted}
                  className="p-1.5 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#252220] hover:bg-[#FAF8F5] dark:hover:bg-[#2e2a28] text-xs font-mono font-medium text-[#161514] dark:text-[#FAF8F5]"
                  title="Clear converted items"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="bg-white dark:bg-[#252220] hover:bg-[#FAF8F5] dark:hover:bg-[#2e2a28] text-[#161514] dark:text-[#FAF8F5] p-1.5 rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] active:translate-y-px transition-colors cursor-pointer"
                aria-label="Close scratchpad"
              >
                <X className="size-4 stroke-[1.5]" />
              </button>
            </div>
          </div>

          {/* Body: Ruled Writing Surface */}
          <div className="flex-1 min-h-0 flex flex-col space-y-3">
            {/* Quick NLP Syntax Hint Bar */}
            <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-xl p-2.5 border border-[#E8E5DF] dark:border-[#2A2724] flex items-center gap-2 text-[11px] font-mono text-[#161514]/80 dark:text-[#FAF8F5]/70">
              <Sparkles className="size-3.5 text-amber-500 shrink-0" />
              <span className="truncate">
                Auto-Detect: &ldquo;Study p1&rdquo; (Priority) • &ldquo;Chai 60&rdquo; (Expense) • &ldquo;Gym tomorrow&rdquo;
              </span>
            </div>

            <div className="flex-1 bg-[#FBF9F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl p-3 flex flex-col">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleChange}
                onSelect={handleSelect}
                placeholder="Jot down quick thoughts...&#10;Finish chem problem tomorrow p1&#10;Chai with team 60"
                className="w-full flex-1 bg-transparent border-none resize-none focus:outline-none text-xs sm:text-sm font-mono text-[#161514] dark:text-[#FAF8F5] placeholder-[#6B6B6B]/60 dark:placeholder-[#FAF8F5]/40 leading-relaxed"
              />

              {/* Starter Ideas if Scratchpad is empty */}
              {!content.trim() && (
                <div className="pt-2 border-t border-[#E8E5DF]/70 dark:border-[#2A2724] flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#FAF8F5]/50 uppercase tracking-wider">
                    Quick-start templates:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Finish chem problem tomorrow p1",
                      "Chai with team 60",
                      "Review 10 flashcards 7pm",
                    ].map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => {
                          soundFX.playPop();
                          setContent(sample);
                          setIsSaved(false);
                        }}
                        className="px-2 py-1 rounded-md bg-white dark:bg-[#252220] border border-[#E8E5DF] dark:border-[#2A2724] text-[10px] font-mono text-[#161514] dark:text-[#FAF8F5] hover:bg-[#FAF8F5] dark:hover:bg-[#2e2a28] cursor-pointer transition-all shadow-xs"
                      >
                        + {sample}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Target Line NLP Indicator */}
              {targetParsed.cleanTitle && !targetParsed.isConverted && (
                <div className="mt-2 pt-2 border-t border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[#6B6B6B] dark:text-[#FAF8F5]/60">Selected:</span>
                    <span className="font-bold text-[#161514] dark:text-[#FAF8F5] truncate">
                      {targetParsed.cleanTitle}
                    </span>
                    {targetParsed.amount && (
                      <span className="bg-[#DCFAE5] dark:bg-emerald-950/60 text-[#04250e] dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold text-xs border border-emerald-400/40">
                        ₹{targetParsed.amount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={handleCreateTaskFromNote}
                      className="min-h-[30px] px-2.5 py-1 rounded-md bg-[#161514] dark:bg-white text-white dark:text-[#161514] hover:bg-[#252321] dark:hover:bg-neutral-100 font-bold text-xs transition-colors cursor-pointer active:translate-y-px shadow-xs"
                      title="Convert to Task"
                    >
                      + Task
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateExpenseFromNote}
                      className="min-h-[30px] px-2.5 py-1 rounded-md border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#252220] text-[#161514] dark:text-[#FAF8F5] hover:bg-[#FAF8F5] dark:hover:bg-[#2e2a28] font-bold text-xs transition-colors cursor-pointer active:translate-y-px shadow-xs"
                      title="Convert to Expense"
                    >
                      + Expense
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Batch Conversion Footer Bar */}
            {activeLinesCount > 1 && (
              <button
                type="button"
                onClick={handleBatchConvertAll}
                className="w-full min-h-[40px] bg-[#03D26F] hover:bg-[#02B860] active:translate-y-px rounded-xl font-bold text-xs text-[#161514] flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <CheckCheck className="size-4 stroke-[2]" />
                <span>
                  Convert All ({analysis.taskCount} Tasks, {analysis.expenseCount} Expenses)
                </span>
              </button>
            )}
          </div>

          {/* Footer Metadata & Clear */}
          <div className="flex items-center justify-between text-xs font-mono text-[#6B6B6B] dark:text-[#FAF8F5]/60 pt-2 border-t border-[#E8E5DF] dark:border-[#2A2724] shrink-0">
            <span>Shortcut: Press ⌘J anywhere</span>
            {content && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer font-bold text-xs"
              >
                Clear all notes
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
