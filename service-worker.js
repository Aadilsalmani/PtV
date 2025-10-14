// ================================
// 🌍 PtV — Places to Visit (PWA) v2
// ================================
const CACHE_NAME = "ptv-cache-v2";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./css/style.min.css",
  "./js/script.min.js?v=8",
  "./data/tourist_data.json",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "https://unpkg.com/leaflet/dist/leaflet.css",
  "https://unpkg.com/leaflet/dist/leaflet.js",
  "https://unpkg.com/lucide@latest"
];

// 🧩 Install Event
self.addEventListener("install", event => {
  console.log("[ServiceWorker] Installing and caching assets...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// 🔁 Activate Event
self.addEventListener("activate", event => {
  console.log("[ServiceWorker] Activating new cache version...");
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 🌐 Fetch Event — Network First with Cache Fallback
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  // 🧱 Skip Chrome extensions & non-http(s) requests
  if (!url.protocol.startsWith("http")) return;

  event.respondWith(
    fetch(req)
      .then(networkRes => {
        // Clone response to store in cache
        const resClone = networkRes.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        return networkRes;
      })
      .catch(() => caches.match(req).then(cachedRes => cachedRes || caches.match("./index.html")))
  );
});
