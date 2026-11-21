# RISE — Design Audit · Part 8: Field Knowledge, refined design (B + C)

**Design only. Nothing implemented, nothing merged, nothing deployed.**
No application file is changed by this part. Awaiting your approval of the
previews before any development begins.

---

## 1. Your decisions, as built into these previews

| # | Decision | How it appears |
|---|---|---|
| Approach | **B primary, C as an optional detailed desk** | Everything lives on the segment page's Field knowledge tab. The desk is reachable from one quiet link and wears a locked segment identity with an explicit way back |
| Role 1 | Maintenance Managers may **read** released field knowledge in their authorised segment, subject to classification | Preview 7 |
| Role 2 | Maintenance Managers manage **their assigned segment's** maintenance department by default | Preview 7, rail note and "Your own desk" panel |
| Role 3 | QMS keeps only its authorised cross-segment responsibilities | Unchanged from today; no preview changes it |
| Role 4 | Employees and Directors follow their segment and document permissions | Unchanged; the filing control appears only where `canFile(area)` allows |
| Role 5 | **Reading never grants submit, review, approve or modify** | Preview 7 states it in words and omits the controls entirely |
| Tabs | Do **not** remove Lessons Learned and Technical Alerts blindly | Section 5 — a four-stage migration that removes nothing until you say so |
| Pre-job | Inside the segment, segment used automatically, one of the two main actions | Previews 1 and 5 |
| Pre-job | Must not be presented as replacing approved job safety documentation | A standing caution block, new in this design — section 6 |

---

## 2. The previews

Real HTML on the real tokens and fonts, rendered from the repository. Every
record shown is a genuine Coiled Tubing register record with its real number,
revision and date. Measured at 1440×980 and 390×844:

| # | Preview | File | Desktop | Mobile |
|---|---|---|---|---|
| 1 | Field Knowledge overview | `v2/b1-overview.html` | 1,507px | 2,667px |
| 2 | Field Cases listing | `v2/b2-cases-listing.html` | 1,275px | 2,046px |
| 3 | Case detail (example card) | `v2/b3-case-detail.html` | 2,676px | 3,468px |
| 4 | Add a case | `v2/b4-add-case.html` | 1,548px | 2,608px |
| 5 | Pre-job experience | `v2/b5-prejob.html` | 1,778px | 3,931px |
| 6 | Empty segment — Slickline | `v2/b6-empty-slickline.html` | 1,037px | 1,709px |
| 7 | Maintenance Manager, read only | `v2/b7-maintenance-readonly.html` | 1,525px | 2,535px |
| 8 | Field Desk (Approach C, optional) | `v2/c-field-desk.html` | 980px | 1,900px |

Renders in `v2/shots/<name>-{desktop,mobile}.png`.

**Measured across all 16 renders:** zero horizontal overflow, zero interactive
targets under 44px, zero controls without an accessible name, zero console
errors, fonts loaded. The product's best property is kept.

### 2.1 Overview (preview 1)

The landing surface of the tab. A counted rail on the left; on the right, the
**two main actions side by side — Explore cases and Build a pre-job pack** — then
the alert shelf, then what was recently released, then "What I filed here" and
"Add to Coiled Tubing".

The **alert shelf** is the design answer to "prominent visibility of technical
alerts": a bordered, warm-toned band that sits above the list on every Field
Knowledge surface, states how many are in force, and carries each alert's
register number, revision and status. It is not a filter result that can be
filtered away.

### 2.2 Listing (preview 2)

Scoped search, the case-specific filter chips (service, ended with, hole size,
location, type, year) and a visible active-filter count. **Lessons learned and
Technical alerts stay separate, named categories** — the alerts above the fold in
their shelf, the lessons in their own counted block. Every row carries
`number · rev · status · issued`, so a controlled document never loses its
identity to a card design.

### 2.3 Case detail (preview 3)

The incident card as it will read: dark band, the facts card overlapping it, then
the six numbered sections the form collects — the incident, what was happening,
symptoms in order, what was tried (action / result / note), how it ended,
findings at surface. A "Where this came from" panel names the filer, the QMS
check and the Director's release. Related entries are **from this segment only**.

**This card is labelled "Example card · preview only" on the page itself**, and a
note at the bottom right says plainly that no filed case exists in the prototype
yet. RISE never shows an invented case as real, and neither does its design
preview.

