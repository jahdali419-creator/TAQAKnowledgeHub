# RISE — Design Audit · Part 6: Field Knowledge, in depth

**Date** 5 November 2026 · **Status** review only. No application file was changed.

Part 1 listed `cases.html`, `case.html`, `case-new.html` and `prejob.html` among
the routes it opened, and listed "modal and dropdown interiors", "case.html with a
real record" and "role-specific workflows" among the ten things it did **not**
inspect. This part closes those gaps for the four Field Knowledge pages, and adds
findings UX-082 … UX-093.

Everything here was measured by driving the running application. Where a number
appears, it came off the page.

---

## 1. The finding that changes the brief

> **Today, a segment's "Field Cases" are exactly that segment's "Lessons Learned"
> and "Alerts" tabs. Same records. Two brands. Two routes.**

Measured by opening each segment page and comparing its own tab counts against
what `TAQA_CASES.forArea()` returns:

| Segment | Segment page tabs | Field Cases for the area | Same records? |
|---|---|---|---|
| Coiled Tubing | Lessons Learned **3** + Alerts **1** | **4** | Yes — 3 × `LL`, 1 × `ALT` |
| Drilling Services | Lessons Learned **5** + Alerts **6** | **11** | Yes — 5 × `LL`, 6 × `ALT` |
| Well Safety | Lessons Learned **8** + Alerts **4** | **12** | Yes — 8 × `LL`, 4 × `ALT` |
| Slickline | 0 + 0 | **0** | Yes — both empty |

This matters for the architecture you asked for. Embedding Field Knowledge in the
segment is **not adding a surface — it is removing a duplicate one.** The segment
page already holds 100% of today's field-knowledge *content*. What the separate
Field Cases destination adds is not records; it is four things the segment page
has no equivalent of:

1. **Case-specific filters** — service, hole size, ending, location, formation.
2. **The pre-job pack** — a scored, explainable match against a planned job.
3. **The filing route** — ten card types, QMS check, Director release.
4. **A case-shaped reading view** (`case.html`) for records that carry a card.

So the design question is not "where do we put cases". It is: **the segment page
should own the content, and gain the four capabilities that currently justify a
separate destination.**

---

## 2. The architecture is already about 70% built

This was the biggest surprise of the review, and it is good news.

**`cases.js` is already segment-aware at the data layer.** It exposes
`operational()` (the 11 operational segments), `forArea(id)`, `canFile(area)`,
`isOperational(id)`, area-specific option lists (`OPTIONS.services(area)`,
`.endings(area)`, `.findings(area)`, `.tripOut(area)`), and `match(filters, query)`
where `filters.area` is applied as a **hard pre-filter before any scoring runs**.
Measured: `match({area:'coiled-tubing'})` returns 4; `match({})` returns 50.

**The three pages already accept `?area=`.** Opening
`cases.html?area=coiled-tubing` gives a document title of
*"Coiled Tubing field cases, RISE"*, four rows instead of fifty, the area's own
service and ending lists, the area's photo, and onward links that carry the area
(`prejob.html?area=coiled-tubing`, `case-new.html?area=coiled-tubing`).
`prejob.html?area=…` titles itself *"Coiled Tubing pre-job pack, RISE"*.

**The segment page already links all three.** `segment.html` renders a Field
Cases strip on the eleven operational segments, in the Operations view only,
released entries only. Measured on Coiled Tubing: it sits 525px down a 1,511px
page, is 198px tall (13.1% of the page), lists the 3 latest entries and offers
"See all cases", "Pre-job pack" and "Add a case" — each already carrying
`?area=coiled-tubing`.

**What is missing is therefore narrow and specific:**

- the strip is a teaser that *leaves* the segment rather than a place to work;
- once you arrive, nothing holds the boundary (section 3);
- the chrome does not carry the segment (section 3);
- the segment page's own Lessons/Alerts tabs and the Field Cases library do not
  know about each other (section 1).

---

## 3. Where the boundary leaks — measured

Your requirement: *"A user already inside a segment should not need to select the
same segment again."* Four places break it today.

