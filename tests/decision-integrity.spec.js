// PR 2B: decision integrity (docs/QA/PRODUCT-INTEGRITY-REASSESSMENT-POST-PR29.md).
//
//   NEW-01  a decision is bound to the exact record the person reviewed. If a
//           different record is waiting by the time they decide, the decision
//           is refused, nothing is written, and the screen says why. A card
//           showing CONTENT A never approves CONTENT B.
//   NEW-02  withdrawing a document while a revision of it is in progress
//           cancels that revision: it leaves both queues, cannot be checked or
//           approved, and stays as history with the reason (owner's decision).
//   NEW-03  a revision returned and filed again is the same revision, next
//           attempt (Rev 2.0, attempt 2), with its own permanent identity; the
//           returned attempt stays as history (owner's decision).
//   PI-07   in the QMS Workbench one deliberate action is one decision: held,
//           repeated Enter and double-clicks never decide the next document.
//   PI-06   Upload files a record only from the explicit Submit on the review
//           step; Enter on an earlier step files nothing.
//   PI-12   the approver's card names the exact number, revision and step, says
//           what it replaces, opens that exact record, and final approval asks
//           once more, naming the document and revision.
//   NEW-05  the bell's "seen" memory is per record and outcome, so seeing Rev
//           2.0's approval no longer hides Rev 3.0's.
//
// Every scenario is driven by the people who would really act (an employee
// files, QMS checks, the Director approves), as separate roles.
const fs = require('fs');
const path = require('path');
const { test, expect, DESKTOP, assertNoConsoleErrors } = require('./helpers/fixtures');

const SEG = 'coiled-tubing';
const DOC = 'TQ-TWS-CTSS-SOP-007';          // Nitrogen Injection SOP, Rev 1.0 in force
const SRC = 'TQ-TWS-CTSS-SOP-002';          // Rev 2.0 in force, with an Arabic translation
const REASON = 'Section 4 is missing the isolation steps; add them and resubmit.';
const STALE = 'This document changed after you opened it. Review the current revision before deciding.';
const PDF = { name: 'r.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') };

async function start(page, gotoApp, clearAppState, setRole, role = 'employee') {
  await gotoApp('/index.html');
  await clearAppState();
  await page.evaluate(() => {
    localStorage.setItem('taqa-tour-done', '1');
    localStorage.setItem('taqa-install-dismissed', String(Date.now()));
  });
  await setRole(role, SEG);
}
// Files the next revision of a document in force, as Upload does, by an
// employee (never by the person who will check or approve it).
const fileRevision = (page, n, title) => page.evaluate(({ n, title }) => {
  TAQA_ROLE.set('employee');
  const p = TAQA_STORE.revisionParent(n);
  const d = TAQA_STORE.add({ docNumber: n, supersedes: n, title, segment: p.segment, docType: p.docType,
    department: p.department || null, language: p.language, translationOf: p.translationOf, summary: 'Revised: ' + title });
  return d ? { rev: d.revision, recordId: d.recordId || null, attempt: d.attempt || null } : null;
}, { n, title });
// Runs fn(arg) in the page as `role`: the person who would really take that step.
const as = (page, role, fn, arg) => page.evaluate(({ role, src, arg }) => {
  TAQA_ROLE.set(role);
  // eslint-disable-next-line no-new-func
  return new Function('arg', 'return (' + src + ')(arg);')(arg);
}, { role, src: fn.toString(), arg });
const family = (page, n) => page.evaluate((x) => TAQA_STORE.revisionsOf(x).map((d) => ({
  rev: d.revision, attempt: d.attempt || 1, title: d.title, status: d.status, stage: TAQA_APPROVAL.stageOf(d),
  rejected: !!d.rejected, cancelled: !!d.cancelled, reason: d.cancelledReason || null,
  checkedBy: d.countersignedBy || null, approvedBy: d.approvedBy || null, supersededBy: d.supersededBy || null,
})), n);
async function freshIntegrity(page) {
  await page.addScriptTag({ content: fs.readFileSync(path.join(__dirname, '../scripts/check-register.js'), 'utf8') });
  const known = JSON.parse(fs.readFileSync(path.join(__dirname, '../scripts/register-baseline.json'), 'utf8')).known;
  return page.evaluate((k) => TAQA_REGISTER_CHECK.compare(TAQA_REGISTER_CHECK.check(TAQA_STORE.all(), TAQA_DOC_LOOKUPS), k).fresh
    .map((f) => f.key + ' ' + f.message), known);
}
// A second tab, signed in as the same browser, where things change meanwhile.
async function otherTab(context) {
  const p2 = await context.newPage();
  await p2.goto('/index.html');
  await p2.waitForFunction(() => document.readyState === 'complete');
  return p2;
}

