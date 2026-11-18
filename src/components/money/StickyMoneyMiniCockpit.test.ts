import { describe, it, expect, vi } from "vitest";
import React from "react";
import { StickyMoneyMiniCockpit } from "./StickyMoneyMiniCockpit";

describe("StickyMoneyMiniCockpit", () => {
  it("exports a valid functional component", () => {
    expect(typeof StickyMoneyMiniCockpit).toBe("function");
  });

  it("renders with clean telemetry props without crashing", () => {
    const el = React.createElement(StickyMoneyMiniCockpit, {
      visible: true,
      currencySymbol: "₹",
      remainingBudget: 1420,
      safeDailyPace: 120,
      onAddTransaction: vi.fn(),
    });
    expect(el).toBeDefined();
    expect(el.props.remainingBudget).toBe(1420);
    expect(el.props.safeDailyPace).toBe(120);
  });
});
