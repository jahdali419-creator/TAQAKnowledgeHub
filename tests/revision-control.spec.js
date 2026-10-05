// Priority 2A-2: revision control (docs/QA/PRODUCT-INTEGRITY-AUDIT.md PI-02, PI-34).
//
// One document number, many revisions: TQ-MECH-001 Rev 1.0, Rev 2.0. The
// number identifies the document, the revision the approved version.
//   - only one revision is in force at a time;
//   - approving a revision makes it Current and supersedes the one it
//     replaces, which keeps its full history;
//   - a translation follows its source: superseded with it (to be re-issued)
//     and withdrawn with it;
//   - only one revision may be open at a time, and a withdrawn document is
//     not revised;
//   - every action lands on the revision it means: checks and approvals on
//     the open revision, withdrawal on the revision in force or the exact one
//     named, links and pages on the revision they name.
// Each test drives the workflow and checks the forbidden outcome does not
// happen. In production this is SharePoint major versions promoted by the
// approval flow (BUSINESS-RULES.md §8, §16).
const { test, expect, DESKTOP } = require('./helpers/fixtures');

const SEG = 'coiled-tubing';
const DOC = { n: 'TQ-TWS-CTSS-SOP-007', t: 'Nitrogen Injection SOP', rev: '1.0', next: '2.0' };
const SRC = { n: 'TQ-TWS-CTSS-SOP-002', rev: '2.0', next: '3.0' };          // has an Arabic translation
const SRC2 = { n: 'TQ-TWS-CTSS-SOP-005' };                                  // has one too
const GONE = { n: 'TQ-TWS-CTSS-SOP-012' };                                  // withdrawn

async function start(page, gotoApp, clearAppState, setRole, role = 'employee') {
  await gotoApp('/index.html');
  await clearAppState();
  await page.evaluate(() => localStorage.setItem('taqa-tour-done', '1'));
  await setRole(role, SEG);
}
const family = (page, n) => page.evaluate((x) => TAQA_STORE.revisionsOf(x)
  .map((d) => ({ rev: d.revision, status: d.status, stage: TAQA_APPROVAL.stageOf(d), by: d.supersededBy || null, approvedBy: d.approvedBy || null, title: d.title }))
  .sort((a, b) => String(a.rev).localeCompare(String(b.rev))), n);
const liveCount = (page, n) => page.evaluate((x) => TAQA_STORE.revisionsOf(x).filter((d) => d.status === 'current' || d.status === 'under-review').length, n);
// Files a revision through the register, as Upload does.
const fileRevision = (page, n, title) => page.evaluate(({ n, title }) => {
  const p = TAQA_STORE.revisionParent(n);
  return TAQA_STORE.add({ docNumber: n, supersedes: n, title: title || p.title, segment: p.segment, docType: p.docType,
    department: p.department || null, summary: 'Revised.' });
}, { n, title });

