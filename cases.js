/* ──────────────────────────────────────────────────────────────────────────
   RISE Field Cases: window.TAQA_CASES
   ──────────────────────────────────────────────────────────────────────────
   One way for every page to read, match, file and export field cases, so
   the library, the case page, the form, the pre-job pack, Search and the
   segment strip all say the same thing.

   Where cases come from
     case      a register record of one of the ten card types that carries a
               `card` (filed in the browser through TAQA_STORE.add). It
               follows the ordinary route: QMS checks it, the area's Segment
               Director releases it. Numbering, review dates, separation of
               duties and returns are the register's (store.js, roles.js).
     register  a Lesson Learned or Technical Alert that is a document (no
               card), in force in an operational segment. Listed honestly
               under source "Register" and opened in viewer.html.
     shipped   TAQA_CASES_SHIPPED (cases-data.js): published library entries
               the owner supplies. Never register records, so they change
               no register count, queue or Master List figure.

   Who sees what. Released entries follow TAQA_STORE.readable (role and
   classification). An unreleased case (with QMS, with the Director, or
   approved for a later date, or returned) is visible to its filer, QMS and
   the area's Segment Director, and to the External Auditor, who reads the
   whole register. Lists never show a returned case except to its filer
   (mine()), who files it again. In production the server applies these rules; here the
   prototype filters its own demonstration data in the browser.

   Escaping. Every value here is data a person typed. A page that puts any
   of it into HTML escapes it first (TAQA_CASES.esc). htmlCard() escapes
   every field itself.

   Loads after documents-master.js, roles.js, store.js and cases-data.js. It
   touches no DOM, so a page may load it anywhere after those.
   ────────────────────────────────────────────────────────────────────── */
