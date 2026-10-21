import { NextResponse } from "next/server";
import { APP_VERSION_CONFIG, compareSemver } from "@/config/version";
import { connectToDatabase } from "@/lib/mongodb";
import { AppRelease } from "@/models/AppRelease";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientInstalledVersion =
      searchParams.get("installedVersion") ||
      searchParams.get("clientVersion") ||
      request.headers.get("x-app-version") ||
      APP_VERSION_CONFIG.version;

    let latestVersion = APP_VERSION_CONFIG.version;
    let buildNumber = APP_VERSION_CONFIG.buildNumber;
    let releaseTitle = `Invictus v${APP_VERSION_CONFIG.version}`;
    let releaseNotes = APP_VERSION_CONFIG.changelog;
    let downloadUrl = `${APP_VERSION_CONFIG.githubRepoUrl}/releases/latest`;
    let apkDownloadUrl = "/api/download/android";
    let publishedAt = APP_VERSION_CONFIG.releaseDate;
    let apkSha256 = "";
    let apkSizeBytes = 0;
    let otaBundleUrl = "";
    let isMandatoryConfig = false;

    // 1. Primary Source: Check MongoDB self-hosted release registry (0ms GitHub-independent)
    try {
      await connectToDatabase();
      const releaseDoc = await AppRelease.findOne({ isActive: true }).sort({ buildNumber: -1 });
      if (releaseDoc) {
        latestVersion = releaseDoc.version;
        buildNumber = releaseDoc.buildNumber;
        releaseTitle = `Invictus v${releaseDoc.version}`;
        if (releaseDoc.changelog?.length) {
          releaseNotes = releaseDoc.changelog;
        }
        publishedAt = releaseDoc.releaseDate;
        apkDownloadUrl = releaseDoc.apkDownloadUrl || "/api/download/android";
        apkSha256 = releaseDoc.apkSha256 || "";
        apkSizeBytes = releaseDoc.apkSizeBytes || 0;
        otaBundleUrl = releaseDoc.otaBundleUrl || "";
        isMandatoryConfig = Boolean(releaseDoc.isMandatory);
      }
    } catch (dbErr) {
      // Clean fallback if MongoDB is unreachable
      console.warn("Self-hosted manifest lookup skipped DB, using static version config:", dbErr);
    }

    // 2. Check local self-hosted public/downloads/Invictus.apk
    try {
      const localApkPath = path.join(process.cwd(), "public", "downloads", "Invictus.apk");
      if (fs.existsSync(localApkPath)) {
        if (!apkDownloadUrl || apkDownloadUrl.includes("github.com") || apkDownloadUrl === "/api/download/android") {
          apkDownloadUrl = "/downloads/Invictus.apk";
        }
        if (!apkSizeBytes) {
          apkSizeBytes = fs.statSync(localApkPath).size;
        }
      }
    } catch {}

    const effectiveTargetVersion =
      compareSemver(latestVersion, APP_VERSION_CONFIG.version) >= 0
        ? latestVersion
        : APP_VERSION_CONFIG.version;

    const hasUpdate = compareSemver(effectiveTargetVersion, clientInstalledVersion) > 0;
    const isMandatory =
      isMandatoryConfig ||
      compareSemver(clientInstalledVersion, APP_VERSION_CONFIG.minSupportedVersion) < 0;

    return NextResponse.json({
      currentVersion: clientInstalledVersion,
      latestVersion: effectiveTargetVersion,
      buildNumber,
      hasUpdate,
      isMandatory,
      channel: APP_VERSION_CONFIG.channel,
      title: releaseTitle,
      releaseNotes,
      downloadUrl,
      apkDownloadUrl,
      apkSha256,
      apkSizeBytes,
      otaBundleUrl,
      publishedAt,
      provider: "in-app-manifest",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to check version",
        currentVersion: APP_VERSION_CONFIG.version,
        latestVersion: APP_VERSION_CONFIG.version,
        hasUpdate: false,
        isMandatory: false,
      },
      { status: 500 }
    );
  }
}
