import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.resolve(process.cwd(), "screenshots/audit/bottom_nav");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });

  const setupAuth = async (page) => {
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.setItem("invictus_guest_mode", "true");
      localStorage.setItem("invictus_guest_name", "Alex Vance");
      localStorage.setItem("sq_dev_guest", "true");
    });
  };

  // Test 1: Android 3-Button Navigation simulation: 390x800, safe-area-inset-bottom = 0px
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 800 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await setupAuth(page);

    // Today Page
    await page.goto("http://localhost:3000/today", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "today_3button_docked_light.png"),
    });

    // Habits Page
    await page.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "habits_3button_docked_light.png"),
    });

    // Money Page
    await page.goto("http://localhost:3000/money", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "money_3button_docked_light.png"),
    });

    // Scroll down on money page to check no bleed-through
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "money_3button_docked_scrolled.png"),
    });

    await context.close();
  }

  // Test 2: Fullscreen Gesture Navigation: 390x844
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await setupAuth(page);

    await page.goto("http://localhost:3000/money", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "money_gesture_docked_light.png"),
    });

    // Dark Mode on Goals
    await page.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "habits_docked_dark.png"),
    });

    await context.close();
  }

  await browser.close();
  console.log("Screenshots captured successfully!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
