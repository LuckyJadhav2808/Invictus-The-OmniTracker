import { NextResponse } from "next/server";
import { APP_VERSION_CONFIG, compareSemver } from "@/config/version";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let latestVersion = APP_VERSION_CONFIG.version;
    let releaseTitle = `Invictus v${APP_VERSION_CONFIG.version}`;
    let releaseNotes = APP_VERSION_CONFIG.changelog;
    let downloadUrl = `${APP_VERSION_CONFIG.githubRepoUrl}/releases/latest`;
    let apkDownloadUrl = "/api/download/android";
    let publishedAt = APP_VERSION_CONFIG.releaseDate;

    // Attempt to query GitHub Releases API
    try {
      const response = await fetch(APP_VERSION_CONFIG.latestReleaseApiUrl, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Invictus-App-Version-Checker",
        },
        next: { revalidate: 60 },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tag_name) {
          latestVersion = data.tag_name.replace(/^v/i, "");
          releaseTitle = data.name || `Invictus ${data.tag_name}`;
          downloadUrl = data.html_url || downloadUrl;
          publishedAt = data.published_at ? new Date(data.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : publishedAt;

          if (data.body) {
            const lines = data.body
              .split("\n")
              .map((l: string) => l.trim())
              .filter((l: string) => l.startsWith("-") || l.startsWith("*") || l.startsWith("•"))
              .map((l: string) => l.replace(/^[-*•]\s*/, ""));
            if (lines.length > 0) {
              releaseNotes = lines;
            }
          }

          // Check if Invictus.apk is attached in assets
          if (Array.isArray(data.assets)) {
            const apkAsset = data.assets.find((a: any) => a.name?.endsWith(".apk"));
            if (apkAsset && apkAsset.browser_download_url) {
              apkDownloadUrl = apkAsset.browser_download_url;
            }
          }
        }
      }
    } catch {
      // Fallback cleanly to internal version config
    }

    const currentVersion = APP_VERSION_CONFIG.version;
    const hasUpdate = compareSemver(latestVersion, currentVersion) > 0;
    const isMandatory = compareSemver(currentVersion, APP_VERSION_CONFIG.minSupportedVersion) < 0;

    return NextResponse.json({
      currentVersion,
      latestVersion,
      hasUpdate,
      isMandatory,
      channel: APP_VERSION_CONFIG.channel,
      buildNumber: APP_VERSION_CONFIG.buildNumber,
      title: releaseTitle,
      releaseNotes,
      downloadUrl,
      apkDownloadUrl,
      publishedAt,
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
