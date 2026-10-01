// Five-persona tour: every page by direct address and every control action,
// per role, at one viewport. Usage: node tour.js desktop|phone
// Fixture records are created through the store by the role that may create
// them (the same call the page makes), so each role starts from one state.
const L = require('./lib');
const fs = require('fs');
const path = require('path');
const mode = process.argv[2] || 'desktop';
const VP = mode === 'phone' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const OWN = 'coiled-tubing', OTHER = 'drilling';
const ROLES = ['employee', 'qms', 'owner', 'maintenance', 'auditor'];

const FIX = {
  opsQ: 'TQ-TWS-CTSS-SOP-801', opsD: 'TQ-TWS-CTSS-SOP-802', mntD: 'TQ-TWS-CTSS-SOP-803',
  opsPub: 'TQ-TWS-CTSS-SOP-804', mntPub: 'TQ-TWS-CTSS-SOP-805', mbD: 'TQ-TWS-CTSS-MB-806',
};

async function seed(page) {
  await L.fresh(page);
  await page.evaluate((F) => {
    const add = (n, t, extra) => TAQA_STORE.add(Object.assign({ docNumber: n, title: t, segment: 'coiled-tubing', docType: 'sop', classification: 'internal', revision: '1.0' }, extra || {}));
    localStorage.setItem('taqa-demo-role', 'employee');
    add(F.opsQ, 'TOUR ops at QMS');
    add(F.opsD, 'TOUR ops at final');
    add(F.mntD, 'TOUR maint at final', { department: 'maintenance' });
    add(F.opsPub, 'TOUR ops published');
    add(F.mntPub, 'TOUR maint published', { department: 'maintenance' });
    add(F.mbD, 'TOUR bulletin at final', { docType: 'bulletin', department: 'maintenance' });
    localStorage.setItem('taqa-demo-role', 'qms');
    [F.opsD, F.mntD, F.opsPub, F.mntPub, F.mbD].forEach((n) => TAQA_STORE.countersign(n, 'QMS'));
    localStorage.setItem('taqa-demo-role', 'owner'); localStorage.setItem('taqa-demo-area', 'coiled-tubing');
    TAQA_STORE.approve(F.opsPub, 'Director');
    localStorage.setItem('taqa-demo-role', 'maintenance');
    TAQA_STORE.approve(F.mntPub, 'MM');
    localStorage.setItem('taqa-demo-role', 'employee');
  }, FIX);
}

const PAGES = [
  ['Home', '/index.html'],
  ['Segment, Operations side', `/segment.html?id=${OWN}`],
  ['Segment, Maintenance side', `/segment.html?id=${OWN}&dept=maintenance`],
  ['Search', '/ai-search.html'],
  ['Field Glossary', '/glossary.html'],
  ['Ask Expert', '/support-ticket.html'],
  ['Viewer, published (Ops)', `/viewer.html?doc=${FIX.opsPub}&seg=${OWN}`],
  ['Viewer, published (Maint)', `/viewer.html?doc=${FIX.mntPub}&seg=${OWN}`],
  ['Upload', '/upload.html'],
  ['Desk, own area', `/dashboard.html?id=${OWN}`],
  ['Desk, other area', `/dashboard.html?id=${OTHER}`],
  ['Published list, own area', `/documents.html?id=${OWN}`],
  ['Published list, other area', `/documents.html?id=${OTHER}`],
  ['Master List', '/master-list.html'],
  ['Analytics', '/analytics.html'],
  ['About / What\'s new', '/whats-new.html'],
];

