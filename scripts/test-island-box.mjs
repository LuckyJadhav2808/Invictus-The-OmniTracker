import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => {
    localStorage.setItem("invictus_guest_mode", "true");
  });
  await page.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
  
  const island = page.locator('[aria-label="Live Activity Dynamic Island"]').filter({ visible: true });
  const count = await island.count();
  console.log("ISLAND_COUNT:", count);
  if (count > 0) {
    const isVisible = await island.first().isVisible();
    console.log("ISLAND_VISIBLE:", isVisible);
    console.log("ISLAND_TEXT:", await island.first().innerText());
    console.log("ISLAND_BOX:", await island.first().boundingBox());
  }

  // Now trigger an active gym rest timer
  await page.evaluate(() => {
    // Access zustand store or dispatch gym rest
    const store = window.__LIVE_ACTIVITY_STORE__ || (window as any).useLiveActivityStore;
    window.dispatchEvent(
      new CustomEvent("invictus:start-rest-timer", {
        detail: { durationSeconds: 90, exerciseName: "Bench Press" },
      })
    );
  });
  await page.waitForTimeout(600);

  const activeIsland = page.locator('[aria-label="Live Activity Dynamic Island"]').filter({ visible: true });
  console.log("ACTIVE_ISLAND_COUNT:", await activeIsland.count());
  console.log("ACTIVE_ISLAND_TEXT:", await activeIsland.first().innerText());
  console.log("ACTIVE_ISLAND_BOX:", await activeIsland.first().boundingBox());

  await browser.close();
}

main();
