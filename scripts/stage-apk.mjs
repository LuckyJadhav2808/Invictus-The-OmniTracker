#!/usr/bin/env node
/**
 * scripts/stage-apk.mjs
 * 
 * Stages an Android APK file for 100% self-hosted, GitHub-free distribution.
 * 1. Copies APK to public/downloads/Invictus.apk
 * 2. Computes SHA-256 checksum and file size
 * 3. Registers or updates the active release in MongoDB (if MONGODB_URI is available)
 * 4. Outputs direct download links for in-app updates.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const POTENTIAL_APK_PATHS = [
  path.join(rootDir, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
  path.join(rootDir, "android", "app", "build", "outputs", "apk", "debug", "Invictus.apk"),
  path.join(rootDir, "android", "app", "build", "outputs", "apk", "release", "app-release.apk"),
  path.join(rootDir, "android", "app", "build", "outputs", "apk", "release", "app-release-unsigned.apk"),
  path.join(rootDir, "public", "downloads", "Invictus.apk"),
];

const targetApkDir = path.join(rootDir, "public", "downloads");
const targetApkPath = path.join(targetApkDir, "Invictus.apk");

async function main() {
  console.log("\n📦 Invictus Self-Hosted APK Stager (100% GitHub-Free)");
  console.log("====================================================");

  // 1. Identify input APK file
  const customArg = process.argv[2];
  let sourceApkPath = null;

  if (customArg && fs.existsSync(path.resolve(process.cwd(), customArg))) {
    sourceApkPath = path.resolve(process.cwd(), customArg);
  } else {
    for (const p of POTENTIAL_APK_PATHS) {
      if (fs.existsSync(p)) {
        sourceApkPath = p;
        break;
      }
    }
  }

  if (!sourceApkPath) {
    console.error("\n❌ No compiled APK found!");
    console.log("Looked in:");
    POTENTIAL_APK_PATHS.forEach((p) => console.log(`  • ${p}`));
    console.log("\nTo compile and stage automatically, run:");
    console.log("  npm run apk:build");
    console.log("\nOr provide an existing APK path manually:");
    console.log("  node scripts/stage-apk.mjs <path-to-apk>\n");
    process.exit(1);
  }

  // 2. Ensure public/downloads directory exists
  if (!fs.existsSync(targetApkDir)) {
    fs.mkdirSync(targetApkDir, { recursive: true });
  }

  // 3. Copy to public/downloads/Invictus.apk if source is different
  if (path.resolve(sourceApkPath) !== path.resolve(targetApkPath)) {
    console.log(`\n📋 Copying APK from: ${sourceApkPath}`);
    console.log(`                to: ${targetApkPath}`);
    fs.copyFileSync(sourceApkPath, targetApkPath);
  }

  // 4. Compute SHA-256 and File Size
  const fileBuffer = fs.readFileSync(targetApkPath);
  const sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  const sizeBytes = fileBuffer.length;
  const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);

  // 5. Read version info from package.json
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
  const version = pkg.version;

  console.log("\n✨ APK Staged Successfully for Self-Hosted Distribution:");
  console.log(`  • Target File:    public/downloads/Invictus.apk`);
  console.log(`  • Version:        v${version}`);
  console.log(`  • File Size:      ${sizeMB} MB (${sizeBytes.toLocaleString()} bytes)`);
  console.log(`  • SHA-256 Hash:   ${sha256}`);
  console.log(`  • Direct URL:     /downloads/Invictus.apk`);
  console.log(`  • API Route:      /api/download/android`);

  // 6. Check for MONGODB_URI in .env.local to auto-register release
  let mongoUri = process.env.MONGODB_URI;
  if (!mongoUri && fs.existsSync(path.join(rootDir, ".env.local"))) {
    const envContent = fs.readFileSync(path.join(rootDir, ".env.local"), "utf8");
    const match = envContent.match(/MONGODB_URI\s*=\s*["']?([^"'\r\n]+)["']?/);
    if (match && match[1]) {
      mongoUri = match[1];
    }
  }

  if (mongoUri) {
    try {
      console.log("\n📡 Registering in Self-Hosted MongoDB Release Registry...");
      const { MongoClient } = await import("mongodb").catch(() => ({ MongoClient: null }));
      if (MongoClient) {
        const client = new MongoClient(mongoUri);
        await client.connect();
        const db = client.db();
        const releases = db.collection("appreleases");

        await releases.updateOne(
          { version },
          {
            $set: {
              version,
              buildNumber: 23,
              releaseDate: new Date().toISOString(),
              channel: "stable",
              apkDownloadUrl: "/downloads/Invictus.apk",
              apkSha256: sha256,
              apkSizeBytes: sizeBytes,
              isActive: true,
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );

        await client.close();
        console.log("✅ MongoDB Release Registry updated! All devices will see this update immediately.");
      }
    } catch (e) {
      console.warn("⚠️  Could not update MongoDB automatically (skipped):", e.message);
    }
  }

  console.log("\n🎉 Ready for In-App Delivery! No GitHub Actions or GitHub Releases required.\n");
}

main().catch((err) => {
  console.error("Staging Error:", err);
  process.exit(1);
});
