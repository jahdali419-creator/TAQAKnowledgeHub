// dashboard.html-specific coverage, beyond the end-to-end workflow already
// exercised in approval-workflow.spec.js: contributors, the similar/duplicate
// document panel, the "not your area" state, button gating per role/stage,
// and dashboard.html's own toast (showDashToast, distinct from shared.js's
// global showToast).
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

function uniqueDocNumber(tag) {
  return 'TQ-TEST-' + (tag || 'DOC') + '-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
}

async function addDraft(page, overrides = {}) {
  const docNumber = overrides.docNumber || uniqueDocNumber();
  const rec = Object.assign({
    title: 'Dashboard Test Draft',
    segment: 'coiled-tubing',
    docType: 'sop',
    classification: 'internal',
    scope: 'area',
    revision: '1.0',
    summary: 'Draft created through the real TAQA_STORE.add() API for a dashboard.html regression test.',
  }, overrides, { docNumber });
  await page.evaluate((r) => TAQA_STORE.add(r), rec);
  return docNumber;
}

// 'cementing' ships with zero draft documents in documents-master.js (unlike
// coiled-tubing, which ships one), so it is used wherever a test needs a
// genuinely empty queue to start from.
const CLEAN_SEGMENT = 'cementing';

test.describe('Contributors', () => {
  test('Add Contributor appends a row with the chosen name, title and role, and toasts', async ({ page, gotoApp, setRole, clearAppState, consoleErrors }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await setRole('qms', CLEAN_SEGMENT);
    await gotoApp('/dashboard.html?id=' + CLEAN_SEGMENT);

    const before = await page.locator('#contributors-list .contributor-row').count();
    await page.getByRole('button', { name: '+ Add Contributor' }).click();
    await expect(page.locator('#add-contributor-modal')).toHaveClass(/open/);

    await page.fill('#contrib-name', 'Regression Test Person');
    await page.fill('#contrib-title', 'QA Engineer');
    await page.selectOption('#contrib-role', 'Viewer');
    await page.getByRole('button', { name: 'Add to Segment' }).click();

    await expect(page.locator('#add-contributor-modal')).not.toHaveClass(/open/);
    await expect(page.locator('#contributors-list .contributor-row')).toHaveCount(before + 1);
    await expect(page.locator('#contributors-list')).toContainText('Regression Test Person');
    await expect(page.locator('#contributors-list')).toContainText('QA Engineer');
    await expect(page.locator('#dash-toast-msg')).toHaveText('Regression Test Person added as Viewer');

    assertNoConsoleErrors(consoleErrors);
  });

  test('an empty name is refused: focus moves to the field and no row is added', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await setRole('qms', CLEAN_SEGMENT);
    await gotoApp('/dashboard.html?id=' + CLEAN_SEGMENT);

    const before = await page.locator('#contributors-list .contributor-row').count();
    await page.getByRole('button', { name: '+ Add Contributor' }).click();
    await page.getByRole('button', { name: 'Add to Segment' }).click();

    await expect(page.locator('#contrib-name')).toBeFocused();
    await expect(page.locator('#contributors-list .contributor-row')).toHaveCount(before);
  });

  test('there is no remove/delete control for a contributor: this is an add-only UI today', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await setRole('qms', CLEAN_SEGMENT);
    await gotoApp('/dashboard.html?id=' + CLEAN_SEGMENT);
    await page.getByRole('button', { name: '+ Add Contributor' }).click();
    await page.fill('#contrib-name', 'Temp Person');
    await page.getByRole('button', { name: 'Add to Segment' }).click();

    const removeControls = await page.locator(
      '#contributors-list button, #contributors-list [class*="remove" i], #contributors-list [class*="delete" i]'
    ).count();
    expect(removeControls).toBe(0);
  });

  test('a contributor added through the UI is page-local only: it does not survive a reload, and no copy on the page overclaims persistence', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await setRole('qms', CLEAN_SEGMENT);
    await gotoApp('/dashboard.html?id=' + CLEAN_SEGMENT);

    await page.getByRole('button', { name: '+ Add Contributor' }).click();
    await page.fill('#contrib-name', 'Ephemeral Person');
    await page.getByRole('button', { name: 'Add to Segment' }).click();
    await expect(page.locator('#contributors-list')).toContainText('Ephemeral Person');

    // addContributor() only mutates the DOM; it is not even localStorage-
    // backed, so a fresh load of the same desk has no trace of it. Real
    // behaviour, not assumed: confirmed by reading dashboard.html's
    // addContributor() (~line 1460), which never calls TAQA_STORE or
    // localStorage.
    await gotoApp('/dashboard.html?id=' + CLEAN_SEGMENT);
    await expect(page.locator('#contributors-list')).not.toContainText('Ephemeral Person');

    // Guard against future copy claiming this is saved beyond this page
    // load: it is not organisation-wide, and today it is not even
    // device-persisted.
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/organi[sz]ation.?wide|saved to (the|your) (server|account)|synced across|every device/i);
  });
});

