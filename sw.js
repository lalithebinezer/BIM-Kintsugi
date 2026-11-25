/**
 * Service Worker — Offline BIM Site Inspection Caching Engine.
 *
 * Caches WebAssembly loaders (web-ifc.wasm, web-ifc-mt.wasm, web-ifc-node.wasm),
 * hashed JS/CSS chunks (`./assets/*`), background worker threads, and shell assets
 * to enable offline 3D model navigation on construction sites.
 */

const CACHE_NAME = "bim-kintsugi-cache-v14";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./favicon.svg",
  "./icons.svg",
  "./logo.jpg",
  "./web-ifc.wasm",
  "./web-ifc-mt.wasm",
  "./web-ifc-node.wasm",
  "./manifest.json",
];

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(STATIC_ASSETS.map((asset) => cache.add(asset)))
    )
  );
  // Do NOT call self.skipWaiting() unconditionally here — wait for user confirmation via SKIP_WAITING
  // message (PwaUpdateManager) or next fresh session so the page never reloads twice on startup.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin GET requests over http/https
  if (
    event.request.method !== "GET" ||
    !url.protocol.startsWith("http") ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // 1. Navigation / HTML documents: Network-First so new deployments activate promptly, with offline fallback
  if (
    event.request.mode === "navigate" ||
    event.request.destination === "document" ||
    url.pathname.endsWith(".html") ||
    url.pathname === "/" ||
    url.pathname.endsWith("/")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((c) => c || caches.match("./index.html")))
    );
    return;
  }

  // 2. Cache-first for content-hashed Vite bundles, WASM binaries, and worker scripts
  const isImmutableAsset =
    url.pathname.includes("/assets/") ||
    url.pathname.endsWith(".wasm") ||
    /\/worker(?:-[\w-]+)?\.mjs$/.test(url.pathname) ||
    /clashWorker.*\.js$/i.test(url.pathname);

  if (isImmutableAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((res) => {
            if (res && res.ok) {
              const resClone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
            }
            return res;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  // 3. Network-First with cache fallback for remaining lightweight assets (skip huge sample IFC payloads)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          !url.pathname.toLowerCase().endsWith(".ifc")
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
