"use client";

import { useMemo } from "react";
import { Target, Plus } from "lucide-react";
import { SubpageHeader } from "@/components/shared/SubpageHeader";
import { useCategories, useTransactions } from "@/lib/queries/money";
import { BudgetTabView } from "@/components/money/views/BudgetTabView";
import { computeMonthlyBudgetStats } from "@/lib/utils/budget-rollover";
import { soundFX } from "@/components/shared/SoundFX";

export default function MoneyBudgetsPage() {
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();

  const monthlyStats = useMemo(() => {
    return computeMonthlyBudgetStats({
      transactions,
      categories,
      baseBudget: 15000,
      enableRollover: true,
    });
  }, [transactions, categories]);

  return (
    <div className="w-full max-w-xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-3.5 select-none animate-in fade-in duration-200 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      {/* 1. Subpage Header with Back Navigation */}
      <SubpageHeader
        backHref="/money"
        backLabel="Money"
        title="Budget Limits & Allowances"
        badge="Zero-Based Limits"
        badgeColorClass="bg-emerald-400/20 text-emerald-700 dark:text-[#03D26F] border-emerald-500/30"
        subtitle="Monthly allowances, daily safe pace & rollover discipline"
        icon={Target}
        rightAction={
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              soundFX.vibrate(15);
              window.dispatchEvent(new CustomEvent("invictus:money-new-expense"));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#161514] bg-[#CEF431] text-[#161514] font-heading font-black text-xs shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <Plus className="size-3.5 stroke-[3]" />
            <span>Log Expense</span>
          </button>
        }
      />

      {/* 2. Budget Tab View */}
      <BudgetTabView
        categories={categories}
        transactions={transactions}
        monthlyStats={monthlyStats}
        currencySymbol="₹"
        defaultUpiBudget={10000}
        defaultCashBudget={5000}
        defaultEnableRollover={true}
        onAddCategory={() => {
          window.dispatchEvent(new CustomEvent("invictus:money-new-category"));
        }}
        onEditCategory={() => {}}
      />
    </div>
  );
}
