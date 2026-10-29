"use client";

import React from "react";
import { type MonthlyBudgetStats, type DailyBudgetStats } from "@/lib/utils/budget-rollover";
import { CashflowHighwayGauge } from "@/components/money/CashflowHighwayGauge";
import { VixPixelCompanion } from "@/components/mascot/VixPixelCompanion";
import { Plus, ScanLine, FolderPlus, ArrowUpRight, ArrowDownRight, Wallet, Calculator } from "lucide-react";
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
}

export function FinancialSummaryCockpit({
  monthlyStats,
  dailyStats,
  currencySymbol,
  onAddTransaction,
  onBulkScan,
  onAddCategory,
  onOpenEditAllowances,
  onOpenCalculator,
  onSelectPaymentMethod,
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

  const budgetUsedPercentage = Math.min(100, monthlyStats.budgetUsedPercentage || 0);

  // Net Cashflow
  const netCashflow = monthlyStats.monthlyIncome - monthlyStats.monthlyExpense;

  // Channel percentages
  const totalChannelMonth = monthlyStats.upiExpense + monthlyStats.cashExpense;
  const upiMonthPercent = totalChannelMonth > 0 ? Math.round((monthlyStats.upiExpense / totalChannelMonth) * 100) : 0;
  const cashMonthPercent = totalChannelMonth > 0 ? Math.round((monthlyStats.cashExpense / totalChannelMonth) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* 👛 Concept 1: Open-Fold Genuine Leather Wallet Hero */}
      <div className="bg-[#2D2722] rounded-3xl sm:rounded-[32px] border-2 sm:border-[3px] border-[#161514] shadow-[5px_5px_0px_0px_#161514] sm:shadow-[7px_7px_0px_0px_#161514] p-3 sm:p-5 relative overflow-hidden">
        
        {/* Leather Perimeter Dashed Stitch Line */}
        <div className="border-2 border-dashed border-white/20 rounded-2xl sm:rounded-[24px] p-3 sm:p-4.5 space-y-3.5">
          
          {/* Top Leather Tag & Status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#CEF431] border border-[#161514] shrink-0" />
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#FAF8F5] truncate font-heading">
                Money Wallet
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#161514] text-[#FAF8F5] border border-white/10 font-mono whitespace-nowrap">
                {monthlyStats.targetMonthLabel}
              </span>
              <span
                className={cn(
                  "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-[#161514] whitespace-nowrap",
                  budgetPercentageRemaining <= 15
                    ? "bg-rose-400 text-[#161514]"
                    : budgetPercentageRemaining <= 30
                    ? "bg-amber-300 text-[#161514]"
                    : "bg-[#CEF431] text-[#161514]"
                )}
              >
                {budgetPercentageRemaining}% Remaining
              </span>
            </div>
          </div>

          {/* Responsive Layout Container: 1 column on mobile, 2 columns on laptop/desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
            
            {/* LEFT COLUMN (lg:col-span-6): THE CASH BILLFOLD (Remaining Budget & Progress) */}
            <div className="lg:col-span-6 flex flex-col justify-between bg-[#E8F5E9] border-2 border-[#161514] rounded-2xl p-4 sm:p-5 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.35)] relative overflow-hidden">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-[#161514] text-[#CEF431] px-2 py-0.5 rounded border border-[#161514] font-mono">
                    Monthly Budget
                  </span>
                  {monthlyStats.rolloverSurplus > 0 && (
                    <span className="text-[10px] font-black font-mono text-[#1B5E20] bg-[#1B5E20]/15 px-2 py-0.5 rounded border border-[#1B5E20]/30">
                      +{currencySymbol}{monthlyStats.rolloverSurplus.toLocaleString()} Rollover Boost
                    </span>
                  )}
                </div>

                <div className="space-y-1 relative z-10 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-[#1B5E20] shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-black uppercase text-[#1B5E20] tracking-wider font-heading">
                      Remaining to Spend
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div
                      className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#161514] font-mono tabular-nums truncate leading-tight"
                    >
                      {currencySymbol}{monthlyStats.remainingBudget.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      <span className="text-[10px] sm:text-xs font-black text-[#161514]/75 font-mono px-2 py-0.5 rounded bg-white/60 border border-[#161514]/20 shadow-[1px_1px_0px_0px_#161514]">
                        Budget: {currencySymbol}{monthlyStats.totalAvailableBudget.toLocaleString()}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-[#1B5E20] font-mono">
                        • {currencySymbol}{monthlyStats.monthlyExpense.toLocaleString()} Spent
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget Remaining Security Thread Progress Bar */}
              <div className="mt-4 pt-2 border-t border-[#1B5E20]/15 space-y-1.5">
                <div className="h-2.5 w-full bg-[#161514]/15 rounded-full border border-[#161514]/30 overflow-hidden p-0.5">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      budgetPercentageRemaining <= 15
                        ? "bg-rose-600"
                        : budgetPercentageRemaining <= 30
                        ? "bg-amber-500"
                        : "bg-[#2E7D32]"
                    )}
                    style={{ width: `${Math.max(4, budgetPercentageRemaining)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-black font-mono text-[#1B5E20]/80 px-0.5 uppercase gap-1 flex-wrap">
                  <span>{currencySymbol}0 Spent</span>
                  <span className="text-center">{budgetPercentageRemaining}% Left</span>
                  <span className="text-right">{currencySymbol}{monthlyStats.totalAvailableBudget.toLocaleString()} Total</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (lg:col-span-6): TIERED PAYMENT CARDS (UPI & Cash) + LEDGER */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-2.5">
              
              {/* Slot 1: UPI Channel Card with Crystal-Clear Today vs This Month breakdown */}
              <div
                onClick={() => onSelectPaymentMethod?.("upi")}
                className={cn(
                  "bg-white border-2 border-[#161514] rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-[3px_3px_0px_0px_#161514] transition-all",
                  onSelectPaymentMethod && "cursor-pointer hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
                )}
                title={onSelectPaymentMethod ? "Click to view UPI transactions in Ledger" : undefined}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-[#161514]/10">
                  <div className="flex items-center gap-1.5 font-heading text-xs font-black uppercase text-[#161514]">
                    <span>📱</span>
                    <span>UPI Payments</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-[#161514]/60 uppercase">
                      {upiMonthPercent}% of spend
                    </span>
                    {onSelectPaymentMethod && (
                      <span className="text-[8px] font-black uppercase px-1 py-0.2 bg-[#CEF431] text-[#161514] rounded border border-[#161514]/30">
                        View
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-[#FAF8F5] p-2 rounded-lg border border-[#161514]/20">
                    <span className="text-[9px] font-bold text-[#161514]/60 uppercase block">Spent Today</span>
                    <span className="text-sm sm:text-base font-black text-rose-600 font-mono block mt-0.5">
                      -{currencySymbol}{dailyStats.todayUpiExpense.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-[#FAF8F5] p-2 rounded-lg border border-[#161514]/20">
                    <span className="text-[9px] font-bold text-[#161514]/60 uppercase block">This Month</span>
                    <span className="text-sm sm:text-base font-black text-rose-600 font-mono block mt-0.5">
                      -{currencySymbol}{monthlyStats.upiExpense.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Slot 2: Cash Currency Pocket with Crystal-Clear Today vs This Month breakdown */}
              <div
                onClick={() => onSelectPaymentMethod?.("cash")}
                className={cn(
                  "bg-[#FFF9EA] border-2 border-[#161514] rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-[3px_3px_0px_0px_#161514] transition-all",
                  onSelectPaymentMethod && "cursor-pointer hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
                )}
                title={onSelectPaymentMethod ? "Click to view Cash transactions in Ledger" : undefined}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-[#161514]/10">
                  <div className="flex items-center gap-1.5 font-heading text-xs font-black uppercase text-[#161514]">
                    <span>💵</span>
                    <span>Cash Payments</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-[#161514]/60 uppercase">
                      {cashMonthPercent}% of spend
                    </span>
                    {onSelectPaymentMethod && (
                      <span className="text-[8px] font-black uppercase px-1 py-0.2 bg-[#CEF431] text-[#161514] rounded border border-[#161514]/30">
                        View
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-white p-2 rounded-lg border border-[#161514]/20">
                    <span className="text-[9px] font-bold text-[#161514]/60 uppercase block">Spent Today</span>
                    <span className="text-sm sm:text-base font-black text-rose-600 font-mono block mt-0.5">
                      -{currencySymbol}{dailyStats.todayCashExpense.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-[#161514]/20">
                    <span className="text-[9px] font-bold text-[#161514]/60 uppercase block">This Month</span>
                    <span className="text-sm sm:text-base font-black text-rose-600 font-mono block mt-0.5">
                      -{currencySymbol}{monthlyStats.cashExpense.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Running Cash Envelope Telemetry */}
                {monthlyStats.baseCashBudget > 0 && (
                  <div className="mt-2 pt-1.5 border-t border-[#161514]/10 space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-black font-mono">
                      <span className="text-[#161514]/75 uppercase flex items-center gap-1">
                        <span>Envelope:</span>
                        <span className="text-[#161514]">
                          {currencySymbol}{monthlyStats.envelopeCashExpense.toLocaleString()} / {currencySymbol}{monthlyStats.baseCashBudget.toLocaleString()}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "font-bold uppercase text-[8px] px-1 py-0.2 rounded border",
                          monthlyStats.isCashEnvelopeExhausted
                            ? "bg-rose-100 text-rose-700 border-rose-300"
                            : "bg-[#03D26F]/15 text-emerald-800 border-emerald-300"
                        )}
                      >
                        {monthlyStats.isCashEnvelopeExhausted
                          ? "Limit Reached"
                          : `${currencySymbol}{monthlyStats.remainingCashBudget.toLocaleString()} Left`}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#161514]/10 rounded-full overflow-hidden p-0.2 border border-[#161514]/20">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          monthlyStats.cashBudgetUsedPercentage >= 100
                            ? "bg-rose-500"
                            : monthlyStats.cashBudgetUsedPercentage >= 80
                            ? "bg-amber-400"
                            : "bg-[#03D26F]"
                        )}
                        style={{
                          width: `${Math.min(100, Math.max(3, monthlyStats.cashBudgetUsedPercentage))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Slot 3: Inflow & Outflow Monthly Ledger + Net Cashflow Strip */}
              <div className="bg-[#1E1A17] border-2 border-[#161514] rounded-xl sm:rounded-2xl p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] space-y-2">
                <div className="grid grid-cols-2 divide-x divide-white/15">
                  <div className="pr-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#34D399] flex items-center gap-1 font-heading">
                      <ArrowUpRight className="size-3 text-[#34D399] stroke-[3]" />
                      <span>Total Income</span>
                    </span>
                    <span
                      className="text-sm sm:text-base font-black text-[#10B981] font-mono block mt-0.5"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      +{currencySymbol}{monthlyStats.monthlyIncome.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-bold text-white/50 block">This Month</span>
                  </div>

                  <div className="pl-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FB7185] flex items-center gap-1 font-heading">
                      <ArrowDownRight className="size-3 text-[#FB7185] stroke-[3]" />
                      <span>Total Spent</span>
                    </span>
                    <span
                      className="text-sm sm:text-base font-black text-[#F43F5E] font-mono block mt-0.5"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      -{currencySymbol}{monthlyStats.monthlyExpense.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-bold text-white/50 block">
                      {monthlyStats.budgetUsedPercentage}% of budget used
                    </span>
                  </div>
                </div>

                {/* Net Cashflow indicator */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                  <span className="text-white/60">Net Cashflow:</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-md font-mono border text-[9px] font-black tracking-normal",
                      netCashflow >= 0
                        ? "bg-[#10B981]/20 text-[#34D399] border-[#10B981]/40"
                        : "bg-[#F43F5E]/20 text-[#FB7185] border-[#F43F5E]/40"
                    )}
                  >
                    {netCashflow >= 0
                      ? `+${currencySymbol}${netCashflow.toLocaleString()} Net Savings`
                      : `-${currencySymbol}${Math.abs(netCashflow).toLocaleString()} Deficit`}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* 3. WALLET HARDWARE ACTION DOCK */}
          <div className="space-y-2.5 pt-1">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Primary Action Button */}
              <button
                type="button"
                onClick={onAddTransaction}
                className="flex-1 py-3 px-4 bg-[#CEF431] hover:bg-[#bde422] text-[#161514] font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl sm:rounded-2xl border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#161514] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="size-4 stroke-[3]" />
                <span>Log Expense</span>
              </button>

              {/* Utility Buttons */}
              <div className="grid grid-cols-3 gap-2 sm:w-auto">
                {onOpenCalculator && (
                  <button
                    type="button"
                    onClick={onOpenCalculator}
                    className="py-2.5 px-3 bg-[#FAF8F5] hover:bg-white text-[#161514] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                    title="Open Calculator"
                  >
                    <Calculator className="size-3.5 stroke-[2.5]" />
                    <span>Calc</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onBulkScan}
                  className="py-2.5 px-3 bg-[#FAF8F5] hover:bg-white text-[#161514] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                  title="Bulk Expenses or OCR Scan"
                >
                  <ScanLine className="size-3.5 stroke-[2.5]" />
                  <span>Scan</span>
                </button>

                <button
                  type="button"
                  onClick={onAddCategory}
                  className="py-2.5 px-3 bg-[#FAF8F5] hover:bg-white text-[#161514] font-black text-xs uppercase tracking-wider rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center justify-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                  title="Add New Budget Category"
                >
                  <FolderPlus className="size-3.5 stroke-[2.5]" />
                  <span>Category</span>
                </button>
              </div>
            </div>

            {/* Pocket Vix Wallet Companion */}
            <div
              onClick={onAddTransaction}
              className="bg-[#FFF9EA] p-3 rounded-2xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] flex items-center gap-3 cursor-pointer hover:bg-white active:translate-x-0.5 active:translate-y-0.5 transition-all"
              title="Click to Log Expense"
            >
              <div className="shrink-0">
                <VixPixelCompanion
                  gear="money"
                  state={dailyStats.isOverDailyBudget ? "fire" : "idle"}
                  size={36}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black uppercase text-[#161514] font-heading flex items-center gap-1.5">
                  <span>Vix Wallet Companion</span>
                  <span className="text-[8px] font-bold px-1.5 py-0.2 bg-[#CEF431] text-[#161514] rounded border border-[#161514]/30">
                    Daily Telemetry
                  </span>
                </div>
                <p className="text-xs font-bold text-[#161514]/85 leading-snug mt-0.5">
                  {dailyStats.isOverDailyBudget
                    ? `Over daily spend limit by ${currencySymbol}${dailyStats.overDailyAmount.toLocaleString()} today.`
                    : `${budgetPercentageRemaining}% budget available. Safe to spend ~${currencySymbol}${dailyStats.todayRemaining.toLocaleString()} today.`}
                </p>
              </div>
            </div>
          </div>

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
