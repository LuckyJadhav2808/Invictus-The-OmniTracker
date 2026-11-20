import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = path.resolve(process.cwd(), "screenshots/audit/habits_post_overhaul");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const WIDTHS = [360, 390, 412];
const THEMES = ["dark", "light"];

async function runHabitsVerify() {
  console.log("Running Habits Post-Overhaul Mobile Verification with Seeded Habits...");
  const browser = await chromium.launch({ channel: "msedge", headless: true });

  for (const width of WIDTHS) {
    console.log(`\n--- Viewport: ${width}px x 844px ---`);
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      deviceScaleFactor: 2,
    });

    const page = await context.newPage();

    for (const theme of THEMES) {
      await page.goto(`${BASE_URL}/goals`, { waitUntil: "domcontentloaded", timeout: 15000 });

      // Apply guest session & seeded habits
      await page.evaluate(() => {
        localStorage.setItem("invictus_guest_mode", "true");
        localStorage.setItem("invictus_guest_name", "Alex Vance");
        localStorage.setItem("sq_dev_guest", "true");

        // Seed 4 realistic habits
        const sampleHabits = [
          {
            id: "h_water",
            title: "Drink 500ml Water Upon Waking",
            icon: "Droplets",
            color: "sky",
            frequency: { type: "daily", targetPerDay: 1 },
            reminderTime: "07:00 AM",
            archived: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: "h_read",
            title: "Read 15 Pages of Non-Fiction",
            icon: "BookOpen",
            color: "amber",
            frequency: { type: "daily", targetPerDay: 1 },
            reminderTime: "08:30 AM",
            archived: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: "h_code",
            title: "Deep Work Focus Block (90 mins)",
            icon: "Terminal",
            color: "purple",
            frequency: { type: "daily", targetPerDay: 1 },
            reminderTime: "10:00 AM",
            archived: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: "h_walk",
            title: "10,000 Daily Steps & Movement",
            icon: "Flame",
            color: "emerald",
            frequency: { type: "daily", targetPerDay: 1 },
            reminderTime: "06:00 PM",
            archived: false,
            createdAt: new Date().toISOString(),
          },
        ];

        localStorage.setItem("invictus_habits", JSON.stringify(sampleHabits));

        // Sample streaks
        const streaks = {
          h_water: { habitId: "h_water", currentStreak: 7, longestStreak: 14, lastCompletedDate: "2026-11-18" },
          h_read: { habitId: "h_read", currentStreak: 4, longestStreak: 10, lastCompletedDate: "2026-11-18" },
          h_code: { habitId: "h_code", currentStreak: 12, longestStreak: 12, lastCompletedDate: "2026-11-18" },
          h_walk: { habitId: "h_walk", currentStreak: 3, longestStreak: 8, lastCompletedDate: "2026-11-18" },
        };
        localStorage.setItem("invictus_streaks", JSON.stringify(streaks));
      });

      // Apply theme
      await page.evaluate((t) => {
        localStorage.setItem("theme", t);
        localStorage.setItem("sq-theme", t);
        if (t === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }, theme);

      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      // 1. First Viewport (Above the Fold) Proof
      const foldFilename = `habits_above_fold_${width}px_${theme}.png`;
      await page.screenshot({
        path: path.join(OUTPUT_DIR, foldFilename),
        fullPage: false,
      });
      console.log(`✓ Above fold: ${foldFilename}`);

      // 2. Full Page Proof
      const fullFilename = `habits_full_${width}px_${theme}.png`;
      await page.screenshot({
        path: path.join(OUTPUT_DIR, fullFilename),
        fullPage: true,
      });
      console.log(`✓ Full page: ${fullFilename}`);
    }

    await context.close();
  }

  await browser.close();
  console.log(`\n🎉 Verification complete! Screenshots saved to ${OUTPUT_DIR}`);
}

runHabitsVerify().catch(console.error);
