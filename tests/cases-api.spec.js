// Field cases: the foundation every case page builds on.
//
//   documents-master.js  ten case types (eight new, lesson and alert reused),
//                        each with card: true; the eight new ones cardOnly
//   cases-data.js        option lists and the shape of a case; no shipped
//                        case is invented (TAQA_CASES_SHIPPED is empty)
//   cases.js             window.TAQA_CASES: read, match, file, export
//   store.js             the filing rule: operations file field cases, for
//                        an operational segment only, never for a
//                        maintenance department, only an employee or the
//                        area's own Director
//
// A case is a register record with a nested `card`, so it follows the
// ordinary route: an employee files, QMS checks, the area's Director
// releases. Every scenario is driven by the people who would really act.
const { test, expect, DESKTOP, assertNoConsoleErrors } = require('./helpers/fixtures');

const REASON = 'The symptoms are out of order; put them in the order they were seen.';

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
const CASE_STUDY = {
  type: 'case-study', area: 'drilling', location: 'UAE', services: ['DTECH RSS'],
  title: 'RSS held the tangent through the build section', summary: 'One run through the build and tangent with the RSS.',
  eventMonth: '2026-07', holeSize: '12 1/4', sourceDoc: 'End of well report', authorRole: 'Directional Driller',
  sections: { challenge: 'Long tangent in hard stringers', action: 'Ran the RSS with a tuned BHA', result: 'One run, 2,100 ft' },
};

async function start(page, gotoApp, clearAppState, setRole, role = 'employee', area) {
  await gotoApp('/cases.html');
  await clearAppState();
  await page.evaluate(() => localStorage.setItem('taqa-tour-done', '1'));
  await setRole(role, area);
  await gotoApp('/cases.html');
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
  return { ok: r.ok, error: r.error || null, problems: (r.problems || []).map((p) => p.key),
           n: r.record ? r.record.docNumber : null, key: r.record ? TAQA_STORE.recordKey(r.record) : null,
           url: r.url || null, card: r.record ? r.record.card : null };
}, draft);
const check = (page, n) => as(page, 'qms', null, (n) => TAQA_STORE.countersign(n), n);
const release = (page, area, n) => as(page, 'owner', area, (n) => TAQA_STORE.approve(n), n);

