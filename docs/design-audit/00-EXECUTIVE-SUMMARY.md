# RISE — Full UI/UX Design Audit · Executive Summary

**Date** 5 November 2026 · **Branch** `claude/affectionate-carson-duwb3p`
**Scope** 19 HTML pages / 21 routes / 25 areas / 5 roles / 561 controlled documents
**Method** Source inspection plus a temporary Playwright measurement harness driving
the real application at 5 viewports and 5 roles. 167 screenshots and 9 probe files
were captured; the probe files and 14 curated screenshots are committed under
`docs/design-audit/evidence/`. The harness itself has been deleted.

> **This is an audit. Nothing was implemented.** No application file was changed.
> The landing-page concept is treated as approved and fixed. Every proposal below
> preserves the segment beds and their expand/collapse behaviour.
>
> RISE is a frontend prototype. Simulated roles, mock data and unconnected
> backends are treated as exactly that — not as working integrations or verified
> security controls.

---

## Addendum, 5 November 2026 — decisions taken and Field Knowledge

The owner has selected **Direction C (RISE Signature) with Direction B's
productivity features**, confirmed the landing page and segment expand/collapse
stay unchanged, ruled that role switching moves behind a marked development/demo
mode, that Segment Directors reach only their authorised segment dashboards with
QMS cross-segment per its responsibilities, and that fictional contributors must
never be shown as real in production.

The owner also added a requirement the original audit did not address: **Field
Cases and Pre-job must be segment-specific and embedded in each operational
segment.** Two new parts answer it:

- **Part 6** — an in-depth review of `cases.html`, `case-new.html`, `case.html`
  and `prejob.html`, the role-specific workflows and the modals the first audit
  skipped. Findings UX-082 … UX-094. Running total **94**.
- **Part 7** — three visually distinct approaches for embedding field knowledge
  inside a segment, with real desktop and mobile previews, plus what is preserved,
  what the shared components deliver, and where frontend filtering ends and
  backend authorisation must begin.

Two things from that review change the picture materially:

1. **A segment's "Field Cases" are, record for record, that segment's own
   "Lessons Learned" and "Alerts" tabs.** Measured on four segments — Coiled
   Tubing 3+1=4, Drilling 5+6=11, Well Safety 8+4=12, Slickline 0+0=0. So
   embedding field knowledge in the segment is not adding a surface; it is
   removing a duplicate one.
