// The Maintenance page: every operational segment's maintenance department in
// one place, linked from the top bar and the phone menu. It lists each
// segment's maintenance shelves and every released Maintenance Bulletin, and
// tells a Maintenance Manager what is waiting for their approval.
const { test, expect } = require('./helpers/fixtures');
const { TAQA_DOC_LOOKUPS: L } = require('../documents-master.js');

const SEGMENTS = Object.keys(L.segments).filter((k) => L.segments[k].group === 'segment');

async function start(page, gotoApp, setRole, clearAppState, role = 'employee', area = 'coiled-tubing') {
  await gotoApp('/index.html');
  await clearAppState();
  await page.evaluate(() => { localStorage.setItem('taqa-tour-done', '1'); localStorage.setItem('taqa-install-dismissed', String(Date.now())); });
  await setRole(role, area);
}

// Filed and checked by QMS; released by the segment's Maintenance Manager
// unless `release` is false.
async function file(page, setRole, rec, release = true) {
  await setRole('qms', 'qhse');
  await page.evaluate((r) => {
    TAQA_STORE.add(Object.assign({ classification: 'internal', revision: '1.0' }, r));
    TAQA_STORE.countersign(r.docNumber, 'QMS Tester');
  }, rec);
  if (!release) return;
  await setRole('maintenance', rec.segment);
  expect((await page.evaluate((n) => TAQA_STORE.approve(n, 'Maint Manager'), rec.docNumber)).ok).toBe(true);
}

test('the top bar or the phone menu links to it', async ({ page, gotoApp, setRole, clearAppState, topbar }) => {
  await start(page, gotoApp, setRole, clearAppState);
  await gotoApp('/index.html');
  const link = await topbar.link('maintenance.html');
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/maintenance\.html/);
  await expect(page.locator('h1')).toHaveText('Maintenance');
});

test('it lists every operational segment, linking to its maintenance shelves, and says when no bulletin is out', async ({ page, gotoApp, setRole, clearAppState }) => {
  await start(page, gotoApp, setRole, clearAppState);
  await gotoApp('/maintenance.html');
  const rows = page.locator('#seg-list a.row');
  await expect(rows).toHaveCount(SEGMENTS.length);
  await expect(page.locator('#n-segs')).toHaveText(String(SEGMENTS.length));
  for (const id of SEGMENTS) {
    await expect(page.locator(`#seg-list a[data-seg="${id}"]`)).toHaveAttribute('href', `segment.html?id=${id}&dept=maintenance`);
  }
  // Your own segment comes first.
  await expect(rows.first()).toHaveAttribute('data-seg', 'coiled-tubing');
  await expect(rows.first()).toContainText('Your segment');
  // Functions have no maintenance department.
  await expect(page.locator('#seg-list a[data-seg="qhse"]')).toHaveCount(0);
  await expect(page.locator('#mb-empty')).toBeVisible();
  await expect(page.locator('#n-mb')).toHaveText('0');

  await rows.first().click();
  await expect(page).toHaveURL(/segment\.html\?id=coiled-tubing&dept=maintenance/);
  await expect(page.locator('#dept-mnt')).toHaveAttribute('aria-current', 'page');
});

test('a released bulletin is listed and opens; a draft one is not; operations documents are not counted', async ({ page, gotoApp, setRole, clearAppState }) => {
  await start(page, gotoApp, setRole, clearAppState, 'qms', 'qhse');
  await file(page, setRole, { docNumber: 'TQ-TDS-DSS-MB-001', title: 'Top Drive Gearbox Oil Interval', segment: 'drilling', docType: 'bulletin', issueDate: '2026-09-14' });
  await file(page, setRole, { docNumber: 'TQ-TDS-DSS-MAN-950', title: 'Mud Pump Manual', segment: 'drilling', docType: 'manual', department: 'maintenance' });
  await file(page, setRole, { docNumber: 'TQ-TWS-CTSS-MB-002', title: 'Draft Injector Bulletin', segment: 'coiled-tubing', docType: 'bulletin' }, false);
  await setRole('employee', 'coiled-tubing');
  await gotoApp('/maintenance.html');

  const mb = page.locator('#mb-list a.row');
  await expect(mb).toHaveCount(1);
  await expect(mb).toContainText('Top Drive Gearbox Oil Interval');
  await expect(mb).toContainText('TQ-TDS-DSS-MB-001');
  await expect(mb).toContainText('Drilling Services');
  await expect(page.locator('#mb-empty')).toBeHidden();
  await expect(page.locator('#n-mb')).toHaveText('1');
  await expect(page.locator('#n-docs')).toHaveText('2');

  const drilling = page.locator('#seg-list a[data-seg="drilling"]');
  await expect(drilling.locator('.fig')).toHaveText('2');
  await expect(drilling.locator('.shelves')).toContainText('1 Manuals');
  await expect(drilling.locator('.shelves')).toContainText('1 Bulletins');
  await expect(page.locator('#seg-list a[data-seg="coiled-tubing"] .fig')).toHaveText('0');

  await mb.click();
  await expect(page).toHaveURL(/viewer\.html\?doc=TQ-TDS-DSS-MB-001/);
  await expect(page.locator('#doc-title')).toHaveText('Top Drive Gearbox Oil Interval');
});

