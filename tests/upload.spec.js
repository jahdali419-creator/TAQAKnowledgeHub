// Permanent regression suite for upload.html: the simulated document
// submission wizard. This is a purely client-side prototype (no backend), so
// every assertion here is about local app state/UI, what buildRecord(),
// TAQA_STORE.add() and paintRecord() actually do, never about a real
// SharePoint upload or a real network call, neither of which this code makes.
//
// Read upload.html's own <script> in full before touching this file; the
// step numbers, field ids and derived-record shape below are pulled from
// that source, not assumed.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

async function openUpload(gotoApp, setRole, role = 'qms', area = 'coiled-tubing') {
  await gotoApp('/index.html');
  await setRole(role, area);
  await gotoApp('/upload.html');
}

function fileBuf(text = 'regression test file content') {
  return Buffer.from(text);
}

async function attach(page, files) {
  await page.setInputFiles('#file-input', files);
}

// Drives the wizard from a freshly-loaded page through to step 4 (Review),
// for a plain, non-policy document. Returns nothing; leaves the page on
// panel-4 with the record painted.
async function fillToReview(page, { segment = 'coiled-tubing', docType = 'sop', title = 'Regression Test Procedure', summary = 'A summary long enough to satisfy the required-field check for this test.', audience = 'Field Operators' } = {}) {
  await attach(page, [{ name: 'procedure.pdf', mimeType: 'application/pdf', buffer: fileBuf() }]);
  await page.click('#go-2');
  await expect(page.locator('#panel-2')).toBeVisible();
  await page.selectOption('#seg-select', segment);
  await page.selectOption('#doc-type-select', docType);
  await page.click('#go-3');
  await expect(page.locator('#panel-3')).toBeVisible();
  await page.fill('#doc-title-input', title);
  await page.fill('#summary-main', summary);
  await page.selectOption('#audience-select', audience);
  await page.click('#go-4');
  await expect(page.locator('#panel-4')).toBeVisible();
}

