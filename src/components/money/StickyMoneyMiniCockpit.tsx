"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowUp, Zap, Wallet } from "lucide-react";
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
}

export function StickyMoneyMiniCockpit({
  visible: controlledVisible,
  threshold = 320,
  currencySymbol,
  remainingBudget,
  safeDailyPace,
  onScrollToTop,
  onAddTransaction,
  className,
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

  return (
    <div
      className={cn(
        "fixed top-2.5 left-1/2 -translate-x-1/2 z-40 w-[94%] sm:w-auto max-w-xl transition-all duration-300 ease-out select-none",
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
      <div className="bg-white dark:bg-[#161514] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl px-3.5 sm:px-4 py-1.5 sm:py-2 shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] flex items-center justify-between gap-2 sm:gap-4">
        {/* 1. Left: Remaining Budget Telemetry */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="inline-flex items-center gap-1 bg-[#DCFAE5] dark:bg-[#04250e] text-[#04250e] dark:text-[#A7F3D0] font-mono font-medium text-xs px-2 py-0.5 rounded-lg border border-[#03D26F]/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#03D26F] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#03D26F]" />
            </span>
            <Wallet className="size-3 text-[#03D26F]" />
            <span className="tabular-nums font-black">
              {currencySymbol}{Math.round(remainingBudget).toLocaleString()}
            </span>
            <span className="text-[10px] text-[#04250e]/60 dark:text-[#A7F3D0]/60 hidden xs:inline">left</span>
          </div>

          {/* 2. Middle: Safe Pace Badge */}
          {safeDailyPace > 0 && (
            <div className="inline-flex items-center gap-1 bg-[#FAF8F5] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] font-mono text-[11px] px-2 py-0.5 rounded-lg border border-[#E8E5DF] dark:border-[#383531] hidden xs:flex">
              <Zap className="size-3 text-amber-500 fill-amber-400" />
              <span className="tabular-nums font-bold">~{currencySymbol}{Math.round(safeDailyPace).toLocaleString()}/d</span>
            </div>
          )}
        </div>

        {/* 3. Right: Quick Action & Return to Top */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAddTx}
            className="px-2.5 sm:px-3 py-1 rounded-xl bg-[#CEF431] text-[#161514] hover:bg-[#b8dc28] active:scale-95 font-heading font-black text-xs border border-[#161514] shadow-xs transition-all flex items-center gap-1 cursor-pointer"
            title="Log new expense"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Expense</span>
          </button>

          <button
            type="button"
            onClick={handleScrollTop}
            className="p-1 sm:p-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#252321] hover:bg-[#F1EFEA] dark:hover:bg-[#2E2B28] text-[#161514] dark:text-[#FAF8F5] active:scale-95 border border-[#E8E5DF] dark:border-[#383531] shadow-xs transition-all flex items-center justify-center cursor-pointer"
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
