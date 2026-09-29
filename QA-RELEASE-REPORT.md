# TAQA Knowledge Hub, Frontend QA & Release Report

Scope note, read this first: this is a **frontend prototype / functional
specification**. Plain HTML/CSS/JS, no build step, no backend, no database,
no real SharePoint, no real Entra ID/SSO, no real email/Teams notifications,
no real support-ticket transport, no real cross-device sync, no real audit
log. Client-side roles in `roles.js` are, by that file's own header
comment, "a specification, not a security control." Everything below is
scoped to that reality. Nothing in this report claims production-grade
security, real backend persistence, or organization-wide data where none
exists.

## Executive Summary

**Overall status: ✅ FRONTEND PROTOTYPE READY FOR BUSINESS SIGN-OFF / AZURE
INTEGRATION**

This pass inspected the running code directly (not older Markdown docs) as
the source of truth, built the project's first permanent automated test
suite (357 Playwright tests across 20 files, previously zero), and used
that suite, plus static analysis, to find and fix a set of real frontend
bugs: a broken document-rejection gate, stored-XSS in three places, a
site-wide missing favicon, dead/broken patch code, several accessibility
gaps, and multiple pieces of UI copy that overclaimed what a no-backend
prototype actually does. Every fix shipped with a regression test. The
full suite passes clean and repeatably. Nothing found during this pass
blocks a demo, a business sign-off, or handing this frontend to an Azure
backend team to build behind, provided the Azure Handover Risks section
below is read and respected, since several things that look real from the
browser (roles, audit trail, persistence, notifications) are not, by
design, at this stage.

## Repository Baseline

Counts below are derived at test time from the actual register
(`documents-master.js`/`segments-data.js`), via
`tests/helpers/baseline.js`'s `computeBaseline()`, not hand-typed:

| Metric | Value |
|---|---|
| Total register records | 626 |
| Live (current, publicly shown) | 553 |
| Controlled (current + under-review + superseded + obsolete + draft) | 600 |
| Draft (awaiting QMS/approver) | 15 |
| Past their review-due date | 87 |
| Areas (segments + functions + product centres + company-wide) | 26 |
| Document types | 7 (sop, manual, standard, policy, alert, lesson, software) |
| Status breakdown | current 485, under-review 68, superseded 16, obsolete 16, draft 15, asset 26 |
| HTML pages | 13 |

These are the numbers the homepage, segment pages, Master List, search
index and dashboard all derive from at runtime; the test suite cross-checks
several of them against each other specifically to catch the "five
different answers to the same count" failure mode.

## Tests Added

Zero automated tests existed before this pass. Added a full Playwright
harness: `package.json`, `playwright.config.js` (devDependency-only,
Playwright + `http-server`; zero runtime dependencies added to the app
itself), `tests/helpers/` (`fixtures.js`, `baseline.js`, `areaGroups.js`),
and 20 spec files, 357 tests total. See `TESTING.md` for the full
per-file breakdown, run commands, and conventions; summarized here:

| File | Tests | Protects |
|---|---|---|
| `smoke.spec.js` | 14 | every page loads, no thrown JS error, real `<title>` |
| `navigation.spec.js` | 36 | shared topbar, role/area switcher, popovers, dark mode |
| `upload.spec.js` | 34 | file-type/size security, wizard, real store writes |
| `accessibility.spec.js` | 28 | skip links, keyboard nav, ARIA, the reject modal |
| `roles.spec.js` | 27 | the full role/capability matrix, delegation logic |
| `segment.spec.js` | 25 | per-area library, counts, tabs, amber pre-warning |
| `security-regression.spec.js` | 24 | secrets scan, CSP pin, role-disclaimer intact |
| `viewer.spec.js` | 23 | metadata, statuses, breadcrumb, QR, print, placeholder |
| `mobile.spec.js` | 20 | 375/390/430px layout, touch targets, mobile nav |
| `dashboard.spec.js` | 17 | approval-desk UI, toasts, contributors |
| `search.spec.js` | 16 | real keyword search, filters, safety disclaimer |
| `home.spec.js` / `master-list.spec.js` | 15 each | index.html; the QMS/auditor register |
| `approval-workflow.spec.js` | 13 | the real two-step release flow, end to end |
| `support-ticket.spec.js` | 12 | validation, photo annotation, no-overclaim |
| `documents.spec.js` / `offline.spec.js` | 10 each | published-docs table + XSS; PWA/offline |
| `bookmarks.spec.js` | 7 | shared bookmarks, per-device isolation |
| `analytics.spec.js` | 6 | local-only usage stats, no-overclaim wording |
| `glossary.spec.js` | 5 | term persistence, search, escaping |

