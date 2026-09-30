// Every operational segment has its own maintenance department.
//
// The single "TWS Maintenance" area was removed at the owner's request. Each
// segment now carries a Maintenance tab, and a document filed as Maintenance
// is released by that segment's Maintenance Manager, not its Director. QMS
// still checks every document first.
const { test, expect } = require('./helpers/fixtures');
const { TAQA_MASTER_DOCS: DOCS, TAQA_DOC_LOOKUPS: L } = require('../documents-master.js');

const SEGMENTS = Object.keys(L.segments).filter((k) => L.segments[k].group === 'segment');

async function start(page, gotoApp, setRole, clearAppState, role = 'employee', area = 'coiled-tubing') {
  await gotoApp('/index.html');
  await clearAppState();
  await page.evaluate(() => { localStorage.setItem('taqa-tour-done', '1'); localStorage.setItem('taqa-install-dismissed', String(Date.now())); });
  await setRole(role, area);
}

// A maintenance draft, filed the way upload.html files one, already checked by QMS.
async function checkedMaintenanceDraft(page, setRole, docNumber, extra = {}) {
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
});

test.describe('the Maintenance tab', () => {
  test('every operational segment shows it, empty until its department files something', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'qms');
    for (const id of SEGMENTS) {
      await gotoApp('/segment.html?id=' + id + '&tab=maintenance');
      await expect(page.locator('#tab-bar .tab-btn[data-tab="maintenance"]'), id).toBeVisible();
      await expect(page.locator('#panel-maintenance')).toHaveClass(/active/);
      await expect(page.locator('#panel-maintenance .empty-state h3')).toContainText('No maintenance documents');
    }
    await expect(page.locator('#panel-maintenance a.empty-state-upload')).toHaveAttribute('href', /dept=maintenance/);
  });

  test('a function has no Maintenance tab', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'qms');
    await gotoApp('/segment.html?id=qhse');
    await expect(page.locator('#tab-bar .tab-btn[data-tab="maintenance"]')).toBeHidden();
  });

  test('a Maintenance Manager lands on it', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'maintenance', 'drilling');
    await gotoApp('/segment.html?id=drilling');
    await expect(page.locator('#panel-maintenance')).toHaveClass(/active/);
  });
});

test.describe('approval', () => {
  test('only the segment\'s own Maintenance Manager can release a maintenance document', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'qms');
    const dn = 'TQ-TWS-CTSS-SOP-901';
    await checkedMaintenanceDraft(page, setRole, dn);
    const d = await page.evaluate((n) => { const x = TAQA_STORE.findDoc(n); return { stage: TAQA_APPROVAL.stageOf(x), who: TAQA_APPROVAL.approverFor(x) }; }, dn);
    expect(d).toEqual({ stage: 'director', who: 'Maintenance Manager' });

    const can = async (role, area) => { await setRole(role, area); return page.evaluate((n) => TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc(n)), dn); };
    expect(await can('owner', 'coiled-tubing'), 'the Director does not sign maintenance').toBe(false);
    expect(await can('maintenance', 'drilling'), 'another segment\'s Maintenance Manager').toBe(false);
    expect(await can('qms', 'coiled-tubing')).toBe(false);
    expect(await can('maintenance', 'coiled-tubing')).toBe(true);

    const out = await page.evaluate((n) => TAQA_STORE.approve(n, 'Maint Manager'), dn);
    expect(out.ok).toBe(true);
    await gotoApp('/segment.html?id=coiled-tubing&tab=maintenance');
    await expect(page.locator('#panel-maintenance .doc-card')).toHaveCount(1);
    await expect(page.locator('#panel-maintenance')).toContainText('Injector Head Overhaul');
    await gotoApp('/segment.html?id=coiled-tubing&tab=sops');
    await expect(page.locator('#panel-sops')).not.toContainText('Injector Head Overhaul');
  });

  test('a Maintenance Manager cannot release the segment\'s other documents', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'qms');
    const dn = 'TQ-TWS-CTSS-SOP-902';
    await checkedMaintenanceDraft(page, setRole, dn, { department: null, title: 'Ordinary SOP' });
    await setRole('maintenance', 'coiled-tubing');
    expect(await page.evaluate((n) => TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc(n)), dn)).toBe(false);
    await setRole('owner', 'coiled-tubing');
    expect(await page.evaluate((n) => TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc(n)), dn)).toBe(true);
  });
});

test.describe('upload', () => {
  test('the maintenance box shows for a segment only, and files the department and its approver', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'qms');
    await gotoApp('/upload.html?seg=coiled-tubing&dept=maintenance');
    await page.setInputFiles('#file-input', { name: 'm.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') });
    await page.click('#go-2');
    await page.selectOption('#doc-type-select', 'sop');
    await page.selectOption('#seg-select', 'coiled-tubing');
    await expect(page.locator('#dept-row')).toBeVisible();
    await expect(page.locator('#dept-maint')).toBeChecked();
    expect(await page.evaluate(() => buildRecord().department)).toBe('maintenance');

    await page.selectOption('#seg-select', 'qhse');
    await expect(page.locator('#dept-row')).toBeHidden();
    expect(await page.evaluate(() => buildRecord().department)).toBeNull();
  });
});
