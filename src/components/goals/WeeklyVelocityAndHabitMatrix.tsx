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
import { Flame, Trophy, Zap, Calendar, TrendingUp, Sparkles, Award, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { renderCategoryEmoji } from "@/components/money/MoneyQuickActionsAndCards";

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
    <div className="space-y-5 my-4">
      {/* Top Banner: Peak Productivity Insight */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#CEF431] border-2 border-navy-950 flex items-center justify-center text-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] shrink-0">
              <Zap className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-navy-950 uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
                WEEKLY VELOCITY & CONSISTENCY MATRIX
              </h3>
              <p className="text-xs text-navy-700 font-bold mt-0.5">
                👑 Peak Focus Day: <strong className="text-emerald-700 font-black">{weekdayStats.peakDay.name}s</strong> (Avg {weekdayStats.peakDay.avg} logs/day)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="bg-[#03D26F] text-[#161514] px-3.5 py-1.5 rounded-xl border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] text-center">
              <span className="text-sm font-black block leading-none">{total28DaysCompleted}</span>
              <span className="text-[9px] font-black uppercase tracking-widest block opacity-90 mt-0.5">28D LOGS</span>
            </div>
            <div className="bg-[#CEF431] text-[#161514] px-3.5 py-1.5 rounded-xl border-2 border-navy-950 shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] text-center">
              <span className="text-sm font-black block leading-none">{habits.length}</span>
              <span className="text-[9px] font-black uppercase tracking-widest block opacity-90 mt-0.5">HABITS</span>
            </div>
          </div>
        </div>

        {/* 4-Week Activity Heatmap Grid (28 Days) */}
        <div className="space-y-2 pt-2 border-t-2 border-navy-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-navy-950 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 stroke-[2.5]" /> 28-Day Consistency Heatmap Grid
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-navy-700">
              <span>Less</span>
              <div className="h-3 w-3 rounded bg-[#FAF8F5] border border-navy-950" />
              <div className="h-3 w-3 rounded bg-[#CEF431]/40 border border-navy-950" />
              <div className="h-3 w-3 rounded bg-[#CEF431] border border-navy-950" />
              <div className="h-3 w-3 rounded bg-[#03D26F] border border-navy-950" />
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
                    "relative h-10 sm:h-12 rounded-xl border-2 border-navy-950 p-1 flex flex-col justify-between transition-all cursor-pointer select-none",
                    d.intensity === 0 && "bg-[#FAF8F5]",
                    d.intensity === 1 && "bg-[#CEF431]/30",
                    d.intensity === 2 && "bg-[#CEF431]/60 shadow-[1px_1px_0px_0px_rgba(31,36,48,1)]",
                    d.intensity === 3 && "bg-[#CEF431] shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)] font-black",
                    d.intensity === 4 && "bg-[#03D26F] text-white shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] font-black scale-[1.03]",
                    d.isToday && "ring-2 ring-amber-400 ring-offset-1"
                  )}
                >
                  <span className="text-[9px] font-black uppercase opacity-80 leading-none">{d.shortDate}</span>
                  <span className="text-xs font-black text-right leading-none">{d.count > 0 ? d.count : "•"}</span>

                  {/* Tooltip on Hover */}
                  {isHovered && (
                    <div className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 z-50 bg-[#161514] text-white p-2.5 rounded-xl border-2 border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-[10px] w-44 pointer-events-none space-y-1">
                      <div className="font-black text-[#CEF431] uppercase tracking-wider flex justify-between">
                        <span>{d.shortDate} ({d.dayName})</span>
                        <span>{d.count} Logs</span>
                      </div>
                      {d.loggedTitles.length > 0 ? (
                        <div className="space-y-0.5 max-h-20 overflow-hidden text-[#FAF8F5]/90 font-bold">
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

        {/* Weekday Distribution Bar Grid (Mon - Sun) */}
        <div className="space-y-2 pt-3 border-t-2 border-navy-950/10">
          <span className="text-xs font-black uppercase tracking-wider text-navy-950 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 stroke-[2.5]" /> Weekday Productivity Distribution
          </span>

          <div className="grid grid-cols-7 gap-2 pt-1">
            {weekdayStats.list.map((item) => {
              const isPeak = item.dayNum === weekdayStats.peakDay.dayNum;
              const maxAvgVal = weekdayStats.maxAvg || 1;
              const barHeightPct = Math.max(15, Math.round((item.avg / maxAvgVal) * 100));

              return (
                <div key={item.dayNum} className="space-y-1.5 text-center">
                  <div className="h-24 bg-[#FAF8F5] rounded-xl border-2 border-navy-950 p-1 flex flex-col justify-end relative shadow-[1.5px_1.5px_0px_0px_rgba(31,36,48,1)]">
                    {isPeak && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs">👑</span>
                    )}
                    <div
                      style={{ height: `${barHeightPct}%` }}
                      className={cn(
                        "w-full rounded-lg border border-navy-950 transition-all flex items-center justify-center text-[10px] font-black",
                        isPeak ? "bg-[#CEF431] text-[#161514]" : "bg-[#03D26F]/40 text-navy-950"
                      )}
                    >
                      {item.avg > 0 ? item.avg : ""}
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-black block uppercase",
                    isPeak ? "text-emerald-700 underline" : "text-navy-900"
                  )}>
                    {item.shortName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Habit Streak & Consistency Leaderboard */}
      {habitLeaderboard.length > 0 && (
        <div className="bg-white rounded-3xl p-5 md:p-6 border-2 border-navy-950 shadow-[4px_4px_0px_0px_rgba(31,36,48,1)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-navy-950 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500 stroke-[2.5]" /> Habit Streak & Consistency Leaderboard
            </h3>
            <span className="text-[10px] font-black uppercase text-navy-600 bg-amber-100 px-2.5 py-1 rounded-full border border-navy-950">
              30-Day Evaluation
            </span>
          </div>

          <div className="space-y-3">
            {habitLeaderboard.map((h) => (
              <div key={h.id} className="p-3.5 rounded-2xl border-2 border-navy-950 bg-[#FAF8F5] shadow-[2px_2px_0px_0px_rgba(31,36,48,1)] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-lg">{renderCategoryEmoji(h.icon)}</span>
                    <h4 className="font-black text-xs sm:text-sm text-navy-950 truncate">{h.title}</h4>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-amber-300 text-navy-950 border border-navy-950 flex items-center gap-1">
                      <Flame className="h-3 w-3 text-rose-600 fill-rose-600" />
                      {h.currentStreak}D Streak
                    </span>
                    <span className="text-xs font-black text-emerald-700 bg-[#03D26F]/20 px-2.5 py-1 rounded-xl border border-navy-950">
                      {h.consistencyPct}% Consistency
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-white rounded-full border border-navy-950 p-0.5 overflow-hidden">
                  <div
                    style={{ width: `${h.consistencyPct}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      h.consistencyPct >= 80 ? "bg-[#03D26F]" : h.consistencyPct >= 50 ? "bg-[#CEF431]" : "bg-amber-400"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
