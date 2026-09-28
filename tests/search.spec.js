// Regression suite for ai-search.html + search-index.js.
//
// NAMING HONESTY: despite the page's own copy ("AI-Powered Document
// Intelligence", "Ask AI"), reading search-index.js and the "Real Document
// Search" script in ai-search.html shows this is a client-side KEYWORD /
// substring search over the local document register (TAQA_SEARCH_INDEX,
// built from TAQA_STORE.rows('register')). searchDocs() scores an exact
// title match, a start-of-title match, a substring match, a segment-name
// match and a doc-type match, then sorts by that score. There is no
// generative model anywhere in this page: the CSP's `connect-src 'self'`
// alone rules out a call to an external LLM API, and there is no fetch()
// to one either (grepped for `fetch(`, `anthropic`, `openai`, `api.`,
// `https://` in ai-search.html and search-index.js: none found). So this
// suite tests it as what it is, keyword/full-text search, filtering and
// ranking, and never asserts anything about "AI" reasoning or generation.
//
// The page's one AI-adjacent claim that actually matters is the safety
// banner fixes.js injects ("AI answers are not a substitute for approved
// documents..."); that banner is tested below for presence/visibility and
// for not overclaiming beyond a caution to verify against the source.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

// Real segment ids wired to the quick-filter chips (data-seg) in
// ai-search.html, cross-checked against TAQA_DOC_LOOKUPS.segments in
// documents-master.js: all five exist for real (drilling, well-safety,
// fracturing, qhse, hr), so the chip markup and the register agree.
const SEG_ALL = 'all';
const SEG_WELL_SAFETY = 'well-safety'; // "Safety Services" chip

test.beforeEach(async ({ gotoApp, setRole, clearAppState }) => {
  await gotoApp('/index.html');
  await clearAppState();
  // qms sees every status (including draft) and every classification, so
  // its results are not narrowed by role the way employee/owner would be,
  // matching the pattern smoke.spec.js already uses for full-visibility runs.
  await setRole('qms', 'coiled-tubing');
  await gotoApp('/ai-search.html');
});

// Reads the register the page itself built, exactly as searchDocs() would
// see it, so tests never hardcode a count that can drift from the data.
async function indexRows(page) {
  return page.evaluate(() => window.TAQA_SEARCH_INDEX || []);
}

// Mirrors the *matching* predicate inside searchDocs() in ai-search.html
// (title / doc number / segment name / doc type substring match) without
// reimplementing its ranking, just enough to assert a result set is the
// same real matches the app's own logic would keep.
function predicateMatches(rows, q) {
  const ql = q.toLowerCase();
  return rows.filter((d) => {
    const tl = (d.t || '').toLowerCase();
    const nl = (d.n || '').toLowerCase();
    const sl = (d.sn || '').toLowerCase();
    const tp = (d.tp || '').toLowerCase();
    return tl.includes(ql) || nl.includes(ql) || sl.includes(ql) || tp.includes(ql);
  });
}

