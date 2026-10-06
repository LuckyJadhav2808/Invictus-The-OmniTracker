"use client";

import React from "react";
import { format, addDays, nextMonday } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { soundFX } from "@/components/shared/SoundFX";

interface NeobrutalistDateTimePickerProps {
  dateValue?: string; // YYYY-MM-DD
  timeValue?: string; // HH:mm
  onDateChange?: (date: string) => void;
  onTimeChange?: (time: string) => void;
  showDate?: boolean;
  showTime?: boolean;
  label?: string;
  className?: string;
}

export function NeobrutalistDateTimePicker({
  dateValue = format(new Date(), "yyyy-MM-dd"),
  timeValue = "08:00",
  onDateChange,
  onTimeChange,
  showDate = true,
  showTime = true,
  label,
  className,
}: NeobrutalistDateTimePickerProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const nextMonStr = format(nextMonday(new Date()), "yyyy-MM-dd");

  const datePresets = [
    { label: "Today", value: todayStr },
    { label: "Tomorrow", value: tomorrowStr },
    { label: "Next Mon", value: nextMonStr },
  ];

  const timePresets = [
    { label: "08:00 AM", value: "08:00" },
    { label: "12:00 PM", value: "12:00" },
    { label: "06:00 PM", value: "18:00" },
    { label: "09:00 PM", value: "21:00" },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="block text-xs font-heading font-black text-[#161514] uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Date Picker Section */}
      {showDate && onDateChange && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#161514]/70">
            <Calendar className="size-3.5" />
            <span>Select Date</span>
          </div>

          {/* Quick Date Chips */}
          <div className="flex flex-wrap gap-1.5">
            {datePresets.map((preset) => {
              const isSelected = dateValue === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    onDateChange(preset.value);
                  }}
                  className={cn(
                    "text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-[#161514] transition-all cursor-pointer",
                    isSelected
                      ? "bg-[#03D26F] text-[#161514] shadow-[2px_2px_0px_0px_#161514] font-black"
                      : "bg-white text-[#161514] hover:bg-[#FAF8F5] shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Input (min 16px font to prevent iOS Safari auto-zoom) */}
          <input
            type="date"
            value={dateValue}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full text-base font-bold bg-white border-2 border-[#161514] rounded-xl px-3.5 py-2 text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:ring-2 focus:ring-[#161514]"
          />
        </div>
      )}

      {/* Time Picker Section */}
      {showTime && onTimeChange && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#161514]/70">
            <Clock className="size-3.5" />
            <span>Select Time</span>
          </div>

          {/* Quick Time Chips */}
          <div className="flex flex-wrap gap-1.5">
            {timePresets.map((preset) => {
              const isSelected = timeValue === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    onTimeChange(preset.value);
                  }}
                  className={cn(
                    "text-xs font-bold px-2.5 py-1.5 rounded-xl border-2 border-[#161514] transition-all cursor-pointer",
                    isSelected
                      ? "bg-[#CEF431] text-[#161514] shadow-[2px_2px_0px_0px_#161514] font-black"
                      : "bg-white text-[#161514] hover:bg-[#FAF8F5] shadow-[1.5px_1.5px_0px_0px_#161514] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom Time Input (16px base font to prevent iOS zoom) */}
          <input
            type="time"
            value={timeValue}
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-full text-base font-bold bg-white border-2 border-[#161514] rounded-xl px-3.5 py-2 text-[#161514] shadow-[2px_2px_0px_0px_#161514] focus:outline-none focus:ring-2 focus:ring-[#161514]"
          />
        </div>
      )}
    </div>
  );
}
