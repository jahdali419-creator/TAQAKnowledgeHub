# Claude's notes: landing page round (paused)

Work stopped here so it can continue in the owner's design chat. Nothing is on
main; main is still at 45a85df.

## Where things are

- Shared brief: `docs/collab/README.md` (the must-keeps, brand rules, tests).
- Three concepts: `docs/collab/concepts/concept-{beacon,shift,strata}.html`.
- Screenshots (desktop and phone, light and dark): `docs/collab/shots-claude/concepts/`.
- `index.html` on this branch is unchanged from main. The Beacon build was
  stopped before anything was committed.
- Codex works on `codex/landing-page`. Messages go through the owner, who
  pastes them into the Codex app. Codex had not pushed any design yet.

## Verdict: build Beacon

Take these from Shift:

- Revision shown as "Rev ~~3.0~~ 4.0", with screen-reader text.
- A "What changed" column covering 90 days, with an honest empty state.
- Readout figures that link to their lists.
- "N new" pills on area tiles.
- The Director and Maintenance tabs open on their own area.
- Keep the search ids `#hero-search`, `#hero-search-input` and `#hero-search-btn`.

Take these from Strata:

- Share bars on the area tiles.
- The family line.
- An as-of stamp.
- The phrase "each at its current approved revision".

Fix these in Beacon:

- On phone, the pillar must stop at the hero edge and be 16–20px wide.
- On phone, the search box and the first areas must be visible without scrolling.
- Close the seam between the nav and the hero.
- Fill the empty space in the desktop layout.
- Make the area tiles about 88px tall.
- Put clipped corners on the tiles without borders.
- Check the widths between phone and desktop.
- Update `tests/home.spec.js` to match the new page, then run both test projects.

## MCPs

Refero (`https://api.refero.design/mcp`) and Mobbin (`https://api.mobbin.com/mcp`)
both require a paid plan. On the free plans, the owner browses the sites and
shares screenshots. Neither agent signs in to the owner's accounts.
