import { describe, it, expect } from "vitest";
import { generateInitialKey, generateKeyBetween } from "./lexorank";

describe("Lexicographical Fractional Indexing (Linear Benchmark)", () => {
  it("should generate initial key 'a0'", () => {
    expect(generateInitialKey()).toBe("a0");
  });

  it("should generate key after an existing key", () => {
    const next = generateKeyBetween("a0", undefined);
    expect(next > "a0").toBe(true);
  });

  it("should generate key before an existing key", () => {
    const prev = generateKeyBetween(undefined, "a0");
    expect(prev < "a0").toBe(true);
  });

  it("should generate key strictly between two existing keys", () => {
    const mid = generateKeyBetween("a0", "a2");
    expect(mid > "a0").toBe(true);
    expect(mid < "a2").toBe(true);
  });

  it("should handle adjacent characters by appending midpoint character", () => {
    const mid = generateKeyBetween("a0", "a1");
    expect(mid > "a0").toBe(true);
    expect(mid < "a1").toBe(true);
  });
});
