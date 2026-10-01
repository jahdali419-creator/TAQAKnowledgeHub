# TAQA TechHub: Five-Role QA Audit

Date: 1 October 2026. Branch `claude/inspiring-mayer-pm1350` (PR #21, not merged).

| | Commit |
|---|---|
| Code audited from scratch (baseline) | `1de6bbef5f63c369549b6412c8a0ece17764afba` |
| Fixes and new tests from this audit | `e2e044b7a3a9876102cd4fe6fa1f9e13c381bb0b` (see section 6) |
| D8, after the owner's decision | the commit after this report's first version |
| This report | the commit that adds this file |

> **This is a frontend-only prototype.** Every rule below runs in the visitor's browser (`roles.js`, `store.js`). A person who edits `localStorage` or uses the console can change any record, publish anything and forge any signature. Nothing here is production security. Roles come from a switcher, not a sign-in; records live in one browser; attachments are not stored. The Azure back end must enforce the same rules (section 11).

Earlier evidence was not trusted. `QA-RELEASE-REPORT.md` and `RELEASE-QA-E2E.md` describe four roles and are now marked **STALE** where they no longer match (section 10).

---

## 1. Method

- **Rules first, from the code.** I read `roles.js`, `store.js`, `documents-master.js`, every HTML page's permission checks and every spec before testing. Section 2 is what the code says, not what earlier reports said.
- **Real UI actions.** Playwright drove Chromium the way a person does: the role door in the top bar on desktop, "Viewing as" in the ☰ menu on a phone, the area picker inside the door, Upload's four steps, the desk's Confirm, Approve and Reject buttons, the reject dialog, the delegation form, "Act as this", the Master List's bulk bar. The service worker was blocked, and one browser profile carried each document from role to role.
- **Console calls only to break a rule.** Where a step says "console", I called `TAQA_STORE` the way someone with the browser console could, to prove the rule is enforced where the record is written and not only by a hidden button. No workflow step was made to pass by writing the register.
- **Two viewports.** Desktop 1440×900 and phone 390×844 (Chromium with touch emulation).
- The scripts and their JSON results are under `docs/qa-evidence/2026-10-five-role/`.

---

## 2. Business rules, as the current code defines them

### The five personas (`TAQA_ROLE_ORDER`)

| | Employee | QMS / Document Controller | Segment Director (`owner`) | Maintenance Manager (`maintenance`) | External Auditor |
|---|---|---|---|---|---|
| Scope | all areas | all areas | **own area** (`TAQA_ROLE.area()`) | **own area** | all areas |
| File a document (`submit`) | yes | yes | yes | yes | **no** |
| QMS check (`countersign`) | no | **yes**, at stage `qms` only | no | no | no |
| Final approval (`approve`) | no | no | **yes**, own area, **non-maintenance** documents only | **yes**, own area, **maintenance** documents only | no |
| Withdraw / edit details (`canManage`) | no | any area | own area | own area (no department check, see section 9) | no |
| Delegate | no | no | yes | yes | no |
| Master List, Analytics, About (`registerView`) | no | yes | no | no | yes |
| Export F086 | no | yes | no | no | yes |
| Drafts visible | own drafts' title and status only | all | own area | own area | all |

### Release is two steps, in this order (`TAQA_APPROVAL`)

1. **QMS check** (`countersign`): stage `qms` → `director`. Records `countersignedBy/At`.
2. **Final approval** (`approve`): stage `director` → status `current`. Records `approvedBy/At`. This is what publishes.

Either step can **reject** with a reason of at least 20 characters. A rejected draft leaves both queues and can never be signed. **Resubmission is a new filing** of the revised document from Upload, which enters the QMS queue as a new record.

### How a document is identified as Maintenance (`TAQA_APPROVAL.isMaintenance`)

`doc.department === 'maintenance'` **or** `doc.docType === 'bulletin'`. Both are checked in `canApprove`:

```
if (cap.scope !== 'all' && isMaintenance(doc) !== (cap.department === 'maintenance')) return false;
```

So a Segment Director can never approve a maintenance document, and a Maintenance Manager can never approve anything else. Upload sets `department: 'maintenance'` when "Maintenance department document" is ticked, and ticks and locks that box for a Maintenance Bulletin. A segment's Maintenance tab links to Upload with `?dept=maintenance` already ticked.

### Delegation (`TAQA_DELEGATION`)

A delegation names who, who granted it, the area, optional document types, an expiry of at most 90 days and a reason. It never exceeds what the grantor holds, carries the grantor's department, cannot be re-delegated, and stops working on expiry. Switching role or area drops it.

---

## 3. The two end-to-end journeys

Both journeys run on 1de6bbe (baseline) and again on e2e044b (after the fixes), at 1440×900 and 390×844. Results below are from the run on the fixed code; "baseline" notes what differed before.

### Journey 1: Operations. Employee → QMS → Segment Director → Published → Auditor

| # | Action (real UI) | Expected | Observed | Result |
|---|---|---|---|---|
| O1 | Employee files an SOP for Coiled Tubing through Upload, maintenance box left unticked | 1 draft at `qms`, submitter Employee, not maintenance | 1 record, `draft/qms/Employee`, approver "Relevant Operation Director"; toast "QMS checks it, then the Director approves it" | PASS |
| O2 | Director opens the desk **before** QMS (wrong stage) | no card | 0 cards | PASS |
| O3 | QMS opens the desk, clicks **Confirm** | stage `director`, message names the Director | "✓ Checked. Now with the Director for final approval" | PASS |
| O4 | **Maintenance Manager of the same segment** opens the desk; console `approve()` and `reject()` | no card; both refused | 0 cards; "You cannot approve / reject this document." | PASS |
| O5 | Director **double-clicks** Approve; console approves again; **refresh**; open the viewer, **Back**, **Forward** | published once; repeat refused; no stale card | `current`, approvedBy Segment Director; repeat refused, approvedAt unchanged; 0 cards after refresh and on Back | PASS |
| O6 | Employee: Operations shelf, Maintenance shelf, viewer | Operations only; "Current, OK to use" | Operations yes, Maintenance no; "Current, OK to use" | PASS |
| O7 | Auditor: Master List search, viewer trail; console withdraw/edit/file | found; trail Employee → QMS → Segment Director; all writes refused | as expected; `[null, false, null]` | PASS |

### Journey 2: Maintenance. Employee → QMS → Maintenance Manager → Published → Auditor

Run twice: **2a** identified by `department = maintenance` (an SOP with the box ticked) and **2b** identified by type (a Maintenance Bulletin).

| # | Action (real UI) | Expected | Observed | Result |
|---|---|---|---|---|
| M1 | Employee files an SOP with "Maintenance department document" ticked | `department=maintenance`, `draft/qms`, approver Maintenance Manager; toast names the Maintenance Manager | as expected; toast "then the Maintenance Manager approves it" | PASS (**baseline FAIL**: toast said "then the Director approves it", defect D1) |
| M2 | Maintenance Manager desk **before** QMS (wrong stage); console approve | no card; refused | 0 cards; refused | PASS |
| M3 | QMS desk card, **Confirm** | card and result name the Maintenance Manager | "Confirming sends it to Maintenance Manager…"; "✓ Checked. Now with the Maintenance Manager for final approval" | PASS |
| M4 | **Segment Director of the same segment**: desk; console approve and reject | no card; both refused | 0 cards; both "You cannot … this document." | PASS |
| M5 | **Drilling** Maintenance Manager opens `dashboard.html?id=coiled-tubing` (wrong segment, direct URL); console approve | desk refused; approve refused | refusal page; refused | PASS |
| M6 | Same person switches area to Coiled Tubing **from the area picker on the Drilling desk** | lands on the Coiled Tubing desk with the card | `/dashboard.html?id=coiled-tubing`, 1 card, "Your approval as Maintenance Manager is what publishes it" | PASS |
| M7 | Maintenance Manager **double-clicks** Approve; refresh | published once; card gone | `current`, approvedBy Maintenance Manager; 0 cards | PASS |
| M8 | Employee: Maintenance shelf, Operations shelf, viewer | Maintenance only; breadcrumb back to the Maintenance side; authority Maintenance Manager | as expected (`#bc-seg` carries `dept=maintenance`) | PASS |
| M9 | Auditor viewer trail | Employee → QMS → **Maintenance Manager**, no Director | as expected | PASS |
| B1 | Employee files a **Maintenance Bulletin** | box ticked **and locked**; number `…-MB-…`; department maintenance | `TQ-TWS-CTSS-MB-001`, locked, maintenance | PASS |
| B2 | QMS Confirm | names the Maintenance Manager | as expected | PASS |
| B3 | Segment Director: desk, console approve | no card; refused | as expected | PASS |
| B4 | Maintenance Manager approves from the desk; Bulletins shelf | published by the MM; on the Bulletins shelf | as expected | PASS |
| L1 | A bulletin **with `department: null`** (identified by type only, filed from the console as QMS): QMS desk | card and result name the Maintenance Manager | as expected | PASS (**baseline FAIL**: the result said "Now with the Director", defect D2) |
| L2–L3 | Same bulletin: MM desk; viewer "Approval authority" | 1 card; Maintenance Manager | as expected | PASS |

**Cross-department proof, in both directions.** A Segment Director cannot approve a maintenance document (O4's mirror M4, B3, the tour matrix rows "Approve Maintenance SOP / Bulletin"), and a Maintenance Manager cannot approve a non-maintenance document (O4 and the row "Approve Operations SOP"). Each was checked at the desk (no button) and at the store (console refused), on desktop and phone.

No uncaught page errors in any journey run.

---

## 4. Edge cases (desktop, real UI)

| Case | Observed (fixed code) | Result |
|---|---|---|
| File from a Maintenance tab link (`?dept=maintenance`) | box pre-ticked; `department=maintenance` | PASS |
| MM rejects at the final step; reason under 20 characters; double-click "Reject & Notify" | button disabled under 20; rejected once at stage `director` by Maintenance Manager; status stays draft | PASS |
| Refresh after the reject | card gone | PASS |
| Submitter sees the return | "Your submissions": "Returned by Maintenance Manager: '…reason…'. Revise it and file it again."; viewer banner says the same | PASS |
| **Resubmission** (new filing of the revised document) | new record at `qms`; the returned one stays at stage `null` and in no queue; console countersign/approve of it refused | PASS |
| QMS rejects a maintenance document at its own step | `rejectedAtStage=qms`; never reaches the MM | PASS |
| **Two tabs** on the MM desk: approve in A, then in stale B | B: "✕ You cannot approve this document."; A's approval unchanged | PASS |
| **Delegation** granted by the MM from the desk form | `fromRole=maintenance`, `fromName="Maintenance Manager, Coiled Tubing"` | PASS (**baseline FAIL**: recorded "Mohammed Jahdali", the Director, D3) |
| "Act as this", then approve | orange banner; delegate sees maintenance only; signs "Deputy … (delegate for Maintenance Manager, Coiled Tubing)"; console approve of an Operations SOP refused; cannot re-delegate | PASS (baseline signature named the Director, D3) |
| Role door usable while acting | door clickable | PASS (**baseline FAIL**: the banner covered the bar, D5) |
| **Role switch** MM → Director while acting | delegation dropped, banner gone | PASS |
| Director's desk lists the MM's delegation? | not listed | PASS (**baseline FAIL**: listed with a Revoke button, D4) |
| **Expired** delegation (2020 dates, made at the store: the form cannot create one) | marked "expired", no "Act as this", `current()` null | PASS |
| **Area switch** while acting | delegation dropped | PASS |
| A Director's delegate | approves Operations documents only, never maintenance | PASS |
| Master List bulk Confirm on a maintenance SOP | confirm dialog and toast name the Maintenance Manager; stage `director` | PASS (**baseline FAIL**: "sent to its Director", D6) |
| Home desk line, MM | "2 documents waiting on your sign-off in Coiled Tubing" (maintenance only) | PASS |
| Home desk line, QMS | "N documents waiting on your QMS check." | PASS (**baseline FAIL**: "approved and waiting on your countersignature", D7) |
| **Maintenance Bulletin filed for a corporate function (QHSE)** | On e2e044b: Upload allowed it and nobody real could approve it (the QHSE Function Head is refused). **Fixed afterwards per the owner's decision (D8):** Upload no longer offers it for a function, and the register refuses it | PASS after the D8 fix (covered by maintenance-manager.spec) |
| Logout / login between stages | not testable: the prototype has no sign-in; switching role and reloading is the stand-in | N/A |

---

## 5. Page / action × five-role matrix

Measured on 1de6bbe by direct address and by action (desk button and store answer), then compared with the rules in section 2. **Desktop (1440×900) and phone (390×844) produced identical matrices.** A cell would read **DEFECT** where what happened differs from the rule; none did. The defects this audit found sit around permissions (section 6), not in them.

| Page / action | Employee | QMS | Segment Director | Maintenance Manager | Auditor |
|---|---|---|---|---|---|
| Home, segment (Operations and Maintenance sides), Search, Field Glossary, Ask Expert | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| Viewer, published Operations / Maintenance document | ALLOWED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| Upload | ALLOWED | ALLOWED | ALLOWED | ALLOWED | REFUSED |
| Desk, own area | REFUSED | ALLOWED | ALLOWED | ALLOWED | REFUSED |
| Desk, other area | REFUSED | ALLOWED | REFUSED | REFUSED | REFUSED |
| Published list, own area | REFUSED | ALLOWED | ALLOWED | ALLOWED | REFUSED |
| Published list, other area | REFUSED | ALLOWED | REFUSED | REFUSED | REFUSED |
| Master List | REFUSED | ALLOWED | REFUSED | REFUSED | ALLOWED |
| Analytics | REFUSED | ALLOWED | REFUSED | REFUSED | ALLOWED |
| About / What's new | REFUSED | ALLOWED | REFUSED | REFUSED | ALLOWED |
| Read someone else's draft, own area | REFUSED | ALLOWED | ALLOWED | ALLOWED | ALLOWED |
| Read someone else's draft, other area | REFUSED | ALLOWED | REFUSED | REFUSED | ALLOWED |
| File a document (page and store) | ALLOWED | ALLOWED | ALLOWED | ALLOWED | REFUSED |
| QMS check | REFUSED | ALLOWED | REFUSED | REFUSED | REFUSED |
| Approve Operations SOP, own area | REFUSED | REFUSED | ALLOWED | **REFUSED** | REFUSED |
| Approve Maintenance SOP, own area | REFUSED | REFUSED | **REFUSED** | ALLOWED | REFUSED |
| Approve Maintenance Bulletin, own area | REFUSED | REFUSED | **REFUSED** | ALLOWED | REFUSED |
| Approve in another area | REFUSED | REFUSED | REFUSED | REFUSED | REFUSED |
| Reject at QMS step | REFUSED | ALLOWED | REFUSED | REFUSED | REFUSED |
| Reject Operations SOP at final step | REFUSED | REFUSED | ALLOWED | REFUSED | REFUSED |
| Reject Maintenance SOP at final step | REFUSED | REFUSED | REFUSED | ALLOWED | REFUSED |
| Withdraw published Operations document, own area | REFUSED | ALLOWED | ALLOWED | ALLOWED ¹ | REFUSED |
| Withdraw published Maintenance document, own area | REFUSED | ALLOWED | ALLOWED ¹ | ALLOWED | REFUSED |
| Edit record details, own area | REFUSED | ALLOWED | ALLOWED | ALLOWED ¹ | REFUSED |
| Write a lifecycle field (status, signer) by editing | REFUSED | REFUSED | REFUSED | REFUSED | REFUSED |
| Export F086 | REFUSED | ALLOWED | REFUSED | REFUSED | ALLOWED |
| Master List bulk actions | REFUSED | ALLOWED | REFUSED | REFUSED | REFUSED |
| Delegate | REFUSED | REFUSED | ALLOWED | ALLOWED | REFUSED |
| Uncaught page errors | none | none | none | none | none |

¹ Matches the code (`canManage` checks area, not department) but may not match the business intent. A decision for the owner; see section 9.

Phone navigation, per role: the ☰ menu carries Home, Document Search, Field Glossary, Ask Expert, Bookmarks, Upload (not for the Auditor), Master List (QMS and Auditor only), the areas, and "Viewing as" with all five roles. Screenshots per role are in the evidence folder (`tour-phone/*-home.png`, `*-menu.png`).

---

## 6. Defects found and what was done

| ID | Severity | Defect (baseline 1de6bbe) | Fix (e2e044b) | Regression test |
|---|---|---|---|---|
| D1 | MEDIUM | Upload told a maintenance submitter "then the Director approves it" | Toast names the Maintenance Manager when `isMaintenance(rec)` | maintenance-manager.spec "the maintenance journey…" |
| D2 | LOW | QMS confirming an untagged bulletin: the card said Maintenance Manager, the result said "Now with the Director" | Result and toast use `TAQA_APPROVAL.isMaintenance` | "QMS confirming a Maintenance Bulletin filed without the department…" |
| D3 | **HIGH** (audit trail) | An MM's delegation recorded the area's **Director by name** as grantor, so the delegate's signature read "delegate for Mohammed Jahdali" | Records "Maintenance Manager, <area>" for an MM | "the delegation names the Maintenance Manager as grantor…" |
| D4 | MEDIUM | Every desk listed every delegation in the browser: the Director could see and **revoke** the MM's delegation, and vice versa | Each desk lists only its own holder's grants for its area | "each desk lists only the delegations its own holder granted" |
| D5 | MEDIUM | The delegate banner sat sticky at `top:0` **over** the fixed top bar and took the role door's clicks (desktop) and covered the logo | Banner fixed under the bar (`top: var(--nav-h)`, below the bar's z-index), like the offline bar | "the delegate banner leaves the top bar usable" |
| D6 | LOW | Master List bulk Confirm said "sent to its Director" for maintenance documents | Names the Maintenance Manager, or both when mixed | "the Master List's bulk Confirm names the Maintenance Manager…" |
| D7 | LOW | QMS home line: "approved and waiting on your countersignature" (QMS goes first) | "waiting on your QMS check"; button "Check" | "the QMS home line says the documents wait on its check…" |
| D8 | MEDIUM | A Maintenance Bulletin could be filed for a corporate function or centre, where there is no maintenance department. It became a maintenance document by type, and **no real person could approve it**: the Function Head is refused | **Owner's decision (1 Oct): a Maintenance Bulletin is for the maintenance team of every operational segment.** Upload offers it only for operational segments and stops at step 2 with the reason otherwise; the register (`TAQA_STORE.add`) refuses one for any other area | "Maintenance Bulletins belong to operational segments" |

Each regression test above **failed on 1de6bbe and passes on e2e044b**: on the unfixed code these seven tests failed in both projects (14 failures); after the fix the affected spec files ran 328 of 328 passing.

---

## 7. Maintenance Manager: automated coverage audit

### Already covered before this audit

| Behaviour | Where |
|---|---|
| Five roles exist, in this order | roles.spec "exactly these five roles", "TAQA_ROLE_ORDER" |
| Only the segment's own MM can approve a maintenance SOP; Director, another segment's MM and QMS refused (store) | maintenance.spec "only the segment's own Maintenance Manager…" |
| A bulletin is maintenance even untagged; the Director is refused (store) | maintenance.spec "a bulletin is a maintenance document even untagged" |
| An MM cannot approve an Operations SOP (store) | maintenance.spec "a Maintenance Manager cannot release the segment's operations documents" |
| An MM lands on the Maintenance side | maintenance.spec |
| Upload's maintenance box, bulletin locking and MB numbering; maintenance software | maintenance.spec |
| Ask Expert routes Maintenance to the segment's MM; an MM asks from their own department | maintenance-ask-expert.spec |

### Gaps found, and the tests added

| Gap | Test added |
|---|---|
| **The MM's capability set was not pinned at all**; `EXPECTED_ROLES` in roles.spec had four roles, and `submit`/`department` were pinned for none | roles.spec now pins all five, including `submit` and `department` (+1 test) |
| MM page access never tested: Master List, Upload link, other area's desk and list, Analytics, About | master-list.spec and navigation.spec loops include `maintenance` (+3); maintenance-manager.spec "its own desk and published list open…" (+1) |
| The maintenance journey was only proven at the store, never through the desks | "the maintenance journey through the desks" (+1) |
| Wrong stage for the MM | "before QMS has checked it…" (+1) |
| MM rejecting, and what the submitter sees | "the Maintenance Manager returns a maintenance document…" (+1) |
| MM home count | "the Maintenance Manager's home line counts…" (+1) |
| MM delegation, delegate scope, Director's delegate vs maintenance, desk scoping, banner | 4 tests (+4) |
| Wording: untagged bulletin, bulk confirm, QMS home line | 3 tests (+3) |

16 test cases added (each runs in chromium and mobile-chrome, so 32 runs). Each checks a separate behaviour; none duplicates an existing assertion.

### Still not automated (verified by hand in this audit only)

Two-tab stale action **for the MM** (the generic two-tab test covers QMS), Back/Forward, area switch from the door on the desk, expired delegation as the MM, resubmission after an MM rejection, and the Bulletins shelf from a UI filing. They exercise the same code paths as existing tests, so I did not add duplicates.

---

## 8. Automated test results

Measured on e2e044b, locally, `npx playwright test --project=chromium --project=mobile-chrome`:

| Project | Passed | Failed | Skipped | Flaky | Total |
|---|---|---|---|---|---|
| chromium (Desktop Chrome, 1440×900) | 443 | 0 | 1 | 0 | 444 |
| mobile-chrome (Pixel 7 emulation) | 443 | 0 | 1 | 0 | 444 |
| **Combined** | **886** | **0** | **2** | **0** | **888** |

Exit code 0, 17.9 minutes. Local runs use `retries: 0`, so nothing was retried. The 2 skips are the same environment-guarded offline test in each project (section 11).

**CI** on the same commit (GitHub Actions, "Frontend regression tests", Chromium only): **443 passed, 0 failed, 1 skipped (444)**, for both the push run and the pull_request run ([run 36908235497](https://github.com/jahdali419-creator/TAQAKnowledgeHub/actions/runs/36908235497)). Before this audit CI ran 428 per project; the difference is the 16 test cases added (section 7).

**Audit scripts (not part of the suite), fixed code:** journeys 46/46 checks passed at 1440×900 and 46/46 at 390×844 (baseline: 45/46 each, the failure being D1); edge cases 29/31 passed, the 2 failures being D8, which was then fixed per the owner's decision and is covered by a new test. No uncaught page error in any run.

**Browsers actually run:** Chromium only (Desktop Chrome 1440×900, and Pixel 7 emulation for mobile-chrome). **Not run:** Firefox, WebKit, mobile-safari. Their browser binaries are not installed in this container (`Executable doesn't exist at /opt/pw-browsers/firefox-…`). CI also runs Chromium only.

---

## 9. Open UX issues and decisions for the owner

| # | Type | Item | Recommendation |
|---|---|---|---|
| 1 | **Decided, done** | D8: Maintenance Bulletin offered for functions and centres, where it has no approver | Owner: bulletins are for the maintenance team of every operational segment. Implemented and tested |
| 2 | **Decision** | A Maintenance Manager can **withdraw and edit** Operations documents in their segment, and a Director can withdraw maintenance documents. `canManage` scopes by area, not department | If withdrawal should follow the approver, add the department check to `canManage` |
| 3 | UX, LOW | The MM's desk header shows the segment owner's name and "Segment Controller" | Show "Maintenance Manager, <area>" on an MM's desk |
| 4 | UX, LOW | The MM's desk counters (PENDING, REJECTED) count the whole segment, not the maintenance department | Count what the desk acts on |
| 5 | UX, LOW | The area picker lets a Maintenance Manager pick a function or centre, which has no maintenance department | Offer operational segments only to the MM |
| 6 | UX, LOW | On a segment's Maintenance side the hero badge still reads the segment's category (for example "OPERATIONS") | Show "MAINTENANCE" on that side |
| 7 | UX, LOW | The upload toast says "the Director" for a policy, whose approver is the CEO | Name the type's approver |
| 8 | UX, LOW | While acting as a delegate, the banner now covers the top 34 px of page content under the bar (the same as the offline bar) | Acceptable; or add top padding while it shows |

---

## 10. Documentation compared with the code

| Document | Status |
|---|---|
| `RELEASE-QA-E2E.md` | **STALE**: four roles, one journey, 760 tests on base `9ca5e4e`. Banner added at the top and on sections 2, 3 and 6. Its defect history (section 7) remains valid history. |
| `QA-RELEASE-REPORT.md` | **STALE**: "All four roles", 357 tests. Banner added at the top and on Role Coverage. |
| `TESTING.md` | Updated: names the five roles, lists the six spec files it was missing, drops "recently-visited", and notes that the iPhone profile needs WebKit. |
| `roles.js` header and blurbs | Match the code. |

---

## 11. Environment limitations

- One browser engine (Chromium). No Firefox, WebKit or real devices.
- Phone results are Chromium emulation at 390×844 (journeys and tour) and Pixel 7 (suite).
- Service worker blocked during the audit runs; PWA update behaviour is not part of this evidence.
- One skipped test in each project: `offline.spec.js` "an entirely unvisited path falls back to offline.html" skips itself when this sandbox's `setOffline()` cannot block the service worker's own fetch. It is an environment guard, not an app result.
- No sign-in, so "logout and login between stages" is replaced by role switching and reload.
- The Azure Static Web Apps preview job fails on PR #21 because the app has reached its staging-environment limit. It is not this code's failure and is not a required check.

---

## 12. What Azure / the back end must provide

1. **Identity.** Entra ID sign-in; role and area from group membership or claims, never from the browser. The signer on every step comes from the token.
2. **Server-side authorization on every write.** Submit; QMS check (stage `qms` only); final approval (stage `director`, own area, **department match**: maintenance documents to the segment's Maintenance Manager, everything else to its Director); reject with a reason; withdraw; edit (never lifecycle fields); delegation grant, revoke and use.
3. **Server-side filtering on every read.** Drafts and classifications by role and area (`canSee`), so the API never returns what a role may not see.
4. **Concurrency.** Conditional updates (ETag / version) so a stale tab or a second approver cannot overwrite a step, the way `store.js` now re-reads before writing.
5. **Delegation as data.** Who, grantor (the real person), area, department, types, expiry, reason; enforced expiry; no re-delegation; an audit log of use.
6. **Persistent register and audit log**, including rejections and resubmissions, retained per TQ-QHSE-S001 / API Q2.
7. **File storage** for attachments, with virus scanning and the same type and size rules as Upload.
8. **Notifications** to the next approver (the Maintenance Manager or the Director) instead of the in-browser bell.
9. The bulletin rule (operational segments only) and a decision on withdrawal scope (section 9) encoded in the API.
