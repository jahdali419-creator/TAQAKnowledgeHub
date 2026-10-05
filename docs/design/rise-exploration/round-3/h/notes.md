# H · RISE Knowledge Map — notes

## Design thesis
RISE treats TAQA's knowledge as a place, not a list. On the home page all 25 areas sit in their four families, each circle sized by its document count, with your area lit and active alerts marked. Zooming in changes what you see, from area to equipment to the document and the things around it, and on the phone the same idea becomes a vertical descent. Every map has a list beside it, so documents are never more than one tap away.

## Signature interaction
Semantic zoom with an altitude gauge. Zooming into Coiled Tubing does more than enlarge it: the area turns into its equipment (injector head, CT string, CT unit and the rest), each carrying its documents, and the "Pressure control" thread runs out to Wireline and Slickline. A five-level altitude gauge (TAQA › Grouping › Area › Equipment › Document) in the header, or the "Alt n" strip on the phone, always shows how deep you are and takes you one level up.

## Assumption challenged
That knowledge is lists and folders, and that a home page is a welcome banner with cards. Here, home is the map of what TAQA knows. Search results show where knowledge lives across areas as well as what matched. A document is a node with its equipment, related documents, alert, expert and revision lineage drawn around it.

## Why it could win
- People can see at a glance where knowledge is, where it is thin, and where an alert sits. No enterprise portal shows this today.
- The structure carries the meaning: equipment, topic threads and the proposed Well Intervention grouping make cross-area knowledge (e.g. pressure control) visible without anyone searching for it.
- Nobody gets trapped in the map. A precise grouped list, a Map/List toggle and the trust verdict ("Current · Rev 4.0 · approved · effective · next review", plus "ALT-002 changes section 5") are always on screen.

## What could fail
- Equipment tags and topic threads do not exist in the register yet. Until they are curated, the area map shows only 12 of 36 documents and falls back to shelves.
- 25 areas fit calmly, but a register several times larger would need clustering rules to keep the map from turning into a hairball.
- Some users may read the map as decoration and go straight to search. It has to earn its place by being fast, not ornamental.

## Difficulty to implement
Medium-High. The landscape is a static SVG layout generated from area counts (easy). Semantic zoom with smooth transitions, plus maintaining equipment tags and topic threads in the register, is real product and data work.

## Motion
- Home and search maps: area nodes rise and fade in by family (700 ms, cubic-bezier(.2,.7,.2,1), staggered 0–180 ms). The your-area ring fades in after them (1.2 s, 0.5 s delay).
- Area and document views: equipment clusters, the core and the satellites pop in (600 ms, staggered 50 ms).
- Search start: the caret blinks 3 times, then stops.
- Intended transitions (not built here): zooming between levels is a 400 ms scale-and-crossfade centred on the chosen node, and the altitude gauge tick slides to match.
- `prefers-reduced-motion`: every animation and transition is switched off, and pages render complete at rest.

## Proposed / concept-only elements
- "Well Intervention" grouping (Coiled Tubing, Wireline Services, Slickline, Well Intervention CoE), drawn as a dashed hull and used as a search filter. It is not in today's register.
- Equipment tags: Injector head, CT string, CT unit, BHA, Control cabin, Wellhead equipment, Nitrogen, Crane & rigging, plus "CT string · 2-inch" on WI-003. Today these are derived from titles.
- "Pressure control" topic thread across Coiled Tubing, Wireline Services and Slickline.
- Proposed equipment chips for "pressure test" (BOP, High-pressure iron, Pressure gauge, Separator, CT string).
- Synonym table isolate ↔ isolation ↔ shutdown, and filler-word removal for plain-language queries.
- "Your area first" ranking, and the drag-to-filter region on the map.
- Altitude gauge and level naming (Alt 0–4), and the semantic zoom levels themselves.
- Alert marks on the map appear only on areas where content.md names an active alert (Coiled Tubing 2, Well Testing, Well Intervention CoE). The total of 33 is stated in the legend and not distributed across areas.
- PDF preview is a placeholder ("PDF viewer not connected").