test('a Maintenance Manager is told what waits on them; nobody else is', async ({ page, gotoApp, setRole, clearAppState }) => {
  await start(page, gotoApp, setRole, clearAppState, 'qms', 'qhse');
  await file(page, setRole, { docNumber: 'TQ-TDS-DSS-SOP-950', title: 'Mud Pump Overhaul', segment: 'drilling', docType: 'sop', department: 'maintenance' }, false);

  await setRole('maintenance', 'drilling');
  await gotoApp('/maintenance.html');
  await expect(page.locator('#ask')).toBeVisible();
  await expect(page.locator('#ask-line')).toContainText('1 maintenance document is waiting for your approval');
  await expect(page.locator('#ask-go')).toHaveAttribute('href', 'dashboard.html?id=drilling');

  await setRole('maintenance', 'cementing');
  await gotoApp('/maintenance.html');
  await expect(page.locator('#ask')).toBeHidden();
  await setRole('owner', 'drilling');
  await gotoApp('/maintenance.html');
  await expect(page.locator('#ask')).toBeHidden();
});

test('"File a bulletin" opens the upload with the type, the department and your segment chosen', async ({ page, gotoApp, setRole, clearAppState }) => {
  await start(page, gotoApp, setRole, clearAppState, 'maintenance', 'drilling');
  await gotoApp('/maintenance.html');
  const btn = page.locator('#file-mb');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveAttribute('href', 'upload.html?type=bulletin&dept=maintenance&seg=drilling');
  await btn.click();
  await expect(page.locator('#doc-type-select')).toHaveValue('bulletin');
  await expect(page.locator('#seg-select')).toHaveValue('drilling');

  // An auditor files nothing, so is not offered it.
  await setRole('auditor', 'qhse');
  await gotoApp('/maintenance.html');
  await expect(page.locator('#file-mb')).toBeHidden();
});

test('the home page has a Maintenance door beside Ask an Expert', async ({ page, gotoApp, setRole, clearAppState }) => {
  await start(page, gotoApp, setRole, clearAppState);
  await gotoApp('/index.html');
  const doors = page.locator('.doors-strip .door-card');
  await expect(doors).toHaveCount(4);
  await expect(doors.nth(1)).toHaveAttribute('href', 'support-ticket.html');
  await expect(doors.nth(2)).toHaveAttribute('href', 'maintenance.html');
  await doors.nth(2).click();
  await expect(page).toHaveURL(/maintenance\.html/);
});

test.describe('Ask Expert', () => {
  test('an operational segment offers Operations or Maintenance; Maintenance goes to that segment\'s Maintenance Manager', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState);
    await gotoApp('/support-ticket.html');
    await expect(page.locator('#dept-group')).toBeHidden();
    await page.selectOption('#ticket-area', 'coiled-tubing');
    await expect(page.locator('#dept-group')).toBeVisible();
    await expect(page.locator('#ask-to-in .ask-n')).toHaveText('Coiled Tubing Expert');

    await page.locator('#dept-mnt-opt').click();
    await expect(page.locator('#ask-to-in .ask-n')).toHaveText('Coiled Tubing Maintenance Manager');
    await expect(page.locator('#expert-list .expert-item[data-dept="maintenance"]')).toHaveAttribute('aria-current', 'true');

    // A function has no maintenance department.
    await page.selectOption('#ticket-area', 'qhse');
    await expect(page.locator('#dept-group')).toBeHidden();
    await expect(page.locator('#ask-to-in .ask-n')).not.toContainText('Maintenance');
  });

  test('the Maintenance page sends you there already addressed', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'employee', 'drilling');
    await gotoApp('/maintenance.html');
    await expect(page.locator('#ask-mnt')).toHaveAttribute('href', 'support-ticket.html?dept=maintenance&area=drilling');
    await page.locator('#ask-mnt').click();
    await expect(page.locator('#ticket-area')).toHaveValue('drilling');
    await expect(page.locator('#dept-mnt-opt input')).toBeChecked();
    await expect(page.locator('#ask-to-in .ask-n')).toHaveText('Drilling Services Maintenance Manager');
  });

  test('a Maintenance Manager asks from their own department and segment', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'maintenance', 'cementing');
    await gotoApp('/support-ticket.html');
    await expect(page.locator('#ticket-area')).toHaveValue('cementing');
    await expect(page.locator('#ask-to-in .ask-n')).toHaveText('Cementing Maintenance Manager');
  });
});
