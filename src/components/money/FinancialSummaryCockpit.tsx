"use client";

import React from "react";
import { type MonthlyBudgetStats, type DailyBudgetStats } from "@/lib/utils/budget-rollover";
import { VixPixelCompanion } from "@/components/mascot/VixPixelCompanion";
import { WalletCardDeck } from "@/components/money/WalletCardDeck";
import {
  Plus,
  ScanLine,
  ArrowUpRight,
  ArrowDownRight,
  Smartphone,
  Banknote,
  RotateCcw,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialSummaryCockpitProps {
  monthlyStats: MonthlyBudgetStats;
  dailyStats: DailyBudgetStats;
  currencySymbol: string;
  selectedMonth?: string;
  availableMonths?: Array<{ key: string; label: string; isCurrent: boolean }>;
  onSelectMonth?: (monthKey: string) => void;
  onResetToCurrentMonth?: () => void;
  onAddTransaction: () => void;
  onBulkScan: () => void;
  onAddCategory: () => void;
  onOpenEditAllowances: () => void;
  onOpenCalculator?: () => void;
  onSelectPaymentMethod?: (method: "upi" | "cash") => void;
  onRefillCashTill?: () => void;
  onNavigateToTab?: (tab: "ledger" | "budgets" | "vault" | "analytics") => void;
}

export function FinancialSummaryCockpit({
  monthlyStats,
  dailyStats,
  currencySymbol,
  selectedMonth,
  availableMonths,
  onSelectMonth,
  onResetToCurrentMonth,
  onAddTransaction,
  onBulkScan,
  onAddCategory,
  onOpenEditAllowances,
  onOpenCalculator,
  onSelectPaymentMethod,
  onRefillCashTill,
  onNavigateToTab,
}: FinancialSummaryCockpitProps) {
  const budgetPercentageRemaining = Math.max(
    0,
    Math.min(
      100,
      monthlyStats.totalAvailableBudget > 0
        ? Math.round((monthlyStats.remainingBudget / monthlyStats.totalAvailableBudget) * 100)
        : 0
    )
  );

  // Net Cashflow
  const netCashflow = monthlyStats.monthlyIncome - monthlyStats.monthlyExpense;

  // Channel percentages
  const totalChannelMonth = monthlyStats.upiExpense + monthlyStats.cashExpense;
  const upiMonthPercent = totalChannelMonth > 0 ? Math.round((monthlyStats.upiExpense / totalChannelMonth) * 100) : 0;

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
      />

      {/* Channels Data Rail (Flat 3-Column Strip on Mobile and Desktop) */}
      <div className="grid grid-cols-3 divide-x divide-[#E8E5DF] dark:divide-[#383531] rounded-xl border border-[#E8E5DF] dark:border-[#383531] bg-[#FAF8F5] dark:bg-[#161514] overflow-hidden">
        {/* Item 1: UPI Payments */}
        <div
          onClick={() => onSelectPaymentMethod?.("upi")}
          className={cn(
            "p-2.5 sm:p-3 flex flex-col justify-between transition-colors",
            onSelectPaymentMethod && "cursor-pointer hover:bg-white dark:hover:bg-[#201D1A]"
          )}
          title="Filter UPI in Ledger"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1 truncate">
              <Smartphone className="size-3 stroke-[2] shrink-0 text-[#161514] dark:text-[#FAF8F5]" />
              <span className="truncate">UPI</span>
            </span>
            <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E] hidden sm:inline">
              {upiMonthPercent}%
            </span>
          </div>
          <div className="mt-1">
            <span className="text-xs sm:text-sm font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums block">
              -{currencySymbol}{monthlyStats.upiExpense.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-[#8C8882] dark:text-[#A8A29E] truncate block">
              Today: -{currencySymbol}{dailyStats.todayUpiExpense.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Item 2: Cash Till */}
        <div
          onClick={() => onSelectPaymentMethod?.("cash")}
          className={cn(
            "p-2.5 sm:p-3 flex flex-col justify-between transition-colors",
            onSelectPaymentMethod && "cursor-pointer hover:bg-white dark:hover:bg-[#201D1A]"
          )}
          title="Filter Cash in Ledger"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1 truncate">
              <Banknote className="size-3 stroke-[2] shrink-0 text-[#161514] dark:text-[#FAF8F5]" />
              <span className="truncate">Cash Till</span>
            </span>
            {onRefillCashTill && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefillCashTill();
                }}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] hover:bg-[#FAF8F5] cursor-pointer"
                title="Refill Cash Till"
              >
                Refill
              </button>
            )}
          </div>
          <div className="mt-1">
            <span className="text-xs sm:text-sm font-mono font-bold text-[#047857] dark:text-[#03D26F] tabular-nums block">
              {currencySymbol}{monthlyStats.remainingCashBudget.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-[#8C8882] dark:text-[#A8A29E] truncate block">
              In Pocket
            </span>
          </div>
        </div>

        {/* Item 3: Net Flow */}
        <div className="p-2.5 sm:p-3 flex flex-col justify-between bg-white dark:bg-[#1C1A18]/60">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1 truncate">
              {netCashflow >= 0 ? (
                <ArrowUpRight className="size-3 stroke-[2] shrink-0 text-[#03D26F]" />
              ) : (
                <ArrowDownRight className="size-3 stroke-[2] shrink-0 text-rose-500" />
              )}
              <span className="truncate">Net Flow</span>
            </span>
          </div>
          <div className="mt-1">
            <span
              className={cn(
                "text-xs sm:text-sm font-mono font-bold tabular-nums block",
                netCashflow >= 0 ? "text-[#03D26F]" : "text-rose-500"
              )}
            >
              {netCashflow >= 0
                ? `+${currencySymbol}${netCashflow.toLocaleString()}`
                : `-${currencySymbol}${Math.abs(netCashflow).toLocaleString()}`}
            </span>
            <span className="text-[10px] font-mono text-[#8C8882] dark:text-[#A8A29E] truncate block">
              +{currencySymbol}{monthlyStats.monthlyIncome.toLocaleString()} / -{currencySymbol}{monthlyStats.monthlyExpense.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Vix Companion Mascot & Daily Pace Status */}
      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#E8E5DF] dark:border-[#383531]">
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
    </div>
  );
}
