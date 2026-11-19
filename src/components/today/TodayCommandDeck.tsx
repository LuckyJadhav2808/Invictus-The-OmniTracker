"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import {
  Flame,
  Shield,
  Plus,
  Play,
  Pause,
  FileText,
  Moon,
  Sparkles,
} from "lucide-react";
import { StrobiCompanion, type StrobiState } from "@/components/mascot/StrobiCompanion";
import { HorizonWeekStrip } from "@/components/today/HorizonWeekStrip";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

export interface TodayCommandDeckProps {
  userName?: string;
  currentDateObj: Date;
  selectedDate: string;
  isToday: boolean;
  onPrevDay: () => void;
  onNextDay: () => void;
  onJumpToToday: () => void;
  onSelectDate: (dateStr: string) => void;
  completedDatesSet?: Set<string>;
  streakDays: number;
  streakFreezeTokens: number;
  allHabitsConquered: boolean;
  totalHabitsCount: number;
  // Telemetry metrics
  completedCount: number;
  pendingCount: number;
  totalCount: number;
  // Financial
  remainingSafeToSpend: number;
  spentToday: number;
  dailySafeToSpend: number;
  currencySymbol: string;
  onOpenQuickExpense: () => void;
  // Focus timer
  todayStudyMinutes: number;
  studyTargetHours?: number;
  isTimerRunning: boolean;
  stopwatchSeconds: number;
  onToggleTimer: () => void;
  // Quick Drawers
  onOpenScratchpad?: () => void;
  onOpenCloseoutDrawer?: () => void;
  className?: string;
}

