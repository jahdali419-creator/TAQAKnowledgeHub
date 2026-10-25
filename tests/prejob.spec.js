// Pre-job lessons pack (prejob.html) and the Field cases strip on an area
// page (segment.html).
//
// The pack lists one operational segment's RELEASED entries only (field
// cases, shipped cases, and the register's lessons and alerts in force),
// ranked against the job a person describes, grouped the way a crew talks
// them through, each with one line saying why it is there. Ticks ("Discussed
// at pre-job") are a per-person convenience in this browser for today. Print
// gives a clean sheet.
//
// The strip shows on the eleven operational segments in the Operations view
// only: never on an unknown id, a function, a product, the company page or a
// Maintenance view.
//
// Every case here is filed, checked and released by the people who would
// really do it: an employee files, QMS checks, the area's Director releases.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

const JAR_INCIDENT = {
  type: 'incident', area: 'drilling', location: 'Saudi Arabia', services: ['Jar'],
  title: 'Jar fired early while working a tight spot',
  summary: 'The jar fired below its set load while back-reaming at 9,800 ft, and the string was pulled to surface.',
  eventMonth: '2026-08', wellRef: 'Rig 12 / Well A-7', holeSize: '8 1/2', formation: 'Shuaiba',
  sourceDoc: 'Daily drilling report 2026-08-14', authorRole: 'Field Engineer', sections: {},
  incident: {
    type: 'Drill string, jars and connections', date: '2026-08-14', activity: 'Back-reaming a tight spot',
    symptoms: [{ time: '03:40', tag: 'Overpull above baseline', text: 'Overpull rose to 40 klbf' }],
    tried: [], ending: 'POOH', findings: ['Connections and threads'], findingsText: '', cause: 'Worn jar latch',
    contact: 'Drilling Supervisor, day crew',
  },
};
// Newer than the jar incident, and matching none of the job details below.
const MOTOR_INCIDENT = {
  type: 'incident', area: 'drilling', location: 'UAE', services: ['MM5 motor'],
  title: 'Motor stalled while drilling the 12 1/4 in section',
  summary: 'The motor stalled twice at the same depth and drilling continued at reduced weight.',
  eventMonth: '2026-09', holeSize: '12 1/4', sourceDoc: 'Daily drilling report 2026-09-20', authorRole: 'Directional Driller',
  sections: {},
  incident: {
    type: 'Downhole tool / motor', date: '2026-09-20', activity: 'Drilling ahead',
    symptoms: [{ time: '11:05', tag: '', text: 'Differential pressure dropped to zero' }], tried: [], ending: 'Drilling ahead',
  },
};
const CASE_STUDY = {
  type: 'case-study', area: 'drilling', location: 'UAE', services: ['DTECH RSS'],
  title: 'RSS held the tangent through the build section', summary: 'One run through the build and tangent with the RSS.',
  eventMonth: '2026-07', holeSize: '12 1/4', sourceDoc: 'End of well report', authorRole: 'Directional Driller',
  sections: { challenge: 'Long tangent in hard stringers', action: 'Ran the RSS with a tuned BHA', result: 'One run, 2,100 ft' },
};

async function start(page, gotoApp, clearAppState, setRole, role = 'employee', area) {
  await gotoApp('/prejob.html');
  await clearAppState();
  await page.evaluate(() => localStorage.setItem('taqa-tour-done', '1'));
  await setRole(role, area);
}
// An employee files the case, QMS checks it, the area's Director releases it.
const release = (page, draft) => page.evaluate((draft) => {
  TAQA_ROLE.set('employee');
  const r = TAQA_CASES.file(draft);
  if (!r.ok) return { ok: false, error: r.error, problems: (r.problems || []).map((p) => p.key) };
  const n = r.record.docNumber;
  TAQA_ROLE.set('qms'); TAQA_STORE.countersign(n);
  TAQA_ROLE.set('owner'); TAQA_ROLE.setArea(draft.area); TAQA_STORE.approve(n);
  TAQA_ROLE.set('employee');
  const e = TAQA_CASES.released().filter((x) => x.docNumber === n)[0];
  return { ok: !!e, n, key: e ? e.key : null };
}, draft);
// Files a case and leaves it where the test wants it: 'qms' (not yet
// checked) or 'director' (checked, not yet released).
const fileOnly = (page, draft, stage) => page.evaluate(({ draft, stage }) => {
  TAQA_ROLE.set('employee');
  const r = TAQA_CASES.file(draft);
  if (!r.ok) return { ok: false };
  if (stage === 'director') { TAQA_ROLE.set('qms'); TAQA_STORE.countersign(r.record.docNumber); }
  TAQA_ROLE.set('employee');
  return { ok: true, n: r.record.docNumber };
}, { draft, stage });

