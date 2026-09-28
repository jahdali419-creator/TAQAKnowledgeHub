// Permanent regression suite for analytics.html.
//
// Read in full before writing this: analytics.html's role gate, its inline
// script block computing the trend charts and the audit/activity log
// (analytics.html:379-640), and the top-of-page usage tracking script
// (analytics.html:248-359). Ground truth for what this page actually is,
// straight from its own source:
//
// - It is LOCAL-DEVICE analytics only. The page header itself says so:
//   "Local usage data stored on this device, page views, document opens,
//   and searches." (analytics.html:175). Page views/opens/searches come
//   from shared.js's TAQA_Track, which reads/writes the 'taqa-analytics'
//   localStorage key per browser (shared.js:709-730) — genuine, but
//   per-device, not company-wide.
// - The two trend charts and the audit/activity log are NOT a real
//   historical time series or a real event log: they are synthesized from a
//   single snapshot of today's register (analytics.html:383-390, 533-540).
//   The page says this in visible copy directly under both section titles
//   (analytics.html:198, 233), including "Once Azure is the backend..." /
//   "A real Azure audit-log service will replace all of it...".
// - BUG FOUND AND FIXED (scoped to this file only): the role-refusal copy
//   shown to a non-register role (employee/owner) used to read "This page
//   shows how the Hub is used across the company..." (still visible via git
//   history at the old analytics.html:368), directly contradicting the
//   page's own "local usage data ... on this device" framing three lines
//   above it, and risking being read as a genuine org-wide compliance
//   dashboard. Fixed in this same change to read "This page shows local
//   usage data stored on this device, plus a register-derived audit log...".
//   This suite's first test locks that fix in and guards against the
//   overclaiming phrasing coming back anywhere on the page.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');
const { computeBaseline } = require('./helpers/baseline');

// Phrases that would misrepresent this device-local, snapshot-derived page
// as a genuine, company-wide compliance/audit system. None of these may
// ever appear in the rendered page.
const OVERCLAIM_PATTERNS = [
  /across the company/i,
  /company[- ]wide (compliance|audit)/i,
  /organi[sz]ation[- ]wide (compliance|audit)/i,
  /genuine (compan(y|ies)|organi[sz]ation)[- ]wide/i,
];

