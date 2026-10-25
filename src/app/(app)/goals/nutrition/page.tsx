"use client";

import React from "react";
import { Utensils, Flame, Sparkles, Apple } from "lucide-react";
import { MealTracker } from "@/components/goals/MealTracker";

export default function NutritionPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Dedicated Macro Forge Hero Header */}
      <div className="bg-white border-2 border-[#161514] rounded-2xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_#161514] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-[#CEF431] text-[#161514] text-[10px] font-mono font-black px-2 py-0.5 rounded-full border border-[#161514] uppercase">
              The Macro Forge
            </span>
            <span className="text-[10px] font-mono font-bold text-[#161514]/70">
              NUTRITION & METABOLIC OS
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-heading font-black text-[#161514] tracking-tight flex items-center gap-2">
            <Utensils className="size-6 text-[#161514] stroke-[2.5]" />
            <span>Diet, Calories & Macro Discipline</span>
          </h1>

          <p className="text-xs font-medium text-[#161514]/70 max-w-xl">
            Track daily calories, hit your protein goals, and log meals across 1,000+ curated dishes.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8F5] border-2 border-[#161514] shadow-[2px_2px_0px_#161514] shrink-0 font-mono text-xs font-black text-[#161514]">
          <Apple className="size-4 text-emerald-600" />
          <span>FUEL THE WARRIOR</span>
        </div>
      </div>

      {/* 2. Full-Width Meal & Macro Tracker */}
      <MealTracker />
    </div>
  );
}