## Test Results

**Chromium**: executed, real. Four independent full-suite runs of all 357
tests: three completely clean (356 passed, 1 intentional skip, 0 failed);
one had a single test fail under `--workers=4` from CPU contention on this
sandbox's 4 cores (load average briefly above 15), reproduced 5/5 clean in
isolation, root-caused, and hardened (see Bugs Found and Fixed). The smoke
suite was also run under the `mobile-chrome` project (Pixel 7 device
emulation), 14/14 clean.

**Firefox / WebKit**: configured (`playwright.config.js` has both
projects ready, `hasPinnedChromium` logic makes Chromium-only sandboxes
work automatically) but **not executed in this environment**, since
neither browser binary is installed here (`playwright install firefox`
requires network access this sandbox doesn't have to Playwright's CDN).
Whoever picks this up on a normal developer machine can run
`npx playwright install firefox webkit && npm run test:firefox && npm run
test:webkit` to get that coverage for real; the suite is written against
standard DOM/Playwright APIs with nothing Chromium-specific, so no
cross-browser rewrite should be needed, but this has not been verified.

**Desktop / Tablet / Mobile**: Desktop covered directly (1440x900 default
viewport across the whole suite). Mobile covered via `mobile.spec.js`
resizing to 375x667, 390x844 (primary) and 430x932 on Chromium, plus the
separate `mobile-chrome` device-emulation smoke pass above. Tablet-specific
viewports (768x1024, 820x1180) were not separately exercised by a dedicated
spec file in this round; `mobile.spec.js`'s `noHorizontalOverflow` helper
can be pointed at those sizes as a follow-up without new infrastructure.

