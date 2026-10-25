// Regression suite for index.html (the home page) specifically. Navigation
// chrome shared with every other page is covered by navigation.spec.js;
// this file is the hero, the search box, the "Explore by Discipline" area
// cards, the recently-visited strip and the page's own figures.
//
// Every count asserted here is derived at test time from computeBaseline()
// (tests/helpers/baseline.js) or from tests/helpers/areaGroups.js, which
// reads the same register files the same way, not typed in by hand. See
// those files for why a plain areaCount is not what the page renders:
// index.html's three beds ("Explore by Discipline") only cover the
// segment/function/product groups, the same subset shared.js's Areas
// dropdown uses, excluding Company Wide (shown separately, as the "cap
// rock" policies panel) and any area still "Pending Reassignment".
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');
const { computeBaseline } = require('./helpers/baseline');
const { loadRegisterDetail } = require('./helpers/areaGroups');

// index.html ships a first-visit onboarding tour (#tour-backdrop, gated on
// localStorage['taqa-tour-done']) whose backdrop covers the whole viewport
// and intercepts clicks until dismissed. A fresh Playwright context (and
// clearAppState()) has no storage, so it would otherwise pop up and block
// every click in this file. addInitScript reapplies the "done" flag on
// every navigation this test makes, including the reload after
// clearAppState(), so these tests exercise the real page, not the tour.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('taqa-tour-done', '1');
    } catch (e) {}
  });
});

test.describe('Hero', () => {
  test('renders the headline and a working search box', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');

    await expect(page.locator('.hero h1')).toBeVisible();
    await expect(page.locator('.hero h1')).toContainText('Knowledge Is Better Together');
    await expect(page.locator('#hero-search-input')).toBeVisible();
    await expect(page.locator('#hero-search-btn')).toBeVisible();
  });

  test('typing a query and submitting opens Search with that query', async ({
    page,
    gotoApp,
    clearAppState,
  }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');

    await page.locator('#hero-search-input').fill('coiled tubing safety');
    await page.locator('#hero-search-btn').click();

    await expect(page).toHaveURL(/\/ai-search\.html\?q=/);
    // ai-search.html prefills #query-input from ?q= on load (its own
    // "Prefill from URL" script), so the query actually reached the page.
    await expect(page.locator('#query-input')).toHaveValue('coiled tubing safety');
  });

  test('submitting an empty query still opens Search, with no ?q=', async ({
    page,
    gotoApp,
    clearAppState,
  }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');
    await page.locator('#hero-search-btn').click();
    await expect(page).toHaveURL(/\/ai-search\.html$/);
  });

  test('pressing Enter in the search box also submits', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');
    const input = page.locator('#hero-search-input');
    await input.fill('BOP');
    await input.press('Enter');
    await expect(page).toHaveURL(/\/ai-search\.html\?q=BOP/);
  });
});

test.describe('Area cards ("Explore by Discipline")', () => {
  test('render one card per segment/function/product area, matching the register', async ({
    page,
    gotoApp,
    clearAppState,
  }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');

    const { byGroup } = loadRegisterDetail();
    const expectedCount =
      (byGroup.segment || []).length + (byGroup.function || []).length + (byGroup.product || []).length;

    // Rows for a closed bed stay in the DOM (visibility:hidden, not
    // removed), so a plain count sees every card regardless of which bed
    // is open on arrival.
    const cards = page.locator('#st-beds a.st-row');
    await expect(cards).toHaveCount(expectedCount);
  });

  test('clicking a card navigates to segment.html?id=<that area>', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');

    const segLayer = page.locator('#focus .st-layer[data-k="seg"]');
    if ((await segLayer.getAttribute('data-open')) !== 'true') {
      await page.locator('#focus .st-head[data-group="seg"]').click();
      await expect(segLayer).toHaveAttribute('data-open', 'true');
    }

    const firstCard = segLayer.locator('a.st-row').first();
    const href = await firstCard.getAttribute('href');
    const id = new URLSearchParams(href.split('?')[1]).get('id');
    expect(id).toBeTruthy();

    await firstCard.click();
    // segment.html defaults to the "sops" tab and records that in the URL
    // via history.replaceState (its own startTab logic), so the query
    // string can grow a &tab=... after landing. Only the id is this test's
    // concern, so it is checked via URLSearchParams on page.url() (a plain
    // Playwright-tracked value, no in-page evaluate needed) rather than an
    // end-anchored regex.
    await expect(page).toHaveURL(/segment\.html\?/);
    const landedId = new URL(page.url()).searchParams.get('id');
    expect(landedId).toBe(id);
  });

  test('each bed reports the same document count the register has for that group', async ({
    page,
    gotoApp,
    clearAppState,
  }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');

    const { byGroup } = loadRegisterDetail();
    const segCount = (byGroup.segment || []).length;
    const segHead = page.locator('#focus .st-head[data-group="seg"]');
    await expect(segHead.locator('.st-stat').first()).toContainText(String(segCount));
  });
});

