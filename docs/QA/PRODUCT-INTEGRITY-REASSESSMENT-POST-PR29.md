# RISE: Product-Integrity Reassessment after PR #29

| | |
|---|---|
| **Baseline** | `main` at `d501f50` (merge of PR #29). The live Azure and GitHub Pages sites both serve cache `taqa-hub-v103`, and `store.js`, `roles.js`, `upload.html` and `master-list.html` are byte-identical to `main`. |
| **Covers** | PR #26 (Priority 1: PI-04, 05, 09), PR #27 (2A-1: PI-01, 03, 33), PR #28 (2A-2: PI-02, 34), PR #29 (2A-3: PI-16, 25, 31, 53). |
| **Date** | 5 October 2026 |
| **Type** | Read-only reassessment. No production code was changed, no remediation PR was opened, nothing was merged. Every probe ran against the unchanged `main`, from outside the repository. |
| **Original audit** | [`PRODUCT-INTEGRITY-AUDIT.md`](PRODUCT-INTEGRITY-AUDIT.md) (60 findings: P0 5 · P1 24 · P2 24 · P3 7; PI-29 unused), plus 20 test blind spots. |

## Method

1. **Full business journeys A–G**, driven through the real screens (Upload, the QMS Workbench, the Director and Maintenance Manager desks, the viewer, the Master List and the Auditor's F086 export).
   - After every important step the stored record was read back.
   - The register integrity checker from PR #29 was run against the live register at the end of each journey.
   - They ran on desktop Chromium, mobile Chrome (Pixel 7), desktop WebKit and iPhone 14 (WebKit).
2. **The 12 closed findings were re-attacked:**
   - forged lifecycle, identity and authority from the console;
   - script-bearing titles on 9 pages;
   - two-tab number collisions;
   - withdrawn documents opened from title-only links;
   - routing defaults;
   - revision-keyed approvals.
3. **Every open finding was re-run against its original reproduction**, in three parallel groups:
   - workflow, upload, QMS and desks;
   - read side, search, counts and data;
   - phone, installed app, WebKit, service worker and offline.

   Each probe was run twice. Every new or changed verdict that matters for prioritisation (all P1s and the regressions) was then reproduced independently by the lead auditor.
4. **The repository's own regression suite** was run on desktop Chromium: **581 passed, 0 failed, 1 skipped**. The phone and WebKit subsets ran on WebKit and on iPhone 14 (see §6).

Probe specs and raw evidence are kept outside the repository (session scratch folder `audit/`). They can be re-run with the harness described there.

---

## 1. Summary

| | Count |
|---|---|
| **Previous findings** | 60 |
| **CLOSED** | **12** |
| **PARTIALLY FIXED** | **4** (PI-15, PI-24, PI-38, PI-41) |
| **OPEN** | **44** |
| **CANNOT VERIFY** (as a whole) | 0. The iPhone-only parts of PI-18, PI-51 and PI-52 need a real device; their other parts are open. |
| **New findings** | **12**: P1 2 · P2 5 · P3 5 |

**Remaining findings by severity (open or partially fixed):**

| Severity | Original | Closed | Remaining |
|---|---|---|---|
| P0 | 5 | 5 | **0** |
| P1 | 24 | 3 | **21** (19 open, 2 partial) |
| P2 | 24 | 4 | **20** (18 open, 2 partial) |
| P3 | 7 | 0 | **7** |
| **New** | | | **+2 P1, +5 P2, +5 P3** |

**In one paragraph.** Every P0 is closed and stays closed under attack, and the core controlled-document model now holds end to end:
- one number, many revisions, one in force;
- supersede on release;
- translations that follow their source;
- the right final approver for Operations and Maintenance;
- filer ≠ QMS checker ≠ final approver;
- approvals that belong to one revision.

All seven journeys produced correct records on all four browser profiles.

What remains falls into three groups.
- **Decision integrity.** Most of the serious remaining risk is here: an approver's click can land on something other than what they saw.
  - A stale Approve or Confirm acts on a different revision (NEW-01).
  - A withdrawn document comes back into force through a revision that was already in flight (NEW-02).
  - The Workbench confirms on held Enter (PI-07).
  - Upload files on Enter (PI-06).
  - Approvers release without a preview, a "Replaces" line or a confirmation (PI-12).
- **Record truth, counts and dates.** Withdrawal leaves no who, when or why; counts do not match their destinations; overdue means two things; release keeps stale dates.
- **Phone and installed-app reliability.** The drawer cannot be closed, Back shows a blank page, an update reloads mid-task, and there is no honest offline state.

No previously closed finding has regressed. Five of the new findings are gaps in the revision model introduced by PRs #28/#29 (§4). None of them breaks a flow that worked before. They are cases the new model does not yet handle.

---

## 2. Full business journeys

All seven journeys pass with correct stored records on desktop Chromium, mobile Chrome, desktop WebKit and iPhone 14. One WebKit run of D1 hit the 60 s budget under load; it passed when re-run on its own.

| Journey | Result | Record truth checked | Problems found on the way |
|---|---|---|---|
| **A. Operations:** Employee → Upload → QMS (Workbench) → Segment Director (desk) → published → viewer → Master List → Auditor export | **Pass** | `SOP-013` Rev 1.0:<br>• draft/qms → draft/director → current<br>• submittedBy `Employee`, countersignedBy `QMS / Document Controller`, approvedBy `Segment Director` (three different people)<br>• one revision in force; F086 row correct<br>• integrity check: 0 new | **PI-15:** the upload toast names "Relevant Operation Director" and the F086 "Approver Role" says the same, while the Segment Director approved. |
| **B. Maintenance:** Employee → Upload as Maintenance → QMS → Maintenance Manager → published → library → Auditor | **Pass** | `department:'maintenance'`. The Director cannot see or approve it (`approve` refused). Released by `Maintenance Manager`. Shown on the Maintenance side only. F086 row correct. Integrity 0 new. | None in the journey itself. Counts around it are wrong (PI-20, PI-47, NEW-09, NEW-10). |
| **C. Revision:** Current Rev 3.0 → Rev 4.0 through Upload → QMS → Segment Director | **Pass** | `SOP-009`:<br>• Rev 3.0 → superseded, `supersededBy 'Rev 4.0'`, its own approvals unchanged<br>• Rev 4.0 → current with new signatures; no approval inherited<br>• one revision in force<br>• `SOP-009-AR` → superseded "to be re-issued"; viewer `&rev=3.0` shows Superseded<br>• integrity 0 new | **NEW-06:** the translation waiting for re-issue vanishes from search. |
| **D. Rejection:** QMS rejects in the Workbench; Director rejects on the desk | **Pass** (partly) | **D1:** rejected, stage null, queue 13 → 12, reason stored; the filer's viewer says "Returned, not in force: ‹reason›".<br>**D2:** rejected at the Director stage; the card leaves the desk. | **PI-24:**<br>• resubmission mints a new number (`SOP-014`) with no link to the rejected one<br>• the returned draft still counts as pending (desk "2 PENDING" over 0 cards)<br>**NEW-03:** for a revision, re-filing reuses the same number **and** revision. |
| **E. Separation of duties**, direct and delegated | **Pass** for the rule as built | **Refused:**<br>• QMS checking its own filing<br>• Director approving own filing<br>• QMS acting under a Director's delegation<br>• a no-approval delegate<br>• a forms-only delegate approving an SOP<br>**Allowed:** a named delegate approving the Director's own filing. | **PI-32:** a forms-only delegate still withdrew an SOP.<br>**NEW-04:** separation can be bypassed by delegation naming (delegate named as the grantor or as the checker), and any role in the prototype can act under any delegation. |
| **F. Translation lifecycle** | **Pass** | Withdrawing a translation alone leaves its source Current. Withdrawing a source withdraws its translation. Source revision → translation "to be re-issued". **Re-issue works through Upload:** Rev 4.0 of `-AR` keeps `language:'ar'` and `translationOf`, is checked, approved and becomes Current. | **PI-27:** Upload still has no language or translation field for a *new* translation. |
| **G. Withdrawal / edit scope** | **Pass** for scope | **Director:** cannot withdraw or edit another area's documents or a maintenance document.<br>**Maintenance Manager:** cannot withdraw an Operations document but can withdraw its own.<br>**Employee and Auditor:** refused.<br>**Targeting:** withdrawing by number takes the revision in force, not the open draft. | **PI-11:** no withdrawer, time or reason is stored.<br>**NEW-02:** the open revision stays in the queue and can be approved back into force. |

---

## 3. Every previous finding

Status: **CLOSED** · **PARTIALLY FIXED** · **OPEN** · **CANNOT VERIFY**.
Fix column: **A** frontend now · **B** Microsoft 365 production · **C** both.

### P0

| PI | Title | Prev | Status | Evidence | Recommended next action |
|---|---|---|---|---|---|
| PI-01 | Duplicate numbers; actions hit the wrong record | P0 | **CLOSED** | `add()` refuses an existing number in any case and a legacy ID. **Two tabs:** the second is told "has just been used… will be TQ-…-014" and nothing is filed twice. Covered by `doc-identity.spec.js`. | None. Keep server-side allocation as a production control. |
| PI-02 | Revision control broken; two Current revisions | P0 | **CLOSED** | Journey C on four engines: Rev 4.0 Current, Rev 3.0 Superseded, one revision in force, history intact. | None. See NEW-02 and NEW-03 for the next edge. |
| PI-03 | Withdrawn shown Current from title-only links | P0 | **CLOSED** | Withdrawn `SOP-011` opened by title-only link and by number reads "Withdrawn, do not use". | None. |
| PI-04 | Delegation adds power instead of replacing it | P0 | **CLOSED** | A no-approval delegate and QMS-as-delegate are both refused (journey E, G1). | None. See NEW-04. |
| PI-05 | Stored script injection from titles | P0 | **CLOSED** | A script-bearing title, summary and keywords ran on 0 of 9 pages: Workbench, Master List, desk, Home, segment search, viewer, search, Upload "Supersedes" list, Analytics. | None. |

### P1

| PI | Title | Prev | Status | Evidence | Recommended next action |
|---|---|---|---|---|---|
| PI-06 | Enter files the upload before review | P1 | **OPEN** | Enter in Title on step 3 files a record and step 4 is never shown. A record numbered `9` is filed as conformant (`upload.html:571`, `:1072`). | A: submit only from a painted step 4; suppress implicit submit. |
| PI-07 | Repeated Enter in the Workbench confirms the queue | P1 | **OPEN** | 10 Enter presses → 5 checks; 30 → 15; held → 21 of 24 (`master-list.html:1392`, `:1448`). | A: no auto-focus on Next, ignore `e.repeat`, a brief arm delay. |
| PI-08 | Installed iPhone app: drawer cannot be closed | P1 | **OPEN** | The × hit-tests to the status bar (356,38) on both engines; the footer has no Close. The Auditor's record drawer is the same. | A: inset the drawer header and add a footer Close; add overlay tests. |
| PI-09 | Register functions accept forged lifecycle / identity / authority | P1 | **CLOSED** | Forged `status:'current'`, signatures and `submittedBy` are stripped. Signer parameter ignored. `patch` refuses number, status and area. No undoing a withdrawal. Draft → under-review refused. A 1-character reject reason refused. An Employee cannot withdraw, grant or file a policy. `reset` is not exported. | None in the prototype. The production API must enforce the same (BUSINESS-RULES §15). |
| PI-10 | Bulk Withdraw cancels in-flight drafts | P1 | **OPEN** | 3 drafts (one at the Director stage) all become obsolete; the dialog names no titles and asks no reason. | C (owner decision on "cancel submission"). |
| PI-11 | Withdrawal leaves no record; trail shows non-events | P1 | **OPEN** | **Stored:** only `{status:'obsolete'}`.<br>**Trail:** a withdrawn draft shows "DONE QMS check / Final approval".<br>**Data:** the 12 shipped drafts carry `approvedDate`; history is synthetic and unlabelled. | C |
| PI-12 | Approvers release documents they cannot see | P1 | **OPEN** | Preview Document does nothing; the card has no link and no "Replaces"; Approve has no confirmation; no file hash is kept. | A now (link, Replaces, confirm) + B (approval bound to file version and hash). |
| PI-13 | Duplicate / similarity detection shows nothing | P1 | **OPEN** | The same PDF twice shows "✓ Unique file"; the similar-title panel is filled but hidden; the desk hides exact-title matches. | C |
| PI-14 | Stale or free-text numbers | P1 | **OPEN** | **Stale:** an Edit click then an area change keeps `CTSS-SOP-013` under Fracturing/Form.<br>**Free text:** "9" and "…(draft)" are accepted as conformant. | A (+B allocation). |
| PI-15 | Approver named to the submitter ≠ who approves | P1 | **PARTIALLY FIXED** | **Fixed:** the review step now names the real desk.<br>**Open:** the toast and the F086 "Approver Role" still name "Relevant Operation Director", "Subject Matter Expert", "QHSE Manager" or "CEO". BUSINESS-RULES §12 #1 is undecided. | Owner decision, then C. |
| PI-16 | Maintenance procedure routed to the Director | P1 | **CLOSED** | **Maintenance Manager on plain Upload:** their own area with Maintenance ticked.<br>**Links:** carry `seg`/`dept`.<br>**Journey B:** reaches the Maintenance Manager on four engines. | None. |
| PI-17 | Director / MM "Open your queue" opens a refusal | P1 | **OPEN** | From `segment.html?id=drilling` the link goes to the drilling desk and is refused (`shared.js:1597`). | A: use the signer's own segment. |
| PI-18 | Back shows a blank, untappable page | P1 | **OPEN** (Chromium); iPhone CANNOT VERIFY | With the back-forward cache on: all 8 pages restored at opacity 0 with pointer-events none. There is no `pageshow` handler. Playwright WebKit never restores from that cache. | A: clear `page-exit` on `pageshow`; check on a real iPhone. |
| PI-19 | "Review overdue" means two things | P1 | **OPEN** | The Master List cut says 84 while 94 rows say "days late". `TQ-QHSE-P007` shows "33 days late" but is not in the cut. The Maintenance Manager's Home says "7 past review" against 0. | C: one date-based helper. |
| PI-20 | Counts ≠ destinations | P1 | **OPEN** | **Home:** "Awaiting QMS Approval" 16 against a queue of 13.<br>**QMS bell:** 18 against 13.<br>**Director's desk:** Pending 4–5 against 1 card.<br>**Auditor's bell:** another person's rejection.<br>**Repaint:** the desk does not repaint after another page acts.<br>**Improved:** desk and documents page now agree on published. | C |
| PI-21 | Release keeps stale dates | P1 | **OPEN** | `SOP-022` released today keeps issue 2023-08-23 and review 2025-08-23, so it is overdue at release. Upload stamps the issue date at filing. | C |
| PI-22 | Exact number of a superseded / withdrawn document says "no such document" | P1 | **OPEN** | `SOP-003` and `SOP-012` say "check the document number". Legacy IDs and restricted documents behave the same (`search-index.js:40`). | C |
| PI-23 | Viewer shows the wrong area without `seg` | P1 | **OPEN** | `?doc=…SOP-011` shows Drilling Services. The wrong area flows into Related, the share/QR link and bookmarks (`viewer.html:891`). | A: take area and type from the record. |
| PI-24 | Rejected drafts orphaned | P1 | **PARTIALLY FIXED** | **Fixed:** "Returned, not in force: ‹reason›" is shown to the filer; a returned draft is not offered as a revision target.<br>**Open:** counted as pending; "DRAFT" in the Master List; re-filing gets a new number with no link; Workbench "same title" flag; the promise "comes back to QMS" is not implemented. | C (with NEW-03). |
| PI-25 | Stale approval applied to a new revision | P1 | **CLOSED** | An override stored for `S005@9.0` is not applied to Rev 1.0. Storage v2 is keyed number@revision. Covered by `routing-separation.spec.js`. | None. |
| PI-26 | "Last synced: just now" for a cached copy | P1 | **OPEN** | Server down while `onLine` is true: no offline indicator, and the second cached view says "just now". | C |
| PI-27 | Classification fixed at upload; restricted titles listed | P1 | **OPEN** | Upload hard-codes internal/en. **Employee:** Coiled Tubing lists 13 restricted or confidential titles; Home says 520 against 352 openable. | C (owner decision on listing). |
| PI-28 | Success shown when nothing was sent (offline) | P1 | **OPEN** | **Offline Upload:** "Submitted for review".<br>**Ask Expert, Critical safety:** a fake ticket number, nothing stored, no emergency route. | C (frontend part now). |
| PI-30 | New release / first install reloads mid-task | P1 | **OPEN** | **First install:** a double load at about 3 s.<br>**Mid-Upload:** a cache bump at step 3 reloads to step 1 and loses the file; the update bar never shows. | A |

### P2

| PI | Title | Prev | Status | Evidence | Recommended next action |
|---|---|---|---|---|---|
| PI-31 | Same person files and checks / approves | P2 | **CLOSED** (rule as decided) | Filer ≠ QMS checker ≠ final approver is enforced in the register and explained on the Workbench and the desk (journey E). See NEW-04 for the delegation-naming bypass. | None for the rule; see NEW-04. |
| PI-32 | Delegation gaps | P2 | **OPEN** | **Withdraw:** a no-approval delegate and a forms-only delegate can still withdraw (and edit).<br>**90-day limit:** depends on the time of day.<br>**Revoke:** no confirmation, and the history is hidden. | C |
| PI-33 | Software can be chosen but never filed | P2 | **CLOSED** | Software is not offered on Upload; the register refuses it. | None. |
| PI-34 | Translations not tied to their source | P2 | **CLOSED** | Journeys C and F: supersede and withdraw cascade; re-issue works. | None. See NEW-06. |
| PI-35 | "undefined" pill; bulletins badged SOP | P2 | **OPEN** | "undefined (17)"; a bulletin badged "SOP". | A |
| PI-36 | Document Search problems | P2 | **OPEN** | The query is dropped on a filter change; no Bulletin filter; "Draft" offered to an Employee; the phone Filters button is at x 494. | A |
| PI-37 | Long filename pushes ✕ off-screen | P2 | **OPEN** | ✕ at x 715–996 on a 390 px screen. | A |
| PI-38 | File fingerprint goes stale | P2 | **PARTIALLY FIXED** | **Open:** the hash stays after the file is removed.<br>**Not reproduced:** the race.<br>**Still true:** the whole file is read into memory. | A |
| PI-39 | Ask Expert validation | P2 | **OPEN** | Whitespace-only text accepted; a sixth photo dropped silently; a 12 MB photo accepted. | A (+B) |
| PI-40 | Upload state lost or leaking | P2 | **OPEN** | No leave warning; after a Policy the area field is hidden; after a Bulletin, functions stay disabled. | A |
| PI-41 | Bookmarks | P2 | **PARTIALLY FIXED** | **Fixed:** keyed by number, and a withdrawn document opens with its banner.<br>**Open:** silent drop at 50; no status in the panel; wrong area from links without `seg`. | A |
| PI-42 | Master List side "Dashboard" link | P2 | **OPEN** | The Auditor is refused; QMS lands on the last-used area. | A |
| PI-43 | Large queues | P2 | **OPEN** | "14 of 52" while 15 rows are shown; no sort; the phone desk is 13,606 px with no pager. | A |
| PI-44 | Ask Expert gets no area / document context | P2 | **OPEN** | Every link is a bare `support-ticket.html`. The page honours `?area=&dept=`. | A (+B) |
| PI-45 | Published Documents is a dead end | P2 | **OPEN** | No row links; "withdraw" matches every row; an unknown id renders a page; "1 documents". | A |
| PI-46 | Arabic search finds almost nothing | P2 | **OPEN** | Arabic words return 0; type names are not searchable. | C |
| PI-47 | Maintenance header total leaves out bulletins | P2 | **OPEN** | Header 1 against tabs 3. | A |
| PI-48 | Offline bars cover the bell and menu | P2 | **OPEN** | Three bars, 100–113 px; on Home and the Master List the bell and menu hit-test to the bar. | A |
| PI-49 | Stale desk says "You cannot countersign" | P2 | **OPEN** | A role error on a stale card; the record is not corrupted. | C (If-Match in production). |
| PI-50 | Unknown URLs show "You're offline" | P2 | **OPEN** | **Live Azure:** `/some-unknown-path` returns 200 "You're offline". | A (config). |
| PI-51 | iPhone pager scroll / JS offsets | P2 | **OPEN**; "lands at bottom" CANNOT VERIFY | **After "Next →":** the first card is hidden by 37 px in a tab and 84 px installed.<br>**Code:** hard-coded offsets remain. | A + device check. |
| PI-52 | Landscape notch / home indicator (suspected) | P2 | **OPEN** from the code; CANNOT VERIFY | No bottom safe-area inset on any bottom bar or toast. | A + device check. |
| PI-53 | Register data gaps | P2 | **CLOSED** | **Checker and gate:** `scripts/check-register.js` plus the baseline; the CI gate fails on any new finding.<br>**Live register:** 0 new findings after journeys A–G.<br>**Legacy data:** intentionally not cleaned (QMS cleanup report).<br>**Note:** the checker does catch NEW-03 on a live register. | QMS cleanup of the 302 legacy items (owner). |
| PI-54 | Delegation reason "."; self-naming; today refused | P2 | **OPEN** | All three still reproduce. | A |

### P3

| PI | Title | Prev | Status | Evidence | Recommended next action |
|---|---|---|---|---|---|
| PI-55 | Ctrl/Cmd-click opens in the same tab | P3 | **OPEN** | On the segment, viewer and Home handlers. | A |
| PI-56 | Geothermal CoE filed as a Corporate Function | P3 | **OPEN** | `group:'function'`. | A, B (owner) |
| PI-57 | "Your submissions" bell entries go nowhere | P3 | **OPEN** | A button with no link. | A |
| PI-58 | "Under review" reads five ways | P3 | **OPEN** | "CURRENT + banner", "REVIEW DUE", "Under review · review overdue", "Under Review", "Review overdue, 8 months". | A |
| PI-59 | Upload polish | P3 | **OPEN** | The step lamp jumps; the summary shows "650/500"; ZIP is missing from the sidebar. | A |
| PI-60 | Touch and toast polish | P3 | **OPEN** | A 369 px toast at 320; a 15×15 checkbox; "Clear" has no confirmation; immutable unhashed fonts and icons. | A |
| PI-61 | Segment modal × under the status bar | P3 | **OPEN** | The × hit-tests to the status bar when installed; the bottom Close works. | A |

### Test-suite blind spots (from the original audit)

| TB | Status | Note |
|---|---|---|
| TB-01, TB-02, TB-12 | **CLOSED** | Real delegated-approval tests (`integrity-p1`), a two-tab number test (`doc-identity`) and revision filing through the screens (`revision-control`). |
| TB-04 | OPEN | The installed-app spec still covers the bell only. |
| TB-05 | OPEN | CI runs desktop Chromium only; Pages and Azure deploy with no test gate. |
| TB-06 | OPEN | No service-worker update test. |
| **TB-13** | **OPEN: fails on 17 Oct 2026** | `segment.spec.js:265-299` depends on `TQ-GEO-M003` being due 2026-10-16. A clock replay passes on 16 Oct and **fails on 17 Oct**, so CI will turn red in 12 days with no code change. |
| Others | Not reassessed | Unchanged by PRs #26–#29. |

---

## 4. New findings

| ID | Sev | Finding | Evidence | Origin | Fix |
|---|---|---|---|---|---|
| **NEW-01** | **P1** | **A stale Approve or Confirm releases a revision the signer never saw.** The desk card and the Workbench carry only the number, and the register acts on whichever revision is open now. | **Repro:** the Director's card shows "CONTENT A"; in another tab A is rejected and "CONTENT B" is filed and checked; Approve on the stale card publishes **B**, signed "Segment Director". QMS Confirm behaves the same.<br>**Code:** `dashboard.html:1180`, `master-list.html:1385`, `store.js:457`.<br>**Confirmed by the lead.** | Exposed by revisions (2A-2) | C: act on an exact number + revision (or record id) and refuse if it changed; If-Match in production. |
| **NEW-02** | **P1** | **A withdrawn document comes back into force through a revision already in flight.** Withdrawing by number takes the revision in force but leaves the open revision in the queue; nothing tells the desk, and approving it makes the number Current again. Contradicts "a withdrawn document is not revised" and "a withdrawn number is retired" (BUSINESS-RULES §8, §16). | **Repro:** `SOP-007` Rev 2.0 filed and checked; Director withdraws Rev 1.0 (the same `setStatus` the Withdraw button calls); the desk still offers Rev 2.0 with no warning; Approve → Rev 2.0 Current, Rev 1.0 obsolete with no successor. Four engines. | 2A-2 | C: on withdrawal, cancel or hold the open revision with a recorded reason (or refuse approval when the line is withdrawn); say so in the Withdraw dialog. |
| NEW-03 | P2 | **A rejected revision and its re-filing get the same number and revision.** The returned filing's `&rev` link opens the other record. | **Repro:** two records `SOP-011 Rev 4.0`; the live integrity checker reports a fresh `duplicate-number-revision`.<br>**Code:** `store.js:338`, `findRev`. | 2A-2 | A (with PI-24): resubmit on the same record, or number past returned siblings. |
| NEW-04 | P2 | **Separation of duties can be bypassed through delegation naming.**<br>• A Director can delegate to his own name and approve his own filing.<br>• A delegate named "QMS / Document Controller" can approve what that identity checked.<br>• In the prototype any role can act under any delegation, so an Employee acting as "Deputy Director" approved its own filing. | **Code:** `roles.js:410-421` compares whole name strings; `grant()` accepts any name. Journey E6 and G1 b2. | 2A-3 / prototype identity | C: refuse a delegate equal to the grantor; compare the delegate's identity with filer and checker. **PRODUCTION CONTROL REQUIRED:** Entra object ids (decision D2). |
| NEW-05 | P2 | **The bell remembers "seen" by number, not revision.** After Rev 2.0's approval was seen, Rev 3.0's approval never appears; a later rejection would be hidden the same way. | `shared.js:1698-1700` (`docNumber + ':approved'`). | 2A-2 regression | A: key by number + revision. |
| NEW-06 | P2 | **A translation waiting to be re-issued disappears from search**, and an exact-number search says "check the document number". | `search-index.js:40`. | 2A-2 | A (with PI-22). |
| NEW-07 | P2 | **The F086 export cannot evidence approval or rejection.**<br>• No approved-by, checked-by or rejection columns.<br>• A rejected draft exports as plain "draft".<br>• An unreleased draft shows an "Issued" date.<br>Revision rows and statuses do match the register (564 rows). | `master-list.html:1491-1496`. | Pre-existing | C. **PRODUCTION CONTROL REQUIRED.** |
| NEW-08 | P3 | Search cards show no revision; two cards share one number while a revision is open. | `ai-search.html:1013-1030`. | 2A-2 | A |
| NEW-09 | P3 | The Maintenance side repeats the whole segment's "Awaiting Approval" (5 against 1) and shows it to Employees. | `segment.html:1608-1619`. | PI-20 class | A |
| NEW-10 | P3 | The Director's desk "Published" includes maintenance documents (40 against 37). | `dashboard.html:1040-1041`. | 2A-3 department split | A |
| NEW-11 | P3 | Tests added in PRs #28/#29 overrun 30 s on the iPhone profile. They would flake if that profile joined CI. | `revision-control:46`, `routing-separation:46/71`. | Tests | A |
| NEW-12 | P3 | On its due date a card reads "Review due soon, 0 days". | Clock replay, 16 Oct. | Copy | A |

**Regressions.** None of the 12 closed findings has regressed. Every previously working journey still works. NEW-05 is the only true regression: the bell's "seen" memory predates revisions and was not updated when PR #28 made the same number carry several revisions. NEW-01, NEW-02, NEW-03, NEW-06, NEW-08 and NEW-10 are gaps at the edges of the new revision and department model, not breakage of earlier behaviour.

---

## 5. Recommended NEXT PR group

### PR 2B: Decision integrity ("an approver acts only on what they saw, once, on purpose")

The evidence points here rather than to the next item on the old roadmap. The two P1s the reassessment found (NEW-01, NEW-02) and the two oldest unresolved P1s that sit on the same click path (PI-07, PI-06) are all ways for a controlled document to be released, or a QMS attestation recorded, without a person deciding on the content in front of them. They share code (the desk card, the Workbench, `approve` / `countersign` / `setStatus`), so one PR can fix and test them together.

| Item | Sev | What the fix must do |
|---|---|---|
| NEW-01 | P1 | **Decision target:** desk and Workbench decisions carry the exact number + revision (or record id); the register refuses when the record changed since it was shown, and the screen says what changed.<br>**PI-49:** the stale message names the real state instead of a role error. |
| NEW-02 | P1 | **Withdrawal with a revision open:**<br>• the Withdraw dialog names any open revision;<br>• withdrawal holds or cancels it with a recorded reason;<br>• approval of a revision whose line is withdrawn is refused.<br>Needs a one-line owner decision: cancel the open revision, or block withdrawal until it is decided. |
| NEW-03 | P2 | **Resubmission:** a re-filing after a rejection never reuses an existing number + revision, and a returned filing's link opens that filing (the PI-24 resubmission part). |
| PI-07 | P1 | **Workbench keys:** held or repeated Enter cannot confirm more than one document; no auto-focus onto Next; Confirm is armed only after the document has painted. |
| PI-06 | P1 | **Upload submit:** Upload files only from the review step; Enter on steps 2–3 never files; a malformed number never files (the PI-14 validation part). |
| PI-12 (frontend part) | P1 | **What the approver sees before releasing:** Preview opens the exact revision in the viewer; the card says "Replaces Rev N"; Approve asks for confirmation, naming the document and revision. |
| NEW-05 | P2 | **Bell memory:** the bell's "seen" memory is keyed by number + revision. |
| **TB-13** | P3, urgent | **Test date:** replace the dated register row in `segment.spec.js:265-299` with a seeded row or a frozen clock, **before 17 Oct 2026**, or CI turns red with no code change. Test-only. |

**Size:** comparable to PR 2A-2. No business rule changes except the NEW-02 decision.

**Out of scope:** counts, overdue logic, search, phone and offline work.

**Production controls to record alongside:**
- approvals bound to a file version and hash (PI-12);
- If-Match / ETag on every decision (NEW-01, PI-49);
- decisions keyed by Entra object id (NEW-04).

**Status after PR 2B (owner's decisions of 5 Oct 2026).** Addressed in the prototype, with regression tests in `tests/decision-integrity.spec.js` and the rules in `BUSINESS-RULES.md` §7, §8 and §18:
- **NEW-01 / PI-49 (stale part):** every desk, Workbench and bulk decision is bound to the exact record and step shown; a changed record is refused with nothing written and an honest message. Production: item ID + version + If-Match.
- **NEW-02:** withdrawal cancels the open revision (and its translations' open revisions) with the reason "Cancelled because the document family was withdrawn."; the Withdraw dialogs say so beforehand.
- **NEW-03:** a returned revision filed again is the same revision, next attempt, with its own record id; the returned attempt stays as history.
- **PI-07, PI-06, PI-12 (prototype part), NEW-05** and **TB-13** as specified above.
- **Not in 2B:** the PI-06 number-validation part (PI-14) and the rest of PI-24 stay in 2C; PI-12's file and hash binding is production work.

**Status after PR 2C-1 (owner's decisions of 5 Oct 2026).** PI-11 (withdrawal record and required reason), PI-10 (bulk withdrawal on exact records), PI-21 (approval and effective dates, with a future effective date), PI-24 (Returned state; a returned first issue filed again keeps its number as its next attempt), PI-13 (advisory duplicate warnings with reasons, file fingerprints recorded) and PI-14 (number validation for new filings) are addressed in the prototype; tests in `tests/record-truth.spec.js`, rules in `BUSINESS-RULES.md` §7, §8, §16, §19. NEW-04, PI-32 and PI-54 (delegation) remain for 2C-2.

**Status after PR 2C-2 (owner's decisions of 5 Oct 2026).** NEW-04 (separation of duties on actor identities, never display names; a grant is taken up only in the session that made it; the prototype refuses where it cannot tell people apart, and the Entra object id is the production control), PI-32 (approval and Manage documents as separate permissions; area, department and type scope on approve, reject, edit and withdraw; calendar-date validity; revocation confirmed, recorded and kept; stale tabs refused) and PI-54 (grant evidence, 20-character reason, validated dates and scope, no self-naming, legacy grants readable) are addressed in the prototype; tests in `tests/delegation-integrity.spec.js`, rules in `BUSINESS-RULES.md` §9 and the identity note in §17.

**After 2B, in this order** (proposed, for your decision later):
1. **2C: Record truth.** PI-11 withdrawal record and honest trail; PI-10 bulk withdraw over drafts; PI-21 release dates; the rest of PI-24 (Returned state, not pending); PI-13 duplicate detection; PI-14 number validation; NEW-04 delegation-naming guard; PI-32 delegate withdraw/type limits; PI-54.
2. **2D: Phone and installed-app reliability.** PI-08 drawer close; PI-18 Back; PI-30 update reload; PI-48 offline bars; PI-26 / PI-28 honest offline state; PI-61, PI-51; plus TB-04 / TB-06 tests and adding a WebKit job to CI (TB-05).

---

## 6. Browser and device results

**A) New failures: 0.**

**B) Known pre-existing failures**, the same as before PR #29:
- WebKit: `master-list.spec.js:31` × 3 and `release-journey.spec.js:152` (readyState timeout on refusal pages).
- iPhone 14:
  - the same 4;
  - `installed-app.spec.js:135` and `mobile.spec.js:96` × 3, where the iPhone Safari install sheet intercepts the bell and menu (the original TB-05 example).

**C) Environment or timing:**
- `offline.spec.js:277/303` (WebKit internal error under `setOffline`).
- iPhone-profile timeouts that pass on re-run or with a longer timeout (`release-journey:48`, `revision-control:46/100`, `routing-separation:46/71`); see NEW-11.

**Already fixed:** the 12 CLOSED findings above.

**Runs:**

| Run | Result |
|---|---|
| Repository suite, desktop Chromium | 581 passed, 0 failed, 1 skipped |
| WebKit desktop, phone/WebKit subset (115 tests) | 109 passed; 6 failed (4 B, 2 C) |
| iPhone 14, same subset (115 tests) | 100 passed; 15 failed (8 B, 7 C) |
| Journeys A–G | Pass on all four profiles |

**Needs a real iPhone:** PI-18 (back-forward cache), PI-51 ("lands at the bottom"), PI-52 (landscape safe areas).

---

## 7. For the QMS Dashboard work later

These are real, but they are best fixed when the QMS Dashboard redesigns counts, queues and the register view, rather than patched now.

**Counts and overdue:**
- PI-20 counts ≠ destinations, including desk repaint;
- PI-19 one overdue rule;
- NEW-09 Maintenance "Awaiting Approval";
- NEW-10 Director "Published";
- PI-47 Maintenance header.

**Queues and navigation:**
- PI-43 large queues, sort, "x of N";
- PI-17 "Open your queue";
- PI-42 Master List "Dashboard" link;
- PI-45 Published Documents (row links, search, wording);
- PI-35 "undefined" pill and bulletin badge;
- PI-57 "Your submissions" links.

**Register and export:**
- NEW-07 F086 approval and rejection columns;
- PI-58 one status vocabulary;
- PI-22 / NEW-06 / NEW-08 exact-number search over superseded, withdrawn and re-issued records, and revisions on search cards (if the Dashboard owns register search).

**Production-only (M365) items to carry into the IT build list:** PI-12 (file binding), PI-26 / PI-28 (offline truth), PI-27 (sensitivity labels), PI-46 (Arabic search), PI-49 / NEW-01 (If-Match), NEW-04 (Entra identity), NEW-07 (audit export from the audit log).
