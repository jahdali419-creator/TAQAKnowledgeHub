// PR 2D: phone and installed-app reliability.
//
// No lost work, no false success, no broken navigation, no controls covered
// by phone UI, no silent reload during an action. Each block names the
// finding it guards (docs/QA/PRODUCT-INTEGRITY-AUDIT.md).
//
// What this cannot prove: a real iPhone. Safari's back-forward cache, its
// service-worker lifecycle in an installed app, the real notch and home
// indicator, and a real network dropping on a rig are listed for manual
// checking in docs/TESTING.md ("Real iPhone checks").
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

async function prime(page, gotoApp, role = 'qms', area = 'coiled-tubing') {
  await gotoApp('/index.html');
  await page.evaluate(({ role, area }) => {
    localStorage.clear();
    localStorage.setItem('taqa-tour-done', '1');
    localStorage.setItem('taqa-install-dismissed', String(Date.now()));
    TAQA_ROLE.set(role);
    if (area && TAQA_ROLE.setArea) TAQA_ROLE.setArea(area);
  }, { role, area });
}

// Is the control at its own centre, or is something drawn over it?
async function tappable(page, sel) {
  return page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return t === el || el.contains(t);
  });
}

// ── PI-48 / PI-26: one honest connectivity bar ───────────────────────────
test.describe('connectivity: one bar, under the top bar, honest about what it shows', () => {
  test.use(PHONE);

  test('offline: exactly one bar, below the top bar; the bell, menu and page content are not covered', async ({ page, gotoApp, context }) => {
    await prime(page, gotoApp);
    await gotoApp('/segment.html?id=drilling');
    await expect(page.locator('#taqa-net-bar')).toBeHidden();
    const before = await page.locator('.tabs-outer').boundingBox();

    await context.setOffline(true);
    await expect(page.locator('#taqa-net-bar')).toBeVisible();
    await expect(page.locator('#taqa-net-bar')).toContainText('Offline. Showing copies saved on this device; nothing can be sent');
    // The old three bars are gone for good.
    await expect(page.locator('#offline-banner, #offline-bar, .offline-bar, #taqa-offline-bar')).toHaveCount(0);

    const nav = await page.locator('#navbar').boundingBox();
    const bar = await page.locator('#taqa-net-bar').boundingBox();
    expect(Math.abs(bar.y - (nav.y + nav.height))).toBeLessThan(1); // directly under the bar, not over it
    expect(await tappable(page, '#nav-bell, #nav-hamburger')).toBe(true);
    expect(await tappable(page, '#nav-hamburger')).toBe(true);
    // The sticky tabs moved down by the bar's height rather than being covered.
    await page.evaluate(() => window.scrollTo(0, 600));
    const tabs = await page.locator('.tabs-outer').boundingBox();
    expect(tabs.y).toBeGreaterThanOrEqual(bar.y + bar.height - 1);
    expect(before).not.toBeNull();

    await context.setOffline(false);
    await expect(page.locator('#taqa-net-bar')).toBeHidden(); // online again only once the server answered
  });

  test('"last synced" is written only when the server really answered, never from the device saying online', async ({ page, gotoApp, context }) => {
    await prime(page, gotoApp);
    await gotoApp('/viewer.html?doc=TQ-TWS-CTSS-S005');
    await page.evaluate(() => localStorage.setItem('taqa-last-sync', '1000'));
    await context.setOffline(true);
    await expect(page.locator('#taqa-net-bar')).toBeVisible();
    await expect(page.locator('#sync-note')).toHaveText('Offline: the copy saved on this device');
    expect(await page.evaluate(() => localStorage.getItem('taqa-last-sync'))).toBe('1000');
    await context.setOffline(false);
    await expect(page.locator('#taqa-net-bar')).toBeHidden();
    expect(Number(await page.evaluate(() => localStorage.getItem('taqa-last-sync')))).toBeGreaterThan(1000);
  });

  test('"cannot be reached" re-checks by itself and recovers without a reload once RISE answers', async ({ page, gotoApp }) => {
    await prime(page, gotoApp);
    await page.clock.install();
    await gotoApp('/index.html');
    let down = true;
    await page.route('**/manifest.json?probe=*', (r) => (down ? r.abort() : r.continue()));
    await page.evaluate(() => { window.__same = true; localStorage.setItem('taqa-last-sync', '1000'); });
    expect(await page.evaluate(() => TAQA_NET.probe())).toBe(false);
    await expect(page.locator('#taqa-net-bar')).toContainText('RISE cannot be reached');
    // Still down at the first re-check: still "cannot be reached", last synced untouched.
    await page.clock.runFor(21_000);
    await expect(page.locator('#taqa-net-bar')).toContainText('RISE cannot be reached');
    expect(await page.evaluate(() => localStorage.getItem('taqa-last-sync'))).toBe('1000');
    // RISE answers again: the next re-check (backed off to 30s) recovers, no reload.
    down = false;
    await page.clock.runFor(31_000);
    await expect(page.locator('#taqa-net-bar')).toBeHidden();
    expect(await page.evaluate(() => TAQA_NET.state())).toBe('online');
    expect(await page.evaluate(() => TAQA_NET.canWrite())).toBe(true);
    expect(await page.evaluate(() => window.__same)).toBe(true);
    expect(Number(await page.evaluate(() => localStorage.getItem('taqa-last-sync')))).toBeGreaterThan(1000);
  });

  test('a refused change while "cannot be reached" asks again at once, so the next try can go through', async ({ page, gotoApp }) => {
    await prime(page, gotoApp, 'employee');
    let down = true;
    await page.route('**/manifest.json?probe=*', (r) => (down ? r.abort() : r.continue()));
    expect(await page.evaluate(() => TAQA_NET.probe())).toBe(false);
    down = false;
    const first = await page.evaluate(() => TAQA_STORE.add({ title: 'Retry filing', segment: 'drilling', docType: 'sop', docNumber: 'TQ-TDS-DSS-SOP-985', summary: 'Retry check.' }));
    expect(first).toBeNull(); // refused: nothing is sent on a guess
    await expect.poll(() => page.evaluate(() => TAQA_NET.state())).toBe('online');
    const second = await page.evaluate(() => !!TAQA_STORE.add({ title: 'Retry filing', segment: 'drilling', docType: 'sop', docNumber: 'TQ-TDS-DSS-SOP-985', summary: 'Retry check.' }));
    expect(second).toBe(true);
  });

  test('the device says online but RISE does not answer: "cannot be reached", and nothing is sent', async ({ page, gotoApp }) => {
    await prime(page, gotoApp);
    await gotoApp('/index.html');
    await page.route('**/manifest.json?probe=*', (r) => r.abort());
    expect(await page.evaluate(() => TAQA_NET.probe())).toBe(false);
    await expect(page.locator('#taqa-net-bar')).toContainText('RISE cannot be reached');
    expect(await page.evaluate(() => TAQA_NET.canWrite())).toBe(false);
    const add = await page.evaluate(() => {
      TAQA_ROLE.set('employee');
      const r = TAQA_STORE.add({ title: 'Unreachable filing', segment: 'drilling', docType: 'sop', docNumber: 'TQ-TDS-DSS-SOP-981', summary: 'Should not be filed.' });
      return { r, err: TAQA_STORE.writeError(), n: TAQA_STORE.all().filter((d) => d.docNumber === 'TQ-TDS-DSS-SOP-981').length };
    });
    expect(add.r).toBeNull();
    expect(add.err).toContain('RISE cannot be reached');
    expect(add.n).toBe(0);
  });
});

