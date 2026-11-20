import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = path.resolve(process.cwd(), "screenshots/audit");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const WIDTHS = [360, 390, 412];
const THEMES = ["light", "dark"];

const PAGES = [
  { key: "01_login", url: `${BASE_URL}/login`, auth: false },
  { key: "02_onboarding", url: `${BASE_URL}/onboarding`, auth: false },
  { key: "03_today", url: `${BASE_URL}/today`, auth: true },
  { key: "04_goals", url: `${BASE_URL}/goals`, auth: true },
  { key: "05_goals_gym", url: `${BASE_URL}/goals/gym`, auth: true },
  { key: "06_goals_nutrition", url: `${BASE_URL}/goals/nutrition`, auth: true },
  { key: "07_goals_analytics", url: `${BASE_URL}/goals/analytics`, auth: true },
  { key: "08_money", url: `${BASE_URL}/money`, auth: true },
  { key: "09_tasks", url: `${BASE_URL}/tasks`, auth: true },
  { key: "10_study", url: `${BASE_URL}/study`, auth: true },
  { key: "11_analytics", url: `${BASE_URL}/analytics`, auth: true },
  { key: "12_settings", url: `${BASE_URL}/settings`, auth: true },
  { key: "13_profile", url: `${BASE_URL}/profile`, auth: true },
  { key: "14_quick_log", url: `${BASE_URL}/quick-log`, auth: true },
];

async function runAudit() {
  console.log(`Starting Mobile Audit across ${PAGES.length} pages, ${WIDTHS.length} widths, ${THEMES.length} themes...`);
  const browser = await chromium.launch({ channel: "msedge", headless: true });

  for (const width of WIDTHS) {
    console.log(`\n================ Viewport Width: ${width}px ================`);
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      deviceScaleFactor: 2,
    });

    const page = await context.newPage();

    for (const p of PAGES) {
      for (const theme of THEMES) {
        const filename = `${p.key}_${width}px_${theme}.png`;
        const filePath = path.join(OUTPUT_DIR, filename);

        try {
          await page.goto(p.url, { waitUntil: "domcontentloaded", timeout: 15000 });

          // Apply auth session if needed
          if (p.auth) {
            await page.evaluate(() => {
              if (!localStorage.getItem("invictus_guest_mode")) {
                localStorage.setItem("invictus_guest_mode", "true");
                localStorage.setItem("invictus_guest_name", "Alex Vance");
                localStorage.setItem("sq_dev_guest", "true");
              }
            });
          }

          // Apply theme
          await page.evaluate((t) => {
            localStorage.setItem("theme", t);
            localStorage.setItem("sq-theme", t);
            if (t === "dark") {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }, theme);

          // Settle animations & layout
          await page.waitForTimeout(600);

          await page.screenshot({
            path: filePath,
            fullPage: true,
          });

          console.log(`✓ Captured: ${filename}`);
        } catch (err) {
          console.error(`✗ Error capturing ${filename}:`, err.message);
        }
      }
    }

    await context.close();
  }

  await browser.close();
  console.log(`\n✅ Mobile Audit Complete! Screenshots saved to ${OUTPUT_DIR}`);
}

runAudit().catch(console.error);
