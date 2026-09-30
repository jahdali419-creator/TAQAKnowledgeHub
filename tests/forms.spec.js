// Forms and checklists (TQ-QHSE-S001 5.3, row 06).
//
// Every operational area has a Forms & Checklists tab. A form opens in one
// TAQA template (form.html): filled in on a phone, or printed blank or filled
// on A4. The four checklists that were filed as SOPs are forms now, and their
// old numbers still resolve so printed QR codes keep working.
const { test, expect } = require('./helpers/fixtures');
const { TAQA_MASTER_DOCS: DOCS } = require('../documents-master.js');
const { TAQA_FORMS } = require('../forms-data.js');

const MOVED = {
  'TQ-TWS-CTSS-SOP-001': 'TQ-TWS-CTSS-F001',
  'TQ-TDS-DSS-SOP-001': 'TQ-TDS-DSS-F001',
  'TQ-TWS-WTS-SOP-001': 'TQ-TWS-WTS-F001',
  'TQ-MRS-SOP-001': 'TQ-MRS-F001',
};

async function start(page, gotoApp, setRole, clearAppState, role = 'employee', area = 'coiled-tubing') {
  await gotoApp('/index.html');
  await clearAppState();
  await page.evaluate(() => { localStorage.setItem('taqa-tour-done', '1'); localStorage.setItem('taqa-install-dismissed', String(Date.now())); });
  await setRole(role, area);
}

test.describe('the register', () => {
  test('the four checklists are forms with F numbers and keep their old SOP numbers as aliases', () => {
    for (const [was, now] of Object.entries(MOVED)) {
      const d = DOCS.find((x) => x.docNumber === now);
      expect(d, now).toBeTruthy();
      expect(d.docType).toBe('form');
      expect(d.formerNumbers).toContain(was);
      expect(DOCS.find((x) => x.docNumber === was), was + ' must not still exist').toBeFalsy();
    }
    const ar = DOCS.find((x) => x.docNumber === 'TQ-TWS-CTSS-F001-AR');
    expect(ar.docType).toBe('form');
    expect(ar.translationOf).toBe('TQ-TWS-CTSS-F001');
  });

  test('every form content entry belongs to a form in the register and is marked sample until approved', () => {
    for (const [num, f] of Object.entries(TAQA_FORMS)) {
      const d = DOCS.find((x) => x.docNumber === num);
      expect(d && d.docType, num).toBe('form');
      expect(f.sample).toBe(true);
      expect(f.sections.length).toBeGreaterThan(0);
      expect(f.signoff.length).toBeGreaterThan(0);
    }
  });
});

test.describe('the Forms & Checklists tab', () => {
  test('an operational area lists its forms, and one without any says so', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState);
    await gotoApp('/segment.html?id=coiled-tubing');
    const tab = page.locator('#tab-bar .tab-btn[data-tab="forms"]');
    await expect(tab).toBeVisible();
    await expect(tab).toContainText('Forms & Checklists');
    await tab.click();
    await expect(page.locator('#panel-forms')).toHaveClass(/active/);
    await expect(page.locator('#panel-forms .doc-card').first()).toBeVisible();
    await expect(page.locator('#panel-forms')).toContainText('Pre-Job Safety Checklist');

    await gotoApp('/segment.html?id=cementing');
    await page.locator('#tab-bar .tab-btn[data-tab="forms"]').click();
    await expect(page.locator('#panel-forms .empty-state')).toBeVisible();
  });
});

test.describe('the viewer', () => {
  test('a form record offers "Fill in or print", which opens the TAQA form', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState);
    await gotoApp('/viewer.html?doc=TQ-TWS-CTSS-F001&seg=coiled-tubing&type=form');
    const btn = page.locator('#dl-btn');
    await expect(btn).toBeEnabled();
    await expect(btn).toContainText(/Fill in/);
    await btn.click();
    await expect(page).toHaveURL(/form\.html\?doc=TQ-TWS-CTSS-F001/);
    await expect(page.locator('#f-title')).toHaveText('Pre-Job Safety Checklist');
  });

  test('an old SOP number opens the form under its new number', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState);
    await gotoApp('/viewer.html?doc=TQ-TWS-CTSS-SOP-001&seg=coiled-tubing');
    await expect(page.locator('#doc-title')).toHaveText('Pre-Job Safety Checklist');
    await expect(page.locator('body')).toContainText('TQ-TWS-CTSS-F001');
  });
});

