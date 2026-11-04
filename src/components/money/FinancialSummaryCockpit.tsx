"use client";

import React from "react";
import { type MonthlyBudgetStats, type DailyBudgetStats } from "@/lib/utils/budget-rollover";
import { VixPixelCompanion } from "@/components/mascot/VixPixelCompanion";
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
  onAddTransaction: () => void;
  onBulkScan: () => void;
  onAddCategory: () => void;
  onOpenEditAllowances: () => void;
  onOpenCalculator?: () => void;
  onSelectPaymentMethod?: (method: "upi" | "cash") => void;
  onRefillCashTill?: () => void;
}

export function FinancialSummaryCockpit({
  monthlyStats,
  dailyStats,
  currencySymbol,
  onAddTransaction,
  onBulkScan,
  onOpenCalculator,
  onSelectPaymentMethod,
  onRefillCashTill,
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
    <div className="bg-white dark:bg-[#1C1A18] rounded-2xl border border-[#E8E5DF] dark:border-[#383531] p-4 sm:p-5 space-y-3.5 shadow-xs transition-colors">
      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E8E5DF] dark:border-[#383531]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="size-2 rounded-full bg-[#03D26F] shrink-0" />
          <h2 className="text-sm sm:text-[15px] font-heading font-bold text-[#161514] dark:text-[#FAF8F5] truncate tracking-tight">
            Financial Cockpit
          </h2>
          <span className="text-[11px] font-mono font-medium text-[#6B6B6B] dark:text-[#A8A29E] bg-[#FAF8F5] dark:bg-[#252321] px-2 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531]">
            {monthlyStats.targetMonthLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] font-mono hidden md:inline-block tabular-nums">
            Safe pace: ~{currencySymbol}{dailyStats.todayRemaining.toLocaleString()}/day
          </span>
          <span
            className={cn(
              "text-xs font-mono font-semibold px-2 py-0.5 rounded-md border tabular-nums",
              budgetPercentageRemaining <= 15
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/40"
                : budgetPercentageRemaining <= 30
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/40"
                : "bg-[#DCFAE5] dark:bg-[#03D26F]/20 text-[#04250e] dark:text-[#03D26F] border-[#03D26F]/30"
            )}
          >
            {budgetPercentageRemaining}% Left
          </span>
        </div>
      </div>

      {/* Main Liquidity Hero Section (Zero-Nesting, High Density) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pt-0.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-[#6B6B6B] dark:text-[#A8A29E]">
              Spendable Liquidity
            </span>
            {monthlyStats.rolloverSurplus > 0 && (
              <span className="text-[10px] font-mono font-bold tabular-nums text-[#047857] dark:text-[#03D26F] bg-[#DCFAE5] dark:bg-[#03D26F]/20 px-1.5 py-0.5 rounded border border-[#03D26F]/30">
                +{currencySymbol}{monthlyStats.rolloverSurplus.toLocaleString()} Rollover
              </span>
            )}
          </div>
          <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-[#161514] dark:text-[#FAF8F5] tabular-nums mt-0.5 leading-tight">
            {currencySymbol}{monthlyStats.remainingBudget.toLocaleString()}
          </div>
        </div>

        <div className="text-xs font-mono text-[#6B6B6B] dark:text-[#A8A29E] tabular-nums sm:text-right">
          Budget: <span className="font-semibold text-[#161514] dark:text-[#FAF8F5]">{currencySymbol}{monthlyStats.totalAvailableBudget.toLocaleString()}</span>
          {" • "}
          Spent: <span className="font-semibold text-rose-600 dark:text-rose-400">{currencySymbol}{monthlyStats.onlineExpense.toLocaleString()}</span>
        </div>
      </div>

      {/* Single 4px Progress Line */}
      <div className="w-full bg-[#E8E5DF] dark:bg-[#2A2724] h-1.5 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            budgetPercentageRemaining <= 15
              ? "bg-rose-500"
              : budgetPercentageRemaining <= 30
              ? "bg-amber-400"
              : "bg-[#03D26F]"
          )}
          style={{ width: `${Math.max(3, budgetPercentageRemaining)}%` }}
        />
      </div>

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

      {/* Action Row + Vix Mascot Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E8E5DF] dark:border-[#383531]">
        <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
          <button
            type="button"
            onClick={onAddTransaction}
            className="flex-1 py-1.5 px-3 bg-[#161514] dark:bg-[#CEF431] hover:bg-[#2A2826] dark:hover:bg-[#d6f64d] text-white dark:text-[#161514] font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[36px]"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Log Expense</span>
          </button>

          {onOpenCalculator && (
            <button
              type="button"
              onClick={onOpenCalculator}
              className="py-1.5 px-2.5 bg-white dark:bg-[#252321] hover:bg-[#FAF8F5] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] font-medium text-xs rounded-lg border border-[#E8E5DF] dark:border-[#383531] transition-colors flex items-center justify-center gap-1 cursor-pointer min-h-[36px]"
              title="Open Calculator"
            >
              <Calculator className="size-3.5 stroke-[1.75]" />
              <span className="hidden sm:inline">Calc</span>
            </button>
          )}

          <button
            type="button"
            onClick={onBulkScan}
            className="py-1.5 px-2.5 bg-white dark:bg-[#252321] hover:bg-[#FAF8F5] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] font-medium text-xs rounded-lg border border-[#E8E5DF] dark:border-[#383531] transition-colors flex items-center justify-center gap-1 cursor-pointer min-h-[36px]"
            title="Bulk Expenses or OCR Scan"
          >
            <ScanLine className="size-3.5 stroke-[1.75]" />
            <span className="hidden sm:inline">Scan</span>
          </button>
        </div>

        {/* Vix Companion Mascot */}
        <div
          onClick={onAddTransaction}
          className="bg-[#FAF8F5] dark:bg-[#252321] px-2.5 py-1 rounded-lg border border-[#E8E5DF] dark:border-[#383531] flex items-center gap-2 cursor-pointer hover:bg-[#F1EFEA] dark:hover:bg-[#2e2b28] transition-colors shrink-0 min-h-[36px]"
          title="Click to Log Expense"
        >
          <VixPixelCompanion
            gear="money"
            state={dailyStats.isOverDailyBudget ? "fire" : "idle"}
            size={20}
          />
          <div className="text-[11px] font-mono text-[#161514] dark:text-[#FAF8F5]">
            {dailyStats.isOverDailyBudget ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                Over by {currencySymbol}{dailyStats.overDailyAmount.toLocaleString()}
              </span>
            ) : (
              <span>~{currencySymbol}{dailyStats.todayRemaining.toLocaleString()} today</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
