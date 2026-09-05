const CACHE = 'recall-map-v6';
const PRECACHE = __PRECACHE__;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.all(PRECACHE.map(async url => {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Could not precache ${url}`);
    await cache.put(url, response);
  }))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response;
    }).catch(async () => (await caches.match(requestUrl.pathname)) || (await caches.match('/')) || caches.match('/offline.html')));
    return;
  }
  event.respondWith(caches.match(requestUrl.pathname).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  })));
});