### 2.4 Add a case (preview 4)

The form keeps everything that already works — the sticky progress rail with
"N to fill" per step, the autosave state, Save draft, Download JSON, Submit for
review, the ten typed cards, and the route strip. What changes is identity:
the title is **"File a Coiled Tubing case"**, the breadcrumb runs through the
segment, and the segment is a **stated fact in a locked field**, not a dropdown:

> **Coiled Tubing Operations** — Taken from where you came from. To file for
> another segment, open that segment.

### 2.5 Pre-job (preview 5)

Covered in section 6.

### 2.6 Empty segment (preview 6)

Slickline, one of three operational segments with nothing released. The empty
state is the page, not a fallback: it explains *why* it is empty (nothing has
been through QMS and the Director yet), offers the two next steps, and keeps the
pre-job button **visible but disabled with the reason stated** rather than hiding
it. A second card points out that the segment still has its SOPs — field
knowledge is empty, the segment is not.

### 2.7 Maintenance Manager (preview 7)

Read access to the one authorised segment. A banner states it plainly:
*"Here you read… **Your editing is in maintenance** — the maintenance department
of this segment — not in field cases and not in any other segment."*

**No pre-job pack is offered on this view at all** (owner, 5 Nov 2026). A pack is
built by the crew going out on the job; it is not the maintenance manager's work,
so it is not greyed out and not hidden behind a message — it is simply not there,
and a short card explains why.

The rail has no "What I filed". There is no Upload in the topbar, no file
control, no row actions. A "What you cannot do here" panel lists the five limits,
and a dark "Where your actions live" panel routes the manager to the Coiled
Tubing maintenance desk. **Controls are absent rather than shown-and-disabled.**

Open: the owner said "maybe cases" about whether a maintenance manager needs the
case list at all. The preview keeps it read-only, with technical alerts first,
on the grounds that a maintenance manager has a real reason to read an alert or
an equipment failure. Say the word and I will cut the list down to alerts only.

### 2.8 Field Desk (preview 8, Approach C)

The optional advanced surface. Sticky near-black identity bar carrying
**"Back to Coiled Tubing field knowledge"**, the segment name, and a
**"Locked to Coiled Tubing"** chip. Sorting, density, saved views, bulk
selection, a dense table. **There is no segment selector on the page at all**,
and the only way out is the way back.

---

## 3. What changes in navigation

| Today | After | Why |
|---|---|---|
| Segment page's Field Cases strip links out to `cases.html?area=…` | The strip becomes the **Field knowledge tab** on the segment's own tab bar, at `segment.html?id=<seg>&view=knowledge` | The user stays inside the segment |
| `cases.html` filter row carries a 12-option **Area select** | Replaced by a **locked segment chip** when a segment is in scope | UX-084 |
| Mobile filter sheet carries the same 12-option Area select | Same chip; the sheet keeps its other five fields | UX-084 |
| `prejob.html` asks **"Area\*"** as a required 12-option select | The segment is **stated, never asked** | UX-085, your pre-job decision |
| `case-new.html` shows a 12-option area select, prefilled | A **locked, stated segment field** | UX-087 |
| Topbar's primary **"Cases"** link is a bare `cases.html` | Becomes segment-aware inside a segment; the company-wide library stays reachable from Home and Search for anyone who wants it | UX-086 |
| A case's breadcrumb returns to the global Field Cases list | Returns to **the segment it was opened from** | UX-092 |
| No scoped search entry point | `ai-search.html?area=<id>` pre-sets the segment filter that already exists | UX-091 |
| Pre-job and Explore are equal-weight links in a strip | **Two primary actions** at the top of Field Knowledge | Your pre-job decision |

## 4. What does not change

- **The landing page.** Not touched. Not one rule.
- **The segment page's expand/collapse interaction and its document beds.**
  Untouched.
- **The eight existing document tabs** — All, Standards, SOPs, Manuals, Forms,
  Bulletins, Software, and (per section 5) Alerts and Lessons Learned.
- **Every route that exists today.** `cases.html`, `case.html`, `case-new.html`,
  `prejob.html`, `viewer.html` keep working, with or without `?area=`.
- **Existing deep links**, including `viewer.html?doc=…&rev=…` from a printed QR
  code or an email, and `?tab=alerts` / `?tab=lessons` on a segment page.
