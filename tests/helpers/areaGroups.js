// A small, additional derivation from the same register files baseline.js
// reads (documents-master.js), for facts computeBaseline() does not expose:
//
//   - which nav "group" each area belongs to (segment / function / product /
//     company / pending) — shared.js's Areas dropdown and index.html's three
//     "Explore by Discipline" beds only ever render the segment/function/
//     product groups; "company" (Company Wide) and "pending" (areas waiting
//     on an org decision, e.g. TWS Maintenance) are deliberately handled
//     elsewhere or not linked from primary nav at all. Tests that assert a
//     card/list COUNT need this breakdown to avoid asserting against the
//     wrong subset of computeBaseline().areaCount.
//   - the live count of alert-type documents, which the homepage's hero
//     stats panel shows and computeBaseline() does not compute.
//
// Same approach as baseline.js: load the real, plain <script> file in a Node
// vm sandbox and read the resulting globals, no business logic duplicated.

const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

function loadRegisterDetail() {
  const ctx = { console };
  vm.createContext(ctx);
  const code = fs.readFileSync(path.join(ROOT, 'documents-master.js'), 'utf8');
  const capture = `
;globalThis.__docs = TAQA_MASTER_DOCS;
;globalThis.__lookups = TAQA_DOC_LOOKUPS;
`;
  vm.runInContext(code + '\n' + capture, ctx, { filename: 'documents-master.js' });

  const docs = ctx.__docs;
  const lookups = ctx.__lookups;

  const byGroup = {};
  Object.keys(lookups.segments).forEach((id) => {
    const g = lookups.segments[id].group;
    (byGroup[g] = byGroup[g] || []).push(id);
  });

  const liveAlertCount = docs.filter((d) => {
    const t = lookups.types[d.docType] || {};
    const controlled = t.controlled !== false;
    const live = d.status === 'current' || d.status === 'under-review';
    return controlled && live && d.docType === 'alert';
  }).length;

  return { byGroup, liveAlertCount };
}

module.exports = { loadRegisterDetail };
