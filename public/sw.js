// Service Worker for Invictus OmniTracker: Push Notifications & High-Speed Static Caching
const STATIC_CACHE_NAME = "invictus-static-v1.8.3";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== STATIC_CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Runtime Caching for Content-Hashed Static Bundles & Media
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Air-gap API endpoints and dynamic mutations (always network-first)
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // 2. Air-gap localhost dev server from chunk caching to prevent stale Turbopack/HMR modules
  const isDevHost =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname.startsWith("192.168.") ||
    url.hostname.startsWith("10.");

  if (isDevHost) {
    // In local development, never intercept or cache chunks; allow Next.js/Turbopack full control over HMR
    return;
  }

  // 3. Cache-First ONLY for immutable static media and icons (never stale JS chunks)
  const isStaticAsset =
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname === "/manifest.json";

  if (isStaticAsset) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
  }
});

// Handle Background Push Notifications
self.addEventListener("push", (event) => {
  let data = { title: "Invictus Reminder 🚀", body: "You have an upcoming habit or budget pace target!", url: "/today" };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    vibrate: [300, 100, 300, 100, 300],
    tag: "invictus-notification-" + Date.now(),
    renotify: true,
    requireInteraction: true, // Force lockscreen persistence
    silent: false,
    timestamp: Date.now(),
    data: {
      url: data.url || "/today",
    },
    actions: [
      { action: "open", title: "Open App 📱" },
      { action: "close", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle Notification Clicks from OS Status Bar / Notification Center
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const targetUrl = event.notification.data?.url || "/today";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus().then((c) => {
            if (c && "navigate" in c) {
              return c.navigate(targetUrl);
            }
          });
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
