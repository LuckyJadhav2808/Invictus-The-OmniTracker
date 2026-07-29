import webpush from "web-push";

// Standard VAPID keys for Invictus Web Push Engine
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "";

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    "mailto:luckymanojjadhav@gmail.com",
    publicVapidKey,
    privateVapidKey
  );
}

export { webpush, publicVapidKey };