test.describe('the pack', () => {
  test('ranks the job\'s matches first, groups them, and says why each is there', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const jar = await release(page, JAR_INCIDENT);
    const motor = await release(page, MOTOR_INCIDENT);
    const cs = await release(page, CASE_STUDY);
    expect([jar.ok, motor.ok, cs.ok]).toEqual([true, true, true]);

    // No job details: newest first, and every entry says it is from the area.
    await gotoApp('/prejob.html?area=drilling');
    const watch = page.locator('#pj-g-watch .pj-item');
    await expect(watch).toHaveCount(2);
    await expect(watch.nth(0).locator('.pj-t')).toHaveText(MOTOR_INCIDENT.title);
    await expect(watch.nth(0).locator('.pj-why')).toHaveText(/Same area: Drilling Services/);
    await expect(page.locator('#pj-n-match')).toHaveText('–');

    // The job: Jar, 8 1/2 in. The jar incident rises to the top of its group.
    await gotoApp('/prejob.html?area=drilling&svc=Jar&hole=8.5');
    await expect(page.locator('.pj-group h2')).toHaveText([
      'Failures and incidents to watch', 'Tool limits and alerts', 'What worked', 'Lessons learned']);
    const first = watch.nth(0);
    await expect(first.locator('.pj-t')).toHaveText(JAR_INCIDENT.title);
    await expect(first).toHaveClass(/is-m/);
    await expect(first.locator('.pj-why')).toHaveText(/Same service: Jar · Same hole size: 8 1\/2 in/);
    await expect(first.locator('.pj-end')).toContainText('Ended: POOH');
    await expect(first.locator('.pj-t a')).toHaveAttribute('href', `case.html?doc=${jar.n}&rev=1.0`);
    await expect(first.locator('.pj-meta')).toContainText('Rig 12 / Well A-7');
    await expect(watch.nth(1).locator('.pj-t')).toHaveText(MOTOR_INCIDENT.title);
    await expect(page.locator('#pj-g-worked .pj-item', { hasText: CASE_STUDY.title }).locator('.pj-why')).toHaveText(/Same area: Drilling Services/);
    // The register's own lessons and alerts are there, honestly labelled, opening in the viewer.
    const alert = page.locator('#pj-g-alerts .pj-item').first();
    await expect(alert.locator('.pj-type')).toContainText('Register document');
    await expect(alert.locator('.pj-t a')).toHaveAttribute('href', /^viewer\.html\?doc=TQ-TDS-DSS-ALT-/);

    // Figures and the as-of stamp come from the register as it is now.
    const n = await page.evaluate(() => TAQA_CASES.forArea('drilling').length);
    await expect(page.locator('#pj-n-all')).toHaveText(String(n));
    await expect(page.locator('.pj-item')).toHaveCount(n);
    await expect(page.locator('#pj-n-match')).toHaveText('1');
    await expect(page.locator('#pj-asof')).toHaveText(/^As of \d{1,2} [A-Z][a-z]{2} \d{4}, \d{2}:\d{2}\. Released entries only, for Drilling Services\.$/);
    await expect(page.locator('#pj-show-note')).toHaveText(`1 of ${n} match the job details.`);
    await expect(page.locator('#pj-eyebrow')).toHaveText('Drilling Services · Pre-job pack');

    // Matches only, and it is kept in the link.
    await page.locator('.pj-seg label', { hasText: 'Matches only' }).click();
    await expect(page.locator('.pj-item')).toHaveCount(1);
    await expect(page.locator('.pj-quiet')).toContainText('Nothing matching yet under:');
    expect(new URL(page.url()).searchParams.get('show')).toBe('match');
    await gotoApp(page.url().replace(/^https?:\/\/[^/]+/, ''));
    await expect(page.locator('.pj-item')).toHaveCount(1);
    await expect(page.locator('input[name="pj-show"][value="match"]')).toBeChecked();
    assertNoConsoleErrors(consoleErrors);
  });

  test('shows released entries only: nothing waiting on QMS or the Director', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const atQms = await fileOnly(page, JAR_INCIDENT, 'qms');
    const atDir = await fileOnly(page, MOTOR_INCIDENT, 'director');
    expect([atQms.ok, atDir.ok]).toEqual([true, true]);
    for (const [role, area] of [['employee'], ['qms'], ['owner', 'drilling'], ['auditor']]) {
      await setRole(role, area);
      await gotoApp('/prejob.html?area=drilling');
      await expect(page.locator('#pj-pack'), role).not.toContainText(JAR_INCIDENT.title);
      await expect(page.locator('#pj-pack'), role).not.toContainText(MOTOR_INCIDENT.title);
      await expect(page.locator('#pj-g-watch'), role).toHaveCount(0);
      await expect(page.locator('.pj-quiet'), role).toContainText('Failures and incidents to watch');
    }
  });

  test('the job details follow the area, rank without hiding, and stay in the link', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await release(page, JAR_INCIDENT);
    await gotoApp('/prejob.html');
    await page.locator('#pj-area').selectOption('drilling');
    // The area's own services and tools, without Other.
    const chips = await page.locator('#pj-svc [data-svc]').evaluateAll((els) => els.map((e) => e.textContent.trim()));
    expect(chips).toEqual(await page.evaluate(() => TAQA_CASES.OPTIONS.services('drilling').filter((s) => s !== 'Other')));
    const all = await page.locator('.pj-item').count();
    await page.locator('#pj-svc [data-svc="Jar"]').click();
    await expect(page.locator('#pj-svc [data-svc="Jar"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#pj-n-match')).toHaveText('1');
    await expect(page.locator('.pj-item')).toHaveCount(all);             // ranks, never hides
    await page.locator('#pj-loc').selectOption('Saudi Arabia');
    await page.locator('#pj-fm').fill('Shuaiba');
    await page.locator('#pj-note').fill('tight spot');
    await expect(page.locator('#pj-g-watch .pj-item').first().locator('.pj-why'))
      .toHaveText(/Same service: Jar · Same formation: Shuaiba · Same location: Saudi Arabia · Mentions tight, spot/);
    const q = new URL(page.url()).searchParams;
    expect([q.get('area'), q.getAll('svc'), q.get('loc'), q.get('fm'), q.get('note')]).toEqual(['drilling', ['Jar'], 'Saudi Arabia', 'Shuaiba', 'tight spot']);

    // A hole size that is not a number is said so under the field and left out of the ranking.
    await page.locator('#pj-hole').fill('eight and a half');
    await page.locator('#pj-hole').blur();
    await expect(page.locator('#pj-hole-err')).toBeVisible();
    await expect(page.locator('#pj-hole')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#pj-g-watch .pj-item').first().locator('.pj-why')).not.toContainText('hole size');
    await page.locator('#pj-hole').fill('8-1/2');
    await page.locator('#pj-hole').blur();
    await expect(page.locator('#pj-hole-err')).toBeHidden();
    await expect(page.locator('#pj-g-watch .pj-item').first().locator('.pj-why')).toContainText('Same hole size: 8 1/2 in');

    // Another area keeps only the services it has.
    await page.locator('#pj-area').selectOption('wireline');
    expect(new URL(page.url()).searchParams.getAll('svc')).toEqual([]);
    await expect(page.locator('#pj-svc [aria-pressed="true"]')).toHaveCount(0);
  });

  test('"Discussed at pre-job" ticks count up, survive a reload, and are kept per area', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await release(page, JAR_INCIDENT);
    await gotoApp('/prejob.html?area=drilling');
    const n = await page.locator('.pj-item').count();
    await expect(page.locator('#pj-done-of')).toHaveText(String(n));
    const box = page.locator('#pj-g-watch .pj-item').first().locator('input[type="checkbox"]');
    await expect(box).toHaveAccessibleName(`Discussed at pre-job: ${JAR_INCIDENT.title}`);
    await box.check();
    await page.locator('#pj-g-alerts .pj-item').first().locator('input[type="checkbox"]').check();
    await expect(page.locator('#pj-done-n')).toHaveText('2');
    await expect(page.locator('#pj-n-done')).toHaveText('2');
    await expect(page.locator('#pj-dock-n')).toHaveText('2');
    await expect(page.locator('#pj-g-watch .pj-item').first()).toHaveClass(/is-done/);

    await gotoApp('/prejob.html?area=drilling');
    await expect(page.locator('#pj-done-n')).toHaveText('2');
    await expect(page.locator('#pj-g-watch .pj-item').first().locator('input[type="checkbox"]')).toBeChecked();

    // Another area starts clean; coming back finds the ticks.
    await page.locator('#pj-area').selectOption('cementing');
    await expect(page.locator('#pj-done-n')).toHaveText('0');
    await page.locator('#pj-area').selectOption('drilling');
    await expect(page.locator('#pj-done-n')).toHaveText('2');

    // Another person in this browser does not inherit them.
    await setRole('owner', 'drilling');
    await gotoApp('/prejob.html?area=drilling');
    await expect(page.locator('#pj-done-n')).toHaveText('0');
    await setRole('employee');
    await gotoApp('/prejob.html?area=drilling');
    await expect(page.locator('#pj-done-n')).toHaveText('2');
    await page.locator('#pj-clear').click();
    await expect(page.locator('#pj-done-n')).toHaveText('0');
    await expect(page.locator('.pj-item.is-done')).toHaveCount(0);
    // Yesterday's ticks are not today's meeting.
    await page.locator('#pj-g-watch .pj-item').first().locator('input[type="checkbox"]').check();
    await page.evaluate(() => {
      const o = JSON.parse(localStorage.getItem('taqa-prejob-ticks-v1'));
      Object.keys(o).forEach((k) => { o[k].day = '2000-01-01'; });
      localStorage.setItem('taqa-prejob-ticks-v1', JSON.stringify(o));
    });
    await gotoApp('/prejob.html?area=drilling');
    await expect(page.locator('#pj-done-n')).toHaveText('0');
  });

  test('no area, an empty area and a wrong area are each said plainly', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await gotoApp('/prejob.html');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#pj-rail')).toBeHidden();
    const tiles = page.locator('.pj-tile');
    await expect(tiles).toHaveCount(11);
    const counts = await page.evaluate(() => TAQA_CASES.operational().map((a) => [a.id, TAQA_CASES.forArea(a.id).length]));
    for (const [id, c] of counts) await expect(page.locator(`.pj-tile[data-area="${id}"] .n`)).toHaveText(String(c));

    await page.locator('.pj-tile[data-area="slickline"]').click();
    await expect(page.locator('#pj-area')).toHaveValue('slickline');
    await expect(page.locator('.pj-empty h2')).toHaveText('Nothing released for Slickline yet');
    await expect(page.locator('.pj-empty a[href="case-new.html?area=slickline"]')).toHaveText('Add a case');
    await expect(page.locator('.pj-empty a[href="cases.html?area=slickline"]')).toBeVisible();

    await setRole('qms');
    await gotoApp('/prejob.html?area=slickline');
    await expect(page.locator('.pj-empty h2')).toHaveText('Nothing released for Slickline yet');
    await expect(page.locator('.pj-empty a[href^="case-new.html"]')).toHaveCount(0);

    await gotoApp('/prejob.html?area=qhse');
    await expect(page.locator('#pj-area-err')).toBeVisible();
    await expect(page.locator('#pj-area-err')).toContainText('is not an operational segment');
    await expect(page.locator('#pj-area')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#pj-area')).toHaveValue('');
    // Print with no area prints nothing and says why under the Area field.
    await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
    await page.locator('#pj-print-btn').evaluate((b) => b.click());     // the rail is hidden with no area
    expect(await page.evaluate(() => window.__printed)).toBe(0);
    await expect(page.locator('#pj-area-err')).toHaveText('Choose the area for the job before printing.');

    // A Director lands on their own area.
    await setRole('owner', 'wireline');
    await gotoApp('/prejob.html');
    await expect(page.locator('#pj-area')).toHaveValue('wireline');
    await expect(page.locator('#pj-eyebrow')).toHaveText('Wireline Services · Pre-job pack');
  });

  test('prints a clean sheet: the job, the boxes, a sign-off line, no controls', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await release(page, JAR_INCIDENT);
    await gotoApp('/prejob.html?area=drilling&svc=Jar&note=tight%20spot');
    await page.locator('#pj-g-watch .pj-item').first().locator('input[type="checkbox"]').check();
    await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
    await page.locator('#pj-print-btn').click();
    expect(await page.evaluate(() => window.__printed)).toBe(1);

    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.pj-print')).toBeVisible();
    await expect(page.locator('.pj-print .pp-title')).toHaveText('Drilling Services');
    await expect(page.locator('.pj-print .pp-job')).toContainText('Jar');
    await expect(page.locator('.pj-print .pp-job')).toContainText('tight spot');
    await expect(page.locator('.pj-print .pp-sign')).toContainText('Led by (role)');
    await expect(page.locator('.pj-print-foot')).toContainText('A printed copy is uncontrolled');
    for (const sel of ['#navbar', '.pj-hero', '.pj-form', '#pj-rail', '#pj-dock']) await expect(page.locator(sel), sel).toBeHidden();
    await expect(page.locator('.pj-tick-l').first()).toBeHidden();
    await expect(page.locator('.pj-box').first()).toBeVisible();
    await expect(page.locator('#pj-g-watch .pj-item').first().locator('input[type="checkbox"]')).toBeChecked();
    await page.emulateMedia({ media: 'screen' });
    await expect(page.locator('.pj-print')).toBeHidden();
  });

  test('a typed title stays text', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const hostile = '<img src=x onerror="window.__xss=1">Jar check';
    const r = await release(page, Object.assign({}, JAR_INCIDENT, { title: hostile, wellRef: '<b>Rig</b> 9' }));
    expect(r.ok).toBe(true);
    await gotoApp('/prejob.html?area=drilling&svc=Jar');
    await expect(page.locator('#pj-g-watch .pj-t').first()).toHaveText(hostile);
    await expect(page.locator('#pj-g-watch .pj-meta').first()).toContainText('<b>Rig</b> 9');
    expect(await page.locator('#pj-pack img, #pj-pack .pj-meta b').count()).toBe(0);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    assertNoConsoleErrors(consoleErrors);
  });

  test('a phone gets no sideways scroll, and the count bar appears once the summary is passed', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await release(page, JAR_INCIDENT);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 760 });
      for (const path of ['/prejob.html', '/prejob.html?area=drilling&svc=Jar', '/prejob.html?area=slickline']) {
        await gotoApp(path);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path} at ${width}`).toBe(true);
      }
    }
    await gotoApp('/prejob.html?area=drilling');
    await expect(page.locator('#pj-dock')).not.toHaveClass(/\bon\b/);
    // On a phone the results come first and the summary card follows them:
    // the bar carries the count and Print while the results are read...
    const item = page.locator('.pj-item').nth(2);
    await item.scrollIntoViewIfNeeded();
    await expect(page.locator('#pj-dock')).toHaveClass(/\bon\b/);
    await expect(page.locator('#pj-dock-print')).toBeVisible();
    await item.locator('input[type="checkbox"]').check();
    await expect(page.locator('#pj-dock-n')).toHaveText('1');
    // ...and gives way once the card it repeats is on screen.
    await page.locator('#pj-rail .pj-card').scrollIntoViewIfNeeded();
    await expect(page.locator('#pj-dock')).not.toHaveClass(/\bon\b/);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator('#pj-dock')).not.toHaveClass(/\bon\b/);
  });

  for (const [role, area] of [['employee'], ['owner', 'drilling'], ['maintenance', 'drilling'], ['qms'], ['auditor']]) {
    test(`opens cleanly for ${role}`, async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
      await start(page, gotoApp, clearAppState, setRole);
      await release(page, JAR_INCIDENT);
      await setRole(role, area);
      for (const path of ['/prejob.html', '/prejob.html?area=drilling&svc=Jar&hole=8.5', '/prejob.html?area=marine-services']) {
        await gotoApp(path);
        await expect(page.locator('h1'), path).toBeVisible();
        await expect(page.locator('#navbar .nav-links a[href="cases.html"]')).toHaveAttribute('aria-current', 'page');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
      }
      assertNoConsoleErrors(consoleErrors);
    });
  }
});

test.describe('the Field cases strip on an area page', () => {
  test('shows the area\'s released count, the latest three and the ways on', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await gotoApp('/segment.html?id=drilling');
    const strip = page.locator('#seg-cases');
    await expect(strip).toBeVisible();
    await expect(strip.locator('#seg-cases-h')).toHaveText('Field cases');
    const before = await page.evaluate(() => TAQA_CASES.forArea('drilling').length);
    await expect(strip.locator('.sc-n b')).toHaveText(String(before));
    await expect(strip.locator('.sc-sub')).toHaveText(`0 field cases · ${before} register lessons and alerts`);
    await expect(strip.locator('#sc-all')).toHaveAttribute('href', 'cases.html?area=drilling');
    await expect(strip.locator('#sc-pack')).toHaveAttribute('href', 'prejob.html?area=drilling');
    await expect(strip.locator('#sc-add')).toHaveAttribute('href', 'case-new.html?area=drilling');
    // It sits beside the contributors strip, which is untouched.
    expect(await page.evaluate(() => document.getElementById('seg-cases').nextElementSibling.id)).toBe('rise-top');

    // A filed case waits off the strip until the Director releases it.
    const waiting = await fileOnly(page, MOTOR_INCIDENT, 'director');
    expect(waiting.ok).toBe(true);
    await gotoApp('/segment.html?id=drilling');
    await expect(strip.locator('.sc-n b')).toHaveText(String(before));
    await expect(strip).not.toContainText(MOTOR_INCIDENT.title);
    const jar = await release(page, JAR_INCIDENT);
    await gotoApp('/segment.html?id=drilling');
    await expect(strip.locator('.sc-n b')).toHaveText(String(before + 1));
    await expect(strip.locator('.sc-sub')).toHaveText(`1 field case · ${before} register lessons and alerts`);
    const items = strip.locator('.sc-list li');
    await expect(items).toHaveCount(3);
    const latest = await page.evaluate(() => TAQA_CASES.forArea('drilling').slice(0, 3).map((e) => [e.title, e.url]));
    for (let i = 0; i < 3; i++) {
      await expect(items.nth(i).locator('a')).toHaveText(latest[i][0]);
      await expect(items.nth(i).locator('a')).toHaveAttribute('href', latest[i][1]);
    }
    await expect(strip.locator(`a[href="case.html?doc=${jar.n}&rev=1.0"]`)).toHaveCount(1);
    assertNoConsoleErrors(consoleErrors);
  });

  test('is never on a Maintenance view, a function, a product, the company page or an unknown area', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    test.setTimeout(120_000);                                   // nineteen area page loads
    await start(page, gotoApp, clearAppState, setRole);
    const hidden = ['drilling&dept=maintenance', 'qhse', 'company', 'pt-drilling-coe', 'not-an-area'];
    for (const id of hidden) {
      await gotoApp('/segment.html?id=' + id);
      await expect(page.locator('#seg-cases'), id).toBeHidden();
    }
    // A Maintenance Manager opens on the Maintenance view: no strip. Their
    // area's Operations view has it, without Add a case.
    await setRole('maintenance', 'drilling');
    await gotoApp('/segment.html?id=drilling');
    await expect(page.locator('#seg-cases')).toBeHidden();
    await gotoApp('/segment.html?id=drilling&dept=operations');
    await expect(page.locator('#seg-cases')).toBeVisible();
    await expect(page.locator('#sc-add')).toHaveCount(0);
    // Every operational segment has it.
    await setRole('employee');
    const ops = await page.evaluate(() => TAQA_CASES.operational().map((a) => a.id));
    expect(ops).toHaveLength(11);
    for (const id of ops) {
      await gotoApp('/segment.html?id=' + id);
      await expect(page.locator('#seg-cases'), id).toBeVisible();
    }
    // The contributors strip still follows its own rules.
    await gotoApp('/segment.html?id=not-an-area');
    await expect(page.locator('#rise-top')).toBeHidden();
    assertNoConsoleErrors(consoleErrors);
  });

  test('offers Add a case only to people who may file one for that area', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    for (const [role, area, id, may] of [
      ['employee', null, 'cementing', true], ['owner', 'drilling', 'drilling', true], ['owner', 'wireline', 'drilling', false],
      ['qms', null, 'drilling', false], ['auditor', null, 'drilling', false],
    ]) {
      await setRole(role, area);
      await gotoApp('/segment.html?id=' + id);
      await expect(page.locator('#seg-cases'), `${role} on ${id}`).toBeVisible();
      await expect(page.locator('#sc-add'), `${role} on ${id}`).toHaveCount(may ? 1 : 0);
      await expect(page.locator('#sc-pack')).toHaveAttribute('href', 'prejob.html?area=' + id);
    }
    // An area with nothing released says so.
    await gotoApp('/segment.html?id=marine-services');
    await expect(page.locator('#seg-cases .sc-n b')).toHaveText('0');
    await expect(page.locator('#seg-cases .sc-empty')).toHaveText(/Nothing released for Marine Services yet\./);
  });

  test('fits a phone', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 760 });
      await gotoApp('/segment.html?id=drilling');
      await expect(page.locator('#seg-cases')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), String(width)).toBe(true);
      const box = await page.locator('#seg-cases').boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
  });
});
