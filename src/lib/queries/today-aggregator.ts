"use client";

import { useMemo } from "react";
import { useTasks } from "@/lib/queries/tasks";
import { useHabits, useHabitLogs, useWaterLog } from "@/lib/queries/goals";
import { format, subDays, getHours, getDay } from "date-fns";

export interface TodayOverviewData {
  activeDate: string; // "YYYY-MM-DD"
  isNightOwlWindow: boolean;
  tasks: {
    all: any[];
    dueToday: any[];
    overdue: any[];
    completedToday: any[];
    completionPercent: number;
  };
  habits: {
    all: any[];
    dueToday: any[];
    completedToday: any[];
    pendingToday: any[];
    restDayHabits: any[];
    dailyCompletionPercent: number;
    isAllDueCompleted: boolean;
  };
  water: {
    amount: number;
    goal: number;
    percent: number;
  };
  isOverallConquered: boolean;
  isLoading: boolean;
}

/**
 * Unified Daily Timeline Stream (Benchmark: Things 3 / Cron)
 * Consolidated reactive aggregator with configurable day-start cutover boundary.
 */
export function useTodayOverview(
  explicitDate?: string,
  dayStartHour: number = 4 // 4:00 AM cutoff for night owls
): TodayOverviewData {
  const activeDate = useMemo(() => {
    if (explicitDate) return explicitDate;

    const now = new Date();
    const currentHour = getHours(now);

    // If current hour is before dayStartHour (e.g. 01:30 AM), count as previous day
    if (currentHour < dayStartHour) {
      return format(subDays(now, 1), "yyyy-MM-dd");
    }

    return format(now, "yyyy-MM-dd");
  }, [explicitDate, dayStartHour]);

  const isNightOwlWindow = useMemo(() => {
    const hour = getHours(new Date());
    return hour < dayStartHour;
  }, [dayStartHour]);

  const { data: allTasks = [], isLoading: tasksLoading } = useTasks();
  const { data: allHabits = [], isLoading: habitsLoading } = useHabits();
  const { data: habitLogs = [], isLoading: logsLoading } = useHabitLogs(activeDate);
  const { data: waterLog = { amount: 0 }, isLoading: waterLoading } = useWaterLog(activeDate);

  // Compute tasks breakdown
  const tasksMetrics = useMemo(() => {
    const dueToday = allTasks.filter(
      (t) => t.dueDate === activeDate && t.status !== "completed"
    );
    const overdue = allTasks.filter(
      (t) => t.dueDate && t.dueDate < activeDate && t.status !== "completed"
    );
    const completedToday = allTasks.filter(
      (t) => t.completedAt && t.completedAt.startsWith(activeDate)
    );

    const totalActive = dueToday.length + completedToday.length;
    const completionPercent =
      totalActive > 0 ? Math.round((completedToday.length / totalActive) * 100) : 100;

    return {
      all: allTasks,
      dueToday,
      overdue,
      completedToday,
      completionPercent,
    };
  }, [allTasks, activeDate]);

  // Compute habits breakdown with rest-day awareness
  const habitsMetrics = useMemo(() => {
    const dayOfWeek = getDay(new Date(activeDate));

    const isRestDay = (h: any) => {
      if (
        h.frequency?.type === "customDays" &&
        Array.isArray(h.frequency.daysOfWeek) &&
        h.frequency.daysOfWeek.length > 0
      ) {
        return !h.frequency.daysOfWeek.includes(dayOfWeek);
      }
      return false;
    };

    const dueToday = allHabits.filter((h) => !isRestDay(h));
    const restDayHabits = allHabits.filter((h) => isRestDay(h));

    const completedToday = allHabits.filter((h) =>
      habitLogs.some((l) => l.habitId === h.id && l.completed)
    );

    const pendingToday = dueToday.filter(
      (h) => !habitLogs.some((l) => l.habitId === h.id && l.completed)
    );

    const dailyCompletionPercent =
      dueToday.length > 0
        ? Math.round((completedToday.filter((h) => !isRestDay(h)).length / dueToday.length) * 100)
        : allHabits.length > 0 && completedToday.length === allHabits.length
        ? 100
        : 0;

    const isAllDueCompleted = dueToday.length > 0 && pendingToday.length === 0;

    return {
      all: allHabits,
      dueToday,
      completedToday,
      pendingToday,
      restDayHabits,
      dailyCompletionPercent,
      isAllDueCompleted,
    };
  }, [allHabits, habitLogs, activeDate]);

  // Compute water metrics
  const waterMetrics = useMemo(() => {
    const amount = waterLog?.amount || 0;
    const goal = 2500; // 2.5L standard hydration target
    const percent = Math.min(100, Math.round((amount / goal) * 100));
    return { amount, goal, percent };
  }, [waterLog]);

  const isOverallConquered =
    habitsMetrics.isAllDueCompleted && tasksMetrics.dueToday.length === 0;

  return {
    activeDate,
    isNightOwlWindow,
    tasks: tasksMetrics,
    habits: habitsMetrics,
    water: waterMetrics,
    isOverallConquered,
    isLoading: tasksLoading || habitsLoading || logsLoading || waterLoading,
  };
}
