// Narrow integrity close-out (October 2026), under the owner's approved
// business decisions (docs/RISE-BUSINESS-DECISIONS.md).
//
//   PI-17  The approvals bell's "Open your queue" reaches the signer's own
//          desk from any page, and never a desk that refuses them (BD-02).
//   PI-23  The document page takes its area from the record, never a guessed
//          one, and its share link, QR code and bookmark carry the record's
//          own identity (BD-01).
//   PI-22  An exact number or legacy ID of a withdrawn document says what it
//          is ("Superseded. Do not use."), never "no such document", and
//          never makes it look current. Permission-trimmed (BD-03).
//   PI-27  A user who may not open a restricted or confidential document
//          sees neither its title nor its metadata, in lists, counts,
//          search, bookmarks or the document page (BD-03).
//
// Everything here is the prototype filtering its own demonstration data in
// the browser. It is not security: in production Microsoft 365 / the server
// trims what it returns (PRODUCTION CONTROL REQUIRED).
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');
const { computeBaseline } = require('./helpers/baseline');

const CT = 'coiled-tubing';
const SOP011 = { n: 'TQ-TWS-CTSS-SOP-011', t: 'Logging While CT SOP' };             // current, internal, Coiled Tubing
const RESTRICTED = { n: 'TQ-TWS-CTSS-SOP-002', t: 'BHA Assembly Procedure' };       // current, restricted
const SUPERSEDED = { n: 'TQ-TWS-CTSS-SOP-003', t: 'Well Entry Protocol' };          // superseded, internal, names "Rev 4.0"
const OBSOLETE = { n: 'TQ-TWS-CTSS-SOP-012', legacy: 'CT-012' };                    // obsolete, internal
const GONE_RESTRICTED = { n: 'TQ-TWS-CTSS-ALT-001' };                               // obsolete, restricted

async function start(page, gotoApp, clearAppState, setRole, role = 'employee', area = CT) {
  await gotoApp('/index.html');
  await clearAppState();
  await page.evaluate(() => {
    localStorage.setItem('taqa-tour-done', '1');
    localStorage.setItem('taqa-install-dismissed', String(Date.now()));
  });
  await setRole(role, area);
}

// ── PI-17 ────────────────────────────────────────────────────────────────
test.describe('PI-17: "Open your queue" reaches the signer\'s own desk', () => {
  // An Employee files one Operations and one Maintenance document in Coiled
  // Tubing and one in Drilling; QMS checks all three, so each waits on its
  // area's final approver.
  async function seedFinal(page, gotoApp, clearAppState, setRole) {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await page.evaluate(() => {
      TAQA_STORE.add({ title: 'PI17 ct ops', segment: 'coiled-tubing', docType: 'sop', docNumber: 'TQ-TWS-CTSS-SOP-961', summary: 'x' });
      TAQA_STORE.add({ title: 'PI17 ct mx', segment: 'coiled-tubing', docType: 'sop', docNumber: 'TQ-TWS-CTSS-SOP-962', summary: 'x', department: 'maintenance' });
      TAQA_STORE.add({ title: 'PI17 drilling ops', segment: 'drilling', docType: 'sop', docNumber: 'TQ-TDS-DSS-SOP-961', summary: 'x' });
    });
    await setRole('qms', CT);
    await page.evaluate(() => ['TQ-TWS-CTSS-SOP-961', 'TQ-TWS-CTSS-SOP-962', 'TQ-TDS-DSS-SOP-961']
      .forEach((n) => TAQA_STORE.countersign(n)));
  }

  for (const c of [
    { role: 'owner', mine: 'TQ-TWS-CTSS-SOP-961', label: 'Segment Director' },
    { role: 'maintenance', mine: 'TQ-TWS-CTSS-SOP-962', label: 'Maintenance Manager' },
  ]) {
    test(`${c.label} of Coiled Tubing, reading Drilling's page, lands on their own desk with the badge's document`, async ({ page, gotoApp, setRole, clearAppState, consoleErrors }) => {
      await seedFinal(page, gotoApp, clearAppState, setRole);
      await setRole(c.role, CT);
      await gotoApp('/segment.html?id=drilling');
      await page.locator('#nav-bell').click();
      await expect(page.locator('.bell-menu')).toBeVisible();
      await expect(page.locator('.bell-menu')).toContainText(c.mine);
      await page.locator('.bell-foot').click();
      await expect(page).toHaveURL(/dashboard\.html\?id=coiled-tubing$/);
      expect(await page.evaluate(() => document.documentElement.hasAttribute('data-taqa-refused'))).toBe(false);
      await expect(page.locator('body')).toContainText(c.mine);
      // Drilling's document is not this signer's, and is not on their desk.
      await expect(page.locator('body')).not.toContainText('TQ-TDS-DSS-SOP-961');
      assertNoConsoleErrors(consoleErrors);
    });
  }

  test('QMS still opens the company-wide Waiting on QMS view from another area', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await page.evaluate(() => TAQA_STORE.add({ title: 'PI17 qms', segment: 'drilling', docType: 'sop', docNumber: 'TQ-TDS-DSS-SOP-962', summary: 'x' }));
    await setRole('qms', CT);
    await gotoApp('/segment.html?id=drilling');
    await page.locator('#nav-bell').click();
    await page.locator('.bell-foot').click();
    await expect(page).toHaveURL(/master-list\.html\?view=qms$/);
  });

  test('an Employee has no bell, and another area\'s desk still refuses them', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/segment.html?id=drilling');
    await expect(page.locator('#nav-bell')).toBeHidden();
    await gotoApp('/dashboard.html?id=coiled-tubing');
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-taqa-refused'))).toBe(true);
  });

  test('the desk\'s own check is unchanged: a Director opening another area\'s desk by URL is refused', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'owner', CT);
    await gotoApp('/dashboard.html?id=drilling');
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-taqa-refused'))).toBe(true);
  });
});

