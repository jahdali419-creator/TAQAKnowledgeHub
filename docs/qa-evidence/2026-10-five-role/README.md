# Five-role audit evidence, 1 October 2026

Supports `docs/QA/FIVE-ROLE-QA-AUDIT.md`.

| Folder | What it holds |
|---|---|
| `results-baseline-1de6bbe/` | Raw results on the code as it was before this audit: `journeys-desktop.json`, `journeys-phone.json` (the Operations and Maintenance journeys), `edges.json` (edge cases) and `tour-desktop.json` / `tour-phone.json` (every page and action, per role). |
| `results-fixed-e2e044b/` | The journeys and edge cases re-run on the fixed code. The tour was not re-run: none of the fixes changes a permission. |
| `screens/` | `desktop-*` and `phone-*`: journey stages (`o*` Operations, `m*` Maintenance). `tour-*`: each role's home page and, on a phone, its ☰ menu. `edge-d5-*`: the delegate banner before (covering the top bar) and after the fix. |
| `scripts/` | The Playwright scripts that produced them. They drive the UI and only read `TAQA_STORE`, except steps marked "console", which deliberately try to break a rule. |

To re-run: serve the repository on port 8940 (`npx http-server -p 8940 -c-1 .`), then from `scripts/`, with `NODE_PATH` pointing at the repository's `node_modules`:

```
node journeys.js desktop
node journeys.js phone
node edges.js
node tour.js desktop
node tour.js phone
python3 matrix.py desktop phone   # compares a tour against the rules
```

The scripts expect Chromium at `/opt/pw-browsers/chromium`.