(async () => {
  const { browser, page, errors } = await L.launch(VP, mode === 'phone');
  const matrix = {}; // key -> role -> {v, note}
  const set = (k, role, v, note) => { (matrix[k] = matrix[k] || {})[role] = { v, note: note || '' }; };
  try {
    for (const role of ROLES) {
      await seed(page);
      await L.as(page, role, (role === 'owner' || role === 'maintenance') ? OWN : undefined);
      // Home and menu evidence
      await L.go(page, '/index.html');
      await L.shot(page, 'tour-' + mode, role + '-home');
      if (mode === 'phone') { await L.openMenu(page); await L.shot(page, 'tour-' + mode, role + '-menu'); await page.keyboard.press('Escape'); }
      const nav = mode === 'phone'
        ? await page.evaluate(() => [...document.querySelectorAll('#nav-mobile-menu a')].map((a) => a.textContent.trim()).filter(Boolean))
        : await page.evaluate(() => [...document.querySelectorAll('#navbar a')].map((a) => a.textContent.trim()).filter(Boolean));
      set('Navigation shows', role, 'INFO', nav.join(' · '));

      for (const [name, url] of PAGES) {
        await L.go(page, url);
        const ref = await L.refused(page);
        let note = '';
        if (!ref && /viewer/.test(url)) note = (await page.locator('#meta-grid').innerText().catch(() => '')).split('\n').slice(0, 2).join(' ');
        if (!ref && /dashboard/.test(url)) note = await page.locator('#queue-title').innerText().catch(() => '');
        set('Open: ' + name, role, ref ? 'REFUSED' : 'ALLOWED', note);
      }
      // Someone else's draft: drafts that shipped in the register (a locally
      // filed draft always counts as this browser's own, there is no identity).
      for (const [key, n, seg] of [["Read someone else's draft, own area", 'TQ-TWS-CTSS-S005', OWN], ["Read someone else's draft, other area", 'TQ-TWS-FS-SOP-002', 'fracturing']]) {
        await L.go(page, `/viewer.html?doc=${n}&seg=${seg}`);
        const st = await page.locator('#meta-grid').innerText().catch(() => '');
        const withheld = /Access restricted|Not available to your role/i.test(await page.locator('body').innerText());
        set(key, role, withheld ? 'REFUSED' : 'ALLOWED', st.split('\n').slice(0, 2).join(' '));
      }

      // Actions: UI affordance + the store's answer
      await L.go(page, '/upload.html');
      const upRef = await L.refused(page);
      await L.go(page, '/index.html');
      const added = await page.evaluate(() => !!TAQA_STORE.add({ title: 'TOUR probe', segment: 'coiled-tubing', docType: 'sop' }));
      set('File a document', role, (!upRef && added) ? 'ALLOWED' : (upRef && !added) ? 'REFUSED' : 'DEFECT', `page ${upRef ? 'refused' : 'opens'}; store add ${added ? 'accepted' : 'refused'}`);

      const desk = async (title) => {
        await L.go(page, `/dashboard.html?id=${OWN}`);
        if (await L.refused(page)) return { btn: 0 };
        return { btn: await page.locator('.pending-card', { hasText: title }).locator('.btn-approve').count() };
      };
      const q = await desk('TOUR ops at QMS');
      await L.go(page, '/index.html');
      const cs = await page.evaluate((n) => TAQA_STORE.countersign(n).ok, FIX.opsQ);
      set('QMS check (countersign)', role, cs && q.btn ? 'ALLOWED' : !cs && !q.btn ? 'REFUSED' : 'DEFECT', `desk button=${q.btn}, store=${cs}`);

      for (const [key, n, t] of [['Approve Operations SOP (own area)', FIX.opsD, 'TOUR ops at final'], ['Approve Maintenance SOP (own area)', FIX.mntD, 'TOUR maint at final'], ['Approve Maintenance Bulletin (own area)', FIX.mbD, 'TOUR bulletin at final']]) {
        const dsk = await desk(t);
        await L.go(page, '/index.html');
        const ok = await page.evaluate((x) => TAQA_STORE.approve(x).ok, n);
        set(key, role, ok && dsk.btn ? 'ALLOWED' : !ok && !dsk.btn ? 'REFUSED' : 'DEFECT', `desk button=${dsk.btn}, store=${ok}`);
      }
      // Approve in another area: the Drilling equivalents
      await L.go(page, '/index.html');
      const other = await page.evaluate(() => {
        const r = {};
        for (const [n, dept] of [['TQ-TDS-DSS-SOP-901', null], ['TQ-TDS-DSS-SOP-902', 'maintenance']]) {
          const d = { docNumber: n, title: 'x', segment: 'drilling', docType: 'sop', status: 'draft', approvalStage: 'director', department: dept };
          r[dept || 'ops'] = TAQA_APPROVAL.canApprove(d);
        }
        return r;
      });
      set('Approve in another area (Drilling)', role, (other.ops || other.maintenance) ? 'ALLOWED' : 'REFUSED', JSON.stringify(other));

      // Withdraw published documents (documents.html button + store)
      await L.go(page, `/documents.html?id=${OWN}`);
      const docRef = await L.refused(page);
      const wBtns = docRef ? 0 : await page.locator('button', { hasText: /Withdraw/ }).count();
      await L.go(page, '/index.html');
      const wOps = await page.evaluate((n) => !!TAQA_STORE.setStatus(n, 'obsolete'), FIX.opsPub);
      const wMnt = await page.evaluate((n) => !!TAQA_STORE.setStatus(n, 'obsolete'), FIX.mntPub);
      set('Withdraw published Operations doc (own area)', role, wOps ? 'ALLOWED' : 'REFUSED', `documents.html ${docRef ? 'refused' : 'withdraw buttons=' + wBtns}; store=${wOps}`);
      set('Withdraw published Maintenance doc (own area)', role, wMnt ? 'ALLOWED' : 'REFUSED', `store=${wMnt}`);
      const ed = await page.evaluate((n) => TAQA_STORE.patch(n, { summary: 'tour edit' }).ok, FIX.opsQ);
      set('Edit record details (own area)', role, ed ? 'ALLOWED' : 'REFUSED', `store patch=${ed}`);
      const lc = await page.evaluate((n) => TAQA_STORE.patch(n, { status: 'current' }).ok, FIX.opsQ);
      set('Write a lifecycle field by editing', role, lc ? 'DEFECT' : 'REFUSED', `patch status=${lc}`);

      // Reject at final (needs a fresh doc at final in the right dept)
      const rj = await page.evaluate(() => {
        const mk = (n, dept) => { localStorage.setItem('taqa-x', '1'); return n; };
        return null;
      });
      // Export, Master List bulk, delegation
      await L.go(page, '/master-list.html');
      const mlRef = await L.refused(page);
      const exp = mlRef ? false : await page.locator('#export-btn').isVisible().catch(() => false);
      set('Export F086 register', role, exp ? 'ALLOWED' : 'REFUSED', mlRef ? 'Master List refused' : `export button visible=${exp}`);
      const bulk = mlRef ? false : await page.evaluate(() => typeof canBulk === 'function' && canBulk());
      set('Master List bulk actions', role, bulk ? 'ALLOWED' : 'REFUSED', `canBulk=${bulk}`);
      await L.go(page, `/dashboard.html?id=${OWN}`);
      const dRef = await L.refused(page);
      const dBox = dRef ? false : await page.locator('#deleg-box').isVisible();
      await L.go(page, '/index.html');
      const g = await page.evaluate((r) => TAQA_DELEGATION.grant({ fromRole: r, to: 'X', reason: 'r', until: new Date(Date.now() + 864e5 * 3).toISOString().slice(0, 10), includesApproval: true }).ok, role);
      set('Delegate authority', role, (dBox && g) ? 'ALLOWED' : (!dBox && !g) ? 'REFUSED' : 'DEFECT', `desk box=${dBox}, grant=${g}`);
    }
    // Reject per role, own clean state each time
    for (const role of ROLES) {
      await seed(page);
      await L.as(page, role, (role === 'owner' || role === 'maintenance') ? OWN : undefined);
      await L.go(page, '/index.html');
      const r = await page.evaluate((F) => ({
        qms: TAQA_STORE.reject(F.opsQ, 'Tour rejection reason, long enough').ok,
        ops: TAQA_STORE.reject(F.opsD, 'Tour rejection reason, long enough').ok,
        mnt: TAQA_STORE.reject(F.mntD, 'Tour rejection reason, long enough').ok,
      }), FIX);
      set('Reject at QMS step', role, r.qms ? 'ALLOWED' : 'REFUSED', '');
      set('Reject Operations SOP at final step', role, r.ops ? 'ALLOWED' : 'REFUSED', '');
      set('Reject Maintenance SOP at final step', role, r.mnt ? 'ALLOWED' : 'REFUSED', '');
    }
  } catch (e) {
    console.error('SCRIPT ERROR', e); set('SCRIPT', 'error', 'DEFECT', e.message);
  } finally {
    set('Uncaught page errors', 'all', errors.length ? 'DEFECT' : 'NONE', errors.join(' | '));
    fs.writeFileSync(path.join(__dirname, 'tour-' + mode + '.json'), JSON.stringify(matrix, null, 2));
    for (const [k, v] of Object.entries(matrix)) console.log(k.padEnd(48), ROLES.map((r) => (v[r] ? v[r].v : '-').padEnd(8)).join(' '));
    await browser.close();
  }
})();
