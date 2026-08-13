"use client";

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    return registration;
  } catch (err) {
    console.error("Service Worker registration failed:", err);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") {
    return true;
  }
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
}

export function isNotificationPermissionGranted(): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  return Notification.permission === "granted";
}

export async function sendNativeNotification(title: string, body: string, url: string = "/today") {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
  }

  // 1. Fire Direct Browser Notification Constructor IMMEDIATELY (Non-blocking, instant OS status bar toast)
  try {
    const n = new Notification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url },
    });
    n.onclick = () => {
      window.focus();
      window.location.href = url;
    };
  } catch (err) {
    console.warn("Direct Notification constructor failed:", err);
  }

  // 2. Also trigger via Service Worker if registered (for mobile background lockscreen support)
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          vibrate: [200, 100, 200],
          tag: "invictus-alert-" + Date.now(),
          renotify: true,
          data: { url },
        } as any);
      }
    }
  } catch (err) {
    console.warn("SW showNotification error:", err);
  }
}

export function scheduleLocalNotification(title: string, body: string, delayMs: number, url: string = "/today") {
  if (delayMs <= 0) {
    sendNativeNotification(title, body, url);
    return;
  }

  setTimeout(() => {
    sendNativeNotification(title, body, url);
  }, delayMs);
}
