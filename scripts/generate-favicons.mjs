import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const svgPath = path.join(process.cwd(), "src/app/icon.svg");
const appleSvgPath = path.join(process.cwd(), "src/app/apple-icon.svg");
const svgBuffer = fs.readFileSync(svgPath);
const appleSvgBuffer = fs.readFileSync(appleSvgPath);

async function generate() {
  console.log("Generating high-res production favicons & icons...");

  // Ensure directories exist
  const iconsDir = path.join(process.cwd(), "public/icons");
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // 1. 512x512 PNG (PWA & Android splash)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-512.png"));
  console.log("✓ Generated public/icons/icon-512.png");

  // 2. 192x192 PNG (PWA Home Screen)
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, "icon-192.png"));
  console.log("✓ Generated public/icons/icon-192.png");

  // 3. Apple Touch Icon 180x180 PNG
  await sharp(appleSvgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(process.cwd(), "public/apple-touch-icon.png"));
  console.log("✓ Generated public/apple-touch-icon.png");

  // 4. 32x32 PNG for high-DPI favicon fallback
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(process.cwd(), "public/favicon-32x32.png"));
  console.log("✓ Generated public/favicon-32x32.png");

  // 5. 16x16 PNG for standard favicon fallback
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(process.cwd(), "public/favicon-16x16.png"));
  console.log("✓ Generated public/favicon-16x16.png");

  // 6. Generate src/app/favicon.ico
  // An ICO file header contains directory entries pointing to PNG images.
  // Windows/Modern browsers support PNG-encoded ICO files natively!
  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const png48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();

  const icoBuffer = createIco([
    { size: 16, buffer: png16 },
    { size: 32, buffer: png32 },
    { size: 48, buffer: png48 },
  ]);

  fs.writeFileSync(path.join(process.cwd(), "src/app/favicon.ico"), icoBuffer);
  fs.writeFileSync(path.join(process.cwd(), "public/favicon.ico"), icoBuffer);
  console.log("✓ Generated src/app/favicon.ico & public/favicon.ico");
}

function createIco(images) {
  const count = images.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + dirEntrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = ICO
  header.writeUInt16LE(count, 4); // count of images

  const entries = [];
  const buffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // width
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1); // height
    entry.writeUInt8(0, 2); // color palette: 0
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes: 1
    entry.writeUInt16LE(32, 6); // bits per pixel: 32
    entry.writeUInt32LE(img.buffer.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset of image data

    entries.push(entry);
    buffers.push(img.buffer);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...buffers]);
}

generate().catch(console.error);
