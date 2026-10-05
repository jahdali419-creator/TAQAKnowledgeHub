// Priority 2A-1: controlled document identity (docs/QA/PRODUCT-INTEGRITY-AUDIT.md).
//
//   PI-01  a document number names one document, once and for good. A number
//          already in the register (in force, withdrawn, superseded or a legacy
//          ID, in any area) is refused wherever a filing comes from, and a
//          number is looked up by rule, never "whichever match came last".
//   PI-03  a withdrawn document can never be shown as "Current, OK to use".
//          Links, bookmarks, share links and QR codes name the document by its
//          number; a title-only link is resolved against the live register in
//          its own area, and nothing found means "not in the register".
//   PI-33  Software / Tool filing is closed until numbering, owner and
//          approver are defined.
//
// Each test attempts the forbidden outcome and checks it does not happen.
// In production the number is allocated and kept unique by the server, and
// every link targets the immutable item ID (BUSINESS-RULES.md §16).
const { test, expect, DESKTOP } = require('./helpers/fixtures');

const SEG = 'coiled-tubing';
const LIVE = { n: 'TQ-TWS-CTSS-SOP-007', t: 'Nitrogen Injection SOP' };          // current, internal
const GONE = { n: 'TQ-TWS-CTSS-SOP-012', t: 'Post-Job Reporting SOP', legacy: 'CT-012' }; // withdrawn
const POLICY = { n: 'TQ-QHSE-P007', t: 'Quality, Health, Safety and Environment Policy' };
const HASH = { n: 'TQ-QHSE-P###', t: 'Health Protection Policy' };              // placeholder number

async function start(page, gotoApp, clearAppState, setRole, role = 'employee', area = SEG) {
  await gotoApp('/index.html');
  await clearAppState();
  await page.evaluate(() => localStorage.setItem('taqa-tour-done', '1'));
  await setRole(role, area);
}
const count = (page) => page.evaluate(() => TAQA_STORE.all().length);

async function toStep2(page, seg = SEG, type = 'sop') {
  await page.setInputFiles('#file-input', { name: 'procedure.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') });
  await page.click('#go-2');
  await expect(page.locator('#panel-2')).toBeVisible();
  await page.selectOption('#seg-select', seg);
  await page.selectOption('#doc-type-select', type);
}
async function toReview(page, title) {
  await page.click('#go-3');
  await expect(page.locator('#panel-3')).toBeVisible();
  await page.fill('#doc-title-input', title);
  await page.fill('#summary-main', 'A summary long enough to satisfy the required-field check.');
  await page.selectOption('#audience-select', 'Field Operators');
  await page.click('#go-4');
  await expect(page.locator('#panel-4')).toBeVisible();
}
async function withdrawAsQms(page, setRole, n) {
  await setRole('qms', SEG);
  expect(await page.evaluate((x) => !!TAQA_STORE.setStatus(x, 'obsolete', undefined, { reason: 'Withdrawn for this test: superseded by a newer controlled document.' }), n), 'withdrawn ' + n).toBe(true);
  await setRole('employee', SEG);
}
async function expectWithdrawnView(page) {
  await expect(page.locator('#lifecycle-banner')).toContainText(/withdrawn|obsolete/i);
  await expect(page.locator('body')).not.toContainText('Current, OK to use');
  await expect(page.locator('#dl-btn')).toHaveAttribute('aria-disabled', 'true');
}

