import { type Habit, type Streak, type Category, type Transaction, type TaskItem } from "@/types";
import { format } from "date-fns";

export interface Insight {
  id: string;
  module: "goals" | "tasks" | "money";
  text: string;
  severity: "info" | "positive" | "warning";
}

export function generateInsights({
  habits = [],
  streaks = {},
  categories = [],
  transactions = [],
  tasks = [],
}: {
  habits?: Habit[];
  streaks?: Record<string, Streak>;
  categories?: Category[];
  transactions?: Transaction[];
  tasks?: TaskItem[];
}): Insight[] {
  const insights: Insight[] = [];

  // 1. Habits Insight
  Object.values(streaks).forEach((streak) => {
    const habit = habits.find((h) => h.id === streak.habitId);
    if (habit && streak.currentStreak >= 3) {
      insights.push({
        id: `streak-${habit.id}-${streak.currentStreak}`,
        module: "goals",
        text: `Awesome! You're on a ${streak.currentStreak}-day streak for "${habit.title}". Keep it burning! 🔥`,
        severity: "positive",
      });
    }
  });

  // 2. Tasks Insight
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  if (completedTasks > 0) {
    insights.push({
      id: "tasks-completed",
      module: "tasks",
      text: `Great execution! You have conquered ${completedTasks} priority tasks so far. 🎯`,
      severity: "positive",
    });
  } else if (tasks.length > 0) {
    insights.push({
      id: "tasks-backlog",
      module: "tasks",
      text: "You have actionable items on your board. Knock out a P1 task to build momentum! ⚡",
      severity: "info",
    });
  }

  // 3. Money Insight
  const currentMonthStr = format(new Date(), "yyyy-MM");
  const monthlyExpenses = transactions
    .filter((t) => t.type === "expense" && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  categories
    .filter((c) => c.type === "expense" && c.monthlyBudget)
    .forEach((c) => {
      const budget = c.monthlyBudget || 0;
      const spend = transactions
        .filter((t) => t.categoryId === c.id && t.type === "expense" && t.date.startsWith(currentMonthStr))
        .reduce((sum, t) => sum + t.amount, 0);

      const ratio = budget > 0 ? spend / budget : 0;
      if (ratio >= 0.85) {
        insights.push({
          id: `budget-warn-${c.id}-${currentMonthStr}`,
          module: "money",
          text: `Budget alert: You've consumed ${(ratio * 100).toFixed(0)}% of your "${c.name}" budget! ⚠️`,
          severity: "warning",
        });
      }
    });

  if (monthlyExpenses > 0 && insights.length < 3) {
    insights.push({
      id: "money-info",
      module: "money",
      text: "Tip: Log cash transactions as soon as they happen to keep your budgets clean. 💸",
      severity: "info",
    });
  }

  return insights;
}
