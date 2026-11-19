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
  CheckCheck,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";
import { StrobiCompanion } from "@/components/mascot/StrobiCompanion";
import { StrobiPartnerStage } from "@/components/mascot/StrobiPartnerStage";
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
  onCheckAllDue?: () => void;
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
  userName = "Friend",
  soundMuted,
  onToggleSound,
  weeklyAveragePercent = 85,
  onCheckAllDue,
}: HabitsCockpitDeckProps) {
  const longestStreakValue = useMemo(() => {
    return Object.values(streaks).reduce((max, s) => Math.max(max, s.longestStreak), 0);
  }, [streaks]);

  // Deterministic local today date string (prevents UTC timezone shift bug)
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  // Current active 7-day week window (Monday to Sunday)
  const weekDays = useMemo(() => {
    // Parse selectedDate safely without UTC time shift
    const [y, m, d] = (selectedDate || todayStr).split("-").map(Number);
    const validBase = y && m && d ? new Date(y, m - 1, d) : new Date();
    const weekStart = startOfWeek(validBase, { weekStartsOn: 1 }); // Monday

    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(weekStart, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const isToday = dateStr === todayStr;
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
  }, [selectedDate, todayStr]);

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
                All Done ⚡
              </span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Welcome, <span className="font-bold text-foreground">{userName}</span> • {completedCount}/{dueCount} habits done today
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

          {/* Check All Habits Shortcut Button */}
          {onCheckAllDue && dueCount > 0 && (
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                onCheckAllDue();
              }}
              className={cn(
                "hidden sm:flex items-center gap-1.5 text-xs font-heading font-black px-3 py-2 rounded-xl border-2 transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
                isConquered
                  ? "bg-secondary text-muted-foreground border-border hover:border-[#161514] hover:text-foreground shadow-2xs"
                  : "bg-white dark:bg-[#252321] text-foreground border-border hover:border-[#161514] shadow-2xs hover:shadow-[2px_2px_0px_0px_#161514]"
              )}
              title={isConquered ? "Reset all habits for today" : "Check all due habits (Shift+⌘A)"}
            >
              <CheckCheck className={cn("size-3.5 stroke-[2.5]", isConquered ? "text-muted-foreground" : "text-[#03D26F]")} />
              <span>{isConquered ? "Reset Today" : "Check All"}</span>
              <kbd className="hidden md:inline-block text-[9px] font-mono px-1 py-0.2 bg-muted rounded border border-border text-muted-foreground">
                ⇧⌘A
              </kbd>
            </button>
          )}

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
        </div>
      </div>

      {/* 2. Centerpiece: Duolingo & Finch Benchmark Strobi Partner Stage & Arc Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Column (5 cols on lg): Large 76px Strobi Partner Stage */}
        <div className="lg:col-span-5 flex flex-col">
          <StrobiPartnerStage
            state={isConquered ? "celebrate" : longestStreakValue >= 3 ? "fire" : "idle"}
            gear="fitness"
            size={76}
            streakDays={longestStreakValue}
            moodBadge={
              isConquered
                ? "🏆 All Completed"
                : completedCount > 0
                ? `⚡ ${completedCount}/${dueCount} Done`
                : "⚡ Ready"
            }
            quip={
              isConquered
                ? `All ${dueCount} habits completed today!`
                : completedCount > 0
                ? `${completedCount} of ${dueCount} habits down. Keep the rhythm going!`
                : `${dueCount} habits due today. Start with your top priority.`
            }
            onClick={onOpenNewHabit}
            className="h-full"
          />
        </div>

        {/* Right Column (7 cols on lg): Beaded Amphitheater Arc Gauge & Dual Telemetry */}
        <div
          className={cn(
            "lg:col-span-7 border-2 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center space-y-4 transition-all duration-300",
            isConquered
              ? "bg-[#FAF8F5] dark:bg-[#1C1A18] border-[#03D26F] shadow-[3px_3px_0px_0px_#03D26F]"
              : "bg-[#FAF8F5] dark:bg-[#1C1A18] border-[#161514] dark:border-[#38332E] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000]"
          )}
        >
          <BeadedAmphitheaterArcGauge
            todayPercent={dailyCompletionPercent}
            weekPercent={weeklyAveragePercent}
            streakPercent={streakPercent}
          />

          {/* Dual Telemetry Inset Row (Routinr Benchmark) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
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
      </div>

      {/* 3. Dedicated Full-Width 7-Day Date Scrubber (Routinr Benchmark) */}
      <div className="w-full pt-1 space-y-2">
        <div className="flex items-center justify-between px-1 text-xs font-mono font-bold text-muted-foreground">
          <span className="flex items-center gap-1.5 text-foreground font-black">
            <Calendar className="size-3.5 text-[#03D26F]" />
            <span>7-Day Routine Horizon</span>
          </span>
          <span className="text-[10px] uppercase tracking-wider font-mono font-black text-emerald-600 dark:text-[#03D26F] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-[#03D26F] animate-pulse" />
            <span>Today: {format(new Date(), "EEE, MMM d")}</span>
          </span>
        </div>

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
                "relative py-2 px-1 sm:px-2 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center w-full min-h-[58px]",
                day.isSelected
                  ? "bg-[#CEF431] text-[#161514] border-[#161514] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] font-black scale-[1.03] z-10"
                  : day.isToday
                  ? "bg-secondary text-foreground border-[#03D26F] hover:bg-muted font-black"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-muted font-bold"
              )}
              title={`${day.dayLabel} ${day.dayNum} ${day.isToday ? "(Today)" : ""}`}
            >
              {/* Pointing Badge for Current Day */}
              {day.isToday && (
                <span
                  className={cn(
                    "text-[7px] font-mono font-black uppercase tracking-wider px-1 py-0.2 rounded-sm border leading-none mb-1",
                    day.isSelected
                      ? "bg-[#161514] text-[#CEF431] border-[#161514]"
                      : "bg-[#03D26F] text-[#161514] border-[#161514] animate-pulse"
                  )}
                >
                  TODAY
                </span>
              )}

              <span className="text-[9px] uppercase tracking-wider opacity-85 leading-tight">
                {day.dayLabel}
              </span>
              <span className="text-xs sm:text-sm font-mono font-black mt-0.5 leading-none">
                {day.dayNum}
              </span>

              {/* Status Pip for Today if not selected */}
              {day.isToday && !day.isSelected && (
                <span className="size-1.5 rounded-full mt-1 bg-[#03D26F] shadow-[0_0_6px_#03D26F]" />
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
