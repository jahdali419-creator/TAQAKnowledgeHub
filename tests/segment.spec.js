// segment.html, an area's document library.
//
// segment.html keeps its OWN copy of segment metadata (icon/tag/description)
// as a literal `SEGMENTS` object in its inline script, but an IIFE right
// after it (see "The register decides what this area holds") rebuilds every
// entry's counts and document lists from TAQA_DOC_LOOKUPS.segments +
// TAQA_STORE.all(), for every id the register knows about, 'company'
// included. So the numbers this page shows are always the live register's,
// never the literal object's stale copy, and every one of the register's 26
// areas gets a working page even though only some of them have hand-written
// page copy (icon/description).
//
// An id with no entry in TAQA_DOC_LOOKUPS.segments (the register's own
// lookup table) used to silently render as Drilling's library under the
// wrong id. The fix (see the "An unknown id..." comment in segment.html)
// makes SEG_KNOWN explicit and renders an honest "Area not found" state
// instead, with no JS error and no page frozen mid-render.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');
const { computeBaseline } = require('./helpers/baseline');

const BASE = computeBaseline();

// One id from each real area family, plus 'company' specifically: 'company'
// has no hand-written entry in segment.html's literal SEGMENTS object at
// all (it is built entirely from the register by the IIFE), and was the
// area whose display name/description this session's earlier bug fix
// targeted (segments-data.js was missing it; segment.html's own dynamic
// build was already correct, but it is exactly the kind of area-family edge
// case worth covering here rather than assuming it behaves like the rest).
const FAMILIES = [
  { id: 'coiled-tubing', group: 'segment' },
  { id: 'qhse', group: 'function' },
  { id: 'pt-drilling-coe', group: 'product' },
  { id: 'company', group: 'company' },
];

for (const { id, group } of FAMILIES) {
  test(`sanity: ${id} is a real, non-empty area of group '${group}'`, () => {
    expect(BASE.areaIds).toContain(id);
    expect(BASE.countsByArea[id]).toBeGreaterThan(0);
  });
}

// ── Unknown / malformed area id ──────────────────────────────────────────
test.describe('unknown or malformed area id degrades gracefully', () => {
  test('a made-up id shows an explicit "Area not found" state, not a blank or wrong page', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/segment.html?id=totally-bogus-area-xyz');

    // Named after the unknown id, not silently aliased to another real area
    // (the bug this fix replaced: an unknown id used to render as Drilling).
    await expect(page.locator('#seg-name')).toHaveText('Area not found');
    await expect(page.locator('#seg-desc')).toContainText('totally-bogus-area-xyz');
    // page.title() rather than the <title> element locator: this sandbox's
    // gotoApp occasionally races a phantom extra navigation (see the header
    // comment in tests/helpers/fixtures.js), which can leave the <title>
    // locator observing a transient empty value mid-poll even though the
    // document's real title is already correct; page.title() reads the
    // current title directly instead of polling the DOM node.
    await expect.poll(() => page.title()).toMatch(/Area not found/);

    // The controls that only make sense for a real area (manage button, tab
    // bar, copy-link, pagination) are hidden via the seg-unknown state, not
    // left dangling and broken.
    await expect(page.locator('.tabs-outer')).toBeHidden();
    await expect(page.locator('#manage-btn')).toBeHidden();

    // The default-active panel explains itself instead of claiming zero
    // documents were "issued" for a place that does not exist.
    const panel = page.locator('#panel-sops .empty-state');
    await expect(panel).toContainText('Choose an area');

    assertNoConsoleErrors(consoleErrors);
  });

  test('an id containing markup-like characters is not executed and still degrades safely', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    const dialogs = [];
    page.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss(); });

    await gotoApp('/index.html');
    await setRole('employee', 'coiled-tubing');
    await gotoApp('/segment.html?id=' + encodeURIComponent('<img src=x onerror=alert(1)>'));

    // seg.name is assigned via textContent (see "Area not found" fallback in
    // segment.html), so this can never execute regardless of the id's shape.
    await expect(page.locator('#seg-name')).toHaveText('Area not found');
    expect(dialogs, 'no script from the malformed id should ever execute').toEqual([]);
    assertNoConsoleErrors(consoleErrors);
  });

  test('no id param at all falls back to the documented default area (Drilling), not an unknown state', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await gotoApp('/index.html');
    await setRole('employee', 'coiled-tubing');
    await gotoApp('/segment.html');
    await expect(page.locator('#seg-name')).toHaveText('Drilling Services');
    await expect(page.locator('html')).not.toHaveClass(/seg-unknown/);
    assertNoConsoleErrors(consoleErrors);
  });
});

