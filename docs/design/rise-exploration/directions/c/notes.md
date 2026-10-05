# Direction C · Atlas

## Philosophy
RISE as TAQA's reference library, closer to a technical publisher or a standards body than a dashboard. Structure is the interface: every document has a place (area, side, shelf), a code (TQ-TWS-CTSS-SOP-009) and a lineage (revisions, approvals). The design makes that structure visible and calm, and puts reading comfort and clear status first.

## Why it fits RISE
RISE is used to answer "is this the revision I'm allowed to use, and who approved it?". Atlas answers that with the document itself: a white sheet on a grey ground, a printed-style status stamp, and the approval trail drawn as a lineage. People in the field already think in register codes (CTSS, DSS, QHSE) and type codes (SOP, WI, F, ALT, LL). Atlas uses those codes as large typographic landmarks, so finding your way and learning the numbering system are the same thing. The Home page even has a "Reading a document number" strip.

## Pages
- `home.html`: the masthead "WHAT WE KNOW." with a single wide search and suggested queries, then an index of the company. The index has three columns of areas, each with its register code, dotted leaders and a count. A side column shows In force today (520 = 455 Current + 65 Review due), Active technical alerts (33) with the two most recent alerts from the register, and Recently revised. Field Glossary and Ask an Expert follow as small entries.
- `browse.html`: the area masthead (CTSS, "Coiled Tubing.") with the Operations | Maintenance switch, and ALT-002 set as a printed notice. A left "contents" column lists the shelves with leaders. The SOP shelf shows its documents as catalogue entries with the identity line, title, issue date, Arabic availability and review due (days late or due soon).
- `viewer.html`: three columns. On the left, the document's contents with a scroll-spy marker. In the centre, the chamfered sheet showing the cover preview placeholder, with the actions above it. On the right, the record: the Current stamp, identity, the Rev 4.0 approval trail and revision history drawn as lineages, and related documents. This page is shown in the **Auditor (read-only)** role. The revision history block says it is visible to the owner, QMS and auditors. The Employee version of that rule is shown on `mobile-document.html`, where the stamp carries only "Approved 28 Aug 2025 by Segment Director, Coiled Tubing".
- `upload.html`: step 3 opens with a sentence ("You are filing Rev 4.0 of TQ-TWS-CTSS-SOP-009") and a Rev 3.0 → Rev 4.0 marker, followed by the filing record. Routing is drawn as a lineage, and the final approver gets the only ink-bordered box on the page. The page also shows the consequences (Rev 3.0 is superseded and SOP-009-AR is flagged to be re-issued) and the separation-of-duties rule.
- `qms.html` (Concept, labelled): the queue is a ledger, oldest first, with ages and type codes. The selected filing is shown as a record with a check against each control rule (citing TQ-QHSE-S001 §5.3 and rule D1), a horizontal routing line, and Confirm / Return… / Next. The page also shows the held-back item (separation of duties) and register health as a short ledger.
- `components.html`: the system sheet. It covers colour, type, space, the three signatures, buttons in all their states, the identity line and rows, status and classification, the approval trail, forms, alerts, the empty state, the drawer, icons and motion.
- `mobile-home.html` and `mobile-document.html`: 390px wide, with 44–48px targets and 16px minimum body text. The bottom tab bar is Home / Areas / Search / Glossary / Ask. On the document page the identity comes first and the actions row (Download PDF, Bookmark, Share, More) sits directly under the status stamp, in thumb reach. In the product the actions row docks to the bottom edge when the page scrolls, and the tab bar is fixed. The mockups render both static so the full-page screenshots read cleanly.

## Signatures (used sparingly)
1. **The 45° chamfer** from the logo's bars, applied with clip-path to the top-right corner of document sheets and document cards only. A gradient hairline keeps the cut edge drawn.
2. **The orange full stop** (a round dot, like the logo's), on display headings only: the Home masthead, the area title and section titles. It never goes on body text or on document titles, which are data and not RISE's voice.
3. **Codes as landmarks**: SOP, WI, CTSS set large in BW Gradual as navigation markers on the shelf, the viewer rail and the masthead.

## Strengths
- The best reading and trust experience of the three directions. The document reads like a document, and status reads like a stamp.
- It makes document control understandable to everyone: codes, revisions and lineage become visible and learnable, not hidden in metadata.
- It is distinctive without being loud: there are no photos, gradients or decorative shapes, and the brand comes through in type, rules and three deliberate signatures.
- The identity line (number · Rev · status · classification) is the same component everywhere: rows, the viewer, the QMS queue and the phone.

## Weaknesses
- Its brand moment is quieter than B's. There is no hero imagery, so the first impression relies on typography.
- It is less dense than A for heavy QMS triage: catalogue entries take about 115px each, compared with about 56px for a table row.
- It depends on very careful typography and spacing. Done carelessly, it would look plain.

## Scaling to complex QMS / document-control screens
- The ledger pattern (a hairline table with an ink header rule, ages and type codes) scales to the Master List, overdue reviews and provisional numbers. A compact row height of 44px suits power users. The catalogue entry stays for readers.
- The record (a definition table) and the lineage (a vertical trail) cover any object: documents, filings, translations, legacy findings.
- Control checks are rows that each cite their clause, which suits audits: every check can show its evidence.
- A drawer (360px) holds secondary detail, so queues stay in place.

## Motion proposal
- There is no entrance animation on any page.
- Links, rows and buttons: colour, underline and background transitions of 160ms, ease-out.
- Document sheet: fades in over 200ms when the preview loads (`.sheet-frame.loaded`). The cover never jumps.
- Contents rail: the scroll-spy marker moves over 160ms.
- Search results update in place under a fixed-height header, with a 120ms opacity change and no layout jump.
- Drawer: slides in from the right over 200ms while the scrim fades.
- Everything uses transform or opacity, and `prefers-reduced-motion` removes it.

## Main tokens
| Token | Value | Use |
|---|---|---|
| `--ground` | #F4F4F2 | page ground (Monument Gray family) |
| `--sheet` | #FFFFFF | paper |
| `--rule` / `--rule-2` | #DCDBD5 / #C6C5BE | hairlines, field borders |
| `--ink` | #002B32 | text (15.1:1 on white) |
| `--ink-3` | #5A6A6D | meta text (≥5.1:1 on ground) |
| `--teal` | #005D63 | links, primary buttons |
| `--cyan` | #00ADC2 | active marker, focus ring (never text) |
| `--orange` | #FD5805 | full stop, critical alert rule (never body text) |
| `--orange-ink` | #A23A0C | alert label text |
| Status | #2E6A4A Current · #7A5200 Review due · #2F5877 in progress · #9A3412 Returned · #66666A Superseded/Obsolete | word + shape always |
| Type | BW Gradual 700: 56 / 38 / 26 · Inter: 18 / 16 / 14 / 12 | 7 steps |
| Space | 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 | 4px base |
| Widths | content 1200 (1320 viewer/QMS), reading 720, phone 390 / 16px | |
| Radius | 4px for controls; 0 plus a 28–36px chamfer on sheets | |
| Depth | paper-on-ground + hairlines; one soft shadow, on the document sheet only | |

## Data notes
- All figures are from content.md, including 520 in force and 33 active alerts.
- The two "most recent alerts" and the "Recently revised" entries on Home are the newest Current rows in the live register (documents-master.js), because content.md lists only one alert.
- Register codes come from the register (`spl`): CTSS, DSS, FS, WTS, QHSE and so on.
- A dark mode would keep the same structure: the ground becomes deep pillar teal, the sheets a lifted teal-grey, and the hairlines stay hairlines.
