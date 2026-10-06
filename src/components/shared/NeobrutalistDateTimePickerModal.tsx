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
      <div className="relative z-10 w-full max-w-sm sm:max-w-md bg-[#FAF8F5] border-3 border-[#161514] rounded-2xl shadow-[6px_6px_0px_0px_#161514] p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#161514]/15">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_#161514]">
              <Calendar className="size-4 text-[#161514] stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-heading font-black text-sm sm:text-base text-[#161514] uppercase tracking-wide">
                {title}
              </h2>
              <span className="font-doodle text-[11px] font-bold text-[#FF4F17]">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-lg bg-white border-2 border-[#161514] flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_#161514] hover:bg-[#EF4444] hover:text-white transition-colors cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            aria-label="Close"
          >
            <X className="size-4 stroke-[2.5]" />
          </button>
        </div>

        {/* ⚡ Quick Presets Chips */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-black text-[#161514]/60 uppercase tracking-widest">
            Quick Pick
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "Today", days: 0, color: "bg-[#CEF431]" },
              { label: "Yesterday", days: 1, color: "bg-[#FEF08A]" },
              { label: "2 Days Ago", days: 2, color: "bg-[#FED7AA]" },
              { label: "3 Days Ago", days: 3, color: "bg-[#E9D5FF]" },
            ].map((preset) => {
              const target = subDays(new Date(), preset.days);
              const isSelected = isSameDay(selectedDate, target);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset.days)}
                  className={cn(
                    "py-1.5 px-1 rounded-lg border-2 border-[#161514] text-[11px] font-heading font-black transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none text-center",
                    isSelected
                      ? `${preset.color} text-[#161514] ring-2 ring-[#161514]`
                      : "bg-white text-[#161514]/80 hover:bg-[#F1EFEA]"
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 📅 Month Navigator */}
        <div className="p-2.5 bg-white border-2 border-[#161514] rounded-xl shadow-[3px_3px_0px_0px_#161514] space-y-2.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                setCurrentMonth((prev) => subMonths(prev, 1));
              }}
              className="size-7 rounded-md bg-[#FAF8F5] border-1.5 border-[#161514] flex items-center justify-center hover:bg-[#CEF431] transition-colors cursor-pointer shadow-[1px_1px_0px_0px_#161514]"
              aria-label="Previous Month"
            >
              <ChevronLeft className="size-4 text-[#161514] stroke-[2.5]" />
            </button>

            <span className="font-heading font-black text-xs sm:text-sm text-[#161514] uppercase tracking-wider">
              {format(currentMonth, "MMMM yyyy")}
            </span>

            <button
              type="button"
              onClick={() => {
                soundFX.playPop();
                setCurrentMonth((prev) => addMonths(prev, 1));
              }}
              className="size-7 rounded-md bg-[#FAF8F5] border-1.5 border-[#161514] flex items-center justify-center hover:bg-[#CEF431] transition-colors cursor-pointer shadow-[1px_1px_0px_0px_#161514]"
              aria-label="Next Month"
            >
              <ChevronRight className="size-4 text-[#161514] stroke-[2.5]" />
            </button>
          </div>

          {/* Weekday Labels (Mon - Sun) */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((day) => (
              <span
                key={day}
                className="text-[9px] font-mono font-black text-[#161514]/60 tracking-wider py-0.5"
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
                    "aspect-square rounded-lg border-1.5 border-[#161514] text-xs font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer relative",
                    isSelected
                      ? "bg-[#CEF431] text-[#161514] font-black shadow-[2px_2px_0px_0px_#161514] -translate-x-0.5 -translate-y-0.5 z-10"
                      : isCurrentDay
                      ? "bg-[#FEF08A] text-[#161514] shadow-[1px_1px_0px_0px_#161514]"
                      : isCurrentMonth
                      ? "bg-white text-[#161514] hover:bg-[#FAF8F5] shadow-[1px_1px_0px_0px_rgba(22,21,20,0.5)]"
                      : "bg-[#F1EFEA]/60 text-[#161514]/30 border-[#161514]/20 shadow-none hover:bg-[#F1EFEA]"
                  )}
                >
                  <span>{format(day, "d")}</span>
                  {isCurrentDay && !isSelected && (
                    <span className="absolute bottom-1 size-1 rounded-full bg-[#161514]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ⏰ Time Section (Optional) */}
        {showTime && (
          <div className="p-2.5 bg-white border-2 border-[#161514] rounded-xl shadow-[3px_3px_0px_0px_#161514] space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#161514]">
              <Clock className="size-3.5 text-[#161514]" />
              <span className="uppercase font-mono font-bold text-[10px]">Select Time</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full neo-input py-1.5 text-xs font-mono font-bold"
              />
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setSelectedTime(format(new Date(), "HH:mm"));
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border-1.5 border-[#161514] text-[10px] font-heading font-black shadow-[1px_1px_0px_0px_#161514] hover:bg-[#CEF431] transition-colors cursor-pointer shrink-0"
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
            className="w-1/3 py-2.5 rounded-xl border-2 border-[#161514] bg-white hover:bg-[#F1EFEA] text-xs font-heading font-black text-[#161514] transition-all cursor-pointer shadow-[2px_2px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="w-2/3 py-2.5 rounded-xl border-2 border-[#161514] bg-[#03D26F] hover:bg-[#10E57E] text-xs font-heading font-black text-[#161514] uppercase tracking-wider transition-all cursor-pointer shadow-[3px_3px_0px_0px_#161514] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2"
          >
            <Check className="size-4 stroke-[3]" />
            <span>Apply Date</span>
          </button>
        </div>
      </div>
    </div>
  );
}
