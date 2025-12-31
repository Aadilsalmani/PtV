// =====================================
// The P2V — Minimal Fast Service Worker
// Purpose: Offline shell ONLY
// =====================================

const CACHE_NAME = "ptv-shell-v1";

// Cache ONLY what is critical
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/css/style.min.css",
  "/js/script.min.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

/* ---------------- INSTALL ---------------- */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

/* ---------------- ACTIVATE ---------------- */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ---------------- FETCH ---------------- */
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  // 🚫 NEVER touch SEO or static pages
  if (
    url.pathname.startsWith("/places") ||
    url.pathname.startsWith("/place") ||
    url.pathname.endsWith(".html")
  ) {
    return; // browser handles it directly (FAST)
  }

  // 🚫 NEVER touch external resources
  if (url.origin !== location.origin) {
    return;
  }

  // 🧭 Navigation → network first, fallback to shell
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // 🧩 Assets → cache-first
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