test.describe('analytics.html', () => {
  test.beforeEach(async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await setRole('qms', 'coiled-tubing');
  });

  test('role gate: a role without register access is refused with accurate, non-overclaiming copy', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await setRole('employee', 'coiled-tubing');
    await gotoApp('/analytics.html');

    await expect(page.getByRole('heading', { name: /register.s owners/i })).toBeVisible();
    const bodyText = await page.locator('body').innerText();
    for (const re of OVERCLAIM_PATTERNS) {
      expect(bodyText, `overclaiming phrase ${re} found in refusal copy`).not.toMatch(re);
    }
    expect(bodyText).toMatch(/local usage data/i);
    assertNoConsoleErrors(consoleErrors);
  });

  test('the page never claims to be a genuine company-wide compliance audit trail, and does label the synthesized data as such', async ({
    page,
    gotoApp,
  }) => {
    await gotoApp('/analytics.html');

    const bodyText = await page.locator('body').innerText();
    for (const re of OVERCLAIM_PATTERNS) {
      expect(bodyText, `overclaiming phrase ${re} found on the live page`).not.toMatch(re);
    }

    // The clarifying labels the code actually ships must be present, not
    // just "absence of the bad phrase" — this is what makes the honest
    // framing a real, asserted feature rather than an accident.
    await expect(page.locator('.page-header p')).toContainText('this device');
    await expect(page.locator('#trend-section .trend-sub')).toContainText(/not a real historical log/i);
    await expect(page.locator('#audit-section .trend-sub')).toContainText(/synthesized/i);
    await expect(page.locator('#audit-section .trend-sub')).toContainText(/there is no real event log yet/i);
  });

  test('trend charts render without error and stay within real, register-derived bounds', async ({
    page,
    gotoApp,
    consoleErrors,
  }) => {
    await gotoApp('/analytics.html');
    const baseline = computeBaseline();

    // ── Overdue review backlog (line chart) ──────────────────────────────
    // overdueSeries() (analytics.html:437-447) is documented in its own
    // source comment as "necessarily non-decreasing", counting live,
    // in-force documents whose real nextReviewDate had passed as of each
    // month-end. That gives us two real, checkable invariants without
    // reimplementing its date math: (1) monotonic non-decreasing, and
    // (2) every value is bounded by the real count of live documents in
    // today's register (it can never invent a document that doesn't exist).
    const overdueChart = page.locator('#overdue-chart');
    await expect(overdueChart).toBeVisible();
    const overdueTitles = await overdueChart.locator('circle title').allTextContents();
    if (baseline.liveCount === 0) {
      await expect(overdueChart).toContainText('No documents are due for review.');
    } else if (overdueTitles.length) {
      const values = overdueTitles.map((t) => {
        const m = t.match(/:\s*(\d+)\s*due/);
        expect(m, `unparsable overdue point label: "${t}"`).not.toBeNull();
        return Number(m[1]);
      });
      for (const v of values) {
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(baseline.liveCount);
      }
      for (let i = 1; i < values.length; i++) {
        expect(values[i], 'overdue backlog series must be non-decreasing').toBeGreaterThanOrEqual(
          values[i - 1]
        );
      }
    }

    // ── Publishing velocity by segment (bar chart) ───────────────────────
    // velocityBySegment() (analytics.html:454-468) counts real issueDate
    // values from 'controlled' rows, so the total across every bar can
    // never exceed the real number of controlled documents in the
    // register, and each segment code shown must be a real segment's spl
    // code, not an invented label.
    const velocityChart = page.locator('#velocity-chart');
    await expect(velocityChart).toBeVisible();
    const velocityTitles = await velocityChart.locator('rect title').allTextContents();
    if (!velocityTitles.length) {
      await expect(velocityChart).toContainText('No documents were issued in the last 12 months.');
    } else {
      // velocityBySegment() (analytics.html:466) labels each bar with the
      // segment's real spl code, falling back to the raw segment id only if
      // a document's segment is missing from the lookup table. Accept
      // either, since both are real identifiers from the register, never a
      // fabricated one.
      const realSegmentCodes = await page.evaluate(() => {
        const segs = TAQA_DOC_LOOKUPS.segments;
        return Object.keys(segs).concat(Object.values(segs).map((s) => s.spl).filter(Boolean));
      });
      let total = 0;
      for (const t of velocityTitles) {
        const m = t.match(/^(.*):\s*(\d+)\s*published$/);
        expect(m, `unparsable velocity bar label: "${t}"`).not.toBeNull();
        expect(Number.isFinite(Number(m[2]))).toBe(true);
        expect(Number(m[2])).toBeGreaterThan(0); // only segments with >0 are ever plotted
        total += Number(m[2]);
      }
      expect(total).toBeLessThanOrEqual(baseline.controlledCount);
      const shownCodes = await velocityChart.locator('text').allTextContents();
      // Every visible axis code is a real segment/spl code, not a fabricated one.
      const codeTexts = shownCodes.filter((t) => !/^\d+$/.test(t.trim()) && t.trim());
      for (const code of codeTexts) {
        expect(realSegmentCodes, `chart labeled a segment code "${code}" absent from the real register`).toContain(
          code.trim()
        );
      }
    }

    assertNoConsoleErrors(consoleErrors);
  });

  test('the audit/activity log is internally consistent: dates run newest-first, and no NaN/undefined/Invalid Date leaks through', async ({
    page,
    gotoApp,
    consoleErrors,
  }) => {
    await gotoApp('/analytics.html');

    const section = page.locator('#audit-section');
    await expect(section).toBeVisible(); // role is qms, so the sub-gate passes too

    const listText = await page.locator('#audit-list').innerText();
    expect(listText).not.toMatch(/\bNaN\b/);
    expect(listText).not.toMatch(/\bundefined\b/);
    expect(listText).not.toMatch(/Invalid Date/);

    // Stats row: four non-negative integers, never NaN, even though these
    // entries are synthesized — "synthesized" describes their PROVENANCE,
    // not their arithmetic, so the counts must still be real, consistent
    // numbers.
    const statNums = await page.locator('#audit-stats .audit-stat-num').allTextContents();
    expect(statNums.length).toBe(4);
    for (const n of statNums) {
      expect(/^\d+$/.test(n.trim()), `audit stat "${n}" is not a clean non-negative integer`).toBe(true);
    }

    // Ordering: entries.sort() (analytics.html:581-585) sorts newest first.
    // Parse each row's displayed date (en-GB, "28 Sep 2026") back out and
    // assert it never increases down the list. Two entries can legitimately
    // share the same calendar day (the code sorts by real ms timestamp,
    // the display only has day resolution), so equal-adjacent dates are
    // allowed; only a later item strictly after an earlier one is a bug.
    const dateTexts = await page.locator('.audit-item .audit-time').allTextContents();
    const dates = dateTexts.map((t) => {
      const d = new Date(t.trim());
      expect(isNaN(d.getTime()), `unparsable audit date "${t}"`).toBe(false);
      return d.getTime();
    });
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i], 'audit log must read newest first').toBeLessThanOrEqual(dates[i - 1]);
    }

    // When there are more synthesized entries than the page shows, it says
    // so, explicitly using the word "synthesized" rather than implying a
    // complete genuine log.
    const note = (await page.locator('#audit-note').innerText()).trim();
    if (note) expect(note).toMatch(/synthesized/i);

    assertNoConsoleErrors(consoleErrors);
  });

  test('overview counts reflect real local page-view history, contrasted with the synthesized audit log', async ({
    page,
    gotoApp,
    consoleErrors,
  }) => {
    // Generate genuine, real TAQA_Track 'view' events for this device by
    // actually visiting pages, then confirm analytics.html's "Top Pages
    // Visited" reflects that real navigation, not a synthesized figure.
    await gotoApp('/glossary.html');
    await gotoApp('/ai-search.html');
    // The real event count as of just before loading analytics.html itself.
    const preNavCount = (
      await page.evaluate(() => JSON.parse(localStorage.getItem('taqa-analytics') || '[]'))
    ).filter((e) => e.e === 'view').length;
    expect(preNavCount).toBe(2); // glossary, ai-search

    await gotoApp('/analytics.html');

    const pagesList = page.locator('#pages-list');
    await expect(pagesList).toContainText('Field Glossary');
    await expect(pagesList).toContainText('AI Search');

    // renderAnalytics() (analytics.html:280-327, called at line 356) runs
    // from a <script> that sits BEFORE shared.js's own <script src> tag
    // (analytics.html:248 vs :378), so it always paints using the events
    // that existed *before* this page load's own 'view' event is recorded
    // by shared.js (shared.js:709-730). The displayed "Total Page Views"
    // is therefore real data, just one page-view behind on this exact
    // load, not synthesized, it must match the pre-navigation count, and
    // the localStorage event log (read after shared.js has since run) must
    // show one more: this device's own visit to analytics.html.
    const totalViews = Number((await page.locator('#total-views').innerText()).trim());
    expect(totalViews).toBe(preNavCount);
    const postLoadEvents = await page.evaluate(() => JSON.parse(localStorage.getItem('taqa-analytics') || '[]'));
    const postLoadViewCount = postLoadEvents.filter((e) => e.e === 'view').length;
    expect(postLoadViewCount).toBe(preNavCount + 1);

    assertNoConsoleErrors(consoleErrors);
  });

  test('mobile at 390px: overview cards and both trend charts lay out without horizontal overflow', async ({
    page,
    gotoApp,
    consoleErrors,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoApp('/analytics.html');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth, 'page scrolls horizontally at 390px').toBeLessThanOrEqual(clientWidth + 1);

    await expect(page.locator('#overdue-chart svg, #overdue-chart .an-empty')).toBeVisible();
    await expect(page.locator('#velocity-chart svg, #velocity-chart .an-empty')).toBeVisible();

    // The charts grid collapses to one column under 768px (analytics.html:135).
    const gridCols = await page.evaluate(
      () => getComputedStyle(document.querySelector('.trend-charts-grid')).gridTemplateColumns.split(' ').length
    );
    expect(gridCols).toBe(1);

    for (const svg of await page.locator('.tchart-svg').all()) {
      const box = await svg.boundingBox();
      if (box) expect(box.width).toBeLessThanOrEqual(390);
    }

    assertNoConsoleErrors(consoleErrors);
  });
});

// KNOWN ISSUE (needs owner judgment, not fixed here — see final report):
// registerRows(pop) (analytics.html:410-413) wraps TAQA_STORE.rows(pop) in a
// bare try/catch that swallows EVERY exception, not just "TAQA_STORE is
// undefined". A real bug thrown from inside TAQA_STORE.rows() (a bad date, a
// malformed override, anything) would silently render as an empty chart /
// empty audit log instead of surfacing as a console error or a visible
// failure. This suite cannot safely force that path without monkeypatching
// the shared TAQA_STORE object (out of scope: store.js is shared
// infrastructure this suite was told not to edit), so it is called out here
// in prose instead of asserted. Whether that swallow-everything behavior is
// the intended "degrade gracefully offline" design or an accidental error
// mask is a product decision, not a test.
