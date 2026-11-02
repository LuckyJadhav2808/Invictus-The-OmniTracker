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
import { VixPixelCompanion, VixPixelState } from "@/components/mascot/VixPixelCompanion";
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

export function MasterTodayHero({
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
  // Determine pixel companion state
  const getVixState = (): VixPixelState => {
    if (allHabitsConquered && totalHabitsCount > 0) return "celebrate";
    if (isStudyingActive) return "focus";
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 5) return "sleep";
    if (streakDays >= 3) return "fire";
    return "idle";
  };

  const vixState = getVixState();
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
      <div className="bg-white border border-[#E8E5DF] p-2.5 sm:p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 sm:gap-3">
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
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E8E5DF] bg-[#FFFBEB] text-[#92400E] shrink-0">
            <Flame className="size-3.5 text-orange-500 fill-orange-500 shrink-0" />
            <span className="font-mono font-medium text-xs tabular-nums">
              {streakDays}d streak
            </span>
          </div>

          {/* Shield Freeze */}
          {streakFreezeTokens > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E8E5DF] bg-[#F1EFEA] text-xs font-mono font-medium text-[#161514] shrink-0">
              <Shield className="size-3.5 text-[#161514]/70" />
              <span>{streakFreezeTokens} shield</span>
            </div>
          )}

          {/* Pixel Companion */}
          <VixPixelCompanion
            state={vixState}
            size={32}
            streakDays={streakDays}
          />
        </div>
      </div>

      {/* 2. Unified Master Cockpit Card: Context Hero + Tri-Rings HUD */}
      <div className="rounded-xl border border-[#E8E5DF] p-5 sm:p-6 bg-white text-[#161514]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column (lg:col-span-7): Clean Title & Action Deck */}
          <div className="lg:col-span-7 space-y-4 min-w-0">
            {/* Context Badge Row */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg border border-[#E8E5DF] bg-[#F1EFEA] flex items-center justify-center shrink-0 text-[#161514]">
                  <DaypartIcon className="size-3.5 stroke-[1.5]" />
                </div>
                <span className="text-xs font-medium text-[#6B6B6B] px-2 py-0.5 rounded-md bg-[#F1EFEA]">
                  {daypartConfig.badgeText}
                </span>
              </div>

              {/* Daypart Mode Switcher */}
              <div className="flex items-center p-0.5 rounded-lg border border-[#E8E5DF] bg-[#F1EFEA] shrink-0">
                {(["auto", "dawn", "forge", "night"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleModeChange(mode)}
                    className={cn(
                      "px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer",
                      daypartMode === mode
                        ? "bg-white text-[#161514] shadow-sm font-semibold"
                        : "text-[#6B6B6B] hover:text-[#161514]"
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
              <h1 className="font-heading font-semibold text-2xl sm:text-3xl tracking-tight leading-tight text-[#161514]">
                {isToday
                  ? (effectiveDaypart === "night"
                      ? `Evening Review, ${displayName}`
                      : effectiveDaypart === "forge"
                      ? `Afternoon Focus, ${displayName}`
                      : `Morning Focus, ${displayName}`)
                  : format(currentDateObj, "EEEE, MMMM d")}
              </h1>
              <p className="text-xs sm:text-sm font-normal leading-relaxed text-[#6B6B6B]">
                {isToday
                  ? (effectiveDaypart === "night"
                      ? "Daily review ready. Check remaining tasks, preserve your streak, and wrap up."
                      : `${totalHabitsCount} habits planned · 4.0h study goal · ${metrics.currencySymbol}${metrics.remainingSafeToSpend.toLocaleString()} safe budget`)
                  : `Viewing recorded logs for ${format(currentDateObj, "MMMM d, yyyy")}`}
              </p>
            </div>

            {/* Action Buttons Row - 1 Primary + Supporting Actions */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {/* Primary Focus Stopwatch Trigger */}
              {onToggleTimer && (
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onToggleTimer)}
                  className={cn(
                    "min-h-[40px] px-4 py-2 rounded-lg active:translate-y-px flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer",
                    isStudyingActive
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-[#161514] hover:bg-[#252321] text-white"
                  )}
                >
                  {isStudyingActive ? (
                    <Pause className="size-3.5 stroke-[1.5]" />
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
                  className="min-h-[40px] px-3 py-2 bg-white hover:bg-[#F5F3EF] border border-[#E8E5DF] rounded-lg active:translate-y-px flex items-center gap-1.5 text-xs font-medium text-[#161514] transition-colors cursor-pointer"
                >
                  <Wallet className="size-3.5 text-[#6B6B6B] stroke-[1.5]" />
                  <span>Log Expense</span>
                </button>
              )}

              {/* Quick Scratchpad Trigger */}
              {onOpenScratchpad && (
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onOpenScratchpad)}
                  className="min-h-[40px] px-3 py-2 bg-white hover:bg-[#F5F3EF] border border-[#E8E5DF] rounded-lg active:translate-y-px flex items-center gap-1.5 text-xs font-medium text-[#161514] transition-colors cursor-pointer"
                  title="Open Scratchpad (⌘J)"
                >
                  <FileText className="size-3.5 text-[#6B6B6B] stroke-[1.5]" />
                  <span>Scratchpad</span>
                </button>
              )}

              {/* Closeout / Evening Review Drawer Trigger */}
              {onOpenCloseoutDrawer && (
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onOpenCloseoutDrawer)}
                  className="min-h-[40px] px-3 py-2 bg-white hover:bg-[#F5F3EF] border border-[#E8E5DF] rounded-lg active:translate-y-px flex items-center gap-1.5 text-xs font-medium text-[#161514] transition-colors cursor-pointer"
                  title="Open Evening Closeout Drawer"
                >
                  <Moon className="size-3.5 text-[#6B6B6B] stroke-[1.5]" />
                  <span>{effectiveDaypart === "night" ? "Review & Close" : "Review Day"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column (lg:col-span-5): Clean Concentric HUD */}
          <div className="lg:col-span-5 rounded-xl border border-[#E8E5DF] p-4 bg-[#FBF9F5] text-[#161514] space-y-3">
            {/* Telemetry Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E5DF]">
              <span className="font-sans font-semibold text-xs text-[#161514] flex items-center gap-1.5">
                <Zap className="size-3.5 text-[#03D26F] stroke-[1.5]" />
                <span>Daily Momentum</span>
              </span>

              <div className="inline-flex items-center gap-1 bg-[#DCFAE5] text-[#04250e] font-mono font-medium text-xs px-2 py-0.5 rounded-md border border-[#03D26F]/30">
                <span className="tabular-nums font-semibold">{metrics.overallScore}%</span>
                <span>completed</span>
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
                  <circle cx="80" cy="80" r="66" fill="none" stroke="#03D26F" strokeWidth="8" opacity="0.15" />
                  <circle
                    cx="80"
                    cy="80"
                    r="66"
                    fill="none"
                    stroke="#03D26F"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={CIRC_HABITS}
                    strokeDashoffset={habitOffset}
                    style={{
                      transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                      willChange: "stroke-dashoffset",
                    }}
                  />

                  {/* Middle Ring: Study Focus (Obsidian #161514) */}
                  <circle cx="80" cy="80" r="50" fill="none" stroke="#161514" strokeWidth="8" opacity="0.1" />
                  <circle
                    cx="80"
                    cy="80"
                    r="50"
                    fill="none"
                    stroke="#161514"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={CIRC_STUDY}
                    strokeDashoffset={studyOffset}
                    style={{
                      transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                      willChange: "stroke-dashoffset",
                    }}
                  />

                  {/* Inner Ring: Budget Safe-to-Spend (Amber #D97706) */}
                  <circle cx="80" cy="80" r="34" fill="none" stroke="#D97706" strokeWidth="8" opacity="0.15" />
                  <circle
                    cx="80"
                    cy="80"
                    r="34"
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="8"
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
                  <span className="font-mono font-bold text-xl text-[#161514] leading-none tabular-nums">
                    {metrics.overallScore}%
                  </span>
                  <span className="font-sans text-[11px] text-[#6B6B6B] mt-0.5">
                    Score
                  </span>
                </div>
              </div>

              {/* 2. Three Interactive Metric Rows */}
              <div className="w-full flex-1 flex flex-col gap-1.5">
                {/* Habits */}
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onScrollToHabits)}
                  className="w-full bg-white hover:bg-[#F5F3EF] border border-[#E8E5DF] rounded-lg px-2.5 py-1.5 flex items-center justify-between text-left transition-colors cursor-pointer group active:translate-y-px"
                  title="Jump to Habits"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="size-2 rounded-full bg-[#03D26F] shrink-0" />
                    <span className="font-sans font-medium text-xs text-[#161514] truncate">
                      Habits
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono text-xs text-[#161514] tabular-nums">
                      {metrics.completedHabitsCount}/{metrics.totalHabitsCount} ({metrics.habitPercent}%)
                    </span>
                    <ChevronRight className="size-3 text-[#6B6B6B]/60 group-hover:text-[#161514] transition-colors" />
                  </div>
                </button>

                {/* Study */}
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onScrollToStudy)}
                  className="w-full bg-white hover:bg-[#F5F3EF] border border-[#E8E5DF] rounded-lg px-2.5 py-1.5 flex items-center justify-between text-left transition-colors cursor-pointer group active:translate-y-px"
                  title="Jump to Study"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="size-2 rounded-full bg-[#161514] shrink-0" />
                    <span className="font-sans font-medium text-xs text-[#161514] truncate">
                      Study
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono text-xs text-[#161514] tabular-nums">
                      {metrics.studyHoursFormatted}/{metrics.studyTargetHoursFormatted} ({metrics.studyPercent}%)
                    </span>
                    <ChevronRight className="size-3 text-[#6B6B6B]/60 group-hover:text-[#161514] transition-colors" />
                  </div>
                </button>

                {/* Safe Spend */}
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onScrollToMoney)}
                  className="w-full bg-white hover:bg-[#F5F3EF] border border-[#E8E5DF] rounded-lg px-2.5 py-1.5 flex items-center justify-between text-left transition-colors cursor-pointer group active:translate-y-px"
                  title="Jump to Safe Spend"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="size-2 rounded-full bg-[#D97706] shrink-0" />
                    <span className="font-sans font-medium text-xs text-[#161514] truncate">
                      Safe Left
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono text-xs text-[#161514] tabular-nums">
                      {metrics.currencySymbol}{metrics.remainingSafeToSpend.toLocaleString()}
                    </span>
                    <ChevronRight className="size-3 text-[#6B6B6B]/60 group-hover:text-[#161514] transition-colors" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
