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

  test('typing a query and submitting opens Document Search with that query', async ({
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

  test('submitting an empty query still opens Document Search, with no ?q=', async ({
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
    { width: 390, height: 844, label: 'mobile' },
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
    expect(await target('Documents')).toBe(String(baseline.liveCount));
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
    const { byGroup, liveAlertCount } = loadRegisterDetail();
    const segN = (byGroup.segment || []).length;

    async function rowTarget(label) {
      const row = page.locator('.stat-row').filter({ hasText: label });
      return row.locator('[data-target]').getAttribute('data-target');
    }

    expect(await rowTarget('Documents in Force')).toBe(String(baseline.liveCount));
    expect(await rowTarget('Business Segments')).toBe(String(segN));
    expect(await rowTarget('Active Technical Alerts')).toBe(String(liveAlertCount));
    expect(await rowTarget('Awaiting QMS Approval')).toBe(String(baseline.draftCount));
  });
});


// The redesign: the RISE logo in the bar (tests/brand.spec.js covers it
// across pages), and the three ways in (and only three) lifted onto the
// hero, each saying what it is for.
test.describe('Home redesign', () => {
  test('the bar carries the RISE logo, not the old TAQA + TechHub lockup', async ({ page, gotoApp }) => {
    await gotoApp('/index.html');
    await expect(page.locator('#navbar .nav-brand img')).toHaveAttribute('alt', 'RISE');
    await expect(page.locator('#navbar .nav-subtitle')).toHaveCount(0);
  });

  test('the three ways in carry a purpose and nothing else joins them', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');
    const doors = page.locator('.doors-strip .door-card');
    await expect(doors).toHaveCount(3);
    await expect(doors.locator('.door-kicker')).toHaveText(['Discover knowledge', 'Ask people', 'Understand field language']);
    await expect(doors.nth(0)).toHaveAttribute('href', '#segments');
    await expect(doors.nth(1)).toHaveAttribute('href', 'support-ticket.html');
    await expect(doors.nth(2)).toHaveAttribute('href', 'glossary.html');
  });
});
