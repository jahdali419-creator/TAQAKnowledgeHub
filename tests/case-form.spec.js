// Add a case (case-new.html): the form operations use to file a field case.
//
//   Step 1        content type, area, location, services (the area decides
//                 the services, endings and findings offered)
//   then          the shared fields and the type's own sections; for an
//                 incident, the rules box first and six numbered sections
//                 with repeatable symptom and step rows
//   checking      TAQA_CASES.validate: the error under each field and a
//                 summary at the top that links to them
//   filing        TAQA_CASES.file (TAQA_STORE.add), then case.html
//   drafts        per person, in this browser (taqa-case-drafts-v1)
//   ?edit=<key>   a returned case filed again as its next attempt
//
// Every scenario is driven the way a person would: by clicking labels and
// typing into the boxes, never by setting values behind the page's back.
const fs = require('fs');
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

async function open(page, gotoApp, clearAppState, setRole, role = 'employee', area, query = '') {
  await gotoApp('/case-new.html');
  await clearAppState();
  await page.evaluate(() => localStorage.setItem('taqa-tour-done', '1'));
  await setRole(role, area);
  await gotoApp('/case-new.html' + query);
}
const pick = (page, name, value) => page.locator(`label:has(> input[name="${name}"][value="${value}"])`).click();
const goKeys = (page) => page.locator('#case-errors a[data-go]').evaluateAll((els) => els.map((e) => e.getAttribute('data-go')));

async function step1(page, { type, area, location = 'Saudi Arabia', service }) {
  await pick(page, 'g-type', type);
  if (await page.locator('select#f-area').count()) await page.selectOption('#f-area', area);
  await pick(page, 'g-location', location);
  await pick(page, 'g-services', service);
}
async function shared(page, { title, summary = 'One paragraph that tells what happened, what was done and how it ended.', month = '2026-08' }) {
  await page.fill('#f-title', title);
  await page.fill('#f-summary', summary);
  await page.fill('#f-eventMonth', month);
  await page.fill('#f-sourceDoc', 'End of well report');
  await page.fill('#f-authorRole', 'Field Engineer');
}
async function submitAndLand(page) {
  await page.click('#btn-submit');
  await page.waitForURL(/\/case\.html\?doc=/, { waitUntil: 'commit', timeout: 15_000 });
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 15_000, polling: 100 });
  await page.waitForTimeout(150);
}
const record = (page, title) => page.evaluate((title) => {
  const d = TAQA_STORE.all().filter((x) => x.title === title).pop();
  return d ? { n: d.docNumber, type: d.docType, area: d.segment, status: d.status, by: d.submittedById, rev: d.revision,
    attempt: d.attempt || 1, rejected: !!d.rejected, resubmitOf: d.resubmitOf || null, cls: d.classification, card: d.card } : null;
}, title);

// The fewest fields each type can be filed with, in a different segment
// each time so the per-segment services are exercised too.
const MINIMAL = [
  ['case-study', 'drilling', 'DTECH RSS', { challenge: 'Long tangent in hard stringers', action: 'Ran the RSS with a tuned BHA', result: 'One run, 2,100 ft' }],
  ['lesson', 'coiled-tubing', 'Milling', { happened: 'Mill stalled on a scale bridge', matters: 'Stalls cost a trip', differently: 'Jet the bridge before milling' }],
  ['incident', 'drilling', 'Jar', null],
  ['prejob', 'wireline', 'Perforation', { objective: 'Perforate two intervals', risks: 'Gun misfire, stuck tool string', plan: 'Two runs, correlation pass first' }],
  ['appreciation', 'cementing', 'Primary cementing', { recognised: 'Zero NPT on the 9 5/8 in job', evidence: 'Customer email, 3 Sep 2026' }],
  ['practice', 'fracturing', 'Flowback', { practice: 'Stage the choke during flowback', where: 'High-rate gas wells', evidence: 'Less proppant back on six jobs' }],
  ['field-profile', 'well-testing', 'Well cleanup', { fieldName: 'Field as entered', formations: 'Carbonate, H2S present', works: 'Slow cleanup rates' }],
  ['benchmark', 'slickline', 'Pressure control equipment', { metric: 'Rig-up time', value: '3.5 hr', compared: 'Area average 5 hr' }],
  ['alert', 'well-safety', 'BOP testing', { tool: 'Test plug', limit: 'Rated 10,000 psi', evidence: 'Manufacturer bulletin', action: 'Check the rating before each test' }],
  ['training', 'marine-services', 'Man overboard response', { topic: 'Man overboard drills', expertise: 'Marine Superintendent' }],
];

