const CACHE = 'taqa-hub-v35';

// Core files that must be cached for offline
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

// Large assets cached individually — failures are ignored so install still succeeds
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
    caches.open(CACHE).then(c => {
      // Core files must all succeed
      const corePromise = c.addAll(CORE);
      // Images are best-effort — failures don't block install
      const optPromise = Promise.all(
        OPTIONAL.map(url => c.add(url).catch(() => {}))
      );
      return Promise.all([corePromise, optPromise]);
    })
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
  const url = new URL(e.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // HTML pages: network-first so content is always fresh, fall back to cache
  if (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Cache the fresh response for offline use
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request, {ignoreSearch: true})
          .then(cached => cached || caches.match('/TAQAKnowledgeHub/index.html'))
        )
    );
    return;
  }

  // JS/CSS/images: cache-first, fall back to network
  e.respondWith(
    caches.match(e.request, {ignoreSearch: true}).then(cached =>
      cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => {})
    )
  );
});
