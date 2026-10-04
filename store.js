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

  /* Every write, and every check a write depends on, starts from what is in
     storage now rather than what this tab read earlier. save() writes the whole
     list back, so a tab left open on a stale copy used to overwrite another
     tab's changes: QMS confirming one document in one tab and another in a
     second tab erased the first confirmation. */
  function fresh() { _added = null; _over = null; }
  // Another tab wrote: drop the cached copy whether or not this page asked
  // to be told (onChange() still repaints the pages that did).
  try {
    root.addEventListener('storage', function (e) {
      if (e.key === KEY || e.key === OKEY || e.key === null) fresh();
    });
  } catch (e) {}

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
  /* A draft that shipped in the file carries no stage, so treat it as
     waiting on QMS: that is the first step now, before the Director's
     approval releases it. Otherwise fifteen real drafts would sit in no
     queue at all and look like nobody had to do anything about them. */
  function stageOf(d) {
    if (d.status !== 'draft' || d.rejected) return null;
    return d.approvalStage || 'qms';
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

  /* ── One number, one document ──────────────────────────────────────
     A document number names one document family, once and for good
     (PI-01). Upload only warned about a number in use, add() checked
     nothing, and findDoc() returned whichever match came last, so a second
     record could take a live procedure's number and from then on links, QR
     codes, withdrawals and confirmations by that number landed on the wrong
     record. A number is now in use if any record in the register carries it
     as its number or legacy ID, whatever its area or status: a withdrawn or
     superseded number is retired, never handed out again. A new revision of
     the same document is the only thing that will ever share it (PR 2A-2). */
  function normNum(n) { return String(n == null ? '' : n).trim().toUpperCase(); }
  function numberInUse(n) {
    var k = normNum(n), hit = null;
    if (!k) return null;
    fresh();                       // what storage holds now, not this tab's copy
    all().forEach(function (d) {
      if (!hit && (normNum(d.docNumber) === k || (d.legacyId && normNum(d.legacyId) === k))) hit = d;
    });
    return hit;
  }
  var STATUS_WORD = { current: 'in force', 'under-review': 'in force, under review', draft: 'a draft',
                      superseded: 'superseded', obsolete: 'withdrawn', asset: 'a software record' };

  /* Why a filing would be refused, in words a filer can act on, or null.
     add() refuses exactly these; Upload asks first so it can say why. */
  /* A filing that names a document it supersedes is a new revision of that
     document: it keeps the document's number (BUSINESS-RULES §16, PR 2A-2).
     Returns null for an ordinary filing, {problem} when the revision may not
     be filed, or {parent} when it may. */
  function revisionRequest(rec) {
    if (!rec || !rec.supersedes) return null;
    var used = numberInUse(rec.docNumber);
    if (!used) return { problem: 'A revision keeps the number of the document it replaces. Choose that document.' };
    var num = used.docNumber, parent = revisionParent(num);
    if (!parent) return { problem: num + ' has no revision in force to revise. A withdrawn or superseded document is not revised; file a new document instead.' };
    var open = openDraft(num);
    if (open) return { problem: 'A revision of ' + num + ' is already in progress (Rev ' + revOf(open) +
      '). Only one revision of a document may be open at a time.' };
    if (rec.docType && rec.docType !== parent.docType)
      return { problem: 'A revision keeps its document\'s type. ' + num + ' is a ' + ((types()[parent.docType] || {}).label || parent.docType) + '.' };
    if (rec.segment && rec.segment !== parent.segment)
      return { problem: 'A revision keeps its document\'s area. ' + num + ' belongs to ' + ((segs()[parent.segment] || {}).name || parent.segment) + '.' };
    if (rec.department !== undefined && (rec.department || null) !== (parent.department || null))
      return { problem: 'A revision keeps its document\'s department.' };
    return { parent: parent };
  }

  function filingProblem(rec) {
    if (!rec || !rec.title) return 'A title is needed.';
    var revision = revisionRequest(rec);
    if (revision && revision.problem) return revision.problem;
    // A revision is checked as what it will be: its parent's type, area and
    // department, so no rule below can be stepped round by leaving them out.
    if (revision) rec = Object.assign({}, rec, { docType: revision.parent.docType,
      segment: revision.parent.segment, department: revision.parent.department || null });
    // The same rule upload.html refuses at the door, checked again where the
    // record is written, so no page can file on a role's behalf that it lacks.
    if (typeof TAQA_ROLE !== 'undefined' && TAQA_ROLE.effective && !TAQA_ROLE.effective().submit)
      return 'Your role cannot file documents.';
    // Software and tools have no numbering, owner or approver defined yet,
    // so they are not filed at all until the business defines them (PI-33).
    if (rec.docType === 'software' || (types()[rec.docType] || {}).controlled === false)
      return 'Software and tools cannot be filed yet: their numbering, owner and approver are still to be defined.';
    // A Maintenance Bulletin belongs to an operational segment's maintenance
    // team. Anywhere else nobody may approve it, so it is not filed at all.
    if (rec.docType === 'bulletin' && (segs()[rec.segment] || {}).group !== 'segment')
      return 'A Maintenance Bulletin is filed only for an operational segment.';
    // The same for a maintenance department document: only an operational
    // segment has a maintenance department, so anywhere else it has no
    // approver either (BUSINESS-RULES §1, §3).
    if (rec.department === 'maintenance' && (segs()[rec.segment] || {}).group !== 'segment')
      return 'Only an operational segment has a maintenance department.';
    // A policy is company policy, signed by the CEO, and only QMS files one.
    // Upload offers the type to nobody else; the register now says the same.
    if (rec.docType === 'policy' && (typeof TAQA_ROLE === 'undefined' || TAQA_ROLE.current() !== 'qms'))
      return 'Only QMS files a policy.';
    // One file is one document (BUSINESS-RULES §7).
    if (Array.isArray(rec.files) && rec.files.length > 1) return 'File one controlled document at a time.';
    if (!normNum(rec.docNumber)) return 'A document number is needed.';
    if (revision) return null;
    var used = numberInUse(rec.docNumber);
    if (used) return String(rec.docNumber).trim() + ' is already the number of "' + used.title + '" (' +
      (STATUS_WORD[used.status] || used.status) + '). A number names one document and is never reused.';
    return null;
  }

  /* ── Writing ─────────────────────────────────────────────────────────
     add() is what an upload calls. The record is stored exactly in register
     shape, so nothing downstream can tell a submitted document from one that
     shipped with the file.                                                */
  function add(rec) {
    if (filingProblem(rec)) return null;
    fresh();
    var revision = revisionRequest(rec);
    var row = {};
    for (var k in rec) if (Object.prototype.hasOwnProperty.call(rec, k) &&
                           FILED_BY_STORE.indexOf(k) === -1) row[k] = rec[k];
    row.docNumber = String(rec.docNumber).trim();
    if (revision && revision.parent) {
      // The register, not the filer, says what a revision is: the same number,
      // the next revision, what it supersedes, and everything that makes it
      // the same document (type, area, department, scope, classification,
      // translation link) carried over from the revision it replaces.
      var p = revision.parent;
      row.docNumber = p.docNumber;
      row.revision = nextRevision(p.revision);
      row.supersedes = 'Rev ' + revOf(p);
      ['docType', 'segment', 'department', 'scope', 'classification', 'language',
       'translationOf', 'numberStatus', 'numberNote', 'legacyId'].forEach(function (f) {
        if (p[f] !== undefined) row[f] = p[f]; else delete row[f];
      });
    } else {
      row.supersedes = null;           // only a revision supersedes anything
    }
    // A filing is a draft at the QMS check, whatever the caller sent. add()
    // used to keep the caller's status, signatures and filer, so a record
    // could be filed straight into force, "approved" by a name of the
    // caller's choosing (PI-09). Every lifecycle field is now the store's.
    row.status = 'draft';
    row.approvalStage = 'qms';
    row.submittedAt = new Date().toISOString();
    // Who filed it goes on the record at the moment of filing, the same way
    // the two signatures do, and from the signed-in identity, not the caller.
    row.submittedBy = actingName();
    row.locallyAdded = true;
    load().push(row);
    save();
    announce({ action: 'add', doc: row });
    return row;
  }

  /* setStatus() is what withdrawal calls. Putting a document in force is the
     Director's step and nobody else's, so 'current' goes through approve(),
     which checks the stage, the role and the area and records who signed.

     Every other move is on an allow-list. It used to write any string for
     whoever managed the area, so a draft could be made 'under-review' (which
     counts as live, unapproved), a withdrawn document brought back, or a
     current one sent back to draft keeping its old approval (PI-09):
       obsolete     withdraw: anything not already withdrawn
       superseded   replaced by a newer revision: only a live document
     Nothing else, and nothing out of 'obsolete'.                          */
  var MOVES = {
    obsolete:   ['draft', 'current', 'under-review', 'superseded'],
    superseded: ['current', 'under-review']
  };
  function setStatus(docNumber, status, rev) {
    if (!docNumber) return null;
    fresh();
    if (status === 'current') {
      var r = approve(docNumber);
      return r.ok ? findDoc(docNumber) : null;
    }
    // Any other move belongs to whoever manages the document: its Director,
    // its Maintenance Manager or QMS. An Employee or an auditor could
    // withdraw a live procedure from the console before this check.
    // Without a revision named, it is the revision in force that moves.
    var cur = target(docNumber, rev);
    if (!cur || !mayManage(cur)) return null;
    if (!Object.prototype.hasOwnProperty.call(MOVES, status) || MOVES[status].indexOf(cur.status) === -1) return null;
    var wasLive = isLiveStatus(cur.status);
    var f = { status: status };
    if (status === 'obsolete') f.approvalStage = null;     // a withdrawn draft leaves both queues
    write(cur, f);
    // Withdrawing or superseding the revision in force takes its
    // translations with it (PI-34).
    if (wasLive) cascadeToTranslations(cur.docNumber, status,
      'Source ' + cur.docNumber + ' superseded: translation to be re-issued');
    announce({ action: 'status', docNumber: docNumber, status: status });
    return findRev(cur.docNumber, cur.revision) || cur;
  }

  /* ── The two release steps ───────────────────────────────────────────
     Kept here rather than in a page, so the dashboard cannot release a
     document by a route the rules never saw. Each refuses unless the caller's
     effective role may take that step on that document right now.          */
  /* The record a number refers to, chosen by rule rather than by whichever
     match came last (PI-01): the revision in force first, then an open
     draft, then a returned draft, then a superseded one, then a withdrawn
     one. Every read and every write by number goes through here, so what a
     page shows and what an action changes are always the same record. */
  var RANK = { current: 0, 'under-review': 0, draft: 1, superseded: 3, obsolete: 4 };
  function rankOf(d) {
    if (d.status === 'draft' && d.rejected) return 2;
    return Object.prototype.hasOwnProperty.call(RANK, d.status) ? RANK[d.status] : 5;
  }
  function findDoc(docNumber) {
    var best = null, bestRank = 99;
    all().forEach(function (d) {
      if (d.docNumber !== docNumber) return;
      var r = rankOf(d);
      if (r < bestRank) { best = d; bestRank = r; }
    });
    return best;
  }
  /* Writes go to that same record: the locally filed row itself, or an
     overlay on the shipped one. */
  /* ── Revisions of one document ─────────────────────────────────────
     One number covers every revision of a document (TQ-MECH-001 Rev 1.0,
     Rev 2.0); the revision says which approved version a record is. At most
     one revision is in force and at most one is open at a time. Workflow
     steps act on the open draft, withdrawal and editing on the revision in
     force, and anything may name an exact revision (PR 2A-2, PI-02). */
  function revOf(d) { return String(d && d.revision != null ? d.revision : '').trim(); }
  function sameRev(a, b) {
    return String(a == null ? '' : a).trim().toLowerCase() === String(b == null ? '' : b).trim().toLowerCase();
  }
  function isLiveStatus(st) { return st === 'current' || st === 'under-review'; }
  function revisionsOf(docNumber) { return all().filter(function (d) { return d.docNumber === docNumber; }); }
  function findRev(docNumber, rev) {
    var best = null, bestRank = 99;
    all().forEach(function (d) {
      if (d.docNumber !== docNumber || !sameRev(d.revision, rev)) return;
      var r = rankOf(d);
      if (r < bestRank) { best = d; bestRank = r; }
    });
    return best;
  }
  function openDraft(docNumber) {
    var hit = null;
    all().forEach(function (d) { if (!hit && d.docNumber === docNumber && d.status === 'draft' && !d.rejected) hit = d; });
    return hit;
  }
  // What a check, an approval or a rejection by number acts on.
  function workTarget(docNumber) { return openDraft(docNumber) || findDoc(docNumber); }
  /* The next major revision, in the register's own style: 1.0 → 2.0,
     v2.3 → v3.0. Anything unreadable starts again from 2.0. */
  function nextRevision(rev) {
    var m = String(rev == null ? '' : rev).trim().match(/^(v?)(\d+)(?:\.\d+)?$/i);
    return m ? m[1] + (parseInt(m[2], 10) + 1) + '.0' : '2.0';
  }
  // A translation superseded because its source was revised, waiting to be
  // re-issued as its own next revision.
  function awaitingReissue(d) {
    return !!(d && d.status === 'superseded' && d.translationOf && /^Source /.test(d.supersededBy || ''));
  }
  /* The revision a new revision would replace: the one in force, or a
     translation waiting to be re-issued. A withdrawn document, or one only
     superseded, has none: it is not revised. */
  function revisionParent(docNumber) {
    var fam = revisionsOf(docNumber);
    return fam.filter(function (d) { return isLiveStatus(d.status); })[0] ||
           fam.filter(awaitingReissue)[0] || null;
  }

  /* Writes one exact record: the row filed here, or an overlay on the
     shipped row (one shipped row per number). Every public writer resolves
     its target once, from one read of storage, and writes to it here. */
  function write(d, fields) {
    if (!d) return;
    var k;
    if (load().indexOf(d) !== -1) {
      for (k in fields) if (Object.prototype.hasOwnProperty.call(fields, k)) d[k] = fields[k];
      save();
    } else {
      var o = overrides();
      o[d.docNumber] = o[d.docNumber] || {};
      for (k in fields) if (Object.prototype.hasOwnProperty.call(fields, k)) o[d.docNumber][k] = fields[k];
      saveOverrides();
    }
  }
  function target(docNumber, rev) { return rev !== undefined ? findRev(docNumber, rev) : findDoc(docNumber); }

  /* A translation follows its source: when the revision in force is
     superseded or withdrawn, so are the source's translations in force. */
  function cascadeToTranslations(sourceNumber, status, note) {
    all().filter(function (t) { return t.translationOf === sourceNumber && isLiveStatus(t.status); })
      .forEach(function (t) {
        var f = { status: status };
        if (status === 'superseded') f.supersededBy = note;
        write(t, f);
      });
  }

  /* Neither step takes a signer: the name on a signature is always the
     signed-in identity (actingName), never one the caller chooses (PI-09).

     The Director's step now comes second and is what releases a document.
     QMS goes first: it confirms the record is fit to carry the Director's
     name before it goes live, not a co-signature after the Director has
     already acted. See TAQA_APPROVAL's "Two-step release" comment in
     roles.js for why the order is this way round. */
  /* Check, approval and rejection act on the number's open revision (the
     one waiting in the queue), never on the revision in force. */
  function approve(docNumber) {
    fresh();
    var d = workTarget(docNumber);
    if (!d) return { ok: false, error: 'No such document.' };
    if (typeof TAQA_APPROVAL === 'undefined') return { ok: false, error: 'Rules not loaded.' };
    if (!TAQA_APPROVAL.canApprove(d)) return { ok: false, error: 'You cannot approve this document.' };
    var now = new Date().toISOString(), today = now.slice(0, 10);
    // Releasing a revision supersedes the one it replaces in the same step,
    // so there is never a moment with two revisions in force (PI-02). The
    // superseded revision keeps every field it had: its approval history is
    // never rewritten. Its translations in force are superseded with it,
    // marked to be re-issued against the new revision (PI-34).
    var replaced = revisionsOf(d.docNumber).filter(function (x) { return x !== d && isLiveStatus(x.status); });
    write(d, {
      approvalStage: null, status: 'current',
      approvedBy: actingName(),
      approvedDate: today,
      approvedAt: now,
      issueDate: d.issueDate || today
    });
    replaced.forEach(function (x) { write(x, { status: 'superseded', supersededBy: 'Rev ' + revOf(d) }); });
    if (replaced.length) cascadeToTranslations(d.docNumber, 'superseded',
      'Source ' + d.docNumber + ' Rev ' + revOf(d) + ': translation to be re-issued');
    announce({ action: 'patch', docNumber: d.docNumber, fields: { status: 'current' } });
    return { ok: true, next: 'released' };
  }

  function countersign(docNumber) {
    fresh();
    var d = workTarget(docNumber);
    if (!d) return { ok: false, error: 'No such document.' };
    if (typeof TAQA_APPROVAL === 'undefined') return { ok: false, error: 'Rules not loaded.' };
    if (!TAQA_APPROVAL.canCountersign(d)) return { ok: false, error: 'You cannot countersign this document.' };
    write(d, {
      approvalStage: 'director',
      countersignedBy: actingName(),
      countersignedDate: new Date().toISOString().slice(0, 10),
      countersignedAt: new Date().toISOString()
    });
    announce({ action: 'patch', docNumber: d.docNumber, fields: { approvalStage: 'director' } });
    // A maintenance department document goes to its Maintenance Manager.
    return { ok: true, next: (d.department === 'maintenance' || d.docType === 'bulletin')
      ? "the Maintenance Manager's final approval" : "the Director's final approval" };
  }

  /* Sends a draft back rather than releasing it, at whichever step refused
     it. A reason is required: a submitter who only sees "Rejected" has
     nothing to act on, and neither does anyone reading this later to see
     why a document never made it into the register. */
  function reject(docNumber, reason) {
    fresh();
    var d = workTarget(docNumber);
    if (!d) return { ok: false, error: 'No such document.' };
    if (typeof TAQA_APPROVAL === 'undefined') return { ok: false, error: 'Rules not loaded.' };
    if (!reason || !String(reason).trim()) return { ok: false, error: 'A reason is required.' };
    // The same floor every page asks for. The store took one character, so a
    // console call could return a document with "x" as its reason (PI-09).
    if (String(reason).trim().length < REASON_MIN)
      return { ok: false, error: 'Give a reason of at least ' + REASON_MIN + ' characters.' };
    var stage = TAQA_APPROVAL.stageOf(d);
    var may = stage === 'qms' ? TAQA_APPROVAL.canCountersign(d)
            : stage === 'director' ? TAQA_APPROVAL.canApprove(d)
            : false;
    if (!may) return { ok: false, error: 'You cannot reject this document.' };
    write(d, {
      approvalStage: null,
      rejected: true,
      rejectedAtStage: stage,
      rejectedBy: actingName(),
      rejectedReason: String(reason).trim(),
      rejectedDate: new Date().toISOString().slice(0, 10),
      rejectedAt: new Date().toISOString()
    });
    announce({ action: 'patch', docNumber: d.docNumber, fields: { rejected: true } });
    return { ok: true, next: 'returned to submitter' };
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

  function mayManage(doc) {
    if (typeof TAQA_ROLE === 'undefined' || !TAQA_ROLE.canManage) return false;
    // The whole record: canManage checks its department as well as its area.
    return TAQA_ROLE.canManage(doc);
  }

  /* Fields only the release steps may write. A page editing a record's
     details (title, summary, review date) never touches these, so nobody can
     sign a document, or clear a rejection, by editing it. */
  /* The shortest reason a document can be returned with, the same as every
     page that asks for one (BUSINESS-RULES §7). */
  var REASON_MIN = 20;

  var LIFECYCLE = ['status', 'approvalStage', 'approvedBy', 'approvedDate', 'approvedAt',
    'countersignedBy', 'countersignedDate', 'countersignedAt', 'rejected', 'rejectedAtStage',
    'rejectedBy', 'rejectedReason', 'rejectedDate', 'rejectedAt', 'submittedBy', 'submittedAt'];

  /* Never taken from a caller of add(): the store writes each of these. */
  var FILED_BY_STORE = LIFECYCLE.concat(['locallyAdded', 'supersededBy']);

  /* What "edit details" may change: descriptive and review fields only.
     Everything else is identity or authority (number, area, department,
     type, revision, files, what it supersedes, classification) and changes
     only by filing a new controlled revision. It used to be a block-list of
     the lifecycle fields, so a manager could renumber an approved document,
     move it to another area or department, or swap its file (PI-09). */
  var EDITABLE = ['title', 'summary', 'keywords', 'audience', 'related', 'changeNote',
    'nextReviewDate', 'reviewOverdue', 'language'];

  /* The patch other pages can call: the area's manager editing details only. */
  function editFields(docNumber, fields, rev) {
    fresh();
    var d = target(docNumber, rev);
    if (!d || !fields) return { ok: false, error: 'No such document.' };
    if (!mayManage(d)) return { ok: false, error: 'You cannot edit this document.' };
    for (var k in fields) {
      if (!Object.prototype.hasOwnProperty.call(fields, k)) continue;
      if (LIFECYCLE.indexOf(k) !== -1)
        return { ok: false, error: k + ' changes only through approval, countersignature or withdrawal.' };
      if (EDITABLE.indexOf(k) === -1)
        return { ok: false, error: k + ' cannot be edited. File a new revision instead.' };
    }
    write(d, fields);
    announce({ action: 'patch', docNumber: d.docNumber, fields: fields });
    return { ok: true };
  }

  function remove(docNumber) {
    fresh();
    var d = findDoc(docNumber);
    if (!d || !mayManage(d)) return false;
    // Only the record the number resolves to, and only one filed here.
    if (load().indexOf(d) === -1) return false;
    _added = load().filter(function (x) { return x !== d; });
    save();
    announce({ action: 'remove', docNumber: docNumber });
    return true;
  }

  /* There is no reset(). It wiped every filing and signature in this
     browser and was exported, so any page or console could erase the
     register's history (PI-09). A clean slate is a storage clear. */

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
    add: add, checkFiling: filingProblem, numberInUse: numberInUse,
    findRev: findRev, openDraft: openDraft, revisionsOf: revisionsOf,
    revisionParent: revisionParent, nextRevision: nextRevision,
    setStatus: setStatus, remove: remove,
    approve: approve, countersign: countersign, reject: reject, patch: editFields,
    stageOf: stageOf, findDoc: findDoc, actingName: actingName,
    onChange: onChange, added: load,
    isControlled: isControlled, isLive: isLive,
    EVENT: EVT, KEY: KEY
  };
})(typeof window !== 'undefined' ? window : this);
