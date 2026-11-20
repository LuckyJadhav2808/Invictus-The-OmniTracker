import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/deel/.gemini/antigravity/brain/e4adc17f-e4c0-4e4d-96f3-1259bc4e3c9c/screenshots/audit/hero_redesign";
const LOCAL_DIR = "screenshots/audit/hero_redesign";

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(LOCAL_DIR, { recursive: true });

const SEED_HABITS_60 = [
  { id: "h-1", title: "Drink 500ml Water Upon Waking", icon: "Droplet", color: "sky", reminderTime: "07:30 AM", frequency: { type: "daily" } },
  { id: "h-2", title: "Read 15 Pages of Philosophy", icon: "BookOpen", color: "amber", reminderTime: "08:30 AM", frequency: { type: "daily" } },
  { id: "h-3", title: "Heavy Compound Gym Training", icon: "Dumbbell", color: "rose", reminderTime: "05:00 PM", frequency: { type: "daily" } },
  { id: "h-4", title: "10,000 Paces Daily Walk", icon: "Footprints", color: "emerald", reminderTime: "06:30 PM", frequency: { type: "daily" } },
  { id: "h-5", title: "Strict Macro & Calorie Cap", icon: "Apple", color: "lime", reminderTime: "01:00 PM", frequency: { type: "daily" } },
];

async function captureAudit() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const viewports = [
    { name: "375px", width: 375, height: 812 },
    { name: "430px", width: 430, height: 932 },
  ];

  const results = [];

  for (const progress of [0, 60]) {
    for (const vp of viewports) {
      for (const theme of ["light", "dark"]) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: theme,
        });

        const page = await context.newPage();

        await page.addInitScript(({ progressVal, habits, themeMode }) => {
          localStorage.setItem("invictus_guest_mode", "true");
          localStorage.setItem("invictus_habits", JSON.stringify(habits));

          const now = new Date();
          const y = now.getFullYear();
          const m = String(now.getMonth() + 1).padStart(2, "0");
          const d = String(now.getDate()).padStart(2, "0");
          const todayKey = `${y}-${m}-${d}`;

          // If 60%, mark 3 out of 5 habits as completed for today (60% daily completion)
          const logs = progressVal === 60
            ? [
                { id: "log-1", habitId: "h-1", date: todayKey, completed: true },
                { id: "log-2", habitId: "h-2", date: todayKey, completed: true },
                { id: "log-3", habitId: "h-3", date: todayKey, completed: true },
              ]
            : [];
          localStorage.setItem("invictus_habit_logs", JSON.stringify(logs));

          // Set active streak telemetry
          const streaks = {
            "h-1": { currentStreak: 5, longestStreak: 12 },
            "h-2": { currentStreak: 4, longestStreak: 8 },
            "h-3": { currentStreak: 3, longestStreak: 6 },
          };
          localStorage.setItem("invictus_streaks", JSON.stringify(streaks));

          if (themeMode === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }, { progressVal: progress, habits: SEED_HABITS_60, themeMode: theme });

        await page.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
        await page.waitForTimeout(600);

        // Measure Hero dimensions and card count
        const heroRegion = page.locator('section[aria-label="gauge hero summary"]');
        const heroBox = await heroRegion.boundingBox();
        const borderedCards = await page.locator('.border-2, .border-\\[2px\\], .border-\\[2\\.5px\\]').count();

        const filenameAbove = `hero_${vp.name}_${theme}_prog${progress}_above.png`;
        const filenameFull = `hero_${vp.name}_${theme}_prog${progress}_full.png`;

        const localPathAbove = path.join(LOCAL_DIR, filenameAbove);
        const artifactPathAbove = path.join(ARTIFACT_DIR, filenameAbove);

        const localPathFull = path.join(LOCAL_DIR, filenameFull);
        const artifactPathFull = path.join(ARTIFACT_DIR, filenameFull);

        await page.screenshot({ path: localPathAbove, fullPage: false });
        await page.screenshot({ path: localPathFull, fullPage: true });

        fs.copyFileSync(localPathAbove, artifactPathAbove);
        fs.copyFileSync(localPathFull, artifactPathFull);

        results.push({
          progress: `${progress}%`,
          viewport: vp.name,
          theme,
          heroHeight: heroBox ? Math.round(heroBox.height) : 0,
          heroWidth: heroBox ? Math.round(heroBox.width) : 0,
          borderedCards,
          aboveScreenshot: filenameAbove,
          fullScreenshot: filenameFull,
        });

        await context.close();
      }
    }
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

captureAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
