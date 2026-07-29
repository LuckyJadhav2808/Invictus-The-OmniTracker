"use client";

import { useUIStore } from "@/store/ui-store";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

interface CalendarStripProps {
  activityDays?: Record<string, boolean>; // key: "yyyy-mm-dd", value: true
  dotColorClass?: string; // e.g. "bg-amber-500"
}

export function CalendarStrip({
  activityDays = {},
  dotColorClass = "bg-amber-500",
}: CalendarStripProps) {
  const { selectedDate, setSelectedDate } = useUIStore();
  const today = new Date();

  // Find start of week (Monday)
  const monday = startOfWeek(today, { weekStartsOn: 1 });

  // Generate 7 days of the week
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <div className="bg-white rounded-[var(--radius-lg)] p-4 shadow-[0_8px_24px_rgba(31,36,48,0.08)] flex justify-between items-center w-full">
      {days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const isToday = isSameDay(day, today);
        const isSelected = selectedDate === dayStr;
        const hasActivity = !!activityDays[dayStr];

        return (
          <button
            key={dayStr}
            type="button"
            onClick={() => setSelectedDate(dayStr)}
            className={`flex flex-col items-center p-2 rounded-full min-w-[40px] transition-all relative ${
              isSelected
                ? "bg-navy-900 text-white"
                : "hover:bg-cream-bg/50 text-navy-900"
            }`}
          >
            <span className="text-[10px] font-bold uppercase opacity-60">
              {format(day, "eee").charAt(0)}
            </span>
            <span
              className={`text-sm font-bold mt-1 h-7 w-7 flex items-center justify-center rounded-full ${
                isToday && !isSelected
                  ? "border-2 border-navy-900"
                  : ""
              }`}
            >
              {format(day, "d")}
            </span>
            {hasActivity && (
              <span
                className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                  isSelected ? "bg-white" : dotColorClass
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
