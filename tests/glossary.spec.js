// Permanent regression suite for glossary.html.
//
// Read in full before writing this: glossary.html's inline <script> (BUILT_IN
// data, loadCustom/saveCustom, esc()/hl(), rowHTML(), getFiltered(),
// submitTerm()). Key facts this suite locks in, verified against the live
// code rather than assumed:
//
// - submitTerm() pushes { abbr, full, def, cat:'custom', field } into
//   `allTerms` and calls saveCustom(), which writes every cat==='custom' term
//   to localStorage under 'taqa_glossary_custom' (glossary.html:840-842).
//   loadCustom() reads that key back on every page load (glossary.html:834-839)
//   and merges it into `allTerms`, so a submitted term IS real, persisted
//   state, not a render-only/session-only add.
// - A submitted term IS visually distinguished from a built-in/vetted term
//   today, just not with a moderation "Pending Review" status (there is no
//   review/approval workflow, submitted terms go live immediately). It gets:
//     * cat: 'custom' -> CAT_LABELS.custom = 'Community' (glossary.html:816),
//       so its category chip reads "Community" instead of a real subject
//       area like "Drilling" or "Safety & HSE".
//     * an explanatory note "Added by the community on this device" rendered
//       under it (glossary.html:913-915).
//     * the category pill for 'custom' gets an `is-community` class
//       (glossary.html:1015).
//   See this suite's own "user-submitted terms are visually distinguished"
//   test, and the final report for why this is / is not the gap the removed
//   fixes.js dead code was trying to patch.
// - rowHTML() runs EVERY term (built-in and custom alike) through hl(), which
//   calls esc() first and only ever marks the already-escaped text
//   (glossary.html:845-855), so a submitted term can never inject markup.
//   This suite proves that end to end for a real submission, not just for
//   the built-in seed data.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

const CUSTOM_KEY = 'taqa_glossary_custom';
const PEND_KEY = 'taqa_glossary_pending';

// A term is proposed, not published: it waits for the Document Controller.
// This takes a proposal all the way through, and returns nothing a caller has
// to clean up. The proposer must not be the Document Controller, because RISE
// refuses to let the filer be the checker.
async function proposeAndApprove(page, setRole, gotoApp, fields) {
  await setRole('employee');
  await page.evaluate(() => renderPending());
  await fillAddForm(page, fields);
  await page.locator('#sb-add .btn-submit').click();
  await setRole('qms');
  await page.evaluate(() => renderPending());
  await page.locator('.gl-pend-ok').first().click();
}

// A real, existing built-in term (glossary.html:637) used for the
// search/filter test, so this suite exercises the real BUILT_IN dataset
// rather than a fixture the suite invents. Chosen because its abbreviation
// is not a substring of any other term's abbreviation or definition in
// BUILT_IN (unlike e.g. "BOP", which also matches BOPE/BOPD), so a search
// for it deterministically returns exactly one row.
const KNOWN_ABBR = 'MAASP';
const KNOWN_FULL = 'Maximum Allowable Annular Surface Pressure';

/** Opens the "Add a term" panel if it is currently collapsed (the mobile
 * layout folds it behind a toggle button; the desktop layout this suite runs
 * at, 1440px per playwright.config.js, shows it open already) and fills the
 * three submission fields. Does not click submit. */
async function fillAddForm(page, { abbr, full, def }) {
  // toggleAddForm(true) is a no-op if the card is already open, and the
  // panel's fields exist in the DOM either way; this just guarantees they
  // are visible/interactable regardless of viewport.
  await page.evaluate(() => {
    if (typeof toggleAddForm === 'function') toggleAddForm(true);
  });
  await page.locator('#sf-abbr').fill(abbr);
  await page.locator('#sf-full').fill(full);
  if (def !== undefined) await page.locator('#sf-def').fill(def);
}

