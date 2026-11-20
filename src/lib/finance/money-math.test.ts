import { describe, it, expect } from "vitest";
import {
  addMoney,
  subtractMoney,
  multiplyMoney,
  divideMoney,
  splitBill,
  formatMoney,
} from "./money-math";

describe("High-Precision Money Math Engine (currency.js)", () => {
  it("eliminates IEEE-754 floating point rounding bugs in addition", () => {
    // In raw JavaScript: 0.1 + 0.2 = 0.30000000000000004
    expect(0.1 + 0.2).not.toBe(0.3);
    // With money-math:
    expect(addMoney(0.1, 0.2)).toBe(0.3);
    expect(addMoney(19.99, 0.01)).toBe(20.0);
    expect(addMoney(10540.5, 459.55)).toBe(11000.05);
  });

  it("handles exact subtraction without precision decay", () => {
    // In raw JS: 1.4 - 1.2 = 0.19999999999999996
    expect(1.4 - 1.2).not.toBe(0.2);
    expect(subtractMoney(1.4, 1.2)).toBe(0.2);
    expect(subtractMoney(500, 125.75)).toBe(374.25);
  });

  it("handles multiplication and division cleanly", () => {
    expect(multiplyMoney(49.99, 3)).toBe(149.97);
    expect(divideMoney(100, 4)).toBe(25);
    expect(divideMoney(100, 0)).toBe(0);
  });

  it("performs penny-perfect remainder distribution for Who-Owes-Who splits", () => {
    // 100 split 3 ways: 33.34 + 33.33 + 33.33 = 100.00 exactly
    const split3 = splitBill(100, 3);
    expect(split3).toEqual([33.34, 33.33, 33.33]);
    const sum3 = split3.reduce((acc, v) => addMoney(acc, v), 0);
    expect(sum3).toBe(100);

    // 2500 split 7 ways: sum must be exactly 2500.00
    const split7 = splitBill(2500, 7);
    expect(split7.length).toBe(7);
    const sum7 = split7.reduce((acc, v) => addMoney(acc, v), 0);
    expect(sum7).toBe(2500);

    // Edge cases: split 1 way or invalid
    expect(splitBill(500, 1)).toEqual([500]);
    expect(splitBill(500, 0)).toEqual([]);
  });

  it("formats currency in Indian numbering system and Western system", () => {
    expect(formatMoney(150000)).toBe("₹1,50,000.00");
    expect(formatMoney(1234567.89)).toBe("₹12,34,567.89");
    expect(formatMoney(500, { precision: 0 })).toBe("₹500");
    expect(formatMoney(-250)).toBe("-₹250.00");

    // Western formatting
    expect(formatMoney(150000, { symbol: "$", useIndianFormat: false })).toBe("$150,000.00");
  });
});
