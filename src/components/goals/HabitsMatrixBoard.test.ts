import { describe, it, expect, vi } from "vitest";
import React from "react";
import { HabitsMatrixBoard, type HabitsMatrixBoardProps } from "./HabitsMatrixBoard";
import { type Habit, type Streak } from "@/types";

describe("HabitsMatrixBoard Component", () => {
  const mockHabits: Habit[] = [
    {
      id: "habit-1",
      title: "Morning Stretch",
      icon: "Activity",
      color: "emerald",
      frequency: { type: "daily", targetPerDay: 1 },
      allowGraceSkip: false,
      isGoalStyle: false,
      archived: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "habit-2",
      title: "Read 10 Pages",
      icon: "BookOpen",
      color: "indigo",
      frequency: { type: "daily", targetPerDay: 1 },
      allowGraceSkip: false,
      isGoalStyle: false,
      archived: false,
      createdAt: new Date().toISOString(),
    },
  ];

  const mockStreaks: Record<string, Streak> = {
    "habit-1": { habitId: "habit-1", currentStreak: 3, longestStreak: 7, lastCompletedDate: "2026-11-19" },
    "habit-2": { habitId: "habit-2", currentStreak: 0, longestStreak: 2 },
  };

  it("exports HabitsMatrixBoard as a valid functional component", () => {
    expect(typeof HabitsMatrixBoard).toBe("function");
  });

  it("renders HabitsMatrixBoard with valid props without crashing", () => {
    const props: HabitsMatrixBoardProps = {
      habits: mockHabits,
      streaks: mockStreaks,
      selectedDate: "2026-11-19",
      onSelectDate: vi.fn(),
      onToggleHabitLog: vi.fn(),
      onEditHabit: vi.fn(),
      onDeleteHabit: vi.fn(),
      onOpenNewHabit: vi.fn(),
    };

    const el = React.createElement(HabitsMatrixBoard, props);

    expect(el).toBeDefined();
    expect(el.props.habits.length).toBe(2);
    expect(el.props.selectedDate).toBe("2026-11-19");
  });
});