- **Document numbering, revisions, review dates, statuses and classification.**
  All register-owned, all displayed, none re-derived.
- **The approval route** — you file it → QMS checks it → the area's Director
  releases it — and the visibility rule before release (filer, QMS, that area's
  Director, External Auditor).
- **Separation of duties, delegation, returns and withdrawal** in `store.js` and
  `roles.js`.
- **The pre-job matching algorithm**, its weights and its `why[]` reasons.
- **The global library and global search**, for anyone whose job spans segments.
- `cases.js`, `store.js`, `roles.js`, `cases-data.js`, `search-index.js` —
  **no changes required by this design.**

---

## 5. Lessons Learned and Technical Alerts — a safe migration

You are right not to approve removal. The overlap I measured is a property of
*today's dataset*, not a permanent truth: once incident cards, case studies,
benchmarks and appreciations are filed, Field knowledge will hold content the two
tabs never will. **This design therefore removes nothing.**

### The rule

> Field knowledge is a **view over** the segment's records, not a new store and
> not a new home. Lessons learned and technical alerts keep their own named
> categories inside it, and keep their own tabs outside it, until you decide
> otherwise on evidence.

### Four stages, each independently reversible

**Stage 1 — Add, delete nothing.** The Field knowledge tab appears alongside
Alerts and Lessons Learned. Three tabs, the same records, three entry points.
**This is what the previews show**: the bar carries all nine of today's tabs plus
Field knowledge, with Alerts at 1 and Lessons Learned at 3 beside Field knowledge
at 4 — the counts match on purpose, and the page says so in a line under the bar.
With ten tabs the bar no longer fits one row at 1440px, so it wraps on a desk
screen and stays a horizontal scroller on a phone.
Field knowledge reads the identical register query the two tabs read, so counts
can never disagree. *Reversible by hiding one tab.*

**Stage 2 — One implementation, three doors.** Alerts and Lessons Learned stop
having their own rendering and instead open the Field knowledge view pre-filtered
to that category — same URL, same `?tab=` parameter, same count, same deep links.
There is now one piece of code and no duplicate behaviour, while every existing
link, bookmark and QR code still lands exactly where it did. *Reversible by
restoring the old renderer; no data or URL has moved.*

**Stage 3 — Watch, with a stated question.** Before anything is retired, answer:
do people reach alerts through the Alerts tab or through the shelf? The prototype
has no analytics backend, so this is **a pilot-and-ask step, not a metric I can
produce** — a defined period with real Coiled Tubing and Drilling users, and your
judgement. I will not pretend a number exists that does not.

**Stage 4 — Retire only what is proven redundant, and only with:**
- a redirect from the old tab parameter to the category, so no link breaks;
- the category's count still visible in the tab bar;
- a release note naming the change;
- the full regression suite green, plus a specific test that
  `?tab=alerts` and `?tab=lessons` still resolve.

**My recommendation on Stage 4: retire Lessons Learned if the evidence supports
it, and keep Technical Alerts permanently.** An alert is the one category where
being one click away matters for safety, and a dedicated tab costs almost
nothing. The alert shelf and the Alerts tab are not redundant with each other —
one is prominence inside the workspace, the other is a direct route from anywhere
on the segment page.

### What is preserved at every stage

| Requirement | How |
|---|---|
| Controlled document identity, revision, status | Every row and every detail view shows `number · rev · status · issued`; all read from the register |
| Prominent technical alerts | The alert shelf on every Field Knowledge surface, above the list, immune to filters; plus the Alerts tab retained |
| Existing register and deep links | No URL changes; register documents keep opening in `viewer.html` with their revision |
| Separate categories for Lessons Learned and Technical Alerts | Named, counted, separately navigable in the rail and separately blocked in the listing |
| The approval process | Untouched — presentation only |

---

## 6. Pre-job, refined

**It belongs to the segment.** Entered from Coiled Tubing, the pack is a Coiled
Tubing pack. The chip reads *"Coiled Tubing — used automatically"* and the form
header says *"The segment is already set. You are not asked for it."* There is no
area control on the page.

**It is one of the two main actions**, equal in weight to Explore cases, on the
Field Knowledge overview and reachable from the listing.

**Everything that works today is kept**, feature for feature:

