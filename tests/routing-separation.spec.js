// Priority 2A-3 (docs/QA/PRODUCT-INTEGRITY-AUDIT.md): PI-16, PI-25, PI-31.
//
//   PI-16  a maintenance procedure reaches the Maintenance Manager: Upload
//          defaults a Director or Maintenance Manager to the area they hold
//          (and the Maintenance Manager to Maintenance), Upload links carry
//          the area and side they were clicked from, and the review step
//          names who will give final approval.
//            Operations  → QMS → Segment Director
//            Maintenance → QMS → Maintenance Manager
//   PI-25  approval data belongs to one exact revision: an approval given in
//          this browser is never applied to another revision of the number.
//   PI-31  SUBMITTER ≠ QMS CHECKER ≠ FINAL APPROVER.
//
// The prototype's identity is the simulated role (or a delegate's name);
// production compares the signed-in Entra ID object (BUSINESS-RULES.md §4).
const { test, expect, DESKTOP } = require('./helpers/fixtures');

const SEG = 'coiled-tubing';

async function start(page, gotoApp, clearAppState, setRole, role, area = SEG) {
  await gotoApp('/index.html');
  await clearAppState();
  await page.evaluate(() => localStorage.setItem('taqa-tour-done', '1'));
  await setRole(role, area);
}
const fileDraft = (page, n, extra) => page.evaluate(({ n, extra }) => !!TAQA_STORE.add(Object.assign(
  { docNumber: n, title: 'Draft ' + n, segment: 'coiled-tubing', docType: 'sop', summary: 'S.' }, extra || {})), { n, extra });
const rec = (page, n) => page.evaluate((x) => { const d = TAQA_STORE.findDoc(x); return d && { status: d.status, stage: TAQA_APPROVAL.stageOf(d), cs: d.countersignedBy || null, ap: d.approvedBy || null, by: d.submittedBy }; }, n);

test.describe('PI-16: maintenance routing', () => {
  test.use(DESKTOP);

  async function toReview(page) {
    await page.setInputFiles('#file-input', { name: 'm.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') });
    await page.click('#go-2');
    await page.selectOption('#doc-type-select', 'sop');
    await page.click('#go-3');
    await expect(page.locator('#panel-3')).toBeVisible();
    await page.fill('#doc-title-input', 'Routing check procedure');
    await page.fill('#summary-main', 'A procedure filed from the top-bar Upload button.');
    await page.selectOption('#audience-select', 'Field Operators');
    await page.click('#go-4');
  }
  const approverRow = (page) => page.locator('#rec-card .rec-row').filter({ has: page.locator('.rec-k', { hasText: /^Approver$/ }) }).locator('.rec-v');

  test('a Maintenance Manager on plain Upload files into their segment as Maintenance, and it reaches them, not the Director', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'maintenance');
    await gotoApp('/upload.html');
    await expect(page.locator('#seg-select')).toHaveValue(SEG);
    await expect(page.locator('#dept-maint')).toBeChecked();
    await toReview(page);
    await expect(approverRow(page)).toContainText('Maintenance Manager, Coiled Tubing');
    await expect(approverRow(page)).toContainText('after the QMS check');
    const n = await page.locator('#doc-ref-id').inputValue();
    await page.click('#submit-btn');
    await expect(page.locator('#toast-title')).toHaveText('Submitted for review');
    expect(await page.evaluate((x) => TAQA_STORE.findDoc(x).department, n)).toBe('maintenance');
    await setRole('qms', SEG);
    expect((await page.evaluate((x) => TAQA_STORE.countersign(x), n)).ok).toBe(true);
    // Routing is checked apart from separation of duties: the Director is
    // never the approver of a Maintenance document; the Maintenance Manager
    // is, but as the filer here (PI-31) must leave it to someone else.
    const route = (x) => TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc(x), null, { ignoreSeparation: true });
    await setRole('owner', SEG);
    expect(await page.evaluate(route, n)).toBe(false);
    await setRole('maintenance', SEG);
    expect(await page.evaluate(route, n)).toBe(true);
    expect(await page.evaluate((x) => TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc(x)), n)).toBe(false);
  });

  test('a Segment Director on plain Upload files into their area as Operations, routed to the Segment Director', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'owner', 'drilling');
    await gotoApp('/upload.html');
    await expect(page.locator('#seg-select')).toHaveValue('drilling');
    await expect(page.locator('#dept-maint')).not.toBeChecked();
    await toReview(page);
    await expect(approverRow(page)).toContainText('Segment Director, Drilling Services');
  });

  test('Upload links carry the area and side they were clicked from', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp(`/segment.html?id=${SEG}&dept=maintenance`);
    await expect(page.locator('a.nav-up')).toHaveAttribute('href', `upload.html?seg=${SEG}&dept=maintenance`);
    await gotoApp(`/segment.html?id=${SEG}&dept=operations`);
    await expect(page.locator('a.nav-up')).toHaveAttribute('href', `upload.html?seg=${SEG}&dept=operations`);
    await setRole('owner', 'drilling');
    await gotoApp('/dashboard.html?id=drilling');
    await expect(page.locator('a.nav-up')).toHaveAttribute('href', 'upload.html?seg=drilling');
    // And Upload honours an explicit Operations side, even for a Maintenance Manager.
    await setRole('maintenance', SEG);
    await gotoApp(`/upload.html?seg=${SEG}&dept=operations`);
    await expect(page.locator('#dept-maint')).not.toBeChecked();
  });
});