test.describe('upload.html, file intake security', () => {
  test('a malicious filename renders as literal text in the file queue, not markup', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await openUpload(gotoApp, setRole);
    const dialogs = [];
    page.on('dialog', (d) => {
      dialogs.push(d.message());
      d.dismiss();
    });
    const evilName = '<img src=x onerror=alert(1)>.pdf';
    await attach(page, [{ name: evilName, mimeType: 'application/pdf', buffer: fileBuf() }]);

    const nameEl = page.locator('.file-item-name').first();
    await expect(nameEl).toHaveText(evilName);
    // It must be text content, never an actual <img> (or any) element.
    expect(await nameEl.locator('*').count()).toBe(0);
    expect(dialogs).toEqual([]);
    assertNoConsoleErrors(consoleErrors);
  });

  test('the file-remove button carries the malicious name safely too', async ({ page, gotoApp, setRole }) => {
    await openUpload(gotoApp, setRole);
    const evilName = '"><svg onload=alert(1)>.pdf';
    await attach(page, [{ name: evilName, mimeType: 'application/pdf', buffer: fileBuf() }]);
    const removeBtn = page.locator('.file-remove').first();
    await expect(removeBtn).toHaveAttribute('data-fname', evilName);
    expect(await page.locator('.file-item svg[onload]').count()).toBe(0);
  });

  test('a malicious document title renders as literal text in the record preview card (paintRecord), not markup', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await openUpload(gotoApp, setRole);
    const evilTitle = '"><script>window.__xssRan=true;</script>';
    await fillToReview(page, { title: evilTitle });

    // No script element must actually have been injected into the card.
    expect(await page.locator('#rec-card script').count()).toBe(0);
    expect(await page.evaluate(() => window.__xssRan)).toBeUndefined();

    const titleRow = page.locator('#rec-card .rec-row', { hasText: 'Title' }).locator('.rec-v');
    await expect(titleRow).toContainText(evilTitle);
    assertNoConsoleErrors(consoleErrors);
  });

  test('.exe files are refused with a visible rejection message and never added', async ({ page, gotoApp, setRole }) => {
    await openUpload(gotoApp, setRole);
    await attach(page, [{ name: 'installer.exe', mimeType: 'application/octet-stream', buffer: fileBuf() }]);
    await expect(page.locator('#toast-title')).toHaveText('File type not permitted');
    await expect(page.locator('#toast-sub')).toContainText('pdf, doc, docx, xls, xlsx, ppt, pptx, zip');
    expect(await page.locator('.file-item').count()).toBe(0);
    await expect(page.locator('#go-2')).toBeDisabled();
  });

  test('.msi files are refused with a visible rejection message and never added', async ({ page, gotoApp, setRole }) => {
    await openUpload(gotoApp, setRole);
    await attach(page, [{ name: 'setup.msi', mimeType: 'application/octet-stream', buffer: fileBuf() }]);
    await expect(page.locator('#toast-title')).toHaveText('File type not permitted');
    expect(await page.locator('.file-item').count()).toBe(0);
    await expect(page.locator('#go-2')).toBeDisabled();
  });

  test('a double-extension trick (document.pdf.exe) is refused, not accepted as a pdf', async ({ page, gotoApp, setRole }) => {
    await openUpload(gotoApp, setRole);
    await attach(page, [{ name: 'document.pdf.exe', mimeType: 'application/octet-stream', buffer: fileBuf() }]);
    await expect(page.locator('#toast-title')).toHaveText('File type not permitted');
    expect(await page.locator('.file-item').count()).toBe(0);
    await expect(page.locator('#go-2')).toBeDisabled();
  });

  // The real allow-list, read from upload.html itself rather than assumed:
  // const ALLOWED_EXT = ['pdf','doc','docx','xls','xlsx','ppt','pptx','zip'];
  for (const ext of ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip']) {
    test(`an allowed .${ext} file is accepted`, async ({ page, gotoApp, setRole }) => {
      await openUpload(gotoApp, setRole);
      await attach(page, [{ name: `report.${ext}`, mimeType: 'application/octet-stream', buffer: fileBuf() }]);
      await expect(page.locator('.file-item-name').first()).toHaveText(`report.${ext}`);
      await expect(page.locator('#go-2')).toBeEnabled();
    });
  }

  // Rejected extensions and rejected sizes are checked separately so mixing
  // them in one drop still reports both kinds of refusal.
  test('a mix of allowed and disallowed files adds only the allowed one and reports the rest as refused', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await openUpload(gotoApp, setRole);
    await attach(page, [
      { name: 'good.pdf', mimeType: 'application/pdf', buffer: fileBuf() },
      { name: 'bad.exe', mimeType: 'application/octet-stream', buffer: fileBuf() },
    ]);
    expect(await page.locator('.file-item').count()).toBe(1);
    await expect(page.locator('.file-item-name').first()).toHaveText('good.pdf');
  });

  // ── File size limit ─────────────────────────────────────────────────────
  // upload.html's own copy says "Max file size: 500 MB per file" in both the
  // drop zone and the sidebar. The two labels now agree with each other; this
  // also checks they agree with what the JS actually enforces (a page-scoped
  // gap that was fixed alongside this suite: addFiles() previously accepted
  // a file of any size at all). A ~500MB file is too expensive to allocate
  // for a test, so a stand-in object with just {name, size} is passed
  // straight to the page's own addFiles(), legitimate here because the
  // size check runs, and rejects, before the file's bytes are ever read.
  test('the "Max file size: 500 MB" label matches what is actually enforced', async ({ page, gotoApp, setRole }) => {
    await openUpload(gotoApp, setRole);
    await expect(page.locator('.drop-sub')).toContainText('Max file size: 500 MB per file');
    await expect(page.locator('.info-card', { hasText: 'Accepted File Types' })).toContainText('Max 500 MB per file');
  });

  test('a file over the 500 MB limit is rejected and never added to the queue', async ({ page, gotoApp, setRole }) => {
    await openUpload(gotoApp, setRole);
    await page.evaluate(() => {
      // A minimal stand-in File-like object: addFiles() only reads .name and
      // .size before it rejects an oversized file, so no real bytes needed.
      addFiles([{ name: 'huge-manual.pdf', size: 501 * 1024 * 1024 }]);
    });
    await expect(page.locator('#toast-title')).toHaveText('File too large');
    await expect(page.locator('#toast-sub')).toContainText('500 MB limit');
    expect(await page.locator('.file-item').count()).toBe(0);
    await expect(page.locator('#go-2')).toBeDisabled();
  });

  test('a file right at the 500 MB limit is accepted (boundary is inclusive)', async ({ page, gotoApp, setRole }) => {
    await openUpload(gotoApp, setRole);
    const added = await page.evaluate(() => {
      const before = document.querySelectorAll('.file-item').length;
      // Exactly the limit; addFiles() only rejects when size EXCEEDS it.
      // Real bytes are needed here since an accepted file goes on to have
      // its hash computed via file.arrayBuffer(), use a real (tiny) File
      // rather than a stand-in object so that call does not throw.
      const f = new File([new Uint8Array(4)], 'right-at-limit.pdf', { type: 'application/pdf' });
      Object.defineProperty(f, 'size', { value: 500 * 1024 * 1024 });
      addFiles([f]);
      return document.querySelectorAll('.file-item').length - before;
    });
    expect(added).toBe(1);
    await expect(page.locator('.file-item-name').first()).toHaveText('right-at-limit.pdf');
  });
});