### UX-082 `[C]` A segment's field cases and its Lessons/Alerts tabs are the same records
**Where** `segment.html?id=<area>` vs `cases.html?area=<area>`. **Saw** the table
in section 1. **Problem** The same document is presented twice under two names,
two visual treatments and two routes, and neither acknowledges the other.
**Do** Make the segment the single home: one Field Knowledge surface that contains
the lessons and alerts rather than duplicating them.
**H / M / P0 / All / Both** · segment tab counts + `TAQA_CASES.forArea()`

### UX-083 `[C]` The segment-scoped routes exist and the segment page already uses them
**Where** `segment.html:2779-2781`. **Saw** all three links already carry
`?area=`. **Problem** None — this is a strength, recorded so the roadmap does not
budget for work that is done. **Do** Build on it rather than replacing it.
**— / — / — / All / Both** · strength

### UX-084 `[C]` Inside a segment's own list, the Area select still offers all twelve
**Where** `cases.html?area=coiled-tubing`, control `#cl-area`. **Saw**
`value="coiled-tubing"` with **12 options** — a blank plus all eleven operational
segments. Confirmed identically inside the **mobile filter sheet** at 390px, which
the first audit never opened. **Problem** A Coiled Tubing employee who has arrived
from the Coiled Tubing page is invited to become a Wireline reader by accident.
It is also the control that makes the page feel company-wide.
**Do** Replace the select with a locked segment chip when `?area=` is present.
**H / S / P0 / All / Both** · probe + mobile sheet screenshot

### UX-085 `[C]` The pre-job pack asks for the area again, as a required field
**Where** `prejob.html?area=coiled-tubing`, control `#pj-area`, labelled **"Area*"**.
**Saw** a 12-option `<select>`, pre-set to Coiled Tubing but fully re-selectable
and presented as a required question. **Problem** The first thing a Coiled Tubing
user sees on their own pre-job pack is a question they have already answered.
**Do** When entered with an area, state it; do not ask it.
**H / S / P0 / All / Both** · probe

### UX-086 `[C]` The topbar silently drops the segment
**Where** `#navbar` on every page. **Saw** the primary link is a bare
`cases.html` with no area; the mobile menu is the same. **Problem** A user inside
Coiled Tubing who taps "Cases" in the chrome lands in the company-wide library.
The segment is lost by navigating, without any signal that it was.
**Do** Either make the chrome link area-aware inside a segment, or remove Field
Cases from the global chrome entirely once it lives in the segment.
**H / S / P1 / All / Both** · nav href inventory

### UX-087 `[C]` The filing form is scoped in its data but not in its identity
**Where** `case-new.html?area=coiled-tubing`. **Saw** the breadcrumb reads
**"FIELD CASES / ADD A CASE"**, the title is **"Add a case"**, and the standfirst
says the case "is filed for an operational segment" — generic. The area control
`#f-area` is prefilled to Coiled Tubing but is a **12-option select**.
**Problem** Nothing on the screen says you are filing *for Coiled Tubing*, and the
one thing that does is a chooser.
**Do** Title it for the segment, make the segment a stated fact, and keep the
chooser only for the case where no area was supplied.
**H / S / P1 / Employee / Both** · screenshot + probe

---

## 4. The four pages, reviewed

### 4.1 `cases.html` — the library

**Measured** 1,450px at 1440×900 with an area set; 2,154px at 390px. Five filter
controls (`#cl-area`, `#cl-type`, `#cl-loc`, `#cl-svc`, `#cl-hole`) plus an
ended-with chip row. Mobile collapses the filters into a bottom sheet — a real
modal, opened for the first time in this review: it holds all five fields, is
scroll-contained with a sticky footer, and respects the safe-area inset. That
sheet is good work.

**Role behaviour, measured on `?area=coiled-tubing`:**

| Role | Entries listed | May file here | "Add a case" shown |
|---|---|---|---|
| Employee | 4 | yes | yes |
| QMS / Document Controller | 6 | no — *"Field cases are filed by operations"* | **no** |
| Director (holds Coiled Tubing) | 5 | yes | yes |
| Director (holds Drilling) | 5 | no — *"you file cases for Drilling Services only"* | **no** |
| Maintenance Manager | 5 | no | **no** |
| External Auditor | 6 | no — *"Your role cannot file documents"* | **no** |

Two things to record. First, **the Add control is correctly hidden for every role
that cannot file** — I expected to find it leaking and it does not. Second, the
counts differ by role (4 / 5 / 6), which is `TAQA_STORE.readable` applying
classification correctly. Both are strengths.