test.describe('the ten case types', () => {
  test('are in the register with the business case\'s letters, owner, approver and review', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const r = await page.evaluate(() => {
      const T = TAQA_DOC_LOOKUPS.types;
      return {
        types: TAQA_CASES.TYPES.map((t) => [t.key, t.label, t.letter, t.cardOnly]),
        lookups: Object.keys(T).filter((k) => T[k].card).map((k) => [k, T[k].owner, T[k].approver, T[k].reviewCycleMonths, T[k].controlled, T[k].retentionYears, T[k].provisional]),
        notCase: ['sop', 'manual', 'standard', 'policy', 'form', 'bulletin', 'software'].map((k) => TAQA_CASES.isCaseType(k)),
        shipped: TAQA_CASES_SHIPPED.length,
      };
    });
    expect(r.types).toEqual([
      ['case-study', 'Case study', 'CS', true], ['lesson', 'Lesson learned', 'LL', false],
      ['incident', 'Failure / incident card', 'INC', true], ['prejob', 'Pre-job plan', 'PJP', true],
      ['appreciation', 'Customer appreciation', 'CA', true], ['practice', 'Best practice', 'BP', true],
      ['field-profile', 'Location / field profile', 'FP', true], ['benchmark', 'Performance benchmark', 'PB', true],
      ['alert', 'Technical alert / tool limit', 'ALT', false], ['training', 'Expert / training', 'EXP', true],
    ]);
    expect(r.lookups).toHaveLength(10);
    for (const [k, owner, approver, cycle, controlled, retention, prov] of r.lookups) {
      expect(controlled, k).toBe(true);
      expect(retention, k).toBe(10);
      expect(prov, k).toBe(true);
      if (k === 'lesson' || k === 'alert') continue;           // reused as they were
      expect([owner, approver, cycle], k).toEqual(['Relevant SPL / Function', 'Relevant Operation Director', 24]);
    }
    expect(r.notCase.every((x) => x === false)).toBe(true);
    expect(r.shipped).toBe(0);                                 // never an invented case
  });

  test('number with their own letters, never colliding with the existing codes', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const r = await page.evaluate(() => {
      const nn = (a, t) => TAQA_STORE.nextNumber(a, t);
      const before = ['sop', 'standard', 'form', 'manual', 'lesson', 'alert'].map((t) => nn('drilling', t));
      const fresh = ['case-study', 'incident', 'prejob', 'appreciation', 'practice', 'field-profile', 'benchmark', 'training']
        .map((t) => [nn('drilling', t), nn('coiled-tubing', t), nn('slickline', t)]);
      const ok = fresh.flat().map((n, i) => TAQA_STORE.numberFormatProblem({ docNumber: n, segment: ['drilling', 'coiled-tubing', 'slickline'][i % 3],
        docType: ['case-study', 'incident', 'prejob', 'appreciation', 'practice', 'field-profile', 'benchmark', 'training'][Math.floor(i / 3)] }));
      const bad = TAQA_STORE.numberFormatProblem({ docNumber: 'TQ-TDS-DSS-CS001', segment: 'drilling', docType: 'case-study' });
      const cross = TAQA_STORE.numberFormatProblem({ docNumber: 'TQ-TDS-DSS-INC-001', segment: 'drilling', docType: 'case-study' });
      return { before, fresh, ok, bad, cross };
    });
    expect(r.fresh[0]).toEqual(['TQ-TDS-DSS-CS-001', 'TQ-TWS-CTSS-CS-001', 'TQ-SS-CS-001']);
    expect(r.fresh.map((x) => x[0])).toEqual(['TQ-TDS-DSS-CS-001', 'TQ-TDS-DSS-INC-001', 'TQ-TDS-DSS-PJP-001', 'TQ-TDS-DSS-CA-001',
      'TQ-TDS-DSS-BP-001', 'TQ-TDS-DSS-FP-001', 'TQ-TDS-DSS-PB-001', 'TQ-TDS-DSS-EXP-001']);
    expect(r.ok.every((x) => x === null)).toBe(true);
    expect(r.bad).toContain('TQ-TDS-DSS-CS-001');
    expect(r.cross).not.toBeNull();
    // Filing a case moves only its own serial, and the existing stems are untouched.
    const filed = await fileAs(page, 'employee', null, CASE_STUDY);
    expect(filed.n).toBe('TQ-TDS-DSS-CS-001');
    const after = await page.evaluate(() => ['sop', 'standard', 'form', 'manual', 'lesson', 'alert'].map((t) => TAQA_STORE.nextNumber('drilling', t))
      .concat([TAQA_STORE.nextNumber('drilling', 'case-study')]));
    expect(after).toEqual(r.before.concat(['TQ-TDS-DSS-CS-002']));
    expect(r.before[4]).toBe('TQ-TDS-DSS-LL-010');
    expect(r.before[5]).toBe('TQ-TDS-DSS-ALT-008');
  });
});

