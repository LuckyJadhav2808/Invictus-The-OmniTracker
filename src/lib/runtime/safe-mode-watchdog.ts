"use client";

import { diagnosticLogger } from "./diagnostic-logger";

const CRASH_COUNTER_KEY = "invictus_boot_crash_counter";
const CRASH_THRESHOLD = 3;
const HEALTHY_BOOT_WINDOW_MS = 15000;

export interface SafeModeStatus {
  isSafeMode: boolean;
  crashCount: number;
}

class BootloaderWatchdog {
  private static instance: BootloaderWatchdog;
  private crashCount: number = 0;
  private safeModeActive: boolean = false;
  private healthyTimer: any = null;
  private listeners: Set<(status: SafeModeStatus) => void> = new Set();

  private constructor() {
    if (typeof window !== "undefined") {
      this.evaluateStartupHealth();
    }
  }

  public static getInstance(): BootloaderWatchdog {
    if (!BootloaderWatchdog.instance) {
      BootloaderWatchdog.instance = new BootloaderWatchdog();
    }
    return BootloaderWatchdog.instance;
  }

  private evaluateStartupHealth() {
    try {
      const stored = localStorage.getItem(CRASH_COUNTER_KEY);
      this.crashCount = stored ? parseInt(stored, 10) : 0;

      // Increment crash counter immediately on launch
      this.crashCount += 1;
      localStorage.setItem(CRASH_COUNTER_KEY, this.crashCount.toString());

      diagnosticLogger.log(
        "system",
        "BOOTLOADER",
        `Boot attempt #${this.crashCount} registered`
      );

      // Check if threshold breached
      if (this.crashCount >= CRASH_THRESHOLD) {
        this.safeModeActive = true;
        diagnosticLogger.log(
          "warn",
          "CIRCUIT_BREAKER",
          `Safe mode triggered: ${this.crashCount} consecutive startup crashes detected`
        );
      }

      // Schedule healthy reset after 15s clean execution
      this.healthyTimer = setTimeout(() => {
        this.markBootAsHealthy();
      }, HEALTHY_BOOT_WINDOW_MS);
    } catch {
      this.crashCount = 0;
    }
  }

  public markBootAsHealthy() {
    try {
      localStorage.setItem(CRASH_COUNTER_KEY, "0");
      this.crashCount = 0;
      this.safeModeActive = false;
      diagnosticLogger.log("info", "BOOTLOADER", "Startup verified healthy; watchdog reset");
      this.notifyListeners();
    } catch {}
  }

  public getStatus(): SafeModeStatus {
    return {
      isSafeMode: this.safeModeActive,
      crashCount: this.crashCount,
    };
  }

  public resetWatchdog() {
    this.markBootAsHealthy();
  }

  public subscribe(listener: (status: SafeModeStatus) => void) {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l(this.getStatus()));
  }

  /**
   * Emergency Self-Healing: Purges volatile local caches while preserving user's credentials
   */
  public purgeVolatileCaches() {
    if (typeof window === "undefined") return;
    try {
      const preserveKeys = [
        "invictus_custom_session",
        "invictus_active_user",
        "invictus_onboarded",
      ];
      const preserved: Record<string, string | null> = {};
      preserveKeys.forEach((k) => {
        preserved[k] = localStorage.getItem(k);
      });

      // Clear localStorage
      localStorage.clear();

      // Restore session credentials
      Object.entries(preserved).forEach(([k, v]) => {
        if (v !== null) localStorage.setItem(k, v);
      });

      // Reset crash counter
      localStorage.setItem(CRASH_COUNTER_KEY, "0");

      diagnosticLogger.log("system", "SELF_HEAL", "Volatile caches purged; session preserved");
    } catch (err) {
      console.error("Purge caches failed:", err);
    }
  }
}

export const safeModeWatchdog = BootloaderWatchdog.getInstance();
