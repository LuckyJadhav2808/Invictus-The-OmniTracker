export interface AppVersionInfo {
  version: string;
  buildNumber: number;
  releaseDate: string;
  channel: "stable" | "beta";
  changelog: string[];
  minSupportedVersion: string;
  githubRepoUrl: string;
  latestReleaseApiUrl: string;
}

export const APP_VERSION_CONFIG: AppVersionInfo = {
  version: "1.7.9",
  buildNumber: 30,
  releaseDate: "November 4, 2026",
  channel: "stable",
  minSupportedVersion: "1.0.0",
  githubRepoUrl: "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker",
  latestReleaseApiUrl: "https://api.github.com/repos/LuckyJadhav2808/Invictus-The-OmniTracker/releases/latest",
  changelog: [
    "🌓 Full Neobrutalist Dark Mode & Theme Harmonization: Complete zero-blur obsidian contrast overhaul across all 8 spaces (Today, Goals, Money, Study, Tasks, Analytics, Profile, Settings) with instantaneous zero-flicker theme toggle",
    "🦴 Skeletons vs Spinner Loading Engine: Route-preserving Neobrutalist wireframe pulses for page routes, paired with high-energy monogram spinner for indeterminate transitions",
    "🧮 Continuous Arithmetic Calculator: Fluid multi-step chaining (e.g., 2+2+2), operator switching, and 1-tap budget insertion with haptic audio feedback",
    "🚀 First-Run Quick-Start HUD: Instant frictionless onboarding deck with interactive quick-action missions replacing legacy onboarding wizard",
    "📱 Android Safe-Spend Monolith Widget: High-contrast layout, direct SMS sync intents, and native update bridge integration",
    "📦 Resilient In-App APK Downloader: Direct in-app updates with multi-hop redirect streaming, Android User-Agent header bypass, and live version dump telemetry engine",
  ],
};

/**
 * Compare two semver strings: returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareSemver(v1: string, v2: string): number {
  const cleanV1 = v1.replace(/^v/i, "").trim().split(".").map((n) => parseInt(n, 10) || 0);
  const cleanV2 = v2.replace(/^v/i, "").trim().split(".").map((n) => parseInt(n, 10) || 0);

  for (let i = 0; i < Math.max(cleanV1.length, cleanV2.length); i++) {
    const num1 = cleanV1[i] || 0;
    const num2 = cleanV2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}
