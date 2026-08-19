/**
 * Service Worker — Offline BIM Site Inspection Caching Engine.
 *
 * Caches WebAssembly loaders (web-ifc.wasm), background worker threads,
 * and static assets to enable offline 3D model navigation on construction sites.
 */

const CACHE_NAME = "bim-twin-cache-v3";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./favicon.svg",
  "./icons.svg",
  "./logo.jpg",
  "./worker.mjs",
  "./web-ifc.wasm",
  "./web-ifc-mt.wasm",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("PWA pre-cache warning:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Cache-first for WASM and worker scripts
  if (url.pathname.endsWith(".wasm") || url.pathname.endsWith("worker.mjs")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((res) => {
            if (res.ok) {
              const resClone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
            }
            return res;
          })
        );
      })
    );
    return;
  }

  // Network-first with cache fallback for HTML, CSS, JS
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && event.request.method === "GET") {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
