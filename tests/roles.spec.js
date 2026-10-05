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
    editMetadata: false, submit: true, scope: 'all', department: null,
  },
  owner: {
    controlPanel: true, export: false, registerView: false,
    approve: true, countersign: false, delegate: true,
    editMetadata: true, submit: true, scope: 'own', department: null,
  },
  // The fifth persona: a segment's Maintenance Manager. Same powers as the
  // Director, narrowed to the maintenance department by `department`, which
  // TAQA_APPROVAL.canApprove reads. It had no entry here, so an edit to its
  // capabilities would have passed unnoticed.
  maintenance: {
    controlPanel: true, export: false, registerView: false,
    approve: true, countersign: false, delegate: true,
    editMetadata: true, submit: true, scope: 'own', department: 'maintenance',
  },
  qms: {
    controlPanel: true, export: true, registerView: true,
    approve: false, countersign: true, delegate: false,
    editMetadata: true, submit: true, scope: 'all', department: null,
  },
  auditor: {
    controlPanel: true, export: true, registerView: true,
    approve: false, countersign: false, delegate: false,
    editMetadata: false, submit: false, scope: 'all', department: null,
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
          editMetadata: d.editMetadata, submit: d.submit, scope: d.scope,
          department: d.department || null,
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
      reason: 'Annual leave, desk cover while away', from: TAQA_DELEGATION.today(), until: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
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
      reason: 'Annual leave, desk cover while away', from: TAQA_DELEGATION.today(), until: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
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
      await page.evaluate((role) => TAQA_ROLE.set(role), role);
      const out = await page.evaluate((role) => TAQA_DELEGATION.grant({
        fromRole: role, to: 'X', reason: 'Annual leave, desk cover while away',
        from: TAQA_DELEGATION.today(), until: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      }), role);
      expect(out, `${role} should not be able to grant a delegation`).toEqual({ ok: false, error: 'This role cannot delegate.' });
    }
  });

  test('grant() refuses an unknown granting role before anything else', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    const out = await page.evaluate(() => TAQA_DELEGATION.grant({ fromRole: 'not-a-role', to: 'X', reason: 'Annual leave, desk cover while away', until: '2099-01-01' }));
    expect(out).toEqual({ ok: false, error: 'Unknown granting role.' });
  });

  test('grant() requires a recipient, a meaningful reason, a start and an end date (PI-54)', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => TAQA_ROLE.set('owner'));
    const g = (o) => page.evaluate((o) => TAQA_DELEGATION.grant(Object.assign({ fromRole: 'owner' }, o)), o);
    expect((await g({})).error).toBe('Name the person receiving it.');
    expect((await g({ to: '   ' })).error).toBe('Name the person receiving it.');
    expect((await g({ to: 'X' })).error).toMatch(/at least 20 characters/);
    // "." and other token reasons are refused: an auditor needs the why.
    expect((await g({ to: 'X', reason: '.' })).error).toMatch(/at least 20 characters/);
    expect((await g({ to: 'X', reason: '   Annual leave      ' })).error).toMatch(/at least 20 characters/);
    expect((await g({ to: 'X', reason: 'Annual leave, desk cover while away' })).error).toBe('Give the date it starts.');
    const today = await page.evaluate(() => TAQA_DELEGATION.today());
    expect((await g({ to: 'X', reason: 'Annual leave, desk cover while away', from: today })).error).toMatch(/must expire/);
    expect((await g({ to: 'X', reason: 'Annual leave, desk cover while away', from: today, until: 'not-a-date' })).error).toBe('The end date is not a date.');
    expect((await g({ to: 'X', reason: 'Annual leave, desk cover while away', from: '2026-02-30', until: '2099-01-01' })).error).toBe('The start date is not a date.');
  });

  test('grant() counts 90 calendar days inclusive: start + 89 is accepted, start + 90 is refused; an end before the start is refused', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => TAQA_ROLE.set('owner'));
    const r = await page.evaluate((reason) => {
      const t = TAQA_DELEGATION.today();
      const plus = (n) => { const m = t.split('-'); const d = new Date(+m[0], +m[1] - 1, +m[2] + n);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
      const g = (from, until) => TAQA_DELEGATION.grant({ fromRole: 'owner', to: 'X', reason, from, until });
      return { before: g(t, plus(-1)), d91: g(t, plus(90)), d90: g(t, plus(89)), oneDay: g(t, t),
               days90: TAQA_DELEGATION.daysInclusive(t, plus(89)) };
    }, 'Annual leave, desk cover while away');
    expect(r.before.error).toBe('The end date is before the start.');
    expect(r.d91.error).toMatch(/at most 90 days, counting its first and last day/);
    expect(r.d90.ok).toBe(true);
    expect(r.days90).toBe(90);
    expect(r.oneDay.ok).toBe(true);                        // today to today: one whole day
    expect(r.oneDay.delegation.from).toBe(r.oneDay.delegation.until);
  });

  test('grant() refuses a start in the past: no retroactive delegation (it used to accept 2020)', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => TAQA_ROLE.set('owner'));
    const out = await page.evaluate((reason) => TAQA_DELEGATION.grant({
      fromRole: 'owner', to: 'X', reason, from: '2020-01-01', until: '2020-01-05',
    }), 'Annual leave, desk cover while away');
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/cannot start in the past/);
    expect(await page.evaluate(() => TAQA_DELEGATION.list().length)).toBe(0);
  });

  test('grant() refuses a delegate named as the grantor, the grantor\'s title or a role (NEW-04, PI-54; it used to accept them)', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => TAQA_ROLE.set('owner'));
    for (const to of ['Mohammed Jahdali', '  mohammed   JAHDALI ', 'Segment Director', 'QMS / Document Controller', 'qms / document controller', 'Employee']) {
      const out = await page.evaluate(({ to, reason }) => TAQA_DELEGATION.grant({
        fromRole: 'owner', fromName: 'Mohammed Jahdali', to, reason, from: TAQA_DELEGATION.today(),
        until: TAQA_DELEGATION.today(),
      }), { to, reason: 'Annual leave, desk cover while away' });
      expect(out.ok, to).toBe(false);
      expect(out.error, to).toMatch(/not yourself or a role/);
    }
  });

  test('grant() refuses to hand over approval the grantor does not hold ("no escalation")', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => TAQA_ROLE.set('owner'));
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
        fromRole: 'owner', to: 'X', reason: 'Annual leave, desk cover while away', includesApproval: true,
        from: TAQA_DELEGATION.today(), until: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
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
    await page.evaluate(() => TAQA_ROLE.set('owner'));
    const grant = await page.evaluate(() => TAQA_DELEGATION.grant({
      fromRole: 'owner', to: 'X', reason: 'Annual leave, desk cover while away',
      from: TAQA_DELEGATION.today(), until: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    }));
    expect(await page.evaluate((id) => TAQA_DELEGATION.isActive(TAQA_DELEGATION.list().find((d) => d.id === id)), grant.delegation.id)).toBe(true);

    const rv = await page.evaluate((id) => TAQA_DELEGATION.revoke(id), grant.delegation.id);
    expect(rv.ok).toBe(true);
    expect(await page.evaluate((id) => TAQA_DELEGATION.isActive(TAQA_DELEGATION.list().find((d) => d.id === id)), grant.delegation.id)).toBe(false);
    expect(await page.evaluate((id) => TAQA_DELEGATION.active().some((d) => d.id === id), grant.delegation.id)).toBe(false);
  });

  test('actAs()/current(): an expired delegation cannot be acted under and reads as not delegated at all', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => { TAQA_ROLE.set('owner'); TAQA_ROLE.setArea('coiled-tubing'); });
    // grant() no longer makes a grant in the past, so the expired one is stored directly.
    await page.evaluate(() => localStorage.setItem('taqa-delegations-v1', JSON.stringify([{
      schema: 2, id: 'DEL-OLD', fromRole: 'owner', grantorId: TAQA_ROLE.identity(), fromName: 'Director', to: 'X',
      includesApproval: true, includesManagement: true, segment: 'coiled-tubing', department: null, docTypes: null,
      from: '2020-01-01', until: '2020-01-05', reason: 'Expired grant for the test only', createdAt: '2020-01-01T00:00:00Z', revokedAt: null }])));
    expect(await page.evaluate(() => TAQA_DELEGATION.actAs('DEL-OLD'))).toBe(false);
    expect(await page.evaluate(() => TAQA_DELEGATION.current())).toBeNull();
    // Forced into storage, it still reads as nothing, and grants nothing.
    await page.evaluate(() => localStorage.setItem('taqa-acting-delegation', 'DEL-OLD'));
    expect(await page.evaluate(() => TAQA_DELEGATION.current())).toBeNull();
    expect(await page.evaluate(() => TAQA_ROLE.effective().approve)).toBe(false);
  });

  test('actAs()/current(): acting under a revoked delegation also reads as not delegated', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => TAQA_ROLE.set('owner'));
    const grant = await page.evaluate(() => TAQA_DELEGATION.grant({
      fromRole: 'owner', to: 'X', reason: 'Annual leave, desk cover while away',
      from: TAQA_DELEGATION.today(), until: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    }));
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), grant.delegation.id);
    expect(await page.evaluate(() => TAQA_DELEGATION.current())).not.toBeNull();

    // Whoever is acting under it is the delegate, and a delegate cannot
    // revoke it (PI-09): only the grantor, signed in as themselves, can.
    expect((await page.evaluate((id) => TAQA_DELEGATION.revoke(id), grant.delegation.id)).ok).toBe(false);
    await page.evaluate(() => TAQA_DELEGATION.actAs(null));
    expect((await page.evaluate((id) => TAQA_DELEGATION.revoke(id), grant.delegation.id)).ok).toBe(true);
    expect(await page.evaluate((id) => TAQA_DELEGATION.actAs(id), grant.delegation.id)).toBe(false);
    expect(await page.evaluate(() => TAQA_DELEGATION.current())).toBeNull();
  });

  test('a delegation narrowed to certain document types only widens canApprove for those types', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => { TAQA_ROLE.set('owner'); TAQA_ROLE.setArea('coiled-tubing'); });
    const grant = await page.evaluate(() => TAQA_DELEGATION.grant({
      fromRole: 'owner', to: 'X', reason: 'Annual leave, desk cover while away', segment: 'coiled-tubing', docTypes: ['sop'],
      includesApproval: true, from: TAQA_DELEGATION.today(), until: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
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
      fromRole: 'owner', to: 'X', reason: 'Annual leave, desk cover while away', segment: 'coiled-tubing',
      includesApproval: false, from: TAQA_DELEGATION.today(), until: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    }));
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), noApprovalGrant.delegation.id);
    let cap = await page.evaluate(() => TAQA_ROLE.effective());
    expect(cap.delegate).toBe(false);
    expect(cap.scope).toBe('own');
    expect(cap.ownSegment).toBe('coiled-tubing');
    // Acting under a delegation without approval, approve is false even
    // though the Director's own role holds it: the delegation replaces the
    // role's authority rather than adding to it (PI-04). This test used to
    // assert true here and so pinned the escalation.
    expect(cap.approve).toBe(false);
    expect(cap.countersign).toBe(false);

    await page.evaluate(() => TAQA_DELEGATION.actAs(null));
    await page.evaluate((id) => TAQA_DELEGATION.revoke(id), noApprovalGrant.delegation.id);

    // Now check the delegation-only contribution directly against a role
    // that does NOT natively hold approve, using the grantor override from
    // the "no escalation" test above so the delegated capability is the only
    // source of approve for this signed-in identity.
    await page.evaluate(() => { TAQA_ROLE.set('owner'); TAQA_ROLE.setArea('coiled-tubing'); });
    const withApprovalGrant = await page.evaluate(() => TAQA_DELEGATION.grant({
      fromRole: 'owner', to: 'Y', reason: 'Annual leave, desk cover while away', segment: 'coiled-tubing',
      includesApproval: true, from: TAQA_DELEGATION.today(), until: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
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
      fromRole: 'owner', to: 'X', reason: 'Annual leave, desk cover while away', segment: 'coiled-tubing',
      includesApproval: true, from: TAQA_DELEGATION.today(), until: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
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