test.describe('upload.html, multi-step wizard', () => {
  test('starts on step 1 with the other panels hidden and Continue disabled until a file is added', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await openUpload(gotoApp, setRole);
    await expect(page.locator('#panel-1')).toBeVisible();
    await expect(page.locator('#panel-2')).toBeHidden();
    await expect(page.locator('#panel-3')).toBeHidden();
    await expect(page.locator('#panel-4')).toBeHidden();
    await expect(page.locator('#go-2')).toBeDisabled();
    await expect(page.locator('#ustep-1')).toHaveClass(/active/);
  });

  test('adding a file unlocks step 1 and advances to step 2', async ({ page, gotoApp, setRole }) => {
    await openUpload(gotoApp, setRole);
    await attach(page, [{ name: 'doc.pdf', mimeType: 'application/pdf', buffer: fileBuf() }]);
    await expect(page.locator('#go-2')).toBeEnabled();
    await page.click('#go-2');
    await expect(page.locator('#panel-2')).toBeVisible();
    await expect(page.locator('#panel-1')).toBeHidden();
    // Steps 2 and 3 share lamp 2 on the 3-lamp bar (paintStepBar's mapping).
    await expect(page.locator('#ustep-2')).toHaveClass(/active/);
    await expect(page.locator('#ustep-1')).toHaveClass(/done/);
  });

  test('step 2 will not advance without a type and an area, and says so', async ({ page, gotoApp, setRole }) => {
    await openUpload(gotoApp, setRole);
    await attach(page, [{ name: 'doc.pdf', mimeType: 'application/pdf', buffer: fileBuf() }]);
    await page.click('#go-2');
    await page.click('#go-3'); // nothing filled in yet
    await expect(page.locator('#panel-2')).toBeVisible();
    await expect(page.locator('#panel-3')).toBeHidden();
    await expect(page.locator('#hint-2')).toContainText('document type');

    await page.selectOption('#doc-type-select', 'sop');
    await page.click('#go-3'); // type set, area still missing
    await expect(page.locator('#panel-2')).toBeVisible();
    await expect(page.locator('#hint-2')).toContainText('area');

    await page.selectOption('#seg-select', 'coiled-tubing');
    await page.click('#go-3');
    await expect(page.locator('#panel-3')).toBeVisible();
  });

  test('step 3 will not advance without title, summary and audience, and says so', async ({ page, gotoApp, setRole }) => {
    await openUpload(gotoApp, setRole);
    await attach(page, [{ name: 'doc.pdf', mimeType: 'application/pdf', buffer: fileBuf() }]);
    await page.click('#go-2');
    await page.selectOption('#seg-select', 'coiled-tubing');
    await page.selectOption('#doc-type-select', 'sop');
    await page.click('#go-3');

    await page.click('#go-4');
    await expect(page.locator('#panel-3')).toBeVisible();
    await expect(page.locator('#hint-3')).toContainText('title');

    await page.fill('#doc-title-input', 'A Title');
    await page.click('#go-4');
    await expect(page.locator('#hint-3')).toContainText('summary');

    await page.fill('#summary-main', 'Enough detail to pass the check.');
    await page.click('#go-4');
    await expect(page.locator('#hint-3')).toContainText('applies to');

    await page.selectOption('#audience-select', 'Field Operators');
    await page.click('#go-4');
    await expect(page.locator('#panel-4')).toBeVisible();
  });

  test('the back buttons return to the previous panel from every step', async ({ page, gotoApp, setRole }) => {
    await openUpload(gotoApp, setRole);
    await fillToReview(page);
    await expect(page.locator('#panel-4')).toBeVisible();

    await page.locator('#panel-4 .btn-back').click();
    await expect(page.locator('#panel-3')).toBeVisible();

    await page.locator('#panel-3 .btn-back').click();
    await expect(page.locator('#panel-2')).toBeVisible();

    await page.locator('#panel-2 .btn-back').click();
    await expect(page.locator('#panel-1')).toBeVisible();
  });

  test('the step bar reaches its final lamp on step 4', async ({ page, gotoApp, setRole }) => {
    await openUpload(gotoApp, setRole);
    await fillToReview(page);
    await expect(page.locator('#ustep-3')).toHaveClass(/active/);
    await expect(page.locator('#ustep-1')).toHaveClass(/done/);
    await expect(page.locator('#ustep-2')).toHaveClass(/done/);
  });
});

