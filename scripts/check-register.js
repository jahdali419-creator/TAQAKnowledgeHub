/* Register integrity checker (PI-53, docs/QA/PRODUCT-INTEGRITY-AUDIT.md).
 *
 * Reads a register (an array of document records in TAQA_MASTER_DOCS shape)
 * and reports every place it breaks the document-control rules in
 * BUSINESS-RULES.md §8 and §16. It never changes the data.
 *
 * Two kinds of finding:
 *   integrity     the register contradicts itself (two revisions in force, a
 *                 number used twice, a successor or source that does not
 *                 exist). New ones must never be introduced.
 *   data-quality  the record is incomplete or provisional (a placeholder or
 *                 provisional number, a revision with no recorded
 *                 predecessor). Corrected by QMS, not by code.
 *
 * Findings in the shipped register when this checker was written are listed
 * in scripts/register-baseline.json as KNOWN legacy issues: the QMS cleanup
 * report lists them for correction, and the CI gate fails only on a finding
 * that is not in the baseline (a NEW problem). The baseline is never edited
 * to make a new problem pass; an entry is removed once QMS has fixed it.
 *
 *   node scripts/check-register.js            summary, exit 1 on new findings
 *   node scripts/check-register.js --report   also writes docs/QA/REGISTER-CLEANUP-REPORT.md
 *   node scripts/check-register.js --baseline prints the current findings as a baseline (review before saving)
 *
 * In the browser the same rules are available as TAQA_REGISTER_CHECK.check(records),
 * so a test can run them over the live register after a workflow.
 */