// ── PI-28: offline never pretends a change was made ───────────────────────
test.describe('offline: nothing is pretended, and nothing typed is lost', () => {
  test('Upload offline: "Not sent", no record filed, the whole form kept; sent once back online', async ({ page, gotoApp, context, setRole }) => {
    await prime(page, gotoApp);
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/upload.html');
    await page.setInputFiles('#file-input', [{ name: 'offline.pdf', mimeType: 'application/pdf', buffer: Buffer.from('x') }]);
    await page.click('#go-2');
    await page.selectOption('#seg-select', 'coiled-tubing');
    await page.selectOption('#doc-type-select', 'sop');
    await page.click('#go-3');
    await page.fill('#doc-title-input', 'Offline filed procedure');
    await page.fill('#summary-main', 'A summary long enough to satisfy the required-field check for this test.');
    await page.selectOption('#audience-select', 'Field Operators');
    await page.click('#go-4');
    await expect(page.locator('#panel-4')).toBeVisible();
    const count = () => page.evaluate(() => TAQA_STORE.all().filter((d) => d.title === 'Offline filed procedure').length);

    await context.setOffline(true);
    await expect(page.locator('#taqa-net-bar')).toBeVisible();
    await page.click('#submit-btn');
    await expect(page.locator('#toast')).toContainText('Not sent');
    await expect(page.locator('#toast')).toContainText('Nothing was saved to the register');
    expect(await count()).toBe(0);
    await expect(page.locator('#panel-4')).toBeVisible();
    expect(await page.inputValue('#doc-title-input')).toBe('Offline filed procedure');

    await context.setOffline(false);
    await expect(page.locator('#taqa-net-bar')).toBeHidden();
    await page.click('#submit-btn');
    await expect.poll(count).toBe(1);
  });

  test('Workbench reject offline: refused in the panel, the typed reason stays, the record still waits', async ({ page, gotoApp, context }) => {
    await prime(page, gotoApp, 'employee');
    await page.evaluate(() => TAQA_STORE.add({ title: 'Offline check', segment: 'coiled-tubing', docType: 'sop', docNumber: 'TQ-TWS-CTSS-SOP-982', summary: 'Offline reject check.', files: [{ name: 'a.pdf', size: 2048 }] }));
    await page.evaluate(() => TAQA_ROLE.set('qms'));
    await gotoApp('/master-list.html?view=qms&doc=TQ-TWS-CTSS-SOP-982');
    await page.locator('#wb-reject').click();
    const reason = 'Section 4 is missing the isolation steps; add them and resubmit.';
    await page.fill('#wb-reason', reason);
    await context.setOffline(true);
    await expect(page.locator('#taqa-net-bar')).toBeVisible();
    await page.locator('#wb-reject-go').click();
    await expect(page.locator('#dw .taqa-net-refusal')).toContainText('Not sent: you are offline');
    await expect(page.locator('#wb-reason')).toHaveValue(reason);
    const d = await page.evaluate(() => { const r = TAQA_STORE.findDoc('TQ-TWS-CTSS-SOP-982'); return { rejected: !!r.rejected, stage: TAQA_APPROVAL.stageOf(r) }; });
    expect(d.rejected).toBe(false);
    expect(d.stage).toBe('qms');

    await context.setOffline(false);
    await expect(page.locator('#taqa-net-bar')).toBeHidden();
    await page.locator('#wb-reject-go').click();
    await expect(page.locator('#wb-res')).toContainText('Rejected and returned');
  });

  test('withdraw offline: the dialog stays open with the reason; the document is not withdrawn', async ({ page, gotoApp, context, seedRegister }) => {
    await prime(page, gotoApp);
    await seedRegister([{ docNumber: 'TEST-OFFLINE-WD', title: 'Offline withdraw document', segment: 'coiled-tubing', docType: 'sop', status: 'current', issueDate: '2026-01-01', nextReviewDate: '2028-01-01' }]);
    await gotoApp('/documents.html?id=coiled-tubing');
    await page.locator('#pub-docs-body tr', { hasText: 'Offline withdraw document' }).locator('.pub-remove-btn').click();
    await page.fill('#wd-reason', 'Replaced by the revised offline procedure.');
    await context.setOffline(true);
    await expect(page.locator('#taqa-net-bar')).toBeVisible();
    await page.locator('#wd-go').click();
    await expect(page.locator('#wd-dlg')).toBeVisible();
    await expect(page.locator('#wd-dlg .taqa-net-refusal')).toContainText('Not sent');
    await expect(page.locator('#wd-reason')).toHaveValue('Replaced by the revised offline procedure.');
    expect(await page.evaluate(() => TAQA_STORE.findDoc('TEST-OFFLINE-WD').status)).toBe('current');
  });

  test('every register change refuses offline and says so: approve, check, reject, edit, withdraw, delegate, revoke', async ({ page, gotoApp, context }) => {
    await prime(page, gotoApp, 'employee');
    await page.evaluate(() => TAQA_STORE.add({ title: 'API offline', segment: 'coiled-tubing', docType: 'sop', docNumber: 'TQ-TWS-CTSS-SOP-983', summary: 'Offline API check.' }));
    await context.setOffline(true);
    await expect(page.locator('#taqa-net-bar')).toBeVisible();
    const out = await page.evaluate(() => {
      const n = 'TQ-TWS-CTSS-SOP-983';
      TAQA_ROLE.set('qms');
      const key = TAQA_STORE.recordKey(TAQA_STORE.findDoc(n));
      const cs = TAQA_STORE.countersign(n, { key, stage: 'qms' });
      const rj = TAQA_STORE.reject(n, 'A reason that is long enough to count.', { key, stage: 'qms' });
      const ed = TAQA_STORE.editFields ? TAQA_STORE.editFields(n, { summary: 'changed' }) : { ok: false, offline: true };
      const st = TAQA_STORE.setStatus(n, 'obsolete', null, { reason: 'A reason that is long enough to count.' });
      TAQA_ROLE.set('director');
      const ap = TAQA_STORE.approve(n, { key, stage: 'director' });
      const g = TAQA_DELEGATION.grant({ fromRole: 'director', to: 'Deputy', segment: 'coiled-tubing', reason: 'Annual leave cover for two weeks.' });
      const d = TAQA_STORE.findDoc(n);
      return { cs, rj, ed, st, ap, g, stage: TAQA_APPROVAL.stageOf(d), status: d.status, why: TAQA_STORE.statusError() };
    });
    for (const k of ['cs', 'rj', 'ap', 'g']) {
      expect(out[k].ok, k).toBe(false);
      expect(out[k].offline, k).toBe(true);
      expect(out[k].error, k).toContain('Not sent');
    }
    expect(out.ed.ok).toBe(false);
    expect(out.st).toBeNull();
    expect(out.why).toContain('Not sent');
    expect(out.stage).toBe('qms');
    expect(out.status).not.toBe('obsolete');
  });
});

