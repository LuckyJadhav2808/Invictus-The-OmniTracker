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
  version: "1.8.4",
  buildNumber: 35,
  releaseDate: "November 21, 2026",
  channel: "stable",
  minSupportedVersion: "1.0.0",
  githubRepoUrl: "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker",
  latestReleaseApiUrl: "https://api.github.com/repos/LuckyJadhav2808/Invictus-The-OmniTracker/releases/latest",
  changelog: [
    "⚡ Ambient Quick-Expense Micro-Dialog Overhaul: Fixed dark mode keypad and habit chip contrast in native Android dialog with electric lime feedback, full theme adaptability, and OEM tint immunity",
    "☁️ Cloud Webhook & Bi-Directional Offline Sync: Enabled direct structured expense ingestion in /api/money/sms-webhook with automatic MongoDB persistence and instant app-resume cache synchronization",
    "🔔 Notification Logger & Android Quick Settings Tile: 1-tap persistent notification shade logger with live safe spend telemetry and native Quick Settings tile beside Wi-Fi & Bluetooth",
    "💎 Space Header Stacking & Mini-Cockpit Polish: Solved profile dropdown z-index stacking over money card decks and streamlined mini-island sticky bars",
    "🌅 Unified Daily Command Deck & Chronological Agenda: Streamlined Today cockpit with 7-day horizon scrubber, live Safe Spend pacing, and high-performance mobile runtime",
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
