"use client";

import React, { useMemo } from "react";
import { BarChart2, Flame, Award, Calendar, Sparkles } from "lucide-react";
import { useHabits, useStreaks, useMonthHabitLogs } from "@/lib/queries/goals";
import { WeeklyVelocityAndHabitMatrix } from "@/components/goals/WeeklyVelocityAndHabitMatrix";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, subWeeks } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { cn } from "@/lib/utils";

export default function GoalsAnalyticsPage() {
  const { data: habits = [] } = useHabits();
  const { data: streaks = {} } = useStreaks();

  const today = useMemo(() => new Date(), []);
  const heatmapMonthStart = useMemo(() => format(startOfMonth(today), "yyyy-MM-dd"), [today]);
  const heatmapMonthEnd = useMemo(() => format(endOfMonth(today), "yyyy-MM-dd"), [today]);
  const analyticsStart = useMemo(() => format(subWeeks(today, 4), "yyyy-MM-dd"), [today]);

  const { data: monthLogs = [] } = useMonthHabitLogs(heatmapMonthStart, heatmapMonthEnd);
  const { data: fourWeekLogs = [] } = useMonthHabitLogs(analyticsStart, heatmapMonthEnd);

  // Calendar Heatmap Logic
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0 = Sun, 1 = Mon

  const totalHabits = habits.length;

  const getCompletionPercentage = (dateStr: string) => {
    if (totalHabits === 0) return 0;
    const completedOnDay = monthLogs.filter((l) => l.date === dateStr).length;
    return Math.round((completedOnDay / totalHabits) * 100);
  };

  // Analytics Metrics
  const activeStreaksList = Object.values(streaks).filter((s) => s.currentStreak > 0);
  const longestStreakValue = Object.values(streaks).reduce((max, s) => Math.max(max, s.longestStreak), 0);

  const trackedDays = new Set(fourWeekLogs.map((l) => l.date)).size || 1;
  const overallCompletionRate = totalHabits > 0
    ? Math.round((fourWeekLogs.length / (totalHabits * trackedDays)) * 100)
    : 0;

  // Real bar chart data
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const barChartData = useMemo(() => {
    if (totalHabits === 0) return dayNames.map((name) => ({ name, rate: 0 }));
    const dayCounts: Record<number, { completed: number; totalDays: number }> = {};
    for (let i = 0; i < 7; i++) dayCounts[i] = { completed: 0, totalDays: 0 };
    const fourWeekStart = subWeeks(new Date(), 4);
    const windowDays = eachDayOfInterval({ start: fourWeekStart, end: new Date() });
    for (const day of windowDays) {
      dayCounts[getDay(day)].totalDays++;
    }
    for (const log of fourWeekLogs) {
      const dow = getDay(new Date(log.date));
      dayCounts[dow].completed++;
    }
    return dayNames.map((name, i) => {
      const { completed, totalDays } = dayCounts[i];
      const possibleCompletions = totalDays * totalHabits;
      const rate = possibleCompletions > 0 ? Math.round((completed / possibleCompletions) * 100) : 0;
      return { name, rate };
    });
  }, [totalHabits, fourWeekLogs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Dedicated Analytics Hero Header */}
      <div className="bg-white border-2 border-[#161514] rounded-2xl p-4 sm:p-6 shadow-[4px_4px_0px_0px_#161514] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-[#CEF431] text-[#161514] text-[10px] font-mono font-black px-2 py-0.5 rounded-full border border-[#161514] uppercase">
              Analytics Command Center
            </span>
            <span className="text-[10px] font-mono font-bold text-[#161514]/70">
              HABIT VELOCITY & STREAK MATRIX
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-heading font-black text-[#161514] tracking-tight flex items-center gap-2">
            <BarChart2 className="size-6 text-[#161514] stroke-[2.5]" />
            <span>Habit Velocity & Heatmap</span>
          </h1>

          <p className="text-xs font-medium text-[#161514]/70 max-w-xl">
            Visualize your consistency over time with 30-day streak heatmaps and weekly completion rates.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF8F5] border-2 border-[#161514] shadow-[2px_2px_0px_#161514] shrink-0 font-mono text-xs font-black text-[#161514]">
          <Sparkles className="size-4 text-amber-500 fill-amber-400" />
          <span>{activeStreaksList.length} ACTIVE FLAMES</span>
        </div>
      </div>

      {/* 2. Leaderboard Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex items-center gap-4">
          <div className="size-11 rounded-xl bg-amber-300 border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
            <Flame className="size-5 fill-rose-600 text-rose-600" />
          </div>
          <div>
            <h5 className="text-[10px] font-heading font-black text-[#161514]/70 uppercase tracking-wider">
              Active Streaks
            </h5>
            <p className="text-2xl font-heading font-black text-[#161514] mt-0.5">
              {activeStreaksList.length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex items-center gap-4">
          <div className="size-11 rounded-xl bg-[#CEF431] border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
            <Award className="size-5 text-[#161514]" />
          </div>
          <div>
            <h5 className="text-[10px] font-heading font-black text-[#161514]/70 uppercase tracking-wider">
              Best Record
            </h5>
            <p className="text-2xl font-heading font-black text-[#161514] mt-0.5">
              {longestStreakValue} days
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border-2 border-[#161514] shadow-[3px_3px_0px_0px_#161514] flex items-center gap-4">
          <div className="size-11 rounded-xl bg-[#03D26F] border-2 border-[#161514] flex items-center justify-center text-[#161514] shadow-[1.5px_1.5px_0px_0px_#161514] shrink-0">
            <BarChart2 className="size-5 text-[#161514]" />
          </div>
          <div>
            <h5 className="text-[10px] font-heading font-black text-[#161514]/70 uppercase tracking-wider">
              Completion Rate
            </h5>
            <p className="text-2xl font-heading font-black text-[#161514] mt-0.5">
              {overallCompletionRate}%
            </p>
          </div>
        </div>
      </div>

      {/* 3. 30-Day Monthly Habit Heatmap */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#161514]/10 pb-3">
          <h3 className="font-heading font-black text-sm text-[#161514] uppercase tracking-wider flex items-center gap-2">
            <Calendar className="size-4" />
            <span>{format(today, "MMMM yyyy")} Heatmap</span>
          </h3>
          <span className="font-mono text-xs font-bold text-[#161514]/70">
            {daysInMonth.length} Days Tracked
          </span>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[10px] font-mono font-black text-[#161514]/70 uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Grid items */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {daysInMonth.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const completion = getCompletionPercentage(dayStr);
            const isCurrent = isSameDay(day, today);

            let bgClass = "bg-[#FAF8F5] text-[#161514]/40";
            if (completion === 100) bgClass = "bg-[#03D26F] text-[#161514] font-black shadow-[2px_2px_0px_0px_#161514]";
            else if (completion >= 50) bgClass = "bg-[#CEF431] text-[#161514] font-black shadow-[1.5px_1.5px_0px_0px_#161514]";
            else if (completion >= 20) bgClass = "bg-[#CEF431]/40 text-[#161514] shadow-[1px_1px_0px_0px_#161514]";

            return (
              <div
                key={dayStr}
                className={cn(
                  "aspect-square rounded-xl border-2 border-[#161514] flex items-center justify-center text-xs font-heading font-black transition-all relative select-none hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer",
                  bgClass,
                  isCurrent && "ring-2 ring-[#161514] ring-offset-2"
                )}
                title={`${format(day, "MMM d")}: ${completion}% complete`}
              >
                {format(day, "d")}
              </div>
            );
          })}
        </div>

        {/* Heatmap Color Legend */}
        <div className="flex items-center gap-3 sm:gap-4 pt-3 border-t-2 border-[#161514]/10 text-[10px] font-mono font-black text-[#161514]/80 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="size-3.5 rounded bg-[#FAF8F5] border-2 border-[#161514]" /> None
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3.5 rounded bg-[#CEF431]/40 border-2 border-[#161514]" /> 20%+
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3.5 rounded bg-[#CEF431] border-2 border-[#161514]" /> 50%+
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3.5 rounded bg-[#03D26F] border-2 border-[#161514]" /> 100% Conquered
          </span>
        </div>
      </div>

      {/* 4. Completion Rate by Day of Week BarChart */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#161514] shadow-[4px_4px_0px_0px_#161514] space-y-4">
        <h3 className="font-heading font-black text-sm text-[#161514] uppercase tracking-wider">
          Completion Rate by Day of Week (Past 4 Weeks)
        </h3>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#161514" fontSize={11} fontWeight={800} tickLine={false} axisLine={false} />
              <YAxis stroke="#161514" fontSize={11} fontWeight={800} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
              <Tooltip
                formatter={(v) => [`${v}%`, "Completion Rate"]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "2px solid #161514",
                  boxShadow: "3px 3px 0px 0px #161514",
                  fontFamily: "var(--font-heading)",
                  fontSize: "12px",
                  fontWeight: 800,
                  backgroundColor: "#FAF8F5",
                }}
              />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                {barChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.rate >= 75 ? "#03D26F" : entry.rate >= 50 ? "#CEF431" : "#FBCFE8"}
                    stroke="#161514"
                    strokeWidth={1.5}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Weekly Velocity & Habit Matrix */}
      <WeeklyVelocityAndHabitMatrix />
    </div>
  );
}
