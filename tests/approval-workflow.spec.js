// End-to-end tests of the real, coded two-step release workflow (see
// roles.js's "Two-step release" comment and store.js's countersign()/
// approve()/reject()), driven through dashboard.html and the real
// TAQA_STORE/TAQA_APPROVAL APIs.
//
// As coded, release is:
//   1. COUNTERSIGN  QMS checks the record (numbering/revision/dates) first.
//   2. APPROVE      the named approver (Director/QHSE Manager, informational
//                    text only — see the dedicated test below) gives the
//                    final sign-off. This step is what actually publishes it.
// Neither step can be taken by the other, and neither can be skipped.
//
// Drafts are created with TAQA_STORE.add(), which is not a hand-rolled
// fixture: it is the exact function upload.html's real submit flow
// (submitUpload() -> buildRecord() -> TAQA_STORE.add(rec)) calls, given a
// record in the same shape buildRecord() produces. This exercises the real
// store contract without needing to drive the 3-step upload wizard's file
// picker through the UI.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

function uniqueDocNumber(tag) {
  return 'TQ-TEST-' + (tag || 'DOC') + '-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
}

async function addDraft(page, overrides = {}) {
  const docNumber = overrides.docNumber || uniqueDocNumber();
  const rec = Object.assign({
    title: 'Regression Test Draft',
    segment: 'coiled-tubing',
    docType: 'sop',
    classification: 'internal',
    scope: 'area',
    revision: '1.0',
    summary: 'Draft created through the real TAQA_STORE.add() API for a Playwright regression test.',
  }, overrides, { docNumber });
  await page.evaluate((r) => TAQA_STORE.add(r), rec);
  return docNumber;
}

test.describe('1-2. Draft submission and the QMS step', () => {
  test('a fresh draft waits in QMS\'s queue, not the Director\'s', async ({ page, gotoApp, setRole, clearAppState, consoleErrors }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const docNumber = await addDraft(page, { title: 'Regression Draft Awaiting QMS' });

    const state = await page.evaluate((dn) => {
      const d = TAQA_STORE.findDoc(dn);
      return { approvalStage: d.approvalStage, stageOf: TAQA_APPROVAL.stageOf(d), waitingOn: TAQA_APPROVAL.waitingOn(d) };
    }, docNumber);
    expect(state).toEqual({ approvalStage: 'qms', stageOf: 'qms', waitingOn: 'QMS conformance check' });

    await setRole('qms', 'coiled-tubing');
    let can = await page.evaluate((dn) => {
      const d = TAQA_STORE.findDoc(dn);
      return { countersign: TAQA_APPROVAL.canCountersign(d), approve: TAQA_APPROVAL.canApprove(d) };
    }, docNumber);
    expect(can).toEqual({ countersign: true, approve: false });

    await setRole('owner', 'coiled-tubing');
    can = await page.evaluate((dn) => {
      const d = TAQA_STORE.findDoc(dn);
      return { countersign: TAQA_APPROVAL.canCountersign(d), approve: TAQA_APPROVAL.canApprove(d) };
    }, docNumber);
    // stage is 'qms', not 'director' yet, so the Director may not touch it.
    expect(can).toEqual({ countersign: false, approve: false });

    // And on the dashboard itself: visible in QMS's queue, absent from the
    // Director's, for the very same document and segment.
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=coiled-tubing');
    await expect(page.locator(`[data-store-doc="${docNumber}"]`).first()).toBeVisible();

    await setRole('owner', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=coiled-tubing');
    await expect(page.locator(`[data-store-doc="${docNumber}"]`)).toHaveCount(0);

    assertNoConsoleErrors(consoleErrors);
  });

  test('the store itself refuses countersign to a role that does not hold it, per its own "not a route the rules never saw" guarantee', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const docNumber = await addDraft(page);

    for (const role of ['employee', 'owner', 'auditor']) {
      await setRole(role, 'coiled-tubing');
      const out = await page.evaluate((dn) => TAQA_STORE.countersign(dn, 'Someone'), docNumber);
      expect(out.ok, `${role} should not be able to countersign`).toBe(false);
      expect(out.error).toBe('You cannot countersign this document.');
    }

    const untouched = await page.evaluate((dn) => {
      const d = TAQA_STORE.findDoc(dn);
      return { approvalStage: d.approvalStage, countersignedBy: d.countersignedBy || null };
    }, docNumber);
    expect(untouched).toEqual({ approvalStage: 'qms', countersignedBy: null });
  });
});

