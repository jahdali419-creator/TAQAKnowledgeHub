# Option E · Full Stop

**Idea.** Type does the work. One typeface (BW Gradual) on warm paper, with the orange full stop from WHAT WE KNOW. as the only accent in the whole product.

**Brand moment.** There is no splash screen. When Home opens, WHAT, WE and KNOW rise into place 70 ms apart (420 ms each) and the full stop drops in at 380 ms, for 600 ms in total, once per session. The statement is the home screen itself, so nothing waits. BW Gradual's full stop is square, so the round dot is drawn (`.fs`) to match the logo.

**The full stop as a system.** It marks the end of the statement and area titles ("Coiled Tubing."), the active tab (a dot under the word), the active upload step, the active glossary letter and category, unread notifications and critical alerts/urgency. It never appears on document titles, which are data.

**Why it works**
- These are the quietest screens of the three: no cards, no tiles and no icons in the tab bar. Status is a word plus a shape: a dot for Current, a diamond for Review due, a ring for In QMS check.
- Search sits in the thumb zone at the bottom of the first screen, just under the one critical alert.
- Trust is written as a sentence: "Current, OK to use. Approved 28 Aug 2025 by Segment Director, Coiled Tubing."
- The search screen offers Ask an Expert, with the question filled in, when the results aren't enough.

**Watch out for**
- The brand depends on BW Gradual loading. It is weak with a fallback font.
- The first screen has the most open space of the three, and the logo colours appear only in the lockup.

## Navigation (round 3)
- Phone tab bar: five words, **Home · Areas · Search · Glossary · Ask**, the full stop under the active one. Saved (bookmarks) moved to the top bar as an icon next to notifications. The role indicator in the top bar ("Employee ▾", "CT Engineer ▾", "QMS ▾") opens the "Viewing as" sheet.
- Task screens (Document, Upload, QMS check) replace the tab bar with a docked action bar and keep a back link; Ask keeps the tab bar and docks Send above it.
- Desktop top bar: Home, Areas, Search, Field Glossary, Ask an Expert; for QMS/Director/MM a thin rule then Master List and Workspace; role indicator ("Viewing as Employee", "Khalid Al-Otaibi · CT Engineer", "QMS · Document Control"); bookmarks; notifications; **Upload** as the one primary button for roles that file. Employee read pages show no Upload / Master List / Workspace.
- Theme toggle (light/dark) is omitted from the mockups; it sits in the role sheet on phone and next to bookmarks on desktop.

## Screens
| File | Phone 390 | Desktop 1440 |
|---|---|---|
| `home.html` | Statement, critical alert, search in thumb zone | Statement + index column |
| `area.html` | Title, Operations/Maintenance, shelf pills, sort, rows with ⋯ | Left: title, facts (36 in force · 2 alerts · 1 awaiting), alert, your recent, copy link. Right: shelf tabs, shelf search, sort, register table (number · title · Rev · status · class · issued · ⋯) |
| `search.html` | Field, Filters + quick chips, count, results, quiet AI note, Ask fallback | Filters column · results · Ask fallback column |
| `document.html` | Identity, verdict, brief, summary, contents, trail, history, related; dock Download · Bookmark · Share · More | Identity + actions + brief + trail · preview + related · summary, contents, history |
| `upload.html` | Step 3 of 3, file, revision, route with final approver, record, consequences; dock Back · Submit for Review | Record left; route, consequences, rules, actions right |
| `workspace.html` (Concept) | Selected item check (back link "Queue · 12"), held-back item, register health link; dock Reject… · Confirm | Queue · check · register health |
| `ask.html` | Five progressive sections; Cancel · Send docked over the tab bar | Form with section labels left; response times, next steps, segment experts right |
| `glossary.html` | Title, search, category pills, A–Z, letter sections, CT expanded | Categories list left; A–Z bar; giant letters in the margin |

