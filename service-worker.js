// ================================
// 🌍 PtV (Places to Visit) PWA Caching
// ================================

const CACHE_NAME = "ptv-v1";
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/css/style.min.css",
  "/js/script.min.js",
  "/data/tourist_data.json",
  "/manifest.json",
  "https://unpkg.com/leaflet/dist/leaflet.css",
  "https://unpkg.com/leaflet/dist/leaflet.js",
  "https://unpkg.com/lucide@latest"
];

// INSTALL EVENT – Pre-cache core assets
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installing PtV cache...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE EVENT – Clear old caches
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activating PtV...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
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

// FETCH EVENT – Serve from cache, then network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request)
        .then((fetchResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});
