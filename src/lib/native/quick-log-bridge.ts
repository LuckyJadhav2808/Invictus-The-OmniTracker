"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";

export interface QuickLogBridgePluginType {
  syncBudgetTelemetry(options: { safeToSpend: number }): Promise<{ success: boolean; safeToSpend: number }>;
  setAmbientDockEnabled(options: { enabled: boolean }): Promise<{ success: boolean; enabled: boolean }>;
  isAmbientDockEnabled(): Promise<{ enabled: boolean }>;
  launchQuickLogDialog(): Promise<{ success: boolean }>;
}

const QuickLogBridge = registerPlugin<QuickLogBridgePluginType>("QuickLogBridge");

function getLocalStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage;
  }
  return null;
}

export const NativeQuickLogBridge = {
  isSupported(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  },

  async syncBudgetTelemetry(safeToSpend: number): Promise<{ success: boolean; safeToSpend: number }> {
    const storage = getLocalStorage();
    if (storage) {
      storage.setItem("invictus_ambient_dock_budget", String(safeToSpend));
    }

    if (!this.isSupported()) {
      return { success: true, safeToSpend };
    }

    try {
      return await QuickLogBridge.syncBudgetTelemetry({ safeToSpend });
    } catch (err) {
      console.warn("[QuickLogBridge] syncBudgetTelemetry native fallback", err);
      return { success: false, safeToSpend };
    }
  },

  async setAmbientDockEnabled(enabled: boolean): Promise<{ success: boolean; enabled: boolean }> {
    const storage = getLocalStorage();
    if (storage) {
      storage.setItem("invictus_ambient_dock_enabled", enabled ? "true" : "false");
    }

    if (!this.isSupported()) {
      return { success: true, enabled };
    }

    try {
      return await QuickLogBridge.setAmbientDockEnabled({ enabled });
    } catch (err) {
      console.warn("[QuickLogBridge] setAmbientDockEnabled native fallback", err);
      return { success: false, enabled };
    }
  },

  async isAmbientDockEnabled(): Promise<boolean> {
    if (!this.isSupported()) {
      const storage = getLocalStorage();
      if (storage) {
        return storage.getItem("invictus_ambient_dock_enabled") !== "false";
      }
      return true;
    }

    try {
      const res = await QuickLogBridge.isAmbientDockEnabled();
      return res.enabled;
    } catch {
      return true;
    }
  },

  async launchQuickLogDialog(): Promise<boolean> {
    if (!this.isSupported()) {
      // Browser fallback: redirect to /quick-log or trigger quick modal
      if (typeof window !== "undefined") {
        window.location.href = "/quick-log";
      }
      return true;
    }

    try {
      const res = await QuickLogBridge.launchQuickLogDialog();
      return res.success;
    } catch {
      return false;
    }
  },

  async requestNotificationPermission(): Promise<boolean> {
    if (!this.isSupported()) return true;
    try {
      if (typeof (QuickLogBridge as any).requestPermissions === "function") {
        const res = await (QuickLogBridge as any).requestPermissions({ permissions: ["notifications"] });
        return res?.notifications === "granted";
      }
      return true;
    } catch {
      return false;
    }
  },
};