test.describe('TAQA_CASES options', () => {
  test('follow the business case and each segment\'s own SOPs', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const o = await page.evaluate(() => {
      const O = TAQA_CASES.OPTIONS;
      return {
        areas: TAQA_CASES.operational().map((a) => a.id),
        locations: O.locations, incidentTypes: O.incidentTypes,
        drilling: O.services('drilling'), ct: O.services('coiled-tubing'), marine: O.services('marine-services'),
        everyOther: TAQA_CASES.operational().every((a) => { const l = O.services(a.id); return l.length > 1 && l[l.length - 1] === 'Other'; }),
        endD: O.endings('drilling').map((e) => e.value), endW: O.endings('wireline').map((e) => e.value),
        findD: O.findings('drilling'), findW: O.findings('wireline'),
        tripD: O.tripOut('drilling'), tripW: O.tripOut('wireline'),
        qhse: O.services('qhse'),
      };
    });
    expect(o.areas).toEqual(['coiled-tubing', 'fracturing', 'wireline', 'drilling', 'cementing', 'inspection', 'well-safety',
      'well-testing', 'slickline', 'well-completions', 'marine-services']);
    expect(o.locations).toEqual(['Saudi Arabia', 'Pakistan', 'India', 'NAM', 'Turkey', 'UAE', 'Other']);
    expect(o.incidentTypes).toEqual(['Hydraulics and pressure', 'Drill string, jars and connections', 'Downhole tool / motor',
      'MWD / LWD / survey', 'Stuck pipe / hole problem', 'Surface equipment', 'Well control', 'Other']);
    expect(o.drilling).toEqual(['DTECH RSS', 'Azem RSS', 'MM5 motor', 'Telefusion', 'APS', 'VERTEX', 'ION', 'Jar', 'Shock subs',
      'THRUSTER', 'THRELIX', 'Drilling engineering', 'Other']);
    expect(o.ct).toEqual(['Nitrogen injection', 'Milling', 'Acid stimulation', 'Fishing', 'Logging while CT', 'Other']);
    expect(o.marine).toEqual(['Vessel mobilisation', 'Cargo securing and sea fastening', 'Man overboard response', 'Other']);
    expect(o.everyOther).toBe(true);
    expect(o.endD).toEqual(['POOH', 'Troubleshooting', 'CIRC', 'Drilling ahead']);
    expect(o.endW).toEqual(['Pulled out of hole', 'Troubleshooting continued', 'Circulating / monitoring', 'Job continued', 'Job suspended']);
    expect(o.findD).toContain('MWD pulser / filter screen');
    expect(o.findW).toEqual(['Tool or equipment damage', 'Connections and threads', 'Seals and elastomers', 'Washouts, cracks, junk', 'Photos taken']);
    expect([o.tripD, o.tripW]).toEqual(['POOH', 'Pulled out of hole']);
    expect(o.qhse).toEqual(['Other']);                          // not an operational segment
  });

  test('validate() names every missing field, and the findings rule follows the trip out', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const r = await page.evaluate((inc) => {
      const V = (d) => TAQA_CASES.validate(d).map((p) => p.key);
      const noFind = JSON.parse(JSON.stringify(inc)); noFind.incident.findings = []; noFind.incident.findingsText = '';
      const notOut = JSON.parse(JSON.stringify(noFind)); notOut.incident.ending = 'CIRC';
      const future = JSON.parse(JSON.stringify(inc)); future.eventMonth = '2999-01'; future.holeSize = 'big';
      const appr = { type: 'appreciation', area: 'wireline', location: 'India', services: ['Perforation'], title: 'Customer letter', summary: 'Letter of thanks.',
        eventMonth: '2026-05', sourceDoc: 'Letter ref 12', authorRole: 'Service Quality Lead', salesReady: true,
        sections: { recognised: 'Zero NPT campaign', evidence: 'Letter ref 12', shareAgreed: false } };
      return {
        empty: V({}), ok: V(inc), noFind: V(noFind), notOut: V(notOut), future: V(future), appr: V(appr),
        otherSvc: V(Object.assign({}, inc, { services: ['Other'] })),
        msg: TAQA_CASES.validate(noFind)[0],
      };
    }, INCIDENT);
    expect(r.ok).toEqual([]);
    expect(r.empty).toEqual(expect.arrayContaining(['type', 'area', 'location', 'services', 'title', 'summary', 'eventMonth', 'sourceDoc', 'authorRole']));
    expect(r.noFind).toEqual(['incident.findings']);
    expect(r.msg.label).toBe('Findings at surface');
    expect(r.notOut).toEqual([]);
    expect(r.future).toEqual(['eventMonth', 'holeSize']);
    expect(r.appr).toEqual(['sections.shareAgreed']);
    expect(r.otherSvc).toEqual(['services']);
  });
});

