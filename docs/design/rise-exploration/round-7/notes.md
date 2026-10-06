# RISE · Round 7 · one direction (awaiting approval)

Design exploration only, on `design/rise-exploration`. Nothing implemented; authorisation and document rules unchanged.

- Review page: `index.html` (built by `build-review.py`).
- Screens at 1440 × 900: `rise/home.html`, `rise/search.html`, `rise/area.html`, `rise/document.html`;
  `rise/nav-qms.html` shows the same Home with the QMS-role sidebar. Built by `rise/build.py`, styles `rise/rise.css`.
- Data: the Well Intervention area is computed from `documents-master.js` (in force = Current + Review due,
  translations counted separately). Well Intervention is a proposed grouping and is labelled so. The register
  defines Maintenance Bulletins (provisional code MB) but holds none, so the shelf shows an honest empty state.
- Other content: `round-3/content.md` and the Home additions in `round-4/brief.md`.

Next steps (Upload, QMS Workspace, phone layouts, implementation) wait for approval.
