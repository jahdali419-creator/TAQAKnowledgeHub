// Field cases as a person meets them: the Case library (cases.html) and one
// case (case.html).
//
//   cases.html  released field cases, supplied cases and the register's own
//               lessons and alerts, each labelled with where it came from;
//               filters that follow the area; "Ended with" chips; the
//               filer's own work with its status; a filter sheet on a phone
//   case.html   every content type; the incident card as it happened (a
//               timeline of symptoms, a ledger of what was tried, the ending,
//               the findings and the hypothesis kept apart); print; JSON and
//               HTML card downloads; Edit for a returned case; related cases;
//               the same visibility rules as the rest of RISE
//
// Cases are filed, checked and released by the people who would really do
// it (TAQA_CASES.file as the employee, countersign as QMS, approve as the
// area's Director), never forged into storage.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

const REASON = 'The result needs the figures from the end of well report, please add them.';

const INCIDENT = {
  type: 'incident', area: 'drilling', location: 'Saudi Arabia', services: ['Jar', 'MM5 motor'],
  title: 'Jar fired early while working a tight spot',
  summary: 'The jar fired below its set load while back-reaming at 9,800 ft, and the string was pulled to surface.',
  eventMonth: '2026-08', customer: 'Customer as entered', field: 'Field as entered', wellRef: 'Rig 12 / Well A-7',
  holeSize: '8 1/2', formation: 'Shuaiba', sourceDoc: 'Daily drilling report 2026-08-14', authorRole: 'Field Engineer',
  classification: 'internal', salesReady: false, sections: {},
  incident: {
    type: 'Drill string, jars and connections', date: '2026-08-14', timeNoticed: '03:40', depthFt: '9800',
    equipment: 'Jar SN 4471', mud: 'OBM 11.2 ppg', nptHr: '6.5', activity: 'Back-reaming a tight spot',
    ongoing: '', conditions: 'Overpull 40 klbf',
    symptoms: [
      { time: '03:40', tag: 'Overpull above baseline', text: 'Overpull rose to 40 klbf' },
      { time: 'T+5 min', tag: '', text: 'Jar fired below its set load' },
    ],
    tried: [
      { action: 'Worked the string with reduced pull', result: 'Partial', note: '' },
      { action: 'Circulated bottoms up', result: 'Failed', note: 'No change' },
    ],
    ending: 'POOH', findings: ['Connections and threads', 'Photos taken'], findingsText: 'Jar mandrel scored',
    cause: 'Worn jar latch', contact: 'Drilling Supervisor, day crew',
  },
};
const MOTOR = JSON.parse(JSON.stringify(INCIDENT));
Object.assign(MOTOR, { title: 'Motor stalled in the Shuaiba stringers', services: ['MM5 motor'], holeSize: '6 1/8', wellRef: 'Rig 31' });
Object.assign(MOTOR.incident, { date: '2026-06-03', ending: 'Drilling ahead', findings: [], findingsText: '', cause: '', contact: '' });
const CASE_STUDY = {
  type: 'case-study', area: 'drilling', location: 'UAE', services: ['DTECH RSS'],
  title: 'RSS held the tangent through the build section', summary: 'One run through the build and tangent with the RSS.',
  eventMonth: '2026-07', holeSize: '12 1/4', sourceDoc: 'End of well report', authorRole: 'Directional Driller', salesReady: true,
  sections: { challenge: 'Long tangent in hard stringers', action: 'Ran the RSS with a tuned BHA', result: 'One run, 2,100 ft', headline: '2,100 ft in one run' },
};
const WIRELINE = {
  type: 'alert', area: 'wireline', location: 'India', services: ['Perforation'], title: 'Gun string limit above 60 degrees',
  summary: 'Gun strings over 40 ft stuck twice in deviated wells.', eventMonth: '2026-05', sourceDoc: 'TQ-TWS-WLS-SOP-003',
  authorRole: 'Wireline Engineer',
  sections: { tool: 'Perforating gun string', limit: 'No more than 40 ft above 60 degrees', evidence: 'Two stuck strings', action: 'Split the run' },
};

