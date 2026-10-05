// The installed RISE app on an iPhone: the bell must open on every page.
//
// In the installed app (display-mode: standalone) iOS draws the status bar
// over the top of the page (apple-mobile-web-app-status-bar-style is
// black-translucent) and keeps taps in that strip for itself. The bar's
// safe-area padding in topbar.css only switches on when the page is drawn
// edge to edge (viewport-fit=cover), which only the viewer and the form
// were, so on every other page the bell sat under the status bar and could
// not be tapped. Every page now adds viewport-fit=cover in the installed app,
// and leaves a browser tab exactly as it was.
//
// Playwright cannot run an installed iPhone app, so this simulates the two
// things iOS does there, faithfully enough to reproduce the fault:
//   - the safe-area inset is 47px (an iPhone 13's status bar), but only when
//     the page asks for viewport-fit=cover, exactly as WebKit exposes it; and
//   - a strip over the top 47px swallows taps, as the status bar does.
// Without the fix, the bell's centre is under that strip and a tap never
// reaches it; with it, the bar grows by the inset and the bell sits below.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

const STATUS_BAR = 47;
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

function simulateInstalledIphone() {
  const mm = window.matchMedia.bind(window);
  window.matchMedia = (q) => (/display-mode:\s*standalone/.test(q)
    ? { matches: true, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } }
    : mm(q));
  try { Object.defineProperty(navigator, 'standalone', { get: () => true }); } catch (e) {}
  document.addEventListener('DOMContentLoaded', () => {
    const m = document.querySelector('meta[name="viewport"]');
    if (m && /viewport-fit=cover/.test(m.content)) {
      document.documentElement.style.setProperty('--nav-safe', '47px');
    }
    const bar = document.createElement('div');
    bar.id = 'ios-status-bar';
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;height:47px;z-index:2147483647;background:transparent;';
    document.body.appendChild(bar);
  });
}

// The same app turned on its side (PI-52). An iPhone in landscape hides the
// status bar; the notch and the rounded corners take 47px on each side and
// the home indicator 21px at the bottom. WebKit exposes them as safe-area
// insets only when the page is drawn edge to edge; the pages read them
// through topbar.css's --safe-l / --safe-r / --safe-b, which this sets. The
// notch side and the home-indicator strip swallow taps here.
function simulateInstalledIphoneLandscape() {
  const mm = window.matchMedia.bind(window);
  window.matchMedia = (q) => (/display-mode:\s*standalone/.test(q)
    ? { matches: true, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } }
    : mm(q));
  try { Object.defineProperty(navigator, 'standalone', { get: () => true }); } catch (e) {}
  document.addEventListener('DOMContentLoaded', () => {
    const m = document.querySelector('meta[name="viewport"]');
    if (m && /viewport-fit=cover/.test(m.content)) {
      const st = document.documentElement.style;
      st.setProperty('--nav-safe', '0px');
      st.setProperty('--safe-l', '47px');
      st.setProperty('--safe-r', '47px');
      st.setProperty('--safe-b', '21px');
    }
    const notch = document.createElement('div');
    notch.id = 'ios-notch';
    notch.style.cssText = 'position:fixed;top:0;bottom:0;left:0;width:47px;z-index:2147483647;background:transparent;';
    const home = document.createElement('div');
    home.id = 'ios-home-indicator';
    home.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:21px;z-index:2147483647;background:transparent;';
    document.body.append(notch, home);
  });
}

// Every visible control inside `root` can be tapped where it is drawn:
// on screen, and the topmost element at its centre is the control itself
// (not the status bar, the notch, the home indicator or the top bar).
async function unreachable(page, root) {
  return page.evaluate((root) => {
    const box = document.querySelector(root);
    if (!box) return ['missing ' + root];
    const bad = [];
    const name = (el) => (el.id ? '#' + el.id : '') + (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 30);
    const desc = (el) => el ? (el.id || String(el.className).split(' ')[0] || el.tagName) : 'nothing';
    for (const el of box.querySelectorAll('button, a[href], input:not([type=hidden]), textarea, select')) {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || el.closest('[hidden]') || el.disabled) continue;
      // Inside a closed group (the phone menu's areas): not shown until opened.
      const det = el.closest('details');
      if (det && !det.open && !el.closest('summary')) continue;
      if (!el.getClientRects().length) continue;
      el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const x = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), y = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
      if (r.left + r.width / 2 < 0 || r.top + r.height / 2 < 0 || r.left + r.width / 2 > innerWidth || r.top + r.height / 2 > innerHeight) { bad.push(name(el) + ' off screen'); continue; }
      const t = document.elementFromPoint(x, y);
      const lab = el.labels ? [...el.labels] : [];
      if (!(t === el || el.contains(t) || lab.some((l) => l.contains(t)) || (t && t.closest('label') && t.closest('label').contains(el)))) bad.push(name(el) + ' covered by ' + desc(t));
    }
    return bad;
  }, root);
}

