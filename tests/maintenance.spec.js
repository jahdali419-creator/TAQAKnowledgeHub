// Every operational segment has two departments with the same shelves.
//
// The single "TWS Maintenance" area was removed at the owner's request. Each
// operational segment now has an Operations | Maintenance switch. Maintenance
// has the same shelves as Operations (Standards, SOPs, Manuals, Forms &
// Checklists, Alerts, Lessons Learned) plus Maintenance Bulletins. A
// maintenance document is released by that segment's Maintenance Manager,
// not its Director; QMS still checks every document first.
const { test, expect } = require('./helpers/fixtures');
const { TAQA_MASTER_DOCS: DOCS, TAQA_DOC_LOOKUPS: L } = require('../documents-master.js');

const SEGMENTS = Object.keys(L.segments).filter((k) => L.segments[k].group === 'segment');
const SHELVES = ['policies', 'sops', 'manuals', 'forms', 'bulletins', 'alerts', 'lessons'];

async function start(page, gotoApp, setRole, clearAppState, role = 'employee', area = 'coiled-tubing') {
  await gotoApp('/index.html');
  await clearAppState();
  await page.evaluate(() => { localStorage.setItem('taqa-tour-done', '1'); localStorage.setItem('taqa-install-dismissed', String(Date.now())); });
  await setRole(role, area);
}

// A draft filed the way upload.html files it, already checked by QMS.
async function checkedDraft(page, setRole, docNumber, extra = {}) {
  await setRole('qms', 'coiled-tubing');
  await page.evaluate(({ dn, extra }) => {
    TAQA_STORE.add(Object.assign({ docNumber: dn, title: 'Injector Head Overhaul', segment: 'coiled-tubing', docType: 'sop',
      classification: 'internal', revision: '1.0', department: 'maintenance' }, extra));
    TAQA_STORE.countersign(dn, 'QMS Tester');
  }, { dn: docNumber, extra });
}

test.describe('the register', () => {
  test('the TWS Maintenance area and its documents are gone', () => {
    expect(L.segments['tws-maintenance']).toBeUndefined();
    expect(DOCS.filter((d) => d.segment === 'tws-maintenance' || /^TQ-TWS-MNT-/.test(d.docNumber || ''))).toEqual([]);
  });

  test('Maintenance Bulletin is a type, provisional until QHSE assigns a code, approved by the Maintenance Manager', () => {
    const t = L.types.bulletin;
    expect(t.label).toBe('Maintenance Bulletin');
    expect(t.letter).toBe('MB');
    expect(t.provisional).toBe(true);
    expect(t.approver).toBe('Maintenance Manager');
  });
});

