"use client";

import { useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isPast, isFuture, isToday } from "date-fns";
import { useHabits, useMonthHabitLogs } from "@/lib/queries/goals";
import { cn } from "@/lib/utils";

export function WeeklyOverviewWidget() {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => format(today, "yyyy-MM-dd"), [today]);

  // Week Interval (Monday to Sunday)
  const weekStart = useMemo(() => startOfWeek(today, { weekStartsOn: 1 }), [today]);
  const weekEnd = useMemo(() => endOfWeek(today, { weekStartsOn: 1 }), [today]);

  const weekStartStr = useMemo(() => format(weekStart, "yyyy-MM-dd"), [weekStart]);
  const weekEndStr = useMemo(() => format(weekEnd, "yyyy-MM-dd"), [weekEnd]);

  // Days in current week [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  // Query habits & week logs from MongoDB
  const { data: habits = [] } = useHabits();
  const { data: weekLogs = [] } = useMonthHabitLogs(weekStartStr, weekEndStr);

  const activeHabitsCount = habits.length;

  // Compute daily completed counts per day of week
  const dailyStats = useMemo(() => {
    return weekDays.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayLogs = weekLogs.filter((l) => l.date === dateStr && l.completed);
      const completedCount = dayLogs.length;

      return {
        date: day,
        dateStr,
        dayLabel: format(day, "EEE"), // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
        completedCount,
        isCurrentDay: isToday(day),
        isPastDay: isPast(day) && !isToday(day),
        isFutureDay: isFuture(day) && !isToday(day),
      };
    });
  }, [weekDays, weekLogs]);

  // Calculate totals
  const totalCompletedWeek = useMemo(() => {
    return dailyStats.reduce((sum, d) => sum + d.completedCount, 0);
  }, [dailyStats]);

  // Count perfect days (where completedCount >= activeHabitsCount && activeHabitsCount > 0)
  const perfectDaysCount = useMemo(() => {
    if (activeHabitsCount === 0) return 0;
    return dailyStats.filter((d) => (d.isPastDay || d.isCurrentDay) && d.completedCount >= activeHabitsCount).length;
  }, [dailyStats, activeHabitsCount]);

  // Today stat
  const todayStat = useMemo(() => {
    return dailyStats.find((d) => d.isCurrentDay) || { completedCount: 0 };
  }, [dailyStats]);

  // Overall Week Completion %
  const totalPossibleThisWeek = activeHabitsCount * 7;
  const weekPercentage = totalPossibleThisWeek > 0 ? Math.round((totalCompletedWeek / totalPossibleThisWeek) * 100) : 0;

  return (
    <div className="bg-white dark:bg-[#1C1A18] rounded-xl p-5 border border-[#E8E5DF] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] space-y-4 my-4">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded-md border border-[#E8E5DF] dark:border-[#383531] bg-[#F1EFEA] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5]">
              Rhythm
            </span>
            <span className="text-xs font-mono text-[#6B6B6B] dark:text-[#A8A29E]">Mon to Sun</span>
          </div>
          <h3 className="text-[15px] sm:text-base font-sans font-semibold text-[#161514] dark:text-[#FAF8F5] tracking-tight mt-1">
            Weekly Overview
          </h3>
        </div>

        {/* Right % Week Box */}
        <div className="bg-[#F1EFEA] dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531] px-3 py-1.5 rounded-lg text-center">
          <span className="text-base font-sans font-semibold block leading-none font-mono tabular-nums text-[#161514] dark:text-[#FAF8F5]">{weekPercentage}%</span>
          <span className="text-[10px] font-medium block text-[#6B6B6B] dark:text-[#A8A29E] mt-0.5">Week pace</span>
        </div>
      </div>

      {/* Day-of-Week Strip (Mon Tue Wed Thu Fri Sat Sun) */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
        {dailyStats.map((d, idx) => (
          <div key={d.dateStr || idx} className="space-y-1.5">
            {/* Day Initials Label */}
            <span className={cn(
              "text-xs block",
              d.isCurrentDay ? "text-[#161514] dark:text-[#FAF8F5] font-semibold" : "text-[#6B6B6B] dark:text-[#A8A29E] font-medium"
            )}>
              {d.dayLabel}
            </span>

            {/* Day Box */}
            <div
              className={cn(
                "h-11 sm:h-12 rounded-lg border flex items-center justify-center transition-colors text-xs font-mono font-medium select-none",
                d.isCurrentDay
                  ? "bg-[#03D26F] text-white dark:text-[#161514] border-[#03D26F] font-semibold"
                  : d.isPastDay
                  ? "bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border-[#E8E5DF] dark:border-[#383531]"
                  : "bg-[#FAF8F5] dark:bg-[#161514] text-[#6B6B6B]/40 dark:text-[#A8A29E]/40 border-[#E8E5DF] dark:border-[#383531]"
              )}
            >
              {activeHabitsCount === 0 ? (
                <span>0/0</span>
              ) : (
                <span className="tabular-nums">
                  {d.completedCount}/{activeHabitsCount}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom 3 Summary Stat Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-1">
        {/* Card 1: Completed */}
        <div className="bg-[#FAF8F5] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] p-3 rounded-lg text-center">
          <span className="text-lg font-mono font-semibold block leading-none tabular-nums text-[#161514] dark:text-[#FAF8F5]">{totalCompletedWeek}</span>
          <span className="text-[11px] font-medium text-[#6B6B6B] dark:text-[#A8A29E] block mt-1">Completed</span>
        </div>

        {/* Card 2: Perfect Days */}
        <div className="bg-[#FAF8F5] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] p-3 rounded-lg text-center">
          <span className="text-lg font-mono font-semibold block leading-none tabular-nums text-[#161514] dark:text-[#FAF8F5]">{perfectDaysCount}</span>
          <span className="text-[11px] font-medium text-[#6B6B6B] dark:text-[#A8A29E] block mt-1">Perfect days</span>
        </div>

        {/* Card 3: Today */}
        <div className="bg-white dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] border border-[#E8E5DF] dark:border-[#383531] p-3 rounded-lg text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-[#03D26F]" />
          <span className="text-lg font-mono font-semibold block leading-none tabular-nums text-[#047857] dark:text-[#03D26F]">
            {todayStat.completedCount}/{activeHabitsCount}
          </span>
          <span className="text-[11px] font-medium text-[#6B6B6B] dark:text-[#A8A29E] block mt-1">Today's pace</span>
        </div>
      </div>
    </div>
  );
}