test.describe('Recently visited', () => {
  // Removed at the owner's request: the home page shows no Recently visited
  // strip, even for someone with an old list saved, and opening an area no
  // longer records one.
  test('never shows, even with an old list saved, and visiting an area records nothing', async ({
    page,
    gotoApp,
    clearAppState,
    consoleErrors,
  }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => {
      localStorage.setItem('taqa-recent', JSON.stringify([{ id: 'coiled-tubing', name: 'Coiled Tubing', tag: 'Operations' }]));
    });
    await gotoApp('/index.html');
    await expect(page.locator('.rv-strip')).toHaveCount(0);
    await expect(page.getByText('Recently visited', { exact: false })).toHaveCount(0);

    await page.evaluate(() => localStorage.removeItem('taqa-recent'));
    await gotoApp('/segment.html?id=drilling');
    expect(await page.evaluate(() => localStorage.getItem('taqa-recent'))).toBeNull();
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('Viva Engage / community link', () => {
  test('has the right destination and safe rel attributes for a new tab', async ({
    page,
    gotoApp,
    clearAppState,
  }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');

    const link = page.locator('a.hero-label');
    await expect(link).toHaveAttribute('href', /^https:\/\/engage\.cloud\.microsoft\//);
    await expect(link).toHaveAttribute('target', '_blank');
    const rel = (await link.getAttribute('rel')) || '';
    expect(rel.split(/\s+/)).toContain('noopener');
  });
});

test.describe('Responsive layout', () => {
  const VIEWPORTS = [
    { width: 1440, height: 900, label: 'desktop' },
    { width: 1281, height: 800, label: 'laptop' },
    { width: 1024, height: 768, label: 'tablet landscape' },
    { width: 768, height: 1024, label: 'tablet' },
    { width: 390, height: 844, label: 'mobile' },
    { width: 320, height: 640, label: 'small phone' },
  ];

  for (const vp of VIEWPORTS) {
    test(`no horizontal scroll at ${vp.label} (${vp.width}x${vp.height})`, async ({
      page,
      gotoApp,
      clearAppState,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoApp('/index.html');
      await clearAppState();
      await gotoApp('/index.html');

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(vp.width + 1);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  }
});

test.describe('Homepage counts come from the register, not a hardcoded number', () => {
  test('the stats strip (Documents / Segments / Functions / Products) matches the real data', async ({
    page,
    gotoApp,
    clearAppState,
  }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');

    const baseline = computeBaseline();
    const { byGroup } = loadRegisterDetail();
    const segN = (byGroup.segment || []).length;
    const fnN = (byGroup.function || []).length;
    const ptN = (byGroup.product || []).length;

    async function target(label) {
      const item = page.locator('.stats-strip-item').filter({ hasText: label });
      return item.locator('[data-target]').getAttribute('data-target');
    }

    // paint() (index.html's own script) runs synchronously via
    // TAQA_STORE.onChange, setting data-target before the counter
    // animation starts, so this does not need to wait for the animation.
    // Home opens as an Employee, who is told only about documents they may
    // open: no restricted or confidential document is counted (BD-03, PI-27).
    expect(await target('Documents')).toBe(String(baseline.liveCountFor.employee));
    expect(await target('Operational Segments')).toBe(String(segN));
    expect(await target('Corporate Functions')).toBe(String(fnN));
    expect(await target('Products & Technology')).toBe(String(ptN));
  });

  test('the hero stats panel (Platform Overview) matches the real data', async ({
    page,
    gotoApp,
    clearAppState,
  }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');

    const baseline = computeBaseline();
    const { byGroup } = loadRegisterDetail();
    const segN = (byGroup.segment || []).length;

    async function rowTarget(label) {
      const row = page.locator('.stat-row').filter({ hasText: label });
      return row.locator('[data-target]').getAttribute('data-target');
    }

    // As an Employee (Home's default role): what they may open (BD-03, PI-27).
    expect(await rowTarget('Documents in Force')).toBe(String(baseline.liveCountFor.employee));
    expect(await rowTarget('Business Segments')).toBe(String(segN));
    expect(await rowTarget('Active Technical Alerts')).toBe(String(baseline.liveFor('employee').filter((d) => d.docType === 'alert').length));
    expect(await rowTarget('Awaiting QMS Approval')).toBe(String(baseline.pendingCountFor.employee));
  });
});

// ── Home, as before ─────────────────────────────────────────────────────
// The owner asked for the home they had before the redesign back: the photo
// fills the first screen and pans slowly, "Knowledge Is Better Together."
// sits in the middle of it with the hashtag above and the promise in
// italic below, the search is the one action, and the three ways in, the
// figures and the segments follow below. A cue at the foot of the photo
// takes you down to the segments, which arrive one after another. What
// landed after that version stays: the RISE logo (tests/brand.spec.js),
// the roles and the desk, the tour, bookmarks and the Recognition badge.

/** Where the parts of the page sit, measured in the browser. */
async function layout(page) {
  return page.evaluate(() => {
    const box = (s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height };
    };
    return {
      vh: window.innerHeight,
      vw: document.documentElement.clientWidth,
      scrollW: document.documentElement.scrollWidth,
      hero: box('.hero-wrap'),
      h1: box('.hero h1'),
      search: box('#hero-search'),
      cue: box('#hero-cue'),
      doors: box('.doors-strip'),
      stats: box('.stats-strip'),
      explore: box('#explore'),
    };
  });
}

test.describe('Home, as before: full screen, moving, the segments one scroll below', () => {
  test('the bar carries the RISE logo, not the old TAQA + TechHub lockup', async ({ page, gotoApp }) => {
    await gotoApp('/index.html');
    await expect(page.locator('#navbar .nav-brand img:visible')).toHaveAttribute('alt', 'RISE');
    await expect(page.locator('#navbar .nav-subtitle')).toHaveCount(0);
  });

  test('the photo fills the first screen, pans slowly, and the slogan sits in the middle of it', async ({ page, gotoApp }) => {
    await gotoApp('/index.html');
    const m = await layout(page);
    expect(m.hero.top).toBe(0);
    expect(m.hero.height).toBeGreaterThanOrEqual(m.vh - 1);
    // Vertically centred, not at the top of a short band.
    const mid = (m.h1.top + m.h1.bottom) / 2;
    expect(mid).toBeGreaterThan(m.vh * 0.25);
    expect(mid).toBeLessThan(m.vh * 0.65);
    expect(m.search.bottom).toBeLessThan(m.cue.top);
    expect(m.cue.bottom).toBeLessThanOrEqual(m.vh);
    // The slow pan (Ken Burns) is back on the photo.
    expect(await page.locator('#hero-layer-a').evaluate((el) => getComputedStyle(el).animationName)).toBe('heroKenBurns');
  });

  test('the slogan reads as before: hashtag above, "Better Together." in teal, the promise in italic', async ({ page, gotoApp }) => {
    await gotoApp('/index.html');
    const tag = page.locator('.hero-left > a.hero-label');
    await expect(tag).toHaveText('#BetterTogether@TAQA');
    const look = await page.evaluate(() => {
      const h1 = document.querySelector('.hero h1');
      const spans = h1.querySelectorAll(':scope > span');
      const tagEl = document.querySelector('.hero-left > a.hero-label');
      return {
        tagFirst: !!(tagEl.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING),
        lead: spans[0].textContent.replace(/ /g, ' ').trim(),
        teal: spans[1].textContent,
        tealColour: getComputedStyle(spans[1]).color,
        sub: spans[2].textContent,
        subStyle: getComputedStyle(spans[2]).fontStyle,
        oneLine: Math.abs(spans[0].getBoundingClientRect().top - spans[1].getBoundingClientRect().top) < 2,
        wide: window.innerWidth >= 700,
      };
    });
    expect(look.tagFirst).toBe(true);
    expect(look.lead).toBe('Knowledge Is');
    expect(look.teal).toBe('Better Together.');
    expect(look.tealColour).toBe('rgb(0, 187, 182)');
    expect(look.sub).toBe('Every Answer, Within Reach.');
    expect(look.subStyle).toBe('italic');
    // One line on a wide screen, as before; a phone wraps it.
    if (look.wide) expect(look.oneLine).toBe(true);
    // The redesign's pieces are gone: the grid lines, the "RISE" eyebrow,
    // the separate subline, and the kickers and arrows on the cards.
    await expect(page.locator('.hero-lines, .th-lines, .hero-eyebrow, .hero-sub, .door-kicker, .door-go')).toHaveCount(0);
  });

  test('the three ways in sit below the photo as a quiet strip, then the figures, then the segments', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');
    const doors = page.locator('.doors-strip .door-card');
    await expect(doors).toHaveCount(3);
    await expect(doors.locator('.door-title')).toHaveText(['Browse by Area', 'Ask an Expert', 'Field Glossary']);
    await expect(doors.nth(0)).toHaveAttribute('href', '#segments');
    await expect(doors.nth(1)).toHaveAttribute('href', 'support-ticket.html');
    await expect(doors.nth(2)).toHaveAttribute('href', 'glossary.html');
    const m = await layout(page);
    expect(m.doors.top).toBeGreaterThanOrEqual(m.hero.bottom - 1);
    expect(m.stats.top).toBeGreaterThan(m.doors.top);
    expect(m.explore.top).toBeGreaterThan(m.stats.top);
    // Nothing lifted onto the photo: the strip is not pulled up over it.
    expect(await page.locator('.doors-strip').evaluate((el) => getComputedStyle(el).marginTop)).toBe('0px');
  });

  test('the cue at the foot of the photo takes you down to the segments', async ({ page, gotoApp, consoleErrors }) => {
    await gotoApp('/index.html');
    const cue = page.locator('#hero-cue');
    await expect(cue).toBeVisible();
    await expect(cue).toHaveAttribute('href', '#explore');
    await expect(cue).toHaveText('Explore the segments');
    const m = await layout(page);
    expect(m.cue.top).toBeGreaterThan(m.vh * 0.6);
    // Centred under the words.
    expect(Math.abs((m.cue.left + m.cue.right) / 2 - m.vw / 2)).toBeLessThan(4);
    // The chevron drifts.
    expect(await page.locator('.hero-cue-ring svg').evaluate((el) => getComputedStyle(el).animationName)).toBe('heroCueDrift');

    await cue.click();
    await expect(page).toHaveURL(/#explore$/);
    // Lands with the segments just under the fixed bar.
    const cover = await page.evaluate(() => (window.TAQA_TOP ? TAQA_TOP() : 64));
    const exploreTop = () => page.evaluate(() => Math.round(document.getElementById('explore').getBoundingClientRect().top));
    await expect.poll(exploreTop, { timeout: 5000 }).toBeLessThan(cover + 60);
    // Settled, not still on its way past the bar.
    await page.waitForTimeout(400);
    expect(await exploreTop()).toBeGreaterThanOrEqual(cover - 2);
    expect(await exploreTop()).toBeLessThan(cover + 60);
    await expect(page.locator('#focus')).toHaveClass(/active/);
    await expect(page.locator('#focus .st-head[data-group="seg"]')).toBeInViewport();
    // The bar is no longer the glass over the photo, and the cue has gone with the photo.
    await expect(page.locator('#navbar')).not.toHaveClass(/nav-on-hero/);
    assertNoConsoleErrors(consoleErrors);
  });

  test('the cue works from the keyboard and shows the band\'s own focus ring', async ({ page, gotoApp }) => {
    await gotoApp('/index.html');
    const cue = page.locator('#hero-cue');
    await cue.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(cue).toBeFocused();
    const ring = await cue.evaluate((el) => { const cs = getComputedStyle(el); return cs.outlineStyle + ' ' + cs.outlineColor; });
    expect(ring).toBe('solid rgb(0, 187, 182)');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#explore$/);
    await expect(page.locator('#focus')).toHaveClass(/active/);
  });

  test('the segments arrive one after another as they come into view', async ({ page, gotoApp }) => {
    // Record each part the page animates, in the order and with the delay it asks for.
    await page.addInitScript(() => {
      const animate = Element.prototype.animate;
      window.__staggerLog = [];
      Element.prototype.animate = function (keyframes, options) {
        if (this.closest && this.closest('#focus')) {
          window.__staggerLog.push({ cls: String(this.className), tag: this.tagName, delay: options && options.delay });
        }
        return animate.call(this, keyframes, options);
      };
    });
    await gotoApp('/index.html');
    const focus = page.locator('#focus');
    // Below the first screen on arrival, so not yet shown.
    await expect(focus).not.toHaveClass(/active/);
    expect(await page.evaluate(() => window.__staggerLog.length)).toBe(0);

    await page.locator('#explore').scrollIntoViewIfNeeded();
    await expect(focus).toHaveClass(/active/);
    const log = await page.evaluate(() => window.__staggerLog);
    // The policies first, then each of the three groups, with any open
    // group's areas between its heading and the next group.
    expect(log[0].cls).toContain('st-cap');
    expect(log.filter((x) => x.tag === 'H3')).toHaveLength(3);
    for (let i = 1; i < log.length; i++) expect(log[i].delay).toBeGreaterThan(log[i - 1].delay);
    expect(Number(await focus.getAttribute('data-staggered'))).toBe(log.length);
    // And every part ends fully shown.
    await expect
      .poll(() => page.evaluate(() => [...document.querySelectorAll('#focus .st-cap, #focus .st-layer > .st-h, #focus .st-layer[data-open="true"] .st-members > li')]
        .every((el) => getComputedStyle(el).opacity === '1')), { timeout: 5000 })
      .toBe(true);
  });

  test('the words lift and fade as the page leaves the photo, and are back as drawn at the top', async ({ page, gotoApp }) => {
    await gotoApp('/index.html');
    const hero = page.locator('#hero');
    await page.evaluate(() => window.scrollTo({ top: Math.round(window.innerHeight * 0.4), behavior: 'instant' }));
    await expect.poll(() => hero.evaluate((el) => Number(el.style.opacity || 1))).toBeLessThan(1);
    expect(await hero.evaluate((el) => el.style.transform)).toMatch(/translate3d\(0px, -\d/);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect.poll(() => hero.evaluate((el) => el.style.opacity + '|' + el.style.transform)).toBe('|');
  });

  test('once the photo is off screen its pan and the cue\'s drift rest, and pick up again on the way back', async ({ page, gotoApp }) => {
    await gotoApp('/index.html');
    const states = () => page.evaluate(() => [document.querySelector('.hero-bg-layer'), document.querySelector('.hero-cue-ring svg')]
      .map((el) => getComputedStyle(el).animationPlayState).join(' '));
    expect(await states()).toBe('running running');
    await page.evaluate(() => window.scrollTo({ top: document.querySelector('.hero-wrap').offsetHeight + 40, behavior: 'instant' }));
    await expect.poll(states).toBe('paused paused');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect.poll(states).toBe('running running');
  });

  test('the cue is left off a printout', async ({ page, gotoApp }) => {
    await gotoApp('/index.html');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#hero-cue')).toBeHidden();
  });

  test('Tools & services: Search in plain words, then Field cases and the Pre-job pack', async ({ page, gotoApp }) => {
    await gotoApp('/index.html');
    const tools = page.locator('.sidebar-tools a.sidebar-tool-compact');
    await expect(tools.locator('.sidebar-tool-compact-title')).toHaveText(['Search', 'Field cases', 'Pre-job pack', 'Ask an Expert']);
    expect(await tools.evaluateAll((as) => as.map((a) => a.getAttribute('href')))).toEqual(['ai-search.html', 'cases.html', 'prejob.html', 'support-ticket.html']);
    // Same look as the tools already there.
    const shapes = await tools.evaluateAll((as) => as.map((a) => getComputedStyle(a).display + ' ' + getComputedStyle(a).borderRadius));
    expect(new Set(shapes).size).toBe(1);
    // No AI claim anywhere on the page a person reads.
    expect(await page.evaluate(() => document.body.innerText)).not.toMatch(/\bAI\b|AI-powered/);

    await page.locator('.sidebar-tools a[href="cases.html"]').click();
    await expect(page).toHaveURL(/\/cases\.html$/);
    await expect(page.locator('h1').first()).toBeVisible();
    await gotoApp('/index.html');
    await page.locator('.sidebar-tools a[href="prejob.html"]').click();
    await expect(page).toHaveURL(/\/prejob\.html$/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('dark theme: the photo band stays dark with white and teal words; the strip below follows the theme', async ({ page, gotoApp }) => {
    await page.addInitScript(() => { try { localStorage.setItem('taqa-theme-v3', 'dark'); } catch (e) {} });
    await gotoApp('/index.html');
    await expect(page.locator('html')).toHaveAttribute('data-taqa-theme', 'dark');
    const c = await page.evaluate(() => {
      const col = (s, p = 'color') => getComputedStyle(document.querySelector(s))[p];
      return {
        lead: col('.hero h1 .hero-h1-lead'),
        teal: col('.hero h1 > span:nth-child(2)'),
        cue: col('.hero-cue'),
        ground: col('.hero-wrap', 'backgroundColor'),
        strip: col('.doors-strip', 'backgroundColor'),
      };
    });
    expect(c.lead).toBe('rgb(255, 255, 255)');
    expect(c.teal).toBe('rgb(0, 187, 182)');
    expect(c.cue).toBe('rgba(255, 255, 255, 0.88)');
    expect(c.ground).toBe('rgb(0, 19, 20)');
    expect(c.strip).toBe('rgb(0, 35, 38)');
  });

  // A phone held sideways is short: the band is only as tall as its words
  // and the cue stays out of the way of the search.
  test('a short landscape screen keeps the search clear and drops the cue', async ({ page, gotoApp }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await gotoApp('/index.html');
    await expect(page.locator('#hero-cue')).toBeHidden();
    await expect(page.locator('#hero-search-input')).toBeInViewport();
  });

  const SCREENS = [
    { width: 1440, height: 900 },
    { width: 1281, height: 800 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 320, height: 640 },
  ];
  for (const vp of SCREENS) {
    test(`fills the first screen at ${vp.width}x${vp.height}, with the cue clear of the search`, async ({ page, gotoApp }) => {
      await page.setViewportSize(vp);
      await gotoApp('/index.html');
      const m = await layout(page);
      expect(m.scrollW).toBeLessThanOrEqual(vp.width);
      expect(m.hero.height).toBeGreaterThanOrEqual(vp.height - 1);
      expect(m.search.right).toBeLessThanOrEqual(vp.width);
      expect(m.cue.top).toBeGreaterThan(m.search.bottom);
      expect(m.cue.bottom).toBeLessThanOrEqual(vp.height);
      await expect(page.locator('#hero-cue')).toBeVisible();
      // The overview panel beside the slogan only where there is room for it, as before.
      await expect(page.locator('.hero-right')).toBeVisible({ visible: vp.width > 1024 });
    });
  }
});

test.describe('Home: reduced motion', () => {
  test('nothing moves: no pan, no drift, no stagger, no fade, and the cue still reaches the segments', async ({ page, gotoApp, consoleErrors }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoApp('/index.html');
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    expect(await page.locator('#hero-layer-a').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    expect(await page.locator('.hero-cue-ring svg').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    await expect(page.locator('#hero-cue')).toBeVisible();
    await page.locator('#hero-cue').click();
    await expect(page).toHaveURL(/#explore$/);
    await expect(page.locator('#focus')).toHaveClass(/active/);
    expect(await page.locator('#focus').getAttribute('data-staggered')).toBeNull();
    await expect(page.locator('#focus .st-head[data-group="seg"]')).toBeInViewport();
    expect(await page.locator('#hero').evaluate((el) => el.style.opacity + '|' + el.style.transform)).toBe('|');
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('Home opens cleanly for every role', () => {
  const ROLES = [['employee'], ['owner', 'drilling'], ['maintenance', 'drilling'], ['qms'], ['auditor']];
  for (const [role, area] of ROLES) {
    test(`${role}${area ? '@' + area : ''}: full-screen band, cue, segments, no console errors`, async ({ page, gotoApp, setRole, consoleErrors }) => {
      await gotoApp('/index.html');
      await setRole(role, area);
      await gotoApp('/index.html');
      const m = await layout(page);
      expect(m.hero.height).toBeGreaterThanOrEqual(m.vh - 1);
      await expect(page.locator('.hero h1')).toBeVisible();
      await page.locator('#hero-cue').click();
      await expect(page.locator('#focus')).toHaveClass(/active/);
      await expect(page.locator('.sidebar-tools a[href="cases.html"]')).toHaveCount(1);
      await expect(page.locator('.sidebar-tools a[href="prejob.html"]')).toHaveCount(1);
      assertNoConsoleErrors(consoleErrors);
    });
  }
});
