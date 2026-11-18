"use client";

import React, { useState } from "react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { Zap, Check, ArrowLeft, RefreshCw } from "lucide-react";

export interface MechanicalNumpadProps {
  remainingBudget?: number;
  currencySymbol?: string;
  onLogExpense: (payload: { amount: number; category: string; note: string }) => Promise<void> | void;
  onCancel?: () => void;
}

const DEFAULT_HABITS = [
  { label: "☕ Chai", amount: 30, category: "Food" },
  { label: "🍛 Meal", amount: 100, category: "Food" },
  { label: "🚇 Metro", amount: 40, category: "Travel" },
  { label: "🍪 Snack", amount: 20, category: "Food" },
];

const CORE_CATEGORIES = [
  { id: "Food", name: "Food 🍔" },
  { id: "Travel", name: "Travel 🚕" },
  { id: "Grocery", name: "Grocery 🛒" },
  { id: "Bills", name: "Bills 💡" },
];

export function MechanicalNumpad({
  remainingBudget = 1420,
  currencySymbol = "₹",
  onLogExpense,
  onCancel,
}: MechanicalNumpadProps) {
  const [amountStr, setAmountStr] = useState<string>("0");
  const [selectedCategory, setSelectedCategory] = useState<string>("Food");
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleKeyPress = (char: string) => {
    soundFX.playPop();
    soundFX.vibrate(15);

    if (char === "backspace") {
      setAmountStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
      return;
    }

    if (char === ".") {
      if (!amountStr.includes(".")) {
        setAmountStr((prev) => prev + ".");
      }
      return;
    }

    // Numbers
    setAmountStr((prev) => {
      if (prev === "0") return char;
      if (prev.includes(".")) {
        const parts = prev.split(".");
        if (parts[1]?.length >= 2) return prev; // max 2 decimals
      }
      if (prev.length >= 7) return prev;
      return prev + char;
    });
  };

  const handleHabitSelect = (habit: { label: string; amount: number; category: string }) => {
    soundFX.playPop();
    soundFX.vibrate(25);
    setAmountStr(String(habit.amount));
    setSelectedCategory(habit.category);
    setNote(habit.label.replace(/[^\w\s]/gi, "").trim());
  };

  const handleCategorySelect = (catId: string) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    setSelectedCategory(catId);
  };

  const handleSubmit = async () => {
    const val = parseFloat(amountStr);
    if (isNaN(val) || val <= 0) {
      soundFX.vibrate(40);
      return;
    }

    setIsSubmitting(true);
    soundFX.playCashRegister();
    soundFX.vibrate([20, 40, 20]);

    try {
      await onLogExpense({
        amount: val,
        category: selectedCategory,
        note: note || selectedCategory,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const numericValue = parseFloat(amountStr) || 0;
  const projectedRemaining = Math.max(0, remainingBudget - numericValue);

  return (
    <div className="w-full max-w-sm mx-auto bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#38332E] rounded-3xl p-5 shadow-[4px_4px_0px_0px_#161514] space-y-4 font-sans select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#161514]/15 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="size-8 rounded-xl bg-white dark:bg-[#201D1A] border border-[#161514] flex items-center justify-center text-[#161514] dark:text-white cursor-pointer shadow-2xs hover:bg-[#E8E5DF]"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-white flex items-center gap-1">
              <Zap className="size-3.5 fill-[#CEF431] text-[#161514]" />
              <span>Fast Quick-Log</span>
            </h2>
            <p className="text-[10px] text-[#161514]/60 dark:text-white/60 font-mono">
              Remaining: {currencySymbol}{Math.round(remainingBudget).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[9px] font-black uppercase text-[#161514]/50 dark:text-white/50 block">
            After Spend
          </span>
          <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
            {currencySymbol}{Math.round(projectedRemaining).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Amount Display */}
      <div className="bg-white dark:bg-[#0C0B0A] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl py-4 px-3 text-center shadow-[inset_2px_2px_0px_0px_rgba(22,21,20,0.06)]">
        <div className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-[#161514] dark:text-[#FAF8F5]">
          <span className="text-[#161514]/40 dark:text-white/40 mr-1 text-3xl sm:text-4xl">
            {currencySymbol}
          </span>
          {amountStr}
        </div>
        {note && (
          <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400 mt-1">
            &ldquo;{note}&rdquo;
          </p>
        )}
      </div>

      {/* Habit Chips Row */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {DEFAULT_HABITS.map((habit) => (
          <button
            key={habit.label}
            onClick={() => handleHabitSelect(habit)}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#201D1A] border border-[#161514] text-xs font-black text-[#161514] dark:text-white shrink-0 hover:bg-[#CEF431] hover:text-[#161514] transition-all cursor-pointer shadow-2xs"
          >
            {habit.label} {currencySymbol}{habit.amount}
          </button>
        ))}
      </div>

      {/* Category Selection Row */}
      <div className="grid grid-cols-4 gap-1.5">
        {CORE_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={cn(
                "py-1.5 px-1 rounded-xl text-[11px] font-black border transition-all cursor-pointer text-center truncate",
                isSelected
                  ? "bg-[#161514] text-[#CEF431] border-[#161514] shadow-2xs dark:bg-white dark:text-[#161514]"
                  : "bg-white dark:bg-[#201D1A] text-[#161514] dark:text-white border-[#161514]/40 hover:bg-[#E8E5DF]"
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Mechanical Numpad */}
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"].map((k) => (
          <button
            key={k}
            onClick={() => handleKeyPress(k)}
            className="h-12 rounded-xl bg-white dark:bg-[#201D1A] border-2 border-[#161514] dark:border-[#38332E] text-lg font-black text-[#161514] dark:text-white flex items-center justify-center shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            {k === "backspace" ? "⌫" : k}
          </button>
        ))}
      </div>

      {/* Log Action Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || numericValue <= 0}
        className={cn(
          "w-full h-12 rounded-xl font-black text-sm uppercase tracking-wider border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] transition-all flex items-center justify-center gap-2 cursor-pointer",
          numericValue > 0
            ? "bg-[#CEF431] hover:bg-[#bce028] text-[#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            : "bg-stone-300 dark:bg-stone-800 text-stone-500 border-stone-400 cursor-not-allowed shadow-none"
        )}
      >
        {isSubmitting ? (
          <>
            <RefreshCw className="size-4 animate-spin" />
            <span>Logging...</span>
          </>
        ) : (
          <>
            <Zap className="size-4 fill-current" />
            <span>LOG EXPENSE ⚡</span>
          </>
        )}
      </button>
    </div>
  );
}
