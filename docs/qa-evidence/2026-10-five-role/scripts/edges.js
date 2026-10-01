// Edge cases for the five-role workflow, desktop, by UI where a person can do
// it. Usage: node edges.js
const L = require('./lib');
const R = L.recorder('edges');
const SEG = 'coiled-tubing';
const S = new Date().toISOString().replace(/\D/g, '').slice(0, 12);

(async () => {
  const { browser, context, page, errors } = await L.launch({ width: 1440, height: 900 }, false);
  const log = R.log;
  try {
    await L.fresh(page);

    /* ── Rejection by the Maintenance Manager, then resubmission ── */
    const TR = 'AUDIT-REJ-' + S;
    await L.as(page, 'employee');
    let f = await L.file(page, { title: TR, seg: SEG, type: 'manual', viaMaintLink: true });
    const NR = f.nums[0];
    let r = await L.rec(page, NR);
    log('E-R1', 'Employee files a maintenance manual from a Maintenance tab link (?dept=maintenance)', 'box pre-ticked; department=maintenance',
      `box=${JSON.stringify(f.boxState)} dept=${r.department} ${NR}`, f.boxState && f.boxState.checked && r.department === 'maintenance');
    await L.as(page, 'qms');
    let d = await L.desk(page, SEG, TR);
    await d.card.locator('.btn-approve').click(); await page.waitForTimeout(300);
    await L.as(page, 'maintenance', SEG);
    d = await L.desk(page, SEG, TR);
    await d.card.locator('.btn-reject').click();
    await page.fill('#reject-reason-input', 'short');
    const disabledShort = await page.locator('#reject-modal-confirm').isDisabled();
    await page.fill('#reject-reason-input', 'Torque values in section 5 do not match the OEM manual. Please revise.');
    await page.locator('#reject-modal-confirm').dblclick();
    await page.waitForTimeout(400);
    r = await L.rec(page, NR);
    log('E-R2', 'MM rejects at the final step (reason < 20 chars blocked; double-click confirm)', 'rejected once, at stage director, by Maintenance Manager',
      `shortBlocked=${disabledShort} rejected=${r.rejected} stage=${r.rejectedAtStage} by=${r.rejectedBy} status=${r.status}`,
      disabledShort && r.rejected === true && r.rejectedAtStage === 'director' && r.rejectedBy === 'Maintenance Manager' && r.status === 'draft');
    await page.reload(); await page.waitForTimeout(300);
    log('E-R2', 'Refresh the MM desk', 'rejected document is gone from the queue', `cards=${await page.locator('.pending-card', { hasText: TR }).count()}`,
      (await page.locator('.pending-card', { hasText: TR }).count()) === 0);
    await L.as(page, 'employee');
    await L.go(page, '/upload.html');
    const sub = await page.locator('#my-subs-list li', { hasText: TR }).innerText().catch(() => '');
    log('E-R3', 'Employee sees the return and reason in "Your submissions"', 'Returned by Maintenance Manager with the reason', sub.replace(/\s+/g, ' '),
      /Maintenance Manager/.test(sub) && /Torque values/.test(sub));
    await L.go(page, `/viewer.html?doc=${NR}&seg=${SEG}`);
    const ban = await page.locator('#lifecycle-banner').innerText();
    log('E-R3', 'Viewer banner for the returned draft', 'Returned by … reason … file it again', ban.replace(/\s+/g, ' ').slice(0, 220), /Returned by/.test(ban) && /Torque/.test(ban));
    // Resubmission is a new filing of the revised document.
    f = await L.file(page, { title: TR + '-R2', seg: SEG, type: 'manual', viaMaintLink: true });
    const NR2 = f.nums[0];
    await L.as(page, 'qms');
    const q = await page.evaluate(({ a, b }) => ({ old: TAQA_STORE.stageOf(TAQA_STORE.findDoc(a)), neu: TAQA_STORE.stageOf(TAQA_STORE.findDoc(b)) }), { a: NR, b: NR2 });
    d = await L.desk(page, SEG, TR);
    log('E-R4', 'Resubmission: revised document filed again', 'new record waits on QMS; the returned one stays out of every queue',
      `new=${NR2} stage=${q.neu}; old stage=${q.old}; QMS cards with that title=${d.cards}`, q.neu === 'qms' && q.old === null && d.cards === 1);
    let out = await page.evaluate((n) => [TAQA_STORE.countersign(n), TAQA_STORE.approve(n)], NR);
    log('E-R4', 'console: QMS tries to countersign/approve the returned draft', 'refused', JSON.stringify(out), out[0].ok === false && out[1].ok === false);
    // QMS rejection of a maintenance document (the other reject point)
    await d.card.locator('.btn-reject').click();
    await page.fill('#reject-reason-input', 'Number must be checked against the 5.3 table first.');
    await page.click('#reject-modal-confirm'); await page.waitForTimeout(300);
    r = await L.rec(page, NR2);
    log('E-R5', 'QMS rejects a maintenance document at its own step', 'rejectedAtStage=qms; the MM never sees it', `stage=${r.rejectedAtStage} by=${r.rejectedBy}`, r.rejectedAtStage === 'qms');

    /* ── Two tabs, stale action ── */
    const T2 = 'AUDIT-2TAB-' + S;
    await L.as(page, 'employee');
    f = await L.file(page, { title: T2, seg: SEG, type: 'sop', maint: true });
    const N2 = f.nums[0];
    await L.as(page, 'qms');
    d = await L.desk(page, SEG, T2); await d.card.locator('.btn-approve').click(); await page.waitForTimeout(300);
    await L.as(page, 'maintenance', SEG);
    const tabB = await context.newPage(); tabB.on('dialog', (x) => x.accept());
    await L.go(page, '/dashboard.html?id=' + SEG);
    await L.go(tabB, '/dashboard.html?id=' + SEG);
    await page.locator('.pending-card', { hasText: T2 }).locator('.btn-approve').click(); await page.waitForTimeout(300);
    const first = (await L.rec(page, N2)).approvedAt;
    await tabB.locator('.pending-card', { hasText: T2 }).locator('.btn-approve').click(); await tabB.waitForTimeout(300);
    const staleMsg = await tabB.locator('.pending-card', { hasText: T2 }).locator('.action-result').innerText();
    log('E-T1', 'Same MM desk in two tabs: approve in A, then in stale B', 'B refused; A\'s approval stands', `B="${staleMsg}" approvedAt unchanged=${first === (await L.rec(page, N2)).approvedAt}`,
      /cannot/i.test(staleMsg) && first === (await L.rec(page, N2)).approvedAt);
    // Cross-role stale tab: Director tab opened before a role change in tab A.
    await tabB.close();

    /* ── Delegation and expiry (Maintenance Manager) ── */
    const TD = 'AUDIT-DLG-' + S, TDo = 'AUDIT-DLG-OPS-' + S;
    await L.as(page, 'employee');
    const ND = (await L.file(page, { title: TD, seg: SEG, type: 'sop', maint: true })).nums[0];
    const NDo = (await L.file(page, { title: TDo, seg: SEG, type: 'sop' })).nums[0];
    await L.as(page, 'qms');
    for (const t of [TD, TDo]) { d = await L.desk(page, SEG, t); await d.card.locator('.btn-approve').click(); await page.waitForTimeout(250); }
    await L.as(page, 'maintenance', SEG);
    await L.go(page, '/dashboard.html?id=' + SEG);
    const boxShown = await page.locator('#deleg-box').isVisible();
    await page.click('#deleg-open');
    await page.fill('#dg-to', 'Deputy Maint Engineer');
    await page.fill('#dg-reason', 'Annual leave, audit test');
    await page.click('#deleg-form button[type="submit"]'); await page.waitForTimeout(300);
    const dl = await page.evaluate(() => TAQA_DELEGATION.list());
    const mine = dl[dl.length - 1] || {};
    log('E-D1', 'MM grants a delegation from the desk', 'created; fromRole=maintenance; fromName names the MM, not the Director',
      `box=${boxShown} fromRole=${mine.fromRole} fromName="${mine.fromName}" segment=${mine.segment} approval=${mine.includesApproval}`,
      boxShown && mine.fromRole === 'maintenance' && !/Jahdali|Operations Lead/.test(mine.fromName || ''));
    await page.locator('#deleg-list .dr-use').last().click(); await page.waitForEvent('load').catch(() => {}); await page.waitForTimeout(400);
    const banner = await page.locator('.deleg-bar').innerText().catch(() => '');
    log('E-D2', '"Act as this" (the delegate)', 'orange banner names the grantor', banner.replace(/\s+/g, ' '), /Delegate for/.test(banner));
    d = await L.desk(page, SEG, TD);
    const dOps = await page.locator('.pending-card', { hasText: TDo }).count();
    log('E-D3', 'Delegate desk', 'maintenance document yes, Operations document no', `maint cards=${d.cards} ops cards=${dOps}`, d.cards === 1 && dOps === 0);
    await d.card.locator('.btn-approve').click(); await page.waitForTimeout(300);
    r = await L.rec(page, ND);
    log('E-D3', 'Delegate approves the maintenance SOP', 'approvedBy "<delegate> (delegate for <grantor>)"', r.approvedBy, r.status === 'current' && /Deputy Maint Engineer \(delegate for/.test(r.approvedBy || ''));
    log('E-D3', 'Grantor named in the signature', 'the Maintenance Manager', r.approvedBy, !/Jahdali/.test(r.approvedBy || ''));
    out = await page.evaluate((n) => TAQA_STORE.approve(n), NDo);
    log('E-D4', 'console: delegate approve() on the Operations SOP', 'refused (delegation is in the MM\'s department)', JSON.stringify(out), out.ok === false);
    const deleg = await page.evaluate(() => TAQA_ROLE.effective().delegate);
    log('E-D4', 'Delegate re-delegating', 'not allowed (delegate=false; box hidden)', `delegate=${deleg} box=${await page.locator('#deleg-box').isVisible()}`, deleg === false);
    // Can the door still be clicked while acting? (the banner is sticky at top:0)
    await L.shot(page, 'edges', 'd2-acting-banner');
    let doorClickable = true;
    try { await page.locator('#taqa-door .door-btn').click({ timeout: 2500 }); await page.keyboard.press('Escape'); } catch (e) { doorClickable = false; }
    const hit = await page.evaluate(() => { const b = document.querySelector('#taqa-door .door-btn').getBoundingClientRect(); const el = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return el ? (el.closest('.deleg-bar') ? 'deleg-bar' : el.className || el.tagName) : 'none'; });
    log('E-D5', 'Role door clickable while acting as a delegate (desktop)', 'clickable', `clickable=${doorClickable}; element on top of the door=${hit}`, doorClickable);
    // Role switching drops the delegation (keyboard reaches the door).
    await page.locator('#taqa-door .door-btn').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(200);
    await Promise.all([page.waitForEvent('load'), page.locator('#taqa-door .door-i[data-role="owner"]').click()]); await page.waitForTimeout(300);
    const after = await page.evaluate(() => ({ acting: TAQA_DELEGATION.actingAs(), banner: !!document.querySelector('.deleg-bar') }));
    log('E-D5', 'Switch role MM -> Director while acting', 'delegation dropped, no banner', JSON.stringify(after), !after.acting && !after.banner);
    // The Director's desk lists the MM's delegation (scoping check)
    await L.go(page, '/dashboard.html?id=' + SEG);
    const dirList = await page.locator('#deleg-list').innerText().catch(() => '');
    log('E-D6', 'Director desk: is the MM\'s delegation listed (and revocable) there?', 'not listed: it is not the Director\'s grant',
      `listed=${/Deputy Maint Engineer/.test(dirList)} revoke buttons=${await page.locator('#deleg-list [data-rev]').count()}`, !/Deputy Maint Engineer/.test(dirList));
    // Expiry: an expired grant (the form cannot make one; the store can)
    await L.as(page, 'maintenance', SEG);
    const exp = await page.evaluate(() => TAQA_DELEGATION.grant({ fromRole: 'maintenance', fromName: 'MM', to: 'Expired Deputy', reason: 'old', segment: 'coiled-tubing', from: '2020-01-01', until: '2020-01-05', includesApproval: true }));
    await L.go(page, '/dashboard.html?id=' + SEG);
    const expRow = page.locator('#deleg-list .deleg-row', { hasText: 'Expired Deputy' });
    const expTxt = await expRow.innerText().catch(() => '');
    const expAct = await expRow.locator('.dr-use').count();
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), exp.delegation.id);
    const expCur = await page.evaluate(() => TAQA_DELEGATION.current());
    log('E-D7', 'Expired delegation', 'marked expired, no "Act as this", current() null', `text="${expTxt.replace(/\s+/g, ' ')}" act=${expAct} current=${expCur}`, /expired/.test(expTxt) && expAct === 0 && expCur === null);
    // Area switch drops an active delegation too.
    const live = (await page.evaluate(() => TAQA_DELEGATION.list())).find((x) => x.to === 'Deputy Maint Engineer');
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), live.id);
    await L.go(page, '/index.html');
    await L.switchArea(page, 'drilling');
    log('E-D8', 'Area switch while acting', 'delegation dropped', `acting=${await page.evaluate(() => TAQA_DELEGATION.actingAs())}`, !(await page.evaluate(() => TAQA_DELEGATION.actingAs())));
    // A Director's delegate cannot approve maintenance.
    await L.as(page, 'owner', SEG);
    const g = await page.evaluate(() => TAQA_DELEGATION.grant({ fromRole: 'owner', fromName: 'CT Director', to: 'Ops Deputy', reason: 'test', segment: 'coiled-tubing', until: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10), includesApproval: true }));
    await page.evaluate((id) => TAQA_DELEGATION.actAs(id), g.delegation.id);
    const TM = 'AUDIT-DLG-M2-' + S;
    await page.evaluate((t) => { /* nothing */ }, TM);
    const can = await page.evaluate(() => { const x = TAQA_STORE.rows('awaiting-director', { segment: 'coiled-tubing' }); return x.map((d) => [d.docNumber, TAQA_APPROVAL.isMaintenance(d), TAQA_APPROVAL.canApprove(d)]); });
    log('E-D9', "Director's delegate: what can they approve?", 'Operations documents only', JSON.stringify(can), can.every(([, m, c]) => c === !m));
    await page.evaluate(() => TAQA_DELEGATION.actAs(null));

    /* ── Bulletin filed for a corporate function ── */
    const TF = 'AUDIT-MB-FN-' + S;
    await L.as(page, 'employee');
    f = await L.file(page, { title: TF, seg: 'qhse', type: 'bulletin' });
    const NF = f.nums[0];
    r = await L.rec(page, NF);
    log('E-F1', 'Upload offers Maintenance Bulletin for a function (QHSE)', 'not offered, or routed to a real approver',
      `filed ${NF}; maintenance row shown=${f.deptRow}; dept=${r && r.department}; isMaintenance=${r && r.isMaintenance}; approver=${r && r.approverFor}`, false);
    await L.as(page, 'qms');
    d = await L.desk(page, 'qhse', TF);
    if (d.cards) { await d.card.locator('.btn-approve').click(); await page.waitForTimeout(300); }
    const res = d.cards ? await d.card.locator('.action-result').innerText() : '(no card)';
    const who = {};
    for (const [role, area] of [['owner', 'qhse'], ['maintenance', 'qhse'], ['maintenance', SEG]]) {
      await L.as(page, role, area);
      who[role + '@' + area] = await page.evaluate((n) => TAQA_APPROVAL.canApprove(TAQA_STORE.findDoc(n)), NF);
    }
    log('E-F2', 'Who can release a bulletin filed for QHSE?', 'the QHSE Function Head, or nobody should be able to file it',
      `QMS message="${res}"; canApprove=${JSON.stringify(who)}`, who['owner@qhse'] === true);

    /* ── Legacy shape: bulletin with no department (Maintenance Bulletin logic only) ── */
    await L.as(page, 'qms');
    const NL = 'TQ-TWS-CTSS-MB-950';
    await page.evaluate((n) => TAQA_STORE.add({ docNumber: n, title: 'AUDIT-MB-LEGACY', segment: 'coiled-tubing', docType: 'bulletin', classification: 'internal', revision: '1.0', department: null }), NL);
    d = await L.desk(page, SEG, 'AUDIT-MB-LEGACY');
    const prevL = await d.card.locator('.pending-doc-preview').innerText();
    await d.card.locator('.btn-approve').click(); await page.waitForTimeout(300);
    const resL = await d.card.locator('.action-result').innerText();
    log('E-L1', 'Bulletin with department=null (identified by type only): QMS desk wording', 'card and result both name the Maintenance Manager',
      `preview="${prevL}" result="${resL}"`, /Maintenance Manager/.test(prevL) && /Maintenance Manager/.test(resL));
    await L.as(page, 'maintenance', SEG);
    d = await L.desk(page, SEG, 'AUDIT-MB-LEGACY');
    log('E-L2', 'Untagged bulletin reaches the MM desk', '1 card', `cards=${d.cards}`, d.cards === 1);
    await L.go(page, `/viewer.html?doc=${NL}&seg=${SEG}`);
    const authL = await page.evaluate(() => { const c = [...document.querySelectorAll('.meta-cell')].find((x) => /Approval authority/.test(x.textContent)); return c ? c.querySelector('.meta-val').textContent : 'none'; });
    log('E-L3', 'Viewer "Approval authority" for the untagged bulletin', 'Maintenance Manager', authL, /Maintenance Manager/.test(authL));

    /* ── Master List bulk confirm wording for a maintenance document ── */
    await L.as(page, 'employee');
    const TB = 'AUDIT-BULK-' + S;
    const NB = (await L.file(page, { title: TB, seg: SEG, type: 'sop', maint: true })).nums[0];
    await L.as(page, 'qms');
    await L.go(page, '/master-list.html');
    let msg = '';
    page.removeAllListeners('dialog');
    page.on('dialog', (x) => { msg = x.message(); x.accept(); });
    const box = page.locator(`input.row-chk[data-doc="${NB}"]`).first();
    await page.fill('#q', NB).catch(() => {});
    await page.waitForTimeout(400);
    let bulkOk = false;
    if (await box.count()) {
      await box.check();
      await page.click('#bulk-approve');
      await page.waitForTimeout(400);
      bulkOk = true;
    }
    const toast = await page.locator('#toast, .toast').first().innerText().catch(() => '');
    page.removeAllListeners('dialog'); page.on('dialog', (x) => x.accept());
    r = await L.rec(page, NB);
    log('E-B1', 'Master List bulk "Confirm" on a maintenance SOP: wording', 'says it goes to the Maintenance Manager',
      `row found=${bulkOk}; confirm="${msg}"; toast="${toast.replace(/\s+/g, ' ')}"; stage=${r.approvalStage}`, bulkOk && /Maintenance Manager/.test(msg));

    /* ── Home desk and bell for the MM ── */
    await L.as(page, 'maintenance', SEG);
    await L.go(page, '/index.html');
    const deskLine = await page.locator('#desk').innerText().catch(() => '');
    log('E-H1', 'Home desk line for the MM', 'counts only maintenance documents waiting', deskLine.replace(/\s+/g, ' ').slice(0, 200), /maintenance manager/i.test(deskLine));
    await L.as(page, 'qms');
    await L.go(page, '/index.html');
    const qDesk = await page.locator('#desk').innerText().catch(() => '');
    log('E-H2', 'Home desk line for QMS', 'QMS checks first: no "approved and waiting on your countersignature"', qDesk.replace(/\s+/g, ' ').slice(0, 200), !/approved and waiting on your countersignature/.test(qDesk));

    log('E-ERR', 'Uncaught page errors during the run', '0', errors.length ? errors.join(' | ') : 0, errors.length === 0);
  } catch (e) {
    console.error('SCRIPT ERROR', e);
    R.log('SCRIPT', 'script error', 'none', e.message, false);
  } finally {
    R.save();
    await browser.close();
  }
})();
