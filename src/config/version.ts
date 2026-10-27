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
  version: "1.7.8",
  buildNumber: 29,
  releaseDate: "October 27, 2026",
  channel: "stable",
  minSupportedVersion: "1.0.0",
  githubRepoUrl: "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker",
  latestReleaseApiUrl: "https://api.github.com/repos/LuckyJadhav2808/Invictus-The-OmniTracker/releases/latest",
  changelog: [
    "🎯 Today & Yesterday 1-Tap Scanner Preset: Dedicated quick-filter spanning current day and day before with real-time telemetry readout",
    "📡 Telecom +91 & 91 Sender Normalization: Seamlessly handles Indian carrier prefixes on bank sender headers (e.g., +91AD-PNBSMS)",
    "💳 FinTech Sender Support: Native recognition for PhonePe, Google Pay, BHIM/NPCI UPI, OneCard, Jupiter, and Fi Money",
    "🕒 IST Timezone Drift Fix: Local device calendar extraction eliminating midnight UTC date slippage",
    "⏱️ Carrier Clock Skew Resilience: 12-hour forward lookahead buffer capturing all fresh same-day transactions",
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
