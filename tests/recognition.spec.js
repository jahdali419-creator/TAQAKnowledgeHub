// RISE Recognition (demo): points and levels for released work only.
//
//   10  a document the person filed is released (a field case card such as
//       a case study or best practice counts as a document)
//   15  a new revision of a document whose review was overdue
//   20  a Lesson Learned, failure / incident card or Technical Alert is
//       released, as a document or as a field case
//    0  a filing that is returned, rejected, still in the queue, or
//       approved for a later date that has not arrived
//
// Levels: Contributor 10, Practitioner 50, Specialist 150, Expert 300,
// Knowledge Champion 600. Every scenario is driven by the people who would
// really act: an employee files, QMS checks, the area's Director approves.
const { test, expect, DESKTOP, assertNoConsoleErrors } = require('./helpers/fixtures');

const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const REASON = 'Section 3 is missing the isolation steps; add them and resubmit.';

async function start(page, gotoApp, clearAppState, setRole, role = 'employee', area) {
  await gotoApp('/index.html');
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
// An employee files a new document of `type` in `area`; returns its number.
const fileNew = (page, area, type, title) => as(page, 'employee', null, ({ area, type, title }) => {
  const n = TAQA_STORE.nextNumber(area, type);
  const d = TAQA_STORE.add({ docNumber: n, title, segment: area, docType: type, revision: '1.0', summary: 'Filed for the recognition test.' });
  return d ? d.docNumber : null;
}, { area, type, title });
// An employee files a field case (a register record with its card).
const fileCase = (page, area, type, title) => as(page, 'employee', null, ({ area, type, title }) => {
  const n = TAQA_STORE.nextNumber(area, type);
  const d = TAQA_STORE.add({ docNumber: n, title, segment: area, docType: type, revision: '1.0', summary: 'Filed for the recognition test.',
    card: { v: 1, type, area, location: 'Saudi Arabia', services: ['Jar'], eventMonth: '2026-08', sourceDoc: 'Test source', authorRole: 'Field Engineer', sections: {} } });
  return d ? d.docNumber : null;
}, { area, type, title });
const check = (page, n) => as(page, 'qms', null, (n) => TAQA_STORE.countersign(n), n);
const release = (page, area, n, opts) => as(page, 'owner', area, ({ n, opts }) => TAQA_STORE.approve(n, undefined, opts), { n, opts });
const employeePoints = (page) => as(page, 'employee', null, () => TAQA_RECOGNITION.pointsOf());

test.describe('Points are earned only for released work', () => {
  test('a released Lesson Learned earns 20; filing and checking alone earn nothing', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const n = await fileNew(page, 'drilling', 'lesson', 'Stuck pipe recovery on the last job');
    expect(n).toBeTruthy();
    expect(await employeePoints(page)).toBe(0);                       // filed: nothing yet
    expect((await check(page, n)).ok).toBe(true);
    expect(await employeePoints(page)).toBe(0);                       // checked: still nothing
    expect((await release(page, 'drilling', n)).ok).toBe(true);
    expect(await employeePoints(page)).toBe(20);
    const lv = await page.evaluate(() => TAQA_RECOGNITION.levelFor(TAQA_RECOGNITION.pointsOf('sim:employee')));
    expect(lv.level.name).toBe('Contributor');
    expect(lv.next.name).toBe('Practitioner');
    expect(lv.toNext).toBe(30);
  });

  test('a new revision of an overdue document earns 15', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const n = 'TQ-TWS-CTSS-SOP-004';                                   // review overdue in the register
    const rev = await as(page, 'employee', null, (n) => {
      const p = TAQA_STORE.revisionParent(n);
      const d = TAQA_STORE.add({ docNumber: n, supersedes: n, title: p.title, segment: p.segment, docType: p.docType, language: p.language, summary: 'Brought up to date.' });
      return d ? d.revision : null;
    }, n);
    expect(rev).toBe('2.0');
    await check(page, n);
    expect((await release(page, 'coiled-tubing', n)).ok).toBe(true);
    const mine = await as(page, 'employee', null, () => TAQA_RECOGNITION.contributions().map((c) => [c.docNumber, c.kind, c.points]));
    expect(mine).toEqual([[n, 'overdue', 15]]);
  });

  test('the overdue bonus is decided when the revision is released, not by later edits', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const kinds = () => as(page, 'employee', null, () => TAQA_RECOGNITION.contributions().map((c) => [c.docNumber, c.revision, c.kind, c.points]));
    const revise = (n) => as(page, 'employee', null, (n) => {
      const p = TAQA_STORE.revisionParent(n);
      const d = TAQA_STORE.add({ docNumber: n, supersedes: n, title: p.title, segment: p.segment, docType: p.docType, language: p.language, summary: 'Revised.' });
      return d ? d.revision : null;
    }, n);
    // Overdue when released: 15, and clearing the old revision's review later changes nothing.
    const late = 'TQ-TWS-CTSS-SOP-004';
    expect(await revise(late)).toBe('2.0');
    await check(page, late);
    expect((await release(page, 'coiled-tubing', late)).ok).toBe(true);
    expect((await as(page, 'owner', 'coiled-tubing', (n) => TAQA_STORE.patch(n, { reviewOverdue: false, nextReviewDate: '2099-01-01' }, '1.0'), late)).ok).toBe(true);
    // In date when released: 10, and marking the old revision overdue later changes nothing.
    const ontime = 'TQ-TWS-CTSS-SOP-007';
    expect(await revise(ontime)).toBe('2.0');
    await check(page, ontime);
    expect((await release(page, 'coiled-tubing', ontime)).ok).toBe(true);
    expect((await as(page, 'owner', 'coiled-tubing', (n) => TAQA_STORE.patch(n, { reviewOverdue: true, nextReviewDate: '2020-01-01' }, '1.0'), ontime)).ok).toBe(true);
    expect((await kinds()).sort()).toEqual([[late, '2.0', 'overdue', 15], [ontime, '2.0', 'document', 10]].sort());
    // The decision is the store's, and nobody can edit it.
    const edit = await as(page, 'owner', 'coiled-tubing', (n) => TAQA_STORE.patch(n, { replacedOverdue: false }), late);
    expect(edit.ok).toBe(false);
    expect(await employeePoints(page)).toBe(25);
  });

  test('a document past its review date counts as overdue, as the area page shows it', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    // In force with reviewOverdue false, but its review date (7 Oct 2026) has passed.
    const n = 'TQ-P&T-WCC-SOP-002';
    const before = await page.evaluate((n) => { const d = TAQA_STORE.findDoc(n); return [d.reviewOverdue, d.nextReviewDate < TAQA_STORE.localDay()]; }, n);
    expect(before).toEqual([false, true]);
    const rev = await as(page, 'employee', null, (n) => {
      const p = TAQA_STORE.revisionParent(n);
      const d = TAQA_STORE.add({ docNumber: n, supersedes: n, title: p.title, segment: p.segment, docType: p.docType, language: p.language, summary: 'Review brought up to date.' });
      return d ? d.revision : null;
    }, n);
    expect(rev).toBeTruthy();
    await check(page, n);
    expect((await release(page, 'pt-completions-coe', n)).ok).toBe(true);
    const mine = await as(page, 'employee', null, () => TAQA_RECOGNITION.contributions().map((c) => [c.kind, c.points]));
    expect(mine).toEqual([['overdue', 15]]);
  });

  test('a release approved before the bonus was recorded still earns it', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const n = 'TQ-TWS-CTSS-SOP-004';                                   // review overdue in the register
    await as(page, 'employee', null, (n) => {
      const p = TAQA_STORE.revisionParent(n);
      return TAQA_STORE.add({ docNumber: n, supersedes: n, title: p.title, segment: p.segment, docType: p.docType, language: p.language, summary: 'Brought up to date.' }) ? 1 : 0;
    }, n);
    await check(page, n);
    expect((await release(page, 'coiled-tubing', n)).ok).toBe(true);
    // The record as an earlier build wrote it: no replacedOverdue at all.
    await page.evaluate((n) => {
      const rows = JSON.parse(localStorage.getItem('taqa-uploads-v1') || '[]');
      rows.forEach((r) => { if (r.docNumber === n) delete r.replacedOverdue; });
      localStorage.setItem('taqa-uploads-v1', JSON.stringify(rows));
    }, n);
    await gotoApp('/index.html');
    const mine = await as(page, 'employee', null, () => TAQA_RECOGNITION.contributions().map((c) => [c.docNumber, c.revision, c.kind, c.points]));
    expect(mine).toEqual([[n, '2.0', 'overdue', 15]]);
  });

  test('a released record cannot be deleted, so its points stay', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const n = await fileNew(page, 'drilling', 'lesson', 'Shaker screen blinding on the 12 1/4 section');
    await check(page, n);
    await release(page, 'drilling', n);
    expect(await employeePoints(page)).toBe(20);
    for (const [role, area] of [['qms', null], ['owner', 'drilling']]) {
      expect(await as(page, role, area, (n) => TAQA_STORE.remove(n), n)).toBe(false);
    }
    expect(await employeePoints(page)).toBe(20);
    expect(await page.evaluate((n) => TAQA_STORE.findDoc(n).status, n)).toBe('current');
  });

  test('the revision actually replaced decides the bonus, never a returned attempt', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const n = 'TQ-TDS-DSS-SOP-022';                                   // a waiting Rev 4.0, its review flagged overdue
    expect((await as(page, 'qms', null, ({ n, r }) => TAQA_STORE.reject(n, r), { n, r: REASON })).ok).toBe(true);
    const again = await as(page, 'employee', null, (n) => {
      const d = TAQA_STORE.add({ resubmitOf: n + '@4.0', docNumber: n, title: 'End of Well Report SOP', summary: 'Filed again with the fixes.' });
      return d ? [d.revision, d.attempt] : null;
    }, n);
    expect(again).toEqual(['4.0', 2]);
    await check(page, n);
    expect((await release(page, 'drilling', n)).ok).toBe(true);    // attempt 2 is now in force, in date
    const rev = await as(page, 'employee', null, (n) => {
      const p = TAQA_STORE.revisionParent(n);
      const d = TAQA_STORE.add({ docNumber: n, supersedes: n, title: p.title, segment: p.segment, docType: p.docType, language: p.language, summary: 'Rev 5.0.' });
      return d ? d.revision : null;
    }, n);
    expect(rev).toBe('5.0');
    await check(page, n);
    expect((await release(page, 'drilling', n)).ok).toBe(true);
    const mine = await as(page, 'employee', null, () => TAQA_RECOGNITION.contributions().map((c) => [c.revision, c.kind, c.points]));
    expect(mine.sort()).toEqual([['4.0', 'document', 10], ['5.0', 'document', 10]]);
  });

  test('an incident card earns 20 like a lesson; any other field case earns 10 as a document', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const inc = await fileCase(page, 'drilling', 'incident', 'Jar fired early at 9,800 ft');
    const cs = await fileCase(page, 'drilling', 'case-study', 'RSS run through the build section');
    const bp = await fileCase(page, 'drilling', 'practice', 'Shock sub placement in hard stringers');
    expect([inc, cs, bp].every(Boolean)).toBe(true);
    for (const n of [inc, cs, bp]) {
      expect((await check(page, n)).ok).toBe(true);
      expect((await release(page, 'drilling', n)).ok).toBe(true);
    }
    const mine = await as(page, 'employee', null, () => TAQA_RECOGNITION.contributions().map((c) => [c.doc.docType, c.kind, c.points]));
    expect(mine.sort()).toEqual([['case-study', 'document', 10], ['incident', 'lesson', 20], ['practice', 'document', 10]]);
    expect(await employeePoints(page)).toBe(40);
    expect(await page.evaluate(() => TAQA_RECOGNITION.KIND_LABEL.lesson)).toBe('Lesson, incident or alert released');
  });

  test('an ordinary release earns 10 and a returned filing earns 0', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const a = await fileNew(page, 'drilling', 'sop', 'Rig move checklist');
    await check(page, a);
    await release(page, 'drilling', a);
    expect(await employeePoints(page)).toBe(10);
    const b = await fileNew(page, 'drilling', 'sop', 'Mud weight change procedure');
    expect((await as(page, 'qms', null, ({ b, r }) => TAQA_STORE.reject(b, r), { b, r: REASON })).ok).toBe(true);
    expect(await employeePoints(page)).toBe(10);                      // returned: 0, and nothing taken away
  });

  test('approved for a later date earns nothing until it takes effect', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const n = await fileNew(page, 'drilling', 'sop', 'Casing running procedure');
    await check(page, n);
    const tomorrow = await page.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + 1); return TAQA_STORE.localDay(d); });
    const r = await release(page, 'drilling', n, { effectiveDate: tomorrow });
    expect(r.ok).toBe(true);
    expect(await employeePoints(page)).toBe(0);
  });

  test('example entries are kept out of the register', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const before = await page.evaluate(() => ({ all: TAQA_STORE.all().length, live: TAQA_STORE.rows('live').length }));
    await gotoApp('/recognition.html');
    await gotoApp('/segment.html?id=drilling');
    const after = await page.evaluate(() => ({
      all: TAQA_STORE.all().length, live: TAQA_STORE.rows('live').length,
      uploads: localStorage.getItem('taqa-uploads-v1'),
      examples: TAQA_RECOGNITION.examples('drilling').map((e) => e.example && /^example:/.test(e.id)),
    }));
    expect({ all: after.all, live: after.live }).toEqual(before);
    expect(after.uploads === null || after.uploads === '[]').toBe(true);
    expect(after.examples.length).toBeGreaterThan(0);
    expect(after.examples.every(Boolean)).toBe(true);
  });
});

