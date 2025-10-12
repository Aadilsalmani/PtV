// ================================
// 🌍 PtV (Places to Visit) PWA Caching
// ================================

const CACHE_NAME = "ptv-v1";
const FILES_TO_CACHE = [
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
  const url = event.request.url;

  // Skip browser extension and chrome requests
  if (!url.startsWith("http")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;

      return fetch(event.request)
        .then((networkResponse) => {
          // Clone response before using it twice
          const responseClone = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            // Only cache valid (basic) GET responses
            if (event.request.method === "GET" && networkResponse.ok) {
              cache.put(event.request, responseClone);
            }
          });

          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});


