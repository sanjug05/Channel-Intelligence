// ─────────────────────────────────────────────────────────
// Channel Intelligence — Service Worker
//
// Bump CACHE_VERSION on every deploy (keep it in sync with APP_VERSION /
// BUILD_NUMBER in index.html). Changing this string is what makes the
// browser notice a new sw.js byte-for-byte, install it in the background,
// and hand control to index.html's "update available" banner.
//
// IMPORTANT: this worker deliberately does NOT call self.skipWaiting()
// automatically. A new version installs and then WAITS — nothing changes
// for anyone already using the app until they click "Refresh Now" in the
// update banner (which posts the SKIP_WAITING message below). This avoids
// silently pulling the app out from under someone mid-upload or mid-edit.
// ─────────────────────────────────────────────────────────
const CACHE_VERSION = 'ci-v1.1.0-2026.07.30.03';
const CACHE_NAME = `channel-intel-${CACHE_VERSION}`;

// Same-origin app-shell files worth pre-caching. Keep this list to files
// that actually exist at these paths in your repo — an addAll() failure
// on any single missing file fails the whole install step, so this is
// wrapped in a .catch() below rather than left to reject silently.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(err => console.warn('SW install: app-shell precache skipped:', err))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// index.html's "Refresh Now" button posts this once the user confirms —
// only then does the waiting worker take over.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Network-first for the HTML shell (always try to fetch the latest page
// when online; fall back to whatever's cached when offline). Cache-first
// for everything else — Chart.js, Firebase SDK, xlsx, fonts, icons — since
// those are pinned CDN versions that never change under the same URL, so
// there's no correctness downside to serving them from cache immediately.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isNavigation = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
