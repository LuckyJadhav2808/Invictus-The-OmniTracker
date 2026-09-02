import { NextResponse } from "next/server";
import { APP_VERSION_CONFIG } from "@/config/version";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedVersion = searchParams.get("v") || APP_VERSION_CONFIG.version;

  try {
    // 1. Try to find published release asset from GitHub API
    const res = await fetch(
      `https://api.github.com/repos/LuckyJadhav2808/Invictus-The-OmniTracker/releases/tags/v${requestedVersion}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Invictus-App-Server",
        },
        next: { revalidate: 60 },
      }
    );

    if (res.ok) {
      const releaseData = await res.json();
      const apkAsset = releaseData.assets?.find((a: any) =>
        a.name?.toLowerCase().endsWith(".apk")
      );

      if (apkAsset?.browser_download_url) {
        return NextResponse.redirect(apkAsset.browser_download_url, {
          status: 302,
          headers: {
            "Content-Disposition": `attachment; filename="Invictus-v${requestedVersion}.apk"`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
      }
    }

    // 2. Try latest release if specific version tag not found
    const latestRes = await fetch(
      "https://api.github.com/repos/LuckyJadhav2808/Invictus-The-OmniTracker/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Invictus-App-Server",
        },
        next: { revalidate: 60 },
      }
    );

    if (latestRes.ok) {
      const latestData = await latestRes.json();
      const apkAsset = latestData.assets?.find((a: any) =>
        a.name?.toLowerCase().endsWith(".apk")
      );

      if (apkAsset?.browser_download_url) {
        return NextResponse.redirect(apkAsset.browser_download_url, {
          status: 302,
        });
      }
    }
  } catch (err) {
    console.error("[Download Android Error]:", err);
  }

  // 3. Resilient Fallback HTML Page
  // Never crash or leave the user on a raw 404 or blocked frame.
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
    <div class="badge">🤖 Android Distribution Gateway</div>
    <h1>Invictus v${requestedVersion} APK</h1>
    <p>The standalone APK is queued on GitHub CI/CD Actions or pending publication. You can install it right now using one of the methods below:</p>

    <div class="steps">
      <div style="font-weight: 900; margin-bottom: 6px; text-transform: uppercase; font-size: 11px; color: #161514;">⚡ Quick Install Options:</div>
      <ol>
        <li><strong>Option 1 (Instant):</strong> Tap "Add to Home Screen" in your Chrome/Brave menu to install as a full native PWA.</li>
        <li><strong>Option 2 (Raw APK):</strong> Download the latest compiled debug build directly from GitHub Actions runs below.</li>
      </ol>
    </div>

    <a href="${APP_VERSION_CONFIG.githubRepoUrl}/actions" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
      <span>📦 View CI/CD Artifacts & Builds ↗</span>
    </a>

    <a href="/settings" class="btn btn-secondary">
      <span>⬅ Return to Settings</span>
    </a>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store",
    },
  });
}