**1 skip** (documented, not hidden): `offline.spec.js`'s "unvisited path
falls back to offline.html" test. This sandbox's `browserContext.
setOffline(true)` does not reliably reach a service worker's own in-flight
`fetch()`, a container-specific quirk confirmed by direct reproduction, not
an app bug. The test detects the exact resulting failure signature and
skips with a clear reason; it will run and pass normally on a machine
where offline emulation reaches the service worker correctly.

## Page Coverage

| Page | Status |
|---|---|
| index.html | PASS |
| segment.html | PASS |
| viewer.html | PASS |
| documents.html | PASS |
| master-list.html | PASS |
| dashboard.html | PASS |
| ai-search.html | PASS |
| analytics.html | PASS |
| glossary.html | PASS |
| upload.html | PASS |
| support-ticket.html | PASS |
| whats-new.html | PASS (smoke-level; no dedicated spec file this round) |
| offline.html | PASS |

## Role Coverage

All four roles from `roles.js`'s `TAQA_ROLES` exercised directly (not
assumed): **Employee** (read-only register access), **Segment Director**
/ owner (approves within their own area, may delegate), **QMS / Document
Controller** (counter-signs, owns the register view and export), **External
Auditor** (read-only everywhere including the register, never a write
path). `roles.spec.js` asserts the exact capability matrix
(`controlPanel`/`export`/`registerView`/`approve`/`countersign`/`delegate`/
`editMetadata`/`scope`) transcribed from the source file, so an accidental
future edit to that matrix fails loudly. Role-gated UI (Master List,
dashboard, upload/support-ticket visibility, the approvals bell) is
verified as a business-rule/UX behavior in every relevant spec file, not
described as a security boundary anywhere in this suite.

## Workflow Coverage

- **Search**: real client-side keyword matching against the register,
  verified against the actual index, not described as AI since it isn't.
- **Bookmarks**: shared across pages via `shared.js`, localStorage-backed,
  confirmed per-device (two independent browser contexts never share
  state).
- **Viewer**: all real document statuses, version history/approval
  trail/compare/related-docs panels, withdrawn documents staying visible
  with a "do not use" banner rather than 404ing.
- **Upload (simulated)**: file-type allow-list, size limit, filename/title
  XSS escaping, and a real write to `TAQA_STORE` on submit, confirmed by
  reading the store afterward, not assumed from a success toast.
- **Approval simulation**: the real two-step QMS-then-approver release,
  end to end, including the store itself refusing the wrong role at either
  stage (not just a hidden button), reject requiring a reason, and
  counters moving by exactly one.
- **Delegation**: `TAQA_DELEGATION`'s grant/revoke/expiry/scope contract,
  and that switching role or area clears any active delegation.
- **Support ticket (simulated)**: validation, photo annotation (canvas
  pixel-diffed, not just "button exists"), and copy that no longer
  overclaims a real ticket was sent anywhere.
- **Glossary**: submitted terms are confirmed to genuinely persist
  (localStorage), search/highlight escaping verified against XSS payloads.
- **Analytics**: confirmed local-device-only, register-derived audit log
  confirmed synthesized/simulated, wording checked against overclaiming a
  real company-wide compliance record.
- **Offline / PWA**: manifest validity, service worker registration and
  cache population against the real `CORE` array, and the offline fallback
  page.

## Bugs Found and Fixed

Every fix below shipped with an automated regression test in the same or
a following commit; retested clean in the final full-suite runs.

**BUG-01** | Severity: High | Page: all 13 pages
Repro: load any page; browser silently 404s requesting `/favicon.ico`
because no `<link rel="icon">` existed anywhere.
Root cause: favicon declaration missing site-wide.
Files changed: all 13 `.html` files.
Fix: added `<link rel="icon" href="icons/icon.svg" type="image/svg+xml">`.
Regression test: `tests/smoke.spec.js` (console-error assertion on every
page). Retest: PASS.

**BUG-02** | Severity: Medium | Page: documents.html, dashboard.html
Repro: open `documents.html?id=company` or `dashboard.html?id=company`;
shows "Company" instead of "Company Wide".
Root cause: `'company'` was missing from `segments-data.js`'s
`TAQA_SEGMENTS` table even though the register's own lookup
(`TAQA_DOC_LOOKUPS.segments`) always had it; two pages still read the
stale table for display name/description.
Files changed: `segments-data.js`.
Fix: added the missing entry, sourced from the real register data.
Regression test: `tests/documents.spec.js` (explicit "Company Wide"
regression). Retest: PASS.

**BUG-03** | Severity: Medium | Page: dashboard.html
Repro: a pending submission's "similar documents" duplicate-detection
panel compared against a hand-written list of fabricated titles that
predated the real register.
Root cause: `buildSimilarDocs()` read `TAQA_SEGMENTS[segId].docs.*`
instead of `TAQA_STORE`.
Files changed: `dashboard.html`.
Fix: read `TAQA_STORE.rows('live', {segment: segId})`.
Regression test: `tests/dashboard.spec.js` (real-title similarity check).
Retest: PASS.

**BUG-04** | Severity: Medium | Page: viewer.html
Repro: open a company-policy document as Employee or Owner; the
breadcrumb "back" link goes to `master-list.html`, which refuses both
roles.
Root cause: a stale special case routed `segId==='company'` to
`master-list.html` based on an already-fixed premise (segment.html could
not render a company id) that was no longer true.
Files changed: `viewer.html`.
Fix: removed the special case; always route to `segment.html?id=<segId>`.
Regression test: `tests/viewer.spec.js` (breadcrumb regression for
employee and owner). Retest: PASS.

**BUG-05** | Severity: High (business-rule integrity) | Page: dashboard.html
Repro: click Reject on a pending document; it is rejected immediately,
with no reason recorded, before the "reason required" modal (added by a
separate patch file, `fixes.js`) ever opens; confirming the modal then
rejects it a second time, decrementing the pending counter twice.
Root cause: two click listeners on the same button; the page's own
`onclick` attribute (registered at parse time) always ran before
`fixes.js`'s `addEventListener(..., true)` (registered later, on
`DOMContentLoaded`) regardless of the capture flag, since same-target
listeners run in registration order.
Files changed: `dashboard.html`, `fixes.js`.
Fix: moved the reason-required flow natively into `dashboard.html` as the
only code path that touches `TAQA_STORE.reject()` or the counters;
cancelling the modal now truly cancels the rejection.
Regression test: `tests/approval-workflow.spec.js`,
`tests/dashboard.spec.js` (reject-reason gate, single-call-to-store spy,
exact single decrement). Retest: PASS.

**BUG-06** | Severity: Medium | Page: dashboard.html
Repro: any role sees a "Delegate Approvals" button in the hero that saves
to a localStorage key nothing else reads, with no permission check,
sitting beside the real, correctly-gated `TAQA_DELEGATION` system.
Root cause: a leftover, fully disconnected duplicate feature in `fixes.js`.
Files changed: `fixes.js`.
Fix: removed.
Regression test: `tests/dashboard.spec.js` (asserts no disconnected
delegate button remains). Retest: PASS.

**BUG-07** | Severity: Medium | Page: ai-search.html
Repro: opening the Filters drawer visually highlights the trigger button
as if it were a selected segment chip.
Root cause: `fixes.js`'s FIX 5 selector (`.seg-chip, .filter-chip`) also
matched `#filters-trigger-btn`, which legitimately carries class
`filter-chip`; its result-container selectors also no longer matched the
current result markup, and it fully duplicated a working native filter
system.
Files changed: `fixes.js`.
Fix: removed (native `FILTERS.segment`/`syncSegmentChips()` already
handles this correctly, scoped to `.seg-filters .filter-chip[data-seg]`).
Regression test: `tests/search.spec.js`. Retest: PASS.

