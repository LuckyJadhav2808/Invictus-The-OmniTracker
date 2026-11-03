"use client";

import React from "react";
import { Utensils, Apple } from "lucide-react";
import { MealTracker } from "@/components/goals/MealTracker";

export default function NutritionPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Harmonized Macro & Fuel Header */}
      <div className="bg-white dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#2A2724] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-[#03D26F]/15 text-[#047857] dark:text-[#03D26F] text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border border-[#03D26F]/30">
              Nutrition & Fuel
            </span>
            <span className="text-[10px] font-mono text-[#6E6B65] dark:text-[#9E9A90]">
              Macro & Caloric Balance
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-heading font-bold text-[#161514] dark:text-white tracking-tight flex items-center gap-2.5">
            <Utensils className="size-5 text-[#161514] dark:text-white stroke-[2]" />
            <span>Diet, Calories & Macro Discipline</span>
          </h1>

          <p className="text-xs font-normal text-[#6E6B65] dark:text-[#9E9A90] max-w-xl">
            Track daily calories, hit target protein ratios, and log meals across curated dishes or custom foods.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] shrink-0 font-mono text-xs font-medium text-[#161514] dark:text-white shadow-xs">
          <Apple className="size-3.5 text-emerald-600 dark:text-[#03D26F]" />
          <span>Daily Macro Discipline</span>
        </div>
      </div>

      {/* 2. Full-Width Meal & Macro Tracker */}
      <MealTracker />
    </div>
  );
}
