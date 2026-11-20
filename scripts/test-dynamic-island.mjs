import { chromium } from "playwright";
import fs from "fs";

async function testDynamicIsland() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "dark",
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem("invictus_guest_mode", "true");
    document.documentElement.classList.add("dark");
  });

  await page.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const screenshotPath = "screenshots/audit/habits_redesign/habits_dynamic_island_active.png";
  await page.screenshot({ path: screenshotPath, fullPage: false });

  fs.copyFileSync(
    screenshotPath,
    "C:/Users/deel/.gemini/antigravity/brain/e4adc17f-e4c0-4e4d-96f3-1259bc4e3c9c/screenshots/audit/habits_redesign/habits_dynamic_island_active.png"
  );

  console.log("Captured active dynamic island screenshot!");
  await browser.close();
}

testDynamicIsland().catch(console.error);