test.describe('A new level is announced once, to the person who earned it', () => {
  test.use(DESKTOP);

  test('the filer sees it the next time they open RISE, and only once', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await gotoApp('/index.html');                                     // the employee has been here before
    await expect(page.locator('#rise-note')).toHaveCount(0);
    const n = await fileNew(page, 'drilling', 'lesson', 'Lost circulation: early signs');
    await check(page, n);
    await release(page, 'drilling', n);
    await setRole('employee');
    await gotoApp('/index.html');
    const note = page.locator('#rise-note');
    await expect(note).toHaveText(/You reached Contributor/);
    await expect(note).toHaveAttribute('role', 'status');
    expect(await note.evaluate((n) => getComputedStyle(n).pointerEvents)).toBe('none');
    expect(await page.evaluate(() => document.activeElement === document.body || document.activeElement === null)).toBe(true);
    // Once it fades it leaves the page, so a screen reader cannot land on it later.
    await expect(note).toBeHidden({ timeout: 9000 });
    await expect(note).toHaveText('');
    await gotoApp('/index.html');
    await page.waitForTimeout(300);
    await expect(page.locator('#rise-note.on')).toHaveCount(0);
  });

  test.describe('on a phone', () => {
    test.use(PHONE);
    test('the note uses the screen width instead of half of it', async ({ page, gotoApp, clearAppState, setRole }) => {
      await start(page, gotoApp, clearAppState, setRole);
      await gotoApp('/index.html');
      const n = await fileNew(page, 'drilling', 'lesson', 'Pump pressure drop: what we checked');
      await check(page, n);
      await release(page, 'drilling', n);
      await setRole('employee');
      await gotoApp('/glossary.html');
      const note = page.locator('#rise-note');
      await expect(note).toHaveText(/You reached Contributor/);
      const box = await note.boundingBox();
      expect(box.width).toBeGreaterThan(260);                        // was capped at 195 (half of 390)
      expect(box.x).toBeGreaterThanOrEqual(15);
      expect(box.x + box.width).toBeLessThanOrEqual(390 - 15);
      expect(box.height).toBeLessThan(64);                           // one or two lines, not four
    });
  });

  test('a first visit never shows a message', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await gotoApp('/segment.html?id=drilling');
    await expect(page.locator('#rise-note')).toHaveCount(0);
  });
});