test.describe('every content type', () => {
  for (const [type, area, service, sections] of MINIMAL) {
    test(`${type} is filed with only its required fields`, async ({ page, gotoApp, clearAppState, setRole }) => {
      await open(page, gotoApp, clearAppState, setRole);
      const title = `Minimal ${type} in ${area}`;
      await step1(page, { type, area, service });
      await shared(page, { title });
      if (sections) for (const [k, v] of Object.entries(sections)) await page.fill(`#f-sections-${k}`, v);
      else {
        await page.selectOption('#f-incident-type', 'Drill string, jars and connections');
        await page.fill('#f-incident-date', '2026-08-14');
        await page.fill('#f-incident-activity', 'Back-reaming a tight spot');
        await page.fill('#f-incident-symptoms-0-text', 'Overpull rose to 40 klbf');
        await pick(page, 'g-incident-ending', 'Troubleshooting');
      }
      await submitAndLand(page);
      await expect(page).toHaveURL(/case\.html\?doc=TQ-[A-Z-]+-\d{3}&rev=1\.0/);
      await expect(page.locator('h1')).toHaveText(title);
      const r = await record(page, title);
      expect(r).toMatchObject({ type, area, status: 'draft', by: 'sim:employee', rev: '1.0', cls: 'internal' });
      expect(r.card).toMatchObject({ v: 1, type, area, location: 'Saudi Arabia', services: [service], eventMonth: '2026-08',
        sourceDoc: 'End of well report', authorRole: 'Field Engineer', salesReady: false, customer: '', holeSize: '' });
      if (sections) {
        for (const [k, v] of Object.entries(sections)) expect(r.card.sections[k], k).toBe(v);
        // Optional sections were left out, and stay empty rather than guessed.
        const optional = await page.evaluate((t) => TAQA_CASES.FIELDS.sections[t].filter((f) => !f.required && f.kind !== 'check').map((f) => f.key), type);
        for (const k of optional) expect(r.card.sections[k], k).toBe('');
        expect(r.card.incident).toBeUndefined();
      } else {
        expect(r.card.incident).toMatchObject({ type: 'Drill string, jars and connections', date: '2026-08-14', ending: 'Troubleshooting',
          symptoms: [{ time: '', tag: '', text: 'Overpull rose to 40 klbf' }], tried: [], findings: [], cause: '', contact: '' });
      }
      // The draft list is untouched: nothing was saved as a draft.
      expect(await page.evaluate(() => localStorage.getItem('taqa-case-drafts-v1'))).toBeNull();
    });
  }
});