test.describe('the filing rule (store.js)', () => {
  test('refuses a maintenance department, every non-operational area, and roles that are not operations', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const rec = (over) => Object.assign({ title: 'Case', summary: 'S', docType: 'incident', segment: 'drilling', revision: '1.0',
      docNumber: 'TQ-TDS-DSS-INC-001', card: { v: 1, type: 'incident', area: 'drilling' } }, over);
    const checkAs = (role, area, r) => as(page, role, area, (r) => TAQA_STORE.checkFiling(r), r);
    // An employee in an operational segment may file; a maintenance department may not.
    expect(await checkAs('employee', null, rec())).toBeNull();
    expect(await checkAs('employee', null, rec({ department: 'maintenance' }))).toBe('A field case is filed by operations, never by a maintenance department.');
    // Corporate functions, products and the company are out of scope.
    expect(await checkAs('employee', null, rec({ segment: 'qhse', docNumber: 'TQ-QHSE-INC-001' }))).toBe('A field case is filed only for an operational segment.');
    expect(await checkAs('employee', null, rec({ segment: 'pt-drilling-coe', docNumber: 'TQ-P&T-DSC-INC-001' }))).toBe('A field case is filed only for an operational segment.');
    expect(await checkAs('employee', null, rec({ segment: 'company', docNumber: 'TQ-QHSE-INC-001' }))).toBe('A field case is filed only for an operational segment.');
    // Only an employee or the area's own Director.
    const ROLE = "Field cases are filed by operations: an employee or the area’s Director.";
    expect(await checkAs('qms', null, rec())).toBe(ROLE);
    expect(await checkAs('maintenance', 'drilling', rec())).toBe(ROLE);
    expect(await checkAs('auditor', null, rec())).toBe('Your role cannot file documents.');
    expect(await checkAs('owner', 'wireline', rec())).toBe(ROLE);
    expect(await checkAs('owner', 'drilling', rec())).toBeNull();
    // A case-only type needs its card; a card goes only on a case type, and is a set of fields.
    expect(await checkAs('employee', null, rec({ card: undefined }))).toBe('Failure / incident card is filed as a field case, with its card.');
    expect(await checkAs('employee', null, rec({ docType: 'sop', docNumber: 'TQ-TDS-DSS-SOP-901' }))).toBe('Only a field case type carries a card.');
    expect(await checkAs('employee', null, rec({ card: ['not', 'fields'] }))).toBe('A field case card is a set of named fields.');
    // A Lesson Learned or Technical Alert filed as a document keeps the rules it had.
    expect(await checkAs('qms', null, { title: 'QHSE lesson', docType: 'lesson', segment: 'qhse', revision: '1.0', docNumber: 'TQ-QHSE-LL-901' })).toBeNull();
    expect(await checkAs('employee', null, { title: 'Drilling alert', docType: 'alert', segment: 'drilling', revision: '1.0', docNumber: 'TQ-TDS-DSS-ALT-901' })).toBeNull();
    // ...but a lesson filed as a card is a field case.
    expect(await checkAs('qms', null, rec({ docType: 'lesson', docNumber: 'TQ-TDS-DSS-LL-901', card: { v: 1 } }))).toBe(ROLE);
  });

  test('TAQA_CASES.canFile says the same before anyone types', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const r = {};
    for (const [role, area] of [['employee'], ['owner', 'drilling'], ['owner', 'qhse'], ['maintenance', 'drilling'], ['qms'], ['auditor']]) {
      r[role + (area ? '@' + area : '')] = await as(page, role, area, () => { const c = TAQA_CASES.canFile(); return [c.ok, c.areas.length]; });
    }
    expect(r).toEqual({ employee: [true, 11], 'owner@drilling': [true, 1], 'owner@qhse': [false, 0], 'maintenance@drilling': [false, 0], qms: [false, 0], auditor: [false, 0] });
    const filed = await fileAs(page, 'qms', null, INCIDENT);
    expect(filed.ok).toBe(false);
    expect(filed.error).toBe("Field cases are filed by operations: an employee or the area’s Director.");
  });
});

