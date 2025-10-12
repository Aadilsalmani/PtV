// ================================
// 🧭 Tourist Explorer PWA Caching
// ================================

const CACHE_NAME = "tourist-explorer-v3";
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
  console.log("[ServiceWorker] Install");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Caching app shell");
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE EVENT – Clear old cache versions
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activate");
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// FETCH EVENT – Serve from cache, then network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return from cache if found
        if (response) {
          return response;
        }
        // Else fetch and cache dynamically
        return fetch(event.request)
          .then((fetchResponse) => {
            return caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, fetchResponse.clone());
                return fetchResponse;
              });
          })
          .catch(() => {
            // Optional: return fallback offline page or blank response
            if (event.request.mode === "navigate") {
              return caches.match("/index.html");
            }
          });
      })
  );
});
