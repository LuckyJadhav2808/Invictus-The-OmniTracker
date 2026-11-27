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
  version: "1.8.5",
  buildNumber: 36,
  releaseDate: "November 27, 2026",
  channel: "stable",
  minSupportedVersion: "1.0.0",
  githubRepoUrl: "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker",
  latestReleaseApiUrl: "https://api.github.com/repos/LuckyJadhav2808/Invictus-The-OmniTracker/releases/latest",
  changelog: [
    "🌸 Desktop Diagonal Flower Menu & Quick Actions: Added bottom-right 90° diagonal quick-action flower on desktop, top-level Money Log Expense CTA, and unified zero-scroll Transaction modal with sticky footer",
    "💧 3D Physics Liquid Hydration & Flickable Spending Ring: Integrated Kokonut UI LiquidSlider with ||| L custom capacity menu and physics-driven SpendingRing with real MoM % deltas",
    "📸 Native ML Kit & Spatial Receipt OCR: Wired @capacitor-mlkit/text-recognition for Android, Bradley-Roth adaptive thresholding, bounding-box row pairing, and chrono/fuse/compromise/currency parsing",
    "💬 Dual-Engine Bank SMS & Category Fix: Wired transaction-sms-parser with TRAI DLT header support, global pending-SMS review toast, and eliminated junk merchant category creation",
    "🔗 Universal Cross-Page Event Bridge: Fixed every Flower Menu petal and subpage action across Today, Habits, Tasks, Money, and all subroutes",
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
