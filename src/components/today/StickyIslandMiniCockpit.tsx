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
      <div className="bg-white/95 border border-[#E8E5DF] rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 shadow-md flex items-center justify-between gap-2 sm:gap-4 backdrop-blur-md">
        {/* 1. Left: Overall Progress Score + Date */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="inline-flex items-center gap-1 bg-[#DCFAE5] text-[#04250e] font-mono font-medium text-xs px-2 py-0.5 rounded-md border border-[#03D26F]/30">
            <Zap className="size-3 text-[#03D26F]" />
            <span className="tabular-nums font-semibold">{metrics.overallScore}%</span>
          </div>

          <span className="font-medium text-xs text-[#161514] whitespace-nowrap hidden xs:inline">
            {format(currentDateObj, "EEE, MMM d")}
          </span>
        </div>

        {/* 2. Center: Live Focus Stopwatch Ticker */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isTimerRunning ? (
            <button
              type="button"
              onClick={handleToggleTimer}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-xs font-mono font-medium text-white transition-colors cursor-pointer"
              title="Pause Focus Sprint"
            >
              <span className="inline-block size-1.5 rounded-full bg-white" />
              <span className="tabular-nums">{formatStopwatch(stopwatchSeconds)}</span>
              <Pause className="size-3" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleTimer}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F1EFEA] hover:bg-[#EAE8E3] text-xs font-medium text-[#161514] transition-colors cursor-pointer"
              title="Start Focus Sprint"
            >
              <Clock className="size-3 text-[#6B6B6B]" />
              <span className="hidden sm:inline">Focus</span>
              <Play className="size-2.5 fill-current" />
            </button>
          )}
        </div>

        {/* 3. Right: Quick Expense + Smooth Jump to Top */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleExpenseClick}
            className="px-2 py-1 rounded-md bg-[#F1EFEA] hover:bg-[#EAE8E3] text-xs font-medium text-[#161514] transition-colors cursor-pointer flex items-center gap-1"
            title="Log Expense"
          >
            <Plus className="size-3 stroke-[1.5]" />
            <span>{metrics.currencySymbol}</span>
          </button>

          <button
            type="button"
            onClick={handleTopClick}
            className="size-7 rounded-md bg-[#161514] text-white flex items-center justify-center hover:bg-[#252321] transition-colors cursor-pointer"
            aria-label="Scroll back to top"
            title="Scroll to top"
          >
            <ArrowUp className="size-3.5 stroke-[1.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
