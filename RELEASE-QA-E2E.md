# TAQA Knowledge Hub: End-to-End Role Journey, Release QA

Date of testing: 30 September 2026. Code under test: branch `claude/inspiring-mayer-pm1350`, based on `main` at `9ca5e4e`, plus the fixes listed in section 7.

**Method.** I ran the app in a real browser: Chromium through Playwright, with the service worker blocked and one persistent browser profile shared by every role, so one "database" carried the document from role to role. Roles were switched the way a person does it: the role door in the top bar on desktop, the "Viewing as" buttons in the ☰ menu on a phone. Every workflow action (upload, QMS check, Director approval, reject dialog) was done by clicking the page. The register was never written directly to make a step pass. Direct store calls appear in this report only where I was trying to break a rule, the way someone with the browser console open could.

Every PASS below means I did the action and saw the result. Where I could not verify something, it says why.

---

## Results at a glance

### Passed (performed and observed on the final code)
- The full journey with one document, Employee upload → QMS check → Director approval → published → Auditor review, at **1440×900**, **390×844** and **360×800**, each role acting in turn. No JS errors in any run.
- Role permissions for Employee, QMS, Director and Auditor: every screen, including direct addresses, and every write attempted from the console (section 3).
- Edge cases: empty file, `.pdf.exe`, 501 MB file, Director before the QMS check, double-click submit/confirm/approve, approve twice, refresh, back/forward, two tabs, reject without a reason, Director of another area.
- Automated, final code: **758 passed, 0 failed, 2 skipped, 0 flaky, of 760** (chromium 379/0/1, mobile-chrome 379/0/1). Section 6 has the details.

### Failed
- **None open.** Every failure found during this audit was reproduced, fixed, covered by a regression test and re-verified in the browser. Section 7 lists all 24. The one earlier full-suite run with failures (33 on mobile-chrome) is explained in section 6: 31 failures were already on `main`, and 1 was a real phone bug that is now fixed.

### Not tested, because the browser is not installed in this container
- **Firefox, WebKit (Safari) and mobile-safari (iPhone 14).** `npx playwright test --project=firefox --project=webkit --project=mobile-safari` stops at launch: `Executable doesn't exist at /opt/pw-browsers/firefox-1495/…` and `…/webkit-2215/pw_run.sh`. No test in those projects ran.
- Real phones. Phone results come from Chromium device emulation (`isMobile`, touch) at 390, 360 and 412 (Pixel 7).
- Offline fallback for a never-visited page: `offline.spec.js:303` skipped itself in both projects because this sandbox's offline emulation cannot block the service worker's fetch.

### Architectural limitation: needs back-end enforcement
- **Every rule runs in the visitor's browser. There is no server.** The fixes make the page and its register (`store.js`) refuse wrong-role actions wherever they come from inside the app. Someone who edits `localStorage` by hand can still change any record, publish anything and forge any signature. roles.js says so itself: "THIS IS A SPECIFICATION, NOT A SECURITY CONTROL". The Azure API must enforce submit, check, approve, withdraw and edit per role and area, and must take the signer from the signed-in identity. Until then this is a prototype, not a system of record.
- There is no sign-in (roles come from a switcher), records live in one browser, and attachments are not stored. Section 8 has the detail.

---

## 1. Executive result

| Area | Result | Basis |
|---|---|---|
| Functional workflow | **PASS on the final code.** It did not pass at the start: the published document opened as "Document", "Not in the Master Document List", with no trail (B1). | One document per viewport followed through all five stages at 1440, 390 and 360. |
| Permission / security | **PASS within the prototype's limits; not production-grade** (see the limitation above). Found and fixed: QMS could publish without the Director (B2); Employee and Auditor could withdraw or rename live documents (B3); stored XSS through the bell (B4); a stale tab undid another tab's step (B5). | 4 roles × 14 direct addresses; every write attempted as each role. |
| Desktop UX (1440×900) | **PASS; LOW items open.** | Every role's screens reviewed; the misleading copy was fixed. |
| Mobile UX (390×844, 360×800) | **PASS on the final code; LOW items open.** It failed at the start, with 10 layout defects listed in section 5, all fixed. | The whole workflow completed at both sizes; no horizontal page scroll on any screen. |
| Automated regression | **PASS: 758 passed, 0 failed, 2 skipped (environment guard), 760 total.** | Full suite, chromium and mobile-chrome, final code. Firefox/WebKit/mobile-safari not run (browsers not installed). |

