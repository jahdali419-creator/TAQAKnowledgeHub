const CACHE = 'taqa-hub-v36';

const CORE = [
  '/TAQAKnowledgeHub/',
  '/TAQAKnowledgeHub/index.html',
  '/TAQAKnowledgeHub/segment.html',
  '/TAQAKnowledgeHub/viewer.html',
  '/TAQAKnowledgeHub/shared.js',
  '/TAQAKnowledgeHub/fixes.js',
  '/TAQAKnowledgeHub/search-index.js',
  '/TAQAKnowledgeHub/ai-search.html',
  '/TAQAKnowledgeHub/glossary.html',
  '/TAQAKnowledgeHub/upload.html',
  '/TAQAKnowledgeHub/support-ticket.html',
  '/TAQAKnowledgeHub/analytics.html',
  '/TAQAKnowledgeHub/icons/icon.svg'
];

const OPTIONAL = [
  '/TAQAKnowledgeHub/taqa-hero.webp',
  '/TAQAKnowledgeHub/taqa-hero-2.jpg',
  '/TAQAKnowledgeHub/taqa-hero-3.jpeg',
  '/TAQAKnowledgeHub/taqa-hero-4.jpg',
  '/TAQAKnowledgeHub/taqa-hero-5.jpeg'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // Core files must succeed; images are best-effort
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
  // Only handle same-origin requests
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    // Cache-first with ignoreSearch so segment.html?id=... matches cached segment.html
    caches.match(e.request, { ignoreSearch: true })
      .then(cached => {
        if (cached) return cached;
        // Not in cache — fetch from network and cache for next time
        return fetch(e.request).then(res => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() =>
          // Offline fallback
          caches.match('/TAQAKnowledgeHub/index.html')
        );
      })
  );
});
