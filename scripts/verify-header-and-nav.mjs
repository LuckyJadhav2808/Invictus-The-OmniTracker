import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const outDir = "C:/Users/deel/.gemini/antigravity/brain/e4adc17f-e4c0-4e4d-96f3-1259bc4e3c9c/screenshots/audit";
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });

  const setupPage = async (page) => {
    await page.addInitScript(() => {
      localStorage.setItem("invictus_guest_mode", "true");
      // Seed 10 realistic habits
      const testHabits = [
        { id: "h1", name: "Morning Meditation", icon: "🧘", frequency: "daily", streak: 12, completedDates: [] },
        { id: "h2", name: "Deep Work Focus", icon: "⚡", frequency: "daily", streak: 8, completedDates: [] },
        { id: "h3", name: "Push Day Workout", icon: "🏋️", frequency: "daily", streak: 14, completedDates: [] },
        { id: "h4", name: "Cold Shower Protocol", icon: "🚿", frequency: "daily", streak: 5, completedDates: [] },
        { id: "h5", name: "Hydration (3L Water)", icon: "💧", frequency: "daily", streak: 21, completedDates: [] },
        { id: "h6", name: "Read 20 Pages Non-Fiction", icon: "📚", frequency: "daily", streak: 7, completedDates: [] },
        { id: "h7", name: "Electrolyte Recovery", icon: "⚡", frequency: "daily", streak: 4, completedDates: [] },
        { id: "h8", name: "Evening Journal & Stoic Review", icon: "🖋️", frequency: "daily", streak: 19, completedDates: [] },
        { id: "h9", name: "Sleep by 11:00 PM", icon: "🌙", frequency: "daily", streak: 3, completedDates: [] },
        { id: "h10", name: "Posture & Mobility Drill", icon: "🧘", frequency: "daily", streak: 9, completedDates: [] },
      ];
      localStorage.setItem("invictus_habits", JSON.stringify(testHabits));
    });
  };

  // Test Mobile /goals
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await setupPage(page);
    await page.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const initialMetrics = await page.evaluate(() => {
      const appBar = document.querySelector("header.lg\\:hidden");
      const subNav = document.querySelector("nav[aria-label='Sub Navigation']");
      return {
        appBarPosition: appBar ? window.getComputedStyle(appBar).position : null,
        appBarTop: appBar ? appBar.getBoundingClientRect().top : null,
        subNavPosition: subNav ? window.getComputedStyle(subNav).position : null,
        subNavTop: subNav ? subNav.getBoundingClientRect().top : null,
      };
    });
    console.log("Mobile /goals Initial:", initialMetrics);

    // Scroll 300px
    await page.evaluate(() => {
      window.scrollTo(0, 300);
      document.documentElement.scrollTop = 300;
    });
    await page.waitForTimeout(500);

    const scrolledMetrics = await page.evaluate(() => {
      const appBar = document.querySelector("header.lg\\:hidden");
      const subNav = document.querySelector("nav[aria-label='Sub Navigation']");
      return {
        appBarPosition: appBar ? window.getComputedStyle(appBar).position : null,
        appBarTop: appBar ? appBar.getBoundingClientRect().top : null,
        subNavPosition: subNav ? window.getComputedStyle(subNav).position : null,
        subNavTop: subNav ? subNav.getBoundingClientRect().top : null,
      };
    });
    console.log("Mobile /goals Scrolled:", scrolledMetrics);

    await page.screenshot({ path: path.join(outDir, "mobile_goals_nonsticky_subnav.png") });
    await page.close();
  }

  // Test Mobile /money
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await setupPage(page);
    await page.goto("http://localhost:3000/money", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Scroll 300px
    await page.evaluate(() => {
      window.scrollTo(0, 300);
      document.documentElement.scrollTop = 300;
    });
    await page.waitForTimeout(500);

    const scrolledMetrics = await page.evaluate(() => {
      const appBar = document.querySelector("header.lg\\:hidden");
      const subNav = document.querySelector("nav[aria-label='Sub Navigation']");
      return {
        appBarPosition: appBar ? window.getComputedStyle(appBar).position : null,
        appBarTop: appBar ? appBar.getBoundingClientRect().top : null,
        subNavPosition: subNav ? window.getComputedStyle(subNav).position : null,
        subNavTop: subNav ? subNav.getBoundingClientRect().top : null,
      };
    });
    console.log("Mobile /money Scrolled:", scrolledMetrics);

    await page.screenshot({ path: path.join(outDir, "mobile_money_nonsticky_subnav.png") });
    await page.close();
  }

  await browser.close();
  console.log("Non-sticky subnav verification finished!");
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
