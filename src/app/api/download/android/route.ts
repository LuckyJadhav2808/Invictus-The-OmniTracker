import { NextResponse } from "next/server";
import { APP_VERSION_CONFIG } from "@/config/version";
import { connectToDatabase } from "@/lib/mongodb";
import { AppRelease } from "@/models/AppRelease";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedVersion = searchParams.get("v");
  const forcePage = searchParams.get("page") === "true";

  // Resolve real APK asset URL
  if (!forcePage) {
    const targetVer = requestedVersion || APP_VERSION_CONFIG.version;
    let directDownloadUrl = `https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker/releases/download/v${targetVer}/Invictus.apk`;
    let sha256 = "";

    // 1. Check local self-hosted public/downloads/Invictus.apk first (100% GitHub-free)
    const localApkPath = path.join(process.cwd(), "public", "downloads", "Invictus.apk");
    if (fs.existsSync(localApkPath)) {
      directDownloadUrl = "/downloads/Invictus.apk";
    }

    // 2. Check self-hosted AppRelease in MongoDB
    try {
      await connectToDatabase();
      const releaseDoc = await AppRelease.findOne({
        version: targetVer,
        isActive: true,
      });

      if (releaseDoc && releaseDoc.apkDownloadUrl && !releaseDoc.apkDownloadUrl.startsWith("/api/download")) {
        directDownloadUrl = releaseDoc.apkDownloadUrl;
        sha256 = releaseDoc.apkSha256 || "";
      }
    } catch {
      // Fallback cleanly
    }

    // 3. Fallback to GitHub releases only if neither local file nor MongoDB release is available
    if (directDownloadUrl.includes("github.com")) {
      try {
        const releaseApiUrl = `https://api.github.com/repos/LuckyJadhav2808/Invictus-The-OmniTracker/releases/tags/v${targetVer}`;

        const ghRes = await fetch(releaseApiUrl, {
          headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Invictus-Downloader",
          },
          cache: "no-store",
        });

        if (ghRes.ok) {
          const data = await ghRes.json();
          if (Array.isArray(data.assets)) {
            const apk = data.assets.find((a: any) => a.name?.endsWith(".apk"));
            if (apk && apk.browser_download_url) {
              directDownloadUrl = apk.browser_download_url;
            }
          }
        }
      } catch {
        // Fallback cleanly
      }
    }

    return NextResponse.redirect(directDownloadUrl, {
      status: 302,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  }

  // Resilient Fallback HTML Page
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invictus Android APK</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background-color: #FAF8F5; color: #161514; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: white; border: 3px solid #161514; border-radius: 24px; padding: 32px 24px; max-width: 440px; width: 100%; box-shadow: 6px 6px 0px 0px #161514; text-align: center; }
    .badge { display: inline-block; background: #CEF431; color: #161514; font-size: 11px; font-weight: 900; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; border: 2px solid #161514; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 900; text-transform: uppercase; margin-bottom: 8px; }
    p { font-size: 13px; font-weight: 600; color: #565C6B; line-height: 1.5; margin-bottom: 24px; }
    .btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px 16px; border-radius: 16px; border: 2px solid #161514; font-size: 13px; font-weight: 900; text-transform: uppercase; text-decoration: none; cursor: pointer; transition: transform 0.1s; margin-bottom: 12px; }
    .btn-primary { background: #161514; color: white; box-shadow: 3px 3px 0px 0px #CEF431; }
    .btn-primary:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0px 0px #CEF431; }
    .btn-secondary { background: #FAF8F5; color: #161514; box-shadow: 3px 3px 0px 0px #161514; }
    .btn-secondary:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0px 0px #161514; }
    .steps { text-align: left; background: #FAF8F5; border: 2px solid #161514; border-radius: 16px; padding: 16px; margin-bottom: 20px; font-size: 12px; font-weight: 700; line-height: 1.6; }
    .steps ol { padding-left: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🤖 Self-Hosted Android Gateway</div>
    <h1>Invictus v${requestedVersion || APP_VERSION_CONFIG.version} APK</h1>
    <p>Download the standalone APK directly without third-party app stores or GitHub limits:</p>

    <div class="steps">
      <div style="font-weight: 900; margin-bottom: 6px; text-transform: uppercase; font-size: 11px; color: #161514;">⚡ Quick Install Options:</div>
      <ol>
        <li>Tap <b>Direct Download</b> below.</li>
        <li>Open the downloaded APK and tap <b>Install / Update</b>.</li>
      </ol>
    </div>

    <a href="/downloads/Invictus.apk" class="btn btn-primary">
      ⚡ Direct In-App APK Download
    </a>
    <a href="/" class="btn btn-secondary">
      Return to Invictus Web
    </a>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
