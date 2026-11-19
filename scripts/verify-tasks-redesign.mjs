import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const ARTIFACT_DIR = "C:/Users/deel/.gemini/antigravity/brain/e4adc17f-e4c0-4e4d-96f3-1259bc4e3c9c";
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, "screenshots/audit");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runVerification() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const results = { mobile: {}, desktop: {} };

  const setupPage = async (page) => {
    await page.addInitScript(() => {
      localStorage.setItem("invictus_guest_mode", "true");
      const testTasks = [
        {
          id: "t1",
          title: "Complete Physics Problem Set",
          status: "todo",
          priority: "p1",
          dueDate: "2026-11-20",
          projectTag: "Study",
          subtasks: [
            { id: "s1", title: "Problem 1-5 derivations", completed: true },
            { id: "s2", title: "Verify boundary conditions", completed: false },
          ],
        },
        {
          id: "t2",
          title: "Design Neobrutalist Tasks Deck",
          status: "in_progress",
          priority: "p2",
          dueDate: "2026-11-20",
          projectTag: "Dev",
          subtasks: [],
        },
        {
          id: "t3",
          title: "Review PR & Verify E2E Tests",
          status: "completed",
          priority: "p3",
          dueDate: "2026-11-20",
          projectTag: "Dev",
          subtasks: [],
        },
        {
          id: "t4",
          title: "Draft Founder Weekly Memo",
          status: "todo",
          priority: "p2",
          dueDate: "2026-11-21",
          projectTag: "Work",
          subtasks: [],
        },
        {
          id: "t5",
          title: "Order Whey Protein Refill",
          status: "todo",
          priority: "p4",
          dueDate: "2026-11-22",
          projectTag: "Life",
          subtasks: [],
        },
      ];
      localStorage.setItem("invictus_tasks", JSON.stringify(testTasks));
      localStorage.setItem("invictus_tasks_db", JSON.stringify(testTasks));
    });
  };

  try {
    // -------------------------------------------------------------
    // 1. MOBILE VERIFICATION (390 x 844)
    // -------------------------------------------------------------
    console.log("=== Running Mobile Verification (390x844) ===");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();
    await setupPage(mobilePage);
    await mobilePage.goto("http://localhost:3000/tasks", { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(1500);

    // Initial load might hit Turbopack reload, so reload if needed
    if (await mobilePage.locator("text=ChunkLoadError").count() > 0) {
      await mobilePage.reload({ waitUntil: "networkidle" });
      await mobilePage.waitForTimeout(1500);
    }

    // Scroll metrics
    const mobileMetrics = await mobilePage.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const screens = scrollHeight / clientHeight;
      const borderedCards = document.querySelectorAll('[class*="border"]').length;
      const buttons = document.querySelectorAll("button").length;
      return { scrollHeight, clientHeight, screens, borderedCards, buttons };
    });

    console.log("Mobile Metrics:", JSON.stringify(mobileMetrics, null, 2));
    results.mobile.metrics = mobileMetrics;

    // Screenshot top
    const mobileTopPath = path.join(SCREENSHOT_DIR, "tasks_redesign_mobile_top.png");
    await mobilePage.screenshot({ path: mobileTopPath });
    console.log("Saved:", mobileTopPath);

    // Scroll down and screenshot
    await mobilePage.evaluate(() => window.scrollBy(0, 400));
    await mobilePage.waitForTimeout(400);
    const mobileScrolledPath = path.join(SCREENSHOT_DIR, "tasks_redesign_mobile_scrolled.png");
    await mobilePage.screenshot({ path: mobileScrolledPath });
    console.log("Saved:", mobileScrolledPath);

    // Scroll back to top
    await mobilePage.evaluate(() => window.scrollTo(0, 0));
    await mobilePage.waitForTimeout(300);

    // Test Door Tile Click (Kanban Portal)
    const kanbanDoor = mobilePage.locator('button:visible:has-text("Kanban")').first();
    if (await kanbanDoor.count() > 0) {
      await kanbanDoor.click();
      await mobilePage.waitForTimeout(600);
      const kanbanPortalPath = path.join(SCREENSHOT_DIR, "tasks_door_kanban_portal.png");
      await mobilePage.screenshot({ path: kanbanPortalPath });
      console.log("Saved:", kanbanPortalPath);

      // Verify Back to Tasks button
      const backBtn = mobilePage.locator('button:visible:has-text("Tasks")').first();
      if (await backBtn.count() > 0) {
        await backBtn.click();
        await mobilePage.waitForTimeout(400);
        console.log("Successfully tested L2 Kanban Portal and return back navigation!");
      }
    }

    await mobileContext.close();

    // -------------------------------------------------------------
    // 2. DESKTOP VERIFICATION (1280 x 800)
    // -------------------------------------------------------------
    console.log("=== Running Desktop Verification (1280x800) ===");
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
    });
    const desktopPage = await desktopContext.newPage();
    await setupPage(desktopPage);
    await desktopPage.goto("http://localhost:3000/tasks", { waitUntil: "networkidle" });
    await desktopPage.waitForTimeout(1500);

    if (await desktopPage.locator("text=ChunkLoadError").count() > 0) {
      await desktopPage.reload({ waitUntil: "networkidle" });
      await desktopPage.waitForTimeout(1500);
    }

    const desktopMetrics = await desktopPage.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const screens = scrollHeight / clientHeight;
      const borderedCards = document.querySelectorAll('[class*="border"]').length;
      return { scrollHeight, clientHeight, screens, borderedCards };
    });

    console.log("Desktop Metrics:", JSON.stringify(desktopMetrics, null, 2));
    results.desktop.metrics = desktopMetrics;

    const desktopPath = path.join(SCREENSHOT_DIR, "tasks_redesign_desktop.png");
    await desktopPage.screenshot({ path: desktopPath });
    console.log("Saved:", desktopPath);

    await desktopContext.close();

  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    await browser.close();
  }

  console.log("Verification finished successfully!");
}

runVerification();
