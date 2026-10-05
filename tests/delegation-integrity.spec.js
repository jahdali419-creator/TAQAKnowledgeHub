// PR 2C-2: delegation integrity (docs/QA/PRODUCT-INTEGRITY-REASSESSMENT-POST-PR29.md).
//
//   NEW-04  separation of duties compares actor identities, never display
//           names alone; a grant id names a grant, never a person; a grant is
//           taken up only in the session that made it; where the prototype
//           cannot show two actors are different people it refuses.
//   PI-32   a delegation passes on only what it names: approval, and
//           separately "Manage documents" (edit details and withdraw), each
//           within the grantor's area, department and the grant's document
//           types; calendar-date validity; revocation asks first, records who
//           and when, keeps the grant, and stops a stale tab.
//   PI-54   a grant is an honest record: who, to whom, what, where, when, why,
//           and its state; a meaningful reason; validated dates and scope.
//
// Owner's decisions of 5 Oct 2026: Manage documents is a separate permission,
// off by default, not implied by approval; at most 90 calendar days counting
// both ends; no start in the past; future start is Scheduled.
const { test, expect, DESKTOP, assertNoConsoleErrors } = require('./helpers/fixtures');

const SEG = 'coiled-tubing';
const REASON = 'Annual leave, desk cover while away';
const RETURN = 'Section 4 is missing the isolation steps; add them and resubmit.';
const WITHDRAW = 'Replaced by the new well control manual from 1 November.';

async function start(page, gotoApp, clearAppState, setRole, role = 'employee') {
  await gotoApp('/index.html');
  await clearAppState();
  await page.evaluate(() => {
    localStorage.setItem('taqa-tour-done', '1');
    localStorage.setItem('taqa-install-dismissed', String(Date.now()));
  });
  await setRole(role, SEG);
}
// Runs fn(arg) in the page as `role` (in this area): the person who would take that step.
const as = (page, role, fn, arg) => page.evaluate(({ role, src, arg }) => {
  TAQA_ROLE.set(role); TAQA_ROLE.setArea('coiled-tubing');
  // eslint-disable-next-line no-new-func
  return new Function('arg', 'return (' + src + ')(arg);')(arg);
}, { role, src: fn.toString(), arg });
// Filed by the Employee and checked by QMS: waiting for final approval.
async function checked(page, n, extra) {
  const ok = await as(page, 'employee', ({ n, extra }) => !!TAQA_STORE.add(Object.assign({ docNumber: n, title: 'Delegation probe ' + n,
    segment: 'coiled-tubing', docType: 'sop', revision: '1.0', summary: 'Probe.' }, extra || {})), { n, extra });
  expect(ok, 'filed ' + n).toBe(true);
  expect((await as(page, 'qms', (n) => TAQA_STORE.countersign(n), n)).ok, 'checked ' + n).toBe(true);
}
const grant = (page, role, opts) => as(page, role, (o) => TAQA_DELEGATION.grant(Object.assign({
  to: 'Deputy Director', reason: 'Annual leave, desk cover while away', from: TAQA_DELEGATION.today(), until: TAQA_DELEGATION.today(),
}, o)), opts || {});
const act = (page, id) => page.evaluate((id) => TAQA_DELEGATION.actAs(id), id);
const rec = (page, n) => page.evaluate((n) => TAQA_STORE.findDoc(n), n);
const stored = (page, id) => page.evaluate((id) => TAQA_DELEGATION.list().find((d) => d.id === id) || null, id);
const plus = (day, n) => { const [y, m, d] = day.split('-').map(Number); const t = new Date(y, m - 1, d + n);
  return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); };

