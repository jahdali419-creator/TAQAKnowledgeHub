// Product-integrity remediation, Priority 1 (docs/QA/PRODUCT-INTEGRITY-AUDIT.md).
//
//   PI-05  register and stored text must never run as script, anywhere it is
//          drawn. Every test here plants markup that WOULD run if it reached
//          innerHTML unescaped, opens the screen that draws it, and checks that
//          nothing ran and no element was injected: the attack itself, not
//          whether a field happens to look right.
//   PI-04  a delegation gives its holder the delegation's authority and no
//          more; whoever checked a document cannot also approve it.
//   PI-09  the register's own functions refuse forged lifecycle, identity and
//          authority, whatever page or console calls them.
//
// Everything here is a browser prototype: these checks keep the pages honest
// and state the rules the API must enforce. They are not production security
// (BUSINESS-RULES.md §15, AZURE-INTEGRATION-REQUIREMENTS.md §4).
const { test, expect, assertNoConsoleErrors, DESKTOP } = require('./helpers/fixtures');

const SEG = 'coiled-tubing';

// Each payload records its id in window.__pwn if it ever runs.
const tag = (id) => `<img src=x onerror="window.__pwn=(window.__pwn||[]).concat('${id}')">`;
const attr = (id) => `x" onmouseover="window.__pwn=(window.__pwn||[]).concat('${id}')" data-pwn="1`;

async function assertNothingRan(page, where) {
  // An <img src=x> fails to load on the next tick; give onerror its chance.
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__pwn || null), `${where}: injected script ran`).toBeNull();
  expect(await page.locator('img[src="x"]').count(), `${where}: an <img> was injected`).toBe(0);
  expect(await page.locator('[data-pwn]').count(), `${where}: an attribute was injected`).toBe(0);
}

async function start(page, gotoApp, clearAppState, setRole, role, area = SEG) {
  await gotoApp('/index.html');
  await clearAppState();
  await page.evaluate(() => localStorage.setItem('taqa-tour-done', '1'));
  await setRole(role, area);
}

