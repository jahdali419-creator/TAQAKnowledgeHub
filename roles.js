// TAQA Knowledge Hub: document control roles and permissions
//
// ⚠  THIS IS A SPECIFICATION, NOT A SECURITY CONTROL.
//
// Everything here runs in the browser, so it can be bypassed by opening a page
// directly or reading documents-master.js. It exists to define, unambiguously,
// which role may do what, so the back end can enforce the same matrix
// server-side. The API must filter what it returns; the client must never be
// the thing deciding what a user is allowed to see.
//
// Target implementation: Entra ID group membership, then SSO claim, then server-side
// authorization on every document and every control action.
//
// Clause basis:
//   TQ-QHSE-S001 5.5  Policies and Guidelines shall be accessible to ALL employees
//   TQ-QHSE-S001 3.1  Line management ensures all employees have access
//   ISO 9001 7.5.3.1 a)  Available and suitable for use, where and when needed
//   ISO 9001 7.5.3.1 b)  Adequately protected from improper use
//   API Q2 4.4.3 a) b)   Approval and re-approval authority
//   API Q2 4.4.3 c)      Periodic review for continued suitability
//
// Design note: two SEPARATE mechanisms, deliberately not conflated.
//   1. ROLE decides which FUNCTIONS you get (control panel, export, approve).
//   2. CLASSIFICATION decides which DOCUMENTS you get (internal/confidential/
//      restricted). See classificationsFor() below.
// Restricting the register itself to QMS would breach 5.5, because a supervisor needs
// to know which revision is current before starting a job.

const TAQA_ROLES = {

  employee: {
    label: 'Employee',
    blurb: 'Every TAQA employee. Read-only access to the register so the current revision of any document can be confirmed before use.',
    // Withdrawn documents stay VISIBLE and clearly marked rather than hidden:
    // an old printed QR code must land on the "do not use" banner, not a dead
    // link. API Q2 4.4.3 prevents unintended USE, which the viewer enforces
    // by disabling download, print, offline pin and the quick reference card.
    statuses:        ['current', 'under-review', 'superseded', 'obsolete'],
    classifications: ['internal'],
    controlPanel: false,   // overdue queue, provisional numbering report
    export:       false,   // TQ-QHSE-F086 register export
    approve:      false,   // technical sign-off
    countersign:  false,   // register release
    delegate:     false,
    editMetadata: false,
    scope:        'all'    // all segments
  },

  owner: {
    label: 'Segment Director',
    blurb: 'Holds a segment. Approves the documents the register names them approver for, which is SOPs and Standards in their own area, and may delegate that authority for a fixed period. Release still needs the QMS countersignature.',
    statuses:        ['current', 'under-review', 'superseded', 'obsolete', 'draft'],
    classifications: ['internal', 'confidential'],
    controlPanel: true,
    export:       false,
    // Technical sign-off. The register has always named "Relevant Operation
    // Director" as approver on sop and standard while this file said the
    // Segment Director approved nothing, so the two disagreed on who releases
    // a procedure. The register is right: approval follows the approver field
    // on the document type, scoped to the segment the person holds.
    approve:      true,
    countersign:  false,
    delegate:     true,
    editMetadata: true,
    // Scoped to one area, but WHICH area is not a property of the role. Every
    // segment, function and centre has its own director, so the area belongs
    // to the person, not to the job title. It lived here as a single value,
    // which quietly said the company has one director and they run Coiled
    // Tubing. See TAQA_ROLE.area().
    scope:        'own'
  },

  qms: {
    label: 'QMS / Document Controller',
    blurb: 'Custodian of the register. Countersigns what a Director has approved, checking the record and the numbering before release, and owns withdrawal, periodic review and the TQ-QHSE-F086 export. Does not give the technical sign-off on another function\'s procedure.',
    statuses:        ['current', 'under-review', 'superseded', 'obsolete', 'draft'],
    classifications: ['internal', 'confidential', 'restricted'],
    controlPanel: true,
    export:       true,
    // Deliberately false. Technical suitability is the approver's judgement,
    // not the document controller's; QMS confirms the record instead. Where a
    // type names QHSE Manager as approver, that person holds approve, not this
    // role by virtue of controlling the register.
    approve:      false,
    countersign:  true,
    delegate:     false,
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
    countersign:  false,
    delegate:     false,
    editMetadata: false,
    scope:        'all'
  }
};

const TAQA_ROLE_ORDER = ['employee', 'owner', 'qms', 'auditor'];
const TAQA_DEFAULT_ROLE = 'employee';
// Only a starting point for the preview. The real value is an SSO claim.
const TAQA_DEFAULT_AREA = 'coiled-tubing';

// Storage is not always there. A sandboxed frame throws on localStorage, and
// so does a browser with site data blocked. Keep the choice in memory as well,
// otherwise the role silently refuses to change and the switcher looks broken.
let _role = null;

