import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/deel/.gemini/antigravity/brain/e4adc17f-e4c0-4e4d-96f3-1259bc4e3c9c/screenshots/audit/floating_island";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}
if (!fs.existsSync("screenshots/audit/floating_island")) {
  fs.mkdirSync("screenshots/audit/floating_island", { recursive: true });
}

async function runFloatingIslandVerification() {
  console.log("=== STARTING FLOATING DYNAMIC ISLAND VERIFICATION ===");
  const browser = await chromium.launch({ channel: "msedge", headless: true });

  const testCases = [
    { theme: "light", width: 390, height: 844 },
    { theme: "dark", width: 390, height: 844 },
  ];

  for (const tc of testCases) {
    console.log(`\n--- Testing ${tc.theme.toUpperCase()} MODE (${tc.width}x${tc.height}) ---`);
    const context = await browser.newContext({
      viewport: { width: tc.width, height: tc.height },
      colorScheme: tc.theme,
    });
    const page = await context.newPage();

    // Seed realistic habits data so page is easily scrollable
    await page.addInitScript(({ theme }) => {
      localStorage.setItem("invictus_guest_mode", "true");
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

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
    }, { theme: tc.theme });

    await page.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // 1. UNSCROLLED STATE (Top of page, docked inside header)
    const islandRegion = page.locator('[role="region"][aria-label="Live Activity Dynamic Island"]:visible');
    await islandRegion.waitFor({ state: "visible", timeout: 5000 });

    const unscrolledPill = islandRegion.locator('[role="button"]').first();
    const unscrolledPillClass = await unscrolledPill.getAttribute("class");
    console.log("Unscrolled pill position classes:", unscrolledPillClass?.includes("relative") ? "PASS: relative (docked)" : "FAIL");

    const unscrolledPath = `screenshots/audit/floating_island/01_unscrolled_${tc.theme}.png`;
    await page.screenshot({ path: unscrolledPath });
    fs.copyFileSync(unscrolledPath, path.join(ARTIFACT_DIR, `01_unscrolled_${tc.theme}.png`));

    // 2. SCROLLED STATE (User scrolls down 250px -> Floating Dynamic Island)
    console.log("Scrolling down by 250px on window & main-scroll-container...");
    await page.evaluate(() => {
      window.scrollTo(0, 250);
      const container = document.getElementById("main-scroll-container");
      if (container && container.scrollHeight > container.clientHeight) {
        container.scrollTop = 250;
      }
    });
    // Wait for scroll event and state update
    await page.waitForTimeout(400);

    const scrollDebug = await page.evaluate(() => ({
      scrollY: window.scrollY,
      scrollTop: document.documentElement.scrollTop,
      containerScroll: document.getElementById("main-scroll-container")?.scrollTop,
    }));
    console.log("Current scroll position after scroll:", scrollDebug);

    // Check if pill now has floating fixed position
    const floatingPillClass = await unscrolledPill.getAttribute("class");
    const hasFixed = floatingPillClass?.includes("fixed");
    const hasElevatedShadow = floatingPillClass?.includes("shadow-[0_8px_24px");
    const hasNeobrutalistBorder = floatingPillClass?.includes("border-2");
    console.log("Scrolled pill floating classes:", {
      hasFixed: hasFixed ? "PASS (fixed)" : "FAIL",
      hasElevatedShadow: hasElevatedShadow ? "PASS (floating shadow)" : "FAIL",
      hasNeobrutalistBorder: hasNeobrutalistBorder ? "PASS (border-2)" : "FAIL",
    });

    const scrolledPath = `screenshots/audit/floating_island/02_scrolled_floating_${tc.theme}.png`;
    await page.screenshot({ path: scrolledPath });
    fs.copyFileSync(scrolledPath, path.join(ARTIFACT_DIR, `02_scrolled_floating_${tc.theme}.png`));

    // 3. EXPANDED HUD WHILE FLOATING
    console.log("Clicking floating island pill to open expanded HUD...");
    await page.evaluate(() => {
      const pill = document.querySelector('[data-slot="dynamic-island-pill"]');
      if (pill) {
        pill.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      }
    });
    await page.waitForTimeout(400);

    const scrollAfterClick = await page.evaluate(() => ({
      scrollY: window.scrollY,
      scrollTop: document.documentElement.scrollTop,
      containerScroll: document.getElementById("main-scroll-container")?.scrollTop,
    }));
    console.log("Scroll position after clicking pill:", scrollAfterClick);

    const hudModal = page.locator('[data-slot="dynamic-island-hud"]:visible').first();
    const hudVisible = await hudModal.isVisible();
    const hudClass = hudVisible ? await hudModal.getAttribute("class") : null;
    console.log("HUD actual class string:", hudClass);
    console.log("Expanded HUD status:", {
      hudVisible: hudVisible ? "PASS: visible" : "FAIL",
      hudFixed: hudClass?.includes("fixed") ? "PASS: fixed top-14" : "FAIL",
      hasShadow: hudClass?.includes("shadow-[4px_4px_0px_0px_#161514]") ? "PASS: hard shadow" : "FAIL",
    });

    const hudPath = `screenshots/audit/floating_island/03_floating_hud_${tc.theme}.png`;
    await page.screenshot({ path: hudPath });
    fs.copyFileSync(hudPath, path.join(ARTIFACT_DIR, `03_floating_hud_${tc.theme}.png`));

    // Close HUD by pressing Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // 4. SCROLL BACK TO TOP (Docking back into header)
    console.log("Scrolling back to top (scrollTop = 0)...");
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      const container = document.getElementById("main-scroll-container");
      if (container) {
        container.scrollTop = 0;
      }
    });
    await page.waitForTimeout(400);

    const redockedPillClass = await unscrolledPill.getAttribute("class");
    console.log("Redocked pill position:", redockedPillClass?.includes("relative") ? "PASS: returned to relative" : "FAIL");

    await context.close();
  }

  // 5. TEST ACTIVE LIVE ACTIVITY (Gym Rest Timer Floating)
  console.log("\n--- Testing ACTIVE GYM REST LIVE ACTIVITY WHILE SCROLLED ---");
  const liveContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "dark",
  });
  const livePage = await liveContext.newPage();

  await livePage.addInitScript(() => {
    localStorage.setItem("invictus_guest_mode", "true");
    document.documentElement.classList.add("dark");
  });

  await livePage.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
  await livePage.waitForTimeout(800);

  // Activate Gym Rest timer in liveActivityStore
  await livePage.evaluate(() => {
    // Dispatch or directly access store via localStorage or synthetic start
    const storeState = JSON.parse(localStorage.getItem("invictus-live-activity-store") || "{}");
    storeState.state = storeState.state || {};
    storeState.state.activeActivity = "gym_rest";
    storeState.state.gymRest = {
      secondsLeft: 45,
      totalSeconds: 60,
      isPaused: false,
      exerciseName: "Barbell Incline Bench Press",
      targetEndTime: Date.now() + 45000,
    };
    localStorage.setItem("invictus-live-activity-store", JSON.stringify(storeState));
  });

  await livePage.reload({ waitUntil: "networkidle" });
  await livePage.waitForTimeout(800);

  // Scroll down by 250px
  await livePage.evaluate(() => {
    window.scrollTo(0, 250);
  });
  await livePage.waitForTimeout(400);

  const gymFloatingPath = `screenshots/audit/floating_island/04_floating_gym_rest_dark.png`;
  await livePage.screenshot({ path: gymFloatingPath });
  fs.copyFileSync(gymFloatingPath, path.join(ARTIFACT_DIR, `04_floating_gym_rest_dark.png`));
  console.log("Captured active gym rest floating screenshot!");

  await liveContext.close();
  await browser.close();
  console.log("\n=== FLOATING ISLAND VERIFICATION COMPLETED SUCCESSFULLY! ===");
}

runFloatingIslandVerification().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
