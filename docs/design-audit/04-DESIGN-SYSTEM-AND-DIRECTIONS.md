# RISE — Design Audit · Part 4: Design System and Three Visual Directions

**Nothing in this part has been implemented.** It is a proposal for you to choose
from. The landing-page concept is treated as approved and fixed: every direction
below is compatible with segment beds that expand and collapse, and none of them
replaces Home with a dashboard.

**Where it starts from.** `techhub.css` already ships a usable token set on every
page, and 18 of 19 pages ignore it (UX-081). So this is not a system designed from
nothing — it is that system, audited, narrowed where it is too loose, and then
actually adopted. The token names below keep the existing `--th-` prefix
deliberately, so migration is a find-and-replace rather than a rename.

---

## 1. Proposed design system

### 1.1 Typography

Bw Gradual for display, Inter for text, as today. Somar Sans for Arabic (brand
standard; RTL was not exercised in this audit — Part 1, gap 8).

| Token | Size / line | Weight | Use |
|---|---|---|---|
| `--th-fs-hero` | clamp(32, 4.4vw, 52) / 1.05 | 800 | Home hero only |
| `--th-fs-display` | 36 / 1.15 | 700 | Page title |
| `--th-fs-h1` | 28 / 1.2 | 700 | Section lead |
| `--th-fs-h2` | 22 / 1.3 | 700 | Card / panel title |
| `--th-fs-h3` | 18 / 1.4 | 600 | Sub-head, table group |
| `--th-fs-body` | 16 / 1.55 | 400 | Body, table cell |
| `--th-fs-small` | 14 / 1.45 | 400/500 | Metadata, helper, chip |
| `--th-fs-micro` | 12 / 1.35 | 600, +0.04em | Eyebrow, status badge |

Eight steps, down from 24 rendered sizes. Two changes to the existing scale:
**body moves 15 → 16px** (15px is below what a field user reads comfortably on a
phone in daylight, and 16px prevents iOS input zoom), and **micro moves 11 → 12px**.
`--th-fs-h3` moves 17 → 18px. Everything between 10 and 13px maps to `micro` or
`small`; 17/19/20/21 map to `h3` or `h2`.

### 1.2 Colour

TAQA primary and secondary palettes only. **No purple, pink or violet** — three
avatar colours currently sit outside the palette and should be pulled in.

**Brand**

| Token | Value | Use |
|---|---|---|
| `--th-teal-700` | `#005D63` | Primary action, selected state, links |
| `--th-teal-800` | `#003A3D` | Hover / pressed on primary |
| `--th-teal-400` | `#00BBB6` | Accent on dark grounds only |
| `--th-orange` | `#FD691D` | **One** call to action per screen |

Brave Orange is the brand's attention colour and the product currently spends it
freely. The rule proposed: orange marks the single next action on a screen and
nothing else. It is not a status colour.

**Measured constraint on orange:** `#FD691D` is **2.91:1 on white** and 2.67:1 on
canvas. It cannot carry text at any size. Nor can white sit on it: white on
`#FD691D` is the same 2.91:1 pair, which fails AA even for large text (3:1). Dark
ink on orange is 5.84:1 and passes. So orange is a *fill with `#1E1C1A` on it*, or
a 3–4px accent rule, or an icon on a dark ground — never orange text on paper, and
never white text on orange at any size.

**Ink** — three steps, replacing the seven measured greys (UX-079)

| Token | Value | Contrast on `#FFFFFF` | Use |
|---|---|---|---|
| `--th-ink` | `#1E1C1A` | 16.99:1 | Body, headings |
| `--th-ink-2` | `#4A4540` | 9.47:1 | Secondary text |
| `--th-ink-3` | `#6E655D` | 5.70:1 | Metadata — the floor for text |
| `--th-ink-4` | `#B9B2AB` | 2.10:1 | **Hairlines only, never text** |

(`techhub.css` annotates `--th-ink-3` as 5.4:1; measured against `#FFFFFF` it is
5.70:1, and 5.22:1 on the `#F5F5F3` canvas. Both pass.)

`#524D48`, `#5F564F` and `#756A61` are retired into `--th-ink-2`/`-3`.