test.describe('Safety disclaimer banner', () => {
  test('is present, visible, and does not overclaim what the search does', async ({
    page,
    consoleErrors,
  }) => {
    const banner = page.locator('.ai-safety-banner');
    await expect(banner).toBeVisible();
    const text = (await banner.innerText()).trim();
    expect(text.length).toBeGreaterThan(0);
    // It must caution the reader to verify against the real record...
    expect(text).toMatch(/not a substitute for approved documents/i);
    expect(text.toLowerCase()).toContain('verify');
    // ...and must not claim things this keyword search does not do: it
    // never asserts the results are guaranteed accurate/complete, and it
    // never claims a model "understands" or "generates" the answer.
    expect(text.toLowerCase()).not.toMatch(/guarantee|100% accurate|always correct/);
    expect(text.toLowerCase()).not.toMatch(/generative|large language model|\bllm\b/);
    assertNoConsoleErrors(consoleErrors);
  });

  test('never calls out to an external AI endpoint while searching', async ({
    page,
    consoleErrors,
  }) => {
    const externalRequests = [];
    page.on('request', (req) => {
      const url = new URL(req.url());
      if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
        externalRequests.push(req.url());
      }
    });
    await page.locator('#query-input').fill('shut-in');
    await page.locator('#query-input').press('Enter');
    await expect(page.locator('#chat-log .source-card').first()).toBeVisible();
    expect(externalRequests).toEqual([]);
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('Keyword search: real matches', () => {
  test('a real keyword returns results that are plausible actual matches', async ({
    page,
    consoleErrors,
  }) => {
    // "shut-in" is a real substring of real titles in the register (Well
    // Shut-In Procedure, Hard Shut-In vs. Soft Shut-In, and a lessons-learned
    // title), all in the well-safety segment, confirmed by reading
    // documents-master.js directly before writing this test.
    const query = 'shut-in';
    await page.locator('#query-input').fill(query);
    await page.locator('#query-input').press('Enter');
    await expect(page.locator('#chat-log .source-card').first()).toBeVisible();

    const rows = await indexRows(page);
    const expected = predicateMatches(rows, query);
    expect(expected.length).toBeGreaterThan(0);

    const cardTitles = await page.locator('.source-card-title').allInnerTexts();
    expect(cardTitles.length).toBe(expected.length);
    // Every rendered card is one of the real matches (never an invented one)...
    const expectedTitles = expected.map((d) => d.t).sort();
    expect([...cardTitles].sort()).toEqual(expectedTitles);
    // ...and the well-known document is actually among them.
    expect(cardTitles).toContain('Well Shut-In Procedure');

    // The results header names the real count, not a placeholder.
    await expect(page.locator('.sources-label')).toContainText(String(expected.length));
    assertNoConsoleErrors(consoleErrors);
  });

  test('a nonsense query shows an honest empty state, not an error', async ({
    page,
    consoleErrors,
  }) => {
    const query = 'zzqxnonexistentqueryimpossible987';
    const rows = await indexRows(page);
    // Guard the fixture itself: this string must not accidentally match.
    expect(predicateMatches(rows, query).length).toBe(0);

    await page.locator('#query-input').fill(query);
    await page.locator('#query-input').press('Enter');

    await expect(page.locator('.welcome-state h3')).toHaveText('No Documents Found');
    await expect(page.locator('.welcome-state p')).toContainText(query);
    await expect(page.locator('.source-card')).toHaveCount(0);
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('Instant preview vs. full results', () => {
  test('typing shows the type-ahead preview panel without opening full results', async ({
    page,
    consoleErrors,
  }) => {
    const panel = page.locator('#ir-panel');
    await expect(panel).not.toHaveClass(/open/);

    await page.locator('#query-input').fill('shut-in');
    // renderPreview() is debounced 150ms after input.
    await expect(panel).toHaveClass(/open/);
    await expect(panel.locator('.ir-item')).not.toHaveCount(0);
    await expect(panel.locator('.ir-title mark').first()).toHaveText(/shut-in/i);

    // Submitting has not happened yet, so the full results view is untouched.
    await expect(page.locator('.welcome-state h3')).toHaveText('Ready to Search');
    assertNoConsoleErrors(consoleErrors);
  });

  test('pressing Enter closes the preview and renders full results', async ({
    page,
    consoleErrors,
  }) => {
    const panel = page.locator('#ir-panel');
    await page.locator('#query-input').fill('shut-in');
    await expect(panel).toHaveClass(/open/);

    await page.locator('#query-input').press('Enter');
    await expect(panel).not.toHaveClass(/open/);
    await expect(page.locator('#chat-log .source-card').first()).toBeVisible();
    await expect(page.locator('.msg-user .bubble')).toHaveText('shut-in');
    assertNoConsoleErrors(consoleErrors);
  });

  test('clicking an instant-preview item opens that exact document', async ({
    page,
    consoleErrors,
  }) => {
    await page.locator('#query-input').fill('shut-in');
    const firstItem = page.locator('#ir-panel .ir-item').first();
    await expect(firstItem).toBeVisible();
    const href = await firstItem.getAttribute('href');
    expect(href).toMatch(/^viewer\.html\?doc=/);
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('Segment quick-filter chips', () => {
  test('a real segment chip narrows full results to that segment, "All" clears it', async ({
    page,
    consoleErrors,
  }) => {
    const allChip = page.locator('.seg-filters .filter-chip[data-seg="all"]');
    const safetyChip = page.locator(`.seg-filters .filter-chip[data-seg="${SEG_WELL_SAFETY}"]`);
    await expect(allChip).toHaveClass(/active/);

    await safetyChip.click();
    await expect(safetyChip).toHaveClass(/active/);
    await expect(allChip).not.toHaveClass(/active/);

    // Clicking a segment chip with no typed query still runs a full search
    // (handleFilterChange -> renderFullResults) because the filter alone
    // makes activeFilterCount() > 0.
    await expect(page.locator('#chat-log .source-card').first()).toBeVisible();

    const rows = await indexRows(page);
    const expectedCount = rows.filter((d) => d.s === SEG_WELL_SAFETY).length;
    expect(expectedCount).toBeGreaterThan(0);
    // renderFullResults() caps the rendered cards at RESULT_CAP (40) even
    // when more documents match; the header text still states the real
    // total, so both are checked.
    const RESULT_CAP = 40;
    await expect(page.locator('.source-card')).toHaveCount(Math.min(expectedCount, RESULT_CAP));
    await expect(page.locator('.sources-label')).toContainText(String(expectedCount));
    if (expectedCount > RESULT_CAP) {
      await expect(page.locator('.msg-ai .bubble p').first()).toContainText(
        `Showing the first ${RESULT_CAP}`
      );
    }

    const segNames = await page.locator('.source-card-seg').allInnerTexts();
    for (const t of segNames) expect(t).toContain('Safety Services');

    await allChip.click();
    await expect(allChip).toHaveClass(/active/);
    await expect(safetyChip).not.toHaveClass(/active/);
    await expect(page.locator('.welcome-state h3')).toHaveText('Ready to Search');
    assertNoConsoleErrors(consoleErrors);
  });

  // Regression test for a bug fixed today: #filters-trigger-btn shares the
  // .filter-chip CSS class with the real segment chips (for visual
  // consistency) but is NOT one, it has no data-seg attribute and only
  // opens the filters drawer (toggleFilters()). A since-removed duplicate
  // filter script (fixes.js FIX 5) used to match on .filter-chip broadly
  // and painted this button "active" on click, and could affect
  // FILTERS.segment. The current code's syncSegmentChips() only ever
  // touches `.seg-filters .filter-chip[data-seg]`, so the trigger button
  // is structurally excluded now; this proves it stays that way.
  test('the Filters drawer-trigger button is never treated as a segment chip', async ({
    page,
    consoleErrors,
  }) => {
    // The trigger button (and the off-canvas drawer behavior it opens) only
    // exists below the 1300px "pinned sidebar" breakpoint in the page's CSS.
    await page.setViewportSize({ width: 1024, height: 900 });

    const trigger = page.locator('#filters-trigger-btn');
    const allChip = page.locator('.seg-filters .filter-chip[data-seg="all"]');
    await expect(trigger).toBeVisible();
    await expect(allChip).toHaveClass(/active/);

    await trigger.click();

    // It opens the drawer...
    await expect(page.locator('#filters-drawer')).toHaveClass(/open/);
    // ...but never gains the segment-chip "active" styling.
    await expect(trigger).not.toHaveClass(/active/);
    // No real segment chip's state moved either.
    await expect(allChip).toHaveClass(/active/);
    const otherChipClasses = await page
      .locator('.seg-filters .filter-chip[data-seg]:not([data-seg="all"])')
      .evaluateAll((els) => els.map((el) => el.className));
    expect(otherChipClasses.length).toBeGreaterThan(0);
    for (const cls of otherChipClasses) expect(cls).not.toMatch(/\bactive\b/);
    // And since FILTERS.segment is untouched, no full-results search ran.
    await expect(page.locator('.welcome-state h3')).toHaveText('Ready to Search');
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('Filters drawer (narrow viewport, off-canvas)', () => {
  test.use({ viewport: { width: 1024, height: 900 } });

  test('opens via the trigger, closes via the close button, the scrim, and Escape', async ({
    page,
    consoleErrors,
  }) => {
    const drawer = page.locator('#filters-drawer');
    const trigger = page.locator('#filters-trigger-btn');
    const scrim = page.locator('#filters-scrim');

    await expect(drawer).not.toHaveClass(/open/);

    await trigger.click();
    await expect(drawer).toHaveClass(/open/);
    await expect(scrim).toHaveClass(/open/);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await page.locator('.filters-close-btn').click();
    await expect(drawer).not.toHaveClass(/open/);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await expect(drawer).toHaveClass(/open/);
    // Click the scrim well away from both the fixed top navbar and the
    // 284px-wide drawer itself, so the click actually lands on the scrim.
    await scrim.click({ position: { x: 900, y: 500 } });
    await expect(drawer).not.toHaveClass(/open/);

    await trigger.click();
    await expect(drawer).toHaveClass(/open/);
    await page.keyboard.press('Escape');
    await expect(drawer).not.toHaveClass(/open/);
    assertNoConsoleErrors(consoleErrors);
  });

  test('status and type filters in the drawer actually narrow results', async ({
    page,
    consoleErrors,
  }) => {
    await page.locator('#filters-trigger-btn').click();

    const rows = await indexRows(page);
    const expectedDraftCount = rows.filter((d) => d.st === 'draft').length;
    expect(expectedDraftCount).toBeGreaterThan(0);

    await page.locator('#f-status').selectOption('draft');
    // A filter-only change with no typed query still triggers full results.
    await expect(page.locator('#chat-log .source-card, .welcome-state h3').first()).toBeVisible();
    if (expectedDraftCount > 0) {
      await expect(page.locator('.source-card')).toHaveCount(expectedDraftCount);
      await expect(page.locator('.result-note').first()).toContainText('Draft');
    }
    await expect(page.locator('#filters-badge')).toHaveText('1');

    // Add a document-type filter on top (AND), narrowing further or equal.
    const expectedDraftSop = rows.filter((d) => d.st === 'draft' && d.tp === 'sop').length;
    await page.locator('#f-type').selectOption('sop');
    await expect(page.locator('.source-card')).toHaveCount(expectedDraftSop);
    await expect(page.locator('#filters-badge')).toHaveText('2');

    await page.locator('#filters-clear-btn').click();
    await expect(page.locator('#filters-badge')).toBeHidden();
    await expect(page.locator('#f-status')).toHaveValue('all');
    await expect(page.locator('#f-type')).toHaveValue('all');
    await expect(page.locator('.welcome-state h3')).toHaveText('Ready to Search');
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('XSS / escaping', () => {
  test('an HTML-bearing query is rendered as literal text everywhere it is echoed', async ({
    page,
    consoleErrors,
  }) => {
    let dialogFired = false;
    page.on('dialog', async (d) => {
      dialogFired = true;
      await d.dismiss();
    });

    const scriptCountBefore = await page.locator('script').count();
    const payload = '<script>alert(1)</script>';

    await page.locator('#query-input').fill(payload);
    // Preview echoes the query into highlight()/esc() too; give it a beat.
    await page.waitForTimeout(250);
    await page.locator('#query-input').press('Enter');

    // No match for this literal payload against real titles, so the empty
    // state renders, and its "match "<query>"" text must be the literal
    // string, decoded back from the escaped markup, not executed HTML.
    await expect(page.locator('.welcome-state h3')).toHaveText('No Documents Found');
    await expect(page.locator('.welcome-state p')).toContainText(payload);

    const scriptCountAfter = await page.locator('script').count();
    expect(scriptCountAfter).toBe(scriptCountBefore);
    expect(dialogFired).toBe(false);
    assertNoConsoleErrors(consoleErrors);
  });

  test('an HTML-bearing query that does match still renders the doc title unescaped-safe', async ({
    page,
    consoleErrors,
  }) => {
    // Craft a query that both contains markup AND matches a real document,
    // by wrapping a real keyword: highlight() escapes the title first and
    // only wraps <mark> around the safely-escaped text, so this proves the
    // matched title never becomes raw markup even alongside a markup-like query.
    let dialogFired = false;
    page.on('dialog', async () => {
      dialogFired = true;
    });

    await page.locator('#query-input').fill('<b>shut-in</b>');
    await page.waitForTimeout(250);
    // No literal title contains "<b>shut-in</b>", so this is an empty-state
    // case too, but it exercises highlight()'s regex path (built from the
    // raw, HTML-unescaped query) against the escaped title without throwing.
    await page.locator('#query-input').press('Enter');
    await expect(page.locator('.welcome-state h3')).toHaveText('No Documents Found');
    expect(dialogFired).toBe(false);
    assertNoConsoleErrors(consoleErrors);
  });

  test('real titles containing HTML-special characters render correctly (ampersand)', async ({
    page,
    consoleErrors,
  }) => {
    // "Exit & Offboarding SOP" is a real title (documents-master.js, HR
    // segment) and exercises esc() on real register data, not just a
    // synthetic payload: a naive template would either double-escape it
    // ("Exit &amp;amp; Offboarding SOP") or leave it unescaped and break
    // the surrounding markup.
    await page.locator('#query-input').fill('Offboarding');
    await page.locator('#query-input').press('Enter');
    await expect(page.locator('.source-card-title').first()).toBeVisible();
    const titles = await page.locator('.source-card-title').allInnerTexts();
    expect(titles.some((t) => t === 'Exit & Offboarding SOP')).toBe(true);
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('Mobile responsiveness (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('no horizontal overflow on load or with results rendered', async ({
    page,
    consoleErrors,
  }) => {
    const overflowBefore = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflowBefore).toBeLessThanOrEqual(1);

    await page.locator('#query-input').fill('shut-in');
    await page.locator('#query-input').press('Enter');
    await expect(page.locator('#chat-log .source-card').first()).toBeVisible();

    const overflowAfter = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflowAfter).toBeLessThanOrEqual(1);
    assertNoConsoleErrors(consoleErrors);
  });

  test('the filters drawer is usable at 390px width', async ({ page, consoleErrors }) => {
    const trigger = page.locator('#filters-trigger-btn');
    const drawer = page.locator('#filters-drawer');
    await expect(trigger).toBeVisible();

    await trigger.click();
    await expect(drawer).toHaveClass(/open/);
    const box = await drawer.boundingBox();
    expect(box).not.toBeNull();
    // The drawer must fit on screen (max-width:86vw in its own CSS) rather
    // than spilling past the 390px viewport.
    expect(box.x + box.width).toBeLessThanOrEqual(390 + 1);

    await page.locator('#f-status').selectOption('draft');
    await expect(page.locator('#filters-badge')).toHaveText('1');

    await page.locator('.filters-close-btn').click();
    await expect(drawer).not.toHaveClass(/open/);
    assertNoConsoleErrors(consoleErrors);
  });
});
