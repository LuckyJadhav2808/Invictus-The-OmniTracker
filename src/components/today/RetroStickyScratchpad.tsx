"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Plus,
  CheckCircle2,
  Trash2,
  Sparkles,
  ArrowRight,
  Wallet,
  CheckSquare,
  Copy,
} from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RetroStickyScratchpadProps {
  onConvertToTask?: (text: string) => void;
  onConvertToExpense?: (amount: number, note: string) => void;
  className?: string;
}

const STORAGE_KEY = "invictus_sticky_scratchpad";

export function RetroStickyScratchpad({
  onConvertToTask,
  onConvertToExpense,
  className,
}: RetroStickyScratchpadProps) {
  const [content, setContent] = useState<string>("");
  const [isSaved, setIsSaved] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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

  // 3. Quick Action: Convert selected/first line to Task
  const handleCreateTaskFromNote = () => {
    const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast.error("Write a quick thought first to convert to a task");
      return;
    }
    const taskTitle = lines[0].replace(/^[-*•]\s*/, "");
    soundFX.playPop();
    soundFX.vibrate(20);
    if (onConvertToTask) {
      onConvertToTask(taskTitle);
    }
    toast.success(`Task Created: "${taskTitle}"`);
  };

  // 4. Quick Action: Parse expense from note (e.g. "Coffee 150" or "120 books")
  const handleCreateExpenseFromNote = () => {
    const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast.error("Write an expense note first (e.g. 'Coffee 150')");
      return;
    }
    const firstLine = lines[0];
    const match = firstLine.match(/(\d+(?:\.\d{1,2})?)/);
    const amount = match ? parseFloat(match[1]) : 0;
    const note = firstLine.replace(/(\d+(?:\.\d{1,2})?)/, "").replace(/₹|\$|€|£/g, "").trim() || "Quick Expense";

    soundFX.playCashRegister();
    soundFX.vibrate(25);
    if (onConvertToExpense) {
      onConvertToExpense(amount, note);
    }
    toast.success(`Expense Logged: ${amount > 0 ? `₹${amount} for ` : ""}"${note}"`);
  };

  // 5. Clear note
  const handleClear = () => {
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

  // Word & line statistics
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lineCount = content.split("\n").length;

  return (
    <div
      className={cn(
        "relative bg-[#FEF9C3] rounded-2xl border-2 border-[#161514] p-4 sm:p-5 shadow-[4px_4px_0px_0px_#161514]",
        "sm:-rotate-1 hover:rotate-0 transition-transform duration-200 select-text flex flex-col justify-between",
        "min-h-[260px]",
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
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-[#161514]/10 text-[#161514]/50 hover:text-rose-600 transition-colors cursor-pointer"
              title="Clear scratchpad"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Ruled Ruled Writing Body */}
      <div className="flex-1 my-2.5 relative">
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Jot down quick lecture notes, tasks, or numbers... (e.g. 'Submit Lab Friday' or 'Coffee 150')"
          className={cn(
            "w-full h-full min-h-[120px] bg-transparent resize-none outline-none font-mono text-xs leading-6 text-[#161514]",
            "placeholder:text-[#161514]/40 font-medium"
          )}
          style={{
            backgroundImage: "repeating-linear-gradient(transparent, transparent 23px, rgba(22, 21, 20, 0.12) 24px)",
            backgroundAttachment: "local",
            lineHeight: "24px",
          }}
        />
      </div>

      {/* 1-Click Conversion Chips & Telemetry Bar */}
      <div className="pt-2 border-t border-[#161514]/20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Convert to Task */}
          <button
            type="button"
            onClick={handleCreateTaskFromNote}
            className="bg-white hover:bg-[#FAF8F5] text-[#161514] font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_#161514] active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
            title="Convert first line to Task"
          >
            <CheckSquare className="size-3 stroke-[2.5]" />
            <span>To Task</span>
          </button>

          {/* Convert to Expense */}
          <button
            type="button"
            onClick={handleCreateExpenseFromNote}
            className="bg-[#CEF431] hover:bg-[#bde422] text-[#161514] font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_#161514] active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
            title="Convert to Expense"
          >
            <Wallet className="size-3 stroke-[2.5]" />
            <span>To Expense</span>
          </button>
        </div>

        {/* Word Counter */}
        <span className="text-[10px] font-mono text-[#161514]/50 font-bold">
          {wordCount} words
        </span>
      </div>
    </div>
  );
}
