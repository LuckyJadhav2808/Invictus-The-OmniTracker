'use client';

import React from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Flame, Shield } from 'lucide-react';
import { VixPixelCompanion, VixPixelState } from '@/components/mascot/VixPixelCompanion';

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

  return (
    <header className="bg-white border-2 border-[#161514] p-3 sm:p-4 rounded-xl shadow-[3px_3px_0px_#161514] flex items-center justify-between gap-3">
      {/* Date Navigation Block */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
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
          onClick={onNextDay}
          className="size-8 sm:size-9 rounded-lg border-2 border-[#161514] bg-white hover:bg-[#F1EFEA] active:scale-95 flex items-center justify-center shadow-[1.5px_1.5px_0px_#161514] transition-all cursor-pointer"
          aria-label="Next Day"
        >
          <ChevronRight className="size-4 stroke-[2.5]" />
        </button>

        {!isToday && (
          <button
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
          size={42}
          streakDays={streakDays}
        />
      </div>
    </header>
  );
}
