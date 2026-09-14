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
  version: "1.3.0",
  buildNumber: 13,
  releaseDate: "September 14, 2026",
  channel: "stable",
  minSupportedVersion: "1.0.0",
  githubRepoUrl: "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker",
  latestReleaseApiUrl: "https://api.github.com/repos/LuckyJadhav2808/Invictus-The-OmniTracker/releases/latest",
  changelog: [
    "📱 2x2 Android Home Screen Widget (Safe-to-Spend & Liquidity Tracker)",
    "💳 Active UPI vs Cash Liquidity Split with Daily Burn Pace",
    "⚡ 1-Tap Native Android Shortcuts (Quick Expense, Habits, Gym Split, Study)",
    "🛡️ Multi-Layer Database Security Hardening & Zero-Data-Loss Architecture",
    "📅 Streak Freeze Protection Tokens & Exam Countdown Synchronization",
    "💧 Real-Time Water Intake Log with Visual ml Level Indicator",
    "✨ Native Haptic Feedback & Seamless Offline Cache Sync",
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
