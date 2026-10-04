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

async function seedQms(page, gotoApp) {
  await gotoApp('/index.html');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('taqa-tour-done', '1');
    TAQA_ROLE.set('employee');
    ['coiled-tubing', 'drilling'].forEach((s) => TAQA_STORE.add({
      title: 'APP ' + s + ' procedure', segment: s, docType: 'sop', docNumber: 'TQ-APP-' + s, summary: 'Installed app bell check.',
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
