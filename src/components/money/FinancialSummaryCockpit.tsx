"use client";

import React, { useState } from "react";
import { type MonthlyBudgetStats, type DailyBudgetStats } from "@/lib/utils/budget-rollover";
import { type Transaction, type Category } from "@/types";
import { StrobiCompanion } from "@/components/mascot/StrobiCompanion";
import { WalletCardDeck } from "@/components/money/WalletCardDeck";
import { RecentAccountFeed } from "@/components/money/RecentAccountFeed";

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
  onAddCategory,
  onOpenEditAllowances,
  onOpenCalculator,
  onSelectPaymentMethod,
  onRefillCashTill,
  onNavigateToTab,
  transactions,
  categories,
  onInspectTransaction,
  onEditTransaction,
  onDuplicateTransaction,
  onDeleteTransaction,
}: FinancialSummaryCockpitProps) {
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  return (
    <div className="bg-white dark:bg-[#1C1A18] rounded-3xl border border-[#E8E5DF] dark:border-[#383531] p-3.5 sm:p-5 space-y-4 shadow-xs transition-colors">
      {/* 💳 Belanje Swipeable Card Deck & Squircle Quick Launchers */}
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

      {/* Strobi Financial Defense Companion & Daily Pace Status */}
      <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#1E1B18] border-2 border-[#161514] dark:border-[#38332E] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000]">
        <div
          onClick={onAddTransaction}
          className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
          title="Click to Log Expense"
        >
          <StrobiCompanion
            gear="money"
            state={dailyStats.isOverDailyBudget ? "fire" : "idle"}
            size={40}
            className="shrink-0"
          />
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514]">
                {dailyStats.isOverDailyBudget ? "🚨 BUDGET CEILING" : "🛡️ FINANCIAL DEFENSE"}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">Strobi Guardian</span>
            </div>
            <div className="text-xs font-mono text-[#161514] dark:text-[#FAF8F5] truncate">
              {dailyStats.isOverDailyBudget ? (
                <span className="text-rose-600 dark:text-rose-400 font-black">
                  Pace exceeded by {currencySymbol}{dailyStats.overDailyAmount.toLocaleString()}! Lock down spends.
                </span>
              ) : (
                <span>
                  Safe pace: <strong className="font-black text-[#047857] dark:text-[#03D26F]">~{currencySymbol}{dailyStats.todayRemaining.toLocaleString()}</strong> remaining today
                </span>
              )}
            </div>
          </div>
        </div>

        {onOpenEditAllowances && (
          <button
            type="button"
            onClick={onOpenEditAllowances}
            className="text-[11px] font-heading font-black text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2.5 py-1.5 rounded-xl border border-border bg-secondary hover:bg-muted shrink-0 shadow-2xs"
          >
            Adjust Limits ▾
          </button>
        )}
      </div>

      {/* ⚡ Belanje Card-Linked Dynamic Recent Feed (Photo 1 Benchmark) */}
      {transactions && categories && (
        <RecentAccountFeed
          activeCardIndex={activeCardIndex}
          transactions={transactions}
          categories={categories}
          currencySymbol={currencySymbol}
          dailyStats={dailyStats}
          monthlyStats={monthlyStats}
          onInspectTransaction={onInspectTransaction || (() => {})}
          onEditTransaction={onEditTransaction}
          onDuplicateTransaction={onDuplicateTransaction}
          onDeleteTransaction={onDeleteTransaction}
          onSeeAll={(method) => {
            if (onSelectPaymentMethod) {
              onSelectPaymentMethod(method || "all");
            }
            onNavigateToTab?.("ledger");
          }}
          onAddTransaction={(suggestedMethod) => {
            if (suggestedMethod && onSelectPaymentMethod) {
              onSelectPaymentMethod(suggestedMethod);
            }
            onAddTransaction();
          }}
          onOpenAllowances={onOpenEditAllowances}
        />
      )}
    </div>
  );
}
