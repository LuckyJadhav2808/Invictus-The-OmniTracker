"use client";

import { useState, useEffect, useCallback } from "react";
import { soundFX } from "@/components/shared/SoundFX";
import { triggerHaptic } from "@/lib/native/haptics";

export type ColorThemeId = "classic" | "terracotta" | "amber" | "cobalt";

export interface ColorThemeDefinition {
  id: ColorThemeId;
  name: string;
  tagline: string;
  description: string;
  swatches: {
    canvas: string;   // Cream paper background
    ink: string;      // Obsidian border & typography
    accent: string;   // Punch action color for buttons
  };
  buttonPreview: {
    label: string;
    bg: string;
    fg: string;
  };
}

export const COLOR_THEMES: ColorThemeDefinition[] = [
  {
    id: "classic",
    name: "Classic Cyber",
    tagline: "Cream + Obsidian + Electric Lime",
    description: "The original Invictus high-voltage cyberpunk neon signature.",
    swatches: {
      canvas: "#FAF8F5",
      ink: "#161514",
      accent: "#CEF431",
    },
    buttonPreview: {
      label: "+ Action",
      bg: "#CEF431",
      fg: "#161514",
    },
  },
  {
    id: "terracotta",
    name: "Terracotta Signal",
    tagline: "Cream + Obsidian + Signal Orange",
    description: "Warm tactile paper, deep ink, and high-visibility rescue orange action punch.",
    swatches: {
      canvas: "#FAF8F5",
      ink: "#161514",
      accent: "#FF5C00",
    },
    buttonPreview: {
      label: "+ Action",
      bg: "#FF5C00",
      fg: "#161514",
    },
  },
  {
    id: "amber",
    name: "Industrial Amber",
    tagline: "Cream + Obsidian + High-Voltage Amber",
    description: "Swiss architectural print meets industrial flight telemetry warmth.",
    swatches: {
      canvas: "#FAF8F5",
      ink: "#161514",
      accent: "#F59E0B",
    },
    buttonPreview: {
      label: "+ Action",
      bg: "#F59E0B",
      fg: "#161514",
    },
  },
  {
    id: "cobalt",
    name: "Sovereign Cobalt",
    tagline: "Cream + Obsidian + Royal Klein Blue",
    description: "Roman marble foundations energized with radiant sovereign blue.",
    swatches: {
      canvas: "#FAF8F5",
      ink: "#161514",
      accent: "#2563EB",
    },
    buttonPreview: {
      label: "+ Action",
      bg: "#2563EB",
      fg: "#FFFFFF",
    },
  },
];

const STORAGE_KEY = "invictus-color-theme";
const EVENT_NAME = "invictus-color-theme-change";

export function getStoredColorTheme(): ColorThemeId {
  if (typeof window === "undefined") return "classic";
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ColorThemeId | null;
    if (saved && COLOR_THEMES.some((t) => t.id === saved)) {
      return saved;
    }
  } catch {}
  return "classic";
}

export function applyColorThemeToDOM(themeId: ColorThemeId): void {
  if (typeof window === "undefined") return;
  document.documentElement.setAttribute("data-color-theme", themeId);
}

export function useColorTheme() {
  const [colorTheme, setColorThemeState] = useState<ColorThemeId>("classic");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initial = getStoredColorTheme();
    setColorThemeState(initial);
    applyColorThemeToDOM(initial);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ colorTheme: ColorThemeId }>;
      if (customEvent.detail?.colorTheme) {
        setColorThemeState(customEvent.detail.colorTheme);
      } else {
        const current = getStoredColorTheme();
        setColorThemeState(current);
        applyColorThemeToDOM(current);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const next = e.newValue as ColorThemeId;
        if (COLOR_THEMES.some((t) => t.id === next)) {
          setColorThemeState(next);
          applyColorThemeToDOM(next);
        }
      }
    };

    window.addEventListener(EVENT_NAME, handleThemeChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handleThemeChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const setColorTheme = useCallback((newTheme: ColorThemeId, playAudio = true) => {
    if (playAudio) {
      soundFX.playPop();
      triggerHaptic("light");
    }

    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {}

    setColorThemeState(newTheme);
    applyColorThemeToDOM(newTheme);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(EVENT_NAME, {
          detail: { colorTheme: newTheme },
        })
      );
    }
  }, []);

  const currentTheme = COLOR_THEMES.find((t) => t.id === colorTheme) || COLOR_THEMES[0];

  return {
    colorTheme,
    setColorTheme,
    themes: COLOR_THEMES,
    currentTheme,
    mounted,
  };
}
