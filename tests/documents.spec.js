// Regression suite for documents.html (published documents for one area).
//
// Covers the three bugs found and fixed just before this suite was written:
//   1. Stored-XSS: document titles used to go straight into innerHTML with no
//      escaping. documents.html now defines esc() and applies it in
//      renderPubTable(); "Security regression" below proves it, end to end,
//      through the real TAQA_STORE.add() code path.
//   2. documents.html?id=company used to show "Company" instead of the real
//      segment name; segments-data.js now carries a 'company' entry whose
//      name is "Company Wide". "Company Wide segment name" below is that
//      regression test.
//   3. (dashboard.html's duplicate-document detector, out of scope here,
//      covered in dashboard's own suite if one exists.)
//
// This page requires TAQA_ROLE.canManage(id) (the area's own holder, or
// QMS) or it refuses at the door (see the inline script right after
// roles.js loads), so every test signs in as 'qms', which can manage every
// area regardless of which one is requested.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');
const { computeBaseline } = require('./helpers/baseline');

const AREA = 'coiled-tubing';

async function openArea(gotoApp, setRole, area) {
  await gotoApp('/index.html');
  await setRole('qms', area);
  await gotoApp('/documents.html?id=' + area);
}

test.describe('documents.html, counts and pills', () => {
  test('document count and pill breakdown match TAQA_STORE.rows("live", {segment}), and computeBaseline() agrees', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await openArea(gotoApp, setRole, AREA);

    // Ask the page's own real function for the docs it thinks this area has,
    // rather than re-deriving the type-mapping logic here.
    const docs = await page.evaluate((seg) => buildAllDocs(seg), AREA);
    const baseline = computeBaseline();

    // Cross-check against the independently computed baseline (real register
    // data, read straight out of documents-master.js/segments-data.js).
    expect(docs.length).toBe(baseline.countsByArea[AREA]);

    // Hero total and footer "Showing X of Y" both reflect buildAllDocs()'s count.
    await expect(page.locator('#docs-total-count')).toHaveText(String(docs.length));
    await expect(page.locator('#pub-total')).toHaveText(String(docs.length));

    // Rendered row count matches too.
    await expect(page.locator('#pub-docs-body tr')).toHaveCount(docs.length);

    // Per-type pill counts match a grouping of the same buildAllDocs() output
    // that updatePillCounts() is fed.
    const expectedCounts = { sop: 0, manual: 0, policy: 0, alert: 0, lesson: 0 };
    docs.forEach((d) => {
      if (expectedCounts[d.type] !== undefined) expectedCounts[d.type]++;
    });
    for (const type of Object.keys(expectedCounts)) {
      const text = (await page.locator('#pill-count-' + type).textContent()) || '';
      const expected = expectedCounts[type] ? '(' + expectedCounts[type] + ')' : '';
      expect(text.trim(), `pill count for "${type}"`).toBe(expected);
    }
    // "All" pill isn't rendered with a per-type id check above, but its count
    // span exists too.
    const allText = (await page.locator('#pill-count-all').textContent()) || '';
    expect(allText.trim()).toBe('(' + docs.length + ')');

    assertNoConsoleErrors(consoleErrors);
  });

  test('documents.html?id=company shows "Company Wide" as the segment name (regression: used to show "Company")', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await openArea(gotoApp, setRole, 'company');

    await expect(page.locator('#docs-seg-name')).toHaveText('Company Wide, Published Documents');
    await expect(page.locator('#docs-seg-sub')).toContainText('Company Wide');
    await expect(page.locator('#bc-seg-link')).toHaveText('Company Wide');
    await expect(page).toHaveTitle(/^Company Wide, Published Documents/);
    // Never the un-fixed, stale value.
    await expect(page.locator('#docs-seg-name')).not.toHaveText(/^Company,/);

    assertNoConsoleErrors(consoleErrors);
  });

  test('an area with zero published documents renders the empty state, not a crash', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    // No real area in the register has zero live documents (every one of the
    // 26 areas has at least 3, see baseline.countsByArea), so an id outside
    // the register is the only way to exercise the true empty path. QMS can
    // manage any id (scope 'all'), so the page still renders rather than
    // refusing at the door.
    await openArea(gotoApp, setRole, 'zzz-does-not-exist');

    await expect(page.locator('#pub-docs-body tr')).toHaveCount(0);
    await expect(page.locator('#docs-total-count')).toHaveText('0');
    await expect(page.locator('#pub-total')).toHaveText('0');
    await expect(page.locator('#pub-no-results')).toBeVisible();
    await expect(page.locator('#pill-count-all')).toHaveText('');

    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('documents.html, sorting', () => {
  test('sorting by Document reorders rows, both directions, by the app\'s own key (doc number + title text)', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await openArea(gotoApp, setRole, AREA);
    const titleCol = page.locator('th[data-col="doc"]');
    // The "Document" cell renders the doc number (.pdt-num) directly before
    // the title (.pdt-t) with no separator, and applyPubSort() sorts on that
    // whole cell's lowercased textContent with plain `<`/`>` (not
    // localeCompare), so the visible order is "by doc number, then title",
    // not a pure alphabetical title sort. Replicate that exact key/comparator
    // rather than assuming a title-only alphabetical sort.
    const key = async () =>
      (await page.locator('#pub-docs-body tr td:nth-child(1)').allTextContents()).map((t) =>
        t.trim().toLowerCase()
      );
    const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

    await titleCol.click();
    await expect(titleCol).toHaveClass(/sort-asc/);
    let keys = await key();
    expect(keys).toEqual([...keys].sort(cmp));

    await titleCol.click();
    await expect(titleCol).toHaveClass(/sort-desc/);
    keys = await key();
    expect(keys).toEqual([...keys].sort((a, b) => cmp(b, a)));
  });

  test('sorting by Type groups rows by type badge, both directions', async ({ page, gotoApp, setRole }) => {
    await openArea(gotoApp, setRole, AREA);
    const typeCol = page.locator('th[data-col="type"]');

    await typeCol.click();
    await expect(typeCol).toHaveClass(/sort-asc/);
    let types = (await page.locator('#pub-docs-body .pub-doc-type-badge').allTextContents()).map((t) =>
      t.trim().toLowerCase()
    );
    let sorted = [...types].sort();
    expect(types).toEqual(sorted);

    await typeCol.click();
    await expect(typeCol).toHaveClass(/sort-desc/);
    types = (await page.locator('#pub-docs-body .pub-doc-type-badge').allTextContents()).map((t) =>
      t.trim().toLowerCase()
    );
    expect(types).toEqual([...sorted].reverse());
  });

  test('sorting by Published orders rows chronologically, both directions', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await openArea(gotoApp, setRole, AREA);
    const dateCol = page.locator('th[data-col="date"]');
    const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
    const toKey = (s) => {
      const [m, y] = s.trim().split(' ');
      return (parseInt(y, 10) || 0) * 12 + (MONTHS[m] || 0);
    };

    await dateCol.click();
    await expect(dateCol).toHaveClass(/sort-asc/);
    let dates = await page.locator('#pub-docs-body .pub-table-date').allTextContents();
    let keys = dates.map(toKey);
    expect(keys).toEqual([...keys].sort((a, b) => a - b));

    await dateCol.click();
    await expect(dateCol).toHaveClass(/sort-desc/);
    dates = await page.locator('#pub-docs-body .pub-table-date').allTextContents();
    keys = dates.map(toKey);
    expect(keys).toEqual([...keys].sort((a, b) => b - a));
  });

  test('sorting by Status orders rows by days late (current first when ascending)', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await openArea(gotoApp, setRole, AREA);
    const statusCol = page.locator('th[data-col="status"]');

    await statusCol.click();
    await expect(statusCol).toHaveClass(/sort-asc/);
    let late = (
      await page.locator('#pub-docs-body .pub-table-status').evaluateAll((els) => els.map((e) => Number(e.dataset.late)))
    );
    expect(late).toEqual([...late].sort((a, b) => a - b));
    // Ascending starts with non-overdue (late === 0) rows.
    expect(late[0]).toBe(0);

    await statusCol.click();
    await expect(statusCol).toHaveClass(/sort-desc/);
    late = await page.locator('#pub-docs-body .pub-table-status').evaluateAll((els) => els.map((e) => Number(e.dataset.late)));
    expect(late).toEqual([...late].sort((a, b) => b - a));
  });
});