async function start(page, gotoApp, clearAppState, setRole, role = 'employee', area) {
  await gotoApp('/cases.html');
  await clearAppState();
  await page.evaluate(() => localStorage.setItem('taqa-tour-done', '1'));
  await setRole(role, area);
}
// Runs fn(arg) in the page as the person who would really take that step.
const as = (page, role, area, fn, arg) => page.evaluate(({ role, area, src, arg }) => {
  TAQA_ROLE.set(role);
  if (area) TAQA_ROLE.setArea(area);
  // eslint-disable-next-line no-new-func
  return new Function('arg', 'return (' + src + ')(arg);')(arg);
}, { role, area, src: fn.toString(), arg });
const fileAs = (page, role, area, draft) => as(page, role, area, (draft) => {
  const r = TAQA_CASES.file(draft);
  return { ok: r.ok, error: r.error || null, n: r.record ? r.record.docNumber : null,
           key: r.record ? TAQA_STORE.recordKey(r.record) : null, url: r.url || null };
}, draft);
const check = (page, n) => as(page, 'qms', null, (n) => TAQA_STORE.countersign(n), n);
const release = (page, area, n) => as(page, 'owner', area, (n) => TAQA_STORE.approve(n), n);
async function fileAndRelease(page, draft) {
  const f = await fileAs(page, 'employee', null, draft);
  expect(f.ok, f.error).toBe(true);
  expect((await check(page, f.n)).ok).toBe(true);
  expect((await release(page, draft.area, f.n)).ok).toBe(true);
  return f;
}
// On a phone the filters live in a sheet; on a desk screen they are always there.
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
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);

