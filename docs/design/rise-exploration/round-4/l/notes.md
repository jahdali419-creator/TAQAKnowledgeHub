# L · Editorial Knowledge Platform

## Design philosophy
RISE as a quiet, authoritative publication: the documents are the content, and every page is composed like a section front, not a dashboard. Large light BW Gradual for display, bold BW Gradual for document titles, Inter for reading and data; hairline rules and heavy section rules replace most cards. Documents always appear as documents (scalable cover sheets), and status is stated in plain sentences ("Current: this is the revision to use").

## Best feature
The WI-003 page: a large, sticky cover preview beside a masthead that answers "is this the right document?" in one sentence, with the ALT-002 relationship carried through Home, Area, Contents (§5 flagged) and Related.

## Main weakness
Editorial spacing makes pages longer than a dense operations tool, so desktop users who want many rows on screen (QMS controllers) scroll more than in a table-first design.

## Best suited for
Field supervisors, engineers and managers who need to understand what changed and trust the document they open, more than for bulk register administration.

## Navigation
- Desktop: one editorial top bar. RISE lockup · Home · Areas (hover/focus opens an index of all 25 areas grouped by family, with counts) · Saved · Ask an Expert · Field Glossary · search field · Upload · notifications · "Viewing as Employee" role switcher. On the document page a slim action bar (Saved state, Share, More, Download PDF) stays fixed at the top as you scroll.
- Area page ends with the full "All areas" index by family (anchor `area.html#index`).
- Phone: slim top bar (logo, search, notifications) plus a bottom bar of Home · Search · Areas · Saved · Menu. Menu opens a bottom sheet (CSS `:target`, no JS) with Ask an Expert, Field Glossary, Upload, Notifications and Viewing as Employee. The document page keeps a sticky bar with Saved and Download.
- Master List and QMS Workspace are not shown because the viewer is an Employee.

## Tokens
- Colour: paper `#F7F6F2`, surface `#FFFFFF`, ink `#002B32` (text), secondary `#33525A`, meta `#5A6F74`, rules `#DAD9D2`/`#E7E6E0`, teal green `#005D63` (links, primary action, active), pillar `#013F4E`, tint `#EEF3F2`. Orange `#FD5805` only for the active-nav underline, notification dot, alert edges and tab marker. Status: Current `#1C7A4A` filled check, Review due `#8A5A00` clock, Superseded muted square; classification is always a lock plus the word.
- Type: display BW Gradual 300 (34/46 phone, 60–88 desktop); titles BW Gradual 700 (17–22 rows, 32/48 document title); section heads BW Gradual 700 20–22 on a 2px ink rule; body Inter 16/1.55 (lede 17–19); meta Inter 13–13.5; eyebrows Inter 600 11.5 uppercase +0.09em.
- Spacing: 4pt scale (4 to 64); 20px phone gutter, 40px desktop gutter, 1360px max width, 12-column grid with 32px gaps (8 + 4 split on Home, Search and Area; 6 + 6 on Document).
- Radius: 4 / 6 / 10px; covers 3px. Shadow only on cover sheets.
- Density: relaxed editorial rows (14–18px vertical padding), 44px+ targets on phone, tables only where comparison matters (the area's SOP list).
- Files: `l.css` is shared. Each page also has its own `<style>`. Static HTML/CSS, one inline SVG icon sprite, no JS.
