import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  COLOR_THEMES,
  getStoredColorTheme,
  applyColorThemeToDOM,
} from "./useColorTheme";

// WCAG relative luminance & contrast ratio calculation
function getLuminance(hex: string): number {
  const sanitized = hex.replace("#", "");
  const r = parseInt(sanitized.substring(0, 2), 16) / 255;
  const g = parseInt(sanitized.substring(2, 4), 16) / 255;
  const b = parseInt(sanitized.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Invictus Color Theme Architecture Engine", () => {
  let mockStorage: Record<string, string> = {};
  let rootAttributes: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    rootAttributes = {};

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
        setAttribute: vi.fn((name: string, value: string) => {
          rootAttributes[name] = value;
        }),
        getAttribute: vi.fn((name: string) => rootAttributes[name] ?? null),
        removeAttribute: vi.fn((name: string) => {
          delete rootAttributes[name];
        }),
      },
    };

    vi.stubGlobal("localStorage", mockLocalStorage);
    vi.stubGlobal("document", mockDocument);
    vi.stubGlobal("window", { localStorage: mockLocalStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Theme Registry & Palette Definitions", () => {
    it("contains all required themes including Classic and Terracotta Signal Orange", () => {
      const themeIds = COLOR_THEMES.map((t) => t.id);
      expect(themeIds).toContain("classic");
      expect(themeIds).toContain("terracotta");
      expect(themeIds).toContain("amber");
      expect(themeIds).toContain("cobalt");
    });

    it("verifies Terracotta theme matches the exact 3-color spec (Cream + Obsidian + Signal Orange)", () => {
      const terracotta = COLOR_THEMES.find((t) => t.id === "terracotta");
      expect(terracotta).toBeDefined();
      expect(terracotta?.swatches.canvas).toBe("#FAF8F5"); // Cream
      expect(terracotta?.swatches.ink).toBe("#161514");    // Obsidian Black
      expect(terracotta?.swatches.accent).toBe("#FF5C00"); // Signal Orange
    });

    it("enforces WCAG AA text contrast (>= 4.5:1) for all button preview foregrounds and backgrounds", () => {
      COLOR_THEMES.forEach((theme) => {
        const ratio = getContrastRatio(theme.buttonPreview.bg, theme.buttonPreview.fg);
        // All button text must pass WCAG AA (ratio >= 4.5:1)
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    });

    it("guarantees Terracotta Signal button text (#161514 on #FF5C00) passes WCAG AA contrast", () => {
      const terracotta = COLOR_THEMES.find((t) => t.id === "terracotta")!;
      const ratio = getContrastRatio(terracotta.buttonPreview.bg, terracotta.buttonPreview.fg);
      // Expected ratio is ~5.88:1
      expect(ratio).toBeGreaterThan(5.0);
    });
  });

  describe("Storage & Fallback Resilience", () => {
    it("defaults to 'classic' when no theme is stored", () => {
      expect(getStoredColorTheme()).toBe("classic");
    });

    it("reads valid stored theme correctly", () => {
      localStorage.setItem("invictus-color-theme", "terracotta");
      expect(getStoredColorTheme()).toBe("terracotta");
    });

    it("falls back to 'classic' if invalid theme key is in storage", () => {
      localStorage.setItem("invictus-color-theme", "non-existent-theme-xyz");
      expect(getStoredColorTheme()).toBe("classic");
    });
  });

  describe("DOM Application & SSR Safety", () => {
    it("sets data-color-theme attribute on document root", () => {
      applyColorThemeToDOM("terracotta");
      expect(document.documentElement.getAttribute("data-color-theme")).toBe("terracotta");

      applyColorThemeToDOM("classic");
      expect(document.documentElement.getAttribute("data-color-theme")).toBe("classic");
    });
  });
});