test.describe('the case library', () => {
  test('lists the register\'s lessons and alerts as Register, invents no case, and says so when there is none', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await gotoApp('/cases.html');
    await expect(page.locator('h1')).toContainText('What happened before.');
    await expect(page.locator('h1 .l2')).toHaveText('What was tried. What was found.');
    await expect(page.locator('#cl-eyebrow')).toHaveText('All operational segments · Field cases');
    const n = await page.evaluate(() => TAQA_CASES.released().length);
    expect(n).toBeGreaterThan(20);
    await expect(page.locator('#cl-n-all')).toHaveText(String(n));
    await expect(page.locator('#cl-n-case')).toHaveText('0');
    await expect(page.locator('#cl-n-mine')).toHaveText('0');
    await expect(page.locator('#cl-count')).toContainText(n + ' entries');
    await expect(page.locator('#cl-grid .cl-card').first().locator('.cl-src')).toContainText('Register document');
    await expect(page.locator('#cl-grid .cl-card .cl-src', { hasText: 'Field case' })).toHaveCount(0);
    // An employee files cases: the hero offers it, with the pre-job pack.
    await expect(page.locator('#cl-add')).toBeVisible();
    await expect(page.locator('#cl-add')).toHaveAttribute('href', 'case-new.html');
    await expect(page.locator('#cl-pack')).toHaveAttribute('href', 'prejob.html');
    // Structured cases only: an honest empty state, never a made-up case.
    await openFilters(page);
    await page.locator('#cl-src input[value="case"]').check();
    await closeFilters(page);
    await expect(page.locator('#cl-empty')).toContainText('No field case has been released in the operational segments yet');
    await expect(page.locator('#cl-empty a[href="case-new.html"]')).toBeVisible();
    await expect(page).toHaveURL(/src=case/);
    // The opener and the route say who may see what.
    await expect(page.locator('#cl-route')).toContainText('Until it is released, only its filer, QMS, the area’s Director and an external auditor can see it.');
    assertNoConsoleErrors(consoleErrors);
  });

  test('a released incident is a card with its facts, and the filters follow the area', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const inc = await fileAndRelease(page, INCIDENT);
    await fileAndRelease(page, CASE_STUDY);
    await fileAndRelease(page, WIRELINE);
    await setRole('employee');
    await gotoApp('/cases.html?area=drilling');
    await expect(page.locator('#cl-eyebrow')).toHaveText('Drilling Services · Field cases');
    await expect(page.locator('#cl-n-case')).toHaveText('2');
    await expect(page.locator('#cl-add')).toHaveAttribute('href', 'case-new.html?area=drilling');
    await expect(page.locator('#cl-pack')).toHaveAttribute('href', 'prejob.html?area=drilling');
    // Browsing everything, structured cases come first.
    await expect(page.locator('#cl-grid .cl-card').first().locator('.cl-src')).toContainText('Field case');

    const card = cardOf(page, INCIDENT.title);
    await expect(card.locator('.cl-tl b')).toHaveText('Failure / incident card');
    await expect(card.locator('.cl-mark')).toHaveText('INC');
    await expect(card.locator('.cl-meta')).toHaveText('Rig 12 / Well A-7 · Field as entered · 8 1/2 in · 14 Aug 2026');
    await expect(card.locator('.cl-tag')).toHaveText(['Jar', 'MM5 motor']);
    await expect(card.locator('.cl-end')).toHaveText('Ended POOH');
    await expect(card.locator('.cl-src')).toHaveText('Field case · ' + inc.n);
    await expect(card.locator('h3 a')).toHaveAttribute('href', 'case.html?doc=' + inc.n + '&rev=1.0');

    // Drilling's own services and endings.
    await openFilters(page);
    const svc = await page.locator('#cl-svc option').allTextContents();
    expect(svc).toEqual(['Any service or tool', 'DTECH RSS', 'Azem RSS', 'MM5 motor', 'Telefusion', 'APS', 'VERTEX', 'ION', 'Jar',
      'Shock subs', 'THRUSTER', 'THRELIX', 'Drilling engineering', 'Other (not listed)']);
    await expect(page.locator('#cl-endings button')).toHaveText(['POOH1', 'Troubleshooting0', 'CIRC0', 'Drilling ahead0']);
    await page.locator('#cl-endings button[data-end="POOH"]').click();
    await expect(page.locator('#cl-endings button[data-end="POOH"]')).toHaveAttribute('aria-pressed', 'true');
    await closeFilters(page);
    await expect(page.locator('#cl-count')).toHaveText('1 entry');
    await expect(page).toHaveURL(/area=drilling&end=POOH/);

    // Another area: its own services and endings, and the drilling ending is dropped.
    await openFilters(page);
    await page.selectOption('#cl-area', 'wireline');
    await expect(page.locator('#cl-svc option')).toHaveText(['Any service or tool', 'Perforation', 'Memory logging', 'Pump-down operations',
      'Slickline tool running', 'Tool string assembly', 'Well re-entry', 'Emergency recovery', 'Logging data QC', 'Other (not listed)']);
    await expect(page.locator('#cl-endings button')).toHaveText(['Pulled out of hole0', 'Troubleshooting continued0',
      'Circulating / monitoring0', 'Job continued0', 'Job suspended0']);
    await closeFilters(page);
    await expect(page.locator('#cl-eyebrow')).toHaveText('Wireline Services · Field cases');
    await expect(cardOf(page, WIRELINE.title)).toBeVisible();
    await expect(page).not.toHaveURL(/end=/);

    // Every segment again; a hole size; then a word from deep inside the card.
    await openFilters(page);
    await page.selectOption('#cl-area', '');
    await page.selectOption('#cl-hole', '12 1/4');
    await closeFilters(page);
    await expect(page.locator('#cl-grid h3')).toHaveText([CASE_STUDY.title]);
    await page.locator('#cl-clear').click();
    await page.locator('#cl-q').fill('mandrel scored');
    await expect(page.locator('#cl-grid h3')).toHaveText([INCIDENT.title]);
    await expect(page.locator('#cl-count')).toHaveText('1 entry for “mandrel scored”');
    // The register's own entries never carry a structured case.
    await openFilters(page);
    await page.locator('#cl-src input[value="register"]').check();
    await closeFilters(page);
    await expect(page.locator('#cl-grid .cl-card')).toHaveCount(0);
    await expect(page.locator('#cl-empty')).toContainText('Nothing matches “mandrel scored”');
    assertNoConsoleErrors(consoleErrors);
  });

  test('Your contributions shows every status, and a returned case leads to its edit', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const waiting = await fileAs(page, 'employee', null, Object.assign({}, CASE_STUDY, { title: 'Waiting on QMS' }));
    const director = await fileAs(page, 'employee', null, Object.assign({}, CASE_STUDY, { title: 'Waiting on the Director' }));
    await check(page, director.n);
    await fileAndRelease(page, Object.assign({}, CASE_STUDY, { title: 'Released already' }));
    const back = await fileAs(page, 'employee', null, Object.assign({}, CASE_STUDY, { title: 'Sent back' }));
    expect((await as(page, 'qms', null, ({ n, r }) => TAQA_STORE.reject(n, r), { n: back.n, r: REASON })).ok).toBe(true);
    await setRole('employee');
    await gotoApp('/cases.html');
    await expect(page.locator('#cl-n-mine')).toHaveText('4');
    const box = page.locator('#cl-mine');
    await expect(box).toBeVisible();
    await expect(box.locator('#cl-mine-sub')).toHaveText('4 cases filed: 1 returned, 1 with QMS, 1 with the Director, 1 published.');
    const row = (t) => box.locator('li', { has: page.locator('a.t', { hasText: t }) });
    // Newest filing first; a phone shows the latest three, a desk screen five.
    await expect(box.locator('li a.t').first()).toHaveText('Sent back');
    await expect(row('Released already').locator('.cl-st')).toHaveText('Published');
    await expect(row('Waiting on the Director').locator('.cl-st')).toHaveText('With the Director');
    await expect(row('Sent back').locator('.cl-st')).toHaveText('Returned');
    await expect(row('Sent back').locator('.cl-why')).toContainText(REASON);
    await expect(row('Sent back').locator('.cl-why a')).toHaveAttribute('href', 'case-new.html?edit=' + encodeURIComponent(back.key));
    await expect(row('Sent back').locator('a.t')).toHaveAttribute('href', new RegExp('&rid=' + encodeURIComponent(back.key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
    // Waiting cases are not in the library for anyone else, but the filer lists them all.
    await expect(cardOf(page, 'Waiting on QMS')).toHaveCount(0);
    await box.locator('button[data-src="mine"]').click();
    await expect(page.locator('#cl-results-h')).toHaveText('Your cases');
    await expect(page.locator('#cl-grid .cl-card')).toHaveCount(4);
    await expect(cardOf(page, 'Waiting on QMS').locator('.cl-st')).toHaveText('With QMS');
    await expect(cardOf(page, 'Waiting on the Director').locator('.cl-st')).toHaveText('With the Director');
    await expect(cardOf(page, 'Sent back').locator('.cl-st')).toHaveText('Returned');
    await expect(cardOf(page, 'Released already').locator('.cl-st')).toHaveCount(0);
    expect(waiting.ok).toBe(true);

    // Roles that do not file see no offer to file and no contributions box.
    for (const [role, area] of [['qms'], ['auditor'], ['maintenance', 'drilling']]) {
      await setRole(role, area);
      await gotoApp('/cases.html');
      await expect(page.locator('#cl-add'), role).toBeHidden();
      await expect(page.locator('#cl-mine'), role).toBeHidden();
      await expect(page.locator('#cl-stat-mine'), role).toBeHidden();
    }
    // A Director files for the area they hold.
    await setRole('owner', 'drilling');
    await gotoApp('/cases.html');
    await expect(page.locator('#cl-add')).toHaveAttribute('href', 'case-new.html?area=drilling');
    assertNoConsoleErrors(consoleErrors);
  });

  test('an area that is not operational is named, and every segment is shown', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await gotoApp('/cases.html?area=qhse');
    await expect(page.locator('#cl-area-note')).toContainText('is not an operational segment');
    await expect(page.locator('#cl-eyebrow')).toHaveText('All operational segments · Field cases');
  });
});