**Surfaces** `--th-paper #FFFFFF` · `--th-canvas #F5F5F3` · `--th-inset #EEECE9` ·
`--th-line rgba(117,106,97,.13)`.

**Status** — one mapping, used everywhere (UX-010)

| State | Token | Value | On white | On canvas |
|---|---|---|---|---|
| Published / Approved | `--th-ok` | `#00705F` | 6.03:1 | 5.52:1 |
| Overdue / Rejected | `--th-stop` | `#C8102E` | 5.88:1 | 5.39:1 |
| Due soon / Returned | `--th-warn` | `#8A6200` | 5.49:1 | 5.03:1 |
| In review / Informational | `--th-info` | `#0076A8` | 5.05:1 | 4.63:1 |
| Draft | `--th-ink-3` | `#6E655D` | 5.70:1 | 5.22:1 |

All five clear 4.5:1 as text on both surfaces — `--th-info` on canvas at 4.63:1 is
the tightest and leaves no room to lighten. They are used as text plus a 10% tint of the same hue as a
background, never as filled blocks of colour behind white text — which is how the three
contrast failures in UX-065 happened.

**Gradients** (UX-066): allowed on the Home hero and on area headers, nowhere else.
Any gradient panel carrying text must be checked visually, because no automated
probe can read it.

### 1.3 Spacing

A 4px base, exposed as `--th-s1 4` … `--th-s18 72`, as today. Page rhythm:
section gap 48 desktop / 32 mobile; card padding 24 / 20; control gap 12.

### 1.4 Radius and elevation

Four radii, down from 22 (UX-002): `6` controls · `12` cards · `16` panels ·
`999` pills. The existing `--th-r-xl:22px` is retired.

Four elevation levels, down from ad-hoc (UX-080):

- **flat** — the default. Most cards on a canvas background need a line, not a shadow.
- `--th-shadow-1` — raised: hover on an interactive card.
- `--th-shadow-2` — overlay: dropdown, popover, sticky bar.
- `--th-shadow-3` — modal: dialogs and sheets only.

### 1.5 Components to extract

Twelve primitives, in the order they pay for themselves:

1. Button (primary / secondary / quiet / destructive; 44px min height)
2. Icon button — label baked in, 44px target (fixes UX-017 and UX-067 at once)
3. Status badge (five states above)
4. Card
5. Field (label, input, helper, error — one validation timing, UX-061)
6. Table / register row
7. Filter bar (overflow behaviour, visible active-filter count — UX-028)
8. Count-bearing sidebar (already built in `master-list.html` — UX-030)
9. Empty / error / loading triplet (UX-035, 038, 071, 072)
10. Page shell: header, breadcrumb, title, actions, body (UX-004, 005, 009)
11. Chart frame: axis, legend, unit, empty state (UX-049, 050, 051)
12. Sheet / modal

### 1.6 Iconography

One stroke set, 1.75px stroke, 20px and 24px only, `currentColor`, square
viewBox. Icons never carry meaning alone — every icon-only control gets a name.

### 1.7 Motion

One curve (`cubic-bezier(.23,1,.32,1)`, already in `techhub.css`), two durations
(140ms for state, 240ms for entrance), and one rule: **no per-item stagger**
(UX-012). Every animation respects `prefers-reduced-motion` (UX-070).

### 1.8 Accessibility floor

AA text contrast with `--th-ink-3` as the floor; 44px minimum interactive height;
one focus ring (`2px --th-teal-700`, 2px offset) on everything; every input
labelled; one heading-level sequence per page; one skip link.

---

## 2. Three visual directions

All three use the same tokens in section 1. They differ in how much depth,
ornament and colour the product spends — and in what the product *feels* like to
the person opening it.

---

### Direction A — Premium Corporate

*The reference: a well-run annual report. Quiet, dense, authoritative.*