test.describe('the Operations | Maintenance switch', () => {
  test('every operational segment has it, and its Maintenance side carries every shelf plus Bulletins', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'qms');
    for (const id of SEGMENTS) {
      await gotoApp('/segment.html?id=' + id + '&dept=maintenance&tab=sops');
      await expect(page.locator('#dept-switch'), id).toBeVisible();
      await expect(page.locator('#dept-mnt')).toHaveAttribute('aria-current', 'page');
      for (const shelf of SHELVES) await expect(page.locator(`#tab-bar .tab-btn[data-tab="${shelf}"]`), `${id} ${shelf}`).toBeVisible();
      await expect(page.locator('#panel-sops .empty-state h3')).toContainText('No maintenance SOPs');
    }
    await expect(page.locator('#panel-sops a.empty-state-upload')).toHaveAttribute('href', /dept=maintenance/);
  });

  test('Operations is the default for everyone else, and has no Bulletins shelf', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'employee');
    await gotoApp('/segment.html?id=coiled-tubing');
    await expect(page.locator('#dept-ops')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('#tab-bar .tab-btn[data-tab="bulletins"]')).toBeHidden();
    await page.locator('#dept-mnt').click();
    await expect(page).toHaveURL(/dept=maintenance/);
    await expect(page.locator('#tab-bar .tab-btn[data-tab="bulletins"]')).toBeVisible();
  });

  test('a function has no departments', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'qms');
    await gotoApp('/segment.html?id=qhse');
    await expect(page.locator('#dept-switch')).toBeHidden();
    await expect(page.locator('#tab-bar .tab-btn[data-tab="bulletins"]')).toBeHidden();
  });

  test('a Maintenance Manager lands on Maintenance', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'maintenance', 'drilling');
    await gotoApp('/segment.html?id=drilling');
    await expect(page.locator('#dept-mnt')).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('approval', () => {
  test('only the segment\'s own Maintenance Manager releases a maintenance SOP, which then shows on the Maintenance side only', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'qms');
    const dn = 'TQ-TWS-CTSS-SOP-901';
    await checkedDraft(page, setRole, dn);
    const d = await page.evaluate((n) => { const x = TAQA_STORE.findDoc(n); return { stage: TAQA_APPROVAL.stageOf(x), who: TAQA_APPROVAL.approverFor(x) }; }, dn);
    expect(d).toEqual({ stage: 'director', who: 'Maintenance Manager' });

    const can = async (role, area) => { await setRole(role, area); return page.evaluate((n) => TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc(n)), dn); };
    expect(await can('owner', 'coiled-tubing'), 'the Director does not sign maintenance').toBe(false);
    expect(await can('maintenance', 'drilling'), 'another segment\'s Maintenance Manager').toBe(false);
    expect(await can('qms', 'coiled-tubing')).toBe(false);
    expect(await can('maintenance', 'coiled-tubing')).toBe(true);

    expect((await page.evaluate((n) => TAQA_STORE.approve(n, 'Maint Manager'), dn)).ok).toBe(true);
    await gotoApp('/segment.html?id=coiled-tubing&dept=maintenance&tab=sops');
    await expect(page.locator('#panel-sops')).toContainText('Injector Head Overhaul');
    await gotoApp('/segment.html?id=coiled-tubing&dept=operations&tab=sops');
    await expect(page.locator('#panel-sops .doc-card').first()).toBeVisible();
    await expect(page.locator('#panel-sops')).not.toContainText('Injector Head Overhaul');
  });

  test('a bulletin is a maintenance document even untagged, and lands on the Bulletins shelf', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'qms');
    const dn = 'TQ-TWS-CTSS-MB-001';
    await checkedDraft(page, setRole, dn, { docType: 'bulletin', department: null, title: 'Injector Chain Wear Bulletin' });
    await setRole('owner', 'coiled-tubing');
    expect(await page.evaluate((n) => TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc(n)), dn)).toBe(false);
    await setRole('maintenance', 'coiled-tubing');
    expect((await page.evaluate((n) => TAQA_STORE.approve(n, 'Maint Manager'), dn)).ok).toBe(true);
    await gotoApp('/segment.html?id=coiled-tubing&tab=bulletins');
    await expect(page.locator('#panel-bulletins .doc-card')).toHaveCount(1);
    await expect(page.locator('#panel-bulletins')).toContainText('Injector Chain Wear Bulletin');
  });

  test('a Maintenance Manager cannot release the segment\'s operations documents', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'qms');
    const dn = 'TQ-TWS-CTSS-SOP-902';
    await checkedDraft(page, setRole, dn, { department: null, title: 'Ordinary SOP' });
    await setRole('maintenance', 'coiled-tubing');
    expect(await page.evaluate((n) => TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc(n)), dn)).toBe(false);
    await setRole('owner', 'coiled-tubing');
    expect(await page.evaluate((n) => TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc(n)), dn)).toBe(true);
  });
});

test.describe('upload', () => {
  async function toStep2(page, gotoApp, qs) {
    await gotoApp('/upload.html' + qs);
    await page.setInputFiles('#file-input', { name: 'm.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') });
    await page.click('#go-2');
  }

  test('the maintenance box shows for a segment only, and files the department', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'qms');
    await toStep2(page, gotoApp, '?seg=coiled-tubing&dept=maintenance');
    await page.selectOption('#doc-type-select', 'sop');
    await page.selectOption('#seg-select', 'coiled-tubing');
    await expect(page.locator('#dept-row')).toBeVisible();
    await expect(page.locator('#dept-maint')).toBeChecked();
    expect(await page.evaluate(() => buildRecord().department)).toBe('maintenance');

    await page.selectOption('#seg-select', 'qhse');
    await expect(page.locator('#dept-row')).toBeHidden();
    expect(await page.evaluate(() => buildRecord().department)).toBeNull();
  });

  test('a bulletin is always maintenance, and numbers TQ-<BU>-<SPL>-MB-XXX', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'qms');
    await toStep2(page, gotoApp, '');
    await page.selectOption('#doc-type-select', 'bulletin');
    await page.selectOption('#seg-select', 'coiled-tubing');
    await expect(page.locator('#dept-maint')).toBeChecked();
    await expect(page.locator('#dept-maint')).toBeDisabled();
    await expect(page.locator('#doc-ref-id')).toHaveValue('TQ-TWS-CTSS-MB-001');
    expect(await page.evaluate(() => buildRecord().department)).toBe('maintenance');
  });
});
