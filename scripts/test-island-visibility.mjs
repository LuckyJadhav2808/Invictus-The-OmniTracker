import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => {
    localStorage.setItem("invictus_guest_mode", "true");
  });
  await page.goto("http://localhost:3000/goals", { waitUntil: "networkidle" });
  
  const islands = page.locator('[aria-label="Live Activity Dynamic Island"]');
  const count = await islands.count();
  console.log("Total islands found:", count);
  for (let i = 0; i < count; i++) {
    const el = islands.nth(i);
    const visible = await el.isVisible();
    const box = visible ? await el.boundingBox() : null;
    console.log(`Island #${i}: visible=${visible}, box=${JSON.stringify(box)}`);
  }

  await browser.close();
}

main();
