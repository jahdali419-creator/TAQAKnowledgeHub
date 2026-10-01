// The Maintenance Manager, the fifth persona, through the pages a person uses.
//
// maintenance.spec.js already pins the rule itself at the store: who may
// approve a maintenance document, the bulletin-by-type case and the shelves.
// These tests cover what that left unproven: the role's page access, the
// maintenance journey through the desks, the Maintenance Manager returning a
// document, delegation from a Maintenance Manager, and the words each step
// shows, which named the Director for documents the Director cannot sign.
// Each was found by the five-role audit of 1 October 2026; the ones marked
// "defect" failed on the code before the fix in the same commit.
//
// Browser-side rules only. In Azure the API enforces all of this; see
// roles.js's header.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

const SEG = 'coiled-tubing';

async function prime(page, gotoApp, clearAppState, setRole, role, area) {
  await gotoApp('/index.html');
  await clearAppState();
  await page.evaluate(() => {
    localStorage.setItem('taqa-tour-done', '1');
    localStorage.setItem('taqa-install-dismissed', String(Date.now()));
  });
  await setRole(role, area || SEG);
}

// A role's refusal page replaces the whole document, top bar included, and
// calls window.stop(), so "load" may never fire: wait for either answer.
async function opensOrRefuses(page, path) {
  await page.goto(path, { waitUntil: 'commit' });
  await page.waitForFunction(() => !!document.getElementById('navbar') || /You are signed in as/.test(document.body ? document.body.innerText : ''));
  await page.waitForTimeout(150);
  return page.evaluate(() => (!document.getElementById('navbar') && /You are signed in as/.test(document.body.innerText)) ? 'refused' : 'opens');
}

// Files through upload.html's own steps, ticking the maintenance box when asked.
async function fileThroughUpload(page, gotoApp, { title, type = 'sop', maint = false }) {
  await gotoApp('/upload.html');
  await page.setInputFiles('#file-input', {
    name: 'mm-audit.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n'),
  });
  await page.click('#go-2');
  await page.selectOption('#seg-select', SEG);
  await page.selectOption('#doc-type-select', type);
  if (maint) await page.check('#dept-maint');
  await page.click('#go-3');
  await page.fill('#doc-title-input', title);
  await page.fill('#summary-main', 'Maintenance Manager regression document, filed through the page.');
  await page.selectOption('#audience-select', { index: 1 });
  await page.click('#go-4');
  await page.click('#submit-btn');
  await expect(page.locator('#toast-title')).toHaveText('Submitted for review');
  const nums = await page.evaluate((t) => TAQA_STORE.all().filter((d) => d.title === t).map((d) => d.docNumber), title);
  expect(nums).toHaveLength(1);
  return nums[0];
}

// A draft filed and checked the way the desks do it, as the roles that may.
async function checkedDraft(page, setRole, docNumber, fields) {
  await setRole('employee', SEG);
  await page.evaluate(({ n, f }) => TAQA_STORE.add(Object.assign({
    docNumber: n, title: n, segment: 'coiled-tubing', docType: 'sop', classification: 'internal', revision: '1.0',
  }, f)), { n: docNumber, f: fields || {} });
  await setRole('qms', SEG);
  expect((await page.evaluate((n) => TAQA_STORE.countersign(n), docNumber)).ok).toBe(true);
}

const card = (page, title) => page.locator('.pending-card', { hasText: title });

test.describe('Maintenance Manager: what the role may open', () => {
  // The Master List refusal and the Upload link are in master-list.spec.js
  // and navigation.spec.js, which now loop over this role as well.
  test('its own desk and published list open; another area\'s, Analytics and About refuse', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'maintenance', SEG);
    const open = ['/dashboard.html?id=' + SEG, '/documents.html?id=' + SEG];
    const shut = ['/dashboard.html?id=drilling', '/documents.html?id=drilling', '/analytics.html', '/whats-new.html'];
    for (const p of open) expect(await opensOrRefuses(page, p), p).toBe('opens');
    await gotoApp('/dashboard.html?id=' + SEG);
    await expect(page.locator('#queue-title')).toHaveText('Awaiting Your Approval');
    for (const p of shut) {
      expect(await opensOrRefuses(page, p), p).toBe('refused');
      await expect(page.locator('body')).toContainText('signed in as Maintenance Manager');
    }
  });
});

