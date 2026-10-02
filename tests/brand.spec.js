// RISE branding: the supplied logo in the bar on every key page, light and
// dark, desktop and phone; the symbol-only icons for favicon, Apple touch
// and the PWA; and nothing left of the old TAQA + TechHub lockup.
//
// The logo is an image (assets/brand/), never text or CSS. A light bar shows
// the full-colour logo; a dark bar (dark theme, or the glass bar over the
// home hero) shows the reverse logo. Both sit on a transparent ground, with
// no plate. These tests check the right one shows, loads, is not distorted,
// and never collides with the bar's controls.

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
const LOGO_RATIO = 320 / 120; // rise-lockup-header(-reverse).png
const LIGHT = 'assets/brand/rise-lockup-header.png';
const REVERSE = 'assets/brand/rise-lockup-header-reverse.png';
const VISIBLE = '#navbar .nav-brand img:visible';
const loaded = (page) => page.waitForFunction(() => {
  const i = [...document.querySelectorAll('#navbar .nav-brand img')].find((x) => x.offsetParent !== null);
  return i && i.complete && i.naturalWidth > 0;
});

async function open(page, gotoApp, setRole, p, theme) {
  await gotoApp('/index.html');
  await page.evaluate((t) => { try { localStorage.setItem('taqa-theme-v3', t); } catch (e) {} }, theme);
  await setRole(p.role || 'employee', SEG);
  await gotoApp(p.path);
}

async function logoReport(page) {
  return page.evaluate(() => {
    const imgs = [...document.querySelectorAll('#navbar .nav-brand img')].filter((x) => x.offsetParent !== null);
    const img = imgs[0];
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
      plate: cs.backgroundColor, visibleCount: imgs.length,
      onHero: document.getElementById('navbar').classList.contains('nav-on-hero'),
    };
  });
}

