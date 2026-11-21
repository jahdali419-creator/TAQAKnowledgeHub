# RISE — Design Audit · Part 7: Segment-Embedded Field Knowledge

**Three approaches, for comparison and decision. Nothing is implemented.**

Your requirement, as given:

> Each operational segment needs its own embedded Field Cases and Pre-Job
> experience. A user already inside a segment should not need to select the same
> segment again. Shared code and visual components may remain centralized, but
> browsing, search, records, navigation, and future permission enforcement must
> respect each segment's boundaries.

Part 6 established what is already true. This part sets out three ways to finish
it, with desktop and mobile previews of each, and then answers your questions 6,
7 and 8.

---

## 1. The architectural position, in one page

**The content is already segment-owned.** `cases.js` filters by area before
anything else happens, the three pages already accept `?area=`, and the segment
page already links all three with the area attached (UX-083).

**The content is also already on the segment page** — a segment's "Field Cases"
are, record for record, its own Lessons Learned and Alerts tabs (UX-082). So the
work is consolidation, not construction.

**What has to change is the boundary and the chrome**, in four measured places:
the Area select in the list (UX-084), the required Area field in the pre-job pack
(UX-085), the bare `cases.html` link in the topbar (UX-086), and the filing form's
company-wide identity (UX-087).

**And one thing has to be designed first, not last:** three of the eleven
operational segments have zero field knowledge (UX-090). A segment-embedded
design that looks good with 12 entries and broken with 0 is the wrong design.

### The vocabulary this proposes

"Field Cases" promises ten card types and currently delivers two (UX-088). All
three approaches below use **Field knowledge** as the segment-level name, with
*cases*, *lessons*, *alerts* and *pre-job packs* as what it contains. That keeps
the promise honest today and still fits when the other eight types arrive.

---

## 2. The three approaches

Previews are real HTML, built on the real tokens and fonts, rendered from the
repository at 1440×980 and 390×844:

```
docs/design-audit/previews/
  preview.css                       the chrome and primitives all three share
  approach-a-knowledge-bed.html
  approach-b-segment-tab.html
  approach-c-field-desk.html
  shots/{a,b,c}-{desktop,mobile}.png
```

Every entry shown in them is a **real Coiled Tubing record** — the three lessons
learned and one technical alert that `forArea('coiled-tubing')` actually returns,
with their real numbers and dates. Nothing is invented. Each preview carries a
"DESIGN PREVIEW" bar so no screenshot can be mistaken for the live application.

---

### Approach A — Knowledge Bed

*Field knowledge becomes a band in the segment page itself. No new route, no new
tab, no destination at all.*

**Preview** `shots/a-desktop.png` · `shots/a-mobile.png` · 1,590px desktop /
2,620px mobile.

**How it works.** The existing 198px teaser strip grows into a full bed with the
same horizontal-strata logic the segment page already uses. A header carries the
count and a **"This segment only"** lock chip. Beneath it, four *lenses* — the
pre-job pack's own groups, used as the way in: Failures to watch · Tool limits &
alerts · What worked · Lessons learned, each with its live count, zeros greyed
rather than hidden. The list sits left; a pre-job builder and a "What I filed
here" panel sit right. A footer carries the route sentence and the two actions.

**Navigation** None added. The segment page stays one URL.
**Scoping** By construction — there is no area control anywhere, because the page
*is* the area.
**Cards & lists** Strata rows: letter mark, title, type, date, number. No excerpt,
because there is none (UX-089).
**Empty state** The second bed in the preview shows Slickline: the bed does not
hide, it asks. *"The first case filed here is the one everyone else reads."*
**Mobile** Lenses go 4 → 2 columns, the side panel drops below the list, actions
go full width.

**Advantages**
- Truest to the approved landing-page and segment concept — it is the strata idea
  applied to knowledge.
- Zero new routes, zero new navigation, nothing to learn.
- Cheapest of the three: the strip, the data calls and the links all exist.
- Satisfies "should not need to select the segment again" absolutely, because
  there is nothing to select.

**Drawbacks**
- **Capacity.** It is a band on a page that already carries 36 documents and nine
  tabs. Well Safety's 12 entries fit; a segment with 60 would not.
- **Unbalanced at small counts.** Visible in the preview: with 3 rows listed and a
  tall pre-job panel beside them, the left column leaves ~250px of white. Real,
  and the honest cost of a fixed two-column band.
- No room for the full filter set — service, ending, hole size, location and
  formation would have to live behind a "more" control or move to the full list.
- The segment page grows by ~400px for everyone, including people who never file.

**Landing-page compatibility** Perfect. It changes nothing above it.

---

### Approach B — Segment Knowledge Tab

*Field knowledge becomes a tab on the segment's own tab bar, at the same URL.*