**BUG-08** | Severity: Low (cleanup) | Page: documents.html, dashboard.html,
glossary.html, upload.html, support-ticket.html
Repro: none visible; 6 of `fixes.js`'s 10 named patches were confirmed
silent no-ops (their target selectors/text no longer matched the current
markup after the pages they patched were rebuilt).
Files changed: `fixes.js`, and the `<script src="fixes.js">` tag removed
from the 5 pages that get nothing from it.
Fix: removed the dead code; `fixes.js` now carries only the one patch
still doing something real (the AI Search safety disclaimer).
Regression test: `tests/search.spec.js` confirms the surviving patch still
works. Retest: PASS.

**BUG-09** | Severity: High (security) | Page: documents.html
Repro: a document title containing HTML (e.g. an uploaded file's title)
would render as live markup in the published-documents table.
Root cause: `documents.html` had no HTML-escaping helper defined anywhere,
and `renderPubTable()` interpolated titles straight into `innerHTML`.
Files changed: `documents.html`.
Fix: added `esc()`, applied to every user-controllable field in that
render function.
Regression test: `tests/documents.spec.js` (adds a document via the real
`TAQA_STORE.add()` API with a script-injection title, asserts zero
`<img>`/`<script>` elements, a lone text node, no fired dialog). Retest:
PASS.

**BUG-10** | Severity: High (security) | Page: upload.html
Repro: the record-preview card (step 4 of the submission wizard) rendered
the in-progress title field straight into `innerHTML`, unescaped, even
though the same file's `esc()` helper was already used correctly
elsewhere on the page.
Files changed: `upload.html`.
Fix: applied `esc()` to the title and document-number rows in
`paintRecord()`.
Regression test: `tests/upload.spec.js`. Retest: PASS.

**BUG-11** | Severity: High (security) | Page: dashboard.html
Repro: the pending-approvals queue rendered several fields (a matched
document's title in the duplicate-check panel, a superseded document's
title, and the pending document's own title/submitter) unescaped, even
though `esc()` was already defined and used correctly nearby in the same
function for other fields.
Files changed: `dashboard.html`.
Fix: applied `esc()` consistently across the whole render.
Regression test: `tests/dashboard.spec.js`. Retest: PASS.

**BUG-12** | Severity: Medium | Page: dashboard.html, documents.html
Repro: both pages' own colored-dot toast never showed its color; every
call silently produced a broken CSS class instead.
Root cause: both files declared their own top-level `showToast(msg,
color)`, which `shared.js`'s later-loading `window.showToast(msg, type)`
silently overwrote (both are ordinary global function declarations on the
same object).
Files changed: `dashboard.html`, `documents.html`.
Fix: renamed to `showDashToast`/`showDocsToast`, matching the naming
convention `glossary.html` and `upload.html` already used for the same
reason.
Regression test: covered incidentally by `tests/dashboard.spec.js`'s toast
message assertions (they would fail against the generic toast's different
markup). Retest: PASS.

**BUG-13** | Severity: Medium | Page: master-list.html
Repro: hovering any chart bar or donut wedge threw a JS error and no
tooltip appeared.
Root cause: the `#tip` tooltip element's CSS existed, but the element
itself was never added to the page's markup.
Files changed: `master-list.html`.
Fix: added the missing `<div id="tip">`.
Regression test: `tests/master-list.spec.js` (hovers a real chart element,
asserts a visible, non-empty tooltip and no thrown error). Retest: PASS.

**BUG-14** | Severity: Low | Page: index.html
Repro: the "Recently visited" chip strip, fully built by its own script,
was never inserted anywhere on the page.
Root cause: it looked for an anchor element `#band-seg` that does not
exist; the real id is `#segments`.
Files changed: `index.html`.
Fix: corrected the id.
Regression test: `tests/home.spec.js`. Retest: PASS.

**BUG-15** | Severity: Low | Page: upload.html
Repro: "Max file size: 500 MB per file" was shown, but no size check
existed anywhere in `addFiles()`; a file of any size was silently
accepted.
Files changed: `upload.html`.
Fix: added a real 500 MB check with a visible rejection toast.
Regression test: `tests/upload.spec.js` (boundary tests at, over, and the
label-vs-enforcement match). Retest: PASS.

**BUG-16** | Severity: Low (accurate-copy) | Page: analytics.html
Repro: the role-refusal message read "This page shows how the Hub is used
across the company", contradicting the page's own local-only framing and
risking being read as genuine org-wide compliance data.
Files changed: `analytics.html`.
Fix: reworded to describe the real local usage data plus register-derived
audit log.
Regression test: `tests/analytics.spec.js` (asserts absence of
overclaiming phrases). Retest: PASS.

**BUG-17** | Severity: Low (accurate-copy) | Page: support-ticket.html
Repro: the success toast said "Request sent" / "sent to your segment
expert", though nothing is transmitted anywhere (no backend, confirmed by
reading the file: no write to `localStorage`/`TAQA_STORE` for ticket data
at all).
Files changed: `support-ticket.html`.
Fix: reworded to "Request logged" / "logged for ... once this connects to
a ticketing system."
Regression test: `tests/support-ticket.spec.js` (also asserts `localStorage`
is genuinely untouched by a submit). Retest: PASS.

**BUG-18** | Severity: Medium | Page: upload.html
Repro: after submitting, the `#upload-ref` reference-number span
disappeared from the confirmation toast on some submissions.
Root cause: `submitUpload()` set the span's text, then immediately
overwrote its own parent element's entire `textContent` on the very next
line, destroying the span it had just filled in (the code's own adjacent
comment described this exact failure mode happening via a different
function, then the very next line reproduced it directly).
Files changed: `upload.html`.
Fix: composed the toast's sub-line from text nodes around a freshly
created span, so it survives every submission.
Regression test: `tests/upload.spec.js`. Retest: PASS.

**BUG-19** | Severity: Medium (accessibility) | Page: shared.js (global
toast), dashboard.html, documents.html
Repro: a screen reader gives no announcement when any toast on these
surfaces appears.
Root cause: missing `role="status" aria-live="polite"`, unlike every other
toast in the app.
Files changed: `shared.js`, `dashboard.html`, `documents.html`.
Fix: added the same attributes used correctly everywhere else.
Regression test: `tests/accessibility.spec.js`. Retest: PASS.

**BUG-20** | Severity: Medium (accessibility) | Page: dashboard.html
(via shared.js)
Repro: `.btn-approve`/`.btn-reject` measured well under a comfortable
touch-target size on a phone.
Root cause: those buttons carry their own classes, not the generic `.btn`
class `shared.js`'s existing mobile touch-target rule already covers.
Files changed: `shared.js`.
Fix: extended the existing `@media(max-width:768px)` rule to include them.
Regression test: `tests/mobile.spec.js`. Retest: PASS.

**BUG-21** (test infrastructure, not app-facing, but affected the
validity of every test in this suite that set a non-default area) |
Severity: High (test integrity)
Repro: none visible to a user; every automated test that called
`setRole(role, area)` with a non-default area silently ran against the
default area instead.
Root cause: the test fixture's guard, `if (window.TAQA_ROLE)`, was always
false, because `roles.js` declares `TAQA_ROLE` as a top-level `const`,
which is a real identifier but never a property of `window` (unlike
`TAQA_STORE`, which is assigned to it explicitly).
Files changed: `tests/helpers/fixtures.js`, and one test file
(`tests/navigation.spec.js`) that made the identical mistake directly.
Fix: `typeof TAQA_ROLE !== 'undefined'` instead of `window.TAQA_ROLE`.
Independently found and fixed twice during this pass (once in the shared
fixture, once directly in a spec file), confirming the diagnosis.
Retest: full suite green afterward.

## Remaining Bugs

Not hidden, not fixed this round, either because fixing them is out of
this task's scope (inventing a feature, or editing a file this pass
deliberately treated as off-limits for direct app-logic changes) or
because deciding the right fix is a product/business call:

- **viewer.html's bookmark button does not resync if the bookmark is
  removed from the shared panel on a different page.** `updateBmBtn()`
  only re-checks state on click and once via a 300ms timer on load;
  nothing tells it to refresh if the panel changes state elsewhere.
  Repro: bookmark a document in the viewer, open the panel and remove it
  there; the panel and count update correctly, but the viewer's own
  button stays stuck on "Bookmarked" until the page is reloaded. Pinned
  with a `// KNOWN BUG:` marker in `tests/bookmarks.spec.js` rather than
  asserted as fixed.
- **`dashboard.html`'s "Not your area" and "Nothing here is yours" empty
  states appear to be unreachable in practice.** The page's own top-level
  gate (`canManage`/`TAQA_ROLE.refuse`) computes the identical predicate
  that would trigger those branches, and refuses first, before
  `initDashboard()` can render them. The branches' own markup was verified
  correct by forcing the one condition the gate can't otherwise produce;
  whether the gate or the branch is the intended design is a product
  question, not guessed at here.
- **`analytics.html`'s `registerRows()` swallows every exception from
  `TAQA_STORE.rows()`, not just "store unavailable."** A real bug inside
  the store would currently render as a silently empty chart/log rather
  than surfacing. Flagged, not changed, since the fix touches shared
  store-adjacent behavior.