// ─────────────────────────────────────────────────────────────────────────
test.describe('NEW-01: a decision is bound to the record that was reviewed', () => {
  test.use(DESKTOP);

  test('a stale final approval on the desk is refused: CONTENT A on the card never publishes CONTENT B', async ({ page, context, gotoApp, setRole, clearAppState, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    expect((await fileRevision(page, DOC, 'CONTENT A')).rev).toBe('2.0');
    await as(page, 'qms', (n) => TAQA_STORE.countersign(n), DOC);
    await setRole('owner', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    const cardA = page.locator('.pending-card', { hasText: 'CONTENT A' });
    await expect(cardA).toHaveCount(1);

    // Meanwhile, in another tab: the Director returns A, the author files B,
    // QMS checks B. B is now the record waiting on the Director.
    const p2 = await otherTab(context);
    await as(p2, 'owner', (n) => TAQA_STORE.reject(n, 'Returned from the other tab: the scope section is wrong.'), DOC);
    expect((await fileRevision(p2, DOC, 'CONTENT B')).attempt).toBe(2);
    await as(p2, 'qms', (n) => TAQA_STORE.countersign(n), DOC);
    await p2.close();
    await page.evaluate(() => TAQA_ROLE.set('owner'));
    const before = await family(page, DOC);

    // Back on the desk that still shows A: Approve, then confirm.
    await cardA.locator('.btn-approve').click();
    await expect(page.locator('#approve-modal')).toHaveClass(/open/);
    await expect(page.locator('#approve-modal-rec')).toContainText('CONTENT A');
    await page.locator('#approve-modal-confirm').click();

    // Refused, honestly, and the queue is the register's now.
    await expect(page.locator('#desk-notice')).toContainText(STALE);
    await expect(page.locator('#desk-notice')).toBeFocused();
    await expect(page.locator('.pending-card', { hasText: 'CONTENT A' })).toHaveCount(0);
    await expect(page.locator('.pending-card', { hasText: 'CONTENT B' })).toHaveCount(1);
    // Nothing was written: B is still waiting, Rev 1.0 is still in force.
    const after = await family(page, DOC);
    expect(after).toEqual(before);
    expect(after.find((d) => d.title === 'CONTENT B')).toMatchObject({ status: 'draft', stage: 'director', approvedBy: null });
    expect(after.find((d) => d.rev === '1.0')).toMatchObject({ status: 'current', supersededBy: null });
    expect(await freshIntegrity(page)).toEqual([]);
    assertNoConsoleErrors(consoleErrors);
  });

  test('a stale reject on the desk is refused and the newer record is not returned', async ({ page, context, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await fileRevision(page, DOC, 'CONTENT A');
    await as(page, 'qms', (n) => TAQA_STORE.countersign(n), DOC);
    await setRole('owner', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    const cardA = page.locator('.pending-card', { hasText: 'CONTENT A' });
    await cardA.locator('.btn-reject').click();
    await page.fill('#reject-reason-input', REASON);

    const p2 = await otherTab(context);
    await as(p2, 'owner', (n) => TAQA_STORE.reject(n, 'Returned from the other tab: the scope section is wrong.'), DOC);
    await fileRevision(p2, DOC, 'CONTENT B');
    await as(p2, 'qms', (n) => TAQA_STORE.countersign(n), DOC);
    await p2.close();
    await page.evaluate(() => TAQA_ROLE.set('owner'));

    await page.locator('#reject-modal-confirm').click();
    await expect(page.locator('#desk-notice')).toContainText(STALE);
    const b = (await family(page, DOC)).find((d) => d.title === 'CONTENT B');
    expect(b).toMatchObject({ status: 'draft', stage: 'director', rejected: false });
  });

  test('a stale QMS Confirm in the Workbench is refused, and the current revision is offered for review, not decided', async ({ page, context, gotoApp, setRole, clearAppState, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await fileRevision(page, DOC, 'CONTENT A');
    await setRole('qms', SEG);
    await gotoApp('/master-list.html?view=qms&doc=' + DOC);
    await expect(page.locator('#dw-title')).toHaveText('CONTENT A');

    const p2 = await otherTab(context);
    await as(p2, 'qms', (n) => TAQA_STORE.reject(n, 'Returned from the other tab: the scope section is wrong.'), DOC);
    await fileRevision(p2, DOC, 'CONTENT B');
    await p2.close();
    await page.evaluate(() => TAQA_ROLE.set('qms'));

    await page.locator('#wb-confirm').click();
    await expect(page.locator('#wb-res')).toContainText(STALE);
    await expect(page.locator('#wb-res')).toBeFocused();
    const b = (await family(page, DOC)).find((d) => d.title === 'CONTENT B');
    expect(b).toMatchObject({ status: 'draft', stage: 'qms', checkedBy: null });
    // What is waiting under that number now is offered, as its own step.
    await expect(page.locator('#wb-next')).toHaveText('Review the current revision');
    await page.locator('#wb-next').click();
    await expect(page.locator('#dw-title')).toHaveText('CONTENT B');
    await expect(page.locator('#dw-body')).toContainText('2.0 (attempt 2)');
    assertNoConsoleErrors(consoleErrors);
  });

  test('a stale bulk confirm leaves the newer record unchecked and says why', async ({ page, context, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await fileRevision(page, DOC, 'CONTENT A');
    await setRole('qms', SEG);
    await gotoApp('/master-list.html?view=qms');
    await page.locator(`.row-chk[data-doc="${DOC}"]`).check();
    await page.locator('#bulk-bar button', { hasText: /confirm/i }).first().click();
    await expect(page.locator('#bq-in')).toContainText(DOC);

    const p2 = await otherTab(context);
    await as(p2, 'qms', (n) => TAQA_STORE.reject(n, 'Returned from the other tab: the scope section is wrong.'), DOC);
    await fileRevision(p2, DOC, 'CONTENT B');
    await p2.close();
    await page.evaluate(() => TAQA_ROLE.set('qms'));

    await page.locator('#bulk-dlg-go').click();
    await expect(page.locator('#bq-results')).toContainText(STALE);
    const b = (await family(page, DOC)).find((d) => d.title === 'CONTENT B');
    expect(b).toMatchObject({ stage: 'qms', checkedBy: null });
  });

  test('the register refuses a decision named for another record or another step, and accepts the one named for this record', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await fileRevision(page, DOC, 'CONTENT A');
    const r = await as(page, 'qms', (n) => {
      const d = TAQA_STORE.openDraft(n), key = TAQA_STORE.recordKey(d);
      return {
        wrongKey: TAQA_STORE.countersign(n, { key: n + '@1.0', stage: 'qms' }),
        wrongStage: TAQA_STORE.countersign(n, { key, stage: 'director' }),
        right: TAQA_STORE.countersign(n, { key, stage: 'qms' }),
        again: TAQA_STORE.countersign(n, { key, stage: 'qms' }),
      };
    }, DOC);
    expect(r.wrongKey).toMatchObject({ ok: false, stale: true, error: STALE });
    expect(r.wrongStage).toMatchObject({ ok: false, stale: true });
    expect(r.right.ok).toBe(true);
    expect(r.again).toMatchObject({ ok: false, stale: true });   // already moved on to the Director
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('NEW-02: withdrawing a document cancels the revision in progress', () => {
  test.use(DESKTOP);

  test('Rev 1.0 withdrawn while Rev 2.0 waits on the Director: Rev 2.0 is cancelled, leaves every queue, and nothing can revive it', async ({ page, context, gotoApp, setRole, clearAppState, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await fileRevision(page, DOC, 'Nitrogen Injection SOP, revised');
    await as(page, 'qms', (n) => TAQA_STORE.countersign(n), DOC);
    // A Director's desk open on Rev 2.0 before the withdrawal.
    await setRole('owner', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    const card = page.locator('.pending-card', { hasText: 'Nitrogen Injection SOP, revised' });
    await expect(card).toHaveCount(1);

    // QMS withdraws the document in another tab, from the documents list.
    const p2 = await otherTab(context);
    await p2.evaluate(() => TAQA_ROLE.set('qms'));
    await p2.goto('/documents.html');
    await p2.waitForFunction(() => document.readyState === 'complete');
    const out = await p2.evaluate((n) => !!TAQA_STORE.setStatus(n, 'obsolete', undefined, { reason: 'Withdrawn for this test: superseded by a newer controlled document.' }), DOC);
    expect(out).toBe(true);
    await p2.close();

    // This tab hears of the other tab's write through the storage event.
    await expect.poll(async () => (await family(page, DOC)).find((d) => d.rev === '1.0').status).toBe('obsolete');
    const fam = await family(page, DOC);
    expect(fam.find((d) => d.rev === '1.0')).toMatchObject({ status: 'obsolete', cancelled: false });
    expect(fam.find((d) => d.rev === '2.0')).toMatchObject({ status: 'obsolete', stage: null, cancelled: true,
      reason: 'Cancelled because the document family was withdrawn.', approvedBy: null, checkedBy: 'QMS / Document Controller' });

    // The stale desk cannot approve it.
    await page.evaluate(() => TAQA_ROLE.set('owner'));
    await card.locator('.btn-approve').click();
    await page.locator('#approve-modal-confirm').click();
    await expect(page.locator('#desk-notice')).toContainText(STALE);
    await expect(page.locator('.pending-card', { hasText: 'Nitrogen Injection SOP, revised' })).toHaveCount(0);

    // Nor can anyone by any route.
    const tries = await page.evaluate((n) => {
      const res = {};
      TAQA_ROLE.set('owner'); res.approve = TAQA_STORE.approve(n);
      TAQA_ROLE.set('qms'); res.check = TAQA_STORE.countersign(n);
      res.current = !!TAQA_STORE.setStatus(n, 'current');
      res.rev2current = !!TAQA_STORE.setStatus(n, 'current', '2.0');
      res.newRevision = !!TAQA_STORE.revisionParent(n);
      res.inQmsQueue = TAQA_STORE.all().some((d) => d.docNumber === n && TAQA_APPROVAL.stageOf(d) === 'qms');
      res.inDirectorQueue = TAQA_STORE.all().some((d) => d.docNumber === n && TAQA_APPROVAL.stageOf(d) === 'director');
      return res;
    }, DOC);
    expect(tries.approve.ok).toBe(false);
    expect(tries.check.ok).toBe(false);
    expect(tries).toMatchObject({ current: false, rev2current: false, newRevision: false, inQmsQueue: false, inDirectorQueue: false });
    const after = await family(page, DOC);
    expect(after.filter((d) => d.status === 'current' || d.status === 'under-review')).toHaveLength(0);
    expect(after.find((d) => d.rev === '2.0')).toMatchObject({ status: 'obsolete', cancelled: true, approvedBy: null });

    // History stays readable, with the reason.
    await gotoApp('/viewer.html?doc=' + DOC + '&rev=2.0&seg=' + SEG);
    await expect(page.locator('#lifecycle-banner')).toContainText('Cancelled. Never in force.');
    await expect(page.locator('#lifecycle-banner')).toContainText('Cancelled because the document family was withdrawn.');
    await expect(page.locator('#appr-trail')).toContainText('Cancelled, never approved');
    await expect(page.locator('#appr-trail')).not.toContainText('Final approval');
    await setRole('qms', SEG);
    await gotoApp('/master-list.html');
    await page.fill('#q', DOC);
    await expect(page.locator('#rows tr', { hasText: 'Cancelled' })).toHaveCount(1);
    expect(await freshIntegrity(page)).toEqual([]);
    assertNoConsoleErrors(consoleErrors);
  });

  test('the Withdraw dialog says the revision in progress will be cancelled, before anything happens', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await fileRevision(page, DOC, 'Revised, in progress');
    await setRole('qms', SEG);
    await gotoApp('/documents.html?id=' + SEG);
    const row = page.locator('#pub-docs-body tr', { hasText: DOC }).first();
    await row.locator('.pub-remove-btn').click();
    await expect(page.locator('#wd-dlg-open')).toContainText('Rev 2.0, which is in progress, will be cancelled with it');
    await page.locator('#wd-dlg .wd-cancel').click();
    // Cancelled: nothing changed.
    expect((await family(page, DOC)).map((d) => [d.rev, d.status])).toEqual([['1.0', 'current'], ['2.0', 'draft']]);
  });

  test('a revision still at the QMS check is cancelled too, and the Workbench opened on it before cannot confirm it', async ({ page, context, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await fileRevision(page, DOC, 'Revised and waiting on QMS');
    await setRole('qms', SEG);
    await gotoApp('/master-list.html?view=qms&doc=' + DOC);
    await expect(page.locator('#dw-title')).toHaveText('Revised and waiting on QMS');

    const p2 = await otherTab(context);
    await p2.evaluate((n) => { TAQA_ROLE.set('qms'); TAQA_STORE.setStatus(n, 'obsolete', undefined, { reason: 'Withdrawn for this test: superseded by a newer controlled document.' }); }, DOC);
    await p2.close();

    await page.locator('#wb-confirm').click();
    await expect(page.locator('#wb-res')).toContainText('Not confirmed. Cancelled because the document family was withdrawn.');
    await expect(page.locator('#wb-next', { hasText: 'Review the current revision' })).toHaveCount(0);
    expect((await family(page, DOC)).find((d) => d.rev === '2.0')).toMatchObject({ status: 'obsolete', cancelled: true, checkedBy: null });
    await gotoApp('/master-list.html?view=qms');
    await expect(page.locator(`.row-chk[data-doc="${DOC}"]`)).toHaveCount(0);
  });

  test('a translation revision in progress is cancelled with its source family, and leaves no actionable orphan', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    const ar = await page.evaluate((s) => TAQA_STORE.all().filter((d) => d.translationOf === s && d.status === 'current')[0].docNumber, SRC);
    // The Arabic translation's own next revision, and a revision of the source.
    await fileRevision(page, ar, 'Arabic translation, revised');
    await fileRevision(page, SRC, 'Source, revised');
    await as(page, 'qms', (s) => TAQA_STORE.setStatus(s, 'obsolete', undefined, { reason: 'Withdrawn for this test: superseded by a newer controlled document.' }), SRC);
    const res = await page.evaluate(({ s, ar }) => {
      const open = TAQA_STORE.all().filter((d) => (d.docNumber === s || d.docNumber === ar) && TAQA_APPROVAL.stageOf(d));
      TAQA_ROLE.set('qms');
      return {
        open: open.length,
        arStatuses: TAQA_STORE.revisionsOf(ar).map((d) => [d.revision, d.status, !!d.cancelled]),
        checkAr: TAQA_STORE.countersign(ar).ok,
        checkSrc: TAQA_STORE.countersign(s).ok,
      };
    }, { s: SRC, ar });
    expect(res.open).toBe(0);
    expect(res.checkAr).toBe(false);
    expect(res.checkSrc).toBe(false);
    expect(res.arStatuses.every((x) => x[1] === 'obsolete')).toBe(true);
    expect(res.arStatuses.filter((x) => x[2])).toHaveLength(1);       // the revision in progress, cancelled
    expect(await freshIntegrity(page)).toEqual([]);
  });

  test('the integrity checker flags a revision left in progress for a withdrawn document', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await page.addScriptTag({ content: fs.readFileSync(path.join(__dirname, '../scripts/check-register.js'), 'utf8') });
    const codes = await page.evaluate((n) => {
      const rows = TAQA_STORE.all().map((d) => Object.assign({}, d));
      rows.find((d) => d.docNumber === n).status = 'obsolete';
      rows.push({ docNumber: n, revision: '2.0', supersedes: 'Rev 1.0', status: 'draft', title: 'left open', segment: 'coiled-tubing', docType: 'sop' });
      return TAQA_REGISTER_CHECK.check(rows, TAQA_DOC_LOOKUPS).map((f) => f.code);
    }, DOC);
    expect(codes).toContain('open-revision-of-withdrawn-document');
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('NEW-03: a returned revision filed again is the same revision, next attempt', () => {
  test.use(DESKTOP);

  test('Rev 2.0 returned and filed again is Rev 2.0 (attempt 2), its own record; the returned attempt stays as history', async ({ page, gotoApp, setRole, clearAppState, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    const one = await fileRevision(page, DOC, 'ATTEMPT ONE');
    await as(page, 'qms', ([n, why]) => TAQA_STORE.reject(n, why), [DOC, REASON]);
    await page.evaluate(() => TAQA_ROLE.set('employee'));
    const two = await fileRevision(page, DOC, 'ATTEMPT TWO');
    expect(one).toMatchObject({ rev: '2.0', attempt: 1 });
    expect(two).toMatchObject({ rev: '2.0', attempt: 2 });
    expect(two.recordId).toBeTruthy();
    expect(two.recordId).not.toBe(one.recordId);
    expect(await freshIntegrity(page)).toEqual([]);

    // The author's own list links each attempt to itself.
    await gotoApp('/upload.html');
    const subs = page.locator('.subs-row');
    await expect(subs).toHaveCount(2);
    await subs.filter({ hasText: 'ATTEMPT ONE' }).locator('a').click();
    await expect(page.locator('h1, .doc-title').first()).toContainText('ATTEMPT ONE');
    await gotoApp('/upload.html');
    await page.locator('.subs-row', { hasText: 'ATTEMPT TWO' }).locator('a').click();
    await expect(page.locator('h1, .doc-title').first()).toContainText('ATTEMPT TWO');

    // Checked and released: attempt 2 is the issued Rev 2.0.
    await as(page, 'qms', (n) => TAQA_STORE.countersign(n), DOC);
    await as(page, 'owner', (n) => TAQA_STORE.approve(n), DOC);
    const fam = await family(page, DOC);
    expect(fam.find((d) => d.title === 'ATTEMPT TWO')).toMatchObject({ rev: '2.0', attempt: 2, status: 'current' });
    expect(fam.find((d) => d.title === 'ATTEMPT ONE')).toMatchObject({ rev: '2.0', attempt: 1, status: 'draft', rejected: true });
    expect(fam.find((d) => d.rev === '1.0')).toMatchObject({ status: 'superseded' });
    expect(fam.filter((d) => d.status === 'current')).toHaveLength(1);
    expect(await freshIntegrity(page)).toEqual([]);

    // QMS's register shows both attempts, told apart.
    await setRole('qms', SEG);
    await gotoApp('/master-list.html?view=all');
    await page.fill('#q', DOC);
    await expect(page.locator('#rows tr', { hasText: '(attempt 2)' })).toHaveCount(1);
    assertNoConsoleErrors(consoleErrors);
  });

  test('the integrity checker still catches a real duplicate: the same revision twice outside a return, or one attempt held twice', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await page.addScriptTag({ content: fs.readFileSync(path.join(__dirname, '../scripts/check-register.js'), 'utf8') });
    const r = await page.evaluate((n) => {
      const base = TAQA_STORE.all().map((d) => Object.assign({}, d)), one = base.find((d) => d.docNumber === n);
      const codes = (rows) => TAQA_REGISTER_CHECK.check(rows, TAQA_DOC_LOOKUPS).filter((f) => f.docNumber === n).map((f) => f.code);
      return {
        returnedThenRefiled: codes(base.concat([
          Object.assign({}, one, { revision: '2.0', status: 'draft', rejected: true, attempt: 1, supersedes: 'Rev 1.0' }),
          Object.assign({}, one, { revision: '2.0', status: 'draft', attempt: 2, supersedes: 'Rev 1.0' })])),
        twoOpen: codes(base.concat([
          Object.assign({}, one, { revision: '2.0', status: 'draft', supersedes: 'Rev 1.0' }),
          Object.assign({}, one, { revision: '2.0', status: 'draft', supersedes: 'Rev 1.0' })])),
        attemptTwice: codes(base.concat([
          Object.assign({}, one, { revision: '2.0', status: 'draft', rejected: true, attempt: 1, supersedes: 'Rev 1.0' }),
          Object.assign({}, one, { revision: '2.0', status: 'draft', attempt: 1, supersedes: 'Rev 1.0' })])),
      };
    }, DOC);
    expect(r.returnedThenRefiled).not.toContain('duplicate-number-revision');
    expect(r.returnedThenRefiled).not.toContain('duplicate-attempt');
    expect(r.twoOpen).toContain('duplicate-number-revision');
    expect(r.attemptTwice).toContain('duplicate-attempt');
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('PI-07: one deliberate action is one decision in the Workbench', () => {
  test.use(DESKTOP);

  async function openQueue(page, gotoApp, setRole, clearAppState) {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await page.evaluate(() => ['A', 'B', 'C', 'D'].forEach((x) => TAQA_STORE.add({
      title: 'WB keyboard ' + x, segment: 'coiled-tubing', docType: 'sop', docNumber: 'TQ-TWS-CTSS-SOP-95' + x.charCodeAt(0),
      summary: 'Keyboard test document ' + x + '.',
    })));
    await setRole('qms', SEG);
    const first = await page.evaluate(() => TAQA_STORE.all().filter((d) => TAQA_APPROVAL.canCountersign(d) && /^WB keyboard/.test(d.title))[0].docNumber);
    await gotoApp('/master-list.html?view=qms&doc=' + first);
    await expect(page.locator('#wb-confirm')).toBeVisible();
  }
  const checked = (page) => page.evaluate(() => TAQA_STORE.all().filter((d) => /^WB keyboard/.test(d.title) && d.countersignedBy).length);
  const rejected = (page) => page.evaluate(() => TAQA_STORE.all().filter((d) => /^WB keyboard/.test(d.title) && d.rejected).length);

  test('a newly opened document focuses its heading, never a decision button', async ({ page, gotoApp, setRole, clearAppState }) => {
    await openQueue(page, gotoApp, setRole, clearAppState);
    await expect(page.locator('#wb-pos')).toBeFocused();
    // Enter held on the heading decides nothing.
    for (let i = 0; i < 15; i++) await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    expect(await checked(page)).toBe(0);
  });

  test('held Enter on Confirm checks exactly one document and does not carry into the next', async ({ page, gotoApp, setRole, clearAppState }) => {
    await openQueue(page, gotoApp, setRole, clearAppState);
    await expect(page.locator('#wb-confirm')).toBeEnabled();
    await page.locator('#wb-confirm').focus();
    await page.keyboard.down('Enter');
    for (let i = 0; i < 30; i++) { await page.keyboard.down('Enter'); await page.waitForTimeout(30); }   // key repeat
    await page.keyboard.up('Enter');
    expect(await checked(page)).toBe(1);
    await expect(page.locator('#wb-res')).toBeFocused();
    await expect(page.locator('#wb-res')).toContainText('Confirmed');
    // Moving on is its own step, and the next document opens to review.
    await expect(page.locator('#wb-next')).toBeEnabled();
    await page.locator('#wb-next').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#wb-pos')).toBeFocused();
    await expect(page.locator('#wb-confirm')).toBeVisible();
    expect(await checked(page)).toBe(1);
  });

  test('rapid separate Enter presses check exactly one document', async ({ page, gotoApp, setRole, clearAppState }) => {
    await openQueue(page, gotoApp, setRole, clearAppState);
    await expect(page.locator('#wb-confirm')).toBeEnabled();
    await page.locator('#wb-confirm').focus();
    for (let i = 0; i < 12; i++) await page.keyboard.press('Enter', { delay: 5 });
    await page.waitForTimeout(800);
    for (let i = 0; i < 12; i++) await page.keyboard.press('Enter', { delay: 5 });
    expect(await checked(page)).toBe(1);
    expect(await rejected(page)).toBe(0);
  });

  test('a double-click on Confirm, then on Next document, checks exactly one document', async ({ page, gotoApp, setRole, clearAppState }) => {
    await openQueue(page, gotoApp, setRole, clearAppState);
    await expect(page.locator('#wb-confirm')).toBeEnabled();
    await page.locator('#wb-confirm').dblclick();
    await expect(page.locator('#wb-res')).toContainText('Confirmed');
    expect(await checked(page)).toBe(1);
    await expect(page.locator('#wb-next')).toBeEnabled();
    await page.locator('#wb-next').dblclick();
    await expect(page.locator('#wb-confirm')).toBeVisible();
    await page.waitForTimeout(800);
    expect(await checked(page)).toBe(1);
    await expect(page.locator('#wb-res')).toHaveCount(0);
  });

  test('keyboard still works end to end: Tab to Confirm, Enter; Tab to Next, Enter; Reject with a reason', async ({ page, gotoApp, setRole, clearAppState }) => {
    await openQueue(page, gotoApp, setRole, clearAppState);
    await expect(page.locator('#wb-confirm')).toBeEnabled();
    let guard = 0;
    while (!(await page.locator('#wb-confirm').evaluate((el) => el === document.activeElement)) && guard++ < 40) await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    expect(await checked(page)).toBe(1);
    await expect(page.locator('#wb-next')).toBeEnabled();
    guard = 0;
    while (!(await page.locator('#wb-next').evaluate((el) => el === document.activeElement)) && guard++ < 10) await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.locator('#wb-pos')).toBeFocused();
    await expect(page.locator('#wb-reject')).toBeEnabled();
    await page.locator('#wb-reject').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#wb-reason')).toBeFocused();
    await page.keyboard.type(REASON);
    await page.keyboard.press('Enter');                 // a new line in the reason, not a decision
    expect(await rejected(page)).toBe(0);
    await page.locator('#wb-reject-go').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#wb-res')).toContainText('Rejected');
    expect(await rejected(page)).toBe(1);
    expect(await checked(page)).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('PI-06: Upload files only from Submit on the review step', () => {
  async function toStep(page, gotoApp, setRole, clearAppState, n) {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/upload.html');
    await page.setInputFiles('#file-input', PDF);
    await page.click('#go-2');
    await page.selectOption('#seg-select', SEG);
    await page.selectOption('#doc-type-select', 'sop');
    if (n === 2) return;
    await page.click('#go-3');
    await page.fill('#doc-title-input', 'Enter key probe');
    await page.fill('#summary-main', 'Checks that Enter does not file the record early.');
    await page.selectOption('#audience-select', { index: 1 });
  }
  const filed = (page) => page.evaluate(() => TAQA_STORE.added().length);

  test('Enter in a field on step 2 or step 3 files nothing and stays on that step', async ({ page, gotoApp, setRole, clearAppState }) => {
    await toStep(page, gotoApp, setRole, clearAppState, 2);
    await page.locator('#doc-ref-id').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#panel-2')).toBeVisible();
    expect(await filed(page)).toBe(0);
    // Step 3 complete, so the old form would have filed it: Enter in the title.
    await page.click('#go-3');
    await page.fill('#summary-main', 'Checks that Enter does not file the record early.');
    await page.selectOption('#audience-select', { index: 1 });
    await page.fill('#doc-title-input', 'Enter key probe');
    await page.locator('#doc-title-input').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await expect(page.locator('#panel-3')).toBeVisible();
    await expect(page.locator('#panel-4')).toBeHidden();
    expect(await filed(page)).toBe(0);
  });

  test('text areas keep Enter for a new line; the review step and its Submit still work from the keyboard', async ({ page, gotoApp, setRole, clearAppState }) => {
    await toStep(page, gotoApp, setRole, clearAppState, 3);
    await page.locator('#summary-main').focus();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Second line.');
    expect(await page.locator('#summary-main').inputValue()).toContain('\nSecond line.');
    expect(await filed(page)).toBe(0);
    await page.locator('#go-4').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#panel-4')).toBeVisible();
    expect(await filed(page)).toBe(0);
    await page.locator('#submit-btn').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#toast-title')).toHaveText('Submitted for review');
    expect(await filed(page)).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('PI-12: the approver sees, previews and confirms the exact revision', () => {
  test.use(DESKTOP);

  test('the Director\'s card names the number, revision, step and what it replaces; Preview opens that record; approval asks once more', async ({ page, gotoApp, setRole, clearAppState, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await fileRevision(page, DOC, 'Nitrogen Injection SOP, revised');
    await as(page, 'qms', (n) => TAQA_STORE.countersign(n), DOC);
    await setRole('owner', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    const card = page.locator('.pending-card', { hasText: 'Nitrogen Injection SOP, revised' });
    await expect(card.locator('.pending-doc-ident')).toHaveText(DOC + ' · Rev 2.0 · Draft, checked by QMS, waiting for your final approval');
    await expect(card.locator('.supersedes-row')).toContainText('Rev 1.0 → Rev 2.0. When you approve it, Rev 1.0 becomes Superseded.');
    const href = await card.locator('a.btn-preview-link').getAttribute('href');
    expect(href).toContain('doc=' + DOC);
    expect(href).toContain('rev=2.0');
    expect(href).toMatch(/rid=R-/);
    await card.locator('a.btn-preview-link').click();
    await expect(page.locator('h1, .doc-title').first()).toContainText('Nitrogen Injection SOP, revised');
    await expect(page.locator('#lifecycle-banner')).toContainText('Draft');
    await page.goBack();

    // Approve asks, naming the record; Cancel (focused) and Escape change nothing.
    const again = page.locator('.pending-card', { hasText: 'Nitrogen Injection SOP, revised' });
    await again.locator('.btn-approve').click();
    await expect(page.locator('#approve-modal')).toHaveClass(/open/);
    await expect(page.locator('#approve-modal-rec')).toContainText(DOC);
    await expect(page.locator('#approve-modal-rec')).toContainText('Rev 2.0');
    await expect(page.locator('#approve-modal-rec')).toContainText('Rev 1.0 becomes Superseded');
    await expect(page.locator('#approve-modal-confirm')).toHaveText('Approve Rev 2.0 and publish');
    await expect(page.locator('#approve-modal-cancel')).toBeFocused();
    await page.keyboard.press('Enter');                  // Enter on the focused Cancel: nothing published
    await expect(page.locator('#approve-modal')).not.toHaveClass(/open/);
    await again.locator('.btn-approve').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#approve-modal')).not.toHaveClass(/open/);
    expect((await family(page, DOC)).find((d) => d.rev === '2.0')).toMatchObject({ status: 'draft', stage: 'director' });

    await again.locator('.btn-approve').click();
    await page.locator('#approve-modal-confirm').click();
    await expect(again.locator('.action-result')).toContainText('Approved and published');
    const fam = await family(page, DOC);
    expect(fam.find((d) => d.rev === '2.0')).toMatchObject({ status: 'current', approvedBy: 'Segment Director' });
    expect(fam.find((d) => d.rev === '1.0')).toMatchObject({ status: 'superseded' });
    assertNoConsoleErrors(consoleErrors);
  });

  test('QMS\'s check on the desk names the record too, and is not asked twice (it publishes nothing)', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await fileRevision(page, DOC, 'Nitrogen Injection SOP, revised');
    await setRole('qms', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    const card = page.locator('.pending-card', { hasText: 'Nitrogen Injection SOP, revised' });
    await expect(card.locator('.pending-doc-ident')).toHaveText(DOC + ' · Rev 2.0 · Draft, waiting for your conformance check');
    await expect(card.locator('.supersedes-row')).toContainText('On final approval, Rev 1.0 becomes Superseded.');
    await card.locator('.btn-approve').click();
    await expect(page.locator('#approve-modal')).toHaveCount(0);
    await expect(card.locator('.action-result')).toContainText('Checked');
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('NEW-05: the bell tells each revision\'s outcome separately', () => {
  async function release(page, n, title) {
    await page.evaluate(() => TAQA_ROLE.set('employee'));
    await fileRevision(page, n, title);
    await as(page, 'qms', (x) => TAQA_STORE.countersign(x), n);
    await as(page, 'owner', (x) => TAQA_STORE.approve(x), n);
    await page.evaluate(() => TAQA_ROLE.set('employee'));
  }

  test('having seen Rev 2.0\'s approval, Rev 3.0\'s approval is still new', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await release(page, DOC, 'Second issue');
    await gotoApp('/index.html');
    const items = page.locator('#nav-bell').locator('xpath=..').locator('[data-ack]');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Rev 2.0');
    await page.locator('#nav-bell').click();
    await items.first().click();
    await expect(items).toHaveCount(0);

    await release(page, DOC, 'Third issue');
    await gotoApp('/index.html');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Rev 3.0');
    await expect(items.first()).toContainText('Third issue');
    // Rev 2.0's acknowledgement is untouched.
    const seen = await page.evaluate(() => JSON.parse(localStorage.getItem('taqa-ack-outcomes-v2')));
    expect(seen.some((k) => /:approved$/.test(k))).toBe(true);
  });

  test('old "seen" memory is carried over to the revision it meant, and no further', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await release(page, DOC, 'Second issue');
    await release(page, DOC, 'Third issue');
    // What version 1 stored after Rev 2.0's approval was seen: the number alone.
    await page.evaluate((n) => {
      localStorage.setItem('taqa-ack-outcomes-v1', JSON.stringify([n + ':approved']));
      localStorage.removeItem('taqa-ack-outcomes-v2');
    }, DOC);
    await gotoApp('/index.html');
    const items = page.locator('#nav-bell').locator('xpath=..').locator('[data-ack]');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Rev 3.0');
    const st = await page.evaluate(() => ({
      v1: localStorage.getItem('taqa-ack-outcomes-v1'),
      v2: JSON.parse(localStorage.getItem('taqa-ack-outcomes-v2')),
      rev2: TAQA_STORE.recordKey(TAQA_STORE.added().find((d) => d.title === 'Second issue')),
    }));
    expect(st.v1).toBe(JSON.stringify([DOC + ':approved']));       // left as it was
    expect(st.v2).toEqual([st.rev2 + ':approved']);
  });
});
