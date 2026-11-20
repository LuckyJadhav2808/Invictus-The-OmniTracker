import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getStoredTheme,
  getSystemTheme,
  applyThemeToDOM,
} from "./useTheme";

describe("useTheme Architecture & Circular Ripple Animation Engine (animrippletheme)", () => {
  let mockStorage: Record<string, string> = {};
  let classListSet: Set<string> = new Set();

  beforeEach(() => {
    mockStorage = {};
    classListSet = new Set();

    const mockLocalStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = String(value);
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    };

    const mockDocument = {
      documentElement: {
        classList: {
          add: vi.fn((cls: string) => classListSet.add(cls)),
          remove: vi.fn((cls: string) => classListSet.delete(cls)),
          contains: vi.fn((cls: string) => classListSet.has(cls)),
          toggle: vi.fn((cls: string) => {
            if (classListSet.has(cls)) {
              classListSet.delete(cls);
              return false;
            } else {
              classListSet.add(cls);
              return true;
            }
          }),
        },
      },
      startViewTransition: vi.fn((cb: () => void) => {
        cb();
        return {
          ready: Promise.resolve(),
          finished: Promise.resolve(),
        };
      }),
    };

    const mockWindow = {
      localStorage: mockLocalStorage,
      matchMedia: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("dark"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
      innerWidth: 1920,
      innerHeight: 1080,
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.stubGlobal("localStorage", mockLocalStorage);
    vi.stubGlobal("document", mockDocument);
    vi.stubGlobal("window", mockWindow);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retrieves default stored theme as light if unset", () => {
    expect(getStoredTheme()).toBe("light");
  });

  it("stores and retrieves theme correctly from localStorage", () => {
    mockStorage["theme"] = "dark";
    expect(getStoredTheme()).toBe("dark");

    mockStorage["theme"] = "light";
    expect(getStoredTheme()).toBe("light");
  });

  it("applies dark theme by adding .dark class to root", () => {
    const resolved = applyThemeToDOM("dark");
    expect(resolved).toBe("dark");
    expect(classListSet.has("dark")).toBe(true);
  });

  it("applies light theme by removing .dark class from root", () => {
    classListSet.add("dark");
    const resolved = applyThemeToDOM("light");
    expect(resolved).toBe("light");
    expect(classListSet.has("dark")).toBe(false);
  });

  it("resolves system theme based on prefers-color-scheme media query", () => {
    expect(getSystemTheme()).toBe("dark");
    const resolved = applyThemeToDOM("system");
    expect(resolved).toBe("dark");
    expect(classListSet.has("dark")).toBe(true);
  });

  it("handles corrupted or invalid stored theme values gracefully by falling back to light", () => {
    mockStorage["theme"] = "invalid_mode_xyz";
    expect(getStoredTheme()).toBe("light");
  });

  it("falls back cleanly to light when window is undefined (SSR safety)", () => {
    vi.stubGlobal("window", undefined);
    expect(getStoredTheme()).toBe("light");
    expect(getSystemTheme()).toBe("light");
    expect(applyThemeToDOM("dark")).toBe("light");
  });
});
