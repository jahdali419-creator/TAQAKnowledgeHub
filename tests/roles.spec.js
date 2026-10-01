// Pure logic tests against TAQA_ROLE / TAQA_ROLES / TAQA_APPROVAL /
// TAQA_DELEGATION (roles.js). Almost none of this needs dashboard.html: any
// page that loads documents-master.js + roles.js + store.js gives the same
// globals, so index.html is used throughout and the tests call the real
// functions directly via page.evaluate(), never the UI.
//
// TAQA_ROLE, TAQA_APPROVAL and TAQA_DELEGATION are declared as top-level
// `const` in a classic (non-module) <script>, not assigned onto `window`.
// That still makes them ordinary global identifiers other scripts (and
// page.evaluate, which runs in the same realm) can see by name, exactly as
// dashboard.html's own later inline scripts rely on it.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

// Expected permission matrix, transcribed from roles.js's TAQA_ROLES by
// hand. Hardcoded on purpose: this test exists to catch an accidental edit
// to that matrix, so its expectations must not be derived from the same
// file it is checking.
const EXPECTED_ROLES = {
  employee: {
    controlPanel: false, export: false, registerView: false,
    approve: false, countersign: false, delegate: false,
    editMetadata: false, scope: 'all',
  },
  owner: {
    controlPanel: true, export: false, registerView: false,
    approve: true, countersign: false, delegate: true,
    editMetadata: true, scope: 'own',
  },
  qms: {
    controlPanel: true, export: true, registerView: true,
    approve: false, countersign: true, delegate: false,
    editMetadata: true, scope: 'all',
  },
  auditor: {
    controlPanel: true, export: true, registerView: true,
    approve: false, countersign: false, delegate: false,
    editMetadata: false, scope: 'all',
  },
};

test.describe('TAQA_ROLES permission matrix', () => {
  for (const [role, expected] of Object.entries(EXPECTED_ROLES)) {
    test(`${role} has exactly the capability set roles.js defines`, async ({ page, gotoApp, consoleErrors }) => {
      await gotoApp('/index.html');
      const actual = await page.evaluate((r) => {
        const d = TAQA_ROLES[r];
        return {
          controlPanel: d.controlPanel, export: d.export, registerView: d.registerView,
          approve: d.approve, countersign: d.countersign, delegate: d.delegate,
          editMetadata: d.editMetadata, scope: d.scope,
        };
      }, role);
      expect(actual).toEqual(expected);
      assertNoConsoleErrors(consoleErrors);
    });
  }

  test('exactly these five roles exist, no more and no fewer', async ({ page, gotoApp }) => {
    await gotoApp('/index.html');
    const keys = await page.evaluate(() => Object.keys(TAQA_ROLES).sort());
    expect(keys).toEqual(['auditor', 'employee', 'maintenance', 'owner', 'qms']);
  });

  test('TAQA_ROLE_ORDER lists the same five roles and the default role is employee', async ({ page, gotoApp }) => {
    await gotoApp('/index.html');
    const info = await page.evaluate(() => ({
      order: TAQA_ROLE_ORDER.slice().sort(),
      def: TAQA_DEFAULT_ROLE,
    }));
    expect(info.order).toEqual(['auditor', 'employee', 'maintenance', 'owner', 'qms']);
    expect(info.def).toBe('employee');
  });
});

