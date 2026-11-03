"use client";

import { useUIStore } from "@/store/ui-store";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarStripProps {
  activityDays?: Record<string, boolean>; // e.g. { "2026-03-30": true }
  dotColorClass?: string;
}

export function CalendarStrip({
  activityDays = {},
  dotColorClass = "bg-[#03D26F]",
}: CalendarStripProps) {
  const { selectedDate, setSelectedDate } = useUIStore();
  const today = new Date();

  // Find Monday of the current week (or selected week)
  const baseDate = selectedDate ? new Date(selectedDate) : today;
  const monday = startOfWeek(baseDate, { weekStartsOn: 1 });

  // Generate 7 days of the week
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <div className="bg-white dark:bg-[#1C1A18] rounded-2xl p-2.5 sm:p-3.5 border-[2.5px] border-[#161514] dark:border-[#383531] shadow-[4px_4px_0px_0px_#161514] dark:shadow-[4px_4px_0px_0px_#000000] flex justify-between items-center w-full my-4 overflow-x-auto no-scrollbar gap-1.5 transition-colors">
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
            className={cn(
              "flex flex-col items-center py-2 px-2.5 rounded-xl min-w-[44px] shrink-0 transition-all duration-150 relative cursor-pointer border-2 select-none",
              isSelected
                ? "bg-[#CEF431] border-[#161514] dark:border-[#383531] text-[#161514] font-heading font-black shadow-[3px_3px_0px_0px_#161514] dark:shadow-[3px_3px_0px_0px_#000000] -translate-y-0.5 active:translate-y-0 active:shadow-none"
                : "border-transparent text-[#161514]/70 dark:text-[#FAF8F5]/70 hover:text-[#161514] dark:hover:text-[#FAF8F5] hover:bg-[#FAF8F5] dark:hover:bg-[#252321] hover:border-[#161514]/20 dark:hover:border-[#383531] active:scale-95 font-heading font-bold"
            )}
          >
            <span className="font-heading text-[10px] font-black uppercase tracking-wider opacity-80">
              {format(day, "eee").charAt(0)}
            </span>
            <span
              className={cn(
                "font-heading text-sm font-black mt-1 h-7 w-7 flex items-center justify-center rounded-full",
                isToday && !isSelected
                  ? "border-2 border-[#161514] dark:border-[#383531] bg-[#03D26F] text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] dark:shadow-[1.5px_1.5px_0px_0px_#000000]"
                  : ""
              )}
            >
              {format(day, "d")}
            </span>
            {hasActivity && (
              <span
                className={cn(
                  "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                  isSelected ? "bg-[#161514]" : dotColorClass
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