## Capability coverage
- **Global chrome**: role switcher (role button → "Viewing as" sheet), bookmarks (top-bar icon), notifications (bell with full-stop unread), Upload (filer/QMS desktop top bar), hamburger replaced by tab bar + role sheet. Offline/update bars, delegation banner, keyboard shortcuts, reading progress: not drawn, unchanged behaviour.
- **Home**: hero statement, search → Document Search, critical alert, continue reading, areas index. Platform overview figures in the desktop facts line. Three doors are now first-class tabs (Areas, Glossary, Ask). "Your desk" appears for QMS/Directors (not drawn: Employee view).
- **Area**: Operations | Maintenance; tabs with counts All · Standards · SOPs · Manuals · Forms & Checklists · Alerts · Lessons Learned · Software (Bulletins appear on the Maintenance side); shelf search (desktop); sort Default / A–Z (sort button; "Overdue first" for controllers); "Showing 9 of 15" + more; per-row ⋯ (Bookmark, Show QR code, Copy link); classification with lock when not Internal; Arabic marker; active alerts; Your recent; Copy link. "New/Revised" badges: none of these rows was issued within 120 days, so none shows. Review lateness ("N days late") is controller-only and no longer shown in the Employee view; the Review due status stays.
- **Document viewer**: Download PDF, Bookmark, Share (QR + copy link), More (Quick reference card, Pin offline, Print — a menu on phone, visible links on desktop); preview placeholder "Preview not connected"; Employee brief (Status "Current, OK to use", Revision, Issued, Owner) + Full control record; Summary; Contents; Approval & e-signature trail; Version history "Current revision only"; Related documents (3).
- **Document Search**: query with 0/500 count; quick chips All, Drilling Services, Safety Services, Fracturing, QHSE, HR; Filters (Area, Status, Document type, Issued from/to, Clear all filters) as a sheet on phone and a column on desktop; "2 documents in the register match “injector”"; source rows with identity line; obsolete/superseded excluded (filter note); quiet AI caveat; Ask an Expert fallback with the sample question; no glossary hit for "injector".
- **Upload step 3**: steps 1·2·3; file + fingerprint/duplicate result; revision Rev 3.0 → 4.0 same number; Check the record (Area/side, Type, Approver, Classification, Review cycle, Next review due, Retention 10 years, Language, Applies to, Status on filing "Draft, pending approval", What changed); route Filed → QMS check → **Final approval: Segment Director, Coiled Tubing** → Current; Rev 3.0 superseded and SOP-009-AR flagged "to be re-issued"; Maintenance Manager routing note; separation of duties; "Filed as CT Engineer"; Back / Submit for Review.
- **QMS workspace (Concept)**: "Waiting on QMS · 12", 7 rows + 5 more; "QMS check · 2 of 12"; What to check (Number, Type, Area, Revision, Supersedes, translation, File, Submitted by/at, Classification, Next approver, Summary) with checks; Confirm QMS check / Reject… (reason 20–500, returns to author) / Next in queue; held-back TQ-QHSE-S014; register health (84 · 147 · 0 new of 302 known · 13 legacy) + Open the Master List.
- **Ask an Expert**: 1 Area* + Operations | Maintenance with inline expert (Maintenance → Maintenance Manager); 2 Title*, What is happening?*, Category*, Add detail; 3 urgency Critical/High/Medium (default)/Low with response times; 4 Photos (up to 5, markup); 5 You (from sign-in) + Mobile or radio; Send to Expert / Cancel; sidebar response times, escalation tip, segment experts.
- **Field Glossary**: "190+ terms", search, category pills (All … Community), A–Z jump bar, letter headings, Close all, Skip to the terms, row expand (definition, category chip), Add a term.
- **Not in these screens** (unchanged, reachable from the role's nav): Master List, Control Panel, delegation, Published Documents, Analytics, Form fill/print, Offline page.

**Tokens.** Paper `#F5F3EE` · ink `#002B32` · ink-2 `#3F5559` · ink-3 `#5E6F72` · rule `#DDD8CE` · teal `#005D63` (links) · orange `#FD5805` (the full stop only, never text) · Current `#1A7547` · Review due `#8A5800` with a `#D99500` mark. Type: BW Gradual 800 for the statement (92 px on the phone, 158 px on desktop), 700 for titles, 400 for reading at 17–18 px. Inter only for document numbers, dates and small labels (tabular figures). Square-cornered controls (4 px).

**Files.** `fullstop.css` · `home.html` · `search.html` · `area.html` · `document.html` · `upload.html` · `workspace.html` · `ask.html` · `glossary.html`.
