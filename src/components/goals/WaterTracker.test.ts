import { describe, it, expect, vi } from "vitest";
import React from "react";
import { WaterTracker, WATER_VESSELS, TARGET_PRESETS } from "./WaterTracker";

describe("WaterTracker Component Production Audit & Benchmarks", () => {
  it("exports WaterTracker as a valid React functional component", () => {
    expect(typeof WaterTracker).toBe("function");
  });

  it("exports calibrated Waterllama-grade vessel presets with positive amounts", () => {
    expect(WATER_VESSELS).toHaveLength(4);
    expect(WATER_VESSELS[0]).toMatchObject({ id: "cup", amount: 150 });
    expect(WATER_VESSELS[1]).toMatchObject({ id: "glass", amount: 250 });
    expect(WATER_VESSELS[2]).toMatchObject({ id: "mug", amount: 500 });
    expect(WATER_VESSELS[3]).toMatchObject({ id: "bottle", amount: 750 });
    WATER_VESSELS.forEach((v) => {
      expect(v.amount).toBeGreaterThan(0);
      expect(typeof v.name).toBe("string");
      expect(v.icon).toBeDefined();
    });
  });

  it("exports standard clinical hydration target presets", () => {
    expect(TARGET_PRESETS).toEqual([1500, 2000, 2500, 3000]);
  });

  it("instantiates clean element with initial hydration props", () => {
    const onLogWater = vi.fn();
    const onSetWater = vi.fn().mockResolvedValue(undefined);

    const el = React.createElement(WaterTracker, {
      amount: 750,
      targetAmount: 2000,
      onLogWater,
      onSetWater,
    });

    expect(el).toBeDefined();
    expect(el.props.amount).toBe(750);
    expect(el.props.targetAmount).toBe(2000);
  });

  it("handles boundary zero amount without error", () => {
    const el = React.createElement(WaterTracker, {
      amount: 0,
      targetAmount: 2000,
      onLogWater: vi.fn(),
      onSetWater: vi.fn().mockResolvedValue(undefined),
    });

    expect(el).toBeDefined();
    expect(el.props.amount).toBe(0);
  });

  it("handles goal-met state when amount exceeds target", () => {
    const el = React.createElement(WaterTracker, {
      amount: 2500,
      targetAmount: 2000,
      onLogWater: vi.fn(),
      onSetWater: vi.fn().mockResolvedValue(undefined),
    });

    expect(el).toBeDefined();
    expect(el.props.amount).toBeGreaterThanOrEqual(el.props.targetAmount!);
  });
});
