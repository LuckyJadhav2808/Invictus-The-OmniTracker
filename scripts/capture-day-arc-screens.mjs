import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = "C:/Users/deel/.gemini/antigravity/brain/f3fa73aa-b13d-4a73-bd01-c83f5a238417/day_arc_screenshots";
const PUBLIC_DIR = "d:/Invictus/public/showcase";

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

async function run() {
  console.log("Launching Edge/Chromium with mobile viewport (390x844 @2x)...");
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  const clearToasts = async () => {
    await page.evaluate(() => {
      document.querySelectorAll("[data-sonner-toast]").forEach((el) => el.remove());
      document.querySelectorAll("[data-sonner-toaster]").forEach((el) => el.remove());
    });
    await page.waitForTimeout(200);
  };

  // 1. Log in via Offline Guest
  console.log("Navigating to /login...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  const guestBtn = page.getByRole("button", { name: /EXPLORE AS OFFLINE GUEST/i });
  if (await guestBtn.isVisible({ timeout: 5000 })) {
    await guestBtn.click();
    try {
      await page.waitForURL("**/today", { timeout: 12000 });
    } catch {
      // Direct navigation to goals works
    }
  }

  // Seed sample habits with staggered times and completed vs pending to test
  await page.evaluate(() => {
    const sampleHabits = [
      {
        id: "h_gym_morning",
        title: "Morning Iron Forge",
        icon: "Dumbbell",
        color: "rose",
        frequency: { type: "daily", targetPerDay: 1 },
        reminderTime: "07:30 AM",
        archived: false,
      },
      {
        id: "h_hydration_morning",
        title: "Hydrate 1000ml",
        icon: "Droplet",
        color: "sky",
        frequency: { type: "daily", targetPerDay: 1 },
        reminderTime: "09:00 AM",
        archived: false,
      },
      {
        id: "h_deep_work_forge",
        title: "Deep Work Sprint (90m)",
        icon: "Code",
        color: "purple",
        frequency: { type: "daily", targetPerDay: 1 },
        reminderTime: "02:00 PM",
        archived: false,
      },
      {
        id: "h_mobility_forge",
        title: "Core & Posture Reset",
        icon: "Target",
        color: "emerald",
        frequency: { type: "daily", targetPerDay: 1 },
        reminderTime: "04:30 PM",
        archived: false,
      },
      {
        id: "h_reading_evening",
        title: "Read 20 Pages Stoicism",
        icon: "BookOpen",
        color: "amber",
        frequency: { type: "daily", targetPerDay: 1 },
        reminderTime: "08:30 PM",
        archived: false,
      },
      {
        id: "h_sleep_evening",
        title: "Digital Sunset & Sleep",
        icon: "Moon",
        color: "purple",
        frequency: { type: "daily", targetPerDay: 1 },
        reminderTime: "10:30 PM",
        archived: false,
      },
    ];

    const todayStr = new Date().toISOString().split("T")[0];
    const sampleLogs = [
      {
        id: `h_gym_morning_${todayStr}`,
        habitId: "h_gym_morning",
        date: todayStr,
        completed: true,
      },
      {
        id: `h_hydration_morning_${todayStr}`,
        habitId: "h_hydration_morning",
        date: todayStr,
        completed: true,
      },
      {
        id: `h_deep_work_forge_${todayStr}`,
        habitId: "h_deep_work_forge",
        date: todayStr,
        completed: true,
      },
    ];

    localStorage.setItem("invictus_habits", JSON.stringify(sampleHabits));
    localStorage.setItem("invictus_habit_logs", JSON.stringify(sampleLogs));
    localStorage.setItem(
      "invictus_streaks",
      JSON.stringify({
        h_gym_morning: { currentStreak: 12, longestStreak: 12 },
        h_hydration_morning: { currentStreak: 14, longestStreak: 14 },
      })
    );
  });

  // Navigate to /goals (Habits)
  console.log("Navigating to /goals...");
  await page.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await clearToasts();

  // Capture 1: Polished Light Mode @ 390px (Full Width Arc)
  console.log("Capturing 01_day_arc_light.png...");
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "01_day_arc_light.png"),
    fullPage: false,
  });

  // Capture 2: Polished Dark Mode @ 390px
  console.log("Capturing 02_day_arc_dark.png...");
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
  });
  await page.waitForTimeout(400);
  await clearToasts();
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "02_day_arc_dark.png"),
    fullPage: false,
  });

  // Capture 3: 360px Compact Width (Light Mode)
  console.log("Checking 360px compact viewport...");
  await page.evaluate(() => {
    document.documentElement.classList.remove("dark");
  });
  await page.setViewportSize({ width: 360, height: 780 });
  await page.waitForTimeout(400);
  await clearToasts();
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "05_day_arc_360px_compact.png"),
    fullPage: false,
  });

  // Capture 4: 412px Wide Android Width (Dark Mode)
  console.log("Checking 412px Android viewport...");
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
  });
  await page.setViewportSize({ width: 412, height: 915 });
  await page.waitForTimeout(400);
  await clearToasts();
  await page.screenshot({
    path: path.join(OUTPUT_DIR, "06_day_arc_412px_dark.png"),
    fullPage: false,
  });

  // Copy polished screen to public showcase kit
  fs.copyFileSync(
    path.join(OUTPUT_DIR, "01_day_arc_light.png"),
    path.join(PUBLIC_DIR, "03_habits_discipline.png")
  );

  console.log("All screenshots captured successfully in:", OUTPUT_DIR);
  await browser.close();
}

run().catch((err) => {
  console.error("Error capturing screens:", err);
  process.exit(1);
});
