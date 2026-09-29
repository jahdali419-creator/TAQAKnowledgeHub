# Testing the TAQA Knowledge Hub frontend

This is a static HTML/CSS/JS site with no build step and no runtime
dependencies. Playwright and a small static file server are the only
dev-time tools, and they exist solely to test the app; nothing here changes
how the site itself runs in production.

## Quick start

```
npm install
npx playwright install        # first time only, downloads browser binaries
npm test
```

`npm test` starts a local static server, runs the full suite against it on
Chromium, and shuts the server down again. That's the whole loop.

## Other useful commands

```
npm run test:ui          # Playwright's interactive UI mode, for debugging
npm run test:chromium    # Chromium only (same as `npm test`)
npm run test:firefox     # requires `npx playwright install firefox`
npm run test:webkit      # requires `npx playwright install webkit`
npm run test:mobile      # Pixel 7 + iPhone 14 device emulation profiles
npm run test:report      # reopen the last HTML report
npm run serve            # just run the static server, e.g. to poke around by hand
```

To run one file or one test by name:

```
npx playwright test tests/dashboard.spec.js
npx playwright test -g "reject requires a reason"
```

## What's covered

Each file under `tests/` maps to one page or one cross-cutting concern:

| File | Covers |
|---|---|
| `smoke.spec.js` | every page loads with no thrown JS error, has a real `<title>` |
| `navigation.spec.js` | the shared topbar: areas dropdown, role/area switcher, bookmarks, dark mode, mobile menu, popover behavior |
| `home.spec.js` | index.html: hero/search, area cards, recently-visited, real counts |
| `segment.spec.js` | segment.html: per-area document library, tabs, counts, amber pre-warning |
| `viewer.spec.js` | viewer.html: document metadata, statuses, version history, QR, print, breadcrumb |
| `documents.spec.js` | documents.html: published-documents table, sorting, withdraw, XSS escaping |
| `master-list.spec.js` | master-list.html: the QMS/auditor register, bulk actions, filters, charts |
| `search.spec.js` | ai-search.html: keyword search, filters, safety disclaimer |
| `dashboard.spec.js` | dashboard.html: the approval desk UI, toasts, contributors |
| `approval-workflow.spec.js` | the real two-step QMS-then-approver release flow, end to end |
| `roles.spec.js` | the role/permission matrix and delegation logic, independent of any page |
| `upload.spec.js` | upload.html: the submission wizard, file-type/size security checks |
| `support-ticket.spec.js` | support-ticket.html: form validation, photo annotation, ticket refs |
| `glossary.spec.js` | glossary.html: term search, submission, persistence, escaping |
| `analytics.spec.js` | analytics.html: local usage stats, trend charts, no-overclaim wording |
| `bookmarks.spec.js` | the shared bookmarks feature across pages, per-device isolation |
| `offline.spec.js` | manifest, service worker registration/caching, offline fallback |
| `mobile.spec.js` | layout at 375/390/430px, mobile nav, touch target sizes |
| `accessibility.spec.js` | skip links, landmarks, keyboard nav, ARIA on custom controls |
| `security-regression.spec.js` | secrets scan, CSP policy pinned, external-link safety, role-disclaimer intact |

Shared helpers live in `tests/helpers/`:

- `fixtures.js` exposes `gotoApp`, `setRole`, `clearAppState`, `consoleErrors`. Use
  `gotoApp` for every navigation instead of raw `page.goto`; it works around
  an environment-specific navigation quirk documented at the top of the file.
- `baseline.js` exposes `computeBaseline()`, which derives real counts
  (documents by status/area/type) from `documents-master.js`/`segments-data.js`
  at test time, so assertions never hardcode a number that could drift from
  the actual register.
- `areaGroups.js` is a similar helper exposing which navigation group
  (segment/function/product/company/pending) each area belongs to.

## Conventions for new tests

- Test real, current behavior. Read the page's own code before asserting
  anything; don't assume a "typical" feature exists here.
- Never hardcode a count that the register itself defines; derive it via
  `computeBaseline()` or by querying the same store/lookup the app uses.
- If you find a bug, fix it (if it's scoped to one page) and add a
  regression test proving the fix, or document it with a `// KNOWN BUG:`
  comment and a `test.fail()` (or `test.skip()` for a genuine environment
  limitation, not an app bug) rather than deleting or weakening the
  assertion. A `test.fail()` flips to an unexpected pass the day the bug is
  actually fixed, which is the cue to promote it to a normal assertion.
- Client-side role checks in this app are a specification, not a security
  control (see roles.js's own header comment); don't describe tests
  against them as "security tests."

## CI

`.github/workflows/tests.yml` runs the Chromium suite on every push and
pull request. It does not yet block the two deploy workflows
(`pages.yml`, the Azure Static Web Apps workflow) on a green run; that
needs a branch-protection rule on the repository's default branch
(Settings -> Branches -> require this workflow's status check), which only
a repository admin can add from GitHub's own UI or API.

## Known environment quirks (not app bugs)

A couple of sandbox-specific behaviors are documented in code comments
where they matter, rather than worked around silently:

- `page.goto()` can occasionally hang in some CI/sandboxed environments even
  though the page has fully and correctly loaded. `gotoApp` in
  `fixtures.js` races the navigation against a `readyState` poll to cover
  this; it should behave exactly like plain `page.goto()` on a normal
  developer machine.
- `browserContext.setOffline(true)` does not reliably reach a service
  worker's own in-flight `fetch()` in every sandbox, which affects one
  specific offline-fallback scenario in `offline.spec.js`. That test
  detects the exact failure signature this causes and skips with a clear
  reason rather than failing red or silently dropping the coverage.
