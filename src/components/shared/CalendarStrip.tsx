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
    <div className="bg-white rounded-2xl p-2.5 sm:p-3.5 border-[2.5px] border-[#161514] shadow-[4px_4px_0px_0px_#161514] flex justify-between items-center w-full my-4 overflow-x-auto no-scrollbar gap-1.5">
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
            className={`flex flex-col items-center py-2 px-2.5 rounded-xl min-w-[44px] shrink-0 transition-all duration-150 relative cursor-pointer border-2 select-none ${
              isSelected
                ? "bg-[#CEF431] border-[#161514] text-[#161514] font-heading font-black shadow-[3px_3px_0px_0px_#161514] -translate-y-0.5 active:translate-y-0 active:shadow-none"
                : "border-transparent text-[#161514]/80 hover:text-[#161514] hover:bg-[#EAF4F4] hover:border-[#161514] active:scale-95 font-heading font-bold"
            }`}
          >
            <span className="font-heading text-[10px] font-black uppercase tracking-wider opacity-80">
              {format(day, "eee").charAt(0)}
            </span>
            <span
              className={`font-heading text-sm font-black mt-1 h-7 w-7 flex items-center justify-center rounded-full ${
                isToday && !isSelected
                  ? "border-2 border-[#161514] bg-[#03D26F] text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514]"
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