test.describe('the maintenance journey through the desks', () => {
  test('Employee files a maintenance SOP; QMS sends it to the Maintenance Manager; the Director never sees it; the Maintenance Manager publishes it', async ({
    page, gotoApp, setRole, clearAppState, consoleErrors,
  }) => {
    const TITLE = 'MM-JOURNEY-' + Date.now();
    await prime(page, gotoApp, clearAppState, setRole, 'employee');
    const N = await fileThroughUpload(page, gotoApp, { title: TITLE, maint: true });
    // defect: the toast said the Director approves it next.
    await expect(page.locator('#toast-sub')).toContainText('then the Maintenance Manager approves it');
    await expect(page.locator('#toast-sub')).not.toContainText('Director');

    await setRole('qms', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    await expect(card(page, TITLE).locator('.pending-doc-preview')).toContainText('Maintenance Manager');
    await card(page, TITLE).locator('.btn-approve').click();
    await expect(card(page, TITLE).locator('.action-result')).toContainText('Now with the Maintenance Manager for final approval');

    await setRole('owner', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    await expect(page.locator('#queue-title')).toHaveText('Awaiting Your Approval');
    await expect(card(page, TITLE)).toHaveCount(0);

    await setRole('maintenance', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    await card(page, TITLE).locator('.btn-approve').click();
    await expect.poll(() => page.evaluate((n) => TAQA_STORE.findDoc(n).status, N)).toBe('current');
    expect(await page.evaluate((n) => TAQA_STORE.findDoc(n).approvedBy, N)).toBe('Maintenance Manager');

    await setRole('auditor', SEG);
    await gotoApp('/viewer.html?doc=' + N + '&seg=' + SEG);
    const trail = page.locator('#appr-trail');
    await expect(trail).toContainText('QMS / Document Controller');
    await expect(trail).toContainText('Maintenance Manager');
    await expect(trail).not.toContainText('Segment Director');
    assertNoConsoleErrors(consoleErrors);
  });

  test('before QMS has checked it, a maintenance document is not on the Maintenance Manager\'s desk and cannot be approved', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'employee');
    await page.evaluate(() => TAQA_STORE.add({ docNumber: 'TQ-TWS-CTSS-SOP-951', title: 'MM wrong stage', segment: 'coiled-tubing',
      docType: 'sop', classification: 'internal', revision: '1.0', department: 'maintenance' }));
    await setRole('maintenance', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    await expect(card(page, 'MM wrong stage')).toHaveCount(0);
    expect((await page.evaluate(() => TAQA_STORE.approve('TQ-TWS-CTSS-SOP-951'))).ok).toBe(false);
    expect(await page.evaluate(() => TAQA_STORE.findDoc('TQ-TWS-CTSS-SOP-951').approvalStage)).toBe('qms');
  });

  test('the Maintenance Manager returns a maintenance document with a reason, and the submitter sees who returned it and why', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'employee');
    await checkedDraft(page, setRole, 'TQ-TWS-CTSS-SOP-952', { title: 'MM return test', department: 'maintenance' });
    await setRole('maintenance', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    await card(page, 'MM return test').locator('.btn-reject').click();
    await page.fill('#reject-reason-input', 'too short');
    await expect(page.locator('#reject-modal-confirm')).toBeDisabled();
    await page.fill('#reject-reason-input', 'Torque values in section 5 do not match the OEM manual.');
    await page.click('#reject-modal-confirm');
    await expect.poll(() => page.evaluate(() => TAQA_STORE.findDoc('TQ-TWS-CTSS-SOP-952').rejected)).toBe(true);
    const r = await page.evaluate(() => TAQA_STORE.findDoc('TQ-TWS-CTSS-SOP-952'));
    expect([r.rejectedAtStage, r.rejectedBy, r.status]).toEqual(['director', 'Maintenance Manager', 'draft']);
    await page.reload();
    await expect(card(page, 'MM return test')).toHaveCount(0);

    await setRole('employee', SEG);
    await gotoApp('/upload.html');
    await expect(page.locator('#my-subs-list li', { hasText: 'MM return test' })).toContainText('Returned by Maintenance Manager');
    await expect(page.locator('#my-subs-list li', { hasText: 'MM return test' })).toContainText('Torque values');
  });

  test('the Maintenance Manager\'s home line counts the maintenance documents waiting in their segment, not the Director\'s', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'employee');
    await checkedDraft(page, setRole, 'TQ-TWS-CTSS-SOP-953', { title: 'MM count maint', department: 'maintenance' });
    await checkedDraft(page, setRole, 'TQ-TWS-CTSS-SOP-954', { title: 'MM count ops' });
    await setRole('maintenance', SEG);
    await gotoApp('/index.html');
    await expect(page.locator('#desk')).toContainText('1 document waiting on your sign-off in Coiled Tubing');
  });
});

