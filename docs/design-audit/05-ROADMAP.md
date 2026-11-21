# RISE — Design Audit · Part 5: Implementation Roadmap

**Not started.** This is a proposed sequence, for approval. No application file has
been changed for this audit.

Five phases. The ordering rule: **nothing that is visibly wrong waits for anything
that is merely inconsistent**, and the foundation work happens before the feature
work so the feature work is cheaper.

---

## Phase 0 — Before launch

*Everything a user can currently see going wrong, plus the fixes that cost an
attribute. Direction-independent: do this whichever direction you choose.*

| ID | Change |
|---|---|
| UX-043 | Director hero stat agrees with the queue beneath it |
| UX-035 | Viewer error state stops offering Download / Bookmark / Share |
| UX-023 | One numbered sequence on the upload screen |
| UX-065 | Three avatar colour pairs raised to 4.5:1 |
| UX-067 | Accessible names on icon-only controls |
| UX-068 | The one unlabelled input gets a label |
| UX-078 | Honour board gated until three real contributors exist |
| UX-044 | Director page leads with the queue, not delegation |
| UX-016, UX-017 | 44px targets on mobile segment tabs and the copy-link button |
| UX-064 | Duplicate skip-link implementation deleted |
| UX-070 | `prefers-reduced-motion` extended to the older animations |
| UX-060 | Back-to-top on every route over ~4,000px |

**Decisions now taken by the owner (5 November 2026), so these are scheduled:**
- **UX-006** — role switching moves behind a clearly marked development/demo mode.
  No longer blocked.
- **UX-041** — **closed as working as intended.** A Director reaching only their
  own segment's dashboard is the decided model, and Part 6 §5 confirms the
  prototype already behaves that way.
- **UX-078** — fictional contributors must never be shown as real. Scheduled.

**Also decided (5 November 2026):**
- **UX-093** — **yes.** A Maintenance Manager may read released field knowledge
  in their authorised segment, subject to classification. The segment strip must
  stop hiding it. Reading grants no submit, review, approve or modify right.
- **UX-094** — **per-segment.** A Maintenance Manager manages their assigned
  segment's maintenance department by default, not every operational segment.
  QMS keeps only its authorised cross-segment responsibilities.

**Exit gate:** the existing suite (47 spec files, chromium + mobile-chrome +
webkit-smoke) green, and a re-run of the audit probe showing zero sub-44px
interactive targets, zero unnamed controls and zero AA failures on opaque grounds.

---

## Phase 1 — Foundations

*The work that makes every later phase cheaper. Mostly migration, not design.*

1. **UX-081 — adopt `techhub.css`.** It already ships the scales; 18 of 19 pages
   ignore them. Revise the three values Part 4 changes (body 15 → 16px, micro
   11 → 12px, h3 17 → 18px), retire `--th-r-xl`, then migrate pages one at a time,
   deleting each page's local custom-property block as it goes. One page per
   commit, suite green between each.
2. **UX-001, UX-002, UX-079, UX-080** fall out of that migration: 24 sizes → 8,
   22 radii → 4, 18 text colours → 3 inks + brand, ad-hoc shadows → 4 levels.
3. **UX-003** — lift the shared chrome (skip link, topbar, card, button, chip,
   table, field, empty state) out of the 19 inline `<style>` blocks.
4. **UX-010** — one status badge, five states, one colour mapping.
5. **UX-069** — one focus ring everywhere.

**Sequence it page-by-page, highest-traffic last.** `index.html` and
`master-list.html` are the two pages where a regression is most visible, so they
migrate after the pattern has been proven on `analytics.html`, `documents.html`
and `recognition.html`.

**Exit gate:** probe re-run shows ≤8 font sizes, ≤4 radii, ≤6 text colours, and
`var(--th-` referenced on every page. Suite green. Visual diff reviewed per page.

---

## Phase 2 — Role desks

*The largest structural gap: Home is an index, and nobody has a page that opens on
their own work.*