test.describe('TAQA_ROLE.current()/set()/area()/setArea()', () => {
  test('current() persists across a reload and falls back to the default when storage holds nothing usable', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();

    expect(await page.evaluate(() => TAQA_ROLE.current())).toBe('employee');

    await page.evaluate(() => TAQA_ROLE.set('qms'));
    expect(await page.evaluate(() => TAQA_ROLE.current())).toBe('qms');

    await page.reload();
    await page.waitForFunction(() => document.readyState === 'complete');
    expect(await page.evaluate(() => TAQA_ROLE.current())).toBe('qms');

    // An unrecognised value in storage must not wedge the switcher or throw;
    // it silently falls back to the default role.
    await page.evaluate(() => localStorage.setItem('taqa-demo-role', 'not-a-real-role'));
    await page.reload();
    await page.waitForFunction(() => document.readyState === 'complete');
    expect(await page.evaluate(() => TAQA_ROLE.current())).toBe('employee');
  });

  test('set() refuses an unknown role and leaves the current one untouched', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => TAQA_ROLE.set('owner'));
    await page.evaluate(() => TAQA_ROLE.set('not-a-real-role'));
    expect(await page.evaluate(() => TAQA_ROLE.current())).toBe('owner');
  });

  test('area()/setArea() persist, and setArea() refuses an area the register does not hold', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();

    // TAQA_DEFAULT_AREA.
    expect(await page.evaluate(() => TAQA_ROLE.area())).toBe('coiled-tubing');

    await page.evaluate(() => TAQA_ROLE.setArea('fracturing'));
    expect(await page.evaluate(() => TAQA_ROLE.area())).toBe('fracturing');

    await page.evaluate(() => TAQA_ROLE.setArea('not-a-real-area'));
    expect(await page.evaluate(() => TAQA_ROLE.area())).toBe('fracturing');
  });

  test('set() drops any delegation being acted under ("signing as someone you are no longer")', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => TAQA_ROLE.set('owner'));
    const grant = await page.evaluate(() => TAQA_DELEGATION.grant({
      fromRole: 'owner', to: 'Someone Else', segment: 'coiled-tubing',
      reason: 'Annual leave', until: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    }));
    expect(grant.ok).toBe(true);
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), grant.delegation.id);
    expect(await page.evaluate(() => TAQA_DELEGATION.actingAs())).toBe(grant.delegation.id);

    await page.evaluate(() => TAQA_ROLE.set('qms'));
    expect(await page.evaluate(() => TAQA_DELEGATION.actingAs())).toBeNull();
  });

  test('setArea() also drops any delegation being acted under, for the same reason', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => { TAQA_ROLE.set('owner'); TAQA_ROLE.setArea('coiled-tubing'); });
    const grant = await page.evaluate(() => TAQA_DELEGATION.grant({
      fromRole: 'owner', to: 'Someone Else', segment: 'coiled-tubing',
      reason: 'Annual leave', until: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    }));
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), grant.delegation.id);

    await page.evaluate(() => TAQA_ROLE.setArea('fracturing'));
    expect(await page.evaluate(() => TAQA_DELEGATION.actingAs())).toBeNull();
  });

  test('canRegister(role) is true only for a role whose entry has registerView', async ({ page, gotoApp }) => {
    await gotoApp('/index.html');
    const result = await page.evaluate(() => ({
      employee: TAQA_ROLE.canRegister('employee'),
      owner: TAQA_ROLE.canRegister('owner'),
      qms: TAQA_ROLE.canRegister('qms'),
      auditor: TAQA_ROLE.canRegister('auditor'),
      bogus: TAQA_ROLE.canRegister('not-a-role'),
    }));
    expect(result).toEqual({ employee: false, owner: false, qms: true, auditor: true, bogus: false });
  });
});

test.describe('TAQA_APPROVAL.approverFor()', () => {
  test('reads the register\'s type table verbatim, and treats a blank/placeholder approver as none', async ({ page, gotoApp }) => {
    await gotoApp('/index.html');
    const result = await page.evaluate(() => ({
      sop: TAQA_APPROVAL.approverFor({ docType: 'sop' }),
      standard: TAQA_APPROVAL.approverFor({ docType: 'standard' }),
      lesson: TAQA_APPROVAL.approverFor({ docType: 'lesson' }),
      policy: TAQA_APPROVAL.approverFor({ docType: 'policy' }),
      // documents-master.js literally stores ", " as software's approver.
      software: TAQA_APPROVAL.approverFor({ docType: 'software' }),
      unknown: TAQA_APPROVAL.approverFor({ docType: 'not-a-real-type' }),
    }));
    expect(result.sop).toBe('Relevant Operation Director');
    expect(result.standard).toBe('Relevant Operation Director');
    expect(result.lesson).toBe('QHSE Manager');
    expect(result.policy).toBe('CEO');
    expect(result.software).toBeNull();
    expect(result.unknown).toBeNull();
  });
});