test.describe('Rev 1 → Rev 2, through the screens', () => {
  test.use(DESKTOP);

  test('a revision is filed under the same number, checked in the Workbench and approved; the old revision is superseded and keeps its history', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/upload.html');
    await page.setInputFiles('#file-input', { name: 'n2.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') });
    await page.click('#go-2');
    await page.selectOption('#seg-select', SEG);
    await page.selectOption('#doc-type-select', 'sop');
    await page.click('#status-revision');
    // The section is shown (it used to stay hidden behind the stylesheet).
    await expect(page.locator('#supersedes-section')).toBeVisible();
    await page.selectOption('#supersedes-select', DOC.n);
    await expect(page.locator('#doc-ref-id')).toHaveValue(DOC.n);
    await expect(page.locator('#doc-id-status')).toContainText(`Rev ${DOC.rev} → Rev ${DOC.next}`);
    await page.click('#go-3');
    await expect(page.locator('#panel-3')).toBeVisible();
    await page.fill('#doc-title-input', DOC.t + ', revised');
    await page.fill('#summary-main', 'Revised nitrogen injection steps after the field trial.');
    await page.selectOption('#audience-select', 'Field Operators');
    await page.click('#go-4');
    const revRow = page.locator('#rec-card .rec-row').filter({ has: page.locator('.rec-k', { hasText: /^Revision$/ }) }).locator('.rec-v');
    await expect(revRow).toContainText(`Revision of ${DOC.n}: Rev ${DOC.rev} → Rev ${DOC.next}`);
    await page.click('#submit-btn');
    await expect(page.locator('#toast-title')).toHaveText('Submitted for review');

    // Same number, two revisions: the one in force is untouched until release.
    expect(await family(page, DOC.n)).toEqual([
      { rev: DOC.rev, status: 'current', stage: null, by: null, approvedBy: null, title: DOC.t },
      { rev: DOC.next, status: 'draft', stage: 'qms', by: null, approvedBy: null, title: DOC.t + ', revised' },
    ]);
    expect(await page.evaluate((n) => TAQA_STORE.findDoc(n).revision, DOC.n)).toBe(DOC.rev);

    // QMS opens the number from its queue and gets the revision waiting on it.
    await setRole('qms', SEG);
    await gotoApp(`/master-list.html?view=qms&doc=${DOC.n}`);
    await expect(page.locator('#dw-title')).toHaveText(DOC.t + ', revised');
    await page.locator('#wb-confirm').click();
    expect((await family(page, DOC.n)).map((r) => [r.rev, r.status, r.stage])).toEqual([[DOC.rev, 'current', null], [DOC.next, 'draft', 'director']]);

    // The Director's approval releases it and supersedes Rev 1.0 in the same step.
    await setRole('owner', SEG);
    expect((await page.evaluate((n) => TAQA_STORE.approve(n), DOC.n)).ok).toBe(true);
    const fam = await family(page, DOC.n);
    expect(fam.map((r) => [r.rev, r.status, r.by])).toEqual([[DOC.rev, 'superseded', 'Rev ' + DOC.next], [DOC.next, 'current', null]]);
    expect(await liveCount(page, DOC.n)).toBe(1);

    // The number opens the revision in force; &rev= opens the superseded one, intact.
    await gotoApp(`/viewer.html?doc=${DOC.n}&seg=${SEG}&type=sop`);
    await expect(page.locator('#doc-title')).toHaveText(DOC.t + ', revised');
    await gotoApp(`/viewer.html?doc=${DOC.n}&rev=${DOC.rev}&seg=${SEG}&type=sop`);
    await expect(page.locator('#doc-title')).toHaveText(DOC.t);
    await expect(page.locator('#lifecycle-banner')).toContainText('Superseded');
    await expect(page.locator('#lifecycle-banner')).toContainText('Rev ' + DOC.next);
  });

  test('choosing a document and switching back to "New" leaves nothing of the revision behind', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/upload.html');
    await page.setInputFiles('#file-input', { name: 'n.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') });
    await page.click('#go-2');
    await page.selectOption('#seg-select', SEG);
    await page.selectOption('#doc-type-select', 'sop');
    await page.click('#status-revision');
    await page.selectOption('#supersedes-select', DOC.n);
    await page.click('#status-new');
    await expect(page.locator('#supersedes-section')).toBeHidden();
    const rec = await page.evaluate(() => buildRecord());
    expect(rec.supersedes).toBeNull();
    expect(rec.docNumber).not.toBe(DOC.n);
    expect(rec.revision).toBe('1.0');
  });

  test('the picker offers only documents in force of the chosen type and department, by number', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/upload.html');
    await page.evaluate((seg) => {
      document.getElementById('doc-type-select').value = 'sop'; onTypeChange('sop'); onSegmentChange(seg); setDocStatus('revision');
    }, SEG);
    const vals = await page.locator('#supersedes-select option:not([disabled])').evaluateAll((o) => o.map((x) => x.value));
    expect(vals).toContain(DOC.n);
    expect(vals).not.toContain(GONE.n);                       // withdrawn: not revised
    const recs = await page.evaluate((v) => v.map((n) => TAQA_STORE.findDoc(n)), vals);
    expect(recs.every((d) => d.docType === 'sop' && d.segment === SEG && (d.status === 'current' || d.status === 'under-review'))).toBe(true);
  });
});

