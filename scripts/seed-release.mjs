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

  const releaseData = {
    version: "1.7.7",
    buildNumber: 28,
    releaseDate: "October 27, 2026",
    channel: "stable",
    changelog: [
      "⚡ Autonomous On-Launch SMS Sync: Automatically checks for today's bank transactions with a 2-hour midnight buffer on app entry",
      "📅 Date-Targeted SMS Scanner: Interactive presets (Today, Yesterday, 7 Days, Month, Custom Range) to scan specific dates",
      "🛡️ Frictionless Android Permission Flow: Native system runtime dialog (Allow/Don't allow) with 1-tap Settings deep-link fallback",
      "🛑 15-Minute Cooldown Guardrail: Prevents battery and SQLite thrashing across rapid page transitions",
      "💳 Zero-Clipping Neobrutalist Wallet Cockpit: Fluid responsive tabs, tabular numerals, and unclipped ink drop shadows",
      "📲 In-App APK Updater: Pre-flight package validation with version downgrade protection"
    ],
    minSupportedVersion: "1.0.0",
    isMandatory: false,
    apkDownloadUrl: "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker/releases/download/v1.7.7/Invictus.apk",
    apkSha256: "b896e236f5197ea6365891748055b1157d2b28f88bed0cef82b627e07d04e886",
    apkSizeBytes: 4337861,
    otaBundleUrl: "",
    otaSha256: "",
    isActive: true,
    updatedAt: new Date()
  };

  const res = await collection.updateOne(
    { version: "1.7.7" },
    { $set: releaseData, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );

  console.log("MongoDB app_releases upsert result:", res.acknowledged, "matched:", res.matchedCount, "upserted:", res.upsertedId);
  const doc = await collection.findOne({ version: "1.7.7" });
  console.log("Verified stored release:", doc.version, "Build:", doc.buildNumber, "URL:", doc.apkDownloadUrl);
  await client.close();
}

seed().catch(console.error);
