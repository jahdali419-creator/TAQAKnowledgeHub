# RISE — Design Audit · Part 2: Findings Backlog

**Legend.** `[C]` Confirmed — I saw it in the running app or measured it.
`[P]` Proposal — a design judgement, not a defect. `[A]` Assumption — needs a
fact I could not get.

Impact H/M/L · Effort S/M/L · Priority P0–P3 · Mobile Y/N/Both.

---

## A. Global / cross-cutting

### UX-001 `[C]` No shared type scale — 24 distinct text sizes
**Where** Every page. **Saw** 24 distinct rendered font sizes on one role/viewport
sweep: 10,11,12,13,14,15,16,17,18,19,20,21,22,24,25,26,30,34,36,40,52,54,56,58px.
**Problem** 10/11/12/13 and 17/18/19 are differences nobody can perceive but every
page pays for in review time and drift. **Do** Adopt the 7-step scale `techhub.css` already ships (see UX-081), revised
to 8 steps (12/14/16/18/22/28/36/52); map every existing size to the nearest. **Why** One scale makes
hierarchy legible and removes a whole class of review comment.
**H / M / P1 / All / Both** · `probe-employee-1440.json`

### UX-002 `[C]` No radius scale — 22 distinct border-radius values
**Where** Every page. **Saw** 2,6,8,9,10,11,12,13,14,16,18,20px, 999px, 50% and more.
**Problem** 8/9/10/11 px radii on sibling cards read as sloppiness at a glance.
**Do** Four tokens: 6 (controls), 12 (cards), 16 (panels), 999 (pills) —
narrowing the five `--th-r-*` values that already exist (see UX-081).
**M / S / P1 / All / Both** · same probe

### UX-003 `[C]` Styles are duplicated per page, not shared
**Where** All 19 pages carry a large inline `<style>`; `techhub.css` and
`topbar.css` exist but carry a minority of the rules. **Saw** The skip link is
defined twice with different tokens — `index.html:1522` uses `--bg-white`,
`recognition.html:51` uses `--paper`. **Problem** Every visual change is an
N-page edit; this audit found drift that only exists because of it.
**Do** Extract tokens + primitives (button, card, chip, table, field, empty
state) into `techhub.css`; pages keep only page-specific rules.
**H / L / P1 / All / Both** · grep evidence above

### UX-081 `[C]` A complete token system already exists in `techhub.css` — and 18 of 19 pages ignore it
**Where** `techhub.css:14-67`. **Saw** It already defines a 7-step type scale
(`--th-fs-hero/h1/h2/h3/body/small/micro`), a 4-step ink ramp
(`--th-ink` … `--th-ink-4`), a 10-step spacing scale (`--th-s1` … `--th-s18`),
five radii (`--th-r-sm/md/lg/xl/pill`), three elevations
(`--th-shadow-1/2/3`), a teal ramp of seven stops and one easing curve.
**Saw** Every page links the stylesheet. Counting `var(--th-…)` references:
`glossary.html` 43 — and `index.html`, `segment.html`, `master-list.html`,
`dashboard.html`, `upload.html`, `viewer.html`, `recognition.html`,
`analytics.html`, `cases.html` all **0**, while each declares its own 5–57 local
custom properties instead.
**Problem** This reframes UX-001, UX-002, UX-079 and UX-080 completely. The
product does not lack a design system; it has one, written and shipped on every
page, that nobody adopted. 24 text sizes, 22 radii and 7 greys are not the
absence of a scale — they are nine pages each re-deriving one.
**Do** Treat `techhub.css` as the system of record. Audit its scales once (its
body size is 15px and its radii start at 8px, both of which the token work in
Part 4 would revise), then migrate pages onto it one at a time, deleting the
local block as each goes. This is the single highest-leverage item in the audit
and it needs no new design decisions to start.
**H / M / P0 / All / Both** · `techhub.css:14-67` + per-page `var(--th-)` counts

