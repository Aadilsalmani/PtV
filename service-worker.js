// ================================
// 🌍 PtV — Places to Visit (PWA)
// ================================
const CACHE_NAME = "ptv-cache-v2";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./css/style.min.css",
  "./js/script.min.js",
  "./data/tourist_data.json",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "https://unpkg.com/leaflet/dist/leaflet.css",
  "https://unpkg.com/leaflet/dist/leaflet.js",
  "https://unpkg.com/lucide@latest"
];

// 📦 INSTALL EVENT — Cache essential assets
self.addEventListener("install", event => {
  console.log("[ServiceWorker] Installing PtV assets...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// 🔁 ACTIVATE EVENT — Clean up old caches
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
});

// 🌐 FETCH EVENT — Serve from cache, fallback to network
self.addEventListener("fetch", event => {
  const requestURL = event.request.url;

  // ✅ Skip caching non-http requests (like chrome-extension://)
  if (!requestURL.startsWith("http")) return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request)
          .then(networkResponse => {
            // Only cache successful HTTP responses
            if (!networkResponse || networkResponse.status !== 200) return networkResponse;

            const clonedResponse = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clonedResponse);
            });
            return networkResponse;
          })
          .catch(() => caches.match("./index.html"));
      })
  );
});