// ── PI-51: the pager lands on the list, under the tabs ───────────────────
test.describe('segment pager on a phone', () => {
  test.use(PHONE);
  test('"Next" shows the new page\'s first row just below the bar and the sticky tabs, with focus on the list', async ({ page, gotoApp, seedRegister }) => {
    await prime(page, gotoApp);
    // No shipped tab passes one page (25), so 30 SOPs make a second page.
    await seedRegister(Array.from({ length: 30 }, (_, i) => ({
      docNumber: 'TQ-TDS-DSS-SOP-' + (900 + i), title: 'Pager procedure ' + (i + 1), segment: 'drilling', docType: 'sop',
      issueDate: '2026-01-01', nextReviewDate: '2028-01-01',
    })));
    await gotoApp('/segment.html?id=drilling&tab=sops');
    const next = page.locator('#pg-sops .pg-nav', { hasText: 'Next' });
    await next.scrollIntoViewIfNeeded();
    await next.click();
    await expect(page.locator('#pg-sops .pg-info')).toHaveText(/Page 2 of 2/);
    await page.waitForTimeout(900); // smooth scroll settles
    const geo = await page.evaluate(() => {
      const list = document.activeElement;
      const tabs = document.querySelector('.tabs-outer').getBoundingClientRect();
      const first = list && list.firstElementChild ? list.firstElementChild.getBoundingClientRect() : null;
      return { id: list && list.id, tabsBottom: tabs.bottom, firstTop: first && first.top };
    });
    expect(geo.id).toBe('list-sops');
    expect(geo.firstTop).toBeGreaterThanOrEqual(geo.tabsBottom - 1);
    expect(geo.firstTop).toBeLessThan(geo.tabsBottom + 60);
  });
});