### UX-004 `[C]` Two different navigation models
**Where** `master-list.html` has a persistent left sidebar ("In this register")
plus the topbar. Every other page has the topbar alone. **Problem** The app's
densest page is also the only one with a second navigation axis, so the model a
user learns on 18 pages does not apply on the 19th. **Do** Either promote the
sidebar pattern to the other register-like pages (documents, cases, analytics)
or demote it to an in-page filter rail that does not look like global nav.
**M / M / P2 / QMS, Auditor / N** · `shots/qms-1440--master_list.png`

### UX-005 `[C]` Breadcrumbs appear on some pages and not others
**Where** Present: `dashboard` (Home › Drilling Services › Manage Segment),
`viewer` (Home / Area / Document). Absent: `cases`, `upload`, `master-list`,
`ai-search`, `recognition`, `analytics`. **Problem** Deep pages with no
breadcrumb give no sense of place and no one-click way up.
**Do** One breadcrumb component, present on every page below the top level.
**M / S / P1 / All / Both** · screenshots

### UX-006 `[C]` Role-switch chips are exposed in production chrome
**Where** Role-gate pages, e.g. director hitting another area's dashboard:
"Trying a different role? View this page as [Employee] [Maintenance Manager]
[QMS] [External Auditor]". **Problem** This is a prototype affordance rendered
with the same weight as real UI. In a pilot with real staff it invites people to
browse as roles they do not hold, and it undermines the credibility of the
access model even though nothing is actually bypassed.
**Do** Put it behind the same switch that seeds demo data, or style it
unmistakably as a preview tool (dashed container, "Preview mode" label).
**H / S / P0 / All / Both** · `shots/owner-1440--dashboard_id_drilling.png`

### UX-007 `[C]` Gate pages are full-viewport takeovers that are ~60% empty
**Where** `master-list` as Employee, `dashboard?id=X` as a director of another
area. **Saw** Document height exactly 900px (the viewport), content occupying
roughly the top third, the rest blank. **Problem** The copy is genuinely good —
it explains *why* rather than saying "denied" — but the layout reads as an error
page. **Do** Render the explanation as a card inside the normal page shell, and
where possible show the part of the page the role *can* see beneath it.
**M / S / P2 / All / Both** · `shots/employee-1440--master_list.png`

### UX-008 `[P]` No global command palette
**Where** App-wide. **Problem** 25 areas × 6 content types plus 561 documents,
navigated through a topbar with 6 links. Power users (QMS especially) have no
keyboard route to a known document number. **Do** `⌘K` palette over the existing
`search-index.js`: documents by number/title, areas, and page actions.
**H / M / P2 / QMS, Director, Manager / N** · proposal

### UX-009 `[C]` No visible "you are here" state across sections
**Where** Topbar marks the current page, but within a 25-area product there is no
indication of which *area* context you are in once you leave the segment page.
**Do** An area chip in the topbar when a page is area-scoped, clearable.
**M / S / P2 / All / Both**

### UX-010 `[P]` Status vocabulary is not visually systematised
**Where** Seen across pages: Current, Review due, Draft, Withdrawn, Awaiting
Review, Provisional, Example, Pending, Rejected, Returned. **Problem** These
appear as differently-shaped chips in different places. **Do** One status
component with a fixed colour per state and an icon, documented once.
**H / M / P1 / All / Both**

### UX-079 `[C]` Ink ramp has seven near-identical greys and six near-identical teals
**Where** Every page. **Saw** 18 distinct text colours in one 18-route sweep.
Seven are warm greys — `#1E1C1A` (408 nodes), `#6E655D` (271), `#756A61` (163),
`#524D48` (161), `#5F564F` (118), `#2B2724` (24), `#4A4540` (11) — and six are
dark teals: `#005D63` (376), `#00705F`, `#004A4F`, `#00594E`, `#00585A`,
`#00191B`. **Problem** `#524D48` / `#5F564F` / `#6E655D` / `#756A61` are four
secondary-text greys nobody can tell apart; they exist because each page chose
its own. The same is true of the four dark teals under `#005D63`.
**Do** Three ink tokens (primary / secondary / muted) and one brand teal with a
single darker variant for hover. Map all 13 onto them. `--th-ink`, `--th-ink-2`,
`--th-ink-3` and the `--th-teal-*` ramp already cover this (see UX-081).
**M / S / P1 / All / Both** · `probe-employee-1440.json`

