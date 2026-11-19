import { describe, it, expect } from "vitest";
import { HalfFlowerMenu } from "./HalfFlowerMenu";

describe("HalfFlowerMenu", () => {
  it("exports a valid HalfFlowerMenu component function", () => {
    expect(typeof HalfFlowerMenu).toBe("function");
  });
});
