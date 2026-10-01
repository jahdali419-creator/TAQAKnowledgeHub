// Two separate end-to-end journeys, Operations and Maintenance, by real UI
// actions, at one viewport. Usage: node journeys.js desktop|phone
const L = require('./lib');
const mode = process.argv[2] || 'desktop';
const VP = mode === 'phone' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const R = L.recorder('journeys-' + mode);
const SEG = 'coiled-tubing';
const STAMP = new Date().toISOString().replace(/\D/g, '').slice(0, 12);

(async () => {
  const { browser, page, errors } = await L.launch(VP, mode === 'phone');
  const log = R.log;
  const P = mode === 'phone' ? 'P' : 'D';
  try {
    await L.fresh(page);

    /* ══════════ Journey 1: Operations ══════════ */
    const T1 = `AUDIT-OPS-${mode}-${STAMP}`;
    let who = await L.as(page, 'employee');
    log(P + '-O1', 'Employee: role via the door', 'employee', who.role, who.role === 'employee');
    let f = await L.file(page, { title: T1, seg: SEG, type: 'sop' });
    const N1 = f.nums[0];
    log(P + '-O1', 'Employee files an Operations SOP through Upload (box left unticked)', '1 record, toast names QMS then Director',
      `${f.nums.length} record ${N1}; maintenance box shown=${f.deptRow}; toast="${f.toast}"`, f.nums.length === 1 && /QMS checks it, then the Director/.test(f.toast));
    let r = await L.rec(page, N1);
    log(P + '-O1', 'Record after filing', 'draft / qms / Employee / not maintenance', `${r.status}/${r.approvalStage}/${r.submittedBy}/maint=${r.isMaintenance}/approver=${r.approverFor}`,
      r.status === 'draft' && r.approvalStage === 'qms' && r.submittedBy === 'Employee' && !r.isMaintenance);
    await L.shot(page, mode, 'o1-employee-filed');

    // Wrong stage: the Director cannot approve before QMS has checked.
    await L.as(page, 'owner', SEG);
    let d = await L.desk(page, SEG, T1);
    log(P + '-O2', 'Director desk before QMS check (wrong stage)', 'no card for it', `cards=${d.cards}`, d.cards === 0);

    // QMS check
    await L.as(page, 'qms');
    d = await L.desk(page, SEG, T1);
    log(P + '-O3', 'QMS desk shows it', '1 card, "Submitted by Employee"', `heading="${d.heading}" cards=${d.cards}`, d.cards === 1 && /QMS Check/.test(d.heading));
    await d.card.locator('.btn-approve').click();
    await page.waitForTimeout(300);
    const res1 = await d.card.locator('.action-result').innerText();
    r = await L.rec(page, N1);
    log(P + '-O3', 'QMS clicks Confirm', 'stage=director, message names the Director', `"${res1}" stage=${r.approvalStage} by=${r.countersignedBy}`,
      r.approvalStage === 'director' && /Director/.test(res1));
    await L.shot(page, mode, 'o3-qms-confirmed');

    // Cross-department: the Maintenance Manager of the same segment cannot approve it.
    await L.as(page, 'maintenance', SEG);
    d = await L.desk(page, SEG, T1);
    log(P + '-O4', 'Maintenance Manager (same segment) desk', 'no card for an Operations SOP', `refused=${d.refused} cards=${d.cards} heading="${d.heading}"`, !d.refused && d.cards === 0);
    let out = await page.evaluate((n) => TAQA_STORE.approve(n), N1);
    log(P + '-O4', 'console: Maintenance Manager calls approve() on the Operations SOP', 'refused', JSON.stringify(out), out.ok === false);
    out = await page.evaluate((n) => TAQA_STORE.reject(n, 'Trying to reject an Operations SOP as MM'), N1);
    log(P + '-O4', 'console: Maintenance Manager calls reject() on it', 'refused', JSON.stringify(out), out.ok === false);

    // Director approves
    await L.as(page, 'owner', SEG);
    d = await L.desk(page, SEG, T1);
    log(P + '-O5', 'Director desk', '1 card', `heading="${d.heading}" cards=${d.cards}`, d.cards === 1);
    await d.card.locator('.btn-approve').dblclick();
    await page.waitForTimeout(400);
    r = await L.rec(page, N1);
    log(P + '-O5', 'Director double-clicks Approve', 'current, approvedBy Segment Director, once', `${r.status} by=${r.approvedBy} at=${r.approvedAt}`, r.status === 'current' && r.approvedBy === 'Segment Director');
    const at1 = r.approvedAt;
    out = await page.evaluate((n) => TAQA_STORE.approve(n), N1);
    log(P + '-O5', 'console: approve again', 'refused, approvedAt unchanged', JSON.stringify(out), out.ok === false && (await L.rec(page, N1)).approvedAt === at1);
    await page.reload(); await page.waitForTimeout(300);
    log(P + '-O5', 'Refresh the desk', 'card gone', `cards=${await page.locator('.pending-card', { hasText: T1 }).count()}`, (await page.locator('.pending-card', { hasText: T1 }).count()) === 0);
    await L.go(page, `/viewer.html?doc=${N1}&seg=${SEG}`);
    await page.goBack(); await page.waitForTimeout(400);
    const backCards = await page.locator('.pending-card', { hasText: T1 }).count();
    await page.goForward(); await page.waitForTimeout(400);
    log(P + '-O5', 'Back to the desk, then Forward', 'no stale card on Back', `cards on Back=${backCards}, Forward url=${page.url().replace(L.BASE, '')}`, backCards === 0);

    // Published
    await L.as(page, 'employee');
    await L.go(page, `/segment.html?id=${SEG}&tab=sops`);
    const onOps = await L.shows(page, '#panel-sops', T1);
    await L.go(page, `/segment.html?id=${SEG}&dept=maintenance&tab=sops`);
    const onMnt = await L.shows(page, '#panel-sops', T1, 1500);
    log(P + '-O6', 'Published: Employee sees it on Operations shelf only', 'Operations yes, Maintenance no', `ops=${onOps} mnt=${onMnt}`, onOps && !onMnt);
    await L.go(page, `/viewer.html?doc=${N1}&seg=${SEG}`);
    const meta1 = await page.locator('#meta-grid').innerText();
    log(P + '-O6', 'Viewer as Employee', 'Current, OK to use', /Current, OK to use/.test(meta1) ? 'Current, OK to use' : meta1.slice(0, 120), /Current, OK to use/.test(meta1));
    await L.shot(page, mode, 'o6-published-viewer');

    // Auditor
    await L.as(page, 'auditor');
    await L.go(page, '/master-list.html');
    const mlRefused = await L.refused(page);
    await page.fill('#q', N1).catch(() => {});
    await page.waitForTimeout(400);
    const mlRow = await page.locator('body').innerText();
    log(P + '-O7', 'Auditor opens the Master List and finds it', 'opens; row present', `refused=${mlRefused} found=${mlRow.includes(N1)}`, !mlRefused && mlRow.includes(N1));
    await L.go(page, `/viewer.html?doc=${N1}&seg=${SEG}`);
    const trail1 = await page.locator('#appr-trail').innerText();
    log(P + '-O7', 'Auditor reads the trail', 'Employee, QMS, Segment Director', trail1.replace(/\s+/g, ' ').slice(0, 260),
      /Employee/.test(trail1) && /QMS/.test(trail1) && /Segment Director/.test(trail1) && !/Maintenance Manager/.test(trail1));
    out = await page.evaluate((n) => [TAQA_STORE.setStatus(n, 'obsolete'), TAQA_STORE.patch(n, { title: 'x' }).ok, TAQA_STORE.add({ title: 'aud' })], N1);
    log(P + '-O7', 'console: Auditor withdraw/edit/file', 'all refused', JSON.stringify(out), out[0] === null && out[1] === false && out[2] === null);
    await L.shot(page, mode, 'o7-auditor-trail');

    /* ══════════ Journey 2: Maintenance (department = maintenance) ══════════ */
    const T2 = `AUDIT-MNT-${mode}-${STAMP}`;
    await L.as(page, 'employee');
    f = await L.file(page, { title: T2, seg: SEG, type: 'sop', maint: true });
    const N2 = f.nums[0];
    r = await L.rec(page, N2);
    log(P + '-M1', 'Employee files a Maintenance SOP (ticks "Maintenance department document")', '1 record, department=maintenance',
      `${f.nums.length} ${N2} dept=${r.department} box=${JSON.stringify(f.boxState)} toast="${f.toast}"`, f.nums.length === 1 && r.department === 'maintenance');
    log(P + '-M1', 'Upload toast for a maintenance document', 'names the Maintenance Manager as final approver', f.toast, /Maintenance Manager/.test(f.toast));
    const subs2 = await page.locator('#my-subs-list li', { hasText: T2 }).innerText().catch(() => '');
    log(P + '-M1', '"Your submissions" line', 'Waiting on QMS check', subs2.replace(/\s+/g, ' '), /QMS/.test(subs2));
    log(P + '-M1', 'Record after filing', 'draft/qms, approver Maintenance Manager', `${r.status}/${r.approvalStage}/approver=${r.approverFor}`, r.status === 'draft' && r.approvalStage === 'qms' && r.approverFor === 'Maintenance Manager');

    await L.as(page, 'maintenance', SEG);
    d = await L.desk(page, SEG, T2);
    log(P + '-M2', 'Maintenance Manager desk before QMS (wrong stage)', 'no card', `cards=${d.cards} heading="${d.heading}"`, d.cards === 0);
    out = await page.evaluate((n) => TAQA_STORE.approve(n), N2);
    log(P + '-M2', 'console: MM approve() before QMS', 'refused', JSON.stringify(out), out.ok === false);

    await L.as(page, 'qms');
    d = await L.desk(page, SEG, T2);
    const prev2 = await d.card.locator('.pending-doc-preview').innerText().catch(() => '');
    log(P + '-M3', 'QMS desk card', 'says it goes to the Maintenance Manager', prev2, /Maintenance Manager/.test(prev2));
    await d.card.locator('.btn-approve').click(); await page.waitForTimeout(300);
    const res2 = await d.card.locator('.action-result').innerText();
    r = await L.rec(page, N2);
    log(P + '-M3', 'QMS Confirm', 'stage=director, message names the Maintenance Manager', `"${res2}" stage=${r.approvalStage} waitingOn=${r.waitingOn}`,
      r.approvalStage === 'director' && /Maintenance Manager/.test(res2));

    // The Director of the same segment cannot approve it.
    await L.as(page, 'owner', SEG);
    d = await L.desk(page, SEG, T2);
    log(P + '-M4', 'Segment Director (same segment) desk', 'no card for a maintenance SOP', `cards=${d.cards}`, d.cards === 0);
    out = await page.evaluate((n) => [TAQA_STORE.approve(n), TAQA_STORE.reject(n, 'Director tries to reject maintenance')], N2);
    log(P + '-M4', 'console: Director approve()/reject() on it', 'both refused', JSON.stringify(out), out[0].ok === false && out[1].ok === false);
    // Another segment's Maintenance Manager.
    await L.as(page, 'maintenance', 'drilling');
    d = await L.desk(page, SEG, T2);
    log(P + '-M5', 'Drilling Maintenance Manager opens Coiled Tubing desk by URL (wrong segment)', 'refused', `refused=${d.refused}`, d.refused === true);
    await L.go(page, '/index.html');
    out = await page.evaluate((n) => TAQA_STORE.approve(n), N2);
    log(P + '-M5', 'console: Drilling MM approve()', 'refused', JSON.stringify(out), out.ok === false);

    // Area switching: back to Coiled Tubing through the door, on the desk.
    await L.go(page, '/dashboard.html?id=drilling');
    await L.switchArea(page, SEG);
    log(P + '-M6', 'MM switches area to Coiled Tubing from the Drilling desk', 'lands on the Coiled Tubing desk', page.url().replace(L.BASE, ''), /dashboard\.html\?id=coiled-tubing/.test(page.url()));
    d = await L.desk(page, SEG, T2);
    log(P + '-M6', 'Coiled Tubing MM desk', '1 card, heading Awaiting Your Approval', `cards=${d.cards} heading="${d.heading}"`, d.cards === 1);
    const prevM = await d.card.locator('.pending-doc-preview').innerText();
    log(P + '-M6', 'Card wording for the MM', 'your approval as Maintenance Manager', prevM, /Maintenance Manager/.test(prevM));
    await L.shot(page, mode, 'm6-mm-desk');
    await d.card.locator('.btn-approve').dblclick(); await page.waitForTimeout(400);
    r = await L.rec(page, N2);
    log(P + '-M7', 'MM double-clicks Approve', 'current, approvedBy Maintenance Manager', `${r.status} by=${r.approvedBy}`, r.status === 'current' && r.approvedBy === 'Maintenance Manager');
    await page.reload(); await page.waitForTimeout(300);
    log(P + '-M7', 'Refresh', 'card gone', `cards=${await page.locator('.pending-card', { hasText: T2 }).count()}`, (await page.locator('.pending-card', { hasText: T2 }).count()) === 0);

    await L.as(page, 'employee');
    await L.go(page, `/segment.html?id=${SEG}&dept=maintenance&tab=sops`);
    const m2 = await L.shows(page, '#panel-sops', T2);
    await L.go(page, `/segment.html?id=${SEG}&tab=sops`);
    const o2 = await L.shows(page, '#panel-sops', T2, 1500);
    log(P + '-M8', 'Published: shelf', 'Maintenance yes, Operations no', `mnt=${m2} ops=${o2}`, m2 && !o2);
    await L.go(page, `/viewer.html?doc=${N2}&seg=${SEG}`);
    const bc = await page.locator('#bc-seg').getAttribute('href').catch(() => '');
    log(P + '-M8', 'Viewer breadcrumb returns to the Maintenance side', 'dept=maintenance in the link', /dept=maintenance/.test(bc) ? 'yes' : bc.slice(0, 160), /dept=maintenance/.test(bc));
    const meta2 = await page.locator('#meta-grid').innerText();
    const auth2 = await page.evaluate(() => { const c = [...document.querySelectorAll('.meta-cell')].find((x) => /Approval authority/.test(x.textContent)); return c ? c.querySelector('.meta-val').textContent : 'no Approval authority cell'; });
    log(P + '-M8', 'Viewer as Employee', 'Current; Approval authority = Maintenance Manager', `${/Current, OK to use/.test(meta2) ? 'Current, OK to use' : meta2.slice(0, 80)}; authority="${auth2}"`, /Current, OK to use/.test(meta2) && /Maintenance Manager/.test(auth2));

    await L.as(page, 'auditor');
    await L.go(page, `/viewer.html?doc=${N2}&seg=${SEG}`);
    const trail2 = await page.locator('#appr-trail').innerText();
    log(P + '-M9', 'Auditor reads the maintenance trail', 'Employee, QMS, Maintenance Manager (not Director)', trail2.replace(/\s+/g, ' ').slice(0, 260),
      /Employee/.test(trail2) && /QMS/.test(trail2) && /Maintenance Manager/.test(trail2) && !/Segment Director/.test(trail2));
    await L.shot(page, mode, 'm9-auditor-trail');

    /* ══════════ Journey 2b: Maintenance Bulletin ══════════ */
    const T3 = `AUDIT-MB-${mode}-${STAMP}`;
    await L.as(page, 'employee');
    f = await L.file(page, { title: T3, seg: SEG, type: 'bulletin' });
    const N3 = f.nums[0];
    r = await L.rec(page, N3);
    log(P + '-B1', 'Employee files a Maintenance Bulletin', 'box ticked and locked; number …-MB-…; department=maintenance',
      `${N3} box=${JSON.stringify(f.boxState)} dept=${r.department}`, /-MB-/.test(N3 || '') && f.boxState && f.boxState.checked && f.boxState.disabled && r.department === 'maintenance');
    await L.as(page, 'qms');
    d = await L.desk(page, SEG, T3);
    await d.card.locator('.btn-approve').click(); await page.waitForTimeout(300);
    const res3 = await d.card.locator('.action-result').innerText();
    log(P + '-B2', 'QMS Confirm on the bulletin', 'names the Maintenance Manager', res3, /Maintenance Manager/.test(res3));
    await L.as(page, 'owner', SEG);
    d = await L.desk(page, SEG, T3);
    out = await page.evaluate((n) => TAQA_STORE.approve(n), N3);
    log(P + '-B3', 'Director: bulletin', 'no card; approve() refused', `cards=${d.cards} ${JSON.stringify(out)}`, d.cards === 0 && out.ok === false);
    await L.as(page, 'maintenance', SEG);
    d = await L.desk(page, SEG, T3);
    await d.card.locator('.btn-approve').click(); await page.waitForTimeout(300);
    r = await L.rec(page, N3);
    log(P + '-B4', 'MM approves the bulletin from the desk', 'current, approvedBy Maintenance Manager', `${r.status} ${r.approvedBy}`, r.status === 'current' && r.approvedBy === 'Maintenance Manager');
    await L.go(page, `/segment.html?id=${SEG}&tab=bulletins`);
    const bl = await L.shows(page, '#panel-bulletins', T3);
    log(P + '-B4', 'Bulletins shelf', 'shows it (lands on the Maintenance side)', `found=${bl} url=${page.url().replace(L.BASE, '')}`, bl);

    console.log('\nJS errors:', errors.length ? errors : 'none');
    R.log(P + '-ERR', 'Uncaught page errors during the run', '0', errors.length, errors.length === 0);
  } catch (e) {
    console.error('SCRIPT ERROR', e);
    R.log('SCRIPT', 'script error', 'none', e.message, false);
  } finally {
    R.save();
    await browser.close();
  }
})();