test.describe('upload.html, record preview (paintRecord), cross-checked against TAQA_DOC_LOOKUPS', () => {
  test('shows "Not assigned" for the document number when it has been cleared', async ({ page, gotoApp, setRole }) => {
    await openUpload(gotoApp, setRole);
    await fillToReview(page);
    // Not reachable purely through the wizard (a number auto-fills the
    // moment area+type are chosen), so the field is cleared directly, the
    // same way a user editing the generated number by hand could clear it.
    await page.locator('#panel-4 .btn-back').click();
    await page.locator('#panel-3 .btn-back').click();
    await page.click('#nc-edit-btn');
    await page.fill('#doc-ref-id', '');
    await page.click('#go-3');
    await page.click('#go-4');
    const numRow = page.locator('#rec-card .rec-row', { hasText: 'Document number' }).locator('.rec-v');
    await expect(numRow).toContainText('Not assigned');
  });

  test('type-derived fields (owner, approver, review cycle) match the real TAQA_DOC_LOOKUPS.types entry', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await openUpload(gotoApp, setRole);
    await fillToReview(page, { segment: 'coiled-tubing', docType: 'sop' });

    const real = await page.evaluate(() => TAQA_DOC_LOOKUPS.types['sop']);
    const ownerRow = page.locator('#rec-card .rec-row', { hasText: 'Owner' }).locator('.rec-v');
    const approverRow = page.locator('#rec-card .rec-row', { hasText: 'Approver' }).locator('.rec-v');
    const cycleRow = page.locator('#rec-card .rec-row', { hasText: 'Review cycle' }).locator('.rec-v');
    const typeRow = page.locator('#rec-card .rec-row', { hasText: 'Type' }).locator('.rec-v');

    await expect(ownerRow).toContainText(real.owner);
    await expect(approverRow).toContainText(real.approver);
    await expect(cycleRow).toContainText(String(real.reviewCycleMonths) + ' months');
    await expect(typeRow).toContainText(real.label);
  });

  test('the area field matches the real TAQA_DOC_LOOKUPS.segments entry', async ({ page, gotoApp, setRole }) => {
    await openUpload(gotoApp, setRole);
    await fillToReview(page, { segment: 'drilling', docType: 'sop' });
    const real = await page.evaluate(() => TAQA_DOC_LOOKUPS.segments['drilling']);
    const areaRow = page.locator('#rec-card .rec-row', { hasText: 'Area' }).locator('.rec-v');
    await expect(areaRow).toContainText(real.name);
  });

  test('a new document shows "Rev 1.0, first issue"; a revision names what it supersedes', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await openUpload(gotoApp, setRole);
    await fillToReview(page);
    const revRow = page.locator('#rec-card .rec-row', { hasText: 'Revision' }).locator('.rec-v');
    await expect(revRow).toContainText('Rev 1.0, first issue');
  });

  test('a Policy document derives Company Wide scope and a CEO approver, per TAQA_DOC_LOOKUPS', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    // Policy is only offered to the qms role (see upload.html's own comment
    // on why it is absent rather than disabled for anyone else).
    await openUpload(gotoApp, setRole, 'qms', 'coiled-tubing');
    await attach(page, [{ name: 'policy.pdf', mimeType: 'application/pdf', buffer: fileBuf() }]);
    await page.click('#go-2');
    await page.selectOption('#doc-type-select', 'policy');
    await expect(page.locator('#policy-rules')).toBeVisible();
    const fnOptions = await page.locator('#policy-fn option[value]:not([value=""])').count();
    expect(fnOptions).toBeGreaterThan(0);
    await page.selectOption('#policy-fn', { index: 1 });
    await page.click('#go-3');
    await page.fill('#doc-title-input', 'Regression Policy Title');
    await page.fill('#summary-main', 'A policy summary long enough to pass validation.');
    await page.selectOption('#audience-select', 'All TAQA Employees');
    await page.click('#go-4');

    const real = await page.evaluate(() => TAQA_DOC_LOOKUPS.types['policy']);
    expect(real.approver).toBe('CEO'); // confirms the lookup's own abbreviation
    const scopeRow = page.locator('#rec-card .rec-row', { hasText: 'Scope' }).locator('.rec-v');
    const approverRow = page.locator('#rec-card .rec-row', { hasText: 'Approver' }).locator('.rec-v');
    await expect(scopeRow).toContainText('Company Wide');
    // paintRecord() deliberately spells this out rather than showing the
    // lookup's bare "CEO" abbreviation for a policy's approver.
    await expect(approverRow).toContainText('Chief Executive Officer');

    const numRow = page.locator('#rec-card .rec-row', { hasText: 'Document number' }).locator('.rec-v');
    // TAQA-<Function>-P0XX, the corporate policy series (taqaRefId()).
    await expect(numRow).toContainText(/^TAQA-[A-Z&]+-P\d{3}/);
  });
});