test.describe('checking', () => {
  test('errors show under each field, with a summary at the top that links to them', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await open(page, gotoApp, clearAppState, setRole);
    await expect(page.locator('#case-form')).toBeVisible();
    // Ten types in the business case's order, each with its letter.
    expect(await page.locator('input[name="g-type"]').evaluateAll((els) => els.map((e) => e.value))).toEqual(
      ['case-study', 'lesson', 'incident', 'prejob', 'appreciation', 'practice', 'field-profile', 'benchmark', 'alert', 'training']);
    await expect(page.locator('.tile-m')).toHaveText(['CS', 'LL', 'INC', 'PJP', 'CA', 'BP', 'FP', 'PB', 'ALT', 'EXP']);
    // Only step 1 is shown, and asked for, until the type and area are chosen.
    await expect(page.locator('#cn-later')).toBeVisible();
    await page.click('#btn-submit');
    const sum = page.locator('#case-errors');
    await expect(sum).toBeVisible();
    await expect(sum).toBeFocused();
    expect(await goKeys(page)).toEqual(['type', 'area', 'location', 'services']);
    await expect(page.locator('#e-type')).toHaveText('Choose the content type.');
    await expect(page.locator('#e-area')).toHaveText('Choose the operational segment.');

    await pick(page, 'g-type', 'case-study');
    await page.selectOption('#f-area', 'drilling');
    // The summary follows the form, in the order the fields appear.
    await expect.poll(() => goKeys(page)).toEqual(['location', 'services', 'title', 'summary', 'eventMonth',
      'sections.challenge', 'sections.action', 'sections.result', 'sourceDoc', 'authorRole']);
    await expect(page.locator('#e-title')).toHaveText('Title is required.');
    await expect(page.locator('#f-title')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#e-sections-result')).toHaveText('Result (quantified) is required.');
    await expect(page.locator('#s-case')).toHaveClass(/bad/);

    // A link in the summary takes the person to the field.
    await sum.locator('a[data-go="sections.result"]').click();
    await expect(page.locator('#f-sections-result')).toBeFocused();
    // Fixing a field clears its error as the person types, and the summary follows.
    await page.fill('#f-title', 'A title');
    await expect(page.locator('#e-title')).toBeHidden();
    await expect(page.locator('#f-title')).not.toHaveAttribute('aria-invalid', 'true');
    await expect(sum.locator('a[data-go="title"]')).toHaveCount(0);

    // "Other" is typed, never stored as the word Other.
    await pick(page, 'g-location', 'Other');
    await expect(page.locator('#e-location')).toHaveText('Type the location, or choose one from the list.');
    await sum.locator('a[data-go="location"]').click();
    await expect(page.locator('#f-location-other')).toBeFocused();
    await page.fill('#f-location-other', 'Oman');
    await expect(page.locator('#e-location')).toBeHidden();
    await pick(page, 'g-services', 'Other');
    await expect(page.locator('#e-services')).toHaveText('Type the other service or tool, or untick Other.');

    // A bad format is caught too, and the month cannot be in the future.
    await page.fill('#f-holeSize', 'big');
    await page.locator('#f-holeSize').blur();
    await expect(page.locator('#e-holeSize')).toHaveText('Write the hole size in inches, for example 8 1/2 or 8.5.');
    await page.fill('#f-eventMonth', '2030-01');
    await page.locator('#f-eventMonth').blur();
    await expect(page.locator('#e-eventMonth')).toHaveText('The event month cannot be in the future.');
    await page.fill('#f-title', 'x'.repeat(170));
    await expect(page.locator('#c-title')).toHaveText('170 of 160 characters');
    await page.click('#btn-submit');
    await expect(page.locator('#e-title')).toHaveText('Keep the title to 160 characters or fewer.');

    // Enter in a one-line box does not file a half-written case.
    await page.locator('#f-formation').press('Enter');
    expect(await page.evaluate(() => TAQA_STORE.all().filter((d) => d.card).length)).toBe(0);
    await expect(page).toHaveURL(/case-new\.html/);
    assertNoConsoleErrors(consoleErrors);
  });

  test('a customer appreciation needs the sharing permission before it is sales-ready', async ({ page, gotoApp, clearAppState, setRole }) => {
    await open(page, gotoApp, clearAppState, setRole);
    await step1(page, { type: 'appreciation', area: 'cementing', service: 'Primary cementing' });
    await shared(page, { title: 'Customer thanked the crew for the liner job' });
    await page.fill('#f-sections-recognised', 'Zero NPT on the liner job');
    await page.fill('#f-sections-evidence', 'Customer letter ref. 2026-114');
    await page.check('#f-salesReady');
    await expect(page.locator('#cond-salesReady')).toBeVisible();
    await expect(page.locator('#e-sections-shareAgreed')).toHaveText('Confirm the customer agreed it can be shared before marking it sales-ready.');
    await page.click('#btn-submit');
    await expect(page.locator('#case-errors')).toBeVisible();
    expect(await goKeys(page)).toEqual(['sections.shareAgreed']);
    await page.check('#f-sections-shareAgreed');
    await expect(page.locator('#e-sections-shareAgreed')).toBeHidden();
    await expect(page.locator('#cond-salesReady')).toBeHidden();
    await expect(page.locator('#case-errors')).toBeHidden();
    await submitAndLand(page);
    const r = await record(page, 'Customer thanked the crew for the liner job');
    expect(r.card.salesReady).toBe(true);
    expect(r.card.sections).toEqual({ recognised: 'Zero NPT on the liner job', evidence: 'Customer letter ref. 2026-114', shareAgreed: true });
  });
});

