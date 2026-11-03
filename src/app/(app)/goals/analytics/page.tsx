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
      <div className="bg-white dark:bg-[#161514] border border-[#E8E5DF] dark:border-[#2A2724] rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-amber-400/15 text-amber-800 dark:text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-400/30 uppercase">
              Analytics Command Center
            </span>
            <span className="text-[10px] font-mono font-bold text-[#6B6B6B] dark:text-[#A8A29E]">
              HABIT VELOCITY &amp; STREAK MATRIX
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-heading font-black text-[#161514] dark:text-stone-100 tracking-tight flex items-center gap-2">
            <BarChart2 className="size-6 text-[#161514] dark:text-stone-100 stroke-[2.2]" />
            <span>Habit Velocity &amp; Heatmap</span>
          </h1>

          <p className="text-xs text-[#6B6B6B] dark:text-[#A8A29E] max-w-xl">
            Visualize your consistency over time with 30-day streak heatmaps and weekly completion rates.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724] shrink-0 font-mono text-xs font-bold text-[#161514] dark:text-stone-200 shadow-none">
          <Sparkles className="size-3.5 text-amber-500 fill-amber-400" />
          <span>{activeStreaksList.length} ACTIVE FLAMES</span>
        </div>
      </div>

      {/* 2. Leaderboard Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white dark:bg-[#161514] rounded-2xl p-4 sm:p-5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Flame className="size-5 fill-rose-500 text-rose-500" />
          </div>
          <div>
            <h5 className="text-[10px] font-mono font-bold text-[#6B6B6B] dark:text-[#A8A29E] uppercase tracking-wider">
              Active Streaks
            </h5>
            <p className="text-2xl font-heading font-black text-[#161514] dark:text-stone-100 font-mono tracking-tight mt-0.5">
              {activeStreaksList.length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161514] rounded-2xl p-4 sm:p-5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Award className="size-5" />
          </div>
          <div>
            <h5 className="text-[10px] font-mono font-bold text-[#6B6B6B] dark:text-[#A8A29E] uppercase tracking-wider">
              Best Record
            </h5>
            <p className="text-2xl font-heading font-black text-[#161514] dark:text-stone-100 font-mono tracking-tight mt-0.5">
              {longestStreakValue} <span className="text-xs font-normal text-[#6B6B6B] dark:text-[#A8A29E]">days</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161514] rounded-2xl p-4 sm:p-5 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-[#03D26F]/10 border border-[#03D26F]/20 flex items-center justify-center text-[#047857] dark:text-[#03D26F] shrink-0">
            <BarChart2 className="size-5" />
          </div>
          <div>
            <h5 className="text-[10px] font-mono font-bold text-[#6B6B6B] dark:text-[#A8A29E] uppercase tracking-wider">
              Completion Rate
            </h5>
            <p className="text-2xl font-heading font-black text-[#161514] dark:text-stone-100 font-mono tracking-tight mt-0.5">
              {overallCompletionRate}%
            </p>
          </div>
        </div>
      </div>

      {/* 3. 30-Day Monthly Habit Heatmap */}
      <div className="bg-white dark:bg-[#161514] rounded-2xl p-5 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E5DF] dark:border-[#2A2724] pb-3">
          <h3 className="font-heading font-black text-sm text-[#161514] dark:text-stone-100 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="size-4 text-[#6B6B6B] dark:text-[#A8A29E]" />
            <span>{format(today, "MMMM yyyy")} Heatmap</span>
          </h3>
          <span className="font-mono text-xs text-[#6B6B6B] dark:text-[#A8A29E]">
            {daysInMonth.length} Days Tracked
          </span>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[10px] font-mono font-bold text-[#6B6B6B] dark:text-[#A8A29E] uppercase tracking-wider">
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

            let bgClass = "bg-[#FAF8F5] dark:bg-[#1C1A18] text-[#161514]/40 dark:text-stone-500 border-[#E8E5DF] dark:border-[#2A2724]";
            if (completion === 100) {
              bgClass = "bg-[#03D26F] text-[#161514] font-black border-[#03D26F] shadow-xs";
            } else if (completion >= 50) {
              bgClass = "bg-[#A7F3D0] dark:bg-emerald-800/50 text-emerald-950 dark:text-emerald-100 font-bold border-emerald-400 dark:border-emerald-700/50";
            } else if (completion >= 20) {
              bgClass = "bg-[#DCFAE5] dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800/40";
            }

            return (
              <div
                key={dayStr}
                className={cn(
                  "aspect-square rounded-lg border flex items-center justify-center text-xs font-mono font-bold transition-all relative select-none hover:scale-105 cursor-pointer",
                  bgClass,
                  isCurrent && "ring-2 ring-[#161514] dark:ring-white ring-offset-2 dark:ring-offset-[#161514]"
                )}
                title={`${format(day, "MMM d")}: ${completion}% complete`}
              >
                {format(day, "d")}
              </div>
            );
          })}
        </div>

        {/* Heatmap Color Legend */}
        <div className="flex items-center gap-3 sm:gap-4 pt-3 border-t border-[#E8E5DF] dark:border-[#2A2724] text-[10px] font-mono font-medium text-[#6B6B6B] dark:text-[#A8A29E] flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-[#FAF8F5] dark:bg-[#1C1A18] border border-[#E8E5DF] dark:border-[#2A2724]" /> None
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-[#DCFAE5] dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/40" /> 20%+
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-[#A7F3D0] dark:bg-emerald-800/50 border border-emerald-400 dark:border-emerald-700/50" /> 50%+
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-[#03D26F] border border-[#03D26F]" /> 100% Conquered
          </span>
        </div>
      </div>

      {/* 4. Completion Rate by Day of Week BarChart */}
      <div className="bg-white dark:bg-[#161514] rounded-2xl p-5 sm:p-6 border border-[#E8E5DF] dark:border-[#2A2724] shadow-xs space-y-4">
        <h3 className="font-heading font-black text-sm text-[#161514] dark:text-stone-100 uppercase tracking-wider">
          Completion Rate by Day of Week (Past 4 Weeks)
        </h3>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#888888" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
              <Tooltip
                formatter={(v) => [`${v}%`, "Completion Rate"]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E8E5DF",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  fontFamily: "var(--font-heading)",
                  fontSize: "12px",
                  fontWeight: 700,
                  backgroundColor: "#FFFFFF",
                }}
              />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                {barChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.rate >= 75 ? "#03D26F" : entry.rate >= 50 ? "#A7F3D0" : "#F1EFEA"}
                    stroke="#E8E5DF"
                    strokeWidth={1}
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
