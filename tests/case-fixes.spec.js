// Regression tests for the review of the field-cases build: each test pins
// one finding that was fixed, so it cannot quietly come back.
//
//   matching      services and note words match whole words only, and a
//                 service on the card outranks a mention in the text
//   search        a query with no searchable word finds nothing
//   returns       only the newest returned attempt is edited and filed again
//   card types    a lesson filed as a card is never revised as a document;
//                 an incident's event month is its date's; a maintenance
//                 department case record is opened nowhere
//   export        a downloaded case can be pasted back as a supplied case
//   pages         print leaves out the page chrome; the facts grid leads
//                 with what was recorded; the form says what * means and
//                 announces a draft's delete; Home's cue opens the segments
//
// Cases are filed by the employee, checked by QMS and released by the
// area's Director, the way recognition.spec.js and cases-api.spec.js do it.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

const REASON = 'The result needs the figures from the end of well report, please add them.';
const study = (title, services, holeSize, extra) => Object.assign({
  type: 'case-study', area: 'drilling', location: 'Saudi Arabia', services, title,
  summary: 'Summary of ' + title + '.', eventMonth: '2026-08', holeSize, sourceDoc: 'End of well report',
  authorRole: 'Directional Driller', sections: { challenge: 'Hard stringers', action: 'Tuned the BHA', result: 'One run, 2,100 ft' },
}, extra || {});
const LESSON = {
  type: 'lesson', area: 'wireline', location: 'India', services: ['Perforation'], title: 'ATTEMPT-ONE text',
  summary: 'First attempt.', eventMonth: '2026-08', sourceDoc: 'Job report', authorRole: 'Wireline Engineer',
  sections: { happened: 'Gun string stuck', matters: 'A lost day', differently: 'Split the run' },
};

async function start(page, gotoApp, clearAppState, setRole, path = '/cases.html') {
  await gotoApp(path);
  await clearAppState();
  await page.evaluate(() => localStorage.setItem('taqa-tour-done', '1'));
  await setRole('employee');
}
// Files each draft as the employee, checks it as QMS and releases it as
// the area's Director. Returns the numbers, and leaves the employee signed in.
const fileAndRelease = (page, drafts) => page.evaluate((drafts) => {
  const as = (r, a, f) => { TAQA_ROLE.set(r); if (a) TAQA_ROLE.setArea(a); return f(); };
  const out = drafts.map((d) => {
    const r = as('employee', null, () => TAQA_CASES.file(d));
    if (!r.ok) return 'FILE: ' + r.error;
    const n = r.record.docNumber;
    if (!as('qms', null, () => TAQA_STORE.countersign(n)).ok) return 'CHECK: ' + n;
    if (!as('owner', d.area, () => TAQA_STORE.approve(n)).ok) return 'RELEASE: ' + n;
    return n;
  });
  TAQA_ROLE.set('employee');
  return out;
}, drafts);

