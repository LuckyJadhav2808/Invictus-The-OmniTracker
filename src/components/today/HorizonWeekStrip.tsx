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
        className="size-7 sm:size-8 rounded-lg border border-[#E8E5DF] bg-white hover:bg-[#F5F3EF] flex items-center justify-center transition-colors cursor-pointer shrink-0 active:translate-y-px text-[#161514]"
        aria-label="Previous Day"
      >
        <ChevronLeft className="size-3.5 sm:size-4 stroke-[1.5]" />
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
                "relative flex flex-col items-center justify-center min-w-[38px] sm:min-w-[44px] h-11 sm:h-12 px-1 sm:px-2 rounded-lg transition-colors cursor-pointer",
                isSelected
                  ? "bg-[#161514] text-white border border-[#161514]"
                  : "bg-white hover:bg-[#F5F3EF] text-[#161514] border border-[#E8E5DF]"
              )}
              aria-label={`Select ${day.dayName}, ${day.dateStr}`}
              aria-current={isSelected ? "date" : undefined}
            >
              {/* Day Name (e.g. Mon, Tue) */}
              <span
                className={cn(
                  "font-mono text-[10px] font-medium leading-tight",
                  isSelected
                    ? "text-[#03D26F]"
                    : isCurrentToday
                    ? "text-[#047857] font-semibold"
                    : "text-[#6B6B6B]"
                )}
              >
                {day.dayName}
              </span>

              {/* Day Number (e.g. 24, 25) */}
              <span
                className={cn(
                  "font-mono font-semibold text-xs sm:text-sm leading-none mt-0.5 tabular-nums",
                  isSelected ? "text-white" : "text-[#161514]"
                )}
              >
                {day.dayNumber}
              </span>

              {/* Telemetry Status Pip */}
              <span className="mt-1 flex items-center justify-center">
                {day.isCompleted ? (
                  <span className="size-1.5 rounded-full bg-[#03D26F]" />
                ) : isCurrentToday ? (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      isSelected ? "bg-[#03D26F]" : "bg-[#047857]"
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
        className="size-7 sm:size-8 rounded-lg border border-[#E8E5DF] bg-white hover:bg-[#F5F3EF] flex items-center justify-center transition-colors cursor-pointer shrink-0 active:translate-y-px text-[#161514]"
        aria-label="Next Day"
      >
        <ChevronRight className="size-3.5 sm:size-4 stroke-[1.5]" />
      </button>

      {/* 4. Quick "Today" Snap Pill (Visible when looking at past/future dates) */}
      {!isToday && (
        <button
          type="button"
          onClick={handleToday}
          className="h-7 sm:h-8 px-2.5 rounded-lg bg-[#161514] hover:bg-[#252321] text-xs font-medium text-white transition-colors cursor-pointer shrink-0 whitespace-nowrap flex items-center gap-1 active:translate-y-px"
        >
          <span>Today</span>
        </button>
      )}
    </div>
  );
}
