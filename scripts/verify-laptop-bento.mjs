import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.resolve(process.cwd(), "screenshots/audit/laptop_bento");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.setItem("invictus_guest_mode", "true");
    localStorage.setItem("invictus_guest_name", "Alex Vance");
    localStorage.setItem("sq_dev_guest", "true");

    // Seed 4 realistic habits to see 2-column bento
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
        title: "Read 20 Pages of Deep Work / Philosophy",
        icon: "BookOpen",
        color: "purple",
        frequency: { type: "daily", targetPerDay: 1 },
        reminderTime: "08:30 PM",
        archived: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: "h_gym",
        title: "Complete Hypertrophy Push Routine",
        icon: "Dumbbell",
        color: "emerald",
        frequency: { type: "daily", targetPerDay: 1 },
        reminderTime: "05:00 PM",
        archived: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: "h_meditate",
        title: "10-Minute Vipassana Mindfulness Breath",
        icon: "Brain",
        color: "amber",
        frequency: { type: "daily", targetPerDay: 1 },
        reminderTime: "06:30 AM",
        archived: false,
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem("invictus_habits_cache", JSON.stringify(sampleHabits));
  });

  // 1. Goals / Habits with seeded habits in 2-column bento
  await page.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "laptop_habits_bento.png") });

  // 2. Gym Sub-Page
  await page.goto("http://localhost:3000/goals/gym", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "laptop_gym_bento.png") });

  // 3. Money Overview Bento
  await page.goto("http://localhost:3000/money", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "laptop_money_bento.png") });

  // 4. Money Budgets Sub-Page (3-column envelopes)
  await page.goto("http://localhost:3000/money?tab=budgets", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "laptop_money_budgets.png") });

  await browser.close();
  console.log("Laptop bento screenshots captured!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
