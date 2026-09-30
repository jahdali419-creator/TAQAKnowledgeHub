// Release QA regression suite (Sept 2026).
//
// One transaction walked through every role the way a person does it, then
// one test per defect the release audit found, each written so it fails on
// the code before the fix. The workflow itself (upload, QMS check, Director
// approval) is always driven through the page, never by writing the register
// directly. TAQA_STORE is only read, or called the way a user with a browser
// console could call it, to prove the rule holds where the record is written.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

const SEG = 'coiled-tubing';

async function prime(page, gotoApp, clearAppState, setRole, role, area) {
  await gotoApp('/index.html');
  await clearAppState();
  await page.evaluate(() => {
    localStorage.setItem('taqa-tour-done', '1');
    localStorage.setItem('taqa-install-dismissed', String(Date.now()));
  });
  await setRole(role, area || SEG);
}

async function as(page, gotoApp, setRole, role, area) {
  await setRole(role, area || SEG);
  await gotoApp('/index.html');
}

// Files a document through upload.html's own four steps.
async function fileThroughUpload(page, gotoApp, title) {
  await gotoApp('/upload.html');
  await page.setInputFiles('#file-input', {
    name: 'release-qa.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n'),
  });
  await page.click('#go-2');
  await page.selectOption('#seg-select', SEG);
  await page.selectOption('#doc-type-select', 'sop');
  await page.click('#go-3');
  await page.fill('#doc-title-input', title);
  await page.fill('#summary-main', 'Release QA regression document, walked through every role by the test suite.');
  await page.selectOption('#audience-select', { index: 1 });
  await page.click('#go-4');
  await page.click('#submit-btn');
  await expect(page.locator('#toast-title')).toHaveText('Submitted for review');
  return page.evaluate((t) => TAQA_STORE.all().filter((d) => d.title === t).map((d) => d.docNumber), title);
}

