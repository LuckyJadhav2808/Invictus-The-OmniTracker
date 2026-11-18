import { describe, it, expect, vi } from "vitest";
import React from "react";
import { StrobiCompanion } from "./StrobiCompanion";

describe("StrobiCompanion Architecture & Rendering", () => {
  it("exports StrobiCompanion as a valid functional component", () => {
    expect(typeof StrobiCompanion).toBe("function");
  });

  it("renders with default props without crashing", () => {
    const element = React.createElement(StrobiCompanion, {
      state: "idle",
      gear: "gladiator",
      size: 42,
    });
    expect(element).toBeDefined();
    expect(element.props.state).toBe("idle");
    expect(element.props.gear).toBe("gladiator");
  });

  it("renders with celebratory and fitness gear configurations", () => {
    const mockClick = vi.fn();
    const element = React.createElement(StrobiCompanion, {
      state: "celebrate",
      gear: "fitness",
      size: 48,
      streakDays: 5,
      onClick: mockClick,
      title: "Strobi Fitness",
    });
    expect(element.props.state).toBe("celebrate");
    expect(element.props.gear).toBe("fitness");
    expect(element.props.streakDays).toBe(5);
  });
});