test.describe('the full route', () => {
  test('an employee files an incident, QMS checks it, the Director releases it, and it reaches the library and Search', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const filed = await fileAs(page, 'employee', null, INCIDENT);
    expect(filed.ok).toBe(true);
    expect(filed.n).toBe('TQ-TDS-DSS-INC-001');
    expect(filed.url).toBe('case.html?doc=TQ-TDS-DSS-INC-001&rev=1.0');
    // The card is kept whole, nested.
    expect(filed.card.v).toBe(1);
    expect(filed.card.incident.symptoms).toEqual(INCIDENT.incident.symptoms);
    expect(filed.card.incident.tried[1]).toEqual({ action: 'Circulated bottoms up', result: 'Failed', note: 'No change' });
    expect(filed.card.services).toEqual(['Jar', 'MM5 motor']);
    const n = filed.n;

    const view = (role, area) => as(page, role, area, (n) => ({
      released: TAQA_CASES.released().some((e) => e.docNumber === n),
      queue: TAQA_CASES.all({ includeUnreleased: true }).filter((e) => e.docNumber === n).map((e) => e.status),
      mine: TAQA_CASES.mine().filter((e) => e.docNumber === n).map((e) => e.statusLabel),
    }), n);
    expect(await view('employee')).toEqual({ released: false, queue: ['with-qms'], mine: ['With QMS'] });
    expect(await view('qms')).toEqual({ released: false, queue: ['with-qms'], mine: [] });

    expect((await check(page, n)).ok).toBe(true);
    expect(await view('owner', 'drilling')).toEqual({ released: false, queue: ['with-director'], mine: [] });
    expect((await release(page, 'drilling', n)).ok).toBe(true);

    const seen = await as(page, 'employee', null, (n) => {
      const e = TAQA_CASES.get({ doc: n, rev: '1.0' });
      const hit = TAQA_CASES.match({ area: 'drilling', source: 'case' }, 'mandrel scored')[0];
      const pack = TAQA_CASES.match({ area: 'drilling', prefer: { services: ['Jar'], holeSize: '8.5', formation: 'Shuaiba' } })[0];
      return {
        e: { source: e.source, status: e.status, statusLabel: e.statusLabel, released: e.released, mine: e.mine, url: e.url, type: e.typeLabel,
             holeSize: e.holeSize, ending: e.ending, services: e.services, contact: e.card.incident.contact, rec: e.record.status },
        inArea: TAQA_CASES.forArea('drilling').some((x) => x.docNumber === n),
        hit: hit && hit.docNumber, pack: pack && [pack.docNumber, pack.why],
        group: TAQA_CASES.groupOf(e.type),
        points: TAQA_RECOGNITION.pointsOf(),
      };
    }, n);
    expect(seen.e).toEqual({ source: 'case', status: 'published', statusLabel: 'Published', released: true, mine: true,
      url: 'case.html?doc=TQ-TDS-DSS-INC-001&rev=1.0', type: 'Failure / incident card', holeSize: '8 1/2', ending: 'POOH',
      services: ['Jar', 'MM5 motor'], contact: 'Drilling Supervisor, day crew', rec: 'current' });
    expect(seen.inArea).toBe(true);
    expect(seen.hit).toBe(n);
    expect(seen.pack).toEqual([n, ['Same service: Jar', 'Same hole size: 8 1/2 in', 'Same formation: Shuaiba']]);
    expect(seen.group).toBe('watch');
    expect(seen.points).toBe(20);

    // Search reads the register's rows, so a released case is found there too.
    await gotoApp('/ai-search.html');
    const indexed = await page.evaluate((n) => (window.TAQA_SEARCH_INDEX || []).filter((r) => r.n === n).map((r) => [r.tp, r.st]), n);
    expect(indexed).toEqual([['incident', 'current']]);
  });

  test('a returned case is filed again as its next attempt, by its filer only', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const filed = await fileAs(page, 'employee', null, CASE_STUDY);
    expect(filed.ok).toBe(true);
    expect((await as(page, 'qms', null, ({ n, r }) => TAQA_STORE.reject(n, r), { n: filed.n, r: REASON })).ok).toBe(true);
    const back = await as(page, 'employee', null, (key) => {
      const e = TAQA_CASES.mine()[0];
      return { status: e.status, label: e.statusLabel, url: e.url, key: e.key,
               inLib: TAQA_CASES.all({ includeUnreleased: true }).filter((x) => x.source !== 'register').length,
               draft: TAQA_CASES.draftFrom(key) };
    }, filed.key);
    expect(back.status).toBe('returned');
    expect(back.label).toBe('Returned: ' + REASON);
    expect(back.url).toContain('&rid=' + encodeURIComponent(filed.key));
    expect(back.inLib).toBe(0);                                   // a returned case is not in the library
    expect(back.draft.title).toBe(CASE_STUDY.title);
    expect(back.draft.sections.result).toBe('One run, 2,100 ft');

    // Someone else cannot file it again.
    const other = await as(page, 'owner', 'drilling', ({ key, d }) => TAQA_CASES.file(d, { resubmitOf: key }).error, { key: filed.key, d: back.draft });
    expect(other).toBe('Only the person who filed a case files it again.');

    const fixed = Object.assign({}, back.draft, { sections: Object.assign({}, back.draft.sections, { result: 'One run, 2,100 ft at 95 ft/hr' }) });
    const again = await as(page, 'employee', null, ({ key, d }) => {
      const r = TAQA_CASES.file(d, { resubmitOf: key });
      return r.ok ? { n: r.record.docNumber, rev: r.record.revision, attempt: r.record.attempt, of: r.record.resubmitOf,
        result: r.record.card.sections.result, statuses: TAQA_CASES.mine().map((e) => e.status) } : r.error;
    }, { key: filed.key, d: fixed });
    expect(again).toEqual({ n: filed.n, rev: '1.0', attempt: 2, of: filed.key, result: 'One run, 2,100 ft at 95 ft/hr',
      statuses: ['with-qms', 'returned'] });
    // The new attempt goes the whole way.
    expect((await check(page, filed.n)).ok).toBe(true);
    expect((await release(page, 'drilling', filed.n)).ok).toBe(true);
    const done = await as(page, 'employee', null, (n) => TAQA_CASES.get({ doc: n, rev: '1.0' }).statusLabel, filed.n);
    expect(done).toBe('Published');
  });
});