// ── Cross-family document counts ─────────────────────────────────────────
test.describe('document counts match the register across every area family', () => {
  for (const { id, group } of FAMILIES) {
    test(`${id} (${group}): header total and every tab count match TAQA_STORE + the register baseline`, async ({
      page,
      gotoApp,
      setRole,
      consoleErrors,
    }) => {
      await gotoApp('/index.html');
      await setRole('qms', id);
      await gotoApp('/segment.html?id=' + encodeURIComponent(id));

      // Cross-check #1: the same store query the rest of the app uses.
      const live = await page.evaluate((segId) => {
        const BUCKET = { sop: 'sops', manual: 'manuals', standard: 'policies', policy: 'policies',
                          alert: 'alerts', lesson: 'lessons', software: 'software' };
        const rows = TAQA_STORE.rows('live', { segment: segId });
        const byBucket = { sops: 0, manuals: 0, policies: 0, alerts: 0, lessons: 0 };
        rows.forEach((d) => { const k = BUCKET[d.docType]; if (k && k !== 'software') byBucket[k]++; });
        const software = TAQA_STORE.all().filter(
          (d) => d.segment === segId && !TAQA_STORE.isControlled(d) && d.status !== 'obsolete'
        ).length;
        return { total: rows.length, byBucket, software };
      }, id);

      // Cross-check #2: counts derived independently at test time from the
      // raw register files (tests/helpers/baseline.js), so a bug shared by
      // both the page and TAQA_STORE would still be caught.
      expect(live.total, `TAQA_STORE.rows('live',{segment:'${id}'}) vs baseline`).toBe(
        BASE.countsByArea[id]
      );

      const headerTotal = parseInt((await page.locator('#seg-total').textContent()).trim(), 10);
      expect(headerTotal, `${id} header total`).toBe(BASE.countsByArea[id]);
      expect(headerTotal, `${id} header total`).toBe(live.total);

      for (const [tab, key] of [
        ['tc-sops', 'sops'], ['tc-manuals', 'manuals'], ['tc-policies', 'policies'],
        ['tc-alerts', 'alerts'], ['tc-lessons', 'lessons'],
      ]) {
        const shown = parseInt((await page.locator('#' + tab).textContent()).trim(), 10);
        expect(shown, `${id} #${tab}`).toBe(live.byBucket[key]);
      }
      const softwareShown = parseInt((await page.locator('#tc-software').textContent()).trim(), 10);
      expect(softwareShown, `${id} #tc-software`).toBe(live.software);

      assertNoConsoleErrors(consoleErrors);
    });
  }
});

// ── Tabs / filters switch correctly ──────────────────────────────────────
test.describe('tabs switch to the right subset of documents', () => {
  test('clicking a tab shows only that type, and the visible count matches its own header count', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/segment.html?id=coiled-tubing');

    for (const tab of ['policies', 'sops', 'manuals', 'alerts', 'lessons']) {
      await page.locator(`#tab-bar .tab-btn[data-tab="${tab}"]`).click();
      const panel = page.locator('#panel-' + tab);
      await expect(panel).toHaveClass(/active/);
      // Every other panel is inactive at the same time (a real tab switch,
      // not an accordion that leaves the old panel open too).
      const otherActive = await page
        .locator('.tab-panel.active')
        .evaluateAll((els) => els.map((e) => e.id));
      expect(otherActive).toEqual(['panel-' + tab]);

      const visCount = parseInt((await page.locator('#vis-' + tab).textContent()).trim(), 10);
      const cardCount = await panel.locator('.doc-card').count();
      // Cards render async (skeleton -> real rows); wait for the async paint.
      await expect
        .poll(async () => panel.locator('.doc-card, .empty-state').count())
        .toBeGreaterThan(0);
      if (visCount > 0) {
        expect(await panel.locator('.doc-card').count()).toBeGreaterThan(0);
      } else {
        await expect(panel.locator('.empty-state')).toBeVisible();
      }
    }
    assertNoConsoleErrors(consoleErrors);
  });

  test("company's Policies tab reads 'Policies', not the shared 'Standards' label (the fixed edge case)", async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    // Company issues policies, not standards, so its tab is relabelled; every
    // operational segment keeps the shared "Standards" label. This is the
    // specific dynamic label rewrite in segment.html (see the "shared tab is
    // called Standards, which is wrong for Company Wide" comment).
    await gotoApp('/index.html');
    await setRole('qms', 'company');
    await gotoApp('/segment.html?id=company');

    const label = await page
      .locator('#tab-bar .tab-btn[data-tab="policies"]')
      .evaluate((btn) => (btn.firstChild.nodeType === 3 ? btn.firstChild.textContent : btn.textContent).trim());
    expect(label).toBe('Policies');

    // Company has no SOPs/manuals/alerts/lessons/software, and its group is
    // 'company' (not 'segment'), so those zero-count tabs are hidden rather
    // than shown empty (the CORE_TABS exemption only applies to group
    // 'segment' operational areas).
    for (const tab of ['sops', 'manuals', 'alerts', 'lessons', 'software']) {
      await expect(page.locator(`#tab-bar .tab-btn[data-tab="${tab}"]`)).toBeHidden();
    }
    assertNoConsoleErrors(consoleErrors);
  });

  test("a product centre's tabs use its own copy labels (Procedures / Product Manuals), not the shared defaults", async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'pt-drilling-coe');
    await gotoApp('/segment.html?id=pt-drilling-coe');
    const sopsLabel = await page
      .locator('#tab-bar .tab-btn[data-tab="sops"]')
      .evaluate((btn) => (btn.firstChild.nodeType === 3 ? btn.firstChild.textContent : btn.textContent).trim());
    const manualsLabel = await page
      .locator('#tab-bar .tab-btn[data-tab="manuals"]')
      .evaluate((btn) => (btn.firstChild.nodeType === 3 ? btn.firstChild.textContent : btn.textContent).trim());
    expect(sopsLabel).toBe('Procedures');
    expect(manualsLabel).toBe('Product Manuals');
    assertNoConsoleErrors(consoleErrors);
  });
});

