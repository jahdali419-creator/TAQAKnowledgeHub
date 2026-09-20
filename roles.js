// TAQA Knowledge Hub — document control roles and permissions
//
// ⚠  THIS IS A SPECIFICATION, NOT A SECURITY CONTROL.
//
// Everything here runs in the browser, so it can be bypassed by opening a page
// directly or reading documents-master.js. It exists to define, unambiguously,
// which role may do what — so the back end can enforce the same matrix
// server-side. The API must filter what it returns; the client must never be
// the thing deciding what a user is allowed to see.
//
// Target implementation: Entra ID group membership -> SSO claim -> server-side
// authorization on every document and every control action.
//
// Clause basis:
//   TQ-QHSE-S001 §5.5  Policies and Guidelines shall be accessible to ALL employees
//   TQ-QHSE-S001 §3.1  Line management ensures all employees have access
//   ISO 9001 §7.5.3.1 a)  Available and suitable for use, where and when needed
//   ISO 9001 §7.5.3.1 b)  Adequately protected from improper use
//   API Q2 §4.4.3 a) b)   Approval and re-approval authority
//   API Q2 §4.4.3 c)      Periodic review for continued suitability
//
// Design note: two SEPARATE mechanisms, deliberately not conflated.
//   1. ROLE decides which FUNCTIONS you get (control panel, export, approve).
//   2. CLASSIFICATION decides which DOCUMENTS you get (internal/confidential/
//      restricted). See classificationsFor() below.
// Restricting the register itself to QMS would breach §5.5 — a supervisor needs
// to know which revision is current before starting a job.

const TAQA_ROLES = {

  employee: {
    label: 'Employee',
    blurb: 'Every TAQA employee. Read-only access to the register so the current revision of any document can be confirmed before use.',
    // Withdrawn documents stay VISIBLE and clearly marked rather than hidden:
    // an old printed QR code must land on the "do not use" banner, not a dead
    // link. API Q2 §4.4.3 — prevent unintended USE, which the viewer enforces
    // by disabling download, print, offline pin and the quick reference card.
    statuses:        ['current', 'under-review', 'superseded', 'obsolete'],
    classifications: ['internal'],
    controlPanel: false,   // overdue queue, provisional numbering report
    export:       false,   // TQ-QHSE-F086 register export
    approve:      false,   // approve / withdraw / supersede
    editMetadata: false,
    scope:        'all'    // all segments
  },

  owner: {
    label: 'Document Owner',
    blurb: 'Owns documents for one segment. Sees their own drafts and their own overdue reviews, but approves nothing — approval authority sits with the roles named in TQ-QHSE-S001 §4.',
    statuses:        ['current', 'under-review', 'superseded', 'obsolete', 'draft'],
    classifications: ['internal', 'confidential'],
    controlPanel: true,
    export:       false,
    approve:      false,
    editMetadata: true,
    scope:        'own',   // control views limited to ownSegment
    ownSegment:   'coiled-tubing'   // demo value; real value comes from the SSO claim
  },

  qms: {
    label: 'QMS / Document Controller',
    blurb: 'Quality Management System function. Full control of the register: approval, withdrawal, metadata, periodic review and the TQ-QHSE-F086 export.',
    statuses:        ['current', 'under-review', 'superseded', 'obsolete', 'draft'],
    classifications: ['internal', 'confidential', 'restricted'],
    controlPanel: true,
    export:       true,
    approve:      true,
    editMetadata: true,
    scope:        'all'
  },

  auditor: {
    label: 'External Auditor',
    blurb: 'Time-boxed read-only access to everything, including the register export. Changes nothing. Granted per audit and revoked on close.',
    statuses:        ['current', 'under-review', 'superseded', 'obsolete', 'draft'],
    classifications: ['internal', 'confidential', 'restricted'],
    controlPanel: true,
    export:       true,
    approve:      false,
    editMetadata: false,
    scope:        'all'
  }
};

const TAQA_ROLE_ORDER = ['employee', 'owner', 'qms', 'auditor'];
const TAQA_DEFAULT_ROLE = 'employee';

const TAQA_ROLE = {
  current(){
    let r = null;
    try { r = localStorage.getItem('taqa-demo-role'); } catch(e){}
    return TAQA_ROLES[r] ? r : TAQA_DEFAULT_ROLE;
  },
  set(r){
    if (!TAQA_ROLES[r]) return;
    try { localStorage.setItem('taqa-demo-role', r); } catch(e){}
  },
  def(r){ return TAQA_ROLES[r || TAQA_ROLE.current()]; },

  // Can this role see this document at all?
  // The back end must apply exactly this test before returning a record.
  canSee(doc, roleKey){
    const R = TAQA_ROLE.def(roleKey);
    if (!R) return false;
    if (R.statuses.indexOf(doc.status) === -1 && doc.status !== 'asset') return false;
    if (doc.classification && R.classifications.indexOf(doc.classification) === -1) return false;
    // A draft carries no authority (API Q2 §4.4.3 b) — an owner sees only their own.
    if (doc.status === 'draft' && R.scope === 'own' && doc.segment !== R.ownSegment) return false;
    return true;
  },

  // Control views (overdue queue, provisional report) are scoped for owners.
  inControlScope(doc, roleKey){
    const R = TAQA_ROLE.def(roleKey);
    if (!R || !R.controlPanel) return false;
    return R.scope === 'all' || doc.segment === R.ownSegment;
  },

  can(action, roleKey){
    const R = TAQA_ROLE.def(roleKey);
    return !!(R && R[action]);
  }
};

if (typeof module !== 'undefined' && module.exports)
  module.exports = { TAQA_ROLES, TAQA_ROLE, TAQA_ROLE_ORDER, TAQA_DEFAULT_ROLE };
