import { describe, it, expect } from "vitest";
import { computeDailyConquestScore } from "./useTodayCockpitViewModel";

describe("Gladiator Conquest Tri-Ring Telemetry Engine", () => {
  it("calculates 100% conquest score when all habits, study, and budget targets are fulfilled", () => {
    const res = computeDailyConquestScore({
      completedHabitsCount: 5,
      totalHabitsCount: 5,
      studyMinutesToday: 240, // 4 hours
      studyTargetHours: 4.0,
      spentToday: 0,
      dailySafeToSpend: 600,
      currencySymbol: "₹",
    });

    expect(res.habitPercent).toBe(100);
    expect(res.studyPercent).toBe(100);
    expect(res.budgetPercent).toBe(100);
    expect(res.overallScore).toBe(100);
    expect(res.remainingSafeToSpend).toBe(600);
  });

  it("calculates 0% overall score when nothing is done and budget is depleted", () => {
    const res = computeDailyConquestScore({
      completedHabitsCount: 0,
      totalHabitsCount: 5,
      studyMinutesToday: 0,
      studyTargetHours: 4.0,
      spentToday: 800,
      dailySafeToSpend: 500,
      currencySymbol: "₹",
    });

    expect(res.habitPercent).toBe(0);
    expect(res.studyPercent).toBe(0);
    expect(res.budgetPercent).toBe(0);
    expect(res.overallScore).toBe(0);
  });

  it("calculates correct weighted composite score for partial progress", () => {
    // 4/5 habits = 80% (80% * 35 = 28)
    // 2.5h / 4h study = 62.5% -> 63% (62.5% * 35 = 21.875)
    // ₹150 spent of ₹600 = ₹450 left (75% * 30 = 22.5)
    // Total = 28 + 21.875 + 22.5 = 72.375 -> 72%
    const res = computeDailyConquestScore({
      completedHabitsCount: 4,
      totalHabitsCount: 5,
      studyMinutesToday: 150, // 2.5 hours
      studyTargetHours: 4.0,
      spentToday: 150,
      dailySafeToSpend: 600,
      currencySymbol: "₹",
    });

    expect(res.habitPercent).toBe(80);
    expect(res.studyPercent).toBe(63);
    expect(res.budgetPercent).toBe(75);
    expect(res.overallScore).toBeGreaterThanOrEqual(72);
    expect(res.overallScore).toBeLessThanOrEqual(74);
    expect(res.remainingSafeToSpend).toBe(450);
  });

  it("gracefully handles zero habits configured without NaN errors", () => {
    const res = computeDailyConquestScore({
      completedHabitsCount: 0,
      totalHabitsCount: 0,
      studyMinutesToday: 120, // 2h of 4h = 50% * 35 = 17.5
      studyTargetHours: 4.0,
      spentToday: 200, // 200 of 400 = 50% * 30 = 15
      dailySafeToSpend: 400,
      currencySymbol: "₹",
    });

    expect(res.habitPercent).toBe(100); // 0 habits doesn't penalize
    expect(isNaN(res.overallScore)).toBe(false);
    expect(res.overallScore).toBeGreaterThan(0);
  });
});