test.describe('one document, every role, through the UI', () => {
  test('Employee files -> QMS checks -> Director approves -> published -> Auditor sees the full signed trail', async ({
    page, gotoApp, setRole, clearAppState, consoleErrors, topbar,
  }) => {
    const TITLE = 'E2E-ROLE-TEST-' + Date.now();
    await prime(page, gotoApp, clearAppState, setRole, 'employee');

    // Employee: the Upload action is there, and filing creates exactly one record.
    await gotoApp('/index.html');
    // In the bar on desktop, in the menu on a phone.
    await expect(await topbar.upload()).toBeVisible();
    const nums = await fileThroughUpload(page, gotoApp, TITLE);
    expect(nums).toHaveLength(1);
    const N = nums[0];
    await expect(page.locator('#toast-sub')).toContainText('QMS checks it, then the Director approves it');
    await expect(page.locator('#toast-sub')).toContainText('in force only after both');
    const filed = await page.evaluate((n) => TAQA_STORE.findDoc(n), N);
    expect(filed.status).toBe('draft');
    expect(filed.approvalStage).toBe('qms');
    expect(filed.submittedBy).toBe('Employee');
    expect(filed.submittedAt).toBeTruthy();
    await expect(page.locator('#my-subs-list li', { hasText: TITLE })).toContainText('Waiting on QMS check');

    // The submitter can open their own draft and is told where it is.
    await gotoApp('/viewer.html?doc=' + N + '&seg=' + SEG);
    await expect(page.locator('#doc-title')).toHaveText(TITLE);
    await expect(page.locator('#lifecycle-banner')).toContainText('Submitted for approval, not in force yet');
    await expect(page.locator('#lifecycle-banner')).toContainText('QMS conformance check');
    // Its way out is a page an Employee may open, not the Master List that refuses them.
    await expect(page.locator('#lifecycle-banner a')).toHaveAttribute('href', 'ai-search.html');

    // QMS: the desk shows who filed it, when, and the file; Confirm sends it on.
    await as(page, gotoApp, setRole, 'qms');
    await gotoApp('/dashboard.html?id=' + SEG);
    await expect(page.locator('#queue-title')).toHaveText('Awaiting Your QMS Check');
    const qCard = page.locator('.pending-card', { hasText: TITLE });
    await expect(qCard.locator('.pending-doc-meta')).toContainText('Submitted by Employee');
    await expect(qCard.locator('.pending-doc-meta')).toContainText('release-qa.pdf');
    await qCard.locator('.btn-approve').click();
    await expect.poll(() => page.evaluate((n) => TAQA_STORE.findDoc(n).approvalStage, N)).toBe('director');
    const checked = await page.evaluate((n) => TAQA_STORE.findDoc(n), N);
    expect(checked.status).toBe('draft');
    expect(checked.countersignedBy).toBe('QMS / Document Controller');
    expect(checked.countersignedAt).toBeTruthy();

    // Director of the area: Approve is what publishes it.
    await as(page, gotoApp, setRole, 'owner', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    const dCard = page.locator('.pending-card', { hasText: TITLE });
    await dCard.locator('.btn-approve').click();
    await expect.poll(() => page.evaluate((n) => TAQA_STORE.findDoc(n).status, N)).toBe('current');
    const released = await page.evaluate((n) => TAQA_STORE.findDoc(n), N);
    expect(released.approvedBy).toBe('Segment Director');
    expect(released.approvedAt).toBeTruthy();

    // Published: the Employee now opens it as a current document.
    await as(page, gotoApp, setRole, 'employee');
    await gotoApp('/viewer.html?doc=' + N + '&seg=' + SEG);
    await expect(page.locator('#doc-title')).toHaveText(TITLE);
    await expect(page.locator('#meta-grid')).toContainText('Current, OK to use');
    await gotoApp('/upload.html');
    await expect(page.locator('#my-subs-list li', { hasText: TITLE })).toContainText('Published');

    // Auditor: the trail names all three steps, each with its time.
    await as(page, gotoApp, setRole, 'auditor');
    await gotoApp('/viewer.html?doc=' + N + '&seg=' + SEG);
    const trail = page.locator('#appr-trail');
    await expect(trail).toContainText('Employee');
    await expect(trail).toContainText('Submitted for approval');
    await expect(trail).toContainText('QMS / Document Controller');
    await expect(trail).toContainText('Segment Director');
    await expect(trail).toContainText(/\d{2}:\d{2}/);

    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('the register refuses writes a role does not hold, wherever they come from', () => {
  // Before the fix setStatus() and patch() checked nothing, so an Employee or
  // an auditor could withdraw or rename a live procedure from the console.
  for (const role of ['employee', 'auditor']) {
    test(`${role} cannot withdraw, edit or delete a published document`, async ({ page, gotoApp, setRole, clearAppState }) => {
      await prime(page, gotoApp, clearAppState, setRole, role);
      await gotoApp('/index.html');
      const r = await page.evaluate((seg) => {
        const d = TAQA_STORE.all().find((x) => x.segment === seg && x.status === 'current');
        const out = {
          setStatus: TAQA_STORE.setStatus(d.docNumber, 'obsolete'),
          patch: TAQA_STORE.patch(d.docNumber, { title: 'tampered' }),
          remove: TAQA_STORE.remove(d.docNumber),
        };
        const after = TAQA_STORE.findDoc(d.docNumber);
        out.status = after.status; out.title = after.title; out.was = d.title;
        return out;
      }, SEG);
      expect(r.setStatus).toBeNull();
      expect(r.patch.ok).toBe(false);
      expect(r.remove).toBe(false);
      expect(r.status).toBe('current');
      expect(r.title).toBe(r.was);
    });
  }

  test('an auditor cannot file a document, not even through the store', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'auditor');
    await gotoApp('/index.html');
    const added = await page.evaluate(() => TAQA_STORE.add({ title: 'auditor filing', segment: 'coiled-tubing', docType: 'sop' }));
    expect(added).toBeNull();
    await gotoApp('/upload.html');
    await expect(page.locator('h1')).toHaveText('Filing documents is not part of this role');
    await expect(page.locator('#submit-btn')).toHaveCount(0);
  });

  test('nobody puts a document in force except through the Director step', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'qms');
    await gotoApp('/index.html');
    const r = await page.evaluate(() => {
      const d = TAQA_STORE.all().find((x) => TAQA_APPROVAL.stageOf(x) === 'qms');
      return {
        n: d.docNumber,
        setCurrent: TAQA_STORE.setStatus(d.docNumber, 'current'),
        patchStatus: TAQA_STORE.patch(d.docNumber, { status: 'current' }),
        patchSigner: TAQA_STORE.patch(d.docNumber, { approvedBy: 'Someone' }),
        after: TAQA_STORE.findDoc(d.docNumber).status,
      };
    });
    expect(r.setCurrent).toBeNull();
    expect(r.patchStatus.ok).toBe(false);
    expect(r.patchSigner.ok).toBe(false);
    expect(r.after).toBe('draft');
  });

  test('a Director can withdraw in their own area only', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'owner', 'drilling');
    await gotoApp('/index.html');
    const other = await page.evaluate((seg) => {
      const d = TAQA_STORE.all().find((x) => x.segment === seg && x.status === 'current');
      return { r: TAQA_STORE.setStatus(d.docNumber, 'obsolete'), after: TAQA_STORE.findDoc(d.docNumber).status };
    }, SEG);
    expect(other.r).toBeNull();
    expect(other.after).toBe('current');
    await setRole('owner', SEG);
    await gotoApp('/index.html');
    const own = await page.evaluate((seg) => {
      const d = TAQA_STORE.all().find((x) => x.segment === seg && x.status === 'current');
      return !!TAQA_STORE.setStatus(d.docNumber, 'obsolete') && TAQA_STORE.findDoc(d.docNumber).status;
    }, SEG);
    expect(own).toBe('obsolete');
  });
});

