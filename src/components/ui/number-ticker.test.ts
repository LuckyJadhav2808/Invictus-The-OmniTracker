import { describe, it, expect } from "vitest";
import { NumberTicker } from "./number-ticker";

describe("NumberTicker Component", () => {
  it("exports valid component definition", () => {
    expect(NumberTicker).toBeDefined();
    expect(typeof NumberTicker).toBe("function");
  });
});
