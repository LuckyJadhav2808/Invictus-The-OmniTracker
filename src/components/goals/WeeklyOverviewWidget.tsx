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
        dayLabel: format(day, "EEEEE"), // "M", "T", "W", "T", "F", "S", "S"
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
    <div className="bg-white rounded-3xl p-5 md:p-6 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-5 my-4">
      {/* Top Header Row */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-navy-950 uppercase tracking-tight leading-none" style={{ fontFamily: "var(--font-heading)" }}>
            WEEKLY
          </h3>
          <h3 className="text-xl md:text-2xl font-black text-[#007AFF] uppercase tracking-tight leading-none mt-0.5" style={{ fontFamily: "var(--font-heading)" }}>
            OVERVIEW
          </h3>
        </div>

        {/* Right % Week Box */}
        <div className="bg-[#FF3B30] text-white border-2 border-navy-950 px-3.5 py-1.5 rounded-xl text-center shadow-[2px_2px_0px_0px_rgba(31,36,48,1)]">
          <span className="text-lg font-black block leading-none">{weekPercentage}%</span>
          <span className="text-[9px] font-black uppercase tracking-widest block opacity-90 mt-0.5">WEEK</span>
        </div>
      </div>

      {/* Day-of-Week Strip (M T W T F S S) */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
        {dailyStats.map((d, idx) => (
          <div key={d.dateStr || idx} className="space-y-1.5">
            {/* Day Initials Label */}
            <span className="text-xs font-black text-navy-900 block uppercase">
              {d.dayLabel}
            </span>

            {/* Day Box */}
            <div
              className={cn(
                "h-12 sm:h-14 rounded-xl border-2 flex items-center justify-center transition-all text-xs sm:text-sm font-black select-none",
                d.isCurrentDay
                  ? "bg-[#FF3B30] text-white border-navy-950 shadow-[3px_3px_0px_0px_rgba(31,36,48,1)] scale-105 z-10"
                  : d.isPastDay
                  ? "bg-white text-navy-950 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,0.15)]"
                  : "bg-[#EAE8E3] text-navy-900/40 border-navy-950/30"
              )}
            >
              {activeHabitsCount === 0 ? (
                <span>0/0</span>
              ) : (
                <span>
                  {d.completedCount}/{activeHabitsCount}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom 3 Summary Stat Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-1">
        {/* Card 1: DONE */}
        <div className="bg-[#FFE600] text-navy-950 border-2 border-navy-950 p-3 rounded-2xl shadow-[2.5px_2.5px_0px_0px_rgba(31,36,48,1)] text-center">
          <span className="text-lg sm:text-xl font-black block leading-none">{totalCompletedWeek}</span>
          <span className="text-[9px] font-black uppercase tracking-widest block text-navy-900 mt-1">DONE</span>
        </div>

        {/* Card 2: PERFECT */}
        <div className="bg-[#FFF8C5] text-navy-950 border-2 border-navy-950 p-3 rounded-2xl shadow-[2.5px_2.5px_0px_0px_rgba(31,36,48,1)] text-center">
          <span className="text-lg sm:text-xl font-black block leading-none">{perfectDaysCount}</span>
          <span className="text-[9px] font-black uppercase tracking-widest block text-navy-900 mt-1">PERFECT</span>
        </div>

        {/* Card 3: TODAY */}
        <div className="bg-[#EBF5FF] text-[#007AFF] border-2 border-[#007AFF] p-3 rounded-2xl shadow-[2.5px_2.5px_0px_0px_rgba(0,122,255,1)] text-center">
          <span className="text-lg sm:text-xl font-black block leading-none">
            {todayStat.completedCount}/{activeHabitsCount}
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest block text-[#007AFF] mt-1">TODAY</span>
        </div>
      </div>
    </div>
  );
}
