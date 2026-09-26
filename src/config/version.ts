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
  version: "1.5.0",
  buildNumber: 19,
  releaseDate: "September 26, 2026",
  channel: "stable",
  minSupportedVersion: "1.0.0",
  githubRepoUrl: "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker",
  latestReleaseApiUrl: "https://api.github.com/repos/LuckyJadhav2808/Invictus-The-OmniTracker/releases/latest",
  changelog: [
    "📅 On-Demand Bank SMS Fetcher: Read and import transactions from your Android message inbox by specific day, past 3-7 days, or custom date",
    "🎚️ Tracking Mode Preference: Switch between Manual Only mode (zero permissions) and SMS-Assisted Mode with 1 tap",
    "📋 Smart SMS Batch Importer: Paste and parse multiple bank SMS messages on desktop and web with instant category suggestions",
    "⚡ Batch Ledger Sync: High-efficiency bulk transaction processing with automatic duplicate suppression",
    "🔄 Dynamic User SharedPreferences: Native background SMS receiver automatically links alerts to the active logged-in user",
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
