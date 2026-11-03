import { describe, it, expect } from "vitest";
import { APP_VERSION_CONFIG, compareSemver } from "@/config/version";

describe("Version Engine & Telemetry Architecture", () => {
  it("has valid semver and positive buildNumber", () => {
    expect(APP_VERSION_CONFIG.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(APP_VERSION_CONFIG.buildNumber).toBeGreaterThan(0);
    expect(APP_VERSION_CONFIG.channel).toBe("stable");
    expect(APP_VERSION_CONFIG.changelog.length).toBeGreaterThan(0);
  });

  it("compares semver correctly across patch, minor, and major bumps", () => {
    expect(compareSemver("1.7.9", "1.7.8")).toBe(1);
    expect(compareSemver("1.7.8", "1.7.9")).toBe(-1);
    expect(compareSemver("1.7.9", "1.7.9")).toBe(0);
    expect(compareSemver("v1.8.0", "1.7.9")).toBe(1);
    expect(compareSemver("2.0.0", "1.99.99")).toBe(1);
  });

  it("handles version prefixes safely", () => {
    expect(compareSemver("v1.7.9", "v1.7.8")).toBe(1);
    expect(compareSemver("V1.7.9", "1.7.9")).toBe(0);
  });
});