test.describe('upload refuses what is not a document', () => {
  // A 0-byte file used to be accepted, so an empty "procedure" could be
  // filed and go to QMS and the Director.
  test('an empty file, a disguised executable and an over-limit file are each refused with a reason', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/upload.html');
    await page.setInputFiles('#file-input', { name: 'empty.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(0) });
    await expect(page.locator('#toast-title')).toHaveText('File is empty');
    await expect(page.locator('#go-2')).toBeDisabled();
    await expect(page.locator('#file-list .file-item')).toHaveCount(0);

    await page.setInputFiles('#file-input', { name: 'report.pdf.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ') });
    await expect(page.locator('#toast-title')).toHaveText('File type not permitted');
    await expect(page.locator('#go-2')).toBeDisabled();

    // The 500 MB rule, checked without allocating 500 MB: the page reads File.size.
    await page.evaluate(() => {
      const f = new File(['x'], 'huge.pdf', { type: 'application/pdf' });
      Object.defineProperty(f, 'size', { value: 501 * 1024 * 1024 });
      addFiles([f]);
    });
    await expect(page.locator('#toast-title')).toHaveText('File too large');
    await expect(page.locator('#go-2')).toBeDisabled();
  });
});

test.describe('two tabs', () => {
  // A second QMS tab opened earlier held its own copy of the register, and
  // its next write put the first tab's confirmation back to "waiting on QMS".
  test('a stale tab cannot undo a step another tab already took', async ({ page, context, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'qms');
    const b = await context.newPage();
    await gotoApp('/dashboard.html?id=' + SEG);
    await b.goto('/dashboard.html?id=' + SEG);
    await b.waitForFunction(() => document.readyState === 'complete');
    const N = await page.evaluate((seg) => TAQA_STORE.all().find((x) => x.segment === seg && TAQA_APPROVAL.stageOf(x) === 'qms').docNumber, SEG);
    // Tab B reads the record first, so it holds the pre-confirmation copy.
    expect(await b.evaluate((n) => TAQA_STORE.findDoc(n).approvalStage || 'qms', N)).toBe('qms');
    await page.locator('.pending-card', { hasText: N }).locator('.btn-approve').click();
    await expect.poll(() => page.evaluate((n) => TAQA_STORE.findDoc(n).approvalStage, N)).toBe('director');
    const second = await b.evaluate((n) => TAQA_STORE.countersign(n), N);
    expect(second.ok).toBe(false);
    expect(await page.evaluate((n) => TAQA_STORE.findDoc(n).approvalStage, N)).toBe('director');
    await b.close();
  });
});

test.describe('the bell', () => {
  test('a document title is shown as text, never run, in another role\'s bell', async ({ page, gotoApp, setRole, clearAppState, consoleErrors }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'employee');
    const payload = 'XSS <img src=x onerror="window.__bellXss=1">';
    await fileThroughUpload(page, gotoApp, payload);
    await as(page, gotoApp, setRole, 'qms');
    await page.locator('#nav-bell').click();
    const first = page.locator('.bell-i').first();
    await expect(first).toContainText('<img src=x');
    expect(await page.evaluate(() => window.__bellXss)).toBeUndefined();
    expect(await page.locator('.bell-menu img').count()).toBe(0);
    // Newest first, and it opens the desk where it can be acted on.
    await expect(first).toHaveAttribute('href', 'dashboard.html?id=' + SEG);
    assertNoConsoleErrors(consoleErrors);
  });
});

