"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Layers,
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
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const totalCards = 4;

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

  const nextCard = useCallback(() => {
    soundFX.playPop();
    soundFX.vibrate(12);
    setActiveCardIndex((prev) => (prev + 1) % totalCards);
  }, [totalCards]);

  const prevCard = useCallback(() => {
    soundFX.playPop();
    soundFX.vibrate(12);
    setActiveCardIndex((prev) => (prev - 1 + totalCards) % totalCards);
  }, [totalCards]);

  const goToCard = (index: number) => {
    if (index === activeCardIndex) return;
    soundFX.playPop();
    soundFX.vibrate(10);
    setActiveCardIndex(index);
  };

  // Touch handlers for swipe & flip gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartXRef.current;
    const deltaY = currentY - touchStartYRef.current;

    // Only drag horizontally if user isn't scrolling vertically
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset < -40) {
      nextCard();
    } else if (dragOffset > 40) {
      prevCard();
    }
    setIsDragging(false);
    setDragOffset(0);
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartXRef.current = e.clientX;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || touchStartXRef.current === null) return;
    const deltaX = e.clientX - touchStartXRef.current;
    setDragOffset(deltaX);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      if (dragOffset < -40) {
        nextCard();
      } else if (dragOffset > 40) {
        prevCard();
      }
    }
    setIsDragging(false);
    setDragOffset(0);
    touchStartXRef.current = null;
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

  // Stacked transform generator for card at position i
  const getCardStyle = (i: number): React.CSSProperties => {
    const diff = (i - activeCardIndex + totalCards) % totalCards;

    if (diff === 0) {
      // Front active card
      return {
        zIndex: 30,
        transform: `translate3d(${dragOffset}px, 0, 0) rotate(${dragOffset * 0.03}deg) scale(1)`,
        opacity: 1,
        pointerEvents: "auto",
        transition: isDragging ? "none" : "transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease-out",
      };
    } else if (diff === 1) {
      // 1st stacked card peeking on the right
      const peekX = 18;
      const extraPull = dragOffset < 0 ? Math.min(10, Math.abs(dragOffset) * 0.15) : 0;
      return {
        zIndex: 20,
        transform: `translate3d(${peekX - extraPull}px, 0, 0) scale(0.96)`,
        opacity: 0.88,
        pointerEvents: "auto",
        transition: isDragging ? "none" : "transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease-out",
      };
    } else if (diff === 2) {
      // 2nd stacked card peeking further
      const peekX = 32;
      return {
        zIndex: 10,
        transform: `translate3d(${peekX}px, 0, 0) scale(0.92)`,
        opacity: 0.5,
        pointerEvents: "auto",
        transition: isDragging ? "none" : "transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease-out",
      };
    } else {
      // Hidden tucked behind
      return {
        zIndex: 0,
        transform: `translate3d(40px, 0, 0) scale(0.88)`,
        opacity: 0,
        pointerEvents: "none",
        transition: "transform 260ms ease, opacity 200ms ease",
      };
    }
  };

  return (
    <div className="space-y-3.5">
      {/* ─── TOP BAR: Available Funds, Eye Toggle & Flip Steppers ─── */}
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

        {/* Stack Navigation & Target Month Pill */}
        <div className="flex items-center gap-2">
          {/* Quick Stack Steppers (< >) for desktop / keyboard */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={prevCard}
              className="size-6 rounded-lg bg-white dark:bg-[#252321] hover:bg-[#E8E5DF] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
              title="Previous Card in Stack"
            >
              <ChevronLeft className="size-3 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={nextCard}
              className="size-6 rounded-lg bg-white dark:bg-[#252321] hover:bg-[#E8E5DF] dark:hover:bg-[#2e2b28] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
              title="Next Card in Stack"
            >
              <ChevronRight className="size-3 stroke-[2.5]" />
            </button>
          </div>

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

      {/* ─── FLIPPABLE STACKED WALLET CARD DECK (Belanje & Apple Wallet Benchmark) ─── */}
      <div
        className="relative w-full max-w-[520px] mx-auto h-[210px] sm:h-[220px] touch-pan-y select-none cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* CARD 0: Main UPI / Bank Account */}
        <div
          onClick={(e) => {
            if (activeCardIndex !== 0) {
              e.stopPropagation();
              goToCard(0);
            } else {
              onSelectPaymentMethod?.("upi");
            }
          }}
          style={getCardStyle(0)}
          className="absolute inset-y-0 left-0 w-[calc(100%-28px)] sm:w-[calc(100%-36px)] rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-white via-[#F8FAFC] to-[#EEF2F6] dark:from-[#161514] dark:via-[#1E1C1A] dark:to-[#141E28] text-[#161514] dark:text-white border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex flex-col justify-between overflow-hidden group cursor-pointer will-change-transform"
        >
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Card Top: Logo & Name */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-blue-50 dark:bg-white/10 border border-blue-200 dark:border-white/15 flex items-center justify-center text-blue-700 dark:text-white shadow-xs">
                <Building2 className="size-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-heading font-black tracking-tight flex items-center gap-1.5 text-[#161514] dark:text-white">
                  Main Account
                </h3>
                <span className="text-[11px] font-mono text-[#64748B] dark:text-stone-300">
                  UPI &amp; Digital Bank
                </span>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-[#047857] dark:text-[#03D26F] border border-emerald-300 dark:border-emerald-500/30">
              Primary
            </span>
          </div>

          {/* Card Middle: Massive Balance with Eye Toggle */}
          <div className="relative z-10 my-auto">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-[#161514] dark:text-white tabular-nums">
                {formatAmount(monthlyStats.remainingBudget)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleHideBalance();
                }}
                className="text-[#64748B] dark:text-stone-400 hover:text-[#161514] dark:hover:text-white transition-colors cursor-pointer p-1"
                title={isBalanceHidden ? "Show balance" : "Hide balance"}
              >
                {isBalanceHidden ? (
                  <EyeOff className="size-4 stroke-[2]" />
                ) : (
                  <Eye className="size-4 stroke-[2]" />
                )}
              </button>
            </div>
            <span className="text-[10px] font-mono text-[#64748B] dark:text-stone-400">
              Spendable digital liquidity
            </span>
          </div>

          {/* Card Footer: Split Income vs Spent (Belanje Signature Metaphor) */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E2E8F0] dark:border-white/10 relative z-10">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] dark:text-stone-400 block">
                Income this month
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-[#047857] dark:text-[#03D26F] tabular-nums flex items-center gap-1">
                <TrendingUp className="size-3 stroke-[2.5]" />
                {isBalanceHidden ? "••••" : `+${currencySymbol}${monthlyStats.monthlyIncome.toLocaleString()}`}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] dark:text-stone-400 block">
                Spent this month
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums flex items-center gap-1">
                <TrendingDown className="size-3 stroke-[2.5]" />
                {isBalanceHidden ? "••••" : `-${currencySymbol}${monthlyStats.monthlyExpense.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 1: Cash Till (Physical Pocket Envelope) */}
        <div
          onClick={(e) => {
            if (activeCardIndex !== 1) {
              e.stopPropagation();
              goToCard(1);
            } else {
              onSelectPaymentMethod?.("cash");
            }
          }}
          style={getCardStyle(1)}
          className="absolute inset-y-0 left-0 w-[calc(100%-28px)] sm:w-[calc(100%-36px)] rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-white via-[#FFFDF5] to-[#FEF3C7] dark:from-[#1C1A18] dark:via-[#24211D] dark:to-[#2E2416] text-[#161514] dark:text-white border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex flex-col justify-between overflow-hidden group cursor-pointer will-change-transform"
        >
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-amber-400/10 dark:bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Card Top: Logo & Refill CTA */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-400/30 flex items-center justify-center text-amber-800 dark:text-amber-400 shadow-xs">
                <Banknote className="size-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-heading font-black tracking-tight text-[#161514] dark:text-white flex items-center gap-1.5">
                  Cash Till
                </h3>
                <span className="text-[11px] font-mono text-[#64748B] dark:text-stone-300">
                  Physical Pocket Envelope
                </span>
              </div>
            </div>

            {onRefillCashTill && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefillCashTill();
                }}
                className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400 text-[#161514] hover:bg-amber-300 border border-[#161514] active:scale-95 transition-all cursor-pointer shadow-xs"
                title="Refill physical cash till"
              >
                + Refill Till
              </button>
            )}
          </div>

          {/* Card Middle: Cash Remaining */}
          <div className="relative z-10 my-auto">
            <div className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-[#161514] dark:text-white tabular-nums">
              {formatAmount(monthlyStats.remainingCashBudget)}
            </div>
            <span className="text-[10px] font-mono text-[#64748B] dark:text-stone-400">
              Cash remaining in hand
            </span>
          </div>

          {/* Card Footer: Cash Limit & Spent Today */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E2E8F0] dark:border-white/10 relative z-10">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] dark:text-stone-400 block">
                Envelope Cap
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-[#161514] dark:text-stone-200 tabular-nums">
                {formatAmount(monthlyStats.baseCashBudget)}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] dark:text-stone-400 block">
                Today Spent
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                -{currencySymbol}{dailyStats.todayCashExpense.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: Safe-To-Spend Budget Gauge */}
        <div
          onClick={(e) => {
            if (activeCardIndex !== 2) {
              e.stopPropagation();
              goToCard(2);
            } else {
              onOpenAllowances?.();
            }
          }}
          style={getCardStyle(2)}
          className="absolute inset-y-0 left-0 w-[calc(100%-28px)] sm:w-[calc(100%-36px)] rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-white via-[#F0FDF4] to-[#DCFCE7] dark:from-[#161514] dark:via-[#1A201C] dark:to-[#122B1E] text-[#161514] dark:text-white border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex flex-col justify-between overflow-hidden group cursor-pointer will-change-transform"
        >
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-400/10 dark:bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Card Top: Gauge & Budget Status */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-400/30 flex items-center justify-center text-[#047857] dark:text-emerald-400 shadow-xs">
                <Target className="size-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-heading font-black tracking-tight text-[#161514] dark:text-white">
                  Safe-to-Spend
                </h3>
                <span className="text-[11px] font-mono text-[#64748B] dark:text-stone-300">
                  {monthlyStats.daysRemainingInMonth} days left in cycle
                </span>
              </div>
            </div>

            <span
              className={cn(
                "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border",
                budgetPercentageRemaining <= 15
                  ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30"
                  : budgetPercentageRemaining <= 30
                  ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30"
                  : "bg-emerald-50 text-[#047857] border-emerald-300 dark:bg-emerald-500/20 dark:text-[#03D26F] dark:border-emerald-500/30"
              )}
            >
              {budgetPercentageRemaining}% Left
            </span>
          </div>

          {/* Card Middle: Daily Safe Pace */}
          <div className="relative z-10 my-auto">
            <div className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-[#161514] dark:text-white tabular-nums">
              ~{currencySymbol}{dailyStats.todayRemaining.toLocaleString()}
              <span className="text-sm font-normal text-[#64748B] dark:text-stone-400 ml-1.5">/ day</span>
            </div>
            {monthlyStats.rolloverSurplus > 0 && (
              <span className="text-[10px] font-mono text-[#047857] dark:text-emerald-300">
                +{currencySymbol}{monthlyStats.rolloverSurplus.toLocaleString()} surplus rolled over
              </span>
            )}
          </div>

          {/* Card Footer: Progress Bar & Total Allowance */}
          <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0] dark:border-white/10 relative z-10">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] dark:text-stone-400">
              <span>Budget Progress</span>
              <span className="text-[#161514] dark:text-white font-semibold">
                {currencySymbol}{monthlyStats.onlineExpense.toLocaleString()} / {currencySymbol}{monthlyStats.totalAvailableBudget.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-[#E2E8F0] dark:bg-white/15 h-1.5 rounded-full overflow-hidden">
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

        {/* CARD 3: Manage Cards & Accounts */}
        <div
          onClick={(e) => {
            if (activeCardIndex !== 3) {
              e.stopPropagation();
              goToCard(3);
            } else {
              onOpenAllowances?.();
            }
          }}
          style={getCardStyle(3)}
          className="absolute inset-y-0 left-0 w-[calc(100%-28px)] sm:w-[calc(100%-36px)] rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#1C1A18] text-[#161514] dark:text-[#FAF8F5] border-2 border-dashed border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#383531] flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-[#FAF8F5] dark:hover:bg-[#252321] will-change-transform"
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

      {/* ─── DOT PAGINATION INDICATOR (1-Tap Jump to Card in Stack) ─── */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {[0, 1, 2, 3].map((idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => goToCard(idx)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
              activeCardIndex === idx
                ? "w-7 bg-[#161514] dark:bg-white"
                : "w-1.5 bg-[#E8E5DF] dark:bg-[#383531] hover:bg-[#161514]/40 dark:hover:bg-white/40"
            )}
            title={`Flip to Card ${idx + 1}`}
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
