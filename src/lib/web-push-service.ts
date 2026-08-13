import webpush from "web-push";

// Standard VAPID keys for Invictus Web Push Engine
const publicVapidKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BPiAPqUaPwQEX8zTKH08KceB_zOT4aKAI5c-fj0DDpBkN88iXLgqUjn6n5lXlIpx8JGU31jzKTN1btUXTrpK45E";
const privateVapidKey =
  process.env.VAPID_PRIVATE_KEY || "Q-K-YOXXihH0bMt4ukq5UJubI_nCpGzCgd-BQS7KLB4";

if (publicVapidKey && privateVapidKey) {
  try {
    webpush.setVapidDetails(
      "mailto:luckymanojjadhav@gmail.com",
      publicVapidKey,
      privateVapidKey
    );
  } catch (e) {
    console.error("Failed to set webpush VAPID details:", e);
  }
}

export { webpush, publicVapidKey };
