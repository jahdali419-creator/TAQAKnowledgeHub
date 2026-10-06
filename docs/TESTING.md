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

| Project | Status (5 Oct 2026, PR 2D) |
|---|---|
| `chromium`, `mobile-chrome` | Full suite green (`npm test`); CI runs the full `chromium` suite |
| `webkit`, `mobile-safari` | The fixtures now work on WebKit: a refused page (TAQA_ROLE.refuse) is detected by its marker, since WebKit leaves it at readyState "loading", and the phone install suggestion is held back unless a test opts in (`test.use({ installPrompt: true })`). CI runs a WebKit / iPhone-engine **smoke gate** (below). Known WebKit-only failures that also fail on main before PR 2D are listed under "WebKit: known failures". |
| `firefox` | Not run in CI. |

### WebKit: known failures (pre-existing, not in the smoke gate)

Each fails the same way on main before PR 2D (checked on a worktree of 41b982e with the same harness):

| Test | Engine | Why |
|---|---|---|
| `support-ticket.spec.js` "Undo removes the last mark, Clear removes all marks" | webkit, mobile-safari | Canvas pixel comparison differs in WebKit's encoder |
| `doc-identity.spec.js:118` two tabs, same number | webkit, mobile-safari | Two-tab timing in WebKit |
| `doc-identity.spec.js:87` typed number in use | mobile-safari | Upload step button timing on the iPhone engine |
| `maintenance-ask-expert.spec.js:58` draft restores the department | webkit, mobile-safari | The department radio is not re-checked from the draft in WebKit |
| `maintenance-manager.spec.js:492` approver named in the confirmation | webkit, mobile-safari | Upload submit click timing |
| `offline.spec.js:277, :303` | webkit, mobile-safari | "WebKit encountered an internal error" navigating offline under the service worker (Playwright WebKit) |

Under heavy local load (6 workers) more WebKit tests time out; all of those pass at normal concurrency (environment, not product).

## What's covered

Each file under `tests/` maps to one page or one cross-cutting concern:

