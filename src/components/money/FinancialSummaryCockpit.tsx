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
    <div className="bg-[#FAF8F5] rounded-3xl border-2 sm:border-[3px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] p-3.5 sm:p-4 space-y-3">
      {/* Top Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#161514]/10">
        <div className="flex items-center gap-2 min-w-0">
          <span className="size-2.5 rounded-full bg-[#CEF431] border border-[#161514] shrink-0" />
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#161514] truncate font-heading">
            Financial Cockpit
          </h2>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white text-[#161514] border border-[#161514]/30 font-mono shadow-[1px_1px_0px_0px_#161514]">
            {monthlyStats.targetMonthLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-[#161514]/70 font-mono hidden sm:inline-block tabular-nums">
            Daily target: ~{currencySymbol}{dailyStats.todayRemaining.toLocaleString()}/day
          </span>
          <span
            className={cn(
              "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-[#161514] font-mono shadow-[1px_1px_0px_0px_#161514] tabular-nums",
              budgetPercentageRemaining <= 15
                ? "bg-rose-300 text-rose-950"
                : budgetPercentageRemaining <= 30
                ? "bg-amber-200 text-amber-950"
                : "bg-[#CEF431] text-[#161514]"
            )}
          >
            {budgetPercentageRemaining}% Remaining
          </span>
        </div>
      </div>

      {/* Dense 3-Column Cockpit Bento Grid (Eliminates Empty Space) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
        
        {/* Col 1: Monthly Spendable Billfold (5 cols) */}
        <div className="md:col-span-5 bg-white border-2 border-[#161514] rounded-2xl p-3.5 sm:p-4 shadow-[2px_2px_0px_0px_#161514] flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between gap-1.5 mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#161514]/60 font-mono">
                Spendable Liquidity
              </span>
              {monthlyStats.rolloverSurplus > 0 && (
                <span className="text-[9px] font-bold font-mono tabular-nums text-[#03D26F] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300">
                  +{currencySymbol}{monthlyStats.rolloverSurplus.toLocaleString()} Rollover
                </span>
              )}
            </div>

            <div className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#161514] font-mono tabular-nums leading-tight">
              {currencySymbol}{monthlyStats.remainingBudget.toLocaleString()}
            </div>
            <div className="text-[11px] font-bold text-[#161514]/70 font-mono tabular-nums mt-0.5">
              Budget: {currencySymbol}{monthlyStats.totalAvailableBudget.toLocaleString()} • {currencySymbol}{monthlyStats.onlineExpense.toLocaleString()} Spent
            </div>
          </div>

          {/* Progress Bar snug immediately below figures */}
          <div className="space-y-1 pt-1.5 border-t border-[#161514]/10">
            <div className="h-2 w-full bg-[#161514]/10 rounded-full border border-[#161514]/20 overflow-hidden">
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
            <div className="flex justify-between text-[8.5px] font-bold font-mono text-[#161514]/65 uppercase">
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
              "bg-white border-2 border-[#161514] rounded-xl p-2.5 shadow-[2px_2px_0px_0px_#161514] flex-1 flex flex-col justify-between transition-all",
              onSelectPaymentMethod && "cursor-pointer hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
            )}
            title="Click to view UPI transactions in Ledger"
          >
            <div className="flex items-center justify-between pb-1 border-b border-[#161514]/10">
              <div className="flex items-center gap-1.5 font-heading text-xs font-black uppercase text-[#161514]">
                <Smartphone className="size-3.5 text-[#161514] stroke-[2.2]" />
                <span>UPI Payments</span>
              </div>
              <span className="text-[8.5px] font-mono font-bold uppercase text-[#161514]/60">
                {upiMonthPercent}% spend
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 font-mono text-xs">
              <span className="text-[10px] text-[#161514]/60 uppercase">Today: <span className="font-bold text-rose-600 tabular-nums">-{currencySymbol}{dailyStats.todayUpiExpense.toLocaleString()}</span></span>
              <span className="text-[10px] text-[#161514]/60 uppercase">Month: <span className="font-bold text-rose-600 tabular-nums">-{currencySymbol}{monthlyStats.upiExpense.toLocaleString()}</span></span>
            </div>
          </div>

          {/* Cash Till Row */}
          <div
            onClick={() => onSelectPaymentMethod?.("cash")}
            className={cn(
              "bg-white border-2 border-[#161514] rounded-xl p-2.5 shadow-[2px_2px_0px_0px_#161514] flex-1 flex flex-col justify-between transition-all",
              onSelectPaymentMethod && "cursor-pointer hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
            )}
            title="Click to view Cash transactions in Ledger"
          >
            <div className="flex items-center justify-between pb-1 border-b border-[#161514]/10">
              <div className="flex items-center gap-1.5 font-heading text-xs font-black uppercase text-[#161514]">
                <Banknote className="size-3.5 text-[#161514] stroke-[2.2]" />
                <span>Physical Cash Till</span>
              </div>
              {onRefillCashTill && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefillCashTill();
                  }}
                  className="text-[8px] font-black uppercase px-1.5 py-0.2 bg-[#FAF8F5] hover:bg-[#CEF431] text-[#161514] rounded border border-[#161514] shadow-[1px_1px_0px_#161514] flex items-center gap-1 cursor-pointer"
                  title="Refill Cash Till (ATM Withdrawal)"
                >
                  <RotateCcw className="size-2" />
                  <span>Refill</span>
                </button>
              )}
            </div>
            <div className="flex items-center justify-between pt-1 font-mono text-xs">
              <span className="text-[10px] text-[#161514]/60 uppercase">Today: <span className="font-bold text-rose-600 tabular-nums">-{currencySymbol}{dailyStats.todayCashExpense.toLocaleString()}</span></span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300 tabular-nums">
                {currencySymbol}{monthlyStats.remainingCashBudget.toLocaleString()} in pocket
              </span>
            </div>
          </div>
        </div>

        {/* Col 3: Net Cashflow (3 cols) */}
        <div className="md:col-span-3 bg-[#161514] border-2 border-[#161514] rounded-2xl p-3 shadow-[2px_2px_0px_0px_#161514] text-white flex flex-col justify-between space-y-2">
          <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-white/10 font-mono">
            <div>
              <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#03D26F] flex items-center gap-1">
                <ArrowUpRight className="size-3 stroke-[3]" />
                <span>Inflow</span>
              </span>
              <span className="text-xs sm:text-sm font-black text-[#03D26F] tabular-nums block mt-0.5">
                +{currencySymbol}{monthlyStats.monthlyIncome.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[8.5px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <ArrowDownRight className="size-3 stroke-[3]" />
                <span>Outflow</span>
              </span>
              <span className="text-xs sm:text-sm font-black text-rose-400 tabular-nums block mt-0.5">
                -{currencySymbol}{monthlyStats.monthlyExpense.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider font-mono">
            <span className="text-white/60">Net cashflow:</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded font-mono border text-[8.5px] font-bold tabular-nums",
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-[#161514]/10">
        <div className="flex items-center gap-2 flex-1">
          <button
            type="button"
            onClick={onAddTransaction}
            className="flex-1 py-2 px-3 sm:px-4 bg-[#CEF431] hover:bg-[#bde422] text-[#161514] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
          >
            <Plus className="size-3.5 stroke-[3]" />
            <span>Log Expense</span>
          </button>

          {onOpenCalculator && (
            <button
              type="button"
              onClick={onOpenCalculator}
              className="py-2 px-3 bg-white hover:bg-[#FAF8F5] text-[#161514] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] flex items-center justify-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer min-h-[40px]"
              title="Open Calculator"
            >
              <Calculator className="size-3.5 stroke-[2.5]" />
              <span>Calc</span>
            </button>
          )}

          <button
            type="button"
            onClick={onBulkScan}
            className="py-2 px-3 bg-white hover:bg-[#FAF8F5] text-[#161514] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] flex items-center justify-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer min-h-[40px]"
            title="Bulk Expenses or OCR Scan"
          >
            <ScanLine className="size-3.5 stroke-[2.5]" />
            <span>Scan</span>
          </button>
        </div>

        {/* Vix Companion Mascot & Quick Guidance */}
        <div
          onClick={onAddTransaction}
          className="bg-white px-3 py-1.5 rounded-xl border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] flex items-center gap-2.5 cursor-pointer hover:bg-[#FAF8F5] active:translate-x-0.5 active:translate-y-0.5 transition-all sm:max-w-xs shrink-0 min-h-[40px]"
          title="Click to Log Expense"
        >
          <VixPixelCompanion
            gear="money"
            state={dailyStats.isOverDailyBudget ? "fire" : "idle"}
            size={24}
          />
          <div className="min-w-0 flex-1 text-[11px] font-bold text-[#161514] leading-tight font-mono">
            {dailyStats.isOverDailyBudget ? (
              <span className="text-rose-700">Over limit by {currencySymbol}{dailyStats.overDailyAmount.toLocaleString()}</span>
            ) : (
              <span>Safe pace: ~{currencySymbol}{dailyStats.todayRemaining.toLocaleString()} today</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