test.describe('glossary.html', () => {
  test.beforeEach(async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await setRole('qms', 'coiled-tubing');
  });

  test('a proposed term waits for the Document Controller: it is not in the glossary until approved, and both states survive a reload', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await gotoApp('/glossary.html');

    const abbr = 'WBHP';
    const full = 'Wellbore Hydrostatic Pressure Test';

    await setRole('employee');
    await page.evaluate(() => renderPending());
    await fillAddForm(page, { abbr, full, def: 'A regression-suite term.' });
    await page.locator('#sb-add .btn-submit').click();

    // Proposed: in the queue, written to the queue's own key, and NOT in the
    // glossary list or the published key.
    const row = page.locator(`.gl-item[data-k="${abbr}|custom|${full}"]`);
    await expect(row).toHaveCount(0);
    await expect(page.locator('#gl-pending')).toBeVisible();
    await expect(page.locator('#gl-pending-list')).toContainText(abbr);
    const queued = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '[]'), PEND_KEY);
    expect(queued.some((t) => t.abbr === abbr && t.status === 'pending')).toBe(true);
    const publishedBefore = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '[]'), CUSTOM_KEY);
    expect(publishedBefore.some((t) => t.abbr === abbr)).toBe(false);

    // Still waiting after a reload: the queue is read back, not forgotten.
    await gotoApp('/glossary.html');
    await setRole('employee');
    await page.evaluate(() => renderPending());
    await expect(page.locator(`.gl-item[data-k="${abbr}|custom|${full}"]`)).toHaveCount(0);
    await expect(page.locator('#gl-pending-list')).toContainText(abbr);

    // Approved by the Document Controller: now, and only now, it is a term.
    await setRole('qms');
    await page.evaluate(() => renderPending());
    await page.locator('.gl-pend-ok').first().click();
    await expect(page.locator(`.gl-item[data-k="${abbr}|custom|${full}"]`)).toBeVisible();
    const publishedAfter = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '[]'), CUSTOM_KEY);
    expect(publishedAfter.some((t) => t.abbr === abbr && t.full === full)).toBe(true);

    // And it stays a term across a reload, labelled as community-contributed.
    await gotoApp('/glossary.html');
    const rowAfterReload = page.locator(`.gl-item[data-k="${abbr}|custom|${full}"]`);
    await expect(rowAfterReload).toBeVisible();
    await expect(rowAfterReload.locator('.gl-chip')).toHaveText('Community');

    assertNoConsoleErrors(consoleErrors);
  });

  test('a term is held for review, the Document Controller can return it, and a returned term never reaches the glossary', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await gotoApp('/glossary.html');

    const abbr = 'QATST';
    const full = 'Quality Assurance Test Term';

    await setRole('employee');
    await page.evaluate(() => renderPending());
    await fillAddForm(page, { abbr, full, def: 'Docs the approval step.' });
    await page.locator('#sb-add .btn-submit').click();

    // The proposer sees their own term waiting, and no decision buttons.
    await expect(page.locator('#gl-pending-h')).toContainText('Your proposed terms');
    await expect(page.locator('.gl-pend-state.wait')).toHaveCount(1);
    await expect(page.locator('.gl-pend-ok')).toHaveCount(0);
    await expect(page.locator('.gl-pend-no')).toHaveCount(0);

    // Forcing the call does not approve it either: the role is the gate.
    const id = await page.evaluate(() => loadPending()[0].id);
    await page.evaluate((x) => approveTerm(x), id);
    await expect(page.locator(`.gl-item[data-k="${abbr}|custom|${full}"]`)).toHaveCount(0);

    // The Document Controller sees it, and returns it.
    await setRole('qms');
    await page.evaluate(() => renderPending());
    await expect(page.locator('#gl-pending-h')).toContainText('Waiting for your approval');
    await page.locator('.gl-pend-no').first().click();
    await expect(page.locator('.gl-pend-state.back')).toHaveCount(1);

    // Returned is not published: not in the list, not in the published key.
    await expect(page.locator(`.gl-item[data-k="${abbr}|custom|${full}"]`)).toHaveCount(0);
    const published = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '[]'), CUSTOM_KEY);
    expect(published.some((t) => t.abbr === abbr)).toBe(false);

    // A vetted, built-in term must NOT carry the community label.
    const builtInRow = page
      .locator('.gl-item')
      .filter({ hasText: KNOWN_FULL })
      .first();
    await expect(builtInRow.locator('.gl-chip')).not.toHaveText('Community');
  });

  test('the Document Controller cannot approve a term they proposed themselves', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await gotoApp('/glossary.html');
    await setRole('qms');
    await page.evaluate(() => renderPending());
    await fillAddForm(page, { abbr: 'SELFA', full: 'Self Approval Check', def: 'Filer is never checker.' });
    await page.locator('#sb-add .btn-submit').click();

    // It queues like any other proposal, but carries no Approve button...
    await expect(page.locator('#gl-pending-list')).toContainText('SELFA');
    await expect(page.locator('.gl-pend-ok')).toHaveCount(0);
    await expect(page.locator('#gl-pending-list')).toContainText('another Document Controller');

    // ...and the call refuses it even when made directly.
    const id = await page.evaluate(() => loadPending()[0].id);
    await page.evaluate((x) => approveTerm(x), id);
    await expect(page.locator('.gl-item[data-k="SELFA|custom|Self Approval Check"]')).toHaveCount(0);
    const published = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '[]'), CUSTOM_KEY);
    expect(published.some((t) => t.abbr === 'SELFA')).toBe(false);
  });

  test('searching for a real, existing term filters correctly and highlights the match', async ({
    page,
    gotoApp,
  }) => {
    await gotoApp('/glossary.html');

    await page.locator('#glossary-input').fill(KNOWN_ABBR);
    const list = page.locator('#gl-list');
    await expect(list.locator('.gl-item')).toHaveCount(1, { timeout: 5000 });
    const item = list.locator('.gl-item').first();
    await expect(item).toContainText(KNOWN_FULL);
    // hl() wraps the matched substring in <mark class="hl">.
    await expect(item.locator('mark.hl').first()).toHaveText(new RegExp(KNOWN_ABBR, 'i'));
    await expect(page.locator('#results-count')).toContainText('1 term');
  });

  test('XSS: HTML in a submitted term\'s name and definition renders as escaped text, not markup, in the queue, once approved, and after reload', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await gotoApp('/glossary.html');

    let dialogFired = false;
    page.on('dialog', (d) => {
      dialogFired = true;
      d.dismiss().catch(() => {});
    });

    // Under the 20-char maxlength on the abbreviation field, plus an
    // unescaped definition, both containing HTML special characters that
    // would execute if hl()/esc() were skipped.
    const abbr = '<img src=x>'; // 11 chars, fits maxlength=20
    const full = '<script>window.__xssRan=true</script>';
    const def = '"><svg onload="window.__xssRan=true">bad def</svg>';

    const scriptCountBefore = await page.locator('script').count();

    // Proposed first, and the queue is a render path of its own: the same
    // markup must not execute while the term is waiting to be approved.
    await setRole('employee');
    await page.evaluate(() => renderPending());
    await fillAddForm(page, { abbr: abbr.toUpperCase(), full, def });
    await page.locator('#sb-add .btn-submit').click();
    await expect(page.locator('#gl-pending-list')).toContainText(abbr.toUpperCase());
    expect(await page.locator('script').count()).toBe(scriptCountBefore);
    expect(await page.locator('#gl-pending-list svg[onload]').count()).toBe(0);
    expect(await page.evaluate(() => window.__xssRan === true)).toBe(false);

    await setRole('qms');
    await page.evaluate(() => renderPending());
    await page.locator('.gl-pend-ok').first().click();

    const key = `${abbr.toUpperCase()}|custom|${full}`;
    const row = page.locator(`.gl-item[data-k="${key}"]`);
    await expect(row).toBeVisible();

    // Escaped text renders literally...
    await expect(row.locator('.gl-abbr')).toHaveText(abbr.toUpperCase());
    await expect(row).toContainText(full);
    // ...and never as live markup: no extra <script>/<svg> elements were
    // added to the document, and no onerror/onload ever fired.
    expect(await page.locator('script').count()).toBe(scriptCountBefore);
    expect(await row.locator('svg[onload]').count()).toBe(0);
    const ranAfterSubmit = await page.evaluate(() => window.__xssRan === true);
    expect(ranAfterSubmit).toBe(false);
    expect(dialogFired).toBe(false);

    // Same guarantee after a reload, which re-renders the term from
    // localStorage through the exact same rowHTML()/hl()/esc() path.
    await gotoApp('/glossary.html');
    const rowAfterReload = page.locator(`.gl-item[data-k="${key}"]`);
    await expect(rowAfterReload).toBeVisible();
    await expect(rowAfterReload.locator('.gl-abbr')).toHaveText(abbr.toUpperCase());
    expect(await page.locator('script').count()).toBe(scriptCountBefore);
    const ranAfterReload = await page.evaluate(() => window.__xssRan === true);
    expect(ranAfterReload).toBe(false);
    expect(dialogFired).toBe(false);
  });

  test('a search matching nothing shows the empty state with a way to add the term or clear the search', async ({
    page,
    gotoApp,
  }) => {
    await gotoApp('/glossary.html');

    const nonsense = 'ZZZNOSUCHTERM';
    await page.locator('#glossary-input').fill(nonsense);

    const empty = page.locator('.gl-empty');
    await expect(empty).toBeVisible();
    await expect(empty.locator('h2')).toContainText(nonsense);
    await expect(page.locator('#gl-list .gl-item')).toHaveCount(0);
    await expect(page.locator('#results-count')).toContainText('0 terms');
    // Short enough (<=20 chars) that the empty state also offers to add it.
    // The button's label uses curly quotes (glossary.html:946), not straight
    // ones, so this matches the real rendered text exactly.
    await expect(empty.getByRole('button', { name: `Add “${nonsense}”` })).toBeVisible();
    await expect(empty.getByRole('button', { name: 'Clear search' })).toBeVisible();

    // Clearing returns to the full list.
    await empty.getByRole('button', { name: 'Clear search' }).click();
    await expect(page.locator('#glossary-input')).toHaveValue('');
    await expect(page.locator('#gl-list .gl-item').first()).toBeVisible();
  });
});

