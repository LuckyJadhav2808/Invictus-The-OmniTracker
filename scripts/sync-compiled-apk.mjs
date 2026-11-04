import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

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
  console.log("Checking latest workflow runs...");
  const runsRes = await fetch(`https://api.github.com/repos/${REPO}/actions/runs?per_page=3`, {
    headers: { Authorization: `token ${token}`, "User-Agent": "Invictus" },
  });
  const runsData = await runsRes.json();
  const latestRun = runsData.workflow_runs[0];
  console.log(`Latest run ID: ${latestRun.id}, Status: ${latestRun.status}, Conclusion: ${latestRun.conclusion}`);

  if (latestRun.status !== "completed" || latestRun.conclusion !== "success") {
    console.error("Run not completed successfully:", latestRun.status, latestRun.conclusion);
    process.exit(1);
  }

  console.log("Fetching artifacts for run", latestRun.id);
  const artifactsRes = await fetch(latestRun.artifacts_url, {
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

  execSync(`powershell -Command "Expand-Archive -Path '${tempZipPath}' -DestinationPath '${tempExtractDir}' -Force"`);

  const extractedFiles = fs.readdirSync(tempExtractDir);
  console.log("Extracted files:", extractedFiles);
  const apkFileName = extractedFiles.find((f) => f.endsWith(".apk"));
  if (!apkFileName) {
    console.error("No .apk found inside extracted files!");
    process.exit(1);
  }

  const extractedApkPath = path.join(tempExtractDir, apkFileName);
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

  // Upload to GitHub Release v1.8.0
  console.log("Finding GitHub Release v1.8.0...");
  const relRes = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/v1.8.0`, {
    headers: { Authorization: `token ${token}`, "User-Agent": "Invictus" },
  });
  if (!relRes.ok) {
    console.error("Failed to find release v1.8.0:", relRes.status);
    process.exit(1);
  }
  const relData = await relRes.json();
  const releaseId = relData.id;
  console.log(`Release ID: ${releaseId}`);

  // Delete any existing asset named Invictus.apk on v1.8.0 release
  for (const asset of relData.assets) {
    if (asset.name === "Invictus.apk") {
      console.log(`Deleting existing asset ${asset.id}...`);
      await fetch(`https://api.github.com/repos/${REPO}/releases/assets/${asset.id}`, {
        method: "DELETE",
        headers: { Authorization: `token ${token}`, "User-Agent": "Invictus" },
      });
    }
  }

  console.log("Uploading newly compiled APK to GitHub Release v1.8.0...");
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

  // Update public/version.json
  const versionJsonPath = path.join(process.cwd(), "public", "version.json");
  const versionJson = JSON.parse(fs.readFileSync(versionJsonPath, "utf8"));
  versionJson.apk.sha256 = sha256;
  versionJson.apk.sizeBytes = sizeBytes;
  versionJson.apk.sizeFormatted = `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
  fs.writeFileSync(versionJsonPath, JSON.stringify(versionJson, null, 2) + "\n");
  console.log("Updated public/version.json");

  // Update MongoDB
  if (process.env.MONGODB_URI) {
    console.log("Connecting to MongoDB to update release record...");
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db("invictus_db");
    const collection = db.collection("app_releases");
    await collection.updateOne(
      { version: "1.8.0" },
      {
        $set: {
          apkSha256: sha256,
          apkSizeBytes: sizeBytes,
          apkDownloadUrl: "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker/releases/download/v1.8.0/Invictus.apk",
          updatedAt: new Date(),
        },
      }
    );
    await client.close();
    console.log("Updated MongoDB app_releases for v1.8.0!");
  }

  console.log("All APK sync tasks successfully completed!");
  return true;
}

main().catch(console.error);