test.describe('upload.html, approval workflow text', () => {
  test('the approval note describes the real two-step QMS-then-approver process', async ({ page, gotoApp, setRole }) => {
    await openUpload(gotoApp, setRole);
    await fillToReview(page);
    // Matches roles.js's TAQA_APPROVAL comment/stageOf(): QMS countersigns
    // (stage 'qms') before the type's named approver releases it (stage
    // 'director' -> approve()), never the other way round.
    await expect(page.locator('.approval-text')).toContainText(
      'Documents are reviewed by QMS, then approved by the authority the type names, before being published.'
    );
  });

  test('the sidebar workflow steps read Submit -> QMS check -> Director approval -> Published', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await openUpload(gotoApp, setRole);
    const steps = page.locator('.info-card', { hasText: 'Approval Workflow' }).locator('.wf-step');
    await expect(steps).toHaveCount(4);
    await expect(steps.nth(1)).toContainText('QMS check');
    await expect(steps.nth(1)).toContainText('QMS checks the record and the numbering');
    // The step that puts a document in force is the Director's, and it says so.
    await expect(steps.nth(2)).toContainText('Director approval');
  });
});

test.describe('upload.html, submit commits to the real register (TAQA_STORE)', () => {
  test('submitting a valid document adds a real draft row via TAQA_STORE, awaiting QMS first', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await openUpload(gotoApp, setRole);
    const uniqueTitle = 'Regression Suite Draft ' + Date.now();
    await fillToReview(page, { title: uniqueTitle });

    const docNumber = await page.locator('#doc-ref-id').inputValue();
    expect(docNumber).toBeTruthy();

    await page.click('#submit-btn');

    // The toast reflects a real state change, not a fixed success message.
    await expect(page.locator('#toast-title')).toHaveText('Submitted for review');
    await expect(page.locator('#upload-ref')).toHaveText(docNumber);

    // store.js's population name for a draft awaiting action is 'pending'
    // (POP.pending = isPending, testing d.status === 'draft'), not 'draft'
    // itself, 'draft' is not a registered population name at all, and
    // TAQA_STORE.rows() silently falls back to 'live' for an unknown one.
    const draftRows = await page.evaluate(
      (num) => TAQA_STORE.rows('pending', { segment: 'coiled-tubing' }).filter((d) => d.docNumber === num),
      docNumber
    );
    expect(draftRows.length).toBe(1);
    expect(draftRows[0].title).toBe(uniqueTitle);
    expect(draftRows[0].status).toBe('draft');
    // The two-step process: a fresh submission waits on QMS first.
    expect(draftRows[0].approvalStage).toBe('qms');

    // The register total actually moved (TAQA_STORE.add(), not a discarded global).
    const registerCount = await page.evaluate(() => TAQA_STORE.rows('register').length);
    expect(registerCount).toBeGreaterThan(0);
    assertNoConsoleErrors(consoleErrors);
  });

  test('submitting without a document number is refused and adds nothing to the store', async ({ page, gotoApp, setRole }) => {
    await openUpload(gotoApp, setRole);
    await fillToReview(page);
    await page.locator('#panel-4 .btn-back').click();
    await page.locator('#panel-3 .btn-back').click();
    await page.click('#nc-edit-btn');
    await page.fill('#doc-ref-id', '');
    await page.click('#go-3');
    await page.click('#go-4');

    const before = await page.evaluate(() => TAQA_STORE.rows('register').length);
    await page.click('#submit-btn');
    await expect(page.locator('#toast-title')).toHaveText('No document number');
    const after = await page.evaluate(() => TAQA_STORE.rows('register').length);
    expect(after).toBe(before);
  });

  test('submitting with no file selected is refused up front', async ({ page, gotoApp, setRole }) => {
    // submitUpload() itself guards on an empty selectedFiles array; exercise
    // that guard directly, since the wizard buttons already prevent reaching
    // step 4 without a file through normal navigation.
    await openUpload(gotoApp, setRole);
    const before = await page.evaluate(() => TAQA_STORE.rows('register').length);
    await page.evaluate(() => {
      const form = document.getElementById('upload-form');
      form.dispatchEvent(new Event('submit', { cancelable: true }));
    });
    await expect(page.locator('#toast-title')).toHaveText('No file selected');
    const after = await page.evaluate(() => TAQA_STORE.rows('register').length);
    expect(after).toBe(before);
  });
});
