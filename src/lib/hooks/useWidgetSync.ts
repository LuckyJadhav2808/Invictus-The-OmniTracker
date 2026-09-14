import { Capacitor, registerPlugin } from "@capacitor/core";

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
