const CACHE = 'taqa-hub-v11';
const ASSETS = [
  '/TAQAKnowledgeHub/',
  '/TAQAKnowledgeHub/index.html',
  '/TAQAKnowledgeHub/ai-search.html',
  '/TAQAKnowledgeHub/glossary.html',
  '/TAQAKnowledgeHub/segment.html',
  '/TAQAKnowledgeHub/upload.html',
  '/TAQAKnowledgeHub/support-ticket.html',
  '/TAQAKnowledgeHub/taqa-hero.webp',
  '/TAQAKnowledgeHub/taqa-hero-2.jpg',
  '/TAQAKnowledgeHub/taqa-hero-3.jpeg',
  '/TAQAKnowledgeHub/taqa-hero-4.jpg',
  '/TAQAKnowledgeHub/taqa-hero-5.jpeg',
  '/TAQAKnowledgeHub/icons/icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
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
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).catch(() => caches.match('/TAQAKnowledgeHub/index.html'))
    )
  );
});
