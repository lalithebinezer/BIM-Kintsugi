/**
 * Service Worker — Offline BIM Site Inspection Caching Engine.
 *
 * Caches WebAssembly loaders (web-ifc.wasm), background worker threads,
 * and static assets to enable offline 3D model navigation on construction sites.
 */

const CACHE_NAME = "bim-kintsugi-cache-v4";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./favicon.svg",
  "./icons.svg",
  "./logo.jpg",
  "./web-ifc.wasm",
  "./web-ifc-mt.wasm",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[PWA] Pre-cache warning:", err);
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

  // Only handle GET requests and http/https
  if (event.request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

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
          }).catch(() => cached)
        );
      })
    );
    return;
  }

  // Stale-while-revalidate for local scripts and styles
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
