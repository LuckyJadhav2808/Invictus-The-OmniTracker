#!/usr/bin/env node
/**
 * scripts/bump-version.mjs
 * Automated single-source-of-truth version synchronizer for Invictus.
 * Synchronizes package.json, android/app/build.gradle, and src/config/version.ts.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const packageJsonPath = path.join(rootDir, "package.json");
const buildGradlePath = path.join(rootDir, "android", "app", "build.gradle");
const versionConfigPath = path.join(rootDir, "src", "config", "version.ts");

function readVersions() {
  // 1. package.json
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const pkgVersion = pkg.version;

  // 2. build.gradle
  const gradleContent = fs.readFileSync(buildGradlePath, "utf8");
  const codeMatch = gradleContent.match(/versionCode\s+(\d+)/);
  const nameMatch = gradleContent.match(/versionName\s+"([^"]+)"/);
  const gradleVersionCode = codeMatch ? parseInt(codeMatch[1], 10) : null;
  const gradleVersionName = nameMatch ? nameMatch[1] : null;

  // 3. version.ts
  const tsContent = fs.readFileSync(versionConfigPath, "utf8");
  const tsVersionMatch = tsContent.match(/version:\s*"([^"]+)"/);
  const tsBuildMatch = tsContent.match(/buildNumber:\s*(\d+)/);
  const tsVersion = tsVersionMatch ? tsVersionMatch[1] : null;
  const tsBuildNumber = tsBuildMatch ? parseInt(tsBuildMatch[1], 10) : null;

  return {
    packageJson: { version: pkgVersion },
    gradle: { versionCode: gradleVersionCode, versionName: gradleVersionName },
    versionTs: { version: tsVersion, buildNumber: tsBuildNumber },
  };
}

function checkVersions() {
  const v = readVersions();
  console.log("🔍 Checking Invictus Version Alignment:");
  console.log(`  • package.json:              v${v.packageJson.version}`);
  console.log(`  • android/app/build.gradle:  v${v.gradle.versionName} (code: ${v.gradle.versionCode})`);
  console.log(`  • src/config/version.ts:     v${v.versionTs.version} (build: ${v.versionTs.buildNumber})`);

  const versionsMatch =
    v.packageJson.version === v.gradle.versionName &&
    v.gradle.versionName === v.versionTs.version;

  const buildNumbersMatch = v.gradle.versionCode === v.versionTs.buildNumber;

  if (versionsMatch && buildNumbersMatch) {
    console.log(`\n✅ 100% IN SYNC: v${v.packageJson.version} (Build ${v.versionTs.buildNumber})`);
    return true;
  }

  console.error("\n❌ VERSION MISMATCH DETECTED!");
  if (!versionsMatch) console.error("  Version strings diverge across files!");
  if (!buildNumbersMatch) console.error("  Build codes diverge between Gradle and version.ts!");
  return false;
}

function bump(target) {
  const current = readVersions();
  const currentVer = current.packageJson.version;
  const currentBuild = current.gradle.versionCode || 1;

  let newVer = target;
  const semverParts = currentVer.split(".").map((n) => parseInt(n, 10));

  if (target === "patch") {
    newVer = `${semverParts[0]}.${semverParts[1]}.${semverParts[2] + 1}`;
  } else if (target === "minor") {
    newVer = `${semverParts[0]}.${semverParts[1] + 1}.0`;
  } else if (target === "major") {
    newVer = `${semverParts[0] + 1}.0.0`;
  } else if (!/^\d+\.\d+\.\d+/.test(target)) {
    console.error(`Invalid version or target: ${target}. Must be patch, minor, major, or X.Y.Z`);
    process.exit(1);
  }

  const newBuild = currentBuild + 1;
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  console.log(`🚀 Bumping Invictus: v${currentVer} (Build ${currentBuild}) -> v${newVer} (Build ${newBuild})`);

  // 1. Update package.json
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  pkg.version = newVer;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("  ✓ Updated package.json");

  // 2. Update build.gradle
  let gradleContent = fs.readFileSync(buildGradlePath, "utf8");
  gradleContent = gradleContent.replace(/versionCode\s+\d+/, `versionCode ${newBuild}`);
  gradleContent = gradleContent.replace(/versionName\s+"[^"]+"/, `versionName "${newVer}"`);
  fs.writeFileSync(buildGradlePath, gradleContent);
  console.log("  ✓ Updated android/app/build.gradle");

  // 3. Update version.ts
  let tsContent = fs.readFileSync(versionConfigPath, "utf8");
  tsContent = tsContent.replace(/version:\s*"[^"]+"/, `version: "${newVer}"`);
  tsContent = tsContent.replace(/buildNumber:\s*\d+/, `buildNumber: ${newBuild}`);
  tsContent = tsContent.replace(/releaseDate:\s*"[^"]+"/, `releaseDate: "${today}"`);
  fs.writeFileSync(versionConfigPath, tsContent);
  console.log("  ✓ Updated src/config/version.ts");

  console.log(`\n🎉 Success! Invictus synchronized to v${newVer} (Build ${newBuild})`);
}

const arg = process.argv[2];
if (!arg || arg === "--check" || arg === "-c") {
  const ok = checkVersions();
  process.exit(ok ? 0 : 1);
} else {
  bump(arg);
}