test.describe('delegation from a Maintenance Manager', () => {
  test('the delegation names the Maintenance Manager as grantor, and the delegate signs maintenance documents only', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'employee');
    await checkedDraft(page, setRole, 'TQ-TWS-CTSS-SOP-955', { title: 'Deleg maint', department: 'maintenance' });
    await checkedDraft(page, setRole, 'TQ-TWS-CTSS-SOP-956', { title: 'Deleg ops' });
    await setRole('maintenance', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    await page.click('#deleg-open');
    await page.fill('#dg-to', 'Deputy Maintenance Engineer');
    await page.fill('#dg-reason', 'Annual leave');
    await page.click('#deleg-form button[type="submit"]');
    const d = await page.evaluate(() => TAQA_DELEGATION.list().find((x) => x.to === 'Deputy Maintenance Engineer'));
    expect(d.fromRole).toBe('maintenance');
    // defect: it recorded the area's Director by name as the grantor.
    expect(d.fromName).toBe('Maintenance Manager, Coiled Tubing');

    await Promise.all([page.waitForEvent('load'), page.locator('#deleg-list .deleg-row', { hasText: 'Deputy Maintenance Engineer' }).locator('.dr-use').click()]);
    await gotoApp('/dashboard.html?id=' + SEG);
    await expect(card(page, 'Deleg ops')).toHaveCount(0);
    await card(page, 'Deleg maint').locator('.btn-approve').click();
    await expect.poll(() => page.evaluate(() => TAQA_STORE.findDoc('TQ-TWS-CTSS-SOP-955').approvedBy))
      .toBe('Deputy Maintenance Engineer (delegate for Maintenance Manager, Coiled Tubing)');
    expect((await page.evaluate(() => TAQA_STORE.approve('TQ-TWS-CTSS-SOP-956'))).ok).toBe(false);
  });

  test('a Segment Director\'s delegate cannot approve a maintenance document', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'employee');
    await checkedDraft(page, setRole, 'TQ-TWS-CTSS-SOP-957', { title: 'Dir deleg maint', department: 'maintenance' });
    await checkedDraft(page, setRole, 'TQ-TWS-CTSS-SOP-958', { title: 'Dir deleg ops' });
    await setRole('owner', SEG);
    const can = await page.evaluate(() => {
      const g = TAQA_DELEGATION.grant({ fromRole: 'owner', fromName: 'CT Director', to: 'Ops Deputy', reason: 'Leave',
        segment: 'coiled-tubing', until: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10), includesApproval: true });
      TAQA_DELEGATION.actAs(g.delegation.id);
      return ['TQ-TWS-CTSS-SOP-957', 'TQ-TWS-CTSS-SOP-958'].map((n) => TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc(n)));
    });
    expect(can).toEqual([false, true]);
  });

  test('each desk lists only the delegations its own holder granted', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'maintenance', SEG);
    await page.evaluate(() => TAQA_DELEGATION.grant({ fromRole: 'maintenance', fromName: 'Maintenance Manager, Coiled Tubing',
      to: 'Maint Deputy', reason: 'Leave', segment: 'coiled-tubing', until: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10), includesApproval: true }));
    await gotoApp('/dashboard.html?id=' + SEG);
    await expect(page.locator('#deleg-list')).toContainText('Maint Deputy');
    // defect: the Director's desk listed it too, with a Revoke button.
    await setRole('owner', SEG);
    await gotoApp('/dashboard.html?id=' + SEG);
    await expect(page.locator('#deleg-box')).toBeVisible();
    await expect(page.locator('#deleg-list')).not.toContainText('Maint Deputy');
  });

  test('the delegate banner leaves the top bar usable', async ({ page, gotoApp, setRole, clearAppState, topbar }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'maintenance', SEG);
    await page.evaluate(() => {
      const g = TAQA_DELEGATION.grant({ fromRole: 'maintenance', fromName: 'Maintenance Manager, Coiled Tubing', to: 'Maint Deputy',
        reason: 'Leave', segment: 'coiled-tubing', until: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10), includesApproval: true });
      TAQA_DELEGATION.actAs(g.delegation.id);
    });
    await gotoApp('/index.html');
    await expect(page.locator('.deleg-bar')).toBeVisible();
    // defect: the sticky banner sat on top of the fixed bar and took its clicks.
    const target = (await topbar.isPhone()) ? '#nav-hamburger' : '#taqa-door .door-btn';
    const onTop = await page.evaluate((sel) => {
      const b = document.querySelector(sel).getBoundingClientRect();
      const el = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      return !!el && !!el.closest(sel);
    }, target);
    expect(onTop).toBe(true);
    await page.locator(target).click({ timeout: 3000 });
  });
});

