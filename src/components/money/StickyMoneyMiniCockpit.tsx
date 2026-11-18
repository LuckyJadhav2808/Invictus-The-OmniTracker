"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  ArrowUp,
  Zap,
  Wallet,
  Receipt,
  Target,
  Users,
  PiggyBank,
  BarChart2,
} from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

export interface StickyMoneyMiniCockpitProps {
  visible?: boolean;
  threshold?: number;
  currencySymbol: string;
  remainingBudget: number;
  safeDailyPace: number;
  onScrollToTop?: () => void;
  onAddTransaction: () => void;
  className?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  todayTxCount?: number;
  overBudgetCategoriesCount?: number;
  pendingIouCount?: number;
  pendingIouAmount?: number;
}

export function StickyMoneyMiniCockpit({
  visible: controlledVisible,
  threshold = 300,
  currencySymbol,
  remainingBudget,
  safeDailyPace,
  onScrollToTop,
  onAddTransaction,
  className,
  activeTab = "ledger",
  onTabChange,
  todayTxCount = 0,
  overBudgetCategoriesCount = 0,
  pendingIouCount = 0,
  pendingIouAmount = 0,
}: StickyMoneyMiniCockpitProps) {
  const [internalVisible, setInternalVisible] = useState(false);
  const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible;

  useEffect(() => {
    if (controlledVisible !== undefined) return;

    const handleScroll = () => {
      const scrollContainer = document.getElementById("main-scroll-container");
      const currentScroll = Math.max(
        scrollContainer ? scrollContainer.scrollTop : 0,
        window.scrollY || 0,
        document.documentElement.scrollTop || 0
      );
      setInternalVisible(currentScroll > threshold);
    };

    const scrollContainer = document.getElementById("main-scroll-container");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });

    // Initial check
    handleScroll();

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll, { capture: true } as any);
      }
      window.removeEventListener("scroll", handleScroll, { capture: true } as any);
      document.removeEventListener("scroll", handleScroll, { capture: true } as any);
    };
  }, [controlledVisible, threshold]);

  const handleScrollTop = () => {
    soundFX.playPop();
    soundFX.vibrate(15);
    if (onScrollToTop) {
      onScrollToTop();
    } else {
      const scrollContainer = document.getElementById("main-scroll-container");
      if (scrollContainer && scrollContainer.scrollTop > 0) {
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      }
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleAddTx = () => {
    soundFX.playPop();
    soundFX.vibrate(20);
    onAddTransaction();
  };

  const navTabs = useMemo(() => [
    {
      id: "ledger",
      label: "Ledger",
      icon: Receipt,
      badge: todayTxCount > 0 ? (
        <span className="px-1 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#161514]/10 dark:bg-white/10 text-inherit tabular-nums">
          {todayTxCount}
        </span>
      ) : null,
    },
    {
      id: "budgets",
      label: "Budgets",
      icon: Target,
      badge: overBudgetCategoriesCount > 0 ? (
        <span className="px-1 py-0.2 rounded-full text-[9px] font-mono font-black bg-amber-400 text-[#161514] border border-[#161514] tabular-nums">
          {overBudgetCategoriesCount}
        </span>
      ) : null,
    },
    {
      id: "debts",
      label: "IOUs",
      icon: Users,
      badge: pendingIouCount > 0 ? (
        <span className="px-1 py-0.2 rounded-full text-[9px] font-mono font-black bg-[#CEF431] text-[#161514] border border-[#161514] tabular-nums">
          {pendingIouCount}
        </span>
      ) : null,
    },
    {
      id: "vault",
      label: "Vault",
      icon: PiggyBank,
      badge: null,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart2,
      badge: null,
    },
  ], [todayTxCount, overBudgetCategoriesCount, pendingIouCount]);

  return (
    <div
      className={cn(
        "fixed top-2.5 left-1/2 -translate-x-1/2 z-40 w-[96%] sm:w-auto max-w-2xl transition-all duration-300 ease-out select-none",
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "-translate-y-12 opacity-0 pointer-events-none",
        className
      )}
      style={{ willChange: "transform, opacity" }}
      role="banner"
      aria-label="Sticky Money Mini Cockpit"
      aria-hidden={!isVisible}
    >
      <div className="bg-white/95 dark:bg-[#1C1A18]/95 border-2 border-[#161514] dark:border-white/20 rounded-2xl px-2 sm:px-3 py-1.5 shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)] flex items-center justify-between gap-1.5 sm:gap-3 backdrop-blur-md">
        {/* 1. Left: Remaining Budget Telemetry */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="inline-flex items-center gap-1 bg-[#DCFAE5] dark:bg-[#04250e] text-[#04250e] dark:text-[#A7F3D0] font-mono font-medium text-xs px-2 py-0.5 rounded-lg border border-[#03D26F]/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#03D26F] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#03D26F]" />
            </span>
            <Wallet className="size-3 text-[#03D26F] hidden xs:inline" />
            <span className="tabular-nums font-black text-xs">
              {currencySymbol}{Math.round(remainingBudget).toLocaleString()}
            </span>
            <span className="text-[10px] text-[#04250e]/60 dark:text-[#A7F3D0]/60 hidden md:inline">left</span>
          </div>

          {/* Middle: Safe Pace Badge (visible on larger screens) */}
          {safeDailyPace > 0 && (
            <div className="inline-flex items-center gap-1 bg-[#FAF8F5] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] font-mono text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-lg border border-[#E8E5DF] dark:border-[#383531] hidden lg:flex">
              <Zap className="size-3 text-amber-500 fill-amber-400" />
              <span className="tabular-nums font-bold">~{currencySymbol}{safeDailyPace}/d</span>
            </div>
          )}
        </div>

        {/* 2. Middle: Integrated Sub-Nav Segment */}
        {onTabChange && (
          <nav
            aria-label="Pinned Sub Navigation"
            className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar py-0.5 px-1 bg-[#FAF8F5] dark:bg-[#161514] rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] shrink min-w-0"
          >
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    soundFX.vibrate(12);
                    onTabChange(tab.id);
                  }}
                  className={cn(
                    "px-1.5 sm:px-2.5 py-1 rounded-lg text-xs font-heading transition-all flex items-center gap-1 shrink-0 cursor-pointer",
                    isActive
                      ? "bg-[#161514] text-white dark:bg-white dark:text-[#161514] font-black shadow-xs"
                      : "text-[#6B6B6B] dark:text-[#A8A29E] hover:text-[#161514] dark:hover:text-white font-semibold"
                  )}
                  title={tab.label}
                >
                  <tab.icon className="size-3.5 stroke-[2] shrink-0" />
                  <span
                    className={cn(
                      "text-[11px] sm:text-xs",
                      isActive ? "inline" : "hidden sm:inline"
                    )}
                  >
                    {tab.label}
                  </span>
                  {tab.badge}
                </button>
              );
            })}
          </nav>
        )}

        {/* 3. Right: Quick Action & Return to Top */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleAddTx}
            className="px-2 sm:px-2.5 py-1 rounded-xl bg-[#CEF431] text-[#161514] hover:bg-[#b8dc28] active:scale-95 font-heading font-black text-xs border border-[#161514] shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
            title="Log new expense"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span className="hidden xs:inline">Expense</span>
          </button>

          <button
            type="button"
            onClick={handleScrollTop}
            className="p-1 sm:p-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#F1EFEA] dark:hover:bg-[#2E2B28] text-[#161514] dark:text-[#FAF8F5] active:scale-95 border border-[#E8E5DF] dark:border-[#383531] shadow-xs transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="Scroll to top of money cockpit"
            aria-label="Scroll to top"
          >
            <ArrowUp className="size-3.5 stroke-[2]" />
          </button>
        </div>
      </div>
    </div>
  );
}
