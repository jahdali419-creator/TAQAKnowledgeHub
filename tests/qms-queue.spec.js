// QMS's queue, one-file upload and the bulk QMS confirm preview.
//
// The bell was always company-wide for QMS, but "Open your queue" and
// "+N more" opened one segment's desk, so QMS saw two documents under a bell
// that counted sixteen. They now open the Master List's "Waiting on QMS"
// view, which holds every document at the QMS stage from every area.
//
// Upload used to file several selected files onto ONE record with one
// number, and the approver's card showed only the first file. One file is
// now one controlled document, and a multi-file selection is refused with a
// reason.
//
// Bulk confirm used to ask a count-only browser confirm(). It now previews
// every document it will confirm and every one it leaves out (with why),
// confirms each on its own, and reports a result per document.
//
// The suite's chromium (1440) and mobile-chrome (Pixel 7) projects run every
// test here, so each is checked on desktop and phone; the last block also
// emulates the installed app (display-mode: standalone) on a phone.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

const SEEDED = [
  { seg: 'coiled-tubing', area: 'Coiled Tubing, Operations' },
  { seg: 'drilling', area: 'Drilling Services, Operations' },
  { seg: 'qhse', area: 'QHSE' },
  { seg: 'wireline', area: 'Wireline Services, Maintenance', maint: true },
];
const num = (seg) => 'TQ-QQ-' + seg;
const title = (seg) => 'QQ ' + seg + ' procedure';

// An Employee files one draft in each of four areas (one a maintenance
// document), then the browser becomes QMS.
async function seedAsQms(page, gotoApp) {
  await gotoApp('/index.html');
  await page.evaluate((seeded) => {
    localStorage.clear();
    localStorage.setItem('taqa-tour-done', '1');
    localStorage.setItem('taqa-install-dismissed', String(Date.now()));
    TAQA_ROLE.set('employee');
    seeded.forEach((s) => TAQA_STORE.add({
      title: 'QQ ' + s.seg + ' procedure', segment: s.seg, docType: 'sop',
      docNumber: 'TQ-QQ-' + s.seg, summary: 'Queue regression document.',
      department: s.maint ? 'maintenance' : null,
    }));
    TAQA_ROLE.set('qms');
  }, SEEDED);
}

async function openBell(page) {
  await page.locator('#nav-bell').click();
  await expect(page.locator('.bell-menu')).toBeVisible();
}

const bellTitles = (page) => page.locator('.bell-i .bt').allTextContents();
const waitingOnQms = (page) => page.evaluate(() =>
  TAQA_STORE.all().filter((d) => TAQA_APPROVAL.stageOf(d) === 'qms').map((d) => d.docNumber).sort());

test.describe('QMS bell: company-wide on every page', () => {
  test('on Home, QMS sees documents from every area', async ({ page, gotoApp, consoleErrors }) => {
    await seedAsQms(page, gotoApp);
    await gotoApp('/index.html');
    await openBell(page);
    const titles = await bellTitles(page);
    for (const s of SEEDED) expect(titles).toContain(title(s.seg));
    assertNoConsoleErrors(consoleErrors);
  });

  test('inside Coiled Tubing, QMS still sees Drilling, QHSE and Wireline', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp);
    await gotoApp('/segment.html?id=coiled-tubing');
    await openBell(page);
    const titles = await bellTitles(page);
    expect(titles).toContain(title('drilling'));
    expect(titles).toContain(title('qhse'));
    expect(titles).toContain(title('wireline'));
  });

  test('inside Drilling, QMS still sees Coiled Tubing, and the item opens it', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp);
    await gotoApp('/segment.html?id=drilling');
    await openBell(page);
    const ct = page.locator('.bell-i', { hasText: title('coiled-tubing') });
    await expect(ct).toBeVisible();
    await ct.click();
    await expect(page).toHaveURL(/dashboard\.html\?id=coiled-tubing$/);
    await expect(page.locator('#pending-list .pending-card', { hasText: title('coiled-tubing') })).toBeVisible();
  });

  test('every bell item says where it is from, what it waits for and when', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp);
    await gotoApp('/segment.html?id=drilling');
    await openBell(page);
    for (const s of SEEDED) {
      const item = page.locator('.bell-i', { hasText: title(s.seg) });
      await expect(item).toContainText(num(s.seg));
      await expect(item).toContainText(s.area);
      await expect(item).toContainText('Waiting for your conformance check');
      await expect(item).toContainText(/submitted \d{2} \w{3} \d{4}, \d{2}:\d{2}/);
    }
  });
});

