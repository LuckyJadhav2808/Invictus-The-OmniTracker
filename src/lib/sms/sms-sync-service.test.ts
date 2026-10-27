import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock localStorage and window for Node environment
const storage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, val: string) => {
    storage[key] = val;
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  },
  key: (i: number) => Object.keys(storage)[i] ?? null,
  length: 0,
};

(globalThis as any).localStorage = mockLocalStorage;
(globalThis as any).window = globalThis;

import {
  getPresetDateRange,
  getLastAutoScanTimestamp,
  setLastAutoScanTimestamp,
  AUTO_SCAN_COOLDOWN_MS,
  autoScanTodayBankSms,
  syncRecentBankSms,
} from "./sms-sync-service";

describe("SMS Sync Service & On-Launch Auto-Scanner", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe("getPresetDateRange", () => {
    it("computes 'today' range with a 2-hour late-night buffer", () => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const expectedBufferStart = Math.max(0, startOfToday - 2 * 60 * 60 * 1000);

      const range = getPresetDateRange("today");
      expect(range.startTime).toBe(expectedBufferStart);
      expect(range.endTime).toBeGreaterThanOrEqual(startOfToday);
      expect(range.label).toContain("Today");
    });

    it("computes 'yesterday' full 24-hour range accurately", () => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
      const endOfYesterday = startOfToday - 1;

      const range = getPresetDateRange("yesterday");
      expect(range.startTime).toBe(startOfYesterday);
      expect(range.endTime).toBe(endOfYesterday);
      expect(range.label).toContain("Yesterday");
    });

    it("computes 'today_and_yesterday' range spanning from start of yesterday to now + 12h", () => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

      const range = getPresetDateRange("today_and_yesterday");
      expect(range.startTime).toBe(startOfYesterday);
      expect(range.endTime).toBeGreaterThan(startOfToday);
      expect(range.label).toContain("Today & Yesterday");
    });

    it("computes 'past_7_days' lookback span", () => {
      const range = getPresetDateRange("past_7_days");
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(range.endTime - range.startTime).toBeGreaterThanOrEqual(sevenDaysMs - 1000);
      expect(range.label).toBe("Past 7 Days");
    });

    it("computes 'this_month' starting on the 1st of the current month", () => {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      const range = getPresetDateRange("this_month");
      expect(range.startTime).toBe(firstOfMonth);
      expect(range.label).toContain("This Month");
    });
  });

  describe("Cooldown Guardrail", () => {
    it("persists and reads last auto-scan timestamp in localStorage", () => {
      expect(getLastAutoScanTimestamp()).toBeNull();
      const ts = 1785000000000;
      setLastAutoScanTimestamp(ts);
      expect(getLastAutoScanTimestamp()).toBe(ts);
    });

    it("enforces 15-minute cooldown constant", () => {
      expect(AUTO_SCAN_COOLDOWN_MS).toBe(15 * 60 * 1000);
    });

    it("autoScanTodayBankSms returns null safely in web environment without crashing", async () => {
      const result = await autoScanTodayBankSms([], []);
      expect(result).toBeNull();
    });

    it("syncRecentBankSms returns empty results cleanly on non-native environments", async () => {
      const result = await syncRecentBankSms([], []);
      expect(result).toEqual({
        scannedCount: 0,
        parsedCount: 0,
        savedCount: 0,
        transactions: [],
      });
    });
  });
});