- **Glossary: a user-submitted term is visually marked "Community" but is
  not held for any kind of review.** It goes live immediately, identical
  in every other way to a vetted term. This is accurate to how the code
  works today (confirmed directly, not assumed from an old doc); whether
  a review gate should exist is a product decision, not something this
  pass invented.
- **`documents.html` and `dashboard.html` have no `<h1>` anywhere**,
  static or JS-rendered. Pinned as a known accessibility gap.
- **6 of 7 high-value pages have no skip-to-main-content link**; only
  `master-list.html` implements one.
- **`tws-maintenance` ("TWS Maintenance") is a real, live area with a
  working `segment.html` page, but no link anywhere in the primary nav or
  the homepage.** It belongs to the register's "pending reassignment"
  group, which the role/area switcher itself labels that way, so this is
  plausibly intentional, but it is currently a real navigational
  dead-end for that one area.
- **CSP `unsafe-inline`** on `script-src` and `style-src` remains present
  on all 12 pages that carry the policy, exactly as it was before this
  pass. This is an explicitly known, accepted limitation for this
  prototype stage, not something this pass attempted to tighten; the
  exact policy string is now pinned by `security-regression.spec.js` so
  any future unintended change is caught.

## Documentation Drift

A dedicated pass compared every file in `/docs` against the running code,
not the other way around; the code is the source of truth. Register stats
verified directly against `documents-master.js`: 626 documents, 26 areas
(1 company + 11 segment + 10 function + 3 product + 1 pending-reassignment),
7 types (sop 210, manual 129, standard 134, policy 12, alert 39, lesson 76,
software 26).

