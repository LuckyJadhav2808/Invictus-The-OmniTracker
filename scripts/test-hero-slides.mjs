import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/deel/.gemini/antigravity/brain/e4adc17f-e4c0-4e4d-96f3-1259bc4e3c9c/screenshots/audit/hero_redesign";
const LOCAL_DIR = "screenshots/audit/hero_redesign";

async function testSlides() {
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
  await page.waitForTimeout(500);

  // Click dot 2 (Weekly Velocity)
  const dots = page.locator('button[aria-label^="Go to slide"]');
  await dots.nth(1).click();
  await page.waitForTimeout(400);

  const slide1Path = path.join(LOCAL_DIR, "hero_slide_weekly.png");
  await page.screenshot({ path: slide1Path });
  fs.copyFileSync(slide1Path, path.join(ARTIFACT_DIR, "hero_slide_weekly.png"));

  // Click dot 3 (Streak Momentum)
  await dots.nth(2).click();
  await page.waitForTimeout(400);

  const slide2Path = path.join(LOCAL_DIR, "hero_slide_streak.png");
  await page.screenshot({ path: slide2Path });
  fs.copyFileSync(slide2Path, path.join(ARTIFACT_DIR, "hero_slide_streak.png"));

  console.log("Captured slides 1 and 2 screenshots!");
  await browser.close();
}

testSlides().catch(console.error);
