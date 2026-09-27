/* ──────────────────────────────────────────────────────────────────────────
   TAQA Knowledge Hub, counting layer
   ──────────────────────────────────────────────────────────────────────────
   Every figure shown anywhere in the hub is produced here and nowhere else.

   Before this file existed each page counted for itself: the home page
   counted controlled documents, a segment page counted everything that was
   not withdrawn, the master list counted what your role could see, and
   documents.html counted a hardcoded array of its own. Five answers to one
   question, all of them defensible on their own and none of them agreeing.
   An upload, meanwhile, was assembled into a record and assigned to a global
   variable, so no figure on the site could ever move.

   Two rules keep that from coming back:
     1. A page never filters TAQA_MASTER_DOCS itself. It asks for a count.
     2. Anything that changes the register goes through add() or setStatus(),
        which persist and then tell every open page to repaint.

   ── The four populations ────────────────────────────────────────────────
   These are the only counts there are. Each headline states which one it is.

     register  every record, drafts and withdrawn included. The size of the
               filing system. Grows the moment an upload is submitted.
     controlled  the register minus assets (software and the like), which
               TQ-QHSE-S001 does not place under document control.
     live      controlled and status current or under-review. Documents in
               force, which is what a segment library should offer.
     visible   live, narrowed to what the signed-in role may see.

   An upload lands as a draft, per TQ-QHSE-S001 4.4: it counts in register
   and in pending from the instant it is submitted, and joins live only when
   QMS approves it. So the number a person sees move on submit is the honest
   one, and approval moves the rest.
   ────────────────────────────────────────────────────────────────────── */