test.describe('who sees an unreleased case', () => {
  test('hidden from another employee and other areas; open to QMS, the area\'s Director and the auditor', async ({ page, gotoApp, clearAppState, setRole, seedRegister }) => {
    await start(page, gotoApp, clearAppState, setRole);
    // Filed by drilling's Director: another person than the employee.
    const filed = await fileAs(page, 'owner', 'drilling', INCIDENT);
    expect(filed.ok).toBe(true);
    // And a draft another employee filed, as the register would hold it.
    await seedRegister([{ docNumber: 'TQ-TDS-DSS-INC-002', revision: '1.0', status: 'draft', approvalStage: 'qms', title: 'Another employee\'s incident',
      segment: 'drilling', docType: 'incident', submittedById: 'sim:employee#another', submittedBy: 'Employee', card: { v: 1, type: 'incident', area: 'drilling' } }]);
    const sees = (role, area) => as(page, role, area, () => ({
      list: TAQA_CASES.all({ includeUnreleased: true }).filter((e) => e.source === 'case').map((e) => e.docNumber).sort(),
      one: !!TAQA_CASES.get({ doc: 'TQ-TDS-DSS-INC-001' }), two: !!TAQA_CASES.get({ doc: 'TQ-TDS-DSS-INC-002' }),
      released: TAQA_CASES.released().filter((e) => e.source === 'case').length,
    }));
    const hidden = { list: [], one: false, two: false, released: 0 };
    expect(await sees('employee')).toEqual(hidden);
    expect(await sees('owner', 'wireline')).toEqual(hidden);
    expect(await sees('maintenance', 'drilling')).toEqual(hidden);
    const both = { list: ['TQ-TDS-DSS-INC-001', 'TQ-TDS-DSS-INC-002'], one: true, two: true, released: 0 };
    expect(await sees('qms')).toEqual(both);
    expect(await sees('owner', 'drilling')).toEqual(both);
    expect(await sees('auditor')).toEqual(both);
    // An employee who opens the case page by its address is told nothing about it.
    await setRole('employee');
    await gotoApp('/case.html?doc=TQ-TDS-DSS-INC-001&rev=1.0');
    await expect(page.locator('#main')).not.toContainText('Jar fired early');
  });

  test('the follow-up contact is shown to reviewers only', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const filed = await fileAs(page, 'employee', null, INCIDENT);
    await check(page, filed.n);
    await release(page, 'drilling', filed.n);
    const contact = (role, area) => as(page, role, area, (n) => {
      const e = TAQA_CASES.get({ doc: n });
      return [e.card.incident.contact || null, /Drilling Supervisor/.test(TAQA_CASES.htmlCard(e)), (TAQA_CASES.toJSON(e).card.incident.contact || null)];
    }, filed.n);
    expect(await contact('employee')).toEqual(['Drilling Supervisor, day crew', true, 'Drilling Supervisor, day crew']);
    expect(await contact('qms')).toEqual(['Drilling Supervisor, day crew', true, 'Drilling Supervisor, day crew']);
    expect(await contact('owner', 'drilling')).toEqual(['Drilling Supervisor, day crew', true, 'Drilling Supervisor, day crew']);
    expect(await contact('owner', 'wireline')).toEqual([null, false, null]);
    // The record itself still holds it.
    expect(await as(page, 'qms', null, (n) => TAQA_STORE.findDoc(n).card.incident.contact, filed.n)).toBe('Drilling Supervisor, day crew');
  });
});

test.describe('the card in the register', () => {
  test('survives a reload, cannot be changed by editing details, and is the store\'s own copy', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const filed = await as(page, 'employee', null, (d) => {
      const rec = TAQA_CASES.toRecord(d);
      const row = TAQA_STORE.add(rec);
      rec.card.title = 'changed after filing'; rec.card.incident.symptoms.push({ text: 'added later' });
      return { n: row.docNumber, card: TAQA_STORE.findDoc(row.docNumber).card };
    }, INCIDENT);
    expect(filed.card.title).toBeUndefined();
    expect(filed.card.incident.symptoms).toHaveLength(2);
    await gotoApp('/case.html?doc=' + filed.n + '&rev=1.0');
    const reloaded = await page.evaluate((n) => TAQA_STORE.findDoc(n).card, filed.n);
    expect(reloaded).toEqual(filed.card);
    expect(JSON.parse(await page.evaluate(() => localStorage.getItem('taqa-uploads-v1')))[0].card.incident.findings)
      .toEqual(['Connections and threads', 'Photos taken']);
    await check(page, filed.n);
    await release(page, 'drilling', filed.n);
    const edit = await as(page, 'owner', 'drilling', (n) => [
      TAQA_STORE.patch(n, { card: { v: 1, sections: { result: 'better numbers' } } }),
      TAQA_STORE.patch(n, { title: 'A clearer title' }),
    ], filed.n);
    expect(edit[0]).toEqual({ ok: false, error: 'card cannot be edited. File a new revision instead.' });
    expect(edit[1].ok).toBe(true);
    expect(await page.evaluate((n) => TAQA_STORE.findDoc(n).card, filed.n)).toEqual(filed.card);
  });

  test('htmlCard and toJSON export it with every field escaped', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const evil = JSON.parse(JSON.stringify(INCIDENT));
    evil.title = '<img src=x onerror="document.documentElement.dataset.pwn=1">Jar';
    evil.wellRef = '<script>document.documentElement.dataset.pwn=2</script>';
    evil.incident.symptoms[0].tag = '"><svg onload=alert(1)>';
    evil.incident.cause = '</p><iframe src=javascript:alert(1)>';
    const filed = await fileAs(page, 'employee', null, evil);
    expect(filed.ok).toBe(true);
    await check(page, filed.n);
    await release(page, 'drilling', filed.n);
    const out = await as(page, 'employee', null, (n) => {
      const e = TAQA_CASES.get({ doc: n });
      const html = TAQA_CASES.htmlCard(e), json = TAQA_CASES.toJSON(e);
      return { html, json, name: TAQA_CASES.fileName(e, 'html') };
    }, filed.n);
    expect(out.html.startsWith('<!DOCTYPE html>')).toBe(true);
    for (const raw of ['<img', '<script', '<svg', '<iframe']) expect(out.html).not.toContain(raw);
    expect(out.html).toContain('&lt;img src=x onerror=&quot;document');
    expect(out.html).toContain('Suspected cause: hypothesis, not a finding');
    expect(out.json.schema).toBe('taqa-field-case/1');
    expect(out.json.card.wellRef).toBe(evil.wellRef);              // data stays data in JSON
    expect(out.name).toBe('TQ-TDS-DSS-INC-001.html');
    // Rendering the page that lists it runs nothing.
    await gotoApp('/cases.html');
    expect(await page.evaluate(() => document.documentElement.dataset.pwn || null)).toBeNull();
  });
});

