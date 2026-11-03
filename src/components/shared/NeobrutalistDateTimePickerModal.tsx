"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  subDays,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Clock, X, Check } from "lucide-react";
import { soundFX } from "@/components/shared/SoundFX";
import { cn } from "@/lib/utils";

interface NeobrutalistDateTimePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateValue: string; // "YYYY-MM-DD"
  timeValue?: string; // "HH:mm"
  onSave: (date: string, time?: string) => void;
  showTime?: boolean;
  title?: string;
}

export function NeobrutalistDateTimePickerModal({
  open,
  onOpenChange,
  dateValue,
  timeValue = "12:00",
  onSave,
  showTime = false,
  title = "Select Date & Time",
}: NeobrutalistDateTimePickerModalProps) {
  // Local state for interactive navigation & selection
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    try {
      return dateValue ? parseISO(dateValue) : new Date();
    } catch {
      return new Date();
    }
  });

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    try {
      return dateValue ? parseISO(dateValue) : new Date();
    } catch {
      return new Date();
    }
  });

  const [selectedTime, setSelectedTime] = useState<string>(timeValue);

  // Sync state when modal opens
  useEffect(() => {
    if (open) {
      try {
        const parsed = dateValue ? parseISO(dateValue) : new Date();
        setSelectedDate(parsed);
        setCurrentMonth(parsed);
        if (timeValue) setSelectedTime(timeValue);
      } catch {
        setSelectedDate(new Date());
        setCurrentMonth(new Date());
      }
    }
  }, [open, dateValue, timeValue]);

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  if (!open) return null;

  // Preset Handlers
  const handleSelectPreset = (daysAgo: number) => {
    soundFX.playPop();
    soundFX.vibrate(15);
    const target = subDays(new Date(), daysAgo);
    setSelectedDate(target);
    setCurrentMonth(target);
  };

  const handleApply = () => {
    soundFX.playPop();
    soundFX.vibrate(20);
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    onSave(formattedDate, showTime ? selectedTime : undefined);
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#161514]/65 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={() => onOpenChange(false)} />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md bg-[#FAF8F5] dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#2A2724] rounded-2xl shadow-xl p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E8E5DF] dark:border-[#2A2724]">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#CEF431] border border-[#CEF431] flex items-center justify-center shadow-xs">
              <Calendar className="size-4 text-[#161514] stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-heading font-black text-sm sm:text-base text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wide">
                {title}
              </h2>
              <span className="font-mono text-[11px] font-bold text-[#FF4F17] dark:text-[#FF6B3D]">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-lg bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] text-[#161514] dark:text-[#FAF8F5] flex items-center justify-center shadow-xs hover:bg-[#EF4444] hover:text-white transition-colors cursor-pointer active:translate-y-0.5"
            aria-label="Close"
          >
            <X className="size-4 stroke-[2.5]" />
          </button>
        </div>

        {/* ⚡ Quick Presets Chips */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-black text-[#161514]/60 dark:text-[#FAF8F5]/60 uppercase tracking-widest">
            Quick Pick
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "Today", days: 0 },
              { label: "Yesterday", days: 1 },
              { label: "2 Days Ago", days: 2 },
              { label: "3 Days Ago", days: 3 },
            ].map((preset) => {
              const target = subDays(new Date(), preset.days);
              const isSelected = isSameDay(selectedDate, target);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset.days)}
                  className={cn(
                    "py-1.5 px-1 rounded-lg border text-[11px] font-heading font-black transition-all cursor-pointer shadow-xs active:translate-y-0.5 text-center",
                    isSelected
                      ? "bg-[#CEF431] text-[#161514] border-[#CEF431]"
                      : "bg-white dark:bg-[#1C1A18] text-[#161514]/80 dark:text-[#FAF8F5]/80 hover:bg-[#F1EFEA] dark:hover:bg-[#252321] border-[#E8E5DF] dark:border-[#2A2724]"
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 📅 Month Navigator */}
        <div className="p-2.5 bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                setCurrentMonth((prev) => subMonths(prev, 1));
              }}
              className="size-7 rounded-md bg-[#FAF8F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-center hover:bg-[#CEF431] dark:hover:bg-[#CEF431] hover:text-[#161514] text-[#161514] dark:text-[#FAF8F5] transition-colors cursor-pointer shadow-xs"
              aria-label="Previous Month"
            >
              <ChevronLeft className="size-4 stroke-[2.5]" />
            </button>

            <span className="font-heading font-black text-xs sm:text-sm text-[#161514] dark:text-[#FAF8F5] uppercase tracking-wider">
              {format(currentMonth, "MMMM yyyy")}
            </span>

            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                setCurrentMonth((prev) => addMonths(prev, 1));
              }}
              className="size-7 rounded-md bg-[#FAF8F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724] flex items-center justify-center hover:bg-[#CEF431] dark:hover:bg-[#CEF431] hover:text-[#161514] text-[#161514] dark:text-[#FAF8F5] transition-colors cursor-pointer shadow-xs"
              aria-label="Next Month"
            >
              <ChevronRight className="size-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Weekday Labels (Mon - Sun) */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((day) => (
              <span
                key={day}
                className="text-[9px] font-mono font-black text-[#161514]/60 dark:text-[#FAF8F5]/60 tracking-wider py-0.5"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    soundFX.vibrate(10);
                    setSelectedDate(day);
                  }}
                  className={cn(
                    "aspect-square rounded-lg border text-xs font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer relative shadow-xs",
                    isSelected
                      ? "bg-[#CEF431] text-[#161514] font-black border-[#CEF431] z-10"
                      : isCurrentDay
                      ? "bg-[#FEF08A] dark:bg-amber-900/40 text-[#161514] dark:text-amber-200 border-[#FEF08A] dark:border-amber-700/50"
                      : isCurrentMonth
                      ? "bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] hover:bg-[#FAF8F5] dark:hover:bg-[#2F2C29] border-[#E8E5DF] dark:border-[#2A2724]"
                      : "bg-[#F1EFEA]/40 dark:bg-[#1C1A18]/40 text-[#161514]/30 dark:text-[#FAF8F5]/30 border-transparent shadow-none hover:bg-[#F1EFEA] dark:hover:bg-[#252321]"
                  )}
                >
                  <span>{format(day, "d")}</span>
                  {isCurrentDay && !isSelected && (
                    <span className="absolute bottom-1 size-1 rounded-full bg-[#161514] dark:bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ⏰ Time Section (Optional) */}
        {showTime && (
          <div className="p-2.5 bg-white dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] rounded-xl shadow-xs space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#161514] dark:text-[#FAF8F5]">
              <Clock className="size-3.5 text-[#161514] dark:text-[#FAF8F5]" />
              <span className="uppercase font-mono font-bold text-[10px]">Select Time</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full bg-[#FAF8F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724] rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-[#161514] dark:text-[#FAF8F5] outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setSelectedTime(format(new Date(), "HH:mm"));
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#2A2724] text-[10px] font-heading font-black text-[#161514] dark:text-[#FAF8F5] shadow-xs hover:bg-[#CEF431] dark:hover:bg-[#CEF431] hover:text-[#161514] transition-colors cursor-pointer shrink-0"
              >
                Now ⚡
              </button>
            </div>
          </div>
        )}

        {/* Footer Apply Button */}
        <div className="pt-1 flex gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-1/3 py-2.5 rounded-xl border border-[#E8E5DF] dark:border-[#2A2724] bg-white dark:bg-[#1C1A18] hover:bg-[#F1EFEA] dark:hover:bg-[#252321] text-xs font-heading font-black text-[#161514] dark:text-[#FAF8F5] transition-all cursor-pointer shadow-xs active:translate-y-0.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="w-2/3 py-2.5 rounded-xl border border-[#03D26F] bg-[#03D26F] hover:bg-[#10E57E] text-xs font-heading font-black text-[#161514] uppercase tracking-wider transition-all cursor-pointer shadow-xs active:translate-y-0.5 flex items-center justify-center gap-2"
          >
            <Check className="size-4 stroke-[3]" />
            <span>Apply Date</span>
          </button>
        </div>
      </div>
    </div>
  );
}