export const TodayCommandDeck = React.memo(function TodayCommandDeck({
  userName,
  currentDateObj,
  selectedDate,
  isToday,
  onPrevDay,
  onNextDay,
  onJumpToToday,
  onSelectDate,
  completedDatesSet,
  streakDays,
  streakFreezeTokens,
  allHabitsConquered,
  totalHabitsCount,
  completedCount,
  pendingCount,
  totalCount,
  remainingSafeToSpend,
  spentToday,
  dailySafeToSpend,
  currencySymbol,
  onOpenQuickExpense,
  todayStudyMinutes,
  studyTargetHours = 4.0,
  isTimerRunning,
  stopwatchSeconds,
  onToggleTimer,
  onOpenScratchpad,
  onOpenCloseoutDrawer,
  className,
}: TodayCommandDeckProps) {
  // Strobi state
  const getStrobiState = (): StrobiState => {
    if (allHabitsConquered && totalHabitsCount > 0) return "celebrate";
    if (isTimerRunning) return "focus";
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 5) return "sleep";
    if (streakDays >= 3) return "fire";
    return "idle";
  };

  const strobiState = getStrobiState();
  const displayName = userName?.trim() ? userName.split(" ")[0] : "Friend";

  const completionPercent = useMemo(() => {
    if (totalCount === 0) return 100;
    return Math.min(100, Math.round((completedCount / totalCount) * 100));
  }, [completedCount, totalCount]);

  const todayStudyHours = (todayStudyMinutes / 60).toFixed(1);

  const formatTimerDigits = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleActionClick = (cb?: () => void) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    cb?.();
  };

  return (
    <header
      className={cn(
        "bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-3xl p-4 sm:p-5 shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] space-y-4 transition-colors",
        className
      )}
      aria-label="Daily Command Deck"
    >
      {/* ─── ROW 1: GREETING & AMBIENT ACTIONS ─── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-foreground tracking-tight leading-tight">
            Hey, {displayName} 👋
          </h1>
          <p className="text-xs sm:text-sm font-sans font-medium text-muted-foreground mt-0.5">
            {format(currentDateObj, "EEEE, MMMM d")}{isToday ? " • Let's make progress today!" : ""}
          </p>
        </div>

        {/* Ambient Badges & Quick Action Pills */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Streak Flame */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#161514] dark:border-[#38332E] bg-[#FFFBEB] dark:bg-[#261E14] text-[#92400E] dark:text-amber-300 shadow-2xs">
            <Flame className="size-3.5 text-orange-500 fill-orange-500 shrink-0" />
            <span className="font-heading font-black text-xs tabular-nums">
              {streakDays}d streak
            </span>
          </div>

          {/* Streak Shield */}
          {streakFreezeTokens > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#161514] dark:border-[#38332E] bg-secondary text-xs font-heading font-bold text-foreground shadow-2xs">
              <Shield className="size-3.5 text-muted-foreground" />
              <span>{streakFreezeTokens}</span>
            </div>
          )}

          {/* Quick Scratchpad */}
          {onOpenScratchpad && (
            <button
              type="button"
              onClick={() => handleActionClick(onOpenScratchpad)}
              className="px-3 py-1.5 rounded-xl border-2 border-[#161514] dark:border-[#38332E] bg-secondary text-secondary-foreground text-xs font-heading font-black shadow-2xs hover:bg-[#CEF431] hover:text-[#161514] dark:hover:bg-[#CEF431] dark:hover:text-[#161514] transition-all cursor-pointer active:scale-95"
              title="Open Scratchpad (⌘J)"
            >
              <FileText className="size-3.5 inline-block mr-1 stroke-[2]" />
              Notes
            </button>
          )}

          {/* Evening Closeout */}
          {onOpenCloseoutDrawer && (
            <button
              type="button"
              onClick={() => handleActionClick(onOpenCloseoutDrawer)}
              className="px-3 py-1.5 rounded-xl border-2 border-[#161514] dark:border-[#38332E] bg-secondary text-secondary-foreground text-xs font-heading font-black shadow-2xs hover:bg-[#CEF431] hover:text-[#161514] dark:hover:bg-[#CEF431] dark:hover:text-[#161514] transition-all cursor-pointer active:scale-95"
              title="Daily Review & Closeout"
            >
              <Moon className="size-3.5 inline-block mr-1 stroke-[2]" />
              Review
            </button>
          )}
        </div>
      </div>

      {/* ─── ROW 2: 7-DAY HORIZON SCRUBBER ─── */}
      <HorizonWeekStrip
        currentDateObj={currentDateObj}
        selectedDate={selectedDate || format(currentDateObj, "yyyy-MM-dd")}
        isToday={isToday}
        onSelectDate={onSelectDate}
        onPrevDay={onPrevDay}
        onNextDay={onNextDay}
        onJumpToToday={onJumpToToday}
        completedDatesSet={completedDatesSet}
      />

      {/* ─── ROW 3: SIGNATURE DAILY COMMAND ANCHOR (Production Level & Clean) ─── */}
      <div className="bg-card dark:bg-[#161514] border-2 border-[#161514] dark:border-[#38332E] rounded-2xl p-4 sm:p-4.5 shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex flex-col sm:flex-row items-center gap-4 transition-colors">
        {/* Left: Free-Standing 3D Strobi Mascot */}
        <div className="shrink-0 flex items-center justify-center select-none">
          <StrobiCompanion
            state={strobiState}
            gear="tasks"
            size={58}
            streakDays={streakDays}
          />
        </div>

        {/* Right: Integrated Telemetry & Coach Directive */}
        <div className="flex-1 w-full min-w-0 space-y-3">
          {/* Integrated 3-Sector Telemetry Grid */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pb-2 border-b border-[#161514]/10 dark:border-white/10">
            {/* Sector 1: Daily Progress */}
            <div className="min-w-0">
              <span className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider block">
                Daily Progress
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-heading font-black text-lg sm:text-xl text-foreground tabular-nums">
                  {completedCount}/{totalCount}
                </span>
                <span className="text-xs font-heading font-bold text-muted-foreground">
                  ({completionPercent}%)
                </span>
              </div>
              <div className="h-1.5 bg-[#E8E5DF] dark:bg-[#2A2724] rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-[#03D26F] rounded-full transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            {/* Sector 2: Safe Spend */}
            <div className="min-w-0">
              <span className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider block">
                Safe Spend
              </span>
              <div className="flex items-center justify-between gap-1 mt-1">
                <span className="font-heading font-black text-lg sm:text-xl text-foreground tabular-nums truncate">
                  {currencySymbol}{Math.max(0, remainingSafeToSpend).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => handleActionClick(onOpenQuickExpense)}
                  className="size-6 rounded-lg border-2 border-[#161514] dark:border-[#38332E] bg-secondary text-secondary-foreground hover:bg-[#CEF431] hover:text-[#161514] dark:hover:bg-[#CEF431] dark:hover:text-[#161514] flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95 shrink-0"
                  title="Quick Log Expense"
                >
                  <Plus className="size-3.5 stroke-[2.5]" />
                </button>
              </div>
              <span className="text-xs font-sans font-medium text-muted-foreground block truncate mt-1">
                {spentToday > 0 ? `Spent ${currencySymbol}${spentToday}` : "No spend yet"}
              </span>
            </div>

            {/* Sector 3: Deep Work */}
            <div className="min-w-0">
              <span className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider block">
                Deep Work
              </span>
              <div className="flex items-center justify-between gap-1 mt-1">
                <span className="font-heading font-black text-lg sm:text-xl text-foreground tabular-nums truncate">
                  {isTimerRunning ? formatTimerDigits(stopwatchSeconds) : `${todayStudyHours}h`}
                </span>
                <button
                  type="button"
                  onClick={() => handleActionClick(onToggleTimer)}
                  className={cn(
                    "size-6 rounded-lg border-2 border-[#161514] dark:border-[#38332E] flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95 shrink-0",
                    isTimerRunning
                      ? "bg-amber-400 text-[#161514] dark:bg-amber-400 dark:text-[#161514]"
                      : "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514]"
                  )}
                  title={isTimerRunning ? "Pause Focus Timer" : "Start Focus Timer"}
                >
                  {isTimerRunning ? (
                    <Pause className="size-3 fill-current" />
                  ) : (
                    <Play className="size-3 fill-current ml-0.5" />
                  )}
                </button>
              </div>
              <span className="text-xs font-sans font-medium text-muted-foreground block truncate mt-1">
                {studyTargetHours.toFixed(1)}h daily goal
              </span>
            </div>
          </div>

          {/* Strobi's Punchy Speech Directive */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="size-2 rounded-full bg-[#03D26F] shrink-0" />
            <p className="font-heading font-bold text-xs sm:text-sm text-foreground truncate leading-snug">
              {strobiState === "celebrate"
                ? "All caught up for today! Outstanding focus and discipline."
                : isTimerRunning
                ? "Deep focus sprint in progress. Stay in the zone!"
                : pendingCount > 0
                ? `${pendingCount} ${pendingCount === 1 ? "task" : "tasks"} remaining today. Keep the momentum going!`
                : "Ready when you are. Check off your first task to ignite momentum!"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
});
