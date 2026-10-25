"use client";

import React from "react";
import { Dumbbell, Flame, Timer, Sparkles } from "lucide-react";
import { GymRoutineTracker } from "@/components/goals/GymRoutineTracker";
import { useLiveActivityStore } from "@/store/live-activity-store";

export default function GymPage() {
  const { activeActivity, gymRest } = useLiveActivityStore();
  const isRestActive = activeActivity === "gym_rest" && gymRest.secondsLeft > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Dedicated Arena Hero Header */}
      <div className="bg-white border-2 border-[#161514] rounded-2xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_#161514] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-[#CEF431] text-[#161514] text-[10px] font-mono font-black px-2 py-0.5 rounded-full border border-[#161514] uppercase">
              The Iron Arena
            </span>
            <span className="text-[10px] font-mono font-bold text-[#161514]/70">
              STRENGTH & HYPERTROPHY OS
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-heading font-black text-[#161514] tracking-tight flex items-center gap-2">
            <Dumbbell className="size-6 text-[#161514] stroke-[2.5]" />
            <span>Workout Routines & Anatomy</span>
          </h1>

          <p className="text-xs font-medium text-[#161514]/70 max-w-xl">
            Log your sets, track recovery rest stopwatches, and inspect interactive target muscle anatomy.
          </p>
        </div>

        {/* Live Rest Timer Telemetry Chip */}
        {isRestActive && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#C084FC] border-2 border-[#161514] shadow-[2px_2px_0px_#161514] font-mono text-xs font-black text-[#161514] animate-pulse">
            <Timer className="size-4 text-[#161514]" />
            <span>REST TIMER: {gymRest.secondsLeft}s LEFT</span>
          </div>
        )}
      </div>

      {/* 2. Full-Width Gym Routine & Anatomy Tracker */}
      <GymRoutineTracker />
    </div>
  );
}