test.describe('QMS "Open your queue" and "+N more" open all QMS work', () => {
  for (const from of ['/index.html', '/segment.html?id=coiled-tubing', '/segment.html?id=drilling']) {
    test(`"Open your queue" from ${from} opens the company-wide Waiting on QMS view`, async ({ page, gotoApp, consoleErrors }) => {
      await seedAsQms(page, gotoApp);
      const all = await waitingOnQms(page);
      await gotoApp(from);
      await openBell(page);
      await expect(page.locator('#bell-badge')).toHaveText(String(all.length));
      await page.locator('.bell-foot').click();
      await expect(page).toHaveURL(/master-list\.html\?view=qms$/);
      await expect(page.locator('#cuts [aria-pressed="true"]')).toContainText('Waiting on QMS');
      const rows = await page.locator('#rows .row-chk').evaluateAll((els) => els.map((e) => e.dataset.doc).sort());
      expect(rows).toEqual(all);
      for (const s of SEEDED) expect(rows).toContain(num(s.seg));
      assertNoConsoleErrors(consoleErrors);
    });
  }

  test('"+N more" is a control and opens the same queue', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp);
    const all = await waitingOnQms(page);
    expect(all.length).toBeGreaterThan(6);
    await gotoApp('/segment.html?id=drilling');
    await openBell(page);
    const more = page.locator('.bell-more');
    await expect(more).toHaveText('+ ' + (all.length - 6) + ' more, see everything waiting on QMS');
    await more.click();
    await expect(page).toHaveURL(/master-list\.html\?view=qms$/);
    await expect(page.locator('#rows .row-chk')).toHaveCount(all.length);
  });

  test('a Segment Director and a Maintenance Manager keep their own area desk', async ({ page, gotoApp, setRole }) => {
    await seedAsQms(page, gotoApp);
    // Put one document at each of the two final-approval desks in Coiled Tubing.
    await page.evaluate(() => {
      TAQA_STORE.add({ title: 'QQ ct ops final', segment: 'coiled-tubing', docType: 'sop', docNumber: 'TQ-QQ-CT-OPS', summary: 'x' });
      TAQA_STORE.add({ title: 'QQ ct mx final', segment: 'coiled-tubing', docType: 'sop', docNumber: 'TQ-QQ-CT-MX', summary: 'x', department: 'maintenance' });
      TAQA_STORE.countersign('TQ-QQ-CT-OPS');
      TAQA_STORE.countersign('TQ-QQ-CT-MX');
    });
    for (const role of ['owner', 'maintenance']) {
      await setRole(role, 'coiled-tubing');
      await gotoApp('/segment.html?id=coiled-tubing');
      await openBell(page);
      await page.locator('.bell-foot').click();
      await expect(page).toHaveURL(/dashboard\.html\?id=coiled-tubing$/);
    }
  });
});

