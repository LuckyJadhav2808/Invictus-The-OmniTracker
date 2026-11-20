import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/deel/.gemini/antigravity/brain/e4adc17f-e4c0-4e4d-96f3-1259bc4e3c9c/screenshots/audit/habits_redesign";
const LOCAL_DIR = "screenshots/audit/habits_redesign";

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(LOCAL_DIR, { recursive: true });

const SEED_HABITS = [
  { id: "h-1", title: "Drink 500ml Water Upon Waking", icon: "Droplet", color: "sky", reminderTime: "07:30 AM", frequency: { type: "daily" } },
  { id: "h-2", title: "Read 15 Pages of Philosophy", icon: "BookOpen", color: "amber", reminderTime: "08:30 AM", frequency: { type: "daily" } },
  { id: "h-3", title: "Heavy Compound Gym Training", icon: "Dumbbell", color: "rose", reminderTime: "05:00 PM", frequency: { type: "daily" } },
  { id: "h-4", title: "10,000 Paces Daily Walk", icon: "Footprints", color: "emerald", reminderTime: "06:30 PM", frequency: { type: "daily" } },
  { id: "h-5", title: "Strict Macro & Calorie Cap", icon: "Apple", color: "lime", reminderTime: "01:00 PM", frequency: { type: "daily" } },
  { id: "h-6", title: "45-Minute Deep Focus Session", icon: "Timer", color: "indigo", reminderTime: "09:30 AM", frequency: { type: "daily" } },
  { id: "h-7", title: "Cold Shower & Wim Hof Breathing", icon: "Wind", color: "cyan", reminderTime: "08:00 AM", frequency: { type: "daily" } },
  { id: "h-8", title: "Evening Posture & Mobility Work", icon: "Activity", color: "purple", reminderTime: "09:30 PM", frequency: { type: "daily" } },
  { id: "h-9", title: "Screen Curfew & Sleep By 11:30 PM", icon: "Moon", color: "violet", reminderTime: "11:00 PM", frequency: { type: "daily" } },
  { id: "h-10", title: "Daily Stoic Journal & Reflection", icon: "Sparkles", color: "amber", reminderTime: "10:30 PM", frequency: { type: "daily" } },
];

async function run() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const viewports = [
    { name: "375px", width: 375, height: 812 },
    { name: "430px", width: 430, height: 932 },
    { name: "390px", width: 390, height: 844 },
  ];

  const results = [];

  for (const vp of viewports) {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
      });

      const page = await context.newPage();

      // Seed 10 habits and session state
      await page.addInitScript(({ themeMode, habits }) => {
        localStorage.setItem("invictus_guest_mode", "true");
        localStorage.setItem("invictus_habits", JSON.stringify(habits));

        // Format today
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        const todayStr = `${y}-${m}-${d}`;

        // Seed 4 completed habits today
        const sampleLogs = [
          { id: "log-1", habitId: "h-1", date: todayStr, completed: true },
          { id: "log-2", habitId: "h-2", date: todayStr, completed: true },
          { id: "log-3", habitId: "h-3", date: todayStr, completed: true },
          { id: "log-4", habitId: "h-5", date: todayStr, completed: true },
        ];
        localStorage.setItem("invictus_habit_logs", JSON.stringify(sampleLogs));
        localStorage.setItem("invictus_water_log_" + todayStr, JSON.stringify({ amount: 1250, date: todayStr }));

        // Default layout to compact
        localStorage.setItem("invictus-ui-store", JSON.stringify({
          state: { habitLayoutStyle: "compact", selectedDate: todayStr }
        }));

        if (themeMode === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }, { themeMode: theme, habits: SEED_HABITS });

      await page.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
      await page.waitForTimeout(1800);

      // Measure metrics
      const metrics = await page.evaluate(() => {
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;
        const screens = (scrollHeight / clientHeight).toFixed(2);

        // Count visible bordered cards on screen
        const borderedCards = document.querySelectorAll(
          '.rounded-2xl.border-2, .rounded-3xl.border-2, [class*="shadow-[2."], [class*="shadow-[3."]'
        );

        return {
          scrollHeight,
          clientHeight,
          screens: parseFloat(screens),
          borderedCardCount: borderedCards.length,
        };
      });

      const fileNamePrefix = `habits_${vp.name}_${theme}`;
      const aboveFoldPath = path.join(LOCAL_DIR, `${fileNamePrefix}_above_fold.png`);
      const fullPath = path.join(LOCAL_DIR, `${fileNamePrefix}_full.png`);

      await page.screenshot({ path: aboveFoldPath, fullPage: false });
      await page.screenshot({ path: fullPath, fullPage: true });

      // Copy to artifact directory
      fs.copyFileSync(aboveFoldPath, path.join(ARTIFACT_DIR, `${fileNamePrefix}_above_fold.png`));
      fs.copyFileSync(fullPath, path.join(ARTIFACT_DIR, `${fileNamePrefix}_full.png`));

      results.push({
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        theme,
        metrics,
        aboveFold: `${fileNamePrefix}_above_fold.png`,
        full: `${fileNamePrefix}_full.png`,
      });

      await context.close();
    }
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
