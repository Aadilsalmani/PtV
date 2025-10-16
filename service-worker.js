// ================================
// 🌍 PtV — Places to Visit (PWA) v5 (Stable Build)
// ================================

const CACHE_NAME = "ptv-cache-v5";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./css/style.min.css",
  "./js/script.min.js",
  "./data/tourist_data.json",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// 🧩 INSTALL EVENT — Safe caching with try/catch
self.addEventListener("install", event => {
  console.log("[ServiceWorker] Installing PtV assets...");
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(FILES_TO_CACHE);
        console.log("[SW] Cached core assets successfully.");
      } catch (err) {
        console.error("[SW] Cache addAll failed:", err);
      }
      self.skipWaiting();
    })()
  );
});

// 🔁 ACTIVATE EVENT — remove old caches safely
self.addEventListener("activate", event => {
  console.log("[ServiceWorker] Activating and cleaning old caches...");
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );
      self.clients.claim();
      // Notify open tabs that new SW is active
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.postMessage({ type: "NEW_VERSION_AVAILABLE" });
      }
    })()
  );
});

// 🌐 FETCH EVENT — Network-first with fallback to cache
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-HTTP(S) and POST/PUT requests
  if (!url.protocol.startsWith("http") || req.method !== "GET") return;

  event.respondWith(
    (async () => {
      try {
        const res = await fetch(req);
        const clone = res.clone();
        // Cache small core assets only (avoid quota overflows)
        if (res.ok && res.type === "basic" && url.origin === location.origin) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, clone).catch(err => console.warn("[SW] Cache put failed:", err));
        }
        return res;
      } catch {
        const cachedRes = await caches.match(req);
        return cachedRes || caches.match("./index.html");
      }
    })()
  );
});
