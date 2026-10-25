"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Kanban,
  Check,
  ArrowRight,
  ShieldCheck,
  FileText,
  Trash2,
  Wallet,
  CheckSquare,
  Sparkles,
  Zap,
  RotateCcw,
  CheckCheck,
  Calendar,
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
import { type TaskItem, type Category } from "@/types";

interface ExecutionCaptureCardProps {
  tasks: TaskItem[];
  selectedDate: string;
  onCompleteTask: (taskId: string, title: string) => void;
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

export function ExecutionCaptureCard({
  tasks,
  selectedDate,
  onCompleteTask,
  categories = [],
  onConvertToTask,
  onConvertToExpense,
  onBatchConvert,
  className,
}: ExecutionCaptureCardProps) {
  // Active Tab state: 'tasks' | 'scratchpad'
  const [activeTab, setActiveTab] = useState<"tasks" | "scratchpad">("tasks");

  // Scratchpad state
  const [content, setContent] = useState<string>("");
  const [isSaved, setIsSaved] = useState(true);
  const [cursorIndex, setCursorIndex] = useState<number>(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 1. Hydrate scratchpad from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setContent(saved);
      } catch {}
    }
  }, []);

  // 2. Debounced auto-save (300ms)
  const handleScratchpadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  // 3. Filter priority tasks
  const priorityTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (t.status === "completed") return false;
        if (t.dueDate === selectedDate) return true;
        if (t.priority === "p1" || t.priority === "p2") return true;
        return false;
      })
      .slice(0, 5);
  }, [tasks, selectedDate]);

  // 4. Scratchpad NLP Parsing
  const analysis = useMemo(() => {
    return parseScratchpad(content, categories);
  }, [content, categories]);

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

  // Convert single line to task
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

  // Convert single line to expense
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

    toast.success(
      `Expense Logged: ${amount > 0 ? `₹${amount} for ` : ""}"${targetParsed.cleanTitle}"`
    );
  };

  // Multi-line Batch Convert
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

    // Strike out all active lines
    let updated = content;
    rawLines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (
        trimmed &&
        !/^~.*~/.test(trimmed) &&
        !/\(converted/i.test(trimmed)
      ) {
        updated = markLineAsConverted(updated, idx);
      }
    });

    setContent(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, updated);
      } catch {}
    }

    toast.success(
      `⚡ Batch Converted: ${batchTasks.length} tasks + ${batchExpenses.length} expenses!`
    );
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
    toast.success("Cleared converted scratchpad lines!");
  };

  const handleResetScratchpad = () => {
    if (!content.trim()) return;
    if (window.confirm("Clear the entire scratchpad?")) {
      soundFX.playPop();
      setContent("");
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
      }
      toast.success("Scratchpad cleared.");
    }
  };

  const activeItemCount = analysis.taskCount + analysis.expenseCount;
  const hasScratchpadThoughts = activeItemCount > 0;

  return (
    <div
      id="execution-hub-section"
      className={cn(
        "bg-white border-2 border-[#161514] p-4 sm:p-5 rounded-2xl shadow-[3px_3px_0px_#161514] flex flex-col justify-between min-h-[440px] space-y-4",
        className
      )}
    >
      {/* 1. Header with Segmented Pill Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#161514]/15 pb-3">
        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-[#F1EFEA] rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_#161514]">
          {/* Priority Tasks Tab */}
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setActiveTab("tasks");
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-heading font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer",
              activeTab === "tasks"
                ? "bg-[#FFB800] text-[#161514] border border-[#161514] shadow-[1px_1px_0px_#161514]"
                : "text-[#161514]/65 hover:text-[#161514]"
            )}
          >
            <Kanban className="size-3.5 stroke-[2.5]" />
            <span>Priority Queue</span>
            {priorityTasks.length > 0 && (
              <span className="size-4 rounded-full bg-[#161514] text-white text-[9px] font-mono font-bold flex items-center justify-center">
                {priorityTasks.length}
              </span>
            )}
          </button>

          {/* Retro Scratchpad Tab */}
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setActiveTab("scratchpad");
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-heading font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer relative",
              activeTab === "scratchpad"
                ? "bg-[#CEF431] text-[#161514] border border-[#161514] shadow-[1px_1px_0px_#161514]"
                : "text-[#161514]/65 hover:text-[#161514]"
            )}
          >
            <FileText className="size-3.5 stroke-[2.5]" />
            <span>Scratchpad</span>
            {hasScratchpadThoughts && (
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Tab-Specific Top Right Actions */}
        {activeTab === "tasks" ? (
          <Link
            href="/tasks"
            className="text-xs font-heading font-black text-[#161514] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>All Tasks</span>
            <ArrowRight className="size-3.5" />
          </Link>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0">
            {analysis.convertedCount > 0 && (
              <button
                type="button"
                onClick={handleClearConverted}
                className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-[#FAF8F5] hover:bg-neutral-200 border border-[#161514] text-[#161514] transition-colors cursor-pointer"
                title="Remove crossed-out converted lines"
              >
                Clear Done ({analysis.convertedCount})
              </button>
            )}
            {activeItemCount > 1 && (
              <button
                type="button"
                onClick={handleBatchConvertAll}
                className="text-[10px] font-heading font-black px-2 py-1 rounded bg-[#CEF431] hover:bg-[#D8F74E] border border-[#161514] shadow-[1px_1px_0px_#161514] text-[#161514] flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                title="Convert all lines at once"
              >
                <Zap className="size-3" />
                <span>Batch All</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Main Tab Body */}
      <div className="flex-1">
        {activeTab === "tasks" ? (
          /* Tab 1: Priority Battle Queue */
          <div className="space-y-2.5">
            {priorityTasks.length === 0 ? (
              <div className="p-8 text-center space-y-2 bg-[#FBF9F5] border-2 border-dashed border-[#161514]/25 rounded-xl">
                <div className="size-10 rounded-full bg-[#03D26F]/20 border-2 border-[#161514] flex items-center justify-center mx-auto text-[#03D26F]">
                  <ShieldCheck className="size-5 text-[#161514]" />
                </div>
                <p className="font-heading font-black text-sm text-[#161514]">
                  Battlefield Clear!
                </p>
                <p className="text-xs text-[#161514]/65">
                  No urgent or high-priority targets pending for today.
                </p>
              </div>
            ) : (
              priorityTasks.map((task) => {
                const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
                const totalSubtasks = task.subtasks?.length || 0;

                return (
                  <div
                    key={task.id}
                    className="p-3 bg-[#FAF8F5] border-2 border-[#161514] rounded-xl shadow-[2px_2px_0px_#161514] flex items-center justify-between gap-3 hover:-translate-x-0.5 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Ergonomic 44px Checkbox Envelope */}
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playPop();
                          soundFX.vibrate(15);
                          onCompleteTask(task.id, task.title);
                        }}
                        className="size-7 rounded-md border-2 border-[#161514] bg-white hover:bg-emerald-100 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform"
                        aria-label={`Complete task: ${task.title}`}
                      >
                        <Check className="size-4 stroke-[3] opacity-0 hover:opacity-100 transition-opacity" />
                      </button>

                      <div className="min-w-0">
                        <p className="font-heading font-black text-xs text-[#161514] truncate">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={cn(
                              "text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded border border-[#161514]",
                              task.priority === "p1"
                                ? "bg-[#FF4343] text-white"
                                : "bg-[#FFB800] text-[#161514]"
                            )}
                          >
                            {task.priority.toUpperCase()}
                          </span>
                          {task.projectTag && (
                            <span className="text-[10px] text-[#161514]/65 font-bold">
                              #{task.projectTag}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {totalSubtasks > 0 && (
                      <span className="text-[10px] font-mono font-bold bg-[#F1EFEA] border border-[#161514]/30 px-1.5 py-0.5 rounded shrink-0">
                        {completedSubtasks}/{totalSubtasks}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Tab 2: Retro Sticky Scratchpad */
          <div className="space-y-3">
            {/* Tactile Yellow Sticky Notepad */}
            <div className="relative rounded-xl border-2 border-[#161514] bg-[#FEFCE8] p-3 shadow-[2px_2px_0px_#161514]">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleScratchpadChange}
                onSelect={handleSelect}
                placeholder={`Jot anything down...\n• Gym at 6pm !p1\n• Coffee 150 #food\n• Finish chemistry notes @tomorrow`}
                className="w-full h-32 bg-transparent text-xs font-mono font-semibold text-[#161514] placeholder:text-[#161514]/40 focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />

              <div className="flex items-center justify-between pt-1 border-t border-[#161514]/15 text-[10px] font-mono text-[#161514]/60">
                <span>{isSaved ? "Auto-saved" : "Saving..."}</span>
                <span>{activeItemCount} active thoughts</span>
              </div>
            </div>

            {/* Smart NLP Action Bar */}
            {targetParsed.cleanTitle && !targetParsed.isConverted && (
              <div className="bg-[#FAF8F5] border-2 border-[#161514] rounded-xl p-2.5 shadow-[2px_2px_0px_#161514] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-mono font-bold text-[#161514]/70 truncate">
                    Target: &ldquo;{targetParsed.cleanTitle}&rdquo;
                  </span>
                  {targetParsed.priority && (
                    <span className="text-[9px] font-mono font-black uppercase px-1 py-0.2 rounded bg-[#FFB800] border border-[#161514]">
                      {targetParsed.priority.toUpperCase()}
                    </span>
                  )}
                  {targetParsed.amount ? (
                    <span className="text-[9px] font-mono font-black px-1 py-0.2 rounded bg-[#CEF431] border border-[#161514]">
                      ₹{targetParsed.amount}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCreateTaskFromNote}
                    className="px-2 py-1 bg-[#161514] hover:bg-neutral-800 text-white rounded-lg text-[10px] font-heading font-black flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                  >
                    <CheckSquare className="size-3" />
                    <span>+ Task</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateExpenseFromNote}
                    className="px-2 py-1 bg-[#03D26F] hover:bg-emerald-400 text-[#161514] border border-[#161514] rounded-lg text-[10px] font-heading font-black flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                  >
                    <Wallet className="size-3" />
                    <span>+ Expense</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Footer Helper */}
      <div className="pt-2 border-t border-[#161514]/15 flex items-center justify-between text-xs">
        <span className="text-[#161514]/60 font-medium">
          {activeTab === "tasks"
            ? "Tactile checkboxes sync with tasks database"
            : "NLP parses priority (!p1), cost (150), dates (@tomorrow)"}
        </span>
        {activeTab === "tasks" ? (
          <Link
            href="/tasks"
            className="font-heading font-black text-[#161514] hover:underline flex items-center gap-1"
          >
            <span>Tasks Hub</span>
            <ArrowRight className="size-3.5" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleResetScratchpad}
            className="text-[11px] font-mono font-semibold text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="size-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
