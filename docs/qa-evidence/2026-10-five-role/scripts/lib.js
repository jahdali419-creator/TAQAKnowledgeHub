// Shared helpers for the five-role audit. Every workflow step is a real UI
// action. TAQA_STORE is only READ (findDoc) to record evidence, or CALLED
// the way someone with the console open could, and only where a step is an
// attempt to break a rule (marked "console" in the log).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:8940';
const OUT = path.join(__dirname);

function recorder(name) {
  const rows = [];
  const log = (id, step, expected, actual, ok, extra = {}) => {
    const r = { id, step, expected, actual: String(actual), result: ok === null ? 'N/A' : ok ? 'PASS' : 'FAIL', ...extra };
    rows.push(r);
    console.log(`${r.result.padEnd(4)} ${id} ${step} :: ${r.actual}`);
  };
  const save = () => fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify(rows, null, 2));
  return { rows, log, save };
}

async function launch(viewport, isMobile) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const context = await browser.newContext({
    viewport, isMobile: !!isMobile, hasTouch: !!isMobile, serviceWorkers: 'block',
    deviceScaleFactor: isMobile ? 2 : 1,
  });
  const errors = [];
  context.on('page', (p) => p.on('pageerror', (e) => errors.push(p.url() + ' :: ' + e.message)));
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(page.url() + ' :: ' + e.message));
  page.on('dialog', (d) => d.accept());
  return { browser, context, page, errors };
}

async function go(page, p) {
  try { await page.goto(BASE + p, { waitUntil: 'load', timeout: 10000 }); } catch (e) { /* see fixtures.js: navigation hang quirk */ }
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 15000 });
  await page.waitForTimeout(300);
}

async function fresh(page) {
  await go(page, '/index.html');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('taqa-tour-done', '1');
    localStorage.setItem('taqa-install-dismissed', String(Date.now()));
  });
  await go(page, '/index.html');
}

const isPhone = (page) => page.locator('#nav-hamburger').isVisible();
async function openMenu(page) {
  const menu = page.locator('#nav-mobile-menu');
  if (!(await menu.evaluate((m) => m.classList.contains('open')))) await page.locator('#nav-hamburger').click();
  await page.waitForTimeout(250);
}

// The role door on desktop, the "Viewing as" buttons in the menu on a phone.
async function switchRole(page, role) {
  if (!(await page.locator('#navbar').count())) await go(page, '/index.html');
  if (await isPhone(page)) {
    await openMenu(page);
    await Promise.all([page.waitForEvent('load'), page.locator(`#nav-mobile-menu .mm-door button[data-role="${role}"]`).click()]);
  } else {
    await page.locator('#taqa-door .door-btn').click();
    await Promise.all([page.waitForEvent('load'), page.locator(`#taqa-door .door-i[data-role="${role}"]`).click()]);
  }
  await page.waitForTimeout(300);
}

// The area picker inside the door (or the menu on a phone).
async function switchArea(page, area) {
  if (!(await page.locator('#navbar').count())) await go(page, '/index.html');
  if (await isPhone(page)) {
    await openMenu(page);
    await Promise.all([page.waitForEvent('load'), page.locator('#mm-area-sel').selectOption(area)]);
  } else {
    await page.locator('#taqa-door .door-btn').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
    await Promise.all([page.waitForEvent('load'), page.locator('#door-area-sel').selectOption(area)]);
  }
  await page.waitForTimeout(300);
}

async function as(page, role, area) {
  await go(page, '/index.html');
  const cur = await page.evaluate(() => TAQA_ROLE.current());
  if (cur !== role) await switchRole(page, role);
  if (area) {
    const a = await page.evaluate(() => TAQA_ROLE.area());
    if (a !== area) await switchArea(page, area);
  }
  return page.evaluate(() => ({ role: TAQA_ROLE.current(), area: TAQA_ROLE.area() }));
}

