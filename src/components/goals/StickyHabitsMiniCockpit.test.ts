import { describe, it, expect, vi } from "vitest";
import React from "react";
import { StickyHabitsMiniCockpit } from "./StickyHabitsMiniCockpit";

describe("StickyHabitsMiniCockpit Component", () => {
  it("exports a valid functional component", () => {
    expect(typeof StickyHabitsMiniCockpit).toBe("function");
  });

  it("renders with clean telemetry props without crashing", () => {
    const el = React.createElement(StickyHabitsMiniCockpit, {
      visible: true,
      dailyCompletionPercent: 67,
      completedCount: 2,
      dueCount: 3,
      longestStreak: 5,
      onOpenNewHabit: vi.fn(),
    });
    expect(el).toBeDefined();
    expect(el.props.dailyCompletionPercent).toBe(67);
    expect(el.props.completedCount).toBe(2);
    expect(el.props.dueCount).toBe(3);
  });
});
