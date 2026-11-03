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
    version: "1.7.9",
    buildNumber: 30,
    releaseDate: "November 4, 2026",
    channel: "stable",
    changelog: [
      "🌓 Full Neobrutalist Dark Mode & Theme Harmonization: Complete zero-blur obsidian contrast overhaul across all 8 spaces with instantaneous zero-flicker theme toggle",
      "🦴 Skeletons vs Spinner Loading Engine: Route-preserving Neobrutalist wireframe pulses for page routes, paired with high-energy monogram spinner for indeterminate transitions",
      "🧮 Continuous Arithmetic Calculator: Fluid multi-step chaining (e.g., 2+2+2), operator switching, and 1-tap budget insertion with haptic audio feedback",
      "🚀 First-Run Quick-Start HUD: Instant frictionless onboarding deck with interactive quick-action missions replacing legacy onboarding wizard",
      "📱 Android Safe-Spend Monolith Widget: High-contrast layout, direct SMS sync intents, and native update bridge integration",
      "📦 Resilient In-App APK Downloader: Direct in-app updates with multi-hop redirect streaming, Android User-Agent header bypass, and live version dump telemetry engine"
    ],
    minSupportedVersion: "1.0.0",
    isMandatory: false,
    apkDownloadUrl: "https://github.com/LuckyJadhav2808/Invictus-The-OmniTracker/releases/download/v1.7.9/Invictus.apk",
    apkSha256: "68b34f68efa2b5b242906c9a5be9faa106491bcd8b13deb6d6103f9a8d36c6b3",
    apkSizeBytes: 4338413,
    otaBundleUrl: "",
    otaSha256: "",
    isActive: true,
    updatedAt: new Date()
  };

  const res = await collection.updateOne(
    { version: "1.7.9" },
    { $set: releaseData, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );

  console.log("MongoDB app_releases upsert result:", res.acknowledged, "matched:", res.matchedCount, "upserted:", res.upsertedId);
  const doc = await collection.findOne({ version: "1.7.9" });
  console.log("Verified stored release:", doc.version, "Build:", doc.buildNumber, "URL:", doc.apkDownloadUrl);
  await client.close();
}

seed().catch(console.error);
