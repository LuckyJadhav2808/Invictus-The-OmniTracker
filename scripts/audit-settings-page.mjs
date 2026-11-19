import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const ARTIFACT_DIR = "C:/Users/deel/.gemini/antigravity/brain/e4adc17f-e4c0-4e4d-96f3-1259bc4e3c9c";
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, "screenshots/audit");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runAudit() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });

  const setupPage = async (page) => {
    await page.addInitScript(() => {
      localStorage.setItem("invictus_guest_mode", "true");
      localStorage.setItem("invictus_onboarded", "true");
      localStorage.setItem(
        "invictus_user_profile",
        JSON.stringify({
          displayName: "Lucky Manoj",
          email: "lucky@invictus.local",
          timezone: "Asia/Kolkata",
          currency: "INR",
          weekStartsOn: 1,
          modulesEnabled: { goals: true, tasks: true, money: true },
        })
      );
    });
  };

  const results = { mobile: {}, desktop: {} };

  try {
    console.log("=== Running Mobile Settings Audit (390x844) ===");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();
    await setupPage(mobilePage);
    await mobilePage.goto("http://localhost:3000/settings", { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(1500);

    const mobileMetrics = await mobilePage.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const screens = scrollHeight / clientHeight;
      const borderedCards = document.querySelectorAll('[class*="border"]').length;
      const buttons = document.querySelectorAll("button").length;
      const inputs = document.querySelectorAll("input, select, textarea").length;
      const sections = Array.from(document.querySelectorAll("h2, h3")).map(h => h.textContent?.trim()).filter(Boolean);
      return { scrollHeight, clientHeight, screens, borderedCards, buttons, inputs, sections };
    });

    console.log("Mobile Metrics:", JSON.stringify(mobileMetrics, null, 2));
    results.mobile = mobileMetrics;

    const mobileTopPath = path.join(SCREENSHOT_DIR, "settings_current_mobile_top.png");
    await mobilePage.screenshot({ path: mobileTopPath });
    console.log("Saved:", mobileTopPath);

    await mobilePage.evaluate(() => window.scrollBy(0, 1000));
    await mobilePage.waitForTimeout(400);
    const mobileScrolledPath = path.join(SCREENSHOT_DIR, "settings_current_mobile_scrolled.png");
    await mobilePage.screenshot({ path: mobileScrolledPath });
    console.log("Saved:", mobileScrolledPath);

    await mobileContext.close();

    // -------------------------------------------------------------
    // Desktop Audit (1280x800)
    // -------------------------------------------------------------
    console.log("\n=== Running Desktop Settings Audit (1280x800) ===");
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
    });
    const desktopPage = await desktopContext.newPage();
    await setupPage(desktopPage);
    await desktopPage.goto("http://localhost:3000/settings", { waitUntil: "networkidle" });
    await desktopPage.waitForTimeout(1500);

    const desktopMetrics = await desktopPage.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const screens = scrollHeight / clientHeight;
      const borderedCards = document.querySelectorAll('[class*="border"]').length;
      return { scrollHeight, clientHeight, screens, borderedCards };
    });

    console.log("Desktop Metrics:", JSON.stringify(desktopMetrics, null, 2));
    results.desktop = desktopMetrics;

    const desktopPath = path.join(SCREENSHOT_DIR, "settings_current_desktop.png");
    await desktopPage.screenshot({ path: desktopPath });
    console.log("Saved:", desktopPath);

    await desktopContext.close();

  } catch (err) {
    console.error("Audit error:", err);
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "settings_baseline_audit.json"),
    JSON.stringify(results, null, 2)
  );
  console.log("Settings baseline audit complete!");
}

runAudit();
