# RISE · Round 8 · Home (for review)

Design exploration only, on `design/rise-exploration`. Nothing implemented.

- `home.html` + `home.css`: RISE Home at 1440 × 900, built by `build.py` from the live register (`documents-master.js`).
  Live figures: 519 in force (the earlier 520 came from the 5 Oct content snapshot), 25 areas, 177 procedures,
  112 manuals / work instructions, 115 standards, 33 technical alerts, 66 lessons; no maintenance bulletins issued.
- `index.html`: review page (Design DNA, inspiration translation, signature element, responsive strategy, check).
- Compositions considered and rejected: a centred command bar (generic), an app shell with spaces sidebar and an
  assistant panel (another sidebar; misrepresents deterministic search). Chosen: asymmetric 8/4 editorial index.
- New kit font: IBM Plex Mono 400/500/600 (SIL OFL 1.1) in `../kit/fonts/`, declared in `../kit/fonts.css` as 'PlexMono'.
- `phone.html` (built by `build-phone.py`): the direction, named **Register**, on a phone (390 × 844): six screens from `home.html`'s phone layout. `home.js` switches the register tabs and opens the phone sheets (#alerts, #search, #menu).
