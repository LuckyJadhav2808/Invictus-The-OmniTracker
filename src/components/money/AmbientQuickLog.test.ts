import { describe, it, expect } from "vitest";
import { MechanicalNumpad } from "./MechanicalNumpad";
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
});