| Aspect | Treatment |
|---|---|
| **Typography** | Bw Gradual 700 for all headings, generous tracking-tight on display sizes. Inter 400 body at 16/1.55. High contrast between display and body — a 36px title above 16px text with nothing in between. |
| **Colour** | Teal and ink do nearly all the work. Orange appears roughly once per screen. Status colours only as tinted text, never as fills. White surfaces, `#F5F5F3` canvas. |
| **Navigation** | Topbar plus the count-bearing left sidebar (UX-030) on every data page. Breadcrumbs always present. No bottom bar. |
| **Cards & tables** | Lines, not shadows. Cards are flat with a 1px `--th-line` border and 12px radius. Tables are the hero: 48px rows, right-aligned numerals, sticky header, zebra off. |
| **Iconography** | Sparse. Icons appear in controls and status, never decoratively. |
| **Spacing** | Generous: 48px section gaps, 32px card padding. Fewer things per screen. |
| **Animation** | Almost none. Opacity and 4px translate on entrance, 140ms. No scroll reveals. |
| **Mobile** | Single column, 16px gutters, section headers become sticky. Tables become stacked rows with the key figure first. |
| **Advantages** | Ages extremely well. Reads as trustworthy, which matters for a controlled-document system an auditor will open. Cheapest of the three to build — it is mostly *removal*. Strongest for the Master List, dashboards and the auditor's view. Least risk of looking dated in two years. |
| **Drawbacks** | Undersells the recognition and culture side. The #BetterTogether work and the honour board would feel out of place. Risks reading as "another QMS tool" to a field employee who has to be persuaded to contribute. |
| **Landing-page fit** | Excellent. The segment beds, with their geological strata metaphor, are already closer to this than to anything else. Open beds with hairlines and no shadows would look deliberate. |

---

### Direction B — Modern SaaS

*The reference: a current product dashboard. Efficient, familiar, dense but soft.*

| Aspect | Treatment |
|---|---|
| **Typography** | Bw Gradual 700 for page and card titles only; Inter 600 for everything else structural. Smaller display sizes (28px titles), tighter leading. The scale compresses — more levels, less contrast between them. |
| **Colour** | Teal as a UI colour rather than a brand statement: tinted backgrounds, selected rows, filled primary buttons. Status badges are soft filled pills (10% tint + full-strength text). Orange for primary CTAs. Canvas-on-card everywhere. |
| **Navigation** | Persistent left sidebar, collapsible to icons, present on every page including Home. Topbar reduced to search, notifications, account. Command palette (UX-008) is natural here. |
| **Cards & tables** | Soft `--th-shadow-1` on cards, 12px radius. Tables get density toggle, column control, saved views, bulk actions (UX-029, 031, 032). 40px rows, hover highlight, inline row actions. |
| **Iconography** | Everywhere and consistent — every nav item, every status, every action. |
| **Spacing** | Tight: 32px sections, 20px card padding, 8px control gaps. More on screen. |
| **Animation** | Functional and quick: 140ms state changes, sliding panels, skeleton loaders where real latency exists, toasts for confirmations and undo (UX-073). |
| **Mobile** | Bottom tab bar (UX-059) with four destinations. Sidebar becomes a sheet. Filters become a bottom sheet. Full-width cards. |
| **Advantages** | Highest raw productivity for the three roles who live in the product all day — QMS, Director, Maintenance. Directly delivers the largest cluster of findings (UX-008, 029, 030, 031, 032, 045, 052, 059). Most familiar to anyone who uses modern software; near-zero learning curve. |
| **Drawbacks** | Generic. RISE would look like every other internal tool, and the brand work — the logo, #BetterTogether, Bw Gradual itself — would be reduced to a header. Most expensive of the three: a persistent sidebar on 19 standalone documents with no router is real work. Highest regression risk. |
| **Landing-page fit** | Workable but awkward. A persistent icon sidebar beside the segment beds fights them for attention, and the beds are the one screen that should feel like a place rather than a tool. Would need Home exempted from the sidebar — which reintroduces the two-navigation-models problem (UX-004) on purpose. |

---

### Direction C — RISE Signature

*The reference: the product you already started building. Editorial structure,
one geological idea carried all the way through, warmth where people appear.*

