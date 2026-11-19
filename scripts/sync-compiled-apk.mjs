import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { validateApkBinaryVersion } from "./lib/apk-binary-validator.mjs";

dotenv.config({ path: ".env.local" });

const gitConfig = fs.readFileSync(".git/config", "utf8");
const tokenMatch = gitConfig.match(/https:\/\/([^:]+):([^@]+)@github\.com/);
if (!tokenMatch) {
  console.error("Could not find GitHub token in .git/config");
  process.exit(1);
}
const token = tokenMatch[2];
const REPO = "LuckyJadhav2808/Invictus-The-OmniTracker";

async function main() {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const version = pkg.version;
  const tag = `v${version}`;
  console.log(`🚀 Synchronizing Compiled APK for ${tag}...`);

  console.log("Checking latest workflow runs...");
  const runsRes = await fetch(`https://api.github.com/repos/${REPO}/actions/runs?per_page=5`, {
    headers: { Authorization: `token ${token}`, "User-Agent": "Invictus" },
  });
  const runsData = await runsRes.json();
  const successfulRun = runsData.workflow_runs.find(
    (r) => r.status === "completed" && r.conclusion === "success"
  );

  if (!successfulRun) {
    console.error("No successful workflow run found in recent runs!");
    process.exit(1);
  }

  console.log(`Found successful run ID: ${successfulRun.id} (${successfulRun.display_title})`);

  console.log("Fetching artifacts for run", successfulRun.id);
  const artifactsRes = await fetch(successfulRun.artifacts_url, {
    headers: { Authorization: `token ${token}`, "User-Agent": "Invictus" },
  });
  const artifactsData = await artifactsRes.json();
  console.log("Artifacts found:", artifactsData.artifacts.map((a) => `${a.name} (${a.size_in_bytes} bytes)`));

  const apkArtifact = artifactsData.artifacts.find((a) => a.name === "Invictus-Android-App");
  if (!apkArtifact) {
    console.error("Could not find Invictus-Android-App artifact!");
    process.exit(1);
  }

  console.log(`Downloading artifact ${apkArtifact.id} (${apkArtifact.size_in_bytes} bytes)...`);
  const zipRes = await fetch(`https://api.github.com/repos/${REPO}/actions/artifacts/${apkArtifact.id}/zip`, {
    headers: { Authorization: `token ${token}`, "User-Agent": "Invictus" },
  });

  if (!zipRes.ok) {
    console.error("Failed to download artifact zip:", zipRes.status, await zipRes.text());
    process.exit(1);
  }

  const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
  const tempZipPath = path.join(process.cwd(), "temp-artifact.zip");
  const tempExtractDir = path.join(process.cwd(), "temp-apk-extract");
  fs.writeFileSync(tempZipPath, zipBuffer);
  console.log(`Saved temporary artifact zip (${zipBuffer.length} bytes)`);

  if (fs.existsSync(tempExtractDir)) {
    fs.rmSync(tempExtractDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempExtractDir, { recursive: true });

  try {
    execSync(`tar -xf "${tempZipPath}" -C "${tempExtractDir}"`);
  } catch {
    execSync(`powershell -Command "Expand-Archive -Path '${tempZipPath}' -DestinationPath '${tempExtractDir}' -Force"`);
  }

  const extractedFiles = fs.readdirSync(tempExtractDir);
  console.log("Extracted files:", extractedFiles);
  const apkFileName = extractedFiles.find((f) => f.endsWith(".apk"));
  if (!apkFileName) {
    console.error("No .apk found inside extracted files!");
    process.exit(1);
  }

  const extractedApkPath = path.join(tempExtractDir, apkFileName);
  
  // Verify bytecode before copying
  console.log(`🔍 Verifying bytecode version inside APK...`);
  const validation = validateApkBinaryVersion(extractedApkPath, version);
  if (!validation.valid) {
    console.error(`❌ Bytecode mismatch: ${validation.reason}`);
    process.exit(1);
  }
  console.log(`✅ Verified APK bytecode contains authentic version '${version}' (${validation.packageName})`);

  const apkBuffer = fs.readFileSync(extractedApkPath);
  const targetLocalPath = path.join(process.cwd(), "public", "downloads", "Invictus.apk");
  fs.writeFileSync(targetLocalPath, apkBuffer);
  console.log(`Copied authentic compiled Invictus.apk to ${targetLocalPath} (${apkBuffer.length} bytes)`);

  // Clean up temp
  fs.unlinkSync(tempZipPath);
  fs.rmSync(tempExtractDir, { recursive: true, force: true });

  const sha256 = crypto.createHash("sha256").update(apkBuffer).digest("hex");
  const sizeBytes = apkBuffer.length;
  console.log(`New Compiled APK SHA256: ${sha256}`);
  console.log(`New Compiled APK Size: ${sizeBytes} bytes (${(sizeBytes / (1024 * 1024)).toFixed(2)} MB)`);

  // Find or Create GitHub Release for this tag
  console.log(`Checking GitHub Release ${tag}...`);
  let relRes = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/${tag}`, {
    headers: { Authorization: `token ${token}`, "User-Agent": "Invictus" },
  });

  let releaseId = null;
  if (!relRes.ok) {
    console.log(`Release ${tag} not found. Creating release ${tag}...`);
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
        body: `## 📱 Invictus for Android ${tag}\nOfficial standalone APK release for Android devices.`,
        draft: false,
        prerelease: false,
      }),
    });
    if (!createRes.ok) {
      console.error("Failed to create release:", createRes.status, await createRes.text());
      process.exit(1);
    }
    const createdData = await createRes.json();
    releaseId = createdData.id;
    console.log(`Created release ID: ${releaseId}`);
  } else {
    const relData = await relRes.json();
    releaseId = relData.id;
    console.log(`Found existing release ID: ${releaseId}`);

    // Delete any existing asset named Invictus.apk on this release
    for (const asset of relData.assets || []) {
      if (asset.name === "Invictus.apk" || asset.name === "Invictus.apk.sha256") {
        console.log(`Deleting existing asset ${asset.name} (${asset.id})...`);
        await fetch(`https://api.github.com/repos/${REPO}/releases/assets/${asset.id}`, {
          method: "DELETE",
          headers: { Authorization: `token ${token}`, "User-Agent": "Invictus" },
        });
      }
    }
  }

  console.log(`Uploading newly compiled APK to GitHub Release ${tag}...`);
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
    console.error("Failed to upload asset:", uploadRes.status, await uploadRes.text());
    process.exit(1);
  }
  const uploadedAsset = await uploadRes.json();
  console.log("Uploaded asset to GitHub Release successfully:", uploadedAsset.browser_download_url);

  // Upload SHA256 checksum asset
  const sha256Buffer = Buffer.from(`${sha256}  Invictus.apk\n`, "utf8");
  await fetch(
    `https://uploads.github.com/repos/${REPO}/releases/${releaseId}/assets?name=Invictus.apk.sha256`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "User-Agent": "Invictus",
        "Content-Type": "text/plain",
        "Content-Length": String(sha256Buffer.length),
      },
      body: sha256Buffer,
    }
  );
  console.log("Uploaded Invictus.apk.sha256 asset to GitHub Release");

  // Run version dump to sync version.json
  console.log("Running version dump to synchronize public/version.json...");
  execSync("node scripts/version-dump.mjs", { stdio: "inherit" });

  // Update MongoDB if available
  if (process.env.MONGODB_URI) {
    try {
      console.log("Connecting to MongoDB to update release record...");
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const db = client.db("invictus_db");
      
      const payload = {
        version,
        buildNumber: pkg.buildNumber || 32,
        releaseDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        channel: "stable",
        apkDownloadUrl: `https://github.com/${REPO}/releases/download/${tag}/Invictus.apk`,
        apkSha256: sha256,
        apkSizeBytes: sizeBytes,
        isActive: true,
        updatedAt: new Date(),
      };

      for (const collName of ["app_releases", "appreleases"]) {
        const coll = db.collection(collName);
        await coll.updateMany({ isActive: true }, { $set: { isActive: false } });
        await coll.updateOne({ version }, { $set: payload, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
      }

      await client.close();
      console.log(`Updated MongoDB for ${tag}!`);
    } catch (e) {
      console.warn("MongoDB sync skipped:", e.message);
    }
  }

  console.log(`\n🎉 Success! APK for ${tag} is synchronized, verified, and live on GitHub Release ${tag}!`);
  return true;
}

main().catch(console.error);