// ─────────────────────────────────────────────────────────────────────────
test.describe('A. NEW-04: names are labels, identities decide, and ambiguity refuses', () => {
  test('the record carries actor identities; a matching or edited name neither grants nor bypasses', async ({ page, gotoApp, setRole, clearAppState, seedRegister }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await checked(page, 'TQ-TWS-CTSS-SOP-931');
    const r = await rec(page, 'TQ-TWS-CTSS-SOP-931');
    expect([r.submittedById, r.countersignedById]).toEqual(['sim:employee', 'sim:qms']);
    // A filer's or checker's identity cannot be edited, nor their name.
    for (const f of [{ submittedBy: 'Someone Else' }, { submittedById: 'sim:owner@drilling' }, { countersignedById: 'sim:auditor' }]) {
      const out = await as(page, 'qms', (f) => TAQA_STORE.patch('TQ-TWS-CTSS-SOP-931', f), f);
      expect(out.ok, JSON.stringify(f)).toBe(false);
    }
    // Identity decides, whatever the label says. Filed by this Director under another label: refused.
    // Filed under this Director's own label by a different identity: the label does not refuse it.
    await seedRegister([
      { docNumber: 'TQ-TWS-CTSS-SOP-932', title: 'Mine under another label', segment: SEG, docType: 'sop', status: 'draft', approvalStage: 'director',
        submittedBy: 'A. N. Other', submittedById: 'sim:owner@coiled-tubing', countersignedBy: 'QMS / Document Controller', countersignedById: 'sim:qms' },
      { docNumber: 'TQ-TWS-CTSS-SOP-933', title: 'Same label, someone else', segment: SEG, docType: 'sop', status: 'draft', approvalStage: 'director',
        submittedBy: 'Segment Director', submittedById: 'sim:owner@drilling', countersignedBy: 'QMS / Document Controller', countersignedById: 'sim:qms' },
    ]);
    await setRole('owner', SEG);
    expect(await page.evaluate(() => ['TQ-TWS-CTSS-SOP-932', 'TQ-TWS-CTSS-SOP-933'].map((n) => TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc(n)))))
      .toEqual([false, true]);
    expect((await page.evaluate(() => TAQA_STORE.approve('TQ-TWS-CTSS-SOP-932'))).ok).toBe(false);
  });

  test('a grant id is never an identity: acting under one, the session is still the grantor, so the grantor\'s own filing stays refused', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'owner');
    expect(await as(page, 'owner', () => !!TAQA_STORE.add({ docNumber: 'TQ-TWS-CTSS-SOP-934', title: 'Director files', segment: 'coiled-tubing', docType: 'sop', revision: '1.0', summary: 'P.' }))).toBe(true);
    expect((await as(page, 'qms', () => TAQA_STORE.countersign('TQ-TWS-CTSS-SOP-934'))).ok).toBe(true);
    await checked(page, 'TQ-TWS-CTSS-SOP-935');
    const g = await grant(page, 'owner', { includesApproval: true });
    expect(g.ok).toBe(true);
    expect(g.delegation.delegateId).toBeNull();                 // not established: there is no directory of people
    expect(await act(page, g.delegation.id)).toBe(true);
    expect(await page.evaluate(() => TAQA_ROLE.identity())).toBe('sim:owner@coiled-tubing');
    expect(await page.evaluate(() => TAQA_APPROVAL.separationReason(TAQA_STORE.findDoc('TQ-TWS-CTSS-SOP-934')))).toMatch(/You filed this document/);
    expect((await page.evaluate(() => TAQA_STORE.approve('TQ-TWS-CTSS-SOP-934'))).ok).toBe(false);
    // The Employee's filing is approved, recorded with the actor's identity and the grant as evidence.
    expect((await page.evaluate(() => TAQA_STORE.approve('TQ-TWS-CTSS-SOP-935'))).ok).toBe(true);
    expect(await rec(page, 'TQ-TWS-CTSS-SOP-935')).toMatchObject({ status: 'current', approvedBy: 'Deputy Director (delegate for Segment Director)',
      approvedById: 'sim:owner@coiled-tubing', approvedUnderGrant: g.delegation.id, submittedById: 'sim:employee', countersignedById: 'sim:qms' });
  });

  test('another role, another area or the console cannot take up a Director\'s grant; forced in, it holds nothing', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await checked(page, 'TQ-TWS-CTSS-SOP-936');
    const g = await grant(page, 'owner', { includesApproval: true, includesManagement: true });
    for (const [role, area] of [['employee', SEG], ['qms', SEG], ['maintenance', SEG], ['auditor', SEG], ['owner', 'drilling']]) {
      await setRole(role, area);
      expect(await act(page, g.delegation.id), role + '@' + area).toBe(false);
      // Forced into storage from the console.
      await page.evaluate((id) => localStorage.setItem('taqa-acting-delegation', id), g.delegation.id);
      const cap = await page.evaluate(() => TAQA_ROLE.effective());
      expect([cap.approve, cap.countersign, cap.editMetadata, !!cap.delegated], role + '@' + area).toEqual([false, false, false, false]);
      expect((await page.evaluate(() => TAQA_STORE.approve('TQ-TWS-CTSS-SOP-936'))).ok, role).toBe(false);
      expect(await page.evaluate((r) => !!TAQA_STORE.setStatus('TQ-TWS-CTSS-SOP-007', 'obsolete', undefined, { reason: r }), WITHDRAW), role).toBe(false);
    }
    expect(await rec(page, 'TQ-TWS-CTSS-SOP-936')).toMatchObject({ status: 'draft', approvalStage: 'director' });
    expect((await rec(page, 'TQ-TWS-CTSS-SOP-007')).status).toBe('current');
  });

  test('where the prototype cannot tell people apart it refuses: a record with no identity is compared by label, and a delegate named as the filer or checker is refused', async ({ page, gotoApp, setRole, clearAppState, seedRegister }) => {
    await start(page, gotoApp, clearAppState, setRole, 'owner');
    await seedRegister([
      // Recorded before identities were kept: only labels.
      { docNumber: 'TQ-TWS-CTSS-SOP-937', title: 'Legacy, my label', segment: SEG, docType: 'sop', status: 'draft', approvalStage: 'director',
        submittedBy: 'Segment Director', countersignedBy: 'QMS / Document Controller' },
      { docNumber: 'TQ-TWS-CTSS-SOP-938', title: 'Legacy, checked by Ahmed', segment: SEG, docType: 'sop', status: 'draft', approvalStage: 'director',
        submittedBy: 'Employee', countersignedBy: 'Ahmed Saleh' },
      { docNumber: 'TQ-TWS-CTSS-SOP-939', title: 'Filed by Ahmed as a delegate', segment: SEG, docType: 'sop', status: 'draft', approvalStage: 'director',
        submittedBy: 'Ahmed Saleh (delegate for Segment Director)', submittedById: 'sim:owner@drilling', countersignedBy: 'QMS / Document Controller', countersignedById: 'sim:qms' },
    ]);
    await setRole('owner', SEG);
    expect(await page.evaluate(() => TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc('TQ-TWS-CTSS-SOP-937')))).toBe(false);
    // Delegates named as the grantor, a role, or the QMS label are refused at the grant.
    for (const to of ['Segment Director', 'QMS / Document Controller', ' qms /  document controller ', 'Employee']) {
      expect((await grant(page, 'owner', { to, includesApproval: true })).error, to).toMatch(/not yourself or a role/);
    }
    // A delegate named as the checker or the filer cannot be shown to be someone else.
    const g = await grant(page, 'owner', { to: 'ahmed  SALEH', includesApproval: true });
    expect(g.ok).toBe(true);
    await act(page, g.delegation.id);
    const r = await page.evaluate(() => ['TQ-TWS-CTSS-SOP-938', 'TQ-TWS-CTSS-SOP-939'].map((n) => [TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc(n)),
      TAQA_APPROVAL.separationReason(TAQA_STORE.findDoc(n))]));
    expect(r[0][0]).toBe(false);
    expect(r[0][1]).toMatch(/You did the QMS check/);
    expect(r[1][0]).toBe(false);
    expect(r[1][1]).toMatch(/You filed this document/);
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('B. PI-32: approval and "Manage documents" are separate permissions', () => {
  const combos = [
    { a: false, m: false, n: 'TQ-TWS-CTSS-SOP-941', w: 'TQ-TWS-CTSS-SOP-002' },
    { a: true,  m: false, n: 'TQ-TWS-CTSS-SOP-942', w: 'TQ-TWS-CTSS-SOP-005' },
    { a: false, m: true,  n: 'TQ-TWS-CTSS-SOP-943', w: 'TQ-TWS-CTSS-SOP-007' },
    { a: true,  m: true,  n: 'TQ-TWS-CTSS-SOP-944', w: 'TQ-TWS-CTSS-SOP-009' },
  ];
  for (const c of combos) {
    test(`approval ${c.a ? 'YES' : 'NO'}, management ${c.m ? 'YES' : 'NO'}: each capability on its own`, async ({ page, gotoApp, setRole, clearAppState }) => {
      await start(page, gotoApp, clearAppState, setRole);
      await checked(page, c.n);
      const g = await grant(page, 'owner', { includesApproval: c.a, includesManagement: c.m });
      expect(g.ok).toBe(true);
      expect([g.delegation.includesApproval, g.delegation.includesManagement]).toEqual([c.a, c.m]);
      expect(await act(page, g.delegation.id)).toBe(true);
      const cap = await page.evaluate(({ n, w }) => ({
        approve: TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc(n)),
        manage: TAQA_ROLE.canManage(TAQA_STORE.findDoc(w)),
        desk: TAQA_ROLE.canOpenDesk('coiled-tubing'),
        countersign: TAQA_ROLE.effective().countersign,
        redelegate: TAQA_ROLE.effective().delegate,
      }), c);
      expect(cap).toEqual({ approve: c.a, manage: c.m, desk: true, countersign: false, redelegate: false });
      // And the register agrees when each is tried.
      const out = await page.evaluate(({ n, w, why }) => ({
        edit: TAQA_STORE.patch(w, { summary: 'Edited under a delegation.' }).ok,
        approve: TAQA_STORE.approve(n).ok,
        withdraw: !!TAQA_STORE.setStatus(w, 'obsolete', undefined, { reason: why }),
      }), { ...c, why: WITHDRAW });
      expect(out).toEqual({ edit: c.m, approve: c.a, withdraw: c.m });
      const doc = await rec(page, c.w);
      expect(doc.status).toBe(c.m ? 'obsolete' : 'current');
      if (c.m) expect(doc).toMatchObject({ withdrawnReason: WITHDRAW, withdrawnById: 'sim:owner@coiled-tubing', withdrawnUnderGrant: g.delegation.id });
    });
  }

  test('a grant made before "Manage documents" existed carries no management, and is not rewritten', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'owner');
    const legacy = { id: 'DEL-LEGACY1', to: 'Old Deputy', fromRole: 'owner', fromName: 'CT Director', segment: SEG, docTypes: null,
      includesApproval: true, from: '2026-01-01', until: '2099-01-01', reason: 'Recorded before the new evidence', createdAt: '2026-01-01T08:00:00Z', revokedAt: null };
    await page.evaluate((l) => localStorage.setItem('taqa-delegations-v1', JSON.stringify([l])), legacy);
    expect(await act(page, 'DEL-LEGACY1')).toBe(true);
    expect(await page.evaluate(() => [TAQA_ROLE.canManage(TAQA_STORE.findDoc('TQ-TWS-CTSS-SOP-007')), TAQA_DELEGATION.legacy(TAQA_DELEGATION.current())]))
      .toEqual([false, true]);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('taqa-delegations-v1'))[0])).toEqual(legacy);
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('C. PI-32: every delegated action stays in the grant\'s scope', () => {
  test('a forms-only grant approves, edits and withdraws forms only; never another area or the maintenance department', async ({ page, gotoApp, setRole, clearAppState, seedRegister }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await checked(page, 'TQ-TWS-CTSS-SOP-945');
    await checked(page, 'TQ-TWS-CTSS-F945', { docType: 'form' });
    await checked(page, 'TQ-TWS-CTSS-F946', { docType: 'form', department: 'maintenance' });
    await seedRegister([
      { docNumber: 'TQ-TWS-CTSS-F947', title: 'A form in force', segment: SEG, docType: 'form' },
      { docNumber: 'TQ-TDS-DSS-F947', title: 'A form in another area', segment: 'drilling', docType: 'form' },
    ]);
    const g = await grant(page, 'owner', { docTypes: ['form'], includesApproval: true, includesManagement: true });
    expect(g.ok).toBe(true);
    await act(page, g.delegation.id);
    const r = await page.evaluate((why) => ({
      sopApprove: TAQA_STORE.approve('TQ-TWS-CTSS-SOP-945').ok,
      sopEdit: TAQA_STORE.patch('TQ-TWS-CTSS-SOP-007', { summary: 'x' }).ok,
      sopWithdraw: !!TAQA_STORE.setStatus('TQ-TWS-CTSS-SOP-009', 'obsolete', undefined, { reason: why }),
      sopReject: TAQA_STORE.reject('TQ-TWS-CTSS-SOP-945', 'Out of the grant, so this must be refused.').ok,
      maintApprove: TAQA_STORE.approve('TQ-TWS-CTSS-F946').ok,
      otherAreaEdit: TAQA_STORE.patch('TQ-TDS-DSS-F947', { summary: 'x' }).ok,
      formApprove: TAQA_STORE.approve('TQ-TWS-CTSS-F945').ok,
      formEdit: TAQA_STORE.patch('TQ-TWS-CTSS-F947', { summary: 'Edited in scope.' }).ok,
      formWithdraw: !!TAQA_STORE.setStatus('TQ-TWS-CTSS-F947', 'obsolete', undefined, { reason: why }),
    }), WITHDRAW);
    expect(r).toEqual({ sopApprove: false, sopEdit: false, sopWithdraw: false, sopReject: false, maintApprove: false, otherAreaEdit: false,
      formApprove: true, formEdit: true, formWithdraw: true });
  });

  test('a grant never enlarges the grantor: another area, another department, a type the grantor never holds, or a power it lacks are refused', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'owner');
    expect((await grant(page, 'owner', { segment: 'drilling' })).error).toMatch(/area you hold/);
    expect((await grant(page, 'owner', { department: 'maintenance' })).error).toMatch(/own department/);
    expect((await grant(page, 'owner', { docTypes: ['bulletin'] })).error).toMatch(/do not hold bulletin/);
    expect((await grant(page, 'maintenance', { docTypes: ['policy'] })).error).toMatch(/do not hold policy/);
    expect((await grant(page, 'owner', { docTypes: ['not-a-type'] })).error).toBe('Unknown document type.');
    const r = await as(page, 'owner', (reason) => {
      const real = TAQA_ROLES.owner.editMetadata;
      TAQA_ROLES.owner.editMetadata = false;
      const out = TAQA_DELEGATION.grant({ to: 'Deputy', reason, from: TAQA_DELEGATION.today(), until: TAQA_DELEGATION.today(), includesManagement: true });
      TAQA_ROLES.owner.editMetadata = real;
      return out;
    }, REASON);
    expect(r.error).toMatch(/do not manage documents/);
    // A Maintenance Manager's delegate signs maintenance documents only.
    const mm = await grant(page, 'maintenance', { to: 'Maint Deputy', includesApproval: true, includesManagement: true });
    expect(mm.ok).toBe(true);
    expect(mm.delegation).toMatchObject({ department: 'maintenance', segment: SEG });
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('D. PI-32 / PI-54: calendar dates, whatever the time of day', () => {
  // Riyadh is UTC+3: midnight UTC is 03:00 here, which is where the old check slipped.
  test.use({ timezoneId: 'Asia/Riyadh' });

  test('today and a future start are accepted (Active, Scheduled); a past start and an end before the start are refused; 90 days inclusive and no more', async ({ page, gotoApp, setRole, clearAppState }) => {
    await page.clock.setFixedTime(new Date('2026-10-05T00:30:00+03:00'));   // just after local midnight, still 4 Oct in UTC
    await start(page, gotoApp, clearAppState, setRole, 'owner');
    expect(await page.evaluate(() => TAQA_DELEGATION.today())).toBe('2026-10-05');
    const g = (from, until) => grant(page, 'owner', { from, until });
    const today = await g('2026-10-05', '2026-10-05');
    expect(today.ok).toBe(true);
    expect(await page.evaluate((d) => TAQA_DELEGATION.state(d), today.delegation)).toBe('active');
    const later = await g('2026-10-20', '2026-10-25');
    expect(await page.evaluate((d) => TAQA_DELEGATION.state(d), later.delegation)).toBe('scheduled');
    expect(await act(page, later.delegation.id)).toBe(false);          // not yet in force
    expect((await g('2026-10-04', '2026-10-10')).error).toMatch(/cannot start in the past/);
    expect((await g('2026-10-10', '2026-10-09')).error).toBe('The end date is before the start.');
    expect((await g('2026-10-05', plus('2026-10-05', 89))).ok).toBe(true);           // 90 days counting both
    expect((await g('2026-10-05', plus('2026-10-05', 90))).error).toMatch(/at most 90 days/);  // 91 days
  });

  test('a grant is valid for the whole of its end date and expired from the next day', async ({ page, gotoApp, setRole, clearAppState }) => {
    await page.clock.setFixedTime(new Date('2026-10-05T09:00:00+03:00'));
    await start(page, gotoApp, clearAppState, setRole, 'owner');
    const g = await grant(page, 'owner', { from: '2026-10-05', until: '2026-10-07', includesApproval: true });
    const stateAt = async (iso) => {
      await page.clock.setFixedTime(new Date(iso));
      return page.evaluate((id) => TAQA_DELEGATION.state(TAQA_DELEGATION.list().find((d) => d.id === id)), g.delegation.id);
    };
    expect(await stateAt('2026-10-05T00:00:30+03:00')).toBe('active');   // the old UTC reading said "not yet"
    expect(await stateAt('2026-10-07T23:59:30+03:00')).toBe('active');   // the end date, to its last minute
    expect(await stateAt('2026-10-08T00:00:30+03:00')).toBe('expired');  // the next day
    expect(await stateAt('2026-10-08T02:59:00+03:00')).toBe('expired');  // the old UTC reading still said "active"
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('E. PI-32: revocation asks first, records who and when, keeps the grant, and stops a stale tab', () => {
  test.use(DESKTOP);

  test('revoke from the desk: confirmation, evidence, history kept, original grant unchanged', async ({ page, gotoApp, setRole, clearAppState, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole, 'owner');
    const g = await grant(page, 'owner', { includesApproval: true });
    const before = await stored(page, g.delegation.id);
    await gotoApp(`/dashboard.html?id=${SEG}`);
    const row = page.locator(`#deleg-list .deleg-row[data-grant="${g.delegation.id}"]`);
    await expect(row.locator('.dr-state')).toHaveText('Active');
    await row.locator('[data-rev]').click();
    await expect(page.locator('#revoke-dlg')).toBeVisible();
    await expect(page.locator('#revoke-dlg-what')).toContainText(g.delegation.id);
    await page.locator('#revoke-dlg-cancel').click();                   // asked first: nothing happened
    expect((await stored(page, g.delegation.id)).revokedAt).toBeNull();
    await row.locator('[data-rev]').click();
    await page.locator('#revoke-dlg-go').click();
    await expect(row.locator('.dr-state')).toHaveText('Revoked');       // still listed, as history
    await expect(row.locator('.dr-ev')).toContainText('revoked by');
    await expect(row.locator('[data-rev], [data-act]')).toHaveCount(0);
    const after = await stored(page, g.delegation.id);
    expect(after.revokedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(after).toMatchObject({ revokedById: 'sim:owner@coiled-tubing', revokedBy: before.fromName });
    const { revokedAt, revokedBy, revokedById, ...rest } = after;
    const { revokedAt: a, revokedBy: b, revokedById: c, ...orig } = before;
    expect(rest).toEqual(orig);                                          // the grant itself unchanged
    expect((await page.evaluate((id) => TAQA_DELEGATION.revoke(id), g.delegation.id)).ok).toBe(false);   // once only
    expect(await act(page, g.delegation.id)).toBe(false);
    assertNoConsoleErrors(consoleErrors);
  });

  test('a stale tab acting under a grant revoked elsewhere cannot approve or withdraw', async ({ page, context, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await checked(page, 'TQ-TWS-CTSS-SOP-948');
    const g = await grant(page, 'owner', { includesApproval: true, includesManagement: true });
    await act(page, g.delegation.id);
    await gotoApp(`/dashboard.html?id=${SEG}`);
    await expect(page.locator('.deleg-bar')).toContainText('approval, manage documents');
    const approveBtn = page.locator('.btn-approve[data-store-doc="TQ-TWS-CTSS-SOP-948"]');
    await expect(approveBtn).toBeVisible();

    // The grantor, in another tab, stops acting and revokes it.
    const p2 = await context.newPage();
    await p2.goto(`/dashboard.html?id=${SEG}`); await p2.waitForFunction(() => document.readyState === 'complete');
    await p2.evaluate(() => TAQA_DELEGATION.actAs(null));
    expect((await p2.evaluate((id) => TAQA_DELEGATION.revoke(id), g.delegation.id)).ok).toBe(true);
    await p2.close();

    // Back in the stale tab: the buttons are still on screen, but nothing works.
    await approveBtn.click();
    await page.locator('#approve-modal-confirm').click();
    expect(await rec(page, 'TQ-TWS-CTSS-SOP-948')).toMatchObject({ status: 'draft', approvalStage: 'director' });
    expect(await page.evaluate((why) => !!TAQA_STORE.setStatus('TQ-TWS-CTSS-SOP-007', 'obsolete', undefined, { reason: why }), WITHDRAW)).toBe(false);
    expect(await page.evaluate(() => TAQA_STORE.approve('TQ-TWS-CTSS-SOP-948').ok)).toBe(false);
    // Revoked server-side while still acting here: the same.
    await setRole('owner', SEG);
    const g2 = await grant(page, 'owner', { to: 'Second Deputy', includesApproval: true });
    await act(page, g2.delegation.id);
    await page.evaluate((id) => { const all = JSON.parse(localStorage.getItem('taqa-delegations-v1'));
      all.find((d) => d.id === id).revokedAt = new Date().toISOString(); localStorage.setItem('taqa-delegations-v1', JSON.stringify(all)); }, g2.delegation.id);
    expect(await page.evaluate(() => [TAQA_STORE.approve('TQ-TWS-CTSS-SOP-948').ok, TAQA_ROLE.effective().approve])).toEqual([false, false]);
    expect((await rec(page, 'TQ-TWS-CTSS-SOP-948')).status).toBe('draft');
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('F. PI-54: every grant is an honest record', () => {
  test('a grant records who, to whom, what, where, when and why; ids are unique and never change; the reason must mean something', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'owner');
    for (const reason of ['', '.', 'leave', '  short   reason  ']) {
      expect((await grant(page, 'owner', { reason })).error, reason).toMatch(/at least 20 characters/);
    }
    const two = await as(page, 'owner', (reason) => [1, 2].map(() => TAQA_DELEGATION.grant({
      to: 'Deputy', fromName: 'CT Director', reason, from: TAQA_DELEGATION.today(), until: TAQA_DELEGATION.today(),
      docTypes: ['sop', 'form'], includesApproval: true })), REASON);
    expect(two[0].delegation.id).not.toBe(two[1].delegation.id);         // made in the same instant, still two ids
    const d = two[0].delegation;
    expect(d).toMatchObject({ schema: 2, fromRole: 'owner', grantorId: 'sim:owner@coiled-tubing', fromName: 'CT Director', to: 'Deputy', delegateId: null,
      includesApproval: true, includesManagement: false, segment: SEG, department: null, docTypes: ['sop', 'form'],
      reason: REASON, createdById: 'sim:owner@coiled-tubing', createdBy: 'CT Director', revokedAt: null });
    expect(d.id).toMatch(/^DEL-[A-Z0-9]+-[A-Z0-9]+$/);
    expect(d.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(d.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(await page.evaluate((d) => TAQA_DELEGATION.state(d), d)).toBe('active');
  });

  test('a legacy grant reads honestly on the desk: labelled incomplete, never rewritten', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'owner');
    const legacy = { id: 'DEL-LEGACY2', to: 'Old Deputy', fromRole: 'owner', fromName: 'CT Director', segment: SEG, docTypes: null,
      includesApproval: true, from: '2026-01-01', until: '2026-02-01', reason: 'Recorded before the new evidence', createdAt: '2026-01-01T08:00:00Z', revokedAt: null };
    await page.evaluate((l) => localStorage.setItem('taqa-delegations-v1', JSON.stringify([l])), legacy);
    await gotoApp(`/dashboard.html?id=${SEG}`);
    const row = page.locator('#deleg-list .deleg-row[data-grant="DEL-LEGACY2"]');
    await expect(row.locator('.dr-state')).toHaveText('Expired');
    await expect(row.locator('.dr-ev')).toContainText('recorded before RISE kept full delegation evidence');
    await expect(row).toContainText('no document management');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('taqa-delegations-v1'))[0])).toEqual(legacy);
  });
});

// ─────────────────────────────────────────────────────────────────────────
test.describe('G. PI-31 still holds, direct and delegated', () => {
  test('Employee → QMS → Director, and Employee → QMS → the Director\'s delegate: three actors, each separate', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await checked(page, 'TQ-TWS-CTSS-SOP-949');
    await checked(page, 'TQ-TWS-CTSS-SOP-950');
    // QMS cannot approve, and cannot check its own filing.
    expect((await as(page, 'qms', () => TAQA_STORE.approve('TQ-TWS-CTSS-SOP-949'))).ok).toBe(false);
    expect(await as(page, 'qms', () => !!TAQA_STORE.add({ docNumber: 'TQ-QHSE-P951', title: 'QMS files a policy', segment: 'company', docType: 'policy', issuingFunction: 'QHSE', revision: '1.0', summary: 'P.' }))).toBe(true);
    expect((await as(page, 'qms', () => TAQA_STORE.countersign('TQ-QHSE-P951'))).ok).toBe(false);
    // Direct.
    expect((await as(page, 'owner', () => TAQA_STORE.approve('TQ-TWS-CTSS-SOP-949'))).ok).toBe(true);
    // Delegated.
    const g = await grant(page, 'owner', { includesApproval: true });
    await act(page, g.delegation.id);
    expect((await page.evaluate(() => TAQA_STORE.approve('TQ-TWS-CTSS-SOP-950'))).ok).toBe(true);
    const r = await page.evaluate(() => ['TQ-TWS-CTSS-SOP-949', 'TQ-TWS-CTSS-SOP-950'].map((n) => {
      const d = TAQA_STORE.findDoc(n); return [d.submittedById, d.countersignedById, d.approvedById, d.approvedUnderGrant || null]; }));
    expect(r).toEqual([['sim:employee', 'sim:qms', 'sim:owner@coiled-tubing', null],
                       ['sim:employee', 'sim:qms', 'sim:owner@coiled-tubing', g.delegation.id]]);
  });

  test('Employee → QMS → Maintenance Manager, and its delegate: maintenance documents only, three actors separate', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await checked(page, 'TQ-TWS-CTSS-SOP-952', { department: 'maintenance' });
    await checked(page, 'TQ-TWS-CTSS-SOP-953', { department: 'maintenance' });
    await checked(page, 'TQ-TWS-CTSS-SOP-954');
    expect((await as(page, 'maintenance', () => TAQA_STORE.approve('TQ-TWS-CTSS-SOP-952'))).ok).toBe(true);
    expect((await as(page, 'owner', () => TAQA_STORE.approve('TQ-TWS-CTSS-SOP-953'))).ok).toBe(false);   // not the Director's
    const g = await grant(page, 'maintenance', { to: 'Maint Deputy', includesApproval: true });
    await act(page, g.delegation.id);
    expect(await page.evaluate(() => [TAQA_STORE.approve('TQ-TWS-CTSS-SOP-954').ok, TAQA_STORE.approve('TQ-TWS-CTSS-SOP-953').ok])).toEqual([false, true]);
    const d = await rec(page, 'TQ-TWS-CTSS-SOP-953');
    expect([d.submittedById, d.countersignedById, d.approvedById, d.approvedUnderGrant]).toEqual(['sim:employee', 'sim:qms', 'sim:maintenance@coiled-tubing', g.delegation.id]);
    expect(d.approvedBy).toMatch(/^Maint Deputy \(delegate for /);
  });
});
