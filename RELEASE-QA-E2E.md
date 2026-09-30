# TAQA Knowledge Hub: End-to-End Role Journey, Release QA

Date of testing: 30 September 2026. Code under test: branch `claude/inspiring-mayer-pm1350`, based on `main` at `9ca5e4e`, plus the fixes listed below.

Method: I ran the app in a real browser (Chromium through Playwright, service worker blocked, one persistent browser profile shared by every role, so one "database" carried the document from role to role). Roles were switched the way a person does it: the role door in the top bar on desktop, the "Viewing as" buttons in the menu on a phone. Every workflow action (upload, QMS check, Director approval, reject dialog) was done by clicking the page. The register was never written directly to make a step pass. Direct store calls appear in this report only where I was trying to break a rule, the way someone with the browser console open could.

Every PASS below means I did the action and saw the result. Where I could not verify something, it says why.

---

## 1. Executive result

| Area | Result | Basis |
|---|---|---|
| Functional workflow (Employee → QMS → Director → Published → Auditor) | **PASS on the fixed code.** It did not pass before: the published document could not be opened by title or trail (BLOCKER B1). | One document followed end to end at 1440×900, again at 390×844 and again at 360×800, all on the final code. |
| Permission / security | **PASS within the prototype's limits. Not release-grade.** Two rule-bypasses were found and fixed (QMS could publish without the Director, B2; Employee/Auditor could withdraw or rename live documents, B3), plus a stored XSS (B4). | Direct-URL matrix for 4 roles × 14 addresses, plus write attempts from the console for each role. **Every rule is enforced in the browser. There is no server, so nothing here is "server-side".** Anyone who edits localStorage by hand can still change anything. That is a stated limitation of the prototype (roles.js: "THIS IS A SPECIFICATION, NOT A SECURITY CONTROL"), and the Azure API must enforce the same rules. |
| Desktop UX (1440×900) | **PASS with LOW findings open.** | Screens reviewed for each role; the terminology defect is fixed. |
| Mobile UX (390×844, 360×800) | **PASS on the fixed code.** It failed before: the header overlapped, the bell was clipped off-screen, the upload card was clipped, and the install sheet covered the tour. | The whole workflow completed on each phone size. Tap-target shortfalls under 44 px are recorded as LOW. |
| Automated regression | See section 6 for the exact counts. | Chromium and mobile-chrome projects. Firefox, WebKit and mobile-safari could not run here (browsers not installed). |

**Release recommendation:** fit to demo and hand over as a front-end prototype once this branch is merged. It is **not** release-ready as a system of record until the Azure back end enforces the role rules. Section 8 lists what that means.

---

## 2. End-to-end role journey

Document: **`E2E-ROLE-TEST-20260930060356`**, number **`TQ-TWS-CTSS-SOP-013`**, Coiled Tubing, SOP, file `e2e-test.pdf` (45 B). Repeated on the final code as {{FINAL_TITLE}}. The phone runs used `E2E-ROLE-TEST-M390-…` and `E2E-ROLE-TEST-M360-…`, with the same results.

