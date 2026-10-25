/* RISE Recognition (demo)
   ─────────────────────────────────────────────────────────────────────────
   People earn points only for work that passed the controlled-document
   route: a document they filed that QMS checked and the approver released.
   Uploading alone never earns anything, so the levels cannot be climbed with
   duplicates or rushed files, and a returned or rejected filing earns 0 (it
   never takes points away).

     a document released                                  10
       (a field case counts as a document: case study,
        pre-job plan, appreciation, best practice, field
        profile, benchmark, expert / training)
     a new revision of a document that was overdue        15
     a Lesson Learned, incident card or Technical Alert
       released (document or field case)                  20

   Levels: Contributor 10, Practitioner 50, Specialist 150, Expert 300,
   Knowledge Champion 600.

   Everything here is read from the register (TAQA_STORE.all()); nothing in
   the approval workflow is changed. The person is the prototype's simulated
   identity (TAQA_ROLE.identity()), so in this demo the points live in this
   browser. The shipped register carries no filer, so each area also shows a
   few clearly labelled example entries, kept apart from the register: they
   never count in the register, the queues or the document totals.

   PRODUCTION: points are computed by the back end from the same release
   events, keyed by the person's Entra ID object id, so they are the same on
   every device. Whether a level links to appraisal is HR's decision. */
