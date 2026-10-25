import { useState, useMemo, useEffect } from "react";
import { Sunrise, Zap, Moon } from "lucide-react";

export type DaypartMode = "auto" | "dawn" | "forge" | "night";
export type EffectiveDaypart = "dawn" | "forge" | "night";

export interface DaypartConfig {
  id: EffectiveDaypart;
  title: string;
  greeting: string;
  subtitle: string;
  accentBg: string;
  badgeBg: string;
  textColor: string;
  badgeText: string;
  icon: typeof Sunrise;
  glowBorder: string;
}

export const DAYPART_CONFIGS: Record<EffectiveDaypart, DaypartConfig> = {
  dawn: {
    id: "dawn",
    title: "Dawn Patrol",
    greeting: "Rise & Conquer, Gladiator",
    subtitle: "Morning momentum, hydration & routine check",
    accentBg: "bg-[#CEF431]",
    badgeBg: "bg-[#CEF431]",
    textColor: "text-[#161514]",
    badgeText: "DAWN PATROL • 06:00-12:00",
    icon: Sunrise,
    glowBorder: "border-[#161514]",
  },
  forge: {
    id: "forge",
    title: "The Forge",
    greeting: "Deep Work Sprint in Progress",
    subtitle: "Lock in flow state, track budget & conquer priorities",
    accentBg: "bg-[#C084FC]",
    badgeBg: "bg-[#C084FC]",
    textColor: "text-[#161514]",
    badgeText: "THE FORGE • 12:00-18:00",
    icon: Zap,
    glowBorder: "border-[#161514]",
  },
  night: {
    id: "night",
    title: "Night Fortress",
    greeting: "Evening Reflection & Rest",
    subtitle: "Review today's ledger, preserve streak & plan tomorrow",
    accentBg: "bg-[#161514]",
    badgeBg: "bg-[#161514]",
    textColor: "text-white",
    badgeText: "NIGHT FORTRESS • 18:00-24:00",
    icon: Moon,
    glowBorder: "border-[#161514]",
  },
};

export function getEffectiveDaypartFromHour(hour: number): EffectiveDaypart {
  if (hour >= 5 && hour < 12) return "dawn";
  if (hour >= 12 && hour < 18) return "forge";
  return "night";
}

export interface DailyConquestMetrics {
  overallScore: number; // 0 to 100
  habitPercent: number; // 0 to 100
  completedHabitsCount: number;
  totalHabitsCount: number;
  studyPercent: number; // 0 to 100
  studyHoursFormatted: string; // e.g. "2.5h"
  studyTargetHoursFormatted: string; // e.g. "4.0h"
  budgetPercent: number; // 0 to 100
  spentToday: number;
  dailySafeToSpend: number;
  remainingSafeToSpend: number;
  currencySymbol: string;
}

const SNAPSHOT_STORAGE_KEY = "invictus_today_conquest_snapshot";

/**
 * Computes composite daily momentum metrics across Habits, Study Focus, and Financial Defense.
 * Weighted: Habits (35%), Study (35%), Budget (30%).
 */
export function computeDailyConquestScore({
  completedHabitsCount,
  totalHabitsCount,
  studyMinutesToday,
  studyTargetHours = 4.0,
  spentToday,
  dailySafeToSpend,
  currencySymbol = "₹",
}: {
  completedHabitsCount: number;
  totalHabitsCount: number;
  studyMinutesToday: number;
  studyTargetHours?: number;
  spentToday: number;
  dailySafeToSpend: number;
  currencySymbol?: string;
}): DailyConquestMetrics {
  // 1. Habit Percent (Weight: 35%)
  const habitPercent =
    totalHabitsCount > 0
      ? Math.min(100, Math.round((completedHabitsCount / totalHabitsCount) * 100))
      : 100;

  // 2. Study Percent (Weight: 35%)
  const studyTargetMinutes = studyTargetHours * 60;
  const studyPercent =
    studyTargetMinutes > 0
      ? Math.min(100, Math.round((studyMinutesToday / studyTargetMinutes) * 100))
      : 0;
  const studyHoursFormatted = (studyMinutesToday / 60).toFixed(1) + "h";
  const studyTargetHoursFormatted = studyTargetHours.toFixed(1) + "h";

  // 3. Budget Percent (Weight: 30%)
  let budgetPercent = 100;
  const remainingSafeToSpend = Math.max(0, dailySafeToSpend - spentToday);

  if (dailySafeToSpend > 0) {
    if (spentToday <= dailySafeToSpend) {
      budgetPercent = Math.round(((dailySafeToSpend - spentToday) / dailySafeToSpend) * 100);
    } else {
      budgetPercent = 0; // Over budget
    }
  }

  // 4. Composite Weighted Score
  const weightedHabit = totalHabitsCount > 0 ? (habitPercent / 100) * 35 : 35;
  const weightedStudy = (studyPercent / 100) * 35;
  const weightedBudget = (budgetPercent / 100) * 30;

  const overallScore = Math.min(
    100,
    Math.max(0, Math.round(weightedHabit + weightedStudy + weightedBudget))
  );

  return {
    overallScore,
    habitPercent,
    completedHabitsCount,
    totalHabitsCount,
    studyPercent,
    studyHoursFormatted,
    studyTargetHoursFormatted,
    budgetPercent,
    spentToday,
    dailySafeToSpend,
    remainingSafeToSpend,
    currencySymbol,
  };
}

export function useTodayCockpitViewModel() {
  const [daypartMode, setDaypartMode] = useState<DaypartMode>("auto");
  const [currentHour, setCurrentHour] = useState<number>(() => new Date().getHours());

  // Update current hour periodically (every 60s)
  useEffect(() => {
    const updateHour = () => setCurrentHour(new Date().getHours());
    const interval = setInterval(updateHour, 60000);
    return () => clearInterval(interval);
  }, []);

  // Compute effective daypart
  const effectiveDaypart: EffectiveDaypart = useMemo(() => {
    if (daypartMode !== "auto") return daypartMode;
    return getEffectiveDaypartFromHour(currentHour);
  }, [daypartMode, currentHour]);

  const activeConfig = DAYPART_CONFIGS[effectiveDaypart];

  return {
    daypartMode,
    setDaypartMode,
    effectiveDaypart,
    activeConfig,
  };
}
