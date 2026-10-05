// PR 2C-1: record truth (docs/QA/PRODUCT-INTEGRITY-REASSESSMENT-POST-PR29.md).
//
//   PI-11  a withdrawal is a permanent event on the record: who, when, why and
//          what it was before; its check and approval history stay as they
//          were; pages never show it as current or as missing.
//   PI-10  bulk withdrawal acts on the exact revisions in force that were
//          ticked, shows every revision that will change, refuses a stale
//          selection, and never withdraws a draft as though it were current.
//   PI-21  approval date and issued (effective) date are the register's, set
//          at release: effective defaults to the approval date, may be later
//          (owner's decision), and a revision approved for later takes effect
//          on its date, once, with no two revisions in force.
//   PI-24  a returned filing is history, not pending; a returned first issue
//          filed again keeps its number and revision as its next attempt.
//   PI-13  possible duplicates are shown before Submit with the reason each was
//          flagged, as advice; the number stays the only hard rule.
//   PI-14  a new filing's number must be the TQ-QHSE-S001 5.3 number for its
//          area and type; legacy numbers stay readable.
//
// Every scenario is driven by the people who would act: an employee files,
// QMS checks, the Director approves, QMS or the Director withdraws.
const fs = require('fs');
const path = require('path');
const { test, expect, DESKTOP, assertNoConsoleErrors } = require('./helpers/fixtures');

const SEG = 'coiled-tubing';
const DOC = 'TQ-TWS-CTSS-SOP-007';          // Nitrogen Injection SOP, Rev 1.0 in force
const DOC2 = 'TQ-TWS-CTSS-SOP-009';         // Rev 3.0 in force
const DOC3 = 'TQ-TWS-CTSS-SOP-011';         // Rev 3.0 in force
const REASON = 'Replaced by the new well control manual from 1 November.';
const RETURN = 'Section 4 is missing the isolation steps; add them and resubmit.';
const PDF = (tag) => ({ name: 'rt-' + tag + '.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% ' + tag + '\n%%EOF\n') });

async function start(page, gotoApp, clearAppState, setRole, role = 'employee') {
  await gotoApp('/index.html');
  await clearAppState();
  await page.evaluate(() => {
    localStorage.setItem('taqa-tour-done', '1');
    localStorage.setItem('taqa-install-dismissed', String(Date.now()));
  });
  await setRole(role, SEG);
}
// Runs fn(arg) in the page as `role`: the person who would really take that step.
const as = (page, role, fn, arg) => page.evaluate(({ role, src, arg }) => {
  TAQA_ROLE.set(role);
  // eslint-disable-next-line no-new-func
  return new Function('arg', 'return (' + src + ')(arg);')(arg);
}, { role, src: fn.toString(), arg });
const fileNew = (page, n, title, extra) => as(page, 'employee', ({ n, title, extra }) => {
  const d = TAQA_STORE.add(Object.assign({ docNumber: n, title, segment: 'coiled-tubing', docType: 'sop', revision: '1.0', summary: 'Record truth: ' + title }, extra || {}));
  return d ? { recordId: d.recordId, rev: d.revision, attempt: d.attempt } : null;
}, { n, title, extra });
const fileRevision = (page, n, title) => as(page, 'employee', ({ n, title }) => {
  const p = TAQA_STORE.revisionParent(n);
  const d = TAQA_STORE.add({ docNumber: n, supersedes: n, title, segment: p.segment, docType: p.docType, summary: 'Revised: ' + title });
  return d ? { recordId: d.recordId, rev: d.revision, attempt: d.attempt } : null;
}, { n, title });
const check = (page, n) => as(page, 'qms', (n) => TAQA_STORE.countersign(n), n);
const approve = (page, n, eff) => as(page, 'owner', ([n, eff]) => TAQA_STORE.approve(n, undefined, eff ? { effectiveDate: eff } : undefined), [n, eff]);
const rec = (page, key) => page.evaluate((k) => TAQA_STORE.byKey(k), key);
const family = (page, n) => page.evaluate((x) => TAQA_STORE.revisionsOf(x).map((d) => ({
  rev: d.revision, attempt: d.attempt || 1, title: d.title, status: d.status, stage: TAQA_APPROVAL.stageOf(d), rejected: !!d.rejected,
  cancelled: !!d.cancelled, issueDate: d.issueDate || null, approvedDate: d.approvedDate || null, nextReviewDate: d.nextReviewDate || null,
  supersededDate: d.supersededDate || null, supersededBy: d.supersededBy || null, withdrawnBy: d.withdrawnBy || null,
  withdrawnReason: d.withdrawnReason || null, withdrawnFromStatus: d.withdrawnFromStatus || null,
})), n);
const today = (page) => page.evaluate(() => TAQA_STORE.localDay());
const plusDays = (day, n) => { const [y, m, d] = day.split('-').map(Number); const t = new Date(y, m - 1, d + n); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); };
const plusMonths = (day, n) => { const [y, m, d] = day.split('-').map(Number); const t = new Date(y, m - 1 + n, d); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); };
async function freshIntegrity(page) {
  await page.addScriptTag({ content: fs.readFileSync(path.join(__dirname, '../scripts/check-register.js'), 'utf8') });
  const known = JSON.parse(fs.readFileSync(path.join(__dirname, '../scripts/register-baseline.json'), 'utf8')).known;
  return page.evaluate((k) => TAQA_REGISTER_CHECK.compare(TAQA_REGISTER_CHECK.check(TAQA_STORE.all(), TAQA_DOC_LOOKUPS), k).fresh
    .map((f) => f.key + ' ' + f.message), known);
}

