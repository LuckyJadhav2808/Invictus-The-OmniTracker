import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const masterSvgPath = path.join(rootDir, "src", "app", "icon.svg");
const publicIconsDir = path.join(rootDir, "public", "icons");
const resDir = path.join(rootDir, "android", "app", "src", "main", "res");

// Standalone Foreground SVG for Android Adaptive Icons (Transparent Canvas)
const foregroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <g id="icon" transform="translate(256, 256)">
    <!-- Top Horizontal Pediment -->
    <path
      d="M -110 -150 L 110 -150 L 80 -95 L -80 -95 Z"
      fill="#FAF8F5"
    />
    <!-- Central Monolithic Stem (Electric Volt) -->
    <path
      d="M -45 -80 L 45 -80 L 45 80 L -45 80 Z"
      fill="#CEF431"
    />
    <!-- Bottom Horizontal Base Pedestal -->
    <path
      d="M -80 95 L 80 95 L 110 150 L -110 150 Z"
      fill="#FAF8F5"
    />
    <!-- Inner Upward Chevron Arrow Cutout -->
    <polygon
      points="0,-50 30,10 0,-10 -30,10"
      fill="#161514"
    />
  </g>
</svg>`;

// Android density mappings:
// Density: [launcherSize, foregroundCanvasSize]
const DENSITIES = {
  "mipmap-mdpi": { launcher: 48, foreground: 108 },
  "mipmap-hdpi": { launcher: 72, foreground: 162 },
  "mipmap-xhdpi": { launcher: 96, foreground: 216 },
  "mipmap-xxhdpi": { launcher: 144, foreground: 324 },
  "mipmap-xxxhdpi": { launcher: 192, foreground: 432 },
};

function createIco(pngBuffers) {
  const headerSize = 6;
  const entrySize = 16;
  const numImages = pngBuffers.length;
  let offset = headerSize + entrySize * numImages;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = ICO
  header.writeUInt16LE(numImages, 4);

  const entries = [];
  for (const img of pngBuffers) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    entries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers.map((p) => p.buffer)]);
}

async function generateAllIcons() {
  console.log("⚡ Generating Invictus Monolith Icons from:", masterSvgPath);

  if (!fs.existsSync(masterSvgPath)) {
    throw new Error(`Master icon SVG not found at ${masterSvgPath}`);
  }

  const svgBuffer = fs.readFileSync(masterSvgPath);
  const fgBuffer = Buffer.from(foregroundSvg);

  // 1. Generate PWA Icons in public/icons
  if (!fs.existsSync(publicIconsDir)) {
    fs.mkdirSync(publicIconsDir, { recursive: true });
  }

  const pwa512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(publicIconsDir, "icon-512.png"), pwa512);
  console.log("  ✓ Generated public/icons/icon-512.png (512x512)");

  const pwa192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.join(publicIconsDir, "icon-192.png"), pwa192);
  console.log("  ✓ Generated public/icons/icon-192.png (192x192)");

  // 2. Generate multi-resolution src/app/favicon.ico (16, 32, 48)
  const ico16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const ico32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const ico48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  const icoFile = createIco([
    { width: 16, height: 16, buffer: ico16 },
    { width: 32, height: 32, buffer: ico32 },
    { width: 48, height: 48, buffer: ico48 },
  ]);
  fs.writeFileSync(path.join(rootDir, "src", "app", "favicon.ico"), icoFile);
  console.log("  ✓ Generated src/app/favicon.ico (16px, 32px, 48px)");

  // 3. Process each Android mipmap density
  for (const [folder, dims] of Object.entries(DENSITIES)) {
    const targetDir = path.join(resDir, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // A) ic_launcher.png (Square / Squircle full icon)
    await sharp(svgBuffer)
      .resize(dims.launcher, dims.launcher)
      .png()
      .toFile(path.join(targetDir, "ic_launcher.png"));

    // B) ic_launcher_round.png (Circular mask for pixel & circular launchers)
    const circleSvg = Buffer.from(
      `<svg width="${dims.launcher}" height="${dims.launcher}">
        <circle cx="${dims.launcher / 2}" cy="${dims.launcher / 2}" r="${dims.launcher / 2}" fill="#ffffff"/>
      </svg>`
    );

    await sharp(svgBuffer)
      .resize(dims.launcher, dims.launcher)
      .composite([{ input: circleSvg, blend: "dest-in" }])
      .png()
      .toFile(path.join(targetDir, "ic_launcher_round.png"));

    // C) ic_launcher_foreground.png (Adaptive Icon Foreground layer)
    // Center emblem sized comfortably inside the 72dp safe viewport (68% of 108dp canvas)
    const contentSize = Math.round(dims.foreground * 0.68);
    const resizedEmblem = await sharp(fgBuffer)
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
      .composite([{ input: resizedEmblem, top: topOffset, left: leftOffset }])
      .png()
      .toFile(path.join(targetDir, "ic_launcher_foreground.png"));

    console.log(`  ✓ Generated ${folder} (launcher: ${dims.launcher}px, fg: ${dims.foreground}px)`);
  }

  // 4. Update background XML color tokens to Obsidian #161514
  const bgXmlPath = path.join(resDir, "values", "ic_launcher_background.xml");
  const bgVectorPath = path.join(resDir, "drawable", "ic_launcher_background.xml");

  const bgXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#161514</color>
</resources>
`;
  fs.writeFileSync(bgXmlPath, bgXmlContent, "utf8");
  console.log("  ✓ Updated values/ic_launcher_background.xml to #161514");

  const bgVectorContent = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#161514"
        android:pathData="M0,0h108v108h-108z" />
</vector>
`;
  fs.writeFileSync(bgVectorPath, bgVectorContent, "utf8");
  console.log("  ✓ Updated drawable/ic_launcher_background.xml to #161514");

  console.log("\n🎉 All Invictus Monolith web, PWA & Android icons generated successfully!");
}

generateAllIcons().catch((err) => {
  console.error("Icon generation error:", err);
  process.exit(1);
});
