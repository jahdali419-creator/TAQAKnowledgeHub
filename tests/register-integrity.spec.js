// Register integrity gate (PI-53, docs/QA/PRODUCT-INTEGRITY-AUDIT.md).
//
// scripts/check-register.js reports every place the register breaks the
// document-control rules (BUSINESS-RULES.md §8, §16). The shipped register
// already holds known legacy issues; they are listed in
// scripts/register-baseline.json and in docs/QA/REGISTER-CLEANUP-REPORT.md
// for QMS to correct at source. This gate does not pretend that data is
// clean: it fails on any finding that is NOT in the baseline (a new problem,
// in the data or produced by the code), and it proves the checker catches
// each kind of problem it claims to.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('./helpers/fixtures');
const CHECK = require('../scripts/check-register.js');
const REG = require('../documents-master.js');
const BASE = JSON.parse(fs.readFileSync(path.join(__dirname, '../scripts/register-baseline.json'), 'utf8'));

const clone = () => JSON.parse(JSON.stringify(REG.TAQA_MASTER_DOCS));
const codes = (rows) => CHECK.compare(CHECK.check(rows, REG.TAQA_DOC_LOOKUPS), BASE.known).fresh.map((f) => f.code);

test.describe('the shipped register', () => {
  test('has no integrity or data-quality finding beyond the known legacy baseline', () => {
    const r = CHECK.compare(CHECK.check(REG.TAQA_MASTER_DOCS, REG.TAQA_DOC_LOOKUPS), BASE.known);
    expect(r.fresh.map((f) => f.code + ': ' + f.message)).toEqual([]);
    // The baseline is real data, not a blanket pass: it is exactly today's findings.
    expect(r.known.length).toBe(BASE.known.length);
  });

  test('the QMS cleanup report is current for this register', () => {
    const findings = CHECK.check(REG.TAQA_MASTER_DOCS, REG.TAQA_DOC_LOOKUPS);
    const text = CHECK.report(findings, CHECK.compare(findings, BASE.known), REG.TAQA_DOC_LOOKUPS);
    expect(fs.readFileSync(path.join(__dirname, '../docs/QA/REGISTER-CLEANUP-REPORT.md'), 'utf8'),
      'run: node scripts/check-register.js --report').toBe(text);
  });
});

test.describe('the checker catches each kind of new problem', () => {
  const one = (n) => clone().find((d) => d.docNumber === n);

  test('a number and revision held twice, two revisions in force, two open revisions', () => {
    const rows = clone();
    const live = one('TQ-TWS-CTSS-SOP-007');
    rows.push(Object.assign({}, live, { title: 'Copy' }));                                   // same number + revision
    rows.push(Object.assign({}, live, { revision: '2.0', supersedes: 'Rev 1.0' }));           // second revision in force
    rows.push(Object.assign({}, one('TQ-TWS-CTSS-SOP-009'), { revision: '4.0', status: 'draft', supersedes: 'Rev 3.0' }));
    rows.push(Object.assign({}, one('TQ-TWS-CTSS-SOP-009'), { revision: '5.0', status: 'draft', supersedes: 'Rev 4.0' }));
    const c = codes(rows);
    expect(c).toContain('duplicate-number-revision');
    expect(c).toContain('multiple-live-revisions');
    expect(c).toContain('multiple-open-revisions');
  });

  test('broken supersedes and supersededBy relationships', () => {
    const rows = clone();
    Object.assign(rows.find((d) => d.docNumber === 'TQ-TWS-CTSS-SOP-007'), { status: 'superseded', supersededBy: 'Rev 9.0' });
    Object.assign(rows.find((d) => d.docNumber === 'TQ-TWS-CTSS-SOP-009'), { supersedes: 'Rev 5.0' });      // not earlier than 3.0
    Object.assign(rows.find((d) => d.docNumber === 'TQ-TWS-CTSS-SOP-011'), { supersedes: 'TQ-TWS-CTSS-SOP-002  BHA' }); // free text
    const c = codes(rows);
    expect(c).toContain('superseded-successor-missing');
    expect(c).toContain('supersedes-not-earlier');
    expect(c).toContain('supersedes-not-a-revision');
  });

  test('broken translation relationships', () => {
    const rows = clone();
    Object.assign(rows.find((d) => d.docNumber === 'TQ-TWS-CTSS-SOP-007-AR'), { translationOf: 'TQ-NOWHERE-001' });
    Object.assign(rows.find((d) => d.docNumber === 'TQ-TWS-CTSS-SOP-005'), { status: 'obsolete' }); // its -AR stays current
    const c = codes(rows);
    expect(c).toContain('translation-source-missing');
    expect(c).toContain('translation-live-without-source');
  });

  test('a new revision with no predecessor, a placeholder number, a number missing, unknown values', () => {
    const rows = clone();
    rows.push({ docNumber: 'TQ-TWS-CTSS-SOP-990', title: 'Jumped revision', segment: 'coiled-tubing', docType: 'sop', revision: '3.0', status: 'current' });
    rows.push({ docNumber: 'TQ-QHSE-P##9', title: 'Placeholder', segment: 'company', docType: 'policy', revision: '1.0', status: 'current' });
    rows.push({ docNumber: null, title: 'No number', segment: 'coiled-tubing', docType: 'sop', revision: '1.0', status: 'current' });
    rows.push({ docNumber: 'TQ-TWS-CTSS-SOP-991', title: 'Odd', segment: 'nowhere', docType: 'memo', revision: '1.0', status: 'archived' });
    const c = codes(rows);
    ['revision-without-predecessor', 'placeholder-number', 'missing-number', 'unknown-area', 'unknown-type', 'unknown-status']
      .forEach((k) => expect(c, k).toContain(k));
  });
});

test.describe('the live register after the release workflow', () => {
  test('a revision filed, checked, approved and a source withdrawn leave no new integrity finding', async ({ page, gotoApp, setRole, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await setRole('employee', 'coiled-tubing');
    await page.evaluate(() => {
      const p = TAQA_STORE.revisionParent('TQ-TWS-CTSS-SOP-002');
      TAQA_STORE.add({ docNumber: p.docNumber, supersedes: p.docNumber, title: p.title, segment: p.segment, docType: p.docType, summary: 'Revised.' });
      TAQA_STORE.add({ docNumber: 'TQ-TWS-CTSS-SOP-701', title: 'New procedure', segment: 'coiled-tubing', docType: 'sop', summary: 'New.' });
    });
    await setRole('qms', 'coiled-tubing');
    await page.evaluate(() => { TAQA_STORE.countersign('TQ-TWS-CTSS-SOP-002'); TAQA_STORE.countersign('TQ-TWS-CTSS-SOP-701'); TAQA_STORE.setStatus('TQ-TWS-CTSS-SOP-005', 'obsolete', undefined, { reason: 'Withdrawn for this test: superseded by a newer controlled document.' }); });
    await setRole('owner', 'coiled-tubing');
    await page.evaluate(() => { TAQA_STORE.approve('TQ-TWS-CTSS-SOP-002'); TAQA_STORE.approve('TQ-TWS-CTSS-SOP-701'); });
    await page.addScriptTag({ path: path.join(__dirname, '../scripts/check-register.js') });
    const fresh = await page.evaluate((known) => {
      const f = TAQA_REGISTER_CHECK.check(TAQA_STORE.all(), TAQA_DOC_LOOKUPS);
      return TAQA_REGISTER_CHECK.compare(f, known).fresh.map((x) => x.code + ': ' + x.message);
    }, BASE.known);
    expect(fresh).toEqual([]);
  });
});