test.describe('PI-25: approval data belongs to one exact revision', () => {
  const SHIPPED = 'TQ-TWS-CTSS-S005';   // a draft standard shipped at Rev 1.0

  async function releaseShippedDraft(page, setRole) {
    await setRole('qms', SEG);
    expect((await page.evaluate((n) => TAQA_STORE.countersign(n), SHIPPED)).ok).toBe(true);
    await setRole('owner', SEG);
    expect((await page.evaluate((n) => TAQA_STORE.approve(n), SHIPPED)).ok).toBe(true);
  }
  // The register shipping the next revision of the same number.
  const bumpRevision = (page) => page.route('**/documents-master.js', async (route) => {
    const res = await route.fetch();
    await route.fulfill({ response: res, body: (await res.text()) + `
;(function(){ var d = TAQA_MASTER_DOCS.find(function(x){ return x.docNumber === '${SHIPPED}'; }); d.revision = '2.0'; d.status = 'draft'; })();` });
  });

  test('an approval given to Rev 1.0 is never applied to a Rev 2.0 the register ships later', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await releaseShippedDraft(page, setRole);
    expect(await rec(page, SHIPPED)).toMatchObject({ status: 'current', ap: 'Segment Director' });
    await bumpRevision(page);
    await gotoApp('/index.html');
    const now = await page.evaluate((n) => { const d = TAQA_STORE.findDoc(n); return [d.revision, d.status, d.approvedBy || null, d.countersignedBy || null]; }, SHIPPED);
    expect(now).toEqual(['2.0', 'draft', null, null]);
    await gotoApp(`/viewer.html?doc=${SHIPPED}&seg=${SEG}&type=standard`);
    await expect(page.locator('body')).not.toContainText('Current, OK to use');
  });

  test('approvals stored by an earlier version are migrated to the revision they were given for, and only that one', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await page.evaluate((n) => {
      localStorage.removeItem('taqa-status-v2');
      localStorage.setItem('taqa-status-v1', JSON.stringify({ [n]: { status: 'current', approvalStage: null, approvedBy: 'Segment Director', countersignedBy: 'QMS / Document Controller' } }));
    }, SHIPPED);
    await gotoApp('/index.html');
    expect(await rec(page, SHIPPED)).toMatchObject({ status: 'current', ap: 'Segment Director' });
    const stored = await page.evaluate(() => [Object.keys(JSON.parse(localStorage.getItem('taqa-status-v2'))), !!localStorage.getItem('taqa-status-v1')]);
    expect(stored).toEqual([[SHIPPED + '@1.0'], true]);   // migrated, and the old data left as it was
    await bumpRevision(page);
    await gotoApp('/index.html');
    expect(await page.evaluate((n) => TAQA_STORE.findDoc(n).approvedBy || null, SHIPPED)).toBeNull();
  });

  test('a new revision filed here starts with no approvals of its own', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await releaseShippedDraft(page, setRole);
    await setRole('employee', SEG);
    await page.evaluate((n) => { const p = TAQA_STORE.revisionParent(n); TAQA_STORE.add({ docNumber: n, supersedes: n, title: p.title, segment: p.segment, docType: p.docType, summary: 'Rev 2.' }); }, SHIPPED);
    const r2 = await page.evaluate((n) => { const d = TAQA_STORE.findRev(n, '2.0'); return [d.status, d.approvedBy || null, d.countersignedBy || null, d.approvedDate || null]; }, SHIPPED);
    expect(r2).toEqual(['draft', null, null, null]);
  });
});