### UX-080 `[C]` No elevation scale — shadows are applied per component
**Where** Every page. **Saw** 177 shadowed elements across the 18 routes;
`glossary.html` alone has 39, `segment.html` 21, `viewer.html` 17, `index.html` 16.
**Problem** Depth is currently a per-card decision, so a filter bar, a KPI tile
and a modal can all sit at the same apparent height — the single cheapest cause
of a page reading as "flat but busy" rather than layered.
**Do** Three elevation tokens (raised / overlay / modal) plus a flat default;
nothing gets a shadow that is not one of them. `--th-shadow-1/2/3` are already
exactly this, and almost unused (see UX-081).
**Note** The probe counted shadowed elements but did not inventory the distinct
shadow *values*, so the number of unique shadows is unmeasured.
**M / S / P1 / All / Both** · `probe-employee-1440.json`

---

## B. Landing page (concept approved — refinements only)

### UX-011 `[C]` Hero occupies a full viewport before any content
**Where** `index.html`. **Saw** Document height 2760px at 1440×900; the beds
begin around y=1318. **Problem** A returning user scrolls past the same hero
every visit to reach the thing they came for. **Do** Keep the hero, but cap it at
~70vh on return visits (localStorage flag), or let the scroll cue collapse it.
**M / S / P2 / All / Both**

### UX-012 `[C]` Members fade in per row with stacked delays
**Where** `#focus .st-members li` — `animation-delay: calc(var(--i) * 16ms + 60ms)`.
**Saw** Screenshots repeatedly caught rows mid-fade; the right-hand column of a
two-column bed is visibly later than the left. **Problem** With all beds open the
page has ~24 staggered items; on a slow device the section shimmers into place.
**Do** Cap the stagger at ~6 items, then show the remainder at once.
**M / S / P2 / All / Both** · observed across many captures

### UX-013 `[C]` "Company policies" panel is visually heavier than the beds it introduces
**Where** Top of `#focus`. **Problem** A dark teal full-width panel with a "See
all" button outranks the three beds, which are the actual navigation.
**Do** Reduce to a single-line banner with the same link.
**M / S / P2 / All / Both**

### UX-014 `[P]` Bed headers do not show what is inside before opening
**Where** Each bed shows name + count + one line of description. **Do** Add 3–4
example area names as muted text, so a closed bed still teaches.
**M / S / P3 / All / Both**

### UX-015 `[C]` Two-column member lists break the reading order
**Where** Open bed at ≥860px shows areas in two columns; rank order runs down
column one then down column two. **Problem** Users scan left-to-right and will
misread the ordering. **Do** Either order across rows, or sort alphabetically
where order is not meaningful. **M / S / P2 / All / N**

---

## C. Segment navigation

### UX-016 `[C]` Segment tabs are 34px tall on mobile
**Where** `segment.html?id=…`, `.tab-btn` × 7. **Saw** h=34px at 390px wide.
**Problem** Below the 44px comfortable target, and these are the page's primary
navigation. **Do** 44px min-height; allow horizontal scroll rather than shrink.
**H / S / P1 / All / Y** · `probe-employee-390.json`

### UX-017 `[C]` Copy-link button is a 24px target
**Where** `segment.html` `.copy-link-btn`. **Do** 44px hit area via padding.
**M / S / P1 / All / Y** · same probe

### UX-018 `[C]` Segment page is 2067px on mobile with 7 tabs above the fold
**Problem** Tab + long scroll means losing your place when switching tabs.
**Do** Sticky tab strip on scroll, and restore scroll position per tab.
**M / M / P2 / All / Y**

### UX-019 `[P]` No cross-area comparison
**Where** You can only see one area at a time. **Do** On `documents.html`, allow
multi-area selection for people who work across segments.
**M / M / P3 / Manager, QMS / N**

---

## D. Employee interfaces