2. **The architecture is already about 70% built.** `cases.js` filters by area
   before anything else, all three pages already accept `?area=`, and the segment
   page already links all three with the area attached. What is missing is the
   boundary (the Area select still offers all twelve segments, in three separate
   places) and the chrome (the topbar's "Cases" link silently drops the segment).

A new **Phase 2F** in Part 5 carries this work.

**Decided 5 November 2026:** **Approach B (Segment Knowledge Tab) is the primary
experience, with Approach C (Field Desk) as an optional detailed surface.**
Maintenance Managers may read released field knowledge in their authorised
segment and nothing more; they manage their own segment's maintenance department
by default. The Lessons Learned and Technical Alerts tabs are **not** being
removed — Part 8 §5 sets out a four-stage reversible migration that deletes
nothing, and recommends keeping Technical Alerts permanently. Pre-job moves
inside the segment, uses the segment automatically, becomes one of two main
actions, and carries a standing caution that it does not authorise a job or
replace approved job safety documentation.

**Part 8** holds the refined design: seven previews (overview, listing, case
detail, add a case, pre-job, empty segment, Maintenance Manager read-only) plus
the optional Field Desk, each at desktop and mobile, with the exact navigation
changes and what stays untouched. Phase 2F is now blocked only on approval of
those previews; Phases 0 and 1 remain unblocked.

---

## The headline

**RISE is in better shape than its page count suggests, and its biggest problem is
not a design problem — it is that the design system it already has is unused.**

Three things came out of the measurement that I did not expect:

1. **Zero horizontal overflow.** 18 routes × 5 viewports × 5 roles. Not one page
   overflowed. In an app of 19 hand-built documents with no framework, that is
   unusual and it is genuinely yours.
2. **Zero console errors**, on any route, in any role.
3. **`techhub.css` already ships a complete token set** — a 7-step type scale, an
   ink ramp, a 10-step spacing scale, five radii, three elevations, one easing
   curve — and **every page links it while 18 of 19 ignore it.** Counting
   `var(--th-*)` references: `glossary.html` 43, and `index.html`,
   `segment.html`, `master-list.html`, `dashboard.html`, `upload.html`,
   `viewer.html`, `recognition.html`, `analytics.html`, `cases.html` all zero —
   each declaring its own 5 to 57 local variables instead.

That third finding (UX-081) reframes most of the rest. The 24 rendered text sizes,
22 border radii and 7 near-identical greys are not the absence of a system. They
are nine pages each re-deriving one. **The highest-leverage work in this audit is
adoption, not design** — and it needs no new design decisions to begin.

---

## What is wrong, and how wrong

**94 findings** (UX-001 … UX-094), each tagged `[C]` confirmed by observation or
measurement, `[P]` a design proposal, or `[A]` an assumption needing a fact I could
not get. 14 are P0 — the ten below, plus UX-082, UX-084, UX-085 and UX-090 from
the Field Knowledge review in Part 6.

The original ten P0s, in one line each:

| ID | What a user sees today |
|---|---|
| UX-043 | A director's header reads **1 PENDING** directly above **"All caught up!"** — the stat counts everything in the register, the queue counts only what awaits that director |
| UX-035 | The viewer says a document does not exist, then offers Download PDF, Bookmark and Share for it |
| UX-023 | The upload screen shows a 1·2·3 stepper beside a 1·2·3·4 workflow — two competing sequences |
| UX-065 | Three avatar colour pairs fail AA: white "AA" on Contributor teal at 3.01:1, "IS" at 3.97:1, "YA" at 4.50:1 |
| UX-067 | Several icon-only controls have no accessible name |
| UX-078 | The honour board celebrates five people who do not exist |
| UX-006 | Role-switch chips are exposed in production chrome, so any user can become a director |
| UX-044 | "Delegate your authority" occupies the first card on the director's page; the approval queue is below it |
| UX-040 | The QMS needs-attention card lists what needs attention and offers no way to act on it |
| UX-081 | *(invisible to users, highest leverage)* the token system exists and is unused |

Nine of those ten are small changes. Four are one conditional or one expression.

**The largest structural weakness** is not in any single finding: **nobody has a
desk.** Home is an index of 25 areas. An employee has no "what I filed and what
came back"; a controller rebuilds the same filters every session; a director's page
leads with an administrative action. The product knows a great deal about documents
and very little about the person in front of it.

---

## What is right, and must not be regressed

- No horizontal overflow, anywhere.
- No console errors, anywhere.
- **Mobile is designed, not shrunk.** `cases.html` is the proof.
- **`master-list.html` is a genuinely professional register view** — the
  count-bearing sidebar on it is the best navigation in the product and exists
  nowhere else. It is the reference, not an outlier.
- **The refusals are unusually well written.** Gates explain themselves in plain
  language instead of saying "access denied".
- **Example data is never passed off as real.** The EXAMPLE labelling is a strength;
  the honour board problem is that it celebrates fictional people, not that it
  admits they are examples.
- Copy quality throughout is better than most enterprise software.

---

## The recommendation

**Direction C — "RISE Signature"**, with Direction B's power features (saved views,
bulk actions, approve-from-list, scoped search, the count-bearing sidebar) adopted
into the register and dashboard surfaces.