test.describe('PI-01: one number, one document', () => {
  test.use(DESKTOP);
  test('the register refuses a number already used anywhere, in any status, or as a legacy ID', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    const before = await count(page);
    const tries = await page.evaluate(({ LIVE, GONE }) => [
      LIVE.n,                    // in force, this area
      GONE.n,                    // withdrawn: retired, not free
      GONE.legacy,               // a legacy ID
      LIVE.n.toLowerCase(),      // the same number in another case
      'TQ-QHSE-P007',            // a policy number, from another area entirely
    ].map((n) => ({ n, added: !!TAQA_STORE.add({ docNumber: n, title: 'Duplicate ' + n, segment: 'coiled-tubing', docType: 'sop' }),
                    why: TAQA_STORE.checkFiling({ docNumber: n, title: 'x', segment: 'coiled-tubing', docType: 'sop' }) })), { LIVE, GONE });
    for (const t of tries) {
      expect(t.added, t.n).toBe(false);
      expect(t.why, t.n).toContain('A number names one document and is never reused');
    }
    // A number filed here earlier is taken too, and the register did not grow.
    expect(await page.evaluate(() => !!TAQA_STORE.add({ docNumber: 'TQ-TWS-CTSS-SOP-985', title: 'First', segment: 'coiled-tubing', docType: 'sop' }))).toBe(true);
    expect(await page.evaluate(() => !!TAQA_STORE.add({ docNumber: 'TQ-TWS-CTSS-SOP-985', title: 'Second', segment: 'drilling', docType: 'sop' }))).toBe(false);
    expect(await page.evaluate(() => TAQA_STORE.checkFiling({ docNumber: 'TQ-TWS-CTSS-SOP-985', title: 'Second', segment: 'drilling', docType: 'sop' }))).toContain('A number names one document and is never reused');
    expect(await page.evaluate(() => TAQA_STORE.all().filter((d) => d.docNumber === 'TQ-TWS-CTSS-SOP-985').length)).toBe(1);
    expect(await count(page)).toBe(before + 1);
    // And a filing with no number at all is refused.
    expect(await page.evaluate(() => TAQA_STORE.add({ title: 'No number', segment: 'coiled-tubing', docType: 'sop' }))).toBeNull();
  });

  test('Upload: a typed number in use stops the filing at step 2, and at submit if forced', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/upload.html');
    await toStep2(page);
    // Typed over the assigned number: the withdrawn SOP-012's number.
    await page.evaluate((n) => { editNumber(); const f = document.getElementById('doc-ref-id'); f.value = n; checkDocId(); }, GONE.n);
    await expect(page.locator('#doc-id-status')).toContainText('already the number of');
    await page.click('#go-3');
    await expect(page.locator('#hint-2')).toContainText('already the number of');
    await expect(page.locator('#panel-3')).toBeHidden();

    // Forced past the gate, the submit refuses it and files nothing.
    const before = await count(page);
    // A free, well-formed number gets it past step 2 (PI-14 checks the form).
    await page.evaluate(() => { document.getElementById('doc-ref-id').value = 'TQ-TWS-CTSS-SOP-980'; });
    await toReview(page, 'Forced duplicate');
    await page.evaluate((n) => { const f = document.getElementById('doc-ref-id'); f.value = n; f.dataset.autofilled = 'user'; }, LIVE.n);
    await page.click('#submit-btn');
    await expect(page.locator('#toast-title')).toHaveText('Number already used');
    expect(await count(page)).toBe(before);
    expect(await page.evaluate((n) => TAQA_STORE.all().filter((d) => d.docNumber === n).length, LIVE.n)).toBe(1);
  });

  test('Upload: a policy number is checked across the whole register', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'qms');
    await gotoApp('/upload.html');
    await toStep2(page, SEG, 'sop');
    await page.evaluate((n) => { editNumber(); const f = document.getElementById('doc-ref-id'); f.value = n; checkDocId(); }, POLICY.n);
    await expect(page.locator('#doc-id-status')).toContainText(POLICY.t);
  });

  test('two tabs given the same assigned number: the second is re-numbered before anything is filed', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    const page2 = await page.context().newPage();
    await gotoApp('/upload.html');
    await page2.goto('/upload.html');
    await page2.waitForFunction(() => document.readyState === 'complete');
    await toStep2(page); await toStep2(page2);
    const n1 = await page.locator('#doc-ref-id').inputValue();
    const n2 = await page2.locator('#doc-ref-id').inputValue();
    expect(n1).toBe(n2);                                  // the race the audit found
    await toReview(page, 'Tab one'); await toReview(page2, 'Tab two');

    await page.click('#submit-btn');
    await expect(page.locator('#toast-title')).toHaveText('Submitted for review');
    await page2.click('#submit-btn');
    await expect(page2.locator('#toast-title')).toHaveText('Number updated');
    const n3 = await page2.locator('#doc-ref-id').inputValue();
    expect(n3).not.toBe(n1);
    expect(await page2.evaluate((n) => TAQA_STORE.all().filter((d) => d.docNumber === n).length, n1)).toBe(1);
    // Submitted again, under its own number.
    await page2.click('#submit-btn');
    await expect(page2.locator('#toast-title')).toHaveText('Submitted for review');
    expect(await page2.evaluate(({ a, b }) => [a, b].map((n) => TAQA_STORE.all().filter((d) => d.docNumber === n).length), { a: n1, b: n3 })).toEqual([1, 1]);
    await page2.close();
  });

  test('a draft restored from an earlier visit does not reuse a number taken since', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await page.evaluate((n) => localStorage.setItem('taqa-draft-upload', JSON.stringify({ 'doc-ref-id': n })), LIVE.n);
    await gotoApp('/upload.html');
    await toStep2(page);
    await page.evaluate((n) => { document.getElementById('doc-ref-id').value = n; delete document.getElementById('doc-ref-id').dataset.autofilled; }, LIVE.n);
    await page.click('#go-3');
    await expect(page.locator('#panel-3')).toBeVisible();
    expect(await page.locator('#doc-ref-id').inputValue()).not.toBe(LIVE.n);
  });

  test('a number is looked up by rule: the revision in force, never a stray copy filed later', async ({ page, gotoApp, setRole, clearAppState, seedRegister }) => {
    await start(page, gotoApp, clearAppState, setRole, 'qms');
    // A second record carrying a live number, as older browser data can hold.
    await seedRegister([{ docNumber: LIVE.n, title: 'Stray copy', segment: SEG, docType: 'sop', status: 'draft', approvalStage: 'qms' }]);
    await gotoApp('/index.html');
    expect(await page.evaluate((n) => TAQA_STORE.findDoc(n).title, LIVE.n)).toBe(LIVE.t);
    await gotoApp(`/viewer.html?doc=${encodeURIComponent(LIVE.n)}&seg=${SEG}&type=sop`);
    await expect(page.locator('#doc-title')).toHaveText(LIVE.t);
    await expect(page.locator('body')).not.toContainText('Submitted for approval, not in force yet');
  });
});

