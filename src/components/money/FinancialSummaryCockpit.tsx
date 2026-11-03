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
    <div className="bg-white dark:bg-[#1C1A18] rounded-xl border border-[#E8E5DF] dark:border-[#383531] p-4 sm:p-5 space-y-4">
      {/* Top Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E8E5DF] dark:border-[#383531]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="size-2 rounded-full bg-[#03D26F] shrink-0" />
          <h2 className="text-[15px] font-sans font-semibold text-[#161514] dark:text-[#FAF8F5] truncate tracking-tight">
            Financial Cockpit
          </h2>
          <span className="text-xs font-mono text-[#6B6B6B] dark:text-[#A8A29E] bg-[#F1EFEA] dark:bg-[#252321] px-2 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531]">
            {monthlyStats.targetMonthLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] font-mono hidden sm:inline-block tabular-nums">
            Daily target: ~{currencySymbol}{dailyStats.todayRemaining.toLocaleString()}/day
          </span>
          <span
            className={cn(
              "text-xs font-mono font-medium px-2.5 py-0.5 rounded-md border tabular-nums",
              budgetPercentageRemaining <= 15
                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-900/40"
                : budgetPercentageRemaining <= 30
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-900/40"
                : "bg-[#DCFAE5] dark:bg-[#03D26F]/20 text-[#04250e] dark:text-[#03D26F] border-[#03D26F]/30"
            )}
          >
            {budgetPercentageRemaining}% Remaining
          </span>
        </div>
      </div>

      {/* Dense 3-Column Cockpit Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
        
        {/* Col 1: Monthly Spendable Billfold (5 cols) */}
        <div className="md:col-span-5 bg-[#FAF8F5] dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#383531] rounded-xl p-4 flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between gap-1.5 mb-1">
              <span className="text-xs font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                Spendable Liquidity
              </span>
              {monthlyStats.rolloverSurplus > 0 && (
                <span className="text-[10px] font-mono tabular-nums text-[#047857] dark:text-[#03D26F] bg-[#DCFAE5] dark:bg-[#03D26F]/20 px-1.5 py-0.5 rounded border border-[#03D26F]/30">
                  +{currencySymbol}{monthlyStats.rolloverSurplus.toLocaleString()} Rollover
                </span>
              )}
            </div>

            <div className="text-3xl sm:text-4xl font-mono font-semibold tracking-tight text-[#161514] dark:text-[#FAF8F5] tabular-nums leading-tight">
              {currencySymbol}{monthlyStats.remainingBudget.toLocaleString()}
            </div>
            <div className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] font-mono tabular-nums mt-0.5">
              Budget: {currencySymbol}{monthlyStats.totalAvailableBudget.toLocaleString()} • {currencySymbol}{monthlyStats.onlineExpense.toLocaleString()} Spent
            </div>
          </div>

          {/* Progress Bar snug immediately below figures */}
          <div className="space-y-1 pt-1.5 border-t border-[#E8E5DF] dark:border-[#383531]">
            <div className="h-1.5 w-full bg-[#E8E5DF] dark:bg-[#383531] rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  budgetPercentageRemaining <= 15
                    ? "bg-rose-500"
                    : budgetPercentageRemaining <= 30
                    ? "bg-amber-500"
                    : "bg-[#03D26F]"
                )}
                style={{ width: `${Math.max(3, budgetPercentageRemaining)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
              <span>{currencySymbol}{monthlyStats.onlineExpense.toLocaleString()} Spent</span>
              <span>{budgetPercentageRemaining}% Left</span>
            </div>
          </div>
        </div>

        {/* Col 2: Payment Channels (4 cols) */}
        <div className="md:col-span-4 flex flex-col justify-between gap-2">
          {/* UPI Row */}
          <div
            onClick={() => onSelectPaymentMethod?.("upi")}
            className={cn(
              "bg-[#FAF8F5] dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#383531] rounded-xl p-3 flex-1 flex flex-col justify-between transition-colors",
              onSelectPaymentMethod && "cursor-pointer hover:bg-[#F5F3EF] dark:hover:bg-[#201D1A]"
            )}
            title="Click to view UPI transactions in Ledger"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[#E8E5DF] dark:border-[#383531]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#161514] dark:text-[#FAF8F5]">
                <Smartphone className="size-3.5 text-[#161514] dark:text-[#FAF8F5] stroke-[1.5]" />
                <span>UPI Payments</span>
              </div>
              <span className="text-[10px] font-mono text-[#6B6B6B] dark:text-[#A8A29E]">
                {upiMonthPercent}% spend
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 font-mono text-xs">
              <span className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E]">Today: <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">-{currencySymbol}{dailyStats.todayUpiExpense.toLocaleString()}</span></span>
              <span className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E]">Month: <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">-{currencySymbol}{monthlyStats.upiExpense.toLocaleString()}</span></span>
            </div>
          </div>

          {/* Cash Till Row */}
          <div
            onClick={() => onSelectPaymentMethod?.("cash")}
            className={cn(
              "bg-[#FAF8F5] dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#383531] rounded-xl p-3 flex-1 flex flex-col justify-between transition-colors",
              onSelectPaymentMethod && "cursor-pointer hover:bg-[#F5F3EF] dark:hover:bg-[#201D1A]"
            )}
            title="Click to view Cash transactions in Ledger"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[#E8E5DF] dark:border-[#383531]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#161514] dark:text-[#FAF8F5]">
                <Banknote className="size-3.5 text-[#161514] dark:text-[#FAF8F5] stroke-[1.5]" />
                <span>Physical Cash Till</span>
              </div>
              {onRefillCashTill && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefillCashTill();
                  }}
                  className="text-[10px] font-medium px-2 py-0.5 bg-white dark:bg-[#252321] hover:bg-[#FAF8F5] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] rounded border border-[#E8E5DF] dark:border-[#383531] flex items-center gap-1 cursor-pointer transition-colors"
                  title="Refill Cash Till (ATM Withdrawal)"
                >
                  <RotateCcw className="size-2.5 stroke-[1.5]" />
                  <span>Refill</span>
                </button>
              )}
            </div>
            <div className="flex items-center justify-between pt-1 font-mono text-xs">
              <span className="text-[11px] text-[#6B6B6B] dark:text-[#A8A29E]">Today: <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">-{currencySymbol}{dailyStats.todayCashExpense.toLocaleString()}</span></span>
              <span className="text-[10px] font-medium text-[#04250e] dark:text-[#03D26F] bg-[#DCFAE5] dark:bg-[#03D26F]/20 px-1.5 py-0.5 rounded border border-[#03D26F]/30 tabular-nums">
                {currencySymbol}{monthlyStats.remainingCashBudget.toLocaleString()} in pocket
              </span>
            </div>
          </div>
        </div>

        {/* Col 3: Net Cashflow (3 cols) */}
        <div className="md:col-span-3 bg-[#161514] dark:bg-[#121110] border border-[#161514] dark:border-[#383531] rounded-xl p-3.5 text-white flex flex-col justify-between space-y-2">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-white/10 font-mono">
            <div>
              <span className="text-[10px] font-medium text-[#03D26F] flex items-center gap-1">
                <ArrowUpRight className="size-3 stroke-[2]" />
                <span>Inflow</span>
              </span>
              <span className="text-sm font-semibold text-[#03D26F] tabular-nums block mt-0.5">
                +{currencySymbol}{monthlyStats.monthlyIncome.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-medium text-rose-400 flex items-center gap-1">
                <ArrowDownRight className="size-3 stroke-[2]" />
                <span>Outflow</span>
              </span>
              <span className="text-sm font-semibold text-rose-400 tabular-nums block mt-0.5">
                -{currencySymbol}{monthlyStats.monthlyExpense.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Net cashflow:</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded font-mono border text-xs font-medium tabular-nums",
                netCashflow >= 0
                  ? "bg-[#03D26F]/20 text-[#03D26F] border-[#03D26F]/40"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/40"
              )}
            >
              {netCashflow >= 0
                ? `+${currencySymbol}${netCashflow.toLocaleString()} Net`
                : `-${currencySymbol}${Math.abs(netCashflow).toLocaleString()} Deficit`}
            </span>
          </div>
        </div>
      </div>

      {/* Action Dock + Integrated Vix Guidance */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-[#E8E5DF] dark:border-[#383531]">
        <div className="flex items-center gap-2 flex-1">
          <button
            type="button"
            onClick={onAddTransaction}
            className="flex-1 py-2 px-3 sm:px-4 bg-[#161514] dark:bg-[#CEF431] hover:bg-[#2A2826] dark:hover:bg-[#d6f64d] text-white dark:text-[#161514] font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
          >
            <Plus className="size-3.5 stroke-[2]" />
            <span>Log Expense</span>
          </button>

          {onOpenCalculator && (
            <button
              type="button"
              onClick={onOpenCalculator}
              className="py-2 px-3 bg-white dark:bg-[#252321] hover:bg-[#F5F3EF] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] font-medium text-xs rounded-lg border border-[#E8E5DF] dark:border-[#383531] transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
              title="Open Calculator"
            >
              <Calculator className="size-3.5 stroke-[1.5]" />
              <span>Calc</span>
            </button>
          )}

          <button
            type="button"
            onClick={onBulkScan}
            className="py-2 px-3 bg-white dark:bg-[#252321] hover:bg-[#F5F3EF] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] font-medium text-xs rounded-lg border border-[#E8E5DF] dark:border-[#383531] transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
            title="Bulk Expenses or OCR Scan"
          >
            <ScanLine className="size-3.5 stroke-[1.5]" />
            <span>Scan</span>
          </button>
        </div>

        {/* Vix Companion Mascot & Quick Guidance */}
        <div
          onClick={onAddTransaction}
          className="bg-[#F1EFEA] dark:bg-[#252321] px-3 py-1.5 rounded-lg border border-[#E8E5DF] dark:border-[#383531] flex items-center gap-2.5 cursor-pointer hover:bg-[#E8E5DF] dark:hover:bg-[#2e2b28] transition-colors sm:max-w-xs shrink-0 min-h-[38px]"
          title="Click to Log Expense"
        >
          <VixPixelCompanion
            gear="money"
            state={dailyStats.isOverDailyBudget ? "fire" : "idle"}
            size={22}
          />
          <div className="min-w-0 flex-1 text-[11px] font-mono text-[#161514] dark:text-[#FAF8F5]">
            {dailyStats.isOverDailyBudget ? (
              <span className="text-rose-700 dark:text-rose-400 font-semibold">Over limit by {currencySymbol}{dailyStats.overDailyAmount.toLocaleString()}</span>
            ) : (
              <span>Safe pace: ~{currencySymbol}{dailyStats.todayRemaining.toLocaleString()} today</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
