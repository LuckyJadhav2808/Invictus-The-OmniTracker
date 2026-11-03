"use client";

import React from "react";
import { type Category, type Transaction } from "@/types";
import { type MonthlyBudgetStats } from "@/lib/utils/budget-rollover";
import { cn } from "@/lib/utils";
import { Plus, Sparkles, Sliders, RefreshCw, Banknote, Target, Layers } from "lucide-react";
import { CategoryIcon, getCategoryAccent } from "@/components/money/MoneyQuickActionsAndCards";
import { BUDGET_CATEGORY_TEMPLATE_PACKS } from "@/lib/templates-data";
import { type TemplatePack } from "@/components/shared/TemplateSelectionModal";

interface BudgetTabViewProps {
  categories: Category[];
  transactions: Transaction[];
  monthlyStats: MonthlyBudgetStats;
  currencySymbol: string;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onOpenTemplates: () => void;
  onOpenAllowances: () => void;
  onApplyCategoryPack?: (pack: TemplatePack) => Promise<void> | void;
}

export function BudgetTabView({
  categories,
  transactions,
  monthlyStats,
  currencySymbol,
  onAddCategory,
  onEditCategory,
  onOpenTemplates,
  onOpenAllowances,
  onApplyCategoryPack,
}: BudgetTabViewProps) {
  const expenseCategories = categories.filter((c) => c.type === "expense" && !c.archived);

  // Compute spend per category for the current target month
  const categorySpendMap = React.useMemo(() => {
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
      {/* Rollover & Allowances Summary Banner */}
      <div className="bg-white dark:bg-[#161514] p-5 rounded-2xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-4">
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
            onClick={onOpenAllowances}
            className="bg-white hover:bg-[#FAF8F5] dark:bg-[#1C1A18] dark:hover:bg-[#252321] text-[#161514] dark:text-stone-200 font-medium text-xs py-1.5 px-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="size-3.5 stroke-[1.8]" />
            <span>Configure Allowances</span>
          </button>
        </div>

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
        <div className="flex items-center justify-between px-1">
          <span className="text-[15px] font-heading font-black text-[#161514] dark:text-stone-100 tracking-tight">
            Monthly Envelopes ({expenseCategories.length})
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenTemplates}
              className="bg-white hover:bg-[#FAF8F5] dark:bg-[#161514] dark:hover:bg-[#1C1A18] text-[#161514] dark:text-stone-200 font-medium text-xs py-1.5 px-3 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="size-3.5 stroke-[1.8]" />
              <span>Template Packs</span>
            </button>

            <button
              type="button"
              onClick={onAddCategory}
              className="bg-[#161514] hover:bg-[#2A2826] dark:bg-white dark:hover:bg-stone-200 text-white dark:text-[#161514] font-medium text-xs py-1.5 px-3 rounded-xl border border-[#161514] dark:border-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5 stroke-[2]" />
              <span>+ Envelope</span>
            </button>
          </div>
        </div>

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
                Quick-Load Battle-Tested Budget Frameworks:
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
                        onOpenTemplates();
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

              return (
                <div
                  key={cat.id}
                  onClick={() => onEditCategory(cat)}
                  className="bg-white dark:bg-[#161514] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] hover:bg-[#FAF8F5] dark:hover:bg-[#1C1A18] transition-colors p-4 space-y-3 cursor-pointer group relative overflow-hidden shadow-xs hover:-translate-y-0.5"
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
                      <span className="text-xs sm:text-sm font-heading font-black text-[#161514] dark:text-stone-100 truncate">
                        {cat.name}
                      </span>
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
