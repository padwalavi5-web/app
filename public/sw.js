const CACHE_NAME = 'kibbutz-app-v2';
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/favicon.svg'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const isNavigationRequest = event.request.mode === 'navigate';
  const isSameOrigin = new URL(event.request.url).origin === self.location.origin;

  if (isNavigationRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
          return response;
        })
        .catch(async () => (await caches.match('/index.html')) || Response.error()),
    );
    return;
  }

  if (!isSameOrigin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(async () => (await caches.match(event.request)) || Response.error()),
  );
});
