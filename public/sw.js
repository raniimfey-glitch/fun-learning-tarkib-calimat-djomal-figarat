// Service Worker for "تركيب كلمات وجمل وفقرات" (Progressive Web App)
// Compliant with W3C PWA Standards & PWABuilder Validation

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE_NAME = `arabic-learning-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `arabic-learning-dynamic-${CACHE_VERSION}`;
const FONT_CACHE_NAME = `arabic-learning-fonts-${CACHE_VERSION}`;

// Application shell and critical assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/app-icon.jpg',
  '/og-preview.jpg',
  '/screenshot-wide.png',
  '/screenshot-narrow.png',
];

// 1. Install Event: Cache critical application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        // Use Promise.allSettled to ensure installation succeeds even if an asset fails
        return Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            fetch(url)
              .then((response) => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch((err) => {
                console.warn(`[SW] Precache item skipped: ${url}`, err);
              })
          )
        );
      })
      .then(() => {
        // Activate immediately
        return self.skipWaiting();
      })
  );
});

// 2. Activate Event: Clean up outdated caches and claim clients
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, FONT_CACHE_NAME];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log(`[SW] Deleting legacy cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all open pages immediately
        return self.clients.claim();
      })
  );
});

// 3. Fetch Event: Reliable caching strategies based on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (e.g. POST to /api/analyze-pronunciation)
  if (request.method !== 'GET') {
    return;
  }

  // Bypass chrome-extension or external protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // A. API routes (/api/*): Always Network-First, never cache dynamic analysis
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'offline',
            message: 'أنت في وضع عدم الاتصال حالياً.',
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          }
        );
      })
    );
    return;
  }

  // B. Google Fonts stylesheets and webfont binaries (Cache First)
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.open(FONT_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);
        });
      })
    );
    return;
  }

  // C. Navigation requests (HTML Pages): Network First with Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match('/index.html');
          });
        })
    );
    return;
  }

  // D. Static Assets (Scripts, CSS, Images, Icons, Audio): Cache First with Background Update
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network fetch fails, return nothing (cachedResponse handled below)
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Message Event: Allow web clients to command skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