const TAQA_ROLE = {
  current(){
    if (_role && TAQA_ROLES[_role]) return _role;
    let r = null;
    try { r = localStorage.getItem('taqa-demo-role'); } catch(e){}
    return TAQA_ROLES[r] ? r : TAQA_DEFAULT_ROLE;
  },
  set(r){
    if (!TAQA_ROLES[r]) return;
    _role = r;
    try { localStorage.setItem('taqa-demo-role', r); } catch(e){}
    // Switching identity drops any delegation being acted under. Carrying it
    // across a role change would mean signing as someone you are no longer.
    try { if (typeof TAQA_DELEGATION !== 'undefined') TAQA_DELEGATION.actAs(null); } catch(e){}
  },
  def(r){ return TAQA_ROLES[r || TAQA_ROLE.current()]; },

  /* ── Which area this person holds ──────────────────────────────────
     Separate from the role on purpose. "Segment Director" is a kind of
     authority; Coiled Tubing or QHSE or the Drilling Centre of Excellence
     is which one of them you are. Twenty-six areas, twenty-six holders,
     one role.

     In Azure this is the Entra ID claim and is not settable from the
     browser at all. It is the single most important value for the back end
     to get right, because it is the only thing stopping a director from
     approving another segment's procedures. Here it is a preview control.  */
  area(){
    var a = null;
    try { a = localStorage.getItem('taqa-demo-area'); } catch(e){}
    if (a && typeof TAQA_DOC_LOOKUPS !== 'undefined' && TAQA_DOC_LOOKUPS.segments[a]) return a;
    return TAQA_DEFAULT_AREA;
  },
  setArea(a){
    if (typeof TAQA_DOC_LOOKUPS !== 'undefined' && !TAQA_DOC_LOOKUPS.segments[a]) return;
    try { localStorage.setItem('taqa-demo-area', a); } catch(e){}
    // Holding a different area is being a different person, so a delegation
    // granted to you in the old one does not come with you.
    try { if (typeof TAQA_DELEGATION !== 'undefined') TAQA_DELEGATION.actAs(null); } catch(e){}
  },

  /* What the holder of an area is called. The three families do not share a
     job title, and calling the head of Legal a Segment Director reads as a
     mistake to anyone who works here. */
  areaTitle(id){
    var g = (typeof TAQA_DOC_LOOKUPS !== 'undefined' &&
             (TAQA_DOC_LOOKUPS.segments[id || TAQA_ROLE.area()] || {}).group) || 'segment';
    return g === 'function' ? 'Function Head'
         : g === 'product'  ? 'Centre Manager'
         : g === 'company'  ? 'Corporate Sponsor'
         : 'Segment Director';
  },
  areaName(id){
    var e = (typeof TAQA_DOC_LOOKUPS !== 'undefined' &&
             TAQA_DOC_LOOKUPS.segments[id || TAQA_ROLE.area()]) || {};
    return e.name || (id || TAQA_ROLE.area());
  },

  // Can this role see this document at all?
  // The back end must apply exactly this test before returning a record.
  canSee(doc, roleKey){
    const R = TAQA_ROLE.def(roleKey);
    if (!R) return false;
    if (R.statuses.indexOf(doc.status) === -1 && doc.status !== 'asset') return false;
    if (doc.classification && R.classifications.indexOf(doc.classification) === -1) return false;
    // A draft carries no authority (API Q2 4.4.3 b), so an owner sees only their own.
    if (doc.status === 'draft' && R.scope === 'own' && doc.segment !== TAQA_ROLE.area()) return false;
    return true;
  },

  // Control views (overdue queue, provisional report) are scoped for owners.
  inControlScope(doc, roleKey){
    const R = TAQA_ROLE.def(roleKey);
    if (!R || !R.controlPanel) return false;
    return R.scope === 'all' || doc.segment === TAQA_ROLE.area();
  },

  can(action, roleKey){
    const R = TAQA_ROLE.def(roleKey);
    return !!(R && R[action]);
  }
};

if (typeof module !== 'undefined' && module.exports)
  module.exports = { TAQA_ROLES, TAQA_ROLE, TAQA_ROLE_ORDER, TAQA_DEFAULT_ROLE };

