const CACHE = 'taqa-hub-v108';

// Detect base path automatically, works on GitHub Pages and Azure
const BASE = self.location.pathname.replace('service-worker.js', '');

const CORE = [
  BASE,
  BASE + 'index.html',
  BASE + 'segment.html',
  BASE + 'viewer.html',
  // Forms: the TAQA template and the checks each form asks.
  BASE + 'form.html',
  BASE + 'forms-data.js',
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
  BASE + 'techhub.css',
  BASE + 'topbar.css',
  BASE + 'fonts/fonts.css',
  BASE + 'fonts/web/BwGradual-Light.woff2',
  BASE + 'fonts/web/BwGradual-Regular.woff2',
  BASE + 'fonts/web/BwGradual-Bold.woff2',
  BASE + 'fonts/web/BwGradual-ExtraBold.woff2',
  BASE + 'assets/brand/rise-lockup-header.png',
  BASE + 'assets/brand/rise-lockup-header-reverse.png',
  BASE + 'assets/brand/rise-logo-reverse-640.png',
  BASE + 'icons/rise-favicon-32.png',
  BASE + 'icons/rise-favicon-16.png',
  BASE + 'icons/rise-icon-192.png',
  BASE + 'icons/rise-icon-512.png',
  BASE + 'icons/rise-apple-touch-icon.png',
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

/* How each open page was served (PI-26): from the network, or from this
   cache because the network failed or took too long. A page asks once it
   has loaded; the answer is the only honest source for "last synced". */
const served = new Map();   // client id -> { cache: bool, date: string|null }
function note(clientId, fromCache, res) {
  if (!clientId) return;
  const prev = served.get(clientId) || { cache: false, date: null };
  if (fromCache) served.set(clientId, { cache: true, date: (res && res.headers.get('date')) || prev.date });
  else if (!prev.cache) served.set(clientId, { cache: false, date: null });
  if (served.size > 200) served.delete(served.keys().next().value);
}

self.addEventListener('message', e => {
  if (!e.data) return;
  // The page's own "Update now", never anything automatic mid-task (PI-30).
  if (e.data.type === 'SKIP_WAITING') self.skipWaiting();
  // The quiet apply on a fresh, idle page load: only when that page is the
  // only RISE window open. Activating swaps the worker under every open tab,
  // and a tab still running the previous release reloads itself on that
  // swap (its own code did), which would lose work there. With other tabs
  // open the update waits for "Update now" or for them to close.
  if (e.data.type === 'SKIP_WAITING_IF_ALONE') {
    e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      const alone = cs.length <= 1;
      // Tell the page which it was, so it offers "Update now" only when
      // the update did not apply.
      if (e.source && e.source.postMessage) e.source.postMessage({ type: 'QUIET', applied: alone });
      if (alone) return self.skipWaiting();
    }));
  }
  if (e.data.type === 'HOW_SERVED' && e.source) {
    e.source.postMessage({ type: 'SERVED', how: served.get(e.source.id) || { cache: false, date: null } });
  }
});

// A network answer slower than this is treated as no answer: a phone on a
// captive portal or a dead link reports "online" and then waits forever.
// Long enough for a slow field link to still count as reaching RISE; the
// page keeps re-checking while it shows "cannot be reached" (shared.js).
const NET_TIMEOUT = 6000;
// The network answer, raced against the timeout. A late answer is still
// saved to the cache (kept alive by waitUntil), so a slow link refreshes
// the saved copy instead of serving the same old one for ever.
function fetchWithin(e, ms) {
  const net = fetch(e.request);
  e.waitUntil(net.then(res => {
    if (res && res.ok) { const clone = res.clone(); return caches.open(CACHE).then(c => c.put(e.request, clone)); }
  }).catch(() => {}));
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    net.then(r => { clearTimeout(t); resolve(r); }, err => { clearTimeout(t); reject(err); });
  });
}

self.addEventListener('install', e => {
  // The first install takes control at once: no page depends on an older
  // worker. An update waits (PI-30): it used to take over immediately and the
  // page reloaded in the middle of whatever the person was doing, losing an
  // Upload at step 3. A waiting update is applied when the person taps
  // "Update now", or on the next page load where nothing is in progress.
  if (!self.registration.active) self.skipWaiting();
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
    const client = e.resultingClientId || e.clientId;
    e.respondWith(
      fetchWithin(e, NET_TIMEOUT)
        .then(res => {
          note(client, false);
          return res;
        })
        .catch(() =>
          caches.match(e.request, { ignoreSearch: true }).then(cached => {
            note(client, true, cached);
            return cached || caches.match(BASE + 'offline.html');
          })
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
  // The page's "is RISE there?" question (shared.js TAQA_NET.probe) goes to
  // the network only: never answered from, or saved to, this cache. Answered
  // from the cache it said "online" while the server was down (PR 2D review).
  if (url.searchParams.has('probe')) return;
  const fresh = /\.(js|css|json)$/.test(url.pathname) || e.request.destination === 'script';
  if (fresh) {
    e.respondWith(
      fetchWithin(e, NET_TIMEOUT).catch(() => caches.match(e.request, { ignoreSearch: true }).then(cached => {
        // The register or a script from the cache makes the whole page a
        // cached copy, whatever the HTML was.
        if (cached) note(e.clientId, true, cached);
        return cached;
      }))
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
