const CACHE = 'taqa-hub-v38';

// Detect base path automatically — works on GitHub Pages and Azure
const BASE = self.location.pathname.replace('service-worker.js', '');

const CORE = [
  BASE,
  BASE + 'index.html',
  BASE + 'segment.html',
  BASE + 'viewer.html',
  BASE + 'shared.js',
  BASE + 'fixes.js',
  BASE + 'search-index.js',
  BASE + 'ai-search.html',
  BASE + 'glossary.html',
  BASE + 'upload.html',
  BASE + 'support-ticket.html',
  BASE + 'analytics.html',
  BASE + 'icons/icon.svg',
  BASE + 'offline.html'
];

const OPTIONAL = [
  BASE + 'taqa-hero.webp',
  BASE + 'taqa-hero-2.jpg',
  BASE + 'taqa-hero-3.jpeg',
  BASE + 'taqa-hero-4.jpg',
  BASE + 'taqa-hero-5.jpeg'
];

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(CORE).then(() =>
        Promise.all(OPTIONAL.map(url => c.add(url).catch(() => {})))
      )
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true })
      .then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() =>
          caches.match(BASE + 'offline.html')
        );
      })
  );
});