test.describe('only one revision in force, only one open', () => {
  test('a second open revision is refused by the register and by Upload', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    expect(await fileRevision(page, DOC.n, 'First revision')).not.toBeNull();
    expect(await fileRevision(page, DOC.n, 'Second revision')).toBeNull();
    expect(await page.evaluate((n) => TAQA_STORE.checkFiling({ docNumber: n, supersedes: n, title: 'x', segment: 'coiled-tubing', docType: 'sop' }), DOC.n))
      .toContain('already in progress');
    expect((await family(page, DOC.n)).length).toBe(2);
    // Upload shows it, but it cannot be chosen.
    await gotoApp('/upload.html');
    await page.evaluate((seg) => {
      document.getElementById('doc-type-select').value = 'sop'; onTypeChange('sop'); onSegmentChange(seg); setDocStatus('revision');
    }, SEG);
    const opt = page.locator(`#supersedes-select option[value="${DOC.n}"]`);
    await expect(opt).toBeDisabled();
    await expect(opt).toContainText('a revision is already in progress');
  });

  test('the old revision cannot stay or come back into force', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await fileRevision(page, DOC.n);
    await setRole('qms', SEG); await page.evaluate((n) => TAQA_STORE.countersign(n), DOC.n);
    await setRole('owner', SEG); await page.evaluate((n) => TAQA_STORE.approve(n), DOC.n);
    expect(await liveCount(page, DOC.n)).toBe(1);
    // Nothing brings Rev 1.0 back.
    const tries = await page.evaluate(({ n, r }) => [
      !!TAQA_STORE.setStatus(n, 'current', r),
      TAQA_STORE.approve(n).ok,
      TAQA_STORE.patch(n, { status: 'current' }, r).ok,
    ], { n: DOC.n, r: DOC.rev });
    expect(tries).toEqual([false, false, false]);
    expect((await family(page, DOC.n)).map((r) => r.status)).toEqual(['superseded', 'current']);
  });

  test('a withdrawn document is not revised, and a revision keeps its type', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    expect(await page.evaluate((n) => TAQA_STORE.checkFiling({ docNumber: n, supersedes: n, title: 'x', segment: 'coiled-tubing', docType: 'sop' }), GONE.n))
      .toContain('not revised');
    expect(await page.evaluate((n) => TAQA_STORE.checkFiling({ docNumber: n, supersedes: n, title: 'x', segment: 'coiled-tubing', docType: 'manual' }), DOC.n))
      .toContain('keeps its document');
    expect(await page.evaluate((n) => TAQA_STORE.revisionsOf(n).length, GONE.n)).toBe(1);
  });
});

test.describe('translations follow their source', () => {
  test('a released revision supersedes the source\'s translation, which is then re-issued as its own revision', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await fileRevision(page, SRC.n);
    await setRole('qms', SEG); await page.evaluate((n) => TAQA_STORE.countersign(n), SRC.n);
    await setRole('owner', SEG); await page.evaluate((n) => TAQA_STORE.approve(n), SRC.n);
    const ar = await family(page, SRC.n + '-AR');
    expect(ar.map((r) => r.status)).toEqual(['superseded']);
    expect(ar[0].by).toContain('translation to be re-issued');
    // No translation of the old revision is left in force.
    expect(await liveCount(page, SRC.n + '-AR')).toBe(0);
    // The translation is re-issued against the new revision.
    await setRole('employee', SEG);
    const re = await fileRevision(page, SRC.n + '-AR');
    expect(re).not.toBeNull();
    expect([re.docNumber, re.revision, re.translationOf]).toEqual([SRC.n + '-AR', SRC.next, SRC.n]);
  });

  test('withdrawing a source withdraws its translation with it', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'qms');
    expect(!!(await page.evaluate((n) => TAQA_STORE.setStatus(n, 'obsolete'), SRC2.n))).toBe(true);
    expect((await family(page, SRC2.n + '-AR')).map((r) => r.status)).toEqual(['obsolete']);
  });
});