test.describe('RISE logo in the bar', () => {
  for (const p of PAGES) {
    for (const theme of ['light', 'dark']) {
      test(`${p.name}, ${theme}: the RISE logo loads, undistorted, clear of the controls`, async ({ page, gotoApp, setRole }) => {
        await open(page, gotoApp, setRole, p, theme);
        const nav = page.locator('#navbar');
        await expect(nav.locator('.nav-brand img')).toHaveCount(2);
        await expect(page.locator(VISIBLE)).toHaveCount(1);
        await expect(nav.locator('.nav-subtitle')).toHaveCount(0);
        await expect(nav.locator('img[src*="taqa-logo"]')).toHaveCount(0);
        await loaded(page);
        const r = await logoReport(page);
        // Dark theme or the glass bar over the hero: reverse; otherwise full colour.
        expect(r.src).toBe(theme === 'dark' || r.onHero ? REVERSE : LIGHT);
        expect(r.alt).toBe('RISE');
        expect(Math.abs(r.ratio - LOGO_RATIO)).toBeLessThan(0.05);
        expect(r.overlap).toBe(false);
        expect(r.left).toBeGreaterThanOrEqual(0);
        expect(r.right).toBeLessThanOrEqual(r.viewport);
        expect(r.scrollW).toBeLessThanOrEqual(r.viewport);
        // Transparent ground in every state: no plate behind the logo.
        expect(r.plate).toBe('rgba(0, 0, 0, 0)');
      });
    }
  }

  test('narrow phones (360 and 320): the logo still fits beside the bell, theme and menu', async ({ page, gotoApp, setRole }) => {
    for (const width of [360, 320]) {
      await page.setViewportSize({ width, height: 700 });
      await open(page, gotoApp, setRole, { path: '/dashboard.html?id=' + SEG, role: 'owner' }, 'light');
      await loaded(page);
      const r = await logoReport(page);
      expect(r.overlap, `overlap at ${width}px`).toBe(false);
      expect(r.right).toBeLessThanOrEqual(width);
      expect(r.scrollW).toBeLessThanOrEqual(width);
    }
  });

  test('home: reverse logo over the hero, full-colour logo once the bar turns light on scroll', async ({ page, gotoApp, setRole }) => {
    await open(page, gotoApp, setRole, { path: '/index.html' }, 'light');
    await expect(page.locator('#navbar')).toHaveClass(/nav-on-hero/);
    await loaded(page);
    let r = await logoReport(page);
    expect(r.src).toBe(REVERSE);
    expect(r.plate).toBe('rgba(0, 0, 0, 0)');
    expect(r.overlap).toBe(false);
    await page.evaluate(() => window.scrollTo(0, 1400));
    await expect(page.locator('#navbar')).not.toHaveClass(/nav-on-hero/);
    await loaded(page);
    r = await logoReport(page);
    expect(r.src).toBe(LIGHT);
    expect(r.visibleCount).toBe(1);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator('#navbar')).toHaveClass(/nav-on-hero/);
    expect((await logoReport(page)).src).toBe(REVERSE);
  });

  test('the reverse logo keeps the orange and cyan exactly and turns only the dark teal white', async ({ page, gotoApp }) => {
    // Pixel check on the shipped header files: the same orange and cyan sample
    // points in both, and the RISE "R" dark teal in one and white in the other.
    await gotoApp('/index.html');
    const px = await page.evaluate(async (files) => {
      const read = (src) => new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => {
          const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
          const g = c.getContext('2d'); g.drawImage(im, 0, 0);
          const at = (x, y) => [...g.getImageData(x, y, 1, 1).data];
          res({ orange: at(26, 13), cyan: at(87, 34), letter: at(107, 84) });
        };
        im.onerror = rej; im.src = src;
      });
      return { light: await read(files[0]), rev: await read(files[1]) };
    }, [LIGHT, REVERSE]);
    const close = (a, b) => a.slice(0, 3).every((v, i) => Math.abs(v - b[i]) <= 3);
    expect(close(px.light.orange, px.rev.orange), JSON.stringify(px)).toBe(true);
    expect(close(px.light.cyan, px.rev.cyan), JSON.stringify(px)).toBe(true);
    expect(px.light.orange[0]).toBeGreaterThan(200);
    expect(px.light.cyan[2]).toBeGreaterThan(150);
    expect(px.light.letter.slice(0, 3).reduce((a, b) => a + b)).toBeLessThan(200);
    expect(Math.min(...px.rev.letter.slice(0, 3))).toBeGreaterThan(235);
  });

  test('the home brand card shows the full reverse RISE logo straight on the card, no plate', async ({ page, gotoApp }) => {
    await gotoApp('/index.html');
    const img = page.locator('.sidebar-brand-card-name img');
    await expect(img).toHaveAttribute('src', 'assets/brand/rise-logo-reverse-640.png');
    await img.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const i = document.querySelector('.sidebar-brand-card-name img'); return i && i.complete && i.naturalWidth > 0; });
    const look = await img.evaluate((el) => {
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      return { bg: cs.backgroundColor, pad: cs.padding, ratio: r.width / r.height };
    });
    expect(look.bg).toBe('rgba(0, 0, 0, 0)');
    expect(look.pad).toBe('0px');
    expect(Math.abs(look.ratio - 637 / 264)).toBeLessThan(0.03);
    // The file itself is transparent around the artwork (no baked-in box).
    const corner = await page.evaluate(async () => {
      const im = new Image(); im.src = 'assets/brand/rise-logo-reverse-640.png'; await im.decode();
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      return [g.getImageData(c.width - 2, 2, 1, 1).data[3], g.getImageData(2, c.height - 2, 1, 1).data[3]];
    });
    expect(corner).toEqual([0, 0]);
  });
});

test.describe('RISE icons and names', () => {
  test('favicon, Apple touch icon and manifest use the RISE symbol and name', async ({ page, gotoApp, request }) => {
    await gotoApp('/index.html');
    await expect(page).toHaveTitle('RISE — What We Know');
    await expect(page.locator('link[rel="icon"][href="icons/rise-favicon-32.png"]')).toHaveCount(1);
    await expect(page.locator('link[rel="icon"][href$=".svg"]')).toHaveCount(0);
    await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', 'RISE');
    await expect(page.locator('meta[name="application-name"]')).toHaveAttribute('content', 'RISE');
    const manifest = await (await request.get('/manifest.json')).json();
    expect(manifest.name).toBe('RISE — What We Know');
    expect(manifest.short_name).toBe('RISE');
    const files = ['icons/rise-favicon-16.png', 'icons/rise-favicon-32.png', 'icons/rise-apple-touch-icon.png',
      'assets/brand/rise-lockup-header.png', 'assets/brand/rise-lockup-header-reverse.png', 'assets/brand/rise-logo-reverse-640.png']
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
      expect(await page.content(), p.path).not.toMatch(/TechHub Platform/);
    }
  });
});
