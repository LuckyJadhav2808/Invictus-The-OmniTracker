"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { type Category } from "@/types";
import { soundFX } from "@/components/shared/SoundFX";
import { Plus, Wallet, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseSmartIntent } from "@/lib/nlp/smart-intent-parser";
import { InlineMathInput } from "@/components/ui/InlineMathInput";

export interface TodayQuickExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencySymbol: string;
  categories: Category[];
  onAddExpense: (amount: number, categoryId: string, note: string) => Promise<void>;
  isSaving: boolean;
}

export function TodayQuickExpenseModal({
  open,
  onOpenChange,
  currencySymbol,
  categories,
  onAddExpense,
  isSaving,
}: TodayQuickExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");

  const expenseCategories = categories.filter((c) => c.type === "expense" && !c.archived);
  const selectedCatId = categoryId || expenseCategories[0]?.id || "";

  const handleNoteChange = (val: string) => {
    setNote(val);
    if (!val.trim()) return;

    const parsed = parseSmartIntent(val);
    if (parsed.domain === "MONEY_EXPENSE" && parsed.expense) {
      if (parsed.expense.amount && (!amount || amount === "0")) {
        setAmount(String(parsed.expense.amount));
        soundFX.playPop();
      }
      if (parsed.expense.category) {
        const catNameLower = parsed.expense.category.toLowerCase();
        const matched = expenseCategories.find((c) =>
          c.name.toLowerCase().includes(catNameLower)
        );
        if (matched && matched.id !== categoryId) {
          setCategoryId(matched.id);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    soundFX.playCashRegister();
    soundFX.vibrate(25);
    await onAddExpense(val, selectedCatId, note.trim() || "Quick Expense");
    setAmount("");
    setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] p-5 sm:p-6 rounded-2xl shadow-[4px_4px_0px_0px_#161514] dark:shadow-[4px_4px_0px_0px_#000000]">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-[#CEF431] text-[#161514] flex items-center justify-center border border-[#161514] font-bold">
              <Wallet className="size-4 stroke-[2.5]" />
            </div>
            <DialogTitle className="font-heading font-black text-lg text-foreground">
              Quick Log Expense
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs font-sans text-muted-foreground">
            3-second record. Keeps your safe spend pace synced in real time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Amount Input with Inline Math Evaluator (Raycast / Soulver Benchmark) */}
          <div className="bg-card border-2 border-[#161514] dark:border-[#38332E] rounded-xl p-3 shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex items-center gap-2">
            <span className="font-heading font-black text-2xl text-muted-foreground select-none">
              {currencySymbol}
            </span>
            <InlineMathInput
              value={amount}
              onChange={(val) => setAmount(val)}
              currencySymbol={currencySymbol}
              placeholder="0.00"
              autoFocus
              required
            />
          </div>

          {/* Quick Category Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider block">
              Category
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {expenseCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setCategoryId(cat.id);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-heading font-bold border-2 transition-all cursor-pointer shrink-0 select-none",
                    selectedCatId === cat.id
                      ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] border-[#161514] dark:border-[#CEF431] shadow-[1.5px_1.5px_0px_0px_#161514]"
                      : "bg-secondary text-secondary-foreground border-border dark:border-[#38332E] hover:border-foreground"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Note Input with NLP Auto-fill */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider block">
                Note (Optional)
              </label>
              <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="size-2.5" />
                NLP Auto-fill
              </span>
            </div>
            <input
              type="text"
              placeholder="e.g. Swiggy dinner 450, Coffee 120, Metro 40"
              value={note}
              onChange={(e) => handleNoteChange(e.target.value)}
              className="w-full bg-card border-2 border-[#161514] dark:border-[#38332E] rounded-xl px-3 py-2 text-xs font-sans text-foreground focus:outline-hidden shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving || !amount}
            className="w-full py-3 rounded-xl border-2 border-[#161514] bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] font-heading font-black text-sm shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>{isSaving ? "Saving..." : "Record Expense"}</span>
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
