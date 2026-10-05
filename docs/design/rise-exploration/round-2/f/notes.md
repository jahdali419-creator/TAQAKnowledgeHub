# Option F · Rise

**Idea.** The logo becomes the interface. The teal pillar (`#013F4E`) is the header band on the phone and the navigation rail on desktop. The orange and cyan bars become solid colour tiles, and every tile carries the logo's 45° cut.

**Brand moment.** The screen rises (`entrance.html`, 700 ms, once per session). The pillar fills the screen from the bottom (0–340 ms), then the bars, cut from the real logo file, land across the top and bleed off both edges (180–620 ms). The name settles and the full stop pops in (340–700 ms). In the product, the band then shrinks to become the Home header.

**Colour, each with one job**
- Orange: alerts only. Cyan: the primary action and the selected item. Teal: navigation and help (Ask an Expert). White: content. Status keeps its own green and amber.

**Why it works**
- It has the most recognisable brand of the three. The cut, the blocks and the band are on every screen even when the logo has scrolled away.
- Big targets for gloved hands. Tiles are at least 104 px tall on the phone, and on the area screen you pick one of six shelves before you see a list.
- The document screen puts a status card over the band (Current, Rev 4.0, Internal, approver, next review), with Download, Save offline and Share as tiles.

**Watch out for**
- Colour blocks are loud, and the rule that orange means an alert must be held strictly.
- Tiles show fewer documents per screen, so QMS and auditor roles will need a denser list view.

**Tokens.** Ground `#EDF1F0` · pillar `#013F4E` · teal `#005D63` · cyan `#00ADC2` (ink text on it) · orange `#FD5805` (ink text on it, 4.6:1) · ink `#002B32` · line `#D7DFDE` · Current `#167A4A`. Cut `--cut: 20px` on tiles (28 px on desktop, 40–56 px on the band). Type: BW Gradual 700/800 for headlines, BW Gradual 300 for counts, Inter for the interface.

**Files.** `rise.css` · `entrance.html` · `home.html` · `area.html` · `document.html` · `search.html` · `upload.html` · `workspace.html` · `ask.html` · `glossary.html`. Every page is one responsive file: base CSS is the 390 phone, `@media (min-width:1024px)` the 1440 desktop.


## Round 3: navigation and the remaining screens

**Navigation change.** The phone tab bar now has five tabs, Home · Areas · Search · Glossary · Ask; the active tab still wears the cyan bar from the logo. Bookmarks moved to the top band as an icon button next to notifications, and a menu button opens the role switcher ("Viewing as") and, for QMS / approvers, Master List and Workspace. On desktop the pillar rail carries Home, Areas, Search, Field Glossary, Ask an Expert; a "Document control" group (Master List, Workspace) only for QMS / Segment Director / Maintenance Manager; Upload as the single cyan action for roles that file; Bookmarks and Notifications at the foot; and the role card ("Viewing as Employee", with a chevron to switch). Employee pages show no Upload, Master List or Workspace. Upload and the QMS check are task flows: on the phone the tab bar gives way to docked actions (the top band keeps the menu, bookmarks and notifications).

**Entrance.** Unchanged on the phone. On desktop the same cut logo is scaled up and centred on the pillar instead of sitting in the left third.