test.describe('one case', () => {
  test('an incident reads as it happened, with the hypothesis kept apart', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const f = await fileAndRelease(page, INCIDENT);
    await setRole('employee');
    await gotoApp('/case.html?doc=' + f.n + '&rev=1.0');
    await expect(page.locator('h1')).toHaveText(INCIDENT.title);
    await expect(page).toHaveTitle(INCIDENT.title + ', RISE');
    await expect(page.locator('#navbar a.active[aria-current="page"]')).toHaveAttribute('href', 'cases.html');
    await expect(page.locator('.cs-crumb a').nth(1)).toHaveAttribute('href', 'cases.html?area=drilling');
    await expect(page.locator('#cs-chips')).toContainText('Failure / incident card');
    await expect(page.locator('#cs-num')).toContainText(f.n + ' · Rev 1.0');
    await expect(page.locator('#cs-banner')).toBeEmpty();
    // Facts, blanks said honestly.
    const facts = page.locator('.cs-facts');
    for (const v of ['Customer as entered', 'Rig 12 / Well A-7', '8 1/2 in', 'Jar, MM5 motor', 'Jar SN 4471', '14 Aug 2026',
      '9,800 ft MD', 'OBM 11.2 ppg', '6.5 hr', 'Daily drilling report 2026-08-14', 'Saudi Arabia', 'Internal', 'Field Engineer']) {
      await expect(facts, v).toContainText(v);
    }
    // Symptoms on a numbered timeline, in order, with time and tag.
    const tl = page.locator('#cs-symptoms .cs-tl li');
    await expect(tl).toHaveCount(2);
    await expect(tl.nth(0).locator('.tm')).toHaveText('03:40');
    await expect(tl.nth(0).locator('.cs-tag')).toHaveText('Overpull above baseline');
    await expect(tl.nth(0).locator('.tx')).toHaveText('Overpull rose to 40 klbf');
    await expect(tl.nth(1).locator('.tm')).toHaveText('T+5 min');
    await expect(tl.nth(1).locator('.cs-tag')).toHaveCount(0);
    // The ledger, with each result as a chip.
    const led = page.locator('#cs-tried .cs-led li');
    await expect(led).toHaveCount(2);
    await expect(led.nth(0).locator('.cs-res')).toHaveText('Partial');
    await expect(led.nth(0).locator('.cs-res')).toHaveClass(/r-partial/);
    await expect(led.nth(1).locator('.cs-res')).toHaveText('Failed');
    await expect(led.nth(1).locator('.nt')).toHaveText('No change');
    await expect(page.locator('#cs-tried h2')).toContainText('2 steps: 1 partial, 1 failed');
    // How it ended, then what was found, then the hypothesis.
    await expect(page.locator('#cs-ended .big')).toHaveText('POOH');
    await expect(page.locator('#cs-ended')).toContainText('Tripped out to inspect or change the BHA');
    await expect(page.locator('#cs-findings .cs-find')).toHaveText(['Connections and threads', 'Photos taken']);
    await expect(page.locator('#cs-findings')).toContainText('Jar mandrel scored');
    await expect(page.locator('#cs-hyp .lab')).toHaveText('Hypothesis, not a finding');
    await expect(page.locator('#cs-hyp p')).toHaveText('Worn jar latch');
    // The filer is a reviewer of their own case; another area's Director is not.
    await expect(page.locator('#cs-contact')).toContainText('Drilling Supervisor, day crew');
    await setRole('owner', 'wireline');
    await gotoApp('/case.html?doc=' + f.n + '&rev=1.0');
    await expect(page.locator('h1')).toHaveText(INCIDENT.title);
    await expect(page.locator('#cs-contact')).toHaveCount(0);
    await expect(page.locator('#main')).not.toContainText('Drilling Supervisor');
    assertNoConsoleErrors(consoleErrors);
  });

  test('downloads the JSON and the HTML card, and prints as a clean sheet', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const f = await fileAndRelease(page, INCIDENT);
    await setRole('employee');
    await gotoApp('/case.html?doc=' + f.n + '&rev=1.0');
    const fs = require('fs');
    const [json] = await Promise.all([page.waitForEvent('download'), page.locator('#cs-json').click()]);
    expect(json.suggestedFilename()).toBe(f.n + '.json');
    const data = JSON.parse(fs.readFileSync(await json.path(), 'utf8'));
    expect([data.schema, data.docNumber, data.title, data.card.incident.ending]).toEqual(['taqa-field-case/1', f.n, INCIDENT.title, 'POOH']);
    const [html] = await Promise.all([page.waitForEvent('download'), page.locator('#cs-html').click()]);
    expect(html.suggestedFilename()).toBe(f.n + '.html');
    const card = fs.readFileSync(await html.path(), 'utf8');
    expect(card.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(card).toContain('Suspected cause: hypothesis, not a finding');
    expect(card).not.toContain('<script');
    await expect(page.locator('#cs-live')).toContainText('Downloaded ' + f.n + '.html.');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#navbar')).toBeHidden();
    await expect(page.locator('#cs-actions')).toBeHidden();
    await expect(page.locator('#cs-related')).toBeHidden();
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#cs-print-foot')).toBeVisible();
    await expect(page.locator('#cs-print-foot')).toContainText('Classification INTERNAL');
    await page.emulateMedia({ media: 'screen' });
    assertNoConsoleErrors(consoleErrors);
  });

  test('every content type shows its own sections, and the filer sees the review banner', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    test.setTimeout(90_000);
    await start(page, gotoApp, clearAppState, setRole);
    // One case of each type, its required sections filled from the shape of a case.
    const filed = await as(page, 'employee', null, (inc) => {
      return TAQA_CASES.TYPES.map((t) => {
        const fields = TAQA_CASES.FIELDS.sections[t.key] || [];
        const sections = {};
        fields.forEach((f) => { sections[f.key] = f.kind === 'check' ? true : 'Value for ' + f.label; });
        const d = t.key === 'incident' ? JSON.parse(JSON.stringify(inc)) : {
          type: t.key, area: 'cementing', location: 'Pakistan', services: ['Primary cementing'], title: 'A ' + t.label + ' case',
          summary: 'Summary of the ' + t.label + ' case.', eventMonth: '2026-04', sourceDoc: 'Job report', authorRole: 'Cementing Engineer',
          salesReady: t.key === 'appreciation', sections };
        const r = TAQA_CASES.file(d);
        return { key: t.key, label: t.label, ok: r.ok, error: r.error || null, n: r.record && r.record.docNumber, title: d.title,
                 fields: fields.filter((f) => f.kind !== 'check').map((f) => [f.label, 'Value for ' + f.label]) };
      });
    }, INCIDENT);
    expect(filed.map((x) => [x.key, x.ok, x.error])).toEqual(filed.map((x) => [x.key, true, null]));
    await setRole('employee');
    for (const c of filed) {
      await gotoApp('/case.html?doc=' + c.n + '&rev=1.0');
      await expect(page.locator('h1'), c.key).toHaveText(c.title);
      await expect(page.locator('#cs-chips'), c.key).toContainText(c.label);
      await expect(page.locator('#cs-status'), c.key).toContainText('Submitted for review. QMS checks it, then the Director. Until then only you, QMS, the area’s Director and an external auditor can see it.');
      await expect(page.locator('#cs-chips .cs-pill.st'), c.key).toHaveText('With QMS');
      for (const [label, value] of c.fields) {
        await expect(page.locator('#cs-type-sec'), c.key + ': ' + label).toContainText(label);
        await expect(page.locator('#cs-type-sec'), c.key + ': ' + label).toContainText(value);
      }
      if (c.key === 'incident') await expect(page.locator('#cs-symptoms')).toBeVisible();
      if (c.key === 'appreciation') {
        await expect(page.locator('#cs-type-sec .cs-ok.yes')).toHaveText('The customer agreed this can be shared');
        await expect(page.locator('#cs-chips .sales')).toHaveText('Sales-ready');
      }
      if (c.key === 'case-study') await expect(page.locator('.cs-fig b')).toHaveText('Value for Headline value');
      expect(await noSideways(page), c.key).toBe(true);
    }
    assertNoConsoleErrors(consoleErrors);
  });

  test('an unreleased case is hidden from others and open to its reviewers, with their next step', async ({ page, gotoApp, clearAppState, setRole, seedRegister, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const f = await fileAs(page, 'employee', null, INCIDENT);
    await seedRegister([{ docNumber: 'TQ-TDS-DSS-INC-009', revision: '1.0', status: 'draft', approvalStage: 'qms', title: 'Another employee\'s incident',
      segment: 'drilling', docType: 'incident', submittedById: 'sim:employee#another', submittedBy: 'Employee',
      card: { v: 1, type: 'incident', area: 'drilling' } }]);
    const url = '/case.html?doc=' + f.n + '&rev=1.0';
    for (const [role, area] of [['owner', 'wireline'], ['maintenance', 'drilling']]) {
      await setRole(role, area);
      await gotoApp(url);
      await expect(page.locator('h1'), role).toHaveText('Case not available');
      await expect(page.locator('#main'), role).not.toContainText('Jar fired early');
      await expect(page.locator('#cs-json'), role).toHaveCount(0);
    }
    await setRole('employee');
    await gotoApp('/case.html?doc=TQ-TDS-DSS-INC-009&rev=1.0');
    await expect(page.locator('h1')).toHaveText('Case not available');
    await expect(page.locator('#main')).not.toContainText('Another employee');
    // QMS sees it and where to act on it.
    await setRole('qms');
    await gotoApp(url);
    await expect(page.locator('h1')).toHaveText(INCIDENT.title);
    await expect(page.locator('#cs-status')).toContainText('Not released yet: With QMS.');
    await expect(page.locator('#cs-status a')).toHaveAttribute('href', 'master-list.html?view=qms&doc=' + f.n);
    await expect(page.locator('#cs-contact')).toContainText('Drilling Supervisor');
    // Then the area's Director.
    await check(page, f.n);
    await setRole('owner', 'drilling');
    await gotoApp(url);
    await expect(page.locator('#cs-status')).toContainText('Not released yet: With the Director.');
    await expect(page.locator('#cs-status a')).toHaveAttribute('href', 'dashboard.html?id=drilling');
    assertNoConsoleErrors(consoleErrors);
  });

  test('a returned case: its filer sees the reason and Edit; once filed again, the old attempt points to the new one', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const f = await fileAs(page, 'employee', null, CASE_STUDY);
    expect((await as(page, 'qms', null, ({ n, r }) => TAQA_STORE.reject(n, r), { n: f.n, r: REASON })).ok).toBe(true);
    const url = await as(page, 'employee', null, () => TAQA_CASES.mine()[0].url);
    expect(url).toContain('&rid=');
    await setRole('employee');
    await gotoApp('/' + url);
    await expect(page.locator('h1')).toHaveText(CASE_STUDY.title);
    await expect(page.locator('#cs-status')).toContainText('Returned by QMS: ' + REASON);
    await expect(page.locator('#cs-edit')).toHaveAttribute('href', 'case-new.html?edit=' + encodeURIComponent(f.key));
    await expect(page.locator('#cs-chips .cs-pill.st')).toHaveText('Returned');
    // QMS can read it, but only the filer edits it.
    await setRole('qms');
    await gotoApp('/' + url);
    await expect(page.locator('#cs-status')).toContainText('Returned by QMS');
    await expect(page.locator('#cs-edit')).toHaveCount(0);
    // Filed again: the returned attempt now points to the attempt in progress.
    const again = await as(page, 'employee', null, (key) => {
      const d = TAQA_CASES.draftFrom(key);
      d.sections.result = 'One run, 2,100 ft at 95 ft/hr';
      return TAQA_CASES.file(d, { resubmitOf: key }).ok;
    }, f.key);
    expect(again).toBe(true);
    await setRole('employee');
    await gotoApp('/' + url);
    await expect(page.locator('#cs-edit')).toHaveCount(0);
    await expect(page.locator('#cs-status')).toContainText('It was filed again');
    await page.locator('#cs-status a').click();
    await expect(page.locator('#cs-status')).toContainText('Submitted for review.');
    await expect(page.locator('#main')).toContainText('One run, 2,100 ft at 95 ft/hr');
    assertNoConsoleErrors(consoleErrors);
  });

  test('related cases are other released cases in the area sharing a service or hole size', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const inc = await fileAndRelease(page, INCIDENT);
    await fileAndRelease(page, MOTOR);
    const cs = await fileAndRelease(page, CASE_STUDY);
    await setRole('employee');
    await gotoApp('/case.html?doc=' + inc.n + '&rev=1.0');
    const rel = page.locator('#cs-related .cs-rel li');
    await expect(rel).toHaveCount(1);
    await expect(rel.locator('a')).toHaveText(MOTOR.title);
    await expect(rel.locator('.why')).toHaveText('Same service: MM5 motor');
    await gotoApp('/case.html?doc=' + cs.n + '&rev=1.0');
    await expect(page.locator('#cs-related')).toContainText('No other released case in Drilling Services shares a service or hole size with this one yet.');
    await expect(page.locator('#cs-related a.more')).toHaveAttribute('href', 'cases.html?area=drilling');
    assertNoConsoleErrors(consoleErrors);
  });

  test('a register lesson opens in the viewer, and a supplied case opens here', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await gotoApp('/case.html?doc=TQ-TDS-DSS-LL-001&rev=1.0');
    await expect(page).toHaveURL(/\/viewer\.html\?doc=TQ-TDS-DSS-LL-001/);
    // A case the owner supplies (cases-data.js), served as the file would be.
    await page.route('**/cases-data.js', async (route) => {
      const res = await route.fetch();
      const body = (await res.text()).replace('var TAQA_CASES_SHIPPED = [];', 'var TAQA_CASES_SHIPPED = [' + JSON.stringify({
        id: 'DRL-TEST-001', type: 'benchmark', area: 'drilling', title: 'ROP benchmark in the 12 1/4 in section',
        summary: 'Average ROP across five wells.', publishedDate: '2026-09-01',
        card: { v: 1, type: 'benchmark', area: 'drilling', location: 'Saudi Arabia', services: ['DTECH RSS'], holeSize: '12 1/4',
                sourceDoc: 'Benchmark report', authorRole: 'Drilling Engineer',
                sections: { metric: 'Average ROP', value: '62 ft/hr', compared: 'Offset wells at 41 ft/hr' } } }) + '];');
      await route.fulfill({ response: res, body, headers: Object.assign({}, res.headers(), { 'content-type': 'application/javascript' }) });
    });
    await gotoApp('/cases.html');
    const card = cardOf(page, 'ROP benchmark');
    await expect(card.locator('.cl-src')).toHaveText('Supplied case · DRL-TEST-001');
    await expect(page.locator('#cl-n-case')).toHaveText('1');
    await card.locator('h3 a').click();
    await expect(page).toHaveURL(/\/case\.html\?id=DRL-TEST-001$/);
    await expect(page.locator('h1')).toHaveText('ROP benchmark in the 12 1/4 in section');
    await expect(page.locator('.cs-fig b')).toHaveText('62 ft/hr');
    await expect(page.locator('#cs-num')).toContainText('Supplied case');
    await expect(page.locator('.cs-rec')).toContainText('Supplied for the library; not a register record');
    // It changes no register figure.
    expect(await page.evaluate(() => TAQA_STORE.all().some((d) => d.docNumber === 'DRL-TEST-001'))).toBe(false);
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('safety and phone layout', () => {
  test('every value a person typed is shown as text, never run', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const evil = JSON.parse(JSON.stringify(INCIDENT));
    evil.title = '<img src=x onerror="document.documentElement.dataset.pwn=1">Jar';
    evil.wellRef = '<script>document.documentElement.dataset.pwn=2</script>';
    evil.services = ['Jar', '"><svg onload="document.documentElement.dataset.pwn=3">'];
    evil.incident.symptoms[0].tag = '"><svg onload="document.documentElement.dataset.pwn=4">';
    evil.incident.cause = '</p><iframe src="javascript:document.documentElement.dataset.pwn=5"></iframe>';
    const f = await fileAndRelease(page, evil);
    await setRole('employee');
    await gotoApp('/cases.html');
    await expect(cardOf(page, 'onerror').locator('h3')).toHaveText(evil.title);
    await expect(cardOf(page, 'onerror').locator('.cl-meta')).toContainText(evil.wellRef);
    await gotoApp('/case.html?doc=' + f.n + '&rev=1.0');
    await expect(page.locator('h1')).toHaveText(evil.title);
    await expect(page.locator('#cs-hyp p')).toHaveText(evil.incident.cause);
    await expect(page.locator('#main img, #main iframe, #main script, #cs-content svg[onload]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.dataset.pwn || null)).toBeNull();
    assertNoConsoleErrors(consoleErrors);
  });

  test('no sideways scroll at 320 and 390, and the filter sheet opens, traps and closes', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const f = await fileAndRelease(page, INCIDENT);
    await fileAndRelease(page, CASE_STUDY);
    await setRole('employee');
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 760 });
      for (const path of ['/cases.html', '/cases.html?area=drilling&src=case', '/case.html?doc=' + f.n + '&rev=1.0']) {
        await gotoApp(path);
        await expect(page.locator('h1')).toBeVisible();
        expect(await noSideways(page), width + ' ' + path).toBe(true);
      }
    }
    await gotoApp('/cases.html');
    const btn = page.locator('#cl-flt-btn');
    await expect(btn).toBeVisible();
    await expect(page.locator('#cl-flt')).toBeHidden();
    await btn.click();
    await expect(page.locator('#cl-flt')).toBeVisible();
    await expect(page.locator('#cl-flt')).toHaveAttribute('role', 'dialog');
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await page.selectOption('#cl-area', 'drilling');
    const inDrilling = await page.evaluate(() => TAQA_CASES.forArea('drilling').length);
    await expect(page.locator('#cl-flt-done')).toHaveText('Show ' + inDrilling + ' results');
    expect(await noSideways(page)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#cl-flt')).toBeHidden();
    await expect(btn).toBeFocused();
    await expect(page.locator('#cl-flt-n')).toHaveText('1');
    await expect(page.locator('#cl-fsum')).toHaveText('Drilling Services');
    // A desk screen shows the filters in place, with no sheet.
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(btn).toBeHidden();
    await expect(page.locator('#cl-area')).toBeVisible();
    assertNoConsoleErrors(consoleErrors);
  });
});
