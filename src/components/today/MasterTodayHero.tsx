"use client";

import React from "react";
import { format } from "date-fns";
import {
  Flame,
  Shield,
  Clock,
  Wallet,
  Play,
  Pause,
  CheckSquare,
  ChevronRight,
  Zap,
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

  const displayName = userName?.trim() ? userName.split(" ")[0] : "Gladiator";

  return (
    <header className={cn("space-y-4", className)} aria-label="Gladiator Coliseum Command Deck">
      {/* 1. Date Navigation Horizon Bar & Ambient Telemetry Crown */}
      <div className="bg-white border-2 border-[#161514] p-2.5 sm:p-3 rounded-2xl shadow-[3px_3px_0px_#161514] flex flex-wrap items-center justify-between gap-2 sm:gap-3">
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
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-[#161514] bg-amber-300 shadow-[1.5px_1.5px_0px_#161514] shrink-0">
            <Flame className="size-4 text-orange-600 fill-orange-500 shrink-0" />
            <span className="font-mono font-black text-xs text-[#161514]">
              {streakDays}d Streak
            </span>
          </div>

          {/* Shield Freeze */}
          {streakFreezeTokens > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border-2 border-[#161514] bg-cyan-100 shadow-[1.5px_1.5px_0px_#161514] text-xs font-mono font-bold text-[#161514] shrink-0">
              <Shield className="size-3.5 text-cyan-700" />
              <span>{streakFreezeTokens} Shield</span>
            </div>
          )}

          {/* Pixel Companion */}
          <VixPixelCompanion
            state={vixState}
            size={36}
            streakDays={streakDays}
          />
        </div>
      </div>

      {/* 2. Unified Master Cockpit Card: Context Hero + Tri-Rings HUD (Coliseum Layout) */}
      <div
        className={cn(
          "rounded-2xl border-2 border-[#161514] p-5 sm:p-6 shadow-[4px_4px_0px_0px_#161514] transition-all duration-300 text-[#161514]",
          effectiveDaypart === "dawn"
            ? "bg-[#FFFDF5]"
            : effectiveDaypart === "forge"
            ? "bg-[#FAF5FF]"
            : "bg-[#F8FAFC]"
        )}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column (lg:col-span-7): Grand Typography Greeting & Action Deck */}
          <div className="lg:col-span-7 space-y-4 min-w-0">
            {/* Context Badge Row */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "size-8 rounded-lg border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] flex items-center justify-center shrink-0",
                    daypartConfig.accentBg
                  )}
                >
                  <DaypartIcon className="size-4 stroke-[2.5]" />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-[#161514]",
                    daypartConfig.badgeBg
                  )}
                >
                  {daypartConfig.badgeText}
                </span>
                {daypartMode === "auto" && (
                  <span className="text-[10px] font-mono font-semibold text-[#161514]/65 flex items-center gap-1">
                    <Clock className="size-3" />
                    <span>Live Clock Synced</span>
                  </span>
                )}
              </div>

              {/* Time-Warp Scrubber Pill */}
              <div className="flex items-center p-0.5 rounded-lg border-2 border-[#161514] bg-[#F1EFEA] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
                <button
                  type="button"
                  onClick={() => handleModeChange("auto")}
                  className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    daypartMode === "auto"
                      ? "bg-white text-[#161514] border border-[#161514] shadow-[1px_1px_0px_0px_#161514]"
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
                      ? "bg-[#38BDF8] text-[#161514] border border-[#161514] shadow-[1px_1px_0px_0px_#161514]"
                      : "text-[#161514]/60 hover:text-[#161514]"
                  )}
                  title="Preview Night"
                >
                  Night
                </button>
              </div>
            </div>

            {/* Grand Morning Greeting Headline */}
            <div className="space-y-1">
              <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight leading-tight text-[#161514]">
                Rise & Conquer, {displayName}.
              </h1>
              <p className="text-xs sm:text-sm font-semibold leading-relaxed text-[#161514]/75">
                {totalHabitsCount} habits loaded on deck. 4.0h study goal primed for victory.
              </p>
            </div>

            {/* Action Buttons Row (Apple Fitness & Linear Benchmark) */}
            <div className="flex items-center gap-2.5 flex-wrap pt-1">
              {/* Focus Stopwatch Trigger */}
              {onToggleTimer && (
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onToggleTimer)}
                  className={cn(
                    "min-h-[40px] px-3.5 py-2 border-2 border-[#161514] rounded-xl shadow-[2.5px_2.5px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2 font-heading font-black text-xs text-[#161514] transition-all cursor-pointer",
                    isStudyingActive
                      ? "bg-amber-300 hover:bg-amber-400"
                      : "bg-[#CEF431] hover:bg-[#D8F74E]"
                  )}
                >
                  <div className="size-5 rounded-md bg-white border border-[#161514] flex items-center justify-center shrink-0">
                    {isStudyingActive ? (
                      <Pause className="size-3 text-[#161514] stroke-[2.5]" />
                    ) : (
                      <Play className="size-3 text-[#161514] fill-current" />
                    )}
                  </div>
                  <span>{isStudyingActive ? "Pause Sprint" : "⚡ Start Focus Sprint"}</span>
                </button>
              )}

              {/* Quick Expense Chip */}
              {onOpenExpenseModal && (
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onOpenExpenseModal)}
                  className="min-h-[40px] px-3 py-2 bg-white hover:bg-emerald-50 active:translate-x-0.5 active:translate-y-0.5 border-2 border-[#161514] rounded-xl shadow-[2.5px_2.5px_0px_#161514] flex items-center gap-1.5 font-heading font-black text-xs text-[#161514] transition-all cursor-pointer"
                >
                  <div className="size-5 rounded-md bg-[#03D26F] border border-[#161514] flex items-center justify-center shrink-0">
                    <Wallet className="size-3 text-[#161514] stroke-[2.5]" />
                  </div>
                  <span>+ ₹ Log Expense</span>
                </button>
              )}

              {/* Habit Quick Anchor */}
              {onScrollToHabits && (
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onScrollToHabits)}
                  className="min-h-[40px] px-3 py-2 bg-white hover:bg-violet-50 active:translate-x-0.5 active:translate-y-0.5 border-2 border-[#161514] rounded-xl shadow-[2.5px_2.5px_0px_#161514] flex items-center gap-1.5 font-heading font-black text-xs text-[#161514] transition-all cursor-pointer"
                >
                  <div className="size-5 rounded-md bg-[#C084FC] border border-[#161514] flex items-center justify-center shrink-0">
                    <CheckSquare className="size-3 text-[#161514] stroke-[2.5]" />
                  </div>
                  <span>✓ Habits</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column (lg:col-span-5): Concentric Tri-Rings Telemetry Deck */}
          <div className="lg:col-span-5 rounded-xl border-2 border-[#161514] p-4 bg-white text-[#161514] shadow-[3px_3px_0px_#161514] space-y-3">
            {/* Telemetry Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#161514]/15">
              <span className="font-heading font-black text-xs uppercase tracking-wider text-[#161514] flex items-center gap-1">
                <span>⚔️</span>
                <span>Conquest Telemetry</span>
              </span>

              <div className="inline-flex items-center gap-1 bg-[#CEF431] text-[#161514] font-mono font-black text-[10px] uppercase px-2 py-0.5 rounded-lg border border-[#161514] shadow-[1px_1px_0px_#161514]">
                <Zap className="size-3 fill-[#161514]" />
                <span>{metrics.overallScore}% CONQUERED</span>
              </div>
            </div>

            {/* Tri-Rings SVG + Interactive Breakdown Rows */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* 1. Tri-Rings Concentric SVG */}
              <div className="relative size-32 shrink-0 flex items-center justify-center">
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
                  <span className="font-heading font-black text-2xl text-[#161514] leading-none tracking-tight">
                    {metrics.overallScore}%
                  </span>
                  <span className="font-mono font-black text-[8px] uppercase tracking-widest text-[#161514]/60 mt-0.5">
                    Score
                  </span>
                </div>
              </div>

              {/* 2. Three Interactive Metric Rows */}
              <div className="w-full flex-1 flex flex-col gap-1.5">
                {/* Habits Conquest */}
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onScrollToHabits)}
                  className="w-full bg-[#FAF8F5] hover:bg-[#F3EFEA] border-2 border-[#161514] rounded-lg px-2.5 py-1.5 shadow-[1.5px_1.5px_0px_#161514] flex items-center justify-between text-left transition-all cursor-pointer group active:translate-x-0.5"
                  title="Jump to Habits"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="size-2.5 rounded-full border border-[#161514] bg-[#03D26F] shrink-0" />
                    <span className="font-heading font-black text-[11px] uppercase tracking-wide truncate">
                      Habits
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono font-black text-[11px] text-[#047857]">
                      {metrics.completedHabitsCount}/{metrics.totalHabitsCount} ({metrics.habitPercent}%)
                    </span>
                    <ChevronRight className="size-3 text-[#161514]/40 group-hover:text-[#161514] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>

                {/* Study Sprint */}
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onScrollToStudy)}
                  className="w-full bg-[#FAF8F5] hover:bg-[#F3EFEA] border-2 border-[#161514] rounded-lg px-2.5 py-1.5 shadow-[1.5px_1.5px_0px_#161514] flex items-center justify-between text-left transition-all cursor-pointer group active:translate-x-0.5"
                  title="Jump to Study"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="size-2.5 rounded-full border border-[#161514] bg-[#C084FC] shrink-0" />
                    <span className="font-heading font-black text-[11px] uppercase tracking-wide truncate">
                      Study
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono font-black text-[11px] text-[#7E22CE]">
                      {metrics.studyHoursFormatted}/{metrics.studyTargetHoursFormatted} ({metrics.studyPercent}%)
                    </span>
                    <ChevronRight className="size-3 text-[#161514]/40 group-hover:text-[#161514] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>

                {/* Safe Spend */}
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onScrollToMoney)}
                  className="w-full bg-[#FAF8F5] hover:bg-[#F3EFEA] border-2 border-[#161514] rounded-lg px-2.5 py-1.5 shadow-[1.5px_1.5px_0px_#161514] flex items-center justify-between text-left transition-all cursor-pointer group active:translate-x-0.5"
                  title="Jump to Safe Spend"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="size-2.5 rounded-full border border-[#161514] bg-[#CEF431] shrink-0" />
                    <span className="font-heading font-black text-[11px] uppercase tracking-wide truncate">
                      Safe Left
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono font-black text-[11px] text-amber-700">
                      {metrics.currencySymbol}{metrics.remainingSafeToSpend.toLocaleString()}
                    </span>
                    <ChevronRight className="size-3 text-[#161514]/40 group-hover:text-[#161514] group-hover:translate-x-0.5 transition-all" />
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
