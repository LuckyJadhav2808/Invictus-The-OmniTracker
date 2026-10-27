"use client";

import React, { useState, useMemo } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { type Category } from "@/types";
import { Banknote, Sparkles, Plus, Check } from "lucide-react";
import { renderCategoryEmoji } from "@/components/money/MoneyQuickActionsAndCards";
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
      await onSave({
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
      title="⚡ 1-Tap Cash Spend"
      description="Quickly record cash spent on chai, street food, rickshaw, or local markets."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#161514]/70">
            Cash Amount Spent
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-[#161514]">
              {currencySymbol}
            </span>
            <input
              type="number"
              step="any"
              autoFocus
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#FAF8F5] border-2 border-[#161514] rounded-2xl pl-9 pr-4 py-3 text-2xl font-black text-[#161514] focus:outline-none focus:bg-[#FFFFFF] shadow-[2px_2px_0px_0px_#161514]"
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
              className="px-2.5 py-1 text-xs font-black rounded-lg border border-[#161514] bg-[#FFFFFF] hover:bg-[#CEF431] active:translate-y-0.5 shadow-[1px_1px_0px_0px_#161514] transition-colors"
            >
              +{currencySymbol}{inc}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAmount("")}
            className="px-2 py-1 text-[11px] font-bold rounded-lg border border-[#161514]/40 text-[#161514]/60 hover:text-red-600 ml-auto"
          >
            Clear
          </button>
        </div>

        {/* Note / Place / What was bought */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#161514]/70">
            Where did it go? (e.g. Chai, Auto, Panipuri, Veggies)
          </label>
          <input
            type="text"
            placeholder="e.g. Chai & Samosa at tapri"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-[#FAF8F5] border-2 border-[#161514] rounded-xl px-3 py-2 text-sm font-bold text-[#161514] focus:outline-none focus:bg-[#FFFFFF] shadow-[2px_2px_0px_0px_#161514]"
          />
          {autoMatch && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-1 mt-1">
              <Sparkles className="size-3 text-emerald-600" />
              <span>
                Auto-assigned category: <strong>{autoMatch.categoryName}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Category Selector Pills */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-[#161514]/70">
            Assigned Category
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 border border-[#161514]/20 rounded-xl bg-[#FAF8F5]">
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
                      ? "bg-[#161514] text-[#FAF8F5] border-[#161514] shadow-[1px_1px_0px_0px_#161514]"
                      : "bg-[#FFFFFF] text-[#161514] border-[#161514]/30 hover:bg-[#FAF8F5]"
                  )}
                >
                  <span>{renderCategoryEmoji(cat.name)}</span>
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
            "w-full py-3 rounded-xl border-2 border-[#161514] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer mt-2",
            isSubmitting || !amount || parseFloat(amount) <= 0
              ? "bg-[#E5E5E5] text-[#161514]/40 cursor-not-allowed"
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