### UX-020 `[C]` Home gives an employee no personal starting point
**Where** `index.html`. **Problem** The page is an excellent directory of the
organisation and says nothing about *you* — your area, your bookmarks, your
drafts, what changed in your area this week. **Do** A slim personal strip above
the beds (area shortcut, bookmarks count, drafts, recent) — not a dashboard, and
not replacing the beds. **H / M / P1 / Employee / Both**

### UX-021 `[C]` Recognition "No level yet" chip shows for roles that may never earn
**Where** Topbar, seen on Director. **Observation** `canEarn()` governs it and QMS
/ Auditor correctly have none. For a Director it is correct but reads oddly next
to their name. **Do** Hide the chip until the person has filed at least once.
**L / S / P3 / Director / Both**

### UX-022 `[P]` No "my documents" view
**Where** An employee's own filings are visible only on `recognition.html` under
released work. **Do** A "Mine" filter on `documents.html` covering drafts,
in-review and released. **H / M / P1 / Employee / Both**

---

## E. Upload workflow

### UX-023 `[C]` Two conflicting numbered sequences on one screen
**Where** `upload.html`. **Saw** Stepper "1 Select File · 2 Document Details ·
3 Review & Submit" beside a sidebar "1 Submit · 2 QMS check · 3 Director
approval · 4 Published". **Problem** "Step 2" means two different things ~300px
apart. **Do** Un-number the sidebar — make it a timeline with state dots, not
ordinals. **H / S / P0 / Employee, Manager / Both** · `shots/employee-1440--upload.png`

### UX-024 `[C]` Hero consumes 340px before the form begins
**Where** `upload.html`. **Problem** This is a task page reached with intent; the
photographic hero delays the dropzone. **Do** Compress to a title bar on this and
other task pages (`case-new`, `support-ticket`). **M / S / P1 / Employee / Both**

### UX-025 `[P]` No draft autosave indication
**Where** Multi-step upload. **Problem** Nothing says whether leaving loses work.
**Do** "Draft saved" timestamp in the stepper. **H / M / P1 / Employee / Both**

### UX-026 `[P]` 500MB limit stated but no progress affordance described
**Do** Per-file progress with cancel, and an explicit slow-connection state for
field use. **M / M / P2 / Employee / Y**

### UX-027 `[P]` Document numbering is explained only after submission fails
**Do** Show the number RISE will assign, live, as soon as area + type are chosen.
**H / M / P1 / Employee, QMS / Both**

---

## F. Document registers and tables

### UX-028 `[C]` Five filter controls in a single row
**Where** `master-list.html`: Search, All segments, All types, Any status, Any
class, Both languages. **Problem** Equal visual weight for filters of very
unequal use; no indication which are active after scrolling.
**Do** Search + 2 common filters inline, the rest behind "More filters", with
active filters shown as removable chips. **M / M / P1 / QMS, Auditor / Both**

### UX-029 `[P]` No saved views
**Where** `master-list`. **Problem** QMS re-applies the same filters daily.
**Do** Saved views ("Overdue in my areas", "Waiting on me"), stored locally.
**H / M / P1 / QMS / N**

### UX-030 `[C]` Register sidebar counts are the best navigation in the app and exist nowhere else
**Where** "All controlled 561 / Waiting on QMS 12 / Review overdue 84 / …".
**Do** Reuse this count-led pattern on `documents.html` and `cases.html`.
**H / M / P1 / All / N**

### UX-031 `[P]` Table has no column control or density toggle
**Do** Column chooser + comfortable/compact toggle, persisted.
**M / M / P2 / QMS, Auditor / N**

### UX-032 `[P]` No bulk actions despite checkboxes
**Where** Row checkboxes exist in the register. **Do** A selection action bar
(export, reassign review date) — or remove the checkboxes.
**H / M / P1 / QMS / N**

### UX-033 `[C]` Glossary renders 16,109px tall on desktop, 13,619px on mobile
**Where** `glossary.html`. **Problem** Every term in one DOM; no pagination,
virtualisation or jump index. On mobile that is ~36 screens of scroll.
**Do** A–Z sticky index + virtualised list, or group-by-letter accordions.
**H / M / P1 / All / Y** · probe heights

