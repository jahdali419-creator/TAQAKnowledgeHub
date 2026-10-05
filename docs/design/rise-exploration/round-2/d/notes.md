# Option D · Beacon

**Idea.** RISE as a lit signal. The deep ink of the logo (`#002B32`) is the ground, and the logo's own colours are the only light on the screen.

**Brand moment.** A full-screen entrance, 700 ms, once per session (`entrance.html`). The real logo file (`rise-logo-reverse.png`) is cut into six parts with `clip-path`, so the artwork is never redrawn or recoloured: the pillar rises (0–420 ms), the cyan bar slides in from the right (120–520 ms), the orange bar from the left (200–600 ms), the name settles (320–680 ms) and the full stop pops in (520–700 ms). A tap skips it. With `prefers-reduced-motion`, the finished logo shows at once.

**Why it works**
- The symbol and WHAT WE KNOW. lock up on Home the way RISE sits beside the pillar in the logo. It is the strongest first impression of the three.
- The phone home has three things: search (with QR scan), the critical alert and the last document opened. The tab bar is Home, Areas, Search, Glossary and Ask (see Round 3).
- The dark ground is calm in control cabins and on night shifts. Cyan actions and the status colours are very legible on it.
- Desktop reuses the same pages (one responsive stylesheet). The cards move to a right-hand column and the register figures go to a footer.

**Watch out for**
- Dark screens are harder to read in direct sun. Outdoor use needs a light theme too.
- Long reading sits on a light sheet, so the ground changes between lists and documents.

**Tokens.** Ink `#002B32` · raised `#063A43` · line `#1A5059` · cyan `#00ADC2` (actions, active tab) · cyan text `#3CCFE0` · orange `#FD5805` (logo and critical alerts only) · sheet `#F5F7F6` · Current `#4FD39A` on ink · Review due `#F4BE52` on ink. Type: BW Gradual 800 for the statement, 700 for titles, Inter for the interface, document numbers in Inter 600 with tabular figures. 44 px minimum targets and 16 px minimum body text on the phone.

**Files.** `beacon.css` (mobile first; `@media (min-width:1024px)` is the desktop) · `entrance.html` · `home.html` · `area.html` · `document.html` · `search.html` · `upload.html` · `workspace.html` · `ask.html` · `glossary.html`. Each page is one responsive file, checked at 390×844 and 1440×900.

## Round 3

**Navigation.** The phone tab bar now has five tabs: Home · Areas · Search · Glossary · Ask. The active tab still wears the cyan logo bar. Bookmarks moved to the top bar next to notifications, and a menu button holds the role switcher ("Viewing as"), Upload and the theme toggle. On desktop the bar reads Home · Areas · Search · Field Glossary · Ask an Expert, then the role indicator (a "Viewing as" chip that opens the role switcher), bookmarks and notifications. QMS, Segment Director and Maintenance Manager also get Master List and Workspace, and every role that files gets one cyan Upload button. Employee pages show none of these. Detail and task screens (document, upload, workspace, ask) dock their actions just above the tab bar, so the thumb finds the action and the way out in the same place.

