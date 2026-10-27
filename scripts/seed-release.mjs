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
    version: "1.7.8",
    buildNumber: 29,
    releaseDate: "October 27, 2026",
    channel: "stable",
    changelog: [
      "🎯 Today & Yesterday 1-Tap Scanner Preset: Dedicated quick-filter spanning current day and day before with real-time telemetry readout",
      "📡 Telecom +91 & 91 Sender Normalization: Seamlessly handles Indian carrier prefixes on bank sender headers (e.g., +91AD-PNBSMS)",
      "💳 FinTech Sender Support: Native recognition for PhonePe, Google Pay, BHIM/NPCI UPI, OneCard, Jupiter, and Fi Money",
      "🕒 IST Timezone Drift Fix: Local device calendar extraction eliminating midnight UTC date slippage",
      "⏱️ Carrier Clock Skew Resilience: 12-hour forward lookahead buffer capturing all fresh same-day transactions",
      "💳 Zero-Clipping Neobrutalist Wallet Cockpit: Fluid responsive tabs, tabular numerals, and unclipped ink drop shadows"
    ],
    minSupportedVersion: "1.0.0",
    isMandatory: false,
    apkDownloadUrl: "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker/releases/download/v1.7.8/Invictus.apk",
    apkSha256: "68b34f68efa2b5b242906c9a5be9faa106491bcd8b13deb6d6103f9a8d36c6b3",
    apkSizeBytes: 4338413,
    otaBundleUrl: "",
    otaSha256: "",
    isActive: true,
    updatedAt: new Date()
  };

  const res = await collection.updateOne(
    { version: "1.7.8" },
    { $set: releaseData, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );

  console.log("MongoDB app_releases upsert result:", res.acknowledged, "matched:", res.matchedCount, "upserted:", res.upsertedId);
  const doc = await collection.findOne({ version: "1.7.8" });
  console.log("Verified stored release:", doc.version, "Build:", doc.buildNumber, "URL:", doc.apkDownloadUrl);
  await client.close();
}

seed().catch(console.error);
