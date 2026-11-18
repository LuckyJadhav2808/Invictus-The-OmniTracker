"use client";

import React, { useState, useEffect } from "react";
import { Plus, ArrowUp, Flame, Sparkles } from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import { StrobiCompanion } from "@/components/mascot/StrobiCompanion";

export interface StickyHabitsMiniCockpitProps {
  visible?: boolean;
  threshold?: number;
  dailyCompletionPercent: number;
  completedCount: number;
  dueCount: number;
  longestStreak: number;
  onScrollToTop?: () => void;
  onOpenNewHabit: () => void;
  className?: string;
}

export function StickyHabitsMiniCockpit({
  visible: controlledVisible,
  threshold = 300,
  dailyCompletionPercent = 0,
  completedCount = 0,
  dueCount = 0,
  longestStreak = 0,
  onScrollToTop,
  onOpenNewHabit,
  className,
}: StickyHabitsMiniCockpitProps) {
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

  const handleAdd = () => {
    soundFX.playPop();
    soundFX.vibrate(20);
    onOpenNewHabit();
  };

  const isAllConquered = dueCount > 0 && completedCount >= dueCount;

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
      aria-label="Sticky Habits Mini Cockpit"
      aria-hidden={!isVisible}
    >
      <div className="bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mini Velocity Ring & Telemetry */}
        <div
          onClick={handleScrollTop}
          className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
        >
          <StrobiCompanion
            size={28}
            state={isAllConquered ? "celebrate" : longestStreak >= 3 ? "fire" : "idle"}
            gear="fitness"
            onClick={onOpenNewHabit}
          />
          {/* Mini Ring Badge */}
          <div
            className={cn(
              "size-8 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 border-2 border-[#161514] shadow-2xs",
              isAllConquered
                ? "bg-[#03D26F] text-[#161514]"
                : "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514]"
            )}
          >
            {dailyCompletionPercent}%
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              {isAllConquered ? (
                <>
                  <Sparkles className="size-2.5 text-[#03D26F]" />
                  <span className="text-[#03D26F]">Conquered</span>
                </>
              ) : (
                "Routines Due"
              )}
            </span>
            <span className="text-xs font-mono font-black text-foreground tabular-nums">
              {completedCount}/{dueCount} Done
            </span>
          </div>
        </div>

        {/* Center: Longest Streak Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-secondary border border-border text-xs font-mono font-bold text-foreground">
          <Flame className="size-3.5 fill-orange-500 text-orange-500" />
          <span>{longestStreak}d streak</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleScrollTop}
            className="size-8 rounded-xl border border-border bg-secondary hover:bg-muted text-foreground flex items-center justify-center cursor-pointer shadow-2xs transition-colors"
            title="Scroll to Top"
            aria-label="Scroll to top"
          >
            <ArrowUp className="size-3.5 stroke-[2.2]" />
          </button>

          <button
            onClick={handleAdd}
            className="h-8 px-2.5 sm:px-3 rounded-xl bg-[#CEF431] hover:bg-[#bce028] text-[#161514] font-heading font-black text-xs border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] flex items-center gap-1 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            aria-label="Add new habit"
          >
            <Plus className="size-3.5 stroke-[3]" />
            <span className="hidden xs:inline">Habit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
