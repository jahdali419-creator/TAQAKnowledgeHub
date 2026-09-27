/* ──────────────────────────────────────────────────────────────────────────
   TAQA Knowledge Hub, search index
   ──────────────────────────────────────────────────────────────────────────
   This file used to be a hand-written list of 502 titles. It covered 11 of
   the 26 areas, so a search for anything in Marine Services, Commercial or
   any of the Centres of Excellence returned nothing at all. Worse, only 116
   of those 502 titles existed in the register, so search could offer a
   document the master list had never heard of, and a document someone had
   just uploaded could never be found because the list was frozen in the file.

   The index is now derived from the register itself, which makes three
   things true that were not true before:

     every area is searchable, because the register holds all 26
     an upload is searchable the moment it is submitted, because store.js
       announces the change and this rebuilds
     search can never offer a document the register does not hold

   ── What is searchable ──────────────────────────────────────────────────
   Obsolete and superseded records are left out: TQ-QHSE-S001 4.6 requires
   that a withdrawn document not be available for unintended use, and a
   search box is exactly the unintended use it means. Everything else the
   signed-in role may see is in, including assets, which the hub distributes,
   and the role's own drafts, which are marked so nobody mistakes a draft for
   a document in force.
   ────────────────────────────────────────────────────────────────────── */
var TAQA_SEARCH_INDEX = [];

(function (root) {
  'use strict';

  var IDX = root.TAQA_SEARCH_INDEX = TAQA_SEARCH_INDEX;

  function segName(id) {
    var S = (typeof TAQA_DOC_LOOKUPS !== 'undefined' && TAQA_DOC_LOOKUPS.segments) || {};
    return (S[id] && S[id].name) || id;
  }

  function searchable(d) {
    if (d.status === 'obsolete' || d.status === 'superseded') return false;
    if (typeof TAQA_ROLE === 'undefined') return true;
    return TAQA_ROLE.canSee(d);
  }

  function build() {
    var src = (typeof TAQA_STORE !== 'undefined') ? TAQA_STORE.rows('register')
            : (typeof TAQA_MASTER_DOCS !== 'undefined') ? TAQA_MASTER_DOCS : [];
    var next = [];
    for (var i = 0; i < src.length; i++) {
      var d = src[i];
      if (!searchable(d)) continue;
      next.push({
        t:  d.title,
        tp: d.docType,
        s:  d.segment,
        sn: segName(d.segment),
        n:  d.docNumber || null,   // so a result can be traced to one record
        st: d.status,              // so a draft never reads as a live document
        rev: d.revision || null
      });
    }
    /* Replace in place. ai-search.html and viewer.html captured this array
       when they loaded, so handing back a new one would leave them reading
       the old register for the rest of the session. */
    IDX.length = 0;
    Array.prototype.push.apply(IDX, next);
    return IDX;
  }

  build();

  // An upload, an approval or a withdrawal all reach here the same way.
  if (root.addEventListener) {
    root.addEventListener('taqa:register-changed', build);
    root.addEventListener('taqa:role-changed', build);
  }

  root.TAQA_SEARCH = { rebuild: build, all: function () { return IDX; } };
})(typeof window !== 'undefined' ? window : this);
