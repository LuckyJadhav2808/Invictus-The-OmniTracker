"use client";

import React, { useState } from "react";
import { type MonthlyBudgetStats, type DailyBudgetStats } from "@/lib/utils/budget-rollover";
import { type Transaction, type Category } from "@/types";
import { StrobiCompanion } from "@/components/mascot/StrobiCompanion";
import { WalletCardDeck } from "@/components/money/WalletCardDeck";

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

      {/* 🧭 Ambient Strobi Financial Pace Telemetry (Sleek Ambient Ribbon, No Border Fatigue) */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-card/60 backdrop-blur-xs border border-border/80">
        <div
          onClick={onAddTransaction}
          className="flex items-center gap-2.5 cursor-pointer group flex-1 min-w-0"
          title="Click to Log Expense"
        >
          <StrobiCompanion
            gear="money"
            state={dailyStats.isOverDailyBudget ? "fire" : "idle"}
            size={28}
            className="shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-mono font-medium text-foreground truncate">
              {dailyStats.isOverDailyBudget ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  Pace exceeded by {currencySymbol}{dailyStats.overDailyAmount.toLocaleString()} today
                </span>
              ) : (
                <span>
                  Daily pace: <strong className="font-bold text-[#047857] dark:text-[#03D26F]">{currencySymbol}{dailyStats.todayRemaining.toLocaleString()}</strong> remaining
                </span>
              )}
            </p>
          </div>
        </div>

        {onOpenEditAllowances && (
          <button
            type="button"
            onClick={onOpenEditAllowances}
            className="text-[11px] font-heading font-black text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg border border-border/70 bg-secondary/80 hover:bg-muted shrink-0 min-h-[36px] flex items-center"
          >
            Adjust Limits
          </button>
        )}
      </div>
    </div>
  );
}
