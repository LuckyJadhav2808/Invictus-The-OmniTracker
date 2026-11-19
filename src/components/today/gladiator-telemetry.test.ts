import { describe, it, expect } from "vitest";
import { computeDailyConquestScore } from "./useTodayCockpitViewModel";

describe("Gladiator Conquest Dual-Ring Telemetry Engine", () => {
  it("calculates 100% conquest score when all habits and budget targets are fulfilled", () => {
    const res = computeDailyConquestScore({
      completedHabitsCount: 5,
      totalHabitsCount: 5,
      spentToday: 0,
      dailySafeToSpend: 600,
      currencySymbol: "₹",
    });

    expect(res.habitPercent).toBe(100);
    expect(res.budgetPercent).toBe(100);
    expect(res.overallScore).toBe(100);
    expect(res.remainingSafeToSpend).toBe(600);
  });

  it("calculates 0% overall score when nothing is done and budget is depleted", () => {
    const res = computeDailyConquestScore({
      completedHabitsCount: 0,
      totalHabitsCount: 5,
      spentToday: 800,
      dailySafeToSpend: 500,
      currencySymbol: "₹",
    });

    expect(res.habitPercent).toBe(0);
    expect(res.budgetPercent).toBe(0);
    expect(res.overallScore).toBe(0);
  });

  it("calculates correct weighted composite score for partial progress", () => {
    // 4/5 habits = 80% (80% * 50 = 40)
    // ₹150 spent of ₹600 = ₹450 left (75% * 50 = 37.5)
    // Total = 40 + 37.5 = 77.5 -> 78%
    const res = computeDailyConquestScore({
      completedHabitsCount: 4,
      totalHabitsCount: 5,
      spentToday: 150,
      dailySafeToSpend: 600,
      currencySymbol: "₹",
    });

    expect(res.habitPercent).toBe(80);
    expect(res.budgetPercent).toBe(75);
    expect(res.overallScore).toBe(78);
    expect(res.remainingSafeToSpend).toBe(450);
  });

  it("gracefully handles zero habits configured without NaN errors", () => {
    const res = computeDailyConquestScore({
      completedHabitsCount: 0,
      totalHabitsCount: 0,
      spentToday: 200, // 200 of 400 = 50% * 50 = 25
      dailySafeToSpend: 400,
      currencySymbol: "₹",
    });

    expect(res.habitPercent).toBe(100); // 0 habits doesn't penalize
    expect(isNaN(res.overallScore)).toBe(false);
    expect(res.overallScore).toBeGreaterThan(0);
  });
});
