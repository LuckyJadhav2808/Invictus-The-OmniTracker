import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/deel/.gemini/antigravity/brain/e4adc17f-e4c0-4e4d-96f3-1259bc4e3c9c/screenshots/audit/water_tracker";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}
if (!fs.existsSync("screenshots/audit/water_tracker")) {
  fs.mkdirSync("screenshots/audit/water_tracker", { recursive: true });
}

async function verifyWaterTracker() {
  console.log("=== STARTING WATER TRACKER PRODUCTION VERIFICATION ===");
  const browser = await chromium.launch({ channel: "msedge", headless: true });

  for (const theme of ["light", "dark"]) {
    console.log(`\n--- Testing ${theme.toUpperCase()} MODE ---`);
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: theme,
    });
    const page = await context.newPage();

    await page.addInitScript(({ theme }) => {
      localStorage.setItem("invictus_guest_mode", "true");
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      // Start with 500ml logged
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem(`invictus_water_${today}`, "500");
      localStorage.setItem("invictus_water_goal", "2000");
    }, { theme });

    await page.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    // 1. Click Water tile in DoorTileRow
    console.log("Opening Water Tracker BottomSheet from DoorTileRow...");
    const waterTile = page.locator('button:has-text("Water")').first();
    await waterTile.click();
    await page.waitForTimeout(500);

    // 2. Capture Initial Sheet state (500ml / 2000ml)
    const initialPath = `screenshots/audit/water_tracker/01_water_sheet_${theme}.png`;
    await page.screenshot({ path: initialPath });
    fs.copyFileSync(initialPath, path.join(ARTIFACT_DIR, `01_water_sheet_${theme}.png`));
    console.log(`Captured initial water sheet (${theme})`);

    // 3. Tap "+250ml" Glass Vessel
    console.log("Tapping +250ml Glass Vessel button...");
    const glassBtn = page.locator('button:has-text("Glass")').first();
    await glassBtn.click();
    await page.waitForTimeout(300);

    // 4. Tap "+500ml" Mug Vessel
    console.log("Tapping +500ml Mug Vessel button...");
    const mugBtn = page.locator('button:has-text("Mug / Shaker")').first();
    await mugBtn.click();
    await page.waitForTimeout(300);

    // 5. Tap Undo -250ml button
    console.log("Tapping Undo -250ml button...");
    const undoBtn = page.locator('button:has-text("-250")').first();
    await undoBtn.click();
    await page.waitForTimeout(300);

    const loggedMidPath = `screenshots/audit/water_tracker/02_water_logged_mid_${theme}.png`;
    await page.screenshot({ path: loggedMidPath });
    fs.copyFileSync(loggedMidPath, path.join(ARTIFACT_DIR, `02_water_logged_mid_${theme}.png`));

    // 6. Log multiple bottles (+750ml) to reach goal (1000 + 750 + 750 = 2500ml >= 2000ml)
    console.log("Logging Flask/Bottle (+750ml) to reach daily goal...");
    const bottleBtn = page.locator('button:has-text("Flask / Bottle")').first();
    await bottleBtn.click();
    await page.waitForTimeout(200);
    await bottleBtn.click();
    await page.waitForTimeout(400);

    // Verify Goal Reached badge
    const goalBadge = page.locator('text="Goal Reached"').first();
    const isGoalVisible = await goalBadge.isVisible();
    console.log("Goal Reached badge visibility:", isGoalVisible ? "PASS: Goal Reached visible!" : "FAIL");

    const goalPath = `screenshots/audit/water_tracker/03_water_goal_reached_${theme}.png`;
    await page.screenshot({ path: goalPath });
    fs.copyFileSync(goalPath, path.join(ARTIFACT_DIR, `03_water_goal_reached_${theme}.png`));

    await context.close();
  }

  await browser.close();
  console.log("\n=== ALL WATER TRACKER VERIFICATION SCREENSHOTS CAPTURED! ===");
}

verifyWaterTracker().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