**UX-088 `[C]` Every entry in the library is a register document, and `case.html` is unreachable**
**Saw** all 50 visible entries have `source: "register"` and a URL of
`viewer.html?doc=…&rev=…`. **Zero** open in `case.html`.
`TAQA_CASES_SHIPPED` is `[]` — empty deliberately, with the comment *"RISE never
shows an invented case."* **Problem** Not a defect — but it means the Field Cases
brand currently promises ten card types (case study, incident card, benchmark,
appreciation, expert…) and delivers two (lesson learned, technical alert), and the
case-shaped reading view has no reachable content. The first audit saw `case.html`
empty for exactly this reason.
**Do** Design the segment surface for what is actually there now, and let the
other eight types appear as they are filed.
**M / — / P1 / All / Both** · URL inventory + `cases-data.js:56`

**UX-089 `[C]` No entry has a summary**
**Saw** `summary` is empty on every one of the 50. **Problem** Any card design
with a two-line excerpt renders blank 50 times out of 50. **Do** Design the row
around title + type + date + number, which is what exists. (All three previews in
Part 7 do.) **M / — / P1 / All / Both**

**UX-090 `[C]` Three of eleven operational segments have no field knowledge at all**
**Saw** released entries per segment: Well Safety 12, Drilling 11, Inspection 7,
Fracturing 5, Cementing 5, Coiled Tubing 4, Wireline 3, Well Testing 3,
**Slickline 0, Well Completions 0, Marine Services 0.**
**Problem** In a company-wide list of 50 this is invisible. The moment field
knowledge is embedded per segment, **27% of segments open on nothing** — so the
empty state is not an edge case, it is one of the three main states.
**Do** The empty state must be the first thing designed, and it must ask rather
than apologise. **H / S / P0 / All / Both** · `forArea()` per segment

### 4.2 `case-new.html` — case submission

This is one of the better pages in the product and the first audit undersold it.

**Measured** 6,676px tall. Five numbered sections (What and where · The case ·
Where it happened · Incident card · Source and sharing), the fourth expanding into
six sub-sections for an incident card. A **sticky progress rail** down the left
listing every step with a live "N to fill" count and "0 of 4 required steps ready".
A **sticky action bar** reading "Not saved yet · Save draft · Download JSON ·
Submit for review". **Autosave is real** — a 1,200ms debounce calling
`saveDraft(false)`, with the bar carrying the state. A three-step route strip at
the top: *You file it → QMS checks it → The area's Director releases it*. Ten
content types as labelled cards with their register marks.

**UX-091 `[C]` A 6,676px form on one page, with the rail as the only wayfinding**
**Problem** At 1440×900 that is seven and a half screens. The rail is good and
sticky, but a person filling an incident card scrolls through eleven sections with
no sense of being nearly done beyond a progress bar. **Do** Keep the single
document — it is right for a form people half-complete and return to — but
collapse completed sections, and let the rail jump *and* collapse.
**M / M / P2 / Employee / Both** · measured height + screenshot

What **not** to change: the progress rail, the autosave, the route strip and the
ten typed cards are all strong, and the "N to fill" counts are better than most
enterprise forms.

### 4.3 `case.html` — case detail

**Measured** Not reachable from any list in a clean install (UX-088), so this
review inspected its structure rather than a live record. It has a breadcrumb
(`.cs-crumb` with `aria-current` on the leaf), a dark identity band, a facts card
that overlaps the band by −60px, typed sections, and action buttons (`.cs-btn`).

**UX-092 `[C]` The case breadcrumb is built for a company-wide library**
**Where** `case.html`. **Problem** The crumb is designed to come from the Field
Cases list, not from a segment. Under the architecture you have asked for, a case
opened from inside Coiled Tubing must return the reader to Coiled Tubing.
**Do** Make the crumb carry the segment, and make the back target the referring
segment when one is known. **M / S / P1 / All / Both**

