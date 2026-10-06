"use client";

import React from "react";
import { type MonthlyBudgetStats, type DailyBudgetStats } from "@/lib/utils/budget-rollover";
import { CashflowHighwayGauge } from "@/components/money/CashflowHighwayGauge";
import { VixPixelCompanion } from "@/components/mascot/VixPixelCompanion";
import { Plus, ScanLine, FolderPlus, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialSummaryCockpitProps {
  monthlyStats: MonthlyBudgetStats;
  dailyStats: DailyBudgetStats;
  currencySymbol: string;
  onAddTransaction: () => void;
  onBulkScan: () => void;
  onAddCategory: () => void;
  onOpenEditAllowances: () => void;
}

export function FinancialSummaryCockpit({
  monthlyStats,
  dailyStats,
  currencySymbol,
  onAddTransaction,
  onBulkScan,
  onAddCategory,
  onOpenEditAllowances,
}: FinancialSummaryCockpitProps) {
  const isSurplus = monthlyStats.netMonthlyCashflow >= 0;

  return (
    <div className="space-y-4">
      {/* 🚀 Top Summary Banner */}
      <div className="bg-[#FAF8F5] rounded-3xl border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] p-4 sm:p-6 space-y-4">
        {/* Row 1: Executive Balance & Month In/Out Cashflow */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Main Remaining Available Budget Hero */}
          <div className="md:col-span-5 space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#CEF431] border border-[#161514] shadow-[1px_1px_0px_0px_#161514]">
                <Wallet className="size-3.5 text-[#161514]" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#161514]/70">
                Remaining Monthly Budget ({monthlyStats.targetMonthLabel})
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className="text-3xl sm:text-4xl font-black text-[#161514] tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {currencySymbol}{monthlyStats.remainingBudget.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-[#161514]/60">
                / {currencySymbol}{monthlyStats.totalAvailableBudget.toLocaleString()}
              </span>
            </div>

            {monthlyStats.rolloverSurplus > 0 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-[#03D26F]/20 text-emerald-950 px-2 py-0.5 rounded-md border border-[#161514]/20">
                <span>🔄 Rollover Boost:</span>
                <span>+{currencySymbol}{monthlyStats.rolloverSurplus.toLocaleString()}</span>
              </span>
            )}
          </div>

          {/* Monthly Inflow & Outflow Gauges */}
          <div className="md:col-span-7 grid grid-cols-2 gap-3">
            {/* Monthly Inflow */}
            <div className="bg-white p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <ArrowUpRight className="size-3 text-emerald-600 stroke-[3]" />
                  <span>Total Inflow</span>
                </span>
                <span className="text-[9px] font-bold text-[#161514]/50">Month</span>
              </div>
              <span
                className="text-base sm:text-xl font-black text-emerald-700 mt-1 block"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                +{currencySymbol}{monthlyStats.monthlyIncome.toLocaleString()}
              </span>
            </div>

            {/* Monthly Outflow */}
            <div className="bg-white p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1">
                  <ArrowDownRight className="size-3 text-rose-600 stroke-[3]" />
                  <span>Total Outflow</span>
                </span>
                <span className="text-[9px] font-bold text-[#161514]/50">
                  {monthlyStats.budgetUsedPercentage}% Cap
                </span>
              </div>
              <span
                className="text-base sm:text-xl font-black text-rose-600 mt-1 block"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                -{currencySymbol}{monthlyStats.monthlyExpense.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Action Buttons Dock */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t-2 border-[#161514]/10">
          {/* Primary CTA: Log Transaction */}
          <button
            type="button"
            onClick={onAddTransaction}
            className="flex-1 sm:flex-none bg-[#CEF431] hover:bg-[#bde422] text-[#161514] font-black text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="size-4 stroke-[3]" />
            <span>Log Transaction</span>
          </button>

          {/* Interactive Banker Vix Companion */}
          <VixPixelCompanion
            gear="money"
            state={dailyStats.isOverDailyBudget ? "fire" : "idle"}
            size={42}
            onClick={onAddTransaction}
            title="Vix: Banker Companion (Click to Log Transaction)"
          />

          {/* Secondary Action: Bulk / Scan OCR */}
          <button
            type="button"
            onClick={onBulkScan}
            className="flex-1 sm:flex-none bg-white hover:bg-[#FAF8F5] text-[#161514] font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ScanLine className="size-3.5 stroke-[2.5]" />
            <span>Bulk / Scan</span>
          </button>

          {/* Tertiary Action: + Category */}
          <button
            type="button"
            onClick={onAddCategory}
            className="bg-white hover:bg-[#FAF8F5] text-[#161514] font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FolderPlus className="size-3.5 stroke-[2.5]" />
            <span>+ Category</span>
          </button>
        </div>
      </div>

      {/* 🏎️ Cashflow Highway Velocity HUD */}
      <CashflowHighwayGauge
        dailyStats={dailyStats}
        currencySymbol={currencySymbol}
        daysRemainingInMonth={monthlyStats.daysRemainingInMonth}
        onOpenEditAllowances={onOpenEditAllowances}
      />
    </div>
  );
}
