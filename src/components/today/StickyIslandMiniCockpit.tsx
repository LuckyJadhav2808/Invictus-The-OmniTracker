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
      <div className="bg-[#FAF8F5] border-2 border-[#161514] rounded-2xl px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-[3px_3px_0px_0px_#161514] flex items-center justify-between gap-2 sm:gap-4 backdrop-blur-md">
        {/* 1. Left: Overall Conquest Score + Date */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="inline-flex items-center gap-1 bg-[#CEF431] text-[#161514] font-mono font-black text-[10px] sm:text-xs px-2 py-0.5 rounded-lg border border-[#161514] shadow-[1px_1px_0px_#161514]">
            <Zap className="size-3 fill-[#161514]" />
            <span>{metrics.overallScore}%</span>
          </div>

          <span className="font-heading font-black text-[11px] sm:text-xs text-[#161514] whitespace-nowrap hidden xs:inline">
            {format(currentDateObj, "EEE, MMM d")}
          </span>
        </div>

        {/* 2. Center: Live Focus Stopwatch Ticker (Apple Dynamic Island Benchmark) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isTimerRunning ? (
            <button
              type="button"
              onClick={handleToggleTimer}
              className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-[#C084FC] border border-[#161514] text-[11px] sm:text-xs font-mono font-black text-[#161514] shadow-[1px_1px_0px_#161514] hover:bg-[#d4a8ff] active:scale-95 transition-all cursor-pointer"
              title="Pause Study Sprint"
            >
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex size-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-red-600" />
              </span>
              <span>{formatStopwatch(stopwatchSeconds)}</span>
              <Pause className="size-3 fill-[#161514]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleTimer}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-[#F1EFEA] border border-[#161514] text-[10px] sm:text-xs font-mono font-bold text-[#161514] shadow-[1px_1px_0px_#161514] active:scale-95 transition-all cursor-pointer"
              title="Start Study Sprint"
            >
              <Clock className="size-3 text-[#161514]" />
              <span className="hidden sm:inline">Focus</span>
              <Play className="size-2.5 fill-[#161514]" />
            </button>
          )}
        </div>

        {/* 3. Right: Quick Expense + Smooth Jump to Top */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleExpenseClick}
            className="px-2 sm:px-2.5 py-1 rounded-lg bg-white hover:bg-[#F1EFEA] border border-[#161514] text-[10px] sm:text-xs font-heading font-black text-[#161514] shadow-[1px_1px_0px_#161514] active:scale-95 transition-all cursor-pointer flex items-center gap-1"
          >
            <Plus className="size-3 stroke-[2.5]" />
            <span>₹</span>
          </button>

          <button
            type="button"
            onClick={handleTopClick}
            className="size-7 sm:size-8 rounded-lg bg-[#161514] text-white flex items-center justify-center hover:bg-[#2a2826] active:scale-95 shadow-[1px_1px_0px_#161514] transition-all cursor-pointer"
            aria-label="Scroll back to top"
            title="Scroll to top"
          >
            <ArrowUp className="size-3.5 sm:size-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