(function (root) {
  'use strict';
  // TAQA_ROLE is a top-level const in roles.js, so it is not a window property.
  if (typeof root.TAQA_STORE === 'undefined' || typeof TAQA_ROLE === 'undefined') return;

  var LEVELS = [
    { key: 'contributor',  name: 'Contributor',        min: 10 },
    { key: 'practitioner', name: 'Practitioner',       min: 50 },
    { key: 'specialist',   name: 'Specialist',         min: 150 },
    { key: 'expert',       name: 'Expert',             min: 300 },
    { key: 'champion',     name: 'Knowledge Champion', min: 600 }
  ];
  var POINTS = { document: 10, overdue: 15, lesson: 20 };
  var KIND_LABEL = { document: 'Document released', overdue: 'Overdue document brought up to date', lesson: 'Lesson, incident or alert released' };
  // QMS checks documents and an auditor only reads, so neither files work
  // that can be released under their own name in this demo.
  var EARNERS = ['employee', 'owner', 'maintenance'];
  var PREF_KEY = 'taqa-recognition-v1';
  var LIVE = ['current', 'under-review', 'superseded'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function today() { return TAQA_STORE.localDay(); }
  function monthOf(day) { return String(day || '').slice(0, 7); }
  function thisMonth() { return monthOf(today()); }
  function lookups() { return (typeof TAQA_DOC_LOOKUPS !== 'undefined' && TAQA_DOC_LOOKUPS.segments) || {}; }
  function areaName(id) { var a = lookups()[id]; return a ? a.name : String(id || ''); }

  /* ── Levels ─────────────────────────────────────────────────────────── */
  function levelFor(points) {
    var i = -1;
    LEVELS.forEach(function (l, k) { if (points >= l.min) i = k; });
    var next = LEVELS[i + 1] || null;
    return { index: i, level: i >= 0 ? LEVELS[i] : null, next: next, toNext: next ? next.min - points : 0 };
  }

  /* ── Preferences: hide my name, last level announced ────────────────── */
  function prefs() {
    try { var p = JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); return p && typeof p === 'object' ? p : {}; }
    catch (e) { return {}; }
  }
  function savePrefs(p) { try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (e) {} }
  function isHidden(id) { var h = prefs().hidden || {}; return !!h[id]; }
  function setHidden(id, on) {
    var p = prefs(); p.hidden = p.hidden || {};
    if (on) p.hidden[id] = true; else delete p.hidden[id];
    savePrefs(p);
  }

  /* ── Who is who ─────────────────────────────────────────────────────── */
  function me() { return TAQA_ROLE.identity(); }
  function roleOf(id) { var m = /^sim:([a-z]+)/.exec(String(id || '')); return m ? m[1] : null; }
  function canEarn(id) { return EARNERS.indexOf(roleOf(id || me())) !== -1; }
  // A simulated identity named the way the rest of RISE names it.
  function labelFor(id) {
    var m = /^sim:([a-z]+)(?:@(.+))?$/.exec(String(id || ''));
    if (!m) return 'A colleague';
    var role = m[1], area = m[2];
    if (role === 'owner') return TAQA_ROLE.areaTitle(area) + ', ' + areaName(area);
    if (role === 'maintenance') return 'Maintenance Manager, ' + areaName(area);
    if (role === 'qms') return 'QMS';
    if (role === 'auditor') return 'External Auditor';
    return 'Employee';
  }

  /* ── What counts ────────────────────────────────────────────────────── */
  // Released means approved and in force (or in force and later replaced or
  // withdrawn). Approved for a later date is not yet released.
  function released(d) {
    if (!d || !d.submittedById || d.rejected || d.cancelled || !d.approvedAt) return false;
    if (LIVE.indexOf(d.status) !== -1) return true;
    return d.status === 'obsolete' && LIVE.indexOf(d.withdrawnFromStatus) !== -1;
  }
  // The store records, at approval, whether the revision in force was past
  // its review then (replacedOverdue). It is never recomputed here, so later
  // edits to the old revision's review fields do not change past points.
  function kindOf(d) {
    if (d.docType === 'lesson' || d.docType === 'alert' || d.docType === 'incident') return 'lesson';
    // The other field case types earn as a document, whatever they replaced.
    var t = (typeof TAQA_DOC_LOOKUPS !== 'undefined' && TAQA_DOC_LOOKUPS.types[d.docType]) || {};
    if (t.cardOnly) return 'document';
    if (!d.translationOf && d.replacedOverdue === true) return 'overdue';
    return 'document';
  }
  function liveContributions() {
    var rows;
    try { rows = TAQA_STORE.all(); } catch (e) { return []; }
    return rows.filter(released).map(function (d) {
      var kind = kindOf(d);
      return {
        who: d.submittedById, key: TAQA_STORE.recordKey(d), doc: d,
        docNumber: d.docNumber, revision: d.revision, segment: d.segment,
        kind: kind, points: POINTS[kind], day: d.issueDate || TAQA_STORE.localDay(d.approvedAt)
      };
    });
  }
  function contributions(id) {
    var who = id || me();
    return liveContributions().filter(function (c) { return c.who === who; })
      .sort(function (a, b) { return a.day < b.day ? 1 : a.day > b.day ? -1 : 0; });
  }
  function sum(list) { return list.reduce(function (n, c) { return n + c.points; }, 0); }
  function pointsOf(id) { return sum(contributions(id)); }

  /* ── Example history ────────────────────────────────────────────────────
     Made-up job titles with a letter, never a person's name, and always
     marked "Example" wherever they show. Stable for each area, and always
     "this month", so the lists look lived-in on any date. */
  var EX_TITLES = {
    segment:  ['Field Engineer', 'Operations Supervisor', 'Maintenance Technician', 'Quality Engineer', 'Technical Trainer'],
    'function': ['Specialist', 'Senior Advisor', 'Coordinator', 'Analyst'],
    product:  ['Product Engineer', 'Application Specialist', 'Technical Lead']
  };
  // How busy an area's examples are follows how many documents it really
  // holds, so Drilling (68) is busier than an area with three.
  var EX_PEOPLE = [1, 3, 4, 5];
  var EX_PAST = [[10], [60, 20, 0], [150, 60, 20, 0], [320, 140, 60, 20, 0]];
  var SIZE = null;
  function areaSize(id) {
    if (!SIZE) {
      SIZE = {};
      try { TAQA_MASTER_DOCS.forEach(function (d) { SIZE[d.segment] = (SIZE[d.segment] || 0) + 1; }); } catch (e) {}
    }
    return SIZE[id] || 0;
  }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; }
  function examples(areaId) {
    var a = lookups()[areaId];
    if (!a || !EX_TITLES[a.group]) return [];
    var size = areaSize(areaId), tier = size >= 50 ? 3 : size >= 30 ? 2 : size >= 10 ? 1 : 0;
    var h = hash(areaId), titles = EX_TITLES[a.group], past = EX_PAST[tier], n = EX_PEOPLE[tier];
    var out = [];
    for (var i = 0; i < n; i++) {
      var docs = (h >>> (i * 3)) % 3 + (tier >= 2 ? 1 : 0) + (tier === 3 && i < 2 ? 1 : 0);
      var overdue = tier >= 1 ? (h >>> (i * 3 + 7)) % 2 : 0, lessons = tier >= 1 ? (h >>> (i * 2 + 13)) % 2 : 0;
      if (tier === 0) docs = 1;
      if (i === 0 && docs + overdue + lessons === 0) docs = 2;
      var month = docs * POINTS.document + overdue * POINTS.overdue + lessons * POINTS.lesson;
      out.push({
        id: 'example:' + areaId + ':' + i, example: true, area: areaId,
        label: titles[(h + i) % titles.length] + ' ' + 'ABCDE'.charAt(i),
        monthPoints: month, breakdown: { document: docs, overdue: overdue, lesson: lessons },
        total: month + (past[i] || 0) + ((h >>> i) % 5) * 10
      });
    }
    return out;
  }

  /* ── Lists ──────────────────────────────────────────────────────────── */
  // Who earned what in one area this month: examples plus real releases.
  function board(areaId, month) {
    var mon = month || thisMonth(), self = me();
    var live = liveContributions(), people = {};
    live.forEach(function (c) {
      if (c.segment !== areaId || monthOf(c.day) !== mon) return;
      var p = people[c.who] || (people[c.who] = { id: c.who, example: false, monthPoints: 0, breakdown: { document: 0, overdue: 0, lesson: 0 } });
      p.monthPoints += c.points; p.breakdown[c.kind]++;
    });
    var rows = Object.keys(people).map(function (id) {
      var p = people[id], you = id === self, hidden = isHidden(id);
      p.you = you; p.hidden = hidden;
      p.label = you ? (hidden ? 'You (name hidden from others)' : 'You, ' + labelFor(id))
                    : (hidden ? 'A colleague (name hidden)' : labelFor(id));
      p.total = sum(live.filter(function (c) { return c.who === id; }));
      return p;
    }).concat(examples(areaId));
    rows.forEach(function (r) { r.level = levelFor(r.total).level; });
    return rows.filter(function (r) { return r.monthPoints > 0; })
      .sort(function (a, b) { return b.monthPoints - a.monthPoints || b.total - a.total || (a.label < b.label ? -1 : 1); });
  }
  // Points per area this month. Real releases and example points are kept
  // apart, and areas rank on real work first, so made-up points never put
  // one team above another.
  function byArea(month) {
    var L = lookups();
    return Object.keys(L).map(function (id) {
      var rows = board(id, month), real = 0, ex = 0;
      rows.forEach(function (r) { if (r.example) ex += r.monthPoints; else real += r.monthPoints; });
      return { id: id, name: L[id].name, real: real, example: ex, points: real + ex, people: rows.length,
               examples: rows.filter(function (r) { return r.example; }).length };
    }).filter(function (a) { return a.points > 0; })
      .sort(function (a, b) { return b.real - a.real || b.example - a.example || (a.name < b.name ? -1 : 1); });
  }

  /* ── Shared bits of page ────────────────────────────────────────────── */
  var MEDAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 3h9l-2.6 5.2"/><path d="M9.6 8.2 7.5 3"/><circle cx="12" cy="14.5" r="5.5"/><path d="m12 11.9.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z"/></svg>';
  var css = document.createElement('style');
  css.textContent =
    /* Level badge: beside the role control on the desktop bar. It hides with
       the role control at 1280px and below, where the phone menu carries it. */
    '#navbar .rise-lvl{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 11px 0 8px;border-radius:999px;' +
      'border:1px solid var(--tb-rule,rgba(117,106,97,.22));color:var(--tb-text,#1E1C1A);text-decoration:none;white-space:nowrap;flex:none;' +
      'font:600 12.5px/1 "Inter",system-ui,sans-serif;font-variant-numeric:tabular-nums;}' +
    '#navbar .rise-lvl:hover{background:var(--tb-hover,rgba(0,93,99,.06));}' +
    '#navbar .rise-lvl:focus-visible{outline:2px solid var(--tb-ink,#005D63);outline-offset:2px;}' +
    '#navbar .rise-lvl svg{width:17px;height:17px;color:var(--tb-ink,#005D63);flex:none;}' +
    '#navbar .rise-lvl .rlv-pts{font-weight:500;color:var(--tb-muted,#756A61);}' +
    '#navbar .rise-lvl .rlv-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;}' +
    '@media (max-width:1499px){#navbar .rise-lvl .rlv-pts{display:none;}}' +
    '@media (max-width:1280px){#navbar .rise-lvl{display:none!important;}}' +
    /* Phone menu row */
    '.nav-mobile-menu .mm-main a.mm-rise .mm-rise-l{margin-inline-start:auto;font-size:13px;font-weight:500;color:var(--tb-muted,#756A61);white-space:nowrap;}' +
    /* Level-up note: its own region, never taking focus or taps, and never
       over the bar, the bell or the menu. */
    '#rise-note{position:fixed;left:16px;right:16px;margin-inline:auto;width:max-content;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:9000;pointer-events:none;' +
      'max-width:calc(100vw - 32px);display:flex;align-items:center;gap:10px;padding:11px 16px;border-radius:14px;' +
      'background:#00474C;color:#fff;box-shadow:0 14px 34px -14px rgba(0,40,44,.55);font:500 14px/1.35 "Inter",system-ui,sans-serif;' +
      'opacity:0;transition:opacity .25s ease,transform .25s ease;}' +
    '#rise-note.on{opacity:1;transform:translateY(-4px);}' +
    '#rise-note[hidden]{display:none;}' +
    '#rise-note svg{width:22px;height:22px;flex:none;color:#7FE0DB;}' +
    '#rise-note b{font-weight:700;}' +
    'html.taqa-menu-open #rise-note{display:none;}' +
    '@media (prefers-reduced-motion:reduce){#rise-note{transition:none;}}' +
    /* Area page strip */
    '.rise-top{margin:0 0 24px;padding:12px 16px;border:1px solid var(--glass-border,rgba(0,0,0,.09));border-radius:12px;background:var(--glass,#fff);' +
      'display:flex;flex-wrap:wrap;align-items:center;gap:8px 18px;min-width:0;}' +
    '.rise-top[hidden]{display:none!important;}' +
    '.rise-top-h{display:flex;align-items:center;gap:8px;font:700 10px/1.2 "Inter",system-ui,sans-serif;letter-spacing:1.3px;text-transform:uppercase;color:var(--text-light,#756A61);margin:0;}' +
    '.rise-top-h svg{width:16px;height:16px;color:var(--primary-ink,#005D63);}' +
    '.rise-top-l{display:flex;flex-wrap:wrap;gap:6px 16px;list-style:none;margin:0;padding:0;min-width:0;flex:1 1 280px;}' +
    '.rise-top-l li{display:flex;align-items:baseline;gap:6px;min-width:0;font-size:13px;color:var(--text,#1E1C1A);}' +
    '.rise-top-l .rk{font-weight:700;color:var(--primary-ink,#005D63);font-variant-numeric:tabular-nums;}' +
    '.rise-top-l .nm{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px;}' +
    '.rise-top-l .pt{color:var(--text-muted,#756A61);font-variant-numeric:tabular-nums;white-space:nowrap;}' +
    '.rise-ex{display:inline-block;padding:1px 6px;border-radius:999px;border:1px solid var(--glass-border,rgba(0,0,0,.12));font:600 9.5px/1.4 "Inter",system-ui,sans-serif;letter-spacing:.4px;text-transform:uppercase;color:var(--text-muted,#756A61);}' +
    '.rise-top-all{margin-inline-start:auto;font-size:13px;font-weight:600;color:var(--primary-ink,#005D63);text-decoration:none;white-space:nowrap;}' +
    '.rise-top-all:hover{text-decoration:underline;}' +
    'html.seg-unknown .rise-top{display:none!important;}' +
    '@media print{.rise-top,#rise-note{display:none!important;}}';
  document.head.appendChild(css);

  function badgeText(id) {
    var pts = pointsOf(id), lv = levelFor(pts);
    return { pts: pts, lv: lv, name: lv.level ? lv.level.name : 'No level yet' };
  }

  // Desktop: a small badge after the role control, opening My contributions.
  function paintBadge() {
    var id = me(), bar = document.querySelector('#navbar .nav-right');
    var old = document.getElementById('rise-lvl');
    if (!bar || !canEarn(id)) { if (old) old.remove(); return; }
    var t = badgeText(id), a = old || document.createElement('a');
    a.id = 'rise-lvl'; a.className = 'rise-lvl'; a.href = 'recognition.html';
    // The name is the visible text plus a hidden ending, so a voice user
    // can say what they see (WCAG 2.5.3).
    a.removeAttribute('aria-label');
    a.title = t.name + ' · ' + t.pts + ' points' + (t.lv.next ? ' · ' + t.lv.toNext + ' to ' + t.lv.next.name : '');
    a.innerHTML = MEDAL + '<span class="rlv-name">' + esc(t.name) + '</span><span class="rlv-pts">' + t.pts + ' pts</span>' +
      '<span class="rlv-sr">, your level. Open My contributions</span>';
    if (!old) {
      var door = document.getElementById('taqa-door');
      if (door && door.parentNode === bar) bar.insertBefore(a, door.nextSibling);
      else bar.insertBefore(a, bar.firstChild);
    }
  }
  // Phone: one row in the menu's main list, for every role. People who earn
  // see their level on it.
  function paintMenu() {
    var main = document.querySelector('#nav-mobile-menu .mm-main');
    if (!main) return;
    var id = me(), a = document.getElementById('mm-rise') || document.createElement('a');
    a.id = 'mm-rise'; a.className = 'mm-rise'; a.href = 'recognition.html';
    if (/recognition\.html$/.test(location.pathname)) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); }
    var t = canEarn(id) ? badgeText(id) : null;
    a.innerHTML = '<span>' + (t ? 'My contributions' : 'Contributions') + '</span>' +
      (t ? '<span class="mm-rise-l">' + esc(t.lv.level ? t.lv.level.name : 'No level yet') + ' · ' + t.pts + ' pts</span>' : '');
    if (!a.parentNode) main.appendChild(a);
  }

  // Area pages: the top three this month, with a way to the full list.
  function paintArea() {
    var box = document.getElementById('rise-top');
    if (!box) return;
    var id = new URLSearchParams(location.search).get('id') || 'drilling';
    if (!lookups()[id] || document.documentElement.classList.contains('seg-unknown')) { box.hidden = true; return; }
    var rows = board(id).slice(0, 3);
    if (!rows.length) { box.hidden = true; return; }
    box.innerHTML =
      '<h2 class="rise-top-h" id="rise-top-h">' + MEDAL + 'Top contributors this month</h2>' +
      '<ol class="rise-top-l">' + rows.map(function (r, i) {
        return '<li><span class="rk">' + (i + 1) + '</span><span class="nm">' + esc(r.label) + '</span>' +
               (r.example ? '<span class="rise-ex">Example</span>' : '') +
               '<span class="pt">' + r.monthPoints + ' pts</span></li>';
      }).join('') + '</ol>' +
      '<a class="rise-top-all" href="recognition.html?area=' + encodeURIComponent(id) + '#board">See all</a>';
    box.hidden = false;
  }

  // Released while you were away: the filer is never the person who
  // releases, so a new level is announced the next time the filer opens RISE.
  function checkLevelUp() {
    var id = me();
    if (!canEarn(id)) return;
    var p = prefs(), seen = p.seen || {}, pts = pointsOf(id);
    var before = Object.prototype.hasOwnProperty.call(seen, id) ? seen[id] : null;
    seen[id] = pts; p.seen = seen; savePrefs(p);
    if (before == null) return;                      // first visit: nothing to announce
    var was = levelFor(before), now = levelFor(pts);
    if (now.index > was.index && now.level) showNote(now.level, pts);
  }
  // The live region goes in empty and gets its words a moment later, so
  // screen readers hear them. Nothing starts until the page is on screen
  // (requestAnimationFrame waits for a background tab to be shown), and once
  // it fades the note leaves the page's reading order.
  function showNote(level, pts) {
    var n = document.getElementById('rise-note');
    if (!n) {
      n = document.createElement('div');
      n.id = 'rise-note'; n.setAttribute('role', 'status'); n.setAttribute('aria-live', 'polite');
      document.body.appendChild(n);
    }
    clearTimeout(showNote.t);
    n.hidden = false; n.classList.remove('on'); n.textContent = '';
    requestAnimationFrame(function () {
      showNote.t = setTimeout(function () {
        n.innerHTML = MEDAL + '<span>You reached <b>' + esc(level.name) + '</b> · ' + pts + ' points</span>';
        n.classList.add('on');
        showNote.t = setTimeout(function () {
          n.classList.remove('on');
          showNote.t = setTimeout(function () { n.hidden = true; n.textContent = ''; }, 300);
        }, 6000);
      }, 100);
    });
  }

  function paintAll() { paintBadge(); paintMenu(); paintArea(); }

  root.TAQA_RECOGNITION = {
    LEVELS: LEVELS, POINTS: POINTS, KIND_LABEL: KIND_LABEL,
    levelFor: levelFor, pointsOf: pointsOf, contributions: contributions, board: board, byArea: byArea,
    examples: examples, canEarn: canEarn, labelFor: labelFor, me: me, thisMonth: thisMonth,
    isHidden: isHidden, setHidden: function (on) { setHidden(me(), on); paintAll(); }, MEDAL: MEDAL, esc: esc
  };

  // The phone menu already exists (shared.js builds it as it loads); the
  // role control is built at DOMContentLoaded, and this listener runs after
  // it, so the bar settles once.
  paintMenu();
  function start() {
    paintAll(); checkLevelUp();
    try { TAQA_STORE.onChange(paintAll); } catch (e) {}
    root.addEventListener('taqa:role-changed', paintAll);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(typeof window !== 'undefined' ? window : this);
