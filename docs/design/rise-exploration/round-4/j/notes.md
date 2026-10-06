# J · Clean Enterprise Product

## Design philosophy
The interface steps back so the documents are the content. Surfaces are near-white, with one neutral scale that leans slightly teal. Hairlines separate things, and a card appears only for an object that must stand apart (the current-revision confirmation, the glossary and expert answer, the alert notice). TAQA Teal Green marks where you are and what you can do, and the other colours carry status.

## Best feature
Search is fast to scan. A slim filter column shows real counts, and a six-column results table (document, type, area, status and access, rev, issued) is grouped by type with your area ranked first, so a technician can find the right in-force revision in seconds.

## Main weakness
The design is deliberately quiet, which makes it the least "branded" of the three. TAQA identity rests on the logo, BW Gradual titles and the teal accent, so with less care in later builds it could drift towards a generic SaaS look.

## Best suited for
Daily use by a broad workforce (technicians, engineers, QMS controllers) who need to find, check and open the correct document quickly, on a laptop in the office or a phone in the field.

## Navigation
- **Desktop (≥1024):** a fixed 248px left sidebar:
  - top: RISE lockup and a "Search RISE ⌘K" trigger (opens Search);
  - nav: Home, Areas (25), Saved (3), Ask an Expert, Field Glossary;
  - "Your area": Coiled Tubing pinned, with its active-alert count;
  - an Upload document button;
  - foot: avatar, "Faisal Al-Ghamdi · Viewing as Employee ▾" (role switcher) and notifications.
  - Master List and QMS Workspace would appear as a nav group only for QMS / Segment Director / Maintenance Manager roles. They are absent here.
- **Phone:** a compact top bar shows the logo (or a back link on the document) and notifications. A 5-item bottom tab bar holds Home · Search · Areas · Saved · More. More holds Ask an Expert, Field Glossary, Upload, the role switcher and settings.
- In-page routes:
  - Home's area band goes to the area;
  - each area has an "Ask the expert" button;
  - the Document page has a breadcrumb back to its area and shelf.

## Tokens
- **Colour:**
  - surfaces: bg #FFFFFF, subtle #F7F9F9 (sidebar), muted #EEF2F2, canvas #E9EEEE (document viewer);
  - lines: #E3E9EA and strong #CDD7D8;
  - ink: #10201F, ink-2 #3B4B4D, ink-3 #5C6C6E (AA on white);
  - brand: #005D63 (active nav, links, primary button), tint #E6F1F1, title ink #002B32, logo orange #FD5805 only for the notification dot.
- **Status** (always word + shape):
  - Current: #17703F with a filled circle;
  - Review due: #8A5300 text with an amber #C27C0E triangle;
  - Superseded: grey with a hollow circle;
  - Restricted / Confidential: a lock and the word.
- **Type:**
  - BW Gradual 700 for page titles only (30px desktop, 26/24px phone) and the cover page;
  - Inter for everything else: 15px section labels (600), 14–15px rows (500), 12.5–13px meta, 12px column headers;
  - phone body is 16px.
- **Spacing:** 4px base. Rows are 11–14px vertical padding, sections are 28–32px apart, the desktop page gutter is 48px with a 1104px content width, and the phone gutter is 16px.
- **Radius:** 4px (tags), 6px (nav, rows), 8px (buttons, notices), 10px (search field).
- **Density:** medium on desktop (rows about 56–64px), comfortable on phone (44px+ targets, 64px tab bar).