// ── PI-23 ────────────────────────────────────────────────────────────────
test.describe('PI-23: the document page names the record\'s own area', () => {
  async function expectCoiledTubing(page) {
    await expect(page.locator('#doc-title')).toHaveText(SOP011.t);
    await expect(page.locator('#bc-seg')).toHaveAttribute('href', /^segment\.html\?id=coiled-tubing(&|$)/);
    await expect(page.locator('#bc-seg')).not.toContainText('Drilling');
    await expect(page.locator('#doc-badges')).not.toContainText('Drilling');
    const share = await page.locator('#share-url').textContent();
    expect(share).toContain('seg=coiled-tubing');
    expect(share).not.toContain('seg=drilling');
    expect(share).toContain('doc=' + encodeURIComponent(SOP011.n));
    // The QR code encodes exactly the share link.
    const qr = await page.locator('#qr-img').getAttribute('src');
    expect(qr).toBe(await page.evaluate((u) => window.TAQA_QR(u, 4), share));
    return share;
  }

  test('a doc-only link: Coiled Tubing, not Drilling, in the breadcrumb, badges, share link and QR', async ({ page, gotoApp, setRole, clearAppState, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/viewer.html?doc=' + encodeURIComponent(SOP011.n));
    await expectCoiledTubing(page);
    assertNoConsoleErrors(consoleErrors);
  });

  test('a link naming the wrong area: the record\'s area wins', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/viewer.html?seg=drilling&type=sop&doc=' + encodeURIComponent(SOP011.n));
    await expectCoiledTubing(page);
  });

  test('the copied share link opens the same record in the same area', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/viewer.html?doc=' + encodeURIComponent(SOP011.n));
    const share = await expectCoiledTubing(page);
    await gotoApp(new URL(share).pathname.replace(/^.*\//, '/') + new URL(share).search);
    await expectCoiledTubing(page);
  });

  test('a bookmark made from a doc-only link is filed under the record\'s area', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/viewer.html?doc=' + encodeURIComponent(SOP011.n));
    await page.evaluate(() => toggleViewerBm());
    const saved = await page.evaluate(() => window.TAQA_Bookmarks.getAll());
    expect(saved).toHaveLength(1);
    expect(saved[0].segId).toBe(CT);
    expect(saved[0].num).toBe(SOP011.n);
  });

  test('a link with neither a number nor an area guesses nothing: no Drilling, no borrowed record', async ({ page, gotoApp, setRole, clearAppState, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/viewer.html?type=sop&title=' + encodeURIComponent(SOP011.t));
    await expect(page.locator('#bc-seg')).toHaveText('Area not recorded');
    await expect(page.locator('#bc-seg')).not.toContainText('Drilling');
    await expect(page.locator('#lifecycle-banner')).toContainText('Not in the Master Document List');
    await expect(page.locator('body')).not.toContainText('Current, OK to use');
    expect(await page.locator('#share-url').textContent()).not.toContain('seg=');
    assertNoConsoleErrors(consoleErrors);
  });
});

// ── PI-22 ────────────────────────────────────────────────────────────────
test.describe('PI-22: an exact number of a withdrawn document says what it is', () => {
  async function search(page, gotoApp, q) {
    await gotoApp('/ai-search.html');
    await page.locator('#query-input').fill(q);
    await page.locator('#query-input').press('Enter');
    await expect(page.locator('#chat-log h3, #chat-log h4').first()).toBeVisible();
  }

  test('a superseded number: one card, marked Superseded, naming the missing successor and SCORE', async ({ page, gotoApp, setRole, clearAppState, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await search(page, gotoApp, SUPERSEDED.n);
    const card = page.locator('#chat-log .source-card-withdrawn');
    await expect(card).toHaveCount(1);
    await expect(card).toContainText('Superseded. Do not use.');
    await expect(card).toContainText('This document exists, but the matching revision is superseded');
    await expect(card).toContainText('Rev 4.0');
    await expect(card).toContainText('SCORE');
    await expect(page.locator('#chat-log')).not.toContainText('check the document number');
    await expect(page.locator('#chat-log')).not.toContainText(/\bCurrent\b/);
    // It opens that revision, which the document page shows as withdrawn.
    await card.click();
    await expect(page).toHaveURL(/viewer\.html\?doc=TQ-TWS-CTSS-SOP-003&rev=3\.0/);
    await expect(page.locator('#lifecycle-banner')).toContainText(/superseded/i);
    await expect(page.locator('body')).not.toContainText('Current, OK to use');
    assertNoConsoleErrors(consoleErrors);
  });

  test('a legacy ID, in any case, of a withdrawn document: marked Withdrawn', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    for (const q of [OBSOLETE.legacy, OBSOLETE.n.toLowerCase()]) {
      await search(page, gotoApp, q);
      const card = page.locator('#chat-log .source-card-withdrawn');
      await expect(card).toHaveCount(1);
      await expect(card).toContainText('Withdrawn. Do not use.');
      await expect(card).toContainText(OBSOLETE.n);
    }
  });

  test('a restricted withdrawn number stays not found for an Employee, and is shown to QMS', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await search(page, gotoApp, GONE_RESTRICTED.n);
    await expect(page.locator('#chat-log .source-card-withdrawn')).toHaveCount(0);
    await expect(page.locator('#chat-log')).toContainText('No Documents Found');
    await setRole('qms', CT);
    await search(page, gotoApp, GONE_RESTRICTED.n);
    await expect(page.locator('#chat-log .source-card-withdrawn')).toHaveCount(1);
  });

  test('a partial number never brings a withdrawn record into the results', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await search(page, gotoApp, 'TQ-TWS-CTSS-SOP-00');
    await expect(page.locator('#chat-log .source-card-withdrawn')).toHaveCount(0);
    await expect(page.locator('#chat-log')).not.toContainText(SUPERSEDED.t);
  });
});

