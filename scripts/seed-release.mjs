import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db("invictus_db");
  const collection = db.collection("app_releases");

  // Deactivate old active releases
  await collection.updateMany({ isActive: true }, { $set: { isActive: false } });

  const releaseData = {
    version: "1.8.0",
    buildNumber: 31,
    releaseDate: "November 4, 2026",
    channel: "stable",
    changelog: [
      "🏛️ Sovereign Roman Monolith Asset Synchronizer: Unified Roman Monolith 'I' geometry across Web, PWA, and Android launcher mipmaps, adaptive foregrounds, splash screens, widget previews, and notification silhouettes",
      "💎 Financial Cockpit & Wallet Architecture: Slashed vertical height by 65%, removed visual clutter, introduced a 34px high-speed horizontal category wallet filter rail, and isolated the floating calculator",
      "🔔 Proactive Calm Reminder Banner: Replaced fluorescent yellow modal with calm #1C1A18 obsidian HUD, persistent localStorage dismissals, and non-intrusive timing",
      "⚡ Production Database Scaling: Added MongoDB connection pooling (maxPoolSize: 10, minPoolSize: 2, socketTimeoutMS: 45000), compound ESR indexes (userId + isExpense + date), and eliminated the N+1 findOne query loop",
      "📦 Resilient In-App APK Updater: Version Dump Engine with direct self-hosted streaming, multi-hop redirect resolution, and zero-404 air-gapped GitHub fallback"
    ],
    minSupportedVersion: "1.0.0",
    isMandatory: false,
    apkDownloadUrl: "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker/releases/download/v1.8.0/Invictus.apk",
    apkSha256: "4cb3efd9a63d8b5905fdda9853f7f0d759cabf1c9968081c9c7aa4fa3726f0bc",
    apkSizeBytes: 4340478,
    otaBundleUrl: "",
    otaSha256: "",
    isActive: true,
    updatedAt: new Date()
  };

  const res = await collection.updateOne(
    { version: "1.8.0" },
    { $set: releaseData, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );

  console.log("MongoDB app_releases upsert result:", res.acknowledged, "matched:", res.matchedCount, "upserted:", res.upsertedId);
  const doc = await collection.findOne({ version: "1.8.0" });
  console.log("Verified stored release:", doc.version, "Build:", doc.buildNumber, "URL:", doc.apkDownloadUrl);
  await client.close();
}

seed().catch(console.error);
