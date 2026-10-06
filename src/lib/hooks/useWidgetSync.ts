import { Capacitor, registerPlugin } from "@capacitor/core";

export interface WidgetHabitItem {
  id: string;
  title: string;
  completed: boolean;
  streak?: number;
}

export interface WidgetGoalItem {
  id: string;
  title: string;
  progressPercentage: number;
  targetDate?: string;
  icon?: string;
}

export interface WidgetSyncData {
  safeToSpendDaily: number;
  remainingUpiBudget: number;
  remainingCashBudget: number;
  totalAvailableUpiBudget: number;
  totalAvailableCashBudget: number;
  currencySymbol: string;
  daysRemainingInMonth: number;
  targetMonthLabel: string;
  hasCashBudget: boolean;
  // Daily Tracking Additions
  todayExpense?: number;
  todayRemaining?: number;
  dailyBudgetTarget?: number;
  customDailyBudget?: number | null;
  isOverDailyBudget?: boolean;
  overDailyAmount?: number;
  // Habits Checklist Additions
  habitsTotalCount?: number;
  habitsCompletedCount?: number;
  habitsList?: WidgetHabitItem[];
  // Active Goal Additions
  activeGoal?: WidgetGoalItem;
}

interface WidgetBridgePluginType {
  updateWidgetData(options: { data: string }): Promise<{ success: boolean }>;
}

const WidgetBridge = registerPlugin<WidgetBridgePluginType>("WidgetBridge");

export function useWidgetSync() {
  const syncToWidget = async (data: WidgetSyncData) => {
    // Only invoke when running natively inside Capacitor on mobile
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await WidgetBridge.updateWidgetData({
        data: JSON.stringify(data),
      });
    } catch (err) {
      console.warn("Home screen widget sync skipped:", err);
    }
  };

  return { syncToWidget };
}
