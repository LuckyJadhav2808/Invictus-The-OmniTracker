"use client";

import React, { useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

export interface HabitsDateStripProps {
  selectedDate: string; // "yyyy-MM-dd"
  onSelectDate: (date: string) => void;
  className?: string;
}

export function HabitsDateStrip({
  selectedDate,
  onSelectDate,
  className,
}: HabitsDateStripProps) {
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  // Compute 7-day Monday to Sunday window around selectedDate
  const weekDays = useMemo(() => {
    const [y, m, d] = (selectedDate || todayStr).split("-").map(Number);
    const validBase = y && m && d ? new Date(y, m - 1, d) : new Date();
    const weekStart = startOfWeek(validBase, { weekStartsOn: 1 }); // Monday

    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(weekStart, i);
      const dateStr = format(date, "yyyy-MM-dd");
      return {
        date,
        dateStr,
        dayLabel: format(date, "EEE"), // Mon, Tue...
        dayNum: format(date, "d"),     // 19, 20...
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      };
    });
  }, [selectedDate, todayStr]);

  return (
    <div
      role="group"
      aria-label="7-Day Routine Horizon"
      className={cn("w-full grid grid-cols-7 gap-1 sm:gap-2 select-none", className)}
    >
      {weekDays.map((day) => (
        <button
          key={day.dateStr}
          type="button"
          onClick={() => {
            soundFX.playPop();
            soundFX.vibrate(12);
            onSelectDate(day.dateStr);
          }}
          className={cn(
            "relative py-1.5 sm:py-2 px-1 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center min-h-[46px] sm:min-h-[54px]",
            day.isSelected
              ? "bg-[#CEF431] text-[#161514] border-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000] font-black scale-[1.02] z-10"
              : day.isToday
              ? "bg-secondary text-foreground border-[#03D26F] font-black"
              : "bg-card text-muted-foreground border-border hover:bg-muted font-bold"
          )}
          title={`${day.dayLabel} ${day.dayNum} ${day.isToday ? "(Today)" : ""}`}
        >
          {day.isToday && (
            <span
              className={cn(
                "text-[7px] sm:text-[8px] font-mono font-black uppercase tracking-wider leading-none mb-0.5",
                day.isSelected ? "text-[#161514]" : "text-[#03D26F]"
              )}
            >
              TODAY
            </span>
          )}

          <span className="text-[8px] sm:text-[9.5px] uppercase tracking-wider leading-tight">
            {day.dayLabel}
          </span>
          <span className="text-xs sm:text-sm font-mono font-black mt-0.5 leading-none">
            {day.dayNum}
          </span>

          {day.isToday && !day.isSelected && (
            <span className="size-1 rounded-full mt-0.5 bg-[#03D26F]" />
          )}
        </button>
      ))}
    </div>
  );
}
