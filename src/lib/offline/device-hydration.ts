import { User } from "@/types";

/**
 * Hydrates the local device storage (localStorage) from the authenticated cloud user document.
 * Guarantees that when a user logs in on a new device (e.g. mobile, tablet, second computer),
 * all budget preferences, currency, profile telemetry, and settings are restored instantly with zero delay.
 */
export function hydrateDeviceFromCloud(user: User): boolean {
  if (typeof window === "undefined" || !user || user.uid === "guest-user") {
    return false;
  }

  try {
    // 1. Purge any residual guest/demo evaluation artifacts
    localStorage.removeItem("invictus_guest_mode");
    localStorage.removeItem("invictus_guest_name");
    localStorage.removeItem("invictus_demo_data_active");

    // 2. Set active user profile credentials
    localStorage.setItem("invictus_custom_active_user", JSON.stringify(user));
    localStorage.setItem("invictus_onboarded", "true");

    const userProfile = {
      displayName: user.displayName || "Invictus Explorer",
      email: user.email,
      currency: user.currency || "INR",
      timezone: user.timezone || "Asia/Kolkata",
      weekStartsOn: user.weekStartsOn ?? 1,
      modulesEnabled: user.modulesEnabled || { goals: true, study: true, money: true },
    };
    localStorage.setItem("invictus_user_profile", JSON.stringify(userProfile));
    localStorage.setItem("invictus_currency", user.currency || "INR");

    // 3. Hydrate Budget Allowances & Safe-to-Spend Telemetry
    const prefs = (user as any).budgetPreferences;
    const resolvedUpi = (prefs?.upiBudget && prefs.upiBudget > 0) ? prefs.upiBudget : 8000;
    const resolvedCash = (prefs?.cashBudget !== undefined && prefs.cashBudget >= 0) ? prefs.cashBudget : 2000;
    const resolvedRollover = prefs?.enableRollover !== undefined ? prefs.enableRollover : true;

    localStorage.setItem("invictus_monthly_upi_budget", String(resolvedUpi));
    localStorage.setItem("invictus_monthly_cash_budget", String(resolvedCash));
    localStorage.setItem("invictus_budget_rollover_enabled", String(resolvedRollover));

    if (prefs?.customDailyBudget !== undefined && prefs.customDailyBudget !== null) {
      localStorage.setItem("invictus_custom_daily_budget", String(prefs.customDailyBudget));
    } else {
      localStorage.removeItem("invictus_custom_daily_budget");
    }

    if (prefs?.budgetViewMode) {
      localStorage.setItem("invictus_budget_view_mode", prefs.budgetViewMode);
    }

    return true;
  } catch (err) {
    console.error("[hydrateDeviceFromCloud] Error hydrating device from user doc:", err);
    return false;
  }
}
