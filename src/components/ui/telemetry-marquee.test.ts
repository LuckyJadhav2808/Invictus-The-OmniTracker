import { describe, it, expect } from "vitest";
import { TelemetryMarquee } from "./telemetry-marquee";

describe("TelemetryMarquee Component", () => {
  it("exports valid component definition", () => {
    expect(TelemetryMarquee).toBeDefined();
    expect(typeof TelemetryMarquee).toBe("function");
  });
});
