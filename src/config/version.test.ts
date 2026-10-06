import { describe, it, expect } from "vitest";
import { compareSemver, APP_VERSION_CONFIG } from "./version";

describe("SemVer comparison engine", () => {
  it("detects when target version is newer than installed version", () => {
    expect(compareSemver("1.5.1", "1.5.0")).toBe(1);
    expect(compareSemver("1.6.0", "1.5.9")).toBe(1);
    expect(compareSemver("2.0.0", "1.99.99")).toBe(1);
  });

  it("detects when installed version is older than target version", () => {
    expect(compareSemver("1.5.0", "1.5.1")).toBe(-1);
    expect(compareSemver("1.4.9", "1.5.0")).toBe(-1);
    expect(compareSemver("0.9.0", "1.0.0")).toBe(-1);
  });

  it("recognizes identical versions as equal", () => {
    expect(compareSemver("1.5.0", "1.5.0")).toBe(0);
    expect(compareSemver("v1.5.0", "1.5.0")).toBe(0);
    expect(compareSemver("1.5.0", "V1.5.0")).toBe(0);
  });

  it("handles prefixes and extra segments cleanly", () => {
    expect(compareSemver("v1.5.1", "1.5.0.0")).toBe(1);
    expect(compareSemver("1.5.0.1", "1.5.0")).toBe(1);
  });

  it("ensures APP_VERSION_CONFIG matches minimum supported baseline", () => {
    expect(compareSemver(APP_VERSION_CONFIG.version, APP_VERSION_CONFIG.minSupportedVersion)).toBeGreaterThanOrEqual(0);
  });
});