Three directions are set out in full in Part 4: **A Premium Corporate** (quiet,
dense, ages best, cheapest), **B Modern SaaS** (most productive for the ~50 people
who process documents daily, and generic), **C RISE Signature** (editorial, carries
the geological idea and #BetterTogether, native to the landing page you approved).

The argument for C in one paragraph: the quality floor — every P0, every contrast
fix, every 44px target, every token — lives in the design system, not in the
direction, so choosing C costs nothing in rigour. What differs is who the product
is for. B optimises for the handful of people who already have to use it. The real
risk to this platform is not usability, it is indifference: 561 documents and 84
overdue reviews get fixed by 5,000 people choosing to contribute, and C is the only
direction that extends the two pieces of work you have already approved — the
segment beds and the recognition page — rather than accommodating them.

**If you choose differently:** A is safe and genuinely defensible. B is right only
if the real user population turns out to be the document processors rather than the
contributors — a business question, not a design one.

---

## What I could not verify

Stated plainly, because launch confidence depends on it. Ten areas were **not**
inspected: modal and dropdown interiors; the live submit → QMS → approve → publish
walk through the UI; 24 of the 25 areas (only `drilling` was opened); Firefox and
WebKit beyond the existing smoke job; real screen-reader output; keyboard
traversal; the dark theme; Arabic / RTL, with 14 Arabic documents in the register;
`case.html` and `form.html` with real records; and print styles. Part 1 lists them
with reasons. **Screen reader, keyboard, dark theme and RTL are the four I would
not launch without.**

**One correction made during the audit, on the record.** My first contrast pass
reported ~18 WCAG failures. They were wrong. The probe read only
`background-color`, so any panel painted with a gradient resolved as transparent
and fell through to white, making white-on-dark-teal headings measure 1.00:1. The
probe now treats a gradient ancestor as *indeterminate* rather than guessing. The
corrected count is **2–4 real failures**, all three confirmed ones in work I built
in the previous session. A further 23–42 text nodes per page sit on gradients and
cannot be measured programmatically at all; they are recorded as a gap (UX-066),
not reported as passing.

**One operational finding, outside design.** `tests.yml` and the Azure Static Web
Apps workflow both run on `main` in parallel, so **a red test suite does not stop a
deploy.** Fixing that needs a branch-protection rule only a repository admin can
set.

---

## The report

| Part | File | Contents |
|---|---|---|
| 1 | `01-INVENTORY-AND-COVERAGE.md` | Route inventory, what was measured per page, coverage matrix by role and viewport, the ten gaps, the probe correction |
| 2 | `02-FINDINGS-BACKLOG.md` | UX-001 … UX-081 in 18 sections (UX-082 … UX-094 are in Part 6), each with Where / Saw / Problem / Do / Why, plus impact, effort, priority, affected roles, mobile relevance and evidence |
| 3 | `03-PRIORITIES.md` | Top 20 high-impact · Top 15 quick wins · Top 10 mobile · Top 10 premium · design-system opportunities · **ten improvements to avoid** |
| 4 | `04-DESIGN-SYSTEM-AND-DIRECTIONS.md` | The proposed token system with measured contrast ratios, then the three directions in full, then the recommendation |
| 5 | `05-ROADMAP.md` | Six phases, dependency-ordered, with an exit gate per phase and the decisions needed from you |
| 6 | `06-FIELD-KNOWLEDGE-DEEP-REVIEW.md` | The four Field Knowledge pages in depth, the role matrix, the mobile filter sheet, and UX-082 … UX-094 |
| 7 | `07-SEGMENT-FIELD-KNOWLEDGE-ARCHITECTURE.md` | Three approaches for segment-embedded field knowledge, with previews; preservation; shared components; prototype vs backend authorisation |
| 8 | `08-FIELD-KNOWLEDGE-DESIGN-SPEC.md` | The approved B+C design: seven previews, navigation changes, the safe tab-migration stages, the pre-job model and the role matrix |
| — | `previews/` | Three working HTML previews on the real tokens and real Coiled Tubing records, with desktop and mobile renders |
| — | `evidence/` | 9 probe JSON files (the measured record), `areas.json`, and 14 curated screenshots of the confirmed findings |

**Awaiting your approval before anything is implemented.** Phases 0 and 1 are
direction-independent and could start as soon as you say so; Phase 2 onward needs
the direction decision first.
