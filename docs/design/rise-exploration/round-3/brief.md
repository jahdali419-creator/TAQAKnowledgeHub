# RISE · Round 3 · Future Concepts brief (G, H, I)

Design exploration only, on branch `design/rise-exploration`. Nothing here touches the app, `main`, tests or
production. Each concept lives in its own folder: `round-3/g/`, `round-3/h/`, `round-3/i/`.

## The owner's challenge (verbatim intent)
RISE should make people say: "I did not expect an internal company knowledge system to look and feel like this."
Think like a world-class product team designing a flagship internal digital product for 2030.
Do NOT make another safe corporate dashboard. Do not start from earlier rounds (A–F). Do not just change colours,
cards, borders or type. Each concept must challenge at least one assumption about how an internal knowledge platform
works. Functionality and business rules stay the same; the EXPERIENCE can be radically different.
For every major decision ask "Would a normal enterprise portal designer have done this?" If yes, find another way.
Creativity must never cost usability. Push far enough that at least one concept makes the owner think
"I have never seen an internal knowledge hub designed like this."

RISE must feel: premium, technical, confident, modern, calm, precise. TAQA branding used intelligently; RISE has its
own product identity. The orange → red gradient (#FD691D → #C8102E) may be a signature accent or interaction cue,
never everywhere. Do NOT: gradients everywhere, orange cards, copy the TAQA corporate website, look like SharePoint,
SAP or a generic admin dashboard. No decoration for decoration's sake. Explore: oversized type, asymmetric and
editorial composition, layered surfaces, subtle depth, micro-navigation, contextual panels, immersive search,
dynamic previews, spatial organisation, intelligent whitespace, motion, progressive disclosure.

## Concepts
### G · RISE COMMAND
An operating system for technical knowledge, not a website. Linear / Raycast / Arc energy. The central experience is
a universal command and search surface: people think "What do I need?", not "Which page do I open?".
Explore: command palette, contextual search, smart filters, keyboard shortcuts (shown as key hints), preview without
leaving context, breadcrumb trails, recently used knowledge, related documents, expert suggestions, fast navigation.
Search is deterministic and trustworthy. NOT an AI chatbot: no chat bubbles, no generated answers; it shows why
each result matched. It must still be beautiful on a phone (thumb-reach command bar, sheets).
### H · RISE KNOWLEDGE MAP
Challenge the idea that knowledge is lists. TAQA knowledge as a connected system:
Segment → Area → Equipment → Activity → Procedure → Work Instruction → Bulletin → Expert. A calm, elegant, zoomable
knowledge map with spatial navigation, visual relationships, progressive disclosure and contextual document
discovery. Never a complicated engineering diagram. Documents stay easy to find and open. On the phone, the same
idea becomes an elegant vertical exploration (a descent through levels), not a shrunken desktop map.
### I · RISE FIELD MODE
RISE designed from the field: gloves, one hand, bright sunlight, little time, poor connectivity, urgent need for the
correct information. Huge targets, minimal decisions, strong hierarchy, fast access to critical documents,
equipment-first navigation, QR / asset entry, recently used, offline indicators, visual document status, large
approval/status signals, "what changed" summaries, clear revision/date, very fast search. Desktop still premium, but
the field-first philosophy is obvious. Not a rugged military app: sophisticated, modern, TAQA quality.

## Home page challenge
Answer visually: why does RISE need a home page at all? Do not default to logo + welcome + four cards + recent
documents. The home could be a command surface, a knowledge landscape, a personalised activity stream, a mission
control, a visual entry into technical domains.

## Document page challenge
An approved technical document is a first-class product object. Strong identity, revision visibility, status, owner,
effective date, superseded state, related knowledge and equipment, history, expert context, actions, preview,
associated alert/bulletins. A technician must answer in ~2 seconds: "Can I trust and use this document?"

## Search challenge
A signature experience. Show realistic searches with the real content ("pressure test"; "I need to isolate a pump").
Demonstrate initial search, results, filtering, document preview and related knowledge — not just a search box.

## Scope and files (per concept folder)
Required, each ONE responsive file designed for BOTH 390×844 (phone) and 1440×900 (desktop):
`home.html` · `search.html` · `area.html` · `document.html`.
`search.html` should show the richest state: results for `pressure test` with a filter applied and a preview open
(desktop); grouped results on the phone. Optional extra states (encouraged, same rules): `search-start.html`
(initial / empty command state) and `search-intent.html` (`I need to isolate a pump`).
No Upload or QMS screens this round. Keep role-aware rules: Employee viewer, Restricted/Confidential locked,
drafts hidden, superseded/obsolete excluded from search, Ask an Expert routes by area.
Plus `notes.md` with exactly these sections:
- Design thesis (max 3 sentences)
- Signature interaction (one interaction, described in 2–3 sentences)
- Assumption challenged
- Why it could win (max 3 bullets)
- What could fail (max 3 bullets)
- Difficulty to implement (Low / Medium / High, one sentence why)
- Motion (what moves, durations; honour prefers-reduced-motion)
- Proposed / concept-only elements (anything not in today's register, e.g. equipment tags, synonyms, groupings)

Content: ONLY `round-3/content.md` (identical across G, H, I). Read it first. Fonts `../../kit/fonts.css`, logos
`../../kit/brand/…`. Static HTML + CSS; small inline JS only if it truly helps a mockup state (not needed for review).
Inline SVG icons (one consistent line set per concept). No network requests. Colours as CSS custom properties.
Every page must look complete at rest (screenshots are taken after animations finish). WCAG AA contrast, visible
focus, 44px+ targets on phone (I: 56px+), 16px+ body text on phone, status readable without colour.