**Fixed directly** (technical, no business judgment involved, kept minimal):

- `CYBERSECURITY-REVIEW-PACK.md` described a `sessionStorage['taqa_user']`
  placeholder that no longer exists anywhere in the code (it lived in one
  of the `fixes.js` patches removed earlier in this pass). Row deleted.
- The same doc's CSP row, and `DT-HANDOVER-PLAN.md`'s CMP wrap-up
  paragraph, both claimed the CSP was "tightened to `'self'` only,"
  self-contradicting the cybersecurity doc's own later R-05 entry:
  `script-src`/`style-src` still carry `'unsafe-inline'` on every page (a
  known, accepted gap for this prototype stage, unchanged by this pass).
  Both corrected to state that plainly.
- `HUB-DOCUMENT-CONTROL-SPEC.md`'s six findings were written the same day
  `documents-master.js` was first built, describing the tree just before
  that rebuild; all six are now resolved (single register, real metadata,
  `docNumber` addressing in `viewer.html`, `upload.html` writing through
  `TAQA_STORE.add()`). Rather than rewrite the findings, added a short
  status note pointing this out, leaving the findings as the historical
  record they are.

**Flagged, not hand-edited** (the drift is structural, not a single
correctable sentence, and none of it is a business/policy disagreement,
just an earlier snapshot in time):

`PLATFORM-FUNCTIONAL-SPEC.md`, `AZURE-MIGRATION-RAFA.md`,
`DT-HANDOVER-PLAN.md`, and `PLAIN-ENGLISH-GUIDE.md` (all dated 4 August
2026) describe the app as it was well before this pass and before the
approval workflow existed at all: "12 segments" (now 26 areas), "546
document records" with "43 missing from search" (now 626, full coverage),
"6 document categories" (now 7), a numbering scheme with collisions since
remapped (cybersecurity's short form is now `GRC`, wireline/well-safety no
longer clash), a homepage stats bug and a "Registered Users: 1,200" figure
both already fixed, and language describing the whole approval workflow as
unbuilt ("nothing is recorded and no notification is sent") when it now is
(`store.js`/`roles.js`, driving the notification bell). These four are
internally consistent with each other as an August snapshot; recommend
either a full refresh or explicitly retiring them as historical, the same
treatment given to `HUB-DOCUMENT-CONTROL-SPEC.md` above.

**Business/policy conflicts: none found.** Specifically checked for any
doc describing the pre-reversal Director-then-QMS approval order: none of
the 8 docs state an order that disagrees with the code. The one doc that
does describe the sequence, `FRONTEND-API-CONTRACT.md`, already states the
current QMS-first order correctly; the five older docs predate the
workflow and are silent on order rather than wrong about it. Role
definitions, classification rules, retention periods, and document-type
approver assignments all agree between the docs and the code everywhere
checked.

**Code ahead of docs** (not necessarily errors, just gaps): the two-step
approval workflow, delegation, and reject-with-reason flow are documented
only in `FRONTEND-API-CONTRACT.md` (correctly) and nowhere else. Every fix
made in today's pass (see Bugs Found and Fixed) is undocumented outside
this report and its commit messages, which is normal for routine bug
fixes. 14 of the 26 register areas don't appear in any of the 8 docs at
all, having been added after all of them were written.

## Current Architecture Limitations

These are true by design at this stage and are not defects:

- No backend, no database. Everything is `localStorage`/`sessionStorage`/
  in-memory JS state.