test.describe('Similar/duplicate document detection panel', () => {
  test('a near-duplicate title surfaces the real published document, read from TAQA_STORE (fixed today)', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    // "Pressure Testing Procedure" (TQ-TWS-CTSS-SOP-005) is a real, currently
    // published document in Coiled Tubing (documents-master.js). A draft
    // with a near-duplicate title should be flagged against that real
    // record, not a fabricated legacy title from segments-data.js.
    const docNumber = await addDraft(page, {
      title: 'Pressure Testing Procedure, Revision 2 (Draft)',
      segment: 'coiled-tubing',
      summary: 'Updated pressure testing steps for CT units.',
    });

    await setRole('qms', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=coiled-tubing');

    const card = page.locator(`[data-store-doc="${docNumber}"]`).first()
      .locator('xpath=ancestor::div[contains(@class,"pending-card")]');
    await expect(card.locator('.dup-sim-panel')).toBeVisible();
    await expect(card.locator('.dup-sim-hd')).toContainText('Similar documents already in this segment');
    await expect(card.locator('.dup-sim-title').first()).toContainText('Pressure Testing Procedure');
    await expect(card.locator('.dup-sim-pct').first()).toBeVisible();

    // And directly at the source: buildSimilarDocs() itself returns the real
    // title, confirming it is reading TAQA_STORE's live rows.
    const similar = await page.evaluate(
      (t) => buildSimilarDocs(t, 'coiled-tubing', 3),
      'Pressure Testing Procedure, Revision 2 (Draft)'
    );
    expect(similar.some((s) => s.title === 'Pressure Testing Procedure')).toBe(true);
  });

  test('a title with no real overlap in the segment surfaces no similar-documents panel', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const docNumber = await addDraft(page, {
      title: 'Zzyxqv Quantum Flux Calibration Ledger',
      segment: 'coiled-tubing',
    });
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=coiled-tubing');

    const card = page.locator(`[data-store-doc="${docNumber}"]`).first()
      .locator('xpath=ancestor::div[contains(@class,"pending-card")]');
    await expect(card.locator('.dup-sim-panel')).toHaveCount(0);
  });
});

