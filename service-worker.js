const CACHE = 'taqa-hub-v66';

// Detect base path automatically, works on GitHub Pages and Azure
const BASE = self.location.pathname.replace('service-worker.js', '');

const CORE = [
  BASE,
  BASE + 'index.html',
  BASE + 'segment.html',
  BASE + 'viewer.html',
  BASE + 'shared.js',
  BASE + 'fixes.js',
  BASE + 'segments-data.js',
  // The register, the role rules and the counting layer. Without these three
  // an offline page loads its shell and then shows no documents and no counts
  // at all, which looked like an empty hub rather than a cache miss.
  BASE + 'documents-master.js',
  BASE + 'roles.js',
  BASE + 'store.js',
  BASE + 'master-list.html',
  BASE + 'dashboard.html',
  BASE + 'whats-new.html',
  BASE + 'documents.html',
  BASE + 'search-index.js',
  BASE + 'ai-search.html',
  BASE + 'glossary.html',
  BASE + 'upload.html',
  BASE + 'support-ticket.html',
  BASE + 'analytics.html',
  BASE + 'qrcode.js',
  BASE + 'qr.js',
  BASE + 'topbar.css',
  BASE + 'fonts/fonts.css',
  BASE + 'fonts/web/BwGradual-Light.woff2',
  BASE + 'fonts/web/BwGradual-Regular.woff2',
  BASE + 'fonts/web/BwGradual-Bold.woff2',
  BASE + 'fonts/web/BwGradual-ExtraBold.woff2',
  BASE + 'icons/icon.svg',
  BASE + 'offline.html'
];

// Self-hosted webfonts, cached so typography survives offline.
const FONTS = [
  'Inter-300', 'Inter-400', 'Inter-500', 'Inter-600', 'Inter-700',
  'Urbanist-300', 'Urbanist-400', 'Urbanist-500', 'Urbanist-600',
  'Urbanist-700', 'Urbanist-800'
].map(f => BASE + 'fonts/web/' + f + '.woff2');

const OPTIONAL = FONTS.concat([
  BASE + 'taqa-hero.webp',
  BASE + 'taqa-hero-2.jpg',
  BASE + 'taqa-hero-3.jpeg',
  BASE + 'taqa-hero-4.jpg',
  BASE + 'taqa-hero-5.jpeg'
]);

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', e => {
  // Take over at once. Waiting for every tab to close is how the old worker
  // stayed in charge for five days.
  self.skipWaiting();
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

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(e.request, { ignoreSearch: true }).then(cached => cached || caches.match(BASE + 'offline.html'))
        )
    );
    return;
  }

  // Scripts, styles and the register go to the network first, cache second.
  //
  // This used to be cache first with no revalidation, which meant a browser
  // that had visited once kept running that day's JavaScript for as long as the
  // cache survived: a page could load a new index.html from the network and
  // then drive it with a five day old register beside it. For a document
  // register that is not just a staleness bug, it is the failure API Q2 4.4.3
  // is about, since the cached copy can describe a revision that has since been
  // withdrawn. Fonts and images stay cache first; they do not carry meaning.
  const url = new URL(e.request.url);
  const fresh = /\.(js|css|json)$/.test(url.pathname) || e.request.destination === 'script';
  if (fresh) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
    return;
  }

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
