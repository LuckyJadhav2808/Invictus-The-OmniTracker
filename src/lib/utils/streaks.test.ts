import { describe, expect, it } from "vitest";
import { calculateStreak } from "./streaks";

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
});
