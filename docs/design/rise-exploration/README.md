# RISE Premium Product Design: exploration

**Design exploration only. Nothing here is used by the app.** No page, stylesheet, script,
business rule or workflow of the production RISE app was changed. These files live on the
`design/rise-exploration` branch and are not deployed.

## Round 2 (5 Oct 2026): mobile-first directions
Feedback on round 1: too dense for a phone, and the brand did not stand out. `round-2/` holds three new
options designed at 390 × 844 first and scaled to desktop from the same responsive pages:
- **D · Beacon:** dark logo ink as the ground, with a full-screen entrance where the logo assembles.
- **E · Full Stop:** warm paper and BW Gradual throughout. The orange full stop is the only accent, and the statement builds in place on Home.
- **F · Rise:** the logo becomes the interface. The pillar is the header or rail, the bars become colour tiles, the 45° cut is on every tile, and the screen rises into the logo.

Each option now covers the same eight key screens (Home, Search, Area, Document, Upload step 3, QMS
workspace concept, Ask an Expert, Field Glossary) on phone (390 × 844) and desktop (1440 × 900) from one
responsive file per screen, checked against the live app's capabilities. Open `round-2/index.html` for
the review page (brand-moment filmstrips, all screens per option, a screen-by-screen comparison,
side-by-side table, status and open questions). Each option folder has its live HTML screens and `notes.md`.
`round-2/shots/` holds the screenshots. Waiting on the owner's choice; nothing is implemented.

## Round 1: what is here
- `index.html`: the review page. It covers the current product, what happened to the animated landing
  page, the shared RISE visual system, the three directions, a side-by-side comparison and the
  recommendation. Open it in a browser straight from disk.
- `directions/a`, `b` and `c` hold the three directions as static HTML mockups. Each has Home, Browse,
  the document viewer, Upload, a QMS workspace concept, a system sheet, two phone screens and `notes.md`:
  - **A · Instrument:** an app shell that is dense and precise, built for document-control work.
  - **B · Flagship:** a confident brand look with deep ink bands and WHAT WE KNOW. set large.
  - **C · Atlas:** a reference library where documents are sheets with codes and lineage.
- `img/` holds screenshots: `current/` is today's product, `thumb/` and `full/` are each direction's screens.
- `kit/` holds the fonts, logo files and one photo the mockups use, copied from the app.
- `brief.md` is the design brief and shared system. `content.md` is the real register content every
  mockup uses.

## Status
- Prepared on 4 Oct 2026 from `main` at d501f50 (after PR 2A-3).
- Recommendation: **C · Atlas** as the foundation, with **A · Instrument**'s compact split-view patterns
  for the QMS, Director, Maintenance Manager and audit workspaces.
- Waiting on the owner's choice of direction. No implementation starts until a direction is approved and
  an implementation plan is agreed.
