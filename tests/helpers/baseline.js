// Computes real numbers from the current register (documents-master.js +
// segments-data.js) at test-run time, so specs never hardcode a count that
// can silently drift from the data. See PHASE "BASELINE DATA INTEGRITY".
//
// This loads the same plain-<script> files the browser loads, inside a
// Node vm sandbox, and pulls out the resulting globals, it does not
// duplicate or reimplement any business logic from those files.

const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

function computeBaseline() {
  const ctx = { console };
  vm.createContext(ctx);
  const code1 = fs.readFileSync(path.join(ROOT, 'documents-master.js'), 'utf8');
  const code2 = fs.readFileSync(path.join(ROOT, 'segments-data.js'), 'utf8');
  const capture = `
;globalThis.__docs = TAQA_MASTER_DOCS;
;globalThis.__lookups = TAQA_DOC_LOOKUPS;
;globalThis.__segData = (typeof TAQA_SEGMENTS !== 'undefined') ? TAQA_SEGMENTS : null;
`;
  vm.runInContext(code1 + '\n' + code2 + '\n' + capture, ctx, { filename: 'combined.js' });

  const docs = ctx.__docs;
  const lookups = ctx.__lookups;
  const roles = loadRoles();

  const byStatus = {};
  docs.forEach((d) => {
    byStatus[d.status] = (byStatus[d.status] || 0) + 1;
  });

  const controlled = docs.filter((d) => (lookups.types[d.docType] || {}).controlled !== false);
  const live = controlled.filter((d) => d.status === 'current' || d.status === 'under-review');
  const overdue = docs.filter(
    (d) => d.status !== 'obsolete' && d.status !== 'superseded' && !!d.reviewOverdue
  );

  // What a role may open of the live population (BD-03, PI-27): the live
  // statuses are open to every role, so the classification decides. Read
  // from roles.js itself, not restated here.
  const openTo = (role) => (d) => (roles[role].classifications || []).indexOf(d.classification) !== -1;
  const liveCountFor = Object.fromEntries(Object.keys(roles).map((r) => [r, live.filter(openTo(r)).length]));
  const countsByAreaFor = (role) => Object.fromEntries(
    Object.keys(lookups.segments).map((id) => [id, live.filter((d) => d.segment === id && openTo(role)(d)).length])
  );

  const liveFor = (role) => live.filter(openTo(role));
  // Drafts waiting on a decision, counted by classification for a role.
  const pendingCountFor = Object.fromEntries(Object.keys(roles).map((r) => [r,
    docs.filter((d) => d.status === 'draft' && !d.rejected && openTo(r)(d)).length]));

  return {
    liveCountFor,
    liveFor,
    pendingCountFor,
    countsByAreaFor,
    totalRegisterRecords: docs.length,
    byStatus,
    liveCount: live.length,
    controlledCount: controlled.length,
    draftCount: byStatus.draft || 0,
    overdueCount: overdue.length,
    areaIds: Object.keys(lookups.segments),
    areaCount: Object.keys(lookups.segments).length,
    typeIds: Object.keys(lookups.types),
    typeCount: Object.keys(lookups.types).length,
    // A segment-level count, matching what segment.html/documents.html show:
    // live + controlled, excluding withdrawn/superseded, per area.
    countsByArea: Object.fromEntries(
      Object.keys(lookups.segments).map((id) => [
        id,
        docs.filter(
          (d) =>
            d.segment === id &&
            (lookups.types[d.docType] || {}).controlled !== false &&
            (d.status === 'current' || d.status === 'under-review')
        ).length,
      ])
    ),
  };
}

// roles.js runs in the browser; a stub of the few browser objects it touches
// at load is enough to read its role table.
function loadRoles() {
  const mem = {};
  const ls = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
  const ctx = {
    console, localStorage: ls, sessionStorage: ls, addEventListener() {},
    location: { search: '', pathname: '/' }, document: { addEventListener() {}, readyState: 'complete' },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'roles.js'), 'utf8') + '\n;globalThis.__roles = TAQA_ROLES;', ctx, { filename: 'roles.js' });
  return JSON.parse(JSON.stringify(ctx.__roles));
}

module.exports = { computeBaseline };
