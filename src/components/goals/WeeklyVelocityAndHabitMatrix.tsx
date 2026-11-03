"use client";

import { useState, useMemo } from "react";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday as checkIsToday,
  parseISO,
} from "date-fns";
import { useHabits, useMonthHabitLogs, useStreaks } from "@/lib/queries/goals";
import * as LucideIcons from "lucide-react";
import { Flame, Trophy, Zap, Calendar, TrendingUp, Sparkles, Award, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function WeeklyVelocityAndHabitMatrix() {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => format(today, "yyyy-MM-dd"), [today]);

  // 28 Days Range (4 Weeks ending today)
  const rangeStart = useMemo(() => subDays(today, 27), [today]);
  const rangeStartStr = useMemo(() => format(rangeStart, "yyyy-MM-dd"), [rangeStart]);

  // Queries
  const { data: habits = [] } = useHabits();
  const { data: monthLogs = [] } = useMonthHabitLogs(rangeStartStr, todayStr);
  const { data: streaks = {} } = useStreaks();

  const [hoveredDay, setHoveredDay] = useState<any | null>(null);

  // 1. Compute 28-Day Heatmap Grid Data
  const heatmapDays = useMemo(() => {
    const daysInterval = eachDayOfInterval({ start: rangeStart, end: today });
    const totalActiveHabits = habits.length || 1;

    return daysInterval.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayLogs = monthLogs.filter((l) => l.date === dateStr && l.completed);
      const count = dayLogs.length;

      // Intensity score 0 to 4
      let intensity = 0;
      if (count > 0) {
        const ratio = count / totalActiveHabits;
        if (ratio >= 0.8) intensity = 4; // Peak
        else if (ratio >= 0.5) intensity = 3; // High
        else if (ratio >= 0.25) intensity = 2; // Medium
        else intensity = 1; // Light
      }

      return {
        date: day,
        dateStr,
        dayName: format(day, "EEEE"),
        monthName: format(day, "MMM"),
        dayNum: format(day, "d"),
        shortDate: format(day, "MMM d"),
        count,
        totalHabits: totalActiveHabits,
        intensity,
        isToday: checkIsToday(day),
        loggedTitles: dayLogs.map((l) => {
          const h = habits.find((hb) => hb.id === l.habitId);
          return h ? h.title : "Habit Logged";
        }),
      };
    });
  }, [rangeStart, today, monthLogs, habits]);

  // 2. Compute Weekday Distribution (Mon - Sun) to find Peak Productivity Day
  const weekdayStats = useMemo(() => {
    const dayTotals: { [key: number]: { count: number; totalDays: number; name: string } } = {
      1: { count: 0, totalDays: 0, name: "Monday" },
      2: { count: 0, totalDays: 0, name: "Tuesday" },
      3: { count: 0, totalDays: 0, name: "Wednesday" },
      4: { count: 0, totalDays: 0, name: "Thursday" },
      5: { count: 0, totalDays: 0, name: "Friday" },
      6: { count: 0, totalDays: 0, name: "Saturday" },
      0: { count: 0, totalDays: 0, name: "Sunday" },
    };

    heatmapDays.forEach((d) => {
      const dayNum = d.date.getDay();
      dayTotals[dayNum].count += d.count;
      dayTotals[dayNum].totalDays += 1;
    });

    const list = [1, 2, 3, 4, 5, 6, 0].map((num) => {
      const item = dayTotals[num];
      const avg = item.totalDays > 0 ? (item.count / item.totalDays).toFixed(1) : "0.0";
      return {
        dayNum: num,
        name: item.name,
        shortName: item.name.slice(0, 3).toUpperCase(),
        totalCount: item.count,
        avg: parseFloat(avg),
      };
    });

    // Find peak weekday
    let maxAvg = -1;
    let peakDay = list[0];
    list.forEach((item) => {
      if (item.avg > maxAvg) {
        maxAvg = item.avg;
        peakDay = item;
      }
    });

    return { list, peakDay, maxAvg };
  }, [heatmapDays]);

  // 3. Compute Habit Leaderboard & Streaks
  const habitLeaderboard = useMemo(() => {
    return habits.map((h) => {
      const logsForHabit = monthLogs.filter((l) => l.habitId === h.id && l.completed);
      const totalLogged30Days = logsForHabit.length;
      const consistencyPct = Math.min(100, Math.round((totalLogged30Days / 28) * 100));
      const streakInfo = streaks[h.id] || { currentStreak: 0, longestStreak: 0 };

      return {
        ...h,
        totalLogged30Days,
        consistencyPct,
        currentStreak: streakInfo.currentStreak || 0,
        longestStreak: streakInfo.longestStreak || 0,
      };
    }).sort((a, b) => b.consistencyPct - a.consistencyPct);
  }, [habits, monthLogs, streaks]);

  // Total completed overall in 28 days
  const total28DaysCompleted = useMemo(() => {
    return heatmapDays.reduce((sum, d) => sum + d.count, 0);
  }, [heatmapDays]);

  return (
    <div className="space-y-4 my-4">
      {/* Top Banner: Peak Productivity Insight */}
      <div className="bg-white dark:bg-[#1C1A18] rounded-xl p-5 border border-[#E8E5DF] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-[#F1EFEA] dark:bg-[#252321] flex items-center justify-center text-[#161514] dark:text-[#CEF431] shrink-0 border border-[#E8E5DF] dark:border-[#383531]">
              <Zap className="size-4 stroke-[1.5]" />
            </div>
            <div>
              <h3 className="text-[15px] sm:text-base font-sans font-semibold text-[#161514] dark:text-[#FAF8F5] tracking-tight flex items-center gap-2">
                Weekly Consistency
              </h3>
              <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] mt-0.5">
                Most active day: <strong className="text-[#047857] dark:text-[#03D26F] font-semibold">{weekdayStats.peakDay.name}s</strong> ({weekdayStats.peakDay.avg} avg logs/day)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="bg-[#F1EFEA] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] px-3 py-1.5 rounded-lg border border-[#E8E5DF] dark:border-[#383531] text-center">
              <span className="text-sm font-sans font-semibold block leading-none font-mono tabular-nums">{total28DaysCompleted}</span>
              <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] block mt-0.5">28d logs</span>
            </div>
            <div className="bg-[#F1EFEA] dark:bg-[#252321] text-[#161514] dark:text-[#FAF8F5] px-3 py-1.5 rounded-lg border border-[#E8E5DF] dark:border-[#383531] text-center">
              <span className="text-sm font-sans font-semibold block leading-none font-mono tabular-nums">{habits.length}</span>
              <span className="text-[10px] text-[#6B6B6B] dark:text-[#A8A29E] block mt-0.5">Habits</span>
            </div>
          </div>
        </div>

        {/* 4-Week Activity Heatmap Grid (28 Days) */}
        <div className="space-y-2 pt-2 border-t border-[#E8E5DF] dark:border-[#383531]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-medium text-[#161514] dark:text-[#FAF8F5] flex items-center gap-1.5">
              <Calendar className="size-3.5 stroke-[1.5]" /> 4-Week activity matrix
            </span>
            <div className="flex items-center gap-1 text-[10px] text-[#6B6B6B] dark:text-[#A8A29E]">
              <span>Less</span>
              <div className="size-2.5 rounded-sm bg-white dark:bg-[#252321] border border-[#E8E5DF] dark:border-[#383531]" />
              <div className="size-2.5 rounded-sm bg-[#DCFAE5]/50 dark:bg-[#03D26F]/20 border border-[#E8E5DF] dark:border-[#383531]" />
              <div className="size-2.5 rounded-sm bg-[#DCFAE5] dark:bg-[#03D26F]/50 border border-[#E8E5DF] dark:border-[#383531]" />
              <div className="size-2.5 rounded-sm bg-[#03D26F]" />
              <span>More</span>
            </div>
          </div>

          <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 sm:gap-2">
            {heatmapDays.map((d) => {
              const isHovered = hoveredDay?.dateStr === d.dateStr;
              return (
                <div
                  key={d.dateStr}
                  onMouseEnter={() => setHoveredDay(d)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={cn(
                    "relative aspect-square sm:aspect-auto sm:h-11 rounded-lg border border-[#E8E5DF] dark:border-[#383531] p-1 flex flex-col items-center justify-center text-center transition-colors cursor-pointer select-none overflow-hidden",
                    d.intensity === 0 && "bg-white dark:bg-[#252321] text-[#6B6B6B] dark:text-[#A8A29E]",
                    d.intensity === 1 && "bg-[#DCFAE5]/40 dark:bg-[#03D26F]/20 text-[#04250e] dark:text-[#03D26F]",
                    d.intensity === 2 && "bg-[#DCFAE5]/80 dark:bg-[#03D26F]/40 text-[#04250e] dark:text-[#03D26F]",
                    d.intensity === 3 && "bg-[#A7F3D0] dark:bg-[#03D26F]/70 text-[#04250e] dark:text-[#FAF8F5] font-medium",
                    d.intensity === 4 && "bg-[#03D26F] text-white dark:text-[#161514] font-semibold",
                    d.isToday && "ring-1.5 ring-[#161514] dark:ring-[#CEF431]"
                  )}
                >
                  <span className="text-[8px] font-mono uppercase opacity-70 leading-none">{d.monthName}</span>
                  <span className="text-xs font-mono font-medium leading-none mt-0.5">{d.dayNum}</span>

                  {d.count > 0 && (
                    <span className="absolute bottom-1 right-1 size-1 rounded-full bg-current opacity-90" />
                  )}

                  {/* Tooltip on Hover */}
                  {isHovered && (
                    <div className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 z-50 bg-[#161514] text-white p-2.5 rounded-lg border border-[#383531] shadow-md text-xs w-44 pointer-events-none space-y-1">
                      <div className="font-semibold text-[#03D26F] flex justify-between">
                        <span>{d.shortDate} ({d.dayName})</span>
                        <span>{d.count} Logs</span>
                      </div>
                      {d.loggedTitles.length > 0 ? (
                        <div className="space-y-0.5 max-h-20 overflow-hidden text-zinc-300 text-[11px]">
                          {d.loggedTitles.slice(0, 3).map((t, idx) => (
                            <div key={idx} className="truncate flex items-center gap-1">
                              <span>✓</span> <span className="truncate">{t}</span>
                            </div>
                          ))}
                          {d.loggedTitles.length > 3 && (
                            <div className="text-[9px] text-[#CEF431]">+ {d.loggedTitles.length - 3} more</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[#FAF8F5]/60 italic">No habits logged on this day</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Habit Streak & Consistency Leaderboard */}
      {habitLeaderboard.length > 0 && (
        <div className="bg-white dark:bg-[#1C1A18] rounded-xl p-5 border border-[#E8E5DF] dark:border-[#383531] shadow-[2px_2px_0px_0px_#161514] dark:shadow-[2px_2px_0px_0px_#000000] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-sans font-semibold text-[#161514] dark:text-[#FAF8F5] flex items-center gap-2">
              <Trophy className="size-4 text-amber-500 stroke-[1.5]" /> Habit consistency leaderboard
            </h3>
            <span className="text-xs font-mono text-[#6B6B6B] dark:text-[#A8A29E] bg-[#F1EFEA] dark:bg-[#252321] px-2 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531]">
              30-day view
            </span>
          </div>

          <div className="space-y-2">
            {habitLeaderboard.map((h) => {
              const IconComp = (LucideIcons as any)[h.icon] || LucideIcons.Target;
              const isEmoji = h.icon && /\p{Emoji}/u.test(h.icon);

              return (
                <div
                  key={h.id}
                  className="p-3 rounded-lg border border-[#E8E5DF] dark:border-[#383531] bg-white dark:bg-[#252321] space-y-2 transition-colors hover:bg-[#FAF8F5] dark:hover:bg-[#2A2724]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-7 rounded-md bg-[#F1EFEA] dark:bg-[#1C1A18] flex items-center justify-center text-[#161514] dark:text-[#FAF8F5] shrink-0 border border-[#E8E5DF] dark:border-[#383531]">
                        {isEmoji ? (
                          <span className="text-xs leading-none">{h.icon}</span>
                        ) : (
                          <IconComp className="size-3.5 stroke-[1.5]" />
                        )}
                      </div>
                      <h4 className="font-sans font-medium text-xs sm:text-sm text-[#161514] dark:text-[#FAF8F5] truncate leading-snug">
                        {h.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto pl-9 sm:pl-0">
                      <span className="text-xs font-mono text-[#92400E] dark:text-amber-300 px-2 py-0.5 rounded border border-[#E8E5DF] dark:border-[#383531] bg-[#FFFBEB] dark:bg-amber-950/40 flex items-center gap-1">
                        <Flame className="size-3 text-orange-500 fill-orange-500" />
                        <span className="tabular-nums">{h.currentStreak}d streak</span>
                      </span>
                      <span className="text-xs font-mono font-medium text-[#04250e] dark:text-[#03D26F] bg-[#DCFAE5] dark:bg-[#03D26F]/20 px-2 py-0.5 rounded border border-[#03D26F]/30 dark:border-[#03D26F]/40 tabular-nums">
                        {h.consistencyPct}% consistency
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-[#E8E5DF] dark:bg-[#383531] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${h.consistencyPct}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        h.consistencyPct >= 80 ? "bg-[#03D26F]" : h.consistencyPct >= 50 ? "bg-[#161514] dark:bg-[#CEF431]" : "bg-amber-500"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
