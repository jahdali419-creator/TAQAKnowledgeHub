// RISE branding: the supplied logo in the bar on every key page, light and
// dark, desktop and phone; the symbol-only icons for favicon, Apple touch
// and the PWA; and nothing left of the old TAQA + TechHub lockup.
//
// The logo is an image (assets/brand/), never text or CSS. These tests
// check it loads, is not distorted, and never collides with the bar's
// controls.

const { test, expect } = require('./helpers/fixtures');

const SEG = 'coiled-tubing';
const PAGES = [
  { name: 'Home', path: '/index.html' },
  { name: 'Field Glossary', path: '/glossary.html' },
  { name: 'Upload', path: '/upload.html' },
  { name: 'Segment', path: '/segment.html?id=' + SEG },
  { name: 'Maintenance side', path: '/segment.html?id=' + SEG + '&dept=maintenance' },
  { name: 'Dashboard', path: '/dashboard.html?id=' + SEG, role: 'owner' },
  { name: 'Master List', path: '/master-list.html', role: 'qms' },
  { name: 'Ask Expert', path: '/support-ticket.html' },
];
const LOGO_RATIO = 320 / 120; // rise-lockup-header.png

async function open(page, gotoApp, setRole, p, theme) {
  await gotoApp('/index.html');
  await page.evaluate((t) => { try { localStorage.setItem('taqa-theme-v3', t); } catch (e) {} }, theme);
  await setRole(p.role || 'employee', SEG);
  await gotoApp(p.path);
}

async function logoReport(page) {
  return page.evaluate(() => {
    const img = document.querySelector('#navbar .nav-brand img');
    const r = img.getBoundingClientRect();
    const boxes = [...document.querySelectorAll('#navbar .nav-right > *, #navbar .nav-hamburger, #navbar .nav-links')]
      .filter((el) => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && b.width > 0 && b.height > 0; })
      .map((el) => el.getBoundingClientRect());
    const overlap = boxes.some((b) => !(b.right <= r.left || b.left >= r.right || b.bottom <= r.top || b.top >= r.bottom));
    const cs = getComputedStyle(img);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    return {
      src: img.getAttribute('src'), alt: img.alt, complete: img.complete, natural: img.naturalWidth,
      ratio: (r.width - padX) / (r.height - padY), overlap, left: r.left, right: r.right,
      viewport: window.innerWidth, scrollW: document.documentElement.scrollWidth,
      plate: cs.backgroundColor,
    };
  });
}

test.describe('RISE logo in the bar', () => {
  for (const p of PAGES) {
    for (const theme of ['light', 'dark']) {
      test(`${p.name}, ${theme}: the RISE logo loads, undistorted, clear of the controls`, async ({ page, gotoApp, setRole }) => {
        await open(page, gotoApp, setRole, p, theme);
        const nav = page.locator('#navbar');
        await expect(nav.locator('.nav-brand img')).toHaveCount(1);
        await expect(nav.locator('.nav-brand img')).toBeVisible();
        await expect(nav.locator('.nav-subtitle')).toHaveCount(0);
        await expect(nav.locator('img[src*="taqa-logo"]')).toHaveCount(0);
        await page.waitForFunction(() => { const i = document.querySelector('#navbar .nav-brand img'); return i && i.complete && i.naturalWidth > 0; });
        const r = await logoReport(page);
        expect(r.src).toBe('assets/brand/rise-lockup-header.png');
        expect(r.alt).toBe('RISE');
        expect(Math.abs(r.ratio - LOGO_RATIO)).toBeLessThan(0.05);
        expect(r.overlap).toBe(false);
        expect(r.left).toBeGreaterThanOrEqual(0);
        expect(r.right).toBeLessThanOrEqual(r.viewport);
        expect(r.scrollW).toBeLessThanOrEqual(r.viewport);
        // Dark bar: the full-colour logo sits on a light plate, not recoloured.
        if (theme === 'dark') expect(r.plate).toBe('rgb(255, 255, 255)');
      });
    }
  }

  test('narrow phones (360 and 320): the logo still fits beside the bell, theme and menu', async ({ page, gotoApp, setRole }) => {
    for (const width of [360, 320]) {
      await page.setViewportSize({ width, height: 700 });
      await open(page, gotoApp, setRole, { path: '/dashboard.html?id=' + SEG, role: 'owner' }, 'light');
      await page.waitForFunction(() => { const i = document.querySelector('#navbar .nav-brand img'); return i && i.complete && i.naturalWidth > 0; });
      const r = await logoReport(page);
      expect(r.overlap, `overlap at ${width}px`).toBe(false);
      expect(r.right).toBeLessThanOrEqual(width);
      expect(r.scrollW).toBeLessThanOrEqual(width);
    }
  });

  test('over the home hero photo the logo sits on a light plate', async ({ page, gotoApp, setRole }) => {
    await open(page, gotoApp, setRole, { path: '/index.html' }, 'light');
    await expect(page.locator('#navbar')).toHaveClass(/nav-on-hero/);
    const r = await logoReport(page);
    expect(r.plate).toBe('rgb(255, 255, 255)');
    expect(r.overlap).toBe(false);
  });

  test('the home brand card shows the full RISE logo with WHAT WE KNOW.', async ({ page, gotoApp }) => {
    await gotoApp('/index.html');
    const img = page.locator('.sidebar-brand-card-name img');
    await expect(img).toHaveAttribute('src', 'assets/brand/rise-logo-640.png');
    await img.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const i = document.querySelector('.sidebar-brand-card-name img'); return i && i.complete && i.naturalWidth > 0; });
  });
});

test.describe('RISE icons and names', () => {
  test('favicon, Apple touch icon and manifest use the RISE symbol and name', async ({ page, gotoApp, request }) => {
    await gotoApp('/index.html');
    await expect(page).toHaveTitle('RISE: What We Know');
    await expect(page.locator('link[rel="icon"][href="icons/rise-favicon-32.png"]')).toHaveCount(1);
    await expect(page.locator('link[rel="icon"][href$=".svg"]')).toHaveCount(0);
    await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', 'RISE');
    const manifest = await (await request.get('/manifest.json')).json();
    expect(manifest.name).toBe('RISE: What We Know');
    expect(manifest.short_name).toBe('RISE');
    const files = ['icons/rise-favicon-16.png', 'icons/rise-favicon-32.png', 'icons/rise-apple-touch-icon.png',
      'assets/brand/rise-lockup-header.png', 'assets/brand/rise-logo-640.png']
      .concat(manifest.icons.map((i) => i.src));
    for (const f of files) {
      const res = await request.get('/' + f);
      expect(res.status(), f).toBe(200);
      expect(res.headers()['content-type'], f).toContain('image/png');
    }
    expect(manifest.icons.filter((i) => i.purpose === 'maskable')).toHaveLength(2);
  });

  test('no page title or install prompt still says TechHub or TAQA Knowledge Hub', async ({ page, gotoApp }) => {
    for (const p of PAGES.filter((x) => !x.role)) {
      await gotoApp(p.path);
      const t = await page.title();
      expect(t, p.path).not.toMatch(/TechHub|TAQA Knowledge Hub/);
      expect(await page.locator('#navbar').innerText(), p.path).not.toMatch(/TechHub/);
    }
  });
});
