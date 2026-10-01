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
    registerView: false,   // the Master List, which is the controller's view
    approve:      false,   // technical sign-off
    countersign:  false,   // register release
    delegate:     false,
    editMetadata: false,
    // May file a document for approval. Filing is not authority: the draft
    // carries none until QMS has checked it and the named approver has
    // released it (API Q2 4.4.3 b), so anyone who writes a procedure may
    // propose it. This is the business workflow: an employee submits, QMS
    // checks, the Director approves.
    submit:       true,
    scope:        'all'    // all segments
  },

  owner: {
    label: 'Segment Director',
    blurb: 'Holds a segment. Approves the documents the register names them approver for, which is SOPs and Standards in their own area, and may delegate that authority for a fixed period. Release still needs the QMS countersignature.',
    statuses:        ['current', 'under-review', 'superseded', 'obsolete', 'draft'],
    classifications: ['internal', 'confidential'],
    controlPanel: true,
    export:       false,
    // A Director runs their own segment's desk, not the company register.
    registerView: false,
    // Technical sign-off. The register has always named "Relevant Operation
    // Director" as approver on sop and standard while this file said the
    // Segment Director approved nothing, so the two disagreed on who releases
    // a procedure. The register is right: approval follows the approver field
    // on the document type, scoped to the segment the person holds.
    approve:      true,
    countersign:  false,
    delegate:     true,
    editMetadata: true,
    submit:       true,
    // Scoped to one area, but WHICH area is not a property of the role. Every
    // segment, function and centre has its own director, so the area belongs
    // to the person, not to the job title. It lived here as a single value,
    // which quietly said the company has one director and they run Coiled
    // Tubing. See TAQA_ROLE.area().
    scope:        'own'
  },

  maintenance: {
    label: 'Maintenance Manager',
    blurb: 'Heads a segment\'s maintenance department. Approves that department\'s documents, and only those: its maintenance procedures, manuals and checklists. The Segment Director keeps the segment\'s other documents. QMS still checks every one first.',
    statuses:        ['current', 'under-review', 'superseded', 'obsolete', 'draft'],
    classifications: ['internal', 'confidential'],
    controlPanel: true,
    export:       false,
    registerView: false,
    // Approval follows the department: a document the segment files as
    // Maintenance is released by its Maintenance Manager, not its Director.
    // See TAQA_APPROVAL.canApprove.
    approve:      true,
    countersign:  false,
    delegate:     true,
    editMetadata: true,
    submit:       true,
    scope:        'own',
    department:   'maintenance'
  },

  qms: {
    label: 'QMS / Document Controller',
    blurb: 'Custodian of the register. Countersigns what a Director has approved, checking the record and the numbering before release, and owns withdrawal, periodic review and the TQ-QHSE-F086 export. Does not give the technical sign-off on another function\'s procedure.',
    statuses:        ['current', 'under-review', 'superseded', 'obsolete', 'draft'],
    classifications: ['internal', 'confidential', 'restricted'],
    controlPanel: true,
    export:       true,
    registerView: true,
    // Deliberately false. Technical suitability is the approver's judgement,
    // not the document controller's; QMS confirms the record instead. Where a
    // type names QHSE Manager as approver, that person holds approve, not this
    // role by virtue of controlling the register.
    approve:      false,
    countersign:  true,
    delegate:     false,
    editMetadata: true,
    submit:       true,
    scope:        'all'
  },

  auditor: {
    label: 'External Auditor',
    blurb: 'Time-boxed read-only access to everything, including the register export. Changes nothing. Granted per audit and revoked on close.',
    statuses:        ['current', 'under-review', 'superseded', 'obsolete', 'draft'],
    classifications: ['internal', 'confidential', 'restricted'],
    controlPanel: true,
    export:       true,
    registerView: true,
    approve:      false,
    countersign:  false,
    delegate:     false,
    editMetadata: false,
    // Changes nothing, and that includes filing: an auditor who could add a
    // draft to the register would be adding to the record they are auditing.
    submit:       false,
    scope:        'all'
  }
};

