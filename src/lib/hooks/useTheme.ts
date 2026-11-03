"use client";

import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "theme";
const THEME_CHANGE_EVENT = "invictus-theme-change";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
  } catch {}
  return "system";
}

export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyThemeToDOM(mode: ThemeMode): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  
  const resolved = mode === "system" ? getSystemTheme() : mode;
  const root = document.documentElement;
  
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  return resolved;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Sync state on mount and subscribe to changes
  useEffect(() => {
    setMounted(true);
    const initialTheme = getStoredTheme();
    setThemeState(initialTheme);
    const initialResolved = applyThemeToDOM(initialTheme);
    setResolvedTheme(initialResolved);

    // Listener for cross-component theme changes
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: ThemeMode; resolved: "light" | "dark" }>;
      if (customEvent.detail) {
        setThemeState(customEvent.detail.theme);
        setResolvedTheme(customEvent.detail.resolved);
      } else {
        const current = getStoredTheme();
        setThemeState(current);
        setResolvedTheme(applyThemeToDOM(current));
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);

    // Listener for OS system theme change
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      const current = getStoredTheme();
      if (current === "system") {
        const resolved = applyThemeToDOM("system");
        setResolvedTheme(resolved);
      }
    };

    mediaQuery.addEventListener("change", handleMediaChange);

    // Global Keyboard Shortcut: ⌘D or Ctrl+D toggles theme
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        // Prevent default browser bookmark shortcut
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
    
    setThemeState(newTheme);
    const resolved = applyThemeToDOM(newTheme);
    setResolvedTheme(resolved);

    // Broadcast change
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(THEME_CHANGE_EVENT, {
          detail: { theme: newTheme, resolved },
        })
      );
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: "light" | "dark" = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === "dark",
    mounted,
  };
}
