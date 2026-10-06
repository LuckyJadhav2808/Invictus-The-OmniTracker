"use client";

import React, { useState } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { NeobrutalistSelect } from "@/components/shared/NeobrutalistSelect";
import { type Category } from "@/types";
import { Send, RefreshCw } from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SendMoneyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  currencySymbol: string;
  onSendMoney: (payload: {
    recipient: string;
    amount: number;
    categoryId: string;
    paymentMethod: string;
    note?: string;
  }) => Promise<void>;
}

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI / QR", icon: "⚡" },
  { id: "gpay", label: "GPay", icon: "📱" },
  { id: "phonepe", label: "PhonePe", icon: "🟣" },
  { id: "cash", label: "Cash", icon: "💵" },
  { id: "card", label: "Card", icon: "💳" },
  { id: "bank", label: "Bank Transfer", icon: "🏦" },
];

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

export function SendMoneyModal({
  open,
  onOpenChange,
  categories,
  currencySymbol,
  onSendMoney,
}: SendMoneyModalProps) {
  const expenseCategories = React.useMemo(() => categories.filter((c) => !c.archived && c.type === "expense"), [categories]);

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(expenseCategories[0]?.id || "");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync category if empty
  React.useEffect(() => {
    if (expenseCategories.length > 0 && (!categoryId || !expenseCategories.some((c) => c.id === categoryId))) {
      setCategoryId(expenseCategories[0].id);
    }
  }, [expenseCategories, categoryId]);

  const handleAddAmount = (addVal: number) => {
    soundFX.playKeypadBeep();
    const current = Number(amount) || 0;
    setAmount(String(current + addVal));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (!recipient.trim()) {
      toast.error("Please enter the recipient or payee name");
      return;
    }
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid payout amount");
      return;
    }
    if (!categoryId) {
      toast.error("Please select an expense category wallet");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSendMoney({
        recipient: recipient.trim(),
        amount: numAmount,
        categoryId,
        paymentMethod,
        note: note.trim() || undefined,
      });
      soundFX.playCashRegister();
      onOpenChange(false);
      setRecipient("");
      setAmount("");
      setNote("");
    } catch {
      toast.error("Failed to record payout");
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
      title="Send Money / Log Payout"
      description="Record a direct payment to a person, vendor, or store"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Recipient / Payee */}
        <div className="space-y-1">
          <label htmlFor="send-recipient" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514] block">
            Recipient / Payee Name *
          </label>
          <input
            id="send-recipient"
            type="text"
            required
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="e.g. Swiggy, Gym, Landlord, Rahul, Amazon..."
            className="w-full px-4 py-2.5 bg-white rounded-2xl border-2 border-[#161514] text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
          />
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label htmlFor="send-amount" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514] block">
            Amount ({currencySymbol}) *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-[#161514] font-heading">
              {currencySymbol}
            </span>
            <input
              id="send-amount"
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

        {/* Category Wallet Selector */}
        <div className="space-y-1">
          <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514] block">
            Category Wallet / Envelope *
          </label>
          <NeobrutalistSelect
            value={categoryId}
            onChange={setCategoryId}
            options={selectOptions}
            placeholder="Select category envelope"
          />
        </div>

        {/* Payment Method Chips */}
        <div className="space-y-1.5">
          <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514] block">
            Payment Method
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PAYMENT_METHODS.map((pm) => {
              const isSelected = paymentMethod === pm.id;
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => {
                    soundFX.playClick();
                    setPaymentMethod(pm.id);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-1 rounded-xl border-2 border-[#161514] transition-all cursor-pointer text-center",
                    isSelected
                      ? "bg-[#03D26F] text-[#161514] shadow-[2px_2px_0px_0px_#161514] -translate-y-0.5 font-black"
                      : "bg-white text-[#161514]/70 hover:bg-[#FAF8F5] shadow-[1px_1px_0px_0px_#161514] font-bold"
                  )}
                >
                  <span className="text-base">{pm.icon}</span>
                  <span className="text-[10px] truncate max-w-full mt-0.5">{pm.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Note */}
        <div className="space-y-1">
          <label htmlFor="send-note" className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#161514] block">
            Note / Purpose (Optional)
          </label>
          <input
            id="send-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Month end split, Groceries, Dinner"
            className="w-full px-4 py-2.5 bg-white rounded-2xl border-2 border-[#161514] text-xs sm:text-sm font-bold text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:ring-2 focus:ring-[#CEF431] transition-all"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !recipient.trim() || !amount || Number(amount) <= 0}
          className="w-full py-3 px-4 rounded-2xl bg-[#03D26F] hover:bg-[#02B861] text-[#161514] font-black text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Sending Payout…</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4 stroke-[3]" />
              <span>Confirm & Send Payout</span>
            </>
          )}
        </button>
      </form>
    </ResponsiveFormContainer>
  );
}