// The owner's decision (1 Oct 2026): a Maintenance Bulletin is for the
// maintenance team of an operational segment. Filed for a function or a
// centre it had no approver at all, because their head may not sign
// maintenance documents and they have no Maintenance Manager.
test.describe('Maintenance Bulletins belong to operational segments', () => {
  test('Upload will not file a bulletin for a function, and says why; the register refuses it too', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/upload.html');
    await page.setInputFiles('#file-input', { name: 'b.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') });
    await page.click('#go-2');
    // A function chosen first: Maintenance Bulletin cannot be picked.
    await page.selectOption('#seg-select', 'qhse');
    await expect(page.locator('#doc-type-select option[value="bulletin"]')).toBeDisabled();
    // An operational segment: it can, and then only operational segments can.
    await page.selectOption('#seg-select', SEG);
    await page.selectOption('#doc-type-select', 'bulletin');
    await expect(page.locator('#seg-select optgroup[label="Corporate Functions"]')).toHaveJSProperty('disabled', true);
    await expect(page.locator('#seg-select optgroup[label="Operational Segments"]')).toHaveJSProperty('disabled', false);

    // A link that arrives with a function already chosen stops at step 2.
    // (Cleared first: the page's draft auto-save would restore the choices above.)
    await clearAppState();
    await gotoApp('/upload.html?type=bulletin&seg=qhse');
    await page.setInputFiles('#file-input', { name: 'b.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') });
    await page.click('#go-2');
    await page.click('#go-3');
    await expect(page.locator('#hint-2')).toContainText('operational segment');
    await expect(page.locator('#panel-3')).toBeHidden();

    const filed = await page.evaluate(() => [
      TAQA_STORE.add({ docNumber: 'TQ-QHSE-MB-901', title: 'Bulletin for QHSE', segment: 'qhse', docType: 'bulletin', classification: 'internal' }),
      !!TAQA_STORE.add({ docNumber: 'TQ-TWS-CTSS-MB-902', title: 'Bulletin for CT', segment: 'coiled-tubing', docType: 'bulletin', classification: 'internal', department: 'maintenance' }),
    ]);
    expect(filed).toEqual([null, true]);
  });
});

test.describe('wording follows the approver', () => {
  test('QMS confirming a Maintenance Bulletin filed without the department says it goes to the Maintenance Manager', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'qms');
    await page.evaluate(() => TAQA_STORE.add({ docNumber: 'TQ-TWS-CTSS-MB-959', title: 'Untagged bulletin', segment: 'coiled-tubing',
      docType: 'bulletin', classification: 'internal', revision: '1.0', department: null }));
    await gotoApp('/dashboard.html?id=' + SEG);
    await card(page, 'Untagged bulletin').locator('.btn-approve').click();
    // defect: the card said Maintenance Manager and the result said Director.
    await expect(card(page, 'Untagged bulletin').locator('.action-result')).toContainText('Now with the Maintenance Manager for final approval');
  });

  test('the Master List\'s bulk Confirm names the Maintenance Manager for a maintenance document', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'employee');
    await page.evaluate(() => TAQA_STORE.add({ docNumber: 'TQ-TWS-CTSS-SOP-960', title: 'Bulk maint', segment: 'coiled-tubing',
      docType: 'sop', classification: 'internal', revision: '1.0', department: 'maintenance' }));
    await setRole('qms', SEG);
    await gotoApp('/master-list.html');
    await page.fill('#q', 'TQ-TWS-CTSS-SOP-960');
    const msg = new Promise((res) => page.once('dialog', (d) => { res(d.message()); d.accept(); }));
    await page.locator('input.row-chk[data-doc="TQ-TWS-CTSS-SOP-960"]').check();
    await page.click('#bulk-approve');
    // defect: it said "sent to its Director for approval".
    expect(await msg).toContain('Maintenance Manager');
    await expect(page.locator('#toast')).toContainText('Maintenance Manager');
    expect(await page.evaluate(() => TAQA_STORE.findDoc('TQ-TWS-CTSS-SOP-960').approvalStage)).toBe('director');
  });

  test('the QMS home line says the documents wait on its check, not that they were already approved', async ({ page, gotoApp, setRole, clearAppState }) => {
    await prime(page, gotoApp, clearAppState, setRole, 'qms');
    await gotoApp('/index.html');
    // defect: "approved and waiting on your countersignature", from before QMS went first.
    await expect(page.locator('#desk')).toContainText('waiting on your QMS check');
    await expect(page.locator('#desk')).not.toContainText('approved and waiting');
  });
});