### UX-034 `[C]` `cases.html` is 6,282px on mobile
**Do** Paginate or infinite-scroll with a result count anchor.
**M / M / P2 / All / Y**

---

## G. Document detail and viewer

### UX-035 `[C]` Error state still offers Download PDF, Bookmark and Share
**Where** `viewer.html` with no/unknown document. **Saw** A correct, well-written
red warning — "Not in the Master Document List available to your role" — directly
above a full document shell with "Not recorded" in all four metadata slots and an
enabled **Download PDF** button. **Problem** The page offers to download a
document it has just said does not exist. **Do** When the record cannot be
resolved, suppress the shell and actions; show the warning plus Search and Home.
**H / S / P0 / All / Both** · `shots/employee-1440--viewer.png`

### UX-036 `[C]` Metadata reads "Not recorded" four times with API clause references beneath
**Where** Same. **Problem** "Not recorded / API Q2 4.4.3 d)" is compliance
shorthand shown to an employee. **Do** Plain language for employees, clause
reference behind an info affordance or auditor view.
**M / S / P2 / Employee / Both**

### UX-037 `[P]` No revision history on the document page
**Do** A revision rail (1.0 → 2.0, who, when, what changed), which the register
already has data for. **H / M / P1 / All / N**

### UX-038 `[P]` "Preview not connected" is a dead end
**Do** State what will connect it and offer download meanwhile.
**M / S / P2 / All / Both**

---

## H. QMS interfaces

### UX-039 `[C]` Master List is the strongest page in the product
**Where** `master-list.html` as QMS. **Observation** Register sidebar with live
counts, four analytic cards (status donut, overdue ageing, busiest segments,
needs-attention), then a filtered table. **Do** Treat this as the reference
layout and bring other role desks up to it. **Strength, not a defect.**

### UX-040 `[P]` Needs-attention card lists but does not act
**Where** "84 reviews overdue / 147 waiting on a short form / 12 in draft".
**Do** Make each line a filter link into the table below.
**H / S / P0 / QMS / N**

### UX-041 `[C]` Director of area A is hard-gated from area B's dashboard
**Where** `dashboard.html?id=drilling` as Segment Director of another area.
**Saw** Full-page gate. **Problem** Correct as policy; poor as experience — a
director with several areas, or one covering a colleague, hits a wall with no
route to their own desk. **Do** Offer "Go to your area's desk" and list the areas
they *do* hold. **H / S / P1 / Director / Both** · `shots/owner-1440--dashboard_id_drilling.png`

### UX-042 `[P]` QMS queue is per-area with a note pointing at the global queue
**Do** Make the global workbench the default for QMS and the area slice a filter.
**M / M / P2 / QMS / N**

---

## I. Director approval interfaces

### UX-043 `[C]` Hero stat contradicts the queue directly beneath it
**Where** `dashboard.html?id=drilling` as the area's Director. **Saw** Header
reads **1 PENDING**; the panel below reads **"All caught up! Nothing is waiting
on your final approval."** **Cause** (code-confirmed) the stat is
`ST.rows('pending', {segment})` — everything in the register at any stage — while
the queue is `awaiting-director` filtered by `canApprove`. A document sitting
with QMS makes a caught-up director read as having work.
**Do** Either scope the stat to the same query as the queue, or label it
"In progress" and add a separate "Waiting on you" figure.
**H / S / P0 / Director, Manager / Both** · screenshot + `dashboard.html:1064,1085`

### UX-044 `[C]` "Delegate your authority" sits above the approval queue
**Where** Same page. **Problem** An occasional administrative action occupies the
first card; the queue — the reason a director opens the page — is below it.
**Do** Move delegation into a header menu; lead with the queue.
**H / S / P0 / Director / Both**

### UX-045 `[P]` No approve-from-list
**Do** Let a director approve or return from the queue row with a reason prompt,
without opening each document. **H / M / P1 / Director / Both**

### UX-046 `[P]` No "why am I seeing this" on an approval
**Do** One line per item: who filed, which QMS checker passed it, what changed
since the last revision. **H / M / P1 / Director / N**

