import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { hydrateDeviceFromCloud } from "./device-hydration";
import { User } from "@/types";

describe("Cross-Device Data Hydration Engine", () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};

    const mockLocalStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = String(value);
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    };

    vi.stubGlobal("localStorage", mockLocalStorage);
    vi.stubGlobal("window", { localStorage: mockLocalStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("safely rejects hydration if user is null or guest-user", () => {
    expect(hydrateDeviceFromCloud(null as any)).toBe(false);
    expect(
      hydrateDeviceFromCloud({
        uid: "guest-user",
        email: "guest@invictus.local",
        displayName: "Guest",
        role: "user",
        timezone: "Asia/Kolkata",
        weekStartsOn: 1,
        currency: "INR",
        onboarded: true,
        modulesEnabled: { goals: true, study: true, money: true },
        createdAt: new Date().toISOString(),
      })
    ).toBe(false);
  });

  it("hydrates full device preferences and budget allowances from cloud user document", () => {
    // Pre-populate guest flags to test clean purge
    mockStorage["invictus_guest_mode"] = "true";
    mockStorage["invictus_guest_name"] = "Old Guest";
    mockStorage["invictus_demo_data_active"] = "true";

    const realUser: User = {
      uid: "user_z6agfo8i2_1786297920334",
      email: "khushiroongta0801@gmail.com",
      displayName: "Khushi Roongta",
      role: "user",
      timezone: "Asia/Kolkata",
      weekStartsOn: 1,
      currency: "INR",
      onboarded: true,
      modulesEnabled: { goals: true, study: true, money: true },
      createdAt: "2026-08-09T17:52:04.181Z",
      budgetPreferences: {
        upiBudget: 10000,
        cashBudget: 2000,
        monthlyBudget: 12000,
        customDailyBudget: 350,
        enableRollover: true,
        budgetViewMode: "monthly",
        smsReaderEnabled: true,
      },
    } as any;

    const result = hydrateDeviceFromCloud(realUser);
    expect(result).toBe(true);

    // Guest flags wiped
    expect(mockStorage["invictus_guest_mode"]).toBeUndefined();
    expect(mockStorage["invictus_guest_name"]).toBeUndefined();
    expect(mockStorage["invictus_demo_data_active"]).toBeUndefined();

    // Budget preferences hydrated into device storage
    expect(mockStorage["invictus_monthly_upi_budget"]).toBe("10000");
    expect(mockStorage["invictus_monthly_cash_budget"]).toBe("2000");
    expect(mockStorage["invictus_custom_daily_budget"]).toBe("350");
    expect(mockStorage["invictus_budget_rollover_enabled"]).toBe("true");
    expect(mockStorage["invictus_budget_view_mode"]).toBe("monthly");

    // Profile & Currency hydrated
    expect(mockStorage["invictus_currency"]).toBe("INR");
    expect(mockStorage["invictus_onboarded"]).toBe("true");

    const parsedProfile = JSON.parse(mockStorage["invictus_user_profile"]);
    expect(parsedProfile.displayName).toBe("Khushi Roongta");
    expect(parsedProfile.email).toBe("khushiroongta0801@gmail.com");
  });

  it("applies resilient safe budget defaults if cloud preferences are 0 or uninitialized", () => {
    const userWithoutBudget: User = {
      uid: "user_fresh_account_123",
      email: "newuser@example.com",
      displayName: "New Explorer",
      role: "user",
      timezone: "Asia/Kolkata",
      weekStartsOn: 1,
      currency: "INR",
      onboarded: true,
      modulesEnabled: { goals: true, study: true, money: true },
      createdAt: new Date().toISOString(),
    };

    const result = hydrateDeviceFromCloud(userWithoutBudget);
    expect(result).toBe(true);

    // Falls back to safe ₹8,000 UPI and ₹2,000 Cash defaults
    expect(mockStorage["invictus_monthly_upi_budget"]).toBe("8000");
    expect(mockStorage["invictus_monthly_cash_budget"]).toBe("2000");
    expect(mockStorage["invictus_budget_rollover_enabled"]).toBe("true");
  });
});
