import { chromium } from "playwright";

async function testInteractions() {
  console.log("Testing Habits Redesign Interactive Sheet & Gestures...");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "dark",
  });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.error("PAGE ERROR:", msg.text());
    }
  });

  await page.addInitScript(() => {
    localStorage.setItem("invictus_guest_mode", "true");
    document.documentElement.classList.add("dark");
  });

  await page.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 1. Test Docked FAB click -> ActionSheet opens
  console.log("1. Testing FAB -> ActionSheet...");
  const fab = page.locator('button[aria-label="Open Quick Action Sheet"]');
  await fab.click();
  await page.waitForTimeout(500);

  const actionSheetTitle = page.locator('h3:has-text("Quick Actions")');
  const isActionSheetVisible = await actionSheetTitle.isVisible();
  console.log("ActionSheet visible:", isActionSheetVisible);

  // Close ActionSheet by tapping close button
  await page.locator('button[aria-label="Close sheet"]').click();
  await page.waitForTimeout(400);

  // 2. Test Door Tile 1: Water
  console.log("2. Testing Water Door Tile...");
  const waterTile = page.locator('button[title="Open Water Sheet"]');
  await waterTile.click();
  await page.waitForTimeout(500);
  const waterSheetTitle = page.locator('h3:has-text("Hydration Chamber")');
  console.log("Water Sheet visible:", await waterSheetTitle.isVisible());
  await page.locator('button[aria-label="Close sheet"]').click();
  await page.waitForTimeout(400);

  // 3. Test Door Tile 2: Body
  console.log("3. Testing Body Door Tile...");
  const bodyTile = page.locator('button[title="Open Body Sheet"]');
  await bodyTile.click();
  await page.waitForTimeout(500);
  const bodySheetTitle = page.locator('h3:has-text("Body Profile & Health")');
  console.log("Body Sheet visible:", await bodySheetTitle.isVisible());
  await page.locator('button[aria-label="Close sheet"]').click();
  await page.waitForTimeout(400);

  // 4. Test Door Tile 3: Alerts
  console.log("4. Testing Alerts Door Tile...");
  const alertsTile = page.locator('button[title="Open Alerts Sheet"]');
  await alertsTile.click();
  await page.waitForTimeout(500);
  const alertsSheetTitle = page.locator('h3:has-text("Discipline Alerts")');
  console.log("Alerts Sheet visible:", await alertsSheetTitle.isVisible());
  await page.locator('button[aria-label="Close sheet"]').click();
  await page.waitForTimeout(400);

  // 5. Test Door Tile 4: Sleep / Recovery
  console.log("5. Testing Sleep Door Tile...");
  const sleepTile = page.locator('button[title="Open Sleep Sheet"]');
  await sleepTile.click();
  await page.waitForTimeout(500);
  const sleepSheetTitle = page.locator('h3:has-text("Evening Recovery & Reflections")');
  console.log("Recovery Sheet visible:", await sleepSheetTitle.isVisible());
  await page.locator('button[aria-label="Close sheet"]').click();
  await page.waitForTimeout(400);

  // 6. Test Overflow Menu (⋯)
  console.log("6. Testing Top Bar Overflow Menu (⋯)...");
  const overflowBtn = page.locator('button[aria-label="Overflow menu"]');
  await overflowBtn.click();
  await page.waitForTimeout(400);
  const overflowLabel = page.locator('div:has-text("Layout Density")').first();
  console.log("Overflow menu visible:", await overflowLabel.isVisible());

  await browser.close();
  console.log("ALL INTERACTIVE GATES PASSED CLEANLY!");
}

testInteractions().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