const TAQA_ROLE_ORDER = ['employee', 'owner', 'maintenance', 'qms', 'auditor'];
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
    // What a person may see changes with the role, so anything derived from
    // the register has to be rebuilt rather than left showing the last role's
    // answer. The search index is the one that would otherwise go stale.
    try { window.dispatchEvent(new CustomEvent('taqa:role-changed', {detail:{role:r}})); } catch(e){}
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
    if (a && typeof TAQA_DOC_LOOKUPS !== 'undefined' && TAQA_DOC_LOOKUPS.segments[a] &&
        TAQA_ROLE.holds(a)) return a;
    return TAQA_DEFAULT_AREA;
  },
  /* Can the signed-in role hold this area at all? A Maintenance Manager
     heads an operational segment's maintenance department, and only
     operational segments have one: not a function, a centre or the company. */
  holds(a, roleKey){
    if ((roleKey || TAQA_ROLE.current()) !== 'maintenance') return true;
    var s = (typeof TAQA_DOC_LOOKUPS !== 'undefined') && TAQA_DOC_LOOKUPS.segments[a];
    return !s || s.group === 'segment';
  },
  setArea(a){
    if (typeof TAQA_DOC_LOOKUPS !== 'undefined' && !TAQA_DOC_LOOKUPS.segments[a]) return;
    if (!TAQA_ROLE.holds(a)) return;
    try { localStorage.setItem('taqa-demo-area', a); } catch(e){}
    // Holding a different area is being a different person, so a delegation
    // granted to you in the old one does not come with you.
    try { if (typeof TAQA_DELEGATION !== 'undefined') TAQA_DELEGATION.actAs(null); } catch(e){}
    try { window.dispatchEvent(new CustomEvent('taqa:role-changed', {detail:{area:a}})); } catch(e){}
  },

  /* What the holder of an area is called. The three families do not share a
     job title, and calling the head of Legal a Segment Director reads as a
     mistake to anyone who works here. */
  /* What the signed-in person is called in their area: the area's holder, or
     its Maintenance Manager, who sits in the same area with a narrower hand. */
  holderTitle(){
    return TAQA_ROLE.current() === 'maintenance' ? 'Maintenance Manager' : TAQA_ROLE.areaTitle();
  },
  areaTitle(id){
    var g = (typeof TAQA_DOC_LOOKUPS !== 'undefined' &&
             (TAQA_DOC_LOOKUPS.segments[id || TAQA_ROLE.area()] || {}).group) || 'segment';
    return g === 'function' ? 'Function Head'
         : g === 'product'  ? 'Centre Manager'
         : g === 'company'  ? 'Corporate Sponsor'
         : 'Segment Director';
  },
  /* May this person open the Master List?
     The register view is the document controller's instrument: the F086
     export, the overdue queue, the provisional numbering report, every
     revision including withdrawn ones. QMS and an auditor need it; nobody
     else has a job that requires it.

     This does not narrow what an employee can reach. TQ-QHSE-S001 5.5 and
     ISO 9001 7.5.3.1 a) require that anyone can confirm the current revision
     before a job, and Search, the segment libraries and the viewer all still
     do that for every role. What goes away is the control apparatus, not the
     documents. */
  canRegister(roleKey){
    return !!(TAQA_ROLE.def(roleKey) || {}).registerView;
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

/* A page that belongs to a role nobody else holds refuses at the door, the
   same way the Master List does. Hiding the link is not enough: the address
   can be typed. In Azure it is the API that declines; this states the same
   rule where it can be seen. Replaces the page and stops it, so nothing
   below runs against a document that has just been emptied. */
TAQA_ROLE.refuse = function(title, why){
  var who = (TAQA_ROLES[TAQA_ROLE.current()] || {}).label || 'your role';
  var dark = false;
  try { dark = localStorage.getItem('taqa-theme-v3') === 'dark'; } catch(e){}
  var ink = dark ? '#C7DBDD' : '#1E1C1A', mute = dark ? '#8CB6B9' : '#524D48',
      bg = dark ? '#001314' : '#F4F4F3', line = dark ? '#00484B' : '#BEB8B2',
      teal = dark ? '#00BBB6' : '#005D63';
  var e = function(t){ return String(t).replace(/[&<>"]/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  document.documentElement.setAttribute('data-taqa-theme', dark ? 'dark' : 'light');
  document.body.innerHTML =
    '<main style="max-width:620px;margin:16vh auto;padding:0 24px;text-align:center;font-family:Inter,system-ui,sans-serif">' +
      '<h1 style="font-family:BwGradual,Urbanist,sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.3px;margin:0 0 12px;color:' + ink + '">' + e(title) + '</h1>' +
      '<p style="font-size:14px;line-height:1.7;color:' + mute + ';margin:0 0 10px">' + e(why) +
        ' You are signed in as <b style="color:' + ink + '">' + e(who) + '</b>.</p>' +
      '<p style="font-size:14px;line-height:1.7;color:' + mute + ';margin:0 0 24px">Every document you need is still open to you, and each one tells you whether it is current before you use it.</p>' +
      '<a href="ai-search.html" style="display:inline-block;font-size:13.5px;font-weight:600;color:#fff;background:#005D63;border-radius:9px;padding:11px 22px;text-decoration:none;margin:0 4px 8px">Search the documents</a>' +
      '<a href="index.html" style="display:inline-block;font-size:13.5px;font-weight:600;color:' + teal + ';border:1px solid ' + line + ';border-radius:9px;padding:11px 22px;text-decoration:none;margin:0 4px 8px">Home</a>' +
      // A preview has no sign-in, so whoever is previewing needs a way to try
      // another role from here instead of going home to find the switcher.
      '<p style="font-size:12.5px;color:' + mute + ';margin:22px 0 8px">Trying a different role? View this page as</p>' +
      TAQA_ROLE_ORDER.filter(function(k){ return k !== TAQA_ROLE.current(); }).map(function(k){
        return '<button type="button" data-role="' + k + '" style="font:inherit;font-size:12.5px;font-weight:600;color:' + teal + ';background:none;border:1px solid ' + line + ';border-radius:999px;padding:8px 14px;min-height:44px;margin:0 3px 6px;cursor:pointer">' + e(TAQA_ROLES[k].label) + '</button>';
      }).join('') +
    '</main>';
  document.body.addEventListener('click', function(ev){
    var b = ev.target.closest && ev.target.closest('button[data-role]');
    if (!b) return;
    TAQA_ROLE.set(b.getAttribute('data-role'));
    location.reload();
  });
  document.body.style.background = bg;
  if (window.stop) window.stop();
};

/* May this person manage an area's desk, or one of its documents?

     canManage(areaId)  the desk: its queue, contributors and published list.
                        The holder of that area, or QMS for every area.
     canManage(doc)     one document: withdraw it or edit its details. The
                        area must be theirs AND the department must be: an
                        Operations document is its Segment Director's, a
                        maintenance document (TAQA_APPROVAL.isMaintenance) its
                        Maintenance Manager's. The same split as approval, so
                        nobody withdraws what they could never have released.
                        QMS keeps every document in every area.

   An auditor reads the register instead; an employee has no desk. Lifecycle
   fields (status, stage, signatures) never change by editing; see
   TAQA_STORE.patch. */
TAQA_ROLE.canManage = function(target){
  var cap = TAQA_ROLE.effective();
  if (!cap.editMetadata) return false;
  if (cap.scope === 'all') return true;
  var doc = (target && typeof target === 'object') ? target : null;
  var areaId = doc ? doc.segment : target;
  if (areaId && areaId !== cap.ownSegment) return false;
  if (doc && typeof TAQA_APPROVAL !== 'undefined' &&
      TAQA_APPROVAL.isMaintenance(doc) !== (cap.department === 'maintenance')) return false;
  return true;
};

if (typeof module !== 'undefined' && module.exports)
  module.exports = { TAQA_ROLES, TAQA_ROLE, TAQA_ROLE_ORDER, TAQA_DEFAULT_ROLE };

/* ──────────────────────────────────────────────────────────────────────────
   Two-step release
   ──────────────────────────────────────────────────────────────────────────
   A document is released by two different people, on purpose:

     1. COUNTERSIGN  QMS checks the record first: the number conforms to
                     TQ-QHSE-S001 5.3, the revision and dates are right, and
                     anything it supersedes is withdrawn with it. Not a
                     co-signature after the fact, a gate before the Director's
                     name goes on anything.
     2. APPROVE      the named approver for that document type gives the
                     final sign-off that content is fit for use, and that is
                     what releases it. For an SOP or a Standard that is the
                     Operation Director for the segment. API Q2 4.4.3 a).

   Neither step can be taken by one person alone, and neither can be skipped.
   QMS going first is what lets 600 documents move without a Director's name
   ever going on a record with a bad number or a stale revision on it, while
   the Director stays the one who actually releases their own segment's work.

   Tracked as approvalStage rather than as new status values, so that every
   page which already filters on status keeps working and a document in either
   queue is still, correctly, a draft with no authority.

     approvalStage 'qms'       waiting on QMS's conformance check
     approvalStage 'director'  checked, waiting on the Director's approval
     approvalStage null        released, rejected, or never submitted
   ────────────────────────────────────────────────────────────────────────── */
const TAQA_APPROVAL = {
  STAGES: ['qms', 'director'],

  // A segment's maintenance department document: filed as Maintenance, or a
  // Maintenance Bulletin, which is one by definition.
  isMaintenance(doc){
    return !!doc && (doc.department === 'maintenance' || doc.docType === 'bulletin');
  },

  // Who is named as approver for this document's type, verbatim from the
  // register. The back end resolves this to a person through Entra ID; here it
  // is the text the standard uses.
  approverFor(doc){
    if (TAQA_APPROVAL.isMaintenance(doc)) return 'Maintenance Manager';
    const t = (typeof TAQA_DOC_LOOKUPS !== 'undefined' && TAQA_DOC_LOOKUPS.types[doc.docType]) || {};
    const a = (t.approver || '').trim();
    return (!a || a === ',') ? null : a;
  },

  /* A draft that shipped in the register has no stage field, so read the
     stage rather than the field: otherwise every pre-existing draft sits in
     QMS's queue on screen and refuses to be checked from it. A rejected
     draft holds no stage either, so it drops out of both queues until it is
     resubmitted rather than sitting there asking to be signed again. */
  stageOf(doc){
    if (!doc || doc.status !== 'draft' || doc.rejected) return null;
    return doc.approvalStage || 'qms';
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
    // Department: a maintenance document is its Maintenance Manager's to
    // release, and nothing else is. A Director does not sign maintenance
    // documents, and a Maintenance Manager signs nothing outside them.
    // An 'all' scope (none holds approve today) is not narrowed.
    if (cap.scope !== 'all' && TAQA_APPROVAL.isMaintenance(doc) !== (cap.department === 'maintenance')) return false;
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
    if (st === 'qms') return 'QMS conformance check';
    if (st === 'director')
      return TAQA_APPROVAL.approverFor(doc) || 'the approver named for this type';
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
    submit: !!base.submit,
    controlPanel: !!base.controlPanel, export: !!base.export,
    scope: base.scope,
    department: base.department || null,
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
  cap.department   = grantor.department || null;   // a delegate signs in the grantor's department
  cap.delegate     = false;                 // a delegate cannot re-delegate
  cap.delegated    = d;
  return cap;
};

if (typeof module !== 'undefined' && module.exports)
  module.exports = { TAQA_ROLES, TAQA_ROLE, TAQA_APPROVAL, TAQA_DELEGATION };
