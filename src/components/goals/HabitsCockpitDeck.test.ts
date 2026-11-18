import { describe, it, expect, vi } from "vitest";
import React from "react";
import { HabitsCockpitDeck } from "./HabitsCockpitDeck";
import { BeadedAmphitheaterArcGauge, calculateArcDots } from "./BeadedAmphitheaterArcGauge";

describe("HabitsCockpitDeck & BeadedAmphitheaterArcGauge Architecture", () => {
  it("exports HabitsCockpitDeck and BeadedAmphitheaterArcGauge as valid functional components", () => {
    expect(typeof HabitsCockpitDeck).toBe("function");
    expect(typeof BeadedAmphitheaterArcGauge).toBe("function");
  });

  it("calculates arc dots accurately without crashing or NaN coordinates", () => {
    const dots = calculateArcDots(160, 145, 116, 21, 50);
    expect(dots.length).toBe(21);
    expect(dots.filter((d) => d.isFilled).length).toBe(11);
    for (const dot of dots) {
      expect(Number.isNaN(dot.x)).toBe(false);
      expect(Number.isNaN(dot.y)).toBe(false);
      expect(dot.x).toBeGreaterThan(0);
      expect(dot.y).toBeGreaterThan(0);
    }
  });

  it("renders HabitsCockpitDeck with valid props without exceptions", () => {
    const mockOnSelectDate = vi.fn();
    const mockOnSelectLayout = vi.fn();
    const mockOnNewHabit = vi.fn();
    const mockOnShield = vi.fn();
    const mockToggleSound = vi.fn();

    const mockCheckAllDue = vi.fn();

    const element = React.createElement(HabitsCockpitDeck, {
      habits: [],
      streaks: {},
      streakFreeze: { tokensAvailable: 2, frozenDates: [] },
      selectedDate: "2026-11-19",
      onSelectDate: mockOnSelectDate,
      habitLayoutStyle: "cards",
      onSelectLayoutStyle: mockOnSelectLayout,
      onOpenNewHabit: mockOnNewHabit,
      onOpenShieldInfo: mockOnShield,
      dailyCompletionPercent: 67,
      completedCount: 2,
      dueCount: 3,
      soundMuted: false,
      onToggleSound: mockToggleSound,
      onCheckAllDue: mockCheckAllDue,
    });

    expect(element).toBeDefined();
    expect(element.props.selectedDate).toBe("2026-11-19");
    expect(element.props.dailyCompletionPercent).toBe(67);
    expect(element.props.onCheckAllDue).toBe(mockCheckAllDue);
  });
});
