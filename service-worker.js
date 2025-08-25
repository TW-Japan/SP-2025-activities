// service-worker.js (hardened) — network-first for HTML navigations, cache-first for assets
const CACHE_VERSION = 'v2025-08-26-2'; // bump each deploy
const CACHE_NAME = `sp-2025-activities-${CACHE_VERSION}`;
const ORIGIN = self.location.origin;
const BASE = '/SP-2025-activities';

const PRECACHE_URLS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/assets/manifest.json`,
  `${BASE}/assets/icons/icon-192x192.png`,
  `${BASE}/assets/icons/icon-512x512.png`,
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_URLS);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !k.endsWith(CACHE_VERSION)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== ORIGIN) return;

  // Treat navigations (HTML) as network-first so edits appear immediately
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        const cache = await caches.open(CACHE_NAME);
        // Fallback to cached page or cached index.html
        return (await cache.match(req)) || (await cache.match(`${BASE}/index.html`));
      }
    })());
    return;
  }

  // For CSS/JS/images/fonts: cache-first with background refresh
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) {
      fetch(req).then((resp) => {
        if (resp && resp.ok) cache.put(req, resp.clone());
      }).catch(() => {});
      return cached;
    }
    try {
      const resp = await fetch(req);
      if (resp && resp.ok) cache.put(req, resp.clone());
      return resp;
    } catch (err) {
      return cached || Response.error();
    }
  })());
});
