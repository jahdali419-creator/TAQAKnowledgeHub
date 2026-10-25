// Search (ai-search.html): what it is, and only that.
//
// The page ranks register records by title, number, area and type, and
// field cases by any word in the case, with filters. It runs in the browser
// over TAQA_SEARCH_INDEX (search-index.js, built from TAQA_STORE) and
// TAQA_CASES (cases.js). It claims nothing else: no AI wording, no chat, no
// answer written for the reader. Every result is a record the reader may
// open and links to it: a document to viewer.html, a field case to
// case.html. The file name and ?q= stay, so the home search, bookmarks and
// the "/" shortcut keep working.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

test.beforeEach(async ({ gotoApp, setRole, clearAppState, page }) => {
  await gotoApp('/index.html');
  await clearAppState();
  await page.evaluate(() => localStorage.setItem('taqa-tour-done', '1'));
  // QMS sees every status and classification, so its results are not
  // narrowed by role; role-specific tests set their own.
  await setRole('qms', 'coiled-tubing');
});

/* The page's own matching rule, written out independently: a document
   matches when every word (split on spaces, outer punctuation trimmed)
   appears in its title, number, area name or type (key, label or mark).
   Rows that are field cases are not documents. */
async function expectedDocs(page, q, keep = () => true) {
  const rows = await page.evaluate((q) => {
    const T = TAQA_DOC_LOOKUPS.types;
    const cases = new Set(TAQA_STORE.all().filter((d) => d.card && typeof d.card === 'object').map((d) => d.docNumber + '@' + d.revision));
    const toks = q.toLowerCase().split(/\s+/).map((t) => t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')).filter(Boolean);
    return (window.TAQA_SEARCH_INDEX || [])
      .filter((d) => !(T[d.tp] && T[d.tp].cardOnly) && !cases.has(d.n + '@' + d.rev))
      .filter((d) => {
        const t = T[d.tp] || {};
        const fields = [d.t, d.n || '', d.sn, [d.tp, t.label || '', t.mark || ''].join(' ')].map((f) => f.toLowerCase());
        return toks.every((w) => fields.some((f) => f.includes(w)));
      });
  }, q);
  return rows.filter(keep);
}
async function search(page, q) {
  await page.locator('#query-input').fill(q);
  await page.locator('#query-input').press('Enter');
}
const docRows = (page) => page.locator('#results-list .sr-docs .result');
const caseRows = (page) => page.locator('#results-list .result.is-case');

/* A real field case, filed and released the way it happens: an employee
   files, QMS checks, the area's Director approves. */
const INCIDENT = {
  type: 'incident', area: 'drilling', location: 'Saudi Arabia', services: ['Jar', 'MM5 motor'],
  title: 'Jar fired early while working a tight spot',
  summary: 'The jar fired below its set load while back-reaming at 9,800 ft, and the string was pulled to surface.',
  eventMonth: '2026-08', wellRef: 'Rig 12 / Well A-7', holeSize: '8 1/2', formation: 'Shuaiba',
  sourceDoc: 'Daily drilling report 2026-08-14', authorRole: 'Field Engineer', classification: 'internal', sections: {},
  incident: {
    type: 'Drill string, jars and connections', date: '2026-08-14', activity: 'Back-reaming a tight spot',
    symptoms: [{ time: '03:40', tag: 'Overpull above baseline', text: 'Overpull rose to 40 klbf' }],
    tried: [{ action: 'Worked the string with reduced pull', result: 'Partial', note: '' }],
    ending: 'POOH', findings: ['Connections and threads'], findingsText: 'Jar mandrel scored', contact: 'Drilling Supervisor, day crew',
  },
};
const CASE_STUDY = {
  type: 'case-study', area: 'drilling', location: 'UAE', services: ['DTECH RSS'],
  title: 'RSS held the tangent through the build section', summary: 'One run through the build and tangent with the RSS.',
  eventMonth: '2026-07', holeSize: '12 1/4', sourceDoc: 'End of well report', authorRole: 'Directional Driller',
  sections: { challenge: 'Long tangent in hard stringers', action: 'Ran the RSS with a tuned BHA', result: 'One run, 2,100 ft' },
};
async function fileCases(page, { release = true } = {}) {
  return page.evaluate(({ inc, cs, release }) => {
    TAQA_ROLE.set('employee');
    const a = TAQA_CASES.file(inc);
    const b = TAQA_CASES.file(cs);
    if (release) {
      TAQA_ROLE.set('qms');
      TAQA_STORE.countersign(a.record.docNumber);
      TAQA_ROLE.set('owner'); TAQA_ROLE.setArea('drilling');
      TAQA_STORE.approve(a.record.docNumber);
    }
    TAQA_ROLE.set('employee');
    return { inc: a.record.docNumber, cs: b.record.docNumber, ok: a.ok && b.ok };
  }, { inc: INCIDENT, cs: CASE_STUDY, release });
}

test.describe('an honest page', () => {
  test('is called Search, makes no AI claim and carries no AI styling', async ({ page, gotoApp, consoleErrors }) => {
    await gotoApp('/ai-search.html');
    await expect(page).toHaveTitle('Search, RISE');
    await expect(page.locator('h1')).toHaveText('Search');
    await expect(page.locator('#navbar a[aria-current="page"]')).toHaveText('Search');
    // What it does, said plainly.
    await expect(page.locator('#sr-lede')).toContainText('title, number, area and type');
    await expect(page.locator('#sr-foot')).toContainText('nothing you type leaves the device');
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/\bAI\b/);
    // The page's own words (results are register titles and are not checked).
    const own = (await page.locator('.sr-hero, .sr-panel, #filters-drawer, #sr-foot').allInnerTexts()).join(' ');
    expect(own).not.toMatch(/intelligence|ask anything|generat|answer/i);
    expect(text).not.toContain('✦');                           // no sparkle glyph
    await expect(page.locator('.ai-safety-banner, .ai-badge, .msg-ai, .msg-user, .thinking-block, #bg-canvas')).toHaveCount(0);
    await expect(page.locator('script[src="fixes.js"]')).toHaveCount(0);
    await search(page, 'shut-in');
    await expect(docRows(page).first()).toBeVisible();
    expect(await page.locator('body').innerText()).not.toMatch(/\bAI\b/);
    assertNoConsoleErrors(consoleErrors);
  });

  test('never sends anything off the device while searching', async ({ page, gotoApp, consoleErrors }) => {
    const external = [];
    page.on('request', (req) => {
      const u = new URL(req.url());
      if (u.hostname !== '127.0.0.1' && u.hostname !== 'localhost') external.push(req.url());
    });
    await gotoApp('/ai-search.html');
    await page.locator('#query-input').pressSequentially('pressure test', { delay: 20 });
    await page.locator('#query-input').press('Enter');
    await expect(docRows(page).first()).toBeVisible();
    expect(external).toEqual([]);
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('words match the register', () => {
  test('a keyword returns exactly the documents that contain it, with the count said once', async ({ page, gotoApp, consoleErrors }) => {
    await gotoApp('/ai-search.html');
    await search(page, 'shut-in');
    const expected = await expectedDocs(page, 'shut-in');
    expect(expected.length).toBeGreaterThan(1);
    await expect(docRows(page)).toHaveCount(expected.length);
    const titles = await page.locator('#results-list .sr-docs .r-title').allInnerTexts();
    expect([...titles].sort()).toEqual(expected.map((d) => d.t).sort());
    expect(titles).toContain('Well Shut-In Procedure');
    await expect(page.locator('#result-count')).toHaveText(`${expected.length} results for “shut-in”`);
    await expect(page.locator('#results-list .sr-docs .sr-gn')).toHaveText(String(expected.length));
    // The word is marked where it was found, and nothing else is.
    await expect(page.locator('#results-list .sr-docs .r-title mark').first()).toHaveText(/shut-in/i);
    // Each row names its number, area, status and review state.
    const first = docRows(page).first();
    await expect(first.locator('.r-num')).toHaveText(/^TQ-/);
    await expect(first.locator('.r-area')).not.toBeEmpty();
    await expect(first.locator('.r-state .chip').first()).toHaveText(/In force|Draft|Approved|Asset/);
    expect(await first.getAttribute('href')).toMatch(/^viewer\.html\?doc=TQ-/);
    assertNoConsoleErrors(consoleErrors);
  });

  test('every word has to match, so more words never find more', async ({ page, gotoApp }) => {
    await gotoApp('/ai-search.html');
    const one = await expectedDocs(page, 'pressure');
    const two = await expectedDocs(page, 'pressure test');
    expect(two.length).toBeGreaterThan(0);
    expect(two.length).toBeLessThan(one.length);
    await search(page, 'pressure test');
    await expect(docRows(page)).toHaveCount(two.length);
    // A word found only in the area or the type still counts: "coiled" is
    // in no title of a Coiled Tubing SOP that the area name does not cover.
    const area = await expectedDocs(page, 'coiled sop');
    expect(area.every((d) => d.s === 'coiled-tubing' || /coiled/i.test(d.t))).toBe(true);
    await search(page, 'coiled sop');
    await expect(page.locator('#results-list .sr-docs .sr-gn')).toHaveText(String(area.length));
  });

  test('an exact number or title comes first', async ({ page, gotoApp }) => {
    await gotoApp('/ai-search.html');
    await search(page, 'TQ-TWS-CTSS-SOP-002');
    await expect(docRows(page).first()).toHaveAttribute('href', /doc=TQ-TWS-CTSS-SOP-002&/);
    await expect(docRows(page).first().locator('.r-num mark')).toHaveText('TQ-TWS-CTSS-SOP-002');
    await search(page, 'well shut-in procedure');
    await expect(docRows(page).first().locator('.r-title')).toHaveText('Well Shut-In Procedure');
  });

  test('a word nothing contains gets an honest empty state', async ({ page, gotoApp, consoleErrors }) => {
    await gotoApp('/ai-search.html');
    const q = 'zzqxnonexistentqueryimpossible987';
    expect(await expectedDocs(page, q)).toHaveLength(0);
    await search(page, q);
    await expect(page.locator('.sr-empty h3')).toHaveText(`No results for “${q}”`);
    await expect(page.locator('.sr-empty p').first()).toContainText(q);
    // One tip reads as a sentence, not a list of one.
    await expect(page.locator('.sr-empty p.sr-tip')).toHaveText('Check the spelling, or the document number.');
    await expect(page.locator('.sr-empty ul')).toHaveCount(0);
    await expect(page.locator('#results-list .result')).toHaveCount(0);
    await expect(page.locator('#result-count')).toHaveText(`0 results for “${q}”`);
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('the box', () => {
  test('results follow the typing, and the address keeps the search', async ({ page, gotoApp }) => {
    await gotoApp('/ai-search.html');
    await expect(page.locator('.sr-try h3')).toHaveText('Try a search');
    await page.locator('#query-input').pressSequentially('BHA', { delay: 30 });
    await expect(docRows(page).first()).toBeVisible();          // no Enter needed
    await expect(page).toHaveURL(/\/ai-search\.html\?q=BHA$/);
    await page.locator('#sr-clear').click();
    await expect(page.locator('#query-input')).toHaveValue('');
    await expect(page.locator('#query-input')).toBeFocused();
    await expect(page.locator('.sr-try')).toBeVisible();
    await expect(page).toHaveURL(/\/ai-search\.html$/);
  });

  test('?q= opens with the search run and recorded once', async ({ page, gotoApp, consoleErrors }) => {
    await gotoApp('/ai-search.html?q=' + encodeURIComponent('shut-in'));
    await expect(page.locator('#query-input')).toHaveValue('shut-in');
    await expect(docRows(page).first()).toBeVisible();
    const searches = await page.evaluate(() => JSON.parse(localStorage.getItem('taqa-analytics') || '[]').filter((e) => e.e === 'search').map((e) => e.k));
    expect(searches).toEqual(['shut-in']);
    assertNoConsoleErrors(consoleErrors);
  });

  test('every example offered finds something', async ({ page, gotoApp }) => {
    await gotoApp('/ai-search.html');
    const examples = await page.locator('.sr-try button').allInnerTexts();
    expect(examples.length).toBeGreaterThan(2);
    for (const q of examples) {
      const n = await expectedDocs(page, q);
      expect(n.length, q).toBeGreaterThan(0);
    }
    await page.locator('.sr-try button').first().click();
    await expect(page.locator('#query-input')).toHaveValue(examples[0]);
    await expect(docRows(page).first()).toBeVisible();
  });

  test('"/" jumps to the box from anywhere, and the arrows walk the list', async ({ page, gotoApp }) => {
    await gotoApp('/ai-search.html?q=shut-in');
    await page.locator('h1').click();
    await page.keyboard.press('/');
    await expect(page.locator('#query-input')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(docRows(page).nth(0)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(docRows(page).nth(1)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('#query-input')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#query-input')).toHaveValue('');
  });
});

test.describe('documents and field cases', () => {
  test('with no case released, Field cases says so and points at the library', async ({ page, gotoApp, consoleErrors }) => {
    await gotoApp('/ai-search.html');
    await expect(page.locator('#n-cases')).toHaveText('0');
    await expect(page.locator('#st-cases')).toHaveText('0');
    await expect(page.locator('#results-list')).toContainText('No field cases have been released yet');
    await page.locator('#sr-content label', { hasText: 'Field cases' }).click();
    await expect(page.locator('.sr-empty h3')).toHaveText('No field cases yet');
    await expect(page.locator('.sr-empty a[href="cases.html"]')).toBeVisible();
    await expect(page).toHaveURL(/content=cases/);
    assertNoConsoleErrors(consoleErrors);
  });

  test('a released case is found as a case, links to case.html and shows area, location and service', async ({ page, gotoApp, setRole, consoleErrors }) => {
    await gotoApp('/ai-search.html');
    const n = await fileCases(page);
    expect(n.ok).toBe(true);
    await setRole('employee');
    await gotoApp('/ai-search.html');
    await expect(page.locator('#st-cases')).toHaveText('1');
    await search(page, 'jar');
    const row = caseRows(page);
    await expect(row).toHaveCount(1);                 // the case study is still with QMS and has no jar
    await expect(row).toHaveAttribute('href', `case.html?doc=${n.inc}&rev=1.0`);
    await expect(row.locator('.r-kicker')).toHaveText('Field case · Failure / incident card');
    await expect(row.locator('.r-title')).toHaveText(INCIDENT.title);
    await expect(row.locator('.r-area')).toHaveText('Drilling Services');
    await expect(row.locator('.r-loc')).toHaveText('Saudi Arabia');
    await expect(row.locator('.r-svc')).toHaveText('Jar, MM5 motor');
    await expect(row.locator('.r-hole')).toHaveText('8 1/2 in');
    await expect(row.locator('.r-end')).toHaveText('Ended: POOH');
    await expect(row.locator('.chip')).toHaveText('Published');
    // The case is a register record too, but it is listed once, as a case.
    await expect(page.locator(`#results-list .sr-docs a[href*="${n.inc}"]`)).toHaveCount(0);
    const docs = await expectedDocs(page, 'jar');
    await expect(page.locator('#n-docs')).toHaveText(String(docs.length));
    await expect(page.locator('#n-cases')).toHaveText('1');
    await expect(page.locator('#n-all')).toHaveText(String(docs.length + 1));
    await expect(page.locator('#result-count')).toHaveText(`${docs.length + 1} results for “jar”`);

    await page.locator('#sr-content label', { hasText: 'Documents' }).click();
    await expect(caseRows(page)).toHaveCount(0);
    await expect(docRows(page)).toHaveCount(docs.length);
    await page.locator('#sr-content label', { hasText: 'Field cases' }).click();
    await expect(docRows(page)).toHaveCount(0);
    await expect(caseRows(page)).toHaveCount(1);
    await expect(page.locator('#result-count')).toHaveText('1 field case for “jar”');

    await caseRows(page).click();
    await expect(page).toHaveURL(new RegExp(`case\\.html\\?doc=${n.inc}&rev=1\\.0`));
    await expect(page.locator('h1')).toHaveText(INCIDENT.title);
    assertNoConsoleErrors(consoleErrors);
  });

  test('words written inside a case find it, not only its title', async ({ page, gotoApp, setRole }) => {
    await gotoApp('/ai-search.html');
    const n = await fileCases(page);
    await setRole('employee');
    await gotoApp('/ai-search.html?content=cases');
    await search(page, 'mandrel scored');            // only in the findings
    await expect(caseRows(page)).toHaveCount(1);
    await expect(caseRows(page)).toHaveAttribute('href', new RegExp(n.inc));
  });

  test('a case still on its way is shown to its filer with its status, and to nobody it is not open to', async ({ page, gotoApp, setRole }) => {
    await gotoApp('/ai-search.html');
    const n = await fileCases(page, { release: false });
    await setRole('employee');
    await gotoApp('/ai-search.html?content=cases');
    await expect(caseRows(page)).toHaveCount(2);
    await expect(page.locator(`#results-list a[href*="${n.cs}"] .chip`)).toHaveText('With QMS');
    await expect(page.locator('#st-cases')).toHaveText('0');      // nothing released yet
    await setRole('owner', 'wireline');
    await gotoApp('/ai-search.html?content=cases');
    await expect(caseRows(page)).toHaveCount(0);
    await expect(page.locator('.sr-empty h3')).toHaveText('No field cases yet');
    await setRole('qms', 'drilling');
    await gotoApp('/ai-search.html?q=RSS&content=cases');
    await expect(caseRows(page)).toHaveCount(1);
  });

  test('a case type narrows to field cases, a document type to documents', async ({ page, gotoApp, setRole }) => {
    await gotoApp('/ai-search.html');
    await fileCases(page);
    await setRole('employee');
    await gotoApp('/ai-search.html');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('#f-type').selectOption('case:incident');
    await expect(page.locator('#sr-content input[value="cases"]')).toBeChecked();
    await expect(caseRows(page)).toHaveCount(1);
    await expect(page.locator('#n-docs')).toHaveText('0');
    await page.locator('#f-type').selectOption('sop');
    await expect(page.locator('#sr-content input[value="docs"]')).toBeChecked();
    await expect(caseRows(page)).toHaveCount(0);
    await expect(page.locator('#n-cases')).toHaveText('0');
  });
});

test.describe('filters', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('an area narrows the list to that area, and its chip takes it off again', async ({ page, gotoApp, consoleErrors }) => {
    await gotoApp('/ai-search.html');
    await expect(page.locator('#filters-trigger-btn')).toBeHidden();      // a column here, not a drawer
    await page.locator('#f-segment').selectOption('well-safety');
    const expected = await expectedDocs(page, '', (d) => d.s === 'well-safety');
    expect(expected.length).toBeGreaterThan(0);
    await expect(page.locator('#results-list .sr-docs .sr-gn')).toHaveText(String(expected.length));
    await expect(docRows(page)).toHaveCount(Math.min(expected.length, 40));
    for (const t of await page.locator('#results-list .sr-docs .r-area').allInnerTexts()) expect(t).toBe('Safety Services');
    await expect(page).toHaveURL(/area=well-safety/);
    const chip = page.locator('.sr-fchip');
    await expect(chip).toHaveText('Area: Safety Services');
    await chip.click();
    await expect(page.locator('#f-segment')).toHaveValue('all');
    await expect(page.locator('.sr-try')).toBeVisible();
    assertNoConsoleErrors(consoleErrors);
  });

  test('status and type add up (AND), are kept in the address, and clear together', async ({ page, gotoApp }) => {
    await gotoApp('/ai-search.html');
    const drafts = await expectedDocs(page, '', (d) => d.st === 'draft' || d.st === 'approved');
    expect(drafts.length).toBeGreaterThan(0);
    await page.locator('#f-status').selectOption('draft');
    await expect(docRows(page)).toHaveCount(drafts.length);
    await expect(docRows(page).first().locator('.chip').first()).toHaveText(/not yet in force/);
    await expect(page.locator('#filters-badge')).toHaveText('1');
    const draftSops = drafts.filter((d) => d.tp === 'sop');
    await page.locator('#f-type').selectOption('sop');
    await expect(docRows(page)).toHaveCount(draftSops.length);
    await expect(page.locator('#filters-badge')).toHaveText('2');
    await expect(page).toHaveURL(/type=sop/);
    await page.reload();
    await expect(page.locator('#f-status')).toHaveValue('draft');
    await expect(page.locator('#f-type')).toHaveValue('sop');
    await expect(docRows(page)).toHaveCount(draftSops.length);
    await page.locator('#filters-clear-btn').click();
    await expect(page.locator('#filters-badge')).toBeHidden();
    await expect(page.locator('#f-status')).toHaveValue('all');
    await expect(page.locator('#f-type')).toHaveValue('all');
    await expect(page.locator('.sr-try')).toBeVisible();
  });

  test('a long list shows 40 at a time and says so', async ({ page, gotoApp }) => {
    await gotoApp('/ai-search.html?content=docs');
    const all = await expectedDocs(page, '');
    expect(all.length).toBeGreaterThan(80);
    await expect(docRows(page)).toHaveCount(40);
    await expect(page.locator('.sr-more span')).toContainText(`Showing 40 of ${all.length}`);
    await page.locator('.sr-more button').click();
    await expect(docRows(page)).toHaveCount(80);
    await expect(docRows(page).nth(40)).toBeFocused();
  });
});

test.describe('the filters drawer below 1100px', () => {
  test.use({ viewport: { width: 1024, height: 900 } });

  test('opens from its button and closes from its own button, the shade and Escape', async ({ page, gotoApp, consoleErrors }) => {
    await gotoApp('/ai-search.html');
    const drawer = page.locator('#filters-drawer'), trigger = page.locator('#filters-trigger-btn'), scrim = page.locator('#filters-scrim');
    await expect(drawer).not.toHaveClass(/open/);
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await trigger.click();
    await expect(drawer).toHaveClass(/open/);
    await expect(scrim).toHaveClass(/open/);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.locator('.filters-close-btn').click();
    await expect(drawer).not.toHaveClass(/open/);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
    await trigger.click();
    await scrim.click({ position: { x: 900, y: 500 } });
    await expect(drawer).not.toHaveClass(/open/);
    await trigger.click();
    await expect(drawer).toHaveClass(/open/);
    await page.keyboard.press('Escape');
    await expect(drawer).not.toHaveClass(/open/);
    assertNoConsoleErrors(consoleErrors);
  });

  test('a filter set inside it runs at once, and its button says how many results wait', async ({ page, gotoApp }) => {
    await gotoApp('/ai-search.html');
    await page.locator('#filters-trigger-btn').click();
    const drafts = await expectedDocs(page, '', (d) => d.st === 'draft' || d.st === 'approved');
    await page.locator('#f-status').selectOption('draft');
    await expect(page.locator('#filters-done')).toHaveText(`Show ${drafts.length} results`);
    await expect(page.locator('#filters-badge-mini')).toHaveText('1');
    await page.locator('#filters-done').click();
    await expect(page.locator('#filters-drawer')).not.toHaveClass(/open/);
    await expect(docRows(page)).toHaveCount(drafts.length);
  });
});

test.describe('escaping', () => {
  test('a query carrying markup is shown as text, never run', async ({ page, gotoApp, consoleErrors }) => {
    await gotoApp('/ai-search.html');
    let dialog = false;
    page.on('dialog', async (d) => { dialog = true; await d.dismiss(); });
    const scripts = await page.locator('script').count();
    for (const payload of ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '"><b>shut-in</b>']) {
      await search(page, payload);
      await expect(page.locator('.sr-empty h3')).toContainText(payload);
      await expect(page.locator('#result-count')).toContainText(payload);
    }
    expect(await page.locator('script').count()).toBe(scripts);
    expect(await page.locator('#results-list img').count()).toBe(0);
    expect(dialog).toBe(false);
    assertNoConsoleErrors(consoleErrors);
  });

  test('a real title with an ampersand reads correctly, highlighted or not', async ({ page, gotoApp }) => {
    await gotoApp('/ai-search.html');
    await search(page, 'Offboarding');
    await expect(page.locator('#results-list .r-title', { hasText: 'Exit & Offboarding SOP' })).toHaveCount(1);
    await search(page, 'exit &');
    await expect(page.locator('#results-list .r-title', { hasText: 'Exit & Offboarding SOP' })).toHaveCount(1);
  });
});

test.describe('on a phone (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('nothing runs off the side, before or after results, with a case among them', async ({ page, gotoApp, setRole, consoleErrors }) => {
    await gotoApp('/ai-search.html');
    await fileCases(page);
    await setRole('employee');
    await gotoApp('/ai-search.html');
    const over = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await over()).toBeLessThanOrEqual(1);
    await search(page, 'jar');
    await expect(caseRows(page)).toHaveCount(1);
    expect(await over()).toBeLessThanOrEqual(1);
    for (const r of await page.locator('#results-list .result').all()) {
      const b = await r.boundingBox();
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(390);
    }
    // The three content choices share one row and each is a full tap target.
    for (const l of await page.locator('.sr-seg-o span').all()) expect((await l.boundingBox()).height).toBeGreaterThanOrEqual(36);
    assertNoConsoleErrors(consoleErrors);
  });

  test('the filters rise as a sheet that fits the screen and closes on its result button', async ({ page, gotoApp }) => {
    await gotoApp('/ai-search.html');
    await page.locator('#filters-trigger-btn').click();
    const drawer = page.locator('#filters-drawer');
    await expect(drawer).toHaveClass(/open/);
    await page.waitForTimeout(350);
    const box = await drawer.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(391);
    expect(box.y + box.height).toBeLessThanOrEqual(845);
    await page.locator('#f-status').selectOption('draft');
    await expect(page.locator('#filters-badge')).toHaveText('1');
    await page.locator('#filters-done').click();
    await expect(drawer).not.toHaveClass(/open/);
  });

  test('at 320px the page still fits', async ({ page, gotoApp }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await gotoApp('/ai-search.html?q=pressure');
    await expect(docRows(page).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
});

test.describe('every role', () => {
  for (const [role, area] of [['employee', null], ['owner', 'drilling'], ['maintenance', 'drilling'], ['qms', null], ['auditor', null]]) {
    test(`${role}${area ? '@' + area : ''}: Search opens and finds with no console error`, async ({ page, gotoApp, setRole, consoleErrors }) => {
      await gotoApp('/ai-search.html');
      await fileCases(page);
      await setRole(role, area || undefined);
      await gotoApp('/ai-search.html?q=jar');
      await expect(page.locator('h1')).toHaveText('Search');
      await expect(page.locator('#results-list .result, #results-list .sr-empty').first()).toBeVisible();
      await page.locator('#sr-content label', { hasText: 'Field cases' }).click();
      await expect(page.locator('#result-count')).toBeVisible();
      assertNoConsoleErrors(consoleErrors);
    });
  }
});
