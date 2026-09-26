const CACHE_NAME = "project-command-static-v1";
const APP_ASSETS = ["/manifest.webmanifest", "/pwa-192.png", "/pwa-512.png", "/pwa-maskable-512.png", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const cacheable = event.request.method === "GET" && url.origin === self.location.origin && (url.pathname.startsWith("/_next/static/") || APP_ASSETS.includes(url.pathname));
  if (!cacheable) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
    return response;
  })));
});