test.describe('PI-05: register and stored text never runs as script', () => {
  test.use(DESKTOP);

  test('Upload: a hostile title or number in the area never runs in Supersedes, Related IDs or the review card', async ({ page, gotoApp, setRole, clearAppState, seedRegister, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await seedRegister([
      { docNumber: 'TQ-PWN-S001', title: 'Pump ' + tag('upload-title') + ' "quoted" & more', segment: SEG, docType: 'sop' },
      { docNumber: tag('upload-num'), title: 'Numbered badly', segment: SEG, docType: 'sop' },
    ]);
    await gotoApp('/upload.html');
    await page.evaluate((seg) => {
      document.getElementById('doc-type-select').value = 'sop'; onTypeChange('sop');
      onSegmentChange(seg); setDocStatus('revision');
    }, SEG);
    // Every option is text: the hostile title is there, intact, as an option label.
    const opts = await page.locator('#supersedes-select option').allTextContents();
    expect(opts.some((t) => t.includes('Pump <img src=x onerror='))).toBe(true);
    expect(await page.locator('#supersedes-select img').count()).toBe(0);
    // Choosing it names the document by its number (a revision keeps it).
    const val = await page.evaluate(() => {
      const sel = document.getElementById('supersedes-select');
      const o = [...sel.options].find((x) => x.text.includes('Pump <img'));
      sel.value = o.value; onSupersedesChange(); return sel.value;
    });
    expect(val).toBe('TQ-PWN-S001');
    // The review card repeats the chosen revision.
    await page.evaluate(() => { if (typeof paintRecord === 'function') paintRecord(); });

    // Related IDs: any hyphenated number makes the badly numbered record "related".
    await page.evaluate(() => { setDocStatus('new'); const f = document.getElementById('doc-ref-id'); f.value = 'Q-1'; checkDocId(); });
    await assertNothingRan(page, 'upload');
    assertNoConsoleErrors(consoleErrors);
  });

  test('Segment page: tab search highlight, Recently Viewed and the document modal stay inert', async ({ page, gotoApp, setRole, clearAppState, seedRegister }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await seedRegister([{
      docNumber: 'TQ-PWN-S002', title: 'Pump procedure ' + tag('seg-title'), segment: SEG, docType: 'sop',
      revision: tag('seg-rev'), classification: 'internal',
    }]);
    // A Recently Viewed entry as an earlier visit stored it, with a title that
    // breaks out of the old inline onclick and markup in every field.
    await page.evaluate((t) => localStorage.setItem('taqa-recent-docs', JSON.stringify([
      { title: "TQ-PWN-S002  x',window.__pwn=['recent-js'],'" , type: 'sop', segId: 'coiled-tubing', segName: t, ts: Date.now() },
      { title: 'TQ-PWN-S002  Pump procedure ' + t, type: 'sop" data-pwn="1', segId: 'coiled-tubing', segName: 'CT', ts: Date.now() },
    ])), tag('recent-seg'));
    await gotoApp(`/segment.html?id=${SEG}&tab=sops`);
    await expect(page.locator('#recent-cards .recent-card')).toHaveCount(2);
    await expect(page.locator('#recent-cards')).toContainText('Pump procedure <img src=x');

    // The tab search used to turn the escaped title back into markup.
    await page.locator('input[placeholder="Search SOPs..."]').fill('pump');
    await expect(page.locator('#list-sops mark.search-hl').first()).toBeVisible();
    await expect(page.locator('#list-sops .doc-info-title', { hasText: 'Pump procedure <img' })).toHaveCount(1);

    // Opening the card goes through data attributes, not script source; the
    // modal draws the record's revision.
    await page.locator('#recent-cards .recent-card').first().click();
    await page.evaluate(() => closeDocModal && closeDocModal());
    await page.locator('#recent-cards .recent-card').nth(1).click();
    await expect(page.locator('#dm-summary')).toContainText('Rev <img src=x');
    await assertNothingRan(page, 'segment');
  });

  test('Viewer: number, revision, classification and type from the register stay text, including the quick reference card', async ({ page, gotoApp, setRole, clearAppState, seedRegister }) => {
    await start(page, gotoApp, clearAppState, setRole, 'qms');
    await seedRegister([
      { docNumber: 'TQ-PWN-S003', title: 'Viewer target', segment: SEG, docType: 'sop', revision: tag('viewer-rev') },
      // An unknown classification is withheld from every role: the denied banner draws it.
      { docNumber: 'TQ-PWN-S004', title: 'Viewer denied', segment: SEG, docType: 'sop', classification: tag('viewer-cls') },
    ]);
    await gotoApp(`/viewer.html?doc=TQ-PWN-S003&seg=${SEG}&type=sop`);
    await expect(page.locator('#meta-grid')).toContainText('Rev <img src=x');
    await page.evaluate(() => showQuickRef());
    await assertNothingRan(page, 'viewer record');
    await gotoApp(`/viewer.html?doc=TQ-PWN-S004&seg=${SEG}&type=sop`);
    await expect(page.locator('#lifecycle-banner')).toContainText('<IMG SRC=X');
    await assertNothingRan(page, 'viewer denied');
  });

  test('Director desk: a hostile document number cannot add a handler to the Approve button; the delegation list stays text', async ({ page, gotoApp, setRole, clearAppState, seedRegister }) => {
    await start(page, gotoApp, clearAppState, setRole, 'owner');
    await seedRegister([{
      docNumber: 'XSSD' + attr('desk-num'), title: 'Desk target', segment: SEG, docType: 'sop',
      status: 'draft', approvalStage: 'director', countersignedBy: tag('desk-cs'), submittedBy: 'Employee',
    }]);
    // A delegation record as storage holds it, with markup in every field.
    await page.evaluate((t) => localStorage.setItem('taqa-delegations-v1', JSON.stringify([{
      id: 'DEL-X" data-pwn="1', to: 'Deputy', fromRole: 'owner', fromName: t, segment: 'coiled-tubing',
      docTypes: [t], includesApproval: true, from: '2020-01-01', until: '2099-01-01" data-pwn="1', reason: 'r', revokedAt: null,
    }])), tag('deleg'));
    await gotoApp(`/dashboard.html?id=${SEG}`);
    const approve = page.locator('.btn-approve').first();
    await expect(approve).toBeVisible();
    expect(await approve.getAttribute('onmouseover')).toBeNull();
    expect(await approve.getAttribute('data-store-doc')).toBe('XSSD' + attr('desk-num'));
    await approve.hover();
    await assertNothingRan(page, 'desk');
  });

  test('Master List drawer and Workbench: hostile lookup values and record fields stay text', async ({ page, gotoApp, setRole, clearAppState, seedRegister }) => {
    // The lookups come from SharePoint in production, so they are untrusted too.
    await page.route('**/documents-master.js', async (route) => {
      const res = await route.fetch();
      const body = (await res.text()) + `
;TAQA_DOC_LOOKUPS.types.sop.reviewCycleMonths = ${JSON.stringify(tag('ml-cycle'))};
TAQA_DOC_LOOKUPS.types.sop.retentionYears = ${JSON.stringify(tag('ml-ret'))};
TAQA_DOC_LOOKUPS.segments[${JSON.stringify('x"><img src=x onerror="window.__pwn=[1]">')}] = { name: 'Poisoned area', group: 'function' };`;
      await route.fulfill({ response: res, body });
    });
    await start(page, gotoApp, clearAppState, setRole, 'qms');
    await page.evaluate((t) => TAQA_STORE.add({ docNumber: 'TQ-PWN-S005', title: 'Workbench ' + t, segment: 'coiled-tubing', docType: 'sop', summary: t }), tag('wb-title'));
    await gotoApp('/master-list.html?view=qms&doc=TQ-PWN-S005');
    await expect(page.locator('#dw-title')).toHaveText(/^Workbench <img src=x/);
    // A published SOP's record view draws the type's review cycle and retention.
    await gotoApp('/master-list.html');
    await page.evaluate(() => openDoc(TAQA_STORE.all().find((d) => d.docType === 'sop' && d.status === 'current')));
    await expect(page.locator('#dw-body')).toContainText('<img src=x');
    // The filter lists are built from the lookup keys.
    expect(await page.evaluate(() => [...document.querySelectorAll('#f-seg option')].filter((o) => o.value.startsWith('x"><img')).length)).toBe(1);
    await assertNothingRan(page, 'master list');
  });

  test('Bell, delegation banner and Home desk line: stored delegation and register values stay text', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await page.evaluate((t) => TAQA_STORE.add({ docNumber: 'TQ-PWN-S006', title: 'Bell ' + t, segment: 'coiled-tubing', docType: 'sop' }), tag('bell-title'));
    await setRole('owner', SEG);
    await page.evaluate((t) => {
      localStorage.setItem('taqa-delegations-v1', JSON.stringify([{
        id: 'DEL-PWN', to: 'Deputy', fromRole: 'owner', fromName: t, segment: t, docTypes: null,
        includesApproval: false, from: '2020-01-01', until: '2099-01-01', reason: 'r', revokedAt: null,
      }]));
      TAQA_DELEGATION.actAs('DEL-PWN');
    }, tag('banner'));
    await gotoApp('/index.html');
    await expect(page.locator('.deleg-bar')).toContainText('Delegate for <img src=x');
    await setRole('qms', SEG);
    await gotoApp('/index.html');
    await page.locator('#nav-bell').click();
    await expect(page.locator('.bell-menu')).toContainText('Bell <img src=x');
    await assertNothingRan(page, 'bell, banner, desk line');
  });

  test('AI search and Analytics: an unknown register type and stored search text stay text', async ({ page, gotoApp, setRole, clearAppState, seedRegister }) => {
    await start(page, gotoApp, clearAppState, setRole, 'qms');
    await seedRegister([{ docNumber: 'TQ-PWN-S007', title: 'Zebrafish handling', segment: SEG, docType: tag('ai-type') }]);
    await page.evaluate((t) => localStorage.setItem('taqa-analytics', JSON.stringify([
      { e: 'search', k: t, t: Date.now() }, { e: t, k: 'x', t: Date.now() },
    ])), tag('analytics'));
    await gotoApp('/ai-search.html?q=zebrafish');
    await page.waitForTimeout(500);
    await assertNothingRan(page, 'ai search');
    await gotoApp('/analytics.html');
    await expect(page.locator('#activity-list')).toContainText('<img src=x');
    await assertNothingRan(page, 'analytics');
  });
});

