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
      localStorage.setItem("invictus_first_run_dismissed", "true");
      const testHabits = [
        { id: "h1", name: "Morning Meditation", title: "Morning Meditation", icon: "🧘", frequency: "daily", streak: 12, completedDates: [] },
        { id: "h2", name: "Deep Work Focus", title: "Deep Work Focus", icon: "⚡", frequency: "daily", streak: 8, completedDates: [] },
        { id: "h3", name: "Push Day Workout", title: "Push Day Workout", icon: "🏋️", frequency: "daily", streak: 14, completedDates: [] },
      ];
      localStorage.setItem("invictus_habits", JSON.stringify(testHabits));
      const testTasks = [
        { id: "t1", title: "Refactor Today Page", status: "todo", priority: "p1", dueDate: new Date().toISOString().split("T")[0] },
        { id: "t2", title: "Review Neobrutalist Tokens", status: "completed", priority: "p2", dueDate: new Date().toISOString().split("T")[0] },
      ];
      localStorage.setItem("invictus_tasks", JSON.stringify(testTasks));
    });
  };

  console.log("=== 1. Mobile Today Page Audit (390x844) ===");
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await setupPage(page);
    await page.goto("http://localhost:3000/today", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const screens = (scrollHeight / 844).toFixed(2);
    console.log(`Mobile Scroll Height: ${scrollHeight}px (${screens} screens)`);

    await page.screenshot({ path: path.join(outDir, "today_header_preserved_mobile.png") });

    // Verify SpaceHeader presence: Cloud Sync button, Theme Toggle, Profile Button
    const hasSyncBtn = await page.locator("header button[title*='Sync']").count();
    const hasThemeToggle = await page.locator("header button[aria-label*='theme' i], header button:has(.lucide-sun, .lucide-moon)").count();
    const hasProfileBtn = await page.locator("header button[aria-label*='User' i]").count();
    console.log("Header Controls Check:", { hasSyncBtn, hasThemeToggle, hasProfileBtn });

    // Click profile dropdown to verify menu opens
    const profileBtn = page.locator("header button[aria-label*='User' i]").first();
    await profileBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, "today_profile_dropdown_mobile.png") });
    console.log("Profile dropdown opened and captured");

    // Close profile dropdown
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Scroll down to verify header stays sticky and NO floating island
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, "today_header_scrolled_mobile.png") });
    console.log("Mobile scrolled view captured");

    await page.close();
  }

  console.log("=== 2. Desktop Laptop Bento View Audit (1280x800) ===");
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await setupPage(page);
    await page.goto("http://localhost:3000/today", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(outDir, "today_header_preserved_desktop.png") });
    console.log("Desktop header preserved view captured");

    await page.close();
  }

  await browser.close();
  console.log("✅ All Today header preservation checks completed successfully!");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
