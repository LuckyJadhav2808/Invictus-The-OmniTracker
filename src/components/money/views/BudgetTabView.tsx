"use client";

import { useState, useEffect, useMemo } from "react";
import { type Category, type Transaction } from "@/types";
import { type MonthlyBudgetStats } from "@/lib/utils/budget-rollover";
import { cn } from "@/lib/utils";
import { Plus, Sparkles, Sliders, RefreshCw, Banknote, Smartphone, Zap, X } from "lucide-react";
import { CategoryIcon, getCategoryAccent } from "@/components/money/MoneyQuickActionsAndCards";
import { BUDGET_CATEGORY_TEMPLATE_PACKS } from "@/lib/templates-data";
import { type TemplatePack } from "@/components/shared/TemplateSelectionModal";
import { soundFX } from "@/components/shared/SoundFX";
import { toast } from "sonner";

interface BudgetTabViewProps {
  categories: Category[];
  transactions: Transaction[];
  monthlyStats: MonthlyBudgetStats;
  currencySymbol: string;
  defaultUpiBudget?: number;
  defaultCashBudget?: number;
  defaultCustomDailyBudget?: number | null;
  defaultEnableRollover?: boolean;
  selectedCategoryId?: string;
  onSelectCategory?: (categoryId: string) => void;
  onSaveAllowances?: (payload: {
    upiBudget: number;
    cashBudget: number;
    customDailyBudget: number | null;
    enableRollover: boolean;
  }) => Promise<any> | void;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onOpenTemplates?: () => void;
  onOpenAllowances?: () => void;
  onApplyCategoryPack?: (pack: TemplatePack) => Promise<void> | void;
}