/* ──────────────────────────────────────────────────────────────────────────
   Two-step release
   ──────────────────────────────────────────────────────────────────────────
   A document is released by two different people, on purpose:

     1. APPROVE      the named approver for that document type judges the
                     content fit for use. For an SOP or a Standard that is the
                     Operation Director for the segment. API Q2 4.4.3 a).
     2. COUNTERSIGN  QMS confirms the record before it goes live: the number
                     conforms to TQ-QHSE-S001 5.3, the revision and dates are
                     right, and anything it supersedes is withdrawn with it.

   Neither step can be taken by one person alone, and neither can be skipped.
   Splitting them is what lets 600 documents move without QMS judging the
   technical content of every procedure in the company, while still leaving
   one function accountable for the register.

   Tracked as approvalStage rather than as new status values, so that every
   page which already filters on status keeps working and a document in either
   queue is still, correctly, a draft with no authority.

     approvalStage 'director'  waiting on the technical sign-off
     approvalStage 'qms'       approved, waiting on the countersignature
     approvalStage null        released, or never submitted
   ────────────────────────────────────────────────────────────────────────── */
const TAQA_APPROVAL = {
  STAGES: ['director', 'qms'],

  // Who is named as approver for this document's type, verbatim from the
  // register. The back end resolves this to a person through Entra ID; here it
  // is the text the standard uses.
  approverFor(doc){
    const t = (typeof TAQA_DOC_LOOKUPS !== 'undefined' && TAQA_DOC_LOOKUPS.types[doc.docType]) || {};
    const a = (t.approver || '').trim();
    return (!a || a === ',') ? null : a;
  },

  /* A draft that shipped in the register has no stage field, so read the
     stage rather than the field: otherwise every pre-existing draft sits in
     the Director's queue on screen and refuses to be approved from it. */
  stageOf(doc){
    if (!doc || doc.status !== 'draft') return null;
    return doc.approvalStage || 'director';
  },

  // May this role take the technical sign-off on this document now?
  canApprove(doc, roleKey){
    if (TAQA_APPROVAL.stageOf(doc) !== 'director') return false;
    const cap = TAQA_ROLE.effective(roleKey);
    if (!cap.approve) return false;
    // Scope: a Director signs for their own segment and nobody else's.
    if (cap.scope !== 'all' && doc.segment !== cap.ownSegment) return false;
    // A delegation may be narrowed to certain document types.
    if (cap.docTypes && cap.docTypes.indexOf(doc.docType) === -1) return false;
    return true;
  },

  // May this role countersign and release it?
  canCountersign(doc, roleKey){
    if (TAQA_APPROVAL.stageOf(doc) !== 'qms') return false;
    return !!TAQA_ROLE.effective(roleKey).countersign;
  },

  // What is this document waiting for, in words, for whoever is looking at it.
  waitingOn(doc){
    const st = TAQA_APPROVAL.stageOf(doc);
    if (st === 'director')
      return TAQA_APPROVAL.approverFor(doc) || 'the approver named for this type';
    if (st === 'qms') return 'QMS countersignature';
    return null;
  }
};

/* ──────────────────────────────────────────────────────────────────────────
   Delegation
   ──────────────────────────────────────────────────────────────────────────
   A Director going on leave hands their authority, including the approval
   signature, to a named person for a fixed period.

   Five things are recorded because an auditor will ask for all five: who holds
   it, who granted it, what it covers, when it expires, and why. Two rules are
   enforced rather than trusted:

     No escalation.  A delegation can only ever be a subset of what the
                     grantor holds. Nobody can hand over a power they lack.
     No open end.    Every delegation expires. An expired one stops working on
                     its own, with nothing to remember to switch off.

   The released document still records the delegate's name as signer, not the
   Director's, so the audit trail says who actually signed.
   ────────────────────────────────────────────────────────────────────────── */
