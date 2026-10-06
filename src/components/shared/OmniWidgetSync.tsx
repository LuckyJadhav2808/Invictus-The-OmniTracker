"use client";

import { useEffect, useMemo } from "react";
import { useCategories, useTransactions, useSavingsGoals } from "@/lib/queries/money";
import { useHabits, useHabitLogs, useStreaks } from "@/lib/queries/goals";
import { useAuth } from "@/components/shared/AuthProvider";
import { useUIStore } from "@/store/ui-store";
import { useWidgetSync } from "@/lib/hooks/useWidgetSync";
import { computeMonthlyBudgetStats, computeDailyBudgetStats } from "@/lib/utils/budget-rollover";
import { format } from "date-fns";

export function OmniWidgetSync() {
  const { user } = useAuth();
  const { widgetTheme } = useUIStore();
  const { syncToWidget } = useWidgetSync();
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const currentMonthKey = useMemo(() => format(new Date(), "yyyy-MM"), []);

  // Queries
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions();
  const { data: savingsGoals = [] } = useSavingsGoals();
  const { data: habits = [] } = useHabits();
  const { data: logs = [] } = useHabitLogs(todayStr);
  const { data: streaks = {} } = useStreaks();

  // Read User Preferences
  const baseUpiBudget = useMemo(() => {
    if (typeof window === "undefined") return 9000;
    try {
      const savedUpi = localStorage.getItem("invictus_monthly_upi_budget");
      if (savedUpi !== null && !isNaN(Number(savedUpi)) && Number(savedUpi) >= 0) {
        return Number(savedUpi);
      }
      const legacySaved = localStorage.getItem("invictus_monthly_budget_target");
      if (legacySaved !== null && !isNaN(Number(legacySaved)) && Number(legacySaved) >= 0) {
        return Number(legacySaved);
      }
    } catch {}
    return 9000;
  }, []);

  const baseCashBudget = useMemo(() => {
    if (typeof window === "undefined") return 0;
    try {
      const savedCash = localStorage.getItem("invictus_monthly_cash_budget");
      if (savedCash !== null && !isNaN(Number(savedCash)) && Number(savedCash) >= 0) {
        return Number(savedCash);
      }
    } catch {}
    return 0;
  }, []);

  const enableRollover = useMemo(() => {
    if (typeof window === "undefined") return true;
    try {
      const saved = localStorage.getItem("invictus_budget_rollover_enabled");
      if (saved !== null) return saved === "true";
    } catch {}
    return true;
  }, []);

  const customDailyBudget = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("invictus_custom_daily_budget");
      if (saved !== null && !isNaN(Number(saved)) && Number(saved) > 0) {
        return Number(saved);
      }
    } catch {}
    return null;
  }, []);

  const currencySymbol = useMemo(() => {
    let cur = "INR";
    if (typeof window !== "undefined") {
      try {
        const isGuest = localStorage.getItem("invictus_guest_mode") === "true";
        if (isGuest) {
          const profileStr = localStorage.getItem("invictus_user_profile");
          if (profileStr) {
            const p = JSON.parse(profileStr);
            if (p.currency) cur = p.currency;
          }
        } else if (user?.currency) {
          cur = user.currency;
        }
      } catch {}
    }
    switch (cur) {
      case "USD": return "$";
      case "EUR": return "€";
      case "GBP": return "£";
      case "JPY": return "¥";
      default: return "₹";
    }
  }, [user]);

  // Compute Money Budget Stats
  const budgetStats = useMemo(() => {
    return computeMonthlyBudgetStats({
      transactions,
      categories,
      targetMonthKey: currentMonthKey,
      baseUpiBudget,
      baseCashBudget,
      enableRollover,
      currencySymbol,
    });
  }, [transactions, categories, currentMonthKey, baseUpiBudget, baseCashBudget, enableRollover, currencySymbol]);

  // Compute Daily Budget Stats
  const dailyStats = useMemo(() => {
    return computeDailyBudgetStats({
      transactions,
      monthlyStats: budgetStats,
      customDailyBudget,
    });
  }, [transactions, budgetStats, customDailyBudget]);

  // Compute Habit Checklist for Widget
  const habitsList = useMemo(() => {
    return habits.slice(0, 3).map((h) => {
      const isDone = logs.some((l) => l.habitId === h.id && l.completed);
      const streak = streaks[h.id]?.currentStreak || 0;
      return {
        id: h.id,
        title: h.title,
        completed: isDone,
        streak,
      };
    });
  }, [habits, logs, streaks]);

  const habitsCompletedCount = useMemo(() => {
    return habits.filter((h) => logs.some((l) => l.habitId === h.id && l.completed)).length;
  }, [habits, logs]);

  // Compute Active Goal for Widget
  const activeGoal = useMemo(() => {
    // 1. Check savings goals first
    if (savingsGoals && savingsGoals.length > 0) {
      const topSaving = savingsGoals.find((g: any) => {
        const curr = Number(g.currentAmount || 0);
        const tgt = Number(g.targetAmount || 1);
        return curr < tgt;
      }) || savingsGoals[0];

      if (topSaving) {
        const curr = Number(topSaving.currentAmount || 0);
        const tgt = Number(topSaving.targetAmount || 1);
        const pct = Math.min(100, Math.round((curr / tgt) * 100));
        return {
          id: topSaving.id || topSaving._id || "goal_saving",
          title: topSaving.name || topSaving.title || "Savings Milestone",
          progressPercentage: pct,
          icon: topSaving.icon || "💰",
          targetDate: topSaving.targetDate,
        };
      }
    }

    // 2. Check study target from user profile
    if ((user as any)?.studyTarget) {
      return {
        id: "goal_study",
        title: (user as any).studyTarget.examName || "Exam Preparation",
        progressPercentage: 60,
        icon: "📚",
        targetDate: (user as any).studyTarget.examDate,
      };
    }

    // 3. Fallback inspiring goal
    return {
      id: "goal_default",
      title: "Mastery & Focus",
      progressPercentage: 65,
      icon: "🎯",
    };
  }, [savingsGoals, user]);

  // Global Widget Sync Effect
  useEffect(() => {
    syncToWidget({
      safeToSpendDaily: budgetStats.dailySafeToSpend,
      remainingUpiBudget: budgetStats.remainingUpiBudget,
      remainingCashBudget: budgetStats.remainingCashBudget,
      totalAvailableUpiBudget: budgetStats.totalAvailableUpiBudget,
      totalAvailableCashBudget: budgetStats.totalAvailableCashBudget,
      currencySymbol,
      daysRemainingInMonth: budgetStats.daysRemainingInMonth,
      targetMonthLabel: budgetStats.targetMonthLabel.split(" ")[0],
      hasCashBudget: budgetStats.baseCashBudget > 0 || budgetStats.totalAvailableCashBudget > 0,
      todayExpense: dailyStats.todayExpense,
      todayRemaining: dailyStats.todayRemaining,
      dailyBudgetTarget: dailyStats.dailyBudgetTarget,
      isOverDailyBudget: dailyStats.isOverDailyBudget,
      overDailyAmount: dailyStats.overDailyAmount,
      habitsTotalCount: habits.length,
      habitsCompletedCount,
      habitsList,
      activeGoal,
      widgetTheme,
    });
  }, [budgetStats, dailyStats, currencySymbol, habits.length, habitsCompletedCount, habitsList, activeGoal, widgetTheme, syncToWidget]);

  return null;
}