- No real Entra ID / SSO. Role and area are a client-side preview
  ("demo role") switcher, not an identity claim.
- Client-side role/permission checks (`roles.js`) are, by that file's own
  header, a specification for what a future backend must enforce, not a
  security boundary. Anyone can bypass them by editing `localStorage` or
  opening a page directly.
- No real SharePoint or document-file backend. The viewer's document body
  is an intentional placeholder ("preview not connected"), not a bug.
- No real audit log. Analytics' "audit activity" and trend data are
  synthesized/simulated from the local register, clearly local-device-only,
  never a genuine compliance record.
- No real cross-device or cross-browser state sync anywhere (bookmarks,
  contributors, delegation, analytics are all per-browser, per-device).
- No real email/Teams notifications. The approvals bell and toasts are
  in-app only.
- No real upload transport and no real support-ticket transport. Both are
  fully simulated client-side flows; upload does write a real draft row to
  the in-browser `TAQA_STORE`, support-ticket does not persist anything
  anywhere.
- `dashboard.html`'s contributor list is DOM-only state with no
  persistence at all, not even `localStorage`; it is gone on reload. UI
  wording was checked and does not overclaim otherwise.
- CSP still carries `unsafe-inline` on script-src/style-src (see Remaining
  Bugs).

## Azure Handover Risks

What the future backend team must not mistake for something the browser
can already be trusted to enforce or persist:

1. **Every role/permission check in `roles.js` and every gate built on it
   must be re-implemented server-side, from a real identity claim.** The
   frontend's role switcher is a preview control, not authentication. The
   backend API must filter what it returns and reject what it disallows;
   the client must never be the thing deciding what a user is allowed to
   see or do. This is stated in `roles.js`'s own header, and this pass's
   test suite deliberately never describes a role-gated UI test as a
   "security test," only as a UX/business-rule test, to avoid that exact
   misreading later.
2. **The two-step release sequence (QMS counter-signs, then the named
   approver publishes) is currently enforced only by `store.js`'s
   in-browser functions.** The backend must re-implement `approve()`/
   `countersign()`'s own role-and-segment checks server-side; the frontend
   calling them today proves nothing about who is allowed to call the
   real API tomorrow.
3. **No document is actually stored anywhere.** The viewer's placeholder
   body, the upload wizard's "submission," and every document's content
   are fictions of the local browser session. The real document-storage
   integration (SharePoint or otherwise) is entirely unbuilt.
4. **No data persists across devices, browsers, or a cleared profile.**
   Bookmarks, delegation, contributor lists, glossary submissions, and
   local analytics are `localStorage`-only. A user switching machines
   sees none of it. Do not assume any of today's "saved" state migrates
   automatically; a real migration plan is needed if any of it should
   survive the cutover.
5. **Analytics and the "audit log" are simulated, local, and must not be
   presented to auditors, QHSE, or regulators as a real activity record.**
   A genuine audit trail needs real server-side event logging, tied to
   real identity, which does not exist yet in any form here.
6. **The support-ticket and upload "submission" flows do not send
   anything to a real system.** Building the real transport (a genuine
   ticketing system integration, a genuine document-intake endpoint) is
   unstarted work, not a wiring detail.
7. **File-type and file-size checks on `upload.html` are client-side
   convenience only.** They stop an accidental wrong file from a
   cooperating browser; they stop nothing from a request crafted directly
   against a future API. The backend must re-validate every upload
   independently.
8. **CSP still allows `unsafe-inline`.** A real production deployment
   should tighten this before go-live; it was left in place for this
   prototype stage deliberately, not overlooked, but it is not something
   to carry forward unexamined.

## Release Recommendation

**✅ FRONTEND PROTOTYPE READY FOR BUSINESS SIGN-OFF / AZURE INTEGRATION**

No known frontend bug found during this pass is left unresolved without
either a shipped fix or an explicit, documented reason it's a product
decision rather than a code defect. The permanent regression suite
(357 tests) passes cleanly and repeatably, protects every fix made in this
pass, and gives the next team a reliable, executable specification of
current UI and business-rule behavior to build a real backend behind.