(function (root) {
  'use strict';

  function S() { return root.TAQA_STORE || null; }
  function LK() {
    return (typeof TAQA_DOC_LOOKUPS !== 'undefined' && TAQA_DOC_LOOKUPS) || { segments: {}, types: {} };
  }
  function O() { return (typeof TAQA_CASE_OPTIONS !== 'undefined' && TAQA_CASE_OPTIONS) || {}; }
  function F() { return (typeof TAQA_CASE_FIELDS !== 'undefined' && TAQA_CASE_FIELDS) || { shared: [], sections: {}, incident: [] }; }
  function shippedRaw() {
    return (typeof TAQA_CASES_SHIPPED !== 'undefined' && Array.isArray(TAQA_CASES_SHIPPED)) ? TAQA_CASES_SHIPPED : [];
  }
  function hasRoles() { return typeof TAQA_ROLE !== 'undefined'; }
  function role() { return hasRoles() ? TAQA_ROLE.current() : null; }
  function me() { return (hasRoles() && TAQA_ROLE.identity) ? TAQA_ROLE.identity() : null; }
  function held() { return hasRoles() ? TAQA_ROLE.area() : null; }

  /* ── Escaping ─────────────────────────────────────────────────────────── */
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function str(v) { return v == null ? '' : String(v).trim(); }
  function clone(o) { try { return JSON.parse(JSON.stringify(o)); } catch (e) { return null; } }
  function eqi(a, b) { return str(a).toLowerCase() === str(b).toLowerCase(); }

  /* ── Types ────────────────────────────────────────────────────────────── */
  // The order and labels of the business case. The register's own labels
  // (TAQA_DOC_LOOKUPS.types[k].label) stay as they are for documents.
  var ORDER = ['case-study', 'lesson', 'incident', 'prejob', 'appreciation', 'practice',
               'field-profile', 'benchmark', 'alert', 'training'];
  var CASE_LABEL = {
    'case-study': 'Case study', 'lesson': 'Lesson learned', 'incident': 'Failure / incident card',
    'prejob': 'Pre-job plan', 'appreciation': 'Customer appreciation', 'practice': 'Best practice',
    'field-profile': 'Location / field profile', 'benchmark': 'Performance benchmark',
    'alert': 'Technical alert / tool limit', 'training': 'Expert / training'
  };
  var TYPES = ORDER.filter(function (k) { return !!(LK().types[k] || {}).card; }).map(function (k) {
    var t = LK().types[k];
    return Object.freeze({ key: k, label: CASE_LABEL[k], letter: t.letter, mark: t.mark || t.letter, cardOnly: !!t.cardOnly });
  });
  Object.freeze(TYPES);

  function isCaseType(t) { return !!(LK().types[t] || {}).card; }
  function typeLabel(t) { return CASE_LABEL[t] || (LK().types[t] || {}).label || str(t); }

  /* Pre-job pack groups, in the order the pack shows them. */
  var GROUPS = Object.freeze([
    Object.freeze({ key: 'watch',   label: 'Failures and incidents to watch', types: ['incident'] }),
    Object.freeze({ key: 'alerts',  label: 'Tool limits and alerts',          types: ['alert'] }),
    Object.freeze({ key: 'worked',  label: 'What worked',                     types: ['case-study', 'practice', 'benchmark'] }),
    Object.freeze({ key: 'lessons', label: 'Lessons learned',                 types: ['lesson'] }),
    Object.freeze({ key: 'context', label: 'Field profiles, plans, appreciation and expertise',
                    types: ['field-profile', 'prejob', 'appreciation', 'training'] })
  ]);
  function groupOf(t) {
    for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].types.indexOf(t) !== -1) return GROUPS[i].key;
    return 'context';
  }

  /* ── Areas ────────────────────────────────────────────────────────────── */
  function operationalArea(id) { var s = LK().segments[id]; return !!s && s.group === 'segment'; }
  function operational() {
    var segs = LK().segments;
    return Object.keys(segs).filter(function (k) { return segs[k].group === 'segment'; })
      .map(function (k) { return { id: k, name: segs[k].name }; });
  }
  function areaName(id) { var s = LK().segments[id]; return s ? s.name : str(id); }

  /* ── Options ──────────────────────────────────────────────────────────── */
  function union(lists) {
    var out = [], other = false;
    lists.forEach(function (l) {
      (l || []).forEach(function (v) {
        if (v === 'Other') { other = true; return; }
        if (out.indexOf(v) === -1) out.push(v);
      });
    });
    if (other) out.push('Other');
    return out;
  }
  var OPTIONS = {
    other: 'Other',
    locations: (O().locations || []).slice(),
    incidentTypes: (O().incidentTypes || []).slice(),
    results: (O().results || []).slice(),
    holeSizes: (O().holeSizes || []).slice(),
    classes: (O().classes || []).map(function (c) { return { value: c.value, label: c.label, hint: c.hint }; }),
    // A segment's list; with no area (or an unknown one), every operational
    // segment's list together, 'Other' last.
    services: function (area) {
      var m = O().services || {};
      if (area && m[area]) return m[area].slice();
      if (area) return ['Other'];
      return union(operational().map(function (a) { return m[a.id]; }));
    },
    endings: function (area) {
      var m = O().endings || {};
      var pick = area ? (m[area] || m['default'] || []) : (m['drilling'] || []).concat(m['default'] || []);
      var seen = {};
      return pick.filter(function (e) { if (seen[e.value]) return false; seen[e.value] = 1; return true; })
        .map(function (e) { return { value: e.value, label: e.label, hint: e.hint || '' }; });
    },
    findings: function (area) {
      var m = O().findings || {};
      if (area) return (m[area] || m['default'] || []).slice();
      return union([m['drilling'], m['default']]);
    },
    tripOut: function (area) {
      var m = O().tripOut || {};
      return (area && m[area]) || m['default'] || null;
    }
  };
  function endingHint(area, value) {
    var e = OPTIONS.endings(area).filter(function (x) { return x.value === value; })[0];
    return e ? e.hint : '';
  }

  /* ── Hole size ────────────────────────────────────────────────────────── */
  // "8 1/2", "8-1/2", "8½", "8.5", "8 1/2 in" all read as 8.5.
  function holeNumber(v) {
    var t = str(v).toLowerCase()
      .replace(/½/g, ' 1/2').replace(/¼/g, ' 1/4').replace(/¾/g, ' 3/4')
      .replace(/⅛/g, ' 1/8').replace(/⅜/g, ' 3/8').replace(/⅝/g, ' 5/8').replace(/⅞/g, ' 7/8')
      .replace(/(inches|inch|in\.?|["”″])\s*$/, '').trim();
    if (!t) return null;
    var m = t.match(/^(\d+(?:\.\d+)?)(?:[\s-]+(\d+)\s*\/\s*(\d+))?$/);
    if (m) {
      var n = parseFloat(m[1]);
      if (m[2]) { if (!+m[3]) return null; n += (+m[2]) / (+m[3]); }
      return Math.round(n * 1000) / 1000;
    }
    var f = t.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (f && +f[2]) return Math.round((+f[1] / +f[2]) * 1000) / 1000;
    return null;
  }
  function holeEq(a, b) {
    var x = holeNumber(a), y = holeNumber(b);
    return x !== null && y !== null && x === y;
  }
  function holeLabel(v) { var s = str(v); if (!s) return ''; return /(in\.?|inch|inches|["”″])$/i.test(s) ? s : s + ' in'; }
  // One written form for a hole size, whatever was typed: 8.5, 8½ and
  // 8-1/2 all read "8 1/2 in" (eighths), so a printed sheet and its match
  // lines agree. A size that is not a whole number of eighths stays as typed.
  function holeText(v) {
    var n = holeNumber(v);
    if (n === null) return holeLabel(v);
    var w = Math.floor(n), e = (n - w) * 8, f = Math.round(e);
    if (Math.abs(e - f) > 1e-6) return holeLabel(v);
    if (f === 8) { w += 1; f = 0; }
    var num = f, den = 8;
    while (num && num % 2 === 0) { num /= 2; den /= 2; }
    return (w || !num ? String(w) : '') + (num ? (w ? ' ' : '') + num + '/' + den : '') + ' in';
  }

  /* ── Visibility ───────────────────────────────────────────────────────── */
  var LIVE = { current: 1, 'under-review': 1 };
  function cardOf(d) { return (d && d.card && typeof d.card === 'object' && !Array.isArray(d.card)) ? d.card : null; }
  function isMine(d) { var id = me(); return !!(d && id && d.submittedById && d.submittedById === id); }
  // May the signed-in person open this register record as a case?
  function canView(d) {
    var st = S();
    if (!d || !st) return false;
    if (isMine(d)) return true;
    if (LIVE[d.status] || d.status === 'superseded' || d.status === 'obsolete') return st.readable(d);
    // Unreleased: waiting on QMS or the Director, returned, or approved for
    // a later date. Its filer (above), QMS, the auditor and the area's
    // Director, who is its approver.
    if (!st.classOpen(d)) return false;
    var r = role();
    if (r === 'qms' || r === 'auditor') return true;
    return r === 'owner' && held() === d.segment && d.department !== 'maintenance';
  }
  // Reviewers see the follow-up contact: QMS, the area's Director, the
  // auditor, and whoever filed it.
  function isReviewer(e) {
    if (!e) return false;
    if (e.record && isMine(e.record)) return true;
    var r = role();
    if (r === 'qms' || r === 'auditor') return true;
    return r === 'owner' && held() === e.area;
  }
  /* Why a TAQA_CASES_SHIPPED entry cannot be listed at all, or null. Said
     once in the console, so a pasted case that does not show is never a
     silent mystery (role and classification limits are not problems). */
  var warned = {};
  function shippedProblem(s) {
    if (!s || typeof s !== 'object') return 'it is not a case record';
    if (!s.id) return 'it has no id (letters, digits and hyphens)';
    if (!/^[A-Za-z0-9-]+$/.test(String(s.id))) return 'its id "' + String(s.id) + '" may use only letters, digits and hyphens';
    var type = s.type || (s.card || {}).type, area = s.area || (s.card || {}).area;
    if (!isCaseType(type)) return 'its type "' + str(type) + '" is not one of the ten case types';
    if (!operationalArea(area)) return 'its area "' + str(area) + '" is not an operational segment';
    return null;
  }
  function shippedVisible(s) {
    var why = shippedProblem(s);
    if (why) {
      var k = (s && s.id) || (s && s.title) || '?';
      if (!warned[k]) {
        warned[k] = 1;
        try { console.warn('RISE field cases: TAQA_CASES_SHIPPED entry ' + JSON.stringify(String(k)) + ' is not listed: ' + why + '.'); } catch (e) {}
      }
      return false;
    }
    var cls = s.classification || 'internal';
    if (!hasRoles()) return cls === 'internal';
    var R = TAQA_ROLE.def(role());
    return !!R && R.classifications.indexOf(cls) !== -1;
  }

  /* ── Status ───────────────────────────────────────────────────────────── */
  function statusOf(d) {
    if (d.status === 'draft') {
      if (d.rejected) return 'returned';
      var st = S() ? S().stageOf(d) : null;
      return st === 'director' ? 'with-director' : 'with-qms';
    }
    if (d.status === 'approved') return 'approved';
    if (LIVE[d.status]) return 'published';
    if (d.status === 'superseded') return 'superseded';
    if (d.status === 'obsolete') return d.cancelled ? 'cancelled' : 'withdrawn';
    return str(d.status) || 'unknown';
  }
  var STATUS_LABEL = {
    'with-qms': 'With QMS', 'with-director': 'With the Director', 'returned': 'Returned',
    'approved': 'Approved', 'published': 'Published', 'superseded': 'Superseded',
    'withdrawn': 'Withdrawn', 'cancelled': 'Cancelled'
  };
  function statusLabel(e) {
    if (!e) return '';
    if (e.status === 'returned') return 'Returned: ' + (e.returnedReason || 'no reason recorded');
    if (e.status === 'approved') return 'Approved, in force from ' + ((e.record && e.record.issueDate) || 'its effective date');
    return STATUS_LABEL[e.status] || str(e.status);
  }

  /* ── Entries ──────────────────────────────────────────────────────────── */
  function caseUrl(d) {
    return 'case.html?doc=' + encodeURIComponent(d.docNumber || '') +
      '&rev=' + encodeURIComponent(d.revision == null ? '' : String(d.revision)) +
      (d.rejected && d.recordId ? '&rid=' + encodeURIComponent(d.recordId) : '');
  }
  function viewerUrl(d) {
    return 'viewer.html?doc=' + encodeURIComponent(d.docNumber || '') +
      (d.revision ? '&rev=' + encodeURIComponent(d.revision) : '');
  }
  // The card a page may show: a copy, with the follow-up contact removed for
  // anyone who is not a reviewer.
  function publicCard(card, reviewer) {
    if (!card) return null;
    var c = clone(card) || {};
    if (!reviewer && c.incident && typeof c.incident === 'object') delete c.incident.contact;
    return c;
  }
  function facts(e, c, fallbackDate) {
    c = c || {};
    var inc = (c.incident && typeof c.incident === 'object') ? c.incident : {};
    e.location   = str(c.location);
    e.services   = Array.isArray(c.services) ? c.services.map(str).filter(Boolean) : [];
    e.eventMonth = str(c.eventMonth);
    e.customer   = str(c.customer);
    e.field      = str(c.field);
    e.wellRef    = str(c.wellRef);
    e.holeSize   = str(c.holeSize);
    e.formation  = str(c.formation);
    e.sourceDoc  = str(c.sourceDoc);
    e.authorRole = str(c.authorRole);
    e.salesReady = c.salesReady === true;
    e.ending     = str(inc.ending) || null;
    e.incidentType = str(inc.type) || null;
    e.incidentDate = str(inc.date) || null;
    e.date = e.incidentDate || e.eventMonth || str(fallbackDate);
  }
  function fromRecord(d) {
    var st = S(), card = cardOf(d);
    var e = {
      source: card ? 'case' : 'register',
      key: st ? st.recordKey(d) : (d.docNumber + '@' + d.revision),
      id: null,
      docNumber: str(d.docNumber),
      rev: d.revision == null ? '' : String(d.revision),
      revLabel: st ? st.revisionLabel(d) : 'Rev ' + d.revision,
      title: str(d.title),
      summary: str(d.summary),
      area: d.segment || '',
      areaName: areaName(d.segment),
      type: d.docType,
      typeLabel: typeLabel(d.docType),
      letter: (LK().types[d.docType] || {}).letter || '',
      status: statusOf(d),
      returnedReason: d.rejected ? str(d.rejectedReason) : null,
      released: !!LIVE[d.status],
      mine: isMine(d),
      classification: d.classification || 'internal',
      publishedDate: (LIVE[d.status] && d.issueDate) || null,
      record: d,
      card: null,
      url: card ? caseUrl(d) : viewerUrl(d)
    };
    e.statusLabel = statusLabel(e);
    e.card = publicCard(card, isReviewer(e));
    facts(e, e.card, d.issueDate || (d.submittedAt ? String(d.submittedAt).slice(0, 10) : ''));
    return e;
  }
  function fromShipped(s) {
    var card = (s.card && typeof s.card === 'object') ? s.card : {};
    var e = {
      source: 'shipped',
      key: 'shipped:' + s.id,
      id: String(s.id),
      docNumber: str(s.docNumber),
      rev: str(s.rev),
      revLabel: s.rev ? 'Rev ' + str(s.rev) : '',
      title: str(s.title),
      summary: str(s.summary),
      area: s.area || card.area || '',
      areaName: areaName(s.area || card.area),
      type: s.type || card.type,
      typeLabel: typeLabel(s.type || card.type),
      letter: (LK().types[s.type || card.type] || {}).letter || '',
      status: 'published',
      returnedReason: null,
      released: true,
      mine: false,
      classification: s.classification || 'internal',
      publishedDate: str(s.publishedDate) || null,
      record: null,
      card: null,
      url: 'case.html?id=' + encodeURIComponent(s.id)
    };
    e.statusLabel = 'Published';
    e.card = publicCard(card, isReviewer(e));
    facts(e, e.card, s.publishedDate);
    return e;
  }
  function byDateDesc(a, b) {
    var x = a.date || '', y = b.date || '';
    if (x !== y) return x < y ? 1 : -1;
    return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
  }

  /* all({includeUnreleased}) — every entry this person may see, newest first.
     Released: register cases and register lessons/alerts in force in an
     operational segment (never a maintenance department), plus shipped
     cases. includeUnreleased adds the cases still on their way (with QMS,
     with the Director, approved for a later date) that this person may see.
     Returned, superseded and withdrawn records are never listed here; the
     filer finds their own in mine(). */
  function all(opts) {
    opts = opts || {};
    var st = S(), out = [];
    if (st) st.all().forEach(function (d) {
      if (!d || !isCaseType(d.docType)) return;
      if (!operationalArea(d.segment) || d.department === 'maintenance') return;
      if (LIVE[d.status]) { if (canView(d)) out.push(fromRecord(d)); return; }
      if (!opts.includeUnreleased || !cardOf(d) || d.rejected || d.cancelled) return;
      if ((d.status === 'draft' || d.status === 'approved') && canView(d)) out.push(fromRecord(d));
    });
    shippedRaw().forEach(function (s) { if (shippedVisible(s)) out.push(fromShipped(s)); });
    return out.sort(byDateDesc);
  }
  function released() { return all().filter(function (e) { return e.released; }); }
  function forArea(id) { return released().filter(function (e) { return e.area === id; }); }
  /* The cases the signed-in person filed, any status, newest filing first.
     Every attempt is listed: a returned case that was filed again appears
     as the returned attempt and the new one. mine({latest: true}) keeps one
     line per case, its newest filing, as lists of "your cases" show it. */
  function mine(opts) {
    var st = S(), id = me();
    if (!st || !id) return [];
    var list = st.all().filter(function (d) {
      return d && isCaseType(d.docType) && cardOf(d) && d.submittedById === id;
    }).sort(function (a, b) {
      var x = a.submittedAt || '', y = b.submittedAt || '';
      return x < y ? 1 : x > y ? -1 : 0;
    });
    if (opts && opts.latest) {
      var seen = {};
      list = list.filter(function (d) {
        var k = d.docNumber || (st.recordKey ? st.recordKey(d) : '');
        if (seen[k]) return false;
        seen[k] = 1; return true;
      });
    }
    return list.map(fromRecord);
  }
  /* One case, as case.html asks for it: {doc, rev, rid} for a register
     record, {id} for a shipped case. null when there is no such case or
     this person may not see it (the two read the same, BD-03). A register
     document without a card comes back with source 'register': open its
     entry.url (viewer.html) instead. */
  function get(q) {
    q = q || {};
    if (q.id) {
      var s = shippedRaw().filter(function (x) { return x && String(x.id) === String(q.id); })[0];
      return s && shippedVisible(s) ? fromShipped(s) : null;
    }
    var st = S();
    if (!st || !q.doc) return null;
    var d = null;
    if (q.rid) { var x = st.byKey(q.rid); if (x && x.docNumber === q.doc) d = x; }
    if (!d && q.rev) d = st.findRev(q.doc, q.rev);
    if (!d) d = st.findDoc(q.doc);
    // With no exact record named, a case whose every attempt was returned
    // opens on its newest attempt, never an older one with stale text.
    if (d && !q.rid && d.status === 'draft' && d.rejected) d = newestReturned(d);
    return openable(d) ? fromRecord(d) : null;
  }
  // The same guard all() applies: a case type, in an operational segment,
  // never a maintenance department, and open to this person.
  function openable(d) {
    return !!d && isCaseType(d.docType) && operationalArea(d.segment) && d.department !== 'maintenance' && canView(d);
  }
  function newestReturned(d) {
    var st = S(), best = d;
    (st.revisionsOf(d.docNumber) || []).forEach(function (x) {
      if (x.status === 'draft' && x.rejected && String(x.revision) === String(d.revision) &&
          (x.attempt || 1) > (best.attempt || 1) && canView(x)) best = x;
    });
    return best;
  }
  /* The attempt a returned case goes back as when filed again: one more
     than the attempts at its revision returned so far (the store's count). */
  function nextAttempt(d) {
    var st = S();
    if (!d || !st) return 2;
    return 1 + (st.revisionsOf(d.docNumber) || []).filter(function (x) {
      return x.rejected && String(x.revision) === String(d.revision);
    }).length;
  }
  function byKey(key) {
    key = str(key);
    if (!key) return null;
    if (key.indexOf('shipped:') === 0) return get({ id: key.slice(8) });
    var st = S(), d = st ? st.byKey(key) : null;
    return openable(d) ? fromRecord(d) : null;
  }

  /* ── Matching ─────────────────────────────────────────────────────────── */
  // Words of any script (Arabic as well as English), so a search in a
  // language the cases are not written in finds nothing rather than
  // everything. One-letter words are dropped, one-digit numbers kept.
  var WORD_SPLIT = /[^\p{L}\p{N}.\/+]+/u;
  function words(q) { return str(q).toLowerCase().split(WORD_SPLIT).filter(Boolean); }
  function tokens(q) {
    return words(q)
      .filter(function (t) { return t.length > 1 || /\d/.test(t); })
      .filter(function (t, i, a) { return a.indexOf(t) === i; });
  }
  // Is every word of `phrase` present, in order and whole, in `text`? So
  // "ION" matches "ION tool" but not "circulation", and "APS" not "gaps".
  function hasPhrase(text, phrase) {
    var p = words(phrase);
    if (!p.length) return false;
    var t = words(text);
    for (var i = 0; i + p.length <= t.length; i++) {
      var ok = true;
      for (var j = 0; j < p.length; j++) if (t[i + j] !== p[j]) { ok = false; break; }
      if (ok) return true;
    }
    return false;
  }
  function flatten(v, out) {
    if (v == null) return out;
    if (typeof v === 'string' || typeof v === 'number') { out.push(String(v)); return out; }
    if (Array.isArray(v)) { v.forEach(function (x) { flatten(x, out); }); return out; }
    if (typeof v === 'object') Object.keys(v).forEach(function (k) { if (k !== 'v') flatten(v[k], out); });
    return out;
  }
  function haystack(e) {
    var kw = e.record && Array.isArray(e.record.keywords) ? e.record.keywords.join(' ') : str(e.record && e.record.keywords);
    var title = e.title.toLowerCase(), number = e.docNumber.toLowerCase(), summary = e.summary.toLowerCase();
    var body = flatten(e.card, []).join(' ').toLowerCase();
    return { title: title, number: number, summary: summary, body: body,
             all: [title, number, summary, body, kw.toLowerCase(), e.areaName.toLowerCase(), e.typeLabel.toLowerCase()].join(' \u0001 ') };
  }
  function inList(v, list) { return list.some(function (x) { return eqi(x, v); }); }

  /* match(filters, query) — ranked entries (copies with score and why[]).
       filters.source   'all' | 'case' (structured: filed and shipped cases)
                        | 'register' (register lessons and alerts) | 'mine'
                        (one line per case: mine({latest: true}))
       filters.area, .type, .location, .service, .holeSize, .ending,
       .formation       hard filters; location/service 'Other' matches any
                        value that is not on the list
       filters.includeUnreleased   as all()
       filters.prefer   {location, services[], holeSize, formation, note}:
                        ranking only (the pre-job pack), each hit with its
                        reason in why[]
       query            free text: every word must appear somewhere in the
                        case (title, number, summary or any card field);
                        title and number hits rank first.
     With no query and no prefer, newest first. */
  function match(filters, query) {
    var f = filters || {};
    var base = f.source === 'mine' ? mine({ latest: true }) : all({ includeUnreleased: !!f.includeUnreleased });
    if (f.source === 'case') base = base.filter(function (e) { return e.source === 'case' || e.source === 'shipped'; });
    else if (f.source === 'register') base = base.filter(function (e) { return e.source === 'register'; });
    if (f.area) base = base.filter(function (e) { return e.area === f.area; });
    if (f.type) base = base.filter(function (e) { return e.type === f.type; });
    if (f.location) {
      base = base.filter(function (e) {
        if (f.location === 'Other') return !!e.location && !inList(e.location, OPTIONS.locations);
        return eqi(e.location, f.location);
      });
    }
    if (f.service) {
      base = base.filter(function (e) {
        if (f.service === 'Other') {
          var known = OPTIONS.services(e.area);
          return e.services.some(function (s) { return !inList(s, known); });
        }
        return inList(f.service, e.services);
      });
    }
    if (f.holeSize) base = base.filter(function (e) { return holeEq(e.holeSize, f.holeSize); });
    if (f.ending) base = base.filter(function (e) { return e.ending === f.ending; });
    if (f.formation) {
      var ft = str(f.formation).toLowerCase();
      base = base.filter(function (e) { return e.formation.toLowerCase().indexOf(ft) !== -1; });
    }

    var toks = tokens(query), p = f.prefer || null, out = [];
    // Words were typed but none is searchable (one letter, punctuation):
    // nothing matches, rather than every case reading as a result.
    if (str(query) && !toks.length) return [];
    base.forEach(function (e) {
      var score = 0, why = [], h = (toks.length || p) ? haystack(e) : null;
      if (toks.length) {
        if (!toks.every(function (t) { return h.all.indexOf(t) !== -1; })) return;
        toks.forEach(function (t) {
          score += h.number.indexOf(t) !== -1 ? 6 : h.title.indexOf(t) !== -1 ? 5 : h.summary.indexOf(t) !== -1 ? 2 : 1;
        });
        why.push('Matches “' + str(query) + '”');
      }
      if (p) {
        // A service on the card (a real field) outranks a mention in the
        // title or summary, so a mention plus the hole size cannot put a
        // case above one run with the same tool. Mentions are whole words.
        var same = [], said = [];
        (Array.isArray(p.services) ? p.services : []).forEach(function (s) {
          s = str(s);
          if (!s || s === 'Other') return;
          if (inList(s, e.services)) { score += 5; same.push(s); }
          else if (hasPhrase(e.title + ' ' + e.summary, s)) { score += 2; said.push(s); }
        });
        if (same.length) why.push((same.length > 1 ? 'Same services: ' : 'Same service: ') + same.join(', '));
        if (said.length) why.push('Mentions ' + said.join(', '));
        if (p.holeSize && holeEq(e.holeSize, p.holeSize)) { score += 2; why.push('Same hole size: ' + holeText(e.holeSize)); }
        if (p.formation && e.formation) {
          var pf = tokens(p.formation), ef = tokens(e.formation);
          if (pf.some(function (t) { return ef.indexOf(t) !== -1; })) { score += 2; why.push('Same formation: ' + e.formation); }
        }
        if (p.location && p.location !== 'Other' && eqi(e.location, p.location)) { score += 1; why.push('Same location: ' + e.location); }
        var have = {};
        words(h.all).forEach(function (w) { have[w] = 1; });
        var nt = tokens(p.note).filter(function (t) { return have[t] === 1; });
        if (nt.length) { score += nt.length; why.push('Mentions ' + nt.join(', ')); }
        if (!why.length) why.push('Same area: ' + e.areaName);
      }
      var c = {};
      for (var k in e) if (Object.prototype.hasOwnProperty.call(e, k)) c[k] = e[k];
      c.score = score; c.why = why;
      out.push(c);
    });
    return out.sort(function (a, b) { return (b.score - a.score) || byDateDesc(a, b); });
  }

  /* ── Filing ───────────────────────────────────────────────────────────── */
  var FIELD_CASE_ROLE = 'Field cases are filed by operations: an employee or the area’s Director.';
  /* May the signed-in person file a case (in this area, if given)?
     {ok, why, areas}: areas are the operational segments they may file for. */
  function canFile(area) {
    if (!hasRoles() || !S()) return { ok: false, why: 'RISE could not load its rules. Reload the page.', areas: [] };
    var r = role(), cap = TAQA_ROLE.effective();
    if (!cap.submit) {
      var acting = typeof TAQA_DELEGATION !== 'undefined' && TAQA_DELEGATION.actingAs();
      return { ok: false, areas: [], why: acting
        ? 'You are acting under a delegation. Stop acting under it to file a case as yourself.'
        : 'Your role cannot file documents.' };
    }
    if (r !== 'employee' && r !== 'owner') return { ok: false, why: FIELD_CASE_ROLE, areas: [] };
    var areas = operational().map(function (a) { return a.id; });
    if (r === 'owner') {
      var h = held();
      if (!operationalArea(h)) return { ok: false, areas: [], why: FIELD_CASE_ROLE + ' ' + areaName(h) + ' is not an operational segment.' };
      areas = [h];
    }
    if (area && !operationalArea(area)) return { ok: false, areas: areas, why: 'A field case is filed only for an operational segment.' };
    if (area && areas.indexOf(area) === -1) return { ok: false, areas: areas, why: 'As its Segment Director you file cases for ' + areaName(areas[0]) + ' only.' };
    return { ok: true, why: null, areas: areas };
  }

  function fieldsFor(type) { return (F().sections || {})[type] || []; }
  function incidentFields() {
    var out = [];
    (F().incident || []).forEach(function (sec) { (sec.fields || []).forEach(function (f) { out.push(f); }); });
    return out;
  }
  function labelOf(path) {
    var p = String(path || '').split('.');
    var list = p[0] === 'sections' ? null : p[0] === 'incident' ? incidentFields() : F().shared;
    if (p[0] === 'sections') {
      for (var t in F().sections) {
        var hit = (F().sections[t] || []).filter(function (x) { return x.key === p[1]; })[0];
        if (hit) return hit.label;
      }
      return p[1] || path;
    }
    var key = p[0] === 'incident' ? p[1] : p[0];
    var f = (list || []).filter(function (x) { return x.key === key; })[0];
    if (!f) return key || path;
    if (f.kind === 'rows' && p.length > 3) {
      var col = (f.columns || []).filter(function (c) { return c.key === p[3]; })[0];
      return f.label + ', row ' + (+p[2] + 1) + ': ' + (col ? col.label : p[3]);
    }
    return f.label;
  }

  function isMonth(v) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(str(v)); }
  function isDay(v) {
    var m = str(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return false;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
  }
  function today() { return S() ? S().localDay() : new Date().toISOString().slice(0, 10); }
  function blankRow(r) { return !r || !Object.keys(r).some(function (k) { return str(r[k]); }); }

  /* validate(draft) — what must change before a case can be filed, as
     [{key, label, message}] in form order; [] when it is ready. draft is the
     form's content: the card fields (TAQA_CASE_FIELDS) plus title, summary
     and classification. key is the field's path (location, sections.result,
     incident.symptoms.0.text), for linking the error summary to the field. */
  function validate(draft) {
    var d = draft || {}, out = [];
    function bad(key, message, label) { out.push({ key: key, label: label || labelOf(key), message: message }); }
    function need(key, v, label) { if (!str(v)) bad(key, (label || labelOf(key)) + ' is required.'); }
    var type = str(d.type), area = str(d.area);
    if (!type) bad('type', 'Choose the content type.');
    else if (!isCaseType(type)) bad('type', 'Choose one of the ten content types.');
    if (!area) bad('area', 'Choose the operational segment.');
    else if (!operationalArea(area)) bad('area', 'A field case is filed only for an operational segment.');
    if (!str(d.location)) bad('location', 'Choose the location.');
    else if (d.location === 'Other') bad('location', 'Type the location, or choose one from the list.');
    var sv = Array.isArray(d.services) ? d.services.map(str).filter(Boolean) : [];
    if (!sv.length) bad('services', 'Choose at least one service or tool.');
    else if (sv.indexOf('Other') !== -1) bad('services', 'Type the other service or tool, or untick Other.');
    need('title', d.title);
    if (str(d.title).length > 160) bad('title', 'Keep the title to 160 characters or fewer.');
    need('summary', d.summary);
    if (str(d.summary).length > 1200) bad('summary', 'Keep the summary to one paragraph, under 1,200 characters.');
    if (!str(d.eventMonth)) bad('eventMonth', 'Event month is required.');
    else if (!isMonth(d.eventMonth)) bad('eventMonth', 'Write the month as YYYY-MM, for example 2026-08.');
    else if (str(d.eventMonth) > today().slice(0, 7)) bad('eventMonth', 'The event month cannot be in the future.');
    if (str(d.holeSize) && holeNumber(d.holeSize) === null) bad('holeSize', 'Write the hole size in inches, for example 8 1/2 or 8.5.');
    need('sourceDoc', d.sourceDoc);
    need('authorRole', d.authorRole);
    if (d.classification && !OPTIONS.classes.some(function (c) { return c.value === d.classification; }))
      bad('classification', 'Choose Internal, Confidential or Restricted.');

    var sec = (d.sections && typeof d.sections === 'object') ? d.sections : {};
    fieldsFor(type).forEach(function (f) {
      if (f.required && !str(sec[f.key])) bad('sections.' + f.key, f.label + ' is required.', f.label);
    });
    if (type === 'appreciation' && d.salesReady === true && sec.shareAgreed !== true)
      bad('sections.shareAgreed', 'Confirm the customer agreed it can be shared before marking it sales-ready.',
          'The customer agreed this can be shared');

    if (type === 'incident') {
      var inc = (d.incident && typeof d.incident === 'object') ? d.incident : {};
      if (!str(inc.type)) bad('incident.type', 'Choose the incident type.');
      else if (inc.type === 'Other') bad('incident.type', 'Type the incident type, or choose one from the list.');
      if (!str(inc.date)) bad('incident.date', 'Incident date is required.');
      else if (!isDay(inc.date)) bad('incident.date', 'Write the date as YYYY-MM-DD.');
      else if (str(inc.date) > today()) bad('incident.date', 'The incident date cannot be in the future.');
      if (str(inc.timeNoticed) && !/^([01]\d|2[0-3]):[0-5]\d$/.test(str(inc.timeNoticed)))
        bad('incident.timeNoticed', 'Write the time as hh:mm, for example 03:40.');
      ['depthFt', 'nptHr'].forEach(function (k) {
        var v = str(inc[k]);
        if (v && !(/^\d+(\.\d+)?$/.test(v))) bad('incident.' + k, 'Write a number, or leave it blank.');
      });
      need('incident.activity', inc.activity);
      var rows = Array.isArray(inc.symptoms) ? inc.symptoms : [];
      var filled = rows.filter(function (r) { return !blankRow(r); });
      if (!filled.length) bad('incident.symptoms.0.text', 'Add at least one symptom, in the order it was seen.');
      rows.forEach(function (r, i) {
        if (!blankRow(r) && !str(r.text)) bad('incident.symptoms.' + i + '.text', 'Write what was observed, or remove the row.');
      });
      (Array.isArray(inc.tried) ? inc.tried : []).forEach(function (r, i) {
        if (blankRow(r)) return;
        if (!str(r.action)) bad('incident.tried.' + i + '.action', 'Write the action, or remove the row.');
        if (!str(r.result)) bad('incident.tried.' + i + '.result', 'Choose Failed, Partial or Worked.');
        else if (OPTIONS.results.indexOf(r.result) === -1) bad('incident.tried.' + i + '.result', 'Choose Failed, Partial or Worked.');
      });
      var endings = OPTIONS.endings(area).map(function (x) { return x.value; });
      if (!str(inc.ending)) bad('incident.ending', 'Choose how it ended.');
      else if (endings.indexOf(inc.ending) === -1) bad('incident.ending', 'Choose one of the endings listed for this segment.');
      var chips = Array.isArray(inc.findings) ? inc.findings.filter(function (x) { return str(x); }) : [];
      if (str(inc.ending) && inc.ending === OPTIONS.tripOut(area) && !chips.length && !str(inc.findingsText))
        bad('incident.findings', 'It ended with ' + inc.ending + ', so record what was found at surface.');
    }
    return out;
  }

  /* The card exactly as it is filed: trimmed text, the type's own fields
     only, empty rows dropped. */
  function buildCard(d) {
    d = d || {};
    var type = str(d.type), c = {
      v: 1, type: type, area: str(d.area),
      location: str(d.location),
      services: (Array.isArray(d.services) ? d.services : []).map(str).filter(function (s) { return s && s !== 'Other'; })
        .filter(function (s, i, a) { return a.indexOf(s) === i; }),
      eventMonth: str(d.eventMonth), customer: str(d.customer), field: str(d.field), wellRef: str(d.wellRef),
      holeSize: str(d.holeSize), formation: str(d.formation), sourceDoc: str(d.sourceDoc), authorRole: str(d.authorRole),
      salesReady: d.salesReady === true,
      sections: {}
    };
    var sec = (d.sections && typeof d.sections === 'object') ? d.sections : {};
    fieldsFor(type).forEach(function (f) {
      c.sections[f.key] = f.kind === 'check' ? sec[f.key] === true : str(sec[f.key]);
    });
    if (type === 'incident') {
      var inc = (d.incident && typeof d.incident === 'object') ? d.incident : {}, out = {};
      incidentFields().forEach(function (f) {
        if (f.kind === 'rows') {
          out[f.key] = (Array.isArray(inc[f.key]) ? inc[f.key] : []).filter(function (r) { return !blankRow(r); })
            .map(function (r) { var o = {}; (f.columns || []).forEach(function (col) { o[col.key] = str(r[col.key]); }); return o; });
        } else if (f.kind === 'chips') {
          out[f.key] = (Array.isArray(inc[f.key]) ? inc[f.key] : []).map(str).filter(Boolean);
        } else out[f.key] = str(inc[f.key]);
      });
      c.incident = out;
      // One month on the card: an incident's event month is its date's,
      // so the two can never contradict each other.
      if (isDay(out.date)) c.eventMonth = out.date.slice(0, 7);
    }
    return c;
  }
  /* The register record a case is filed as (TAQA_STORE.add). opts.resubmitOf
     is the record key of the returned case being filed again: it keeps that
     case's number, revision, type and area (the store's resubmission route). */
  function toRecord(draft, opts) {
    opts = opts || {};
    var st = S(), d = clone(draft || {}) || {};
    var prev = opts.resubmitOf && st ? st.byKey(opts.resubmitOf) : null;
    if (prev) { d.type = prev.docType; d.area = prev.segment; }
    var card = buildCard(d);
    var kw = card.services.slice();
    if (card.location) kw.push(card.location);
    if (card.incident && card.incident.type) kw.push(card.incident.type);
    var rec = {
      docNumber: prev ? prev.docNumber : (st ? st.nextNumber(card.area, card.type) : null),
      title: str(d.title), summary: str(d.summary),
      segment: card.area, docType: card.type, scope: 'area', department: null,
      revision: prev ? prev.revision : '1.0', language: 'en',
      classification: d.classification || (prev && prev.classification) || 'internal',
      numberStatus: 'provisional',
      keywords: kw,
      card: card
    };
    if (prev) rec.resubmitOf = opts.resubmitOf;
    return rec;
  }
  /* file(draft, {resubmitOf}) — validates, then files through TAQA_STORE.add.
     {ok:true, record, entry, url} or {ok:false, error, problems}. */
  function file(draft, opts) {
    opts = opts || {};
    var st = S();
    if (!st) return { ok: false, error: 'RISE could not load the register. Reload the page.', problems: [] };
    var first = canFile();
    if (!first.ok) return { ok: false, error: first.why, problems: [] };
    var d = clone(draft || {}) || {};
    var prev = opts.resubmitOf ? st.byKey(opts.resubmitOf) : null;
    if (opts.resubmitOf) {
      if (!prev || !prev.rejected || prev.status !== 'draft' || !cardOf(prev))
        return { ok: false, error: 'Only a returned case can be filed again.', problems: [] };
      if (!isMine(prev)) return { ok: false, error: 'Only the person who filed a case files it again.', problems: [] };
      var again = st.resubmission ? st.resubmission({ resubmitOf: opts.resubmitOf }) : null;
      if (again && again.problem) return { ok: false, error: again.problem, problems: [] };
      d.type = prev.docType; d.area = prev.segment;
    }
    var problems = validate(d);
    if (problems.length) return { ok: false, error: problems.length === 1 ? '1 field needs attention.' : problems.length + ' fields need attention.', problems: problems };
    var who = canFile(d.area);
    if (!who.ok) return { ok: false, error: who.why, problems: [] };
    var rec = toRecord(d, opts);
    var why = st.checkFiling(rec);
    if (why) return { ok: false, error: why, problems: [] };
    var row = st.add(rec);
    if (!row) return { ok: false, error: st.writeError() || st.checkFiling(rec) || 'The case was not filed. Nothing was saved.', problems: [] };
    return { ok: true, record: row, entry: fromRecord(row), url: caseUrl(row), problems: [] };
  }
  /* The form's content for editing a returned case (case-new.html?edit=key):
     the card plus title, summary and classification, or null when this
     person may not file it again. */
  /* May the signed-in person file this returned case again now? Only its
     filer, and only while no later attempt of it is in progress or in force:
     the register's own resubmission rule (TAQA_STORE.resubmission), so the
     library, the case page and the form all give the same answer. */
  function canResubmit(e) {
    var st = S();
    if (!e || e.status !== 'returned' || !e.mine || !e.record || !st || !st.resubmission) return false;
    var again = st.resubmission({ resubmitOf: e.key });
    if (!again || again.problem) return false;
    return !!draftFrom(e.key);
  }
  function draftFrom(key) {
    var st = S(), d = st ? st.byKey(key) : null;
    if (!d || !cardOf(d) || !isMine(d)) return null;
    var c = clone(d.card) || {};
    c.title = d.title || ''; c.summary = d.summary || ''; c.classification = d.classification || 'internal';
    c.type = d.docType; c.area = d.segment;
    return c;
  }

  /* ── Drafts in this browser (case-new.html) ─────────────────────────────
     localStorage 'taqa-case-drafts-v1' = { "<identity>": [ {id, savedAt, draft} ] },
     one list per simulated person (TAQA_ROLE.identity()), newest first, at
     most 20 each. A draft is never a filing: nothing here reaches the
     register, and it lives only in this browser. */
  var DRAFT_KEY = 'taqa-case-drafts-v1', DRAFT_MAX = 20;
  function readDrafts() {
    try {
      var o = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
      return (o && typeof o === 'object' && !Array.isArray(o)) ? o : {};
    } catch (e) { return {}; }
  }
  var drafts = {
    KEY: DRAFT_KEY,
    list: function () {
      var l = readDrafts()[me() || 'anon'];
      return Array.isArray(l) ? l.filter(function (x) { return x && x.id; }).sort(function (a, b) {
        return (a.savedAt || '') < (b.savedAt || '') ? 1 : -1;
      }) : [];
    },
    get: function (id) { return drafts.list().filter(function (x) { return x.id === id; })[0] || null; },
    // Returns the draft's id, or null when the browser would not store it.
    save: function (draft, id) {
      var all = readDrafts(), who = me() || 'anon', list = Array.isArray(all[who]) ? all[who] : [];
      id = id || ('D-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase());
      list = list.filter(function (x) { return x && x.id !== id; });
      list.unshift({ id: id, savedAt: new Date().toISOString(), draft: clone(draft || {}) || {} });
      all[who] = list.slice(0, DRAFT_MAX);
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(all)); return id; } catch (e) { return null; }
    },
    remove: function (id) {
      var all = readDrafts(), who = me() || 'anon';
      if (!Array.isArray(all[who])) return false;
      all[who] = all[who].filter(function (x) { return x && x.id !== id; });
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(all)); return true; } catch (e) { return false; }
    }
  };

  /* ── Export ───────────────────────────────────────────────────────────── */
  /* toJSON(entry) is also the shipped shape (cases-data.js): an export can
     be pasted into TAQA_CASES_SHIPPED as it is. A register case has no
     shipped id of its own, so the export suggests one from its number and
     revision (letters, digits and hyphens); change it if the owner keeps
     another scheme. The extra fields (schema, status...) are ignored there. */
  function shippedIdFor(e) {
    var base = [e.docNumber, e.rev ? 'R' + e.rev : ''].filter(Boolean).join('-');
    return String(base || 'CASE').replace(/[^A-Za-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  function toJSON(e) {
    if (!e) return null;
    var r = e.record || {};
    return {
      schema: 'taqa-field-case/1',
      exportedAt: new Date().toISOString(),
      source: e.source, id: e.id || shippedIdFor(e),
      docNumber: e.docNumber || null, revision: e.rev || null,
      title: e.title, summary: e.summary,
      area: e.area, areaName: e.areaName,
      type: e.type, typeLabel: e.typeLabel,
      status: e.status, statusLabel: e.statusLabel, released: e.released,
      classification: e.classification,
      approvedDate: r.approvedDate || null, issueDate: r.issueDate || null,
      nextReviewDate: r.nextReviewDate || null, publishedDate: e.publishedDate || r.issueDate || null,
      card: clone(e.card)
    };
  }
  function fileName(e, ext) {
    var base = (e && (e.docNumber || e.id)) || 'field-case';
    return String(base).replace(/[^A-Za-z0-9&._-]+/g, '-').replace(/&/g, 'and') + '.' + ext;
  }

  var CARD_CSS =
    '*{box-sizing:border-box}body{margin:0;background:#F4F4F3;color:#1E1C1A;font:15px/1.55 Inter,"Segoe UI",system-ui,sans-serif}' +
    'article{max-width:820px;margin:24px auto;background:#fff;border:1px solid #D9D5D0;border-radius:14px;padding:28px 32px}' +
    '.k{margin:0 0 6px;font:700 11px/1.3 Inter,system-ui,sans-serif;letter-spacing:1.2px;text-transform:uppercase;color:#005D63}' +
    'h1{margin:0 0 6px;font:800 26px/1.2 BwGradual,Inter,system-ui,sans-serif;letter-spacing:-.3px}' +
    '.n{margin:0 0 16px;color:#5F564F;font-size:13.5px;font-variant-numeric:tabular-nums}' +
    '.chip{display:inline-block;padding:1px 8px;border-radius:999px;border:1px solid #BEB8B2;font-size:12px;font-weight:600;color:#3D3833;margin:0 4px 4px 0}' +
    '.chip.t{background:#E7F3F3;border-color:#E7F3F3;color:#005D63}' +
    '.sum{margin:0 0 18px;font-size:15.5px}' +
    'dl{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px 18px;margin:0 0 22px;padding:14px 16px;background:#F7F6F4;border-radius:10px}' +
    'dt{font:700 10.5px/1.3 Inter,system-ui,sans-serif;letter-spacing:.8px;text-transform:uppercase;color:#5F564F}dd{margin:2px 0 0;font-weight:600;overflow-wrap:anywhere}' +
    'h2{margin:22px 0 8px;font:700 17px/1.3 BwGradual,Inter,system-ui,sans-serif;color:#1E1C1A;border-top:1px solid #E5E1DC;padding-top:16px}' +
    'h3{margin:12px 0 4px;font-size:13px;font-weight:700;color:#5F564F}p.v{margin:0 0 8px;white-space:pre-wrap;overflow-wrap:anywhere}' +
    'ol.tl{margin:0;padding-left:22px}ol.tl li{margin:0 0 6px}.tm{font-weight:700;font-variant-numeric:tabular-nums;color:#005D63}' +
    'table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:7px 8px;border-bottom:1px solid #E5E1DC;vertical-align:top}th{font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:#5F564F}' +
    '.hyp{border-left:3px solid #BEB8B2;padding:8px 12px;background:#F7F6F4;border-radius:0 8px 8px 0}' +
    'footer{margin-top:26px;padding-top:12px;border-top:1px solid #E5E1DC;font-size:12.5px;color:#5F564F}' +
    '@media print{body{background:#fff}article{border:0;margin:0;max-width:none;padding:0}h2{break-after:avoid}}';

  function htmlCard(e) {
    if (!e) return '';
    var c = e.card || {}, sec = c.sections || {}, inc = c.incident || null;
    function fact(label, v) { return str(v) ? '<div><dt>' + esc(label) + '</dt><dd>' + esc(v) + '</dd></div>' : ''; }
    function block(label, v) { return str(v) ? '<h3>' + esc(label) + '</h3><p class="v">' + esc(v) + '</p>' : ''; }
    var facts = [
      fact('Client', c.customer), fact('Well / rig', c.wellRef), fact('Field / area', c.field),
      fact('Hole size', holeLabel(c.holeSize)), fact('Formation / interval', c.formation),
      fact('Service / tool', (c.services || []).join(', ')),
      inc ? fact('Equipment', inc.equipment) : '',
      inc ? fact('Incident date', inc.date) : fact('Event month', c.eventMonth),
      inc ? fact('Depth at onset', str(inc.depthFt) ? inc.depthFt + ' ft MD' : '') : '',
      inc ? fact('Mud or fluid', inc.mud) : '',
      inc ? fact('NPT', str(inc.nptHr) ? inc.nptHr + ' hr' : '') : '',
      fact('Type', e.typeLabel), fact('Source document', c.sourceDoc), fact('Location', c.location),
      fact('Class', String(e.classification || '').toUpperCase()), fact('Author', c.authorRole)
    ].join('');
    var body = '';
    var secs = fieldsFor(e.type).filter(function (f) { return f.kind !== 'check'; });
    if (secs.length) body += '<h2>' + esc(e.typeLabel) + '</h2>' + secs.map(function (f) { return block(f.label, sec[f.key]); }).join('');
    if (e.type === 'appreciation') body += '<p class="v">' + (sec.shareAgreed === true ? 'The customer agreed this can be shared.' : 'The customer has not confirmed this can be shared.') + '</p>';
    if (inc) {
      body += '<h2>1. The incident</h2>' + block('Incident type', inc.type) + block('Time first noticed', inc.timeNoticed);
      body += '<h2>2. What was happening</h2>' + block('Activity when it started', inc.activity) + block('Ongoing activity', inc.ongoing) + block('Conditions', inc.conditions);
      var sy = Array.isArray(inc.symptoms) ? inc.symptoms : [];
      body += '<h2>3. Symptoms, in order</h2>' + (sy.length ? '<ol class="tl">' + sy.map(function (r) {
        return '<li>' + (str(r.time) ? '<span class="tm">' + esc(r.time) + '</span> ' : '') +
          (str(r.tag) ? '<span class="chip">' + esc(r.tag) + '</span> ' : '') + esc(r.text) + '</li>';
      }).join('') + '</ol>' : '<p class="v">None recorded.</p>');
      var tr = Array.isArray(inc.tried) ? inc.tried : [];
      body += '<h2>4. What was tried</h2>' + (tr.length ? '<table><thead><tr><th>Action</th><th>Result</th><th>Note</th></tr></thead><tbody>' +
        tr.map(function (r) { return '<tr><td>' + esc(r.action) + '</td><td><span class="chip">' + esc(r.result) + '</span></td><td>' + esc(r.note) + '</td></tr>'; }).join('') +
        '</tbody></table>' : '<p class="v">None recorded.</p>');
      var hint = endingHint(e.area, inc.ending);
      body += '<h2>5. How it ended</h2><p class="v"><span class="chip t">' + esc(inc.ending) + '</span>' + (hint ? ' ' + esc(hint) : '') + '</p>';
      var fd = Array.isArray(inc.findings) ? inc.findings : [];
      body += '<h2>6. Findings at surface</h2>' + (fd.length ? '<p class="v">' + fd.map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join('') + '</p>' : '') +
        block('What was found', inc.findingsText) + (!fd.length && !str(inc.findingsText) ? '<p class="v">None recorded.</p>' : '') +
        (str(inc.cause) ? '<h3>Suspected cause: hypothesis, not a finding</h3><p class="v hyp">' + esc(inc.cause) + '</p>' : '') +
        (str(inc.contact) ? block('Contact for follow-up questions', inc.contact) : '');
    }
    var stamp = today();
    return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>' + esc(e.title) + (e.docNumber ? ' · ' + esc(e.docNumber) : '') + '</title><style>' + CARD_CSS + '</style></head><body><article>' +
      '<p class="k">' + esc(e.typeLabel) + ' · ' + esc(e.areaName) + '</p>' +
      '<h1>' + esc(e.title) + '</h1>' +
      '<p class="n">' + esc([e.docNumber, e.revLabel, e.statusLabel].filter(Boolean).join(' · ')) + '</p>' +
      (e.salesReady ? '<p><span class="chip t">Sales-ready</span></p>' : '') +
      '<p class="sum">' + esc(e.summary) + '</p>' +
      (facts ? '<dl>' + facts + '</dl>' : '') + body +
      '<footer>Exported from RISE on ' + esc(stamp) + '. ' + esc(e.statusLabel || '') + '. Classification ' +
      esc(String(e.classification || 'internal').toUpperCase()) + ': handle as RISE requires. ' +
      (e.source === 'shipped' ? 'Published case supplied for the library.' : 'Register record ' + esc(e.docNumber) + ' ' + esc(e.revLabel) + '.') +
      '</footer></article></body></html>';
  }

  function onChange(fn) {
    if (typeof fn !== 'function') return;
    if (S()) S().onChange(fn); else { try { fn({ action: 'init' }); } catch (e) {} }
    try { root.addEventListener('taqa:role-changed', function () { try { fn({ action: 'role' }); } catch (e) {} }); } catch (e) {}
  }

  var labelFor = {
    type: typeLabel, area: areaName, status: statusLabel, field: labelOf, ending: endingHint,
    hole: holeLabel, group: function (k) { var g = GROUPS.filter(function (x) { return x.key === k; })[0]; return g ? g.label : ''; }
  };

  root.TAQA_CASES = {
    TYPES: TYPES, OPTIONS: OPTIONS, GROUPS: GROUPS, FIELDS: F(),
    INCIDENT_RULES: F().incidentRules || '',
    FIELD_CASE_ROLE: FIELD_CASE_ROLE,
    isCaseType: isCaseType, operational: operational, isOperational: operationalArea,
    all: all, released: released, mine: mine, forArea: forArea, match: match, get: get, byKey: byKey,
    canView: canView, canFile: canFile, isReviewer: isReviewer, groupOf: groupOf,
    validate: validate, buildCard: buildCard, toRecord: toRecord, file: file, draftFrom: draftFrom, canResubmit: canResubmit,
    nextAttempt: nextAttempt,
    drafts: drafts,
    labelFor: labelFor, typeLabel: typeLabel, areaName: areaName, statusLabel: statusLabel,
    holeNumber: holeNumber, holeLabel: holeLabel, holeText: holeText,
    toJSON: toJSON, htmlCard: htmlCard, fileName: fileName,
    caseUrl: caseUrl, esc: esc, onChange: onChange
  };
})(typeof window !== 'undefined' ? window : this);
