# RISE Premium Product Design: exploration brief

This is design exploration only. Mockups are static HTML/CSS files in this scratchpad.
They must never touch the production app in /home/user/TAQAKnowledgeHub. Do not edit, add or delete
anything there. Read it only if you want to check something.

## What RISE is
RISE (tagline **WHAT WE KNOW.**) is TAQA's controlled-document and field-knowledge platform for about 5,000
employees: field operators and engineers on rigs and in workshops, QMS document controllers, Segment Directors,
Maintenance Managers and auditors. People open it to find the current revision of a procedure before a job,
to file a new or revised document, and to check and approve documents. Trust matters most: a field operator must
be able to see at a glance that a document is the Current revision and who approved it.

Read `content.md` for all real content and figures. Use them exactly; every direction shows the same content
so the owner compares design, not data.

## What the owner wants
- Premium enterprise product, not a SharePoint-style intranet. Premium, confident, modern, clean, highly usable,
  technically capable, trustworthy for controlled documents, clearly TAQA but with its own RISE identity.
- **Restraint.** Premium does NOT mean gradients, glass, blur, glow, big decorative animation, oversized cards
  or decorative elements. Typography, spacing, hierarchy and layout do most of the work.
- Brand: deep teal, cyan, orange, light neutral backgrounds, the RISE logo, WHAT WE KNOW., BW Gradual.
- Motion is restrained and purposeful; nothing slows down someone looking for a document.
- Keep every existing capability and workflow (listed in content.md). Don't invent new features beyond the
  QMS workspace concept.

## Brand assets (paths relative to a page in directions/<x>/)
- Fonts: `<link rel="stylesheet" href="../../kit/fonts.css">` → families `'BwGradual'` (300/400/700/800) and
  `'Inter'` (300–700). BW Gradual is TAQA's brand face. Always give fallbacks: `'BwGradual', 'Inter', system-ui, sans-serif`.
- Logo: `../../kit/brand/rise-logo.png` (full colour, with WHAT WE KNOW., 1983×793, transparent),
  `rise-logo-reverse.png` (for dark grounds), `rise-lockup-header.png` / `rise-lockup-header-reverse.png`
  (symbol + RISE, 320×120, for headers), `rise-icon.png` (symbol only). Never recolour or redraw the logo.
- Logo colours (sampled): ink `#002B32`, pillar teal `#013F4E`, cyan `#00ADC2`, orange `#FD5805`.
  TAQA product teal used today: `#005D63`. Light cyan accent today: `#00BBB6`. Warm TAQA grey family (Monument Gray).
- The logo's geometry: two chamfered (45°) parallelogram bars, orange above cyan, over a teal pillar; and the
  orange full stop after WHAT WE KNOW. These are the brand's most ownable shapes. Use them sparingly and with intent.
- Photos (real TAQA field photography): `../../kit/photos/taqa-hero.jpg` (two operators in TAQA coveralls, dusk),
  `taqa-hero-2.jpg` (technician working on equipment), `taqa-hero-3.jpg` (two engineers with a tablet, workshop),
  `taqa-hero-4.jpg` (crew walking in a workshop beside a unit), `taqa-hero-5.jpg` (two operators at a control panel
  with gauges). Use photos only where a direction calls for them.

## The shared RISE visual system (structure every direction must define its own expression of)
Each direction keeps this STRUCTURE but gives it a different character (type treatment, density, surfaces,
layout model, colour temperature, use of brand shapes). Don't just swap colours.

1. **Type roles**: display (names, page titles; BW Gradual), text (reading, UI; Inter or BW Gradual Regular),
   data (document numbers, revisions, dates, counts; tabular figures). Define a scale, max 7 steps.
2. **Spacing**: 4px base. Scale 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96.
3. **Widths/grid**: desktop design width 1440, content max 1200–1320, 12 columns, 24px gutter; reading column
   680–760px; phone 390 wide with 16–20px gutters; 44px minimum touch targets on phone.
4. **Navigation**: global nav (Home, Areas, Search, Field Glossary, Ask an Expert; Master List and Workspace only
   for QMS/Directors), Upload as the one primary action for roles that file, role indicator, bookmarks, notifications.
5. **Components**: buttons (primary, secondary, quiet, danger; default/hover/focus/disabled), cards (only where an
   object needs separating), tables, **document rows**, **status indicators**, **approval states**, forms
   (text, select, radio cards, file drop), drawers / side panels, alerts (info, warning, critical technical alert),
   empty states, icons (ONE line-icon set, inline SVG, consistent stroke), borders/shadows (pick one depth model).
