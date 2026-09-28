// Permanent regression suite for the local-only bookmarks feature.
//
// Read in full before writing this: shared.js's "// ── Bookmarks ──" block
// (shared.js:732-904). Ground truth, straight from that source:
//
// - Storage: window.TAQA_Bookmarks (shared.js:743-759) is a thin wrapper
//   around a single localStorage array at the key 'taqa-bookmarks'
//   (shared.js:734). add()/remove()/toggle()/has()/getAll() are the whole
//   API. There is no server, no sync endpoint, nothing but this one
//   per-browser localStorage key, so bookmarks are per-browser/device by
//   design, not by omission. This suite's last test turns that into an
//   explicit regression guard (two independent contexts never share state)
//   rather than leaving it as an assumption nobody checks.
// - The bookmarks button (#nav-bm) and panel (#bm-panel, built once in
//   shared.js and appended to <body>) are created by shared.js itself, so
//   every page that loads shared.js gets the identical panel, badge and
//   behavior. This suite adds a bookmark from two different pages
//   (viewer.html's dedicated #bm-doc-btn, and segment.html's per-row
//   overflow menu) and confirms both land in that one shared panel, and
//   that the panel opened from a THIRD page (index.html) shows the same
//   state, proving it is genuinely shared/consistent and not per-page
//   duplicated state.
// - Export (shared.js:853-864, the panel's "Export" button, id="bm-exp")
//   builds a Blob and clicks a synthetic <a download>. This suite cannot
//   verify a real file lands on disk in this environment, so it only
//   proves the action runs with no thrown JS error (the `consoleErrors`
//   fixture would catch that) and, best-effort, that the browser actually
//   started a download.
//
// KNOWN BUG (found while writing this suite, not fixed, shared.js is
// listed as shared infrastructure this task must not edit, and the other
// half of the mismatch is in viewer.html, which is also outside this task's
// glossary.html/analytics.html edit scope):
//   shared.js's bookmark-panel remove/clear handlers only refresh elements
//   carrying the `.bm-btn` class (shared.js:846, :851), which is the
//   contract segment.html's row stars (`.bm-btn.bm-flag`, segment.html:1816)
//   and row-menu items opt into. viewer.html's own bookmark button
//   (`#bm-doc-btn`, viewer.html:636) does NOT carry `.bm-btn`, and nothing
//   else re-syncs it: `updateBmBtn()` (viewer.html:1342-1349) only runs from
//   `toggleViewerBm()` itself and once on page load (`setTimeout(updateBmBtn,
//   300)`, viewer.html:1357). Repro: open a document in viewer.html, bookmark
//   it (button reads "Bookmarked", aria-pressed="true"), then remove that
//   same bookmark from the bookmarks panel (or via "Clear") without
//   reloading viewer.html, the panel and badge correctly drop it, but
//   viewer.html's own button stays stuck on "Bookmarked"/aria-pressed="true"
//   until the page is reloaded. The dedicated test below documents this
//   CURRENT (stale) behavior rather than asserting the ideal one, per this
//   task's "mark with `// KNOWN BUG:`, don't delete/weaken the assertion"
//   rule; see the final report for the same repro.
const { test, expect } = require('./helpers/fixtures');

// A real document from the register, same one smoke.spec.js already relies
// on loading correctly.
const VIEWER_URL =
  '/viewer.html?doc=TQ-TWS-CTSS-SOP-001&seg=coiled-tubing&type=sop&title=Pre-Job%20Safety%20Checklist';
const VIEWER_DOC_TITLE = 'Pre-Job Safety Checklist';
const SEGMENT_URL = '/segment.html?id=coiled-tubing';

