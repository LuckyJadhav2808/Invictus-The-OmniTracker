import { describe, it, expect } from "vitest";
import { StickyMoneyMiniCockpit } from "./StickyMoneyMiniCockpit";

describe("StickyMoneyMiniCockpit", () => {
  it("exports a valid functional component", () => {
    expect(typeof StickyMoneyMiniCockpit).toBe("function");
  });
});