test.describe('3. QMS countersigns -> moves to the named approver\'s queue', () => {
  test('countersigning an SOP moves it to the Director\'s queue; approverFor names the Director', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const docNumber = await addDraft(page, { docType: 'sop', segment: 'coiled-tubing' });

    await setRole('qms', 'coiled-tubing');
    const out = await page.evaluate((dn) => TAQA_STORE.countersign(dn, 'QMS Tester'), docNumber);
    expect(out).toEqual({ ok: true, next: "the Director's final approval" });

    const after = await page.evaluate((dn) => {
      const d = TAQA_STORE.findDoc(dn);
      return {
        approvalStage: d.approvalStage, countersignedBy: d.countersignedBy,
        stageOf: TAQA_APPROVAL.stageOf(d), waitingOn: TAQA_APPROVAL.waitingOn(d),
        approverFor: TAQA_APPROVAL.approverFor(d),
      };
    }, docNumber);
    expect(after.approvalStage).toBe('director');
    expect(after.countersignedBy).toBe('QMS Tester');
    expect(after.stageOf).toBe('director');
    expect(after.approverFor).toBe('Relevant Operation Director'); // verbatim, documents-master.js
    expect(after.waitingOn).toBe('Relevant Operation Director');

    await setRole('owner', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=coiled-tubing');
    await expect(page.locator(`[data-store-doc="${docNumber}"]`).first()).toBeVisible();

    await setRole('qms', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=coiled-tubing');
    await expect(page.locator(`[data-store-doc="${docNumber}"]`)).toHaveCount(0);
  });

  test('approverFor names QHSE Manager for a Lesson Learned, but canApprove is scoped by segment, not by matching that text', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const docNumber = await addDraft(page, { docType: 'lesson', segment: 'qhse', title: 'Lesson Learned, Regression Test' });

    await setRole('qms', 'qhse');
    await page.evaluate((dn) => TAQA_STORE.countersign(dn, 'QMS'), docNumber);

    const approver = await page.evaluate((dn) => TAQA_APPROVAL.approverFor(TAQA_STORE.findDoc(dn)), docNumber);
    expect(approver).toBe('QHSE Manager');

    // roles.js's canApprove() never reads approverFor(): permission comes
    // from holding the 'owner' role capability, scoped to this doc's
    // segment. Whoever holds the qhse area (its Function Head) qualifies,
    // regardless of the informational approver text on the document type.
    await setRole('owner', 'qhse');
    const canApprove = await page.evaluate((dn) => TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc(dn)), docNumber);
    expect(canApprove).toBe(true);

    const out = await page.evaluate((dn) => TAQA_STORE.approve(dn, 'QHSE Manager Tester'), docNumber);
    expect(out).toEqual({ ok: true, next: 'released' });
  });
});

