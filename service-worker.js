// ================================
// 🌍 PtV — Places to Visit (PWA) v3 (Fixed)
// ================================

const CACHE_NAME = "ptv-cache-v4";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./css/style.min.css",
  "./js/script.min.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
  // ❌ Removed external CDN URLs
];

// 🧩 INSTALL EVENT
self.addEventListener("install", event => {
  console.log("[ServiceWorker] Installing PtV assets...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
      .catch(err => console.error("[SW] Cache addAll failed:", err))
  );
});

// 🔁 ACTIVATE EVENT
self.addEventListener("activate", event => {
  console.log("[ServiceWorker] Activating new cache...");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();

  // Notify all open tabs
  self.clients.matchAll({ type: "window" }).then(clients => {
    clients.forEach(client =>
      client.postMessage({ type: "NEW_VERSION_AVAILABLE" })
    );
  });
});

// 🌐 FETCH EVENT — Network First, then Cache Fallback
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip browser extensions and POST requests
  if (!url.protocol.startsWith("http") || req.method !== "GET") return;

  event.respondWith(
    fetch(req)
      .then(networkRes => {
        const clone = networkRes.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        return networkRes;
      })
      .catch(() => caches.match(req).then(cachedRes => cachedRes || caches.match("./index.html")))
  );
});
