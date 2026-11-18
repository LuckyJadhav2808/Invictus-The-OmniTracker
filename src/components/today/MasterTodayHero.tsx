"use client";

import React from "react";
import { format } from "date-fns";
import {
  Flame,
  Shield,
  Wallet,
  Play,
  Pause,
  CheckSquare,
  ChevronRight,
  Zap,
  Moon,
  FileText,
} from "lucide-react";
import { StrobiCompanion, type StrobiState } from "@/components/mascot/StrobiCompanion";
import {
  DaypartMode,
  EffectiveDaypart,
  DAYPART_CONFIGS,
  type DailyConquestMetrics,
} from "@/components/today/useTodayCockpitViewModel";
import { HorizonWeekStrip } from "@/components/today/HorizonWeekStrip";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

export interface MasterTodayHeroProps {
  userName?: string;
  currentDateObj: Date;
  selectedDate?: string;
  isToday: boolean;
  onPrevDay: () => void;
  onNextDay: () => void;
  onJumpToToday: () => void;
  onSelectDate?: (dateStr: string) => void;
  completedDatesSet?: Set<string>;
  streakDays: number;
  streakFreezeTokens: number;
  completedHabitsCount: number;
  totalHabitsCount: number;
  studyMinutesToday: number;
  isStudyingActive: boolean;
  allHabitsConquered: boolean;
  daypartMode?: DaypartMode;
  effectiveDaypart?: EffectiveDaypart;
  onSelectDaypartMode?: (mode: DaypartMode) => void;
  metrics: DailyConquestMetrics;
  onScrollToHabits?: () => void;
  onScrollToStudy?: () => void;
  onScrollToMoney?: () => void;
  onToggleTimer?: () => void;
  onOpenExpenseModal?: () => void;
  onOpenCloseoutDrawer?: () => void;
  onOpenScratchpad?: () => void;
  className?: string;
}

