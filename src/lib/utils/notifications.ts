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
    const granted = await requestNotificationPermission();
    if (!granted) return;
  }

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        reg.showNotification(title, {
          body,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          vibrate: [200, 100, 200],
          data: { url },
        } as any);
        return;
      }
    }

    // Fallback to standard Notification API
    new Notification(title, {
      body,
      icon: "/icons/icon-192.png",
    });
  } catch (err) {
    console.error("Error triggering native notification:", err);
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