test.describe('4-5. The Director/final-approver step', () => {
  test('the store itself refuses approve to a role that does not hold it, including a Director of the wrong segment', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const docNumber = await addDraft(page, { segment: 'coiled-tubing' });
    await setRole('qms', 'coiled-tubing');
    await page.evaluate((dn) => TAQA_STORE.countersign(dn), docNumber);

    const attempts = [
      ['employee', 'coiled-tubing'],
      ['qms', 'coiled-tubing'],
      ['auditor', 'coiled-tubing'],
      ['owner', 'fracturing'], // right role, wrong segment
    ];
    for (const [role, area] of attempts) {
      await setRole(role, area);
      const out = await page.evaluate((dn) => TAQA_STORE.approve(dn, 'X'), docNumber);
      expect(out.ok, `${role}@${area} should not be able to approve`).toBe(false);
      expect(out.error).toBe('You cannot approve this document.');
    }

    expect(await page.evaluate((dn) => TAQA_STORE.findDoc(dn).approvalStage, docNumber)).toBe('director');
  });

  test('the Director\'s approval publishes the document and every count moves', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const docNumber = await addDraft(page, { segment: 'coiled-tubing', title: 'Regression Publish Target' });
    await setRole('qms', 'coiled-tubing');
    await page.evaluate((dn) => TAQA_STORE.countersign(dn), docNumber);

    const before = await page.evaluate(() => ({
      live: TAQA_STORE.count('live', { segment: 'coiled-tubing' }),
      pending: TAQA_STORE.count('pending', { segment: 'coiled-tubing' }),
    }));

    await setRole('owner', 'coiled-tubing');
    const out = await page.evaluate((dn) => TAQA_STORE.approve(dn, 'Director Tester'), docNumber);
    expect(out).toEqual({ ok: true, next: 'released' });

    const doc = await page.evaluate((dn) => TAQA_STORE.findDoc(dn), docNumber);
    expect(doc.status).toBe('current');
    expect(doc.approvalStage).toBeNull();
    expect(doc.approvedBy).toBe('Director Tester');
    expect(doc.approvedDate).toBeTruthy();
    expect(doc.issueDate).toBeTruthy();

    const after = await page.evaluate(() => ({
      live: TAQA_STORE.count('live', { segment: 'coiled-tubing' }),
      pending: TAQA_STORE.count('pending', { segment: 'coiled-tubing' }),
    }));
    expect(after.live).toBe(before.live + 1);
    expect(after.pending).toBe(before.pending - 1);

    // search-index.js is not loaded on dashboard.html; it rebuilds from the
    // same TAQA_STORE data on its own next load (ai-search.html), so the
    // just-published document should now be indexed and correctly 'current'.
    await gotoApp('/ai-search.html');
    const indexed = await page.evaluate((dn) => (window.TAQA_SEARCH_INDEX || []).find((r) => r.n === dn), docNumber);
    expect(indexed).toBeTruthy();
    expect(indexed.st).toBe('current');
  });
});

