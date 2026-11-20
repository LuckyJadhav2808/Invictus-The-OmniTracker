import { describe, it, expect, beforeEach } from "vitest";
import { useMascotStore, MASCOT_COLOR_THEMES, MASCOT_EXPRESSIONS } from "./mascot-store";

describe("Mascot Store", () => {
  beforeEach(() => {
    useMascotStore.getState().resetMascot();
  });

  it("initializes with classic-blue and joy by default", () => {
    const state = useMascotStore.getState();
    expect(state.colorTheme).toBe("classic-blue");
    expect(state.expression).toBe("joy");
    expect(state.customName).toBe("Strobi");
  });

  it("updates colorTheme correctly", () => {
    useMascotStore.getState().setColorTheme("electric-lime");
    expect(useMascotStore.getState().colorTheme).toBe("electric-lime");

    useMascotStore.getState().setColorTheme("sunset-peach");
    expect(useMascotStore.getState().colorTheme).toBe("sunset-peach");
  });

  it("updates expression correctly", () => {
    useMascotStore.getState().setExpression("shades");
    expect(useMascotStore.getState().expression).toBe("shades");

    useMascotStore.getState().setExpression("scholar");
    expect(useMascotStore.getState().expression).toBe("scholar");
  });

  it("contains all 8 required color theme definitions", () => {
    expect(Object.keys(MASCOT_COLOR_THEMES)).toHaveLength(8);
    expect(MASCOT_COLOR_THEMES["classic-blue"].stops).toHaveLength(5);
    expect(MASCOT_COLOR_THEMES["electric-lime"].previewColor).toBe("#CEF431");
  });

  it("contains all required expression definitions", () => {
    expect(MASCOT_EXPRESSIONS).toHaveLength(6);
    const ids = MASCOT_EXPRESSIONS.map((e) => e.id);
    expect(ids).toContain("joy");
    expect(ids).toContain("wink");
    expect(ids).toContain("shades");
  });
});
