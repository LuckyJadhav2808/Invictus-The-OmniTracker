"use client";

import React, { useState, useMemo } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { type Category } from "@/types";
import { Banknote, Sparkles, Plus, Check } from "lucide-react";
import { CategoryIcon } from "@/components/money/MoneyQuickActionsAndCards";
import { detectCategoryFromNote } from "@/lib/utils/merchant-categorizer";

interface QuickCashEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  currencySymbol: string;
  onSave: (payload: {
    amount: number;
    type: "expense";
    categoryId: string;
    date: string;
    note: string;
    paymentMethod: "Cash";
  }) => Promise<any>;
}

const CASH_INCREMENTS = [10, 20, 30, 50, 100, 200, 500];

export function QuickCashEntryModal({
  open,
  onOpenChange,
  categories,
  currencySymbol,
  onSave,
}: QuickCashEntryModalProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter only expense categories
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense" && !c.archived),
    [categories]
  );

  // Auto-detect category from note text
  const autoMatch = useMemo(() => {
    if (!note.trim()) return null;
    return detectCategoryFromNote(note, expenseCategories);
  }, [note, expenseCategories]);

  // Selected category object
  const activeCategoryId = categoryId || autoMatch?.categoryId || expenseCategories[0]?.id || "cat-food";
  const activeCategory = expenseCategories.find((c) => c.id === activeCategoryId);

  const handleIncrement = (val: number) => {
    soundFX.play("click");
    const current = parseFloat(amount) || 0;
    setAmount(String(current + val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setIsSubmitting(true);
    try {
      soundFX.play("coin");
      const savePromise = onSave({
        amount: Math.round(numAmount * 100) / 100,
        type: "expense",
        categoryId: activeCategoryId,
        date,
        note: note.trim() || "Cash Expense",
        paymentMethod: "Cash",
      });
      setAmount("");
      setNote("");
      setCategoryId("");
      onOpenChange(false);
      await savePromise;
    } catch {
      soundFX.play("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title="1-Tap Cash Spend"
      description="Quickly record cash spent on chai, street food, rickshaw, or local markets."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#A8A29E]">
            Cash Amount Spent
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-[#161514] dark:text-[#FAF8F5]">
              {currencySymbol}
            </span>
            <input
              type="number"
              step="any"
              autoFocus
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] rounded-2xl pl-9 pr-4 py-3 text-2xl font-black text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:border-[#161514] dark:focus:border-white shadow-xs"
              required
            />
          </div>
        </div>

        {/* Quick Cash Chips */}
        <div className="flex flex-wrap gap-1.5">
          {CASH_INCREMENTS.map((inc) => (
            <button
              key={inc}
              type="button"
              onClick={() => handleIncrement(inc)}
              className="px-2.5 py-1 text-xs font-black rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] hover:bg-[#CEF431] dark:hover:bg-[#CEF431] hover:text-[#161514] active:translate-y-0.5 shadow-xs transition-colors cursor-pointer"
            >
              +{currencySymbol}{inc}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAmount("")}
            className="px-2 py-1 text-[11px] font-bold rounded-lg border border-[#E8E5DF] dark:border-[#2A2724] text-[#161514]/60 dark:text-[#A8A29E] hover:text-red-600 ml-auto cursor-pointer"
          >
            Clear
          </button>
        </div>

        {/* Note / Place / What was bought */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#A8A29E]">
            Where did it go? (e.g. Chai, Auto, Panipuri, Veggies)
          </label>
          <input
            type="text"
            placeholder="e.g. Chai & Samosa at tapri"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl px-3.5 py-2.5 text-base font-bold text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:border-[#161514] dark:focus:border-white shadow-xs"
          />
          {autoMatch && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/40 rounded-lg px-2 py-1 mt-1 shadow-xs">
              <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
              <span>
                Auto-assigned category: <strong>{autoMatch.categoryName}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Category Selector Pills */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#A8A29E]">
            Assigned Category
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18]">
            {expenseCategories.map((cat) => {
              const isSelected = cat.id === activeCategoryId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    soundFX.play("pop");
                    setCategoryId(cat.id);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                    isSelected
                      ? "bg-[#161514] dark:bg-[#FAF8F5] text-white dark:text-[#161514] border-[#161514] dark:border-[#FAF8F5] shadow-xs"
                      : "bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#FAF8F5] dark:hover:bg-[#2A2724]"
                  )}
                >
                  <CategoryIcon name={cat.icon} className="size-3.5" />
                  <span>{cat.name}</span>
                  {isSelected && <Check className="size-3 ml-0.5 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
          className={cn(
            "w-full py-3 rounded-xl border border-[#161514] dark:border-white/20 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs active:translate-y-0.5 transition-all cursor-pointer mt-2",
            isSubmitting || !amount || parseFloat(amount) <= 0
              ? "bg-[#E5E5E5] dark:bg-[#252321] text-[#161514]/40 dark:text-[#A8A29E]/40 border-transparent cursor-not-allowed"
              : "bg-[#CEF431] text-[#161514] hover:bg-[#bfe627]"
          )}
        >
          <Banknote className="size-4" />
          <span>{isSubmitting ? "Logging Cash..." : "Record Cash Spend"}</span>
        </button>
      </form>
    </ResponsiveFormContainer>
  );
}