test.describe('every action lands on the revision it means', () => {
  test.use(DESKTOP);

  test('with a revision open: withdrawing by number takes the revision in force; naming the open revision takes only that', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await fileRevision(page, DOC.n);
    await setRole('qms', SEG);
    // The open revision, named exactly: the revision in force is untouched.
    expect(!!(await page.evaluate(({ n, r }) => TAQA_STORE.setStatus(n, 'obsolete', r), { n: DOC.n, r: DOC.next }))).toBe(true);
    expect((await family(page, DOC.n)).map((r) => [r.rev, r.status])).toEqual([[DOC.rev, 'current'], [DOC.next, 'obsolete']]);

    // Again with a fresh revision: by number, it is the revision in force that
    // goes. Withdrawing it withdraws the document, so the revision still in
    // progress is cancelled with it, as history, never put in force (owner's
    // decision for NEW-02, PR 2B; it used to stay open at the QMS check).
    await setRole('employee', SEG);
    await page.evaluate(() => localStorage.removeItem('taqa-uploads-v1'));
    await fileRevision(page, DOC.n);
    await setRole('qms', SEG);
    expect(!!(await page.evaluate((n) => TAQA_STORE.setStatus(n, 'obsolete'), DOC.n))).toBe(true);
    expect((await family(page, DOC.n)).map((r) => [r.rev, r.status, r.stage])).toEqual([[DOC.rev, 'obsolete', null], [DOC.next, 'obsolete', null]]);
    expect(await page.evaluate(({ n, r }) => { const d = TAQA_STORE.findRev(n, r); return [!!d.cancelled, d.cancelledReason]; }, { n: DOC.n, r: DOC.next }))
      .toEqual([true, 'Cancelled because the document family was withdrawn.']);
  });

  test('the Master List withdraws the row that was ticked, not its sibling revision', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await fileRevision(page, DOC.n, DOC.t + ', revised');
    await setRole('qms', SEG);
    await gotoApp(`/master-list.html?view=register&seg=${SEG}&q=${encodeURIComponent('Nitrogen Injection')}`);
    const draftBox = page.locator(`#rows .row-chk[data-key="${DOC.n}|${DOC.next}"]`);
    await expect(draftBox).toHaveCount(1);
    await expect(page.locator(`#rows .row-chk[data-key="${DOC.n}|${DOC.rev}"]`)).toHaveCount(1);
    await draftBox.check();
    await expect(page.locator('#bulk-count')).toHaveText('1 document selected');
    page.once('dialog', (d) => d.accept());
    await page.locator('#bulk-withdraw').click();
    await expect(page.locator('#toast')).toContainText('Withdrew 1 document');
    expect((await family(page, DOC.n)).map((r) => [r.rev, r.status])).toEqual([[DOC.rev, 'current'], [DOC.next, 'obsolete']]);
  });

  test('check and approval by number land on the open revision; search and Your submissions link to it', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await fileRevision(page, DOC.n, DOC.t + ', revised');
    await gotoApp('/upload.html');
    const sub = await page.locator('.subs-row a').first().getAttribute('href');
    expect(sub).toContain('rev=' + DOC.next);
    await setRole('qms', SEG);
    await gotoApp('/ai-search.html?q=' + encodeURIComponent('Nitrogen Injection SOP, revised'));
    const href = await page.locator('a[href*="viewer.html"]', { hasText: 'revised' }).first().getAttribute('href');
    expect(href).toContain('rev=' + DOC.next);
    await gotoApp('/' + href);
    await expect(page.locator('#doc-title')).toHaveText(DOC.t + ', revised');
    expect((await page.evaluate((n) => TAQA_STORE.countersign(n), DOC.n)).ok).toBe(true);
    expect((await family(page, DOC.n)).map((r) => [r.rev, r.status, r.stage])).toEqual([[DOC.rev, 'current', null], [DOC.next, 'draft', 'director']]);
  });
});
