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
  version: "1.8.0",
  buildNumber: 31,
  releaseDate: "November 4, 2026",
  channel: "stable",
  minSupportedVersion: "1.0.0",
  githubRepoUrl: "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker",
  latestReleaseApiUrl: "https://api.github.com/repos/LuckyJadhav2808/Invictus-The-OmniTracker/releases/latest",
  changelog: [
    "🏛️ Sovereign Roman Monolith Asset Synchronizer: Unified Roman Monolith 'I' geometry across Web, PWA, and Android launcher mipmaps, adaptive foregrounds, splash screens, widget previews, and notification silhouettes",
    "💎 Financial Cockpit & Wallet Architecture: Slashed vertical height by 65%, removed visual clutter, introduced a 34px high-speed horizontal category wallet filter rail, and isolated the floating calculator",
    "🔔 Proactive Calm Reminder Banner: Replaced fluorescent yellow modal with calm #1C1A18 obsidian HUD, persistent localStorage dismissals, and non-intrusive timing",
    "⚡ Production Database Scaling: Added MongoDB connection pooling (maxPoolSize: 10, minPoolSize: 2, socketTimeoutMS: 45000), compound ESR indexes (userId + isExpense + date), and eliminated the N+1 findOne query loop",
    "📦 Resilient In-App APK Updater: Version Dump Engine with direct self-hosted streaming, multi-hop redirect resolution, and zero-404 air-gapped GitHub fallback",
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
