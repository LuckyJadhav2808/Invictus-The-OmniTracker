#!/usr/bin/env node
/**
 * scripts/version-dump.mjs
 * 
 * Invictus Automated Version Dump Engine
 * Generates comprehensive version telemetry metadata and writes to:
 *   - public/version.json
 *   - public/version-dump.json
 * 
 * Captures:
 *   - Semantic version, build number, channel, release date
 *   - Git branch, full commit hash, short hash, commit author, date, message
 *   - Local APK SHA-256 checksum and size (if public/downloads/Invictus.apk exists)
 *   - Target direct download and GitHub release asset URLs
 *   - Complete changelog highlights array
 *   - Runtime environment metadata
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function getGitTelemetry() {
  try {
    const commitHash = execSync("git rev-parse HEAD", { cwd: rootDir, encoding: "utf8" }).trim();
    const shortHash = execSync("git rev-parse --short HEAD", { cwd: rootDir, encoding: "utf8" }).trim();
    const branch = execSync("git branch --show-current", { cwd: rootDir, encoding: "utf8" }).trim() || "main";
    const commitAuthor = execSync("git log -1 --pretty=format:%an", { cwd: rootDir, encoding: "utf8" }).trim();
    const commitDate = execSync("git log -1 --pretty=format:%cd --date=iso", { cwd: rootDir, encoding: "utf8" }).trim();
    const commitMessage = execSync("git log -1 --pretty=format:%s", { cwd: rootDir, encoding: "utf8" }).trim();

    return {
      commitHash,
      shortHash,
      branch,
      commitAuthor,
      commitDate,
      commitMessage,
    };
  } catch (err) {
    return {
      commitHash: "unknown",
      shortHash: "unknown",
      branch: "main",
      commitAuthor: "Lucky Jadhav",
      commitDate: new Date().toISOString(),
      commitMessage: "Invictus Release",
    };
  }
}

function getApkTelemetry(version) {
  const localApkPath = path.join(rootDir, "public", "downloads", "Invictus.apk");
  let sha256 = "";
  let sizeBytes = 0;
  let exists = false;

  if (fs.existsSync(localApkPath)) {
    exists = true;
    const fileBuffer = fs.readFileSync(localApkPath);
    sizeBytes = fileBuffer.length;
    sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  }

  const sizeFormatted = sizeBytes > 0 
    ? `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`
    : "N/A";

  return {
    exists,
    fileName: "Invictus.apk",
    sha256,
    sizeBytes,
    sizeFormatted,
    directDownloadUrl: "https://invictus-the-omni-tracker.vercel.app/downloads/Invictus.apk",
    githubReleaseAssetUrl: `https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker/releases/download/v${version}/Invictus.apk`,
  };
}

function parseVersionTs() {
  const versionTsPath = path.join(rootDir, "src", "config", "version.ts");
  const content = fs.readFileSync(versionTsPath, "utf8");

  const versionMatch = content.match(/version:\s*"([^"]+)"/);
  const buildMatch = content.match(/buildNumber:\s*(\d+)/);
  const releaseDateMatch = content.match(/releaseDate:\s*"([^"]+)"/);
  const channelMatch = content.match(/channel:\s*"([^"]+)"/);
  const minSupportedMatch = content.match(/minSupportedVersion:\s*"([^"]+)"/);
  const repoUrlMatch = content.match(/githubRepoUrl:\s*"([^"]+)"/);

  // Extract changelog array
  const changelogMatch = content.match(/changelog:\s*\[([\s\S]*?)\]/);
  let changelog = [];
  if (changelogMatch && changelogMatch[1]) {
    changelog = changelogMatch[1]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith('"') || line.startsWith("'"))
      .map((line) => line.replace(/^["']|["'],?$/g, "").trim());
  }

  return {
    version: versionMatch ? versionMatch[1] : "1.7.9",
    buildNumber: buildMatch ? parseInt(buildMatch[1], 10) : 30,
    releaseDate: releaseDateMatch ? releaseDateMatch[1] : "November 4, 2026",
    channel: channelMatch ? channelMatch[1] : "stable",
    minSupportedVersion: minSupportedMatch ? minSupportedMatch[1] : "1.0.0",
    githubRepoUrl: repoUrlMatch ? repoUrlMatch[1] : "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker",
    changelog,
  };
}

async function dump() {
  console.log("\n📦 Invictus Version Dump Engine");
  console.log("=========================================");

  const config = parseVersionTs();
  const git = getGitTelemetry();
  const apk = getApkTelemetry(config.version);

  const dumpPayload = {
    application: "Invictus Life OS & Omni-Tracker",
    version: config.version,
    buildNumber: config.buildNumber,
    channel: config.channel,
    releaseDate: config.releaseDate,
    minSupportedVersion: config.minSupportedVersion,
    git,
    apk,
    changelog: config.changelog,
    links: {
      repoUrl: config.githubRepoUrl,
      latestReleaseUrl: `${config.githubRepoUrl}/releases/latest`,
      inAppDownloadUrl: apk.directDownloadUrl,
      githubAssetDownloadUrl: apk.githubReleaseAssetUrl,
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      generatedAt: new Date().toISOString(),
    },
  };

  const publicDir = path.join(rootDir, "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const versionJsonPath = path.join(publicDir, "version.json");
  const versionDumpJsonPath = path.join(publicDir, "version-dump.json");

  fs.writeFileSync(versionJsonPath, JSON.stringify(dumpPayload, null, 2) + "\n", "utf8");
  fs.writeFileSync(versionDumpJsonPath, JSON.stringify(dumpPayload, null, 2) + "\n", "utf8");

  console.log(`✅ Version Dump written to:`);
  console.log(`   • ${path.relative(rootDir, versionJsonPath)}`);
  console.log(`   • ${path.relative(rootDir, versionDumpJsonPath)}`);
  console.log("\n📊 Telemetry Summary:");
  console.log(`   • Version:       v${dumpPayload.version} (Build ${dumpPayload.buildNumber})`);
  console.log(`   • Channel:       ${dumpPayload.channel}`);
  console.log(`   • Git Commit:    ${dumpPayload.git.shortHash} (${dumpPayload.git.branch})`);
  console.log(`   • APK Present:   ${apk.exists ? `Yes (${apk.sizeFormatted})` : "No"}`);
  if (apk.sha256) {
    console.log(`   • APK SHA-256:   ${apk.sha256.substring(0, 16)}...`);
  }
  console.log(`   • Changelog:     ${dumpPayload.changelog.length} bullet items`);
  console.log("=========================================\n");

  return dumpPayload;
}

dump().catch((err) => {
  console.error("❌ Version dump failed:", err);
  process.exit(1);
});
