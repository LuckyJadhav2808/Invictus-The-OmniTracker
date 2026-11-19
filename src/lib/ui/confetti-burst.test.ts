import { describe, it, expect } from "vitest";
import { confettiBurst } from "./confetti-burst";

describe("confettiBurst utility", () => {
  it("exports valid utility function", () => {
    expect(confettiBurst).toBeDefined();
    expect(typeof confettiBurst).toBe("function");
  });

  it("safely handles SSR execution when window is undefined", () => {
    expect(() => confettiBurst()).not.toThrow();
  });
});
