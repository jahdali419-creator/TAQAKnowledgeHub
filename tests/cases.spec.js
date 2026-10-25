// Field cases, end to end: one journey through every page that files,
// checks, releases or reads a case, driven the way the people involved
// would drive it.
//
//   employee        files a Failure / incident card in Drilling Services
//                   through Add a case (case-new.html): symptoms in order,
//                   the steps tried, a POOH ending and the findings it asks for
//   QMS             checks it from the Workbench (master-list.html?view=qms)
//   Director        releases it from the Drilling desk (dashboard.html)
//   then            the library (by area and by service), the case page
//                   (timeline and ledger), the segment's Field cases strip,
//                   Search's Field cases view, the pre-job pack for the same
//                   service and hole size, and +20 Recognition points
//
// Also: a Case study in Coiled Tubing, a returned case filed again, the
// Maintenance Manager who may not file, and a corporate function where no
// case is filed or shown.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

const REASON = 'Add where it applies: the hole sections and the tool string it was seen with.';

const INCIDENT = {
  title: 'Jar fired below its set load while back-reaming',
  summary: 'The jar fired early while back-reaming a tight spot at 9,800 ft, and the string was pulled to surface to inspect it.',
  wellRef: 'Rig 12 / Well A-7', holeSize: '8 1/2', formation: 'Shuaiba',
};
const STUDY = {
  title: 'Milling a scale bridge in one run with nitrogen assist',
  headline: 'One run instead of three',
};
const LESSON = { title: 'Check the cable head torque before every perforating run' };

async function start(page, gotoApp, clearAppState, setRole, role = 'employee', area) {
  await gotoApp('/cases.html');
  await clearAppState();
  await page.evaluate(() => localStorage.setItem('taqa-tour-done', '1'));
  await setRole(role, area);
}
// As a person picks it: by clicking the label of a choice.
const pick = (page, name, value) => page.locator(`label:has(> input[name="${name}"][value="${value}"])`).click();
async function step1(page, { type, area, location, services }) {
  await pick(page, 'g-type', type);
  await page.selectOption('#f-area', area);
  await pick(page, 'g-location', location);
  for (const s of services) await pick(page, 'g-services', s);
}
async function shared(page, { title, summary, month = '2026-08', source = 'Daily drilling report 2026-08-14', author = 'Field Engineer' }) {
  await page.fill('#f-title', title);
  await page.fill('#f-summary', summary);
  await page.fill('#f-eventMonth', month);
  await page.fill('#f-sourceDoc', source);
  await page.fill('#f-authorRole', author);
}
async function submitAndLand(page) {
  await page.click('#btn-submit');
  await page.waitForURL(/\/case\.html\?doc=/, { waitUntil: 'commit', timeout: 15_000 });
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 15_000, polling: 100 });
  await page.waitForTimeout(150);
  return new URL(page.url()).searchParams.get('doc');
}
async function openFilters(page) {
  if (await page.locator('#cl-flt-btn').isVisible()) {
    await page.locator('#cl-flt-btn').click();
    await expect(page.locator('html')).toHaveClass(/cl-sheet/);
  }
}
async function closeFilters(page) {
  if (await page.evaluate(() => document.documentElement.classList.contains('cl-sheet'))) await page.locator('#cl-flt-done').click();
}
const cardOf = (page, title) => page.locator('#cl-grid .cl-card', { has: page.locator('h3', { hasText: title }) });
const points = (page) => page.evaluate(() => TAQA_RECOGNITION.pointsOf());
// QMS checks a filing from its Workbench, the way QMS does.
async function qmsChecks(page, gotoApp, setRole, n, type) {
  await setRole('qms');
  await gotoApp('/master-list.html?view=qms&doc=' + n);
  await expect(page.locator('#dw')).toHaveClass(/open/);
  await expect(page.locator('#dw-body')).toContainText(n);
  if (type) await expect(page.locator('#dw-body')).toContainText(type);
  await page.locator('#wb-confirm').click();
  await expect(page.locator('#wb-res')).toHaveAttribute('data-ok', 'true');
}
// The area's Director releases it from their desk.
async function directorReleases(page, gotoApp, setRole, area, n) {
  await setRole('owner', area);
  await gotoApp('/dashboard.html?id=' + area);
  await page.locator(`[data-store-doc="${n}"].btn-approve`).click();
  await page.locator('#approve-modal-confirm').click();
  await expect(page.locator('#dash-toast-msg')).toHaveText('Document approved and published to segment');
  expect(await page.evaluate((n) => TAQA_STORE.findDoc(n).status, n)).toBe('current');
}