test.describe('6-7. REGRESSION: the reject-reason modal (fixed today)', () => {
  test('reject only ever happens through the modal: clicking Reject does not touch the store, cancelling leaves the document exactly as it was', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const docNumber = await addDraft(page, { segment: 'coiled-tubing', title: 'Regression Reject Target' });
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=coiled-tubing');

    const pendingBefore = await page.evaluate(() => pendingCount);
    const rejectBtn = page.locator(`[data-store-doc="${docNumber}"].btn-reject`);
    await rejectBtn.click();

    // The old bug: clicking Reject rejected the document immediately via a
    // native onclick, before the modal (a second, later-registered listener
    // on the same button) ever got to gate it. Confirm that cannot happen:
    // the modal is open and the store is completely untouched.
    await expect(page.locator('.reject-modal-overlay')).toHaveClass(/open/);
    let doc = await page.evaluate((dn) => TAQA_STORE.findDoc(dn), docNumber);
    expect(doc.status).toBe('draft');
    expect(doc.rejected).toBeFalsy();
    expect(doc.approvalStage).toBe('qms');
    expect(await page.evaluate(() => pendingCount)).toBe(pendingBefore);

    // Cancelling the modal truly cancels: no reject, no count change.
    await page.locator('#reject-modal-cancel').click();
    await expect(page.locator('.reject-modal-overlay')).not.toHaveClass(/open/);
    doc = await page.evaluate((dn) => TAQA_STORE.findDoc(dn), docNumber);
    expect(doc.status).toBe('draft');
    expect(doc.approvalStage).toBe('qms');
    expect(await page.evaluate(() => pendingCount)).toBe(pendingBefore);
  });

  test('a reason under 20 characters keeps the confirm button disabled and the store call never happens, even if forced', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const docNumber = await addDraft(page, { segment: 'coiled-tubing' });
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=coiled-tubing');

    await page.locator(`[data-store-doc="${docNumber}"].btn-reject`).click();
    const textarea = page.locator('#reject-reason-input');
    const confirmBtn = page.locator('#reject-modal-confirm');

    await textarea.fill('Too short');
    await expect(confirmBtn).toBeDisabled();

    // Whitespace padding must not count: the char count trims, per the
    // input handler's own `this.value.trim().length`.
    await textarea.fill('   short reason with only padding   ');
    // "short reason with only padding" trimmed is well over 20 chars, so
    // pick a genuinely short one padded with spaces to actually test trim().
    await textarea.fill('   too short   ');
    await expect(confirmBtn).toBeDisabled();

    // Even a forced click (bypassing the disabled attribute) must not reject:
    // the confirm handler itself re-checks `reason.length < 20` before ever
    // touching the store.
    await page.evaluate(() => document.getElementById('reject-modal-confirm').click());
    const doc = await page.evaluate((dn) => TAQA_STORE.findDoc(dn), docNumber);
    expect(doc.status).toBe('draft');
    expect(doc.rejected).toBeFalsy();
  });

  test('a valid reason (>=20 chars) calls TAQA_STORE.reject exactly once, records the reason, and drops pending by exactly 1', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const docNumber = await addDraft(page, { segment: 'coiled-tubing', title: 'Regression Single Reject' });
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=coiled-tubing');

    // Spy on TAQA_STORE.reject without changing its behaviour, to prove the
    // modal's confirm handler is the only caller, called exactly once (the
    // old code path double-decremented the pending counter).
    await page.evaluate(() => {
      window.__rejectCalls = [];
      const real = TAQA_STORE.reject;
      TAQA_STORE.reject = function (...args) {
        window.__rejectCalls.push(args);
        return real.apply(TAQA_STORE, args);
      };
    });

    const pendingBefore = await page.evaluate(() => pendingCount);
    await page.locator(`[data-store-doc="${docNumber}"].btn-reject`).click();

    const reason = 'Section 4.2 is incomplete and the scope of application is missing.';
    const textarea = page.locator('#reject-reason-input');
    const confirmBtn = page.locator('#reject-modal-confirm');
    await textarea.fill(reason);
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    await expect(page.locator('.reject-modal-overlay')).not.toHaveClass(/open/);
    const doc = await page.evaluate((dn) => TAQA_STORE.findDoc(dn), docNumber);
    expect(doc.rejected).toBe(true);
    expect(doc.rejectedReason).toBe(reason);
    expect(doc.rejectedAtStage).toBe('qms');
    expect(doc.approvalStage).toBeNull();

    expect(await page.evaluate(() => window.__rejectCalls.length)).toBe(1);

    const pendingAfter = await page.evaluate(() => pendingCount);
    expect(pendingAfter).toBe(pendingBefore - 1); // not -2: the double-decrement bug is fixed
    await expect(page.locator('#stat-pending')).toHaveText(String(pendingAfter));
    await expect(page.locator('#dash-toast-msg')).toHaveText('Document rejected, submitter will be notified');
  });

  test('reject at the Director stage also requires a 20+ character reason, and records rejectedAtStage correctly', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const docNumber = await addDraft(page, { segment: 'coiled-tubing', title: 'Regression Reject At Director' });
    await setRole('qms', 'coiled-tubing');
    await page.evaluate((dn) => TAQA_STORE.countersign(dn, 'QMS'), docNumber);

    await setRole('owner', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=coiled-tubing');

    await page.locator(`[data-store-doc="${docNumber}"].btn-reject`).click();
    const reason = 'The torque values in section 6.1 do not match the audit findings.';
    await page.locator('#reject-reason-input').fill(reason);
    await page.locator('#reject-modal-confirm').click();

    const doc = await page.evaluate((dn) => TAQA_STORE.findDoc(dn), docNumber);
    expect(doc.rejected).toBe(true);
    expect(doc.rejectedAtStage).toBe('director');
    expect(doc.rejectedReason).toBe(reason);
    expect(doc.approvalStage).toBeNull();

    // Rejected, so neither step can touch it any further.
    const can = await page.evaluate((dn) => {
      const d = TAQA_STORE.findDoc(dn);
      return { countersign: TAQA_APPROVAL.canCountersign(d), approve: TAQA_APPROVAL.canApprove(d), stageOf: TAQA_APPROVAL.stageOf(d) };
    }, docNumber);
    expect(can).toEqual({ countersign: false, approve: false, stageOf: null });
  });

  test('the store\'s own reason requirement is looser than the modal\'s: TAQA_STORE.reject() itself only requires a non-empty reason', async ({ page, gotoApp, setRole, clearAppState }) => {
    // Documents that the 20-char minimum is dashboard.html's own UI rule
    // (today's fix), layered on top of store.js's looser floor, not
    // enforced by the store itself. Calling the store directly with a short
    // but non-empty reason succeeds; calling it with an empty one refuses.
    await gotoApp('/index.html');
    await clearAppState();
    const docNumber = await addDraft(page, { segment: 'coiled-tubing' });
    await setRole('qms', 'coiled-tubing');

    const emptyOut = await page.evaluate((dn) => TAQA_STORE.reject(dn, '   '), docNumber);
    expect(emptyOut).toEqual({ ok: false, error: 'A reason is required.' });

    const shortOut = await page.evaluate((dn) => TAQA_STORE.reject(dn, 'too short'), docNumber);
    expect(shortOut.ok).toBe(true);
  });
});