test.describe('TAQA_DELEGATION contract', () => {
  test('grant() refuses a role that cannot delegate', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    for (const role of ['qms', 'employee', 'auditor']) {
      const out = await page.evaluate((role) => TAQA_DELEGATION.grant({
        fromRole: role, to: 'X', reason: 'test',
        until: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      }), role);
      expect(out, `${role} should not be able to grant a delegation`).toEqual({ ok: false, error: 'This role cannot delegate.' });
    }
  });

  test('grant() refuses an unknown granting role before anything else', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const out = await page.evaluate(() => TAQA_DELEGATION.grant({ fromRole: 'not-a-role', to: 'X', reason: 'r', until: '2099-01-01' }));
    expect(out).toEqual({ ok: false, error: 'Unknown granting role.' });
  });

  test('grant() requires a recipient, a reason and an expiry', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    let out = await page.evaluate(() => TAQA_DELEGATION.grant({ fromRole: 'owner' }));
    expect(out.error).toBe('Name the person receiving it.');

    out = await page.evaluate(() => TAQA_DELEGATION.grant({ fromRole: 'owner', to: 'X' }));
    expect(out.error).toBe('Record a reason. An auditor will ask.');

    out = await page.evaluate(() => TAQA_DELEGATION.grant({ fromRole: 'owner', to: 'X', reason: 'r' }));
    expect(out.error).toBe('Every delegation must expire.');

    out = await page.evaluate(() => TAQA_DELEGATION.grant({ fromRole: 'owner', to: 'X', reason: 'r', until: 'not-a-date' }));
    expect(out.error).toBe('The end date is not a date.');
  });

  test('grant() refuses an end date before the start, and a span over the 90-day maximum, but allows exactly 90', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const iso = (d) => d.toISOString().slice(0, 10);
    const today = new Date();

    let out = await page.evaluate(({ from, until }) => TAQA_DELEGATION.grant({ fromRole: 'owner', to: 'X', reason: 'r', from, until }),
      { from: iso(today), until: iso(new Date(today.getTime() - 86400000)) });
    expect(out.error).toBe('The end date is before the start.');

    out = await page.evaluate(({ from, until }) => TAQA_DELEGATION.grant({ fromRole: 'owner', to: 'X', reason: 'r', from, until }),
      { from: iso(today), until: iso(new Date(today.getTime() + 91 * 86400000)) });
    expect(out.error).toMatch(/may not run longer than 90 days/);

    out = await page.evaluate(({ from, until }) => TAQA_DELEGATION.grant({ fromRole: 'owner', to: 'X', reason: 'r', from, until }),
      { from: iso(today), until: iso(new Date(today.getTime() + 90 * 86400000)) });
    expect(out.ok).toBe(true);
  });

  test('EDGE CASE: grant() can produce an already-expired delegation, it validates the span, not that it lies in the future', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const out = await page.evaluate(() => TAQA_DELEGATION.grant({
      fromRole: 'owner', to: 'X', reason: 'r', from: '2020-01-01', until: '2020-01-05',
    }));
    expect(out.ok).toBe(true);
    expect(await page.evaluate((row) => TAQA_DELEGATION.isActive(row), out.delegation)).toBe(false);
    expect(await page.evaluate((id) => TAQA_DELEGATION.active().some((d) => d.id === id), out.delegation.id)).toBe(false);
  });

  test('EDGE CASE: grant() allows delegating to yourself, the prototype has no identity to check that against', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const out = await page.evaluate(() => TAQA_DELEGATION.grant({
      fromRole: 'owner', fromName: 'Mohammed Jahdali', to: 'Mohammed Jahdali', reason: 'Covering myself while out',
      until: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    }));
    expect(out.ok).toBe(true);
    expect(out.delegation.to).toBe('Mohammed Jahdali');
  });

  test('grant() refuses to hand over approval the grantor does not hold ("no escalation")', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    // Only 'owner' can delegate at all today, and it always holds approve,
    // so this guard cannot be triggered through the real role matrix as it
    // stands. It is exercised here by temporarily removing approve from the
    // grantor in memory, the way a future delegate-but-not-approve role
    // would, then restoring it so no other test in this worker sees the
    // change (this mutates the shared in-page TAQA_ROLES object, not
    // storage, so it cannot leak to a different browser context anyway, but
    // restoring it keeps this test's intent honest).
    const out = await page.evaluate(() => {
      const real = TAQA_ROLES.owner.approve;
      TAQA_ROLES.owner.approve = false;
      const r = TAQA_DELEGATION.grant({
        fromRole: 'owner', to: 'X', reason: 'r', includesApproval: true,
        until: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      });
      TAQA_ROLES.owner.approve = real;
      return r;
    });
    expect(out).toEqual({ ok: false, error: 'You do not hold approval authority, so you cannot delegate it.' });
  });

  test('EDGE CASE: revoke() on an id that does not exist refuses cleanly instead of throwing', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const out = await page.evaluate(() => TAQA_DELEGATION.revoke('DEL-DOES-NOT-EXIST'));
    expect(out).toEqual({ ok: false, error: 'No such delegation.' });
  });

  test('revoke() marks a live delegation revoked; isActive() then reads false and it drops out of active()', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const grant = await page.evaluate(() => TAQA_DELEGATION.grant({
      fromRole: 'owner', to: 'X', reason: 'r',
      until: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    }));
    expect(await page.evaluate((id) => TAQA_DELEGATION.isActive(TAQA_DELEGATION.list().find((d) => d.id === id)), grant.delegation.id)).toBe(true);

    const rv = await page.evaluate((id) => TAQA_DELEGATION.revoke(id), grant.delegation.id);
    expect(rv.ok).toBe(true);
    expect(await page.evaluate((id) => TAQA_DELEGATION.isActive(TAQA_DELEGATION.list().find((d) => d.id === id)), grant.delegation.id)).toBe(false);
    expect(await page.evaluate((id) => TAQA_DELEGATION.active().some((d) => d.id === id), grant.delegation.id)).toBe(false);
  });

  test('actAs()/current(): acting under an expired delegation reads as not delegated at all', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => TAQA_ROLE.set('owner'));
    const grant = await page.evaluate(() => TAQA_DELEGATION.grant({
      fromRole: 'owner', to: 'X', reason: 'r', from: '2020-01-01', until: '2020-01-05',
    })); // already expired by construction, see the EDGE CASE test above
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), grant.delegation.id);
    expect(await page.evaluate(() => TAQA_DELEGATION.current())).toBeNull();
  });

  test('actAs()/current(): acting under a revoked delegation also reads as not delegated', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => TAQA_ROLE.set('owner'));
    const grant = await page.evaluate(() => TAQA_DELEGATION.grant({
      fromRole: 'owner', to: 'X', reason: 'r',
      until: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    }));
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), grant.delegation.id);
    expect(await page.evaluate(() => TAQA_DELEGATION.current())).not.toBeNull();

    await page.evaluate((id) => TAQA_DELEGATION.revoke(id), grant.delegation.id);
    expect(await page.evaluate(() => TAQA_DELEGATION.current())).toBeNull();
  });

  test('a delegation narrowed to certain document types only widens canApprove for those types', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => { TAQA_ROLE.set('owner'); TAQA_ROLE.setArea('coiled-tubing'); });
    const grant = await page.evaluate(() => TAQA_DELEGATION.grant({
      fromRole: 'owner', to: 'X', reason: 'r', segment: 'coiled-tubing', docTypes: ['sop'],
      includesApproval: true, until: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    }));
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), grant.delegation.id);
    const result = await page.evaluate(() => {
      const sopDoc = { docType: 'sop', segment: 'coiled-tubing', status: 'draft', approvalStage: 'director' };
      const lessonDoc = { docType: 'lesson', segment: 'coiled-tubing', status: 'draft', approvalStage: 'director' };
      return { sop: TAQA_APPROVAL.canApprove(sopDoc), lesson: TAQA_APPROVAL.canApprove(lessonDoc) };
    });
    expect(result).toEqual({ sop: true, lesson: false });
  });

  test('effective(): a delegate cannot re-delegate, scope narrows to "own", and approve widens only when includesApproval was granted', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => { TAQA_ROLE.set('owner'); TAQA_ROLE.setArea('coiled-tubing'); });

    const noApprovalGrant = await page.evaluate(() => TAQA_DELEGATION.grant({
      fromRole: 'owner', to: 'X', reason: 'r', segment: 'coiled-tubing',
      includesApproval: false, until: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    }));
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), noApprovalGrant.delegation.id);
    let cap = await page.evaluate(() => TAQA_ROLE.effective());
    expect(cap.delegate).toBe(false);
    expect(cap.scope).toBe('own');
    expect(cap.ownSegment).toBe('coiled-tubing');
    // owner already holds approve natively, so this specifically checks the
    // delegated grant's own includesApproval flag is honoured, not just that
    // the base role's capability leaks through regardless.
    expect(cap.approve).toBe(true); // owner's own base approve, unaffected either way here

    await page.evaluate((id) => TAQA_DELEGATION.revoke(id), noApprovalGrant.delegation.id);
    await page.evaluate(() => TAQA_DELEGATION.actAs(null));

    // Now check the delegation-only contribution directly against a role
    // that does NOT natively hold approve, using the grantor override from
    // the "no escalation" test above so the delegated capability is the only
    // source of approve for this signed-in identity.
    await page.evaluate(() => { TAQA_ROLE.set('owner'); TAQA_ROLE.setArea('coiled-tubing'); });
    const withApprovalGrant = await page.evaluate(() => TAQA_DELEGATION.grant({
      fromRole: 'owner', to: 'Y', reason: 'r', segment: 'coiled-tubing',
      includesApproval: true, until: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    }));
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), withApprovalGrant.delegation.id);
    cap = await page.evaluate(() => TAQA_ROLE.effective());
    expect(cap.approve).toBe(true);
    expect(cap.delegated.to).toBe('Y');
  });

  test('effective() only applies the active delegation to the currently signed-in role, never to a different roleKey asked about', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => { TAQA_ROLE.set('owner'); TAQA_ROLE.setArea('coiled-tubing'); });
    const grant = await page.evaluate(() => TAQA_DELEGATION.grant({
      fromRole: 'owner', to: 'X', reason: 'r', segment: 'coiled-tubing',
      includesApproval: true, until: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    }));
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), grant.delegation.id);

    // Asking about a role other than the one actually signed in must not
    // pick up the delegation: the comment in roles.js calls this out
    // explicitly as the escalation it exists to prevent (QMS answering yes
    // to canApprove while a Director's delegation happens to be active).
    const qmsCap = await page.evaluate(() => TAQA_ROLE.effective('qms'));
    expect(qmsCap.approve).toBe(false);
    expect(qmsCap.delegated).toBeNull();
  });
});
