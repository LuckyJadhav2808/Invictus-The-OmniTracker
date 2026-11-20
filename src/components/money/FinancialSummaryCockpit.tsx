"use client";

import { useState } from "react";
import { type MonthlyBudgetStats, type DailyBudgetStats } from "@/lib/utils/budget-rollover";
import { type Transaction, type Category } from "@/types";
import { StrobiCompanion } from "@/components/mascot/StrobiCompanion";
import { WalletCardDeck } from "@/components/money/WalletCardDeck";
import { Sliders } from "lucide-react";

interface FinancialSummaryCockpitProps {
  monthlyStats: MonthlyBudgetStats;
  dailyStats: DailyBudgetStats;
  currencySymbol: string;
  selectedMonth?: string;
  onResetToCurrentMonth?: () => void;
  onAddTransaction: () => void;
  onBulkScan: () => void;
  onAddCategory: () => void;
  onOpenEditAllowances: () => void;
  onOpenCalculator?: () => void;
  onSelectPaymentMethod?: (method: "upi" | "cash" | "all") => void;
  onRefillCashTill?: () => void;
  onNavigateToTab?: (tab: "ledger" | "budgets" | "vault" | "analytics") => void;
  transactions?: Transaction[];
  categories?: Category[];
  onInspectTransaction?: (tx: Transaction) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDuplicateTransaction?: (tx: Transaction) => Promise<void>;
  onDeleteTransaction?: (id: string) => Promise<void>;
}

export function FinancialSummaryCockpit({
  monthlyStats,
  dailyStats,
  currencySymbol,
  selectedMonth,
  onResetToCurrentMonth,
  onAddTransaction,
  onBulkScan,
  onOpenEditAllowances,
  onOpenCalculator,
  onSelectPaymentMethod,
  onRefillCashTill,
  onNavigateToTab,
}: FinancialSummaryCockpitProps) {
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  return (
    <div className="w-full space-y-3">
      {/* 💳 Belanje Swipeable Card Deck & Squircle Quick Launchers (Untouched Main Component) */}
      <WalletCardDeck
        monthlyStats={monthlyStats}
        dailyStats={dailyStats}
        currencySymbol={currencySymbol}
        selectedMonth={selectedMonth}
        onResetToCurrentMonth={onResetToCurrentMonth}
        onOpenAllowances={onOpenEditAllowances}
        onRefillCashTill={onRefillCashTill}
        onSelectPaymentMethod={onSelectPaymentMethod}
        onAddTransaction={onAddTransaction}
        onBulkScan={onBulkScan}
        onOpenCalculator={onOpenCalculator}
        onNavigateToTab={onNavigateToTab}
        activeCardIndex={activeCardIndex}
        onActiveCardChange={setActiveCardIndex}
      />

      {/* 🧭 Ambient Strobi Financial Pace Telemetry (Neobrutalist, Unclipped, Tactile) */}
      <div className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl bg-card border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] select-none">
        <div
          onClick={onAddTransaction}
          className="flex items-center gap-2.5 cursor-pointer group flex-1 min-w-0"
          title="Click to Log Expense"
        >
          <StrobiCompanion
            gear="money"
            state={dailyStats.isOverDailyBudget ? "fire" : "idle"}
            size={32}
            className="shrink-0"
          />
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold leading-tight">
              {dailyStats.isOverDailyBudget ? "Pace Exceeded" : "Daily Safe Pace"}
            </div>
            <p className="text-xs font-mono font-medium text-foreground leading-tight mt-0.5">
              {dailyStats.isOverDailyBudget ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  Over by {currencySymbol}{dailyStats.overDailyAmount.toLocaleString()} today
                </span>
              ) : (
                <span>
                  <strong className="font-bold text-[#047857] dark:text-[#03D26F] text-xs sm:text-sm tabular-nums">
                    {currencySymbol}{dailyStats.todayRemaining.toLocaleString()}
                  </strong>{" "}
                  remaining
                </span>
              )}
            </p>
          </div>
        </div>

        {onOpenEditAllowances && (
          <button
            type="button"
            onClick={onOpenEditAllowances}
            className="text-[10px] sm:text-[11px] font-heading font-black text-[#161514] dark:text-[#FAF8F5] bg-secondary hover:bg-muted border border-border px-2.5 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer shrink-0 min-h-[34px] flex items-center gap-1"
            title="Adjust monthly UPI, Cash, and Daily spending limits"
          >
            <Sliders className="size-3 stroke-[2.5]" />
            <span>Limits</span>
          </button>
        )}
      </div>
    </div>
  );
}
