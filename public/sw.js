const CACHE_NAME = 'tennis-tracker-v5-performance-fixed';
const STATIC_ASSETS = [
  '/manifest.json',
  '/placeholder-logo.png',
  '/placeholder-logo.svg',
  '/favicon.ico'
];

// Performance-optimized cache strategy
const CACHE_STRATEGIES = {
  // Cache for 1 year
  IMMUTABLE: ['/placeholder-logo.png', '/placeholder-logo.svg', '/favicon.ico'],
  // Cache for 1 hour
  SHORT: ['/manifest.json'],
  // Cache for 1 day
  MEDIUM: [],
  // Network first
  DYNAMIC: []
};

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

// Performance-optimized fetch strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // Bypass for Next.js build assets and HTML documents (network-first)
  const isNextAsset = url.pathname.startsWith('/_next/');
  const isDocument = request.destination === 'document' || (request.mode === 'navigate');

  if (isNextAsset || isDocument) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses for Next.js assets
          if (response.ok && isNextAsset) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Immutable assets - cache first
  if (CACHE_STRATEGIES.IMMUTABLE.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Short-term cache assets
  if (CACHE_STRATEGIES.SHORT.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) {
          // Check if cache is still fresh (1 hour)
          const cacheTime = cached.headers.get('sw-cache-time');
          if (cacheTime && Date.now() - parseInt(cacheTime) < 3600000) {
            return cached;
          }
        }
        return fetch(request).then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, response.clone());
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
