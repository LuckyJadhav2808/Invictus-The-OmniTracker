"use client";

import { useUIStore } from "@/store/ui-store";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

interface CalendarStripProps {
  activityDays?: Record<string, boolean>; // key: "yyyy-mm-dd", value: true
  dotColorClass?: string;
}

export function CalendarStrip({
  activityDays = {},
  dotColorClass = "bg-[#03D26F]",
}: CalendarStripProps) {
  const { selectedDate, setSelectedDate } = useUIStore();
  const today = new Date();

  // Find start of week (Monday)
  const monday = startOfWeek(today, { weekStartsOn: 1 });

  // Generate 7 days of the week
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <div className="bg-white rounded-3xl p-3 sm:p-4 border-2 border-[#161514] shadow-[4px_4px_0px_0px_rgba(22,21,20,1)] flex justify-between items-center w-full my-4">
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
                ? "bg-[#CEF431] border-[#161514] text-[#161514] font-black shadow-[2px_2px_0px_0px_rgba(22,21,20,1)]"
                : "border-transparent text-[#161514] hover:bg-[#EAF4F4] font-bold"
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider opacity-75">
              {format(day, "eee").charAt(0)}
            </span>
            <span
              className={`text-sm font-black mt-1 h-7 w-7 flex items-center justify-center rounded-xl ${
                isToday && !isSelected
                  ? "border-2 border-[#161514] bg-[#03D26F] text-[#161514]"
                  : ""
              }`}
            >
              {format(day, "d")}
            </span>
            {hasActivity && (
              <span
                className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                  isSelected ? "bg-[#161514]" : dotColorClass
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
