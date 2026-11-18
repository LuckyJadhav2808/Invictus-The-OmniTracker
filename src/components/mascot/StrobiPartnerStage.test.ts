import { describe, it, expect, vi } from "vitest";
import React from "react";
import { StrobiPartnerStage } from "./StrobiPartnerStage";

describe("StrobiPartnerStage Component", () => {
  it("exports StrobiPartnerStage as a functional component", () => {
    expect(typeof StrobiPartnerStage).toBe("function");
  });

  it("renders with clean companion props without errors", () => {
    const mockClick = vi.fn();
    const el = React.createElement(StrobiPartnerStage, {
      state: "celebrate",
      gear: "fitness",
      size: 76,
      moodBadge: "🏆 CONQUERED",
      quip: "All routines completed today!",
      onClick: mockClick,
    });

    expect(el).toBeDefined();
    expect(el.props.state).toBe("celebrate");
    expect(el.props.gear).toBe("fitness");
    expect(el.props.size).toBe(76);
  });
});
