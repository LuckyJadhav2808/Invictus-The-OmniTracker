#!/usr/bin/env node
/**
 * scripts/release-pipeline.mjs
 * 
 * 👑 INVICTUS ZERO-FAILURE RELEASE ENGINE
 * 
 * Permanently solves the "stale APK on version bump" problem:
 * 1. 🔍 Verifies version alignment (package.json, build.gradle, version.ts)
 * 2. ⚡ Dispatches GitHub Actions Ubuntu runner (workflow_dispatch)
 * 3. ⏳ Monitors remote Gradle compilation live in the terminal
 * 4. 📥 Downloads the compiled Invictus-Android-App artifact
 * 5. 🛡️ Decompresses & validates AndroidManifest.xml bytecode version
 * 6. 🚀 Publishes the verified APK directly to GitHub Release
 * 7. 📦 Stages to public/downloads/Invictus.apk
 * 8. 🗄️ Seeds MongoDB release registry
 * 9. 📊 Generates authentic version-dump telemetry
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { validateApkBinaryVersion } from "./lib/apk-binary-validator.mjs";

dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const REPO_OWNER = "LuckyJadhav2808";
const REPO_NAME = "Invictus-The-OmniTracker";
const REPO = `${REPO_OWNER}/${REPO_NAME}`;
const WORKFLOW_ID = "340409029"; // build-apk.yml

function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    const gitConfig = fs.readFileSync(path.join(rootDir, ".git", "config"), "utf8");
    const match = gitConfig.match(/https:\/\/[^:]+:([^@]+)@github\.com/);
    if (match && match[1]) return match[1];
  } catch {}
  throw new Error("Missing GitHub token. Ensure GITHUB_TOKEN or .git/config has access.");
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("\n=======================================================");
  console.log("👑 INVICTUS PRODUCTION RELEASE & APK COMPILATION PIPELINE");
  console.log("=======================================================\n");

  const token = getGitHubToken();

  // 1. Version Parity Check
  console.log("🔍 Step 1: Validating Version Alignment across Codebase...");
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
  const version = pkg.version;
  const tag = `v${version}`;

  const gradleContent = fs.readFileSync(path.join(rootDir, "android", "app", "build.gradle"), "utf8");
  const gradleMatch = gradleContent.match(/versionName\s+"([^"]+)"/);
  const gradleCodeMatch = gradleContent.match(/versionCode\s+(\d+)/);
  const gradleVersion = gradleMatch ? gradleMatch[1] : null;
  const gradleCode = gradleCodeMatch ? parseInt(gradleCodeMatch[1], 10) : null;

  const versionTs = fs.readFileSync(path.join(rootDir, "src", "config", "version.ts"), "utf8");
  const tsMatch = versionTs.match(/version:\s*"([^"]+)"/);
  const tsBuildMatch = versionTs.match(/buildNumber:\s*(\d+)/);
  const tsVersion = tsMatch ? tsMatch[1] : null;
  const tsBuild = tsBuildMatch ? parseInt(tsBuildMatch[1], 10) : null;

  console.log(`  • package.json:              ${version}`);
  console.log(`  • android/app/build.gradle:  ${gradleVersion} (buildCode: ${gradleCode})`);
  console.log(`  • src/config/version.ts:     ${tsVersion} (buildNumber: ${tsBuild})`);

  if (version !== gradleVersion || version !== tsVersion) {
    console.error(`\n❌ Version mismatch detected! Run 'npm run version:bump' to synchronize.`);
    process.exit(1);
  }
  if (gradleCode !== tsBuild) {
    console.error(`\n❌ Build number mismatch! Gradle has ${gradleCode}, version.ts has ${tsBuild}.`);
    process.exit(1);
  }
  console.log(`  ✅ 100% In Sync: Version ${version} (Build ${tsBuild})\n`);

  // 2. Dispatch GitHub Actions Remote Build
  console.log(`⚡ Step 2: Triggering Remote Ubuntu Gradle Build for ${tag}...`);
  const dispatchRes = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "User-Agent": "Invictus-Release-Pipeline",
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  if (!dispatchRes.ok) {
    const errText = await dispatchRes.text();
    console.error(`❌ Failed to trigger GitHub Actions workflow [${dispatchRes.status}]: ${errText}`);
    process.exit(1);
  }
  console.log(`  ✓ Dispatched workflow successfully. Waiting for runner to boot...`);

  // 3. Monitor Build Run
  let runId = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    await sleep(4000);
    const runsRes = await fetch(`https://api.github.com/repos/${REPO}/actions/runs?per_page=3`, {
      headers: { Authorization: `token ${token}`, "User-Agent": "Invictus" },
    });
    if (runsRes.ok) {
      const runsData = await runsRes.json();
      const latest = runsData.workflow_runs[0];
      if (latest && (latest.status === "in_progress" || latest.status === "queued")) {
        runId = latest.id;
        console.log(`  ✓ Active Build Run Identified: #${runId} (Status: ${latest.status})`);
        break;
      }
    }
  }

  if (!runId) {
    console.error("❌ Could not locate triggered GitHub Actions run. Please check GitHub dashboard.");
    process.exit(1);
  }

  console.log("\n⏳ Step 3: Compiling APK with Gradle on Ubuntu Runner (~90-120 seconds)...");
  let runComplete = false;
  let runConclusion = null;
  const startTime = Date.now();

  while (!runComplete) {
    await sleep(8000);
    const elapsedSec = Math.round((Date.now() - startTime) / 1000);

    const checkRes = await fetch(`https://api.github.com/repos/${REPO}/actions/runs/${runId}`, {
      headers: { Authorization: `token ${token}`, "User-Agent": "Invictus" },
    });
    if (!checkRes.ok) continue;

    const runInfo = await checkRes.json();
    if (runInfo.status === "completed") {
      runComplete = true;
      runConclusion = runInfo.conclusion;
      console.log(`  ✓ Build finished in ${elapsedSec}s with conclusion: ${runConclusion}`);
    } else {
      process.stdout.write(`  ... compiling in cloud (${elapsedSec}s elapsed)\r`);
    }
  }

  if (runConclusion !== "success") {
    console.error(`\n❌ Remote Gradle build failed on CI runner (${runConclusion})!`);
    console.error(`Check CI logs: https://github.com/${REPO}/actions/runs/${runId}`);
    process.exit(1);
  }

  // 4. Download Artifact
  console.log("\n📥 Step 4: Downloading Compiled APK Artifact from CI Runner...");
  const artifactsRes = await fetch(
    `https://api.github.com/repos/${REPO}/actions/runs/${runId}/artifacts`,
    {
      headers: { Authorization: `token ${token}`, "User-Agent": "Invictus" },
    }
  );
  const artifactsData = await artifactsRes.json();
  const apkArtifact = (artifactsData.artifacts || []).find((a) => a.name === "Invictus-Android-App");

  if (!apkArtifact) {
    console.error("❌ Artifact 'Invictus-Android-App' not found in build output!");
    process.exit(1);
  }

  const zipRes = await fetch(
    `https://api.github.com/repos/${REPO}/actions/artifacts/${apkArtifact.id}/zip`,
    {
      headers: { Authorization: `token ${token}`, "User-Agent": "Invictus" },
    }
  );

  const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
  const tempZip = path.join(rootDir, `.temp-release-${Date.now()}.zip`);
  const tempExtract = path.join(rootDir, `.temp-extract-${Date.now()}`);
  fs.writeFileSync(tempZip, zipBuffer);

  fs.mkdirSync(tempExtract, { recursive: true });
  execSync(`powershell -Command "Expand-Archive -Path '${tempZip}' -DestinationPath '${tempExtract}' -Force"`);

  const apkFile = fs.readdirSync(tempExtract).find((f) => f.endsWith(".apk"));
  if (!apkFile) {
    console.error("❌ No .apk found in downloaded artifact zip!");
    process.exit(1);
  }

  const extractedApk = path.join(tempExtract, apkFile);
  const apkBuffer = fs.readFileSync(extractedApk);
  const sizeBytes = apkBuffer.length;
  const sha256 = crypto.createHash("sha256").update(apkBuffer).digest("hex");

  // 5. Decompress & Validate AndroidManifest bytecode
  console.log("\n🛡️ Step 5: Decompressing & Validating AndroidManifest Bytecode...");
  const validation = validateApkBinaryVersion(extractedApk, version);
  if (!validation.valid) {
    console.error(`\n❌ CRITICAL: Compiled APK does NOT match target version!`);
    console.error(`  ${validation.reason}`);
    process.exit(1);
  }
  console.log(`  ✅ Bytecode Verified: versionName='${version}', package='${validation.packageName}'`);
  console.log(`  • SHA-256: ${sha256}`);
  console.log(`  • Size:    ${sizeBytes} bytes (${(sizeBytes / (1024 * 1024)).toFixed(2)} MB)\n`);

  // 6. Stage locally to public/downloads/Invictus.apk
  console.log("📦 Step 6: Staging Verified APK to public/downloads/Invictus.apk...");
  const publicDownloads = path.join(rootDir, "public", "downloads");
  if (!fs.existsSync(publicDownloads)) fs.mkdirSync(publicDownloads, { recursive: true });
  const localApkPath = path.join(publicDownloads, "Invictus.apk");
  fs.writeFileSync(localApkPath, apkBuffer);
  console.log(`  ✓ Saved to ${localApkPath}`);

  // Cleanup temp files
  try { fs.unlinkSync(tempZip); } catch {}
  try { fs.rmSync(tempExtract, { recursive: true, force: true }); } catch {}

  // 7. Upload to GitHub Release
  console.log(`\n🚀 Step 7: Publishing Verified Binary to GitHub Release ${tag}...`);
  const relRes = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/${tag}`, {
    headers: { Authorization: `token ${token}`, "User-Agent": "Invictus" },
  });

  let releaseId = null;
  if (relRes.ok) {
    const relData = await relRes.json();
    releaseId = relData.id;
    // Delete existing asset if any
    for (const a of relData.assets || []) {
      if (a.name === "Invictus.apk") {
        console.log(`  🔄 Replacing existing asset ID ${a.id}...`);
        await fetch(`https://api.github.com/repos/${REPO}/releases/assets/${a.id}`, {
          method: "DELETE",
          headers: { Authorization: `token ${token}`, "User-Agent": "Invictus" },
        });
      }
    }
  } else {
    console.log(`  ➕ Creating Release ${tag}...`);
    const createRes = await fetch(`https://api.github.com/repos/${REPO}/releases`, {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "User-Agent": "Invictus",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tag_name: tag,
        target_commitish: "main",
        name: `Invictus Android ${tag}`,
        body: `## 📱 Invictus for Android ${tag}\nOfficial standalone APK release.`,
        draft: false,
        prerelease: false,
      }),
    });
    const created = await createRes.json();
    releaseId = created.id;
  }

  const uploadRes = await fetch(
    `https://uploads.github.com/repos/${REPO}/releases/${releaseId}/assets?name=Invictus.apk`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "User-Agent": "Invictus",
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Length": String(sizeBytes),
      },
      body: apkBuffer,
    }
  );

  if (!uploadRes.ok) {
    console.error(`❌ Failed to upload asset to GitHub Release [${uploadRes.status}]`);
    process.exit(1);
  }
  const uploaded = await uploadRes.json();
  console.log(`  ✓ Published: ${uploaded.browser_download_url}`);

  // 8. Seed MongoDB
  if (process.env.MONGODB_URI) {
    console.log("\n🗄️ Step 8: Syncing MongoDB Release Registry...");
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("invictus_db");

    const releasePayload = {
      version,
      buildNumber: tsBuild,
      releaseDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      channel: "stable",
      apkDownloadUrl: `https://github.com/${REPO}/releases/download/${tag}/Invictus.apk`,
      apkSha256: sha256,
      apkSizeBytes: sizeBytes,
      isActive: true,
      updatedAt: new Date(),
    };

    // Update both app_releases and legacy appreleases
    for (const collName of ["app_releases", "appreleases"]) {
      const coll = db.collection(collName);
      await coll.updateMany({ isActive: true }, { $set: { isActive: false } });
      await coll.updateOne({ version }, { $set: releasePayload, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
    }
    await client.close();
    console.log("  ✓ MongoDB synced across collections.");
  }

  // 9. Run Version Dump
  console.log("\n📊 Step 9: Emitting Telemetry (npm run version:dump)...");
  execSync("node scripts/version-dump.mjs", { cwd: rootDir, stdio: "inherit" });

  console.log("\n=======================================================");
  console.log(`🎉 RELEASE v${version} (BUILD ${tsBuild}) COMPLETED SUCCESSFULLY!`);
  console.log("=======================================================");
  console.log(`• Direct APK Download:  https://invictus-the-omni-tracker.vercel.app/downloads/Invictus.apk`);
  console.log(`• GitHub Release Asset: https://github.com/${REPO}/releases/download/${tag}/Invictus.apk`);
  console.log(`• SHA-256 Checksum:     ${sha256}`);
  console.log(`• Binary Verified:      TRUE (v${version} inside AndroidManifest.xml)\n`);
}

main().catch((err) => {
  console.error("\n❌ Release pipeline failed:", err);
  process.exit(1);
});
