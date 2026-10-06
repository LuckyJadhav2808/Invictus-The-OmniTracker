"use client";

import React from "react";
import { type Category, type Transaction } from "@/types";
import { type MonthlyBudgetStats } from "@/lib/utils/budget-rollover";
import { cn } from "@/lib/utils";
import { Plus, Sparkles, AlertCircle, CheckCircle2, Sliders } from "lucide-react";
import { renderCategoryEmoji } from "@/components/money/MoneyQuickActionsAndCards";

interface BudgetTabViewProps {
  categories: Category[];
  transactions: Transaction[];
  monthlyStats: MonthlyBudgetStats;
  currencySymbol: string;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onOpenTemplates: () => void;
  onOpenAllowances: () => void;
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
      {/* 🔄 Rollover Summary Banner */}
      <div className="bg-[#FAF8F5] p-4 sm:p-5 rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#161514]/10 pb-2.5">
          <div className="space-y-0.5">
            <span className="text-xs font-black uppercase tracking-wider text-[#161514] flex items-center gap-1.5" style={{ fontFamily: "var(--font-heading)" }}>
              <span>🔄</span>
              <span>Monthly Rollover & Allowances</span>
            </span>
            <span className="text-[10px] text-[#161514]/60 font-bold block">
              Previous month unspent cashflow carries over automatically
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenAllowances}
            className="bg-white hover:bg-[#CEF431] text-[#161514] font-black text-[11px] uppercase tracking-wider py-1.5 px-3 rounded-xl border border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="size-3" />
            <span>Configure Allowances</span>
          </button>
        </div>

        {/* Rollover Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white p-2.5 rounded-xl border border-[#161514]">
            <span className="text-[9px] font-black uppercase text-[#161514]/60 block">Base Allowance</span>
            <span className="text-sm sm:text-base font-black text-[#161514] font-heading mt-0.5 block">
              {currencySymbol}{monthlyStats.baseBudget.toLocaleString()}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-[#161514]">
            <span className="text-[9px] font-black uppercase text-emerald-700 block">Rollover Surplus</span>
            <span className="text-sm sm:text-base font-black text-emerald-700 font-heading mt-0.5 block">
              +{currencySymbol}{monthlyStats.rolloverSurplus.toLocaleString()}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-[#161514]">
            <span className="text-[9px] font-black uppercase text-[#161514]/60 block">Total Spendable</span>
            <span className="text-sm sm:text-base font-black text-[#161514] font-heading mt-0.5 block">
              {currencySymbol}{monthlyStats.totalAvailableBudget.toLocaleString()}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-[#161514]">
            <span className="text-[9px] font-black uppercase text-[#161514]/60 block">Daily Velocity Pace</span>
            <span className="text-sm sm:text-base font-black text-[#03D26F] font-heading mt-0.5 block">
              ~{currencySymbol}{monthlyStats.dailySafeToSpend.toLocaleString()}/day
            </span>
          </div>
        </div>
      </div>

      {/* 🏷️ CATEGORY ENVELOPES SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-[#161514]" style={{ fontFamily: "var(--font-heading)" }}>
            Monthly Envelopes ({expenseCategories.length})
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenTemplates}
              className="bg-white hover:bg-[#FAF8F5] text-[#161514] font-black text-[10px] uppercase py-1 px-2.5 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="size-3" />
              <span>Template Packs</span>
            </button>

            <button
              type="button"
              onClick={onAddCategory}
              className="bg-[#CEF431] hover:bg-[#bde422] text-[#161514] font-black text-[10px] uppercase py-1 px-2.5 rounded-lg border border-[#161514] shadow-[1px_1px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="size-3 stroke-[3]" />
              <span>+ Envelope</span>
            </button>
          </div>
        </div>

        {/* Envelopes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {expenseCategories.map((cat) => {
            const spent = categorySpendMap.get(cat.id) || 0;
            const budget = cat.monthlyBudget || 0;
            const hasLimit = budget > 0;
            const percent = hasLimit ? Math.round((spent / budget) * 100) : 0;
            const isOver = hasLimit && spent > budget;
            const isWarning = hasLimit && percent >= 80 && !isOver;

            return (
              <div
                key={cat.id}
                onClick={() => onEditCategory(cat)}
                className="bg-white rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:shadow-[4px_4px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all p-4 space-y-3 cursor-pointer group"
              >
                {/* Envelope Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="size-9 rounded-xl bg-[#FAF8F5] border-2 border-[#161514] flex items-center justify-center text-lg shadow-[1px_1px_0px_0px_#161514]">
                      {renderCategoryEmoji(cat.icon)}
                    </span>
                    <span className="text-xs font-black text-[#161514] group-hover:underline">
                      {cat.name}
                    </span>
                  </div>

                  {/* Status Badge */}
                  {hasLimit ? (
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-[#161514]",
                        isOver
                          ? "bg-rose-400 text-[#161514]"
                          : isWarning
                          ? "bg-amber-300 text-[#161514]"
                          : "bg-[#03D26F]/30 text-emerald-950"
                      )}
                    >
                      {isOver ? "Overspent!" : isWarning ? "80% Cap" : "On Track"}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-[#161514]/50">No Limit</span>
                  )}
                </div>

                {/* Spend Numbers */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-black text-[#161514] font-heading">
                      {currencySymbol}{spent.toLocaleString()}
                      {hasLimit && (
                        <span className="text-[10px] text-[#161514]/60 font-medium">
                          {" "}/ {currencySymbol}{budget.toLocaleString()}
                        </span>
                      )}
                    </span>
                    {hasLimit && (
                      <span className="text-[10px] font-black text-[#161514]">
                        {percent}%
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {hasLimit && (
                    <div className="w-full bg-[#FAF8F5] h-2.5 rounded-full border border-[#161514] overflow-hidden p-0.2">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isOver ? "bg-rose-500" : isWarning ? "bg-amber-400" : "bg-[#03D26F]"
                        )}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Remaining Amount Footnote */}
                {hasLimit && (
                  <div className="text-[10px] font-bold text-[#161514]/70 pt-1 border-t border-[#161514]/10 flex justify-between items-center">
                    <span>{isOver ? "Over Cap by" : "Remaining"}:</span>
                    <span className={cn("font-black", isOver ? "text-rose-600" : "text-emerald-700")}>
                      {currencySymbol}{Math.abs(budget - spent).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