(function (root) {
  'use strict';

  var KEY  = 'taqa-uploads-v1';
  var OKEY = 'taqa-status-v1';
  var EVT  = 'taqa:register-changed';

  function base() { return (typeof TAQA_MASTER_DOCS !== 'undefined') ? TAQA_MASTER_DOCS : []; }
  function types() {
    return (typeof TAQA_DOC_LOOKUPS !== 'undefined' && TAQA_DOC_LOOKUPS.types) || {};
  }
  function segs() {
    return (typeof TAQA_DOC_LOOKUPS !== 'undefined' && TAQA_DOC_LOOKUPS.segments) || {};
  }

  /* ── Locally submitted records ───────────────────────────────────────
     Kept in localStorage so the prototype behaves like the real thing
     across pages and reloads. In Azure this list is the rows the back end
     has accepted but not yet published, and load() becomes a fetch.      */
  var _added = null;
  function load() {
    if (_added) return _added;
    try {
      var raw = localStorage.getItem(KEY);
      _added = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(_added)) _added = [];
    } catch (e) { _added = []; }
    return _added;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(_added || [])); } catch (e) {}
  }
  /* Status changes against records that shipped in the file. The register
     itself is read-only here, so an approval is kept as an overlay and applied
     on read. In Azure this is a PATCH and the overlay disappears. Without it a
     draft that shipped with the file could be approved on screen and quietly
     spring back on the next page load. */
  var _over = null;
  function overrides() {
    if (_over) return _over;
    try {
      var raw = localStorage.getItem(OKEY);
      _over = raw ? JSON.parse(raw) : {};
      if (!_over || typeof _over !== 'object') _over = {};
    } catch (e) { _over = {}; }
    return _over;
  }
  function saveOverrides() {
    try { localStorage.setItem(OKEY, JSON.stringify(overrides())); } catch (e) {}
  }

  function announce(detail) {
    try { root.dispatchEvent(new CustomEvent(EVT, { detail: detail || {} })); } catch (e) {}
  }

  /* One array, register first, locally added after, with any approval overlay
     applied. Built fresh each call so a caller can never hold a stale copy. */
  function all() {
    var o = overrides();
    var shipped = base().map(function (d) {
      var ov = o[d.docNumber];
      if (!ov) return d;
      var c = {};
      for (var k in d) if (Object.prototype.hasOwnProperty.call(d, k)) c[k] = d[k];
      for (var j in ov) if (Object.prototype.hasOwnProperty.call(ov, j)) c[j] = ov[j];
      return c;
    });
    return shipped.concat(load());
  }

  /* ── Population tests ────────────────────────────────────────────── */
  function isControlled(d) {
    var t = types()[d.docType] || {};
    return t.controlled !== false;
  }
  function isLive(d) {
    return isControlled(d) && (d.status === 'current' || d.status === 'under-review');
  }
  function isPending(d) { return d.status === 'draft'; }
  /* A draft that shipped in the file carries no stage, so treat it as waiting
     on its approver. Otherwise fifteen real drafts would sit in no queue at
     all and look like nobody had to do anything about them. */
  function stageOf(d) {
    if (d.status !== 'draft') return null;
    return d.approvalStage || 'director';
  }
  function awaitingDirector(d) { return stageOf(d) === 'director'; }
  function awaitingQms(d)      { return stageOf(d) === 'qms'; }
  function isVisible(d, role) {
    if (typeof TAQA_ROLE === 'undefined') return isLive(d);
    return isLive(d) && TAQA_ROLE.canSee(d, role || TAQA_ROLE.current());
  }

  var POP = {
    register:   function () { return true; },
    controlled: isControlled,
    live:       isLive,
    pending:    isPending,
    'awaiting-director': awaitingDirector,
    'awaiting-qms':      awaitingQms,
    visible:    isVisible
  };

  /* rows(pop, filter) — the one way to get a set of records.
       pop     one of the four populations above, plus 'pending'
       filter  optional {segment, docType, group}                        */
  function rows(pop, filter) {
    var test = POP[pop || 'live'] || POP.live;
    var f = filter || {};
    var S = segs();
    return all().filter(function (d) {
      if (!test(d)) return false;
      if (f.segment && d.segment !== f.segment) return false;
      if (f.docType && d.docType !== f.docType) return false;
      if (f.group && (S[d.segment] || {}).group !== f.group) return false;
      return true;
    });
  }
  function count(pop, filter) { return rows(pop, filter).length; }

  /* ── Per area ────────────────────────────────────────────────────────
     One call returns everything a segment page needs, so the page never
     counts anything itself.                                             */
  function area(id) {
    var live = rows('live', { segment: id });
    var byType = {};
    live.forEach(function (d) { byType[d.docType] = (byType[d.docType] || 0) + 1; });
    var assets = all().filter(function (d) {
      return d.segment === id && !isControlled(d) && d.status !== 'obsolete';
    });
    var info = segs()[id] || {};
    return {
      id: id,
      name: info.name || id,
      group: info.group || null,
      live: live.length,
      byType: byType,
      assets: assets.length,
      pending: rows('pending', { segment: id }).length,
      overdue: live.filter(function (d) { return !!d.reviewOverdue; }).length,
      docs: live
    };
  }

  /* areasIn('segment') — every area in a family, with its counts. Families
     come from the register's group field, never from a list typed by hand. */
  function areasIn(group) {
    var S = segs();
    return Object.keys(S)
      .filter(function (k) { return S[k].group === group; })
      .map(area);
  }

  /* ── Writing ─────────────────────────────────────────────────────────
     add() is what an upload calls. The record is stored exactly in register
     shape, so nothing downstream can tell a submitted document from one that
     shipped with the file.                                                */
  function add(rec) {
    if (!rec || !rec.title) return null;
    var row = {};
    for (var k in rec) if (Object.prototype.hasOwnProperty.call(rec, k)) row[k] = rec[k];
    row.status = row.status || 'draft';
    // Enters the first of the two release steps: the named approver for its
    // type has to sign before QMS ever sees it.
    if (row.status === 'draft' && !row.approvalStage) row.approvalStage = 'director';
    row.submittedAt = row.submittedAt || new Date().toISOString();
    row.locallyAdded = true;
    load().push(row);
    save();
    announce({ action: 'add', doc: row });
    return row;
  }

  /* setStatus() is what QMS approval and withdrawal call. It can only move a
     locally added record: the shipped register is read-only in the prototype,
     because in Azure that transition is the back end's to make.           */
  function setStatus(docNumber, status) {
    if (!docNumber) return null;
    var today = new Date().toISOString().slice(0, 10);
    var hit = null;
    load().forEach(function (d) { if (d.docNumber === docNumber) hit = d; });
    if (hit) {
      hit.status = status;
      if (status === 'current' && !hit.approvedDate) hit.approvedDate = today;
      save();
    } else {
      var shipped = null;
      base().forEach(function (d) { if (d.docNumber === docNumber) shipped = d; });
      if (!shipped) return null;
      var o = overrides();
      o[docNumber] = o[docNumber] || {};
      o[docNumber].status = status;
      if (status === 'current' && !shipped.approvedDate) o[docNumber].approvedDate = today;
      saveOverrides();
      hit = shipped;
    }
    announce({ action: 'status', docNumber: docNumber, status: status });
    return hit;
  }

  /* ── The two release steps ───────────────────────────────────────────
     Kept here rather than in a page, so the dashboard cannot release a
     document by a route the rules never saw. Each refuses unless the caller's
     effective role may take that step on that document right now.          */
  function findDoc(docNumber) {
    var hit = null;
    all().forEach(function (d) { if (d.docNumber === docNumber) hit = d; });
    return hit;
  }

  function approve(docNumber, signer) {
    var d = findDoc(docNumber);
    if (!d) return { ok: false, error: 'No such document.' };
    if (typeof TAQA_APPROVAL === 'undefined') return { ok: false, error: 'Rules not loaded.' };
    if (!TAQA_APPROVAL.canApprove(d)) return { ok: false, error: 'You cannot approve this document.' };
    patch(docNumber, {
      approvalStage: 'qms',
      approvedBy: signer || actingName(),
      approvedDate: new Date().toISOString().slice(0, 10)
    });
    return { ok: true, next: 'QMS countersignature' };
  }

  function countersign(docNumber, signer) {
    var d = findDoc(docNumber);
    if (!d) return { ok: false, error: 'No such document.' };
    if (typeof TAQA_APPROVAL === 'undefined') return { ok: false, error: 'Rules not loaded.' };
    if (!TAQA_APPROVAL.canCountersign(d)) return { ok: false, error: 'You cannot countersign this document.' };
    patch(docNumber, {
      approvalStage: null, status: 'current',
      countersignedBy: signer || actingName(),
      issueDate: d.issueDate || new Date().toISOString().slice(0, 10)
    });
    return { ok: true, next: 'released' };
  }

  /* The name that goes on the signature. A delegate signs in their own name,
     noting who they acted for, because an audit trail that records the absent
     Director as signer is worse than no trail at all. */
  function actingName() {
    if (typeof TAQA_DELEGATION === 'undefined') return 'Unknown';
    var d = TAQA_DELEGATION.current();
    if (d) return d.to + ' (delegate for ' + d.fromName + ')';
    var r = (typeof TAQA_ROLE !== 'undefined') ? TAQA_ROLE.def() : null;
    return (r && r.label) || 'Unknown';
  }

  /* Field-level write, used by both steps. Locally added rows are edited in
     place; shipped rows get an overlay entry, same as setStatus. */
  function patch(docNumber, fields) {
    var local = null;
    load().forEach(function (d) { if (d.docNumber === docNumber) local = d; });
    if (local) {
      for (var k in fields) if (Object.prototype.hasOwnProperty.call(fields, k)) local[k] = fields[k];
      save();
    } else {
      var o = overrides();
      o[docNumber] = o[docNumber] || {};
      for (var j in fields) if (Object.prototype.hasOwnProperty.call(fields, j)) o[docNumber][j] = fields[j];
      saveOverrides();
    }
    announce({ action: 'patch', docNumber: docNumber, fields: fields });
  }

  function remove(docNumber) {
    _added = load().filter(function (d) { return d.docNumber !== docNumber; });
    save();
    announce({ action: 'remove', docNumber: docNumber });
  }

  function reset() {
    _added = []; save();
    _over = {}; saveOverrides();
    announce({ action: 'reset' });
  }

  /* ── Repainting ──────────────────────────────────────────────────────
     onChange(fn) runs fn now and again whenever the register changes, here
     or in another tab. A page registers its painter once and stops caring
     about when numbers move.                                             */
  function onChange(fn) {
    if (typeof fn !== 'function') return;
    try { fn({ action: 'init' }); } catch (e) { }
    root.addEventListener(EVT, function (e) { try { fn(e.detail || {}); } catch (err) {} });
    root.addEventListener('storage', function (e) {
      if (e.key !== KEY && e.key !== OKEY) return;
      _added = null; _over = null;         // another tab wrote, re-read
      try { fn({ action: 'external' }); } catch (err) {}
    });
  }

  root.TAQA_STORE = {
    all: all, rows: rows, count: count, area: area, areasIn: areasIn,
    add: add, setStatus: setStatus, remove: remove, reset: reset,
    approve: approve, countersign: countersign, patch: patch,
    stageOf: stageOf, findDoc: findDoc, actingName: actingName,
    onChange: onChange, added: load,
    isControlled: isControlled, isLive: isLive,
    EVENT: EVT, KEY: KEY
  };
})(typeof window !== 'undefined' ? window : this);
