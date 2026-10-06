# RISE · Round 5 · M, N, O — mobile-first product directions

Design exploration only, on `design/rise-exploration`. Never touch the app, `main`, tests or production.
Folders: `round-5/m/`, `round-5/n/`, `round-5/o/`. Read `round-5/critique.md` first: it says exactly what
went wrong in round 4. Do not reuse layouts or components from earlier rounds (round-2/3/4 folders).

## The owner's goal
A world-class, modern, global digital product, not an internal system: elegant, calm, confident, easy on
the eyes, easy to scan, very well organised, simple, visually premium, professional, not gimmicky, right for
TAQA. Something a person genuinely enjoys opening on their phone: clean, lightweight, clear, comfortable,
not crowded, not stiff, not heavy, not "old enterprise". Quality bar: the clarity, polish, composition,
typography, spacing, restraint and confidence of the best consumer and pro products people admire today —
without copying any.

## MOBILE FIRST (the most important rule)
Design the 390×844 phone screens first and best. Base CSS = the phone. Desktop (`@media (min-width:1024px)`)
is a deliberate second composition of the same content, still excellent.
Phone rules: do not overload; never cramped; avoid long stacks of identical cards; no tiny metadata (body
16–17px, secondary ≥14px, never below 13px for anything meaningful); sections clearly separated by space and
type, not borders; breathing room; search and reading effortless; touch targets ≥44px (prefer 48); one clear
job per region; secondary facts in segmented views, disclosure or sheets (drawn open or closed as a static
state). The phone must feel "clean, modern, easy, pleasant" at first glance.

## Directions (must be immediately distinguishable side by side)
### M · Smooth Product Experience
Polished, elegant, smooth, soft but professional; refined type, comfortable spacing, premium but simple —
carefully designed screen by screen. Not flashy, not experimental.
Suggested system (improve if you can): soft tinted ground with large-radius grouped surfaces (inset grouped
sections, 20–24px radius), gentle depth, iOS-quality large titles that are calm; a floating capsule tab bar on
the phone (Home · Search · Areas · Saved, with Ask/Glossary/Upload in a profile/menu sheet); home led by a
search pill and a "For you" row (the active alert, continue reading WI-003); documents as a calm hero with a
status capsule "Current · Rev 4.0", a segmented control (Overview · Contents · History · Related) and a
floating action bar. Desktop: a soft app shell — a floating rounded navigation panel on a tinted ground and
one large rounded content canvas; generous, airy.
### N · Structured Technical Clarity
Optimised for technical, field and operations users, still light, calm and attractive: clear grouping, strong
organisation, obvious status and revision signals, easy scanning, operational confidence. A serious modern
tool, not a corporate dashboard, never heavy.
Suggested system: crisp white + cool greys, ink text, teal for action, orange only for alerts; a strong
"identity plate" for documents (number + Rev set large, status as a designed signal with shape and word);
labelled spec rows (label/value) instead of metadata strings; a vertical dated timeline for changes; tabular
figures. Phone: search permanently at the top as a command field, a compact 4-item bottom bar; area as a
structured index (shelves as a 2-column grid of counts, then the list). Desktop: a three-pane workspace
(slim icon rail · list pane · detail pane), e.g. search results on the left with the selected document's
identity plate and preview on the right; home as an operations overview in clear modules.
### O · Refined Editorial Utility
Elegant, content-led, curated: beautiful type, clean reading flow, focus on the important knowledge, premium
presentation of documents and updates, gentle hierarchy, calm and intelligent. A polished knowledge product,
not a widget dashboard.
Suggested system: warm off-white paper, BW Gradual display at confident sizes, Inter text at 17px, generous
measure; no tab bar — a slim top bar (wordmark, menu) and a persistent floating "Search RISE" pill at the
bottom of the phone; home as "today's brief" (the lead: ALT-002 changes WI-003 §5; what changed, set as a
typographic list with large dates; "your shelf" of saved documents as small covers); documents presented as a
cover + a one-sentence trust statement + reading index. Desktop: centred editorial column with a refined
masthead and an asymmetric 8/4 grid, no sidebar.

They must NOT all share the same sidebar, top search bar, card grid, content blocks, page rhythm or mobile
structure.

## Navigation and functions
Destinations reachable on phone and desktop: Home, Areas, Search, Saved, Ask an Expert, Field Glossary.
Employee view (Faisal Al-Ghamdi · Field Supervisor · home area Coiled Tubing · Operations): Upload is
available; Master List and QMS Workspace are absent (role-gated). Notifications and a "Viewing as Employee"
role indicator remain (can live in a menu/profile sheet on the phone).

## Brand
Restrained and sophisticated: careful accent use, strong identity, consistency, confidence. Not everything
orange; no gradient overuse. RISE logo files in `../../kit/brand/` (never redraw/recolour; you may cut the
symbol with clip-path). Fonts: `../../kit/fonts.css` → 'BwGradual' 300/400/700/800, 'Inter' 300–700 only.
Colours: logo ink #002B32, pillar teal #013F4E, TAQA Teal Green #005D63, Legacy Teal #00BBB6, logo cyan
#00ADC2, logo orange #FD5805 / Brave Orange #FD691D (small accent only), Crimson #C8102E (critical only).
Status colours separate from brand, always word + shape.

## Screens (each ONE responsive file)
`home.html` · `search.html` · `area.html` · `document.html`, each designed for 390×844 first and 1440×900 second.
- Home: immediately where to start and what matters (needed knowledge, what changed, where to go, my area,
  recently used/saved). Intentional, useful, visually strong.
- Search: `pressure test`: clean, fast, well organised, well filtered, easy to scan.
- Area: Coiled Tubing (Operations) as a structured, useful destination, not just a list.
- Document: WI-003 — what it is, is it current, is it trusted, revision/status, related knowledge — premium.

## Content (identical in M, N, O)
`round-3/content.md` (viewer rules, figures, `pressure test` results, Coiled Tubing records, WI-003) plus the
Home additions in `round-4/brief.md` ("What changed recently in Coiled Tubing", "Elsewhere in TAQA", Saved,
Recently opened, alerts). Never invent documents, numbers, people or areas. Restricted/Confidential show a lock
and "request access through QMS" (say it once, elegantly, not on every row). Superseded/Obsolete never in
search. Proposed items (equipment tags, groupings) only if useful and labelled.

## notes.md (per direction, exactly these sections, concise)
- Design philosophy (max 3 sentences)
- What is better than the previous round (max 4 bullets)
- Best mobile quality (1 sentence)
- Best desktop quality (1 sentence)
- Main weakness (1 sentence)
- System (navigation model; colour, type scale, spacing, radius tokens)