test.describe('upload: one file is one controlled document', () => {
  const MSG = 'Upload one controlled document at a time. Bulk upload will be supported separately.';

  // Several files arriving at once, the way a drag and drop delivers them.
  async function dropFiles(page, names) {
    await page.evaluate((names) => {
      const dt = new DataTransfer();
      names.forEach((n) => dt.items.add(new File(['%PDF-1.4 ' + n], n, { type: 'application/pdf' })));
      document.getElementById('drop-zone').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
    }, names);
  }

  test('the picker takes one file, and several files are refused with a clear message', async ({ page, gotoApp, setRole, consoleErrors }) => {
    await seedAsQms(page, gotoApp);
    await setRole('employee', 'coiled-tubing');
    await gotoApp('/upload.html');
    expect(await page.locator('#file-input').evaluate((el) => el.multiple)).toBe(false);
    const before = await page.evaluate(() => TAQA_STORE.added().length);

    await dropFiles(page, ['SOP-1.pdf', 'SOP-2.pdf', 'SOP-3.pdf']);
    await expect(page.locator('#one-file-note')).toBeVisible();
    await expect(page.locator('#one-file-note')).toHaveText('3 files were selected, so none was added. ' + MSG);
    await expect(page.locator('#toast-title')).toHaveText('One document at a time');
    await expect(page.locator('#file-list .file-item')).toHaveCount(0);
    await expect(page.locator('#go-2')).toBeDisabled();
    expect(await page.evaluate(() => TAQA_STORE.added().length)).toBe(before);
    assertNoConsoleErrors(consoleErrors);
  });

  test('a second file is refused while one is attached; removing it lets another in', async ({ page, gotoApp, setRole }) => {
    await seedAsQms(page, gotoApp);
    await setRole('employee', 'coiled-tubing');
    await gotoApp('/upload.html');
    await page.setInputFiles('#file-input', { name: 'first.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 a') });
    await expect(page.locator('#file-list .file-item')).toHaveCount(1);
    await expect(page.locator('#one-file-note')).toBeHidden();

    await page.setInputFiles('#file-input', { name: 'second.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 b') });
    await expect(page.locator('#one-file-note')).toContainText('This upload already has a file, so "second.pdf" was not added. ' + MSG);
    await expect(page.locator('#file-list .file-item')).toHaveCount(1);
    await expect(page.locator('.file-item-name')).toHaveText('first.pdf');

    await page.locator('.file-remove').click();
    await expect(page.locator('#one-file-note')).toBeHidden();
    await page.setInputFiles('#file-input', { name: 'second.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 b') });
    await expect(page.locator('.file-item-name')).toHaveText('second.pdf');
  });

  test('filing makes one record carrying exactly one file', async ({ page, gotoApp, setRole }) => {
    await seedAsQms(page, gotoApp);
    await setRole('employee', 'coiled-tubing');
    await gotoApp('/upload.html');
    await page.setInputFiles('#file-input', { name: 'one.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') });
    await page.click('#go-2');
    await page.selectOption('#seg-select', 'coiled-tubing');
    await page.selectOption('#doc-type-select', 'sop');
    await page.click('#go-3');
    await page.fill('#doc-title-input', 'QQ one file one record');
    await page.fill('#summary-main', 'A single controlled document filed by the queue regression suite.');
    await page.selectOption('#audience-select', { index: 1 });
    await page.click('#go-4');
    await page.click('#submit-btn');
    await expect(page.locator('#toast-title')).toHaveText('Submitted for review');
    const recs = await page.evaluate(() => TAQA_STORE.all().filter((d) => d.title === 'QQ one file one record')
      .map((d) => (d.files || []).map((f) => f.name)));
    expect(recs).toEqual([['one.pdf']]);
  });
});

