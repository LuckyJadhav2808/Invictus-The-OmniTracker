"use client";

import React, { useState, useEffect } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

interface AllowanceSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencySymbol: string;
  defaultUpiBudget: number;
  defaultCashBudget: number;
  defaultCustomDailyBudget?: number | null;
  defaultEnableRollover?: boolean;
  dailySafeToSpend: number;
  onSave: (payload: {
    upiBudget: number;
    cashBudget: number;
    customDailyBudget: number | null;
    enableRollover: boolean;
  }) => Promise<any>;
}

export function AllowanceSettingsModal({
  open,
  onOpenChange,
  currencySymbol,
  defaultUpiBudget,
  defaultCashBudget,
  defaultCustomDailyBudget,
  defaultEnableRollover = true,
  dailySafeToSpend,
  onSave,
}: AllowanceSettingsModalProps) {
  const [upiBudget, setUpiBudget] = useState("");
  const [cashBudget, setCashBudget] = useState("");
  const [customDailyBudget, setCustomDailyBudget] = useState("");
  const [enableRollover, setEnableRollover] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setUpiBudget(String(defaultUpiBudget || ""));
      setCashBudget(String(defaultCashBudget || ""));
      setCustomDailyBudget(
        defaultCustomDailyBudget !== null && defaultCustomDailyBudget !== undefined
          ? String(defaultCustomDailyBudget)
          : ""
      );
      setEnableRollover(defaultEnableRollover);
    }
  }, [open, defaultUpiBudget, defaultCashBudget, defaultCustomDailyBudget, defaultEnableRollover]);

  const totalMonthlyBudget = (Number(upiBudget) || 0) + (Number(cashBudget) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        upiBudget: Number(upiBudget) || 0,
        cashBudget: Number(cashBudget) || 0,
        customDailyBudget: customDailyBudget.trim() ? Number(customDailyBudget) : null,
        enableRollover,
      });
      soundFX.playPop();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Monthly Budget & Allowances"
      description="Configure monthly allowances for online/UPI, physical cash, and daily spending velocity."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Total Overview Pill */}
        <div className="bg-[#FAF8F5] p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-[#161514]">
            Total Monthly Allocation
          </span>
          <span className="text-lg font-black text-[#161514] font-heading">
            {currencySymbol}{totalMonthlyBudget.toLocaleString()}
          </span>
        </div>

        {/* 📱 UPI & Online Allowance */}
        <div className="space-y-1.5 bg-[#FAF8F5] p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
          <div className="flex items-center justify-between">
            <label htmlFor="upi-allowance-input" className="text-xs font-black uppercase tracking-wider text-[#161514]">
              📱 UPI & Online Budget ({currencySymbol})
            </label>
            <span className="text-[10px] font-bold text-[#161514]/60">GPay, Paytm, Cards</span>
          </div>
          <input
            id="upi-allowance-input"
            type="number"
            min="0"
            step="100"
            value={upiBudget}
            onChange={(e) => setUpiBudget(e.target.value)}
            placeholder="e.g. 8000"
            required
            className="w-full neo-input text-sm font-black bg-white"
          />
          <div className="flex gap-1.5 pt-1 overflow-x-auto no-scrollbar">
            {[5000, 8000, 12000, 20000].map((val) => (
              <button
                key={`upi-${val}`}
                type="button"
                onClick={() => setUpiBudget(String(val))}
                className="px-2 py-1 rounded-lg bg-white hover:bg-[#CEF431] text-[#161514] font-black text-[10px] border border-[#161514] shadow-[1px_1px_0px_0px_#161514] shrink-0 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                {currencySymbol}{val.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* 💵 Physical Cash Allowance */}
        <div className="space-y-1.5 bg-[#FAF8F5] p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
          <div className="flex items-center justify-between">
            <label htmlFor="cash-allowance-input" className="text-xs font-black uppercase tracking-wider text-[#161514]">
              💵 Cash Budget ({currencySymbol})
            </label>
            <span className="text-[10px] font-bold text-[#161514]/60">ATM Notes & Coins</span>
          </div>
          <input
            id="cash-allowance-input"
            type="number"
            min="0"
            step="50"
            value={cashBudget}
            onChange={(e) => setCashBudget(e.target.value)}
            placeholder="e.g. 2000 (or 0 if cashless)"
            required
            className="w-full neo-input text-sm font-black bg-white"
          />
          <div className="flex gap-1.5 pt-1 overflow-x-auto no-scrollbar">
            {[0, 1000, 2000, 3000, 5000].map((val) => (
              <button
                key={`cash-${val}`}
                type="button"
                onClick={() => setCashBudget(String(val))}
                className="px-2 py-1 rounded-lg bg-white hover:bg-amber-400 text-[#161514] font-black text-[10px] border border-[#161514] shadow-[1px_1px_0px_0px_#161514] shrink-0 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                {val === 0 ? "Cashless (0)" : `${currencySymbol}${val.toLocaleString()}`}
              </button>
            ))}
          </div>
        </div>

        {/* ⚡ Daily Spending Limit (Optional Custom Cap) */}
        <div className="space-y-1.5 bg-[#FAF8F5] p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514]">
          <div className="flex items-center justify-between">
            <label htmlFor="daily-allowance-input" className="text-xs font-black uppercase tracking-wider text-[#161514]">
              ⚡ Fixed Daily Cap (Optional) ({currencySymbol})
            </label>
            <span className="text-[10px] font-bold text-[#161514]/60">Auto-Pace Default</span>
          </div>
          <input
            id="daily-allowance-input"
            type="number"
            min="0"
            step="50"
            value={customDailyBudget}
            onChange={(e) => setCustomDailyBudget(e.target.value)}
            placeholder={`Auto pace ~${currencySymbol}${dailySafeToSpend}/day`}
            className="w-full neo-input text-sm font-black bg-white"
          />
          <div className="flex gap-1.5 pt-1 overflow-x-auto no-scrollbar">
            {[200, 300, 500, 1000].map((val) => (
              <button
                key={`daily-${val}`}
                type="button"
                onClick={() => setCustomDailyBudget(String(val))}
                className="px-2 py-1 rounded-lg bg-white hover:bg-[#03D26F] text-[#161514] font-black text-[10px] border border-[#161514] shadow-[1px_1px_0px_0px_#161514] shrink-0 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                {currencySymbol}{val}/day
              </button>
            ))}
            {customDailyBudget && (
              <button
                type="button"
                onClick={() => setCustomDailyBudget("")}
                className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 font-black text-[10px] border border-[#161514] shadow-[1px_1px_0px_0px_#161514] shrink-0 cursor-pointer"
              >
                Clear (Auto Pace)
              </button>
            )}
          </div>
        </div>

        {/* 🔄 Automatic Monthly Rollover Switch */}
        <div className="p-3 bg-white rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-black uppercase tracking-wider text-[#161514] block">
              Monthly Rollover Surplus
            </span>
            <p className="text-[11px] text-[#161514]/70 font-medium leading-tight">
              Roll unspent savings into next month&apos;s allowance
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enableRollover}
            onClick={() => setEnableRollover(!enableRollover)}
            className={cn(
              "h-6 w-12 rounded-full border-2 border-[#161514] transition-all relative shrink-0 cursor-pointer shadow-[1px_1px_0px_0px_#161514]",
              enableRollover ? "bg-[#CEF431]" : "bg-zinc-200"
            )}
          >
            <span
              className={cn(
                "block h-4 w-4 rounded-full bg-[#161514] border border-[#161514] transition-all absolute top-0.5",
                enableRollover ? "left-6" : "left-1"
              )}
            />
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#CEF431] hover:bg-[#bde422] text-[#161514] font-black text-xs uppercase tracking-wider py-3 rounded-xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Save Allowances 🎯"}
        </button>
      </form>
    </ResponsiveFormContainer>
  );
}