test.describe('drafts and shipped cases', () => {
  test('a draft is kept per person in this browser, under taqa-case-drafts-v1', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const id = await as(page, 'employee', null, (d) => TAQA_CASES.drafts.save(d), CASE_STUDY);
    expect(id).toMatch(/^D-/);
    const r = await as(page, 'employee', null, (id) => ({ n: TAQA_CASES.drafts.list().length, title: TAQA_CASES.drafts.get(id).draft.title,
      raw: Object.keys(JSON.parse(localStorage.getItem('taqa-case-drafts-v1'))) }), id);
    expect(r).toEqual({ n: 1, title: CASE_STUDY.title, raw: ['sim:employee'] });
    expect(await as(page, 'owner', 'drilling', () => TAQA_CASES.drafts.list().length)).toBe(0);
    expect(await as(page, 'employee', null, (id) => { TAQA_CASES.drafts.remove(id); return TAQA_CASES.drafts.list().length; }, id)).toBe(0);
    // A draft is never a filing.
    expect(await page.evaluate(() => localStorage.getItem('taqa-uploads-v1'))).toBeNull();
  });

  test('a shipped case joins the library without touching any register figure', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const r = await page.evaluate(() => {
      const before = { all: TAQA_STORE.all().length, live: TAQA_STORE.rows('live').length, pending: TAQA_STORE.rows('pending').length };
      TAQA_CASES_SHIPPED.push({ id: 'DRL-TEST-001', type: 'case-study', area: 'drilling', title: 'Shipped case', summary: 'From the owner.',
        publishedDate: '2026-09-01', card: { v: 1, type: 'case-study', area: 'drilling', services: ['APS'], sections: { challenge: 'c', action: 'a', result: 'r' } } });
      TAQA_CASES_SHIPPED.push({ id: 'bad id!', type: 'case-study', area: 'drilling', title: 'Not listed' });
      TAQA_CASES_SHIPPED.push({ id: 'QHSE-1', type: 'case-study', area: 'qhse', title: 'Not operational' });
      const e = TAQA_CASES.get({ id: 'DRL-TEST-001' });
      const after = { all: TAQA_STORE.all().length, live: TAQA_STORE.rows('live').length, pending: TAQA_STORE.rows('pending').length };
      return { before, after, e: [e.source, e.key, e.url, e.status, e.released, e.record],
               lib: TAQA_CASES.released().filter((x) => x.source === 'shipped').map((x) => x.id) };
    });
    expect(r.after).toEqual(r.before);
    expect(r.e).toEqual(['shipped', 'shipped:DRL-TEST-001', 'case.html?id=DRL-TEST-001', 'published', true, null]);
    expect(r.lib).toEqual(['DRL-TEST-001']);
  });

  test('register lessons and alerts in operational segments are listed under source Register', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const r = await page.evaluate(() => {
      const reg = TAQA_CASES.match({ source: 'register' });
      return { n: reg.length, types: [...new Set(reg.map((e) => e.type))].sort(), areas: reg.every((e) => TAQA_CASES.isOperational(e.area)),
               url: reg.find((e) => e.docNumber === 'TQ-TDS-DSS-LL-001').url, drilling: TAQA_CASES.forArea('drilling').length };
    });
    expect(r.n).toBeGreaterThan(20);
    expect(r.types).toEqual(['alert', 'lesson']);
    expect(r.areas).toBe(true);
    expect(r.url).toBe('viewer.html?doc=TQ-TDS-DSS-LL-001&rev=1.0');
    expect(r.drilling).toBeGreaterThan(0);
  });
});