const TAQA_DELEGATION = {
  KEY: 'taqa-delegations-v1',
  MAX_DAYS: 90,

  _read(){
    try { const r = localStorage.getItem(TAQA_DELEGATION.KEY);
          const a = r ? JSON.parse(r) : []; return Array.isArray(a) ? a : []; }
    catch(e){ return []; }
  },
  _write(a){
    try { localStorage.setItem(TAQA_DELEGATION.KEY, JSON.stringify(a)); } catch(e){}
    try { window.dispatchEvent(new CustomEvent('taqa:delegation-changed')); } catch(e){}
  },

  list(){ return TAQA_DELEGATION._read(); },

  isActive(d){
    if (d.revokedAt) return false;
    const now = Date.now();
    return now >= new Date(d.from).getTime() && now <= new Date(d.until).getTime() + 86399000;
  },
  active(){ return TAQA_DELEGATION._read().filter(TAQA_DELEGATION.isActive); },

  /* grant() refuses rather than silently narrowing, so a Director is told why
     a delegation was not created instead of discovering later that it does
     less than they intended. */
  grant(g){
    const grantor = TAQA_ROLES[g.fromRole || 'owner'];
    if (!grantor)            return { ok:false, error:'Unknown granting role.' };
    if (!grantor.delegate)   return { ok:false, error:'This role cannot delegate.' };
    if (!g.to || !String(g.to).trim())
                             return { ok:false, error:'Name the person receiving it.' };
    if (!g.reason || !String(g.reason).trim())
                             return { ok:false, error:'Record a reason. An auditor will ask.' };
    if (!g.until)            return { ok:false, error:'Every delegation must expire.' };

    const until = new Date(g.until), from = g.from ? new Date(g.from) : new Date();
    if (isNaN(until))        return { ok:false, error:'The end date is not a date.' };
    if (until < from)        return { ok:false, error:'The end date is before the start.' };
    const days = Math.round((until - from) / 86400000);
    if (days > TAQA_DELEGATION.MAX_DAYS)
      return { ok:false, error:'A delegation may not run longer than ' + TAQA_DELEGATION.MAX_DAYS + ' days. Renew it instead.' };

    // No escalation: you cannot hand over approval you do not hold.
    if (g.includesApproval && !grantor.approve)
      return { ok:false, error:'You do not hold approval authority, so you cannot delegate it.' };

    const row = {
      id: 'DEL-' + Date.now().toString(36).toUpperCase(),
      to: String(g.to).trim(),
      fromRole: g.fromRole || 'owner',
      fromName: g.fromName || TAQA_ROLES[g.fromRole || 'owner'].label,
      segment: g.segment || TAQA_ROLE.area() || null,
      docTypes: (g.docTypes && g.docTypes.length) ? g.docTypes.slice() : null,  // null means every type the grantor holds
      includesApproval: !!g.includesApproval,
      from: from.toISOString().slice(0,10),
      until: until.toISOString().slice(0,10),
      reason: String(g.reason).trim(),
      createdAt: new Date().toISOString(),
      revokedAt: null
    };
    const all = TAQA_DELEGATION._read(); all.push(row); TAQA_DELEGATION._write(all);
    return { ok:true, delegation: row };
  },

  revoke(id){
    const all = TAQA_DELEGATION._read();
    const hit = all.find(d => d.id === id);
    if (!hit) return { ok:false, error:'No such delegation.' };
    hit.revokedAt = new Date().toISOString();
    TAQA_DELEGATION._write(all);
    return { ok:true };
  },

  /* The prototype has no signed-in identity, so "acting as a delegate" is a
     choice in the role switcher. In Azure this is the SSO subject matched
     against the 'to' field, and there is nothing to choose. */
  actingAs(){
    try { return localStorage.getItem('taqa-acting-delegation') || null; } catch(e){ return null; }
  },
  actAs(id){
    try { id ? localStorage.setItem('taqa-acting-delegation', id)
             : localStorage.removeItem('taqa-acting-delegation'); } catch(e){}
    try { window.dispatchEvent(new CustomEvent('taqa:delegation-changed')); } catch(e){}
  },
  current(){
    const id = TAQA_DELEGATION.actingAs();
    if (!id) return null;
    const d = TAQA_DELEGATION._read().find(x => x.id === id);
    return (d && TAQA_DELEGATION.isActive(d)) ? d : null;
  }
};

/* effective() is what every permission check should ask, rather than reading
   TAQA_ROLES directly: it is the role's own capabilities, widened by an active
   delegation and never beyond what the grantor holds. */
TAQA_ROLE.effective = function(roleKey){
  const base = TAQA_ROLE.def(roleKey) || TAQA_ROLES[TAQA_DEFAULT_ROLE];
  const cap = {
    approve: !!base.approve, countersign: !!base.countersign,
    delegate: !!base.delegate, editMetadata: !!base.editMetadata,
    controlPanel: !!base.controlPanel, export: !!base.export,
    scope: base.scope,
    ownSegment: base.scope === 'own' ? TAQA_ROLE.area() : null,
    docTypes: null, delegated: null
  };
  // A delegation belongs to a person, not to a role. Applying it to whichever
  // role happened to be asked about let QMS answer yes to canApprove while a
  // Director's delegation was active, which is the escalation this model is
  // supposed to prevent. Only the role actually signed in picks it up.
  if (roleKey && roleKey !== TAQA_ROLE.current()) return cap;
  const d = TAQA_DELEGATION.current();
  if (!d) return cap;
  const grantor = TAQA_ROLES[d.fromRole] || {};
  cap.approve      = cap.approve      || (!!d.includesApproval && !!grantor.approve);
  cap.editMetadata = cap.editMetadata || !!grantor.editMetadata;
  cap.controlPanel = cap.controlPanel || !!grantor.controlPanel;
  cap.scope        = 'own';                 // a delegation is always scoped
  cap.ownSegment   = d.segment || null;
  cap.docTypes     = d.docTypes;
  cap.delegate     = false;                 // a delegate cannot re-delegate
  cap.delegated    = d;
  return cap;
};

if (typeof module !== 'undefined' && module.exports)
  module.exports = { TAQA_ROLES, TAQA_ROLE, TAQA_APPROVAL, TAQA_DELEGATION };
