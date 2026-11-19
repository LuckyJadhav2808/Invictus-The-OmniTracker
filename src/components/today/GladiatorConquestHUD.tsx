"use client";

import React from "react";
import { type DailyConquestMetrics } from "@/components/today/useTodayCockpitViewModel";
import { ChevronRight, Zap } from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

interface GladiatorConquestHUDProps {
  metrics: DailyConquestMetrics;
  onScrollToHabits?: () => void;
  onScrollToMoney?: () => void;
  className?: string;
}

export function GladiatorConquestHUD({
  metrics,
  onScrollToHabits,
  onScrollToMoney,
  className,
}: GladiatorConquestHUDProps) {
  // SVG Circumferences for Dual-Ring Cockpit
  // Outer (Habits): R = 62 -> C = 2 * PI * 62 ≈ 389.56
  const CIRC_HABITS = 389.56;
  const habitOffset = CIRC_HABITS * (1 - Math.min(100, Math.max(0, metrics.habitPercent)) / 100);

  // Inner (Budget): R = 44 -> C = 2 * PI * 44 ≈ 276.46
  const CIRC_BUDGET = 276.46;
  const budgetOffset = CIRC_BUDGET * (1 - Math.min(100, Math.max(0, metrics.budgetPercent)) / 100);

  const handleRowClick = (action?: () => void) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    if (action) action();
  };

  return (
    <div
      className={cn(
        "bg-white border-2 border-[#161514] rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_0px_#161514] transition-all",
        className
      )}
    >
      {/* HUD Header Bar */}
      <div className="flex items-center justify-between border-b-2 border-[#161514]/15 pb-2.5 mb-3.5">
        <div className="flex items-center gap-1.5">
          <span className="font-heading font-black text-xs uppercase tracking-wider text-[#161514] flex items-center gap-1">
            <span>⚡</span>
            <span>Daily Progress Telemetry</span>
          </span>
        </div>

        {/* Overall Status Badge */}
        <div className="inline-flex items-center gap-1 bg-[#CEF431] text-[#161514] font-mono font-black text-[10px] uppercase px-2 py-0.5 rounded-lg border border-[#161514] shadow-[1px_1px_0px_#161514]">
          <Zap className="size-3 fill-[#161514]" />
          <span>{metrics.overallScore}% COMPLETED</span>
        </div>
      </div>

      {/* Main Cockpit Body: Dual Concentric Rings (Left) + Interactive Rows (Right) */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* 1. Dual Concentric Rings SVG */}
        <div className="relative size-36 sm:size-40 shrink-0 flex items-center justify-center">
          <svg
            className="size-full -rotate-90 overflow-visible"
            viewBox="0 0 160 160"
            aria-label={`Daily Progress: ${metrics.overallScore}% complete`}
          >
            {/* Outer Ring: Habits (🟢 #03D26F) */}
            <circle
              cx="80"
              cy="80"
              r="62"
              fill="none"
              stroke="#03D26F"
              strokeWidth="10"
              opacity="0.18"
            />
            <circle
              cx="80"
              cy="80"
              r="62"
              fill="none"
              stroke="#03D26F"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRC_HABITS}
              strokeDashoffset={habitOffset}
              style={{
                transition: "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                willChange: "stroke-dashoffset",
              }}
            />

            {/* Inner Ring: Budget Safe-to-Spend (🟡 #CEF431) */}
            <circle
              cx="80"
              cy="80"
              r="44"
              fill="none"
              stroke="#CEF431"
              strokeWidth="10"
              opacity="0.25"
            />
            <circle
              cx="80"
              cy="80"
              r="44"
              fill="none"
              stroke="#CEF431"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRC_BUDGET}
              strokeDashoffset={budgetOffset}
              style={{
                transition: "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                willChange: "stroke-dashoffset",
              }}
            />
          </svg>

          {/* Centerpiece Composite Score Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
            <span className="font-heading font-black text-2xl sm:text-3xl text-[#161514] leading-none tracking-tight">
              {metrics.overallScore}%
            </span>
            <span className="font-mono font-black text-[8px] sm:text-[9px] uppercase tracking-widest text-[#161514]/60 mt-0.5">
              Score
            </span>
          </div>
        </div>

        {/* 2. Interactive Drill-Down Metric Rows */}
        <div className="w-full flex-1 flex flex-col gap-2.5">
          {/* Habits Conquest Row */}
          <button
            type="button"
            onClick={() => handleRowClick(onScrollToHabits)}
            className="w-full bg-[#FAF8F5] hover:bg-[#F3EFEA] active:translate-x-0.5 border-2 border-[#161514] rounded-xl px-3.5 py-2.5 shadow-[2px_2px_0px_#161514] flex items-center justify-between text-left transition-all cursor-pointer group"
            title="Jump to Habits"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="size-3 rounded-full border border-[#161514] bg-[#03D26F] shrink-0" />
              <span className="font-heading font-black text-xs text-[#161514] uppercase tracking-wide truncate">
                Habits
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono font-black text-xs text-emerald-800">
                {metrics.completedHabitsCount}/{metrics.totalHabitsCount} ({metrics.habitPercent}%)
              </span>
              <ChevronRight className="size-3.5 text-[#161514]/40 group-hover:text-[#161514] group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>

          {/* Safe-to-Spend Financial Row */}
          <button
            type="button"
            onClick={() => handleRowClick(onScrollToMoney)}
            className="w-full bg-[#FAF8F5] hover:bg-[#F3EFEA] active:translate-x-0.5 border-2 border-[#161514] rounded-xl px-3.5 py-2.5 shadow-[2px_2px_0px_#161514] flex items-center justify-between text-left transition-all cursor-pointer group"
            title="Jump to Safe-to-Spend Ledger"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="size-3 rounded-full border border-[#161514] bg-[#CEF431] shrink-0" />
              <span className="font-heading font-black text-xs text-[#161514] uppercase tracking-wide truncate">
                Safe Spend
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono font-black text-xs text-[#161514]">
                {metrics.currencySymbol}{metrics.remainingSafeToSpend.toLocaleString()} Left
              </span>
              <ChevronRight className="size-3.5 text-[#161514]/40 group-hover:text-[#161514] group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}