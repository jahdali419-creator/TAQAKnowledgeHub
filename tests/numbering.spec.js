// Document numbers follow TQ-QHSE-S001 5.3 (the numbering table).
//
//   01 Manual           TQ-<Function>-MXXX                    TQ-QHSE-M001
//   02 Policy           TQ-<Function>-PXXX                    TQ-QHSE-P007
//   03 Standard         TQ-<Function>-SXXX, TQ-<BU>-<SPL>-SXXX TQ-TWS-QHSE-S002
//   04 SOP              TQ-<Function>-SOP-XXX, TQ-<BU>-<SPL>-SOP-XXX
//   05 Work Instruction TQ-<BU>-<SPL>-WI-XXX (business units only)
//   06 Form / Checklist TQ-<Function>-FXXX, TQ-<BU>-<SPL>-FXXX
//
// Technical Alerts (ALT) and Lessons Learned (LL) are not in the table yet
// and stay flagged until QHSE assigns them codes.
const { test, expect } = require('./helpers/fixtures');
const { TAQA_MASTER_DOCS: DOCS, TAQA_DOC_LOOKUPS: L } = require('../documents-master.js');

const ONE_LETTER = /^TQ-(?:(?:TWS|TDS|TWC|TWI|P&T)-)?[A-Z&]+-[SPMF](?:\d{3}|###)$/;
const LONG_CODE = /^TQ-(?:(?:TWS|TDS|TWC|TWI|P&T)-)?[A-Z&]+-(?:SOP|WI|ALT|LL)-\d{3}$/;
const numberedAll = () => DOCS.filter((d) => d.docNumber);
const corporate = (d) => { const s = L.segments[d.segment]; return !s.bu && (s.group === 'function' || s.group === 'company'); };

test.describe('the register follows the TQ-QHSE-S001 numbering table', () => {
  const numbered = DOCS.filter((d) => d.docNumber);

  test('every number has one of the shapes the table defines', () => {
    // An Arabic translation carries its English original's number plus -AR.
    // The table says nothing about translations, so only a record marked as a
    // translation may carry a language suffix.
    const base = (d) => (d.translationOf ? d.docNumber.replace(/-AR$/, '') : d.docNumber);
    const odd = numbered.filter((d) => !ONE_LETTER.test(base(d)) && !LONG_CODE.test(base(d))).map((d) => d.docNumber);
    expect(odd).toEqual([]);
  });

  test('no number uses the retired TAQA- prefix or the undefined MAN code', () => {
    expect(numbered.filter((d) => /^TAQA-|-MAN-/.test(d.docNumber)).map((d) => d.docNumber)).toEqual([]);
  });

  test('policies are TQ-<Function>-PXXX, as in the table (TQ-QHSE-P007, TQ-GRC-P005)', () => {
    const pol = numbered.filter((d) => d.docType === 'policy');
    expect(pol.length).toBeGreaterThan(0);
    for (const d of pol) expect(d.docNumber).toMatch(/^TQ-[A-Z&]+-P(\d{3}|###)$/);
    expect(pol.map((d) => d.docNumber)).toEqual(expect.arrayContaining(['TQ-QHSE-P007', 'TQ-GRC-P005', 'TQ-GRC-P010']));
  });

  test('a corporate function has manuals (M), never work instructions, which exist only in a business unit', () => {
    const corpWI = numbered.filter((d) => corporate(d) && /-WI-\d{3}$/.test(d.docNumber));
    expect(corpWI.map((d) => d.docNumber)).toEqual([]);
    const corpManuals = numbered.filter((d) => d.docType === 'manual' && corporate(d));
    for (const d of corpManuals) expect(d.docNumber).toMatch(/^TQ-[A-Z&]+-M\d{3}$/);
    expect(numbered.find((d) => d.docNumber === 'TQ-QHSE-M001').title).toContain('Management System Manual');
  });

  test('no two documents share a number', () => {
    const seen = new Set(), dup = [];
    for (const d of numbered) { if (seen.has(d.docNumber)) dup.push(d.docNumber); seen.add(d.docNumber); }
    expect(dup).toEqual([]);
  });

  test('every renumbered document keeps its old number, so old links and QR codes still resolve', () => {
    const moved = { 'TAQA-QHSE-P007': 'TQ-QHSE-P007', 'TAQA-CS-P010': 'TQ-GRC-P010', 'TQ-QHSE-WI-001': 'TQ-QHSE-M001', 'TQ-P&T-DSC-MAN-004': 'TQ-P&T-DSC-WI-004' };
    for (const [was, now] of Object.entries(moved)) {
      const d = DOCS.find((x) => x.legacyId === was);
      expect(d, was).toBeTruthy();
      expect(d.docNumber).toBe(now);
    }
  });

  test('only alerts, lessons learned and areas QHSE has not coded yet are still flagged', () => {
    for (const d of DOCS.filter((x) => x.numberStatus === 'provisional')) {
      const s = L.segments[d.segment], t = L.types[d.docType];
      const why = s.provisional || t.provisional || (!s.bu && s.group === 'segment') || !!d.numberNote;
      expect(why, d.docNumber + ' is flagged without a reason').toBe(true);
    }
    expect(DOCS.filter((d) => d.segment === 'cybersecurity' && d.docType === 'standard').every((d) => d.numberStatus === 'conformant')).toBe(true);
  });
});

test.describe('area short forms come from the TQ-QHSE-S001 5.3 tables', () => {
  // Corporate Function, Service & Product Line and Support Function tables.
  // Legal keeps LGL, its support-function code, by decision of the business.
  const S001 = {
    'coiled-tubing': 'CTSS', 'well-testing': 'WTS', 'well-safety': 'WSS', inspection: 'WIS',
    drilling: 'DSS', cementing: 'CMT', slickline: 'SS', wireline: 'WS', 'marine-services': 'MS',
    fracturing: 'FS', 'well-completions': 'WCS', 'tws-maintenance': 'MNT',
    qhse: 'QHSE', cybersecurity: 'GRC', finance: 'CFP', 'supply-chain': 'SC', hr: 'HR', it: 'IT', legal: 'LGL',
  };

  test('every area the standard names uses its code and is no longer flagged for it', () => {
    for (const [seg, code] of Object.entries(S001)) {
      expect(L.segments[seg].spl, seg).toBe(code);
      expect(L.segments[seg].provisional, seg).toBe(false);
    }
  });

  test('no number still uses a code the standard does not define for that area', () => {
    const retired = /^TQ-(?:[A-Z&]+-)?(?:SLK|MRS|FIN|SCM|VM)-/;
    expect(numberedAll().filter((d) => retired.test(d.docNumber)).map((d) => d.docNumber)).toEqual([]);
  });

  test('renumbered documents keep their old numbers, and corporate functions are conformant', () => {
    const moved = { 'TQ-SLK-SOP-001': 'TQ-SS-SOP-001', 'TQ-MRS-SOP-002': 'TQ-MS-SOP-002', 'TQ-MRS-F001': 'TQ-MS-F001',
      'TQ-FIN-S001': 'TQ-CFP-S001', 'TQ-SCM-M003': 'TQ-SC-M003', 'TQ-SCM-WI-003': 'TQ-SC-M003' };
    for (const [was, now] of Object.entries(moved)) {
      const d = DOCS.find((x) => x.legacyId === was || (x.formerNumbers || []).includes(was));
      expect(d && d.docNumber, was).toBe(now);
    }
    for (const seg of ['finance', 'it', 'supply-chain', 'legal'])
      expect(DOCS.filter((d) => d.segment === seg).every((d) => d.numberStatus === 'conformant'), seg).toBe(true);
    // A service line with no business unit confirmed stays flagged for that reason.
    for (const seg of ['slickline', 'marine-services', 'well-completions'])
      expect(DOCS.filter((d) => d.segment === seg).every((d) => d.numberStatus === 'provisional'), seg).toBe(true);
  });
});

test.describe('the viewer', () => {
  test('an old policy link opens the renumbered policy under its new number', async ({ page, gotoApp }) => {
    await gotoApp('/index.html');
    await page.evaluate(() => localStorage.setItem('taqa-tour-done', '1'));
    await gotoApp('/viewer.html?doc=TAQA-QHSE-P007&seg=company');
    await expect(page.locator('#doc-title')).toHaveText('Quality, Health, Safety and Environment Policy');
    await expect(page.locator('body')).toContainText('TQ-QHSE-P007');
  });
});

test.describe('upload numbers a new document by the table', () => {
  async function toStep2(page, gotoApp, setRole, clearAppState, role) {
    await gotoApp('/index.html');
    await clearAppState();
    await page.evaluate(() => { localStorage.setItem('taqa-tour-done', '1'); localStorage.setItem('taqa-install-dismissed', String(Date.now())); });
    await setRole(role, 'coiled-tubing');
    await gotoApp('/upload.html');
    await page.setInputFiles('#file-input', { name: 'n.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') });
    await page.click('#go-2');
  }
  // Type first: choosing Policy hides the area field, the way the form works.
  async function numberFor(page, seg, type) {
    await page.selectOption('#doc-type-select', type);
    await page.selectOption(type === 'policy' ? '#policy-fn' : '#seg-select', seg);
    await expect(page.locator('#doc-ref-id')).not.toHaveValue('');
    return { id: await page.locator('#doc-ref-id').inputValue(), status: page.locator('#doc-id-status') };
  }

  test('policy, company manual, forms, SOP and alert each take the table\'s shape', async ({ page, gotoApp, setRole, clearAppState }) => {
    await toStep2(page, gotoApp, setRole, clearAppState, 'qms');

    let r = await numberFor(page, 'QHSE', 'policy');
    expect(r.id).toBe('TQ-QHSE-P010');                    // after P007 and P009

    r = await numberFor(page, 'qhse', 'manual');
    expect(r.id).toBe('TQ-QHSE-M011');                    // after M001..M010
    await expect(r.status.locator('.id-ok')).toBeVisible();

    r = await numberFor(page, 'qhse', 'form');
    expect(r.id).toBe('TQ-QHSE-F001');
    r = await numberFor(page, 'coiled-tubing', 'form');
    expect(r.id).toBe('TQ-TWS-CTSS-F002');                // after the Pre-Job Safety Checklist, F001
    r = await numberFor(page, 'coiled-tubing', 'manual');
    expect(r.id).toMatch(/^TQ-TWS-CTSS-WI-\d{3}$/);      // a business unit keeps WI
    r = await numberFor(page, 'coiled-tubing', 'sop');
    expect(r.id).toMatch(/^TQ-TWS-CTSS-SOP-\d{3}$/);

    // Corporate functions and service lines take the S001 short forms.
    r = await numberFor(page, 'finance', 'standard');
    expect(r.id).toBe('TQ-CFP-S003');
    await expect(r.status.locator('.id-ok')).toBeVisible();
    r = await numberFor(page, 'slickline', 'sop');
    expect(r.id).toBe('TQ-SS-SOP-003');                   // after SOP-001 and SOP-002
    await expect(r.status).toContainText('business unit');

    // An alert has no code in the standard yet: a calm note, not a warning.
    r = await numberFor(page, 'cementing', 'alert');
    expect(r.id).toBe('TQ-TWS-CMT-ALT-001');
    await expect(r.status.locator('.id-note')).toContainText('Awaiting QHSE');
    await expect(r.status.locator('.id-warn')).toHaveCount(0);
  });
});
