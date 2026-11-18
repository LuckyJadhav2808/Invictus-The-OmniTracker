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
        className="size-8 sm:size-9 rounded-xl border-2 border-border hover:border-[#161514] dark:hover:border-white/40 bg-secondary hover:bg-muted flex items-center justify-center transition-all cursor-pointer shrink-0 active:translate-x-0.5 active:translate-y-0.5 text-foreground shadow-2xs"
        aria-label="Previous Day"
      >
        <ChevronLeft className="size-4 stroke-[2.2]" />
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
                "relative flex flex-col items-center justify-center min-w-[38px] sm:min-w-[44px] h-11 sm:h-12 px-1 sm:px-2 rounded-xl border-2 transition-all cursor-pointer",
                isSelected
                  ? "bg-[#161514] text-[#CEF431] border-[#161514] dark:bg-[#CEF431] dark:text-[#161514] dark:border-[#CEF431] shadow-[2px_2px_0px_0px_rgba(22,21,20,0.6)] font-black scale-[1.02]"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-muted hover:border-[#161514]/40 font-bold"
              )}
              aria-label={`Select ${day.dayName}, ${day.dateStr}`}
              aria-current={isSelected ? "date" : undefined}
            >
              {/* Day Name (e.g. Mon, Tue) */}
              <span
                className={cn(
                  "font-mono text-[9px] uppercase tracking-wider leading-tight",
                  isSelected
                    ? "opacity-90 font-black"
                    : isCurrentToday
                    ? "text-[#03D26F] font-black"
                    : "text-muted-foreground font-bold"
                )}
              >
                {day.dayName}
              </span>

              {/* Day Number (e.g. 24, 25) */}
              <span
                className={cn(
                  "font-mono font-black text-xs sm:text-sm leading-none mt-0.5 tabular-nums",
                  isSelected ? "text-[#CEF431] dark:text-[#161514]" : "text-foreground"
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
                      isSelected ? "bg-[#CEF431] dark:bg-[#161514]" : "bg-[#03D26F]"
                    )}
                  />
                ) : (
                  <span
                    className={cn(
                      "size-1 rounded-full",
                      isSelected ? "bg-[#CEF431]/40 dark:bg-black/40" : "bg-muted-foreground/30"
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
        className="size-8 sm:size-9 rounded-xl border-2 border-border hover:border-[#161514] dark:hover:border-white/40 bg-secondary hover:bg-muted flex items-center justify-center transition-all cursor-pointer shrink-0 active:translate-x-0.5 active:translate-y-0.5 text-foreground shadow-2xs"
        aria-label="Next Day"
      >
        <ChevronRight className="size-4 stroke-[2.2]" />
      </button>

      {/* 4. Quick "Today" Snap Pill (Visible when looking at past/future dates) */}
      {!isToday && (
        <button
          type="button"
          onClick={handleToday}
          className="h-8 sm:h-9 px-3 rounded-xl bg-[#CEF431] hover:bg-[#bce028] text-[#161514] font-heading font-black text-xs border-2 border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] transition-all cursor-pointer shrink-0 whitespace-nowrap flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <span>Today</span>
        </button>
      )}
    </div>
  );
}