// ── Amber pre-warning (review due soon) ──────────────────────────────────
// segment.html's own DUE_SOON_DAYS = 30 window: a document whose
// nextReviewDate is in the future but within 30 days gets the amber
// "Review due soon" treatment (doc-review-soon); a document already past
// its review date gets "Review overdue" (doc-review-late) instead; anything
// further out than 30 days (or with no review clock) gets neither. Only
// shown to roles that hold editMetadata or the register view (owner, qms,
// auditor), never employee (seesComplianceState()).
test.describe('amber pre-warning for a review due soon', () => {
  // TQ-GEO-M003 "Technology Readiness Review", segment geothermal-coe
  // (group 'function'), nextReviewDate 2026-10-16: a real register row whose
  // review is due within 30 days as of this suite's run, picked by querying
  // the actual register rather than inventing a date.
  const DOC_NUM = 'TQ-GEO-M003';
  const DOC_TITLE = 'Technology Readiness Review';
  const SEG = 'geothermal-coe';

  test('a document due for review soon gets the amber "Review due soon" flag, for a role that acts on it', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', SEG);
    await gotoApp('/segment.html?id=' + SEG + '&tab=manuals');

    // Confirm this doc is genuinely due soon (not overdue, not far out) as
    // of the moment the test actually runs, and compute the expected label
    // the same way segment.html's rowMeta() does, rather than hardcoding a
    // day count that would go stale.
    const expectation = await page.evaluate((num) => {
      const d = TAQA_STORE.findDoc(num);
      const due = new Date(d.nextReviewDate);
      const delta = Math.floor((Date.now() - due) / 86400000);
      if (!(delta > -30 && delta <= 0)) return { amber: false, delta };
      const soon = -delta;
      const how = soon < 60 ? soon + (soon === 1 ? ' day' : ' days') : Math.floor(soon / 30.44) + ' months';
      return { amber: true, text: 'Review due soon, ' + how };
    }, DOC_NUM);
    expect(expectation.amber, 'TQ-GEO-M003 should still be inside the 30-day due-soon window').toBe(true);

    const card = page.locator(`.doc-card[data-title^="${DOC_NUM}"]`).first();
    await expect(card).toBeVisible();
    const amberBadge = card.locator('.doc-review-soon');
    await expect(amberBadge).toHaveText(expectation.text);
    await expect(card.locator('.doc-review-late')).toHaveCount(0);
    assertNoConsoleErrors(consoleErrors);
  });

  test('the same amber flag is hidden from an Employee, who cannot act on it', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await gotoApp('/index.html');
    await setRole('employee', SEG);
    await gotoApp('/segment.html?id=' + SEG + '&tab=manuals');
    const card = page.locator(`.doc-card[data-title*="${DOC_TITLE}"]`).first();
    await expect(card).toBeVisible();
    await expect(card.locator('.doc-review-soon')).toHaveCount(0);
    await expect(card.locator('.doc-review-late')).toHaveCount(0);
    assertNoConsoleErrors(consoleErrors);
  });

  test('a document not due for a long time gets no amber flag at all', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    // TQ-TWS-CTSS-SOP-011, nextReviewDate 2028-01-10: far outside both the
    // overdue and the 30-day due-soon windows.
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/segment.html?id=coiled-tubing&tab=sops');
    const card = page.locator('.doc-card[data-title^="TQ-TWS-CTSS-SOP-011"]').first();
    await expect(card).toBeVisible();
    await expect(card.locator('.doc-review-soon')).toHaveCount(0);
    await expect(card.locator('.doc-review-late')).toHaveCount(0);
    assertNoConsoleErrors(consoleErrors);
  });
});