**Preview** `shots/b-desktop.png` · `shots/b-mobile.png` · 1,030px desktop /
1,904px mobile.

**How it works.** The segment page already has a sticky tab bar (All · Standards ·
SOPs · Manuals · Forms · Bulletins · Alerts · Lessons Learned · Software). Field
knowledge becomes a tab on it — and absorbs the Alerts and Lessons Learned tabs,
which are the same records (UX-082). Selecting it replaces the document table with
a three-column workspace: a counted left rail, the list in the centre with
case-specific filter chips and a scoped search box, and two side panes — a dark
"Going out on a job?" pre-job starter and a quiet "Add to Coiled Tubing" filing
card. URL: `segment.html?id=coiled-tubing&view=knowledge`.

**Navigation** One tab. Back is the tab bar. Deep-linkable.
**Scoping** The page is the segment, so again there is no area control. The rail
carries an explicit note: *"You are inside Coiled Tubing… To read another
segment's knowledge, open that segment."*
**Cards & lists** Same entry row as A, in a bordered list card.
**Empty state** The rail's zeros stay visible and the centre carries the same
ask-don't-apologise panel as A.
**Mobile** The rail becomes a horizontal chip scroller, the panes stack below.

**Advantages**
- **Best capacity-to-continuity ratio.** It has room for the full filter set, the
  rail, "What I filed" and pre-job, without leaving the segment or lengthening
  the page for people who do not want it.
- It is the one approach that **resolves the duplication** cleanly: two existing
  tabs collapse into one better one, so the segment page gets *simpler*.
- Reuses the count-bearing rail that Part 3 identified as the best navigation
  pattern in the product (UX-030), which currently exists only on the Master List.
- Deep-linkable and bookmarkable per segment.

**Drawbacks**
- Collapsing Alerts and Lessons Learned into a new tab changes a bar people
  already use. It is the right change, but it is a change, and it needs saying
  out loud in the release note.
- The tab bar is already nine wide; at 390px it is a horizontal scroller and
  Field knowledge sits last, so it may be missed on a phone until the order is
  reconsidered.
- A tab view that behaves unlike the other eight tabs (workspace, not table) is a
  small inconsistency to carry deliberately.

**Landing-page compatibility** Perfect — nothing above the tab bar moves.

---

### Approach C — Segment Field Desk

*The existing `cases.html` and `prejob.html` keep their routes and their code, but
are entered in segment mode and never let go of the segment.*

**Preview** `shots/c-desktop.png` · `shots/c-mobile.png` · 981px desktop /
2,107px mobile.

**How it works.** A sticky near-black identity bar sits under the topbar and stays
on screen: a "‹ Coiled Tubing" return control, "Field knowledge · Coiled Tubing
Operations · 4 released", and a **"Scoped to this segment"** lock chip in place of
the Area select. Below it, the register-grade workbench the Master List already
proves: a counted left rail (including "What I filed" and "Returned to me"), one
filter bar with a visible active-filter count, and a dense table with type, date,
number and a row menu.

**Navigation** Still a destination, but one that wears the segment continuously
and returns to it.
**Scoping** The lock chip replaces the chooser. The rail's footer states the rule:
*"A segment you do not work in is not listed here and not reachable from here."*
**Cards & lists** A real table on desktop; on mobile it becomes stacked rows with
the key fact first — the treatment `cases.html` already does well.
**Empty state** Same component as A and B.
**Mobile** Identity bar stays sticky; the rail becomes a scroller; the table
stacks.

**Advantages**
- **Most capacity by far.** The full filter set, sorting, bulk selection, saved
  views and 60+ rows all fit without compromise. The only approach that scales to
  a segment with a mature library.
- **Smallest change to existing code**: the page, its filters, its matching and
  its tests stay; the Area select becomes a chip and the chrome gains a bar.
- Delivers Part 3's register findings (UX-028 filter bar, UX-030 counted rail,
  UX-031 density) in the place they were always needed.
- Works identically for the pre-job pack, which is the same shape of problem.

**Drawbacks**
- **It is still a destination.** It wears the segment well, but the user does
  leave the segment page, which is the thing you asked to avoid. The identity bar
  mitigates it; it does not remove it.
- Heaviest chrome of the three: topbar + identity bar + rail before any content —
  on a phone that is ~200px before the first row.
- The dense table is the least "RISE Signature" of the three and the most
  "enterprise tool".

**Landing-page compatibility** Fine — it never touches the landing page or the
segment page's structure.

---

## 3. Comparison

