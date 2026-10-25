'use client';

import React from 'react';
import { format } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Flame,
  Shield,
  Sunrise,
  Zap,
  Moon,
  Sparkles,
  Clock,
} from 'lucide-react';
import { VixPixelCompanion, VixPixelState } from '@/components/mascot/VixPixelCompanion';
import {
  DaypartMode,
  EffectiveDaypart,
  DAYPART_CONFIGS,
} from '@/components/today/useTodayCockpitViewModel';
import { soundFX } from '@/components/shared/SoundFX';
import { cn } from '@/lib/utils';

interface TodayGreetingHeroProps {
  currentDateObj: Date;
  isToday: boolean;
  onPrevDay: () => void;
  onNextDay: () => void;
  onJumpToToday: () => void;
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
}

export function TodayGreetingHero({
  currentDateObj,
  isToday,
  onPrevDay,
  onNextDay,
  onJumpToToday,
  streakDays,
  streakFreezeTokens,
  completedHabitsCount,
  totalHabitsCount,
  studyMinutesToday,
  isStudyingActive,
  allHabitsConquered,
  daypartMode = 'auto',
  effectiveDaypart = 'dawn',
  onSelectDaypartMode,
}: TodayGreetingHeroProps) {
  // Determine pixel mascot state based on live telemetry
  const getVixState = (): VixPixelState => {
    if (allHabitsConquered && totalHabitsCount > 0) return 'celebrate';
    if (isStudyingActive) return 'focus';
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 5) return 'sleep';
    if (streakDays >= 3) return 'fire';
    return 'idle';
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

  return (
    <header className="space-y-3">
      {/* 1. Date Navigation & Telemetry Bar */}
      <div className="bg-white border-2 border-[#161514] p-3 sm:p-3.5 rounded-2xl shadow-[3px_3px_0px_#161514] flex items-center justify-between gap-3">
        {/* Date Navigation Block */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onPrevDay}
            className="size-8 sm:size-9 rounded-lg border-2 border-[#161514] bg-white hover:bg-[#F1EFEA] active:scale-95 flex items-center justify-center shadow-[1.5px_1.5px_0px_#161514] transition-all cursor-pointer"
            aria-label="Previous Day"
          >
            <ChevronLeft className="size-4 stroke-[2.5]" />
          </button>

          <div className="px-2.5 sm:px-3 py-1.5 rounded-lg border-2 border-[#161514] bg-[#F1EFEA] flex items-center gap-2 shadow-[1px_1px_0px_#161514]">
            <Calendar className="size-4 stroke-[2.2] text-[#161514]" />
            <span className="font-heading font-black text-xs sm:text-sm text-[#161514] whitespace-nowrap">
              {format(currentDateObj, 'EEE, MMM d')}
            </span>
          </div>

          <button
            type="button"
            onClick={onNextDay}
            className="size-8 sm:size-9 rounded-lg border-2 border-[#161514] bg-white hover:bg-[#F1EFEA] active:scale-95 flex items-center justify-center shadow-[1.5px_1.5px_0px_#161514] transition-all cursor-pointer"
            aria-label="Next Day"
          >
            <ChevronRight className="size-4 stroke-[2.5]" />
          </button>

          {!isToday && (
            <button
              type="button"
              onClick={onJumpToToday}
              className="px-2.5 py-1 rounded-lg border-2 border-[#161514] bg-[#CEF431] hover:bg-[#D8F74E] text-xs font-heading font-black text-[#161514] shadow-[1.5px_1.5px_0px_#161514] active:scale-95 transition-all cursor-pointer"
            >
              Today
            </button>
          )}
        </div>

        {/* Telemetry Chips & Compact Pixel HUD Companion */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Streak Flame Badge */}
          <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border-2 border-[#161514] bg-amber-300 shadow-[1.5px_1.5px_0px_#161514]">
            <Flame className="size-4 text-orange-600 fill-orange-500" />
            <span className="font-mono font-black text-xs text-[#161514]">
              {streakDays}d
            </span>
          </div>

          {/* Streak Freeze Badge */}
          {streakFreezeTokens > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg border-2 border-[#161514] bg-cyan-100 shadow-[1.5px_1.5px_0px_#161514] text-xs font-mono font-bold text-[#161514]">
              <Shield className="size-3.5 text-cyan-700" />
              <span>{streakFreezeTokens}</span>
            </div>
          )}

          {/* 44x44 Retro Pixel Art Gladiator Bot Companion */}
          <VixPixelCompanion
            state={vixState}
            size={40}
            streakDays={streakDays}
          />
        </div>
      </div>

      {/* 2. 🌅 Time-Warp Dayparting Hero Banner */}
      <div
        className={cn(
          "rounded-2xl border-2 border-[#161514] p-4 sm:p-5 shadow-[4px_4px_0px_0px_#161514] transition-all duration-300",
          effectiveDaypart === "dawn"
            ? "bg-[#FFFDF5]"
            : effectiveDaypart === "forge"
            ? "bg-[#FAF5FF]"
            : "bg-[#161514] text-white"
        )}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Greeting & Time Context */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "p-2.5 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] shrink-0",
                daypartConfig.accentBg,
                effectiveDaypart === "night" ? "text-[#161514] bg-[#CEF431]" : "text-[#161514]"
              )}
            >
              <DaypartIcon className="size-5 stroke-[2.5]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#161514]",
                    effectiveDaypart === "night"
                      ? "bg-[#CEF431] text-[#161514]"
                      : daypartConfig.badgeBg
                  )}
                >
                  {daypartConfig.badgeText}
                </span>
                {daypartMode === "auto" && (
                  <span className="text-[10px] font-mono text-[#161514]/60 dark:text-white/60 font-semibold flex items-center gap-1">
                    <Clock className="size-3" />
                    <span>Live Clock Synced</span>
                  </span>
                )}
              </div>

              <h2
                className={cn(
                  "font-heading font-black text-lg sm:text-xl tracking-tight mt-1 truncate",
                  effectiveDaypart === "night" ? "text-white" : "text-[#161514]"
                )}
              >
                {daypartConfig.greeting}
              </h2>

              <p
                className={cn(
                  "text-xs font-semibold mt-0.5 leading-snug",
                  effectiveDaypart === "night" ? "text-white/70" : "text-[#161514]/70"
                )}
              >
                {daypartConfig.subtitle}
              </p>
            </div>
          </div>

          {/* Time-Warp Manual Scrubber Pill */}
          <div className="flex items-center p-1 bg-[#F1EFEA] dark:bg-white/10 rounded-xl border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] shrink-0 self-start md:self-center">
            <button
              type="button"
              onClick={() => handleModeChange("auto")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                daypartMode === "auto"
                  ? "bg-white text-[#161514] border border-[#161514] shadow-[1px_1px_0px_0px_#161514]"
                  : "text-[#161514]/60 hover:text-[#161514]"
              )}
              title="Sync with current hour"
            >
              Auto ⏳
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("dawn")}
              className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer",
                daypartMode === "dawn"
                  ? "bg-[#CEF431] text-[#161514] border border-[#161514] shadow-[1px_1px_0px_0px_#161514]"
                  : "text-[#161514]/60 hover:text-[#161514]"
              )}
              title="Preview Dawn Patrol (Morning)"
            >
              <Sunrise className="size-3 stroke-[2.5]" />
              <span className="hidden sm:inline">Dawn</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("forge")}
              className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer",
                daypartMode === "forge"
                  ? "bg-[#C084FC] text-[#161514] border border-[#161514] shadow-[1px_1px_0px_0px_#161514]"
                  : "text-[#161514]/60 hover:text-[#161514]"
              )}
              title="Preview The Forge (Afternoon Focus)"
            >
              <Zap className="size-3 stroke-[2.5]" />
              <span className="hidden sm:inline">Forge</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("night")}
              className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer",
                daypartMode === "night"
                  ? "bg-[#161514] text-white border border-[#161514] shadow-[1px_1px_0px_0px_#161514]"
                  : "text-[#161514]/60 hover:text-[#161514]"
              )}
              title="Preview Night Fortress (Evening Reflection)"
            >
              <Moon className="size-3 stroke-[2.5]" />
              <span className="hidden sm:inline">Night</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
