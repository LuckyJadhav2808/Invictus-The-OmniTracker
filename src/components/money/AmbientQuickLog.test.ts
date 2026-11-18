import { describe, it, expect } from "vitest";
import { MechanicalNumpad, DEFAULT_HABITS, CORE_CATEGORIES } from "./MechanicalNumpad";
import { AmbientQuickLogCard } from "./AmbientQuickLogCard";

describe("Ambient Zero-App Quick-Log Component Architecture", () => {
  it("exports MechanicalNumpad as a valid functional component", () => {
    expect(MechanicalNumpad).toBeDefined();
    expect(typeof MechanicalNumpad).toBe("function");
  });

  it("exports AmbientQuickLogCard as a valid functional component", () => {
    expect(AmbientQuickLogCard).toBeDefined();
    expect(typeof AmbientQuickLogCard).toBe("function");
  });

  it("has valid default habits configured with labels, amounts, and categories", () => {
    expect(DEFAULT_HABITS.length).toBeGreaterThanOrEqual(4);
    for (const habit of DEFAULT_HABITS) {
      expect(habit.label).toBeDefined();
      expect(habit.amount).toBeGreaterThan(0);
      expect(habit.category).toBeDefined();
    }
  });

  it("has core categories configured with distinct IDs and display names", () => {
    expect(CORE_CATEGORIES.length).toBe(4);
    const ids = CORE_CATEGORIES.map((c) => c.id);
    expect(ids).toContain("Food");
    expect(ids).toContain("Travel");
    expect(ids).toContain("Grocery");
    expect(ids).toContain("Bills");
  });
});