| # | Stage and action performed | Expected | Actual (final code) | Result | Evidence | Defects found here |
|---|---|---|---|---|---|---|
| 1 | **Employee.** On Home, clicked **Upload** in the top bar. Chose the PDF, picked Coiled Tubing and SOP, gave the title and summary, picked the audience, reviewed, and double-clicked **Submit**. | One draft record waiting on QMS; the submitter recorded; a clear message about what happens next. | One record (the double click did not duplicate it). `status=draft`, `approvalStage=qms`, `submittedBy=Employee`, `submittedAt` recorded. Toast: "Queued as TQ-TWS-CTSS-SOP-013. Next: QMS checks it, then the Director approves it. It is in force only after both." | PASS | `r-01`, `r-02` | B6 (Employee had no Upload entry point), B7 (submitter was a placeholder), B8 (toast said it would be in force after QMS alone) |
| 2 | **Employee.** Read "Your submissions" on the upload page, then opened the draft. | The Employee can tell where the document is. | "Your submissions" row: "Waiting on QMS check". The viewer shows the real title and the banner "Submitted for approval, not in force yet … waiting on the QMS conformance check", with a link to Search (a page the Employee may open). | PASS | `r-02`, `r-03` | B1 (viewer said "Not in the Master Document List", titled "Document"), B9, B12 |
| 3 | **QMS.** Switched role with the door. Opened the bell, clicked the first item, found the same document's card. | The same record, with the uploaded information. | Bell's first item is `TQ-TWS-CTSS-SOP-013`, linking to the desk. The card reads "Submitted by **Employee** · 30 Sept 2026, 06:04 · e2e-test.pdf · 45 B". The desk heading is now "Awaiting Your QMS Check". | PASS | `r-04`, `r-05` | B10 (card said "Submitted by You · Just now"), B11 (bell oldest-first, linked to a page with no action), B13 |
| 4 | **QMS.** Tried the Director's step first, then double-clicked **Confirm**. Refreshed. | QMS cannot approve for the Director; Confirm moves the document to the Director. | Director step refused: "You cannot approve this document." After Confirm, `stage=director`, `countersignedBy=QMS / Document Controller`, `countersignedAt` recorded. A second Confirm was refused. After refresh the card is gone from the QMS desk. | PASS | `r-05` | none |
| 5 | **Director (Coiled Tubing).** Opened the desk and tried the QMS step. Double-clicked **Approve**. Pressed Back, then Forward. | The Director cannot do QMS's step; Approve publishes. | QMS step refused. After Approve: `status=current`, `approvedBy=Segment Director`, `approvedAt` recorded. A second approve was refused. After Back and Forward, no stale card. | PASS | `r-06` | none |
| 6 | **Published.** As Employee: Coiled Tubing library → the document; Search by title; "Your submissions"; bell. | It appears wherever current documents appear, with correct metadata. | In the segment library. Viewer: "Current, OK to use", Rev 1.0, issue date 30 Sept 2026. Search finds it. "Your submissions": Published. Employee bell: "Approved and published". | PASS | `r-07`, `r-08` | B1 |
| 7 | **Auditor.** Master List searched by number; opened the document; tried every write; opened upload. | The Auditor sees everything needed to audit and can change nothing. | Master List row CURRENT, Rev 1.0. The trail lists Employee "Submitted for approval", QMS "QMS conformance check" and Segment Director "Final approval", each with date and time. Countersign, approve, reject and add were all refused. upload.html refused ("Filing documents is not part of this role"). | PASS | `r-09`, `r-10`, `r-11` | B6 (Auditor could file before) |

Negative and edge cases, each performed in the browser:

| Case | Observed | Result |
|---|---|---|
| Required fields empty (step 2, step 3) | Continue stays disabled; a hint says what is missing | PASS |
| Unsupported file (`.exe`) | Refused with a message; Continue stays disabled | PASS |
| Empty file, double extension `report.pdf.exe`, 501 MB file | {{EDGE_FILES}} | {{EDGE_RESULT}} |
| Cancel part-way | Nothing filed | PASS |
| Double-click Submit / Confirm / Approve | One record; one step each; the repeat is refused | PASS |
| Approve twice / publish twice | The second approve is refused: "You cannot approve this document." | PASS |
| Refresh after each step; Back and Forward after approval | State persists; no stale card or status | PASS |
| Same desk in two tabs, act in one, then act in the stale one | **Failed before the fix:** the stale tab put the confirmation back to "waiting on QMS" (B5). Now refused, and the first tab's step stands | PASS (fixed) |
| Reject without a reason / under 20 characters | "Reject & Notify" stays disabled until 20 characters | PASS |
| Director acting on a document that has not passed QMS | {{EDGE_DIRECTOR}} | {{EDGE_DIRECTOR_RESULT}} |
| Director of another area (Drilling) on a Coiled Tubing document | Refused on the desk (whole page) and in the store | PASS |
| Logout / login between stages | **Not verifiable.** The prototype has no sign-in. Switching role with the door and reloading is the nearest equivalent, and state survived it at every stage | N/A |

---

## 3. Role permission matrix

Verified by acting in the browser as each role on the final code. "Refused" means the page itself refuses (the page body is replaced) or the store returns an error. Hidden buttons were not counted as protection.