**Release recommendation.** Ready to merge and to demo as a front-end prototype. **Not release-ready as a system of record** until the Azure back end enforces the same rules (section 8).

---

## 2. End-to-end role journey

Final desktop run on the final code: title **`E2E-ROLE-TEST-20260930071446`**, number **`TQ-TWS-CTSS-SOP-013`**, Coiled Tubing, SOP, file `e2e-test.pdf` (45 B), fresh browser profile. Phone runs: `E2E-ROLE-TEST-M390-20260930071741` and `E2E-ROLE-TEST-M360-20260930072140`, with the same results at every stage.

| # | Stage and action performed | Expected | Actual (final code) | Result | Evidence | Defects found here |
|---|---|---|---|---|---|---|
| 1 | **Employee.** On Home, clicked **Upload** (in the bar on desktop, in ☰ on a phone). Chose the PDF, picked Coiled Tubing and SOP, gave a title and summary, picked the audience, reviewed, and double-clicked **Submit**. | One draft waiting on QMS; submitter recorded; a clear next step. | 1 record. `status=draft`, `approvalStage=qms`, `submittedBy=Employee`, `submittedAt=2026-09-30T07:14:53Z`. Toast: "Queued as TQ-TWS-CTSS-SOP-013. Next: QMS checks it, then the Director approves it. It is in force only after both." | PASS | `r-01`, `m390-03`, `m390-04` | B6, B7, B8, M3, M5, M6, M8 |
| 2 | **Employee.** Read "Your submissions"; opened the draft; tried every step that is not theirs; opened management pages directly. | Status visible; every other step refused. | "Waiting on QMS check". Viewer shows the real title and "Submitted for approval, not in force yet … waiting on the QMS conformance check", linking to Search. Countersign, approve and reject each returned "You cannot … this document"; publish and withdraw returned `null`; edit returned "You cannot edit this document"; the record is still `draft/qms`. Desk, Master List, Documents and Analytics were all refused. | PASS | `r-02`, `r-03`, `m390-09` | B1, B3, B9, B12 |
| 3 | **QMS.** Switched role. Opened the bell, clicked the first item, and found the same card. | The same record with what was uploaded. | Bell's first item is the document, linking to the desk. The card reads "Submitted by **Employee** · 30 Sept 2026, 07:14 · e2e-test.pdf · 45 B". Heading: "Awaiting Your QMS Check". | PASS | `r-04`, `r-05`, `m390-10`, `m390-11` | B4, B10, B11, B13, M2 |
| 4 | **QMS.** Tried the Director's step. On a phone, opened **Reject**, saw it needs 20 characters, and cancelled. Double-clicked **Confirm**, then refreshed. | QMS cannot approve for the Director; Confirm sends it on. | The Director step was refused before and after Confirm. Result: "Checked. Now with the Director for final approval"; `stage=director`, `countersignedAt=07:15:35Z`. A second Confirm was refused. After refresh the card is gone from the QMS desk. The Master List bulk action is named "Confirm selected (QMS check)". | PASS | `m390-12`, `b-01`, `b-02` | B2, B5 |
| 5 | **Director (Coiled Tubing).** Opened the desk, tried the QMS step, double-clicked **Approve**, pressed Back and Forward, then opened another area's desk and the Master List. | Approve publishes; other steps and areas refused. | QMS step refused. `status=current`, `approvedBy=Segment Director`, `approvedAt=07:15:41Z`. A second approve was refused. No stale card after Back/Forward. Drilling desk and Master List refused. | PASS | `r-06`, `m390-14` | M7 |
| 6 | **Published** (as Employee). Library → document; Search by title; "Your submissions"; bell. | It appears wherever current documents appear. | In the Coiled Tubing library. Viewer: "Current, OK to use", Rev 1.0, issued 30 Sept 2026. Search finds it. "Your submissions": Published. Bell: "Approved and published". | PASS | `r-07`, `r-08`, `m390-16`, `m360-18` | B1, M9 |
| 7 | **Auditor.** Master List by number; opened the document; tried every write; opened upload, the desk and Documents directly. | Everything needed to audit; nothing changeable. | Row: TQ-TWS-CTSS-SOP-013 · 1.0 · 30 Sept 2026 · 30 Sept 2028 · CURRENT · INTERNAL. The trail lists Employee "Submitted for approval 07:14", QMS "QMS conformance check 07:15" and Segment Director "Final approval 07:15". Countersign, approve and reject were refused; add, withdraw and remove returned `null`/`false`; edit was refused; afterwards the record is still "current / E2E-ROLE-TEST-20260930071446". Upload, desk and Documents were refused. | PASS | `r-09`, `r-10`, `r-11`, `m390-19`, `m390-20`, `ml-360` | B6, M10 |