export const MasterTodayHero = React.memo(function MasterTodayHero({
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
  completedHabitsCount,
  totalHabitsCount,
  studyMinutesToday,
  isStudyingActive,
  allHabitsConquered,
  daypartMode = "auto",
  effectiveDaypart = "dawn",
  onSelectDaypartMode,
  metrics,
  onScrollToHabits,
  onScrollToStudy,
  onScrollToMoney,
  onToggleTimer,
  onOpenExpenseModal,
  onOpenCloseoutDrawer,
  onOpenScratchpad,
  className,
}: MasterTodayHeroProps) {
  // Determine companion avatar state
  const getStrobiState = (): StrobiState => {
    if (allHabitsConquered && totalHabitsCount > 0) return "celebrate";
    if (isStudyingActive) return "focus";
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 5) return "sleep";
    if (streakDays >= 3) return "fire";
    return "idle";
  };

  const strobiState = getStrobiState();
  const daypartConfig = DAYPART_CONFIGS[effectiveDaypart] || DAYPART_CONFIGS.dawn;
  const DaypartIcon = daypartConfig.icon;

  const handleModeChange = (mode: DaypartMode) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    if (onSelectDaypartMode) {
      onSelectDaypartMode(mode);
    }
  };

  const handleInteractiveClick = (action?: () => void) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    if (action) action();
  };

  // SVG Concentric Tri-Rings Trigonometry
  const CIRC_HABITS = 414.69; // R = 66
  const habitOffset = CIRC_HABITS * (1 - Math.min(100, Math.max(0, metrics.habitPercent)) / 100);

  const CIRC_STUDY = 314.16; // R = 50
  const studyOffset = CIRC_STUDY * (1 - Math.min(100, Math.max(0, metrics.studyPercent)) / 100);

  const CIRC_BUDGET = 213.63; // R = 34
  const budgetOffset = CIRC_BUDGET * (1 - Math.min(100, Math.max(0, metrics.budgetPercent)) / 100);

  const displayName = userName?.trim() ? userName.split(" ")[0] : "Friend";

  const modeLabels: Record<DaypartMode, string> = {
    auto: "Auto",
    dawn: "Morning",
    forge: "Afternoon",
    night: "Evening",
  };

  return (
    <header className={cn("space-y-4", className)} aria-label="Command Deck">
      {/* 1. Date Navigation Horizon Bar & Ambient Telemetry */}
      <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] p-2.5 sm:p-3 rounded-2xl shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex flex-wrap items-center justify-between gap-2 sm:gap-3 transition-colors">
        <HorizonWeekStrip
          currentDateObj={currentDateObj}
          selectedDate={selectedDate || format(currentDateObj, "yyyy-MM-dd")}
          isToday={isToday}
          onSelectDate={onSelectDate || (() => {})}
          onPrevDay={onPrevDay}
          onNextDay={onNextDay}
          onJumpToToday={onJumpToToday}
          completedDatesSet={completedDatesSet}
        />

        {/* Mascot & Streak telemetry */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Streak Flame */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border-2 border-[#161514] dark:border-[#38332E] bg-[#FFFBEB] dark:bg-[#261E14] text-[#92400E] dark:text-amber-300 shadow-2xs shrink-0">
            <Flame className="size-3.5 text-orange-500 fill-orange-500 shrink-0" />
            <span className="font-mono font-bold text-xs tabular-nums">
              {streakDays}d streak
            </span>
          </div>

          {/* Shield Freeze */}
          {streakFreezeTokens > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl border-2 border-[#161514] dark:border-[#38332E] bg-secondary text-xs font-mono font-bold text-foreground shadow-2xs shrink-0">
              <Shield className="size-3.5 text-muted-foreground" />
              <span>{streakFreezeTokens} shield</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Unified Master Cockpit Card: Context Hero + Tri-Rings HUD */}
      <div className="rounded-2xl border-2 border-[#161514] dark:border-[#38332E] p-5 sm:p-6 bg-[#FAF8F5] dark:bg-[#161514] text-[#161514] dark:text-[#FAF8F5] shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] transition-colors">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column (lg:col-span-7): Clean Title & Action Deck */}
          <div className="lg:col-span-7 space-y-4 min-w-0">
            {/* Context Badge Row */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg border-2 border-[#161514] dark:border-[#38332E] bg-secondary flex items-center justify-center shrink-0 text-foreground shadow-2xs">
                  <DaypartIcon className="size-3.5 stroke-[2]" />
                </div>
                <span className="text-xs font-mono font-bold text-foreground px-2 py-0.5 rounded-md bg-secondary border border-border">
                  {daypartConfig.badgeText}
                </span>
              </div>

              {/* Daypart Mode Switcher */}
              <div className="flex items-center p-0.5 rounded-xl border-2 border-border bg-secondary shrink-0">
                {(["auto", "dawn", "forge", "night"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleModeChange(mode)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer",
                      daypartMode === mode
                        ? "bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] font-black shadow-[1px_1px_0px_0px_#161514]"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title={`Switch to ${modeLabels[mode]}`}
                  >
                    {modeLabels[mode]}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Title Row */}
            <div className="space-y-1">
              <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight leading-tight text-foreground">
                {isToday
                  ? (effectiveDaypart === "night"
                      ? `Evening Review, ${displayName}`
                      : effectiveDaypart === "forge"
                      ? `Afternoon Forge, ${displayName}`
                      : `Morning Focus, ${displayName}`)
                  : format(currentDateObj, "EEEE, MMMM d")}
              </h1>
              <p className="text-xs sm:text-sm font-sans font-medium leading-relaxed text-muted-foreground">
                {isToday
                  ? (effectiveDaypart === "night"
                      ? "Daily review ready. Check remaining tasks, preserve your streak, and wrap up."
                      : `${totalHabitsCount} habits planned · 4.0h study goal · ${metrics.currencySymbol}${metrics.remainingSafeToSpend.toLocaleString()} safe spend`)
                  : `Viewing recorded logs for ${format(currentDateObj, "MMMM d, yyyy")}`}
              </p>
            </div>

            {/* Strobi Gladiator Companion Stage */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#1E1B18] border-2 border-[#161514] dark:border-[#38332E] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] flex items-center gap-3.5">
              <StrobiCompanion
                state={strobiState}
                gear="gladiator"
                size={58}
                streakDays={streakDays}
                className="shrink-0"
              />
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514]">
                    {strobiState === "celebrate" ? "🏆 ALL CONQUERED" : "⚔️ STROBI'S DIRECTIVE"}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">
                    Gladiator Companion
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-heading font-black text-foreground leading-snug">
                  {strobiState === "celebrate"
                    ? "Legendary discipline! Every daily trial conquered. Rest, recover, and prepare for tomorrow's arena."
                    : effectiveDaypart === "night"
                    ? "Evening wrap-up: defend your streak, log your final spends, and rest like a gladiator."
                    : "Discipline over motivation. Check off your first routine and lock in today's momentum!"}
                </p>
              </div>
            </div>

            {/* Action Buttons Row - 1 Primary + Supporting Actions */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {/* Primary Focus Stopwatch Trigger */}
              {onToggleTimer && (
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onToggleTimer)}
                  className={cn(
                    "min-h-[42px] px-4 py-2 rounded-xl border-2 border-[#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-2 text-xs font-heading font-black transition-all cursor-pointer shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000]",
                    isStudyingActive
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-[#CEF431] hover:bg-[#bce028] text-[#161514]"
                  )}
                >
                  {isStudyingActive ? (
                    <Pause className="size-3.5 stroke-[2.5]" />
                  ) : (
                    <Play className="size-3.5 fill-current" />
                  )}
                  <span>{isStudyingActive ? "Pause Focus" : "Start Focus"}</span>
                </button>
              )}

              {/* Secondary Quick Expense Trigger */}
              {onOpenExpenseModal && (
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onOpenExpenseModal)}
                  className="min-h-[42px] px-3.5 py-2 bg-card hover:bg-secondary border-2 border-[#161514] dark:border-[#38332E] rounded-xl active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-1.5 text-xs font-heading font-bold text-foreground shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] transition-all cursor-pointer"
                >
                  <Wallet className="size-3.5 text-muted-foreground stroke-[2]" />
                  <span>Log Expense</span>
                </button>
              )}

              {/* Quick Scratchpad Trigger */}
              {onOpenScratchpad && (
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onOpenScratchpad)}
                  className="min-h-[42px] px-3.5 py-2 bg-card hover:bg-secondary border-2 border-[#161514] dark:border-[#38332E] rounded-xl active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-1.5 text-xs font-heading font-bold text-foreground shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] transition-all cursor-pointer"
                  title="Open Scratchpad (⌘J)"
                >
                  <FileText className="size-3.5 text-muted-foreground stroke-[2]" />
                  <span>Scratchpad</span>
                </button>
              )}

              {/* Closeout / Evening Review Drawer Trigger */}
              {onOpenCloseoutDrawer && (
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onOpenCloseoutDrawer)}
                  className="min-h-[42px] px-3.5 py-2 bg-card hover:bg-secondary border-2 border-[#161514] dark:border-[#38332E] rounded-xl active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-1.5 text-xs font-heading font-bold text-foreground shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] transition-all cursor-pointer"
                  title="Open Evening Closeout Drawer"
                >
                  <Moon className="size-3.5 text-muted-foreground stroke-[2]" />
                  <span>{effectiveDaypart === "night" ? "Review & Close" : "Review Day"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column (lg:col-span-5): Clean Concentric HUD */}
          <div className="lg:col-span-5 rounded-2xl border-2 border-[#161514] dark:border-[#38332E] p-4.5 bg-card text-foreground space-y-3.5 shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] transition-colors">
            {/* Telemetry Header */}
            <div className="flex items-center justify-between pb-2 border-b-2 border-border">
              <span className="font-heading font-black text-xs text-foreground flex items-center gap-1.5">
                <Zap className="size-3.5 text-[#03D26F] stroke-[2.5]" />
                <span>Daily Conquest Index</span>
              </span>

              <div className="inline-flex items-center gap-1 bg-[#161514] text-[#CEF431] dark:bg-[#CEF431] dark:text-[#161514] border-2 border-[#161514] font-mono font-black text-xs px-2.5 py-0.5 rounded-xl shadow-2xs">
                <span className="tabular-nums">{metrics.overallScore}%</span>
                <span className="opacity-80">Score</span>
              </div>
            </div>

            {/* Tri-Rings SVG + Interactive Breakdown Rows */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* 1. Tri-Rings Concentric SVG */}
              <div className="relative size-28 shrink-0 flex items-center justify-center">
                <svg
                  className="size-full -rotate-90 overflow-visible"
                  viewBox="0 0 160 160"
                  aria-label={`Daily Progress: ${metrics.overallScore}% complete`}
                >
                  {/* Outer Ring: Habits (🟢 #03D26F) */}
                  <circle cx="80" cy="80" r="66" fill="none" stroke="#03D26F" strokeWidth="9" opacity="0.15" />
                  <circle
                    cx="80"
                    cy="80"
                    r="66"
                    fill="none"
                    stroke="#03D26F"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={CIRC_HABITS}
                    strokeDashoffset={habitOffset}
                    style={{
                      transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                      willChange: "stroke-dashoffset",
                    }}
                  />

                  {/* Middle Ring: Study Focus (Obsidian #161514 in light, Lavender #C084FC in dark) */}
                  <circle cx="80" cy="80" r="50" fill="none" className="stroke-[#161514] dark:stroke-[#C084FC]" strokeWidth="9" opacity="0.2" />
                  <circle
                    cx="80"
                    cy="80"
                    r="50"
                    fill="none"
                    className="stroke-[#161514] dark:stroke-[#C084FC]"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={CIRC_STUDY}
                    strokeDashoffset={studyOffset}
                    style={{
                      transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                      willChange: "stroke-dashoffset",
                    }}
                  />

                  {/* Inner Ring: Budget Safe-to-Spend (Amber #D97706) */}
                  <circle cx="80" cy="80" r="34" fill="none" stroke="#D97706" strokeWidth="9" opacity="0.15" />
                  <circle
                    cx="80"
                    cy="80"
                    r="34"
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={CIRC_BUDGET}
                    strokeDashoffset={budgetOffset}
                    style={{
                      transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                      willChange: "stroke-dashoffset",
                    }}
                  />
                </svg>

                {/* Score in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
                  <span className="font-heading font-black text-2xl text-foreground leading-none tabular-nums">
                    {metrics.overallScore}%
                  </span>
                  <span className="font-mono font-bold text-[10px] text-muted-foreground uppercase mt-0.5">
                    Conquest
                  </span>
                </div>
              </div>

              {/* 2. Three Interactive Metric Rows */}
              <div className="w-full flex-1 flex flex-col gap-1.5">
                {/* Habits */}
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onScrollToHabits)}
                  className="w-full bg-[#FAF8F5] dark:bg-[#161514] hover:bg-secondary border-2 border-[#161514] dark:border-[#38332E] rounded-xl px-2.5 py-1.5 flex items-center justify-between text-left transition-all cursor-pointer group active:translate-x-0.5 active:translate-y-0.5 shadow-2xs"
                  title="Jump to Habits"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="size-2 rounded-full bg-[#03D26F] shrink-0" />
                    <span className="font-heading font-black text-xs text-foreground truncate">
                      Habits
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono font-bold text-xs text-foreground tabular-nums">
                      {metrics.completedHabitsCount}/{metrics.totalHabitsCount} ({metrics.habitPercent}%)
                    </span>
                    <ChevronRight className="size-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </button>

                {/* Study */}
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onScrollToStudy)}
                  className="w-full bg-[#FAF8F5] dark:bg-[#161514] hover:bg-secondary border-2 border-[#161514] dark:border-[#38332E] rounded-xl px-2.5 py-1.5 flex items-center justify-between text-left transition-all cursor-pointer group active:translate-x-0.5 active:translate-y-0.5 shadow-2xs"
                  title="Jump to Study"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="size-2 rounded-full bg-[#161514] dark:bg-[#C084FC] shrink-0" />
                    <span className="font-heading font-black text-xs text-foreground truncate">
                      Study
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono font-bold text-xs text-foreground tabular-nums">
                      {metrics.studyHoursFormatted}/{metrics.studyTargetHoursFormatted} ({metrics.studyPercent}%)
                    </span>
                    <ChevronRight className="size-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </button>

                {/* Safe Spend */}
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onScrollToMoney)}
                  className="w-full bg-[#FAF8F5] dark:bg-[#161514] hover:bg-secondary border-2 border-[#161514] dark:border-[#38332E] rounded-xl px-2.5 py-1.5 flex items-center justify-between text-left transition-all cursor-pointer group active:translate-x-0.5 active:translate-y-0.5 shadow-2xs"
                  title="Jump to Safe Spend"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="size-2 rounded-full bg-[#D97706] shrink-0" />
                    <span className="font-heading font-black text-xs text-foreground truncate">
                      Safe Left
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono font-bold text-xs text-foreground tabular-nums">
                      {metrics.currencySymbol}{metrics.remainingSafeToSpend.toLocaleString()}
                    </span>
                    <ChevronRight className="size-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});