// ── Empty state ───────────────────────────────────────────────────────────
test.describe('empty state for zero documents of a type', () => {
  test('an operational segment with zero alerts shows a named empty state, not a blank tab', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    // Wireline (group 'segment') has zero live alerts in the current
    // register (confirmed against the baseline below), and 'segment'-group
    // areas keep every core tab visible even at zero (CORE_TABS), unlike
    // function/product/company areas which hide an empty tab entirely.
    expect(BASE.byStatus, 'sanity: register loaded').toBeTruthy();
    await gotoApp('/index.html');
    await setRole('qms', 'wireline');
    await gotoApp('/segment.html?id=wireline');
    await page.locator('#tab-bar .tab-btn[data-tab="alerts"]').click();

    const panel = page.locator('#panel-alerts');
    await expect(panel).toHaveClass(/active/);
    await expect(panel.locator('.empty-state h3')).toHaveText('No active alerts');
    await expect(panel.locator('.empty-state p')).toContainText('Wireline Services has no outstanding technical alerts.');
    await expect(page.locator('#vis-alerts')).toHaveText('0');
    assertNoConsoleErrors(consoleErrors);
  });

  test('an empty tab offers "Submit a document" only to a role that may submit one', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    // Company has zero SOPs; its tab is hidden from the tab bar (see the
    // labelling test above), but the panel itself still exists and its
    // empty-state render is reachable directly, the same function every
    // visible empty tab uses.
    await gotoApp('/index.html');
    await setRole('owner', 'company'); // editMetadata: true
    await gotoApp('/segment.html?id=company');
    await page.evaluate(() => openTab('sops'));
    const panel = page.locator('#panel-sops');
    await expect(panel.locator('.empty-state h3')).toContainText('No');
    await expect(panel.locator('.empty-state-upload')).toBeVisible();

    await setRole('employee', 'company'); // editMetadata: false
    await gotoApp('/segment.html?id=company');
    await page.evaluate(() => openTab('sops'));
    await expect(page.locator('#panel-sops .empty-state-upload')).toHaveCount(0);
    assertNoConsoleErrors(consoleErrors);
  });
});

// ── Mobile responsiveness ────────────────────────────────────────────────
test.describe('mobile responsiveness at 390px', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const { id } of FAMILIES) {
    test(`${id}: no horizontal overflow at 390px`, async ({ page, gotoApp, setRole, consoleErrors }) => {
      await gotoApp('/index.html');
      await setRole('employee', id);
      await gotoApp('/segment.html?id=' + encodeURIComponent(id));
      // Let the async card render pass finish before measuring.
      await page.waitForTimeout(500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${id} at 390px: document.documentElement.scrollWidth vs window.innerWidth`).toBeLessThanOrEqual(1);
      assertNoConsoleErrors(consoleErrors);
    });
  }
});

// ── Row actions: one place, the ••• menu ────────────────────────────────
// Rows used to hide a Bookmark / QR panel behind a sideways swipe, and its
// coloured blocks showed at the edge of rows on a phone. It was removed at
// the owner's request: both actions live in the row's own ••• menu.
test.describe('row actions', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('no swipe panel is drawn, and the ••• menu still offers Bookmark and QR code', async ({ page, gotoApp, setRole, consoleErrors }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'drilling');
    await gotoApp('/segment.html?id=drilling&tab=sops');
    const card = page.locator('.doc-card:not(.is-asset)').first();
    await expect(card).toBeVisible();
    await expect(page.locator('.swipe-actions, .swipe-act')).toHaveCount(0);

    await card.locator('.doc-more').click();
    const menu = page.locator('#row-menu');
    await expect(menu.locator('[data-act="bm"]')).toBeVisible();
    await expect(menu.locator('[data-act="qr"]')).toBeVisible();
    assertNoConsoleErrors(consoleErrors);
  });
});
