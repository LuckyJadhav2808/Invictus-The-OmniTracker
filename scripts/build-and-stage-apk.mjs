#!/usr/bin/env node
/**
 * scripts/build-and-stage-apk.mjs
 * 
 * 100% Self-Hosted, GitHub-Free Android APK Build & Stage Automation.
 * 1. Syncs Capacitor Android project (npx cap sync android)
 * 2. Compiles Android Debug APK with Gradle (gradlew assembleDebug)
 * 3. Stages the binary to public/downloads/Invictus.apk for in-app download
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const androidDir = path.join(rootDir, "android");

console.log("\n🚀 Starting Self-Hosted Android APK Build & Stage (No GitHub)");
console.log("============================================================\n");

// 1. Sync Capacitor
console.log("⚡ 1/3: Syncing web assets & native plugins with Capacitor...");
const capSync = spawnSync("npx", ["cap", "sync", "android"], {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
});

if (capSync.status !== 0) {
  console.error("❌ Capacitor sync failed. Please verify dependencies.");
  process.exit(1);
}

// 2. Locate Gradle Wrapper
const isWindows = process.platform === "win32";
const gradlewCmd = isWindows
  ? path.join(androidDir, "gradlew.bat")
  : "./gradlew";

if (!fs.existsSync(path.join(androidDir, isWindows ? "gradlew.bat" : "gradlew"))) {
  console.error(`❌ Gradle wrapper not found in ${androidDir}`);
  process.exit(1);
}

// 3. Compile APK with Gradle
console.log("\n🏗️  2/3: Compiling Android APK with Gradle...");
const gradleBuild = spawnSync(gradlewCmd, ["assembleDebug", "--no-daemon"], {
  cwd: androidDir,
  stdio: "inherit",
  shell: true,
});

if (gradleBuild.status !== 0) {
  console.warn("\n⚠️  Gradle build did not complete directly.");
  console.log("If Java JDK is not installed in this terminal environment, you can:");
  console.log("  1. Open the 'android/' folder in Android Studio and select Build > Build APK(s)");
  console.log("  2. Then run: npm run apk:stage to automatically stage and publish it!");
  process.exit(gradleBuild.status || 1);
}

// 4. Stage the generated APK
console.log("\n📋 3/3: Staging compiled binary for in-app distribution...");
const stageScript = path.join(rootDir, "scripts", "stage-apk.mjs");
const stageResult = spawnSync("node", [stageScript], {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
});

if (stageResult.status === 0) {
  console.log("✅ Build & Stage Complete! 100% GitHub-free delivery ready.");
} else {
  process.exit(stageResult.status || 1);
}