// upload.html's own four steps.
async function file(page, { title, seg, type = 'sop', maint = false, viaMaintLink = false }) {
  let viaLink = null;
  await go(page, viaMaintLink ? `/upload.html?seg=${seg}&dept=maintenance` + (type === 'bulletin' ? '&type=bulletin' : '') : '/upload.html');
  if (await page.locator('main h1, h1').first().textContent().then((t) => /not part of this role/i.test(t || '')).catch(() => false))
    return { refused: true };
  await page.setInputFiles('#file-input', { name: 'audit.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%audit\n%%EOF\n') });
  await page.click('#go-2');
  if (!viaMaintLink) await page.selectOption('#seg-select', seg);
  else viaLink = { seg: await page.locator('#seg-select').inputValue(), boxBefore: await page.locator('#dept-maint').isChecked() };
  if (!(viaMaintLink && type === 'bulletin')) await page.selectOption('#doc-type-select', type);
  const deptRow = await page.locator('#dept-row').isVisible();
  const box = page.locator('#dept-maint');
  const boxState = deptRow ? { checked: await box.isChecked(), disabled: await box.isDisabled() } : null;
  if (maint && deptRow && !(await box.isChecked()) && !(await box.isDisabled())) await box.check();
  await page.click('#go-3');
  await page.fill('#doc-title-input', title);
  await page.fill('#summary-main', 'Five-role audit document, walked through the workflow by real UI actions.');
  await page.selectOption('#audience-select', { index: 1 });
  await page.click('#go-4');
  const review = await page.locator('#review-list, .review-list, #step-4').first().innerText().catch(() => '');
  await page.click('#submit-btn');
  await page.waitForTimeout(400);
  const toast = await page.locator('#toast-sub').innerText().catch(() => '');
  const nums = await page.evaluate((t) => TAQA_STORE.all().filter((d) => d.title === t).map((d) => d.docNumber), title);
  return { nums, toast, deptRow, boxState, review, viaLink };
}

const rec = (page, n) => page.evaluate((x) => {
  const d = TAQA_STORE.findDoc(x);
  if (!d) return null;
  const pick = ['docNumber', 'title', 'segment', 'docType', 'department', 'status', 'approvalStage', 'submittedBy', 'countersignedBy',
    'approvedBy', 'approvedAt', 'rejected', 'rejectedAtStage', 'rejectedBy', 'rejectedReason'];
  const o = {}; pick.forEach((k) => { o[k] = d[k] === undefined ? null : d[k]; });
  o.waitingOn = TAQA_APPROVAL.waitingOn(d); o.approverFor = TAQA_APPROVAL.approverFor(d); o.isMaintenance = TAQA_APPROVAL.isMaintenance(d);
  return o;
}, n);

// Is this page the role refusal (TAQA_ROLE.refuse) rather than the page?
// Both refusal styles: TAQA_ROLE.refuse() and the Master List's own page.
const refused = (page) => page.evaluate(() => !document.getElementById('navbar') && /You are signed in as/.test(document.body.innerText));

async function desk(page, seg, title) {
  await go(page, '/dashboard.html?id=' + seg);
  if (await refused(page)) return { refused: true, heading: await page.locator('h1').first().innerText() };
  const card = page.locator('.pending-card', { hasText: title });
  return {
    refused: false,
    heading: await page.locator('#queue-title').innerText().catch(() => ''),
    cards: await card.count(),
    card,
    empty: await page.locator('#pending-list .empty-pending').innerText().catch(() => ''),
  };
}

async function shot(page, dir, name) {
  const d = path.join(OUT, dir); fs.mkdirSync(d, { recursive: true });
  await page.screenshot({ path: path.join(d, name + '.png'), fullPage: false });
}

// Does the open page show this text within a few seconds? Lists render after load.
async function shows(page, sel, text, ms = 4000) {
  try { await page.waitForFunction(({ sel, text }) => { const e = document.querySelector(sel); return !!e && e.textContent.includes(text); }, { sel, text }, { timeout: ms }); return true; }
  catch (e) { return false; }
}

module.exports = { shows, BASE, launch, go, fresh, switchRole, switchArea, as, file, rec, refused, desk, shot, recorder, isPhone, openMenu };
