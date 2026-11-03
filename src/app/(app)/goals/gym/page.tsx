"use client";

import React from "react";
import { Dumbbell, Timer } from "lucide-react";
import { GymRoutineTracker } from "@/components/goals/GymRoutineTracker";
import { useLiveActivityStore } from "@/store/live-activity-store";

export default function GymPage() {
  const { activeActivity, gymRest } = useLiveActivityStore();
  const isRestActive = activeActivity === "gym_rest" && gymRest.secondsLeft > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Harmonized Gym Studio Header */}
      <div className="bg-white dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#2A2724] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-[#03D26F]/15 text-[#047857] dark:text-[#03D26F] text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border border-[#03D26F]/30">
              Gym & Routines
            </span>
            <span className="text-[10px] font-mono text-[#6E6B65] dark:text-[#9E9A90]">
              Strength & Progressive Overload
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-heading font-bold text-[#161514] dark:text-white tracking-tight flex items-center gap-2.5">
            <Dumbbell className="size-5 text-[#161514] dark:text-white stroke-[2]" />
            <span>Workout Routines & Anatomy</span>
          </h1>

          <p className="text-xs font-normal text-[#6E6B65] dark:text-[#9E9A90] max-w-xl">
            Log your sets, track progressive overload, monitor recovery rest timers, and inspect target muscle activation.
          </p>
        </div>

        {/* Live Rest Timer Telemetry Chip (Apple Dynamic Island Style) */}
        {isRestActive && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161514] text-white border border-white/10 shadow-sm font-mono text-xs font-medium shrink-0 animate-pulse">
            <span className="size-2 rounded-full bg-[#03D26F] animate-ping" />
            <Timer className="size-3.5 text-white/80" />
            <span>Rest Timer: {gymRest.secondsLeft}s left</span>
          </div>
        )}
      </div>

      {/* 2. Full-Width Gym Routine & Anatomy Tracker */}
      <GymRoutineTracker />
    </div>
  );
}