---

## J. Maintenance Manager

### UX-047 `[C]` Maintenance desk is the director layout with different counts
**Where** `dashboard.html` as `maintenance`. **Problem** The code narrows the
counters to maintenance documents, but the page furniture is identical, so the
role's distinct job is not expressed. **Do** Lead with bulletins and
overdue-maintenance items. **M / M / P2 / Manager / Both**

### UX-048 `[P]` No equipment/asset axis
**Do** If documents carry equipment references, offer an equipment filter.
**M / L / P3 / Manager / N** `[A]` — depends on data not verified.

---

## K. Dashboards and analytics

### UX-049 `[C]` `analytics.html` is only 1,044px tall
**Problem** A whole page for a small amount of content; it does not justify a
top-level destination. **Do** Fold into the Master List's analytic row, or expand
it to answer real questions (compliance trend, ageing by area, time-to-approve).
**M / M / P2 / Director, QMS / N**

### UX-050 `[P]` No time dimension anywhere
**Problem** Every figure is "now". Nobody can see whether overdue reviews are
improving. **Do** Sparkline + "vs last month" on the key counters.
**H / M / P1 / Director, QMS / N**

### UX-051 `[C]` Charts are small and unlabelled
**Where** Master List cards. **Do** Give the ageing bars value labels and the
donut a legend with counts (it has colours and numbers but no units).
**M / S / P2 / QMS / N**

---

## L. Search

### UX-052 `[C]` Search is a destination page, not an overlay
**Where** `ai-search.html`, reached from the topbar. **Problem** Searching loses
the page you were on. **Do** Overlay/palette that keeps context (see UX-008).
**H / M / P2 / All / Both**

### UX-053 `[P]` No scoped search
**Do** When on an area page, default search to that area with a removable chip.
**H / S / P1 / All / Both**

### UX-054 `[P]` No recent or saved searches
**Do** Persist the last 5 locally. **M / S / P2 / All / Both**

### UX-055 `[C]` Hero search on Home and the Search page are different components
**Problem** Two search entry points with different affordances and results
behaviour. **Do** One component. **M / M / P2 / All / Both**

---

## M. Mobile

### UX-056 `[C]` Mobile layout is genuinely responsive — no overflow anywhere
**Observation** 18 routes × 5 viewports, zero horizontal overflow; `cases.html`
collapses filters into a "Filters" button and stacks cards properly. **Strength.**

### UX-057 `[C]` Topbar collapses to logo + theme + hamburger, losing Upload
**Where** ≤1280px. **Problem** Upload is the primary employee action and is
buried in the menu on the device most likely to be used in the field.
**Do** Keep Upload as an icon button, or a bottom-anchored action.
**H / S / P1 / Employee / Y**

### UX-058 `[C]` Level chip hidden below 1280px
**Where** `@media (max-width:1280px){ .rise-lvl{display:none!important} }`.
**Problem** The recognition programme is invisible on phones, where field staff
mostly are. **Do** Show a compact medal-only chip.
**M / S / P2 / Employee / Y**

### UX-059 `[P]` No bottom navigation on mobile
**Do** Consider a 4-item bottom bar (Home, Search, Cases, Upload) for phones.
**H / M / P2 / Employee / Y**

### UX-060 `[C]` Long pages have no "back to top" on some routes
**Observation** Present on home/recognition; glossary at 13,619px needs it most.
**M / S / P1 / All / Y**

---

## N. Forms and interactions

### UX-061 `[P]` Validation timing not standardised
**Do** Validate on blur, summarise on submit, never on keystroke.
**M / M / P2 / Employee / Both**

### UX-062 `[P]` No unsaved-changes guard
**Where** `upload`, `case-new`, `support-ticket`. **H / S / P1 / Employee / Both**

### UX-063 `[P]` Destructive actions lack a typed confirm
**Do** For withdraw/reject, require a reason — already partly present — and show
exactly what changes. **M / S / P2 / QMS, Director / Both**