test.describe('form.html', () => {
  test('shows the template: number, title, sample notice, checks, sign-off and QR', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState);
    await gotoApp('/form.html?doc=TQ-TWS-CTSS-F001');
    await expect(page.locator('.docno')).toHaveText('TQ-TWS-CTSS-F001');
    await expect(page.locator('#f-title')).toHaveText('Pre-Job Safety Checklist');
    await expect(page.locator('.note.sample')).toContainText('Sample content');
    const items = TAQA_FORMS['TQ-TWS-CTSS-F001'].sections.reduce((n, s) => n + s.items.length, 0);
    await expect(page.locator('.ans')).toHaveCount(items);
    await expect(page.locator('#tally')).toContainText(`0 of ${items}`);
    await expect(page.locator('.sign .blk')).toHaveCount(2);
    await expect(page.locator('.ctl img')).toBeVisible();
    await expect(page.locator('#back')).toHaveAttribute('href', /viewer\.html\?doc=TQ-TWS-CTSS-F001/);
  });

  test('answers are recorded, counted and kept after a reload, and Clear removes them', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState);
    await gotoApp('/form.html?doc=TQ-TWS-CTSS-F001');
    const first = page.locator('.ans').first();
    await first.locator('button[data-v="yes"]').click();
    await expect(first.locator('button[data-v="yes"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.ans').nth(1).locator('button[data-v="na"]').click();
    await expect(page.locator('#tally')).toContainText('2 of');
    await page.locator('#job-0').fill('Well HRD-114');

    await gotoApp('/form.html?doc=TQ-TWS-CTSS-F001');
    await expect(page.locator('.ans').first().locator('button[data-v="yes"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#job-0')).toHaveValue('Well HRD-114');

    page.once('dialog', (d) => d.accept());
    await page.locator('#clear').click();
    await page.waitForFunction(() => document.readyState === 'complete');
    await expect(page.locator('#tally')).toContainText('0 of');
    await expect(page.locator('#job-0')).toHaveValue('');
  });

  test('the old SOP number and the Arabic translation both open, the translation saying where its checks come from', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState);
    await gotoApp('/form.html?doc=TQ-MRS-SOP-001');
    await expect(page.locator('.docno')).toHaveText('TQ-MRS-F001');

    await gotoApp('/form.html?doc=TQ-TWS-CTSS-F001-AR');
    await expect(page.locator('.docno')).toHaveText('TQ-TWS-CTSS-F001-AR');
    await expect(page.locator('.note.info')).toContainText('TQ-TWS-CTSS-F001');
    await expect(page.locator('.ans').first()).toBeVisible();
  });

  test('a number that is not a form is refused', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState);
    await gotoApp('/form.html?doc=TQ-TWS-CTSS-SOP-011');
    await expect(page.locator('h2')).toHaveText('Form not found');
    await expect(page.locator('#print-filled')).toBeHidden();
    await gotoApp('/form.html?doc=NOPE-1');
    await expect(page.locator('h2')).toHaveText('Form not found');
  });

  test('a withdrawn form cannot be filled in or printed', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'qms');
    const moved = await page.evaluate(() => !!TAQA_STORE.setStatus('TQ-TDS-DSS-F001', 'obsolete'));
    expect(moved).toBe(true);
    await setRole('employee', 'coiled-tubing');
    await gotoApp('/form.html?doc=TQ-TDS-DSS-F001');
    await expect(page.locator('.note.stop')).toContainText('Withdrawn. Do not use.');
    await expect(page.locator('#print-filled')).toBeDisabled();
    await expect(page.locator('#print-blank')).toBeDisabled();
  });

  test('a draft form is withheld from an employee and shown to QMS as a draft', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'qms', 'qhse');
    await page.evaluate(() => TAQA_STORE.add({ docNumber: 'TQ-QHSE-F001', title: 'Test Draft Form', segment: 'qhse', docType: 'form', classification: 'internal', revision: '1.0' }));
    await gotoApp('/form.html?doc=TQ-QHSE-F001');
    await expect(page.locator('.note.stop')).toContainText('Draft. Not approved for use.');
    await expect(page.locator('.empty h2')).toHaveText('No checklist entered yet');

    await setRole('employee', 'qhse');
    await gotoApp('/form.html?doc=TQ-QHSE-F001');
    await expect(page.locator('h2')).toHaveText('Not available to your role');
  });
});
