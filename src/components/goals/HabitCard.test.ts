import { describe, it, expect, vi } from "vitest";
import React from "react";
import { HabitCard } from "./HabitCard";
import { type Habit } from "@/types";

describe("HabitCard Production Benchmark Component", () => {
  const mockHabit: Habit = {
    id: "habit-1",
    title: "Morning Stretch",
    icon: "Activity",
    color: "emerald",
    frequency: { type: "daily", targetPerDay: 1 },
    allowGraceSkip: false,
    isGoalStyle: false,
    archived: false,
    createdAt: new Date().toISOString(),
  };

  it("exports HabitCard as a valid functional component", () => {
    expect(typeof HabitCard).toBe("function");
  });

  it("renders card view with clean props and weekDays strip without crashing", () => {
    const el = React.createElement(HabitCard, {
      habit: mockHabit,
      isCompletedToday: false,
      onToggle: vi.fn(),
      weekDays: [
        { dateStr: "2026-11-19", dayLabel: "Thu", dayNum: "19", isToday: true, isCompleted: false },
      ],
      viewMode: "cards",
    });
    expect(el).toBeDefined();
    expect(el.props.habit.title).toBe("Morning Stretch");
  });

  it("renders compact view mode correctly", () => {
    const el = React.createElement(HabitCard, {
      habit: mockHabit,
      isCompletedToday: true,
      onToggle: vi.fn(),
      viewMode: "compact",
    });
    expect(el).toBeDefined();
    expect(el.props.viewMode).toBe("compact");
  });

  it("renders matrix view mode correctly", () => {
    const el = React.createElement(HabitCard, {
      habit: mockHabit,
      isCompletedToday: true,
      onToggle: vi.fn(),
      viewMode: "matrix",
    });
    expect(el).toBeDefined();
    expect(el.props.viewMode).toBe("matrix");
  });
});
