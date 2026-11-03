"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ResponsiveFormContainer } from "@/components/shared/ResponsiveFormContainer";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { Smartphone, Banknote, Zap, RefreshCw, Sparkles, Save, Info } from "lucide-react";

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
  const [enableRollover, setEnableRollover] = useState(defaultEnableRollover ?? false);
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

  // Remaining days in current month calculation for live safe-to-spend telemetry
  const daysInCurrentMonth = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return lastDay;
  }, []);

  const daysRemainingInMonth = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Math.max(1, lastDay - now.getDate() + 1);
  }, []);

  const estimatedDailyPace = useMemo(() => {
    if (totalMonthlyBudget <= 0) return 0;
    return Math.round(totalMonthlyBudget / daysInCurrentMonth);
  }, [totalMonthlyBudget, daysInCurrentMonth]);

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

  const applyPreset = (upi: number, cash: number) => {
    soundFX.playPop();
    setUpiBudget(String(upi));
    setCashBudget(String(cash));
  };

  return (
    <ResponsiveFormContainer
      open={open}
      onOpenChange={onOpenChange}
      title="Monthly Budget & Allowance Engine"
      description="Configure monthly digital & cash allowances, customize daily spending velocity, and enable rollover."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-[#161514] dark:text-[#FAF8F5]">
        {/* Total Overview & Dynamic Live Pace Telemetry */}
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-4 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#161514]/70 dark:text-[#FAF8F5]/60 font-heading">
              Total Monthly Allocation
            </span>
            <span className="text-lg font-black text-[#161514] dark:text-[#FAF8F5] font-mono tabular-nums">
              {currencySymbol}{totalMonthlyBudget.toLocaleString()}
            </span>
          </div>

          <div className="pt-2 border-t border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-[#161514]/70 dark:text-[#FAF8F5]/60 flex items-center gap-1">
              <Sparkles className="size-3 text-amber-500" />
              <span>Projected Safe Pace</span>
            </span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              ~{currencySymbol}{estimatedDailyPace}/day
            </span>
          </div>

          <p className="text-[10px] text-[#161514]/60 dark:text-[#FAF8F5]/50 leading-relaxed font-medium">
            Based on {daysRemainingInMonth} days remaining in this month. Your Today cockpit safe-to-spend gauge adjusts dynamically based on daily actual spend.
          </p>
        </div>

        {/* 1-Tap Quick Tier Presets */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#161514]/70 dark:text-[#FAF8F5]/60 font-heading">
              1-Tap Budget Presets
            </span>
            <span className="text-[10px] text-[#161514]/50 dark:text-[#FAF8F5]/40 font-mono">
              Auto-fills UPI + Cash
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Student", total: 6000, upi: 5000, cash: 1000 },
              { label: "Campus", total: 10000, upi: 8000, cash: 2000 },
              { label: "Explorer", total: 20000, upi: 16000, cash: 4000 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.upi, preset.cash)}
                className={cn(
                  "px-2.5 py-2 rounded-xl border text-center transition-all cursor-pointer shadow-xs",
                  Number(upiBudget) === preset.upi && Number(cashBudget) === preset.cash
                    ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] border-[#161514] dark:border-white"
                    : "border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] hover:bg-[#FAF8F5] dark:hover:bg-[#252220]"
                )}
              >
                <span className="block text-[10px] font-black uppercase tracking-tight">{preset.label}</span>
                <span className="block text-xs font-mono font-bold mt-0.5">
                  {currencySymbol}{preset.total.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* UPI & Online Allowance */}
        <div className="space-y-2 bg-[#FAF8F5] dark:bg-[#1C1A18] p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs">
          <div className="flex items-center justify-between">
            <label htmlFor="upi-allowance-input" className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5 font-heading">
              <Smartphone className="size-3.5 text-amber-500" />
              <span>Digital & Bank / UPI ({currencySymbol})</span>
            </label>
            <span className="text-[10px] font-bold text-[#161514]/60 dark:text-[#FAF8F5]/50">Primary bank balance</span>
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
            className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#161514] py-2 px-3 text-xs font-bold font-mono text-[#161514] dark:text-[#FAF8F5] outline-none shadow-xs"
          />
          <div className="flex gap-1.5 pt-1 overflow-x-auto scrollbar-none">
            {[4000, 6000, 8000, 12000, 20000].map((val) => (
              <button
                key={`upi-${val}`}
                type="button"
                onClick={() => setUpiBudget(String(val))}
                className="px-2 py-1 rounded-lg bg-white dark:bg-[#252220] hover:bg-neutral-50 text-[#161514] dark:text-[#FAF8F5] font-bold text-[10px] border border-[#E8E5DF] dark:border-[#2A2724] shrink-0 shadow-xs cursor-pointer transition-all"
              >
                {currencySymbol}{val.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Physical Cash Allowance */}
        <div className="space-y-2 bg-[#FAF8F5] dark:bg-[#1C1A18] p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs">
          <div className="flex items-center justify-between">
            <label htmlFor="cash-allowance-input" className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5 font-heading">
              <Banknote className="size-3.5 text-emerald-500" />
              <span>Physical Cash Till ({currencySymbol})</span>
            </label>
            <span className="text-[10px] font-bold text-[#161514]/60 dark:text-[#FAF8F5]/50">Rolling pocket cash</span>
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
            className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#161514] py-2 px-3 text-xs font-bold font-mono text-[#161514] dark:text-[#FAF8F5] outline-none shadow-xs"
          />
          <div className="flex gap-1.5 pt-1 overflow-x-auto scrollbar-none">
            {[0, 1000, 2000, 3000, 5000].map((val) => (
              <button
                key={`cash-${val}`}
                type="button"
                onClick={() => setCashBudget(String(val))}
                className="px-2 py-1 rounded-lg bg-white dark:bg-[#252220] hover:bg-neutral-50 text-[#161514] dark:text-[#FAF8F5] font-bold text-[10px] border border-[#E8E5DF] dark:border-[#2A2724] shrink-0 shadow-xs cursor-pointer transition-all"
              >
                {val === 0 ? "Cashless (0)" : `${currencySymbol}${val.toLocaleString()}`}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Spending Limit (Optional Fixed Cap) */}
        <div className="space-y-2 bg-[#FAF8F5] dark:bg-[#1C1A18] p-3.5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs">
          <div className="flex items-center justify-between">
            <label htmlFor="daily-allowance-input" className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5 font-heading">
              <Zap className="size-3.5 text-amber-500 fill-amber-400" />
              <span>Fixed Daily Cap (Optional) ({currencySymbol})</span>
            </label>
            <span className="text-[10px] font-bold text-[#161514]/60 dark:text-[#FAF8F5]/50">Overrides auto pace</span>
          </div>
          <input
            id="daily-allowance-input"
            type="number"
            min="0"
            step="50"
            value={customDailyBudget}
            onChange={(e) => setCustomDailyBudget(e.target.value)}
            placeholder={`Leave empty for auto pace (~${currencySymbol}${dailySafeToSpend.toFixed(0)}/day)`}
            className="w-full rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#161514] py-2 px-3 text-xs font-bold font-mono text-[#161514] dark:text-[#FAF8F5] outline-none shadow-xs"
          />
          <div className="flex gap-1.5 pt-1 overflow-x-auto scrollbar-none">
            {[200, 300, 500, 1000].map((val) => (
              <button
                key={`daily-${val}`}
                type="button"
                onClick={() => setCustomDailyBudget(String(val))}
                className="px-2 py-1 rounded-lg bg-white dark:bg-[#252220] hover:bg-neutral-50 text-[#161514] dark:text-[#FAF8F5] font-bold text-[10px] border border-[#E8E5DF] dark:border-[#2A2724] shrink-0 shadow-xs cursor-pointer transition-all"
              >
                {currencySymbol}{val}/day
              </button>
            ))}
            {customDailyBudget && (
              <button
                type="button"
                onClick={() => setCustomDailyBudget("")}
                className="px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold text-[10px] border border-rose-200 dark:border-rose-900/40 shrink-0 cursor-pointer"
              >
                Reset to Auto Pace
              </button>
            )}
          </div>
        </div>

        {/* Automatic Monthly Rollover Switch */}
        <div className="p-3.5 bg-white dark:bg-[#1C1A18] rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5 font-heading">
              <RefreshCw className="size-3.5 text-blue-500" />
              <span>Monthly Rollover Surplus</span>
            </span>
            <p className="text-[11px] text-[#161514]/70 dark:text-[#FAF8F5]/60 font-medium leading-tight">
              Roll unspent savings into next month&apos;s allowance automatically
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enableRollover}
            onClick={() => setEnableRollover(!enableRollover)}
            className={cn(
              "h-6 w-11 rounded-full border border-[#161514] transition-all relative shrink-0 cursor-pointer shadow-xs",
              enableRollover ? "bg-[#CEF431]" : "bg-neutral-200 dark:bg-neutral-800"
            )}
          >
            <span
              className={cn(
                "block h-4.5 w-4.5 rounded-full bg-white border border-[#161514] transition-all absolute top-0.5 shadow-xs",
                enableRollover ? "left-5.5" : "left-0.5"
              )}
            />
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#161514] dark:bg-white text-white dark:text-[#161514] hover:bg-[#2a2725] dark:hover:bg-neutral-100 font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl border border-[#161514] dark:border-white shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="size-4 stroke-[2.5]" />
          <span>{isSubmitting ? "Saving Allowances…" : "Save Allowances"}</span>
        </button>
      </form>
    </ResponsiveFormContainer>
  );
}
