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
  version: "1.4.0",
  buildNumber: 17,
  releaseDate: "September 25, 2026",
  channel: "stable",
  minSupportedVersion: "1.0.0",
  githubRepoUrl: "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker",
  latestReleaseApiUrl: "https://api.github.com/repos/LuckyJadhav2808/Invictus-The-OmniTracker/releases/latest",
  changelog: [
    "⚡ Zero-Knowledge Bank SMS Auto-Tracker: Automated expense detection with TRAI DLT header whitelist",
    "🛡️ Strict Privacy Engine: Automatic balance clause and OTP stripper (0 private balances or credentials stored)",
    "📥 Pending Inflow Review Inbox: Granular review workflow for credited transactions (Confirm Income vs Bill Split vs Dismiss)",
    "📱 Native Android Background Receiver: Headless SMS broadcast listener wakes up instantly even when Invictus is closed",
    "🧠 Historical Merchant Memory: Learns and auto-categorizes recurring peer & vendor transactions (e.g. UPI contacts)",
    "☁️ Task Space Cloud Sync: Full cloud CRUD persistence with real-time multi-device sync and auth session alignment",
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
