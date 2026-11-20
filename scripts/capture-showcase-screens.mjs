import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/deel/.gemini/antigravity/brain/f3fa73aa-b13d-4a73-bd01-c83f5a238417/showcase_screenshots";
const PUBLIC_DIR = "d:/Invictus/public/showcase";

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

async function run() {
  console.log("Launching Edge/Chromium with retina mobile viewport (393x852 @3x)...");
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  });

  const page = await context.newPage();

  // Helper to remove any toasts before snapping
  const clearToasts = async () => {
    await page.evaluate(() => {
      document.querySelectorAll("[data-sonner-toast]").forEach((el) => el.remove());
      document.querySelectorAll("[data-sonner-toaster]").forEach((el) => el.remove());
    });
    await page.waitForTimeout(300);
  };

  // 1. Log in via Offline Guest
  console.log("Navigating to /login...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const guestBtn = page.getByRole("button", { name: /EXPLORE AS OFFLINE GUEST/i });
  if (await guestBtn.isVisible({ timeout: 4000 })) {
    await guestBtn.click();
    await page.waitForURL("**/today", { timeout: 8000 });
  }

  // Set custom mascot style: Electric Lime / Classic Blue with Crown
  await page.evaluate(() => {
    localStorage.setItem(
      "invictus-mascot-storage",
      JSON.stringify({
        state: {
          colorTheme: "classic-blue",
          expression: "celebrating",
          gear: "crown",
        },
        version: 0,
      })
    );
  });

  // Screen 1: Today Conquest Cockpit (Wait for toasts to disappear)
  console.log("Preparing Screen 1: Today Cockpit...");
  await page.waitForTimeout(4000);
  await clearToasts();
  await page.waitForTimeout(500);

  const p1Artifact = path.join(ARTIFACT_DIR, "01_today_conquest.png");
  const p1Public = path.join(PUBLIC_DIR, "01_today_conquest.png");
  await page.screenshot({ path: p1Artifact });
  fs.copyFileSync(p1Artifact, p1Public);
  console.log("Screen 1 captured cleanly!");

  // Screen 2: Interactive Mascot Onboarding Stage
  console.log("Navigating to /onboarding for Mascot Stage...");
  await page.evaluate(() => {
    localStorage.removeItem("invictus_onboarded");
    localStorage.setItem("invictus_onboarded", "false");
  });

  await page.goto("http://localhost:3000/onboarding", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Click until reaching slide 4, then click SET UP INVICTUS to open the Companion customizer
  for (let s = 0; s < 3; s++) {
    try {
      const nextBtn = page.getByRole("button", { name: /^Next/i });
      if (await nextBtn.isVisible({ timeout: 1500 })) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
    } catch {}
  }

  // Click SET UP INVICTUS
  try {
    const setupBtn = page.getByRole("button", { name: /SET UP INVICTUS/i });
    if (await setupBtn.isVisible({ timeout: 2000 })) {
      await setupBtn.click();
      await page.waitForTimeout(1000);
    }
  } catch {}

  await clearToasts();
  await page.waitForTimeout(800);

  console.log("Capturing Screen 2: Strobi Mascot...");
  const p2Artifact = path.join(ARTIFACT_DIR, "02_strobi_mascot.png");
  const p2Public = path.join(PUBLIC_DIR, "02_strobi_mascot.png");
  await page.screenshot({ path: p2Artifact });
  fs.copyFileSync(p2Artifact, p2Public);
  console.log("Screen 2 captured cleanly!");

  // Screen 3: Habits & Goals
  console.log("Navigating to /goals...");
  await page.evaluate(() => {
    localStorage.setItem("invictus_onboarded", "true");
  });
  await page.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await clearToasts();

  const p3Artifact = path.join(ARTIFACT_DIR, "03_habits_discipline.png");
  const p3Public = path.join(PUBLIC_DIR, "03_habits_discipline.png");
  await page.screenshot({ path: p3Artifact });
  fs.copyFileSync(p3Artifact, p3Public);
  console.log("Screen 3 captured cleanly!");

  // Screen 4: Money & Safe-to-Spend Ledger
  console.log("Navigating to /money...");
  await page.goto("http://localhost:3000/money", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await clearToasts();

  const p4Artifact = path.join(ARTIFACT_DIR, "04_money_ledger.png");
  const p4Public = path.join(PUBLIC_DIR, "04_money_ledger.png");
  await page.screenshot({ path: p4Artifact });
  fs.copyFileSync(p4Artifact, p4Public);
  console.log("Screen 4 captured cleanly!");

  // Screen 5: Tasks Matrix
  console.log("Navigating to /tasks...");
  await page.goto("http://localhost:3000/tasks", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await clearToasts();

  const p5Artifact = path.join(ARTIFACT_DIR, "05_tasks_velocity.png");
  const p5Public = path.join(PUBLIC_DIR, "05_tasks_velocity.png");
  await page.screenshot({ path: p5Artifact });
  fs.copyFileSync(p5Artifact, p5Public);
  console.log("Screen 5 captured cleanly!");

  console.log("All 5 showcase screenshots refreshed with pristine quality!");
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