test.describe('keyboard', () => {
  test('the content type is chosen with the arrow keys, and focus stays on the choice', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await open(page, gotoApp, clearAppState, setRole);
    await page.selectOption('#f-area', 'wireline');
    await page.locator('#f-type-case-study').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#s-type-h')).toHaveText(/Case study$/);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#f-type-lesson')).toBeFocused();
    await expect(page.locator('#f-type-lesson')).toBeChecked();
    await expect(page.locator('#s-type-h')).toHaveText(/Lesson learned$/);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#f-type-incident')).toBeFocused();
    await expect(page.locator('#incident-rules')).toBeVisible();
    // The area keeps its value across the rebuilds.
    await expect(page.locator('#f-area')).toHaveValue('wireline');
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('the incident card', () => {
  test('rules first, six numbered sections, symptoms in order, the segment\'s endings, findings after a trip out', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    test.setTimeout(60_000);
    await open(page, gotoApp, clearAppState, setRole);
    await pick(page, 'g-type', 'incident');
    await page.selectOption('#f-area', 'drilling');
    const rules = await page.evaluate(() => TAQA_CASES.INCIDENT_RULES);
    await expect(page.locator('#incident-rules-text')).toHaveText(rules);
    // The rules box comes before anything is written, the six sections after it.
    expect(await page.evaluate(() => {
      const r = document.getElementById('incident-rules');
      return ['s-case', 's-inc-1', 's-inc-6'].map((id) => !!(r.compareDocumentPosition(document.getElementById(id)) & Node.DOCUMENT_POSITION_FOLLOWING))
        .concat(!!(document.getElementById('s-what').compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING));
    })).toEqual([true, true, true, true]);
    await expect(page.locator('#s-type .sub-n')).toHaveText(['1', '2', '3', '4', '5', '6']);
    await expect(page.locator('#s-type .sub h3')).toHaveText([/The incident$/, /What was happening$/, /Symptoms, in order$/,
      /What was tried$/, /How it ended$/, /Findings at surface$/]);
    const endings = () => page.locator('input[name="g-incident-ending"]').evaluateAll((els) => els.map((e) => e.value));
    expect(await endings()).toEqual(['POOH', 'Troubleshooting', 'CIRC', 'Drilling ahead']);
    await expect(page.locator('#f-incident-findings .chip')).toHaveText(await page.evaluate(() => TAQA_CASES.OPTIONS.findings('drilling')));

    // Another segment: its own services, endings and findings.
    await page.selectOption('#f-area', 'coiled-tubing');
    expect(await endings()).toEqual(['Pulled out of hole', 'Troubleshooting continued', 'Circulating / monitoring', 'Job continued', 'Job suspended']);
    await expect(page.locator('#f-services .chip')).toHaveText(await page.evaluate(() => TAQA_CASES.OPTIONS.services('coiled-tubing')));
    await expect(page.locator('#f-incident-findings .chip')).toHaveText(await page.evaluate(() => TAQA_CASES.OPTIONS.findings('coiled-tubing')));

    await pick(page, 'g-location', 'UAE');
    await pick(page, 'g-services', 'Milling');
    await shared(page, { title: 'Motor stalled while milling a scale bridge', month: '2026-09' });
    await page.selectOption('#f-incident-type', 'Other');
    await page.fill('#f-incident-type-other', 'Scale bridge');
    await page.fill('#f-incident-date', '2026-09-02');
    await page.fill('#f-incident-timeNoticed', '14:10');
    await page.fill('#f-incident-depthFt', '7450');
    await page.fill('#f-incident-activity', 'Milling a scale bridge');

    // Symptoms: rows are added, moved and removed, and stay in the order given.
    await page.fill('#f-incident-symptoms-0-text', 'Motor stalled twice');
    await page.click('#add-symptoms');
    await expect(page.locator('#f-incident-symptoms-1-time')).toBeFocused();
    await page.fill('#f-incident-symptoms-1-time', '14:10');
    await page.fill('#f-incident-symptoms-1-tag', 'Pressure above baseline');
    await page.fill('#f-incident-symptoms-1-text', 'Pump pressure rose 300 psi');
    await page.click('#mv-symptoms-1-up');
    await expect(page.locator('#f-incident-symptoms-0-text')).toHaveValue('Pump pressure rose 300 psi');
    await page.click('#add-symptoms');
    await page.fill('#f-incident-symptoms-2-text', 'A row added by mistake');
    await page.click('#rm-symptoms-2');
    await expect(page.locator('#list-symptoms > li')).toHaveCount(2);
    await expect(page.locator('#list-symptoms .row-k')).toHaveText(['Symptom 1', 'Symptom 2']);

    // What was tried: an action and its result.
    await page.fill('#f-incident-tried-0-action', 'Reduced the pump rate');
    await pick(page, 'g-incident-tried-0-result', 'Failed');
    await page.click('#add-tried');
    await page.fill('#f-incident-tried-1-action', 'Jetted the bridge');
    await page.click('#btn-submit');
    await expect(page.locator('#e-incident-tried-1-result')).toHaveText('Choose Failed, Partial or Worked.');
    await pick(page, 'g-incident-tried-1-result', 'Worked');

    // NPT left blank in section 1 is asked again in section 5: the same value.
    await expect(page.locator('#npt-again')).toBeVisible();
    await page.fill('#f-npt-again', '4.5');
    await expect(page.locator('#f-incident-nptHr')).toHaveValue('4.5');

    // A trip out of the hole makes the findings at surface required.
    await expect(page.locator('#tag-incident-findings')).toBeHidden();
    await pick(page, 'g-incident-ending', 'Pulled out of hole');
    await expect(page.locator('#tag-incident-findings')).toBeVisible();
    await page.click('#btn-submit');
    await expect(page.locator('#e-incident-findings')).toHaveText('It ended with Pulled out of hole, so record what was found at surface.');
    expect(await goKeys(page)).toEqual(['incident.findings']);
    await pick(page, 'g-incident-findings', 'Seals and elastomers');
    await expect(page.locator('#e-incident-findings')).toBeHidden();
    await expect(page.locator('#f-incident-cause').locator('xpath=..').locator('.tag')).toHaveText('Hypothesis, not a finding');
    await page.fill('#f-incident-cause', 'Scale harder than expected');
    await page.fill('#f-incident-contact', 'CT Supervisor, night crew');
    assertNoConsoleErrors(consoleErrors);

    await submitAndLand(page);
    const r = await record(page, 'Motor stalled while milling a scale bridge');
    expect(r).toMatchObject({ type: 'incident', area: 'coiled-tubing', status: 'draft' });
    expect(r.n).toMatch(/^TQ-TWS-CTSS-INC-\d{3}$/);
    expect(r.card.location).toBe('UAE');
    expect(r.card.incident).toMatchObject({
      type: 'Scale bridge', date: '2026-09-02', timeNoticed: '14:10', depthFt: '7450', nptHr: '4.5', activity: 'Milling a scale bridge',
      symptoms: [{ time: '14:10', tag: 'Pressure above baseline', text: 'Pump pressure rose 300 psi' }, { time: '', tag: '', text: 'Motor stalled twice' }],
      tried: [{ action: 'Reduced the pump rate', result: 'Failed', note: '' }, { action: 'Jetted the bridge', result: 'Worked', note: '' }],
      ending: 'Pulled out of hole', findings: ['Seals and elastomers'], cause: 'Scale harder than expected', contact: 'CT Supervisor, night crew',
    });
  });
});

test.describe('who may file', () => {
  for (const [role, area] of [['qms'], ['auditor'], ['maintenance', 'drilling']]) {
    test(`${role} gets a plain refusal and a way back to the library`, async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
      await open(page, gotoApp, clearAppState, setRole, role, area);
      const box = page.locator('#case-refused');
      await expect(box).toBeVisible();
      await expect(box).toContainText('Field cases are filed by operations: an employee or the area’s Director.');
      await expect(box.locator('a[href="cases.html"]')).toHaveText('Back to the case library');
      await expect(page.locator('h1')).toHaveText('Add a case');
      await expect(page.locator('#case-form')).toBeHidden();
      await expect(page.locator('#btn-submit')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      assertNoConsoleErrors(consoleErrors);
    });
  }

  test('a Segment Director files for the area held, and a Director of a non-operational area is refused', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await open(page, gotoApp, clearAppState, setRole, 'owner', 'drilling');
    await expect(page.locator('#f-area')).toHaveText('Drilling Services');
    await expect(page.locator('select#f-area')).toHaveCount(0);
    await expect(page.locator('#h-area')).toHaveText('As its Segment Director you file cases for Drilling Services only.');
    await pick(page, 'g-type', 'lesson');
    await expect(page.locator('#f-services .chip')).toHaveText(await page.evaluate(() => TAQA_CASES.OPTIONS.services('drilling')));
    await pick(page, 'g-location', 'Pakistan');
    await pick(page, 'g-services', 'MM5 motor');
    await shared(page, { title: 'Motor stalls in the build section' });
    await page.fill('#f-sections-happened', 'Two stalls in the build');
    await page.fill('#f-sections-matters', 'Each stall risks the stator');
    await page.fill('#f-sections-differently', 'Lower the WOB in the build');
    await submitAndLand(page);
    const r = await record(page, 'Motor stalls in the build section');
    expect(r).toMatchObject({ type: 'lesson', area: 'drilling', by: 'sim:owner@drilling' });
    expect(r.n).toMatch(/^TQ-TDS-DSS-LL-\d{3}$/);

    await setRole('owner', 'pt-drilling-coe');
    await gotoApp('/case-new.html');
    await expect(page.locator('#case-refused')).toContainText('is not an operational segment');
    await expect(page.locator('#case-form')).toBeHidden();
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('drafts and export', () => {
  test('a saved draft comes back for the same person only, keeps saving itself, and goes once filed', async ({ page, gotoApp, clearAppState, setRole }) => {
    test.setTimeout(60_000);
    await open(page, gotoApp, clearAppState, setRole);
    await expect(page.locator('#cn-saved')).toHaveText('Not saved yet');
    await pick(page, 'g-type', 'incident');
    await page.selectOption('#f-area', 'drilling');
    await pick(page, 'g-location', 'Other');
    await page.fill('#f-location-other', 'Oman');
    await pick(page, 'g-services', 'Jar');
    await pick(page, 'g-services', 'Other');
    await page.fill('#f-services-other', 'Reamer, Float sub');
    await page.fill('#f-title', 'Draft incident: jar fired early');
    await page.fill('#f-incident-symptoms-0-text', 'Overpull rose');
    await page.click('#add-symptoms');
    await page.fill('#f-incident-symptoms-1-text', 'Jar fired');
    await page.click('#btn-save');
    await expect(page.locator('#cn-saved')).toContainText('Draft saved at');
    const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('taqa-case-drafts-v1') || '{}'));
    let all = await stored();
    expect(Object.keys(all)).toEqual(['sim:employee']);
    expect(all['sim:employee']).toHaveLength(1);
    const id = all['sim:employee'][0].id;
    expect(all['sim:employee'][0].draft).toMatchObject({ type: 'incident', area: 'drilling', location: 'Oman', services: ['Jar', 'Reamer', 'Float sub'],
      title: 'Draft incident: jar fired early' });
    expect(all['sim:employee'][0].draft.incident.symptoms.map((s) => s.text)).toEqual(['Overpull rose', 'Jar fired']);

    // After the first save, the open draft saves itself.
    await page.fill('#f-summary', 'Saved without pressing the button');
    await expect.poll(async () => (await stored())['sim:employee'][0].draft.summary, { timeout: 6_000 }).toBe('Saved without pressing the button');
    expect((await stored())['sim:employee']).toHaveLength(1);

    // Coming back: the draft is offered, and restores every value.
    await gotoApp('/case-new.html');
    await expect(page.locator('#drafts-panel')).toBeVisible();
    await expect(page.locator('#drafts-list li')).toHaveCount(1);
    await expect(page.locator('#drafts-list .dr-n')).toHaveText('Draft incident: jar fired early');
    await expect(page.locator('#drafts-list .dr-m')).toContainText('Failure / incident card · Drilling Services');
    await page.locator('#drafts-list button[data-draft]').click();
    await expect(page.locator('#f-title')).toHaveValue('Draft incident: jar fired early');
    await expect(page.locator('#f-area')).toHaveValue('drilling');
    await expect(page.locator('input[name="g-location"][value="Other"]')).toBeChecked();
    await expect(page.locator('#f-location-other')).toHaveValue('Oman');
    await expect(page.locator('input[name="g-services"][value="Jar"]')).toBeChecked();
    await expect(page.locator('#f-services-other')).toHaveValue('Reamer, Float sub');
    await expect(page.locator('#f-incident-symptoms-1-text')).toHaveValue('Jar fired');
    await expect(page.locator('#f-summary')).toHaveValue('Saved without pressing the button');
    await expect(page.locator('#drafts-list .dr-now')).toHaveText('Open now');

    // Another person on the same browser does not see it.
    await setRole('owner', 'drilling');
    await gotoApp('/case-new.html');
    await expect(page.locator('#case-form')).toBeVisible();
    await expect(page.locator('#drafts-panel')).toHaveCount(0);

    // Back as its author: open it by link, finish it and file it. The draft goes.
    await setRole('employee');
    await gotoApp('/case-new.html?draft=' + encodeURIComponent(id));
    await expect(page.locator('#f-title')).toHaveValue('Draft incident: jar fired early');
    await page.fill('#f-eventMonth', '2026-08');
    await page.fill('#f-sourceDoc', 'Daily drilling report');
    await page.fill('#f-authorRole', 'Drilling Engineer');
    await page.selectOption('#f-incident-type', 'Drill string, jars and connections');
    await page.fill('#f-incident-date', '2026-08-14');
    await page.fill('#f-incident-activity', 'Back-reaming');
    await pick(page, 'g-incident-ending', 'CIRC');
    await submitAndLand(page);
    const r = await record(page, 'Draft incident: jar fired early');
    expect(r.card.services).toEqual(['Jar', 'Reamer', 'Float sub']);
    expect(r.card.location).toBe('Oman');
    expect((await stored())['sim:employee']).toEqual([]);
  });

  test('Download JSON gives what is in the form, marked as not filed', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await open(page, gotoApp, clearAppState, setRole);
    await step1(page, { type: 'case-study', area: 'drilling', service: 'DTECH RSS' });
    await page.fill('#f-title', 'RSS held the tangent');
    await page.fill('#f-sections-challenge', 'Long tangent in hard stringers');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btn-json')]);
    expect(dl.suggestedFilename()).toMatch(/^field-case-draft-case-study-\d{4}-\d{2}-\d{2}\.json$/);
    const j = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
    expect(j).toMatchObject({ schema: 'taqa-field-case-draft/1', filed: false, resubmitOf: null, title: 'RSS held the tangent', classification: 'internal' });
    expect(j.card).toMatchObject({ v: 1, type: 'case-study', area: 'drilling', location: 'Saudi Arabia', services: ['DTECH RSS'],
      sections: { challenge: 'Long tangent in hard stringers', action: '', result: '', headline: '', conditions: '' } });
    expect(await page.evaluate(() => TAQA_STORE.all().filter((d) => d.card).length)).toBe(0);
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('a returned case', () => {
  const CASE = {
    type: 'case-study', area: 'drilling', location: 'UAE', services: ['DTECH RSS'],
    title: 'RSS held the tangent through the build section', summary: 'One run through the build and tangent with the RSS.',
    eventMonth: '2026-07', holeSize: '12 1/4', sourceDoc: 'End of well report', authorRole: 'Directional Driller',
    sections: { challenge: 'Long tangent in hard stringers', action: 'Ran the RSS with a tuned BHA', result: 'One run, 2,100 ft' },
  };
  const REASON = 'Give the rate as well. <b onmouseover="window.__xss=1">Add ft/hr</b> from the report.';

  test('is edited and filed again as its next attempt, by its filer only', async ({ page, gotoApp, clearAppState, setRole }) => {
    test.setTimeout(60_000);
    await open(page, gotoApp, clearAppState, setRole);
    const filed = await page.evaluate((d) => { const r = TAQA_CASES.file(d); return { n: r.record.docNumber, key: TAQA_STORE.recordKey(r.record) }; }, CASE);
    expect((await page.evaluate(({ n, why }) => { TAQA_ROLE.set('qms'); return TAQA_STORE.reject(n, why); }, { n: filed.n, why: REASON })).ok).toBe(true);
    await setRole('employee');
    await gotoApp('/case-new.html?edit=' + encodeURIComponent(filed.key));

    await expect(page.locator('h1')).toHaveText('File the case again');
    await expect(page.locator('#case-returned')).toContainText(filed.n + ' was returned');
    await expect(page.locator('#case-returned')).toContainText('attempt 2');
    await expect(page.locator('#case-returned-why')).toHaveText(REASON);       // shown as text, markup and all
    await expect(page.locator('#case-returned-why b')).toHaveCount(0);
    // Type and area stay as filed.
    await expect(page.locator('input[name="g-type"]')).toHaveCount(0);
    await expect(page.locator('#f-type')).toContainText('Case study');
    await expect(page.locator('#f-area')).toHaveText('Drilling Services');
    await expect(page.locator('#f-title')).toHaveValue(CASE.title);
    await expect(page.locator('#f-holeSize')).toHaveValue('12 1/4');
    await expect(page.locator('input[name="g-location"][value="UAE"]')).toBeChecked();
    await expect(page.locator('#f-sections-result')).toHaveValue('One run, 2,100 ft');
    await expect(page.locator('#btn-submit')).toContainText('File it again');

    await page.fill('#f-sections-result', 'One run, 2,100 ft at 95 ft/hr');
    await submitAndLand(page);
    await expect(page).toHaveURL(new RegExp('doc=' + filed.n + '&rev=1\\.0'));
    const fam = await page.evaluate((n) => TAQA_STORE.all().filter((d) => d.docNumber === n)
      .map((d) => ({ attempt: d.attempt || 1, rejected: !!d.rejected, result: d.card.sections.result, of: d.resubmitOf || null, rev: d.revision })), filed.n);
    expect(fam).toEqual(expect.arrayContaining([
      { attempt: 1, rejected: true, result: 'One run, 2,100 ft', of: null, rev: '1.0' },
      { attempt: 2, rejected: false, result: 'One run, 2,100 ft at 95 ft/hr', of: filed.key, rev: '1.0' },
    ]));
    expect(fam).toHaveLength(2);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();

    // The link cannot be used twice, nor by anyone else.
    await gotoApp('/case-new.html?edit=' + encodeURIComponent(filed.key));
    // Attempt 2 now exists, so attempt 1 is history and is never filed again.
    await expect(page.locator('#case-edit-refused')).toContainText('A later attempt of ' + filed.n + ' has been filed since');
    await expect(page.locator('#case-form')).toBeHidden();
    await setRole('owner', 'drilling');
    await gotoApp('/case-new.html?edit=' + encodeURIComponent(filed.key));
    await expect(page.locator('#case-edit-refused')).toContainText('Only the person who filed a case can file it again');
  });
});

test.describe('hostile values', () => {
  test('stay text in the form, the drafts list and the filed card', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    const evil = '<img src=x onerror="window.__xss=1">';
    await open(page, gotoApp, clearAppState, setRole);
    await pick(page, 'g-type', 'benchmark');
    await page.selectOption('#f-area', 'inspection');
    await pick(page, 'g-location', 'Other');
    await page.fill('#f-location-other', evil);
    await pick(page, 'g-services', 'Other');
    await page.fill('#f-services-other', evil);
    await page.fill('#f-title', evil);
    await page.fill('#f-sections-metric', '<script>window.__xss=1</script>');
    await page.click('#btn-save');
    await gotoApp('/case-new.html');
    await expect(page.locator('#drafts-list .dr-n')).toHaveText(evil);
    await page.locator('#drafts-list button[data-draft]').click();
    await expect(page.locator('#f-title')).toHaveValue(evil);
    await expect(page.locator('#f-location-other')).toHaveValue(evil);
    await expect(page.locator('#f-sections-metric')).toHaveValue('<script>window.__xss=1</script>');
    await page.click('#btn-submit');
    await expect(page.locator('#case-errors')).toBeVisible();
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    expect(await page.locator('main img, main script').count()).toBe(0);
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('on a phone', () => {
  for (const width of [320, 390]) {
    test.describe(`at ${width}px`, () => {
      test.use({ viewport: { width, height: 740 }, isMobile: true, hasTouch: true });
      test('the longest form has no sideways scroll, and the action bar stays in reach', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
        await open(page, gotoApp, clearAppState, setRole);
        await pick(page, 'g-type', 'incident');
        await page.selectOption('#f-area', 'drilling');
        await pick(page, 'g-services', 'Telefusion');
        await page.click('#add-symptoms');
        await page.click('#add-tried');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        // Every card keeps the 16px gutter on both sides.
        expect(await page.evaluate(() => Array.from(document.querySelectorAll('.step, .sub, .rules, .rcard'))
          .filter((e) => { const r = e.getBoundingClientRect(); return r.left < 15 || r.right > innerWidth - 15; }).map((e) => e.id || e.className))).toEqual([]);
        // The rail is a desk-screen aid; the bar carries the progress here.
        await expect(page.locator('#cn-rail')).toBeHidden();
        await expect(page.locator('#cn-ptext')).toBeVisible();
        for (const at of ['#s-inc-3', '#s-source']) {
          await page.locator(at).scrollIntoViewIfNeeded();
          const bar = await page.locator('#cn-actions').boundingBox();
          const vh = await page.evaluate(() => innerHeight);
          expect(bar.y + bar.height, at).toBeLessThanOrEqual(vh + 1);
          expect(bar.y, at).toBeGreaterThan(vh - 160);
          expect(bar.x).toBeGreaterThanOrEqual(-1);
          expect(bar.width).toBeLessThanOrEqual(width + 1);
          for (const b of ['#btn-save', '#btn-json', '#btn-submit']) {
            const r = await page.locator(b).boundingBox();
            expect(r.x + r.width, b).toBeLessThanOrEqual(width + 1);
          }
        }
        await expect(page.locator('#btn-submit')).toBeVisible();
        await expect(page.locator('#btn-json')).toHaveAccessibleName('Download JSON');
        assertNoConsoleErrors(consoleErrors);
      });
    });
  }
});
