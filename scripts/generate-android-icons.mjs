import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const srcIconPath = path.join(rootDir, "public", "icons", "icon-512.png");
const resDir = path.join(rootDir, "android", "app", "src", "main", "res");

// Android density mappings:
// Density: [launcherSize, foregroundCanvasSize]
const DENSITIES = {
  "mipmap-mdpi": { launcher: 48, foreground: 108 },
  "mipmap-hdpi": { launcher: 72, foreground: 162 },
  "mipmap-xhdpi": { launcher: 96, foreground: 216 },
  "mipmap-xxhdpi": { launcher: 144, foreground: 324 },
  "mipmap-xxxhdpi": { launcher: 192, foreground: 432 },
};

async function generateIcons() {
  console.log("🎨 Generating Android Vix Icons from:", srcIconPath);

  if (!fs.existsSync(srcIconPath)) {
    throw new Error(`Source icon not found at ${srcIconPath}`);
  }

  // 1. Process each mipmap density
  for (const [folder, dims] of Object.entries(DENSITIES)) {
    const targetDir = path.join(resDir, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // A) ic_launcher.png (Square / Squircle full icon)
    await sharp(srcIconPath)
      .resize(dims.launcher, dims.launcher)
      .png()
      .toFile(path.join(targetDir, "ic_launcher.png"));

    // B) ic_launcher_round.png (Circular mask for pixel & circular launchers)
    const circleSvg = Buffer.from(
      `<svg width="${dims.launcher}" height="${dims.launcher}">
        <circle cx="${dims.launcher / 2}" cy="${dims.launcher / 2}" r="${dims.launcher / 2}" fill="#ffffff"/>
      </svg>`
    );

    await sharp(srcIconPath)
      .resize(dims.launcher, dims.launcher)
      .composite([{ input: circleSvg, blend: "dest-in" }])
      .png()
      .toFile(path.join(targetDir, "ic_launcher_round.png"));

    // C) ic_launcher_foreground.png (Adaptive Icon Foreground layer)
    // In Android adaptive icons, canvas is 108dp, and center 72dp is the safe viewport (ratio: 72/108 = ~66.7%).
    // We resize the icon to fit comfortably within the safe area with slight breathing room (~70%).
    const contentSize = Math.round(dims.foreground * 0.72);
    const resizedContent = await sharp(srcIconPath)
      .resize(contentSize, contentSize)
      .toBuffer();

    const topOffset = Math.round((dims.foreground - contentSize) / 2);
    const leftOffset = Math.round((dims.foreground - contentSize) / 2);

    await sharp({
      create: {
        width: dims.foreground,
        height: dims.foreground,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: resizedContent, top: topOffset, left: leftOffset }])
      .png()
      .toFile(path.join(targetDir, "ic_launcher_foreground.png"));

    console.log(`  ✓ Generated ${folder} (launcher: ${dims.launcher}px, fg: ${dims.foreground}px)`);
  }

  // 2. Update background XML color tokens to electric lime #CEF431
  const bgXmlPath = path.join(resDir, "values", "ic_launcher_background.xml");
  const bgVectorPath = path.join(resDir, "drawable", "ic_launcher_background.xml");

  const bgXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#CEF431</color>
</resources>
`;
  fs.writeFileSync(bgXmlPath, bgXmlContent, "utf8");
  console.log("  ✓ Updated values/ic_launcher_background.xml to #CEF431");

  const bgVectorContent = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#CEF431"
        android:pathData="M0,0h108v108h-108z" />
</vector>
`;
  fs.writeFileSync(bgVectorPath, bgVectorContent, "utf8");
  console.log("  ✓ Updated drawable/ic_launcher_background.xml to #CEF431");

  console.log("\n🎉 All Android Vix launcher icons generated successfully!");
}

generateIcons().catch((err) => {
  console.error("Icon generation error:", err);
  process.exit(1);
});