**New and reworked screens**
- `area.html` now has a real desktop layout. A sticky left column holds the area name, the Operations | Maintenance switch, three figures (36 in force · 2 active alerts · 1 awaiting approval), the shelves as a list, a note that Maintenance adds Maintenance Bulletins, and "Your recent". The main column shows the critical alert, a toolbar (search in shelf, count, Sort Default / A–Z) and a register table (Status · Rev · Classification · Issued · ⋯). One row has its ⋯ menu open (Bookmark, Show QR code, Copy link). On the phone the same rows are cards with a ⋯ button and a Sort button. The Employee view no longer shows "254 days late" or "review in 35 days", because review state is for controllers only. No SOP was issued in the last 120 days, so no "New"/"Revised" badge shows.
- `document.html` adds the Employee brief (Status "Current, OK to use", Revision, Issued, Owner, then "Full control record"), the approval & e-signature trail on the phone too, Version history ("Current revision only"), Related documents (3) and More (Quick reference card, Pin offline, Print). Share is labelled for QR code and copy link. On desktop the contents sit as a rail beside the page preview.
- `search.html`: "injector" in the white field (the same light object as Home), quick chips, then a quiet result count with 2 results, each showing its identity line and status. There is no glossary term for "injector", so an Ask an Expert card with the sample question takes its place. The safety line is a quiet note with a shield, not an alarm. On desktop the filters sit in a left column (Area, Status, Document type, Issued from/to, Clear all filters, plus a note that superseded and obsolete documents are never listed). On the phone they are behind the Filters chip.
- `upload.html`: Step 3 of 3, filed by Khalid Al-Otaibi · CT Engineer (shown in the role chip). The step bars are a real 1·2·3 sequence. The phone's first screen shows the file, the revision (Rev 3.0 → Rev 4.0, same number) and "Who signs it off", with the final approver in a cyan-outlined block. "Check the record" sits on the light sheet with the chamfered corner. After it come the consequences (Rev 3.0 superseded, SOP-009-AR flagged "to be re-issued") and the notes on separation of duties and Maintenance Manager routing. Back and Submit for Review are docked.
- `workspace.html` (Concept, marked with a small diamond tag): on desktop, register health runs across the head as four light figures. Below it are the queue (12, oldest first, 7 rows plus "5 more", the selected row marked with the cyan bar) and the check on the sheet ("QMS check · 2 of 12": What to check and Checks side by side). A sticky decision bar holds Confirm QMS check, Reject… (reason 20–500 characters, returns it to the author) and Next in queue. The held-back S014 sits under the queue. On the phone the queue becomes "← Queue · 12", the checks come first, then the fields. Reject…, Confirm and Next are docked, and Register health and Master List are links at the foot.
- `ask.html`: five numbered sections, as in the live app. The Coiled Tubing expert is shown inline by role, never by name. The urgency cards use the live levels with their response times. Critical carries an orange hand mark and orange time, so it reads as serious without an alarm fill. High is preselected. Photos (up to 5, markup tools) and "Mobile or radio" follow. On desktop each section label sits in a left gutter, and a side column shows response times (your choice marked), "Critical tickets are escalated immediately" and the segment experts list.
- `glossary.html`: "190+ terms", search, category pills (a vertical list on desktop) and an A–Z bar with C current. The B section is collapsed and C is open, with CT expanded on the light sheet (definition and category chip). The desktop shows the "Add a term" drawer docked open on the right (Abbreviation*, Full name*, Definition, Field), plus a skip link to the terms.

**Motion (unchanged in spirit).** Popovers and sheets would slide or fade in 160–200 ms, ease-out. Result rows lift their surface on hover (160 ms). Nothing loops. Screenshots are taken at rest.

## Capability coverage
| Capability (live inventory) | Where it lives in Beacon |
|---|---|
| Nav: Home, Areas, Search, Field Glossary, Ask | Desktop top bar · phone 5-tab bar |
| Master List, Workspace (QMS/approvers) | Desktop top bar (QMS view in `workspace.html`) · phone: menu, plus a link on the workspace foot |
| Role switcher "Viewing as" | Desktop role chip · phone menu button (top right) |
| Bookmarks, notifications | Top bar icons on every page |
| Upload (roles that file) | Desktop cyan button · phone menu |
| Theme toggle, offline bar, PWA install, shortcuts | Not drawn; theme lives in the phone menu (Beacon would need a light theme for direct sun) |
| Home: search, QR scan, alert, three doors, figures | `home.html` (doors in the right column on desktop) |
| Area: Ops/Maint, tabs + counts, Software, Bulletins (Maint), sort Default/A–Z, ⋯ Bookmark/QR/Copy link, Your recent, alerts | `area.html` |
| New/Revised badge (≤120 days) | Row slot exists; no SOP qualifies today, so none shows |
| Viewer: Download, Bookmark, Share (QR + link), More (Quick ref, Pin offline, Print) | `document.html` header (desktop) · docked bar (phone) |
| Employee brief + Full control record, Summary, trail, Version history, Related | `document.html` sheet |
| Search: field 0/500, chips, filters (Area, Status, Type, Issued, Clear), count, safety note, obsolete excluded | `search.html` |
| Glossary fallback → Ask an Expert | `search.html` fallback card |
| Upload step 3: record, routing, final approver, supersede + AR re-issue, MM routing, separation of duties, Filed as, Submit for Review, Your submissions | `upload.html` |
| QMS workbench: n of N, What to check, Confirm, Reject… (reason), Next, held back, register health | `workspace.html` |
| Ask: area + side, expert inline, title/what/category, Add detail, urgency ×4, photos + markup, Mobile or radio, Send/Cancel, response times, tip, experts list | `ask.html` |
| Glossary: search, category pills incl. Community, A–Z, Close all, Skip to the terms, row expand, Add a term drawer | `glossary.html` |

