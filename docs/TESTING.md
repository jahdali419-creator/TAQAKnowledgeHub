# Testing the TAQA Knowledge Hub frontend

This is a static HTML/CSS/JS site with no build step and no runtime
dependencies. Playwright and a small static file server are the only
dev-time tools, and they exist solely to test the app; nothing here changes
how the site itself runs in production.

## From a fresh checkout (verified 1 Oct 2026)

Requirements: Git, Node.js 18 or later (verified on Node 22, npm 10), internet
access to the npm registry and Playwright's browser download. Nothing else:
no global packages, no environment variables, no files outside the repository.

```
git clone <repository-url> techhub && cd techhub
npm ci                                   # exact versions from package-lock.json
npx playwright install --with-deps chromium   # browser + OS libraries (Linux needs sudo for --with-deps)
npm run serve                            # http://127.0.0.1:4173 , any static server works
npx playwright test --project=chromium --project=mobile-chrome
```

- **Configure:** nothing is needed to run the prototype. Per-environment
  values for the Azure build are described in
  `docs/AZURE-INTEGRATION-REQUIREMENTS.md` §2 (template:
  `config/techhub.config.example.js`).
- **Build:** there is no build step. The deployable artefact is the static
  files themselves: the `.html` pages, `*.js`, `*.css`, `manifest.json`,
  `service-worker.js`, `staticwebapp.config.json`, `offline.html`, `fonts/`,
  `icons/` and the hero images. `docs/`, `tests/`, `config/*.example.js` and the
  npm/Playwright files are not part of the app.
- The Playwright config uses a pre-installed Chromium at
  `/opt/pw-browsers/chromium` **only if that path exists** (it does in the
  cloud environment this was built in), otherwise Playwright's own download.
  Override with `PLAYWRIGHT_CHROMIUM_PATH`. Port: `TAQA_TEST_PORT` (default 4173).
- **Port 4173 must be free (or serving this checkout).** Locally Playwright
  reuses any server already listening on the test port
  (`reuseExistingServer`), so a server left running from another copy of the
  repository makes tests run against the wrong files (seen during the handover
  audit as service-worker cache tests failing against an older build). Stop
  other servers or set `TAQA_TEST_PORT`.
- On a small machine use `--workers=2`: the full two-project run is 906 tests
  and takes about 18 minutes.

## Quick start

```
npm ci
npx playwright install chromium   # first time only, downloads browser binaries
npm test
```

`npm test` starts a local static server, runs the full suite on the two
supported projects (`chromium` desktop and `mobile-chrome`), and shuts the
server down again. `npm run test:all-engines` adds Firefox, WebKit and
mobile-safari (see Engines below). CI runs Chromium only
(`.github/workflows/tests.yml`).

## Engines

| Project | Status (1 Oct 2026) |
|---|---|
| `chromium`, `mobile-chrome` | Full suite green; CI runs `chromium` |
| `firefox`, `webkit`, `mobile-safari` | The **app** passes both workflows when driven directly in Firefox and WebKit. The **test suite** fails in setup on these engines: its fixtures touch `localStorage` and navigate in a way only Chromium tolerates ("navigation interrupted", "The operation is insecure"). Make `tests/helpers/fixtures.js` cross-engine before adding these projects to CI. |

## Other useful commands

```
npm run test:ui          # Playwright's interactive UI mode, for debugging
npm run test:chromium    # Chromium desktop only (what CI runs)
npm run test:firefox     # requires `npx playwright install firefox`
npm run test:webkit      # requires `npx playwright install webkit`
npm run test:mobile      # Pixel 7 + iPhone 14 device emulation profiles (iPhone needs WebKit installed)
npm run test:report      # reopen the last HTML report
npm run serve            # just run the static server, e.g. to poke around by hand
```

To run one file or one test by name:

```
npx playwright test tests/dashboard.spec.js
npx playwright test -g "reject requires a reason"
```

## Roles under test

There are **five** personas in `roles.js` (`TAQA_ROLE_ORDER`): Employee,
Segment Director (`owner`), Maintenance Manager (`maintenance`), QMS /
Document Controller (`qms`) and External Auditor (`auditor`).
`roles.spec.js` pins each one's exact capabilities, including `submit` and
`department`. A test that loops over roles should include `maintenance`
wherever the rule it checks applies to it. Reports written for four roles
(`docs/QA/QA-RELEASE-REPORT.md`, `docs/QA/RELEASE-QA-E2E.md`) are marked stale;
the current evidence is `docs/QA/FIVE-ROLE-QA-AUDIT.md`.

## What's covered

Each file under `tests/` maps to one page or one cross-cutting concern:

| File | Covers |
|---|---|
| `smoke.spec.js` | every page loads with no thrown JS error, has a real `<title>` |
| `navigation.spec.js` | the shared topbar: areas dropdown, role/area switcher, bookmarks, dark mode, mobile menu, popover behavior |
| `home.spec.js` | index.html: hero/search, the three ways in, real counts, the TechHub header name |
| `segment.spec.js` | segment.html: per-area document library, tabs, counts, amber pre-warning |
| `viewer.spec.js` | viewer.html: document metadata, statuses, version history, QR, print, breadcrumb |
| `documents.spec.js` | documents.html: published-documents table, sorting, withdraw, XSS escaping |
| `master-list.spec.js` | master-list.html: the QMS/auditor register, bulk actions, filters, charts |
| `search.spec.js` | ai-search.html: keyword search, filters, safety disclaimer |
| `dashboard.spec.js` | dashboard.html: the approval desk UI, toasts, contributors |
| `approval-workflow.spec.js` | the real two-step QMS-then-approver release flow, end to end |
| `release-journey.spec.js` | one Operations document through Employee, QMS, Director and Auditor by UI; register write refusals; two tabs; phone layout |
| `maintenance.spec.js` | the Operations / Maintenance switch, shelves, maintenance approval rule at the store, bulletins, maintenance software, the upload box |
| `maintenance-manager.spec.js` | the Maintenance Manager through the pages: page access, the maintenance journey through the desks, returning a document, delegation, wording |
| `maintenance-ask-expert.spec.js` | Ask Expert routing to Operations or Maintenance; no Maintenance page or Continue Reading |
| `forms.spec.js` | the Forms & Checklists shelf and the TAQA form template |
| `numbering.spec.js` | TQ-QHSE-S001 5.3 numbering from upload |
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
