const CACHE_NAME = 'tennis-tracker-v4-force-refresh';
const STATIC_ASSETS = [
  '/manifest.json',
  '/placeholder-logo.png',
  '/placeholder-logo.svg'
];

// Ensure new SW takes control ASAP
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

// Fetch strategy:
// - Never cache Next.js build assets or HTML documents (network-first)
// - Cache-first for small static assets we explicitly listed
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass for Next build assets and API routes
  const isNextAsset = url.pathname.startsWith('/_next/');
  const isDocument = request.destination === 'document' || (request.mode === 'navigate');

  if (isNextAsset || isDocument) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Cache-first for static assets we precached
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // Default: network-first with fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => response)
      .catch(() => caches.match(request))
  );
});