| Role | Upload | Edit record details | QMS check (countersign) | Director approve | Publish (put in force) | Withdraw | Audit / view | Result |
|---|---|---|---|---|---|---|---|---|
| Employee | **Yes** (Upload in nav; upload.html opens) | Refused (`patch` → "You cannot edit this document") | Refused (no desk: dashboard.html refused; store refuses) | Refused | Refused (only through Director approve) | Refused (`setStatus` → null) | Current documents; own drafts show title and status only; other drafts withheld; Master List, Analytics and About refused | PASS |
| QMS | Yes | Yes, in any area; lifecycle fields refused | **Yes**, stage `qms` only; a second time is refused | **Refused** before and after its own step | **Refused.** Master List bulk action now only does the QMS check (B2) | Yes, any area | Everything, including the Master List | PASS |
| Director (Coiled Tubing) | Yes | Yes, own area only | **Refused** | **Yes**, own area, stage `director` only; refused at stage `qms` and in other areas | Only by approving | Own area only (Drilling Director refused on Coiled Tubing) | Own desk; other areas' desks refused; Master List refused | PASS |
| Auditor | **Refused** (not in nav; upload.html refused; `add` → null) | Refused | Refused | Refused | Refused | Refused | Master List, Analytics, About, every document's trail; desks and upload refused | PASS |