- **Employee** — UX-020 (a personal starting point on Home), UX-022 (my documents:
  what I filed, where it is, what came back), UX-025 (draft autosave),
  UX-027 (numbering explained before submission, not after it fails),
  UX-062 (unsaved-changes guard).
- **Director** — UX-045 (approve / return from the row), UX-046 (why am I seeing
  this), and the queue-first layout from Phase 0 extended.
- **QMS** — UX-029 (saved views), UX-032 (bulk actions behind the existing
  checkboxes), UX-040 (needs-attention card acts), UX-028 (filter bar component),
  UX-031 (density and column control).
- **Maintenance** — UX-047 (stop being the director layout with different counts).

**This is where the three directions start to diverge**, so Phase 2 cannot start
until a direction is approved. Phases 0 and 1 can.

**Exit gate:** each of the five roles can answer "what do I do next?" from their
first screen without using search.

---

## Phase 2F — Segment-embedded Field Knowledge

*Runs alongside Phase 2. It cannot start until one of the three approaches in
Part 7 is chosen, and it should not start before Phase 1, because roughly 85% of
it is the shared components Phase 1 creates.*

Ordered so the boundary is closed before the surface is built — the leaks are
small, they are the user's stated requirement, and they do not depend on the
approach chosen.

**2F.1 — Close the boundary (approach-independent, all small)**
- UX-084 — replace the 12-option Area select with a locked segment chip wherever
  `?area=` is present, in the desktop filter row **and** the mobile filter sheet.
- UX-085 — stop the pre-job pack asking "Area*" when it was entered with one.
- UX-087 — give the filing form the segment's identity: title, breadcrumb and a
  stated segment instead of a chooser.
- UX-086 — make the chrome link area-aware inside a segment, or retire the global
  Field Cases link once the segment owns it.
- UX-092 — make a case's breadcrumb return to the segment it was opened from.

**2F.2 — Build the chosen surface.** **Decided: Approach B as the primary
experience, with Approach C as an optional detailed Field Desk** (owner, 5 Nov
2026). Built on the shared components in Part 7 §5 — entry row, letter mark,
counted rail, alert shelf, filter bar, lock chip, empty state, pre-job starter,
status badge. The refined design, the seven previews and the exact navigation
changes are in **Part 8**.

**2F.3 — The empty state is a first-class state, not a fallback.** Three of the
eleven operational segments have zero field knowledge (UX-090). It ships with the
surface, not after it.

**2F.4 — Resolve the duplication safely** (UX-082). **No tab is removed.** The
owner has not approved removal, and the overlap is a property of today's dataset
rather than a permanent truth. Part 8 §5 sets out a four-stage, independently
reversible migration: add Field knowledge alongside the existing tabs, then make
the two tabs open the same view pre-filtered, then pilot and ask, and only then
consider retiring — with Technical Alerts recommended to stay permanently.

**2F.5 — Scoped search entry.** Add `ai-search.html?area=<id>` to pre-set the
segment filter that already exists (UX-091). Global search is unchanged.

**2F.6 — Pre-job inside the segment.** The segment is used automatically and
never asked for; pre-job becomes one of the two main actions alongside Explore
cases; the matching, `why[]` reasons, source references, group order, "Discussed"
ticks, pack figures, Print and Copy link are all preserved unchanged. A standing,
non-dismissible caution states that a pack informs the pre-job conversation and
does **not** authorise the job or replace approved job safety documentation
(Part 8 §6).

**Explicitly not in this phase:** no change to `cases.js`, `store.js`, `roles.js`,
`cases-data.js` or `search-index.js`. If the work starts requiring one, the
approach has drifted — stop and re-read Part 7 §4.

**Exit gate:** from inside any operational segment, a user can read, filter,
search and file that segment's field knowledge and build a pre-job pack without
ever being offered another segment; the pre-job pack's ranking and `why[]`
sentences are byte-identical to today's for the same inputs; the suite is green;
and the three zero-entry segments each open on a designed empty state.

