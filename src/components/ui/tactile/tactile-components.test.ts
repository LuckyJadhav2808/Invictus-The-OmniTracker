import { describe, it, expect } from "vitest";
import { TactileHoldButton } from "./TactileHoldButton";
import { GladiatorPulseBadge } from "./GladiatorPulseBadge";
import { TactileThermalGauge } from "./TactileThermalGauge";
import { TactileStepper } from "./TactileStepper";

describe("Tactile Component Suite", () => {
  it("exports valid TactileHoldButton component function", () => {
    expect(typeof TactileHoldButton).toBe("function");
  });

  it("exports valid GladiatorPulseBadge component function", () => {
    expect(typeof GladiatorPulseBadge).toBe("function");
  });

  it("exports valid TactileThermalGauge component function", () => {
    expect(typeof TactileThermalGauge).toBe("function");
  });

  it("exports valid TactileStepper component function", () => {
    expect(typeof TactileStepper).toBe("function");
  });
});