test.describe('documents.html, review-overdue status', () => {
  test('a document past its review date shows "Review overdue"; one that is not shows "Current"', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', AREA);
    // Seed two locally-stored documents through the real TAQA_STORE.add()
    // API (the same call upload.html's submit flow makes), one with a review
    // date safely in the past and one safely in the future, so we control
    // the exact "late" value documents.html's own late = floor((now-due)/day)
    // calculation should produce, per the code read in documents.html.
    const pastDays = 10;
    const past = new Date(Date.now() - pastDays * 86400000).toISOString().slice(0, 10);
    const future = new Date(Date.now() + 400 * 86400000).toISOString().slice(0, 10);
    await page.evaluate(
      ({ past, future }) => {
        TAQA_STORE.add({
          docNumber: 'TEST-OVERDUE-001',
          title: 'Regression Overdue Test Document',
          segment: 'coiled-tubing',
          docType: 'sop',
          status: 'current',
          issueDate: past,
          nextReviewDate: past,
          classification: 'internal',
        });
        TAQA_STORE.add({
          docNumber: 'TEST-CURRENT-001',
          title: 'Regression Current Test Document',
          segment: 'coiled-tubing',
          docType: 'sop',
          status: 'current',
          issueDate: future,
          nextReviewDate: future,
          classification: 'internal',
        });
      },
      { past, future }
    );
    await gotoApp('/documents.html?id=' + AREA);

    const overdueRow = page.locator('#pub-docs-body tr', { hasText: 'Regression Overdue Test Document' });
    const currentRow = page.locator('#pub-docs-body tr', { hasText: 'Regression Current Test Document' });

    await expect(overdueRow.locator('.pub-status-warn')).toBeVisible();
    await expect(overdueRow.locator('.pub-status-warn')).toContainText('Review overdue');
    await expect(overdueRow.locator('.pub-status-warn')).toContainText(String(pastDays) + ' days');
    await expect(overdueRow.locator('.pub-table-status')).toHaveAttribute('data-late', String(pastDays));

    await expect(currentRow.locator('.pub-status-ok')).toBeVisible();
    await expect(currentRow.locator('.pub-status-ok')).toHaveText('Current');
    await expect(currentRow.locator('.pub-table-status')).toHaveAttribute('data-late', '0');

    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('documents.html, security regression (stored XSS)', () => {
  test('a title containing HTML/script markup renders as literal escaped text, never as live markup', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', AREA);

    // A dialog firing here would mean the onerror handler actually executed,
    // i.e. the browser parsed our title as a real <img> element instead of
    // text. Fail loudly if that happens rather than silently auto-dismissing it.
    let unexpectedDialog = null;
    page.on('dialog', (d) => {
      unexpectedDialog = d.message();
      d.dismiss().catch(() => {});
    });

    const maliciousTitle = '"><img src=x onerror=alert(1)>';
    // Go through the real, page-accessible store API (the same add() that
    // upload.html's submit handler calls), not a direct DOM/localStorage hack.
    await page.evaluate((title) => {
      TAQA_STORE.add({
        docNumber: 'TEST-XSS-001',
        title,
        segment: 'coiled-tubing',
        docType: 'sop',
        status: 'current',
        issueDate: '2026-01-01',
        nextReviewDate: '2028-01-01',
        classification: 'internal',
      });
    }, maliciousTitle);
    await gotoApp('/documents.html?id=' + AREA);

    // No live <img> element anywhere in the table body: if esc() were removed
    // or bypassed, the browser would have parsed '"><img src=x onerror=...>'
    // into a real element here.
    await expect(page.locator('#pub-docs-body img')).toHaveCount(0);
    await expect(page.locator('#pub-docs-body script')).toHaveCount(0);

    // The title survives as literal text content, not stripped or altered,
    // proving it was escaped (rendered as a text node) rather than dropped.
    const row = page.locator('#pub-docs-body tr', { hasText: 'img src=x onerror=alert(1)' });
    await expect(row).toHaveCount(1);
    const titleText = await row.locator('.pdt-t').textContent();
    expect(titleText.trim()).toBe(maliciousTitle);

    // And structurally: the cell's only content for that span is a single
    // text node, never an element node (which is what a real regression,
    // dropping esc() from renderPubTable, would produce).
    const childElementCount = await row.locator('.pdt-t').evaluate((el) => el.childElementCount);
    expect(childElementCount).toBe(0);

    expect(unexpectedDialog, 'onerror handler must never fire').toBeNull();
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('documents.html, withdraw', () => {
  test('withdraw is gated behind confirm(): dismissing leaves the document untouched, accepting withdraws it', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', AREA);
    await page.evaluate(() => {
      TAQA_STORE.add({
        docNumber: 'TEST-WITHDRAW-001',
        title: 'Regression Withdraw Test Document',
        segment: 'coiled-tubing',
        docType: 'sop',
        status: 'current',
        issueDate: '2026-01-01',
        nextReviewDate: '2028-01-01',
        classification: 'internal',
      });
    });
    await gotoApp('/documents.html?id=' + AREA);

    const row = page.locator('#pub-docs-body tr', { hasText: 'Regression Withdraw Test Document' });
    await expect(row).toHaveCount(1);
    const withdrawBtn = row.locator('.pub-remove-btn');

    // Dismiss: nothing should change.
    let dialogMessage = null;
    page.once('dialog', (d) => {
      dialogMessage = d.message();
      d.dismiss();
    });
    await withdrawBtn.click();
    await page.waitForTimeout(300);
    // The confirm() text is built from the doc-title cell's full textContent
    // (doc number + title, see removeDoc()), so it leads with the doc number.
    expect(dialogMessage).toContain('Withdraw "TEST-WITHDRAW-001');
    expect(dialogMessage).toContain('Regression Withdraw Test Document');
    await expect(row).toHaveCount(1); // still there
    let status = await page.evaluate(() => TAQA_STORE.findDoc('TEST-WITHDRAW-001').status);
    expect(status).toBe('current');

    // Accept: the document is withdrawn (status -> obsolete) and the row
    // leaves this "live" list, matching what removeDoc() + buildAllDocs()
    // do in the code (documents.html only shows status current/under-review).
    page.once('dialog', (d) => d.accept());
    await withdrawBtn.click();
    await expect(page.locator('#dash-toast-msg')).toHaveText('Withdrawn. Marked obsolete in the register.');
    await expect(page.locator('#pub-docs-body tr', { hasText: 'Regression Withdraw Test Document' })).toHaveCount(0);
    status = await page.evaluate(() => TAQA_STORE.findDoc('TEST-WITHDRAW-001').status);
    expect(status).toBe('obsolete');

    assertNoConsoleErrors(consoleErrors);
  });
});
