import { chromium } from "playwright";

async function testGuestLogin() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });

  const page = await browser.newPage();
  
  page.on("console", (msg) => console.log(`[Browser Console ${msg.type()}]:`, msg.text()));
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) {
      console.log("[Navigated to]:", frame.url());
    }
  });

  console.log("Navigating to /login...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  console.log("Current URL before click:", page.url());

  const guestBtn = page.locator('button:has-text("Explore as Offline Guest")').first();
  console.log("Found guest button:", await guestBtn.count());
  await guestBtn.click();

  console.log("Clicked guest button, waiting 3000ms...");
  await page.waitForTimeout(3000);

  console.log("Current URL after click:", page.url());

  const storage = await page.evaluate(() => {
    return {
      guest_mode: localStorage.getItem("invictus_guest_mode"),
      session_token: localStorage.getItem("invictus_custom_session_token"),
      active_user: localStorage.getItem("invictus_custom_active_user"),
      guest_name: localStorage.getItem("invictus_guest_name"),
      onboarded: localStorage.getItem("invictus_onboarded"),
    };
  });
  console.log("Storage state:", storage);

  await browser.close();
}

testGuestLogin();