Because `case.html` could not be exercised with a real record, **its states
(withdrawn, returned, unreleased, another segment's) remain unverified.** They are
listed in Part 7 as something to walk before the redesign is specified, not
something this review can claim to have checked.

### 4.4 `prejob.html` — the pre-job pack

**Measured** 1,460px with an area set. Five service chips for Coiled Tubing
(Nitrogen injection, Milling, Acid stimulation, Fishing, Logging while CT), five
endings, and the `#pj-area` select covered in UX-085.

**The matching is the most valuable thing in this whole area, and it is already
segment-safe.** `match(filters, prefer)` applies `filters.area` as a hard
pre-filter, then scores what remains:

| Signal | Weight |
|---|---|
| Query word in the document number | 6 |
| Query word in the title | 5 |
| Service on the card matches a planned service | 5 |
| Query word in the summary | 2 |
| Named service *mentioned* in title/summary (whole word) | 2 |
| Same hole size | 2 |
| Shared formation token | 2 |
| Same location | 1 |
| Each note word found in the entry | 1 |

Every contribution appends a human sentence to `why[]` — *"Same service: Fishing"*,
*"Same hole size: 3 1/2 in"*, *"Same formation: …"* — and when nothing else
matched, *"Same area: …"*. **Because the area filter runs before scoring, scoping
the pack to a segment changes nothing about how it ranks.** That is the single
most important preservation fact in Part 7.

---

## 5. Role-specific behaviour the first audit did not cover

### UX-093 `[C]` The Maintenance boundary is enforced on one surface and not the other
**Saw** On `segment.html?id=coiled-tubing` the Field Cases strip is **hidden** for
a Maintenance Manager and in the Maintenance view (by design: *"field cases are
filed by operations"*). But `cases.html?area=coiled-tubing` serves that same
Maintenance Manager the full list of 5.
**Problem** Reading is denied in one place and granted in another, for the same
person and the same records. One of the two is wrong, and only you can say which.
**Do** Decide whether Maintenance *reads* field knowledge (I would say yes — a
maintenance manager has every reason to read an incident card) and make both
surfaces agree. **M / S / P1 / Manager / Both**

### UX-094 `[C]` Maintenance Managers reach any segment's dashboard; Directors reach only their own
**Saw** on `dashboard.html?id=coiled-tubing`: a Director holding Drilling is
refused (*"Managing an area is its director's desk"*), an Employee and an Auditor
are refused, and the Coiled Tubing Director is admitted — **all correct against
your decision 4**. But a Maintenance Manager holding Coiled Tubing is admitted,
and QMS is admitted, to **any** segment's dashboard.
**Problem** QMS cross-segment access is your decision 4 and is intended. The
Maintenance Manager's is not stated either way.
**Do** Confirm whether a Maintenance Manager is per-segment like a Director or
cross-segment like QMS. This is a permission question, not a design one.
**M / S / P1 / Manager / Both** · role × dashboard matrix

### Confirmed correct, for the record

- A Director of Drilling **cannot** open Coiled Tubing's dashboard. Your decision
  4 is already honoured in the prototype's own rules.
- Role-differential readability works: the same segment's library shows 4 entries
  to an Employee, 5 to a Director, 6 to QMS and 6 to an Auditor.
- Filing authority is correctly scoped: a Director may file only for their own
  segment, and the control is hidden — not merely disabled — for every role that
  may not file.
- Unreleased work is correctly invisible: 0 unreleased entries are visible to any
  role in a clean state, and `cases.js` documents the rule
  (filer + QMS + that area's Director + Auditor).

---

## 6. What this review still could not check

Carried forward honestly, in the same spirit as Part 1:

1. **`case.html` with a real filed record**, and therefore its withdrawn,
   returned, superseded and cross-segment states.
2. **A full submit → QMS check → Director release walk through the UI** for a
   *case* specifically (the earlier walk was for documents, via the store API).
3. **The remaining modals**: the document "More" menu, the delegate dialog, the
   share sheet, the bookmarks panel and the Areas mega-menu. Only the mobile
   filter sheet was opened for this review.
4. **Arabic / RTL** on any of these four pages.
5. **Keyboard traversal and screen-reader output** on the filter sheet and the
   progress rail — both are the kind of control where that matters most.

---

## 7. New findings added here

UX-082 · UX-083 · UX-084 · UX-085 · UX-086 · UX-087 · UX-088 · UX-089 · UX-090 ·
UX-091 · UX-092 · UX-093 · UX-094.

Running total: **94 findings** (UX-001 … UX-094, with UX-083 recorded as a
strength rather than a defect).
