import { describe, expect, it } from "vitest";
import {
  calculateStreak,
  isHabitScheduledOnDate,
  evaluateAutonomousStreakFreeze,
} from "./streaks";

describe("calculateStreak", () => {
  it("should return 0 for empty logs", () => {
    const result = calculateStreak([]);
    expect(result).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it("should calculate active streak including today", () => {
    // Reference date: 2026-07-19
    const completed = ["2026-07-19", "2026-07-18", "2026-07-17", "2026-07-15"];
    const result = calculateStreak(completed, "2026-07-19");
    expect(result.currentStreak).toBe(3); // 19, 18, 17
    expect(result.longestStreak).toBe(3);
  });

  it("should calculate active streak including yesterday but not today", () => {
    // Reference date: 2026-07-19
    const completed = ["2026-07-18", "2026-07-17", "2026-07-16"];
    const result = calculateStreak(completed, "2026-07-19");
    expect(result.currentStreak).toBe(3); // 18, 17, 16
    expect(result.longestStreak).toBe(3);
  });

  it("should return 0 current streak if last logged date is older than yesterday", () => {
    // Reference date: 2026-07-19
    const completed = ["2026-07-17", "2026-07-16", "2026-07-15"];
    const result = calculateStreak(completed, "2026-07-19");
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(3); // 17, 16, 15
  });

  it("should calculate historical longest streak correctly across gaps", () => {
    // Reference date: 2026-07-19
    const completed = [
      "2026-07-10",
      "2026-07-11",
      "2026-07-12", // streak of 3
      "2026-07-14",
      "2026-07-15",
      "2026-07-16",
      "2026-07-17", // streak of 4
      "2026-07-19", // streak of 1
    ];
    const result = calculateStreak(completed, "2026-07-19");
    expect(result.currentStreak).toBe(1); // 19 only
    expect(result.longestStreak).toBe(4); // 14, 15, 16, 17
  });

  it("should handle unsorted and duplicate dates", () => {
    const completed = [
      "2026-07-18",
      "2026-07-19",
      "2026-07-18",
      "2026-07-17",
    ];
    const result = calculateStreak(completed, "2026-07-19");
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it("should preserve active streak when yesterday is protected by a Streak Freeze", () => {
    // Reference date: 2026-10-21 (today)
    // Yesterday 2026-10-20 missed, but frozen in frozenDates
    const completed = ["2026-10-19", "2026-10-18"];
    const frozen = ["2026-10-20"];
    const result = calculateStreak(completed, "2026-10-21", frozen);
    // 2026-10-20 (shielded) + 2026-10-19 + 2026-10-18 = 3 days intact flame
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it("should preserve streak across multiple frozen days and rest days", () => {
    // Reference date: 2026-10-21 (Wed)
    // Completed Mon (10-19), Tue (10-20) missed but frozen, today (10-21) completed
    const completed = ["2026-10-19", "2026-10-21"];
    const frozen = ["2026-10-20"];
    const result = calculateStreak(completed, {
      referenceDateStr: "2026-10-21",
      frozenDates: frozen,
    });
    expect(result.currentStreak).toBe(3);
  });

  it("should bridge scheduled rest days without breaking streak", () => {
    // Schedule: Mon (10-19), Wed (10-21), Fri (10-23). Tue (10-20) is a rest day.
    // User completed 10-19 and 10-21. Today is 10-21.
    const completed = ["2026-10-19", "2026-10-21"];
    const isRestDay = (d: string) => d === "2026-10-20"; // Tuesday is rest day
    const result = calculateStreak(completed, {
      referenceDateStr: "2026-10-21",
      isRestDay,
    });
    // Current streak counts the 2 active completed days
    expect(result.currentStreak).toBe(2);
  });
});

describe("isHabitScheduledOnDate", () => {
  it("should return true for daily habits", () => {
    const habit = { frequency: { type: "daily" as const } };
    expect(isHabitScheduledOnDate(habit, "2026-10-21")).toBe(true);
  });

  it("should return false for customDays habit on an off-day", () => {
    // 2026-10-21 is Wednesday (day 3)
    // Habit is scheduled for Mon(1) and Fri(5)
    const habit = {
      frequency: {
        type: "customDays" as const,
        daysOfWeek: [1, 5],
      },
    };
    expect(isHabitScheduledOnDate(habit, "2026-10-21")).toBe(false);
  });

  it("should return true for customDays habit on a scheduled day", () => {
    // 2026-10-21 is Wednesday (day 3)
    const habit = {
      frequency: {
        type: "customDays" as const,
        daysOfWeek: [1, 3, 5],
      },
    };
    expect(isHabitScheduledOnDate(habit, "2026-10-21")).toBe(true);
  });
});

describe("evaluateAutonomousStreakFreeze", () => {
  const habits = [
    {
      id: "habit-1",
      title: "Morning Meditation",
      frequency: { type: "daily" as const },
      archived: false,
    },
  ];

  it("should deploy shield and consume 1 token when yesterday was missed with active streak", () => {
    // Today: 2026-10-21. Yesterday: 2026-10-20.
    // Completed on 2026-10-19 (streak = 1). Missed on 2026-10-20.
    const result = evaluateAutonomousStreakFreeze({
      habits,
      completedLogs: [
        { habitId: "habit-1", date: "2026-10-19", completed: true },
      ],
      streakFreeze: {
        tokensAvailable: 1,
        frozenDates: [],
      },
      referenceDateStr: "2026-10-21",
    });

    expect(result.shielded).toBe(true);
    expect(result.tokensConsumed).toBe(1);
    expect(result.newTokensAvailable).toBe(0);
    expect(result.newlyFrozenDates).toEqual(["2026-10-20"]);
    expect(result.newFrozenDates).toContain("2026-10-20");
    expect(result.affectedHabitIds).toContain("habit-1");

    // Verify streak calculation with newly frozen date keeps flame alive
    const streakWithShield = calculateStreak(
      ["2026-10-19"],
      "2026-10-21",
      result.newFrozenDates
    );
    expect(streakWithShield.currentStreak).toBe(2); // 2026-10-19 + 2026-10-20 (frozen)
  });

  it("should not deploy shield if user has 0 freeze tokens available", () => {
    const result = evaluateAutonomousStreakFreeze({
      habits,
      completedLogs: [
        { habitId: "habit-1", date: "2026-10-19", completed: true },
      ],
      streakFreeze: {
        tokensAvailable: 0,
        frozenDates: [],
      },
      referenceDateStr: "2026-10-21",
    });

    expect(result.shielded).toBe(false);
    expect(result.tokensConsumed).toBe(0);
    expect(result.newTokensAvailable).toBe(0);
    expect(result.newlyFrozenDates).toEqual([]);
  });

  it("should not deploy shield if yesterday was completed", () => {
    const result = evaluateAutonomousStreakFreeze({
      habits,
      completedLogs: [
        { habitId: "habit-1", date: "2026-10-19", completed: true },
        { habitId: "habit-1", date: "2026-10-20", completed: true },
      ],
      streakFreeze: {
        tokensAvailable: 1,
        frozenDates: [],
      },
      referenceDateStr: "2026-10-21",
    });

    expect(result.shielded).toBe(false);
    expect(result.tokensConsumed).toBe(0);
    expect(result.newTokensAvailable).toBe(1);
  });

  it("should not deploy shield if yesterday was a scheduled rest day", () => {
    // 2026-10-20 was Tuesday (day 2). Habit is only on Mon (1), Wed (3), Fri (5)
    const customHabit = [
      {
        id: "habit-gym",
        title: "Gym Workout",
        frequency: {
          type: "customDays" as const,
          daysOfWeek: [1, 3, 5],
        },
        archived: false,
      },
    ];

    const result = evaluateAutonomousStreakFreeze({
      habits: customHabit,
      completedLogs: [
        { habitId: "habit-gym", date: "2026-10-19", completed: true }, // Mon
      ],
      streakFreeze: {
        tokensAvailable: 1,
        frozenDates: [],
      },
      referenceDateStr: "2026-10-21", // Wed
    });

    expect(result.shielded).toBe(false);
    expect(result.tokensConsumed).toBe(0);
    expect(result.newTokensAvailable).toBe(1);
  });

  it("should not deploy shield if habit had no streak prior to yesterday", () => {
    // User never completed habit-1 prior to 2026-10-20
    const result = evaluateAutonomousStreakFreeze({
      habits,
      completedLogs: [],
      streakFreeze: {
        tokensAvailable: 1,
        frozenDates: [],
      },
      referenceDateStr: "2026-10-21",
    });

    expect(result.shielded).toBe(false);
    expect(result.tokensConsumed).toBe(0);
    expect(result.newTokensAvailable).toBe(1);
  });

  it("should not double-consume token if yesterday is already frozen", () => {
    const result = evaluateAutonomousStreakFreeze({
      habits,
      completedLogs: [
        { habitId: "habit-1", date: "2026-10-19", completed: true },
      ],
      streakFreeze: {
        tokensAvailable: 1,
        frozenDates: ["2026-10-20"],
      },
      referenceDateStr: "2026-10-21",
    });

    expect(result.shielded).toBe(false);
    expect(result.tokensConsumed).toBe(0);
    expect(result.newTokensAvailable).toBe(1);
  });

  it("should deploy up to 2 tokens if 2 consecutive days were missed and user holds 2 tokens", () => {
    // Today: 2026-10-21.
    // Active on 2026-10-18 (Sun). Missed 2026-10-19 (Mon) and 2026-10-20 (Tue).
    const result = evaluateAutonomousStreakFreeze({
      habits,
      completedLogs: [
        { habitId: "habit-1", date: "2026-10-18", completed: true },
      ],
      streakFreeze: {
        tokensAvailable: 2,
        frozenDates: [],
      },
      referenceDateStr: "2026-10-21",
    });

    expect(result.shielded).toBe(true);
    expect(result.tokensConsumed).toBe(2);
    expect(result.newTokensAvailable).toBe(0);
    expect(result.newlyFrozenDates).toEqual(["2026-10-19", "2026-10-20"]);
  });
});
