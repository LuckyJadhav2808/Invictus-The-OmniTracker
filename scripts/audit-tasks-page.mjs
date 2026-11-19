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
      const testTasks = [
        { id: "t1", title: "Complete Physics Problem Set", status: "todo", priority: "p1", dueDate: "2026-11-20", category: "Study" },
        { id: "t2", title: "Design Neobrutalist Tasks Deck", status: "in_progress", priority: "p2", dueDate: "2026-11-20", category: "Dev" },
        { id: "t3", title: "Review PR & Verify E2E Tests", status: "completed", priority: "p3", dueDate: "2026-11-20", category: "Code" },
        { id: "t4", title: "Draft Founder Weekly Memo", status: "todo", priority: "p2", dueDate: "2026-11-21", category: "Work" },
        { id: "t5", title: "Order Whey Protein Refill", status: "todo", priority: "p4", dueDate: "2026-11-22", category: "Health" },
      ];
      localStorage.setItem("invictus_tasks", JSON.stringify(testTasks));
    });
  };

  console.log("=== Mobile Tasks Page Audit (390x844) ===");
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await setupPage(page);
  await page.goto("http://localhost:3000/tasks", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log("Mobile scrollHeight:", scrollHeight, "Screens:", (scrollHeight / 844).toFixed(2));

  const audit = await page.evaluate(() => {
    const cards = document.querySelectorAll(".border-2, .border, .rounded-2xl, .rounded-xl");
    const buttons = document.querySelectorAll("button");
    return { cardCount: cards.length, buttonCount: buttons.length };
  });
  console.log("Audit counts:", audit);

  await page.screenshot({ path: path.join(outDir, "tasks_current_mobile_top.png") });

  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, "tasks_current_mobile_scrolled.png") });

  console.log("=== Desktop Tasks Page Audit (1280x800) ===");
  const deskContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const deskPage = await deskContext.newPage();
  await setupPage(deskPage);
  await deskPage.goto("http://localhost:3000/tasks", { waitUntil: "networkidle" });
  await deskPage.waitForTimeout(1000);

  await deskPage.screenshot({ path: path.join(outDir, "tasks_current_desktop.png") });

  await browser.close();
  console.log("Audit finished successfully!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
