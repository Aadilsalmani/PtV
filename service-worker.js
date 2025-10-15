// ================================
// 🌍 PtV — Places to Visit (PWA) v3.1
// ================================
const CACHE_NAME = "ptv-cache-v3.1";
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

// 🧩 INSTALL EVENT — cache essential assets
self.addEventListener("install", event => {
  console.log("[ServiceWorker] Installing PtV assets...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// 🔁 ACTIVATE EVENT — clear old caches
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

  // ✅ Notify active clients that a new version is live
  self.clients.matchAll({ type: "window" }).then(clients => {
    clients.forEach(client =>
      client.postMessage({ type: "NEW_VERSION_AVAILABLE" })
    );
  });
});

// 🌐 FETCH EVENT — Network-first with smart caching
self.addEventListener("fetch", event => {
  const req = event.request;

  // 🚫 Skip non-HTTP or non-GET requests (fixes POST feedback error)
  if (!req.url.startsWith("http") || req.method !== "GET") return;

  event.respondWith(
    fetch(req)
      .then(networkRes => {
        // Cache only successful GET responses
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return networkRes;
      })
      .catch(() =>
        caches.match(req).then(
          cachedRes => cachedRes || caches.match("./index.html")
        )
      )
  );
});