// ── Install sheet: Home only, never over a task ──────────────────────────
test.describe('install sheet', () => {
  test.use({ ...PHONE, installPrompt: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  test('a phone browser is offered the install on Home, never over the Workbench, the desk or a document', async ({ page, gotoApp }) => {
    await prime(page, gotoApp);
    await page.evaluate(() => localStorage.removeItem('taqa-install-dismissed'));
    for (const p of ['/master-list.html', '/dashboard.html?id=coiled-tubing', '/viewer.html?doc=TQ-TWS-CTSS-S005', '/segment.html?id=drilling']) {
      await gotoApp(p);
      await page.waitForTimeout(2800);
      await expect(page.locator('#pwa-sheet.pwa-open'), p).toHaveCount(0);
    }
    await gotoApp('/index.html');
    await expect(page.locator('#pwa-sheet')).toHaveClass(/pwa-open/, { timeout: 5000 });
    await expect(page.locator('#pwa-sheet')).not.toContainText('all TAQA documents offline');
  });
});

// ── PI-18: Back restores a usable page ───────────────────────────────────
test.describe('Back and Forward', () => {
  test('a page restored from the back-forward cache is visible and takes taps', async ({ page, gotoApp }) => {
    await prime(page, gotoApp);
    await gotoApp('/segment.html?id=drilling');
    // What a followed link leaves behind, then the browser's restore event.
    const after = await page.evaluate(() => {
      let resumed = false;
      window.addEventListener('taqa:resume', () => { resumed = true; }, { once: true });
      document.body.classList.add('page-exit');
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
      const cs = getComputedStyle(document.body);
      return { exit: document.body.classList.contains('page-exit'), pe: cs.pointerEvents, resumed };
    });
    expect(after.exit).toBe(false);
    expect(after.pe).not.toBe('none');
    expect(after.resumed).toBe(true);
  });
});

// ── A served copy of the site, for the service worker and the real cache ──
// The suite's server sends no-store (which turns the back-forward cache off)
// and its service worker is fixed. These tests serve a private copy whose
// service worker can be bumped mid-test, as a deploy does.
function copySite() {
  const root = path.resolve(__dirname, '..');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rise-site-'));
  const skip = new Set(['node_modules', '.git', 'tests', 'test-results', 'playwright-report', 'docs', 'scripts']);
  for (const name of fs.readdirSync(root)) {
    if (skip.has(name) || name.startsWith('.')) continue;
    fs.cpSync(path.join(root, name), path.join(dir, name), { recursive: true });
  }
  return dir;
}
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
function serve(dir) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(dir, p);
    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}
function bump(dir, name) {
  const f = path.join(dir, 'service-worker.js');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/const CACHE = '[^']+';/, `const CACHE = '${name}';`));
}

