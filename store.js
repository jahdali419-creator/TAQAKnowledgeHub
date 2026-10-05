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
  var OKEY = 'taqa-status-v2';
  var OKEY_V1 = 'taqa-status-v1';     // read once, to migrate; never written
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
    // Rows filed before records had their own id (PR 2B) get one now, worked
    // out from the row itself so every tab arrives at the same id: number,
    // revision and, where the same revision was filed more than once, which
    // filing it was. That order is also the attempt.
    var seen = {};
    _added.forEach(function (d) {
      if (!d || typeof d !== 'object') return;
      var k = (d.docNumber || '') + '@' + revOf(d).toLowerCase();
      seen[k] = (seen[k] || 0) + 1;
      if (!d.recordId) d.recordId = 'L-' + k + (seen[k] > 1 ? '#' + seen[k] : '');
      if (!d.attempt) d.attempt = seen[k];
    });
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
  /* An overlay belongs to one revision of a document, never to its number
     alone (PI-25). It used to be keyed by number, so an approval given to
     Rev 1.0 in this browser was applied to whatever the register later
     shipped under that number: a Rev 2.0 draft read "Current", signed by
     Rev 1.0's approvers. Overlays are now keyed "number@revision" and apply
     only to the shipped row of exactly that revision.

     Version 1 overlays (keyed by number) are migrated once, each stamped with
     the revision of the shipped row it was being applied to when this
     version first ran, which is the revision it was given for. Nothing is
     deleted: the version 1 key is left as it was and simply no longer read. */
  function ovKey(d) { return d.docNumber + '@' + String(d.revision == null ? '' : d.revision).trim(); }
  var _over = null;
  function overrides() {
    if (_over) return _over;
    try {
      var raw = localStorage.getItem(OKEY);
      if (raw === null) {
        _over = migrateV1();
      } else {
        _over = JSON.parse(raw);
        if (!_over || typeof _over !== 'object') _over = {};
      }
    } catch (e) { _over = {}; }
    return _over;
  }
  function migrateV1() {
    var out = {}, old = null;
    try { old = JSON.parse(localStorage.getItem(OKEY_V1) || 'null'); } catch (e) { old = null; }
    if (old && typeof old === 'object') {
      var byNum = {};
      base().forEach(function (d) { if (d.docNumber) byNum[d.docNumber] = d; });
      Object.keys(old).forEach(function (num) {
        if (byNum[num] && old[num] && typeof old[num] === 'object') out[ovKey(byNum[num])] = old[num];
      });
    }
    try { localStorage.setItem(OKEY, JSON.stringify(out)); } catch (e) {}
    return out;
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

  // Back from the back-forward cache (shared.js, PI-18): this page slept
  // through any change, so re-read and let its painters catch up.
  try {
    root.addEventListener('taqa:resume', function () { fresh(); announce({ action: 'external' }); });
  } catch (e) {}

  /* ── No false success (PI-28) ─────────────────────────────────────────
     A change that production must send to the server is refused while the
     page knows it cannot reach it: offline, or the server did not answer
     (TAQA_NET, shared.js). Nothing is written locally, so no record looks
     submitted, checked, approved, returned, withdrawn or edited when it was
     not; the page keeps what was entered and says why. PRODUCTION: success
     only after the Microsoft 365 / server response. */
  var lastWriteError = null;
  function notSent() {
    var n = root.TAQA_NET;
    if (n && n.canWrite && !n.canWrite()) return n.why();
    if (!n && typeof navigator !== 'undefined' && navigator.onLine === false)
      return 'Not sent: you are offline. Nothing was saved to the register. Try again when you are connected.';
    return null;
  }

  function announce(detail) {
    try { root.dispatchEvent(new CustomEvent(EVT, { detail: detail || {} })); } catch (e) {}
  }

  /* One array, register first, locally added after, with any approval overlay
     applied. Built fresh each call so a caller can never hold a stale copy. */
  function assemble() {
    var o = overrides();
    var shipped = base().map(function (d) {
      var ov = d.docNumber ? o[ovKey(d)] : null;
      if (!ov) return d;
      var c = {};
      for (var k in d) if (Object.prototype.hasOwnProperty.call(d, k)) c[k] = d[k];
      for (var j in ov) if (Object.prototype.hasOwnProperty.call(ov, j)) c[j] = ov[j];
      return c;
    });
    return shipped.concat(load());
  }
  function all() {
    var rowsNow = assemble();
    // A revision approved for a later date takes effect on that date, before
    // anything is read, so no page ever sees it waiting past its date or two
    // revisions in force (PI-21).
    if (!_promoting && rowsNow.some(dueToTakeEffect)) { promoteDue(); rowsNow = assemble(); }
    return rowsNow;
  }

  /* ── Taking effect (PI-21, owner's decision of 5 Oct 2026) ────────────
     Final approval with an effective date later than today leaves the
     revision "approved": approved, not yet in force, while the revision it
     replaces stays current. On its effective date it becomes current and the
     one it replaces superseded, once: the step checks the status before it
     writes, so a second tab finds it done. Its approval date and its
     effective (issue) date are never changed by this. In this prototype the
     step runs when the register is first read on or after the date, in this
     browser; in production a scheduled server flow does it. */
  var _promoting = false;
  function dueToTakeEffect(d) {
    return d.status === 'approved' && !!d.issueDate && d.issueDate <= localDay();
  }
  function promoteDue() {
    _promoting = true;
    try {
      _added = null; _over = null;
      assemble().filter(dueToTakeEffect).forEach(function (d) { takeEffect(d, new Date().toISOString()); });
    } finally { _promoting = false; }
  }
  function takeEffect(d, now) {
    var replaced = revisionsOf(d.docNumber).filter(function (x) { return recordKey(x) !== recordKey(d) && isLiveStatus(x.status); });
    write(d, { status: 'current', tookEffectAt: now });
    replaced.forEach(function (x) {
      write(x, { status: 'superseded', supersededBy: 'Rev ' + revOf(d), supersededAt: now, supersededDate: d.issueDate });
    });
    if (replaced.length) cascadeToTranslations(d.docNumber, 'superseded',
      'Source ' + d.docNumber + ' Rev ' + revOf(d) + ': translation to be re-issued');
    announce({ action: 'patch', docNumber: d.docNumber, fields: { status: 'current' } });
  }

  /* ── Population tests ────────────────────────────────────────────── */
  function isControlled(d) {
    var t = types()[d.docType] || {};
    return t.controlled !== false;
  }
  function isLive(d) {
    return isControlled(d) && (d.status === 'current' || d.status === 'under-review');
  }
  // Waiting for a decision. A returned filing is history, not pending: it
  // left both queues when it was returned (PI-24).
  function isPending(d) { return d.status === 'draft' && !d.rejected; }
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
                      approved: 'approved, not yet effective',
                      superseded: 'superseded', obsolete: 'withdrawn', asset: 'a software record' };

  /* ── Dates, in the register's own calendar ─────────────────────────────
     A day here is the local calendar day of whoever is acting, the same day
     they see on the screen. In production the server's clock and the site's
     time zone decide (BUSINESS-RULES §19). */
  function localDay(t) {
    var d = t ? new Date(t) : new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function addMonths(day, months) {
    var m = String(day || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1 + (months || 0), +m[3]);
    return localDay(d);
  }
  function reviewCycle(d) { return (types()[d.docType] || {}).reviewCycleMonths || 24; }

  /* ── Numbering for a new filing (PI-14) ───────────────────────────────
     TQ-QHSE-S001 5.3, as Upload builds it: TQ-[business unit-]short form-type
     letter, then the serial. A one-letter code joins the serial directly
     (S001, P007, F023), a longer one with a hyphen (SOP-001, WI-001). A
     policy is TQ-<corporate function>-P###. A provisional area or type code
     is still the number 5.3 gives until QHSE assigns one, so it is valid;
     a placeholder (###), a space, lower case or another area's or type's
     code is not. Only a new filing is checked: a revision keeps its
     document's number, and legacy numbers stay readable as they are. */
  function escRe(t) { return String(t).replace(/[.*+?^${}()|[\]\\&]/g, '\\$&'); }
  function numberFormat(segment, docType, issuingFunction) {
    var T = types()[docType], S = segs();
    if (!T || !T.letter) return null;
    if (docType === 'policy') {
      var fns = Object.keys(S).filter(function (k) { return S[k].group === 'function'; })
        .map(function (k) { return S[k].spl; });
      var fn = issuingFunction && fns.indexOf(issuingFunction) !== -1 ? issuingFunction : null;
      return { re: new RegExp('^TQ-(' + (fn ? escRe(fn) : fns.map(escRe).join('|')) + ')-P\\d{3,}$'),
               example: 'TQ-' + (fn || 'QHSE') + '-P001' };
    }
    var e = S[segment];
    if (!e) return null;
    var letter = T.letter;
    var corporate = !e.bu && (e.group === 'function' || e.group === 'company');
    if (docType === 'manual' && corporate && T.letterCorporate) letter = T.letterCorporate;
    var stem = 'TQ-' + (e.bu ? e.bu + '-' : '') + e.spl + '-' + letter;
    var sep = letter.length > 1 ? '-' : '';
    return { re: new RegExp('^' + escRe(stem + sep) + '\\d{3,}$'), example: stem + sep + '001' };
  }
  // The next free number for an area and type, as Upload generates it: one
  // above the highest serial in use under that stem.
  function nextNumber(segment, docType, issuingFunction) {
    var f = numberFormat(segment, docType, issuingFunction);
    if (!f) return null;
    var stem = f.example.slice(0, -3), max = 0;
    all().forEach(function (d) {
      var n = String(d.docNumber || '');
      if (n.indexOf(stem) !== 0) return;
      var m = n.slice(stem.length).match(/^(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return stem + String(max + 1).padStart(3, '0');
  }
  function numberFormatProblem(rec) {
    var n = String(rec.docNumber == null ? '' : rec.docNumber);
    if (/\s/.test(n)) return 'A document number has no spaces.';
    if (/#/.test(n)) return n + ' is a placeholder, not a number. Use the number Upload assigns.';
    if (n !== n.toUpperCase()) return 'A document number is written in capitals (' + n.toUpperCase() + ').';
    var f = numberFormat(rec.segment, rec.docType, rec.issuingFunction);
    if (!f) return null;
    if (!f.re.test(n)) return n + ' is not a TQ-QHSE-S001 number for this area and type. It should look like ' + f.example + '.';
    return null;
  }

  /* ── Possible duplicates and related documents (PI-13) ───────────────
     Advisory only, with the reason each was flagged: the same file (its
     SHA-256 fingerprint matches one recorded on another record), the same
     title in the same area, or shared significant title words. Nothing here
     blocks a filing; the number is the hard rule (filingProblem). The
     document's own family (its other revisions and attempts) and records
     that are withdrawn, superseded or returned are not flagged. */
  var STOP_WORDS = ['the', 'a', 'an', 'of', 'in', 'for', 'and', 'or', 'to', 'with', 'at', 'by', 'from', 'on',
    'is', 'are', 'its', 'this', 'that', 'was', 'been', 'rev', 'revision', 'version', 'update', 'procedure', 'sop'];
  function titleWords(t) {
    return String(t || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter(function (w) { return w.length > 2 && STOP_WORDS.indexOf(w) === -1; })
      .filter(function (w, i, a) { return a.indexOf(w) === i; });
  }
  function related(q) {
    q = q || {};
    var mine = titleWords(q.title), key = String(q.title || '').trim().toLowerCase(), out = [];
    all().forEach(function (d) {
      if (!d || d.status === 'obsolete' || d.status === 'superseded' || (d.status === 'draft' && d.rejected)) return;
      if (q.docNumber && normNum(d.docNumber) === normNum(q.docNumber)) return;
      var reasons = [], sameFile = false, sameTitle = false, shared = [];
      if (q.sha256) sameFile = (d.files || []).some(function (f) { return f && f.sha256 === q.sha256; });
      if (sameFile) reasons.push('Same file: its fingerprint matches this one');
      if (q.segment && d.segment === q.segment && key) {
        if (String(d.title || '').trim().toLowerCase() === key) { sameTitle = true; reasons.push('Same title in this area'); }
        else if (mine.length) {
          var theirs = titleWords(d.title);
          shared = mine.filter(function (w) { return theirs.indexOf(w) !== -1; });
          if (shared.length >= 2 && shared.length / Math.max(mine.length, theirs.length, 1) >= 0.4)
            reasons.push('Shares the title words: ' + shared.slice(0, 5).join(', '));
        }
      }
      if (reasons.length) out.push({ d: d, reasons: reasons, sameFile: sameFile, sameTitle: sameTitle, shared: shared.length });
    });
    out.sort(function (a, b) { return (b.sameFile - a.sameFile) || (b.sameTitle - a.sameTitle) || (b.shared - a.shared); });
    return out.slice(0, q.limit || 5);
  }

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
    var waiting = pendingEffective(num);
    if (waiting) return { problem: num + ' Rev ' + revOf(waiting) + ' is approved and takes effect on ' + waiting.issueDate +
      '. Only one revision of a document may be open at a time.' };
    if (rec.docType && rec.docType !== parent.docType)
      return { problem: 'A revision keeps its document\'s type. ' + num + ' is a ' + ((types()[parent.docType] || {}).label || parent.docType) + '.' };
    if (rec.segment && rec.segment !== parent.segment)
      return { problem: 'A revision keeps its document\'s area. ' + num + ' belongs to ' + ((segs()[parent.segment] || {}).name || parent.segment) + '.' };
    if (rec.department !== undefined && (rec.department || null) !== (parent.department || null))
      return { problem: 'A revision keeps its document\'s department.' };
    return { parent: parent };
  }

  /* A returned first issue filed again keeps its number and revision: the
     same revision, next attempt (owner's decision for PI-24, 5 Oct 2026). The
     filing names the returned attempt it replaces (resubmitOf, its record
     key); that is the only filing besides a revision that reuses a number.
     A returned revision is filed again through the revision route, which
     gives it the same revision and the next attempt (NEW-03). */
  function resubmission(rec) {
    if (!rec || !rec.resubmitOf) return null;
    var prev = byKey(rec.resubmitOf);
    if (!prev || !prev.rejected || prev.status !== 'draft')
      return { problem: 'Only a returned filing can be filed again.' };
    if (rec.docNumber && normNum(rec.docNumber) !== normNum(prev.docNumber))
      return { problem: 'A filing made again keeps its number, ' + prev.docNumber + '.' };
    if (prev.supersedes) return { revisionOf: prev };
    var fam = revisionsOf(prev.docNumber);
    if (fam.some(function (x) { return !(x.status === 'draft' && x.rejected); }))
      return { problem: prev.docNumber + ' has a filing in progress or in force already, so the returned attempt is not filed again.' };
    return { prev: prev };
  }

  function filingProblem(rec) {
    if (!rec || !rec.title) return 'A title is needed.';
    var again = resubmission(rec);
    if (again && again.problem) return again.problem;
    if (again && again.revisionOf) rec = Object.assign({}, rec, { docNumber: again.revisionOf.docNumber, supersedes: again.revisionOf.docNumber });
    if (again && again.prev) rec = Object.assign({}, rec, { docNumber: again.prev.docNumber, docType: again.prev.docType,
      segment: again.prev.segment, department: again.prev.department || null });
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
    if (revision || (again && again.prev)) return null;
    var used = numberInUse(rec.docNumber);
    if (used) return String(rec.docNumber).trim() + ' is already the number of "' + used.title + '" (' +
      (STATUS_WORD[used.status] || used.status) + '). A number names one document and is never reused.';
    var badNumber = numberFormatProblem(rec);
    if (badNumber) return badNumber;
    return null;
  }

  /* ── Writing ─────────────────────────────────────────────────────────
     add() is what an upload calls. The record is stored exactly in register
     shape, so nothing downstream can tell a submitted document from one that
     shipped with the file.                                                */
  function add(rec) {
    lastWriteError = notSent();
    if (lastWriteError) return null;
    if (filingProblem(rec)) return null;
    fresh();
    var again = resubmission(rec);
    if (again && again.revisionOf) rec = Object.assign({}, rec, { docNumber: again.revisionOf.docNumber, supersedes: again.revisionOf.docNumber });
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
    } else if (again && again.prev) {
      // The returned first issue's identity, as a revision carries its
      // parent's: same number and revision, same document (PI-24).
      var q = again.prev;
      row.docNumber = q.docNumber;
      row.revision = q.revision;
      ['docType', 'segment', 'department', 'scope', 'classification', 'language',
       'translationOf', 'numberStatus', 'numberNote', 'legacyId', 'issuingFunction'].forEach(function (f) {
        if (q[f] !== undefined) row[f] = q[f]; else delete row[f];
      });
      row.supersedes = null;
    } else {
      row.supersedes = null;           // only a revision supersedes anything
    }
    if (again) row.resubmitOf = rec.resubmitOf;
    // A filing is a draft at the QMS check, whatever the caller sent. add()
    // used to keep the caller's status, signatures and filer, so a record
    // could be filed straight into force, "approved" by a name of the
    // caller's choosing (PI-09). Every lifecycle field is now the store's.
    row.status = 'draft';
    row.approvalStage = 'qms';
    // Every filing is its own record, for good (PR 2B, NEW-01, NEW-03): a
    // permanent id that no later filing can share, and, for a revision, which
    // attempt at that revision it is. A revision returned by QMS or the
    // approver keeps its revision label as history; filing it again is the
    // same revision, next attempt (Rev 4.0, attempt 2), never a second record
    // that claims to be the same one. Decisions name this id, so a click made
    // on one record can never land on another.
    row.recordId = newRecordId();
    row.attempt = 1 + revisionsOf(row.docNumber).filter(function (x) {
      return x.rejected && sameRev(x.revision, row.revision);
    }).length;
    row.submittedAt = new Date().toISOString();
    // Who filed it goes on the record at the moment of filing, the same way
    // the two signatures do, and from the signed-in identity, not the caller.
    row.submittedBy = actingName();
    row.submittedById = actingId();
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
    obsolete:   ['draft', 'approved', 'current', 'under-review', 'superseded'],
    superseded: ['current', 'under-review']
  };
  /* Withdrawal is a permanent event on the record (PI-11): who withdrew it,
     when, why, and the status it had. Nothing else on the record changes, so
     its check and approval history stay exactly as they were. A reason is
     required, with the same floor as a rejection (owner's decision, 5 Oct
     2026). opts.expect binds the call to the record the person chose, as a
     decision is bound (PR 2B): {key, status}; a record that changed since is
     refused, never redirected (PI-10). lastStatusError says why the last
     call was refused. */
  var lastStatusError = null;
  function setStatus(docNumber, status, rev, opts) {
    lastStatusError = notSent();
    if (lastStatusError) return null;
    if (!docNumber) return null;
    fresh();
    if (status === 'current') {
      var r = approve(docNumber);
      return r.ok ? findDoc(docNumber) : null;
    }
    opts = opts || {};
    // Any other move belongs to whoever manages the document: its Director,
    // its Maintenance Manager or QMS. An Employee or an auditor could
    // withdraw a live procedure from the console before this check.
    // Without a revision named, it is the revision in force that moves.
    var cur = opts.expect && opts.expect.key ? byKey(opts.expect.key) : target(docNumber, rev);
    if (opts.expect && opts.expect.key &&
        (!cur || cur.docNumber !== docNumber || (rev !== undefined && !sameRev(cur.revision, rev)) ||
         (opts.expect.status && cur.status !== opts.expect.status))) {
      lastStatusError = STALE;
      return null;
    }
    if (!cur || !mayManage(cur)) return null;
    if (!Object.prototype.hasOwnProperty.call(MOVES, status) || MOVES[status].indexOf(cur.status) === -1) return null;
    var now = new Date().toISOString(), by = actingName(), byId = actingId(), grant = actingGrant();
    var f = { status: status };
    if (status === 'obsolete') {
      var why = String(opts.reason == null ? '' : opts.reason).trim();
      if (why.length < REASON_MIN) {
        lastStatusError = 'Give a reason for withdrawing it, at least ' + REASON_MIN + ' characters.';
        return null;
      }
      f.approvalStage = null;                              // a withdrawn draft leaves both queues
      f.withdrawnFromStatus = cur.status;
      f.withdrawnBy = by; f.withdrawnById = byId; f.withdrawnAt = now; f.withdrawnDate = localDay(now); f.withdrawnReason = why;
      if (grant) { f.withdrawnUnderGrant = grant; f.withdrawnOnBehalfOfId = actingFor(); }
    } else {
      f.supersededAt = now; f.supersededDate = localDay(now);
    }
    var wasLive = isLiveStatus(cur.status);
    write(cur, f);
    // Withdrawing or superseding the revision in force takes its
    // translations with it (PI-34).
    if (wasLive) cascadeToTranslations(cur.docNumber, status,
      'Source ' + cur.docNumber + ' superseded: translation to be re-issued',
      status === 'obsolete' ? { withdrawnBy: by, withdrawnById: byId, withdrawnAt: now, withdrawnDate: localDay(now),
        withdrawnReason: 'Withdrawn with its source ' + cur.docNumber + ': ' + f.withdrawnReason } : null);
    // Withdrawing the revision in force withdraws the document family. A
    // revision still in progress, of this document or of its translations,
    // is cancelled in the same step: it leaves both queues and can never be
    // checked, approved or put in force, and it stays in the register as
    // history with the reason (owner's decision for NEW-02, PR 2B).
    if (wasLive && status === 'obsolete') cancelOpenRevisions(cur.docNumber);
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
  var RANK = { current: 0, 'under-review': 0, draft: 1, approved: 1, superseded: 3, obsolete: 4 };
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
  // A revision approved with a future effective date, waiting to take
  // effect (PI-21): it is the number's open revision until then.
  function pendingEffective(docNumber) {
    var hit = null;
    all().forEach(function (d) { if (!hit && d.docNumber === docNumber && d.status === 'approved') hit = d; });
    return hit;
  }
  /* The next major revision, in the register's own style: 1.0 → 2.0,
     v2.3 → v3.0. Anything unreadable starts again from 2.0. */
  function nextRevision(rev) {
    var m = String(rev == null ? '' : rev).trim().match(/^(v?)(\d+)(?:\.\d+)?$/i);
    return m ? m[1] + (parseInt(m[2], 10) + 1) + '.0' : '2.0';
  }
  /* ── Record identity (PR 2B) ───────────────────────────────────────
     recordKey(d) names one exact record for good: the permanent id a filing
     gets here, or, for a record shipped with the register (one shipped row
     per number and revision), its number and revision. byKey() reads it
     back. A decision carries the key of the record the person was shown,
     and the register refuses it if that is no longer the record waiting. */
  function newRecordId() {
    return 'R-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  }
  function recordKey(d) {
    if (!d) return null;
    return d.recordId || ((d.docNumber || '') + '@' + revOf(d));
  }
  function byKey(key) {
    if (!key) return null;
    var hit = null;
    all().forEach(function (d) { if (!hit && recordKey(d) === key) hit = d; });
    return hit;
  }
  // Rev 4.0, or Rev 4.0 (attempt 2) when an earlier attempt was returned.
  function revisionLabel(d) {
    if (!d) return '';
    if (!revOf(d)) return 'Revision not recorded';
    return 'Rev ' + revOf(d) + (d.attempt > 1 ? ' (attempt ' + d.attempt + ')' : '');
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
      var ok = ovKey(d);
      o[ok] = o[ok] || {};
      for (k in fields) if (Object.prototype.hasOwnProperty.call(fields, k)) o[ok][k] = fields[k];
      saveOverrides();
    }
  }
  function target(docNumber, rev) { return rev !== undefined ? findRev(docNumber, rev) : findDoc(docNumber); }

  /* A translation follows its source: when the revision in force is
     superseded or withdrawn, so are the source's translations in force. */
  function cascadeToTranslations(sourceNumber, status, note, extra) {
    all().filter(function (t) { return t.translationOf === sourceNumber && isLiveStatus(t.status); })
      .forEach(function (t) {
        var f = { status: status };
        if (status === 'superseded') {
          f.supersededBy = note;
          f.supersededAt = new Date().toISOString(); f.supersededDate = localDay();
        }
        if (status === 'obsolete') f.withdrawnFromStatus = t.status;
        for (var k in (extra || {})) if (Object.prototype.hasOwnProperty.call(extra, k)) f[k] = extra[k];
        write(t, f);
      });
  }

  var CANCEL_REASON = 'Cancelled because the document family was withdrawn.';
  function cancelOpenRevisions(docNumber) {
    var now = new Date().toISOString(), by = actingName(), byId = actingId();
    all().filter(function (d) {
      return ((d.status === 'draft' && !d.rejected) || d.status === 'approved') &&
        (d.docNumber === docNumber || d.translationOf === docNumber);
    }).forEach(function (d) {
      write(d, { status: 'obsolete', approvalStage: null, cancelled: true, cancelledFromStatus: d.status,
        cancelledReason: CANCEL_REASON, cancelledBy: by, cancelledById: byId, cancelledAt: now,
        cancelledDate: now.slice(0, 10) });
    });
  }
  /* Whether a draft may still go forward. Cancellation already takes a
     withdrawn family's open revisions out of the workflow; this is the second
     lock, for a draft written before cancellation existed or by any other
     route: a revision whose predecessor has been withdrawn, or a translation
     whose source family has been withdrawn, never goes forward. */
  function withdrawnFamily(d) {
    if (!d) return null;
    if (d.cancelled) return d.cancelledReason || CANCEL_REASON;
    var fam = revisionsOf(d.docNumber);
    var m = String(d.supersedes || '').match(/^Rev\s+(.+)$/);
    var parent = m ? fam.filter(function (x) { return x !== d && sameRev(x.revision, m[1]); })[0] : null;
    if (parent && parent.status === 'obsolete')
      return d.docNumber + ' has been withdrawn, so this revision cannot go forward.';
    if (d.translationOf) {
      var src = revisionsOf(d.translationOf);
      if (src.length && !src.some(function (x) { return isLiveStatus(x.status); }) &&
          src.some(function (x) { return x.status === 'obsolete' && !x.cancelled; }))
        return 'Its source ' + d.translationOf + ' has been withdrawn, so this translation cannot go forward.';
    }
    return null;
  }

  /* A decision names the record it was made on (PR 2B, NEW-01). The page
     passes { key, stage }: the record it showed and the step it was at.
     Without it the call acts on the number's open revision, as before; with
     it, the register refuses unless that exact record is still the one
     waiting, at that step. "Changed after you opened it" is the honest
     reason, never a role error (PI-49). */
  var STALE = 'This document changed after you opened it. Review the current revision before deciding.';
  function decisionTarget(docNumber, expect) {
    var d = workTarget(docNumber);
    if (!expect || typeof expect !== 'object' || !expect.key) return { d: d };
    if (!d || recordKey(d) !== String(expect.key) || (expect.stage && stageOf(d) !== expect.stage))
      return { d: d, stale: true };
    return { d: d };
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
  /* opts.effectiveDate (YYYY-MM-DD): when the approved revision becomes
     valid for use. It defaults to the approval date and is never earlier
     (owner's decision for PI-21). The approval date is the system's, never
     the caller's. */
  function approve(docNumber, expect, opts) {
    var off = notSent();
    if (off) return { ok: false, offline: true, error: off };
    fresh();
    var t = decisionTarget(docNumber, expect), d = t.d;
    if (t.stale) return { ok: false, stale: true, error: STALE };
    if (!d) return { ok: false, error: 'No such document.' };
    if (typeof TAQA_APPROVAL === 'undefined') return { ok: false, error: 'Rules not loaded.' };
    var gone = d.status === 'draft' ? withdrawnFamily(d) : null;
    if (gone) return { ok: false, error: gone };
    if (!TAQA_APPROVAL.canApprove(d)) return { ok: false, error: 'You cannot approve this document.' };
    var now = new Date().toISOString(), today = localDay(now);
    var eff = (opts && opts.effectiveDate) ? String(opts.effectiveDate) : today;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eff) || addMonths(eff, 0) !== eff)
      return { ok: false, error: 'The effective date is not a date.' };
    if (eff < today) return { ok: false, error: 'The effective date cannot be earlier than the approval date (' + today + ').' };
    var dates = { approvedBy: actingName(), approvedById: actingId(), approvedUnderGrant: actingGrant(), approvedOnBehalfOfId: actingFor(), approvedDate: today, approvedAt: now,
                  issueDate: eff, nextReviewDate: addMonths(eff, reviewCycle(d)), reviewOverdue: false };
    if (eff > today) {
      // Approved now, in force from its effective date: the revision it
      // replaces stays current until then.
      write(d, Object.assign({ approvalStage: null, status: 'approved' }, dates));
      announce({ action: 'patch', docNumber: d.docNumber, fields: { status: 'approved' } });
      return { ok: true, next: 'approved, effective ' + eff, effectiveDate: eff };
    }
    // Releasing a revision supersedes the one it replaces in the same step,
    // so there is never a moment with two revisions in force (PI-02). The
    // superseded revision keeps every field it had: its approval history is
    // never rewritten. Its translations in force are superseded with it,
    // marked to be re-issued against the new revision (PI-34).
    var replaced = revisionsOf(d.docNumber).filter(function (x) { return x !== d && isLiveStatus(x.status); });
    write(d, Object.assign({ approvalStage: null, status: 'current' }, dates));
    replaced.forEach(function (x) {
      write(x, { status: 'superseded', supersededBy: 'Rev ' + revOf(d), supersededAt: now, supersededDate: today });
    });
    if (replaced.length) cascadeToTranslations(d.docNumber, 'superseded',
      'Source ' + d.docNumber + ' Rev ' + revOf(d) + ': translation to be re-issued');
    announce({ action: 'patch', docNumber: d.docNumber, fields: { status: 'current' } });
    return { ok: true, next: 'released' };
  }

  function countersign(docNumber, expect) {
    var off = notSent();
    if (off) return { ok: false, offline: true, error: off };
    fresh();
    var t = decisionTarget(docNumber, expect), d = t.d;
    if (t.stale) return { ok: false, stale: true, error: STALE };
    if (!d) return { ok: false, error: 'No such document.' };
    if (typeof TAQA_APPROVAL === 'undefined') return { ok: false, error: 'Rules not loaded.' };
    var gone = d.status === 'draft' ? withdrawnFamily(d) : null;
    if (gone) return { ok: false, error: gone };
    if (!TAQA_APPROVAL.canCountersign(d)) return { ok: false, error: 'You cannot countersign this document.' };
    write(d, {
      approvalStage: 'director',
      countersignedBy: actingName(),
      countersignedById: actingId(),
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
  function reject(docNumber, reason, expect) {
    var off = notSent();
    if (off) return { ok: false, offline: true, error: off };
    fresh();
    var t = decisionTarget(docNumber, expect), d = t.d;
    if (t.stale) return { ok: false, stale: true, error: STALE };
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
      rejectedById: actingId(),
      rejectedUnderGrant: actingGrant(),
      rejectedOnBehalfOfId: actingFor(),
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
  /* The actor's identity, which separation of duties compares (NEW-04):
     the prototype's simulated person (role and area); the Entra object id in
     production. The name beside it is a label. */
  function actingId() {
    return (typeof TAQA_ROLE !== 'undefined' && TAQA_ROLE.identity) ? TAQA_ROLE.identity() : null;
  }
  // The grant acted under, if any: evidence of the authority used, never an
  // identity.
  function actingGrant() {
    var d = (typeof TAQA_DELEGATION !== 'undefined') ? TAQA_DELEGATION.current() : null;
    return d ? d.id : null;
  }
  // Whose authority the grant carries: the grantor's identity, kept on the
  // record beside the actor's, so the record names both without looking the
  // grant up. A grant recorded before identities were kept has none.
  function actingFor() {
    var d = (typeof TAQA_DELEGATION !== 'undefined') ? TAQA_DELEGATION.current() : null;
    return d ? (d.grantorId || null) : null;
  }
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
    'rejectedBy', 'rejectedReason', 'rejectedDate', 'rejectedAt', 'submittedBy', 'submittedAt',
    'cancelled', 'cancelledReason', 'cancelledBy', 'cancelledAt', 'cancelledDate', 'cancelledFromStatus',
    'withdrawnBy', 'withdrawnAt', 'withdrawnDate', 'withdrawnReason', 'withdrawnFromStatus',
    'submittedById', 'countersignedById', 'approvedById', 'approvedUnderGrant', 'rejectedById', 'rejectedUnderGrant',
    'withdrawnById', 'withdrawnUnderGrant', 'cancelledById',
    'approvedOnBehalfOfId', 'rejectedOnBehalfOfId', 'withdrawnOnBehalfOfId',
    'supersededAt', 'supersededDate', 'tookEffectAt', 'issueDate'];

  /* Never taken from a caller of add(): the store writes each of these. */
  /* The dates a record carries are the register's: issued (effective) and
     next review are set at release, never at filing and never by the filer
     (PI-21). */
  var FILED_BY_STORE = LIFECYCLE.concat(['locallyAdded', 'supersededBy', 'recordId', 'attempt',
    'issueDate', 'nextReviewDate', 'reviewOverdue', 'resubmitOf']);

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
    var off = notSent();
    if (off) return { ok: false, offline: true, error: off };
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
    if (notSent()) return false;
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
    recordKey: recordKey, byKey: byKey, revisionLabel: revisionLabel,
    numberFormat: numberFormat, numberFormatProblem: numberFormatProblem, nextNumber: nextNumber, related: related,
    pendingEffective: pendingEffective, localDay: localDay, resubmission: resubmission,
    statusError: function () { return lastStatusError; },
    writeError: function () { return lastWriteError; }, notSent: notSent,
    withdrawnFamily: withdrawnFamily, STALE: STALE, CANCEL_REASON: CANCEL_REASON,
    onChange: onChange, added: load,
    isControlled: isControlled, isLive: isLive,
    EVENT: EVT, KEY: KEY
  };
})(typeof window !== 'undefined' ? window : this);
