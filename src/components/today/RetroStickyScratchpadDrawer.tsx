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
          "bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] lg:bottom-6",
          "bg-[#FAF8F5] hover:bg-white text-[#161514] border-2 border-[#161514]",
          "px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl shadow-[3px_3px_0px_#161514]",
          "active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2",
          "font-heading font-black text-xs cursor-pointer transition-all select-none"
        )}
        aria-label="Open Scratchpad (Cmd+J)"
        title="Open Scratchpad (Cmd+J)"
      >
        <div className="size-5 rounded-md bg-[#FFB800] border border-[#161514] flex items-center justify-center shrink-0">
          <FileText className="size-3 text-[#161514] stroke-[2.5]" />
        </div>
        <span>Scratchpad</span>
        <kbd className="hidden sm:inline-block font-mono text-[9px] bg-[#F1EFEA] border border-[#161514] px-1 py-0.2 rounded text-[#161514]/80">
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
          className="bg-[#FAF8F5] border-l-2 border-[#161514] shadow-[-6px_0px_0px_0px_#161514] w-full sm:max-w-md md:max-w-lg p-4 sm:p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] flex flex-col justify-between text-[#161514] space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-[#161514]/15 pb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-[#FFB800] border-2 border-[#161514] flex items-center justify-center shadow-[1.5px_1.5px_0px_#161514]">
                <FileText className="size-4 text-[#161514] stroke-[2.5]" />
              </div>
              <div>
                <SheetTitle className="font-heading font-black text-sm sm:text-base text-[#161514] tracking-tight">
                  Desk Scratchpad
                </SheetTitle>
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#161514]/70">
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
                  className="p-1.5 rounded-lg border border-[#161514] bg-white hover:bg-[#F3EFEA] text-[10px] font-mono font-bold text-[#161514]"
                  title="Clear converted items"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="bg-white hover:bg-rose-100 text-[#161514] p-1.5 rounded-lg border-2 border-[#161514] shadow-[1.5px_1.5px_0px_#161514] active:scale-95 transition-all cursor-pointer"
                aria-label="Close scratchpad"
              >
                <X className="size-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Body: Ruled Writing Surface */}
          <div className="flex-1 min-h-0 flex flex-col space-y-3">
            <div className="flex-1 bg-white border-2 border-[#161514] rounded-xl p-3 shadow-[2px_2px_0px_#161514] flex flex-col">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleChange}
                onSelect={handleSelect}
                placeholder="Jot down quick thoughts...&#10;Finish chem problem tomorrow p1&#10;Chai with team 60"
                className="w-full flex-1 bg-transparent border-none resize-none focus:outline-none text-xs sm:text-sm font-mono text-[#161514] placeholder-[#161514]/35 leading-relaxed"
              />

              {/* Live Target Line NLP Indicator */}
              {targetParsed.cleanTitle && !targetParsed.isConverted && (
                <div className="mt-2 pt-2 border-t border-[#161514]/15 flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-[#161514]/60">Selected:</span>
                    <span className="font-black text-[#161514] truncate">
                      {targetParsed.cleanTitle}
                    </span>
                    {targetParsed.amount && (
                      <span className="bg-[#03D26F] text-[#161514] px-1 py-0.2 rounded font-black text-[10px]">
                        ₹{targetParsed.amount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={handleCreateTaskFromNote}
                      className="min-h-[34px] px-2.5 py-1 rounded-lg border-2 border-[#161514] bg-[#CEF431] font-heading font-black text-xs hover:bg-[#D8F74E] active:scale-95 shadow-[1px_1px_0px_#161514] transition-all cursor-pointer"
                      title="Convert to Task"
                    >
                      + Task
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateExpenseFromNote}
                      className="min-h-[34px] px-2.5 py-1 rounded-lg border-2 border-[#161514] bg-white font-heading font-black text-xs hover:bg-[#F3EFEA] active:scale-95 shadow-[1px_1px_0px_#161514] transition-all cursor-pointer"
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
                className="w-full min-h-[40px] bg-[#03D26F] hover:bg-[#02B860] active:translate-x-0.5 active:translate-y-0.5 border-2 border-[#161514] rounded-xl font-heading font-black text-xs text-[#161514] shadow-[2.5px_2.5px_0px_#161514] flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <CheckCheck className="size-4 text-[#161514] stroke-[2.5]" />
                <span>
                  Convert All ({analysis.taskCount} Tasks, {analysis.expenseCount} Expenses)
                </span>
              </button>
            )}
          </div>

          {/* Footer Metadata & Clear */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#161514]/65 pt-2 border-t border-[#161514]/15 shrink-0">
            <span>Shortcut: Press ⌘J anywhere</span>
            {content && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-rose-600 hover:underline cursor-pointer font-bold text-[10px]"
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