test.describe('bulk QMS confirm: preview, exclusions, a result per document', () => {
  async function selectInDraftView(page, gotoApp, nums) {
    await gotoApp('/master-list.html?view=draft');
    for (const n of nums) await page.locator(`#rows .row-chk[data-doc="${n}"]`).check();
    await expect(page.locator('#bulk-count')).toHaveText(nums.length + (nums.length === 1 ? ' document' : ' documents') + ' selected');
  }

  test('the preview lists every document to be confirmed, and names each one left out with the reason', async ({ page, gotoApp, consoleErrors }) => {
    await seedAsQms(page, gotoApp);
    // QHSE's document has already had its QMS check, so it is not eligible.
    await page.evaluate(() => TAQA_STORE.countersign('TQ-QQ-qhse'));
    let nativeDialog = false;
    page.on('dialog', (d) => { nativeDialog = true; d.dismiss(); });
    await selectInDraftView(page, gotoApp, SEEDED.map((s) => num(s.seg)));
    await page.locator('#bulk-approve').click();

    const dlg = page.locator('#bulk-dlg');
    await expect(dlg).toBeVisible();
    expect(nativeDialog).toBe(false);
    await expect(page.locator('#bulk-dlg-h')).toHaveText('Confirm 3 documents as checked by QMS');
    await expect(page.locator('#bulk-dlg-lead')).toContainText('1 of the selected documents is left out');

    const incl = page.locator('#bq-in .bq-i');
    await expect(incl).toHaveCount(3);
    for (const s of SEEDED.filter((x) => x.seg !== 'qhse')) {
      const row = incl.filter({ hasText: title(s.seg) });
      await expect(row).toContainText(num(s.seg));
      await expect(row).toContainText(s.area);
      await expect(row).toContainText('Now: waiting on the QMS check');
      await expect(row).toContainText('next:');
    }
    await expect(incl.filter({ hasText: title('wireline') })).toContainText('next: Maintenance Manager');

    const out = page.locator('#bq-out .bq-i');
    await expect(out).toHaveCount(1);
    await expect(out).toContainText(title('qhse'));
    await expect(out).toContainText(num('qhse'));
    await expect(out).toContainText('Already checked by QMS');

    // Nothing has changed yet, and Cancel changes nothing.
    await page.locator('#bulk-dlg-cancel').click();
    await expect(dlg).toBeHidden();
    const stages = await page.evaluate((ns) => ns.map((n) => TAQA_APPROVAL.stageOf(TAQA_STORE.findDoc(n))),
      ['TQ-QQ-coiled-tubing', 'TQ-QQ-drilling', 'TQ-QQ-wireline']);
    expect(stages).toEqual(['qms', 'qms', 'qms']);
    // There is no bulk reject anywhere.
    await expect(page.locator('#bulk-bar button', { hasText: /reject/i })).toHaveCount(0);
    await expect(page.locator('#bulk-dlg button', { hasText: /reject/i })).toHaveCount(0);
    assertNoConsoleErrors(consoleErrors);
  });

  test('each document gets its own result, and one that changed after the preview fails on its own line', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp);
    const picks = ['coiled-tubing', 'drilling', 'wireline'].map(num);
    await selectInDraftView(page, gotoApp, picks);
    await page.locator('#bulk-approve').click();
    await expect(page.locator('#bq-in .bq-i')).toHaveCount(3);
    // Rejected elsewhere while the preview was open.
    await page.evaluate(() => TAQA_STORE.reject('TQ-QQ-drilling', 'Wrong revision, sent back by the suite'));
    await page.locator('#bulk-dlg-go').click();

    await expect(page.locator('#bulk-dlg-h')).toHaveText('2 confirmed, 1 not confirmed');
    const res = page.locator('#bq-results .bq-i');
    await expect(res).toHaveCount(3);
    await expect(res.filter({ hasText: title('coiled-tubing') }).locator('.bq-res')).toHaveText(/Confirmed\. Now waiting on the Director's final approval\./);
    await expect(res.filter({ hasText: title('wireline') }).locator('.bq-res')).toHaveText(/Confirmed\. Now waiting on the Maintenance Manager's final approval\./);
    const failed = res.filter({ hasText: title('drilling') }).locator('.bq-res');
    await expect(failed).toHaveAttribute('data-ok', 'false');
    await expect(failed).toContainText('Not confirmed. Sent back to its author');
    await expect(page.locator('#bulk-dlg-go')).toBeHidden();

    const after = await page.evaluate((ns) => ns.map((n) => { const d = TAQA_STORE.findDoc(n); return [d.status, TAQA_APPROVAL.stageOf(d), !!d.rejected]; }), picks);
    expect(after).toEqual([['draft', 'director', false], ['draft', null, true], ['draft', 'director', false]]);
    await page.locator('#bulk-dlg-cancel').click();
    await expect(page.locator('#bulk-dlg')).toBeHidden();
    await expect(page.locator('#bulk-bar')).toBeHidden();
  });

  test('nothing eligible: the dialog names what was left out and offers no confirm', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp);
    await page.evaluate(() => TAQA_STORE.countersign('TQ-QQ-qhse'));
    await selectInDraftView(page, gotoApp, [num('qhse')]);
    await page.locator('#bulk-approve').click();
    await expect(page.locator('#bulk-dlg-h')).toHaveText('Nothing selected is waiting on the QMS check');
    await expect(page.locator('#bq-out .bq-i')).toContainText(title('qhse'));
    await expect(page.locator('#bulk-dlg-go')).toBeHidden();
    await expect(page.locator('#bulk-dlg-cancel')).toHaveText('Close');
  });

  test('the preview fits the screen and its buttons can be reached', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp);
    await selectInDraftView(page, gotoApp, SEEDED.map((s) => num(s.seg)));
    await page.locator('#bulk-approve').click();
    const box = await page.locator('#bulk-dlg').boundingBox();
    const vp = page.viewportSize();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
    expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
    await expect(page.locator('#bulk-dlg-go')).toBeInViewport();
    await expect(page.locator('#bulk-dlg-cancel')).toBeInViewport();
  });
});

test.describe('installed app (display-mode: standalone), phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const mm = window.matchMedia.bind(window);
      window.matchMedia = (q) => (/display-mode:\s*standalone/.test(q)
        ? { matches: true, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } }
        : mm(q));
    });
  });

  test('no install sheet; the bell opens, items are tappable, and the queue is all QMS work', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp);
    await page.evaluate(() => localStorage.removeItem('taqa-install-dismissed'));
    const all = await waitingOnQms(page);
    await gotoApp('/segment.html?id=drilling');
    await page.waitForTimeout(2800); // past the point the install sheet would open in a browser
    await expect(page.locator('#pwa-overlay.pwa-open')).toHaveCount(0);
    await page.locator('#nav-bell').tap();
    await expect(page.locator('.bell-menu')).toBeVisible();
    await expect(page.locator('.bell-i', { hasText: title('coiled-tubing') })).toBeVisible();
    await page.locator('.bell-foot').tap();
    await expect(page).toHaveURL(/master-list\.html\?view=qms$/);
    await expect(page.locator('#rows .row-chk')).toHaveCount(all.length);
  });
});
