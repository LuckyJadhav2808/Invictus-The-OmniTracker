"use client";

import React, { useState, useRef, useEffect } from "react";
import { type MonthlyBudgetStats, type DailyBudgetStats } from "@/lib/utils/budget-rollover";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import {
  Building2,
  Banknote,
  Target,
  Plus,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
} from "lucide-react";

interface WalletCardDeckProps {
  monthlyStats: MonthlyBudgetStats;
  dailyStats: DailyBudgetStats;
  currencySymbol: string;
  selectedMonth?: string;
  onResetToCurrentMonth?: () => void;
  onOpenAllowances?: () => void;
  onRefillCashTill?: () => void;
  onSelectPaymentMethod?: (method: "upi" | "cash") => void;
  onAddTransaction: () => void;
  onBulkScan: () => void;
  onOpenCalculator?: () => void;
  onNavigateToTab?: (tab: "ledger" | "budgets" | "vault" | "analytics") => void;
}

export function WalletCardDeck({
  monthlyStats,
  dailyStats,
  currencySymbol,
  selectedMonth,
  onResetToCurrentMonth,
  onOpenAllowances,
  onRefillCashTill,
  onSelectPaymentMethod,
  onAddTransaction,
  onBulkScan,
  onOpenCalculator,
  onNavigateToTab,
}: WalletCardDeckProps) {
  // Balance privacy state persisted in sessionStorage
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("invictus_money_hide_balance") === "true";
    }
    return false;
  });

  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const toggleHideBalance = () => {
    soundFX.playPop();
    setIsBalanceHidden((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("invictus_money_hide_balance", String(next));
      }
      return next;
    });
  };

  // Synchronize active dot with scroll position
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    if (clientWidth <= 0) return;
    const newIndex = Math.round(scrollLeft / (clientWidth * 0.85));
    setActiveCardIndex(Math.min(3, Math.max(0, newIndex)));
  };

  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return;
    soundFX.playPop();
    const children = scrollContainerRef.current.children;
    if (children[index]) {
      (children[index] as HTMLElement).scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
      setActiveCardIndex(index);
    }
  };

  const budgetPercentageRemaining = Math.max(
    0,
    Math.min(
      100,
      monthlyStats.totalAvailableBudget > 0
        ? Math.round((monthlyStats.remainingBudget / monthlyStats.totalAvailableBudget) * 100)
        : 0
    )
  );

  const formatAmount = (val: number) => {
    if (isBalanceHidden) return "••••••";
    return `${currencySymbol}${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-3.5">
      {/* ─── TOP BAR: Available Funds & Eye Toggle (Belanje Benchmark) ─── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-heading font-black text-[#6B6B6B] dark:text-[#A8A29E] tracking-tight">
            Available funds
          </span>
          <button
            type="button"
            onClick={toggleHideBalance}
            className="p-1 rounded-md text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-[#FAF8F5] hover:bg-[#E8E5DF]/50 dark:hover:bg-[#2A2724] transition-colors cursor-pointer"
            title={isBalanceHidden ? "Show balance" : "Hide balance"}
          >
            {isBalanceHidden ? (
              <EyeOff className="size-3.5 stroke-[2]" />
            ) : (
              <Eye className="size-3.5 stroke-[2]" />
            )}
          </button>
        </div>

        {/* Target Month Pill & Reset */}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-colors",
              !monthlyStats.isCurrentCalendarMonth
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800"
                : "text-[#6B6B6B] dark:text-[#A8A29E] bg-white dark:bg-[#252321] border-[#E8E5DF] dark:border-[#383531]"
            )}
          >
            {monthlyStats.targetMonthLabel}
          </span>
          {!monthlyStats.isCurrentCalendarMonth && onResetToCurrentMonth && (
            <button
              type="button"
              onClick={onResetToCurrentMonth}
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-[#161514] text-[#CEF431] dark:bg-[#FAF8F5] dark:text-[#161514] hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              title="Jump to Current Month"
            >
              <span>Current</span>
              <RotateCcw className="size-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── SWIPEABLE WALLET CARDS CAROUSEL ─── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1 px-1 -mx-1"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {/* CARD 1: Main UPI / Bank Account */}
        <div
          onClick={() => onSelectPaymentMethod?.("upi")}
          className="snap-center shrink-0 w-[88vw] sm:w-[380px] md:w-[400px] h-[200px] sm:h-[210px] rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#161514] via-[#1E1C1A] to-[#141E28] text-white border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex flex-col justify-between relative overflow-hidden group cursor-pointer transition-all active:scale-[0.99]"
        >
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Card Top: Logo & Name */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shadow-xs">
                <Building2 className="size-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-heading font-black tracking-tight text-white flex items-center gap-1.5">
                  Main Account
                </h3>
                <span className="text-[11px] font-mono text-stone-300">UPI &amp; Digital Bank</span>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#03D26F] border border-emerald-500/30">
              Primary
            </span>
          </div>

          {/* Card Middle: Massive Balance with Eye Toggle */}
          <div className="relative z-10 my-auto">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-white tabular-nums">
                {formatAmount(monthlyStats.remainingBudget)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleHideBalance();
                }}
                className="text-stone-400 hover:text-white transition-colors cursor-pointer p-1"
                title={isBalanceHidden ? "Show balance" : "Hide balance"}
              >
                {isBalanceHidden ? (
                  <EyeOff className="size-4 stroke-[2]" />
                ) : (
                  <Eye className="size-4 stroke-[2]" />
                )}
              </button>
            </div>
            <span className="text-[10px] font-mono text-stone-400">
              Spendable digital liquidity
            </span>
          </div>

          {/* Card Footer: Split Income vs Spent (Belanje Signature Metaphor) */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 relative z-10">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                Income this month
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-[#03D26F] tabular-nums flex items-center gap-1">
                <TrendingUp className="size-3 stroke-[2.5]" />
                {isBalanceHidden ? "••••" : `+${currencySymbol}${monthlyStats.monthlyIncome.toLocaleString()}`}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                Spent this month
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-rose-400 tabular-nums flex items-center gap-1">
                <TrendingDown className="size-3 stroke-[2.5]" />
                {isBalanceHidden ? "••••" : `-${currencySymbol}${monthlyStats.monthlyExpense.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: Cash Till (Pocket Envelope) */}
        <div
          onClick={() => onSelectPaymentMethod?.("cash")}
          className="snap-center shrink-0 w-[88vw] sm:w-[380px] md:w-[400px] h-[200px] sm:h-[210px] rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#1C1A18] via-[#24211D] to-[#2E2416] text-white border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex flex-col justify-between relative overflow-hidden group cursor-pointer transition-all active:scale-[0.99]"
        >
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Card Top: Logo & Refill CTA */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-xs">
                <Banknote className="size-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-heading font-black tracking-tight text-white flex items-center gap-1.5">
                  Cash Till
                </h3>
                <span className="text-[11px] font-mono text-stone-300">Physical Pocket Envelope</span>
              </div>
            </div>

            {onRefillCashTill && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefillCashTill();
                }}
                className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400 text-[#161514] hover:bg-amber-300 active:scale-95 transition-all cursor-pointer shadow-xs"
                title="Refill physical cash till"
              >
                + Refill Till
              </button>
            )}
          </div>

          {/* Card Middle: Cash Remaining */}
          <div className="relative z-10 my-auto">
            <div className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-white tabular-nums">
              {formatAmount(monthlyStats.remainingCashBudget)}
            </div>
            <span className="text-[10px] font-mono text-stone-400">
              Cash remaining in hand
            </span>
          </div>

          {/* Card Footer: Cash Limit & Spent Today */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 relative z-10">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                Envelope Cap
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-stone-200 tabular-nums">
                {formatAmount(monthlyStats.baseCashBudget)}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                Today Spent
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-300 tabular-nums">
                -{currencySymbol}{dailyStats.todayCashExpense.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: Safe-To-Spend Budget Gauge */}
        <div
          onClick={onOpenAllowances}
          className="snap-center shrink-0 w-[88vw] sm:w-[380px] md:w-[400px] h-[200px] sm:h-[210px] rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#161514] via-[#1A201C] to-[#122B1E] text-white border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex flex-col justify-between relative overflow-hidden group cursor-pointer transition-all active:scale-[0.99]"
        >
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Card Top: Gauge & Budget Status */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-xs">
                <Target className="size-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-heading font-black tracking-tight text-white">
                  Safe-to-Spend
                </h3>
                <span className="text-[11px] font-mono text-stone-300">
                  {monthlyStats.daysRemainingInMonth} days left in cycle
                </span>
              </div>
            </div>

            <span
              className={cn(
                "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border",
                budgetPercentageRemaining <= 15
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                  : budgetPercentageRemaining <= 30
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : "bg-emerald-500/20 text-[#03D26F] border-emerald-500/30"
              )}
            >
              {budgetPercentageRemaining}% Left
            </span>
          </div>

          {/* Card Middle: Daily Safe Pace */}
          <div className="relative z-10 my-auto">
            <div className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-white tabular-nums">
              ~{currencySymbol}{dailyStats.todayRemaining.toLocaleString()}
              <span className="text-sm font-normal text-stone-400 ml-1.5">/ day</span>
            </div>
            {monthlyStats.rolloverSurplus > 0 && (
              <span className="text-[10px] font-mono text-emerald-300">
                +{currencySymbol}{monthlyStats.rolloverSurplus.toLocaleString()} surplus rolled over
              </span>
            )}
          </div>

          {/* Card Footer: Progress Bar & Total Allowance */}
          <div className="space-y-1.5 pt-2 border-t border-white/10 relative z-10">
            <div className="flex items-center justify-between text-[10px] font-mono text-stone-400">
              <span>Budget Progress</span>
              <span className="text-white font-semibold">
                {currencySymbol}{monthlyStats.onlineExpense.toLocaleString()} / {currencySymbol}{monthlyStats.totalAvailableBudget.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-white/15 h-1.5 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  budgetPercentageRemaining <= 15
                    ? "bg-rose-500"
                    : budgetPercentageRemaining <= 30
                    ? "bg-amber-400"
                    : "bg-[#03D26F]"
                )}
                style={{ width: `${Math.max(4, budgetPercentageRemaining)}%` }}
              />
            </div>
          </div>
        </div>

        {/* CARD 4: Manage Cards & Accounts (Belanje Signature Swiped Card) */}
        <div
          onClick={onOpenAllowances}
          className="snap-center shrink-0 w-[88vw] sm:w-[380px] md:w-[400px] h-[200px] sm:h-[210px] rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] border-2 border-dashed border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#383531] flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#252321] transition-all active:scale-[0.99]"
        >
          <div className="size-12 rounded-full bg-[#161514] text-white dark:bg-[#FAF8F5] dark:text-[#161514] flex items-center justify-center shadow-xs mb-3 group-hover:scale-110 transition-transform">
            <Plus className="size-6 stroke-[2.5]" />
          </div>
          <h3 className="text-base font-heading font-black tracking-tight">
            Manage Cards &amp; Accounts
          </h3>
          <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] mt-1 max-w-[240px]">
            Add, reorder &amp; configure your bank accounts, digital UPI and cash limits.
          </p>
          <span className="text-[11px] font-heading font-bold text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1 mt-3 underline underline-offset-4">
            <span>Configure Accounts</span>
            <ChevronRight className="size-3.5" />
          </span>
        </div>
      </div>

      {/* ─── DOT PAGINATION INDICATOR (Belanje Benchmark) ─── */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {[0, 1, 2, 3].map((idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => scrollToIndex(idx)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
              activeCardIndex === idx
                ? "w-6 bg-[#161514] dark:bg-white"
                : "w-1.5 bg-[#E8E5DF] dark:bg-[#383531] hover:bg-[#161514]/40 dark:hover:bg-white/40"
            )}
            title={`Go to Card ${idx + 1}`}
          />
        ))}
      </div>

      {/* ─── 4 SQUIRCLE QUICK LAUNCHERS (Belanje Home Dashboard) ─── */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {/* Action 1: Add Expense / Transaction */}
        <button
          type="button"
          onClick={onAddTransaction}
          className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl bg-white dark:bg-[#1C1A18] hover:bg-[#FAF8F5] dark:hover:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] shadow-xs active:translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="size-9 rounded-xl bg-[var(--btn-primary-bg)] border border-[var(--btn-primary-border)] text-[var(--btn-primary-fg)] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Plus className="size-4 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-heading font-bold text-[#161514] dark:text-[#FAF8F5]">
            Add
          </span>
        </button>

        {/* Action 2: OCR Receipts / Scan */}
        <button
          type="button"
          onClick={onBulkScan}
          className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl bg-white dark:bg-[#1C1A18] hover:bg-[#FAF8F5] dark:hover:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] shadow-xs active:translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="size-9 rounded-xl bg-purple-100 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles className="size-4 stroke-[2]" />
          </div>
          <span className="text-[11px] font-heading font-bold text-[#161514] dark:text-[#FAF8F5]">
            Receipts
          </span>
        </button>

        {/* Action 3: Calculator */}
        <button
          type="button"
          onClick={onOpenCalculator}
          className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl bg-white dark:bg-[#1C1A18] hover:bg-[#FAF8F5] dark:hover:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] shadow-xs active:translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="size-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Layers className="size-4 stroke-[2]" />
          </div>
          <span className="text-[11px] font-heading font-bold text-[#161514] dark:text-[#FAF8F5]">
            Calc
          </span>
        </button>

        {/* Action 4: Analytics */}
        <button
          type="button"
          onClick={() => onNavigateToTab?.("analytics")}
          className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl bg-white dark:bg-[#1C1A18] hover:bg-[#FAF8F5] dark:hover:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] shadow-xs active:translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="size-9 rounded-xl bg-blue-100 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Target className="size-4 stroke-[2]" />
          </div>
          <span className="text-[11px] font-heading font-bold text-[#161514] dark:text-[#FAF8F5]">
            Analytics
          </span>
        </button>
      </div>
    </div>
  );
}