// 390 is the width it was seen at: the three-track bar put the right cluster
// in its middle track and the brand ran under the menu button.
test.describe('on a 390px phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('the brand never runs under the menu button', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'qms');
    await gotoApp('/index.html');
    const brand = await page.locator('#navbar .nav-brand').boundingBox();
    const right = await page.locator('#navbar .nav-right').boundingBox();
    expect(brand.x + brand.width).toBeLessThanOrEqual(right.x);
    expect(right.x + right.width).toBeLessThanOrEqual(390);
  });

});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true });

  test('the bell panel stays on screen', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'qms');
    await gotoApp('/index.html');
    await page.locator('#nav-bell').click();
    const m = await page.locator('.bell-menu').boundingBox();
    expect(m.x).toBeGreaterThanOrEqual(0);
    expect(m.x + m.width).toBeLessThanOrEqual(360);
  });

  test('the upload card fits the screen with a file chosen, on review, and after filing', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'employee');
    const fits = () => page.evaluate(() => document.querySelector('.upload-card').getBoundingClientRect().right <= innerWidth);
    await gotoApp('/upload.html');
    await page.setInputFiles('#file-input', { name: 'phone.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') });
    await expect(page.locator('#hash-status')).toContainText('Unique file');
    expect(await fits()).toBe(true);
    await page.click('#go-2');
    await page.selectOption('#seg-select', SEG);
    await page.selectOption('#doc-type-select', 'sop');
    await page.click('#go-3');
    await page.fill('#doc-title-input', 'Phone layout check ' + Date.now());
    await page.fill('#summary-main', 'Checks the upload card stays inside a phone screen at every step.');
    await page.selectOption('#audience-select', { index: 1 });
    await page.click('#go-4');
    expect(await fits()).toBe(true);
    await page.click('#submit-btn');
    await expect(page.locator('#toast-title')).toHaveText('Submitted for review');
    expect(await fits()).toBe(true);
    // The fingerprint of the file just filed does not linger under an empty form.
    await expect(page.locator('#hash-display')).toBeHidden();
    const step3 = await page.locator('#ustep-3').boundingBox();
    expect(step3.x + step3.width).toBeLessThanOrEqual(360);
  });

  test('the approval desk keeps its margin on both sides', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'owner', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    const list = await page.locator('#pending-list').boundingBox();
    expect(Math.round(360 - (list.x + list.width))).toBe(Math.round(list.x));
  });

  // Below 1100px the register scrolls sideways, and its sticky header was
  // pushed 64px down inside that box, over the first row: it covered the
  // title and took the tap meant for the row.
  test('the Master List header does not cover the first row, and tapping the row opens it', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'auditor');
    await gotoApp('/master-list.html');
    const head = await page.locator('thead').boundingBox();
    const row = page.locator('#rows tr').first();
    const first = await row.boundingBox();
    expect(head.y + head.height).toBeLessThanOrEqual(first.y + 1);
    await row.click();
    await expect(page.locator('#dw')).toHaveClass(/open/);
    const seg = await page.locator('#f-seg').boundingBox();
    expect(seg.x + seg.width).toBeLessThanOrEqual(360);
  });

  // The answer bubble is a flex item that would not shrink below its longest
  // word, so at 360px the result cards ran 29px off the screen.
  test('search results stay inside the screen', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/ai-search.html?q=' + encodeURIComponent('Pre-Job Safety Checklist'));
    const bubble = page.locator('.msg-ai .bubble').first();
    await expect(bubble.locator('.source-card').first()).toBeVisible();
    const b = await bubble.boundingBox();
    expect(b.x + b.width).toBeLessThanOrEqual(360);
  });

  test('the install prompt waits for the welcome tour instead of covering it', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');
    await expect(page.locator('#tc-skip')).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event('beforeinstallprompt')));
    await page.waitForTimeout(2600);
    await expect(page.locator('#pwa-sheet')).not.toHaveClass(/pwa-open/);
    await page.locator('#tc-skip').click();
    await expect(page.locator('#pwa-sheet')).toHaveClass(/pwa-open/, { timeout: 5000 });
  });
});
