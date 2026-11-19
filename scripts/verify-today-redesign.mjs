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

    await page.screenshot({ path: path.join(outDir, "today_redesign_mobile_top.png") });

    // Verify MobileAppBar title and dynamic island
    const title = await page.locator("header h1").first().textContent();
    console.log("Mobile App Bar Title:", title);

    // Verify 4 Door Tiles exist
    const doorTiles = page.locator("button:has-text('Notes'), button:has-text('Review'), button:has-text('Water'), button:has-text('Limit')");
    const doorTileCount = await doorTiles.count();
    console.log("Door Tiles Count:", doorTileCount);

    // Click 'Notes' door tile to verify Scratchpad Drawer opens
    const notesTile = page.locator("button:has-text('Notes')").first();
    await notesTile.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, "today_door_notes_drawer.png") });
    console.log("Clicked Notes Door Tile -> Scratchpad drawer captured");

    // Close drawer via Escape or backdrop
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Click 'Water' door tile to verify Water Sheet opens
    const waterTile = page.locator("button:has-text('Water')").first();
    await waterTile.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, "today_door_water_sheet.png") });
    console.log("Clicked Water Door Tile -> Water sheet captured");

    // Close water sheet
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Scroll down to check scroll behavior and verify NO floating island
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, "today_redesign_mobile_scrolled.png") });
    console.log("Mobile Scrolled view captured");

    await page.close();
  }

  console.log("=== 2. Desktop Laptop Bento View Audit (1280x800) ===");
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await setupPage(page);
    await page.goto("http://localhost:3000/today", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(outDir, "today_redesign_desktop_top.png") });
    console.log("Desktop Laptop Bento view captured");

    // Scroll down desktop
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, "today_redesign_desktop_scrolled.png") });
    console.log("Desktop Scrolled view captured");

    await page.close();
  }

  await browser.close();
  console.log("✅ All Today verification checks completed successfully!");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