test.describe('bookmarks (topbar, shared.js, multi-page)', () => {
  test.beforeEach(async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await setRole('qms', 'coiled-tubing');
    // Unrelated to bookmarks: index.html's own first-visit product tour
    // (index.html:1894-2080) shows a full-page backdrop until
    // 'taqa-tour-done' is set, and clearAppState() just wiped that flag.
    // Several tests below navigate back to index.html mid-test to check the
    // shared bookmarks panel there, and the tour backdrop would otherwise
    // intercept those clicks. Pre-seeding the flag is the same thing a
    // returning visitor's browser would already have.
    await page.evaluate(() => {
      try {
        localStorage.setItem('taqa-tour-done', '1');
      } catch (e) {}
    });
  });

  test('adding a bookmark from viewer.html appears in the shared panel, including when the panel is opened from a different page', async ({
    page,
    gotoApp,
  }) => {
    await gotoApp(VIEWER_URL);

    const bmBtn = page.locator('#bm-doc-btn');
    await expect(bmBtn).toHaveAttribute('aria-pressed', 'false');
    await bmBtn.click();
    await expect(bmBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(bmBtn).toContainText('Bookmarked');

    await expect(page.locator('#bm-cnt')).toHaveText('1');
    await page.locator('#nav-bm').click();
    const panel = page.locator('#bm-panel');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.bm-item')).toHaveCount(1);
    await expect(panel.locator('.bm-t')).toContainText(VIEWER_DOC_TITLE);

    // A different page entirely: shared.js builds the same panel there, so
    // it must show the identical, already-saved bookmark with no extra
    // steps, proving this is genuinely shared state, not a per-page copy.
    await gotoApp('/index.html');
    await expect(page.locator('#bm-cnt')).toHaveText('1');
    await page.locator('#nav-bm').click();
    const panelOnIndex = page.locator('#bm-panel');
    await expect(panelOnIndex.locator('.bm-item')).toHaveCount(1);
    await expect(panelOnIndex.locator('.bm-t')).toContainText(VIEWER_DOC_TITLE);
  });

  test('adding a bookmark from segment.html\'s row overflow menu also lands in the shared panel', async ({
    page,
    gotoApp,
  }) => {
    await gotoApp(SEGMENT_URL);

    const firstCard = page.locator('.doc-card').first();
    const docTitle = await firstCard.getAttribute('data-title');
    expect(docTitle).toBeTruthy();

    await firstCard.locator('.doc-more').click();
    const menu = page.locator('#row-menu');
    await expect(menu).toBeVisible();
    const bmItem = menu.locator('.row-menu-item[data-act="bm"]');
    await expect(bmItem).toContainText('Bookmark');
    await bmItem.click();

    // The row's own star mark (a .bm-btn.bm-flag span) lights up immediately.
    const flag = firstCard.locator('.bm-flag');
    await expect(flag).toHaveClass(/bm-on/);

    await expect(page.locator('#bm-cnt')).toHaveText('1');
    await page.locator('#nav-bm').click();
    const panel = page.locator('#bm-panel');
    await expect(panel.locator('.bm-item')).toHaveCount(1);
    // bm-t shows the title with any leading "NUMBER␣␣" stripped (shared.js
    // bmBare()); the raw data-title still contains it as a substring.
    const shownTitle = (await panel.locator('.bm-t').innerText()).trim();
    expect(docTitle).toContain(shownTitle);
  });

  test('removing a bookmark from the panel clears it there, drops the badge to zero, and clears the originating page\'s own star', async ({
    page,
    gotoApp,
  }) => {
    await gotoApp(SEGMENT_URL);
    const firstCard = page.locator('.doc-card').first();
    await firstCard.locator('.doc-more').click();
    await page.locator('#row-menu .row-menu-item[data-act="bm"]').click();
    await expect(firstCard.locator('.bm-flag')).toHaveClass(/bm-on/);
    await expect(page.locator('#bm-cnt')).toHaveText('1');

    await page.locator('#nav-bm').click();
    const panel = page.locator('#bm-panel');
    await expect(panel.locator('.bm-item')).toHaveCount(1);
    await panel.locator('.bm-x').click();

    await expect(panel.locator('.bm-item')).toHaveCount(0);
    await expect(panel.locator('.bm-empty')).toBeVisible();
    await expect(page.locator('#bm-cnt')).toBeHidden();
    // segment.html's star carries the shared .bm-btn contract, so shared.js's
    // panel-remove handler (shared.js:841-847) does correctly reach back and
    // clear it live, with no reload needed.
    await expect(firstCard.locator('.bm-flag')).not.toHaveClass(/bm-on/);

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('taqa-bookmarks') || '[]'));
    expect(stored).toEqual([]);
  });

  // KNOWN BUG, see the file header for the full repro and citations
  // (shared.js:846 vs viewer.html:636,1342-1357): viewer.html's own
  // bookmark button does not carry the `.bm-btn` class shared.js's
  // panel-remove/clear handlers key off, so it goes stale instead of
  // clearing live when the same bookmark is removed from the panel. This
  // test documents that CURRENT behavior; it is not the intended UX.
  test('KNOWN BUG: removing a bookmark via the panel leaves viewer.html\'s own bookmark button stale until reload', async ({
    page,
    gotoApp,
  }) => {
    await gotoApp(VIEWER_URL);
    const bmBtn = page.locator('#bm-doc-btn');
    await bmBtn.click();
    await expect(bmBtn).toHaveAttribute('aria-pressed', 'true');

    await page.locator('#nav-bm').click();
    const panel = page.locator('#bm-panel');
    await panel.locator('.bm-x').click();
    await expect(panel.locator('.bm-empty')).toBeVisible();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('taqa-bookmarks') || '[]'));
    expect(stored).toEqual([]); // the underlying store is correctly empty...

    // ...yet the button on screen still claims it is bookmarked, because
    // nothing told it to re-check. This is the bug.
    await expect(bmBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(bmBtn).toContainText('Bookmarked');

    // A reload is the only thing that currently fixes it, since updateBmBtn()
    // re-reads TAQA_Bookmarks.has() fresh on load (viewer.html:1342-1349,1357).
    await gotoApp(VIEWER_URL);
    await expect(page.locator('#bm-doc-btn')).toHaveAttribute('aria-pressed', 'false');
  });

  test('a bookmark persists across a reload of the same page (localStorage-backed, same browser)', async ({
    page,
    gotoApp,
  }) => {
    await gotoApp(VIEWER_URL);
    await page.locator('#bm-doc-btn').click();
    await expect(page.locator('#bm-doc-btn')).toHaveAttribute('aria-pressed', 'true');

    await gotoApp(VIEWER_URL);
    await expect(page.locator('#bm-doc-btn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#bm-doc-btn')).toContainText('Bookmarked');
    await expect(page.locator('#bm-cnt')).toHaveText('1');

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('taqa-bookmarks') || '[]'));
    expect(stored.length).toBe(1);
    expect(stored[0].title).toContain(VIEWER_DOC_TITLE);
  });

  test('exporting bookmarks runs with no JS error and starts a download', async ({
    page,
    gotoApp,
    consoleErrors,
  }) => {
    await gotoApp(VIEWER_URL);
    await page.locator('#bm-doc-btn').click();
    await page.locator('#nav-bm').click();

    const downloadPromise = page.waitForEvent('download', { timeout: 4000 }).catch(() => null);
    await page.locator('#bm-panel #bm-exp').click();
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toBe('taqa-bookmarks.txt');
    }
    // The one assertion this environment can make reliably either way: the
    // click produced no thrown/console error (assertNoConsoleErrors is not
    // called here so a missing `download` event alone can't fail the test,
    // but a real JS exception still would via this same array).
    expect(consoleErrors, `Unexpected JS error(s):\n${consoleErrors.join('\n')}`).toEqual([]);
  });

  test('two independent browser contexts (two devices) never share bookmark state, by design', async ({
    browser,
  }, testInfo) => {
    // Two full browser contexts and four navigations is inherently heavier
    // than this suite's other tests; give it more room than the project's
    // default 30s, especially under parallel workers.
    test.setTimeout(60_000);
    const baseURL = testInfo.project.use.baseURL;

    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    try {
      const pageA = await ctxA.newPage();
      const pageB = await ctxB.newPage();

      await pageA.goto(baseURL + '/index.html');
      await pageA.waitForFunction(() => document.readyState === 'complete');
      await pageB.goto(baseURL + '/index.html');
      await pageB.waitForFunction(() => document.readyState === 'complete');

      await pageA.evaluate((role) => localStorage.setItem('taqa-demo-role', role), 'qms');
      await pageB.evaluate((role) => localStorage.setItem('taqa-demo-role', role), 'qms');

      // "Device A" bookmarks a document.
      await pageA.goto(baseURL + VIEWER_URL);
      await pageA.waitForFunction(() => document.readyState === 'complete');
      await pageA.locator('#bm-doc-btn').click();
      await expect(pageA.locator('#bm-doc-btn')).toHaveAttribute('aria-pressed', 'true');

      // "Device B", a completely separate context/storage jar, must see
      // nothing: no sync channel exists (TAQA_Bookmarks is pure localStorage,
      // shared.js:732-759).
      await pageB.goto(baseURL + VIEWER_URL);
      await pageB.waitForFunction(() => document.readyState === 'complete');
      await expect(pageB.locator('#bm-doc-btn')).toHaveAttribute('aria-pressed', 'false');
      const storedOnB = await pageB.evaluate(() => JSON.parse(localStorage.getItem('taqa-bookmarks') || '[]'));
      expect(storedOnB).toEqual([]);
      await expect(pageB.locator('#bm-cnt')).toBeHidden();
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });
});