Direct URL results (final code), with R = refused and O = opens:

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
| viewer.html (published doc) | O | O | O | O |
| viewer.html (someone's draft) | O, withheld: "Access restricted" | O, draft banner | O, draft banner | O, draft banner |

**Product rule changed, needs sign-off.** roles.js gave no role a "submit" right. Upload was reachable only by roles holding `editMetadata` (Director, QMS), which contradicts the stated workflow where the Employee files. This build adds `submit` (Employee, Director, QMS: yes; Auditor: no) and uses it for the Upload link, upload.html and `TAQA_STORE.add`. If the business intends something different, it is one line per role in roles.js.

---

## 4. Desktop UX findings (1440×900)

| Severity | Page | Problem | User impact | Action |
|---|---|---|---|---|
| BLOCKER | viewer.html | A document filed through Upload opened as "Document", "Not in the Master Document List", with an empty trail, even after it was published | Nobody could open or audit what the workflow had just released | Fixed (B1) |
| HIGH | Top bar, upload.html | The Employee had no Upload action; the Auditor could still open upload.html and file | The workflow's first step was unreachable for the role it belongs to | Fixed (B6) |
| MEDIUM | upload.html | Success toast said the document would be in force once QMS approved | Wrong expectation about when a procedure may be used | Fixed (B8) |
| MEDIUM | upload.html, viewer.html | After submitting, the Employee had nowhere to see status | "Did it go through? Where is it?" | Fixed: "Your submissions" list and own-draft banner (B9) |
| MEDIUM | dashboard.html | Card said "Submitted by You · Just now · PDF ·" for every document | The approver could not tell who filed it or when | Fixed (B10) |
| MEDIUM | Bell | Oldest first; clicking opened the viewer, where nothing can be approved | Extra clicks and hunting for the queue | Fixed (B11) |
| MEDIUM | dashboard.html (QMS), upload.html | The QMS desk said "Awaiting Your **Countersignature**" beside a **Confirm** button and a "conformance check" bell; the upload side panel's step 3 said "Approve / Return" without naming the Director | Three names for one step; the Director's step not named where the submitter reads it | Fixed (B13) |
| LOW | dashboard.html | The persona chip on the QMS view of an area reads "Mohammed Jahdali, Segment Controller · Coiled Tubing" | QMS may wonder whose desk this is | Open. Placeholder identity until Entra ID |
| LOW | viewer.html | Trail footnote says signer identity is placeholder data | Correct and honest; mentioned so it is not mistaken for a defect | None |

---

## 5. Mobile UX findings

Tested at **390×844** and **360×800** (Chromium, `isMobile`, touch). Workflows completed on both sizes: first-visit tour, role switch through the menu, the complete upload, "Your submissions", QMS bell → desk → reject dialog opened and cancelled → Confirm, Director Approve, Employee viewer, segment library, search, Auditor Master List, trail and Analytics. No horizontal page scroll on any of them, and no JS errors.

| Severity | Viewport | Page | Problem | User impact | Action |
|---|---|---|---|---|---|
| HIGH | 390 | Every page (top bar) | "TechHub Platform" ran underneath the menu button | Broken-looking header on the most common phone size | Fixed (M1) |
| HIGH | 360, 390 | Bell | Panel hung off the left edge: "…TING FOR YOUR SIGNATURE", "E-ROLE-TEST…" | QMS and Directors could not read their notifications on a phone | Fixed (M2) |
| HIGH | 360, 390 | upload.html | With a file chosen, and after submitting, the card was wider than the screen. Text was cut and Continue was pushed out of view | The upload form looked broken right after the first step | Fixed (M3) |
| MEDIUM | 360, 390 | Home, first visit | The "Install TechHub Platform" sheet slid over the welcome tour and covered Skip and Next | Two overlays at once on a new user's first screen | Fixed: the install prompt waits for the tour (M4) |
| MEDIUM | 360, 390 | upload.html | Step 3 of the stepper ran off the right edge | Could not see where the flow ends | Fixed: only the current step keeps its label on a phone (M5) |
| MEDIUM | 360 | upload.html (Review) | Card 5 px wider than the screen; right border cut | Looked unfinished | Fixed (M6) |
| MEDIUM | 360, 390 | dashboard.html | Cards ran to 2 px from the right edge (16 px on the left) | Lopsided, cramped approval cards | Fixed (M7) |
| LOW | 360, 390 | upload.html | The fingerprint of the file just filed stayed on screen ("✓ Unique file") under a form asking for a file | Contradictory | Fixed (M8) |
| LOW | 360, 390 | segment, master-list, viewer, dashboard | Tap targets under 44 px, though all at least 24 px (so WCAG 2.2 AA 2.5.8 passes): segment tabs 34 px, Master List view chips 32 px, Delegate 31 px, viewer quick-reference buttons 30 px, bell footer (now 44 px) | Harder to hit with gloves | Open. Recommend a 44 px minimum pass in one change |
| LOW | 360, 390 | segment, master-list, analytics | Many labels under 11 px (68 on the segment page) | Hard to read outdoors | Open. Recommend 12 px minimum for meta text |
| LOW | 360, 390 | upload.html | The "File Added" toast sits over Back and Review for about 3 s | A tap can land on the toast | Open |
| LOW | 360, 390 | Reject dialog | Red validation border inside the teal focus ring | Double outline | Open (cosmetic) |

### UX questions, per role

Answers are what I saw on the final code, desktop and phone.

| Question | Employee | QMS | Director | Auditor |
|---|---|---|---|---|
| 1. Obvious where to start? | Yes: Search on Home, Upload in the bar | Yes: the bell count leads to the desk | Yes: the bell count leads to "Awaiting Your Approval" | Mostly: the Master List is in the nav; nothing points there from Home |
| 2. Main action obvious? | Yes: Upload is the one filled button | Yes: Confirm | Yes: Approve | Yes: read-only, nothing to press by mistake |
| 3. Current status clear? | Yes: "Waiting on QMS check", then "Published" | Yes: badge plus the QMS note on the card | Yes: "Checked by QMS …" note on the card | Yes: status, revision and trail |
| 4. What happens next clear? | Yes: toast and banner name both steps | Yes: "Confirming sends it to Relevant Operation Director" | Yes: "Your approval … is what publishes it" | N/A |
| 5. Who owns the next action? | Yes: "waiting on the QMS conformance check" | Yes | Yes | Yes: the trail shows who did each step and when |
| 6. Buttons clearly named? | Yes | Yes, now that the heading matches Confirm | Yes | Yes |
| 7. Messages understandable? | Yes | Yes: "Checked, sent on for the Director's final approval" | Yes: "Document approved and published to segment" | Refusals explain why and name the role |
| 8. Distracting information? | Some: "File fingerprint" hash on step 1 | The persona chip (LOW) | Delegation box above the queue on a phone pushes the first card down | The Master List's charts come before the list on a phone |
| 9. Visible actions the role cannot take? | None found | None found | None found | None found |
| 10. Comfortable on a phone? | Yes after M3/M5/M6 | Yes after M2 | Yes after M7 | Yes, though small labels (LOW) |
| 11. Professional and consistent? | Yes | Yes after B13 | Yes | Yes |
| 12. Anything that would make them ask for help? | "Preview not connected" on the document body | Why the chip says Segment Controller | Nothing found | Nothing found |

---

## 6. Automated test evidence

Commands run on the final code, in this container:

```
npx playwright test --project=chromium --project=mobile-chrome --reporter=list
npx playwright test --project=firefox --project=webkit --project=mobile-safari tests/smoke.spec.js
```

{{SUITE_RESULTS}}

The CI workflow (`.github/workflows/tests.yml`) runs `npm ci`, `npx playwright install --with-deps chromium`, then `npx playwright test --project=chromium`. I ran the same test command. I did not run `npm ci` or `playwright install` here: the container already has the pinned Chromium and `node_modules`.

**Regression tests prove the bugs.** The new `tests/release-journey.spec.js` (13 tests) was also run against the unfixed `main` code in a separate worktree. There, all 13 failed. On the fixed code, all 13 pass.

Existing tests changed because they pinned the defective behaviour:
- `master-list.spec.js` asserted that QMS bulk "Approve selected" makes every draft Current. That is bug B2 itself. It now asserts that the bulk action does the QMS check only and nothing goes into force.
- `navigation.spec.js` asserted that the Employee has no Upload link. It now asserts Upload for Employee, Director and QMS, and none for the Auditor.
- `upload.spec.js` pinned the old side-panel wording ("Review", "Approve / Return").

Before these fixes, the same chromium command gave 355 passed, 3 failed and 1 skipped (359 tests). The 3 failures were exactly the three tests above.

---

## 7. Bugs fixed

| ID | Severity | Issue | Root cause | Files | Regression coverage | Verified |
|---|---|---|---|---|---|---|
| B1 | BLOCKER | An uploaded or published document opened as "Document", "Not in the Master Document List", with an empty trail, for every role | viewer.html looked records up only in the shipped register, not in TAQA_STORE, and loaded store.js after the page script | viewer.html | journey test (title, "Current, OK to use", trail) | Browser, all roles, all 3 viewports |
| B2 | BLOCKER | QMS "Approve selected" in the Master List put an Employee's draft in force with no Director and no approver name | bulkAction called `setStatus(n,'current')`, and setStatus checked no role or stage | store.js, master-list.html | master-list.spec (rewritten); "nobody puts a document in force except through the Director step" | Browser: bulk action now leaves `status=draft, stage=director`, and the Director's desk shows the document |
| B3 | HIGH | An Employee or Auditor could withdraw a published procedure or rename it from the console. Reproduced: an Employee made TQ-TWS-CTSS-SOP-013 "Obsolete. Do not use" for every role | `setStatus`, `patch` and `remove` in store.js had no role check | store.js | 2 role tests plus "Director can withdraw in own area only" | Browser matrix: Employee and Auditor refused; QMS and the area's Director allowed |
| B4 | HIGH (security) | A title with HTML ran as script in the QMS and Director browsers through the bell | Bell items built from unescaped `d.title` | shared.js | bell test | Sweep of 10 pages × 4 roles: nothing executed |
| B5 | HIGH | A second QMS tab silently undid the first tab's confirmation | The store cached the register per tab and wrote the stale copy back | store.js | two-tabs test | Browser, two tabs |
| B6 | HIGH | The Employee (the workflow's first step) had no Upload; the Auditor could file through upload.html | Upload was gated on `editMetadata`; upload.html had no guard | roles.js, shared.js, upload.html, first-paint script in 12 pages | navigation.spec; auditor refusal test; journey (Employee Upload visible) | Browser, 4 roles |
| B7 | HIGH | No uploader in the record or trail; steps had dates but no times | `submittedBy` was a placeholder sentence; no `*At` timestamps | store.js, upload.html, viewer.html | journey test | Auditor trail shows Employee, QMS and Director with times |
| B8 | MEDIUM | Toast said "in force once QMS approves" | Copy predated the two-step release | upload.html | journey test | Browser |
| B9 | MEDIUM | Employee could not see what had happened to a submission | Nothing listed it | upload.html, viewer.html | journey test | Browser |
| B10 | MEDIUM | Desk card read "Submitted by You · Just now · PDF ·" | Placeholder strings | dashboard.html | journey test | Browser |
| B11 | MEDIUM | Bell oldest-first, linking to the viewer | No sort; wrong target | shared.js | bell test (href) | Browser |
| B12 | MEDIUM | An Employee's draft banner sent them to the Master List, which refuses them | Link not role-aware | viewer.html | journey test (banner link) | Browser |
| B13 | MEDIUM | "Countersignature" heading beside a "Confirm" button; the upload panel did not name the Director | Old terminology | dashboard.html, upload.html | journey test (queue title); upload.spec | Browser |
| M1 | HIGH | Brand under the menu button at 390 | 3-track grid with the middle track hidden put the right cluster in the middle | topbar.css | "on a 390px phone" test | Browser 390, 360 |
| M2 | HIGH | Bell panel off-screen on phones | 300 px panel anchored to a bell ~100 px from the edge | shared.js | "bell panel stays on screen" | Browser 360, 390 |
| M3 | HIGH | Upload card wider than the phone with a file chosen / after submitting | `.hash-display span{white-space:nowrap}` also matched the 64-character hash | upload.html | "upload card fits…" | Browser 360, 390 |
| M4 | MEDIUM | Install sheet over the welcome tour | Both started on first load with no coordination | shared.js | "install prompt waits for the welcome tour" | Browser 360, 390 |
| M5 | MEDIUM | Stepper step 3 off-screen | Three nowrap labels | upload.html | step-3 bound check | Browser 360 |
| M6 | MEDIUM | Review card 5 px too wide at 360 | `grid-template-columns:1fr` cannot shrink below min-content | upload.html | "fits on review" | Browser 360 |
| M7 | MEDIUM | Desk cards 2 px from the right edge | Same `1fr` issue | dashboard.html | "desk keeps its margin on both sides" | Browser 360, 390 |
| M8 | LOW | Stale fingerprint after submitting | Reset did not hide it | upload.html | "hash-display hidden" | Browser |

One change narrowed my own earlier fix: the viewer shows a withheld draft's title and status only for a draft filed from this browser (the prototype's stand-in for "your own"). Someone else's draft stays "Access restricted".

---

## 8. Remaining risks

**Confirmed limitations (not bugs in this build, but they block production use):**
- **No server-side enforcement exists.** Every rule in sections 2 and 3 runs in the visitor's browser. Editing localStorage by hand can still change any record, publish anything and forge any signature. The Azure API must enforce submit, check, approve, withdraw and edit per role and area, and must record the signer from the signed-in identity.
- **No sign-in.** Roles are chosen from a switcher; signer names are role labels, not people. Logout/login between stages could not be tested.
- **Records live in one browser.** A document filed on one device is not visible on another. `TAQA_STORE.reset()` (a demo reset) is callable by anyone and clears that browser's records.
- **Attachments are not stored.** The file's name and size are recorded; the document body shows "Preview not connected".

**UX improvement opportunities (open, LOW):** a 44 px tap-target pass; a 12 px minimum for meta text on segment, master-list and analytics; the QMS persona chip; the File Added toast position; the reject dialog's double outline; pointing the Auditor from Home to the Master List.

**Untested:**
- Firefox, WebKit and mobile-safari: their browsers are not installed in this container. 
- Real iOS/Android devices: the phone results come from Chromium's device emulation. 
- The real 500 MB+ upload path through a network.
- Screen readers: only the suite's axe checks ran.
- Dark theme during the journey: I did not repeat the journey in dark mode.

**Environmental limitations:** the tests run against a local static server on http, with the service worker blocked. PWA update behaviour and caching were not part of this audit. After deployment, open the live site in a private window or hard-refresh once, because the service worker can serve the previous build until it updates.

---

Evidence: screenshots in `docs/qa-evidence/2026-09-e2e/`, named as referenced above (`r-*` desktop journey, `m390-*` / `m360-*` phone journey, `b-*` bulk-action bypass, `e-*` edge cases).
