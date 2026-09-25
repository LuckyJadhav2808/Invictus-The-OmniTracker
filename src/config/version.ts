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
  version: "1.4.1",
  buildNumber: 18,
  releaseDate: "September 25, 2026",
  channel: "stable",
  minSupportedVersion: "1.0.0",
  githubRepoUrl: "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker",
  latestReleaseApiUrl: "https://api.github.com/repos/LuckyJadhav2808/Invictus-The-OmniTracker/releases/latest",
  changelog: [
    "🔑 Native Android SMS Permission Bridge: Interactive system dialog with granular permission granting & app settings fallback",
    "☁️ Cloud Budget Sync: Daily budget cap and monthly budget preferences are now permanently backed up to MongoDB Atlas across app updates",
    "⚡ Enhanced 1-Rupee & UPI Extraction: Added Re. singular support and expanded bank header directory across all Indian financial institutions",
    "🎨 Neobrutalist SMS Settings Card: Relocated tracker toggle to Settings with high-contrast tactile styling and live sync indicator",
    "🛠️ Fixed Android Broadcast Receiver Bug: Removed signature-level permission restriction to guarantee instant SMS interception",
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