// ── PI-27 ────────────────────────────────────────────────────────────────
test.describe('PI-27: titles and counts are what the reader may open', () => {
  const B = computeBaseline();
  const restrictedCT = B.liveFor('qms').filter((d) => d.segment === CT && d.classification === 'restricted');
  const confidentialCT = B.liveFor('qms').filter((d) => d.segment === CT && d.classification === 'confidential');

  test('the baseline matches the audit: an Employee may open 352 of 520 documents in force', () => {
    expect(B.liveCount).toBe(520);
    expect(B.liveCountFor.employee).toBe(352);
    expect(restrictedCT.length).toBeGreaterThan(0);
    expect(confidentialCT.length).toBeGreaterThan(0);
  });

  test('Home counts: an Employee is told 352, QMS 520', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/index.html');
    const docs = () => page.locator('.stat-row').filter({ hasText: 'Documents in Force' }).locator('[data-target]').getAttribute('data-target');
    expect(await docs()).toBe(String(B.liveCountFor.employee));
    await setRole('qms', CT);
    await gotoApp('/index.html');
    expect(await docs()).toBe(String(B.liveCountFor.qms));
  });

  test('area page: an Employee sees no restricted or confidential title; a Director sees confidential, not restricted; QMS sees both', async ({ page, gotoApp, setRole, clearAppState }) => {
    const listed = () => page.evaluate((id) => Object.values(SEGMENTS[id].docs).flat()
      .concat(Object.values(SEGMENTS[id].mnt.docs).flat()), CT);
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/segment.html?id=' + CT);
    let rows = await listed();
    for (const d of restrictedCT.concat(confidentialCT)) expect(rows.join('\n')).not.toContain(d.docNumber);
    await expect(page.locator('body')).not.toContainText(RESTRICTED.t);
    expect(rows.join('\n')).toContain(SOP011.n);

    await setRole('owner', CT);
    await gotoApp('/segment.html?id=' + CT);
    rows = (await listed()).join('\n');
    for (const d of restrictedCT) expect(rows).not.toContain(d.docNumber);
    for (const d of confidentialCT) expect(rows).toContain(d.docNumber);

    await setRole('qms', CT);
    await gotoApp('/segment.html?id=' + CT);
    rows = (await listed()).join('\n');
    for (const d of restrictedCT.concat(confidentialCT)) expect(rows).toContain(d.docNumber);
  });

  test('area figures are trimmed the same way everywhere (TAQA_STORE.area)', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    for (const role of ['employee', 'owner', 'qms']) {
      await setRole(role, CT);
      await gotoApp('/index.html');
      expect(await page.evaluate((id) => TAQA_STORE.area(id).live, CT), role).toBe(B.countsByAreaFor(role)[CT]);
    }
  });

  test('search: an Employee does not find a restricted title; QMS does', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/ai-search.html');
    await page.locator('#query-input').fill(RESTRICTED.t);
    await page.locator('#query-input').press('Enter');
    await expect(page.locator('#chat-log')).toContainText('No Documents Found');
    await setRole('qms', CT);
    await gotoApp('/ai-search.html');
    await page.locator('#query-input').fill(RESTRICTED.t);
    await page.locator('#query-input').press('Enter');
    await expect(page.locator('#chat-log .source-card').first()).toContainText(RESTRICTED.t);
  });

  test('document page: a restricted number reads exactly like a number that does not exist', async ({ page, gotoApp, setRole, clearAppState, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    const read = async (n) => {
      await gotoApp('/viewer.html?doc=' + encodeURIComponent(n) + '&type=sop&title=' + encodeURIComponent(RESTRICTED.t));
      await expect(page.locator('#lifecycle-banner .lcb')).toBeVisible();
      return page.evaluate((num) => ({
        title: document.getElementById('doc-title').textContent,
        crumb: document.getElementById('bc-seg').textContent,
        banner: document.getElementById('lifecycle-banner').textContent,
        meta: document.getElementById('meta-grid').textContent.split(num).join('#'),
        summary: document.getElementById('doc-summary').textContent,
        body: document.body.innerText,
      }), n);
    };
    const hidden = await read(RESTRICTED.n);
    const none = await read('TQ-TWS-CTSS-SOP-998');
    expect(hidden.title).toBe('Document');
    expect(hidden.title).toBe(none.title);
    expect(hidden.crumb).toBe(none.crumb);
    expect(hidden.banner).toBe(none.banner);
    expect(hidden.meta).toBe(none.meta);
    expect(hidden.summary).toBe(none.summary);
    expect(hidden.body).not.toContain(RESTRICTED.t);
    expect(hidden.body).not.toMatch(/restricted/i);
    // QMS opens it as usual.
    await setRole('qms', CT);
    await gotoApp('/viewer.html?doc=' + encodeURIComponent(RESTRICTED.n));
    await expect(page.locator('#doc-title')).toHaveText(RESTRICTED.t);
    assertNoConsoleErrors(consoleErrors);
  });

  test('bookmarks: a restricted document saved under QMS is not listed or counted for an Employee', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'qms');
    await gotoApp('/viewer.html?doc=' + encodeURIComponent(RESTRICTED.n));
    await page.evaluate(() => toggleViewerBm());
    expect(await page.evaluate(() => window.TAQA_Bookmarks.getAll().length)).toBe(1);
    await setRole('employee', CT);
    await gotoApp('/index.html');
    expect(await page.evaluate(() => window.TAQA_Bookmarks.getAll().length)).toBe(0);
    await page.evaluate(() => window.renderBmPanel && window.renderBmPanel());
    await expect(page.locator('#bm-panel')).not.toContainText(RESTRICTED.t);
    // Kept on the device: it comes back for a role that may open it.
    await setRole('qms', CT);
    await gotoApp('/index.html');
    expect(await page.evaluate(() => window.TAQA_Bookmarks.getAll().length)).toBe(1);
  });

  test('Director\'s withdraw list names no restricted document in their own area', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'owner', CT);
    await gotoApp('/documents.html?id=' + CT);
    await expect(page.locator('body')).toContainText(confidentialCT.find((d) => d.department !== 'maintenance' && d.docType !== 'bulletin').docNumber);
    for (const d of restrictedCT) await expect(page.locator('body')).not.toContainText(d.docNumber);
  });

  test('Upload: a number already used by a restricted document is refused without naming it', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, clearAppState, setRole, 'employee');
    await gotoApp('/upload.html');
    const msg = await page.evaluate((n) => {
      const f = document.getElementById('doc-ref-id');
      f.value = n; f.dataset.autofilled = 'user';
      checkDocId();
      return document.getElementById('doc-id-status').textContent;
    }, RESTRICTED.n);
    expect(msg).toContain('already in use in the register');
    expect(msg).not.toContain(RESTRICTED.t);
    // A number this person may see is still named.
    const own = await page.evaluate((n) => {
      const f = document.getElementById('doc-ref-id');
      f.value = n; f.dataset.autofilled = 'user';
      checkDocId();
      return document.getElementById('doc-id-status').textContent;
    }, SOP011.n);
    expect(own).toContain(SOP011.t);
  });
});