// Terms from the API glossary (V to Z) are whole words, not abbreviations.
// They read as one name across the row, sort under their letter, are found
// by search, and name the API document their definition comes from.
test.describe('API glossary terms', () => {
  test('a whole-word term is found by search, spans the row and cites its source', async ({ page, gotoApp, clearAppState, consoleErrors }) => {
    await gotoApp('/glossary.html');
    await clearAppState();
    await gotoApp('/glossary.html');
    await page.locator('#glossary-input').fill('Wellhead');
    const row = page.locator('#gl-list .gl-item', { has: page.locator('.gl-word', { hasText: /^Wellhead$/ }) });
    await expect(row).toHaveCount(1);
    await expect(row.locator('.gl-full')).toHaveCount(0);
    await row.locator('.gl-row').click();
    await expect(row.locator('.gl-def')).toContainText('Christmas tree');
    await expect(row.locator('.gl-note')).toContainText('Source: API RP 14B, Spec 6A');
    await expect(row.locator('.gl-chip')).toHaveText('Production');
    assertNoConsoleErrors(consoleErrors);
  });

  test('every API term has a definition, a known category and a source, and none repeats', async ({ page, gotoApp }) => {
    await gotoApp('/glossary.html');
    const bad = await page.evaluate(() => {
      const api = allTerms.filter((t) => t.src);
      const out = [];
      if (api.length < 50) out.push('only ' + api.length + ' API terms');
      const seen = new Set();
      api.forEach((t) => {
        if (!t.def || !CAT_LABELS[t.cat] || !t.abbr) out.push(t.abbr || '(no name)');
        const k = t.abbr.toUpperCase();
        if (seen.has(k)) out.push('duplicate ' + t.abbr); seen.add(k);
      });
      return out;
    });
    expect(bad).toEqual([]);
  });

  test('WOC is listed as an abbreviation for Waiting on Cement', async ({ page, gotoApp }) => {
    await gotoApp('/glossary.html');
    await page.locator('#glossary-input').fill('WOC');
    const row = page.locator('#gl-list .gl-item', { has: page.locator('.gl-abbr', { hasText: /^WOC$/ }) });
    await expect(row.locator('.gl-full')).toHaveText('Waiting on Cement');
  });
});

