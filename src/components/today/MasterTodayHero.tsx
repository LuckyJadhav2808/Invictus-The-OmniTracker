"use client";

import React from "react";
import { format } from "date-fns";
import {
  Flame,
  Shield,
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

  const displayName = userName?.trim() ? userName.split(" ")[0] : "Friend";

  return (
    <header className={cn("space-y-4", className)} aria-label="Command Deck">
      {/* 1. Header Greeting & Date Navigation Horizon Bar */}
      <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] p-3 sm:p-4 rounded-3xl shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] space-y-3 transition-colors">
        {/* Top Greeting Row (Benchmark from reference image) */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-heading font-black text-xl sm:text-2xl text-foreground tracking-tight leading-tight">
              Hey, {displayName} 👋
            </h1>
            <p className="text-xs font-mono font-bold text-muted-foreground">
              {isToday ? "Let's make progress today!" : format(currentDateObj, "EEEE, MMMM d")}
            </p>
          </div>

          {/* Streak Flame & Shield */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border-2 border-[#161514] dark:border-[#38332E] bg-[#FFFBEB] dark:bg-[#261E14] text-[#92400E] dark:text-amber-300 shadow-2xs">
              <Flame className="size-3.5 text-orange-500 fill-orange-500 shrink-0" />
              <span className="font-mono font-bold text-xs tabular-nums">{streakDays}d streak</span>
            </div>
            {streakFreezeTokens > 0 && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl border-2 border-[#161514] dark:border-[#38332E] bg-secondary text-xs font-mono font-bold text-foreground shadow-2xs">
                <Shield className="size-3.5 text-muted-foreground" />
                <span>{streakFreezeTokens} shield</span>
              </div>
            )}
          </div>
        </div>

        {/* 7-Day Horizon Scrubber */}
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
      </div>

      {/* 2. Streamlined Daily AI Coach Banner (Benchmark matching reference image) */}
      <div className="bg-[#FAF8F5] dark:bg-[#1C1A18] border-2 border-[#161514] dark:border-[#38332E] rounded-3xl p-4 sm:p-5 shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] flex flex-col sm:flex-row items-center gap-4 transition-colors">
        {/* Free-standing 3D Strobi Companion */}
        <div className="shrink-0 flex items-center justify-center">
          <StrobiCompanion
            state={strobiState}
            gear="tasks"
            size={56}
            streakDays={streakDays}
          />
        </div>

        {/* AI Coach Directive Speech Bubble */}
        <div className="flex-1 w-full min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#03D26F] animate-pulse" />
              <span className="text-2xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Daily AI Coach
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {onOpenScratchpad && (
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onOpenScratchpad)}
                  className="px-2.5 py-1 rounded-lg border-2 border-[#161514] dark:border-[#38332E] bg-secondary text-secondary-foreground text-2xs font-mono font-bold shadow-2xs hover:bg-[#CEF431] dark:hover:bg-[#CEF431] dark:hover:text-[#161514] transition-colors cursor-pointer"
                  title="Open Scratchpad (⌘J)"
                >
                  <FileText className="size-3 inline-block mr-1 stroke-[2]" />
                  Notes
                </button>
              )}
              {onOpenCloseoutDrawer && (
                <button
                  type="button"
                  onClick={() => handleInteractiveClick(onOpenCloseoutDrawer)}
                  className="px-2.5 py-1 rounded-lg border-2 border-[#161514] dark:border-[#38332E] bg-secondary text-secondary-foreground text-2xs font-mono font-bold shadow-2xs hover:bg-[#CEF431] dark:hover:bg-[#CEF431] dark:hover:text-[#161514] transition-colors cursor-pointer"
                  title="Evening Review"
                >
                  <Moon className="size-3 inline-block mr-1 stroke-[2]" />
                  Review
                </button>
              )}
            </div>
          </div>

          <p className="font-heading font-black text-sm sm:text-base text-foreground leading-snug">
            {strobiState === "celebrate"
              ? "All daily tasks and habits completed! Outstanding focus today."
              : effectiveDaypart === "night"
              ? "Evening review ready: wrap up open tasks and preserve your streak."
              : effectiveDaypart === "forge"
              ? "Midday push — keep the rhythm going through your routines."
              : "Discipline over motivation. Check off your morning priorities to ignite momentum!"}
          </p>
        </div>
      </div>
    </header>
  );
});
