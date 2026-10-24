# RISE landing page: Claude × Codex design round

**Owner:** Mohammed (Product Owner, RISE). **Agents:** Claude (Claude Code) and Codex.
Mohammed talks to Claude; Claude passes his messages to Codex through this folder and as
paste-ready text. Mohammed compares both landing pages and decides which one is confirmed.

## The task

Each agent designs and builds its own **new landing page for RISE** (the Home page,
`index.html`), independently, on its own branch:

| Agent | Branch (from `main`) |
|---|---|
| Claude | `claude/landing-page` |
| Codex | `codex/landing-page` |

- **Never touch `main`.** No merge, no pull request into `main`, no change to GitHub settings.
  Push your own branch only. (A pull request would also try to deploy an Azure preview.)
- **Do not copy the other agent's design.** You may read the other branch's
  `docs/collab/` notes; the point is two genuinely different proposals.
- Owner's instruction: **surprise him**. Be ambitious, but it must work as the real Home page
  of a document-control hub used by oilfield staff on phones and desktops.

## What RISE is (read before designing)

RISE is TAQA's knowledge hub prototype: one place to find the current, approved version of a
controlled document (SOPs, standards, manuals, alerts, lessons learned, forms) across 25 areas
(11 operational segments, 10 corporate functions, 3 product centres, company-wide).
Static HTML/CSS/vanilla JS, no framework, no build step. The register is `documents-master.js`
(585 records); people and approvals are simulated by role (Employee, Segment Director,
Maintenance Manager, QMS, External Auditor) via the role control in the top bar.

## Must keep (the Home page's job)

1. **Search** that opens `ai-search.html?q=<query>` (empty query opens it with no `?q=`; Enter submits).
2. **Browse by area**: every segment / function / product area links to `segment.html?id=<id>`;
   Company Wide policies reachable. Names and counts come from `TAQA_DOC_LOOKUPS` / `TAQA_STORE`,
   never typed by hand.
3. **Ask Expert** (`support-ticket.html`) and **Field Glossary** (`glossary.html`) reachable.
4. **The role desk**: for QMS, Director, Maintenance Manager and Auditor, the existing desk line
   (`#desk`) that tells them what is waiting for them; hidden for Employee.
5. **True figures only**: any number on the page is computed from the register at runtime.
6. **The shared top bar** (`<nav id="navbar">` markup, `topbar.css`, `shared.js`), the CSP
   `<meta>` (copy it exactly from `index.html`), the script order
   (`documents-master.js`, `roles.js`, `store.js`, `segments-data.js`, then `shared.js`),
   the first-visit tour gate and the service-worker registration.

## Brand and platform rules

- TAQA teal `#005D63` (ink) and `#00BBB6` (light teal); TAQA orange (`#FF6720` / `#FD691D`)
  only as a small accent, **never as text colour** (a test fails on it).
- Fonts are local only (`fonts/fonts.css`): BW Gradual (display), Inter (text), Urbanist.
  **No external fonts, scripts, images or CDNs**: the CSP blocks them.
- Light and dark theme (`html[data-taqa-theme="dark"]`), phone first (390 × 844 and 360 wide,
  no sideways scroll), desktop 1440 × 900. Respect `prefers-reduced-motion`.
- No real person's name anywhere. Example people, if any, are job titles and clearly marked.
- Accessible: one `h1`, real buttons and links, visible focus, AA contrast.

## Design references (Mobbin and Refero)

- Both have **MCP servers, but only on paid plans** (Mobbin Pro or higher; Refero Pro).
  Mohammed is on the **free plans**, so the MCPs are not connected. Do not use his accounts.
- Use them as he can on free: he may browse and send screens or links. You may also use your own
  web search if it is enabled.
- If he upgrades later (Codex):
  `codex mcp add mobbin --url https://api.mobbin.com/mcp` then `codex mcp login mobbin`;
  `codex mcp add refero --url https://api.refero.design/mcp` then `codex mcp login refero`
  (check `codex mcp --help` for the exact flags of your version).
  For Claude Code he adds them at claude.ai/customize/connectors and starts a new session.

## Checks before you push

```
npm ci
npm run serve                      # http://127.0.0.1:4173
npx playwright test tests/home.spec.js tests/navigation.spec.js tests/brand.spec.js \
  tests/mobile.spec.js tests/accessibility.spec.js --project=chromium --project=mobile-chrome
```

- `tests/home.spec.js` pins today's Home (three "ways in" cards, the stats strip, the
  Platform Overview panel). If your design changes one of these on purpose, update that test to
  the new truth (figures still read from the register, never hard-coded) and explain it in your
  notes. Never weaken a data-truth, safety or accessibility check to get green.
- No console errors for any of the five roles.

## Hand-in

On your branch, write `docs/collab/<agent>-notes.md`:
1. the idea in two sentences;
2. what you took from references (with links), what you rejected and why;
3. screenshots: phone and desktop, light and dark (put them in `docs/collab/shots-<agent>/`);
4. what changed in tests and why;
5. open questions for Mohammed.

## Messages

- `docs/collab/to-codex.md` (on `codex/landing-page`): Mohammed's messages to Codex, relayed by
  Claude, newest at the bottom. **Codex: `git pull` and read it at the start of each session.**
- `docs/collab/from-codex.md` (on `codex/landing-page`): Codex's replies and questions, which
  Claude reads and answers or passes to Mohammed.
