// CHANNEL INTELLIGENCE - SERVICE WORKER v1.2
const CACHE_NAME = 'channel-intelligence-v1.2';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(APP_SHELL.map(url => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  const url = new URL(req.url);

  if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(req)
        .then(res => { caches.open(CACHE_NAME).then(c => c.put(req, res.clone())); return res; })
        .catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  if (req.url.includes('cdnjs.') || req.url.includes('fonts.google') || url.pathname.match(/\.(js|css|woff2?|png|svg|ico)$/)) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (!res || res.status !== 200 || res.type === 'opaque') return res;
          caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then(res => { if (res && res.status === 200) caches.open(CACHE_NAME).then(c => c.put(req, res.clone())); return res; })
      .catch(() => caches.match(req))
  );
});
