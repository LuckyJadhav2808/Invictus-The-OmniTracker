import { describe, it, expect } from "vitest";
import { initNativeStatusBar } from "./status-bar";

describe("initNativeStatusBar helper", () => {
  it("exports a valid function", () => {
    expect(initNativeStatusBar).toBeDefined();
    expect(typeof initNativeStatusBar).toBe("function");
  });

  it("handles non-native and SSR gracefully without throwing", async () => {
    await expect(initNativeStatusBar(false)).resolves.toBeUndefined();
    await expect(initNativeStatusBar(true)).resolves.toBeUndefined();
  });
});
