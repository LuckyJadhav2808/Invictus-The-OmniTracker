"use client";

import React from "react";
import { format } from "date-fns";
import { Zap, Play, Pause, ArrowUp, Plus, Clock } from "lucide-react";
import { type DailyConquestMetrics } from "@/components/today/useTodayCockpitViewModel";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

interface StickyIslandMiniCockpitProps {
  metrics: DailyConquestMetrics;
  currentDateObj: Date;
  isTimerRunning: boolean;
  stopwatchSeconds: number;
  onToggleTimer: () => void;
  onOpenExpenseModal: () => void;
  onScrollToTop: () => void;
  visible: boolean;
  className?: string;
}

export function StickyIslandMiniCockpit({
  metrics,
  currentDateObj,
  isTimerRunning,
  stopwatchSeconds,
  onToggleTimer,
  onOpenExpenseModal,
  onScrollToTop,
  visible,
  className,
}: StickyIslandMiniCockpitProps) {
  const formatStopwatch = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleTopClick = () => {
    soundFX.playPop();
    soundFX.vibrate(15);
    onScrollToTop();
  };

  const handleToggleTimer = () => {
    soundFX.playPop();
    soundFX.vibrate(20);
    onToggleTimer();
  };

  const handleExpenseClick = () => {
    soundFX.playPop();
    onOpenExpenseModal();
  };

  return (
    <div
      className={cn(
        "fixed top-2.5 left-1/2 -translate-x-1/2 z-40 w-[94%] sm:w-auto max-w-xl transition-all duration-300 ease-out select-none",
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "-translate-y-12 opacity-0 pointer-events-none",
        className
      )}
      style={{ willChange: "transform, opacity" }}
      role="banner"
      aria-label="Sticky Island Mini Cockpit"
      aria-hidden={!visible}
    >
      <div className="bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] flex items-center justify-between gap-2 sm:gap-4">
        {/* 1. Left: Overall Progress Score + Date */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTopClick}
            className="inline-flex items-center gap-1 bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] border-2 border-[#161514] font-mono font-black text-xs px-2.5 py-0.5 rounded-xl shadow-2xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            title="Scroll to top"
          >
            <Zap className="size-3 text-[#CEF431] dark:text-[#161514] stroke-[3]" />
            <span className="tabular-nums font-black">{metrics.overallScore}%</span>
          </button>

          <span className="font-mono font-bold text-xs text-foreground whitespace-nowrap hidden xs:inline">
            {format(currentDateObj, "EEE, MMM d")}
          </span>
        </div>

        {/* 2. Center: Live Focus Stopwatch Ticker */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isTimerRunning ? (
            <button
              type="button"
              onClick={handleToggleTimer}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 border-2 border-[#161514] text-xs font-mono font-black text-white shadow-2xs transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
              title="Pause Focus Sprint"
            >
              <span className="inline-block size-1.5 rounded-full bg-white animate-ping" />
              <span className="tabular-nums">{formatStopwatch(stopwatchSeconds)}</span>
              <Pause className="size-3 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleTimer}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#CEF431] hover:bg-[#bce028] border-2 border-[#161514] text-xs font-heading font-black text-[#161514] shadow-2xs transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
              title="Start Focus Sprint"
            >
              <Clock className="size-3 stroke-[2.5]" />
              <span className="hidden sm:inline">Focus</span>
              <Play className="size-2.5 fill-current" />
            </button>
          )}
        </div>

        {/* 3. Right: Quick Expense + Smooth Jump to Top */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleExpenseClick}
            className="px-2.5 py-1 rounded-xl bg-card hover:bg-secondary border-2 border-[#161514] dark:border-[#38332E] text-xs font-heading font-bold text-foreground shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5"
            title="Log Expense"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span className="font-mono font-black">{metrics.currencySymbol}</span>
          </button>

          <button
            type="button"
            onClick={handleTopClick}
            className="size-8 rounded-xl bg-secondary hover:bg-muted border-2 border-border hover:border-[#161514] text-foreground flex items-center justify-center transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5 shadow-2xs"
            aria-label="Scroll back to top"
            title="Scroll to top"
          >
            <ArrowUp className="size-3.5 stroke-[2.2]" />
          </button>
        </div>
      </div>
    </div>
  );
}