export function BudgetTabView({
  categories,
  transactions,
  monthlyStats,
  currencySymbol,
  defaultUpiBudget,
  defaultCashBudget,
  defaultCustomDailyBudget,
  defaultEnableRollover,
  selectedCategoryId,
  onSelectCategory,
  onSaveAllowances,
  onAddCategory,
  onEditCategory,
  onOpenTemplates,
  onOpenAllowances,
  onApplyCategoryPack,
}: BudgetTabViewProps) {
  const expenseCategories = categories.filter((c) => c.type === "expense" && !c.archived);

  // In-situ state toggles
  const [isConfiguringAllowances, setIsConfiguringAllowances] = useState(false);
  const [isBrowsingTemplates, setIsBrowsingTemplates] = useState(false);

  // Allowance form state
  const [upiBudgetInput, setUpiBudgetInput] = useState(String(defaultUpiBudget ?? monthlyStats.baseBudget ?? 8000));
  const [cashBudgetInput, setCashBudgetInput] = useState(String(defaultCashBudget ?? monthlyStats.baseCashBudget ?? 2000));
  const [customDailyInput, setCustomDailyInput] = useState(
    defaultCustomDailyBudget ? String(defaultCustomDailyBudget) : ""
  );
  const [enableRolloverInput, setEnableRolloverInput] = useState(defaultEnableRollover ?? false);
  const [isSavingAllowances, setIsSavingAllowances] = useState(false);

  useEffect(() => {
    if (defaultUpiBudget !== undefined) setUpiBudgetInput(String(defaultUpiBudget));
    if (defaultCashBudget !== undefined) setCashBudgetInput(String(defaultCashBudget));
    if (defaultCustomDailyBudget !== undefined) {
      setCustomDailyInput(defaultCustomDailyBudget ? String(defaultCustomDailyBudget) : "");
    }
    if (defaultEnableRollover !== undefined) setEnableRolloverInput(defaultEnableRollover);
  }, [defaultUpiBudget, defaultCashBudget, defaultCustomDailyBudget, defaultEnableRollover]);

  const handleSaveAllowanceForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveAllowances) {
      onOpenAllowances?.();
      return;
    }

    setIsSavingAllowances(true);
    soundFX.playPop();
    try {
      await onSaveAllowances({
        upiBudget: Number(upiBudgetInput) || 0,
        cashBudget: Number(cashBudgetInput) || 0,
        customDailyBudget: customDailyInput.trim() ? Number(customDailyInput) : null,
        enableRollover: enableRolloverInput,
      });
      setIsConfiguringAllowances(false);
    } catch {
      toast.error("Failed to save allowances");
    } finally {
      setIsSavingAllowances(false);
    }
  };

  // Compute spend per category for the current target month
  const categorySpendMap = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      if (tx.type === "expense" && tx.date?.startsWith(monthlyStats.targetMonthKey)) {
        const curr = map.get(tx.categoryId) || 0;
        map.set(tx.categoryId, curr + Number(tx.amount || 0));
      }
    });
    return map;
  }, [transactions, monthlyStats.targetMonthKey]);

  return (
    <div className="space-y-4">
      {/* ─── Belanje-Style Header (Plan, Save & Budget) ─── */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-base sm:text-lg font-heading font-black text-[#161514] dark:text-[#FAF8F5] tracking-tight">
            Plan, save, and clear debt
          </h3>
          <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E]">
            Automated monthly rollover, digital pace, and category envelopes
          </p>
        </div>
      </div>

      {/* Rollover & Allowances Summary Banner */}
      <div className="bg-white dark:bg-[#161514] p-5 rounded-3xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E5DF] dark:border-[#2A2724] pb-3">
          <div className="space-y-0.5">
            <span className="text-[15px] font-heading font-black text-[#161514] dark:text-stone-100 tracking-tight flex items-center gap-2">
              <RefreshCw className="size-4 stroke-[2]" />
              <span>Monthly Rollover &amp; Allowances</span>
            </span>
            <span className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] block">
              Unspent UPI rolls over monthly • Cash envelope runs continuously until limit is reached
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              if (onSaveAllowances) {
                setIsConfiguringAllowances(!isConfiguringAllowances);
              } else {
                onOpenAllowances?.();
              }
            }}
            className={cn(
              "font-medium text-xs py-1.5 px-3 rounded-xl border shadow-xs transition-all flex items-center gap-1.5 cursor-pointer",
              isConfiguringAllowances
                ? "bg-[#161514] text-white dark:bg-[#CEF431] dark:text-[#161514] border-[#161514] dark:border-[#CEF431]"
                : "bg-white hover:bg-[#FAF8F5] dark:bg-[#1C1A18] dark:hover:bg-[#252321] text-[#161514] dark:text-stone-200 border-[#E8E5DF] dark:border-[#2A2724]"
            )}
          >
            <Sliders className="size-3.5 stroke-[1.8]" />
            <span>{isConfiguringAllowances ? "Close Studio" : "Configure Allowances"}</span>
          </button>
        </div>

        {/* ─── IN-SITU ALLOWANCE CONFIGURATION STUDIO (Zero-Modal Benchmark) ─── */}
        {isConfiguringAllowances && (
          <form
            onSubmit={handleSaveAllowanceForm}
            className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#CEF431] shadow-[2.5px_2.5px_0px_0px_#161514] space-y-4 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E5DF] dark:border-[#2A2724]">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#03D26F] animate-pulse" />
                <h4 className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wider">
                  In-Situ Allowance &amp; Rollover Studio
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsConfiguringAllowances(false)}
                className="size-7 rounded-lg bg-white dark:bg-[#252321] hover:bg-neutral-100 dark:hover:bg-[#2e2a28] border border-[#E8E5DF] dark:border-[#383531] flex items-center justify-center text-[#161514] dark:text-[#FAF8F5] cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Digital UPI Allowance Input */}
              <div className="space-y-1.5 bg-white dark:bg-[#252321] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#383531]">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-heading font-bold text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
                    <Smartphone className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Monthly Digital UPI Allowance</span>
                  </label>
                  <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">Bank / Cards</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-[#6B6B6B] dark:text-[#A8A29E]">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="8000"
                    value={upiBudgetInput}
                    onChange={(e) => setUpiBudgetInput(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-lg text-xs font-mono font-bold bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#161514]"
                  />
                </div>
                {/* Presets */}
                <div className="flex items-center gap-1 pt-1 flex-wrap">
                  {[5000, 8000, 12000, 15000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setUpiBudgetInput(String(preset))}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-neutral-100 dark:hover:bg-[#2E2B28] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] cursor-pointer"
                    >
                      {currencySymbol}{preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Physical Cash Budget Input */}
              <div className="space-y-1.5 bg-white dark:bg-[#252321] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#383531]">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-heading font-bold text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
                    <Banknote className="size-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Physical Cash Till Limit</span>
                  </label>
                  <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">Wallet Envelope</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-[#6B6B6B] dark:text-[#A8A29E]">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="2000"
                    value={cashBudgetInput}
                    onChange={(e) => setCashBudgetInput(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-lg text-xs font-mono font-bold bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#161514]"
                  />
                </div>
                {/* Presets */}
                <div className="flex items-center gap-1 pt-1 flex-wrap">
                  {[1000, 2000, 3000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCashBudgetInput(String(preset))}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-neutral-100 dark:hover:bg-[#2E2B28] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] cursor-pointer"
                    >
                      {currencySymbol}{preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Daily Pace Override & Rollover Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1 bg-white dark:bg-[#252321] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#383531]">
                <label className="text-[11px] font-heading font-bold text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
                  <Zap className="size-3.5 text-amber-500" />
                  <span>Daily Safe Pace Override (Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  placeholder="Leave empty for auto pace calculation"
                  value={customDailyInput}
                  onChange={(e) => setCustomDailyInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#383531] text-[#161514] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#161514]"
                />
              </div>

              {/* Rollover Toggle */}
              <div className="flex items-center justify-between bg-white dark:bg-[#252321] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#383531]">
                <div>
                  <span className="text-[11px] font-heading font-bold text-[#161514] dark:text-[#FAF8F5] block">
                    Automatic Rollover
                  </span>
                  <p className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">
                    Roll unspent UPI surplus into next month
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableRolloverInput(!enableRolloverInput)}
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-heading font-black border transition-all cursor-pointer",
                    enableRolloverInput
                      ? "bg-[#CEF431] text-[#161514] border-[#161514] shadow-xs"
                      : "bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#6B6B6B] dark:text-[#A8A29E] border-[#E8E5DF] dark:border-[#383531]"
                  )}
                >
                  {enableRolloverInput ? "ENABLED" : "OFF"}
                </button>
              </div>
            </div>

            {/* Live Calculation Summary & Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E8E5DF] dark:border-[#2A2724]">
              <div className="text-[11px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                Total: <strong className="text-[#161514] dark:text-[#FAF8F5]">{currencySymbol}{((Number(upiBudgetInput) || 0) + (Number(cashBudgetInput) || 0)).toLocaleString()}</strong>
                {" • "}
                Estimated Pace: <strong className="text-emerald-700 dark:text-emerald-400">~{currencySymbol}{Math.round(((Number(upiBudgetInput) || 0) + (Number(cashBudgetInput) || 0)) / 30)}/day</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfiguringAllowances(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-heading font-medium text-[#6B6B6B] hover:text-[#161514] dark:text-[#A8A29E] dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAllowances}
                  className="px-4 py-1.5 rounded-xl bg-[#161514] text-white dark:bg-[#CEF431] dark:text-[#161514] text-xs font-heading font-black shadow-xs active:scale-95 transition-all cursor-pointer border border-[#161514] dark:border-[#CEF431]"
                >
                  {isSavingAllowances ? "Saving…" : "Save Allowances"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Rollover Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-none">
            <span className="text-[10px] font-mono font-bold uppercase text-[#6B6B6B] dark:text-[#A8A29E] block">Base Digital Allowance</span>
            <span className="text-sm sm:text-base font-heading font-black text-[#161514] dark:text-stone-100 font-mono tabular-nums mt-0.5 block">
              {currencySymbol}{monthlyStats.baseBudget.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-none">
            <span className="text-[10px] font-mono font-bold uppercase text-[#047857] dark:text-emerald-400 block">UPI Rollover Surplus</span>
            <span className="text-sm sm:text-base font-heading font-black text-[#03D26F] font-mono tabular-nums mt-0.5 block">
              +{currencySymbol}{monthlyStats.rolloverSurplus.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-none">
            <span className="text-[10px] font-mono font-bold uppercase text-[#6B6B6B] dark:text-[#A8A29E] block">Total Spendable Digital</span>
            <span className="text-sm sm:text-base font-heading font-black text-[#161514] dark:text-stone-100 font-mono tabular-nums mt-0.5 block">
              {currencySymbol}{monthlyStats.totalAvailableBudget.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-none">
            <span className="text-[10px] font-mono font-bold uppercase text-[#6B6B6B] dark:text-[#A8A29E] block">Daily Digital Pace</span>
            <span className="text-sm sm:text-base font-heading font-black text-[#161514] dark:text-stone-100 font-mono tabular-nums mt-0.5 block">
              ~{currencySymbol}{monthlyStats.dailySafeToSpend.toLocaleString()}/day
            </span>
            <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] block mt-0.5 font-mono tabular-nums">
              {currencySymbol}{monthlyStats.remainingBudget.toLocaleString()} ÷ {monthlyStats.daysRemainingInMonth} days left
            </span>
          </div>
        </div>

        {/* Independent Physical Cash Till Showcase */}
        {monthlyStats.baseCashBudget > 0 && (
          <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mt-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#161514] dark:text-stone-100">
                <Banknote className="size-4 stroke-[1.8]" />
                <span>Physical Cash Till</span>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-white dark:bg-[#252321] text-[#161514] dark:text-stone-200 border border-[#E8E5DF] dark:border-[#2A2724] rounded">
                  Pocket Envelope
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] font-mono">
                Envelope: {currencySymbol}{monthlyStats.envelopeCashExpense.toLocaleString()} / {currencySymbol}{monthlyStats.baseCashBudget.toLocaleString()} Used • Decoupled from monthly calendar resets.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span
                className={cn(
                  "font-medium text-xs px-2.5 py-1 rounded-lg border font-mono tabular-nums",
                  monthlyStats.isCashEnvelopeExhausted
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-700 dark:text-rose-300"
                    : "bg-[#DCFAE5] dark:bg-emerald-950/40 border-[#03D26F]/30 text-[#047857] dark:text-emerald-300"
                )}
              >
                {monthlyStats.isCashEnvelopeExhausted
                  ? "Till Empty"
                  : `${currencySymbol}${monthlyStats.remainingCashBudget.toLocaleString()} in Pocket`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Category Envelopes Section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <span className="text-sm sm:text-[15px] font-heading font-black text-[#161514] dark:text-stone-100 tracking-tight">
            Monthly Envelopes ({expenseCategories.length})
          </span>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                if (onApplyCategoryPack) {
                  setIsBrowsingTemplates(!isBrowsingTemplates);
                } else {
                  onOpenTemplates?.();
                }
              }}
              className={cn(
                "font-medium text-xs py-1.5 px-2.5 sm:px-3 rounded-xl border shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer",
                isBrowsingTemplates
                  ? "bg-[#161514] text-white dark:bg-[#CEF431] dark:text-[#161514] border-[#161514] dark:border-[#CEF431]"
                  : "bg-white hover:bg-[#FAF8F5] dark:bg-[#161514] dark:hover:bg-[#1C1A18] text-[#161514] dark:text-stone-200 border-[#E8E5DF] dark:border-[#2A2724]"
              )}
            >
              <Sparkles className="size-3.5 stroke-[1.8]" />
              <span className="sm:hidden">{isBrowsingTemplates ? "Close" : "Packs"}</span>
              <span className="hidden sm:inline">{isBrowsingTemplates ? "Close Packs" : "Template Packs"}</span>
            </button>

            <button
              type="button"
              onClick={onAddCategory}
              className="bg-[#161514] hover:bg-[#2A2826] dark:bg-white dark:hover:bg-stone-200 text-white dark:text-[#161514] font-medium text-xs py-1.5 px-2.5 sm:px-3 rounded-xl border border-[#161514] dark:border-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5 stroke-[2]" />
              <span className="sm:hidden">Add</span>
              <span className="hidden sm:inline">Envelope</span>
            </button>
          </div>
        </div>

        {/* ─── IN-SITU STARTER PACKS SHELF (Zero-Modal Benchmark) ─── */}
        {isBrowsingTemplates && (
          <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#CEF431] shadow-[2px_2px_0px_0px_#161514] space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-[#E8E5DF] dark:border-[#2A2724]">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-amber-500" />
                <h4 className="text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wider">
                  Recommended Student Budget Packs
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsBrowsingTemplates(false)}
                className="size-6 rounded-lg bg-white dark:bg-[#252321] hover:bg-neutral-100 text-[#161514] dark:text-[#FAF8F5] flex items-center justify-center cursor-pointer border border-[#E8E5DF] dark:border-[#383531]"
              >
                <X className="size-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {BUDGET_CATEGORY_TEMPLATE_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] shadow-xs flex flex-col justify-between space-y-2 hover:-translate-y-0.5 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-base">{pack.icon === "PiggyBank" ? "🐷" : pack.icon === "BookOpen" ? "📚" : "💵"}</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514] dark:text-stone-300 border border-[#E8E5DF] dark:border-[#2A2724]">
                        {pack.badge}
                      </span>
                    </div>
                    <h5 className="font-heading font-black text-xs text-[#161514] dark:text-[#FAF8F5]">
                      {pack.name}
                    </h5>
                    <p className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] mt-0.5 line-clamp-2">
                      {pack.tagline}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#E8E5DF]/60 dark:border-[#383531] flex items-center justify-between">
                    <span className="font-mono text-[9px] text-[#6B6B6B] dark:text-[#A8A29E]">
                      {pack.items.length} envelopes
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        soundFX.playPop();
                        if (onApplyCategoryPack) {
                          await onApplyCategoryPack(pack);
                          setIsBrowsingTemplates(false);
                          toast.success(`Loaded "${pack.name}" starter pack! ✨`);
                        } else {
                          onOpenTemplates?.();
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#CEF431] text-[#161514] text-[10px] font-heading font-black border border-[#161514] shadow-xs hover:bg-[#bfe627] active:scale-95 transition-all cursor-pointer"
                    >
                      Load Pack ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── ZERO-CONFUSION FIRST-RUN ONBOARDING FOR BUDGETS ─── */}
        {expenseCategories.length === 0 ? (
          <div className="bg-white dark:bg-[#161514] rounded-2xl p-6 sm:p-8 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#03D26F] animate-pulse" />
                  <h4 className="text-sm font-heading font-black text-[#161514] dark:text-stone-100 uppercase tracking-wider">
                    Set Up Your Monthly Envelopes 🎯
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 font-bold">
                    1-TAP SETUP
                  </span>
                </div>
                <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] max-w-lg leading-relaxed">
                  Allocate monthly spending limits to prevent overspending on your digital UPI pace. 1-tap load a proven budgeting framework below or build your own custom envelopes.
                </p>
              </div>

              <button
                type="button"
                onClick={onAddCategory}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#161514] text-white hover:bg-[#2A2826] dark:bg-white dark:text-[#161514] dark:hover:bg-stone-200 text-xs font-heading font-black shadow-xs cursor-pointer transition-all self-start sm:self-auto shrink-0"
              >
                <Plus className="size-3.5 stroke-[2.2]" />
                <span>+ Custom Envelope</span>
              </button>
            </div>

            {/* 1-Tap Budget Starter Packs Grid */}
            <div className="space-y-2 pt-1">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E]">
                Quick-Load Budget Frameworks:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {BUDGET_CATEGORY_TEMPLATE_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => {
                      if (onApplyCategoryPack) {
                        onApplyCategoryPack(pack);
                      } else {
                        onOpenTemplates?.();
                      }
                    }}
                    className="text-left p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] hover:bg-white dark:hover:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724] hover:border-[#161514]/40 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-base">{pack.icon === "PiggyBank" ? "🐷" : pack.icon === "BookOpen" ? "📚" : "💵"}</span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white dark:bg-[#252321] text-[#161514] dark:text-stone-300 border border-[#E8E5DF] dark:border-[#2A2724]">
                          {pack.badge}
                        </span>
                      </div>
                      <h5 className="font-heading font-black text-xs text-[#161514] dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {pack.name}
                      </h5>
                      <p className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E] mt-1 line-clamp-2 leading-snug">
                        {pack.tagline}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#E8E5DF]/60 dark:border-[#2A2724] flex items-center justify-between text-[10px] font-bold text-[#161514] dark:text-stone-200">
                      <span className="font-mono text-[9px] text-[#6B6B6B] dark:text-[#A8A29E]">{pack.items.length} envelopes</span>
                      <span className="group-hover:translate-x-0.5 transition-transform text-emerald-800 dark:text-emerald-400 font-black">Load Pack ➔</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Envelopes Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {expenseCategories.map((cat) => {
              const spent = categorySpendMap.get(cat.id) || 0;
              const budget = cat.monthlyBudget || 0;
              const hasLimit = budget > 0;
              const percent = hasLimit ? Math.round((spent / budget) * 100) : 0;
              const isOver = hasLimit && spent > budget;
              const isWarning = hasLimit && percent >= 80 && !isOver;
              const accentColor = getCategoryAccent(cat);
              const isSelected = selectedCategoryId === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    onSelectCategory?.(cat.id);
                    onEditCategory(cat);
                  }}
                  className={cn(
                    "bg-white dark:bg-[#161514] rounded-xl border transition-all p-4 space-y-3 cursor-pointer group relative overflow-hidden shadow-xs",
                    isSelected
                      ? "border-2 border-[#161514] dark:border-[#CEF431] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#CEF431] ring-2 ring-[#CEF431]/20 -translate-y-0.5"
                      : "border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#FAF8F5] dark:hover:bg-[#1C1A18] hover:-translate-y-0.5"
                  )}
                >
                  {/* Subtle top indicator bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: accentColor }}
                  />

                  {/* Envelope Header with Crisp CategoryIcon (NO TEXT OVERLAP) */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="size-8 rounded-lg bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-center shrink-0 text-[#161514] dark:text-stone-200">
                        <CategoryIcon name={cat.icon} className="size-4 stroke-[1.5]" />
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-heading font-black text-[#161514] dark:text-stone-100 truncate block">
                          {cat.name}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-mono font-bold text-[#047857] dark:text-[#03D26F] block">
                            Active Filter
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    {hasLimit ? (
                      <span
                        className={cn(
                          "text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border shrink-0",
                          isOver
                            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-700 dark:text-rose-300"
                            : isWarning
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-800 dark:text-amber-300"
                            : "bg-[#DCFAE5] dark:bg-emerald-950/40 border-[#03D26F]/30 text-[#047857] dark:text-emerald-300"
                        )}
                      >
                        {isOver ? "Overspent" : isWarning ? "80% Cap" : "On Track"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#A8A29E] shrink-0">No Limit</span>
                    )}
                  </div>

                  {/* Spend Numbers */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-semibold text-[#161514] dark:text-stone-100 font-mono tabular-nums">
                        {currencySymbol}{spent.toLocaleString()}
                        {hasLimit && (
                          <span className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] font-normal">
                            {" "}/ {currencySymbol}{budget.toLocaleString()}
                          </span>
                        )}
                      </span>
                      {hasLimit && (
                        <span className="text-xs font-mono font-medium text-[#6B6B6B] dark:text-[#A8A29E] tabular-nums">
                          {percent}%
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {hasLimit && (
                      <div className="w-full bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            isOver ? "bg-rose-500" : isWarning ? "bg-amber-400" : "bg-[#03D26F]"
                          )}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Remaining Amount Footnote */}
                  {hasLimit && (
                    <div className="text-xs font-mono pt-1.5 border-t border-[#E8E5DF] dark:border-[#2A2724] flex justify-between items-center">
                      <span className="text-[#6B6B6B] dark:text-[#A8A29E] text-[10px]">{isOver ? "Over cap by" : "Remaining"}:</span>
                      <span className={cn("font-medium tabular-nums", isOver ? "text-rose-600 dark:text-rose-400" : "text-[#03D26F]")}>
                        {currencySymbol}{Math.abs(budget - spent).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