**New and updated screens**
- `home.html`: Field Glossary door added (190+ terms), Continue reading kept, Platform overview below the fold (520 in force · 11 business segments · 33 active technical alerts · 12 awaiting QMS approval; the orange square marks alerts only) and the #BetterTogether line.
- `area.html`: the shelves now lead to a real list. Phone: shelves in a 3 × 2 grid so the SOPs list header shows on the first screen; then in-force strip, All 39 / Software, the SOPs list (search in tab, Sort, rows with the identity line, ⋯ menu, "Show the next 6"). Desktop: shelves and side links in a sticky left column, the SOPs list beside them with an Issued column; area figures (36 of 39 in force, 2 active alerts, 1 awaiting approval) and Copy link sit in the band.
- `document.html`: Download PDF, Bookmark, Share (QR + link), More (Quick reference card, Pin offline, Print; listed openly on desktop). Below the status card: Control record (Status "Current, OK to use", Revision, Issued, Owner, Full control record), Summary, Contents, Approval & e-signature trail, Version history ("Current revision only" for Employee), Related documents.
- `search.html`: query "injector", 2 results with identity line and status, quick chips, Filters (Area, Status, Document Type, Issued from/to, Clear all; a sheet on the phone, a left column on desktop) with the note that superseded/obsolete are left out, the Ask an Expert fallback with the sample question (no glossary term matches), and the AI-answers safety line as a quiet note.
- `upload.html`: step 3 of 3, filer Khalid Al-Otaibi · CT Engineer. Revision card (Rev 3.0 → Rev 4.0, same number), "Where it goes" with the final approver as the emphasised step, Check the record, Document details, what happens on approval (Rev 3.0 superseded, SOP-009-AR flagged "to be re-issued"), maintenance routing and separation of duties. Back / Submit for Review docked on the phone, in the band on desktop.
- `workspace.html` (Concept): role QMS (Document Control). Desktop: register health in the band, dense queue "Waiting on QMS 12" (cut rows, cyan = selected, held item outlined and marked "Held"), 5 more, held-back explanation, and the check panel "QMS check · 2 of 12" with Confirm QMS check / Reject… / Next in queue above "What to check" and the record. Phone: the selected item only, back link "Queue · 12", Next, checks as a list, held-back note and register health below, Reject… / Confirm docked. This is the denser list view the tile model needed for QMS.
- `ask.html`: five sections (Who you are asking with the expert shown inline as a role, The problem, Urgency, Photos, You). Critical is marked by an ink edge and a stop sign, never orange. Desktop side column: Send / Cancel, response times, the escalation tip, segment experts.
- `glossary.html`: 190+ terms, search, category pills, A–Z jump bar (horizontal on the phone, vertical on desktop), letter sections with the sample terms, CT expanded with its definition and category, Close all, Add a term.

## Capability coverage
| Capability (live inventory) | Where it lives in F |
|---|---|
| Nav: Home, Areas, Document Search, Field Glossary, Ask Expert | Phone tabs (5) · desktop rail |
| Master List, Workspace (QMS / approvers) | Rail "Document control" group (workspace.html); phone menu |
| Upload for roles that file | Cyan rail button (upload, workspace); phone menu |
| Role switcher "View as" | Rail role card; phone menu ("Viewing as") |
| Bookmarks, notifications | Top band icons on phone; rail foot on desktop |
| Theme toggle, offline bar, update bar, install sheet, delegation banner, / shortcut | Not drawn; phone menu / rail foot in the product |
| Home: search, overview figures, three doors, #BetterTogether | home.html; "Your desk" for QMS/approvers would take the Continue-reading slot |
| Home: Explore by Discipline, company policies toggle, tour | Areas tab (sheet grouped by family); not drawn |
| Area: Operations / Maintenance, shelves with counts, All, Software, Bulletins (Maintenance side) | area.html band + shelves + All/Software links; Bulletins appears as a 7th shelf on the Maintenance side |
| Area: search in tab, sort, Showing N, pagination, row ⋯ (Bookmark, QR, Copy link), New/Revised | area.html list; no SOP was issued in the last 120 days, so no badge shows |
| Area: Copy link, Manage Segment (holders only) | Band on desktop; Manage Segment not shown for Employee |
| Viewer actions: Download, Bookmark, Share (QR + link), More (Quick reference, Pin offline, Print) | document.html |
| Viewer: control record brief + full record, summary, history, trail, related | document.html (phone below the first screen; desktop side column) |
| Viewer banners (Obsolete, Superseded, Draft, overdue, provisional, restricted, returned) | Not drawn for a Current document; would replace the status card in the same slot |
| Search: safety note, count line, filters, chips, superseded/obsolete excluded | search.html |
| Search: 0/500 counter, suggested prompts, empty state | Counter on desktop field; prompts and "No Documents Found" replace results when there is no query/match |
| Glossary: search, categories, A–Z, letter sections, expand, Close all, Add a term | glossary.html (the Add a term drawer asks Abbreviation*, Full name*, Definition, Field) |
| Ask: area + side routing, problem fields, category, Add detail, urgency (4 live levels), photos, Mobile or radio, Send / Cancel, response times, tip, experts list | ask.html |
| Upload step 3: check the record, routing, consequences, maintenance routing, separation of duties, Submit for Review | upload.html; steps 1–2 and "Your submissions" not drawn |
| QMS workbench: n of N, what to check, Confirm, Reject (reason 20–500), next, held items, register health | workspace.html |
| Control Panel, delegation, Published Documents, Analytics, Master List page | Not drawn (outside this round); reached from the rail Document control group |