| | **A — Knowledge Bed** | **B — Segment Tab** | **C — Field Desk** |
|---|---|---|---|
| New route | none | none (`&view=`) | existing route, new mode |
| Leaves the segment | never | never | yes, but wears it |
| Capacity | ~12 entries | ~40 entries | unlimited |
| Resolves UX-082 duplication | partly | **fully** | no |
| Full case filter set | no | yes | **yes, plus sort/bulk** |
| Build cost | **lowest** | medium | low-medium |
| Regression risk | low | **medium** (changes an existing tab bar) | low |
| Continuity with approved design | **highest** | high | medium |
| Mobile first screen | long page | tab + scroller | heaviest chrome |

**My recommendation: B, with C's desk kept as the overflow.**

B is the only one that makes the segment page *simpler* while adding capability —
it collapses two duplicate tabs into one surface that can actually hold the
filters, the rail, the filing route and the pre-job starter. A is lovely and
cheap, but it is a band with a ceiling, and that ceiling is roughly Well Safety's
current size. C is the right destination for a controller or a director working
through a long list, which is why I would keep it: **B is where a field user
lives, C is where it opens out to when they press "open the full desk".** They
share the rail, the filter bar, the entry row and the empty state, so keeping both
costs one route and no duplicate components.

If you want the lowest-risk first move instead: **ship A**, because it is the
existing strip grown up, and it is reversible.

---

## 4. What is preserved, and how

You asked specifically about existing cases, approval workflows, search and
pre-job matching. None of them needs to change.

### 4.1 Existing cases

Nothing is migrated, re-numbered or re-keyed. All three approaches read the same
`TAQA_CASES.forArea(id)` / `match({area: id}, …)` the segment strip already calls.
A record's document number, revision, review date and register position are
untouched, and register-sourced entries keep opening in `viewer.html` exactly as
they do now (UX-088).

### 4.2 Approval workflow

Untouched, in both directions:

- **Filing** still goes through `TAQA_CASES.file()` → `TAQA_STORE.add` → the
  register's own numbering. The route is still *you file it → QMS checks it → the
  area's Director releases it*, and the three-step strip that states it stays.
- **Visibility before release** still follows the existing rule — filer, QMS, that
  area's Director, and the External Auditor — which the review confirmed is
  working (0 unreleased entries leaked to any role).
- **Separation of duties, delegation and returns** all live in `store.js` and
  `roles.js` and are not touched by a presentation change.
- `canFile(area)` already returns the right answer per role and per segment, and
  the control is already hidden when it says no. All three previews keep that.

### 4.3 Search

Two layers, both preserved:

- **Within field knowledge**, search is `match(filters, query)` with
  `filters.area` set. Because the area is a pre-filter, a scoped search is the
  existing search with one argument supplied — the ranking rules do not change.
- **Global search** (`ai-search.html`) keeps working across all 26 areas. It
  already has a segment filter (`f-segment`) but no `?area=` entry point, so it
  cannot be entered pre-scoped (UX-091 in Part 6 / refines UX-053). Adding
  `ai-search.html?area=<id>` to pre-set that existing filter is the whole change,
  and it leaves global search intact for anyone who wants it.

### 4.4 Pre-job matching

**This is the part most at risk in a careless redesign, and it is the part that
needs no change at all.** `match()` applies `filters.area` as a hard pre-filter
*before* a single score is computed. Scoping to a segment therefore changes the
candidate set and nothing else — the weights (service on card 5, title 5, number
6, hole size 2, formation 2, location 1, note word 1 each) and the explainable
`why[]` sentences behave identically.

What the three approaches change is only *where the pack is started from* and the
removal of the "Area*" question (UX-085). The pack itself — its groups, its
ranking, its reasons, its print and export — is untouched.

---

## 5. What shared components deliver this, without rewriting functionality

This is the answer to your question 7, and it is most of the work.

`preview.css` in the previews is a working demonstration: **all three approaches
are built from the same nine primitives**, and the differences between them are
layout, not components.

| Component | What it is | Used by | Already exists as |
|---|---|---|---|
| **Entry row** | mark · title · type · date · number, whole row clickable | A, B, C | `.sc-list li` in `segment.html` — generalise it |
| **Letter mark** | the 32px `LL` / `ALT` / `INC` tile | A, B, C | `.sc-mark`, as-is |
| **Counted rail** | label + count, zeros greyed, current highlighted | B, C | the Master List sidebar (UX-030) — extract it |
| **Lens / group tile** | the four pre-job groups with counts | A (B as rail rows) | `TAQA_CASES.GROUPS`, no UI yet |
| **Filter bar** | chips + scoped search + active-filter count + mobile sheet | B, C | `cases.html` `.cl-flt` sheet — extract it (UX-028) |
| **Lock chip** | "This segment only" / "Scoped to this segment" | A, B, C | new, ~20 lines |
| **Empty state** | heading + why + the two actions | A, B, C | new, one component for all three (UX-072) |
| **Pre-job starter** | service chips + hole + location + build | A, B, C | `prejob.html` controls, re-housed |
| **Status badge** | Register / In force / With QMS / Returned | A, B, C | the five state inks already in `shared.js` (UX-010) |

