# 09 Test evidence

These are the measured numbers, as recorded, without rounding up. Every figure is from the **prototype in a browser**. **None of it is evidence of production behaviour** (02).

## What the tests are

- **Playwright end-to-end suites** (`tests/*.spec.js`, 40 files). They drive real pages in real browser engines.
- **Written as attempts at the forbidden outcome.** For example: approve your own filing; reuse a number; open a restricted document as an Employee; send while offline. Each test checks that the outcome is refused.
- **Old-main proof.** Each integrity fix was run against the previous `main`, to show its tests fail there and pass after the fix.
- **Register-data checker.** `node scripts/check-register.js` checks the register file against the numbering and revision rules, with a baseline of known legacy findings.

## Latest results (6 October 2026, PR #34, merged to `main` as `a6f4180`, cache `taqa-hub-v108`)

| Run | Result | Notes |
|---|---|---|
| Full `npm test`: Chromium desktop + mobile Chrome, 6 workers | **1390 passed, 10 failed, 4 skipped** | All 10 were timeouts or load effects. Their 7 spec files were re-run at 3 workers: **280 / 280 passed** (class C: load). The 4 skips are environment-guarded: the real back-forward-cache test and the offline-fallback test, each on both projects |
| New `tests/integrity-closeout.spec.js` (PI-17, PI-22, PI-23, PI-27), Chromium | **23 / 23 passed** | |
| Same spec on the previous `main` (`b909fb6`) | **17 of 23 failed**, as expected | The 6 that pass there are controls (baseline numbers, QMS queue, Employee has no bell, desk refusal, partial-number search, restricted search already trimmed) |
| iPhone engine (`mobile-safari`, emulated iPhone 14 on WebKit): CI smoke set + new spec | **176 passed, 5 skipped, 0 failed** | The 5 skips are Chromium-only service-worker tests and the real back-forward-cache test |
| Desktop WebKit: specs touched by PR #34 + new spec | **137 passed, 1 failed** | `home.spec.js:45` also fails intermittently on the previous `main` (class B: pre-existing; not in the CI WebKit set) |
| `node scripts/check-register.js` | 585 records, **302 known findings, 0 new** | |
| CI on PR #34's head (`1eab89b`) | `playwright` **passed** (18.5 min, against a 20-minute job limit); `webkit-smoke` **passed** | An earlier push run of the same commit was cut off by the 20-minute limit with every test so far passing; the job time is close to its limit (IT to note for the pipeline, 14) |
| Post-merge smoke on the merged build (smoke, close-out, release journey, phone reliability; Chromium, mobile Chrome, iPhone engine) | **203 passed, 7 skipped, 0 failed** | Skips: Chromium-only service-worker tests and the real back-forward-cache test |
| Previous phone / PWA release (PR 2D): full WebKit / iPhone-engine run | 1330 passed, 18 failed, 10 skipped | 12 pre-existing on `main` before 2D; 6 passed at normal load (`docs/TESTING.md`, "WebKit: known failures") |

**Failure classes:**
- **A:** new regression.
- **B:** pre-existing on `main`.
- **C:** load or timing only.
- **D:** needs a real device.

**No class A failure is open.**

## CI

- GitHub Actions runs the `playwright` job (the full desktop Chromium suite, including the register check) and the `webkit-smoke` job on every push and pull request. Results for PR #34 and after its merge are recorded on the pull request.
- **CI does not block a merge or a deployment today** (14). The gate exists as a signal, not as a control.

## What the tests do not cover

- Two people on two devices acting at once. Each browser has its own copy of the register.
- Real identity: Entra ID sign-in, MFA, Conditional Access.
- Real storage, files, versions, fingerprints and the audit trail.
- A user with developer tools. The prototype can be bypassed by design (02).
- Microsoft 365 behaviour: SharePoint, Power Automate, search trimming, sensitivity labels.
- Real devices: the real-iPhone checks in 11 are **all open**.
- Firefox: the fixtures are not maintained for it.
- Accessibility beyond the automated smoke checks.
- Performance and load at production scale.
- Backup, restore and migration.

These need the production design and User Acceptance Testing (10, 11).