### Negative and edge cases (performed in the browser)

| Case | Observed on the final code | Result |
|---|---|---|
| Empty file (0 bytes) | **Before the fix it was accepted** ("File Added / empty.pdf 0 B") and Continue was enabled. Now: "File is empty / "empty.pdf" is 0 bytes and was not added". Continue stays disabled | PASS (fixed, B14) |
| `report.pdf.exe` | "File type not permitted / 1 file was refused. Allowed: pdf, doc, docx, xls, xlsx, ppt, pptx, zip." Continue stays disabled | PASS |
| 501 MB file (a real 501 MB sparse file chosen in the file picker) | "File too large / 1 file exceeds the 500 MB limit and was not added." Continue stays disabled | PASS |
| Director before the QMS check (a fresh Employee draft still at `qms`) | Not on the Director's desk (0 cards, 0 Approve buttons). Store: "You cannot approve this document". Status stays `draft`. Viewer: "Draft. Not approved for use", download disabled | PASS |
| Required fields empty (steps 2 and 3) | Continue disabled; hint names what is missing | PASS |
| Cancel part-way | Nothing filed | PASS |
| Double-click Submit / Confirm / Approve | One record, one step each; the repeat is refused | PASS |
| Approve twice (publish twice) | Second approve: "You cannot approve this document" | PASS |
| Refresh after each step; Back/Forward after approval | State persists; no stale card | PASS |
| Same desk in two tabs; act in one, then in the stale one | Before the fix the stale tab put the confirmation back to "waiting on QMS" (B5). Now refused, and the first step stands | PASS (fixed) |
| Reject with no reason / under 20 characters | "Reject & Notify" disabled until 20 characters | PASS |
| Drilling Director on a Coiled Tubing document | Desk refused (whole page); store refuses withdraw | PASS |
| Logout / login between stages | **Not verifiable:** the prototype has no sign-in. Switching role and reloading is the nearest equivalent, and state survived it at every stage | N/A |

---

## 3. Role permission matrix

Verified by acting in the browser as each role on the final code. "Refused" means the page replaces itself with a refusal, or the register returns an error or `null`. A hidden button was never counted as protection.