// The redesign moved "Add a term" out of a permanent side column into a
// dialog: a drawer on a wide screen, a bottom sheet on a phone. Searching
// shows no form; asking for one opens it, traps focus, and gives focus back.
test.describe('Add a term dialog', () => {
  test('is closed until asked for, opens from the hero, traps focus and closes on Escape', async ({ page, gotoApp, clearAppState, consoleErrors }) => {
    await gotoApp('/glossary.html');
    await clearAppState();
    await gotoApp('/glossary.html');
    const dialog = page.locator('#sb-add[role="dialog"]');
    await expect(page.locator('#sf-abbr')).toBeHidden();
    await expect(page.locator('.glossary-sidebar')).toHaveCount(0);

    const opener = page.locator('.gh-add');
    await opener.click();
    await expect(dialog).toHaveAttribute('data-open', '');
    await expect(page.locator('#sf-abbr')).toBeFocused();
    await expect(opener).toHaveAttribute('aria-expanded', 'true');
    expect(await page.evaluate(() => !!document.querySelector('.glossary-layout').closest('[inert]'))).toBe(true);

    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#sb-add .th-drawer-x')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveAttribute('data-open', '');
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => !!document.querySelector('.glossary-layout').closest('[inert]'))).toBe(false);
    assertNoConsoleErrors(consoleErrors);
  });

  test('a term proposed from the results bar closes the dialog, queues, and shows once approved', async ({ page, gotoApp, clearAppState, setRole }) => {
    await gotoApp('/glossary.html');
    await clearAppState();
    await gotoApp('/glossary.html');
    await setRole('employee');
    await page.evaluate(() => renderPending());
    await page.locator('.gl-add-link').click();
    await page.locator('#sf-abbr').fill('ZZQT');
    await page.locator('#sf-full').fill('Redesign Check Term');
    await page.locator('#sb-add .btn-submit').click();

    // The dialog closes either way; the term is in the queue, not the list.
    await expect(page.locator('#sb-add')).not.toHaveAttribute('data-open', '');
    await expect(page.locator('.gl-item[data-k="ZZQT|custom|Redesign Check Term"]')).toHaveCount(0);
    await expect(page.locator('#gl-pending-list')).toContainText('ZZQT');
    // The community figure counts terms in the glossary, so it does not move
    // for a term that is only proposed.
    await expect(page.locator('#stat-community')).not.toContainText('1 added by the community');

    await setRole('qms');
    await page.evaluate(() => renderPending());
    await page.locator('.gl-pend-ok').first().click();
    await expect(page.locator('.gl-item[data-k="ZZQT|custom|Redesign Check Term"]')).toBeVisible();
    await expect(page.locator('#stat-community')).toContainText('1 added by the community');
  });
});
