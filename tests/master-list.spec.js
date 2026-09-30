// Regression suite for master-list.html (the QMS/auditor-only company-wide
// register).
//
// Role checks below are framed as UX/business-rule tests, not security
// tests: roles.js says outright (see its file header) that this is a
// specification the browser can be made to ignore, not a security boundary,
// so these tests exist to prove the intended experience for each role, not
// to claim the app is "secure" against a user editing their own storage.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

async function openAs(gotoApp, setRole, role, area) {
  await gotoApp('/index.html');
  await setRole(role, area || 'coiled-tubing');
  await gotoApp('/master-list.html');
}

test.describe('master-list.html, role gating (business rule, not a security boundary)', () => {
  for (const role of ['qms', 'auditor']) {
    test(`${role} (registerView) reaches the real register`, async ({ page, gotoApp, setRole, consoleErrors }) => {
      await openAs(gotoApp, setRole, role);
      await expect(page).toHaveTitle(/Master Document List/);
      await expect(page.locator('#reg')).toBeVisible();
      await expect(page.locator('#rows tr').first()).toBeVisible();
      // The refusal screen replaces <body> wholesale, so its heading must be absent.
      await expect(page.getByText('The Master List is the document controller')).toHaveCount(0);
      assertNoConsoleErrors(consoleErrors);
    });
  }

  for (const role of ['employee', 'owner']) {
    test(`${role} (no registerView) is refused, told why, and offered another way to work`, async ({
      page,
      gotoApp,
      setRole,
      consoleErrors,
    }) => {
      await openAs(gotoApp, setRole, role);
      await expect(page.getByText('The Master List is the document controller')).toBeVisible();
      // #reg never rendered: the refusal script calls window.stop() and
      // replaces document.body before the register script block runs.
      await expect(page.locator('#reg')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Search the documents' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
      assertNoConsoleErrors(consoleErrors);
    });
  }
});

test.describe('master-list.html, bulk actions', () => {
  // The bulk action is QMS's own step and only that. It used to call
  // setStatus('current'), which put every selected draft in force with no
  // Director and no approver's name on the record (release QA, Sept 2026).
  test('Confirm selected does the QMS check on every selected draft and sends it to its Director, never straight to Current', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    // Every draft in the register fits on one page (PER_PAGE=20), so
    // "select all on this page" selects every draft in one go.
    await gotoApp('/master-list.html?view=draft');

    const checkboxes = page.locator('#rows .row-chk');
    const rowCount = await checkboxes.count();
    expect(rowCount).toBeGreaterThan(0);
    const docNumbers = await checkboxes.evaluateAll((els) => els.map((e) => e.dataset.doc));
    const waitingOnQms = await page.evaluate(
      (nums) => nums.filter((n) => TAQA_APPROVAL.stageOf(TAQA_STORE.findDoc(n)) === 'qms'),
      docNumbers
    );
    expect(waitingOnQms.length).toBeGreaterThan(0);

    await expect(page.locator('#bulk-bar')).toBeHidden();
    await page.locator('#sel-all').check();
    await expect(page.locator('#bulk-bar')).toBeVisible();
    await expect(page.locator('#bulk-count')).toHaveText(rowCount + ' documents selected');
    await expect(page.locator('#bulk-approve')).toHaveText('Confirm selected (QMS check)');

    let dialogText = '';
    page.once('dialog', (d) => { dialogText = d.message(); d.accept(); });
    await page.locator('#bulk-approve').click();

    await expect(page.locator('#toast')).toContainText('Confirmed ' + waitingOnQms.length + ' document');
    await expect(page.locator('#toast')).toContainText('on the Director');
    expect(dialogText).toContain('not in force until the Director approves');
    await expect(page.locator('#bulk-bar')).toBeHidden();

    const after = await page.evaluate(
      (nums) => nums.map((n) => { const d = TAQA_STORE.findDoc(n); return { status: d.status, stage: d.approvalStage, by: d.countersignedBy, approvedBy: d.approvedBy || null }; }),
      waitingOnQms
    );
    for (const d of after) {
      expect(d.status).toBe('draft');
      expect(d.stage).toBe('director');
      expect(d.by).toBeTruthy();
      expect(d.approvedBy).toBeNull();
    }
    // Nothing selected went into force.
    const statuses = await page.evaluate((nums) => nums.map((n) => TAQA_STORE.findDoc(n).status), docNumbers);
    expect(statuses.includes('current')).toBe(false);

    assertNoConsoleErrors(consoleErrors);
  });

  test('Withdraw selected only acts on the rows actually checked, leaving the rest untouched', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/master-list.html?view=current&seg=coiled-tubing');

    const checkboxes = page.locator('#rows .row-chk');
    const total = await checkboxes.count();
    expect(total).toBeGreaterThan(2);
    const allDocNumbers = await checkboxes.evaluateAll((els) => els.map((e) => e.dataset.doc));
    const [pick1, pick2, ...rest] = allDocNumbers;

    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    await expect(page.locator('#bulk-count')).toHaveText('2 documents selected');

    page.once('dialog', (d) => d.accept());
    await page.locator('#bulk-withdraw').click();
    await expect(page.locator('#toast')).toContainText('Withdrew 2 document');

    const pickedStatuses = await page.evaluate(
      (nums) => nums.map((n) => TAQA_STORE.findDoc(n).status),
      [pick1, pick2]
    );
    expect(pickedStatuses).toEqual(['obsolete', 'obsolete']);

    // A sample of the untouched rest must still be exactly what it was
    // (current), proving the action was scoped to the selection.
    const untouchedSample = rest.slice(0, 3);
    const untouchedStatuses = await page.evaluate(
      (nums) => nums.map((n) => TAQA_STORE.findDoc(n).status),
      untouchedSample
    );
    expect(untouchedStatuses.every((s) => s === 'current')).toBe(true);

    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('master-list.html, auditor stays read-only', () => {
  test('auditor has no bulk-selection UI and cannot trigger a bulk action', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await openAs(gotoApp, setRole, 'auditor');

    // canBulk() is TAQA_ROLES[role].countersign, which is false for auditor
    // (roles.js), so renderRole() adds .no-bulk to #reg, which hides the
    // whole checkbox column via CSS.
    await expect(page.locator('#reg')).toHaveClass(/no-bulk/);
    await expect(page.locator('#reg th.bulk-col')).toBeHidden();
    await expect(page.locator('#reg td.bulk-col').first()).toBeHidden();
    await expect(page.locator('#bulk-bar')).toBeHidden();

    // Even calling the JS directly (bypassing the hidden checkboxes) must
    // refuse: bulkAction() itself gates on canBulk().
    const before = await page.evaluate(() => TAQA_STORE.findDoc('TQ-TWS-CTSS-SOP-001').status);
    page.on('dialog', (d) => d.accept()); // would accept if a confirm somehow appeared
    await page.evaluate(() => {
      selectedRows.add('TQ-TWS-CTSS-SOP-001');
      bulkAction('withdraw');
    });
    const after = await page.evaluate(() => TAQA_STORE.findDoc('TQ-TWS-CTSS-SOP-001').status);
    expect(after).toBe(before);

    assertNoConsoleErrors(consoleErrors);
  });

  test('auditor sees only read links in the detail drawer, never a write/approve/edit control', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await openAs(gotoApp, setRole, 'auditor');
    await page.locator('#rows tr').first().click();
    await expect(page.locator('#dw')).toHaveClass(/open/);

    const footButtons = page.locator('#dw-foot a, #dw-foot button');
    const count = await footButtons.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const el = footButtons.nth(i);
      const tag = await el.evaluate((e) => e.tagName.toLowerCase());
      // Every control in the drawer footer is a plain navigation link
      // (Open document / Master in SCORE), never a button wired to
      // approve/countersign/patch/setStatus.
      expect(tag).toBe('a');
      await expect(el).toHaveAttribute('href', /.+/);
    }
    // Export is still available (export:true for auditor, a read, not a write).
    await expect(page.locator('#export-btn')).toBeVisible();

    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('master-list.html, query-string filters (readUrl())', () => {
  test('a malformed/unknown filter value in the URL is ignored, not applied', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp(
      '/master-list.html?seg=not-a-real-segment&status=not-a-real-status&cls=not-a-real-class&lang=xx&view=not-a-real-view'
    );

    // readUrl() only assigns a <select>'s value when the URL's value matches
    // one of its real <option>s; every field here is nonsense, so all five
    // must sit at their default, unfiltered option, and quick must stay
    // 'controlled' (its default), never 'not-a-real-view'.
    await expect(page.locator('#f-seg')).toHaveValue('');
    await expect(page.locator('#f-status')).toHaveValue('');
    await expect(page.locator('#f-cls')).toHaveValue('');
    await expect(page.locator('#f-lang')).toHaveValue('');
    const quick = await page.evaluate(() => quick /* eslint-disable-line no-undef */);
    expect(quick).toBe('controlled');
    // The default "All controlled" quick-cut button reads as pressed.
    await expect(page.locator('.nav-i[aria-pressed="true"] span')).toHaveText('All controlled');

    assertNoConsoleErrors(consoleErrors);
  });

  test('a well-formed filter value in the URL IS applied (control case)', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/master-list.html?seg=fracturing&status=current&view=current');

    await expect(page.locator('#f-seg')).toHaveValue('fracturing');
    await expect(page.locator('#f-status')).toHaveValue('current');
    const quick = await page.evaluate(() => quick /* eslint-disable-line no-undef */);
    expect(quick).toBe('current');
    const rowSegs = await page.locator('#rows tr td:nth-child(3) .org').allTextContents();
    expect(rowSegs.length).toBeGreaterThan(0);
    expect(rowSegs.every((s) => s.trim() === 'Fracturing')).toBe(true);

    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('master-list.html, chart tooltips (regression: missing #tip element)', () => {
  test('hovering a segment bar throws no error and shows a non-empty tooltip', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await openAs(gotoApp, setRole, 'qms');

    const tip = page.locator('#tip');
    await expect(tip).not.toHaveClass(/\bon\b/); // not showing yet
    const bar = page.locator('#ch-seg .mcol').first();
    await expect(bar).toBeVisible();
    await bar.hover();

    await expect(tip).toHaveClass(/\bon\b/);
    const text = (await tip.textContent()) || '';
    expect(text.trim().length).toBeGreaterThan(0);

    assertNoConsoleErrors(consoleErrors);
  });

  test('hovering a donut wedge throws no error and shows a non-empty tooltip', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await openAs(gotoApp, setRole, 'qms');

    const wedge = page.locator('#dn-mix circle[data-q]').first();
    await expect(wedge).toHaveCount(1);
    // The wedges are concentric <circle>s (fill:none, only the ring stroke
    // is painted), so the center point a plain hover() targets sits in the
    // unpainted middle and never actually hits the ring. Dispatch the same
    // mouseenter/mousemove pair bindTip() itself listens for instead, which
    // still exercises the real handler (and the bug this guards: #tip not
    // existing meant `tip.textContent=…` inside this handler threw).
    await wedge.evaluate((el) => {
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: 200, clientY: 200 }));
      el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 200, clientY: 200 }));
    });

    const tip = page.locator('#tip');
    await expect(tip).toHaveClass(/\bon\b/);
    const text = (await tip.textContent()) || '';
    expect(text.trim().length).toBeGreaterThan(0);

    assertNoConsoleErrors(consoleErrors);
  });

  test('hovering an ageing-overdue column throws no error and shows a non-empty tooltip', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await openAs(gotoApp, setRole, 'qms');

    const bar = page.locator('#ch-age .mcol').first();
    await expect(bar).toBeVisible();
    await bar.hover();

    const tip = page.locator('#tip');
    await expect(tip).toHaveClass(/\bon\b/);
    const text = (await tip.textContent()) || '';
    expect(text.trim().length).toBeGreaterThan(0);

    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('master-list.html, export (TQ-QHSE-F086)', () => {
  test('export is available to qms and auditor and never throws when triggered', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await openAs(gotoApp, setRole, 'qms');
    const exportBtn = page.locator('#export-btn');
    await expect(exportBtn).toBeVisible();

    // exportCsv() takes the real-download branch when not framed (this page
    // is top-level in the test), and falls back to a clipboard copy + toast
    // when it is. Either is a legitimate outcome in a sandboxed browser; the
    // regression this guards is a thrown error / dead button, not which of
    // the two paths fires here.
    const downloadPromise = page.waitForEvent('download', { timeout: 4000 }).catch(() => null);
    await exportBtn.click();
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toMatch(/^TQ-QHSE-F086_Master_Document_List_\d{4}-\d{2}-\d{2}\.csv$/);
    } else {
      // No download event landed in this sandbox: confirm the app's own
      // fallback path ran instead of silently doing nothing.
      await expect(page.locator('#toast')).toHaveClass(/on/, { timeout: 3000 });
      const toastText = (await page.locator('#toast').textContent()) || '';
      expect(toastText.length).toBeGreaterThan(0);
    }

    assertNoConsoleErrors(consoleErrors);
  });

  test('export button is also visible to auditor (export:true) and does not throw', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await openAs(gotoApp, setRole, 'auditor');
    const exportBtn = page.locator('#export-btn');
    await expect(exportBtn).toBeVisible();

    const downloadPromise = page.waitForEvent('download', { timeout: 4000 }).catch(() => null);
    await exportBtn.click();
    await downloadPromise;

    assertNoConsoleErrors(consoleErrors);
  });
});
