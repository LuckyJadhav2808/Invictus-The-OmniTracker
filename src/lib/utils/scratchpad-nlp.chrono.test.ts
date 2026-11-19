import { describe, it, expect } from "vitest";
import * as chrono from "chrono-node";
import { format } from "date-fns";

describe("chrono-node natural language date extraction", () => {
  const baseDate = new Date("2026-10-25T10:00:00.000Z"); // Sunday

  it("parses relative tomorrow accurately", () => {
    const results = chrono.parse("Complete math homework tomorrow", baseDate, { forwardDate: true });
    expect(results.length).toBeGreaterThan(0);
    const parsed = results[0].start.date();
    expect(format(parsed, "yyyy-MM-dd")).toBe("2026-10-26");
  });

  it("parses 'in 3 days' forward calculation", () => {
    const results = chrono.parse("Chemistry lab exam in 3 days p1", baseDate, { forwardDate: true });
    expect(results.length).toBeGreaterThan(0);
    const parsed = results[0].start.date();
    expect(format(parsed, "yyyy-MM-dd")).toBe("2026-10-28");
  });

  it("parses specific weekdays like 'next Friday'", () => {
    const results = chrono.parse("Gym push session next Friday at 5pm", baseDate, { forwardDate: true });
    expect(results.length).toBeGreaterThan(0);
    const parsed = results[0].start.date();
    expect(format(parsed, "yyyy-MM-dd")).toBe("2026-10-30");
  });

  it("parses formal dates like 'on 28th October'", () => {
    const results = chrono.parse("Pay electricity bill on 28th October", baseDate, { forwardDate: true });
    expect(results.length).toBeGreaterThan(0);
    const parsed = results[0].start.date();
    expect(format(parsed, "yyyy-MM-dd")).toBe("2026-10-28");
  });
});