**Still unverified before this phase can be specified in full** (Part 6 §6):
`case.html` with a real filed record and its withdrawn / returned / unreleased
states; a full case walked through submit → QMS → release in the UI; the
remaining modals; RTL; and a keyboard and screen-reader pass over the filter
sheet and the progress rail.

---

## Phase 3 — Navigation and search

- UX-030 — the count-bearing sidebar, extracted from `master-list.html` and used
  on every data page.
- UX-004, UX-005, UX-009 — one page shell, so breadcrumbs and "you are here" stop
  being per-page decisions.
- UX-053 / UX-091 — scoped search (the segment entry point lands in Phase 2F;
  the wider scoping work is here); UX-054 — recent searches; UX-055 — one search
  component instead of two.
- UX-052 — search as an overlay, if the chosen direction wants it.
- UX-007, UX-011 — gate pages and the hero stop being full-viewport takeovers.
- UX-033, UX-034, UX-018 — the long pages become navigable rather than long.
- UX-057, UX-058, UX-059 — the mobile chrome decisions.

**Exit gate:** no route over ~6,000px without in-page navigation; one navigation
model; search reachable from every page in one action.

---

## Phase 4 — Depth and the unverified surfaces

- UX-050 — a time dimension in analytics. UX-049, UX-051 — charts that carry their
  own labels and units. UX-037 — revision history on the document page.
- UX-019, UX-042, UX-048 — cross-area comparison, global QMS queue, an asset axis.
- UX-071, UX-073 — loading and undo, only where real latency and real reversibility
  exist.
- UX-008 — a command palette, last, once the structure it moves through is settled.

**And the ten gaps Part 1 names as not inspected.** These are not findings, they
are unknowns, and each needs a pass before launch confidence is honest:

1. Modal and dropdown interiors (bookmarks, mega-menu, upload steps 2–3, case-new
   body, delegate dialog, share sheet, document More menu)
2. The live submit → QMS → approve → publish walk through the UI
3. The other 24 areas, especially the empty and the overflowing ones
4. Firefox and WebKit beyond the existing smoke job
5. A real screen-reader pass (NVDA / VoiceOver)
6. Keyboard traversal of each page
7. The dark theme (`data-taqa-theme="dark"`)
8. Arabic / RTL — the register holds 14 Arabic documents
9. `case.html` and `form.html` with real records
10. Print styles

Items 5, 6, 7 and 8 are the ones I would not launch without.

---

## Verification discipline

Whatever phase is running:

- The suite runs on every change. It has already caught a regression in this work
  once — a class rename that broke a selector a test reads.
- The audit probe is re-runnable and should be re-run at each exit gate. The
  harness used for this audit was temporary and has been removed; re-creating it
  is a ~150-line spec, and the numbers in Part 2 are the baseline to compare against.
- **Tests do not currently gate deploys.** `tests.yml` and the Azure Static Web
  Apps workflow both run on `main` in parallel, so a red suite does not stop a
  deploy. That needs a branch-protection rule, which only a repository admin can
  set. It is the one piece of this roadmap I cannot do for you.
- Contrast on gradient panels (UX-066) can only be checked by eye. Any phase that
  touches a gradient panel needs a visual review, not a probe run.

---

## Where the phases now stand

| Phase | Depends on | Blocked? |
|---|---|---|
| 0 — Before launch | nothing | **No — can start now** |
| 1 — Foundations | nothing | **No — can start now** |
| 2 — Role desks | direction (taken: C) | No |
| 2F — Field Knowledge | Phase 1 + approval of the Part 8 previews | **Yes — awaiting preview approval** (approach decided: B + C) |
| 3 — Navigation and search | Phase 1 | No |
| 4 — Depth and unverified surfaces | Phases 1–3 | No |

---

## What this does not include

No estimate in days. The phases are ordered by dependency, not by calendar, and
how fast they move depends on how much of it you want done by one person. What I
can say from the audit: Phase 0 is small and almost entirely mechanical, Phase 1
is the single best investment in the list, and Phase 2 is where the product stops
being a document register and starts being somewhere people go.
