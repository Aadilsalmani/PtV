// ================================
// 🌍 PtV — Places to Visit (PWA) v3
// ================================
const CACHE_NAME = "ptv-cache-v3";
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

// 🧩 INSTALL EVENT
self.addEventListener("install", event => {
  console.log("[ServiceWorker] Installing PtV assets...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// 🔁 ACTIVATE EVENT
self.addEventListener("activate", event => {
  console.log("[ServiceWorker] Activating new cache...");
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();

  // ✅ Notify clients (tabs) that a new version is active
  self.clients.matchAll({ type: "window" }).then(clients => {
    clients.forEach(client => client.postMessage({ type: "NEW_VERSION_AVAILABLE" }));
  });
});

// 🌐 FETCH EVENT — Network First, then Cache
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  if (!url.protocol.startsWith("http")) return; // skip extensions etc.

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
