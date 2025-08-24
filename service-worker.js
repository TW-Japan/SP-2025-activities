
self.addEventListener('install', event => {
  self.skipWaiting(); // Activate worker immediately
  event.waitUntil(
    caches.open('sp-2025-activities-cache').then(cache => {
      return cache.addAll([
        '/SP-2025-activities/index.html',
        '/SP-2025-activities/assets/icons/icon-192x192.png',
        '/SP-2025-activities/assets/icons/icon-512x512.png',
        '/SP-2025-activities/assets/manifest.json'
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  clients.claim(); // Become available to all pages
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