test.describe('PI-04: a delegation carries its own authority, never more', () => {
  test.use(DESKTOP);

  async function director(page, gotoApp, clearAppState, setRole) {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await page.evaluate(() => TAQA_STORE.add({ docNumber: 'TQ-DEL-S001', title: 'Delegation target', segment: 'coiled-tubing', docType: 'sop' }));
    await setRole('qms', SEG);
    expect((await page.evaluate(() => TAQA_STORE.countersign('TQ-DEL-S001'))).ok).toBe(true);
    await setRole('owner', SEG);
  }
  const until = () => new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10);

  test('a delegate without approval cannot approve: no Approve on the desk, approve() refused, record unchanged', async ({ page, gotoApp, setRole, clearAppState }) => {
    await director(page, gotoApp, clearAppState, setRole);
    const g = await page.evaluate((u) => TAQA_DELEGATION.grant({ to: 'Deputy', reason: 'Leave', until: u, includesApproval: false }), until());
    expect(g.ok).toBe(true);
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), g.delegation.id);
    await gotoApp(`/dashboard.html?id=${SEG}`);
    await expect(page.locator('.deleg-bar')).toContainText('without approval');
    await expect(page.locator('.btn-approve[data-store-doc="TQ-DEL-S001"]')).toHaveCount(0);
    expect(await page.evaluate(() => TAQA_STORE.approve('TQ-DEL-S001'))).toEqual({ ok: false, error: 'You cannot approve this document.' });
    expect(await page.evaluate(() => { const d = TAQA_STORE.findDoc('TQ-DEL-S001'); return [d.status, d.approvalStage, d.approvedBy || null]; }))
      .toEqual(['draft', 'director', null]);
  });

  test('QMS acting under a Director\'s delegation can neither check nor approve', async ({ page, gotoApp, setRole, clearAppState }) => {
    await director(page, gotoApp, clearAppState, setRole);
    const g = await page.evaluate((u) => TAQA_DELEGATION.grant({ to: 'QMS colleague', reason: 'Leave', until: u, includesApproval: true }), until());
    await page.evaluate(() => TAQA_STORE.add({ docNumber: 'TQ-DEL-S002', title: 'Second target', segment: 'coiled-tubing', docType: 'sop' }));
    await setRole('qms', SEG);
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), g.delegation.id);
    const cap = await page.evaluate(() => TAQA_ROLE.effective());
    expect([cap.approve, cap.countersign]).toEqual([false, false]);
    expect((await page.evaluate(() => TAQA_STORE.approve('TQ-DEL-S001'))).ok).toBe(false);
    expect((await page.evaluate(() => TAQA_STORE.countersign('TQ-DEL-S002'))).ok).toBe(false);
    expect(await page.evaluate(() => [TAQA_STORE.findDoc('TQ-DEL-S001').status, TAQA_STORE.findDoc('TQ-DEL-S002').approvalStage]))
      .toEqual(['draft', 'qms']);
  });

  test('whoever checked a document cannot also approve it', async ({ page, gotoApp, setRole, clearAppState, seedRegister }) => {
    await start(page, gotoApp, clearAppState, setRole, 'owner');
    await seedRegister([{ docNumber: 'TQ-DEL-S003', title: 'Same hands', segment: SEG, docType: 'sop',
      status: 'draft', approvalStage: 'director', countersignedBy: 'Segment Director', submittedBy: 'Employee' }]);
    await gotoApp('/index.html');
    expect(await page.evaluate(() => TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc('TQ-DEL-S003')))).toBe(false);
    expect((await page.evaluate(() => TAQA_STORE.approve('TQ-DEL-S003'))).ok).toBe(false);
    expect(await page.evaluate(() => TAQA_STORE.findDoc('TQ-DEL-S003').status)).toBe('draft');
  });

  test('with approval included, the delegate approves and signs in their own name', async ({ page, gotoApp, setRole, clearAppState }) => {
    await director(page, gotoApp, clearAppState, setRole);
    const g = await page.evaluate((u) => TAQA_DELEGATION.grant({ to: 'Deputy', fromName: 'CT Director', reason: 'Leave', until: u, includesApproval: true }), until());
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), g.delegation.id);
    expect((await page.evaluate(() => TAQA_STORE.approve('TQ-DEL-S001'))).ok).toBe(true);
    expect(await page.evaluate(() => TAQA_STORE.findDoc('TQ-DEL-S001').approvedBy)).toBe('Deputy (delegate for CT Director)');
  });
});

