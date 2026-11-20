"use client";

import { useState } from "react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { Zap, ArrowLeft, RefreshCw, PenLine, X } from "lucide-react";

export interface MechanicalNumpadProps {
  remainingBudget?: number;
  currencySymbol?: string;
  recentPresets?: Array<{ label: string; amount: number; category: string }>;
  onLogExpense: (payload: { amount: number; category: string; note: string }) => Promise<void> | void;
  onCancel?: () => void;
}

export const DEFAULT_HABITS = [
  { label: "☕ Chai", amount: 30, category: "Food" },
  { label: "🍛 Meal", amount: 100, category: "Food" },
  { label: "🚇 Metro", amount: 40, category: "Travel" },
  { label: "🍪 Snack", amount: 20, category: "Food" },
];

export const CORE_CATEGORIES = [
  { id: "Food", name: "Food 🍔" },
  { id: "Travel", name: "Travel 🚕" },
  { id: "Grocery", name: "Grocery 🛒" },
  { id: "Bills", name: "Bills 💡" },
];

export function MechanicalNumpad({
  remainingBudget = 1420,
  currencySymbol = "₹",
  recentPresets,
  onLogExpense,
  onCancel,
}: MechanicalNumpadProps) {
  const [amountStr, setAmountStr] = useState<string>("0");
  const [selectedCategory, setSelectedCategory] = useState<string>("Food");
  const [note, setNote] = useState<string>("");
  const [isManualCategory, setIsManualCategory] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const activePresets = recentPresets && recentPresets.length > 0 ? recentPresets : DEFAULT_HABITS;

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
    setIsManualCategory(false);
    setNote(habit.label.replace(/[^\w\s]/gi, "").trim());
  };

  const handleCategorySelect = (catId: string) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    setIsManualCategory(true);
    setSelectedCategory(catId);
  };

  const handleNoteChange = (val: string) => {
    setNote(val);
    if (!isManualCategory && val.trim().length > 0) {
      const lower = val.toLowerCase();
      if (/(chai|tea|coffee|snack|meal|lunch|dinner|breakfast|swiggy|zomato|burger|pizza|food|canteen|cafe|maggi|samosa|restaurant|biryani|eat)/i.test(lower)) {
        setSelectedCategory("Food");
      } else if (/(metro|uber|ola|rapido|auto|cab|taxi|petrol|diesel|fuel|bus|train|flight|commute|ride|travel)/i.test(lower)) {
        setSelectedCategory("Travel");
      } else if (/(zepto|blinkit|instamart|grocery|groceries|supermarket|vegetables|fruits|milk|bread|ration|kirana|market)/i.test(lower)) {
        setSelectedCategory("Grocery");
      } else if (/(bill|electricity|wifi|internet|broadband|recharge|rent|water|gas|subscription|netflix|spotify)/i.test(lower)) {
        setSelectedCategory("Bills");
      }
    }
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
        note: note.trim() || selectedCategory,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const numericValue = parseFloat(amountStr) || 0;
  const projectedRemaining = Math.max(0, remainingBudget - numericValue);

  return (
    <div className="w-full max-w-sm mx-auto bg-card text-card-foreground border-2 border-[#161514] dark:border-[#38332E] rounded-3xl p-5 shadow-[4px_4px_0px_0px_#161514] dark:shadow-[4px_4px_0px_0px_#000000] space-y-4 font-sans select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="size-8 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground cursor-pointer shadow-2xs hover:bg-muted transition-colors"
              title="Back"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1">
              <Zap className="size-3.5 fill-[#CEF431] text-[#161514]" />
              <span>Fast Quick-Log</span>
            </h2>
            <p className="text-[10px] text-muted-foreground font-mono">
              Remaining: {currencySymbol}{Math.round(remainingBudget).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[9px] font-black uppercase text-muted-foreground block">
            After Spend
          </span>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-[#03D26F]">
            {currencySymbol}{Math.round(projectedRemaining).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Amount Display */}
      <div className="bg-muted border-2 border-border rounded-2xl py-4 px-3 text-center shadow-inner">
        <div className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-foreground">
          <span className="text-muted-foreground mr-1 text-3xl sm:text-4xl">
            {currencySymbol}
          </span>
          {amountStr}
        </div>
      </div>

      {/* Note Input Pill */}
      <div className="relative flex items-center">
        <div className="absolute left-3 flex items-center pointer-events-none text-muted-foreground">
          <PenLine className="size-3.5" />
        </div>
        <input
          type="text"
          value={note}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="Add note (e.g. Chai, Auto, Lunch)..."
          maxLength={40}
          className="w-full h-10 pl-9 pr-8 text-xs font-bold rounded-xl bg-secondary text-secondary-foreground border border-border focus:border-[#161514] dark:focus:border-white focus:outline-none transition-colors placeholder:text-muted-foreground/60 shadow-2xs"
          data-testid="quick-log-note-input"
        />
        {note && (
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              setNote("");
              setIsManualCategory(false);
            }}
            className="absolute right-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Clear note"
            data-testid="quick-log-clear-note"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Habit Chips Row */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {activePresets.map((habit) => (
          <button
            key={habit.label}
            onClick={() => handleHabitSelect(habit)}
            className="px-2.5 py-1.5 rounded-xl bg-secondary border border-border text-xs font-black text-secondary-foreground shrink-0 hover:bg-[#CEF431] hover:text-[#161514] hover:border-[#161514] transition-all cursor-pointer shadow-2xs"
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
                  ? "bg-[#161514] text-[#CEF431] border-[#161514] dark:bg-[#CEF431] dark:text-[#161514] dark:border-[#CEF431] shadow-2xs"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-muted"
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
            className="h-12 rounded-xl bg-secondary text-secondary-foreground border-2 border-border text-xl font-mono font-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(22,21,20,0.6)] dark:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:bg-muted active:bg-[#CEF431] active:text-[#161514] transition-all cursor-pointer"
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
          "w-full h-12 rounded-xl font-black text-sm uppercase tracking-wider border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] transition-all flex items-center justify-center gap-2 cursor-pointer",
          numericValue > 0
            ? "bg-[#CEF431] hover:bg-[#bce028] text-[#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            : "bg-muted text-muted-foreground border-border cursor-not-allowed shadow-none"
        )}
      >
        {isSubmitting ? (
          <>
            <RefreshCw className="size-4 animate-spin text-[#161514]" />
            <span className="text-[#161514]">Logging...</span>
          </>
        ) : (
          <>
            <Zap className="size-4 fill-current text-[#161514]" />
            <span className="text-[#161514]">LOG EXPENSE ⚡</span>
          </>
        )}
      </button>
    </div>
  );
}
