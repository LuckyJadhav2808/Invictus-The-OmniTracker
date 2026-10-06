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
  version: "1.7.0",
  buildNumber: 21,
  releaseDate: "October 6, 2026",
  channel: "stable",
  minSupportedVersion: "1.0.0",
  githubRepoUrl: "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker",
  latestReleaseApiUrl: "https://api.github.com/repos/LuckyJadhav2808/Invictus-The-OmniTracker/releases/latest",
  changelog: [
    "🏛️ Concept 3 Monolith Brand Redesign: Replaced legacy gladiator helmet with the architectural 'I' pillar of strength, high-contrast favicons, Apple touch icon, and 5-density Android adaptive launcher icons",
    "⚡ Refined Neobrutalist Android Widget: Clean split-deck daily overview featuring real-time safe-to-spend limit, liquidity breakdown, and interactive habit checklist",
    "📲 In-App APK Updater: Instant background download with live progress and native Android package installer integration",
    "🦊 Interactive Vix Vector Mascot: Expressive animated SVG mascot with glance/blink autonomy, audio feedback, and mood states",
    "🛠️ Neobrutalist UI Upgrades: AdaptiveDrawerDialog, NeobrutalistDateTimePickerModal, and CloudSyncDrawer",
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