test.describe('Where the level shows', () => {
  test.describe('desktop bar', () => {
    test.use(DESKTOP);
    for (const [role, area, shown] of [['employee', null, true], ['owner', 'drilling', true], ['maintenance', 'drilling', true], ['qms', null, false], ['auditor', null, false]]) {
      test(`${role}: ${shown ? 'shows' : 'has no'} level badge`, async ({ page, gotoApp, clearAppState, setRole }) => {
        await start(page, gotoApp, clearAppState, setRole, role, area);
        await gotoApp('/index.html');
        const badge = page.locator('#rise-lvl');
        if (!shown) { await expect(badge).toHaveCount(0); return; }
        await expect(badge).toBeVisible();
        await expect(badge).toHaveAttribute('href', 'recognition.html');
        // Its level shows as text, and its name starts with what is shown.
        await expect(badge.locator('.rlv-name')).toHaveText('No level yet');
        await expect(badge.locator('.rlv-name')).toBeVisible();
        await expect(badge).toHaveAccessibleName(/^No level yet\s*,\s*your level\. Open My contributions$/);
        // It sits right after the role control, inside the bar's right cluster.
        expect(await page.evaluate(() => document.getElementById('taqa-door').nextElementSibling.id)).toBe('rise-lvl');
      });
    }
  });

  test.describe('phone menu', () => {
    test.use(PHONE);
    test('carries My contributions with the level, and Contributions for QMS', async ({ page, gotoApp, clearAppState, setRole, topbar }) => {
      await start(page, gotoApp, clearAppState, setRole);
      await gotoApp('/index.html');
      await expect(page.locator('#rise-lvl')).toBeHidden();
      await topbar.openMenu();
      await expect(page.locator('#nav-mobile-menu .mm-main a#mm-rise')).toContainText('My contributions');
      await expect(page.locator('#mm-rise')).toContainText('No level yet');
      await setRole('qms');
      await gotoApp('/index.html');
      await topbar.openMenu();
      await expect(page.locator('#mm-rise')).toHaveText('Contributions');
    });
  });
});

