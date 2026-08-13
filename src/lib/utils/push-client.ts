import { toast } from "sonner";

const PUBLIC_VAPID_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BPiAPqUaPwQEX8zTKH08KceB_zOT4aKAI5c-fj0DDpBkN88iXLgqUjn6n5lXlIpx8JGU31jzKTN1btUXTrpK45E";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function enableWebPushNotifications(userId: string = "guest") {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    toast.error("Push Notifications are not supported on this browser.");
    return false;
  }

  try {
    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.error("Notification permission denied by browser.");
      return false;
    }

    // 2. Register Service Worker
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    // 3. Check for existing subscription or create new one using VAPID Key
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });
    }

    // 4. Send PushSubscription token to MongoDB backend automatically
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        subscription,
      }),
    });

    if (!res.ok) throw new Error("Failed to store push token");

    toast.success("Background Push Notifications Active! 🔔");
    return true;
  } catch (err: any) {
    console.error("Enable web push error:", err);
    toast.error(err?.message || "Failed to enable push notifications");
    return false;
  }
}

export async function triggerTestPushNotification(userId: string = "guest") {
  try {
    let res = await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        title: "⏰ Invictus Wake-Up & Habit Alarm",
        body: "Your daily habits and routines are ready! Time to conquer your goals.",
        url: "/goals",
      }),
    });

    // Auto-subscribe if subscription wasn't registered yet!
    if (res.status === 404) {
      const subscribed = await enableWebPushNotifications(userId);
      if (subscribed) {
        res = await fetch("/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            title: "⏰ Invictus Wake-Up & Habit Alarm",
            body: "Your daily habits and routines are ready! Time to conquer your goals.",
            url: "/goals",
          }),
        });
      }
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to trigger test push");
    toast.success("Test notification sent to your device status bar! 📲");
  } catch (err: any) {
    toast.error(err?.message || "Failed to send push test");
  }
}