test.describe('PI-03: a withdrawn document is never shown as current', () => {
  test.use(DESKTOP);
  test('a title-only link resolves against the live register: withdrawn shows withdrawn', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await withdrawAsQms(page, setRole, LIVE.n);
    await gotoApp(`/viewer.html?seg=${SEG}&type=sop&title=${encodeURIComponent(LIVE.t)}`);
    await expectWithdrawnView(page);
    // Share link, QR and pin carry the number even though this link had none.
    await expect(page.locator('#share-url')).toContainText('doc=' + encodeURIComponent(LIVE.n));
  });

  test('a title in another area is not borrowed: the page says "not in the register", never "Current"', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp(`/viewer.html?seg=drilling&type=sop&title=${encodeURIComponent(LIVE.t)}`);
    await expect(page.locator('#lifecycle-banner')).toContainText('Not in the Master Document List');
    await expect(page.locator('body')).not.toContainText('Current, OK to use');
  });

  test('Home policy links carry the number, including a placeholder number with #', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/index.html');
    // The link as Home draws it today (and as a printed QR code keeps it).
    const href = await page.evaluate((t) => {
      const a = [...document.querySelectorAll('#charter-list a.ch-row')].find((x) => x.textContent.trim() === t);
      return a && a.getAttribute('href');
    }, HASH.t);
    expect(href).toContain('doc=' + encodeURIComponent(HASH.n));
    // Withdrawn later: the same link must now say so.
    await withdrawAsQms(page, setRole, HASH.n);
    await gotoApp('/' + href);
    await expect(page.locator('#doc-title')).toHaveText(HASH.t);
    await expectWithdrawnView(page);
  });

  test('bookmarks: a new one stores the number; an old title-only one opens the withdrawn record', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    // An old bookmark, saved before bookmarks carried numbers.
    await page.evaluate((t) => localStorage.setItem('taqa-bookmarks', JSON.stringify([
      { title: t, type: 'sop', segId: 'coiled-tubing', segName: 'Coiled Tubing', ts: Date.now() },
    ])), LIVE.t);
    await withdrawAsQms(page, setRole, LIVE.n);
    await gotoApp('/index.html');
    await page.locator('#nav-bm').click();
    const href = await page.locator('#bm-panel a.bm-item').first().getAttribute('href');
    expect(href).toContain('doc=' + encodeURIComponent(LIVE.n));
    await gotoApp('/' + href);
    await expectWithdrawnView(page);

    // A bookmark made now from the viewer carries the number.
    await gotoApp(`/viewer.html?seg=${SEG}&type=sop&doc=${encodeURIComponent('TQ-TWS-CTSS-SOP-009')}`);
    await page.locator('#bm-doc-btn').click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('taqa-bookmarks'))[0]);
    expect(saved.num).toBe('TQ-TWS-CTSS-SOP-009');
  });

  test('every page that links to a document names it by number', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'qms');
    // Segment cards and their QR codes, the Master List, search and What's New.
    await gotoApp(`/segment.html?id=${SEG}&tab=sops`);
    const segHref = await page.locator('#list-sops a.doc-row-link').first().getAttribute('href');
    expect(segHref).toMatch(/[?&]doc=/);
    const qr = await page.evaluate(() => { const c = document.querySelector('#list-sops .doc-card'); showDocQR(c.dataset.title, c.dataset.type); return document.getElementById('qr-url-in').value; });
    expect(qr).toMatch(/[?&]doc=/);
    await gotoApp('/ai-search.html?q=BHA');
    await expect(page.locator('a[href*="viewer.html"]').first()).toHaveAttribute('href', /[?&]doc=/);
    await gotoApp('/whats-new.html');
    const wn = await page.locator('a[href*="viewer.html"]').first().getAttribute('href');
    if (wn) expect(wn).toMatch(/[?&]doc=/);
  });
});

test.describe('PI-33: Software / Tool filing is closed', () => {
  test('the register refuses software, and Upload does not offer it', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'qms');
    const why = await page.evaluate(() => TAQA_STORE.checkFiling({ docNumber: 'TQ-SW-001', title: 'Tool', segment: 'coiled-tubing', docType: 'software' }));
    expect(why).toContain('Software and tools cannot be filed yet');
    expect(await page.evaluate(() => TAQA_STORE.add({ docNumber: 'TQ-SW-001', title: 'Tool', segment: 'coiled-tubing', docType: 'software' }))).toBeNull();
    await gotoApp('/upload.html');
    expect(await page.locator('#doc-type-select option[value="software"]').count()).toBe(0);
  });
});