test.describe('a new version never reloads a page in the middle of work (PI-30)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Service-worker lifecycle is driven in Chromium; Safari is checked on a real iPhone (docs/TESTING.md).');
  let dir, server, site;
  test.beforeAll(async () => { dir = copySite(); server = await serve(dir); site = 'http://127.0.0.1:' + server.address().port; });
  test.afterAll(async () => { if (server) server.close(); if (dir) fs.rmSync(dir, { recursive: true, force: true }); });

  test('Upload at step 3 and a typed rejection survive a deploy; the update waits, warns, and applies only on a safe page', async ({ browser }) => {
    test.setTimeout(120_000);
    const ctx = await browser.newContext({ serviceWorkers: 'allow', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const a = await ctx.newPage();
    await a.goto(site + '/index.html');
    await a.evaluate(() => {
      localStorage.setItem('taqa-tour-done', '1');
      localStorage.setItem('taqa-install-dismissed', String(Date.now()));
      TAQA_ROLE.set('employee');
      TAQA_STORE.add({ title: 'Deploy check', segment: 'coiled-tubing', docType: 'sop', docNumber: 'TQ-TWS-CTSS-SOP-984', summary: 'Deploy during work.', files: [{ name: 'a.pdf', size: 2048 }] });
      TAQA_ROLE.set('qms');
    });
    // First install takes control without a reload.
    await a.evaluate(() => { window.__same = true; });
    await a.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15_000 });
    expect(await a.evaluate(() => window.__same)).toBe(true);
    const first = await a.evaluate(() => caches.keys());

    // Tab A: an Upload at step 3. Tab B: a QMS rejection being typed.
    await a.goto(site + '/upload.html');
    await a.setInputFiles('#file-input', [{ name: 'deploy.pdf', mimeType: 'application/pdf', buffer: Buffer.from('x') }]);
    await a.click('#go-2');
    await a.selectOption('#seg-select', 'coiled-tubing');
    await a.selectOption('#doc-type-select', 'sop');
    await a.click('#go-3');
    await a.fill('#doc-title-input', 'Typed before the deploy');
    await a.evaluate(() => { window.__same = true; });
    const b = await ctx.newPage();
    await b.goto(site + '/master-list.html?view=qms&doc=TQ-TWS-CTSS-SOP-984');
    await b.locator('#wb-reject').click();
    await b.fill('#wb-reason', 'Typed before the deploy, and it must survive it.');
    await b.evaluate(() => { window.__same = true; });

    // A deploy: the cache version changes and both tabs find the new worker.
    bump(dir, 'taqa-hub-deploy-test-2');
    for (const p of [a, b]) await p.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()));
    await a.waitForFunction(() => navigator.serviceWorker.getRegistration().then((r) => !!r.waiting), null, { timeout: 15_000 });
    for (const p of [a, b]) await expect(p.locator('#sw-update-bar')).toContainText('New version available', { timeout: 10_000 });

    // "Update now" while work is in progress warns first; "Keep working" keeps it.
    await a.locator('#sw-reload-btn').click();
    await expect(a.locator('#sw-update-bar')).toContainText('loses what is in progress');
    await a.locator('#sw-later').click();
    await expect(a.locator('#sw-update-bar')).toContainText('New version available');

    // A fresh, idle page applies it quietly. Neither working tab reloads.
    const c = await ctx.newPage();
    await c.goto(site + '/index.html');
    await c.waitForFunction(() => caches.keys().then((k) => k.includes('taqa-hub-deploy-test-2') && k.length === 1), null, { timeout: 15_000 });
    await a.waitForTimeout(1000);
    expect(await a.evaluate(() => window.__same)).toBe(true);
    expect(await b.evaluate(() => window.__same)).toBe(true);
    await expect(a.locator('#panel-3')).toBeVisible();
    expect(await a.inputValue('#doc-title-input')).toBe('Typed before the deploy');
    await expect(a.locator('.file-item-name')).toHaveText(['deploy.pdf']);
    expect(await b.inputValue('#wb-reason')).toBe('Typed before the deploy, and it must survive it.');
    expect(first.length).toBe(1);

    // The working tab then finishes against the new worker: the rejection is recorded.
    await b.locator('#wb-reject-go').click();
    await expect(b.locator('#wb-res')).toContainText('Rejected and returned');

    // Offline reading still works after the update.
    await ctx.setOffline(true);
    await c.goto(site + '/segment.html?id=drilling');
    await expect(c.locator('#taqa-net-bar')).toBeVisible();
    await expect(c.locator('h1').first()).toBeVisible();
    await ctx.setOffline(false);
    await ctx.close();
  });

  test('on an idle page "Update now" reloads into the new version, once, by choice', async ({ browser }) => {
    test.setTimeout(90_000);
    const ctx = await browser.newContext({ serviceWorkers: 'allow' });
    const p = await ctx.newPage();
    await p.goto(site + '/index.html');
    await p.evaluate(() => { localStorage.setItem('taqa-tour-done', '1'); });
    await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15_000 });
    await p.goto(site + '/glossary.html');
    await p.waitForTimeout(4200); // past the quiet window of a fresh load
    bump(dir, 'taqa-hub-deploy-test-3');
    await p.evaluate(() => { window.__same = true; return navigator.serviceWorker.getRegistration().then((r) => r.update()); });
    await expect(p.locator('#sw-update-bar')).toContainText('New version available', { timeout: 15_000 });
    expect(await p.evaluate(() => window.__same)).toBe(true); // nothing reloaded on its own
    await Promise.all([p.waitForEvent('load'), p.locator('#sw-reload-btn').click()]);
    expect(await p.evaluate(() => window.__same)).toBeUndefined();
    await p.waitForFunction(() => caches.keys().then((k) => k.includes('taqa-hub-deploy-test-3')), null, { timeout: 15_000 });
    await ctx.close();
  });

  test('Back from a followed link restores a usable page from the real back-forward cache (Chromium)', async ({ browser }) => {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.addInitScript(() => { window.addEventListener('pageshow', (e) => { window.__persisted = e.persisted; }); });
    await p.goto(site + '/index.html');
    await p.evaluate(() => { localStorage.setItem('taqa-tour-done', '1'); localStorage.setItem('taqa-install-dismissed', String(Date.now())); });
    await p.goto(site + '/segment.html?id=drilling');
    await Promise.all([p.waitForURL(/glossary\.html/), p.evaluate(() => {
      const a = document.createElement('a'); a.href = 'glossary.html'; a.textContent = 'go'; document.body.appendChild(a); a.click();
    })]);
    await p.goBack();
    await p.waitForLoadState();
    const st = await p.evaluate(() => ({ persisted: window.__persisted, exit: document.body.classList.contains('page-exit'), pe: getComputedStyle(document.body).pointerEvents }));
    test.skip(!st.persisted, 'This Chromium build did not restore from the back-forward cache; the restore handler is covered above.');
    expect(st.exit).toBe(false);
    expect(st.pe).not.toBe('none');
    await ctx.close();
  });
});
