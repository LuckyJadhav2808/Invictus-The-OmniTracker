"use client";

import React, { useState } from "react";
import { type MonthlyBudgetStats, type DailyBudgetStats } from "@/lib/utils/budget-rollover";
import { type Transaction, type Category } from "@/types";
import { VixPixelCompanion } from "@/components/mascot/VixPixelCompanion";
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
  onSelectPaymentMethod?: (method: "upi" | "cash") => void;
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

      {/* Vix Companion Mascot & Daily Pace Status */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E8E5DF] dark:border-[#383531]">
        <div
          onClick={onAddTransaction}
          className="bg-[#FAF8F5] dark:bg-[#252321] px-3 py-1.5 rounded-xl border border-[#E8E5DF] dark:border-[#383531] flex items-center gap-2.5 cursor-pointer hover:bg-[#F1EFEA] dark:hover:bg-[#2e2b28] transition-colors"
          title="Click to Log Expense"
        >
          <VixPixelCompanion
            gear="money"
            state={dailyStats.isOverDailyBudget ? "fire" : "idle"}
            size={22}
          />
          <div className="text-xs font-mono text-[#161514] dark:text-[#FAF8F5]">
            {dailyStats.isOverDailyBudget ? (
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                Daily pace exceeded by {currencySymbol}{dailyStats.overDailyAmount.toLocaleString()}
              </span>
            ) : (
              <span>Safe pace: <strong className="font-bold text-[#047857] dark:text-[#03D26F]">~{currencySymbol}{dailyStats.todayRemaining.toLocaleString()}</strong> remaining today</span>
            )}
          </div>
        </div>

        {onOpenEditAllowances && (
          <button
            type="button"
            onClick={onOpenEditAllowances}
            className="text-[11px] font-heading font-bold text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5] transition-colors cursor-pointer px-2 py-1"
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
            if (method && method !== "all" && onSelectPaymentMethod) {
              onSelectPaymentMethod(method);
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