test.describe('Area pages', () => {
  test('Drilling shows the top three this month, examples marked', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await gotoApp('/segment.html?id=drilling');
    const strip = page.locator('#rise-top');
    await expect(strip).toBeVisible();
    await expect(strip.locator('.rise-top-h')).toHaveText('Top contributors this month');
    await expect(strip.locator('li')).toHaveCount(3);
    for (const li of await strip.locator('li').all()) await expect(li).toContainText('Example');
    await expect(strip.locator('a.rise-top-all')).toHaveAttribute('href', 'recognition.html?area=drilling#board');
    assertNoConsoleErrors(consoleErrors);
  });

  test('a person’s released work joins the list, and an unknown area shows none', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    for (const t of ['Kick detection drill notes', 'Tripping practice review', 'Shale shaker screen change']) {
      const n = await fileNew(page, 'drilling', 'lesson', t);
      await check(page, n);
      await release(page, 'drilling', n);
    }
    await setRole('employee');
    await gotoApp('/segment.html?id=drilling');
    await expect(page.locator('#rise-top li').first()).toContainText('You, Employee');
    await expect(page.locator('#rise-top li').first()).toContainText('60 pts');
    await gotoApp('/segment.html?id=no-such-area');
    await expect(page.locator('#rise-top')).toBeHidden();
  });
});