test.describe('PI-31: submitter ≠ QMS checker ≠ final approver', () => {
  test.use(DESKTOP);

  test('whoever filed a document cannot do its QMS check; the Workbench says why', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'qms');
    expect(await fileDraft(page, 'TQ-SOD-S001')).toBe(true);
    expect(await page.evaluate(() => TAQA_APPROVAL.canCountersign(TAQA_STORE.findDoc('TQ-SOD-S001')))).toBe(false);
    expect((await page.evaluate(() => TAQA_STORE.countersign('TQ-SOD-S001'))).ok).toBe(false);
    expect((await page.evaluate(() => TAQA_STORE.reject('TQ-SOD-S001', 'Rejecting my own filing here.'))).ok).toBe(false);
    expect(await rec(page, 'TQ-SOD-S001')).toMatchObject({ status: 'draft', stage: 'qms', cs: null });
    await gotoApp('/master-list.html?view=register&doc=TQ-SOD-S001');
    await page.evaluate(() => openDoc(TAQA_STORE.findDoc('TQ-SOD-S001')));
    await expect(page.locator('#dw-sep')).toContainText('You filed this document');
    await expect(page.locator('#wb-confirm')).toHaveCount(0);
  });

  test('whoever filed a document cannot give it final approval; the desk lists it with the reason; a delegate can', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'owner');
    expect(await fileDraft(page, 'TQ-SOD-S002')).toBe(true);
    await setRole('qms', SEG);
    expect((await page.evaluate(() => TAQA_STORE.countersign('TQ-SOD-S002'))).ok).toBe(true);
    await setRole('owner', SEG);
    expect((await page.evaluate(() => TAQA_STORE.approve('TQ-SOD-S002'))).ok).toBe(false);
    expect(await rec(page, 'TQ-SOD-S002')).toMatchObject({ status: 'draft', stage: 'director', ap: null });
    await gotoApp(`/dashboard.html?id=${SEG}`);
    await expect(page.locator('#pending-held')).toContainText('TQ-SOD-S002');
    await expect(page.locator('#pending-held')).toContainText('someone else must give it final approval');
    await expect(page.locator('.btn-approve[data-store-doc="TQ-SOD-S002"]')).toHaveCount(0);
    // Delegation still works: the delegate is a different person.
    const g = await page.evaluate(() => TAQA_DELEGATION.grant({ to: 'Deputy Director', reason: 'Leave', includesApproval: true,
      until: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10) }));
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), g.delegation.id);
    expect((await page.evaluate(() => TAQA_STORE.approve('TQ-SOD-S002'))).ok).toBe(true);
    expect(await rec(page, 'TQ-SOD-S002')).toMatchObject({ status: 'current', ap: 'Deputy Director (delegate for Segment Director)' });
  });

  test('the QMS checker cannot approve, and the ordinary three-person path still works', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    expect(await fileDraft(page, 'TQ-SOD-S003')).toBe(true);
    await setRole('qms', SEG);
    expect((await page.evaluate(() => TAQA_STORE.countersign('TQ-SOD-S003'))).ok).toBe(true);
    expect(await page.evaluate(() => TAQA_APPROVAL.separationReason(TAQA_STORE.findDoc('TQ-SOD-S003'), 'owner'))).toBeNull();
    await setRole('owner', SEG);
    expect((await page.evaluate(() => TAQA_STORE.approve('TQ-SOD-S003'))).ok).toBe(true);
    expect(await rec(page, 'TQ-SOD-S003')).toMatchObject({ status: 'current', by: 'Employee', cs: 'QMS / Document Controller', ap: 'Segment Director' });
  });

  test('bulk confirm leaves out a document the QMS user filed, with the reason', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'qms');
    await fileDraft(page, 'TQ-SOD-S004');
    await setRole('employee', SEG);
    await fileDraft(page, 'TQ-SOD-S005');
    await setRole('qms', SEG);
    await gotoApp(`/master-list.html?view=qms&seg=${SEG}`);
    const r = await page.evaluate(() => { bulkConfirmPreview(['TQ-SOD-S004', 'TQ-SOD-S005'].map((n) => TAQA_STORE.findDoc(n))); return [bulkPending.slice(), document.getElementById('bulk-dlg').textContent]; });
    expect(r[0]).toEqual(['TQ-SOD-S005']);
    expect(r[1]).toContain('You filed this document');
  });
});
