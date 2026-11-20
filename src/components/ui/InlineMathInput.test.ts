import { describe, it, expect } from "vitest";
import { InlineMathInput } from "./InlineMathInput";
import { evaluateExpression } from "@/lib/utils/calculator-engine";

describe("InlineMathInput & Arithmetic Engine", () => {
  it("exports InlineMathInput as a valid React component", () => {
    expect(InlineMathInput).toBeDefined();
    expect(typeof InlineMathInput).toBe("function");
  });

  it("evaluates split bill math correctly (e.g. 1450 / 3)", () => {
    const expr = "1450/3";
    const evaluated = evaluateExpression(expr);
    const rounded = Math.round((evaluated + Number.EPSILON) * 100) / 100;
    expect(rounded).toBe(483.33);
  });

  it("evaluates chained addition and multiplication with proper precedence", () => {
    expect(evaluateExpression("120 + 45 + 35")).toBe(200);
    expect(evaluateExpression("20 + 2 * 15")).toBe(50);
  });

  it("handles incomplete trailing operators gracefully without throwing", () => {
    expect(evaluateExpression("150 + ")).toBe(150);
    expect(evaluateExpression("250 - ")).toBe(250);
  });
});
