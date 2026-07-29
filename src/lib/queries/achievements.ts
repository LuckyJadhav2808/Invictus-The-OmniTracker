import { useHabits, useStreaks } from "@/lib/queries/goals";
import { useTransactions, useSavingsGoals } from "@/lib/queries/money";
import { useStudySessions } from "@/lib/queries/study";

export interface AchievementBadge {
  id: string;
  title: string;
  desc: string;
  xp: number;
  unlocked: boolean;
  progressText?: string;
  icon: string;
}

export function useUserAchievements() {
  const { data: habits = [] } = useHabits();
  const { data: streaksData = [] } = useStreaks();
  const { data: transactions = [] } = useTransactions();
  const { data: savingsGoals = [] } = useSavingsGoals();
  const { data: studySessions = [] } = useStudySessions();

  // Ensure streaks is an array
  const streaksList = Array.isArray(streaksData) ? streaksData : [streaksData].filter(Boolean);

  // 1. Max Streak calculation
  const maxStreak = streaksList.reduce((max: number, s: any) => Math.max(max, s?.currentStreak || 0), 0);

  // 2. Total Study Hours calculation
  const totalStudyMinutes = studySessions.reduce((sum: number, s: any) => sum + (s?.durationMinutes || 0), 0);
  const totalStudyHours = totalStudyMinutes / 60;

  // 3. Completed Savings Goals calculation
  const completedSavings = savingsGoals.filter((g: any) => (g?.currentAmount || 0) >= (g?.targetAmount || 1)).length;

  // 4. Total habits count
  const activeHabitsCount = habits.filter((h: any) => !h?.archived).length;

  const badges: AchievementBadge[] = [
    {
      id: "streak_7",
      title: "7-Day Streak Initiator",
      desc: "Maintain an active habit streak for 7 consecutive days",
      xp: 100,
      unlocked: maxStreak >= 7,
      progressText: maxStreak >= 7 ? undefined : `${maxStreak} / 7 Days`,
      icon: "🔥",
    },
    {
      id: "habits_5_day",
      title: "Monk Mode Warrior",
      desc: "Maintain 5 or more active habit routines",
      xp: 150,
      unlocked: activeHabitsCount >= 5,
      progressText: `${activeHabitsCount} / 5 Routines`,
      icon: "🧘",
    },
    {
      id: "budget_10_tx",
      title: "Budget Optimizer",
      desc: "Log 10 or more transactions under your budget caps",
      xp: 120,
      unlocked: transactions.length >= 10,
      progressText: `${transactions.length} / 10 Logs`,
      icon: "💰",
    },
    {
      id: "study_10_hours",
      title: "Syllabus Marathoner",
      desc: "Log over 10 hours of total focused study time",
      xp: 200,
      unlocked: totalStudyHours >= 10,
      progressText: `${totalStudyHours.toFixed(1)} / 10 Hours`,
      icon: "📚",
    },
    {
      id: "streak_30",
      title: "30-Day Iron Will",
      desc: "Maintain a 30-day active habit streak across space",
      xp: 500,
      unlocked: maxStreak >= 30,
      progressText: `${maxStreak} / 30 Days`,
      icon: "👑",
    },
    {
      id: "savings_3",
      title: "Financial Mastermind",
      desc: "Successfully complete 3 savings target goals",
      xp: 350,
      unlocked: completedSavings >= 3,
      progressText: `${completedSavings} / 3 Targets`,
      icon: "💎",
    },
  ];

  const totalXP = badges.reduce((sum, b) => (b.unlocked ? sum + b.xp : sum), 0);
  const userLevel = Math.max(1, Math.floor(totalXP / 150) + 1);

  return {
    badges,
    totalXP,
    userLevel,
    maxStreak,
    totalStudyHours,
    completedSavings,
  };
}