// ─────────────────────────────────────────────────────────────────────────
test.describe('A. PI-11: a withdrawal is a permanent, honest event on the record', () => {
  test.use(DESKTOP);

  test('approve, then withdraw from the documents list with a reason: who, when, why and what it was are kept, and its approval history is untouched', async ({ page, gotoApp, setRole, clearAppState, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const n = 'TQ-TWS-CTSS-SOP-901';
    const filed = await fileNew(page, n, 'Withdrawal history probe');
    await check(page, n);
    expect((await approve(page, n)).ok).toBe(true);
    const before = await rec(page, filed.recordId);

    await setRole('qms', SEG);
    await gotoApp('/documents.html?id=' + SEG);
    const row = page.locator('#pub-docs-body tr', { hasText: n });
    await row.locator('.pub-remove-btn').click();
    await expect(page.locator('#wd-dlg')).toBeVisible();
    await expect(page.locator('#wd-dlg-h')).toHaveText('Withdraw ' + n + ' Rev 1.0?');
    await page.fill('#wd-reason', 'Too short');
    await expect(page.locator('#wd-go')).toBeDisabled();
    await page.fill('#wd-reason', REASON);
    await page.locator('#wd-go').click();
    await expect(page.locator('#dash-toast-msg')).toContainText('Withdrawn');

    const after = await rec(page, filed.recordId);
    expect(after).toMatchObject({ status: 'obsolete', withdrawnBy: 'QMS / Document Controller', withdrawnReason: REASON,
      withdrawnFromStatus: 'current', withdrawnDate: await today(page) });
    expect(after.withdrawnAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    for (const k of ['docNumber', 'revision', 'recordId', 'submittedBy', 'submittedAt', 'countersignedBy', 'countersignedAt',
      'approvedBy', 'approvedAt', 'approvedDate', 'issueDate', 'nextReviewDate']) expect(after[k], k).toEqual(before[k]);

    // The viewer, the register and the audit log say so; never current, never missing.
    await gotoApp('/viewer.html?doc=' + n + '&seg=' + SEG);
    await expect(page.locator('#lifecycle-banner')).toContainText('Obsolete. Do not use.');
    await expect(page.locator('#lifecycle-banner')).toContainText('by QMS / Document Controller');
    await expect(page.locator('#lifecycle-banner')).toContainText(REASON);
    await expect(page.locator('#appr-trail')).toContainText('Final approval');
    await expect(page.locator('#appr-trail')).toContainText('Withdrawn: ' + REASON);
    await expect(page.locator('body')).not.toContainText('Current, OK to use');
    await gotoApp('/master-list.html');
    await page.fill('#q', n);
    const r = page.locator('#rows tr', { hasText: n });
    await expect(r).toContainText('Obsolete');
    await r.click();
    await expect(page.locator('#dw-withdrawn')).toContainText(REASON);
    await expect(page.locator('#dw-withdrawn')).toContainText('QMS / Document Controller');
    assertNoConsoleErrors(consoleErrors);
  });

  test('the register refuses a withdrawal with no reason, a stale one, and bringing a withdrawn record back', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'qms');
    const r = await as(page, 'qms', (n) => {
      const cur = TAQA_STORE.findDoc(n), key = TAQA_STORE.recordKey(cur), out = {};
      out.noReason = !!TAQA_STORE.setStatus(n, 'obsolete');
      out.noReasonWhy = TAQA_STORE.statusError();
      out.shortReason = !!TAQA_STORE.setStatus(n, 'obsolete', undefined, { reason: 'x' });
      out.staleKey = !!TAQA_STORE.setStatus(n, 'obsolete', undefined, { reason: 'A good enough reason for the test.', expect: { key: n + '@9.0', status: 'current' } });
      out.staleWhy = TAQA_STORE.statusError();
      out.staleStatus = !!TAQA_STORE.setStatus(n, 'obsolete', undefined, { reason: 'A good enough reason for the test.', expect: { key, status: 'superseded' } });
      out.ok = !!TAQA_STORE.setStatus(n, 'obsolete', undefined, { reason: 'A good enough reason for the test.', expect: { key, status: 'current' } });
      out.revive = !!TAQA_STORE.setStatus(n, 'current');
      out.final = TAQA_STORE.findDoc(n).status;
      return out;
    }, DOC2);
    expect(r).toMatchObject({ noReason: false, shortReason: false, staleKey: false, staleStatus: false, ok: true, revive: false, final: 'obsolete' });
    expect(r.noReasonWhy).toContain('at least 20 characters');
    expect(r.staleWhy).toContain('changed after you opened it');
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('B. Withdrawal with an open revision keeps the PR 2B rule', () => {
  test.use(DESKTOP);

  test('the dialog names the revision that will be cancelled; Rev 1.0 is withdrawn with its record, Rev 2.0 cancelled as history', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await fileRevision(page, DOC, 'Revised, in progress');
    await setRole('qms', SEG);
    await gotoApp('/documents.html?id=' + SEG);
    await page.locator('#pub-docs-body tr', { hasText: DOC }).first().locator('.pub-remove-btn').click();
    await expect(page.locator('#wd-dlg-open')).toContainText('Rev 2.0, which is in progress, will be cancelled with it');
    await page.fill('#wd-reason', REASON);
    await page.locator('#wd-go').click();
    await expect.poll(async () => (await family(page, DOC)).map((d) => [d.rev, d.status, d.cancelled])).toEqual([['1.0', 'obsolete', false], ['2.0', 'obsolete', true]]);
    const fam = await family(page, DOC);
    expect(fam[0]).toMatchObject({ withdrawnReason: REASON, withdrawnFromStatus: 'current' });
    const r = await as(page, 'qms', (n) => ({ check: TAQA_STORE.countersign(n).ok, revive: !!TAQA_STORE.setStatus(n, 'current', '2.0') }), DOC);
    expect(r).toEqual({ check: false, revive: false });
    expect(await freshIntegrity(page)).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('C. PI-10: bulk withdrawal acts on the exact revisions ticked', () => {
  test.use(DESKTOP);

  test('two documents in force (one with an open revision) and a draft are ticked: the preview lists exactly what changes, the draft is left out, a stale row is refused', async ({ page, context, gotoApp, setRole, clearAppState, consoleErrors }) => {
    test.slow();   // a whole journey through several pages
    await start(page, gotoApp, clearAppState, setRole);
    await fileRevision(page, DOC, 'DOC revised, in progress');        // DOC: Rev 1.0 current + Rev 2.0 open
    await fileRevision(page, DOC3, 'DOC3 revised, in progress');      // DOC3: Rev 3.0 current + Rev 4.0 open
    await setRole('qms', SEG);
    // One filter shows all three documents; changing the filter would clear a selection.
    await gotoApp(`/master-list.html?view=register&seg=${SEG}&q=${encodeURIComponent('TQ-TWS-CTSS-SOP-0')}`);
    for (const k of [DOC + '|1.0', DOC2 + '|3.0', DOC3 + '|4.0']) await page.locator(`#rows .row-chk[data-key="${k}"]`).check();
    await expect(page.locator('#bulk-count')).toHaveText('3 documents selected');
    await page.locator('#bulk-withdraw').click();
    const dlg = page.locator('#bulk-dlg');
    await expect(dlg).toBeVisible();
    await expect(page.locator('#bulk-dlg-h')).toHaveText('Withdraw 2 documents');
    const will = page.locator('#bq-wd');
    await expect(will).toContainText(DOC);
    await expect(will).toContainText('Rev 1.0, Current → Withdrawn');
    await expect(will).toContainText('Rev 2.0, Draft → Cancelled with it');
    await expect(will).toContainText(DOC2);
    await expect(page.locator('#bq-out')).toContainText(DOC3);
    await expect(page.locator('#bq-out')).toContainText('A revision in progress is not withdrawn from here');
    await expect(page.locator('#bulk-dlg-go')).toBeDisabled();
    await page.fill('#bq-reason', REASON);
    await expect(page.locator('#bulk-dlg-go')).toBeEnabled();

    // Meanwhile DOC2 is withdrawn in another tab, with another reason.
    const p2 = await context.newPage();
    await p2.goto('/index.html'); await p2.waitForFunction(() => document.readyState === 'complete');
    await p2.evaluate((n) => { TAQA_ROLE.set('qms'); TAQA_STORE.setStatus(n, 'obsolete', undefined, { reason: 'Withdrawn from the other tab for the test.' }); }, DOC2);
    await p2.close();
    await page.evaluate(() => TAQA_ROLE.set('qms'));

    await page.locator('#bulk-dlg-go').click();
    await expect(page.locator('#bulk-dlg-h')).toHaveText('1 withdrawn, 1 not withdrawn');
    await expect(page.locator('#bq-results')).toContainText('changed after you opened it');

    const f1 = await family(page, DOC), f2 = await family(page, DOC2), f3 = await family(page, DOC3);
    expect(f1.map((d) => [d.rev, d.status, d.cancelled, d.withdrawnReason])).toEqual([['1.0', 'obsolete', false, REASON], ['2.0', 'obsolete', true, null]]);
    expect(f2.find((d) => d.rev === '3.0')).toMatchObject({ status: 'obsolete', withdrawnReason: 'Withdrawn from the other tab for the test.' });
    expect(f3.map((d) => [d.rev, d.status, d.stage])).toEqual([['3.0', 'current', null], ['4.0', 'draft', 'qms']]);
    expect(await freshIntegrity(page)).toEqual([]);
    assertNoConsoleErrors(consoleErrors);
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('D. PI-21: approval and effective dates are the register\'s, per revision', () => {
  test.use(DESKTOP);

  test('a new filing has no issue date; release sets approval and effective date to today and next review from the type\'s cycle; a revision keeps its own dates and supersedes on the day', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const n = 'TQ-TWS-CTSS-SOP-902';
    const filed = await fileNew(page, n, 'Dates probe', { issueDate: '2020-01-01', nextReviewDate: '2020-06-01', approvedDate: '2019-01-01' });
    let r = await rec(page, filed.recordId);
    expect([r.issueDate, r.nextReviewDate, r.approvedDate]).toEqual([undefined, undefined, undefined]);    // never the filer's
    await check(page, n);
    // Released from the desk with the default effective date.
    await setRole('owner', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    await page.locator('.pending-card', { hasText: 'Dates probe' }).locator('.btn-approve').click();
    const t = await today(page);
    await expect(page.locator('#approve-modal-eff')).toHaveValue(t);
    await expect(page.locator('#approve-modal-eff-n')).toContainText('In force as soon as you approve it');
    await page.locator('#approve-modal-confirm').click();
    r = await rec(page, filed.recordId);
    const cycle = await page.evaluate(() => TAQA_DOC_LOOKUPS.types.sop.reviewCycleMonths || 24);
    expect(r).toMatchObject({ status: 'current', approvedDate: t, issueDate: t, nextReviewDate: plusMonths(t, cycle) });

    // Rev 2.0 of a shipped document: its own dates; Rev 1.0 keeps its own and is superseded today.
    const shipped = (await family(page, DOC))[0];
    await fileRevision(page, DOC, 'Rev 2 dates probe');
    await check(page, DOC);
    expect((await approve(page, DOC)).ok).toBe(true);
    const fam = await family(page, DOC);
    expect(fam[0]).toMatchObject({ rev: '1.0', status: 'superseded', issueDate: shipped.issueDate, approvedDate: shipped.approvedDate, supersededDate: t, supersededBy: 'Rev 2.0' });
    expect(fam[1]).toMatchObject({ rev: '2.0', status: 'current', issueDate: t, approvedDate: t });
    expect(fam.filter((d) => d.status === 'current')).toHaveLength(1);
    // An effective date before the approval date is refused.
    await fileRevision(page, DOC, 'Rev 3 backdated');
    await check(page, DOC);
    expect((await approve(page, DOC, plusDays(t, -1))).ok).toBe(false);
  });

  test('approved for a later date: Approved, not yet effective until then (the revision in force stays current); on the date it takes effect once, with both dates kept', async ({ page, gotoApp, setRole, clearAppState }) => {
    test.slow();   // a whole journey through several pages
    await start(page, gotoApp, clearAppState, setRole);
    await fileRevision(page, DOC, 'Rev 2 effective later');
    await check(page, DOC);
    const t = await today(page), eff = plusDays(t, 10);
    await setRole('owner', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    await page.locator('.pending-card', { hasText: 'Rev 2 effective later' }).locator('.btn-approve').click();
    await page.fill('#approve-modal-eff', eff);
    await expect(page.locator('#approve-modal-eff-n')).toContainText('in force from ' + eff);
    await page.locator('#approve-modal-confirm').click();
    await expect(page.locator('.pending-card', { hasText: 'Rev 2 effective later' }).locator('.action-result')).toContainText('In force from ' + eff);

    let fam = await family(page, DOC);
    expect(fam.map((d) => [d.rev, d.status])).toEqual([['1.0', 'current'], ['2.0', 'approved']]);
    expect(fam[1]).toMatchObject({ approvedDate: t, issueDate: eff });
    // Employees see only the revision in force; a new revision cannot be filed meanwhile.
    await setRole('employee', SEG);
    await gotoApp('/viewer.html?doc=' + DOC + '&seg=' + SEG);
    await expect(page.locator('#meta-grid')).toContainText('Rev 1.0');
    await expect(page.locator('#meta-grid')).toContainText('Current, OK to use');
    await gotoApp('/viewer.html?doc=' + DOC + '&rev=2.0&seg=' + SEG);
    await expect(page.locator('#lifecycle-banner')).toContainText('takes effect on');
    expect(await fileRevision(page, DOC, 'Another revision meanwhile')).toBeNull();
    await setRole('qms', SEG);
    await gotoApp('/master-list.html');
    await page.fill('#q', DOC);
    await expect(page.locator('#rows tr', { hasText: 'Approved, not yet effective' })).toHaveCount(1);

    // The effective date arrives.
    const [y, m, d] = eff.split('-').map(Number);
    await page.clock.setFixedTime(new Date(y, m - 1, d, 9, 0, 0));
    await gotoApp('/master-list.html');
    fam = await family(page, DOC);
    expect(fam.map((x) => [x.rev, x.status])).toEqual([['1.0', 'superseded'], ['2.0', 'current']]);
    expect(fam[0]).toMatchObject({ supersededBy: 'Rev 2.0', supersededDate: eff });
    expect(fam[1]).toMatchObject({ approvedDate: t, issueDate: eff, nextReviewDate: plusMonths(eff, 24) });
    const once = await page.evaluate((n) => TAQA_STORE.byKey(TAQA_STORE.recordKey(TAQA_STORE.findRev(n, '2.0'))).tookEffectAt, DOC);
    await gotoApp('/index.html');
    expect(await page.evaluate((n) => TAQA_STORE.findRev(n, '2.0').tookEffectAt, DOC)).toBe(once);   // once only
    expect(await freshIntegrity(page)).toEqual([]);
  });

  test('withdrawing the revision in force cancels one approved for later; it never takes effect', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await fileRevision(page, DOC, 'Rev 2 for later, then withdrawn');
    await check(page, DOC);
    const t = await today(page), eff = plusDays(t, 5);
    expect((await approve(page, DOC, eff)).ok).toBe(true);
    await as(page, 'qms', ([n, why]) => TAQA_STORE.setStatus(n, 'obsolete', undefined, { reason: why }), [DOC, REASON]);
    const [y, m, d] = eff.split('-').map(Number);
    await page.clock.setFixedTime(new Date(y, m - 1, d, 9, 0, 0));
    await gotoApp('/index.html');
    const fam = await family(page, DOC);
    expect(fam.map((x) => [x.rev, x.status, x.cancelled])).toEqual([['1.0', 'obsolete', false], ['2.0', 'obsolete', true]]);
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('E. PI-24: a returned attempt is history; the next attempt keeps its number', () => {
  test.use(DESKTOP);

  test('a returned first issue is filed again from "File it again": same number and Rev 1.0, attempt 2; attempt 1 stays returned and is not pending', async ({ page, gotoApp, setRole, clearAppState, consoleErrors }) => {
    test.slow();   // a whole journey through several pages
    await start(page, gotoApp, clearAppState, setRole);
    const n = 'TQ-TWS-CTSS-SOP-903';
    const one = await fileNew(page, n, 'Returned first issue');
    await as(page, 'qms', ([n, why]) => TAQA_STORE.reject(n, why), [n, RETURN]);
    const a1 = await rec(page, one.recordId);
    expect(await page.evaluate((n) => TAQA_STORE.count('pending', { segment: 'coiled-tubing' }) - TAQA_STORE.rows('pending', { segment: 'coiled-tubing' }).filter((d) => d.docNumber !== n).length, n)).toBe(0);
    // A new filing may not take the number; only filing the returned attempt again may.
    expect(await fileNew(page, n, 'Someone else taking the number')).toBeNull();

    await setRole('employee', SEG);
    await gotoApp('/upload.html');
    const row = page.locator('.subs-row', { hasText: 'Returned first issue' });
    await expect(row).toContainText('Returned');
    await row.locator('.subs-again').click();
    await expect(page).toHaveURL(/refile=/);
    // The link navigates: the file is chosen once the new page is ready.
    await page.waitForLoadState('load');
    await page.setInputFiles('#file-input', PDF('refile'));
    await page.click('#go-2');
    await expect(page.locator('#refile-note')).toContainText('attempt 2');
    await expect(page.locator('#doc-ref-id')).toHaveValue(n);
    await expect(page.locator('#doc-type-select')).toBeDisabled();
    await page.click('#go-3');
    await page.fill('#doc-title-input', 'Returned first issue, corrected');
    await page.fill('#summary-main', 'Corrected after QMS returned it.');
    await page.selectOption('#audience-select', { index: 1 });
    await page.click('#go-4');
    await expect(page.locator('#rec-card')).toContainText('Rev 1.0 (attempt 2), filed again after it was returned');
    await page.click('#submit-btn');
    await expect(page.locator('#toast-title')).toHaveText('Submitted for review');

    const fam = await family(page, n);
    expect(fam.map((d) => [d.rev, d.attempt, d.status, d.rejected, d.stage])).toEqual([['1.0', 1, 'draft', true, null], ['1.0', 2, 'draft', false, 'qms']]);
    expect(await rec(page, one.recordId)).toEqual(a1);                          // attempt 1 untouched
    // Only attempt 2 is in the queue; attempt 1 reads Returned in the register.
    await setRole('qms', SEG);
    await gotoApp(`/master-list.html?view=register&seg=${SEG}`);
    await page.fill('#q', n);
    await expect(page.locator('#rows .mark', { hasText: /^Returned$/ })).toHaveCount(1);
    expect(await page.evaluate((n) => TAQA_STORE.rows('awaiting-qms').filter((d) => d.docNumber === n).map((d) => d.attempt), n)).toEqual([2]);
    await check(page, n);
    expect((await approve(page, n)).ok).toBe(true);
    const after = await family(page, n);
    expect(after.map((d) => [d.rev, d.attempt, d.status])).toEqual([['1.0', 1, 'draft'], ['1.0', 2, 'current']]);
    expect(await freshIntegrity(page)).toEqual([]);
    assertNoConsoleErrors(consoleErrors);
  });

  test('the desk counts a returned filing as returned, not pending', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await fileNew(page, 'TQ-TWS-CTSS-SOP-904', 'Returned for the count');
    await as(page, 'qms', ([n, why]) => TAQA_STORE.reject(n, why), ['TQ-TWS-CTSS-SOP-904', RETURN]);
    expect(await page.evaluate(() => TAQA_STORE.rows('pending').some((d) => d.docNumber === 'TQ-TWS-CTSS-SOP-904'))).toBe(false);
    await setRole('owner', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    await expect(page.locator('#stat-rejected')).toHaveText('1');
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('F. PI-13: possible duplicates are shown before Submit, with the reason', () => {
  async function toStep3(page, gotoApp, file, title) {
    await gotoApp('/upload.html');
    await page.setInputFiles('#file-input', file);
    await page.click('#go-2');
    await page.selectOption('#seg-select', SEG);
    await page.selectOption('#doc-type-select', 'sop');
    await page.click('#go-3');
    await page.fill('#doc-title-input', title);
  }

  test('the same file as another record: advisory warning before Submit, and the filing still goes through', async ({ page, gotoApp, setRole, clearAppState }) => {
    test.slow();   // a whole journey through several pages
    await start(page, gotoApp, clearAppState, setRole);
    await toStep3(page, gotoApp, PDF('same'), 'First filing of this file');
    await page.fill('#summary-main', 'First copy.');
    await page.selectOption('#audience-select', { index: 1 });
    await page.click('#go-4');
    await page.click('#submit-btn');
    await expect(page.locator('#toast-title')).toHaveText('Submitted for review');
    const first = await page.evaluate(() => TAQA_STORE.added()[0]);
    expect(first.files[0].sha256).toMatch(/^[0-9a-f]{64}$/);

    await toStep3(page, gotoApp, PDF('same'), 'Unrelated wording entirely');
    await expect(page.locator('#hash-status')).toContainText('Same file as ' + first.docNumber);
    await expect(page.locator('#dup-hint-3')).toBeVisible();
    await expect(page.locator('#dup-hint-3')).toContainText('Same file');
    await page.fill('#summary-main', 'Second copy.');
    await page.selectOption('#audience-select', { index: 1 });
    await page.click('#go-4');
    const panel = page.locator('#dup-error-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(first.docNumber);
    await expect(panel).toContainText('Same file: its fingerprint matches this one');
    // Above Submit, not behind it.
    const pb = await panel.boundingBox(), sb = await page.locator('#submit-btn').boundingBox();
    expect(pb.y).toBeLessThan(sb.y);
    await page.click('#submit-btn');
    await expect(page.locator('#toast-title')).toHaveText('Submitted for review');
    expect(await page.evaluate(() => TAQA_STORE.added().length)).toBe(2);
  });

  test('a document with the same title in the area is flagged with its reason, never as a percentage; the number stays the hard rule', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const title = await page.evaluate((n) => TAQA_STORE.findDoc(n).title, DOC);
    await toStep3(page, gotoApp, PDF('title'), title);
    await expect(page.locator('#dup-hint-3')).toContainText('Same title in this area');
    await expect(page.locator('#dup-hint-3')).toContainText(DOC);
    await page.fill('#summary-main', 'Same title.');
    await page.selectOption('#audience-select', { index: 1 });
    await page.click('#go-4');
    await expect(page.locator('#dup-warn-panel')).toBeVisible();
    await expect(page.locator('#dup-warn-list')).toContainText('Same title in this area');
    expect(await page.locator('#dup-warn-panel').innerText()).not.toMatch(/\d+%/);
    // The desk shows the same reason, no percentage either.
    await page.click('#submit-btn');
    await expect(page.locator('#toast-title')).toHaveText('Submitted for review');
    await setRole('qms', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    const card = page.locator('.pending-card', { hasText: title }).filter({ hasNotText: 'Rev 1.0 → ' }).first();
    await expect(card.locator('.dup-sim-panel')).toContainText('Same title in this area');
    expect(await card.innerText()).not.toMatch(/\d+% match/);
    // The number is the hard rule: a number in use is refused outright.
    expect(await fileNew(page, DOC, 'Taking a number in use')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('G. PI-14: a new filing\'s number follows TQ-QHSE-S001 5.3', () => {
  test('typed numbers are checked before filing; the generated number always passes; the register refuses the same', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await gotoApp('/upload.html');
    await page.setInputFiles('#file-input', PDF('num'));
    await page.click('#go-2');
    await page.selectOption('#seg-select', SEG);
    await page.selectOption('#doc-type-select', 'sop');
    const generated = await page.locator('#doc-ref-id').inputValue();
    expect(generated).toMatch(/^TQ-TWS-CTSS-SOP-\d{3}$/);
    expect(await page.evaluate((n) => TAQA_STORE.numberFormatProblem({ docNumber: n, segment: 'coiled-tubing', docType: 'sop' }), generated)).toBeNull();
    const tries = [
      ['9', 'is not a TQ-QHSE-S001 number'],
      ['tq-tws-ctss-sop-950', 'capitals'],
      ['TQ-TWS-CTSS-SOP- 950', 'no spaces'],
      ['TQ-TWS-CTSS-SOP-950 ', 'no spaces'],
      ['TQ-TWS-CTSS-SOP-###', 'placeholder'],
      ['TQ-TWS-FS-F-777', 'is not a TQ-QHSE-S001 number'],
      ['TQ-TWS-CTSS-WI-950', 'is not a TQ-QHSE-S001 number'],
    ];
    for (const [n, why] of tries) {
      await page.evaluate(() => editNumber());
      await page.fill('#doc-ref-id', n);
      await page.click('#go-3');
      await expect(page.locator('#panel-2'), n).toBeVisible();
      await expect(page.locator('#hint-2'), n).toContainText(why);
      expect(await fileNew(page, n, 'Number probe ' + n), n).toBeNull();
    }
    await page.evaluate(() => editNumber());
    await page.fill('#doc-ref-id', 'TQ-TWS-CTSS-SOP-950');
    await page.click('#go-3');
    await expect(page.locator('#panel-3')).toBeVisible();
    // Other areas and types: each one's own form.
    const ok = await page.evaluate(() => [
      TAQA_STORE.numberFormatProblem({ docNumber: 'TQ-QHSE-P050', docType: 'policy', segment: 'company', issuingFunction: 'QHSE' }),
      TAQA_STORE.numberFormatProblem({ docNumber: 'TQ-QHSE-M050', docType: 'manual', segment: 'qhse' }),
      TAQA_STORE.numberFormatProblem({ docNumber: 'TQ-TWS-CTSS-WI-050', docType: 'manual', segment: 'coiled-tubing' }),
      TAQA_STORE.numberFormatProblem({ docNumber: 'TQ-GEO-S050', docType: 'standard', segment: 'geothermal-coe' }),
      TAQA_STORE.numberFormatProblem({ docNumber: 'TQ-P&T-DSC-SOP-050', docType: 'sop', segment: 'pt-drilling-coe' }),
    ]);
    expect(ok).toEqual([null, null, null, null, null]);
  });

  test('legacy records with provisional or old numbers stay readable and stay in the cleanup report', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'qms');
    const prov = await page.evaluate(() => TAQA_STORE.all().filter((d) => d.numberStatus === 'provisional' && d.status === 'current')[0]);
    await gotoApp('/viewer.html?doc=' + encodeURIComponent(prov.docNumber) + '&seg=' + prov.segment);
    await expect(page.locator('#lifecycle-banner')).toContainText('Provisional document number');
    await expect(page.locator('h1, .doc-title').first()).toContainText(prov.title);
    const report = fs.readFileSync(path.join(__dirname, '../docs/QA/REGISTER-CLEANUP-REPORT.md'), 'utf8');
    expect(report).toContain(prov.docNumber);
  });
});
