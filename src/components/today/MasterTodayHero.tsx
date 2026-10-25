"use client";

import React from "react";
import { format } from "date-fns";
import {
  Flame,
  Shield,
  Sunrise,
  Zap,
  Moon,
  Clock,
  Wallet,
  Play,
  Pause,
  CheckSquare,
  ChevronRight,
  Sparkles,
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
  className?: string;
}

export function MasterTodayHero({
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

  const isNight = effectiveDaypart === "night";

  return (
    <header className={cn("space-y-3.5", className)} aria-label="Gladiator Command Deck">
      {/* 1. Date Navigation Horizon Bar & Ambient Telemetry */}
      <div className="bg-white border-2 border-[#161514] p-2 sm:p-2.5 rounded-2xl shadow-[3px_3px_0px_#161514] flex flex-wrap items-center justify-between gap-2 sm:gap-3">
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
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
          {/* Streak Flame */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg border-2 border-[#161514] bg-amber-300 shadow-[1.5px_1.5px_0px_#161514] shrink-0">
            <Flame className="size-3.5 text-orange-600 fill-orange-500 shrink-0" />
            <span className="font-mono font-black text-xs text-[#161514]">
              {streakDays}d
            </span>
          </div>

          {/* Shield Freeze */}
          {streakFreezeTokens > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg border-2 border-[#161514] bg-cyan-100 shadow-[1.5px_1.5px_0px_#161514] text-xs font-mono font-bold text-[#161514] shrink-0">
              <Shield className="size-3.5 text-cyan-700" />
              <span>{streakFreezeTokens}</span>
            </div>
          )}

          {/* Pixel Companion */}
          <VixPixelCompanion
            state={vixState}
            size={34}
            streakDays={streakDays}
          />
        </div>
      </div>

      {/* 2. Unified Master Cockpit Card: Context Hero + Tri-Rings HUD */}
      <div
        className={cn(
          "rounded-2xl border-2 border-[#161514] p-4 sm:p-5 shadow-[4px_4px_0px_0px_#161514] transition-all duration-300",
          effectiveDaypart === "dawn"
            ? "bg-[#FFFDF5] text-[#161514]"
            : effectiveDaypart === "forge"
            ? "bg-[#FAF5FF] text-[#161514]"
            : "bg-[#161514] text-white"
        )}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
          {/* Left Column (lg:col-span-6): Dayparting Greeting & Quick Action Chips */}
          <div className="lg:col-span-6 space-y-3.5 min-w-0">
            {/* Top Row: Icon + Daypart Badge + Live Clock Sync */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "size-8 rounded-lg border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] flex items-center justify-center shrink-0",
                    isNight ? "bg-[#CEF431] text-[#161514]" : daypartConfig.accentBg
                  )}
                >
                  <DaypartIcon className="size-4 stroke-[2.5]" />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#161514]",
                    isNight ? "bg-[#CEF431] text-[#161514]" : daypartConfig.badgeBg
                  )}
                >
                  {daypartConfig.badgeText}
                </span>
                {daypartMode === "auto" && (
                  <span
                    className={cn(
                      "text-[10px] font-mono font-semibold flex items-center gap-1",
                      isNight ? "text-white/60" : "text-[#161514]/60"
                    )}
                  >
                    <Clock className="size-3" />
                    <span className="hidden sm:inline">Live Clock</span>
                  </span>
                )}
              </div>

              {/* Time-Warp Scrubber */}
              <div
                className={cn(
                  "flex items-center p-0.5 rounded-lg border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0",
                  isNight ? "bg-white/10" : "bg-[#F1EFEA]"
                )}
              >
                <button
                  type="button"
                  onClick={() => handleModeChange("auto")}
                  className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    daypartMode === "auto"
                      ? "bg-white text-[#161514] border border-[#161514] shadow-[1px_1px_0px_0px_#161514]"
                      : isNight
                      ? "text-white/60 hover:text-white"
                      : "text-[#161514]/60 hover:text-[#161514]"
                  )}
                  title="Live auto mode"
                >
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("dawn")}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    daypartMode === "dawn"
                      ? "bg-[#CEF431] text-[#161514] border border-[#161514] shadow-[1px_1px_0px_0px_#161514]"
                      : isNight
                      ? "text-white/60 hover:text-white"
                      : "text-[#161514]/60 hover:text-[#161514]"
                  )}
                  title="Preview Dawn"
                >
                  Dawn
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("forge")}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    daypartMode === "forge"
                      ? "bg-[#C084FC] text-[#161514] border border-[#161514] shadow-[1px_1px_0px_0px_#161514]"
                      : isNight
                      ? "text-white/60 hover:text-white"
                      : "text-[#161514]/60 hover:text-[#161514]"
                  )}
                  title="Preview Forge"
                >
                  Forge
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("night")}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    daypartMode === "night"
                      ? "bg-[#161514] text-white border border-[#161514] shadow-[1px_1px_0px_0px_#161514]"
                      : isNight
                      ? "text-white/60 hover:text-white"
                      : "text-[#161514]/60 hover:text-[#161514]"
                  )}
                  title="Preview Night"
                >
                  Night
                </button>
              </div>
            </div>

            {/* Greeting Headline & Subtitle */}
            <div className="space-y-0.5">
              <h1
                className={cn(
                  "font-heading font-black text-lg sm:text-xl md:text-2xl tracking-tight leading-tight",
                  isNight ? "text-white" : "text-[#161514]"
                )}
              >
                {daypartConfig.greeting}
              </h1>
              <p
                className={cn(
                  "text-xs font-medium leading-relaxed",
                  isNight ? "text-white/75" : "text-[#161514]/75"
                )}
              >
                {daypartConfig.subtitle}
              </p>
            </div>

            {/* Integrated Quick Action Chips (Replaces Redundant QuickActionDock) */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {/* Quick Expense Chip */}
              {onOpenExpenseModal && (
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onOpenExpenseModal)}
                  className="min-h-[36px] px-2.5 py-1.5 bg-white hover:bg-emerald-50 active:scale-95 border-2 border-[#161514] rounded-lg shadow-[2px_2px_0px_#161514] flex items-center gap-1.5 font-heading font-black text-xs text-[#161514] transition-all cursor-pointer"
                >
                  <div className="size-4 rounded bg-[#03D26F] border border-[#161514] flex items-center justify-center shrink-0">
                    <Wallet className="size-2.5 text-[#161514] stroke-[2.5]" />
                  </div>
                  <span>+ Expense</span>
                </button>
              )}

              {/* Focus Stopwatch Trigger Chip */}
              {onToggleTimer && (
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onToggleTimer)}
                  className={cn(
                    "min-h-[36px] px-2.5 py-1.5 border-2 border-[#161514] rounded-lg shadow-[2px_2px_0px_#161514] active:scale-95 flex items-center gap-1.5 font-heading font-black text-xs text-[#161514] transition-all cursor-pointer",
                    isStudyingActive
                      ? "bg-amber-300 hover:bg-amber-400"
                      : "bg-[#CEF431] hover:bg-[#D8F74E]"
                  )}
                >
                  <div className="size-4 rounded bg-white border border-[#161514] flex items-center justify-center shrink-0">
                    {isStudyingActive ? (
                      <Pause className="size-2.5 text-[#161514] stroke-[2.5]" />
                    ) : (
                      <Play className="size-2.5 text-[#161514] fill-current" />
                    )}
                  </div>
                  <span>{isStudyingActive ? "Pause Sprint" : "Start Focus"}</span>
                </button>
              )}

              {/* Habit Quick Anchor */}
              {onScrollToHabits && (
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onScrollToHabits)}
                  className="min-h-[36px] px-2.5 py-1.5 bg-white hover:bg-violet-50 active:scale-95 border-2 border-[#161514] rounded-lg shadow-[2px_2px_0px_#161514] flex items-center gap-1.5 font-heading font-black text-xs text-[#161514] transition-all cursor-pointer"
                >
                  <div className="size-4 rounded bg-[#C084FC] border border-[#161514] flex items-center justify-center shrink-0">
                    <CheckSquare className="size-2.5 text-[#161514] stroke-[2.5]" />
                  </div>
                  <span>Habits</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column (lg:col-span-6): Concentric Tri-Rings Telemetry HUD */}
          <div
            className={cn(
              "lg:col-span-6 rounded-xl border-2 border-[#161514] p-3 sm:p-4 shadow-[2px_2px_0px_#161514]",
              isNight ? "bg-white/10 text-white" : "bg-white text-[#161514]"
            )}
          >
            {/* HUD Subheader */}
            <div
              className={cn(
                "flex items-center justify-between pb-2 mb-2.5 border-b",
                isNight ? "border-white/15" : "border-[#161514]/15"
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-1">
                  <span>⚔️</span>
                  <span>Conquest Telemetry</span>
                </span>
              </div>

              <div className="inline-flex items-center gap-1 bg-[#CEF431] text-[#161514] font-mono font-black text-[9px] sm:text-[10px] uppercase px-1.5 sm:px-2 py-0.5 rounded border border-[#161514] shadow-[1px_1px_0px_#161514]">
                <Zap className="size-2.5 fill-[#161514]" />
                <span>{metrics.overallScore}% CONQUERED</span>
              </div>
            </div>

            {/* Main Ring + Metric Rows */}
            <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4">
              {/* 1. Tri-Rings SVG */}
              <div className="relative size-28 sm:size-32 shrink-0 flex items-center justify-center">
                <svg
                  className="size-full -rotate-90 overflow-visible"
                  viewBox="0 0 160 160"
                  aria-label={`Daily Conquest: ${metrics.overallScore}% complete`}
                >
                  {/* Outer Ring: Habits (🟢 #03D26F) */}
                  <circle cx="80" cy="80" r="66" fill="none" stroke="#03D26F" strokeWidth="10" opacity="0.2" />
                  <circle
                    cx="80"
                    cy="80"
                    r="66"
                    fill="none"
                    stroke="#03D26F"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={CIRC_HABITS}
                    strokeDashoffset={habitOffset}
                    style={{
                      transition: "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      willChange: "stroke-dashoffset",
                    }}
                  />

                  {/* Middle Ring: Study Focus (🟣 #C084FC) */}
                  <circle cx="80" cy="80" r="50" fill="none" stroke="#C084FC" strokeWidth="10" opacity="0.25" />
                  <circle
                    cx="80"
                    cy="80"
                    r="50"
                    fill="none"
                    stroke="#C084FC"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={CIRC_STUDY}
                    strokeDashoffset={studyOffset}
                    style={{
                      transition: "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      willChange: "stroke-dashoffset",
                    }}
                  />

                  {/* Inner Ring: Budget Safe-to-Spend (🟡 #CEF431) */}
                  <circle cx="80" cy="80" r="34" fill="none" stroke="#CEF431" strokeWidth="10" opacity="0.3" />
                  <circle
                    cx="80"
                    cy="80"
                    r="34"
                    fill="none"
                    stroke="#CEF431"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={CIRC_BUDGET}
                    strokeDashoffset={budgetOffset}
                    style={{
                      transition: "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      willChange: "stroke-dashoffset",
                    }}
                  />
                </svg>

                {/* Score in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
                  <span
                    className={cn(
                      "font-heading font-black text-xl sm:text-2xl leading-none tracking-tight",
                      isNight ? "text-white" : "text-[#161514]"
                    )}
                  >
                    {metrics.overallScore}%
                  </span>
                  <span
                    className={cn(
                      "font-mono font-black text-[8px] uppercase tracking-widest mt-0.5",
                      isNight ? "text-white/60" : "text-[#161514]/60"
                    )}
                  >
                    Score
                  </span>
                </div>
              </div>

              {/* 2. Three Interactive Micro-Rows */}
              <div className="w-full flex-1 flex flex-col gap-1.5">
                {/* Habits Conquest */}
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onScrollToHabits)}
                  className={cn(
                    "w-full rounded-lg px-2.5 py-1.5 flex items-center justify-between text-left transition-all cursor-pointer group active:translate-x-0.5",
                    isNight
                      ? "bg-white/10 hover:bg-white/15 border border-white/20 text-white"
                      : "bg-[#FAF8F5] hover:bg-[#F3EFEA] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_#161514] text-[#161514]"
                  )}
                  title="Jump to Habits"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="size-2 rounded-full border border-[#161514] bg-[#03D26F] shrink-0" />
                    <span className="font-heading font-black text-[11px] uppercase tracking-wide truncate">
                      Habits
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono font-black text-[11px] text-[#03D26F]">
                      {metrics.completedHabitsCount}/{metrics.totalHabitsCount} ({metrics.habitPercent}%)
                    </span>
                    <ChevronRight className="size-3 text-[#161514]/40 group-hover:text-[#161514] dark:text-white/40 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>

                {/* Study Sprint */}
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onScrollToStudy)}
                  className={cn(
                    "w-full rounded-lg px-2.5 py-1.5 flex items-center justify-between text-left transition-all cursor-pointer group active:translate-x-0.5",
                    isNight
                      ? "bg-white/10 hover:bg-white/15 border border-white/20 text-white"
                      : "bg-[#FAF8F5] hover:bg-[#F3EFEA] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_#161514] text-[#161514]"
                  )}
                  title="Jump to Study"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="size-2 rounded-full border border-[#161514] bg-[#C084FC] shrink-0" />
                    <span className="font-heading font-black text-[11px] uppercase tracking-wide truncate">
                      Study
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono font-black text-[11px] text-[#C084FC]">
                      {metrics.studyHoursFormatted}/{metrics.studyTargetHoursFormatted} ({metrics.studyPercent}%)
                    </span>
                    <ChevronRight className="size-3 text-[#161514]/40 group-hover:text-[#161514] dark:text-white/40 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>

                {/* Safe Spend */}
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onScrollToMoney)}
                  className={cn(
                    "w-full rounded-lg px-2.5 py-1.5 flex items-center justify-between text-left transition-all cursor-pointer group active:translate-x-0.5",
                    isNight
                      ? "bg-white/10 hover:bg-white/15 border border-white/20 text-white"
                      : "bg-[#FAF8F5] hover:bg-[#F3EFEA] border-2 border-[#161514] shadow-[1.5px_1.5px_0px_#161514] text-[#161514]"
                  )}
                  title="Jump to Safe Spend"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="size-2 rounded-full border border-[#161514] bg-[#CEF431] shrink-0" />
                    <span className="font-heading font-black text-[11px] uppercase tracking-wide truncate">
                      Safe Left
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono font-black text-[11px] text-amber-500">
                      {metrics.currencySymbol}{metrics.remainingSafeToSpend.toLocaleString()}
                    </span>
                    <ChevronRight className="size-3 text-[#161514]/40 group-hover:text-[#161514] dark:text-white/40 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
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