6. **The document identity line** (RISE's core object): number · Rev · status · classification, e.g.
   `TQ-TWS-CTSS-WI-003 · Rev 4.0 · Current · Internal`. It appears identically on rows, the viewer, the QMS queue
   and mobile. Field users read the number aloud on the radio, so it must be legible and exact.
7. **Status semantics** (separate from the brand accent): Current (in force, positive), Review due (amber),
   Draft / In QMS check / Awaiting final approval (in progress, informational), Returned (needs action),
   Superseded / Obsolete (not for use, muted, never hidden). Classification Restricted/Confidential gets a lock.
   Status must be readable without colour (word + shape).
8. **Approval trail**: Filed → QMS check → Final approval (Segment Director, or Maintenance Manager for maintenance
   documents; CEO for policies) → Current. Separation of duties: filer ≠ QMS checker ≠ final approver.
9. **Motion principles**: 120–240ms, ease-out, transform/opacity only; a single brand entrance at most on Home and
   at most once per session (≤ 700ms, never blocks typing in search); hover/focus feedback; drawer/sheet slides;
   loading skeletons; nothing loops forever; `prefers-reduced-motion` honoured. In the mockups, show motion only
   as CSS that would run (keep it subtle) and describe it in the notes; screenshots are taken with reduced motion,
   so every page must look complete at rest.
10. **Accessibility**: WCAG AA contrast, visible focus ring, never orange text on white for body copy,
    status not by colour alone, 16px minimum body on phone.

## Deliverables for your direction (folder `directions/<x>/`)
Desktop pages, designed at 1440px width (full page height as long as needed, keep each one focused):
1. `home.html` — Home / landing (Employee view)
2. `browse.html` — Browse by Area / document discovery: Coiled Tubing, Operations side, SOPs shelf, with the area
   switcher, shelves, filter/sort, document rows (use the real rows), alert banner for the active technical alert
3. `viewer.html` — Document viewer: TQ-TWS-CTSS-WI-003 Injector Head Operations Manual (identity, actions,
   preview placeholder, summary, contents, approval trail, revision history, related)
4. `upload.html` — Upload, step 3 Review & submit of the SOP-009 Rev 4.0 revision, with routing and final approver
5. `qms.html` — QMS workspace CONCEPT (QMS role): queue, selected item check panel, held-back item, register health
6. `components.html` — the direction's system sheet: colour tokens, type scale, spacing, buttons with states,
   document rows, status + classification indicators, approval trail, a form field set, an alert set, an empty state,
   a drawer, icon set, and a short motion spec. This is where the shared system becomes visible in your character.
Phone pages, designed at 390px width:
7. `mobile-home.html` — Home on a phone (with the bottom/top navigation pattern of the direction)
8. `mobile-document.html` — the WI-003 document on a phone (identity first, actions reachable by thumb)
Plus `notes.md`: design philosophy (2–3 sentences), why it fits RISE, strengths, weaknesses, how it scales to
complex QMS/document-control screens, motion proposal (what moves, durations), and the main tokens.

You may share one stylesheet across your pages (`directions/<x>/rise.css`). Each HTML page: `<!doctype html>`,
`<meta charset="utf-8">`, viewport meta, a `<title>` like "RISE · Direction A · Home". Static HTML + CSS; JS only
if truly needed (not needed). Inline SVG icons. No external network requests. Define colours as CSS custom
properties. Light theme only is fine for the mockups (you may mention dark mode in notes).

## How to check your work
Run `node /tmp/claude-0/-home-user-TAQAKnowledgeHub/f1f65a5c-98a5-5d32-87f1-61ee68782d31/scratchpad/rise-design/shoot.js <x>`
from any directory. It writes `shots/<x>-<page>.png` and prints each page's scrollWidth (desktop must be 1440,
phone 390; anything wider is a horizontal overflow bug) and any console errors. LOOK at every screenshot with
the Read tool, critique it like a demanding design director (alignment, rhythm, hierarchy, density, clipping,
overlap, contrast, awkward wraps, empty areas, anything that looks templated), fix, and re-shoot. Do at least two
full review passes. The bar is a real product designer's portfolio-grade concept, not a wireframe.

## Avoid
Purple/blue gradients, glassmorphism, glows, gradient text, emoji, generic stock dashboard tiles, 01/02/03 numbering
unless it is a real sequence (the upload steps and approval trail are real sequences), everything centered,
identical heavy cards everywhere, accent bars on rounded cards, lorem ipsum, invented people or numbers.