Two consequences worth stating plainly:

1. **Choosing between A, B and C does not change the component work.** Roughly
   85% of the build is the same nine components whichever you pick, which is why
   this decision is safe to take on how it *feels* rather than on cost.
2. **Every one of these is a Part 3 design-system item** — UX-010 status badge,
   UX-028 filter bar, UX-030 counted rail, UX-072 empty state. Building Field
   Knowledge properly builds a third of the design system, in the place where it
   is most needed.

**No functional rewrite is required.** `cases.js`, `store.js`, `roles.js`,
`cases-data.js` and `search-index.js` are untouched by all three. The changes are:
a presentation layer over calls that already exist, one area argument supplied by
the page instead of by a dropdown, and the removal of three area controls.

---

## 6. Prototype limits, and where real authorisation goes

You asked for this to stay clearly distinguished. It must be, and the codebase
already says so in its own words.

### What the prototype does — frontend filtering

Everything described above is **browser-side filtering of demonstration data**.
`roles.js` opens with its own warning:

> ⚠ THIS IS A SPECIFICATION, NOT A SECURITY CONTROL. Everything here runs in the
> browser, so it can be bypassed by opening a page directly or reading
> `documents-master.js`. It exists to define, unambiguously, which role may do
> what, so the back end can enforce the same matrix server-side. The API must
> filter what it returns; the client must never be the thing deciding what a user
> is allowed to see.

`cases.js` says the same about its own filtering: *"In production the server
applies these rules; here the prototype filters its own demonstration data in the
browser."*

So, precisely:

- A locked segment chip instead of a dropdown is **a user-experience boundary, not
  a security boundary.** It stops a Coiled Tubing user wandering into Wireline by
  accident. It does not stop anyone who edits a URL.
- The same is true of every role behaviour the review confirmed: the hidden "Add a
  case" control, the Director's dashboard refusal, the 4 / 5 / 6 visibility
  difference. All correct, all cosmetic in the prototype sense.
- **No claim in Parts 6 or 7 should be read as a verified security control.**

### What production must do — backend authorisation

`roles.js` already names the target: **Entra ID group membership → SSO claim →
server-side authorisation on every document and every control action.** For
segment-scoped field knowledge that means, specifically:

1. The segment is derived from **the signed-in person's claims**, not from the
   `?area=` parameter. The parameter becomes a request, not an assertion.
2. The list endpoint **returns only** what the caller may read in that segment;
   the client never receives another segment's records and then hides them.
3. Filing is authorised server-side against the same `canFile(area)` matrix,
   including the Director-files-only-for-their-own-segment rule.
4. Unreleased records are filtered server-side by the filer / QMS / that area's
   Director / Auditor rule — not by a client-side `canView()`.
5. The pre-job pack is built from an already-authorised candidate set, so the
   scoring never sees a record the caller may not read.
6. Your decision 4 (Directors see only their own segment; QMS follows its
   assigned responsibilities) becomes a **server-side claim check**, with the
   prototype's behaviour as the specification it is tested against.

A useful property of the architecture: because `filters.area` is already a hard
pre-filter applied before everything else, **the place where the server will
enforce the boundary is the same place the client currently filters.** The
frontend work does not have to be undone to make it real.

---

## 7. Your decisions, recorded

| # | Decision | Where it lands |
|---|---|---|
| 1 | Direction C — RISE Signature, with B's productivity features | Part 4 §3; the previews here are drawn in it |
| 2 | Landing page and segment expand/collapse unchanged | Enforced: no approach touches either |
| 3 | Role switching only in a marked development/demo mode | UX-006, Phase 0 — now unblocked, was awaiting your call |
| 4 | Directors see only their authorised segment dashboards; QMS cross-segment per its responsibilities | Already true in the prototype (verified, Part 6 §5). UX-041 closes as "working as intended"; UX-094 asks the one open question — Maintenance Managers |
| 5 | No fictional contributors shown as real in production recognition | UX-078, Phase 0 |

---

## 8. What I need from you next

1. **A, B or C** — or B+C as recommended.
2. **UX-093** — may a Maintenance Manager *read* a segment's field knowledge?
   Today the segment strip says no and the library says yes.
3. **UX-094** — is a Maintenance Manager per-segment like a Director, or
   cross-segment like QMS?
4. **UX-082** — are you content for Field knowledge to absorb the segment page's
   "Lessons Learned" and "Alerts" tabs (approach B), or must those tabs stay?

Nothing will be implemented until you answer. Phase 0 and Phase 1 of the roadmap
remain direction-independent and can start whenever you say.