test.describe('PI-09: the register refuses forged lifecycle, identity and authority', () => {
  test('add() files a draft at the QMS check whatever the caller sends', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    const before = await page.evaluate(() => TAQA_STORE.count('live'));
    const row = await page.evaluate(() => TAQA_STORE.add({
      docNumber: 'TQ-FRG-S001', title: 'Forged', segment: 'coiled-tubing', docType: 'sop',
      status: 'current', approvalStage: 'director', approvedBy: 'CEO', approvedDate: '2026-01-01',
      countersignedBy: 'QMS', submittedBy: 'Someone else', submittedAt: '2020-01-01T00:00:00Z', rejected: true, supersededBy: 'X',
    }));
    expect({ status: row.status, stage: row.approvalStage, by: row.submittedBy, appr: row.approvedBy, cs: row.countersignedBy, rej: row.rejected, sup: row.supersededBy })
      .toEqual({ status: 'draft', stage: 'qms', by: 'Employee', appr: undefined, cs: undefined, rej: undefined, sup: undefined });
    expect(row.submittedAt).not.toBe('2020-01-01T00:00:00Z');
    expect(await page.evaluate(() => TAQA_STORE.count('live'))).toBe(before);
  });

  test('add() refuses what Upload refuses: a policy from anyone but QMS, several files, maintenance outside a segment', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    const out = await page.evaluate(() => [
      TAQA_STORE.add({ title: 'Policy', segment: 'company', docType: 'policy' }),
      TAQA_STORE.add({ title: 'Two files', segment: 'coiled-tubing', docType: 'sop', files: [{ name: 'a.pdf' }, { name: 'b.pdf' }] }),
      TAQA_STORE.add({ title: 'Maint in IT', segment: 'it', docType: 'sop', department: 'maintenance' }),
    ]);
    expect(out).toEqual([null, null, null]);
    await setRole('qms', SEG);
    expect(await page.evaluate(() => !!TAQA_STORE.add({ docNumber: 'TQ-QHSE-P901', title: 'Policy', segment: 'company', docType: 'policy' }))).toBe(true);
  });

  test('setStatus() moves only along the allowed transitions', async ({ page, gotoApp, setRole, clearAppState, seedRegister }) => {
    await start(page, gotoApp, clearAppState, setRole, 'qms');
    await seedRegister([
      { docNumber: 'TQ-ST-D', title: 'Draft', segment: SEG, docType: 'sop', status: 'draft', approvalStage: 'qms' },
      { docNumber: 'TQ-ST-C', title: 'Current', segment: SEG, docType: 'sop', status: 'current', approvedBy: 'Segment Director' },
      { docNumber: 'TQ-ST-O', title: 'Withdrawn', segment: SEG, docType: 'sop', status: 'obsolete' },
    ]);
    await gotoApp('/index.html');
    const r = await page.evaluate(() => [
      TAQA_STORE.setStatus('TQ-ST-D', 'under-review'),   // a draft made live, unapproved
      TAQA_STORE.setStatus('TQ-ST-C', 'draft'),          // current back to draft, keeping its approval
      TAQA_STORE.setStatus('TQ-ST-C', 'banana'),
      TAQA_STORE.setStatus('TQ-ST-O', 'superseded'),     // nothing comes out of withdrawn
      TAQA_STORE.setStatus('TQ-ST-O', 'current'),
    ].map((x) => !!x));
    expect(r).toEqual([false, false, false, false, false]);
    expect(await page.evaluate(() => ['TQ-ST-D', 'TQ-ST-C', 'TQ-ST-O'].map((n) => TAQA_STORE.findDoc(n).status)))
      .toEqual(['draft', 'current', 'obsolete']);
    expect(await page.evaluate(() => !!TAQA_STORE.setStatus('TQ-ST-C', 'obsolete'))).toBe(true);
  });

  test('editing details cannot renumber, move, retype or re-file a document', async ({ page, gotoApp, setRole, clearAppState, seedRegister }) => {
    await start(page, gotoApp, clearAppState, setRole, 'qms');
    await seedRegister([{ docNumber: 'TQ-ED-S001', title: 'Approved', segment: SEG, docType: 'sop', status: 'current', approvedBy: 'Segment Director' }]);
    await gotoApp('/index.html');
    const forged = { docNumber: 'TQ-ED-S999', segment: 'drilling', department: 'maintenance', docType: 'policy',
      files: [{ name: 'other.pdf' }], revision: '9.0', supersedes: 'X', classification: 'restricted', scope: 'company' };
    const out = await page.evaluate((f) => Object.keys(f).map((k) => TAQA_STORE.patch('TQ-ED-S001', { [k]: f[k] }).ok), forged);
    expect(out.every((ok) => ok === false)).toBe(true);
    const d = await page.evaluate(() => TAQA_STORE.findDoc('TQ-ED-S001'));
    expect([d.docNumber, d.segment, d.docType, d.revision, d.classification]).toEqual(['TQ-ED-S001', SEG, 'sop', '1.0', 'internal']);
    expect((await page.evaluate(() => TAQA_STORE.patch('TQ-ED-S001', { summary: 'Reviewed, still fit for use.' }))).ok).toBe(true);
  });

  test('a caller cannot choose the name on a signature', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await page.evaluate(() => TAQA_STORE.add({ docNumber: 'TQ-SG-S001', title: 'Signed', segment: 'coiled-tubing', docType: 'sop' }));
    await setRole('qms', SEG);
    await page.evaluate(() => TAQA_STORE.countersign('TQ-SG-S001', 'The CEO'));
    await setRole('owner', SEG);
    await page.evaluate(() => TAQA_STORE.approve('TQ-SG-S001', 'The CEO'));
    expect(await page.evaluate(() => { const d = TAQA_STORE.findDoc('TQ-SG-S001'); return [d.countersignedBy, d.approvedBy]; }))
      .toEqual(['QMS / Document Controller', 'Segment Director']);
  });

  test('nobody grants a delegation they do not hold, or revokes one they did not grant', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    const u = new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10);
    // An Employee naming the Director's role, from the console.
    expect(await page.evaluate((u) => TAQA_DELEGATION.grant({ fromRole: 'owner', to: 'Me', reason: 'r', until: u, includesApproval: true }), u))
      .toEqual({ ok: false, error: 'You can only delegate your own authority.' });
    // A Director naming another area.
    await setRole('owner', SEG);
    expect((await page.evaluate((u) => TAQA_DELEGATION.grant({ to: 'X', reason: 'r', until: u, segment: 'drilling' }), u)).ok).toBe(false);
    const g = await page.evaluate((u) => TAQA_DELEGATION.grant({ to: 'Deputy', reason: 'Leave', until: u, segment: 'coiled-tubing' }), u);
    expect(g.ok).toBe(true);
    expect(g.delegation.segment).toBe(SEG);
    // Another area's Director, an Employee and QMS cannot revoke it.
    for (const [role, area] of [['owner', 'drilling'], ['employee', SEG], ['qms', SEG]]) {
      await setRole(role, area);
      expect((await page.evaluate((id) => TAQA_DELEGATION.revoke(id), g.delegation.id)).ok, role + ' ' + area).toBe(false);
    }
    expect(await page.evaluate((id) => TAQA_DELEGATION.list().find((d) => d.id === id).revokedAt, g.delegation.id)).toBeNull();
    await setRole('owner', SEG);
    expect((await page.evaluate((id) => TAQA_DELEGATION.revoke(id), g.delegation.id)).ok).toBe(true);
  });

  test('the register cannot be wiped from a page', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'qms');
    await page.evaluate(() => TAQA_STORE.add({ docNumber: 'TQ-RS-S001', title: 'Kept', segment: 'coiled-tubing', docType: 'sop' }));
    expect(await page.evaluate(() => typeof TAQA_STORE.reset)).toBe('undefined');
    expect(await page.evaluate(() => !!TAQA_STORE.findDoc('TQ-RS-S001'))).toBe(true);
  });
});
