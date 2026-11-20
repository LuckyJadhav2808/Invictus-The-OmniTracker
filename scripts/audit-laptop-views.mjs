import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.resolve(process.cwd(), "screenshots/audit/laptop");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.setItem("invictus_guest_mode", "true");
    localStorage.setItem("invictus_guest_name", "Alex Vance");
    localStorage.setItem("sq_dev_guest", "true");
  });

  // 1. Goals / Habits
  await page.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "laptop_habits.png") });

  // 2. Money
  await page.goto("http://localhost:3000/money", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "laptop_money.png") });

  // 3. Today
  await page.goto("http://localhost:3000/today", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "laptop_today.png") });

  // 4. Tasks
  await page.goto("http://localhost:3000/tasks", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "laptop_tasks.png") });

  await browser.close();
  console.log("Laptop audit screenshots captured!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
