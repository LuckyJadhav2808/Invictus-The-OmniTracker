import { describe, it, expect, vi } from "vitest";
import React from "react";
import { StickyMoneyMiniCockpit } from "./StickyMoneyMiniCockpit";

describe("StickyMoneyMiniCockpit", () => {
  it("exports a valid functional component", () => {
    expect(typeof StickyMoneyMiniCockpit).toBe("function");
  });

  it("renders with default props without crashing", () => {
    const el = React.createElement(StickyMoneyMiniCockpit, {
      visible: true,
      currencySymbol: "₹",
      remainingBudget: 1420,
      safeDailyPace: 120,
      onAddTransaction: vi.fn(),
      activeTab: "ledger",
      onTabChange: vi.fn(),
      todayTxCount: 4,
      overBudgetCategoriesCount: 1,
      pendingIouCount: 3,
      pendingIouAmount: 1450,
    });
    expect(el).toBeDefined();
    expect(el.props.activeTab).toBe("ledger");
    expect(el.props.todayTxCount).toBe(4);
    expect(el.props.pendingIouCount).toBe(3);
  });
});
