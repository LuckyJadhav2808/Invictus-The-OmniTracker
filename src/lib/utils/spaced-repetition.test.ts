import { describe, it, expect } from "vitest";
import { calculateSM2Review, isTopicDueForRevision } from "./spaced-repetition";

describe("SM-2 Spaced Repetition (Anki Benchmark)", () => {
  it("should initialize first repetition with interval 1 for perfect score", () => {
    const result = calculateSM2Review({}, 5);
    expect(result.intervalDays).toBe(1);
    expect(result.repetitionNumber).toBe(1);
    expect(result.easinessFactor).toBeGreaterThanOrEqual(2.5);
  });

  it("should advance to interval 6 on second consecutive successful review", () => {
    const first = calculateSM2Review({}, 5);
    const second = calculateSM2Review(first, 5);
    expect(second.intervalDays).toBe(6);
    expect(second.repetitionNumber).toBe(2);
  });

  it("should compound interval on 3rd review based on easiness factor", () => {
    const first = calculateSM2Review({}, 5);
    const second = calculateSM2Review(first, 5);
    const third = calculateSM2Review(second, 5);
    expect(third.intervalDays).toBeGreaterThan(6);
    expect(third.repetitionNumber).toBe(3);
  });

  it("should reset interval to 1 on failure (quality < 3)", () => {
    const state = { easinessFactor: 2.5, intervalDays: 14, repetitionNumber: 3 };
    const failed = calculateSM2Review(state, 2);
    expect(failed.intervalDays).toBe(1);
    expect(failed.repetitionNumber).toBe(0);
  });

  it("should correctly detect if topic is due for review", () => {
    const pastDate = "2026-01-01";
    const futureDate = "2099-01-01";

    expect(isTopicDueForRevision({ nextRevisionDate: pastDate }, "2026-10-21").isDue).toBe(true);
    expect(isTopicDueForRevision({ nextRevisionDate: futureDate }, "2026-10-21").isDue).toBe(false);
  });
});
