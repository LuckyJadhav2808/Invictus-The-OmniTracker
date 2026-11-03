"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { type DailyBudgetStats } from "@/lib/utils/budget-rollover";

interface DailyBudgetViewProps {
  dailyStats: DailyBudgetStats;
  currencySymbol: string;
  onOpenAddExpense?: () => void;
  onOpenEditAllowances?: () => void;
}

export function DailyBudgetView({
  dailyStats,
  currencySymbol,
  onOpenAddExpense,
  onOpenEditAllowances,
}: DailyBudgetViewProps) {
  return (
    <div className="space-y-4 pt-1">
      {/* ⚡ 1. Daily Metrics Trio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Spent Today */}
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3.5 rounded-2xl border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000]">
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
            Spent Today ({dailyStats.todayDateLabel.split(",")[0]})
          </span>
          <span className="text-xl font-black text-rose-600 dark:text-rose-400 block mt-0.5" style={{ fontFamily: "var(--font-heading)" }}>
            -{currencySymbol}{dailyStats.todayExpense.toLocaleString()}
          </span>
          <span className="text-[9px] font-bold text-[#161514]/60 dark:text-[#FAF8F5]/60 block mt-0.5">
            {dailyStats.todayUsedPercentage}% of daily cap consumed
          </span>
        </div>

        {/* Card 2: Remaining Today */}
        <div className={cn(
          "p-3.5 rounded-2xl border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000]",
          dailyStats.isOverDailyBudget ? "bg-rose-100 dark:bg-rose-950/60" : "bg-[#CEF431]/30 dark:bg-[#CEF431]/15"
        )}>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#161514]/80 dark:text-[#FAF8F5]/80 block">
            Remaining For Today
          </span>
          <span className={cn(
            "text-xl font-black block mt-0.5",
            dailyStats.isOverDailyBudget ? "text-rose-700 dark:text-rose-300" : "text-emerald-950 dark:text-[#03D26F]"
          )} style={{ fontFamily: "var(--font-heading)" }}>
            {dailyStats.isOverDailyBudget ? "-" : ""}{currencySymbol}{Math.abs(dailyStats.todayRemaining).toLocaleString()}
          </span>
          <span className="text-[9px] font-bold text-[#161514]/80 dark:text-[#FAF8F5]/80 block mt-0.5">
            {dailyStats.isOverDailyBudget
              ? `⚠️ Over by ${currencySymbol}${dailyStats.overDailyAmount.toLocaleString()} today!`
              : `${currencySymbol}${dailyStats.todayRemaining.toLocaleString()} left of ${currencySymbol}${dailyStats.dailyBudgetTarget.toLocaleString()} cap`}
          </span>
        </div>

        {/* Card 3: Channel Breakdown for Today */}
        <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] p-3.5 rounded-2xl border-2 border-[#161514] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#161514]/60 dark:text-[#FAF8F5]/60 block">
              Today&apos;s Channel Split
            </span>
            <div className="flex items-center gap-3 mt-1 text-xs font-black text-[#161514] dark:text-[#FAF8F5]">
              <span>📱 UPI: {currencySymbol}{dailyStats.todayUpiExpense.toLocaleString()}</span>
              <span>💵 Cash: {currencySymbol}{dailyStats.todayCashExpense.toLocaleString()}</span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-[#161514]/60 dark:text-[#FAF8F5]/60 block mt-1">
            Daily Cap: {currencySymbol}{dailyStats.dailyBudgetTarget.toLocaleString()}/day ({dailyStats.isCustomTarget ? "Fixed Cap" : "Auto Pace"})
          </span>
        </div>
      </div>

      {/* ⚡ 2. Today's Daily Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between items-center text-[10px] font-black uppercase text-[#161514] dark:text-[#FAF8F5]">
          <span>Today&apos;s Daily Budget Consumption</span>
          <span style={{ fontFamily: "var(--font-heading)" }}>{dailyStats.todayUsedPercentage}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-[#252321] h-3.5 rounded-full overflow-hidden border-2 border-[#161514] dark:border-[#383531] p-0.5 shadow-[1px_1px_0px_0px_#161514] dark:shadow-[1px_1px_0px_0px_#000000]">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              dailyStats.todayUsedPercentage > 100 ? "bg-rose-500" : dailyStats.todayUsedPercentage > 80 ? "bg-amber-400" : "bg-[#03D26F]"
            )}
            style={{ width: `${Math.min(100, dailyStats.todayUsedPercentage)}%` }}
          />
        </div>
      </div>

      {/* 📊 3. 7-DAY MINI SPENDING TREND STRIP */}
      <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-2xl p-4 border-2 border-[#161514] dark:border-[#383531] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
            <span>📊</span>
            <span>Past 7 Days vs Target ({currencySymbol}{dailyStats.dailyBudgetTarget.toLocaleString()}/day)</span>
          </span>
          <span className="text-[10px] font-bold text-[#161514]/60 dark:text-[#FAF8F5]/60">
            Last 7 Days
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2 items-end h-28">
          {dailyStats.last7Days.map((day) => {
            const maxBar = Math.max(dailyStats.dailyBudgetTarget * 1.5, ...dailyStats.last7Days.map((d) => d.expense), 100);
            const heightPercent = Math.min(100, Math.max(12, Math.round((day.expense / maxBar) * 100)));

            return (
              <div key={day.date} className="flex flex-col items-center gap-1 h-full justify-end group">
                <span className="text-[8px] font-black text-[#161514]/70 dark:text-[#FAF8F5]/70 opacity-0 group-hover:opacity-100 transition-opacity">
                  {currencySymbol}{day.expense}
                </span>
                <div
                  className={cn(
                    "w-full rounded-t-lg border-2 border-[#161514] dark:border-[#383531] transition-all relative",
                    day.isToday ? "bg-[#CEF431] shadow-[1px_1px_0px_0px_#161514] dark:shadow-[1px_1px_0px_0px_#000000]" : day.isOverBudget ? "bg-rose-400" : "bg-[#03D26F]/60"
                  )}
                  style={{ height: `${heightPercent}%` }}
                  title={`${day.date}: ${currencySymbol}${day.expense} spent`}
                />
                <div className="text-center pt-0.5">
                  <span className={cn(
                    "text-[9px] font-black uppercase block leading-tight",
                    day.isToday ? "text-[#161514] dark:text-[#CEF431] underline" : "text-[#161514]/60 dark:text-[#FAF8F5]/60"
                  )}>
                    {day.isToday ? "Today" : day.dayLabel}
                  </span>
                  <span className="text-[8px] font-bold text-[#161514]/50 dark:text-[#FAF8F5]/50 block">
                    {day.dayNumber}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[9px] font-bold text-[#161514]/70 dark:text-[#FAF8F5]/70 pt-1 border-t border-[#161514]/10 dark:border-[#383531]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#03D26F] border border-[#161514] dark:border-[#383531]" /> Under Cap
            <span className="h-2 w-2 rounded-full bg-rose-400 border border-[#161514] dark:border-[#383531] ml-2" /> Over Cap
            <span className="h-2 w-2 rounded-full bg-[#CEF431] border border-[#161514] dark:border-[#383531] ml-2" /> Today
          </span>
          <div className="flex items-center gap-2">
            <span>
              Daily Cap: {currencySymbol}{dailyStats.dailyBudgetTarget.toLocaleString()}
            </span>
            {onOpenEditAllowances && (
              <button
                type="button"
                onClick={onOpenEditAllowances}
                className="underline hover:text-[#161514] dark:hover:text-[#FAF8F5] font-black cursor-pointer ml-1"
              >
                Change Cap
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