| Aspect | Treatment |
|---|---|
| **Typography** | The full eight-step scale used expressively. Bw Gradual Light 300 for large numerals and quiet display lines — the weight you chose for the wordmark — against Bw Gradual 700 for titles. Inter for everything a person reads at length. Numbers get the display face; prose never does. |
| **Colour** | Teal ramp as *depth*: `#00191B` at the base through `#005D63` to `#9FE3DF`, used to signal how deep in the structure you are. Orange strictly for the one next action. Warm neutrals (`#F5F5F3`, `#EEECE9`) so the product does not feel clinical. Recognition keeps its five level colours as the one place colour is celebratory. |
| **Navigation** | Topbar plus the count-bearing sidebar on data pages (as A), but Home and segment pages keep their own spatial navigation — the strata. Breadcrumbs show the geological path: Company → Segment → Discipline → Document. |
| **Cards & tables** | Horizontal rules and layered bands rather than floating cards — the strata idea applied to lists. Tables flat and wide with a strong header rule. Depth is reserved for things that genuinely overlay. |
| **Iconography** | Minimal and structural, plus one deliberate exception: people. Avatars, initials and level marks are allowed to be warm and colourful, because that is where engagement is supposed to live. |
| **Spacing** | Asymmetric and rhythmic: generous above a section head, tight within it. Content sits on a readable measure (~72ch) rather than filling the viewport. |
| **Animation** | Restrained but intentional: the bed reveal (`0fr → 1fr`), the recognition ring and count-up, the level-up moment. One curve, no stagger, reduced-motion honoured. Motion marks progress and achievement; it never decorates. |
| **Mobile** | Designed first here. Single column with sticky section heads, a compact topbar that keeps Upload (UX-057), and a bottom bar only on the field routes (prejob, cases, upload) where a user has one glove off. |
| **Advantages** | Only direction that is recognisably *this* product. Preserves and extends the two pieces of work you have already approved — the segment beds and the recognition page — rather than absorbing them. Carries #BetterTogether credibly. Earns attention from an employee who has no obligation to contribute, which is the actual adoption problem. Still delivers the token, accessibility and workflow fixes, because those live in section 1 and are direction-independent. |
| **Drawbacks** | Needs the most design judgement per screen, so it is the easiest to execute badly and the hardest to hand to someone else. Some QMS power features from B (density toggle, command palette) have to be adopted into it deliberately rather than coming free. Depends on Bw Gradual Light rendering well at large sizes — unverified, and your wordmark weight decision is still open. |
| **Landing-page fit** | Native. It *is* the landing page's logic, extended to the other 18 routes. The beds, the strata metaphor and the open-by-default behaviour are the starting point rather than something to accommodate. |

---

## 3. Recommendation

**Direction C — RISE Signature, with Direction B's power features adopted into the
register and dashboard surfaces.**

Why:

1. **It does not throw away approved work.** The landing page is fixed by your
   instruction, and the audit found it to be the strongest screen in the product
   on its own merits. A and B both treat it as an exception to accommodate;
   C treats it as the thesis. The recognition page is in the same position.

2. **The real risk to this platform is not usability, it is indifference.**
   561 documents and 84 overdue reviews do not get fixed by a tool that is easy to
   use; they get fixed by 5,000 people choosing to contribute. B optimises the
   wrong population — the handful of people who already have to use the product
   daily. C optimises the employee who could just as easily not bother.

3. **The quality floor is identical in all three.** Every P0, every contrast fix,
   every 44px target, every token lives in section 1, not in the direction. So
   choosing C costs nothing in rigour.

4. **It is honest about what exists.** `techhub.css` was clearly written toward
   something like C already — a teal depth ramp, warm neutrals, one easing curve.
   Adopting it (UX-081) moves the product toward C by default.

**What to take from B regardless of the choice:** saved views (UX-029), bulk
actions (UX-032), approve-from-list (UX-045), scoped search (UX-053) and the
count-bearing sidebar on data pages (UX-030). These are productivity findings, not
style, and the three daily roles need them whichever direction wins.

**What I would take from A regardless:** the discipline of lines over shadows on
dense surfaces, and tables as a first-class citizen rather than a styled list.

**If you choose differently:** A is the safe choice and genuinely defensible —
pick it if the auditor's and QMS's confidence in the system matters more than
employee adoption. B is the right choice *only* if the real user population turns
out to be the ~50 people who process documents, not the 5,000 who could contribute
to them. That is a question about the business, not the design, and you are better
placed to answer it than I am.
