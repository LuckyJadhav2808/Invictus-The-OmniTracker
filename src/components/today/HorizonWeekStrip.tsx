"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";
import {
  computeHorizonDays,
  type HorizonDayItem,
} from "@/components/today/useTodayCockpitViewModel";

interface HorizonWeekStripProps {
  currentDateObj: Date;
  selectedDate: string;
  isToday: boolean;
  onSelectDate: (dateStr: string) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onJumpToToday: () => void;
  completedDatesSet?: Set<string>;
  className?: string;
}

export function HorizonWeekStrip({
  currentDateObj,
  selectedDate,
  isToday,
  onSelectDate,
  onPrevDay,
  onNextDay,
  onJumpToToday,
  completedDatesSet,
  className,
}: HorizonWeekStripProps) {
  const horizonDays = useMemo(() => {
    return computeHorizonDays(currentDateObj, selectedDate, completedDatesSet);
  }, [currentDateObj, selectedDate, completedDatesSet]);

  const handleSelect = (d: HorizonDayItem) => {
    if (d.dateStr === selectedDate) return;
    soundFX.playPop();
    soundFX.vibrate(15);
    onSelectDate(d.dateStr);
  };

  const handlePrev = () => {
    soundFX.playPop();
    onPrevDay();
  };

  const handleNext = () => {
    soundFX.playPop();
    onNextDay();
  };

  const handleToday = () => {
    soundFX.playPop();
    soundFX.vibrate(20);
    onJumpToToday();
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 sm:gap-1.5 select-none overflow-x-auto no-scrollbar py-0.5",
        className
      )}
      role="region"
      aria-label="7-Day Horizon Date Selector"
    >
      {/* 1. Prev Day Nudge Button */}
      <button
        type="button"
        onClick={handlePrev}
        className="size-7 sm:size-8 rounded-lg border-2 border-[#161514] bg-white hover:bg-[#F1EFEA] active:scale-95 flex items-center justify-center shadow-[1.5px_1.5px_0px_#161514] transition-all cursor-pointer shrink-0"
        aria-label="Previous Day"
      >
        <ChevronLeft className="size-3.5 sm:size-4 stroke-[2.5]" />
      </button>

      {/* 2. 7-Day Magnetic Horizon Rail */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
        {horizonDays.map((day) => {
          const isSelected = day.isSelected;
          const isCurrentToday = day.isToday;

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => handleSelect(day)}
              className={cn(
                "relative flex flex-col items-center justify-center min-w-[38px] sm:min-w-[46px] h-11 sm:h-12 px-1 sm:px-2 rounded-xl transition-all cursor-pointer",
                isSelected
                  ? "bg-[#161514] text-white border-2 border-[#161514] shadow-[2px_2px_0px_0px_#161514] scale-[1.02]"
                  : "bg-white hover:bg-[#F8F6F0] text-[#161514] border-2 border-[#161514]/30 hover:border-[#161514] active:scale-95"
              )}
              aria-label={`Select ${day.dayName}, ${day.dateStr}`}
              aria-current={isSelected ? "date" : undefined}
            >
              {/* Day Name (e.g. Mon, Tue) */}
              <span
                className={cn(
                  "font-mono font-bold text-[9px] sm:text-[10px] uppercase tracking-wider",
                  isSelected
                    ? "text-[#CEF431]"
                    : isCurrentToday
                    ? "text-emerald-700 font-black"
                    : "text-[#161514]/70"
                )}
              >
                {day.dayName}
              </span>

              {/* Day Number (e.g. 24, 25) */}
              <span
                className={cn(
                  "font-heading font-black text-xs sm:text-sm leading-none mt-0.5",
                  isSelected ? "text-white" : "text-[#161514]"
                )}
              >
                {day.dayNumber}
              </span>

              {/* Telemetry Status Pip */}
              <span className="mt-1 flex items-center justify-center">
                {day.isCompleted ? (
                  <span className="size-1.5 rounded-full bg-[#03D26F] ring-1 ring-[#161514]" />
                ) : isCurrentToday ? (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      isSelected ? "bg-[#CEF431]" : "bg-emerald-500"
                    )}
                  />
                ) : (
                  <span
                    className={cn(
                      "size-1 rounded-full",
                      isSelected ? "bg-white/40" : "bg-[#161514]/20"
                    )}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Next Day Nudge Button */}
      <button
        type="button"
        onClick={handleNext}
        className="size-7 sm:size-8 rounded-lg border-2 border-[#161514] bg-white hover:bg-[#F1EFEA] active:scale-95 flex items-center justify-center shadow-[1.5px_1.5px_0px_#161514] transition-all cursor-pointer shrink-0"
        aria-label="Next Day"
      >
        <ChevronRight className="size-3.5 sm:size-4 stroke-[2.5]" />
      </button>

      {/* 4. Quick "Today" Snap Pill (Visible when looking at past/future dates) */}
      {!isToday && (
        <button
          type="button"
          onClick={handleToday}
          className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg border-2 border-[#161514] bg-[#CEF431] hover:bg-[#D8F74E] text-[10px] sm:text-xs font-heading font-black text-[#161514] shadow-[1.5px_1.5px_0px_#161514] active:scale-95 transition-all cursor-pointer shrink-0 whitespace-nowrap flex items-center gap-1"
        >
          <Sparkles className="size-3 fill-[#161514]" />
          <span>Today</span>
        </button>
      )}
    </div>
  );
}