test.describe('pages that list cases', () => {
  test.use(DESKTOP);

  test('the QMS Workbench and the Director\'s desk show the case by its type, and their links open case.html', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const filed = await fileAs(page, 'employee', null, INCIDENT);
    await setRole('qms');
    await gotoApp('/master-list.html?view=qms&doc=' + filed.n);
    await expect(page.locator('#dw')).toHaveClass(/open/);
    await expect(page.locator('#dw-body')).toContainText('Failure / incident card');
    const open = await page.locator('#dw a.wb-open').getAttribute('href');
    expect(open).toContain('viewer.html?doc=' + filed.n);
    await gotoApp('/' + open);
    await expect(page).toHaveURL(new RegExp('/case\\.html\\?doc=' + filed.n + '&rev=1\\.0'));
    await expect(page.locator('h1')).toHaveText(INCIDENT.title);

    await check(page, filed.n);
    await setRole('owner', 'drilling');
    await gotoApp('/dashboard.html?id=drilling');
    const card = page.locator('.pending-card', { hasText: INCIDENT.title });
    await expect(card.locator('.pending-doc-type')).toContainText('Failure / incident card');
    const preview = await card.locator('a.btn-preview-link').getAttribute('href');
    await gotoApp('/' + preview);
    await expect(page).toHaveURL(/\/case\.html\?doc=/);
    assertNoConsoleErrors(consoleErrors);
  });

  test('the viewer keeps a withheld case to itself, and a register lesson stays in the viewer', async ({ page, gotoApp, clearAppState, setRole }) => {
    await start(page, gotoApp, clearAppState, setRole);
    const filed = await fileAs(page, 'owner', 'drilling', INCIDENT);     // a draft the employee may not see
    await setRole('employee');
    await gotoApp('/viewer.html?doc=' + filed.n);
    await page.waitForTimeout(300);
    expect(page.url()).toContain('/viewer.html');
    await gotoApp('/viewer.html?doc=TQ-TDS-DSS-LL-001');
    await page.waitForTimeout(300);
    expect(page.url()).toContain('/viewer.html');
    // Its filer is sent to the case page.
    await gotoApp('/cases.html');
    const mine = await fileAs(page, 'employee', null, CASE_STUDY);
    await gotoApp('/viewer.html?doc=' + mine.n);
    await expect(page).toHaveURL(new RegExp('/case\\.html\\?doc=' + mine.n));
  });
});

test.describe('the rest of RISE with a released case in the register', () => {
  test('every page that reads the register opens cleanly, for the roles that use it', async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
    test.setTimeout(180_000);                                  // nineteen page loads
    await start(page, gotoApp, clearAppState, setRole);
    const filed = await fileAs(page, 'employee', null, INCIDENT);
    await check(page, filed.n);
    await release(page, 'drilling', filed.n);
    const visits = [
      ['employee', null, ['/index.html', '/segment.html?id=drilling', '/documents.html', '/ai-search.html?q=jar', '/recognition.html', '/upload.html', '/whats-new.html']],
      ['owner', 'drilling', ['/dashboard.html?id=drilling', '/segment.html?id=drilling', '/index.html']],
      ['qms', null, ['/master-list.html', '/master-list.html?q=' + filed.n, '/analytics.html', '/index.html']],
      ['auditor', null, ['/master-list.html', '/segment.html?id=drilling']],
    ];
    for (const [role, area, paths] of visits) {
      await setRole(role, area);
      for (const p of paths) {
        await gotoApp(p);
        await expect(page.locator('body'), p).toBeVisible();
      }
    }
    assertNoConsoleErrors(consoleErrors);
  });
});

test.describe('case pages', () => {
  for (const [role, area] of [['employee'], ['owner', 'drilling'], ['maintenance', 'drilling'], ['qms'], ['auditor']]) {
    test(`the case pages open cleanly for ${role}`, async ({ page, gotoApp, clearAppState, setRole, consoleErrors }) => {
      await start(page, gotoApp, clearAppState, setRole, role, area);
      for (const path of ['/cases.html', '/cases.html?area=drilling', '/case.html?doc=TQ-TDS-DSS-INC-404', '/case-new.html', '/prejob.html?area=drilling']) {
        await gotoApp(path);
        await expect(page.locator('h1')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
      }
      assertNoConsoleErrors(consoleErrors);
    });
  }
});