test.describe('matching', () => {
  test('services and note words match whole words, and the card\'s own service ranks first', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const nums = await fileAndRelease(page, [
      study('Circulation losses managed in the build section', ['MM5 motor'], '12 1/4'),
      study('Collapse of gaps in the stabiliser schedule', ['Jar', 'MM5 motor'], '12 1/4'),
      study('ION tool held inclination', ['ION'], '8 1/2'),
    ]);
    nums.forEach((n) => expect(n).toMatch(/^TQ-TDS-DSS-CS-\d{3}$/));
    const r = await page.evaluate(() => {
      const pack = TAQA_CASES.match({ area: 'drilling', prefer: { services: ['ION', 'APS'], holeSize: '12 1/4' } });
      const both = TAQA_CASES.match({ area: 'drilling', prefer: { services: ['Jar', 'MM5 motor'] } })
        .filter((e) => e.title.indexOf('Collapse') === 0)[0];
      return {
        top: pack[0].title, topWhy: pack[0].why,
        mentions: pack.filter((e) => e.why.some((w) => /^Mentions/.test(w))).map((e) => e.title),
        note: TAQA_CASES.match({ area: 'drilling', prefer: { note: 'circ gaps' } }).filter((e) => e.score > 0)
          .map((e) => [e.title, e.why.join(' · ')]),
        both: both.why,
      };
    });
    // "ION" is not in "circulation", "APS" is not in "gaps".
    expect(r.mentions).toEqual([]);
    expect(r.top).toBe('ION tool held inclination');
    expect(r.topWhy).toEqual(['Same service: ION']);
    // "circ" is not a word of "circulation"; "gaps" is a word of the title.
    expect(r.note).toEqual([['Collapse of gaps in the stabiliser schedule', 'Mentions gaps']]);
    // Two matched services are said once.
    expect(r.both).toEqual(['Same services: Jar, MM5 motor']);
    assertNoConsoleErrors(consoleErrors);
  });

  test('a search with no searchable word finds nothing, on the library and on Search', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await fileAndRelease(page, [study('RSS held the tangent', ['DTECH RSS'], '12 1/4')]);
    const counts = await page.evaluate(() => ['حفر', 'x', 'é', '%', 'zzqqxx', ''].map((q) => TAQA_CASES.match({}, q).length));
    expect(counts.slice(0, 5)).toEqual([0, 0, 0, 0, 0]);
    expect(counts[5]).toBeGreaterThan(0);
    await gotoApp('/cases.html?q=' + encodeURIComponent('حفر'));
    await expect(page.locator('#cl-grid .cl-card')).toHaveCount(0);
    await gotoApp('/ai-search.html?q=' + encodeURIComponent('حفر'));
    await expect(page.locator('#result-count')).toBeVisible();
    await expect(page.locator('#results a[href*="case.html"]')).toHaveCount(0);
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('a case returned twice', () => {
  test('only its newest attempt is edited and filed again', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    test.setTimeout(60_000);
    await start(page, gotoApp, clearAppState, setRole);
    const s = await page.evaluate(({ lesson, why }) => {
      const as = (r, f) => { TAQA_ROLE.set(r); return f(); };
      const a1 = as('employee', () => TAQA_CASES.file(lesson));
      as('qms', () => TAQA_STORE.reject(a1.record.docNumber, why + ' FIRST'));
      const k1 = TAQA_STORE.recordKey(a1.record);
      const second = JSON.parse(JSON.stringify(lesson)); second.title = 'ATTEMPT-TWO text';
      const a2 = as('employee', () => TAQA_CASES.file(second, { resubmitOf: k1 }));
      as('qms', () => TAQA_STORE.reject(a2.record.docNumber, why + ' SECOND'));
      TAQA_ROLE.set('employee');
      const k2 = TAQA_STORE.recordKey(a2.record);
      const again = TAQA_CASES.file(lesson, { resubmitOf: k1 });
      return {
        n: a1.record.docNumber, k1, k2, attempt2: a2.record.attempt,
        oldOk: TAQA_CASES.canResubmit(TAQA_CASES.byKey(k1)), newOk: TAQA_CASES.canResubmit(TAQA_CASES.byKey(k2)),
        again: again.ok ? 'FILED' : again.error,
        noRid: (TAQA_CASES.get({ doc: a1.record.docNumber, rev: '1.0' }) || {}).title,
      };
    }, { lesson: LESSON, why: REASON });
    expect(s.attempt2).toBe(2);
    expect(s.oldOk).toBe(false);
    expect(s.newOk).toBe(true);
    expect(s.again).toContain('A later attempt of ' + s.n + ' has been filed since');
    expect(s.noRid).toBe('ATTEMPT-TWO text');

    // The old attempt's page points to the newest one and offers no Edit.
    await gotoApp('/case.html?doc=' + encodeURIComponent(s.n) + '&rev=1.0&rid=' + encodeURIComponent(s.k1));
    await expect(page.locator('#cs-status')).toContainText('A later attempt was filed and returned too');
    await expect(page.locator('#cs-edit')).toHaveCount(0);
    // Without a record named, the case opens on its newest attempt.
    await gotoApp('/case.html?doc=' + encodeURIComponent(s.n) + '&rev=1.0');
    await expect(page.locator('h1')).toContainText('ATTEMPT-TWO text');
    await expect(page.locator('#cs-edit')).toHaveCount(1);
    // The form refuses the old attempt and files the newest as attempt 3.
    await gotoApp('/case-new.html?edit=' + encodeURIComponent(s.k1));
    await expect(page.locator('#case-edit-refused')).toContainText('A later attempt of ' + s.n + ' has been filed since');
    await expect(page.locator('#case-form')).toBeHidden();
    await gotoApp('/case-new.html?edit=' + encodeURIComponent(s.k2));
    await expect(page.locator('#case-returned')).toContainText('attempt 3');
    await expect(page.locator('#f-title')).toHaveValue('ATTEMPT-TWO text');
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('card types', () => {
  test('a lesson filed as a card is never revised as a plain document, by anyone', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const [n] = await fileAndRelease(page, [{ type: 'lesson', area: 'drilling', location: 'UAE', services: ['Jar'], title: 'Card lesson',
      summary: 'x', eventMonth: '2026-08', sourceDoc: 'Report', authorRole: 'Driller', sections: { happened: 'a', matters: 'b', differently: 'c' } }]);
    const why = await page.evaluate((n) => ['employee', 'qms'].map((r) => {
      TAQA_ROLE.set(r);
      return TAQA_STORE.checkFiling({ docNumber: n, supersedes: n, docType: 'lesson', segment: 'drilling', title: 'Rev 2 as a document', summary: 'x', revision: '2.0' });
    }), n);
    why.forEach((w) => expect(w).toBe(n + ' was filed as a field case, with its card, so it is not revised or filed again as a plain document.'));
    assertNoConsoleErrors(consoleErrors);
  });

  test('an incident\'s event month is the month of its date', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const month = await page.evaluate(() => TAQA_CASES.buildCard({ type: 'incident', area: 'drilling', eventMonth: '2026-07',
      incident: { date: '2026-08-14' } }).eventMonth);
    expect(month).toBe('2026-08');
  });

  test('a case record held by a maintenance department is opened nowhere', async ({ page, gotoApp, clearAppState, setRole, seedRegister, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await seedRegister([{ docNumber: 'TQ-TDS-DSS-CS-105', docType: 'case-study', segment: 'drilling', department: 'maintenance',
      title: 'Maintenance department case', summary: 'x', approvedDate: '2026-08-01',
      card: { v: 1, type: 'case-study', area: 'drilling', location: 'UAE', services: ['Jar'], eventMonth: '2026-08', sourceDoc: 'x', authorRole: 'x', sections: {} } }]);
    for (const [role, area] of [['employee'], ['qms'], ['owner', 'drilling'], ['auditor']]) {
      await setRole(role, area);
      const got = await page.evaluate(() => [!!TAQA_CASES.get({ doc: 'TQ-TDS-DSS-CS-105' }),
        TAQA_CASES.all({ includeUnreleased: true }).some((e) => e.docNumber === 'TQ-TDS-DSS-CS-105')]);
      expect(got, role).toEqual([false, false]);
    }
    await setRole('employee');
    await gotoApp('/case.html?doc=TQ-TDS-DSS-CS-105');
    await expect(page.locator('h1')).toHaveText('Case not available');
    await expect(page.locator('main')).not.toContainText('Maintenance department case');
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('export', () => {
  test('a downloaded case carries a supplied id and can be pasted back; a bad entry is named in the console', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    const warnings = [];
    page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
    await start(page, gotoApp, clearAppState, setRole);
    const [n] = await fileAndRelease(page, [study('Exported case', ['DTECH RSS'], '12 1/4')]);
    const r = await page.evaluate((n) => {
      const json = TAQA_CASES.toJSON(TAQA_CASES.get({ doc: n }));
      const pasted = JSON.parse(JSON.stringify(json));
      TAQA_CASES_SHIPPED.push(pasted);
      TAQA_CASES_SHIPPED.push({ id: 'bad id!', type: 'case-study', area: 'drilling', title: 'Not listed' });
      const got = TAQA_CASES.get({ id: pasted.id });
      TAQA_CASES.all();
      return { id: json.id, published: json.publishedDate, got: got && [got.source, got.title] };
    }, n);
    expect(r.id).toBe(n + '-R1-0');
    expect(r.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.got).toEqual(['shipped', 'Exported case']);
    expect(warnings.join('\n')).toContain('TAQA_CASES_SHIPPED entry "bad id!" is not listed');
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('pages', () => {
  test('a printed case leaves out the back-to-top button and the reading bar', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const [n] = await fileAndRelease(page, [study('Printed case', ['DTECH RSS'], '12 1/4')]);
    await gotoApp('/case.html?doc=' + n + '&rev=1.0');
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(400);
    await page.emulateMedia({ media: 'print' });
    const shown = await page.evaluate(() => ['back-to-top', 'read-progress'].map((id) => {
      const el = document.getElementById(id); return el ? getComputedStyle(el).display : 'none';
    }));
    expect(shown).toEqual(['none', 'none']);
    assertNoConsoleErrors(consoleErrors);
  });

  test('the facts grid leads with what was recorded and names the rest once', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const [n] = await fileAndRelease(page, [study('Facts case', ['DTECH RSS'], '12 1/4')]);
    await gotoApp('/case.html?doc=' + n + '&rev=1.0');
    const dd = await page.locator('.cs-dl dd').allTextContents();
    expect(dd.length).toBeGreaterThan(3);
    dd.forEach((t) => expect(t.trim()).not.toBe('Not recorded'));
    await expect(page.locator('#cs-nr')).toHaveText('Not recorded: Client · Rig / well · Field / area · Formation / interval');
    assertNoConsoleErrors(consoleErrors);
  });

  test('the form says what * means, names required groups, and a draft\'s delete is announced', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole, '/case-new.html');
    await page.evaluate(() => TAQA_CASES.drafts.save({ type: 'case-study', area: 'drilling', title: 'Draft one' }));
    await gotoApp('/case-new.html');
    await page.locator('label:has(> input[name="g-type"][value="case-study"])').click();
    await expect(page.locator('#cn-req-note')).toHaveText('Fields marked * are required.');
    // The legend of a required group reads "..., (required)" to a screen reader.
    const legends = await page.locator('legend').evaluateAll((ls) => ls.map((l) => l.textContent.replace(/\s+/g, ' ').trim()));
    expect(legends.some((t) => /^Content type\s*\*\s*\(required\)/.test(t)), legends.join(' | ')).toBe(true);
    expect(legends.some((t) => /^Location\s*\*\s*\(required\)/.test(t)), legends.join(' | ')).toBe(true);

    const del = page.locator('#drafts-list [data-del]').first();
    if (!(await del.isVisible())) await page.locator('#drafts-list').locator('xpath=..').locator('summary').click();
    await del.click();
    await expect(del).toHaveText('Delete it?');
    await expect(del).toHaveAttribute('aria-label', 'Delete it? Press again to delete draft: Draft one');
    await expect(page.locator('#cn-live')).toHaveText('Press Delete again to remove this draft.');
    await del.click();
    await expect(page.locator('#drafts-list')).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement && document.activeElement.tagName)).not.toBe('BODY');
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('home on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('"Explore the segments" lands on the open list of segments', async ({ page, gotoApp, consoleErrors }) => {
    await gotoApp('/index.html');
    // Every group closed, as a phone shows them on arrival.
    await page.evaluate(() => { localStorage.setItem('taqa-tour-done', '1'); localStorage.setItem('taqa-strata-bed', 'none'); });
    await gotoApp('/index.html');
    const seg = page.locator('#explore [aria-expanded]', { hasText: 'Operational Segments' });
    await expect(seg).toHaveAttribute('aria-expanded', 'false');
    await page.locator('#hero-cue').click();
    await expect(page).toHaveURL(/#explore$/);
    await expect(seg).toHaveAttribute('aria-expanded', 'true');
    assertNoConsoleErrors(consoleErrors);
  });
});
