import { describe, it, expect, vi, beforeEach } from "vitest";
import { NativeQuickLogBridge } from "./quick-log-bridge";

const mockStorage: Record<string, string> = {};
if (typeof global !== "undefined" && !global.localStorage) {
  (global as any).localStorage = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = String(value);
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) {
        delete mockStorage[k];
      }
    },
  };
}

describe("NativeQuickLogBridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  it("should detect non-native environment in test runner", () => {
    expect(NativeQuickLogBridge.isSupported()).toBe(false);
  });

  it("should sync budget telemetry gracefully to localStorage in fallback mode", async () => {
    const res = await NativeQuickLogBridge.syncBudgetTelemetry(1250);
    expect(res.success).toBe(true);
    expect(res.safeToSpend).toBe(1250);
    expect(localStorage.getItem("invictus_ambient_dock_budget")).toBe("1250");
  });

  it("should persist ambient dock toggle state in localStorage", async () => {
    await NativeQuickLogBridge.setAmbientDockEnabled(false);
    expect(localStorage.getItem("invictus_ambient_dock_enabled")).toBe("false");

    const isEnabled = await NativeQuickLogBridge.isAmbientDockEnabled();
    expect(isEnabled).toBe(false);

    await NativeQuickLogBridge.setAmbientDockEnabled(true);
    expect(localStorage.getItem("invictus_ambient_dock_enabled")).toBe("true");

    const isEnabledAgain = await NativeQuickLogBridge.isAmbientDockEnabled();
    expect(isEnabledAgain).toBe(true);
  });

  it("should handle getPendingExpenses and clearPendingExpenses gracefully in fallback mode", async () => {
    const pending = await NativeQuickLogBridge.getPendingExpenses();
    expect(Array.isArray(pending)).toBe(true);
    expect(pending.length).toBe(0);

    const cleared = await NativeQuickLogBridge.clearPendingExpenses();
    expect(cleared).toBe(true);
  });
});
