"use client";

import { useState } from "react";
import { BarChart2, TrendingUp, Smartphone, Banknote, FileDown } from "lucide-react";
import { SubpageHeader } from "@/components/shared/SubpageHeader";
import { MobileAppBar } from "@/components/mobile/MobileAppBar";
import { useCategories, useTransactions } from "@/lib/queries/money";
import { AnalyticsTabView } from "@/components/money/views/AnalyticsTabView";
import { format } from "date-fns";
import { soundFX } from "@/components/shared/SoundFX";

export default function MoneyAnalyticsPage() {
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();
  const currentMonthKey = format(new Date(), "yyyy-MM");

  return (
    <div className="w-full max-w-xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-3.5 select-none animate-in fade-in duration-200 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      {/* Dynamic Strobi Top App Bar */}
      <div className="-mx-2 -mt-2 sm:-mx-4 sm:-mt-4 lg:hidden">
        <MobileAppBar title="Analytics" showDynamicIsland={true} />
      </div>

      {/* 1. Title Bar with inline back button */}
      <SubpageHeader
        backHref="/money"
        backLabel="Money"
        title="Spend Analytics & Velocity"
        badge="Telemetry Engine"
        badgeColorClass="bg-purple-400/20 text-purple-700 dark:text-purple-300 border-purple-500/30"
        subtitle="Visual breakdown, cash velocity, category distribution & payment methods"
        icon={BarChart2}
        rightAction={
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              soundFX.vibrate(15);
              window.dispatchEvent(new CustomEvent("invictus:money-export"));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#161514] bg-[#03D26F] text-[#161514] font-heading font-black text-xs shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
          >
            <FileDown className="size-3.5 stroke-[2.5]" />
            <span>Export PDF</span>
          </button>
        }
      />

      {/* 2. Full-Feature Analytics View */}
      <AnalyticsTabView
        transactions={transactions}
        categories={categories}
        currencySymbol="₹"
        targetMonthKey={currentMonthKey}
        onOpenAddTransaction={() => {
          window.dispatchEvent(new CustomEvent("invictus:money-new-expense"));
        }}
      />
    </div>
  );
}
