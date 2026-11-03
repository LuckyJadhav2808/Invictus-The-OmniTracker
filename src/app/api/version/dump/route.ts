import { NextResponse } from "next/server";
import { APP_VERSION_CONFIG } from "@/config/version";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const versionJsonPath = path.join(process.cwd(), "public", "version.json");

    if (fs.existsSync(versionJsonPath)) {
      const raw = fs.readFileSync(versionJsonPath, "utf8");
      const data = JSON.parse(raw);
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Content-Type": "application/json",
        },
      });
    }

    // Dynamic runtime fallback if public/version.json has not been dumped yet
    const localApkPath = path.join(process.cwd(), "public", "downloads", "Invictus.apk");
    const apkExists = fs.existsSync(localApkPath);
    let apkSizeBytes = 0;
    if (apkExists) {
      try {
        apkSizeBytes = fs.statSync(localApkPath).size;
      } catch {}
    }

    const fallbackDump = {
      application: "Invictus Life OS & Omni-Tracker",
      version: APP_VERSION_CONFIG.version,
      buildNumber: APP_VERSION_CONFIG.buildNumber,
      channel: APP_VERSION_CONFIG.channel,
      releaseDate: APP_VERSION_CONFIG.releaseDate,
      minSupportedVersion: APP_VERSION_CONFIG.minSupportedVersion,
      git: {
        commitHash: process.env.VERCEL_GIT_COMMIT_SHA || "local-build",
        shortHash: (process.env.VERCEL_GIT_COMMIT_SHA || "local").substring(0, 7),
        branch: process.env.VERCEL_GIT_COMMIT_REF || "main",
        commitAuthor: "Lucky Jadhav",
        commitDate: new Date().toISOString(),
        commitMessage: "Invictus Release",
      },
      apk: {
        exists: apkExists,
        fileName: "Invictus.apk",
        sha256: "",
        sizeBytes: apkSizeBytes,
        sizeFormatted: apkSizeBytes > 0 ? `${(apkSizeBytes / (1024 * 1024)).toFixed(2)} MB` : "N/A",
        directDownloadUrl: "https://invictus-the-omni-tracker.vercel.app/downloads/Invictus.apk",
        githubReleaseAssetUrl: `https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker/releases/download/v${APP_VERSION_CONFIG.version}/Invictus.apk`,
      },
      changelog: APP_VERSION_CONFIG.changelog,
      links: {
        repoUrl: APP_VERSION_CONFIG.githubRepoUrl,
        latestReleaseUrl: `${APP_VERSION_CONFIG.githubRepoUrl}/releases/latest`,
        inAppDownloadUrl: "https://invictus-the-omni-tracker.vercel.app/downloads/Invictus.apk",
        githubAssetDownloadUrl: `https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker/releases/download/v${APP_VERSION_CONFIG.version}/Invictus.apk`,
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        generatedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(fallbackDump, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to read version dump telemetry",
        version: APP_VERSION_CONFIG.version,
        buildNumber: APP_VERSION_CONFIG.buildNumber,
      },
      { status: 500 }
    );
  }
}