(function (root) {
  'use strict';

  var LIVE = { current: 1, 'under-review': 1 };
  var STATUSES = { current: 1, 'under-review': 1, draft: 1, superseded: 1, obsolete: 1, asset: 1 };

  function norm(r) { return String(r == null ? '' : r).trim().toLowerCase().replace(/^rev\s+/, '').replace(/^v/, ''); }
  function major(r) { var m = norm(r).match(/^(\d+)/); return m ? parseInt(m[1], 10) : null; }
  function revLabel(r) { return r == null || r === '' ? '(none)' : String(r); }

  function check(records, lookups) {
    var out = [];
    var types = (lookups && lookups.types) || null, segs = (lookups && lookups.segments) || null;
    function add(kind, code, d, message, extra) {
      out.push({ kind: kind, code: code, docNumber: d ? (d.docNumber || null) : null,
                 revision: d ? (d.revision == null ? null : String(d.revision)) : null,
                 title: d ? (d.title || '') : '', segment: d ? (d.segment || null) : null, message: message,
                 key: code + ':' + (d ? (d.docNumber || '(no number):' + (d.title || '')) : '') + (extra ? ':' + extra : '') });
    }
    var fam = {};
    records.forEach(function (d) {
      if (!d || !d.docNumber) return;
      (fam[d.docNumber] = fam[d.docNumber] || []).push(d);
    });

    Object.keys(fam).forEach(function (n) {
      var rows = fam[n];
      // Same number and same revision twice: two records claim one version.
      // A revision returned by QMS or the approver stays as history, and its
      // re-filing is the same revision, next attempt (PR 2B, NEW-03), so the
      // rule is over records that were not returned; each attempt at a
      // revision must still be one record.
      var seen = {}, tries = {};
      rows.forEach(function (d) {
        var k = norm(d.revision);
        if (!d.rejected) {
          if (seen[k]) add('integrity', 'duplicate-number-revision', d, n + ' Rev ' + revLabel(d.revision) + ' is held by more than one record.', 'rev' + k);
          seen[k] = 1;
        }
        var a = k + '#' + (d.attempt || 1), first = tries[a];
        if (first && (first.rejected || d.rejected))
          add('integrity', 'duplicate-attempt', d, n + ' Rev ' + revLabel(d.revision) + ' attempt ' + (d.attempt || 1) + ' is held by more than one record.', 'rev' + a);
        if (!first) tries[a] = d;
      });
      // More than one revision in force.
      var live = rows.filter(function (d) { return LIVE[d.status]; });
      if (live.length > 1) add('integrity', 'multiple-live-revisions', live[0], n + ' has ' + live.length + ' revisions in force (' +
        live.map(function (d) { return 'Rev ' + revLabel(d.revision); }).join(', ') + '). Only one may be current.');
      // More than one open revision.
      var open = rows.filter(function (d) { return d.status === 'draft' && !d.rejected; });
      if (open.length > 1) add('integrity', 'multiple-open-revisions', open[0], n + ' has ' + open.length + ' revisions in progress. Only one may be open.');
      // A revision still in progress for a document that has been withdrawn:
      // it should have been cancelled with the family (PR 2B, NEW-02).
      open.forEach(function (d) {
        var m = String(d.supersedes || '').match(/^Rev\s+(.+)$/i);
        var parent = m ? rows.filter(function (x) { return x !== d && norm(x.revision) === norm(m[1]); })[0] : null;
        if (parent && parent.status === 'obsolete' && !rows.some(function (x) { return LIVE[x.status]; }))
          add('integrity', 'open-revision-of-withdrawn-document', d, n + ' Rev ' + revLabel(d.revision) + ' is still in progress, but ' + n + ' Rev ' + revLabel(parent.revision) + ' has been withdrawn. It should have been cancelled with it.');
      });
    });

    records.forEach(function (d) {
      if (!d) return;
      var n = d.docNumber, rows = n ? fam[n] : [];
      var controlled = !types || !types[d.docType] || types[d.docType].controlled !== false;

      // Superseded, but the successor it names is not in the register.
      if (d.status === 'superseded') {
        var by = String(d.supersededBy || '');
        if (/^Source /.test(by)) {
          var src = d.translationOf;
          if (!src || !fam[src]) add('integrity', 'superseded-translation-without-source', d, n + ' was superseded by a revision of ' + (src || 'an unnamed source') + ', which is not in the register.');
        } else if (!by) {
          add('integrity', 'superseded-without-successor', d, n + ' Rev ' + revLabel(d.revision) + ' is superseded but names no successor.');
        } else if (!rows.some(function (x) { return x !== d && norm(x.revision) === norm(by); })) {
          add('integrity', 'superseded-successor-missing', d, n + ' Rev ' + revLabel(d.revision) + ' is superseded by "' + by + '", which is not in the register, so no revision of it is in force here.');
        }
      }
      // What it supersedes must be an earlier revision.
      if (d.supersedes) {
        var s = String(d.supersedes);
        if (!/^Rev\s/i.test(s)) add('integrity', 'supersedes-not-a-revision', d, n + ' supersedes "' + s + '", which is not a revision of the same document.');
        else if (major(s) !== null && major(d.revision) !== null && major(s) >= major(d.revision))
          add('integrity', 'supersedes-not-earlier', d, n + ' Rev ' + revLabel(d.revision) + ' supersedes ' + s + ', which is not an earlier revision.');
      }
      // A translation must point at a source that exists and follow its lifecycle.
      if (d.translationOf) {
        var srcRows = fam[d.translationOf];
        if (!srcRows) add('integrity', 'translation-source-missing', d, n + ' is a translation of ' + d.translationOf + ', which is not in the register.');
        else if (LIVE[d.status] && !srcRows.some(function (x) { return LIVE[x.status]; }))
          add('integrity', 'translation-live-without-source', d, n + ' is in force but its source ' + d.translationOf + ' has no revision in force.');
        else if (d.status === 'draft' && !d.rejected && !srcRows.some(function (x) { return LIVE[x.status]; }) &&
                 srcRows.some(function (x) { return x.status === 'obsolete' && !x.cancelled; }))
          add('integrity', 'open-translation-of-withdrawn-source', d, n + ' is still in progress, but its source ' + d.translationOf + ' has been withdrawn. It should have been cancelled with it.');
      }
      // A revision above the first with no recorded predecessor.
      var m = major(d.revision);
      if (m !== null && m > 1 && !d.supersedes && !(rows || []).some(function (x) { return x !== d && major(x.revision) !== null && major(x.revision) < m; }))
        add('data-quality', 'revision-without-predecessor', d, (n || d.title) + ' is at Rev ' + revLabel(d.revision) + ' with no record of what it superseded.');
      // Numbers.
      if (!n && controlled) add('data-quality', 'missing-number', d, '"' + d.title + '" is a controlled document with no number.');
      if (n && /#/.test(n)) add('data-quality', 'placeholder-number', d, n + ' is a placeholder number, not an assigned one.');
      if (n && d.numberStatus === 'provisional') add('data-quality', 'provisional-number', d, n + ' is provisional' + (d.numberNote ? ': ' + d.numberNote : '.'));
      // Values the register's own lookups do not know.
      if (d.status && !STATUSES[d.status]) add('integrity', 'unknown-status', d, (n || d.title) + ' has status "' + d.status + '".');
      if (types && d.docType && !types[d.docType]) add('integrity', 'unknown-type', d, (n || d.title) + ' has type "' + d.docType + '".');
      if (segs && d.segment && !segs[d.segment]) add('integrity', 'unknown-area', d, (n || d.title) + ' has area "' + d.segment + '".');
    });

    // A legacy ID used by two documents. A translation carrying its own
    // source's legacy ID is one document in two languages, not a clash.
    var leg = {};
    records.forEach(function (d) {
      if (!d || !d.legacyId) return;
      if (d.translationOf && (fam[d.translationOf] || []).some(function (x) { return x.legacyId === d.legacyId; })) return;
      (leg[d.legacyId] = leg[d.legacyId] || []).push(d);
    });
    Object.keys(leg).forEach(function (l) {
      var nums = {}; leg[l].forEach(function (d) { nums[d.docNumber] = 1; });
      if (Object.keys(nums).length > 1) add('integrity', 'duplicate-legacy-id', leg[l][0], 'Legacy ID ' + l + ' is carried by ' + Object.keys(nums).join(', ') + '.', l);
    });
    return out;
  }

  /* Splits findings against a baseline: A known legacy issues, B new ones. */
  function compare(findings, baseline) {
    var known = {}; (baseline || []).forEach(function (k) { known[k] = 1; });
    return {
      known: findings.filter(function (f) { return known[f.key]; }),
      fresh: findings.filter(function (f) { return !known[f.key]; }),
      fixed: (baseline || []).filter(function (k) { return !findings.some(function (f) { return f.key === k; }); })
    };
  }

  var api = { check: check, compare: compare, report: report };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TAQA_REGISTER_CHECK = api;

  // ── Command line ───────────────────────────────────────────────────────
  if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    var fs = require('fs'), path = require('path');
    var repo = path.join(__dirname, '..');
    var reg = require(path.join(repo, 'documents-master.js'));
    var baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'register-baseline.json'), 'utf8')).known;
    var findings = check(reg.TAQA_MASTER_DOCS, reg.TAQA_DOC_LOOKUPS);
    if (process.argv.indexOf('--baseline') !== -1) {
      process.stdout.write(JSON.stringify(findings.map(function (f) { return f.key; }).sort(), null, 2) + '\n');
      return;
    }
    var r = compare(findings, baseline);
    if (process.argv.indexOf('--report') !== -1)
      fs.writeFileSync(path.join(repo, 'docs/QA/REGISTER-CLEANUP-REPORT.md'), report(findings, r, reg.TAQA_DOC_LOOKUPS));
    console.log('Register: ' + reg.TAQA_MASTER_DOCS.length + ' records. Findings: ' + findings.length +
      ' (known ' + r.known.length + ', new ' + r.fresh.length + ', fixed since baseline ' + r.fixed.length + ').');
    r.fresh.forEach(function (f) { console.log('NEW ' + f.kind + ' ' + f.code + ': ' + f.message); });
    process.exitCode = r.fresh.length ? 1 : 0;
  }

  function report(findings, r, L) {
    var segName = function (id) { return (L && L.segments[id] && L.segments[id].name) || id || ''; };
    var esc = function (t) { return String(t == null ? '' : t).replace(/\|/g, '\\|').replace(/\n/g, ' '); };
    var groups = {};
    findings.forEach(function (f) { (groups[f.kind + '|' + f.code] = groups[f.kind + '|' + f.code] || []).push(f); });
    var TITLES = {
      'duplicate-number-revision': 'Same number and revision held twice',
      'duplicate-attempt': 'Same attempt at a revision held twice',
      'open-revision-of-withdrawn-document': 'Revision still in progress for a withdrawn document',
      'open-translation-of-withdrawn-source': 'Translation still in progress for a withdrawn source',
      'multiple-live-revisions': 'More than one revision in force',
      'multiple-open-revisions': 'More than one revision in progress',
      'superseded-without-successor': 'Superseded with no successor named',
      'superseded-successor-missing': 'Superseded by a revision that is not in the register',
      'superseded-translation-without-source': 'Translation superseded by a source that is not in the register',
      'supersedes-not-a-revision': '"Supersedes" is not a revision of the same document',
      'supersedes-not-earlier': '"Supersedes" names a revision that is not earlier',
      'translation-source-missing': 'Translation whose source is not in the register',
      'translation-live-without-source': 'Translation in force while its source is not',
      'revision-without-predecessor': 'Revision above 1 with no record of what it superseded',
      'missing-number': 'Controlled document with no number',
      'placeholder-number': 'Placeholder number',
      'provisional-number': 'Provisional number awaiting QHSE assignment',
      'unknown-status': 'Status the register does not define',
      'unknown-type': 'Type the register does not define',
      'unknown-area': 'Area the register does not define',
      'duplicate-legacy-id': 'Legacy ID carried by more than one document'
    };
    var ACTION = {
      'superseded-successor-missing': 'Load the successor revision into the register, or correct supersededBy and the status.',
      'revision-without-predecessor': 'Record what each revision superseded (the previous revision label), from SCORE.',
      'placeholder-number': 'Assign the real number in SCORE and update the record.',
      'provisional-number': 'QHSE to assign the short form or business unit, then renumber (TQ-QHSE-S001 5.3).',
      'missing-number': 'Assign a number, or confirm the record is not a controlled document.'
    };
    var lines = [];
    lines.push('# Register cleanup report for QMS');
    lines.push('');
    lines.push('Generated by `node scripts/check-register.js --report` from `documents-master.js` (' + (L ? Object.keys(L.segments).length + ' areas, ' : '') + 'the shipped register). **Nothing here has been changed in the data**: every item is for QMS to verify against SCORE and correct at source. Regenerate this report after any correction.');
    lines.push('');
    lines.push('- **A. Known legacy issues:** ' + r.known.length + ' (in `scripts/register-baseline.json`; existing data, listed below for correction).');
    lines.push('- **B. New issues:** ' + r.fresh.length + ' (not in the baseline; the CI gate fails on any of these).');
    lines.push('- **Fixed since the baseline:** ' + r.fixed.length + (r.fixed.length ? ' (remove them from the baseline).' : '.'));
    lines.push('');
    lines.push('Integrity findings mean the register contradicts itself; data-quality findings mean a record is incomplete or provisional. The rules are `BUSINESS-RULES.md` §8 and §16.');
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push('| Kind | Finding | Count | Suggested correction |');
    lines.push('|---|---|---|---|');
    Object.keys(groups).sort().forEach(function (g) {
      var p = g.split('|');
      lines.push('| ' + p[0] + ' | ' + (TITLES[p[1]] || p[1]) + ' | ' + groups[g].length + ' | ' + (ACTION[p[1]] || 'Correct the record at source.') + ' |');
    });
    Object.keys(groups).sort().forEach(function (g) {
      var p = g.split('|');
      lines.push('');
      lines.push('## ' + (TITLES[p[1]] || p[1]) + ' (' + p[0] + ', ' + groups[g].length + ')');
      lines.push('');
      lines.push('| Number | Revision | Title | Area | Finding |');
      lines.push('|---|---|---|---|---|');
      groups[g].forEach(function (f) {
        lines.push('| ' + esc(f.docNumber || '(none)') + ' | ' + esc(f.revision || '') + ' | ' + esc(f.title) + ' | ' +
          esc(segName(f.segment)) + ' | ' + esc(f.message) + (r.fresh.indexOf(f) !== -1 ? ' **(NEW)**' : '') + ' |');
      });
    });
    lines.push('');
    return lines.join('\n');
  }
})(typeof window !== 'undefined' ? window : this);
