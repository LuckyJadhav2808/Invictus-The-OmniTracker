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
    <div className="bg-white rounded-3xl p-3 sm:p-4 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] flex justify-between items-center w-full my-4">
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
            className={`flex flex-col items-center p-2 rounded-2xl min-w-[42px] transition-all relative cursor-pointer border-2 ${
              isSelected
                ? "bg-amber-300 border-navy-950 text-navy-950 font-black shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]"
                : "border-transparent text-navy-950 hover:bg-cream-bg/80 font-bold"
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider opacity-70">
              {format(day, "eee").charAt(0)}
            </span>
            <span
              className={`text-sm font-black mt-1 h-7 w-7 flex items-center justify-center rounded-xl ${
                isToday && !isSelected
                  ? "border-2 border-navy-950 bg-emerald-200"
                  : ""
              }`}
            >
              {format(day, "d")}
            </span>
            {hasActivity && (
              <span
                className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                  isSelected ? "bg-navy-950" : dotColorClass
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
