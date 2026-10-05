# RISE · Direction B: "Flagship"

## Philosophy
RISE is presented as TAQA's flagship knowledge product, with the restraint of a premium product page or a top-tier annual report applied to an enterprise tool. Large, calm BW Gradual type carries **WHAT WE KNOW.**, and deep ink bands give each page weight and a clear identity. White work surfaces then take over, so finding and checking documents stays fast. The brand leads and the content follows straight after it.

## Why it fits RISE
- **Trust is a brand promise.** The ink identity band on the viewer works like a document's title page. It shows the number, Rev, status and classification in one line, then "Approved 28 Aug 2025 by Segment Director, Coiled Tubing" in white. A field operator sees that the document is current and approved before they scroll.
- **It is clearly TAQA, and clearly RISE.** Every page uses the logo's own colours (ink, pillar teal, cyan, orange) and its own geometry: the chamfered bars and the orange full stop. Nothing is borrowed from a generic SaaS kit.
- **It gives a 5,000-person workforce a sense of pride.** The Home page reads like a company publication rather than an intranet.

## Strengths
- Strongest brand presence and emotional pride of the three directions, and the most "premium" first impression.
- Editorial hierarchy: there is one big idea per screen (the statement, the area name, the document title, the routing sentence), so pages are easy to scan.
- Two grounds and one shadow make up a very small, strict system that is hard to misuse as it grows.
- Big tabular figures in BW Gradual Light make register numbers (520 · 25 · 33 · 14) feel authoritative, not decorative.

## Weaknesses (honest)
- **Lower density.** Rows are 88px with the identity line, against roughly 56px in a denser direction, so an SOP shelf shows about 9 rows per screen.
- **Dark bands cost vertical space** on work screens (about 280–360px). To limit this, bands hold real information (area facts, queue figures, actions) rather than only a title, and they could collapse to a 64px sticky strip on scroll.
- **Photography needs curation.** The duotone keeps every photo inside the palette, but a dusk photo turns moody. The Home photo needs to be chosen and cropped with care.
- **Risk of feeling like a marketing site** if the Home treatment spreads. The rule is: a photo appears only on Home, and the chamfer appears once per page.

## Scaling to complex QMS / document-control screens
- The **band carries the queue's state** (12 waiting · 6 days oldest · 1 held back · 147 provisional), so the white canvas below is free for the work itself.
- The queue uses **cards that expand inline**: checks, the change note, "Next: Segment Director, Coiled Tubing" and the three actions all sit inside the selected card, so the controller never loses their place. A held-back item is shown dashed and muted, with its separation-of-duties reason in words.
- A Master List or audit view would keep the same band. Below it would be a full-width table using the same identity line, with 56px rows: a "compact" density token that only QMS, Director and Auditor screens use. The flagship scale is for reading, not for every grid.
- Side panels (register health, routing rules) use the canvas grey and never the ink, so ink always means "identity", not "chrome".

## Business rules made visible
- Viewer (Employee view): revision history is kept, labelled **"Visible to the owner, QMS and auditors"**. The Employee-facing trust line ("Approved 28 Aug 2025 by Segment Director, Coiled Tubing") sits in the band.
- Restricted rows: an Employee sees the record, but the download is replaced by a disabled lock, with a legend under the list.
- Upload shows the final approver as the page's headline. It also shows the D1 same-number rule, the supersession of Rev 3.0, the SOP-009-AR re-issue flag, separation of duties, and the different route for maintenance documents.
- QMS workspace is labelled **Concept** in the band.

## Motion proposal
| What | Duration | Detail |
|---|---|---|
| Home brand entrance | 400ms + 300ms (≤ 700ms total) | First Home visit per session only. The two chamfered bars slide 48px in from the right (second bar +80ms), and the statement fades up 12px. The search field is focusable and typeable from the first frame. |
| Page change | 180ms | The band stays in place and the white content canvas fades in. |
| Tile hover (Home) | 200ms | Tile lifts 2px and takes the one shadow. |
| Drawer / sheet | 240ms | Slides from the edge, ease-out; scrim fades in over 160ms. |
| Menus, hover, focus | 120ms | Colour and opacity only. |
| Loading | none | Static skeleton rows in canvas grey, with no shimmer. |

Transform and opacity only, ease-out `cubic-bezier(.2,.7,.2,1)`. No Ken Burns, no looping motion. `prefers-reduced-motion` turns everything off (see `rise.css`).

## Main tokens
- Grounds: `--ink #002B32` (bar, bands, footer) · `--ink-2 #013F4E` (pillar teal, raised on ink) · `--paper #FFFFFF` · `--canvas #F5F7F8` · `--line #E2E8EA`
- Accents: `--cyan #00ADC2` (on dark only: active nav, key figures, Upload/Download on ink) · `--teal #005D63` (primary action on light) · `--orange #FD5805` (the full stop and critical alerts; never body text on white)
- Text: `#0C2228` / `#3E5258` / `#66787D`
- Status (word + shape): Current `#11704F` disc · Review due `#8A5100` diamond · Draft, In QMS check and Awaiting final approval `#2D5B8A` half disc · Returned `#B42318` square · Superseded and Obsolete `#5E6D72` ring. Lock icon for Restricted and Confidential.
- Type (7 steps): Statement 104 BW Gradual 800 · Display 48 BW 700 · Title 28 BW 700 · Heading 20 BW 700 · Body 16 Inter · UI/data 14 Inter 500, with document numbers in BW Gradual 400 caps +7% · Label 12 Inter 600 caps. Figures use BW Gradual 300, tabular.
- Space: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96. Content max 1240, 12 columns, 24px gutter. Phone: 390 with 20px gutters and 44px minimum targets.
- Shape: radius 10 (controls) / 14 (cards). One shadow: `0 1px 2px rgba(0,43,50,.06), 0 10px 28px -6px rgba(0,43,50,.14)`. Chamfer 72px on band corners.

## Mockup notes
- On the phone pages, the bottom tab bar and the document action bar are `position: fixed` in the product. In the mockup they sit in normal flow at the end of the page, so the full-length screenshot shows them once, in place.
- Dark mode would invert the grounds: ink becomes the canvas and the bands move to pillar teal. It was not drawn here.