| File | Covers |
|---|---|
| `smoke.spec.js` | every page loads with no thrown JS error, has a real `<title>` |
| `navigation.spec.js` | the shared topbar: areas dropdown, role/area switcher, bookmarks, dark mode, mobile menu, popover behavior |
| `home.spec.js` | index.html: hero/search, the three ways in, real counts, the RISE logo in the bar |
| `brand.spec.js` | RISE branding: the logo in the bar on eight key pages, light and dark, desktop and phone (full-colour logo on light bars, reverse logo on dark bars and the hero with no plate, switching on scroll; loads, undistorted, clear of the controls); favicon, Apple touch, manifest icons and names |
| `segment.spec.js` | segment.html: per-area document library, tabs, counts, amber pre-warning (on a pinned page clock, never today's date) |
| `viewer.spec.js` | viewer.html: document metadata, statuses, version history, QR, print, breadcrumb |
| `documents.spec.js` | documents.html: published-documents table, sorting, withdraw, XSS escaping |
| `master-list.spec.js` | master-list.html: the QMS/auditor register, bulk actions, filters, charts |
| `search.spec.js` | ai-search.html: keyword search, filters, safety disclaimer |
| `dashboard.spec.js` | dashboard.html: the approval desk UI, toasts, contributors |
| `approval-workflow.spec.js` | the real two-step QMS-then-approver release flow, end to end |
| `phone-reliability.spec.js` | PR 2D: one connectivity bar under the top bar, honest "offline" / "cannot be reached" and "last synced" (PI-26, PI-48); every register change refused offline with nothing written and nothing typed lost, in Upload, the Workbench and the withdraw dialog (PI-28); a deploy (bumped cache) mid-Upload and mid-rejection on a private copy of the site with the service worker on: nothing reloads, the update waits, warns, and applies only on a safe page or by choice (PI-30); the pager on a phone (PI-51); the install sheet on idle Home only; Back restore (PI-18) |
| `integrity-closeout.spec.js` | Integrity close-out (BD-01 to BD-07): "Open your queue" reaches the Segment Director's and Maintenance Manager's own desk from another area's page, QMS the company queue, an Employee no bell (PI-17); the document page, share link, QR and bookmark take the record's own area, nothing guessed (PI-23); exact number / legacy ID of a withdrawn document shows it marked "Do not use", permission-trimmed (PI-22); an Employee sees no restricted or confidential title or count on Home, area pages, search, bookmarks, the desk, Upload and the document page, where a restricted number reads exactly like an unknown one (PI-27). Counts come from `tests/helpers/baseline.js` per role, read from `roles.js` |
| `installed-app.spec.js` | the installed iPhone app, simulated (status bar upright; notch, side insets and home indicator on its side): the bell on every page, and every overlay (record drawer, Workbench, segment panel, phone menu, bookmarks, search filters, glossary drawer, viewer menus) usable and closable (PI-08, PI-61, PI-52, TB-04) |
| `delegation-integrity.spec.js` | PR 2C-2: actor identities and conservative separation of duties (NEW-04); approval and Manage documents as separate permissions in all four combinations, scope on every delegated action, calendar-date validity in UTC+3, revocation evidence and stale tabs (PI-32); grant evidence and validation, legacy grants (PI-54); PI-31 direct and delegated for the Director and the Maintenance Manager |
| `record-truth.spec.js` | PR 2C-1: withdrawal record and reason (PI-11), bulk withdrawal on exact records with stale refusal (PI-10), approval and effective dates including a future effective date on a pinned clock (PI-21), returned attempts and filing again (PI-24), duplicate warnings with reasons (PI-13), number validation for new filings (PI-14) |
| `decision-integrity.spec.js` | PR 2B: stale desk, Workbench and bulk decisions refused with nothing written (NEW-01); withdrawal cancels the open revision and its translations' (NEW-02); a returned revision filed again is the same revision, next attempt (NEW-03); held / rapid Enter and double-click in the Workbench (PI-07); Upload Enter before the review step (PI-06); the approver's card, Preview and final confirmation (PI-12); per-revision bell memory and its migration (NEW-05) |
| `release-journey.spec.js` | one Operations document through Employee, QMS, Director and Auditor by UI; register write refusals; two tabs; phone layout |
| `maintenance.spec.js` | the Operations / Maintenance switch, shelves, maintenance approval rule at the store, bulletins, maintenance software, the upload box |
| `maintenance-manager.spec.js` | the Maintenance Manager through the pages: page access, the maintenance journey through the desks, returning a document, delegation, wording |
| `maintenance-ask-expert.spec.js` | Ask Expert routing to Operations or Maintenance; no Maintenance page or Continue Reading |
| `forms.spec.js` | the Forms & Checklists shelf and the TAQA form template |
| `numbering.spec.js` | TQ-QHSE-S001 5.3 numbering from upload |
| `roles.spec.js` | the role/permission matrix and delegation logic, independent of any page |
| `upload.spec.js` | upload.html: the submission wizard, file-type/size security checks |
| `support-ticket.spec.js` | support-ticket.html: form validation, photo annotation; "not sent" with no ticket number, the text kept and copyable; Critical shows the emergency wording |
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
- Never depend on today's date. A test about review dates pins the page's
  clock (`page.clock.setFixedTime`), either relative to a register row's own
  date or to a fixed instant with seeded rows, and tests the window's edges
  (TB-13: the due-soon tests used to rely on a real row's date still being
  under 30 days away, and would have failed from 17 Oct 2026).
- Drive a workflow with the people who would really act: an employee files,
  QMS checks, the Director or Maintenance Manager approves. Since PR 2A-3 a
  filer cannot check or approve their own filing, so a test that files as
  QMS and then checks will (correctly) be refused.

## CI

`.github/workflows/tests.yml` runs two jobs in parallel on every push and
pull request:

- `playwright`: the full Chromium suite (unchanged).
- `webkit-smoke` (PR 2D, TB-05): the iPhone engine (`mobile-safari`) and
  desktop WebKit on the specs that are stable there: `smoke`, `navigation`
  (iPhone engine only), `installed-app`, `phone-reliability`,
  `release-journey`, `master-list`, `dashboard`. 306 of 306 passed locally
  at CI concurrency; locally it took 12.5 minutes on 2 workers, and the job
  runs 4 workers, so expect roughly 7 to 10 minutes plus about 2 minutes to
  install WebKit, alongside the Chromium job rather than after it. A spec
  joins this gate only once it is green on WebKit; real iPhone checks stay
  manual (below).

The Chromium gate is unchanged. It does not yet block the two deploy workflows
(`pages.yml`, the Azure Static Web Apps workflow) on a green run; that
needs a branch-protection rule on the repository's default branch
(Settings -> Branches -> require this workflow's status check), which only
a repository admin can add from GitHub's own UI or API.

## Register integrity check

`node scripts/check-register.js` checks the register (`documents-master.js`) against the document-control rules and exits non-zero on any finding that is not a known legacy issue in `scripts/register-baseline.json`. `--report` regenerates `docs/QA/REGISTER-CLEANUP-REPORT.md`, the list QMS works from. `tests/register-integrity.spec.js` runs the same gate in CI. Never add a baseline entry to make a new finding pass; remove one once QMS has corrected the record.

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

## Real iPhone checks (cannot be automated here)

Playwright drives Chromium and a desktop WebKit build. It cannot run an installed iPhone app, Safari's own back-forward cache, the real notch and home indicator, or a real network dropping. `installed-app.spec.js` simulates the status bar and the landscape insets; `phone-reliability.spec.js` drives the service worker in Chromium. These must be checked by hand on a real iPhone before production (the PR 2D report lists the steps):

- Installed app (Add to Home Screen), upright and on its side: the Master List record drawer and Workbench close from the × and from the bottom Close; the segment document panel's × works; the phone menu scrolls to its last area; nothing sits under the notch or the home indicator.
- Back from a document to a segment page, and from Master List to Home: the page is visible and takes taps.
- Airplane mode while reading: one bar under the top bar; a document already opened still reads; Upload, approve, reject and withdraw say "Not sent" and keep what was typed; back online, the same action goes through.
- A captive or dead Wi-Fi (connected but no internet): the bar says "RISE cannot be reached" within a few seconds of opening a page.
- A deploy while Upload is at step 3: no reload; "New version available" appears; "Update now" warns; "Keep working" keeps the form.
- Ask Expert: "Not sent" wording, nothing cleared, "Copy question" pastes into Mail or Teams; Critical shows the emergency wording.
