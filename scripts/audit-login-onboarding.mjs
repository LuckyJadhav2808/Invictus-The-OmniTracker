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

  const auditReport = {
    loginMobile: {},
    loginDesktop: {},
    guestModeFlow: {},
    demoFillFlow: {},
    onboardingRedirect: {},
    localStorageAudit: {},
    consoleErrors: [],
  };

  try {
    console.log("=== 1. AUDITING /login (Mobile 390x844) ===");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();
    
    mobilePage.on("console", (msg) => {
      if (msg.type() === "error") {
        auditReport.consoleErrors.push(`[Mobile Console Error]: ${msg.text()}`);
      }
    });

    await mobilePage.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(1500);

    const mobileMetrics = await mobilePage.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const screens = scrollHeight / clientHeight;
      const buttons = Array.from(document.querySelectorAll("button"));
      const guestBtn = buttons.some(b => b.textContent.includes("Explore as Offline Guest"));
      const emailInput = !!document.querySelector('input[type="email"]');
      const passwordInput = !!document.querySelector('input[type="password"]');
      const demoBtn = buttons.some(b => b.textContent.includes("Fill Demo"));
      return { scrollHeight, clientHeight, screens, guestBtn, emailInput, passwordInput, demoBtn };
    });
    auditReport.loginMobile = mobileMetrics;
    console.log("Mobile Login Metrics:", JSON.stringify(mobileMetrics, null, 2));

    const mobileLoginPath = path.join(SCREENSHOT_DIR, "login_mobile.png");
    await mobilePage.screenshot({ path: mobileLoginPath, fullPage: true });
    console.log("Saved screenshot:", mobileLoginPath);

    // Test Guest Login Click on Mobile
    console.log("Testing Guest Login flow on mobile...");
    const guestBtn = mobilePage.locator('button:has-text("Explore as Offline Guest")').first();
    await guestBtn.click();
    await mobilePage.waitForTimeout(2000);

    const postGuestUrl = mobilePage.url();
    const guestLocalStorage = await mobilePage.evaluate(() => {
      const keys = Object.keys(localStorage);
      const storage = {};
      for (const k of keys) {
        storage[k] = localStorage.getItem(k);
      }
      return storage;
    });

    auditReport.guestModeFlow = {
      redirectUrl: postGuestUrl,
      isRedirectedToToday: postGuestUrl.includes("/today"),
      localStorageKeysCount: Object.keys(guestLocalStorage).length,
      keys: Object.keys(guestLocalStorage),
    };
    console.log("Post-Guest URL:", postGuestUrl);
    console.log("Guest LocalStorage Keys:", Object.keys(guestLocalStorage));

    const guestTodayPath = path.join(SCREENSHOT_DIR, "guest_landing_today_mobile.png");
    await mobilePage.screenshot({ path: guestTodayPath });
    console.log("Saved screenshot:", guestTodayPath);

    await mobileContext.close();

    // -------------------------------------------------------------
    // 2. AUDITING /login (Desktop 1280x800)
    // -------------------------------------------------------------
    console.log("\n=== 2. AUDITING /login (Desktop 1280x800) ===");
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
    });
    const desktopPage = await desktopContext.newPage();
    desktopPage.on("console", (msg) => {
      if (msg.type() === "error") {
        auditReport.consoleErrors.push(`[Desktop Console Error]: ${msg.text()}`);
      }
    });

    await desktopPage.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await desktopPage.waitForTimeout(1500);

    const desktopMetrics = await desktopPage.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const screens = scrollHeight / clientHeight;
      return { scrollHeight, clientHeight, screens };
    });
    auditReport.loginDesktop = desktopMetrics;
    console.log("Desktop Login Metrics:", JSON.stringify(desktopMetrics, null, 2));

    const desktopLoginPath = path.join(SCREENSHOT_DIR, "login_desktop.png");
    await desktopPage.screenshot({ path: desktopLoginPath, fullPage: true });
    console.log("Saved screenshot:", desktopLoginPath);

    // Test Demo Credentials Fill
    console.log("Testing Fill Demo Credentials...");
    const fillDemoBtn = desktopPage.locator('button:has-text("Fill Demo")').first();
    await fillDemoBtn.click();
    await desktopPage.waitForTimeout(500);

    const formValues = await desktopPage.evaluate(() => {
      const email = document.querySelector('input[type="email"]')?.value;
      const pass = document.querySelector('input[type="password"]')?.value;
      return { email, pass };
    });
    auditReport.demoFillFlow = formValues;
    console.log("Form Values after Fill Demo:", formValues);

    await desktopContext.close();

    // -------------------------------------------------------------
    // 3. AUDITING /onboarding (Legacy Route Verification)
    // -------------------------------------------------------------
    console.log("\n=== 3. AUDITING /onboarding ROUTE REDIRECT ===");
    const onboardContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const onboardPage = await onboardContext.newPage();
    await onboardPage.goto("http://localhost:3000/onboarding", { waitUntil: "networkidle" });
    await onboardPage.waitForTimeout(1500);

    const onboardFinalUrl = onboardPage.url();
    const onboardFlag = await onboardPage.evaluate(() => localStorage.getItem("invictus_onboarded"));
    auditReport.onboardingRedirect = {
      finalUrl: onboardFinalUrl,
      isRedirectedToToday: onboardFinalUrl.includes("/today"),
      invictusOnboardedFlag: onboardFlag,
    };
    console.log("Onboarding final URL:", onboardFinalUrl);
    console.log("invictus_onboarded flag:", onboardFlag);

    await onboardContext.close();

  } catch (err) {
    console.error("Audit encounter error:", err);
  } finally {
    await browser.close();
  }

  console.log("\n=== FINAL AUDIT REPORT ===");
  console.log(JSON.stringify(auditReport, null, 2));

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "login_onboarding_audit_report.json"),
    JSON.stringify(auditReport, null, 2)
  );
}

runAudit();