| Preserved | In the preview |
|---|---|
| The matching algorithm and its weights | Unchanged; the area is already a hard pre-filter applied before scoring |
| The `why[]` reasons | "Same service: Fishing", "Same hole size: 3 1/2 in", "Mentions washpipe", "Same location: Saudi Arabia", "Same area: Coiled Tubing" — shown on each entry |
| Source references | Each row shows "Register document · issued <date>" with its number and revision |
| The group order | Tool limits and alerts first, then lessons learned, then the empty groups — shown, not hidden, so the crew sees they were checked |
| "Discussed" tick boxes | On every entry, with the count and progress bar in the rail |
| Ticks are local and temporary | Stated: "Ticks stay in this browser until the end of today. They are not saved to RISE." |
| Pack figures | In the pack · match the job · discussed |
| Show: all / matches only | Kept as a two-chip control |
| Print the pack, Copy link | Kept; the printed sheet keeps its header, job details, as-of stamp, tick boxes, the three signature lines and the uncontrolled-copy note |

**New, and required by your decision:** a standing caution, immediately under the
title, before any content:

> **A pre-job pack informs the conversation. It does not authorise the job.** It
> is not a job safety analysis, a permit to work, a risk assessment or any other
> approved operational authorisation, and it does not replace one. Use it
> alongside the approved job safety documentation your operation requires.

It appears on the pre-job surface and on the empty-segment page, and it is not
dismissible. No wording anywhere in this design suggests the pack substitutes for
operational authorisation.

---

## 7. Role and access model, as decided

| Role | Read field knowledge | File | Check | Release | Dashboards |
|---|---|---|---|---|---|
| Employee | Their segments, by classification | Yes, operational segments | No | No | None |
| Segment Director | Yes | **Own segment only** | No | **Own segment only** | **Own segment only** |
| Maintenance Manager | **Yes — authorised segment, by classification. No pre-job pack** | **No** | No | No | **Edits only within their own segment's maintenance department** |
| QMS / Document Controller | Yes, per its responsibilities | No — operations files | **Yes** | No | Cross-segment, per responsibilities |
| External Auditor | Yes, read-only, whole register | No | No | No | None |

**Decision 5 made explicit:** reading is a dead end for action. In preview 7 the
file, check, approve, return and edit controls are **not rendered at all** for a
reader, rather than rendered and disabled.

### Prototype limits versus production authorisation

Unchanged from Part 7 §6, and restated on preview 7 itself:

- Everything in these previews is **frontend filtering of demonstration data**. A
  locked chip is a user-experience boundary, not a security boundary.
- `roles.js` says so in its own header: *"THIS IS A SPECIFICATION, NOT A SECURITY
  CONTROL… the API must filter what it returns; the client must never be the
  thing deciding what a user is allowed to see."*
- In production the segment comes from **Entra ID group membership and the SSO
  claim**, the list endpoint returns only what the caller may read, filing is
  authorised server-side against the same matrix, and unreleased records are
  filtered server-side. The decisions above become the specification those
  server-side checks are tested against.

---

## 8. What is still unverified

Carried forward, unchanged and not quietly dropped:

1. `case.html` with a real filed record — and therefore its withdrawn, returned,
   superseded and cross-segment states. Preview 3 shows the intended design, not
   a verified page.
2. A case walked end to end through submit → QMS → release in the UI.
3. The remaining modals: document "More", delegate, share, bookmarks, Areas
   mega-menu.
4. Arabic / RTL on any Field Knowledge surface.
5. Keyboard traversal and screen-reader output over the filter sheet, the
   progress rail and the new alert shelf.

Items 1, 2 and 5 should be closed before Phase 2F is specified in full.

---

## 9. For your approval

1. **The seven previews** — approve, or name what to change.
2. **The migration stance** in section 5: add first, delete nothing, keep
   Technical Alerts permanently.
3. **The new pre-job caution wording** in section 6.
4. One open question your decisions do not yet settle: when a Maintenance Manager
   is authorised for more than one segment, should the Field Knowledge rail list
   each authorised segment separately, or should they switch segments the same
   way everyone else does — by opening that segment? The previews assume the
   latter.

On approval, Phase 2F in Part 5 becomes buildable. Phases 0 and 1 remain
unblocked and can start at any time.