async function seedQms(page, gotoApp) {
  await gotoApp('/index.html');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('taqa-tour-done', '1');
    TAQA_ROLE.set('employee');
    // Valid TQ-QHSE-S001 numbers for each area's SOP (PR 2C-1, PI-14).
    const NUMS = { 'coiled-tubing': 'TQ-TWS-CTSS-SOP-991', drilling: 'TQ-TDS-DSS-SOP-991' };
    ['coiled-tubing', 'drilling'].forEach((s) => TAQA_STORE.add({
      title: 'APP ' + s + ' procedure', segment: s, docType: 'sop', docNumber: NUMS[s], summary: 'Installed app bell check.',
    }));
    TAQA_ROLE.set('qms');
  });
}

const PAGES = [
  '/index.html',
  '/segment.html?id=drilling',
  '/segment.html?id=coiled-tubing',
  '/segment.html?id=coiled-tubing&dept=maintenance',
  '/dashboard.html?id=coiled-tubing',
  '/documents.html?id=drilling',
  '/segment.html?id=qhse',
  '/master-list.html',
  '/glossary.html',
  '/upload.html',
  '/ai-search.html',
  '/support-ticket.html',
  '/viewer.html?doc=TQ-TWS-CTSS-S005',
];

test.describe('installed iPhone app: the bell opens on every page', () => {
  test.use(PHONE);
  test.beforeEach(async ({ page }) => { await page.addInitScript(simulateInstalledIphone); });

  test('QMS: Home, then Drilling, then tap the bell, open it and tap an item', async ({ page, gotoApp, consoleErrors }) => {
    await seedQms(page, gotoApp);
    await gotoApp('/index.html');
    await page.locator('#nav-bell').tap();
    await expect(page.locator('.bell-menu')).toBeVisible();
    await page.locator('#nav-bell').tap();
    await expect(page.locator('.bell-menu')).toBeHidden();

    await gotoApp('/segment.html?id=drilling');
    // Clear of the status bar, and nothing on top of it where it is tapped.
    const box = await page.locator('#nav-bell').boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(STATUS_BAR);
    await page.locator('#nav-bell').tap();
    await expect(page.locator('.bell-menu')).toBeVisible();

    const item = page.locator('.bell-i', { hasText: 'APP coiled-tubing procedure' });
    await expect(item).toBeVisible();
    await item.tap();
    await expect(page).toHaveURL(/master-list\.html\?view=qms/);
    await expect(page.locator('#dw-title')).toHaveText('APP coiled-tubing procedure');
    assertNoConsoleErrors(consoleErrors);
  });

  for (const p of PAGES) {
    test(`${p}: the bell is below the status bar and a tap opens it`, async ({ page, gotoApp }) => {
      await seedQms(page, gotoApp);
      await gotoApp(p);
      const box = await page.locator('#nav-bell').boundingBox();
      expect(box.y, 'bell top').toBeGreaterThanOrEqual(STATUS_BAR);
      await page.locator('#nav-bell').tap();
      await expect(page.locator('.bell-menu')).toBeVisible();
      // The panel's own controls are tappable too.
      await expect(page.locator('.bell-foot')).toBeVisible();
      const foot = await page.locator('.bell-foot').boundingBox();
      expect(foot.y).toBeGreaterThanOrEqual(STATUS_BAR);
    });
  }

  test('page content starts below the taller bar, not under it', async ({ page, gotoApp }) => {
    await seedQms(page, gotoApp);
    for (const p of PAGES) {
      await gotoApp(p);
      const nav = await page.locator('#navbar').boundingBox();
      expect(Math.abs(nav.height - (64 + STATUS_BAR)), p + ' bar height').toBeLessThan(0.5);
      // The first heading, crumb or hero on the page, wherever its content begins.
      const top = await page.evaluate(() => {
        const els = [...document.querySelectorAll('h1, .breadcrumb, .hub-title, .kicker, .dash-hero, .docs-hero')]
          .filter((e) => e.offsetParent !== null && !e.closest('#navbar'));
        if (!els.length) return null;
        return Math.min(...els.map((e) => e.getBoundingClientRect().top + parseFloat(getComputedStyle(e).paddingTop)));
      });
      expect(top, p + ' has a heading to measure').not.toBeNull();
      expect(top, p + ' content top').toBeGreaterThanOrEqual(nav.y + nav.height - 1);
    }
  });
});

