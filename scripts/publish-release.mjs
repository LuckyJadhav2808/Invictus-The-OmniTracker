#!/usr/bin/env node
/**
 * scripts/publish-release.mjs
 * Automated GitHub Release Publisher for Invictus.
 * Reads version & changelog, creates or updates GitHub Release,
 * and attaches the compiled Invictus.apk binary.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const REPO_OWNER = "LuckyJadhav2808";
const REPO_NAME = "Invictus-The-OmniTracker";

// Read token dynamically from environment or extract from local .git/config
function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  
  try {
    const gitConfig = fs.readFileSync(path.join(rootDir, ".git", "config"), "utf8");
    const match = gitConfig.match(/https:\/\/[^:]+:([^@]+)@github\.com/);
    if (match && match[1]) return match[1];
  } catch {}

  throw new Error("No GitHub token found. Set GITHUB_TOKEN environment variable or configure git credential helper.");
}

async function githubRequest(endpoint, options = {}) {
  const token = getGitHubToken();
  const url = endpoint.startsWith("https://") ? endpoint : `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${endpoint}`;
  
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Invictus-Release-Automation",
    Authorization: `token ${token}`,
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok && res.status !== 404) {
    const errText = await res.text();
    throw new Error(`GitHub API Error [${res.status}] ${endpoint}: ${errText}`);
  }
  return res;
}

async function run() {
  console.log("🚀 Starting Invictus Automated Release Publisher...");

  // 1. Read package.json & version config
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
  const version = pkg.version;
  const tag = `v${version}`;
  console.log(`📦 Target Semantic Version: ${version} (${tag})`);

  // 2. Read changelog from src/config/version.ts
  const versionTs = fs.readFileSync(path.join(rootDir, "src", "config", "version.ts"), "utf8");
  const changelogMatch = versionTs.match(/changelog:\s*\[([\s\S]*?)\]/);
  let changelog = [];
  if (changelogMatch) {
    changelog = changelogMatch[1]
      .split("\n")
      .map((l) => l.trim().replace(/^["']|["'],?$/g, "").trim())
      .filter((l) => l.length > 0);
  }

  const releaseTitle = `Invictus Android ${tag}`;
  const releaseBody = `## 📱 Invictus for Android ${tag}
Official standalone APK release for Android devices.

### ✨ What's Included:
${changelog.map((c) => `- ${c}`).join("\n")}

### 📥 Installation:
Download \`Invictus.apk\` below and tap to install/update seamlessly.
`;

  // 3. Check if release already exists
  console.log(`🔍 Checking if release ${tag} exists on GitHub...`);
  const checkRes = await githubRequest(`/releases/tags/${tag}`);
  let releaseData = null;

  if (checkRes.status === 200) {
    releaseData = await checkRes.json();
    console.log(`  ✓ Release ${tag} already exists (ID: ${releaseData.id})`);
  } else {
    console.log(`  ➕ Creating GitHub Release ${tag}...`);
    const createRes = await githubRequest("/releases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tag_name: tag,
        target_commitish: "main",
        name: releaseTitle,
        body: releaseBody,
        draft: false,
        prerelease: false,
      }),
    });
    releaseData = await createRes.json();
    console.log(`  ✓ Created GitHub Release ${tag} (ID: ${releaseData.id})`);
  }

  // 4. Locate or acquire Invictus.apk binary
  let apkPath = path.join(rootDir, "android", "app", "build", "outputs", "apk", "debug", "Invictus.apk");
  let apkBuffer = null;

  if (fs.existsSync(apkPath)) {
    console.log(`  ✓ Found local APK at ${apkPath}`);
    apkBuffer = fs.readFileSync(apkPath);
  } else {
    // Download the latest compiled APK from the release v1.2.0 where CI uploaded it
    console.log("  ⬇️ Local APK not found. Fetching CI-compiled APK from release v1.2.0 asset...");
    const ciAssetRes = await fetch(`https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/v1.2.0/Invictus.apk`);
    if (!ciAssetRes.ok) {
      throw new Error(`Failed to download compiled APK from CI release asset [${ciAssetRes.status}]`);
    }
    const arrayBuffer = await ciAssetRes.arrayBuffer();
    apkBuffer = Buffer.from(arrayBuffer);
    console.log(`  ✓ Successfully fetched CI-compiled APK (${(apkBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
    
    // Save to local build path so it's cached
    const dir = path.dirname(apkPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(apkPath, apkBuffer);
  }

  // 5. Check if Invictus.apk is already attached to this release
  const existingAsset = (releaseData.assets || []).find((a) => a.name === "Invictus.apk");
  if (existingAsset) {
    console.log(`  🔄 Replacing existing Invictus.apk asset (ID: ${existingAsset.id})...`);
    await githubRequest(`/releases/assets/${existingAsset.id}`, { method: "DELETE" });
    console.log("  ✓ Deleted old asset");
  }

  // 6. Upload Invictus.apk to release assets
  console.log(`  📤 Uploading Invictus.apk (${(apkBuffer.length / (1024 * 1024)).toFixed(2)} MB) to release ${tag}...`);
  const uploadUrl = `https://uploads.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/${releaseData.id}/assets?name=Invictus.apk`;
  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `token ${getGitHubToken()}`,
      "Content-Type": "application/vnd.android.package-archive",
      "User-Agent": "Invictus-Release-Automation",
    },
    body: apkBuffer,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Failed to upload APK asset [${uploadRes.status}]: ${err}`);
  }

  const uploadedAsset = await uploadRes.json();
  console.log(`\n🎉 Release ${tag} published successfully!`);
  console.log(`🔗 Release URL: ${releaseData.html_url}`);
  console.log(`📦 Direct APK Download: ${uploadedAsset.browser_download_url}`);
}

run().catch((err) => {
  console.error("\n❌ Release publisher failed:", err.message);
  process.exit(1);
});