### UX-064 `[C]` Skip link is implemented twice with different tokens
**Where** `index.html:1522` (`--bg-white`) vs `recognition.html:51` (`--paper`).
**Do** One component. **L / S / P2 / All / Both**

---

## O. Accessibility

### UX-065 `[C]` Avatar initials fail AA contrast
**Where** `recognition.html` honour board — white "AA" on Contributor teal
measures **3.01:1** (needs 4.5), "YA" on Expert green **4.50:1** (borderline).
`dashboard.html` contributor avatar "IS" **3.97:1**.
**Note** This is my own work from the previous session.
**Do** Darken avatar backgrounds one step, or use dark text on light tints.
**H / S / P0 / All / Both** · corrected probe

### UX-066 `[C]` Gradient panels cannot be contrast-verified programmatically
**Observation** 23–42 text nodes per page sit on gradient backgrounds. These are
*unverified*, not passing. **Do** Pin a minimum solid colour at the lightest
gradient stop and test against that. **M / S / P1 / All / Both**

### UX-067 `[C]` A handful of controls have no accessible name
**Where** 1–7 per page on `support-ticket` (7), `prejob` (3), `segment`,
`cases`, `ai-search`, `recognition` (1 each). **Do** `aria-label` on icon-only
controls. **H / S / P0 / All / Both** · probe `noName`

### UX-068 `[C]` One input lacks a label
**Where** `segment.html`. **Do** Associate a `<label>`. **M / S / P1 / All / Both**

### UX-069 `[P]` Focus-visible exists but is not uniform
**Observation** Several components define their own ring. **Do** One token.
**M / S / P2 / All / Both**

### UX-070 `[C]` Reduced motion is respected in the newer work, not everywhere
**Observation** `prefers-reduced-motion` blocks exist on `index` and
`recognition`; the Ken Burns hero animation and card reveals elsewhere were not
all verified. **Do** One global reduced-motion rule. **M / S / P1 / All / Both**

---

## P. Microinteractions and states

### UX-071 `[P]` No skeleton states
**Observation** Pages render from local data so loading is instant now; with a
real backend the register and search will need them. **M / M / P2 / All / Both**

### UX-072 `[C]` Empty states vary in quality
**Observation** Excellent: director "All caught up!", recognition route to
earning. Thin: viewer error, several list empties. **Do** One empty-state
component — icon, one line, one action. **M / S / P1 / All / Both**

### UX-073 `[P]` No undo on reversible actions
**Do** Toast with Undo for bookmark/withdraw. **M / M / P2 / All / Both**

### UX-074 `[C]` Notification bell has a count but no panel verified
**Observation** Badge shows 12 for QMS. Panel not opened in this audit `[A]`.
**Do** Verify; ensure it routes to the queue. **M / S / P2 / QMS / Both**

---

## Q. Content and language

### UX-075 `[C]` Register shows renumbering in-place
**Where** "TQ-QHSE-P### / was TAQA-QHSE-P###". **Observation** Good
transparency. **Do** Keep; add a tooltip explaining the scheme change.
**L / S / P3 / All / N**

### UX-076 `[C]` Compliance clause codes leak into employee views
**Where** "API Q2 4.4.3 d)" under viewer metadata. **Do** Auditor-only.
**M / S / P2 / Employee / Both**

### UX-077 `[C]` Example data is labelled honestly throughout
**Observation** "EXAMPLE" chips everywhere, and a footer explaining them.
**Strength** — but see UX-078.

### UX-078 `[C]` The honour board currently celebrates five people who do not exist
**Where** `recognition.html`. **Problem** Fine in preview, wrong on launch day.
**Do** Hide the podium until there are ≥3 real contributors; show the route to
earning instead. **H / S / P0 / All / Both**

---

## R. Confirmed strengths (do not regress)

- **No horizontal overflow** on 18 routes × 5 viewports × 5 roles.
- **No console errors** on any route in any role.
- **Honest gating** — refusals explain themselves in plain language.
- **Master List** is a genuinely professional register view.
- **Mobile is designed, not shrunk** — `cases.html` is the proof.
- **Example data is never passed off as real.**
- **Copy quality is high** throughout, and better than most enterprise products.