test.describe('in a phone browser nothing changes', () => {
  test.use(PHONE);

  test('the page is not drawn edge to edge and the bar keeps its 64px', async ({ page, gotoApp }) => {
    await seedQms(page, gotoApp);
    for (const p of ['/index.html', '/segment.html?id=drilling', '/dashboard.html?id=coiled-tubing']) {
      await gotoApp(p);
      expect(await page.locator('meta[name="viewport"]').getAttribute('content'), p).not.toContain('viewport-fit');
      expect(Math.abs((await page.locator('#navbar').boundingBox()).height - 64), p).toBeLessThan(0.5);
      await page.locator('#nav-bell').tap();
      await expect(page.locator('.bell-menu')).toBeVisible();
    }
  });
});

// PI-08 / PI-61 / PI-52, TB-04: every overlay a person opens in the installed
// app can be closed and used, upright and on its side. Not only the bell.
const OVERLAYS = [
  { name: 'Master List record drawer', path: '/master-list.html', open: (p) => p.evaluate(() => openDetail(0)), root: '#dw' },
  { name: 'QMS Workbench', path: '/master-list.html?view=qms', open: (p) => p.evaluate(() => wbOpenNum('TQ-TWS-CTSS-SOP-991')), root: '#dw' },
  { name: 'QMS Workbench, reject reason open', path: '/master-list.html?view=qms', open: async (p) => { await p.evaluate(() => wbOpenNum('TQ-TWS-CTSS-SOP-991')); await p.locator('#wb-reject').click(); }, root: '#dw' },
  { name: 'segment document panel', path: '/segment.html?id=drilling', open: (p) => p.evaluate(() => openDocModal('Coiled tubing pressure test', 'sop')), root: '#doc-modal-panel' },
  { name: 'phone menu', path: '/segment.html?id=drilling', open: (p) => p.locator('#nav-hamburger').click(), root: '#nav-mobile-menu' },
  // On a phone Bookmarks opens from the menu (the bar's own button is hidden).
  { name: 'bookmarks', path: '/index.html', open: async (p) => { await p.locator('#nav-hamburger').click(); await p.locator('#mm-bm').click(); }, root: '#bm-panel' },
  { name: 'search filters', path: '/ai-search.html', open: (p) => p.locator('[aria-controls="filters-drawer"]').first().click(), root: '#filters-drawer', phoneOnly: true },
  { name: 'glossary add a term', path: '/glossary.html', open: (p) => p.locator('[data-add-term]:visible').first().click(), root: '#sb-add' },
  { name: 'viewer More menu', path: '/viewer.html?doc=TQ-TWS-CTSS-S005', open: (p) => p.locator('#more-btn').click(), root: '#more-menu' },
  { name: 'viewer Share', path: '/viewer.html?doc=TQ-TWS-CTSS-S005', open: (p) => p.locator('#share-btn').click(), root: '#share-pop' },
];

for (const orient of [
  { label: 'upright', sim: simulateInstalledIphone, use: PHONE },
  { label: 'on its side', sim: simulateInstalledIphoneLandscape, use: { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true } },
]) {
  test.describe(`installed iPhone app ${orient.label}: overlays can be used and closed`, () => {
    test.use(orient.use);
    test.beforeEach(async ({ page }) => { await page.addInitScript(orient.sim); });
    for (const o of OVERLAYS) {
      test(`${o.name}: every control is clear of the status bar, notch and home indicator`, async ({ page, gotoApp }) => {
        await seedQms(page, gotoApp);
        await page.evaluate(() => localStorage.setItem('taqa-install-dismissed', '1'));
        await gotoApp(o.path);
        await o.open(page);
        await page.waitForTimeout(450); // slide-in transitions
        expect(await unreachable(page, o.root)).toEqual([]);
      });
    }
  });
}