test.describe('My contributions page', () => {
  for (const [role, area] of [['employee'], ['owner', 'drilling'], ['maintenance', 'drilling'], ['qms'], ['auditor']]) {
    test(`opens cleanly for ${role}`, async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
      await start(page, gotoApp, clearAppState, setRole, role, area);
      await gotoApp('/recognition.html');
      await expect(page.locator('h1')).toHaveText(['employee', 'owner', 'maintenance'].includes(role) ? 'My contributions' : 'Contributions');
      await expect(page.locator('#rc-board-list li').first()).toBeVisible();
      await expect(page.locator('#rc-areas-list li').first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      assertNoConsoleErrors(consoleErrors);
    });
  }

  test('area totals never rank teams on example points', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await gotoApp('/recognition.html');
    const rows = page.locator('#rc-areas-list li');
    await expect(rows.first()).toBeVisible();
    // Nothing real released yet: every bar says it is an example.
    const n0 = await rows.count();
    for (let i = 0; i < n0; i++) await expect(rows.nth(i)).toContainText('Example');
    await expect(page.locator('#rc-areas-sub')).toContainText('example points');
    // One real release puts its area first, with real and example points apart.
    const n = await fileNew(page, 'wireline', 'lesson', 'Cable head torque check');
    await check(page, n);
    await release(page, 'wireline', n);
    await setRole('employee');
    await gotoApp('/recognition.html');
    await expect(rows.first().locator('a')).toHaveText('Wireline Services');
    await expect(rows.first().locator('.v')).toHaveText(/^20 pts(\s*\+ \d+ example)?$/);
    const top = await page.evaluate(() => TAQA_RECOGNITION.byArea()[0]);
    expect([top.id, top.real]).toEqual(['wireline', 20]);
  });

  test('QMS and the auditor are not addressed as earners', async ({ page, gotoApp, clearAppState, setRole }) => {
    for (const role of ['qms', 'auditor']) {
      await start(page, gotoApp, clearAppState, setRole, role);
      await gotoApp('/recognition.html');
      await expect(page.locator('#rc-rules-body tr').first()).toContainText('A document or field case someone filed is released');
      await expect(page.locator('#rc-lede')).not.toContainText('your points');
      if (role === 'qms') await expect(page.locator('#rc-level-body')).toContainText('before the approver releases it');
    }
  });

  test.describe('desktop badge on My contributions', () => {
    test.use(DESKTOP);
    test('marks the page as the current one', async ({ page, gotoApp, clearAppState, setRole }) => {
      await start(page, gotoApp, clearAppState, setRole);
      await gotoApp('/recognition.html');
      await expect(page.locator('#rise-lvl')).toHaveAttribute('aria-current', 'page');
      await gotoApp('/glossary.html');
      await expect(page.locator('#rise-lvl')).not.toHaveAttribute('aria-current', 'page');
    });
  });

  test('progress reports the true figure, and the page says levels are not appraisal', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    await gotoApp('/recognition.html');
    await expect(page.locator('.lv-bar')).toHaveAttribute('aria-valuenow', '0');
    await expect(page.locator('.foot')).toContainText('not linked to appraisal, pay or performance reviews');
  });

  test('lists released work, hides the name on request, and keeps titles as text', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const n = await fileNew(page, 'drilling', 'lesson', '<img src="x" onerror="document.documentElement.dataset.pwn=1">Bit balling');
    expect(n).toBeTruthy();
    await check(page, n);
    await release(page, 'drilling', n);
    await setRole('employee');
    await gotoApp('/recognition.html?area=drilling');
    await expect(page.locator('#rc-mine-list li')).toHaveCount(1);
    await expect(page.locator('#rc-mine-list li')).toContainText('+20');
    await expect(page.locator('#rc-board-list li.mine')).toContainText('You, Employee');
    await page.locator('#rc-hide').check();
    await expect(page.locator('#rc-board-list li.mine')).toContainText('You (name hidden from others)');
    await gotoApp('/recognition.html?area=drilling');
    await expect(page.locator('#rc-hide')).toBeChecked();
    expect(await page.evaluate(() => document.querySelectorAll('img[src="x"]').length + (document.documentElement.dataset.pwn ? 1 : 0))).toBe(0);
  });
});
