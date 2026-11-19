import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/deel/.gemini/antigravity/brain/e4adc17f-e4c0-4e4d-96f3-1259bc4e3c9c";
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, "screenshots/audit");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runSettingsVerification() {
  console.log("🚀 Launching Playwright browser for Settings Page Verification...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });

  const results = {
    mobile: {},
    desktop: {},
    passed: true,
    issues: [],
  };

  try {
    // -------------------------------------------------------------------------
    // 1. MOBILE VERIFICATION (390 x 844)
    // -------------------------------------------------------------------------
    console.log("\n📱 Testing Mobile Viewport (390x844)...");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await mobileContext.newPage();

    // Enable guest mode in localStorage before navigation
    await page.addInitScript(() => {
      localStorage.setItem("invictus_guest_mode", "true");
      localStorage.setItem("invictus_onboarded", "true");
      localStorage.setItem(
        "invictus_user_profile",
        JSON.stringify({
          displayName: "Lucky Manoj",
          timezone: "Asia/Kolkata",
          currency: "INR",
          weekStartsOn: 1,
        })
      );
    });
    await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Measure Scroll Height & Viewport Screens
    const mobileMetrics = await page.evaluate(() => {
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      const viewHeight = window.innerHeight;
      const screens = Number((docHeight / viewHeight).toFixed(2));

      // Check headers
      const mobileAppBar = document.querySelector("header.sticky.lg\\:hidden");
      const spaceHeader = document.querySelector("header.sticky.hidden.lg\\:block");
      const lifeEngineText = Array.from(document.querySelectorAll("h1, h2, div")).some((el) =>
        el.textContent?.trim().includes("LIFE ENGINE")
      );

      // Check slot components
      const heroSummary = Array.from(document.querySelectorAll("*")).some(
        (el) => el.textContent?.includes("Air-Gapped") || el.textContent?.includes("Vault")
      );
      const subNavButtons = Array.from(
        document.querySelectorAll("nav button, .snap-x button")
      ).map((b) => b.textContent?.trim());
      const doorTiles = Array.from(document.querySelectorAll(".grid-cols-4 button")).map((b) =>
        b.textContent?.trim()
      );

      // Count borders
      const borderedEls = document.querySelectorAll(
        "[class*='border-2'], [class*='border-[#161514]'], [class*='border-border']"
      ).length;

      return {
        scrollHeight: docHeight,
        viewHeight,
        screens,
        hasMobileAppBar: !!mobileAppBar,
        hasSpaceHeaderHidden: !!spaceHeader,
        hasLifeEngineDuplicate: lifeEngineText,
        heroSummaryFound: heroSummary,
        subNavButtons,
        doorTiles,
        borderedEls,
      };
    });

    results.mobile = mobileMetrics;
    console.log("Mobile Metrics:", JSON.stringify(mobileMetrics, null, 2));

    // Capture Top Screenshot
    const mobileTopPath = path.join(SCREENSHOT_DIR, "settings_redesign_mobile_top.png");
    await page.screenshot({ path: mobileTopPath });
    console.log(`Saved screenshot: ${mobileTopPath}`);

    // Test Door Tile 1: Alerts Modal
    console.log("Testing Door Tile 1 (Alerts -> ReminderManagerModal)...");
    const alertsTile = page.locator(".grid-cols-4 button:has-text('Alerts')").first();
    if (await alertsTile.count()) {
      await alertsTile.click();
      await page.waitForTimeout(600);
      const modalVisible = await page.evaluate(() => {
        return !!document.querySelector("[role='dialog'], .fixed.inset-0");
      });
      console.log(`Reminder modal opened: ${modalVisible}`);
      if (modalVisible) {
        // Close modal
        await page.keyboard.press("Escape");
        await page.waitForTimeout(400);
      }
    }

    // Scroll Down & Capture Scrolled Screenshot
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(400);
    const mobileScrolledPath = path.join(SCREENSHOT_DIR, "settings_redesign_mobile_scrolled.png");
    await page.screenshot({ path: mobileScrolledPath });
    console.log(`Saved screenshot: ${mobileScrolledPath}`);

    // Tab Switching Test
    console.log("Testing SubNav Tab Switching...");
    const spacesTab = page.locator("button:visible:has-text('Spaces')").first();
    if (await spacesTab.count()) {
      await spacesTab.click();
      await page.waitForTimeout(500);
      const spacesContent = await page.evaluate(() => {
        return document.body.textContent?.includes("Active Spaces & Workspaces");
      });
      console.log(`Spaces tab activated: ${spacesContent}`);
    }

    const vaultTab = page.locator("button:visible:has-text('Vault')").first();
    if (await vaultTab.count()) {
      await vaultTab.click();
      await page.waitForTimeout(500);
      const vaultContent = await page.evaluate(() => {
        return document.body.textContent?.includes("Data Vault & Snapshots");
      });
      console.log(`Vault tab activated: ${vaultContent}`);
    }

    await mobileContext.close();

    // -------------------------------------------------------------------------
    // 2. DESKTOP VERIFICATION (1280 x 800)
    // -------------------------------------------------------------------------
    console.log("\n💻 Testing Desktop Laptop Viewport (1280x800)...");
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.addInitScript(() => {
      localStorage.setItem("invictus_guest_mode", "true");
      localStorage.setItem("invictus_onboarded", "true");
      localStorage.setItem(
        "invictus_user_profile",
        JSON.stringify({
          displayName: "Lucky Manoj",
          timezone: "Asia/Kolkata",
          currency: "INR",
          weekStartsOn: 1,
        })
      );
    });
    await desktopPage.goto("http://localhost:3000/settings", { waitUntil: "networkidle" });
    await desktopPage.waitForSelector(".lg\\:grid-cols-12", { timeout: 15000 }).catch(() => {});
    await desktopPage.waitForTimeout(2000);

    const desktopMetrics = await desktopPage.evaluate(() => {
      const spaceHeader = document.querySelector("header.sticky.hidden.lg\\:block");
      const bentoCols = document.querySelectorAll(".lg\\:grid-cols-12 > div").length;
      const rightCol = document.querySelector(".lg\\:col-span-4");
      const hasDevInfo = document.body.textContent?.includes("Developer");
      const hasSystemDiag = document.body.textContent?.includes("System Diagnostics");

      return {
        hasSpaceHeader: !!spaceHeader,
        bentoColumnsFound: bentoCols,
        hasRightCol: !!rightCol,
        hasDevInfo,
        hasSystemDiag,
      };
    });

    results.desktop = desktopMetrics;
    console.log("Desktop Metrics:", JSON.stringify(desktopMetrics, null, 2));

    const desktopPath = path.join(SCREENSHOT_DIR, "settings_redesign_desktop.png");
    await desktopPage.screenshot({ path: desktopPath });
    console.log(`Saved screenshot: ${desktopPath}`);

    await desktopContext.close();

    // Output JSON result
    const reportPath = path.join(ARTIFACT_DIR, "settings_verification_report.json");
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ Settings verification completed! Report written to ${reportPath}`);
  } catch (err) {
    console.error("Verification failed:", err);
    results.passed = false;
    results.issues.push(err.message);
  } finally {
    await browser.close();
  }
}

runSettingsVerification();