test.describe('"Not your area"', () => {
  test('a Director opening a segment they do not hold is refused at the gate, not shown a queue for it', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await setRole('owner', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=fracturing');
    await expect(page.locator('h1')).toContainText('Managing an area is its director’s desk');
  });

  test('the "Not your area" empty-pending copy itself is correct, exercised directly since normal navigation cannot currently reach it', async ({ page, gotoApp, setRole, clearAppState }) => {
    // FINDING (reported, not changed — see the final report): the gate at
    // the top of dashboard.html (~717-720) refuses with TAQA_ROLE.refuse()
    // using the exact same predicate initDashboard()'s later `MINE` check
    // (~1038) uses (cap.scope==='all' || id===cap.ownSegment) against the
    // same resolved id. So whenever canManage(id) would be false, the page
    // has already been replaced before initDashboard() can render the
    // "Not your area" empty-pending branch: through ordinary `?id=` link
    // navigation that branch appears to be unreachable dead code. This test
    // forces the one condition the gate itself cannot produce — effective()
    // resolving to a different segment than the id the page rendered with —
    // to confirm the branch's own markup is correct on its own terms.
    await gotoApp('/index.html');
    await clearAppState();
    await setRole('owner', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=coiled-tubing'); // this passes the gate: it IS their area

    await page.evaluate(() => {
      const real = TAQA_ROLE.effective;
      TAQA_ROLE.effective = function (...args) {
        const cap = real.apply(TAQA_ROLE, args);
        return Object.assign({}, cap, { scope: 'own', ownSegment: 'fracturing' });
      };
      initDashboard();
    });

    await expect(page.locator('.empty-pending h3')).toHaveText('Not your area');
    await expect(page.locator('.empty-pending')).toContainText('You can read this desk, not sign at it.');
    await expect(page.locator('.empty-pending a', { hasText: 'Back to your desk' })).toBeVisible();
  });

  test('an employee cannot open the dashboard at all (editMetadata:false refuses at the gate, same as master-list.html)', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await setRole('employee', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=coiled-tubing');
    await expect(page.locator('h1')).toContainText('Managing an area is its director’s desk');
  });
});

test.describe('Approve/Reject buttons per role and stage', () => {
  test('QMS sees "Confirm" on the countersign step; the Director sees "Approve" on the final step; each queue excludes the other\'s document', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const docAwaitingQms = await addDraft(page, { title: 'Button label test, awaiting QMS', segment: CLEAN_SEGMENT });
    const docAwaitingDirector = await addDraft(page, { title: 'Button label test, awaiting Director', segment: CLEAN_SEGMENT });

    await setRole('qms', CLEAN_SEGMENT);
    await page.evaluate((dn) => TAQA_STORE.countersign(dn), docAwaitingDirector);

    await gotoApp('/dashboard.html?id=' + CLEAN_SEGMENT);
    await expect(page.locator(`[data-store-doc="${docAwaitingQms}"].btn-approve`)).toHaveText(/Confirm/);
    await expect(page.locator(`[data-store-doc="${docAwaitingQms}"].btn-reject`)).toBeEnabled();
    await expect(page.locator(`[data-store-doc="${docAwaitingDirector}"]`)).toHaveCount(0);

    await setRole('owner', CLEAN_SEGMENT);
    await gotoApp('/dashboard.html?id=' + CLEAN_SEGMENT);
    await expect(page.locator(`[data-store-doc="${docAwaitingDirector}"].btn-approve`)).toHaveText(/Approve/);
    await expect(page.locator(`[data-store-doc="${docAwaitingQms}"]`)).toHaveCount(0);
  });

  test('approving disables both the Approve and Reject buttons on that card', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const docNumber = await addDraft(page, { segment: CLEAN_SEGMENT });
    await setRole('qms', CLEAN_SEGMENT);
    await gotoApp('/dashboard.html?id=' + CLEAN_SEGMENT);

    const approveBtn = page.locator(`[data-store-doc="${docNumber}"].btn-approve`);
    const rejectBtn = page.locator(`[data-store-doc="${docNumber}"].btn-reject`);
    await approveBtn.click();
    await expect(approveBtn).toBeDisabled();
    await expect(rejectBtn).toBeDisabled();
    await expect(approveBtn).toHaveCSS('opacity', '0.4');
  });

  test('an empty queue for a role that does hold a step reads "All caught up!"', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await setRole('qms', CLEAN_SEGMENT); // cementing ships zero drafts, and none were added here
    await gotoApp('/dashboard.html?id=' + CLEAN_SEGMENT);
    await expect(page.locator('.empty-pending h3')).toHaveText('All caught up!');

    await setRole('owner', CLEAN_SEGMENT);
    await gotoApp('/dashboard.html?id=' + CLEAN_SEGMENT);
    await expect(page.locator('.empty-pending h3')).toHaveText('All caught up!');
  });
});

