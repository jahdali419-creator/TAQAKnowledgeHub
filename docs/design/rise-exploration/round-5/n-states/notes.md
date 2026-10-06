# N + TAQA + States — the design-taste skill applied to N + TAQA

Demonstration only. Built from `../n-taqa/` by `build.py`; `../n-taqa/` and `../n/` are untouched. Overview page:
`../taqa-states.html`. No winner is declared.

## Dials for RISE
Layout variance 4 (skill default 8) · motion 3 (6) · density 6 (4).

## Pages
- `home.html` — desktop Home as an uneven 12-column tile grid: ALT-002 safety tile (7 cols, 2 rows), Continue
  reading in TAQA teal, figures, changes timeline, Saved, Tools, Elsewhere + register. Phone keeps N's column.
- `search.html` — skeleton rows for 0.7 s, then results reveal (40 ms stagger, once).
- `search-loading.html` — the loading state, frozen.
- `document.html` — WI-003 with a working Save toggle and a confirmation toast.
- `document-restricted.html` — SOP-010 (Current, Restricted): record open, file locked, request through QMS.
- `document-offline.html` — WI-003 pinned copy offline ("Pin offline" is a live-app action): "Current when
  last checked", ALT-002 warning kept, connection-only items greyed with a reason. "05:40" is an example time.
- `saved-empty.html` — empty Saved state that teaches how to save, with Recently opened below.

## Motion (states.css, motion.js)
Transform and opacity only; easing cubic-bezier(.16,1,.3,1), 0.28 s. Press: scale .97–.985, row tint.
Everything is off under `prefers-reduced-motion`; every page is complete without JavaScript.
Recording: `../shots/nst-motion-phone.webm`.

## Not taken from the skill
Geist/Satoshi fonts (TAQA brand fonts win), perpetual/magnetic/particle/glass/tilt effects, the React +
Tailwind + Framer stack (static mockups), and the skill's default dials.
