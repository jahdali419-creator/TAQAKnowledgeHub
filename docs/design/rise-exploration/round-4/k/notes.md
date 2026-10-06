# K · Technical Operations Hub

## Design philosophy
RISE as the document-control desk for operations: every screen leads with your area, the state of the register (in force, alerts, awaiting approval) and the trust facts of each document (type code, number, revision, status, classification). Dense, register-style tables on desktop with 40px rows and tabular figures. On the phone, the same facts collapse into calm single-column lists. Colour is used only for state (status, alert severity, your area). Brand colour marks only the ink top bar, the active navigation and primary actions.

## Best feature
The document-control band on WI-003 (status, revision, effective, next review, owner, approver, classification, plus a green "Rev 4.0 is the revision in force" line and the ALT-002 "changes §5" strip) answers "is this the right, current document?" before the preview loads.

## Main weakness
Density and the full-length numbers (TQ-TWS-CTSS-…) give power users a lot to scan, but an occasional reader may find the register tables heavy compared with a lighter editorial layout.

## Best suited for
Field supervisors, engineers and QMS users who check revisions, alerts and approvals every day and want to compare documents across areas quickly.

## Navigation
- **Desktop (hybrid):** a dark ink global bar holds the RISE reverse lockup, Home · Areas · Saved · Ask an Expert · Field Glossary (the active item has a small orange underline), global search ("/"), Upload, notifications and "Faisal Al-Ghamdi · Viewing as Employee" (the role switcher; Master List and QMS Workspace would appear there for QMS roles). Below it, Home and Document have a white context bar (Your area switcher, Operations | Maintenance, breadcrumbs, register figures). Area has a left area tree instead: your area is pinned with Operations/Maintenance children, then Operational segments, Corporate functions, Products & Technology and Company Wide, with counts. Search has a facet column (Type, Area, Status, Classification) with counts.
- **Phone:** a top app bar with the lockup, an area switcher pill ("Coiled Tubing · Ops") and notifications. A bottom bar holds Home · Areas · Search (emphasised, centre) · Saved · More. More holds Ask an Expert, Field Glossary, Upload and the role indicator. Experts are also linked in context on every screen.

## Tokens
- **Colour:** ink `#002B32` (global bar), TAQA Teal Green `#005D63` (primary actions, active tabs, links), logo cyan `#00ADC2` (focus ring, glossary rule), Legacy Teal `#00BBB6` (your-area row marker), Brave Orange `#FD691D` (active nav underline and notification dot only), Crimson `#C8102E` (active alert, effective-immediately). Neutrals: bg `#F3F5F6`, surface `#FFF`, lines `#D9E1E3`/`#E8EDEE`, text `#0F2328`/`#45585E`/`#5F7177`. Status always pairs colour + shape + word: Current green `#1A7A4C` ● · Review due amber `#8A5300` ◆ · Superseded/Obsolete grey `#5B686D` ○ · Awaiting approval blue `#2C5597` · alert crimson ▲. Restricted and Confidential always show a lock and the wording "request access through QMS".
- **Type:** BwGradual 700 for page and document titles (24–30px). Inter for everything else, with tabular figures throughout. Desktop: 14px body, 13.5px table cells, 11–12px uppercase labels. Phone: 16px body, 13px meta. Type codes (SOP, WI, ST, ALT, LL, F) use neutral outlined 11px badges; only ALT is tinted.
- **Spacing:** 4px base (4/8/12/16/20/24/32). Desktop gutters 24px, phone 16px.
- **Radius:** 4px (badges, inputs), 6px (panels, buttons), pills for chips.
- **Density:** desktop table rows 40px, list rows 38–46px, 56px global bar and 48px context bar. Phone touch targets 44px or more and a 56px-plus bottom bar.

Notes on content: revision deltas on Home (e.g. 3.0 → 4.0) assume sequential revisions; "Maintenance 6" in the area tree is 45 minus the 39 Operations records; review dates per SOP are not in the content, so the Area register shows status (Review due) and the known issue dates only. The equipment tags on WI-003 are labelled proposed.
