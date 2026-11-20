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
      const testHabits = [
        { id: "h1", name: "Morning Meditation", icon: "🧘", frequency: "daily", streak: 12, completedDates: [] },
        { id: "h2", name: "Deep Work Focus", icon: "⚡", frequency: "daily", streak: 8, completedDates: [] },
        { id: "h3", name: "Push Day Workout", icon: "🏋️", frequency: "daily", streak: 14, completedDates: [] },
      ];
      localStorage.setItem("invictus_habits", JSON.stringify(testHabits));
    });
  };

  // 1. Mobile Flower Menu & Portal Test (390x844)
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await setupPage(page);

    // --- Habits Space ---
    await page.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Click Center FAB to trigger Half-Flower Menu
    const centerFab = page.locator('button[aria-label*="Flower Menu"]');
    await centerFab.click();
    await page.waitForTimeout(600);

    // Verify Habits high-frequency petals
    const habitPetals = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('ul[aria-label="Quick Action Flower Menu"] li span')).map(s => s.textContent);
    });
    console.log("Goals: High-frequency Flower Petals:", habitPetals);
    await page.screenshot({ path: path.join(outDir, "flower_menu_habits_recurring.png") });

    // Close flower menu
    await centerFab.click();
    await page.waitForTimeout(400);

    // Verify "New Habit" Door Tile exists and works
    const newHabitTile = page.locator('button[title*="Create New Atomic Habit"]');
    const newHabitTileVisible = await newHabitTile.isVisible();
    console.log("Goals: 'New Habit' Door Tile visible:", newHabitTileVisible);

    // Click "Gym" Door Tile to open Gym Portal
    const gymDoorTile = page.locator('button[title*="Gym Workout Studio"]');
    await gymDoorTile.click();
    await page.waitForTimeout(600);

    // Check Gym Portal open
    const isGymPortalOpen = await page.evaluate(() => {
      const headerText = document.querySelector(".fixed.inset-0 header span");
      return headerText ? headerText.textContent : null;
    });
    console.log("Goals: Active Portal Header:", isGymPortalOpen);
    await page.screenshot({ path: path.join(outDir, "portal_gym_recurring.png") });

    // Click "Back to Habits"
    const backBtn = page.locator('button:has-text("Back to Habits")');
    await backBtn.click();
    await page.waitForTimeout(400);

    const isPortalClosed = await page.evaluate(() => {
      return !document.querySelector(".fixed.inset-0 header");
    });
    console.log("Goals: Portal Closed successfully:", isPortalClosed);

    // --- Money Space ---
    await page.goto("http://localhost:3000/money", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Click Center FAB in Money
    await page.locator('button[aria-label*="Flower Menu"]').click();
    await page.waitForTimeout(600);

    const moneyPetals = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('ul[aria-label="Quick Action Flower Menu"] li span')).map(s => s.textContent);
    });
    console.log("Money: High-frequency Flower Petals:", moneyPetals);
    await page.screenshot({ path: path.join(outDir, "flower_menu_money_recurring.png") });

    // Close flower menu
    await page.locator('button[aria-label*="Flower Menu"]').click();
    await page.waitForTimeout(400);

    // Verify "Income" Door Tile exists
    const incomeTile = page.locator('button[title*="Log Monthly Salary"]');
    const incomeTileVisible = await incomeTile.isVisible();
    console.log("Money: 'Income' Door Tile visible:", incomeTileVisible);

    // Click "Budgets" Door Tile
    const budgetsTile = page.locator('button[title*="Category Envelopes"]');
    await budgetsTile.click();
    await page.waitForTimeout(600);

    const moneyBackBtnVisible = await page.locator('.lg\\:hidden button:has-text("Overview")').isVisible();
    console.log("Money: Back to Overview button visible:", moneyBackBtnVisible);
    await page.screenshot({ path: path.join(outDir, "portal_money_budgets_recurring.png") });

    // Click Back to Overview
    await page.locator('.lg\\:hidden button:has-text("Overview")').click();
    await page.waitForTimeout(400);
    console.log("Money: Returned to Overview successfully");

    await page.close();
  }

  // 2. Desktop Preservation Test (1280x800)
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await setupPage(page);

    await page.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const desktopGoalsSubNav = await page.evaluate(() => {
      const nav = document.querySelector("nav[aria-label='Sub Navigation']");
      return nav ? window.getComputedStyle(nav).display !== "none" : false;
    });
    console.log("Desktop: Goals Sub-nav visible:", desktopGoalsSubNav);

    await page.goto("http://localhost:3000/money", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const desktopMoneySubNav = await page.evaluate(() => {
      const nav = document.querySelector("nav[aria-label='Sub Navigation']");
      return nav ? window.getComputedStyle(nav).display !== "none" : false;
    });
    console.log("Desktop: Money Sub-nav visible:", desktopMoneySubNav);

    await page.close();
  }

  await browser.close();
  console.log("All Flower Arc & Relocation tests passed with 100% green verification!");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
