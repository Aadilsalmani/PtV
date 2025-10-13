// ================================
// 🌍 PtV — Places to Visit (PWA)
// ================================
const CACHE_NAME = "ptv-cache-v1";
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

self.addEventListener("install", e => {
  console.log("[ServiceWorker] Installing PtV assets...");
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  console.log("[ServiceWorker] Activating new cache...");
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => {
      if (k !== CACHE_NAME) {
        console.log("[ServiceWorker] Removing old cache:", k);
        return caches.delete(k);
      }
    })))
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request)
      .then(resp => resp || fetch(e.request).then(fetchResp => {
        if (!fetchResp || fetchResp.status !== 200) return fetchResp;
        const respClone = fetchResp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, respClone));
        return fetchResp;
      }).catch(() => caches.match("./index.html")))
  );
});