| Role | Upload | Edit record details | QMS check | Director approve | Publish (put in force) | Withdraw | Audit / view | Result |
|---|---|---|---|---|---|---|---|---|
| Employee | **Yes** (bar or ☰; upload.html opens) | Refused | Refused | Refused | Refused | Refused | Current documents; own drafts show title and status only; others' drafts withheld; Master List, Analytics, About refused | PASS |
| QMS | Yes | Yes, any area (lifecycle fields refused) | **Yes**, at stage `qms` only; a repeat is refused | **Refused**, before and after its own step | **Refused**; the bulk action only does the QMS check | Yes, any area | Everything, including the Master List | PASS |
| Director (Coiled Tubing) | Yes | Own area only | **Refused** | **Yes**, own area, stage `director` only; refused at `qms` and in other areas | Only by approving | Own area only | Own desk; other desks and the Master List refused | PASS |
| Auditor | **Refused** (not in nav; page refused; `add` → `null`) | Refused | Refused | Refused | Refused | Refused | Master List, Analytics, About, every trail; desks and upload refused | PASS |

Direct addresses (final code). O = opens, R = refused.

| Address | Employee | QMS | Director | Auditor |
|---|---|---|---|---|
| index, segment, ai-search, glossary, support-ticket | O | O | O | O |
| master-list.html | R | O | R | O |
| dashboard.html?id=coiled-tubing | R | O | O | R |
| dashboard.html?id=drilling | R | O | R | R |
| documents.html?id=coiled-tubing | R | O | O | R |
| analytics.html | R | O | R | O |
| whats-new.html | R | O | R | O |
| upload.html | O | O | O | R |
| viewer.html (published) | O | O | O | O |
| viewer.html (someone else's draft) | O, withheld ("Access restricted") | O, draft banner | O, draft banner | O, draft banner |

**Product rule changed; needs sign-off.** roles.js gave no role a "submit" right. Upload was reachable only by roles that edit metadata (Director, QMS), which contradicts the workflow where the Employee files. This build adds `submit` (Employee, Director, QMS: yes; Auditor: no) and uses it for the Upload link, upload.html and `TAQA_STORE.add`. If the business wants something else, it is one line per role in roles.js.

---

## 4. Desktop UX findings (1440×900)

| Severity | Page | Problem | User impact | Action |
|---|---|---|---|---|
| BLOCKER | viewer.html | A document filed through Upload opened as "Document", "Not in the Master Document List", with no trail, even once published | Nobody could open or audit what the workflow had just released | Fixed (B1) |
| BLOCKER | master-list.html | QMS "Approve selected" put drafts in force with no Director | A procedure could be in force without its approver | Fixed (B2) |
| HIGH | Top bar, upload.html | The Employee had no Upload action; the Auditor could file | The workflow's first step was unreachable for its role | Fixed (B6) |
| MEDIUM | upload.html | Toast said "in force once QMS approves" | Wrong idea of when a procedure may be used | Fixed (B8) |
| MEDIUM | upload.html, viewer.html | Nowhere to see a submission's status | "Did it go through?" | Fixed (B9) |
| MEDIUM | dashboard.html | Card said "Submitted by You · Just now · PDF ·" for every document | Approver could not tell who or when | Fixed (B10) |
| MEDIUM | Bell | Oldest first; opened the viewer, where nothing can be approved | Extra hunting | Fixed (B11) |
| MEDIUM | dashboard.html (QMS), upload.html | "Countersignature" heading beside a Confirm button and a "conformance check" bell; the upload panel never named the Director | Three names for one step | Fixed (B13) |
| LOW | dashboard.html | QMS's view of an area shows the chip "Mohammed Jahdali, Segment Controller · Coiled Tubing" | QMS may wonder whose desk it is | Open (placeholder identity until Entra ID) |

## 5. Mobile UX findings

Tested at **390×844** and **360×800** (Chromium device emulation, touch), plus **412×915** (Pixel 7, the `mobile-chrome` project). Workflows completed on both phone sizes: first-visit tour, role switch through ☰, the full upload, "Your submissions", QMS bell → desk → reject dialog (opened and cancelled) → Confirm, Director Approve, Employee viewer, library and search, Auditor Master List, trail and Analytics.

| Severity | Viewport | Page | Problem | User impact | Action |
|---|---|---|---|---|---|
| HIGH | 390 | Every page | "TechHub Platform" ran under the ☰ button | Broken-looking header | Fixed (M1) |
| HIGH | 360, 390 | Bell | Panel hung off the left edge; titles cut | QMS and Directors could not read notifications | Fixed (M2) |
| HIGH | 360, 390 | upload.html | With a file chosen, and after submitting, the card was wider than the screen: text cut, Continue out of view | Upload looked broken | Fixed (M3) |
| HIGH | 360, 390, 412 | master-list.html | The table header was drawn over the first row, covering its title and taking its tap | Auditor/QMS could not read or open the first document | Fixed (M10) |
| MEDIUM | 360, 390 | Home, first visit | Install sheet slid over the welcome tour's Skip and Next | Two overlays at once | Fixed (M4) |
| MEDIUM | 360, 390 | upload.html | Stepper step 3 off-screen | Could not see where the flow ends | Fixed (M5) |
| MEDIUM | 360 | upload.html (Review) | Card 5 px too wide | Right border cut | Fixed (M6) |
| MEDIUM | 360, 390 | dashboard.html | Cards 2 px from the right edge (16 px on the left) | Lopsided | Fixed (M7) |
| MEDIUM | 360 | ai-search.html | Answer bubble 29 px wider than the screen; result cards cut | Search results clipped | Fixed (M9) |
| LOW | 360, 390 | master-list.html | The segment filter was wider than its card | Arrow cut off | Fixed (with M10) |
| LOW | 360, 390 | upload.html | Fingerprint of the filed file stayed under an empty form | Contradictory | Fixed (M8) |
| LOW | 360, 390 | segment, master-list, viewer, dashboard | Tap targets under 44 px but at least 24 px (WCAG 2.2 AA 2.5.8 passes): segment tabs 34, Master List view chips 32, Delegate 31, viewer quick-reference 30 | Harder with gloves | Open; recommend one 44 px pass |
| LOW | 360, 390 | segment, master-list, analytics | Many labels under 11 px (67–69 on segment and Master List) | Hard to read outdoors | Open; recommend 12 px minimum |
| LOW | 360, 390 | upload.html | "File Added" toast sits over Back/Review for about 3 s | A tap can land on the toast | Open |
| LOW | 360, 390 | Reject dialog | Red validation border inside the teal focus ring | Double outline | Open (cosmetic) |

### UX questions, per role (final code, desktop and phone)

| Question | Employee | QMS | Director | Auditor |
|---|---|---|---|---|
| 1. Obvious where to start? | Yes: Search on Home; Upload in the bar / ☰ | Yes: bell count → desk | Yes: bell count → "Awaiting Your Approval" | Mostly: Master List in nav; nothing on Home points there |
| 2. Main action obvious? | Yes: Upload is the one filled button | Yes: Confirm | Yes: Approve | Yes: read-only, nothing to press by mistake |
| 3. Status clear? | Yes: "Waiting on QMS check" → "Published" | Yes | Yes: "Checked by QMS …" | Yes: status, revision, trail |
| 4. What happens next clear? | Yes: toast and banner name both steps | Yes: "Confirming sends it to Relevant Operation Director" | Yes: "Your approval … is what publishes it" | N/A |
| 5. Who owns the next action? | Yes | Yes | Yes | Yes: the trail names each step's signer and time |
| 6. Buttons clearly named? | Yes | Yes (heading now matches Confirm) | Yes | Yes |
| 7. Messages understandable? | Yes, including the new empty-file message | Yes | Yes | Refusals say why and name the role |
| 8. Distracting information? | Fingerprint hash on step 1 | The persona chip (LOW) | Delegation box pushes the first card down on a phone | Charts come before the list on a phone |
| 9. Visible actions the role cannot take? | None found | None found | None found | None found |
| 10. Comfortable on a phone? | Yes after M3/M5/M6/M8 | Yes after M2/M10 | Yes after M7 | Yes after M10; small labels (LOW) |
| 11. Professional and consistent? | Yes | Yes after B13 | Yes | Yes |
| 12. Anything that would need help? | "Preview not connected" on the document body | Why the chip says Segment Controller | Nothing found | Nothing found |

---

## 6. Automated test evidence

All commands were run in this container, on this branch.

**Final run (final code):**
```
npx playwright test --project=chromium --project=mobile-chrome --reporter=list
```
Finished in 15.2 min with exit code 0. Local runs use `retries: 0` (the config retries only in CI), so nothing was retried and "flaky" is 0 by construction.

| Project | Passed | Failed | Skipped | Flaky / retried | Total |
|---|---|---|---|---|---|
| chromium (Desktop Chrome, 1440×900) | 379 | 0 | 1 | 0 | 380 |
| mobile-chrome (Pixel 7, 412×915) | 379 | 0 | 1 | 0 | 380 |
| **Combined** | **758** | **0** | **2** | **0** | **760** |

The skipped test is the same one in both projects: `offline.spec.js:303` "an entirely unvisited/uncached path falls back to offline.html". It is a runtime guard that predates this audit (commit `b0c6bab`). It skips itself only when this sandbox's `context.setOffline()` fails to block the service worker's own fetch. That is an environment limitation, not an app result, so offline fallback for an unvisited page is **not verified** here.

**Projects that could not run:**
```
npx playwright test --project=firefox --project=webkit --project=mobile-safari tests/smoke.spec.js
→ 42 failed at launch: "browserType.launch: Executable doesn't exist at
  /opt/pw-browsers/firefox-1495/firefox/firefox" (14) and
  ".../webkit-2215/pw_run.sh" (28). No test body ran.
```

**How the suite got here: an earlier full run on this branch, before the last fixes:**

| Project | Passed | Failed | Skipped | Total |
|---|---|---|---|---|
| chromium | 371 | 0 | 1 | 372 |
| mobile-chrome | 338 | 33 | 1 | 372 |
| **Combined** | **709** | **33** | **2** | **744** |

Every one of the 33 mobile-chrome failures was investigated from its error message:
- **31 were already on `main`.** I checked by running the same spec files under mobile-chrome on unfixed `main` (`9ca5e4e`) in a separate worktree: 31 failed, 65 passed. Those tests click desktop top-bar controls (Areas button, the bar's links, the bookmark icon, the role door, the Upload button, the Published column) that the phone layout hides on purpose and replaces with the ☰ menu. The full suite had never been run under mobile-chrome before; the earlier report ran only its 14 smoke tests there.
- **1 was my own new journey test**, which looked for the desktop Upload button.
- **1 (on `main` too) was a real phone bug:** the Master List header covered the first row (M10), now fixed in the app.

**Fixed without skipping any test:**
- Tests about what a person can reach (links, Master List and Upload per role, bookmarks, role switch, the journey) now go through a shared `topbar` helper (`tests/helpers/fixtures.js`). It uses the bar on desktop and ☰ on a phone, so the mobile project now tests the phone menu for real.
- Tests of desktop-only widgets (the Areas sheet, the door, the bar's popovers, Tab order through the bar, sorting by Published) are pinned with `test.use(DESKTOP)` to the width where the widget exists, and still run in every project.
- New phone tests cover each phone equivalent: the area list in ☰ matches the register; Bookmarks from ☰ opens the panel and Escape closes it; "Viewing as" changes role and the area picker changes a Director's area; ☰ is reachable with Tab, shows a focus ring, opens with Enter and closes with Escape; the Published column is hidden on a phone while Status still sorts.

**Chromium before any fix in this audit (same command, `--project=chromium`):** 355 passed, 3 failed, 1 skipped (359). The 3 failures were tests that pinned the defective behaviour: bulk approve putting drafts in force (B2), the Employee having no Upload (B6), and the old wording. They now assert the corrected behaviour.

**The regression tests prove the bugs.** `tests/release-journey.spec.js` was run against unfixed `main` in a separate worktree. Of the 13 tests present at that point, 12 failed there. The 13th (header overlap) passed at 360 px, because `main` shrinks the logo only at ≤360 px. I moved it to 390 px, where I had seen the overlap, and it then failed on `main`. All 13 pass on this branch. The tests added later for B14 (empty file), M9 (search) and M10 (Master List) each reproduce a defect I saw in the browser first.

**CI:** `.github/workflows/tests.yml` runs `npm ci`, `npx playwright install --with-deps chromium`, then `npx playwright test --project=chromium`. I ran the same test command. I did not run `npm ci` or `playwright install` here, because the container already has the pinned Chromium and `node_modules`.

---

## 7. Bugs fixed

| ID | Severity | Issue | Root cause | Files | Regression coverage | Verified in the browser |
|---|---|---|---|---|---|---|
| B1 | BLOCKER | An uploaded or published document opened as "Document", "Not in the Master Document List", with no trail, for every role | viewer.html looked records up only in the shipped register, not in TAQA_STORE, and loaded store.js after the page script | viewer.html | journey test (title, "Current, OK to use", trail) | All roles, 1440/390/360 |
| B2 | BLOCKER | QMS "Approve selected" put an Employee's draft in force with no Director and no approver | bulkAction called `setStatus(n,'current')`, and setStatus checked no role or stage | store.js, master-list.html | master-list.spec (rewritten); "nobody puts a document in force except through the Director step" | Bulk now leaves `draft/director`; the Director's desk shows it |
| B3 | HIGH | Employee or Auditor could withdraw or rename a live procedure from the console (reproduced: an Employee made SOP-013 "Obsolete. Do not use" for everyone) | `setStatus`, `patch` and `remove` had no role check | store.js | 2 role tests plus "Director can withdraw in own area only" | Refused for Employee and Auditor; allowed for QMS and the area's Director |
| B4 | HIGH (security) | HTML in a title ran as script in QMS's and the Director's browsers through the bell | Bell built from unescaped `d.title` | shared.js | bell test | 10 pages × 4 roles: nothing executed |
| B5 | HIGH | A second QMS tab silently undid the first tab's confirmation | The store cached the register per tab and wrote its stale copy back | store.js | two-tabs test | Two tabs |
| B6 | HIGH | Employee (first step) had no Upload; Auditor could file | Upload gated on `editMetadata`; upload.html had no guard | roles.js, shared.js, upload.html, first-paint script in 12 pages | navigation.spec; auditor refusal test; journey | 4 roles |
| B7 | HIGH | No uploader in the record or trail; steps had no times | `submittedBy` was a placeholder sentence; no `*At` timestamps | store.js, upload.html, viewer.html | journey test | Trail shows all three signers with times |
| B8 | MEDIUM | Toast said "in force once QMS approves" | Copy predated the two-step release | upload.html | journey test | Yes |
| B9 | MEDIUM | Employee could not see what happened to a submission | Nothing listed it | upload.html, viewer.html | journey test | Yes |
| B10 | MEDIUM | Desk card read "Submitted by You · Just now · PDF ·" | Placeholder strings | dashboard.html | journey test | Yes |
| B11 | MEDIUM | Bell oldest-first, opening the viewer | No sort; wrong target | shared.js | bell test | Yes |
| B12 | MEDIUM | Employee's draft banner linked to the Master List, which refuses them | Link not role-aware | viewer.html | journey test (banner link) | Yes |
| B13 | MEDIUM | "Countersignature" heading beside "Confirm"; the upload panel did not name the Director | Old terminology | dashboard.html, upload.html | journey test; upload.spec | Yes |
| B14 | MEDIUM | A 0-byte file was accepted and could be filed | addFiles checked type and maximum size, not emptiness | upload.html | "upload refuses what is not a document" | "File is empty" message; Continue disabled |
| M1 | HIGH | Brand under ☰ at 390 | 3-track grid with the middle track hidden put the right cluster in the middle | topbar.css | "on a 390px phone" test | 390, 360 |
| M2 | HIGH | Bell panel off-screen on phones | 300 px panel anchored to a bell ~100 px from the edge | shared.js | "bell panel stays on screen" | 360, 390 |
| M3 | HIGH | Upload card wider than the phone with a file chosen / after filing | `.hash-display span{white-space:nowrap}` also matched the 64-character hash | upload.html | "upload card fits…" | 360, 390 |
| M4 | MEDIUM | Install sheet over the welcome tour | Both started on first load, uncoordinated | shared.js | "install prompt waits for the welcome tour" | 360, 390 |
| M5 | MEDIUM | Stepper step 3 off-screen | Three nowrap labels | upload.html | step-3 bound check | 360 |
| M6 | MEDIUM | Review card 5 px too wide | `grid-template-columns:1fr` cannot shrink below min-content | upload.html | "fits on review" | 360 |
| M7 | MEDIUM | Desk cards 2 px from the right edge | Same `1fr` issue | dashboard.html | "desk keeps its margin on both sides" | 360, 390 |
| M8 | LOW | Stale fingerprint after filing | Reset did not hide it | upload.html | "hash-display hidden" | Yes |
| M9 | MEDIUM | Search answer 29 px wider than a 360 screen | Flex item with `min-width:auto` would not shrink below its longest word | ai-search.html | "search results stay inside the screen" | 360, 390 |
| M10 | HIGH | Master List header covered the first row on phones and took its tap; segment filter wider than its card | Below 1100 px the table scrolls sideways, making that box the sticky container, so `top:64px` pushed the header onto row 1. A select sizes to its longest option | master-list.html | "the Master List header does not cover the first row…" and master-list.spec on mobile-chrome | 360, 390, 412 |

I also narrowed one of my own earlier fixes: the viewer shows a withheld draft's title and status only for a draft filed from this browser (the prototype's stand-in for "your own"). Someone else's draft stays "Access restricted".

---

## 8. Remaining risks

**Confirmed bugs open:** none found in the tested scope.

**Architectural limitations (need the back end):**
- No server-side enforcement exists; every rule in sections 2 and 3 runs in the browser. Hand-editing `localStorage` can change any record, publish anything and forge any signature. The Azure API must enforce the rules per role and area, and take signers from the signed-in identity.
- No sign-in: roles come from a switcher, and signer names are role labels, not people.
- Records live in one browser; a document filed on one device is not on another. `TAQA_STORE.reset()` (a demo reset) is callable by anyone and clears that browser's records.
- Attachments are not stored: the name and size are recorded, and the body shows "Preview not connected".

**UX improvement opportunities (open, LOW):** a 44 px tap-target pass; a 12 px minimum for meta text; the QMS persona chip; the "File Added" toast position; the reject dialog's double outline; pointing the Auditor from Home to the Master List.

**Untested:**
- Firefox, WebKit and mobile-safari (browsers not installed).
- Real iOS and Android devices (emulation only).
- A real 500 MB+ upload over a network.
- Screen readers (only the suite's automated accessibility checks ran).
- The journey in dark theme.

**Environmental:** a local static server over http with the service worker blocked, so PWA update and caching behaviour were not part of this audit. After deployment, open the live site in a private window or hard-refresh once: the service worker can keep serving the previous build until it updates.

---

**Evidence:** `docs/qa-evidence/2026-09-e2e/`, 29 screenshots from the final runs. `r-*` is the 1440 journey; `m390-*` and `m360-*` are the phone journeys; `b-*` is the Master List bulk action after the fix; `e-empty_pdf` is the empty-file refusal; `ml-360` is the Master List table on a 360 phone after M10.