test.describe('Toast notifications (showDashToast)', () => {
  test('approve toasts show the right message at each stage', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const dnQms = await addDraft(page, { title: 'Toast QMS test', segment: CLEAN_SEGMENT });
    const dnDirector = await addDraft(page, { title: 'Toast Director test', segment: CLEAN_SEGMENT });

    await setRole('qms', CLEAN_SEGMENT);
    await page.evaluate((dn) => TAQA_STORE.countersign(dn), dnDirector); // pre-checked

    await gotoApp('/dashboard.html?id=' + CLEAN_SEGMENT);
    await page.locator(`[data-store-doc="${dnQms}"].btn-approve`).click();
    await expect(page.locator('#dash-toast-msg')).toHaveText("Checked, sent on for the Director's final approval");
    await expect(page.locator('#dash-toast')).toHaveClass(/show/);

    await setRole('owner', CLEAN_SEGMENT);
    await gotoApp('/dashboard.html?id=' + CLEAN_SEGMENT);
    await page.locator(`[data-store-doc="${dnDirector}"].btn-approve`).click();
    await expect(page.locator('#dash-toast-msg')).toHaveText('Document approved and published to segment');
  });

  test('a refused action (attempted by a role forced past the UI gate) toasts the store\'s own refusal, not a generic message', async ({ page, gotoApp, setRole, clearAppState }) => {
    // The rendered queue never draws a button the store would refuse (see
    // approval-workflow.spec.js for that guard tested directly). This checks
    // the reject-modal's own defensive branch: if TAQA_STORE.reject() ever
    // did refuse, the toast should surface its error rather than pretend to
    // succeed.
    await gotoApp('/index.html');
    await clearAppState();
    const docNumber = await addDraft(page, { segment: CLEAN_SEGMENT });
    await setRole('qms', CLEAN_SEGMENT);
    await gotoApp('/dashboard.html?id=' + CLEAN_SEGMENT);

    await page.evaluate(() => {
      TAQA_STORE.reject = () => ({ ok: false, error: 'Simulated refusal for this test.' });
    });
    await page.locator(`[data-store-doc="${docNumber}"].btn-reject`).click();
    await page.locator('#reject-reason-input').fill('This reason is long enough to enable the button.');
    await page.locator('#reject-modal-confirm').click();
    await expect(page.locator('#dash-toast-msg')).toHaveText('✕ Simulated refusal for this test.');
  });

  test('the delegation panel is hidden for a role that cannot delegate (CAP.delegate === false)', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await setRole('qms', CLEAN_SEGMENT);
    await gotoApp('/dashboard.html?id=' + CLEAN_SEGMENT);
    await expect(page.locator('#deleg-box')).toBeHidden();
  });

  test('granting a delegation shows a confirmation toast naming the delegate and expiry', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await setRole('owner', CLEAN_SEGMENT);
    await gotoApp('/dashboard.html?id=' + CLEAN_SEGMENT);

    await expect(page.locator('#deleg-box')).toBeVisible();
    await page.locator('#deleg-open').click();
    await page.fill('#dg-to', 'Toast Delegate');
    await page.fill('#dg-reason', 'Regression test delegation');
    const until = await page.locator('#dg-until').inputValue(); // pre-filled 14 days out

    await page.locator('#deleg-form button.deleg-grant').click();
    await expect(page.locator('#dash-toast-msg')).toHaveText(`Delegated to Toast Delegate until ${until}`);
  });

  test('REGRESSION: no disconnected "Delegate Approvals" duplicate button remains; the only delegation control is the gated #deleg-box', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await setRole('owner', CLEAN_SEGMENT);
    await gotoApp('/dashboard.html?id=' + CLEAN_SEGMENT);

    const fakeButtons = await page.getByText('Delegate Approvals', { exact: false }).count();
    expect(fakeButtons).toBe(0);
    await expect(page.locator('#deleg-open')).toHaveText('Delegate');
  });
});