test.describe('a Failure / incident card, from the form to every page that reads it', () => {
  test('an employee files it in Drilling, QMS checks it, the Director releases it, and the field finds it', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    test.setTimeout(240_000);
    await start(page, gotoApp, clearAppState, setRole);
    await gotoApp('/case-new.html');
    const before = await points(page);

    // Step 1, then the rules box comes first.
    await step1(page, { type: 'incident', area: 'drilling', location: 'Saudi Arabia', services: ['Jar', 'MM5 motor'] });
    await expect(page.locator('#incident-rules')).toBeVisible();
    await shared(page, INCIDENT);
    await page.fill('#f-customer', 'Customer as entered');
    await page.fill('#f-wellRef', INCIDENT.wellRef);
    await page.fill('#f-holeSize', INCIDENT.holeSize);
    await page.fill('#f-formation', INCIDENT.formation);
    // 1 The incident, 2 what was happening.
    await page.selectOption('#f-incident-type', 'Drill string, jars and connections');
    await page.fill('#f-incident-date', '2026-08-14');
    await page.fill('#f-incident-timeNoticed', '03:40');
    await page.fill('#f-incident-depthFt', '9800');
    await page.fill('#f-incident-equipment', 'Jar SN 4471');
    await page.fill('#f-incident-mud', 'OBM 11.2 ppg');
    await page.fill('#f-incident-nptHr', '6.5');
    await page.fill('#f-incident-activity', 'Back-reaming a tight spot');
    // 3 Symptoms, in the order they were seen.
    await page.fill('#f-incident-symptoms-0-time', '03:40');
    await page.fill('#f-incident-symptoms-0-tag', 'Overpull above baseline');
    await page.fill('#f-incident-symptoms-0-text', 'Overpull rose to 40 klbf');
    await page.click('#add-symptoms');
    await page.fill('#f-incident-symptoms-1-time', 'T+5 min');
    await page.fill('#f-incident-symptoms-1-text', 'Jar fired below its set load');
    // 4 What was tried.
    await page.fill('#f-incident-tried-0-action', 'Worked the string with reduced pull');
    await pick(page, 'g-incident-tried-0-result', 'Partial');
    await page.click('#add-tried');
    await page.fill('#f-incident-tried-1-action', 'Circulated bottoms up');
    await pick(page, 'g-incident-tried-1-result', 'Failed');
    await page.fill('#f-incident-tried-1-note', 'No change');
    // 5 POOH: the string came out, so 6 the findings at surface are required.
    await pick(page, 'g-incident-ending', 'POOH');
    await expect(page.locator('#tag-incident-findings')).toBeVisible();
    await page.click('#btn-submit');
    await expect(page.locator('#case-errors')).toBeFocused();
    await expect(page.locator('#e-incident-findings')).toHaveText('It ended with POOH, so record what was found at surface.');
    await pick(page, 'g-incident-findings', 'Connections and threads');
    await pick(page, 'g-incident-findings', 'Photos taken');
    await page.fill('#f-incident-findingsText', 'Jar mandrel scored');
    await page.fill('#f-incident-cause', 'Worn jar latch');
    await page.fill('#f-incident-contact', 'Drilling Supervisor, day crew');
    await expect(page.locator('#e-incident-findings')).toBeHidden();

    const n = await submitAndLand(page);
    expect(n).toMatch(/^TQ-TDS-DSS-INC-\d{3}$/);
    await expect(page.locator('h1')).toHaveText(INCIDENT.title);
    await expect(page.locator('#cs-status')).toContainText('Submitted for review. QMS checks it, then the Director. Until then only you, QMS, the area’s Director and an external auditor can see it.');
    // Nothing is released yet: the filer lists it as With QMS, and no one earns anything.
    await gotoApp('/cases.html');
    await expect(page.locator('#cl-mine li', { has: page.locator('a.t', { hasText: INCIDENT.title }) }).locator('.cl-st')).toHaveText('With QMS');
    expect(await points(page)).toBe(before);

    await qmsChecks(page, gotoApp, setRole, n, 'Failure / incident card');
    await directorReleases(page, gotoApp, setRole, 'drilling', n);

    // The library: by area, then by service.
    await setRole('employee');
    await gotoApp('/cases.html');
    await openFilters(page);
    await page.selectOption('#cl-area', 'drilling');
    await page.selectOption('#cl-svc', 'Jar');
    await closeFilters(page);
    await expect(page).toHaveURL(/area=drilling/);
    await expect(page).toHaveURL(/svc=Jar/);
    const card = cardOf(page, INCIDENT.title);
    await expect(card).toHaveCount(1);
    await expect(card.locator('.cl-mark')).toHaveText('INC');
    await expect(card.locator('.cl-meta')).toContainText('Rig 12 / Well A-7');
    await expect(card.locator('.cl-meta')).toContainText('8 1/2 in');
    // Services are kept in the segment's own list order, whatever order they were ticked in.
    await expect(card.locator('.cl-tag')).toHaveText(['MM5 motor', 'Jar']);
    await expect(card.locator('.cl-end')).toHaveText('Ended POOH');
    await expect(card.locator('.cl-src')).toHaveText('Field case · ' + n);
    // A service it does not carry leaves it out.
    await openFilters(page);
    await page.selectOption('#cl-svc', 'APS');
    await closeFilters(page);
    await expect(cardOf(page, INCIDENT.title)).toHaveCount(0);
    // Another area does not list it.
    await gotoApp('/cases.html?area=wireline');
    await expect(cardOf(page, INCIDENT.title)).toHaveCount(0);

    // The case page: the timeline and the ledger.
    await gotoApp('/cases.html?area=drilling&svc=Jar');
    await cardOf(page, INCIDENT.title).locator('h3 a').click();
    await expect(page).toHaveURL(new RegExp('/case\\.html\\?doc=' + n + '&rev=1\\.0'));
    await expect(page.locator('h1')).toHaveText(INCIDENT.title);
    await expect(page.locator('#cs-banner')).toBeEmpty();
    const tl = page.locator('#cs-symptoms .cs-tl li');
    await expect(tl).toHaveCount(2);
    await expect(tl.nth(0).locator('.tm')).toHaveText('03:40');
    await expect(tl.nth(0).locator('.cs-tag')).toHaveText('Overpull above baseline');
    await expect(tl.nth(0).locator('.tx')).toHaveText('Overpull rose to 40 klbf');
    await expect(tl.nth(1).locator('.tm')).toHaveText('T+5 min');
    const led = page.locator('#cs-tried .cs-led li');
    await expect(led).toHaveCount(2);
    await expect(led.nth(0).locator('.cs-res')).toHaveText('Partial');
    await expect(led.nth(1).locator('.cs-res')).toHaveText('Failed');
    await expect(led.nth(1).locator('.nt')).toHaveText('No change');
    await expect(page.locator('#cs-tried h2')).toContainText('2 steps: 1 partial, 1 failed');
    await expect(page.locator('#cs-ended .big')).toHaveText('POOH');
    await expect(page.locator('#cs-findings .cs-find')).toHaveText(['Connections and threads', 'Photos taken']);
    await expect(page.locator('#cs-findings')).toContainText('Jar mandrel scored');
    await expect(page.locator('#cs-hyp .lab')).toHaveText('Hypothesis, not a finding');
    await expect(page.locator('.cs-facts')).toContainText('9,800 ft MD');

    // Drilling's Field cases strip.
    await gotoApp('/segment.html?id=drilling');
    const strip = page.locator('#seg-cases');
    await expect(strip).toBeVisible();
    await expect(strip.locator('.sc-sub')).toContainText('1 field case');
    await expect(strip.locator('.sc-list li').first()).toContainText(INCIDENT.title);
    await expect(strip.locator('#sc-all')).toHaveAttribute('href', 'cases.html?area=drilling');

    // Search, Field cases.
    await gotoApp('/ai-search.html');
    await page.locator('#sr-content label', { hasText: 'Field cases' }).click();
    await expect(page).toHaveURL(/content=cases/);
    await page.locator('#query-input').fill('mandrel');
    await page.locator('#query-input').press('Enter');
    const row = page.locator('#results-list .result.is-case');
    await expect(row).toHaveCount(1);
    await expect(row).toHaveAttribute('href', `case.html?doc=${n}&rev=1.0`);
    await expect(row.locator('.r-title')).toHaveText(INCIDENT.title);
    await expect(row.locator('.r-end')).toHaveText('Ended: POOH');
    await expect(page.locator('#result-count')).toHaveText('1 field case for “mandrel”');

    // The pre-job pack, once the same service and hole size are chosen.
    await gotoApp('/prejob.html?area=drilling');
    await page.locator('#pj-svc [data-svc="Jar"]').click();
    await page.locator('#pj-hole').fill('8.5');
    await page.locator('#pj-hole').blur();
    await expect(page.locator('#pj-n-match')).toHaveText('1');
    const first = page.locator('#pj-g-watch .pj-item').first();
    await expect(first.locator('.pj-t')).toHaveText(INCIDENT.title);
    await expect(first.locator('.pj-why')).toHaveText(/Same service: Jar · Same hole size: 8 1\/2 in/);
    await expect(first.locator('.pj-end')).toContainText('Ended: POOH');

    // Recognition: an incident card earns what a lesson earns.
    expect(await points(page)).toBe(before + 20);
    await gotoApp('/recognition.html?area=drilling');
    const mine = page.locator('#rc-mine-list li', { hasText: INCIDENT.title });
    await expect(mine).toHaveCount(1);
    await expect(mine).toContainText('+20');
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('the other routes', () => {
  test('a Case study in Coiled Tubing is filed, released and read in its own area only', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    test.setTimeout(180_000);
    await start(page, gotoApp, clearAppState, setRole);
    await gotoApp('/case-new.html');
    const before = await points(page);
    await step1(page, { type: 'case-study', area: 'coiled-tubing', location: 'UAE', services: ['Milling', 'Nitrogen injection'] });
    await shared(page, { title: STUDY.title, summary: 'A scale bridge was milled in one run with nitrogen assist, where earlier wells took three.',
      month: '2026-07', source: 'Job report CT-2026-118', author: 'CT Supervisor' });
    await page.fill('#f-holeSize', '4 1/2');
    await page.fill('#f-sections-challenge', 'Hard scale bridge at 7,450 ft');
    await page.fill('#f-sections-action', 'Milled with nitrogen assist at a reduced pump rate');
    await page.fill('#f-sections-result', 'One run, 6 hr on bottom');
    await page.fill('#f-sections-headline', STUDY.headline);
    const n = await submitAndLand(page);
    expect(n).toMatch(/^TQ-TWS-CTSS-CS-\d{3}$/);
    await expect(page.locator('h1')).toHaveText(STUDY.title);

    await qmsChecks(page, gotoApp, setRole, n, 'Case study');
    await directorReleases(page, gotoApp, setRole, 'coiled-tubing', n);

    await setRole('employee');
    await gotoApp('/cases.html?area=coiled-tubing');
    const card = cardOf(page, STUDY.title);
    await expect(card.locator('.cl-mark')).toHaveText('CS');
    await expect(card.locator('.cl-tag')).toHaveText(['Nitrogen injection', 'Milling']);
    await expect(card.locator('.cl-end')).toHaveCount(0);
    await gotoApp('/cases.html?area=drilling');
    await expect(cardOf(page, STUDY.title)).toHaveCount(0);

    await gotoApp(`/case.html?doc=${n}&rev=1.0`);
    await expect(page.locator('.cs-fig b')).toHaveText(STUDY.headline);
    await expect(page.locator('#cs-type-sec')).toContainText('One run, 6 hr on bottom');
    await expect(page.locator('#cs-symptoms')).toHaveCount(0);

    await gotoApp('/prejob.html?area=coiled-tubing&svc=Milling');
    await expect(page.locator('#pj-g-worked .pj-item', { hasText: STUDY.title }).locator('.pj-why')).toContainText('Same service: Milling');
    await gotoApp('/segment.html?id=coiled-tubing');
    await expect(page.locator('#seg-cases .sc-list li').first()).toContainText(STUDY.title);
    // A case that is not an incident earns as a document does.
    expect(await points(page)).toBe(before + 10);
    assertNoConsoleErrors(consoleErrors);
  });

  test('a returned case is edited and filed again, keeps its number, and lists once', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    test.setTimeout(180_000);
    await start(page, gotoApp, clearAppState, setRole);
    await gotoApp('/case-new.html');
    await step1(page, { type: 'lesson', area: 'wireline', location: 'Pakistan', services: ['Perforation'] });
    await shared(page, { title: LESSON.title, summary: 'A loose cable head stopped a perforating run and cost a trip.',
      month: '2026-06', source: 'Job report WL-2026-031', author: 'Wireline Engineer' });
    await page.fill('#f-sections-happened', 'The cable head backed off during the second run');
    await page.fill('#f-sections-matters', 'A lost cable head is a fishing job');
    await page.fill('#f-sections-differently', 'Torque the cable head to the stated value and record it');
    const n = await submitAndLand(page);
    expect(n).toMatch(/^TQ-TWS-WS-LL-\d{3}$/);

    // QMS returns it from the Workbench, with a reason. The drawer names who
    // releases a field case: the area's Director, as for every case type.
    await setRole('qms');
    await gotoApp('/master-list.html?view=qms&doc=' + n);
    await expect(page.locator('#dw')).toHaveClass(/open/);
    await expect(page.locator('#dw-body')).toContainText('Relevant Operation Director');
    await page.locator('#wb-reject').click();
    await page.locator('#wb-reason').fill(REASON);
    await page.locator('#wb-reject-go').click();
    await expect(page.locator('#wb-res')).toContainText('Rejected and returned to its author with your reason.');

    // The filer sees why, and files it again from the library.
    await setRole('employee');
    await gotoApp('/cases.html');
    const row = page.locator('#cl-mine li', { has: page.locator('a.t', { hasText: LESSON.title }) });
    await expect(row.locator('.cl-st')).toHaveText('Returned');
    await expect(row.locator('.cl-why')).toContainText(REASON);
    await row.locator('.cl-why a').click();
    await expect(page).toHaveURL(/\/case-new\.html\?edit=/);
    await expect(page.locator('h1')).toHaveText('File the case again');
    await expect(page.locator('#case-returned-why')).toHaveText(REASON);
    await expect(page.locator('#case-returned')).toContainText('attempt 2');
    await expect(page.locator('#btn-submit')).toContainText('File it again');
    await page.fill('#f-sections-applies', 'Every perforating run with a crossover cable head');
    const again = await submitAndLand(page);
    expect(again).toBe(n);
    await expect(page.locator('#cs-status')).toContainText('Submitted for review.');

    // One line per case in Your contributions: the new attempt, with QMS.
    await gotoApp('/cases.html');
    const rows = page.locator('#cl-mine li', { has: page.locator('a.t', { hasText: LESSON.title }) });
    await expect(rows).toHaveCount(1);
    await expect(rows.locator('.cl-st')).toHaveText('With QMS');
    const fam = await page.evaluate((n) => TAQA_STORE.all().filter((d) => d.docNumber === n)
      .map((d) => [d.attempt || 1, !!d.rejected, d.card.sections.applies]), n);
    expect(fam).toEqual(expect.arrayContaining([[1, true, ''], [2, false, 'Every perforating run with a crossover cable head']]));
    expect(fam).toHaveLength(2);
    // Every attempt is on record; lists of your cases show the newest, and the
    // returned attempt cannot be filed a second time.
    const lists = await page.evaluate((n) => {
      const all = TAQA_CASES.mine().filter((e) => e.docNumber === n);
      return { all: all.map((e) => e.status), latest: TAQA_CASES.mine({ latest: true }).filter((e) => e.docNumber === n).map((e) => e.status),
        again: all.filter((e) => e.status === 'returned').map((e) => TAQA_CASES.canResubmit(e)),
        approver: TAQA_APPROVAL.approverFor(TAQA_STORE.findDoc(n)) };
    }, n);
    expect(lists).toEqual({ all: ['with-qms', 'returned'], latest: ['with-qms'], again: [false], approver: 'Relevant Operation Director' });

    // The new attempt goes the whole way, and the library lists it once.
    await qmsChecks(page, gotoApp, setRole, n);
    await directorReleases(page, gotoApp, setRole, 'wireline', n);
    await setRole('employee');
    await gotoApp('/cases.html?area=wireline');
    await expect(cardOf(page, LESSON.title)).toHaveCount(1);
    await expect(cardOf(page, LESSON.title).locator('.cl-mark')).toHaveText('LL');
    assertNoConsoleErrors(consoleErrors);
  });

  test('a Maintenance Manager cannot file a case, from any page or the register', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole, 'maintenance', 'drilling');
    await gotoApp('/case-new.html?area=drilling');
    await expect(page.locator('#case-refused')).toBeVisible();
    await expect(page.locator('#case-refused')).toContainText('Field cases are filed by operations: an employee or the area’s Director.');
    await expect(page.locator('#case-form')).toBeHidden();
    await expect(page.locator('#btn-submit')).toHaveCount(0);
    await gotoApp('/cases.html?area=drilling');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#cl-add')).toBeHidden();
    await gotoApp('/prejob.html?area=drilling');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a[href^="case-new.html"]')).toHaveCount(0);
    // Their segment opens on its Maintenance view, where no case strip is offered.
    await gotoApp('/segment.html?id=drilling');
    await expect(page.locator('#seg-cases')).toBeHidden();
    // Nor can the register be asked directly.
    const r = await page.evaluate(() => {
      const draft = { type: 'lesson', area: 'drilling', location: 'Saudi Arabia', services: ['Jar'], title: 'Maintenance lesson',
        summary: 'x', eventMonth: '2026-08', sourceDoc: 'x', authorRole: 'Maintenance Supervisor',
        sections: { happened: 'x', matters: 'x', differently: 'x' } };
      const filed = TAQA_CASES.file(draft);
      const rec = TAQA_CASES.toRecord(draft);
      return { can: TAQA_CASES.canFile('drilling').ok, error: filed.error, why: TAQA_STORE.checkFiling(rec), added: TAQA_STORE.add(rec),
        dept: TAQA_STORE.checkFiling(Object.assign({}, rec, { department: 'maintenance' })), cases: TAQA_STORE.all().filter((d) => d.card).length };
    });
    expect(r.can).toBe(false);
    expect(r.error).toBe('Field cases are filed by operations: an employee or the area’s Director.');
    expect(r.why).toBe('Field cases are filed by operations: an employee or the area’s Director.');
    expect(r.dept).toBe('A field case is filed by operations, never by a maintenance department.');
    expect(r.added).toBeNull();
    expect(r.cases).toBe(0);
    assertNoConsoleErrors(consoleErrors);
  });

  test('a corporate function files no case and shows none, even with cases released elsewhere', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    test.setTimeout(120_000);
    await start(page, gotoApp, clearAppState, setRole);
    await gotoApp('/cases.html');
    // A released case in Drilling, so there is something that could leak.
    const n = await page.evaluate(() => {
      const r = TAQA_CASES.file({ type: 'practice', area: 'drilling', location: 'Saudi Arabia', services: ['Jar'], title: 'Stage the jar firing test',
        summary: 'Test the jar on surface before each run.', eventMonth: '2026-08', sourceDoc: 'Drilling report', authorRole: 'Driller',
        sections: { practice: 'Surface jar test', where: 'Every run with a jar', evidence: 'Fewer early firings' } });
      TAQA_ROLE.set('qms'); TAQA_STORE.countersign(r.record.docNumber);
      TAQA_ROLE.set('owner'); TAQA_ROLE.setArea('drilling'); TAQA_STORE.approve(r.record.docNumber);
      TAQA_ROLE.set('employee');
      return r.record.docNumber;
    });
    expect(await page.evaluate((n) => TAQA_STORE.findDoc(n).status, n)).toBe('current');

    // Filing for a corporate function is refused by the form's rules and the register's.
    const r = await page.evaluate(() => {
      const draft = { type: 'lesson', area: 'qhse', location: 'Saudi Arabia', services: ['Other report'], title: 'A QHSE lesson',
        summary: 'x', eventMonth: '2026-08', sourceDoc: 'x', authorRole: 'x', sections: { happened: 'x', matters: 'x', differently: 'x' } };
      const rec = Object.assign(TAQA_CASES.toRecord(Object.assign({}, draft, { area: 'drilling' })), { segment: 'qhse' });
      return { can: TAQA_CASES.canFile('qhse'), filed: TAQA_CASES.file(draft).problems.map((p) => p.key), why: TAQA_STORE.checkFiling(rec),
        lists: ['qhse', 'hr', 'company', 'pt-drilling-coe'].map((a) => TAQA_CASES.forArea(a).length) };
    });
    expect(r.can.ok).toBe(false);
    expect(r.can.why).toBe('A field case is filed only for an operational segment.');
    expect(r.filed).toContain('area');
    expect(r.why).toBe('A field case is filed only for an operational segment.');
    expect(r.lists).toEqual([0, 0, 0, 0]);

    // The form does not offer it.
    await gotoApp('/case-new.html?area=qhse');
    const areas = await page.locator('#f-area option').evaluateAll((els) => els.map((e) => e.value).filter(Boolean));
    expect(areas).toEqual(await page.evaluate(() => TAQA_CASES.operational().map((a) => a.id)));
    await expect(page.locator('#f-area')).toHaveValue('');
    // The library says so and lists only operational segments.
    await gotoApp('/cases.html?area=qhse');
    await expect(page.locator('#cl-area-note')).toContainText('is not an operational segment');
    expect(await page.locator('#cl-grid .cl-card').evaluateAll((els) => els.map((e) => e.textContent)
      .filter((t) => /QHSE|Quality, Health/.test(t)).length)).toBe(0);
    // The function's own page has no Field cases strip.
    for (const id of ['qhse', 'hr']) {
      await gotoApp('/segment.html?id=' + id);
      await expect(page.locator('#seg-cases'), id).toBeHidden();
    }
    // The pre-job pack says the area is not one it covers.
    await gotoApp('/prejob.html?area=qhse');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.pj-item')).toHaveCount(0);
    // A Director of a function is refused, with the reason.
    await setRole('owner', 'qhse');
    await gotoApp('/case-new.html');
    await expect(page.locator('#case-refused')).toContainText('is not an operational segment');
    assertNoConsoleErrors(consoleErrors);
  });
});