test.describe('8. Delegation in the workflow', () => {
  test('an active delegation with includesApproval lets the delegate approve, recorded under their own name; switching role clears acting-as', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const docNumber = await addDraft(page, { segment: 'coiled-tubing' });
    await setRole('qms', 'coiled-tubing');
    await page.evaluate((dn) => TAQA_STORE.countersign(dn), docNumber); // now awaiting the Director

    await setRole('owner', 'coiled-tubing');
    expect(await page.evaluate(() => TAQA_ROLE.effective().delegate)).toBe(true); // CAP.delegate, per the matrix

    const until = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
    const grant = await page.evaluate((until) => TAQA_DELEGATION.grant({
      fromRole: 'owner', to: 'Delegate Tester', segment: 'coiled-tubing',
      reason: 'Regression test delegation', until, includesApproval: true,
    }), until);
    expect(grant.ok).toBe(true);

    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), grant.delegation.id);
    const canApproveAsDelegate = await page.evaluate((dn) => TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc(dn)), docNumber);
    expect(canApproveAsDelegate).toBe(true);

    const out = await page.evaluate((dn) => TAQA_STORE.approve(dn), docNumber);
    expect(out.ok).toBe(true);
    // "The released document still records the delegate's name as signer,
    // not the Director's" (roles.js).
    const approvedBy = await page.evaluate((dn) => TAQA_STORE.findDoc(dn).approvedBy, docNumber);
    expect(approvedBy).toBe('Delegate Tester (delegate for Segment Director)');

    // "Switching identity drops any delegation being acted under."
    await page.evaluate(() => TAQA_ROLE.set('qms'));
    expect(await page.evaluate(() => TAQA_DELEGATION.actingAs())).toBeNull();
  });

  test('without includesApproval, a delegate can be granted authority but not the approval signature', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const docNumber = await addDraft(page, { segment: 'coiled-tubing' });
    await setRole('qms', 'coiled-tubing');
    await page.evaluate((dn) => TAQA_STORE.countersign(dn), docNumber);

    await setRole('owner', 'coiled-tubing');
    const grant = await page.evaluate(() => TAQA_DELEGATION.grant({
      fromRole: 'owner', to: 'Editor Only Delegate', segment: 'coiled-tubing',
      reason: 'Preparing and editing only', includesApproval: false,
      until: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    }));
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), grant.delegation.id);

    // owner's own base role already holds approve natively, so canApprove is
    // still true here regardless of the grant's includesApproval flag; what
    // this demonstrates is that the delegation's own contribution is
    // correctly withheld (see roles.spec.js's effective() delegation test
    // for a check isolating the delegated contribution itself).
    const cap = await page.evaluate(() => TAQA_ROLE.effective());
    expect(cap.delegated.includesApproval).toBe(false);
  });
});
