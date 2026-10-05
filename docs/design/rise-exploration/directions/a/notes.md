# Direction A: Instrument

## Philosophy
RISE is a precision instrument for controlled knowledge. The document register is the hero. Every screen is an app-shell workspace on a 4px grid with hairline borders, Inter for the work and BW Gradual for names. The brand stays small and exact: the RISE lockup, WHAT WE KNOW. with its orange full stop, the ink and teal palette, and one identity line that reads the same everywhere.

## Why it fits RISE
- **Trust is a data problem.** A field operator needs to see the number, the revision, Current and the approver straight away. The identity line (`number │ Rev │ ● Status │ Class`) does that in one token. The viewer adds a single green line: "Current revision. Approved 28 Aug 2025 by Segment Director, Coiled Tubing."
- **Document control is dense.** QMS, directors and auditors live in queues, registers and checklists. An app shell with tables and split views is the native form for that work, and a marketing layout is not.
- **It is still unmistakably RISE.** The logo lockup heads every screen, WHAT WE KNOW. is the Home headline, BW Gradual sets every page title, and the 45° chamfer from the logo appears in exactly two places: the active nav item and the critical-alert mark.

## Strengths
- **Fastest to scan.** Rows are 46px with tabular figures. In the table the identity line becomes the first four columns (Number, Rev, Status, Class), so the token and the table are the same object.
- **Scales to the hardest screens.** The QMS split view (queue + check panel + routing + keyboard actions) uses the same parts as Browse and the Viewer, and nothing new had to be invented for it.
- **Consistent.** Sidebar, top bar, breadcrumbs and Upload sit in the same place on every page. Every role sees the same layout and only the Workspace group changes (Employee: Saved, Your submissions; QMS: QMS queue, Master List, Saved).
- **Honest states.** Status is always word plus shape: ● Current, ▲ Review due, dashed ring Draft, half circle In QMS check, three-quarter Awaiting final approval, ◆ Returned, ○ Superseded, struck ring Obsolete. Superseded rows are muted and never hidden.

## Weaknesses
- It has the least emotional brand expression of the three directions. There is no photography and no hero, so it relies on the logo, BW Gradual titles and the teal and ink palette to avoid looking like generic SaaS.
- A first-time field user may find the sidebar heavier than a simple top nav. On a phone it collapses to a bottom tab bar, but on a desktop it is always there.
- It depends on discipline. One careless drop shadow, gradient or oversized card breaks the whole system.

## How it scales to complex QMS / document-control screens
- **Split views** (list on the left, detail on the right, actions on a fixed bar) cover the QMS queue, a director's approval desk, a Maintenance Manager desk and an auditor's read-only trail with the same layout.
- **The register health strip** (84 reviews overdue · 147 provisional numbers · 302 known / 0 new integrity findings · 13 superseded with successor missing) is a reusable header for the Master List and dashboards.
- **Separation of duties** shows inline as a held-back row with its reason, not as a hidden item or an error after the click.
- **The inspector panel** (identity, dates, approval trail, revision history, related) is the same component on the viewer, in the QMS detail and in a future audit view. Revision history is labelled "Visible to the owner, QMS and auditors", because the Employee view is shown. An auditor would see the same panel with the label removed.
- **Keyboard first:** ⌘K jumps to any number, title or term. The queue uses ⌘↵ Confirm, R Return (reason required), J/K next/previous.

## Motion proposal
| What | Duration | Notes |
|---|---|---|
| Brand entrance | none | No entrance animation on any visit. The register is the hero. |
| Hover / selection | 150ms ease-out | background, border, colour |
| Inspector / drawer | 200ms ease-out | translateX 16px → 0 + opacity; the only element with a shadow |
| ⌘K palette | 120ms ease-out | scale .98 → 1 + opacity; closes in 90ms |
| Tab underline | 150ms | transform only |
| Skeleton rows | single 1.2s sweep | only if data takes more than 300ms; keeps the table geometry |
| Live indicator | static | the cyan dot never pulses |
`prefers-reduced-motion` turns every transition into an instant state change. In the mockups, sticky elements (top bar, inspector) are real CSS. The upload submit bar and the phone tab bar / action bar would be fixed to the viewport in the product. They are drawn at the end of the page so the full-page screenshots don't overlap content.

## Main tokens
- **Colour:** ink `#002B32` · product teal `#005D63` (hover `#004C52`, wash `#E6F1F1`) · cyan `#00ADC2` as a signal only (focus ring, selected-row edge, live dot) · orange `#FD5805` for the logo and critical technical alerts only (wash `#FFF4EE`, label ink `#B33C00`) · canvas `#F4F7F7` · panel `#FFFFFF` · well `#E9EFEF` · hairline `#DCE4E5` · control line `#C5D1D3` · ink-2 `#36545A` · ink-3 `#5A7176` (5.2:1).
- **Status:** Current `#167A4A/#E7F3EC` · Review due `#8A5800/#FCF3DE` (mark `#D99500`) · In progress `#2F5D8A/#EAF0F6` · Returned `#B42318/#FDECEA` · Not for use `#5A6C70/#EEF1F1`. All text pairs pass AA.
- **Type (7 steps):** Display 28/34 BW Gradual 700 −1.5% · Title 18/24 BW Gradual 700 · Head 15/20 Inter 600 · Read 15/24 Inter 400 · UI 14/20 Inter · Data 12.5/18 Inter 500 with tabular numerals · Label 11/16 Inter 600 caps +7%. Phone body is 16px.
- **Space:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96. Sidebar 248, top bar 52, page gutter 32, 12-column grid with 24 gutter, inspector 360, QMS queue 432.
- **Shape and depth:** controls 6px radius, panels 8px. Depth is a 1px hairline only. One overlay shadow `0 16px 40px -12px rgba(0,43,50,.22)`. Focus ring is 2px white + 2px cyan.
- **Icons:** one inline-SVG line set, 24 grid, 1.75 stroke, round caps/joins, 16px in UI and 20–22px on the phone.

## Dark mode (not drawn)
Swap canvas/panel to `#071D21`/`#0C262B`, hairlines to `#1E3A40`, ink to `#E6F0F0`, and teal to `#4FB3B5` for actions. Status hues and the cyan focus ring keep their meaning. Use the reverse lockup.

## Files
`rise.css` (whole system) · `home.html` · `browse.html` · `viewer.html` · `upload.html` · `qms.html` · `components.html` · `mobile-home.html` · `mobile-document.html`.
