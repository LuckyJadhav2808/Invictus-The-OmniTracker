"use client";

import React, { useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import {
  Flame,
  ShieldCheck,
  Volume2,
  VolumeX,
  Plus,
  LayoutList,
  Rows,
  Grid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { VixPixelCompanion } from "@/components/mascot/VixPixelCompanion";
import { BeadedAmphitheaterArcGauge } from "./BeadedAmphitheaterArcGauge";
import { type Habit, type Streak } from "@/types";

export interface HabitsCockpitDeckProps {
  habits: Habit[];
  logs?: any[];
  streaks: Record<string, Streak>;
  streakFreeze: {
    tokensAvailable: number;
    frozenDates: string[];
    lastMonthlyCredit?: string;
  };
  selectedDate: string; // "yyyy-MM-dd"
  onSelectDate: (date: string) => void;
  habitLayoutStyle: "cards" | "compact" | "matrix";
  onSelectLayoutStyle: (style: "cards" | "compact" | "matrix") => void;
  onOpenNewHabit: () => void;
  onOpenShieldInfo: () => void;
  dailyCompletionPercent: number;
  completedCount: number;
  dueCount: number;
  userLevel?: number;
  totalXP?: number;
  userName?: string;
  soundMuted: boolean;
  onToggleSound: () => void;
  weeklyAveragePercent?: number;
}

export function HabitsCockpitDeck({
  habits = [],
  streaks = {},
  streakFreeze,
  selectedDate,
  onSelectDate,
  habitLayoutStyle,
  onSelectLayoutStyle,
  onOpenNewHabit,
  onOpenShieldInfo,
  dailyCompletionPercent = 0,
  completedCount = 0,
  dueCount = 0,
  userLevel = 1,
  totalXP = 0,
  userName = "Gladiator",
  soundMuted,
  onToggleSound,
  weeklyAveragePercent = 85,
}: HabitsCockpitDeckProps) {
  const longestStreakValue = useMemo(() => {
    return Object.values(streaks).reduce((max, s) => Math.max(max, s.longestStreak), 0);
  }, [streaks]);

  // Current active 7-day week window (Monday to Sunday)
  const weekDays = useMemo(() => {
    const baseDate = new Date(selectedDate);
    const validBase = isNaN(baseDate.getTime()) ? new Date() : baseDate;
    const weekStart = startOfWeek(validBase, { weekStartsOn: 1 }); // Monday

    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(weekStart, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const isToday = isSameDay(date, new Date());
      const isSelected = dateStr === selectedDate;

      return {
        date,
        dateStr,
        dayLabel: format(date, "EEE"), // Mon, Tue...
        dayNum: format(date, "d"),     // 26, 27...
        isToday,
        isSelected,
      };
    });
  }, [selectedDate]);

  const streakTarget = 14;
  const streakPercent = Math.min(100, Math.round((longestStreakValue / streakTarget) * 100));
  const isConquered = dueCount > 0 && completedCount >= dueCount;

  return (
    <div className="bg-[#FAF8F5] dark:bg-[#161514] border-2 border-[#161514] dark:border-[#38332E] rounded-3xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_#161514] dark:shadow-[4px_4px_0px_0px_#000000] space-y-5 font-sans select-none">
      {/* 1. Header Bar: Identity, Telemetry Badges & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#161514]/10 dark:border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514]">
              Habits Engine
            </span>
            <span className="text-xs font-mono font-bold text-muted-foreground">
              Lvl {userLevel} • {totalXP} XP
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-foreground flex items-center gap-2">
            <span>Daily Routines & Momentum</span>
            {isConquered && (
              <span className="text-xs font-mono font-black uppercase px-2 py-0.5 rounded-full bg-[#03D26F]/20 text-[#047857] dark:text-[#03D26F] border border-[#03D26F]/40 animate-pulse">
                All Conquered ⚡
              </span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Active gladiator: <span className="font-bold text-foreground">{userName}</span> • {completedCount}/{dueCount} habits done today
          </p>
        </div>

        {/* Quick Action Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Autonomous Cryo-Shield Vault Pill */}
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              onOpenShieldInfo();
            }}
            className={cn(
              "px-2.5 py-1.5 rounded-xl border-2 text-xs font-mono font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(22,21,20,0.5)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
              streakFreeze.tokensAvailable > 0
                ? "bg-secondary text-foreground border-border hover:bg-muted"
                : "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-600/40"
            )}
            title="Cryo-Shield Vault protection"
          >
            <ShieldCheck className="size-3.5 text-[#03D26F] stroke-[2.2]" />
            <span>{streakFreeze.tokensAvailable}/2 Cryo-Shields</span>
          </button>

          {/* Longest Streak Pill */}
          <div className="px-2.5 py-1.5 rounded-xl border-2 border-border bg-secondary text-foreground text-center flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(22,21,20,0.5)]">
            <Flame className="size-3.5 fill-orange-500 text-orange-500" />
            <span className="text-xs font-mono font-black tabular-nums">
              {longestStreakValue}d streak
            </span>
          </div>

          {/* Tactile Audio Mute Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className="size-9 rounded-xl border-2 border-border bg-secondary hover:bg-muted text-foreground transition-all flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_0px_rgba(22,21,20,0.5)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            title={soundMuted ? "Unmute sound effects" : "Mute sound effects"}
          >
            {soundMuted ? <VolumeX className="size-3.5 stroke-[2]" /> : <Volume2 className="size-3.5 stroke-[2]" />}
          </button>

          {/* New Habit Trigger Button */}
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              onOpenNewHabit();
            }}
            className="bg-[#CEF431] hover:bg-[#bce028] text-[#161514] font-heading font-black text-xs px-3.5 py-2 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Plus className="size-3.5 stroke-[3]" />
            <span>New Habit</span>
          </button>

          {/* Vix Companion Avatar */}
          <VixPixelCompanion
            gear="fitness"
            state={isConquered ? "celebrate" : longestStreakValue >= 3 ? "fire" : "idle"}
            size={36}
            onClick={() => {
              soundFX.playPop();
              onOpenNewHabit();
            }}
            title={isConquered ? "Vix: All daily habits conquered!" : "Vix: Fitness companion"}
          />
        </div>
      </div>

      {/* 2. Centerpiece: Beaded Amphitheater Arc Gauge & Dual Telemetry */}
      <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center space-y-4 shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000]">
        <BeadedAmphitheaterArcGauge
          todayPercent={dailyCompletionPercent}
          weekPercent={weeklyAveragePercent}
          streakPercent={streakPercent}
        />

        {/* Dual Telemetry Inset Row (Routinr Benchmark) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
          {/* Telemetry Card 1: This Week */}
          <div className="bg-card border-2 border-border rounded-xl p-3 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-muted-foreground">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-[#03D26F]">
                📈 This week
              </span>
              <span className="text-foreground font-black">{weeklyAveragePercent}% average</span>
            </div>
            {/* 7 Segmented Diagonal Slash Bars */}
            <div className="grid grid-cols-7 gap-1 h-3">
              {Array.from({ length: 7 }).map((_, idx) => {
                const isBarFilled = idx < Math.round((weeklyAveragePercent / 100) * 7);
                return (
                  <div
                    key={`week-bar-${idx}`}
                    className={cn(
                      "rounded-sm border transition-all",
                      isBarFilled
                        ? "bg-[#03D26F] border-[#161514]/40 dark:border-black"
                        : "bg-muted border-border"
                    )}
                  />
                );
              })}
            </div>
          </div>

          {/* Telemetry Card 2: Streak Momentum */}
          <div className="bg-card border-2 border-border rounded-xl p-3 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-muted-foreground">
              <span className="flex items-center gap-1 text-amber-600 dark:text-[#F59E0B]">
                🔥 Streak
              </span>
              <span className="text-foreground font-black">
                {longestStreakValue} of {streakTarget}d
              </span>
            </div>
            {/* 7 Segmented Diagonal Slash Bars */}
            <div className="grid grid-cols-7 gap-1 h-3">
              {Array.from({ length: 7 }).map((_, idx) => {
                const isBarFilled = idx < Math.round((longestStreakValue / streakTarget) * 7);
                return (
                  <div
                    key={`streak-bar-${idx}`}
                    className={cn(
                      "rounded-sm border transition-all",
                      isBarFilled
                        ? "bg-[#F59E0B] border-[#161514]/40 dark:border-black"
                        : "bg-muted border-border"
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Dedicated Full-Width 7-Day Date Scrubber (Routinr Benchmark) */}
      <div className="w-full pt-1">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 w-full">
          {weekDays.map((day) => (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => {
                soundFX.playPop();
                onSelectDate(day.dateStr);
              }}
              className={cn(
                "py-2 px-1 sm:px-2 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center w-full min-h-[52px]",
                day.isSelected
                  ? "bg-[#161514] text-[#CEF431] border-[#161514] dark:bg-[#CEF431] dark:text-[#161514] dark:border-[#CEF431] shadow-[2px_2px_0px_0px_rgba(22,21,20,0.6)] font-black scale-[1.02]"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-muted font-bold"
              )}
            >
              <span className="text-[9px] uppercase tracking-wider opacity-75">
                {day.dayLabel}
              </span>
              <span className="text-xs sm:text-sm font-mono font-black mt-0.5">
                {day.dayNum}
              </span>
              {day.isToday && (
                <span
                  className={cn(
                    "size-1.5 rounded-full mt-1",
                    day.isSelected ? "bg-[#CEF431] dark:bg-[#161514]" : "bg-emerald-500"
                  )}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Bottom Controls Strip: Selected Date & 3-Way View Switcher */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#161514]/10 dark:border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono font-bold text-foreground truncate">
            {format(new Date(selectedDate), "EEEE, MMM d")}
          </span>
          {selectedDate !== format(new Date(), "yyyy-MM-dd") && (
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                onSelectDate(format(new Date(), "yyyy-MM-dd"));
              }}
              className="text-[10px] font-mono font-black uppercase text-[#161514] bg-[#CEF431] border border-[#161514] px-2 py-0.5 rounded-md shadow-2xs hover:bg-[#bce028] cursor-pointer transition-all"
            >
              Jump to Today
            </button>
          )}
        </div>

        {/* 3-Way View Mode Switcher Pill */}
        <div className="flex items-center gap-1 bg-secondary border-2 border-border rounded-xl p-1 shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              onSelectLayoutStyle("cards");
            }}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer",
              habitLayoutStyle === "cards"
                ? "bg-card text-foreground border border-border shadow-2xs font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Card View (Detailed)"
          >
            <LayoutList className="size-3.5" />
            <span className="inline">Cards</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              onSelectLayoutStyle("compact");
            }}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer",
              habitLayoutStyle === "compact"
                ? "bg-card text-foreground border border-border shadow-2xs font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Compact Rows View"
          >
            <Rows className="size-3.5" />
            <span className="inline">Compact</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playPop();
              onSelectLayoutStyle("matrix");
            }}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer",
              habitLayoutStyle === "matrix"
                ? "bg-card text-foreground border border-border shadow-2xs font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Contribution Heat Matrix View"
          >
            <Grid className="size-3.5" />
            <span className="inline">Matrix</span>
          </button>
        </div>
      </div>
    </div>
  );
}
