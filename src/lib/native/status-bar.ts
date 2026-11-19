"use client";

import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

/**
 * Initializes and calibrates the native Android & iOS Status Bar.
 * - Prevents header collision with status bar icons / hole-punch cameras.
 * - Dynamically retrieves status bar height and sets --native-status-bar-height CSS variable.
 * - Synchronizes light/dark status bar text contrast.
 */
export async function initNativeStatusBar(isDark: boolean = false): Promise<void> {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) return;

  try {
    // 1. Attempt to disable overlay on Android < 15
    await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});

    // 2. Query exact hardware status bar height from Android/iOS WindowInsets
    const info = await StatusBar.getInfo().catch(() => null);
    if (info && typeof info.height === "number" && info.height > 0) {
      document.documentElement.style.setProperty(
        "--native-status-bar-height",
        `${info.height}px`
      );
    } else {
      // Sane mobile hardware fallback (36px status bar height on modern punch-hole Android devices)
      document.documentElement.style.setProperty(
        "--native-status-bar-height",
        "36px"
      );
    }

    // 3. Set foreground icon contrast (Style.Dark = light text for dark surfaces; Style.Light = dark text for light surfaces)
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});

    // 4. Set solid surface background color
    await StatusBar.setBackgroundColor({
      color: isDark ? "#161514" : "#FAF8F5",
    }).catch(() => {});
  } catch (err) {
    console.warn("[StatusBar] could not initialize native status bar:", err);
  }
}
