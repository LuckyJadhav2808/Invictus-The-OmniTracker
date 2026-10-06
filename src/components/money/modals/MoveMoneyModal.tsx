"use client";

import React, { useState } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { type Category } from "@/types";
import { ArrowRightLeft, ArrowDownUp, RefreshCw } from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { toast } from "sonner";

interface MoveMoneyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  currencySymbol: string;
  onExecuteTransfer: (
    sourceCatId: string,
    destCatId: string,
    amount: number,
    note?: string
  ) => Promise<void>;
}

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

export function MoveMoneyModal({
  open,
  onOpenChange,
  categories,
  currencySymbol,
  onExecuteTransfer,
}: MoveMoneyModalProps) {
  const expenseCategories = React.useMemo(() => categories.filter((c) => !c.archived), [categories]);

  const [fromCatId, setFromCatId] = useState(expenseCategories[0]?.id || "");
  const [toCatId, setToCatId] = useState(expenseCategories[1]?.id || expenseCategories[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync default category IDs if they change
  React.useEffect(() => {
    if (expenseCategories.length > 0) {
      if (!fromCatId || !expenseCategories.some((c) => c.id === fromCatId)) {
        setFromCatId(expenseCategories[0].id);
      }
      if (!toCatId || !expenseCategories.some((c) => c.id === toCatId)) {
        setToCatId(expenseCategories[1]?.id || expenseCategories[0].id);
      }
    }
  }, [expenseCategories, fromCatId, toCatId]);

  const handleSwap = () => {
    soundFX.playClick();
    const temp = fromCatId;
    setFromCatId(toCatId);
    setToCatId(temp);
  };

  const handleAddAmount = (addVal: number) => {
    soundFX.playKeypadBeep();
    const current = Number(amount) || 0;
    setAmount(String(current + addVal));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid transfer amount");
      return;
    }
    if (!fromCatId || !toCatId) {
      toast.error("Please choose both source and destination envelopes");
      return;
    }
    if (fromCatId === toCatId) {
      toast.error("Source and destination envelopes must be different");
      return;
    }

    try {
      setIsSubmitting(true);
      await onExecuteTransfer(fromCatId, toCatId, numAmount, note.trim() || undefined);
      soundFX.playCashRegister();
      onOpenChange(false);
      setAmount("");
      setNote("");
    } catch {
      toast.error("Failed to execute transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectOptions = expenseCategories.map((c) => ({
    value: c.id,
    label: c.name,
    icon: c.icon,
  }));

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title="Move Funds / Transfer"
      description="Transfer allocated money between category wallets or envelopes"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Source & Destination Envelope Selectors */}
        <div className="space-y-3 bg-[#FAF8F5] p-3.5 sm:p-4 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514]">
          <div className="space-y-1">
            <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514] flex items-center justify-between">
              <span>From Envelope (Source) *</span>
              <span className="text-[9px] text-[#161514]/60 font-bold">Deducts from here</span>
            </label>
            <NeobrutalistSelect
              value={fromCatId}
              onChange={setFromCatId}
              options={selectOptions}
              placeholder="Select source wallet"
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-1">
            <button
              type="button"
              onClick={handleSwap}
              className="p-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-black uppercase"
              title="Swap source and destination"
            >
              <ArrowDownUp className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Swap</span>
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514] flex items-center justify-between">
              <span>To Envelope (Destination) *</span>
              <span className="text-[9px] text-[#161514]/60 font-bold">Adds to here</span>
            </label>
            <NeobrutalistSelect
              value={toCatId}
              onChange={setToCatId}
              options={selectOptions}
              placeholder="Select destination wallet"
            />
          </div>
        </div>

        {/* Transfer Amount */}
        <div className="space-y-2">
          <label htmlFor="move-amount" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514] block">
            Transfer Amount ({currencySymbol}) *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-[#161514] font-heading">
              {currencySymbol}
            </span>
            <input
              id="move-amount"
              type="number"
              step="any"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border-2 border-[#161514] text-xl font-black text-[#161514] font-heading shadow-[3px_3px_0px_0px_#161514] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
            />
          </div>

          {/* Quick Amount Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleAddAmount(amt)}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#CEF431] border-2 border-[#161514] text-[11px] font-black text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer font-heading"
              >
                +{currencySymbol}{amt.toLocaleString()}
              </button>
            ))}
            {amount && (
              <button
                type="button"
                onClick={() => setAmount("")}
                className="px-2.5 py-1 rounded-xl bg-[#FAF8F5] hover:bg-rose-100 border-2 border-[#161514] text-[10px] font-black text-rose-700 shadow-[1.5px_1.5px_0px_0px_#161514] transition-all cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Note / Memo */}
        <div className="space-y-1">
          <label htmlFor="move-note" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514] block">
            Transfer Note / Reason (Optional)
          </label>
          <input
            id="move-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Budget rebalance, Dinner contribution, Weekend trip"
            className="w-full px-4 py-2.5 bg-white rounded-2xl border-2 border-[#161514] text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !amount || Number(amount) <= 0}
          className="w-full py-3 px-4 rounded-2xl bg-[#FACC15] hover:bg-[#EAB308] text-[#161514] font-black text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Executing Transfer…</span>
            </>
          ) : (
            <>
              <ArrowRightLeft className="h-4 w-4 stroke-[3]" />
              <span>Execute Transfer</span>
            </>
          )}
        </button>
      </form>
    </ResponsiveFormContainer>
  );
}
