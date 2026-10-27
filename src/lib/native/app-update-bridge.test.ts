import { describe, it, expect } from "vitest";
import { resolveAbsoluteApkUrl, NativeAppUpdater } from "./app-update-bridge";

describe("NativeAppUpdater & APK URL Protocol Sanitizer", () => {
  it("converts relative path '/downloads/Invictus.apk' to absolute HTTPS URL", () => {
    const url = resolveAbsoluteApkUrl("/downloads/Invictus.apk");
    expect(url).toMatch(/^https:\/\/.+\/downloads\/Invictus\.apk$/);
    expect(url.startsWith("https://")).toBe(true);
  });

  it("converts relative API path '/api/download/android' to absolute HTTPS URL", () => {
    const url = resolveAbsoluteApkUrl("/api/download/android");
    expect(url).toMatch(/^https:\/\/.+\/api\/download\/android$/);
  });

  it("handles relative path without leading slash", () => {
    const url = resolveAbsoluteApkUrl("downloads/Invictus.apk");
    expect(url).toMatch(/^https:\/\/.+\/downloads\/Invictus\.apk$/);
  });

  it("leaves already absolute HTTPS URLs untouched", () => {
    const githubUrl =
      "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker/releases/download/v1.7.3/Invictus.apk";
    const result = resolveAbsoluteApkUrl(githubUrl);
    expect(result).toBe(githubUrl);
  });

  it("provides reliable fallback for null or undefined URLs", () => {
    const fallback = resolveAbsoluteApkUrl(undefined);
    expect(fallback).toContain("releases/latest/download/Invictus.apk");
    expect(fallback.startsWith("https://")).toBe(true);

    const emptyFallback = resolveAbsoluteApkUrl("");
    expect(emptyFallback).toContain("releases/latest/download/Invictus.apk");
  });

  it("exposes resolveUrl helper on NativeAppUpdater", () => {
    expect(typeof NativeAppUpdater.resolveUrl).toBe("function");
    const resolved = NativeAppUpdater.resolveUrl("/downloads/Invictus.apk");
    expect(resolved.startsWith("https://")).toBe(true);
  });
});
