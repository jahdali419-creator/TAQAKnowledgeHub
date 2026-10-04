# RISE: Product-Integrity / Real-User Failure Audit

| | |
|---|---|
| **Baseline** | `main` at `12ce777`. This includes PR #23 (global QMS queue, one file per upload, bulk-confirm preview), PR #24 (QMS Workbench) and PR #25 (installed iPhone app status-bar fix). |
| **Date** | 4 October 2026 |
| **Scope** | The whole prototype, audited for every role (Employee, Segment Director, Maintenance Manager, QMS, External Auditor) on desktop Chromium, phone (Pixel 7 / iPhone 13 emulation, 390 and 320 px), the iPhone WebKit engine, and a simulated installed app. |
| **Method** | Six adversarial audits ran in parallel: upload and forms; approval workflow, roles and destructive actions; data integrity, counts and duplicates; navigation, filters, empty and large data; phone, PWA, cache and rapid actions; test-suite blind spots. Each finding was reproduced in a browser or traced to the exact code line. The highest-impact findings were then re-verified independently (marked **V** below). |
| **Status** | Audit written before any fix. **Remediation, Priority 1 (in progress, not merged):** PI-05, PI-04 and PI-09 fixed in the prototype, with regression tests in `tests/integrity-p1.spec.js`; PI-31 recorded as an open business decision (`BUSINESS-RULES.md` §12 row 8). Each also needs its production control (`BUSINESS-RULES.md` §15). PI-05's full sweep found more sinks than the three listed below: see §15 there and Cybersecurity review pack §7. **Priority 2A-1 (in progress, not merged):** PI-01, PI-03 and PI-33 fixed in the prototype, tests in `tests/doc-identity.spec.js`, rules in `BUSINESS-RULES.md` §16. Every other finding is still open. |

A note on what this prototype is. It runs entirely in the browser: roles are a demo switch, the register lives in `localStorage`, and no file is stored. Several findings therefore cannot be "fixed" in this code. They describe a rule that the Microsoft 365 build must enforce on the server. Those are marked **PRODUCTION CONTROL REQUIRED**. They are still listed, because this code and its documents are the specification IT will build from. A gap in the prototype's rules becomes a gap in production if it is copied.

---

## Executive summary

**Counts (product findings):** **P0: 5 · P1: 24 · P2: 24 · P3: 7**. Test-suite blind spots are counted separately: 20, listed in their own section.

The workflows that were recently tested (QMS queue, Workbench, one file per upload, bell on the installed app) behave as designed on their main path. The serious problems are elsewhere, and they all fall into the class you described: **the screen allows something the record model does not handle, or the record ends up telling a different story from the screen.**

- **Document identity is not protected.** Upload shows "already exists" for a used document number, then files it anyway. Two upload tabs both get the same number. From then on every link, QR code, withdrawal and confirmation by that number can act on the wrong record.
- **Revision control does not work.** The "Revision / Update" option cannot be completed: a CSS fault keeps its section hidden. Even when it is forced open, approving a revision never retires the old one. Two "Current" versions of one procedure is the reachable outcome.
- **A withdrawn document can be shown as "Current, OK to use".** This happens when it is opened from a link that carries only a title (Home policy links, bookmarks, some QR codes). The viewer then reads the shipped data file, which knows nothing of the withdrawal.
- **Delegation adds power instead of handing it over.** A delegate given approval "without approval" can still approve. QMS acting under a Director's delegation can both check and finally approve the same document.
- **Text from one user runs as script in another user's browser.** Two places do this (the upload "Supersedes" list and segment-page search highlighting). In production that would let any contributor act in an approver's session.
- **The QMS Workbench I built in PR #24 has a defect.** Holding or repeating Enter confirms document after document without review. Verified: ten Enter presses recorded five QMS checks.
- **Counts disagree with destinations in many more places** than the bell case already fixed. The Director and Maintenance Manager bell "Open your queue" link opens a refusal page from any other segment's page.
- **The prototype's register functions accept anything.** From the browser console you can file a document straight to "Current", change a document's number or area after approval, choose the signature name, grant yourself a delegation, or wipe all records. None of this is reachable through normal screens, but it is the API contract IT has been given.

Nothing here suggests the overall design is wrong. Most fixes are local. But several P0s would cause real compliance failures in a controlled-document system, and the automated suite would not have caught any of them.

---

## Top 10 risks

| # | Risk | ID | Sev |
|---|---|---|---|
| 1 | A reused document number makes links, QR codes, withdrawals and confirmations hit the wrong record | PI-01 | P0 |
| 2 | Two Current revisions of the same procedure: revision filing is broken and approval never supersedes | PI-02 | P0 |
| 3 | A withdrawn document is shown as "Current, OK to use" (title-only links, bookmarks, QR) | PI-03 | P0 |
| 4 | Delegation escalates authority: a no-approval delegate approves; QMS can check and approve the same document | PI-04 | P0 |
| 5 | Stored script injection from document titles into other users' pages (upload, segment search) | PI-05 | P0 |
| 6 | Repeated Enter in the QMS Workbench confirms the queue without review (introduced by PR #24) | PI-07 | P1 |
| 7 | Approvers release documents they cannot see: no file, dead "Preview Document", no confirmation | PI-12 | P1 |
| 8 | Withdrawal leaves no who/when/why, and the viewer's approval trail shows withdrawn drafts as approved | PI-11 | P1 |
| 9 | Bulk Withdraw silently cancels in-flight drafts out of the approval queue | PI-10 | P1 |
| 10 | A maintenance procedure uploaded from the normal Upload button routes to the Segment Director, not the Maintenance Manager | PI-16 | P1 |

---

## Confirmed versus suspected

All findings are **CONFIRMED** (reproduced in a browser or proven from code) **except PI-52**, which is **SUSPECTED / NEEDS DEVICE VERIFICATION**. Where a finding was reproduced only from the browser console and not through normal screens, it says "console".

Legend for the "Fix" column used throughout:
- **A** = frontend fix now
- **B** = Microsoft 365 production
- **C** = both

---

## P0 findings

### PI-01: Duplicate document numbers are accepted; afterwards actions hit the wrong record (V)

**Classification:** P0 · confirmed bug · CONFIRMED · any submitter, then QMS / Director / everyone · upload → viewer, Workbench, documents, Master List · desktop, phone, PWA. **PRODUCTION CONTROL REQUIRED.**

**Reproduce:**
1. **Typed number.** Upload as Employee, Coiled Tubing / SOP, Edit the number to `TQ-TWS-CTSS-SOP-002` (in force, "BHA Assembly Procedure"). The field says "✕ already exists", but Continue and Submit still work. *Verified: two records now carry SOP-002 and `findDoc` returns the new draft.*
2. **Two tabs.** Open Upload in two tabs, choose the same area and type. Both show `…-SOP-013`. Submit both: two records with -013.
3. **Draft auto-save.** A half-finished upload restores an old auto-number without re-checking it.
4. **Withdrawn numbers are treated as free.** For example, `TQ-TWS-CTSS-SOP-012` can be re-filed.
5. **Policies.** The check compares against the previous area's list, so `TQ-QHSE-P007` shows "✓ ID available".

**Actual:**
- `viewer.html?doc=TQ-TWS-CTSS-SOP-002` (what links and QR codes use) opens the new draft: "Submitted for approval, not in force yet". An old QR code for withdrawn SOP-012 lands on a draft instead of "Obsolete, do not use".
- Withdrawing SOP-002 as QMS withdraws the draft. The live document stays current and can no longer be withdrawn by number.
- With two -013 drafts, QMS opens one in the Workbench and presses Confirm, but the store confirms the other. The first is then permanently stuck.

**Impact:** a live procedure can be hidden from the shop floor. Approvals and withdrawals land on content nobody reviewed.

**Root cause:**
- `upload.html:1072-1103`: `submitUpload` does not check the duplicate.
- `upload.html:1441-1456, 1499-1520`: the check only warns, covers one segment, and skips withdrawn documents.
- `store.js` `add()` has no uniqueness check.
- `store.js:280-284`: `findDoc` returns the last match.
- Desks and the Workbench act by number.

**Fix C.**
- **Frontend now:** block a duplicate in `submitUpload` and in `TAQA_STORE.add()` across the whole register, including withdrawn, former and legacy numbers. Re-derive the auto-number at submit. Make `findDoc` fail loudly on a second match.
- **M365:** server-allocated numbers (a counter list or function), a unique `DocNumber` column, and actions keyed on the immutable SharePoint item ID, never the number.

**Recurrence test:**
- A typed existing number, a withdrawn number, a policy duplicate, and a two-tab race are all refused.
- Every `docNumber` occurs at most once after a full test run.
- Workbench Confirm changes only the displayed record.

### PI-02: Revision control is broken: the Revision option cannot be used, and approval never supersedes (V)

**Classification:** P0 · confirmed bug · CONFIRMED · any submitter, QMS, Director · upload → desk → every list · all platforms.

**Reproduce:** Upload, step 2: choose "Revision / Update". The "Supersedes" picker stays invisible and Continue stays blocked with "Choose the document this revision replaces". So the only way through is "New Document".

**Actual (with the picker forced visible):**
- The revision gets a **new** number with `revision: null`.
- `supersedes` stores a free-text string ("number + two spaces + title").
- The picker lists drafts and documents of other types.
- After QMS and Director approval, the new record is Current **and the old revision stays Current**. Nothing anywhere sets `superseded` / `supersededBy`, though the form promises "the selected document will be archived when this revision is approved" (`upload.html:642`).
- Choosing a document under Revision, then switching back to New, leaves `supersedes` stored.

**Impact:** two procedures in force for the same task. This is the core ISO 9001 7.5.3 / API Q2 4.4.3 obsolete-document control.

**Root cause:**
- `upload.html:323` CSS sets `display:none`. `setDocStatus` (`:1488`) sets `style.display=''`, which falls back to that rule.
- `store.js` `approve()` has no supersession step.
- The revision model is undefined: the shipped data keeps one row per number, while upload mints new numbers.

**Fix C.**
- **Frontend:** make the section actually show. A revision keeps the parent number and takes revision + 1. `supersedes` holds the number only. Limit the picker to current or under-review documents of the same type and department. Clear `supersedes` when "New" is chosen. Refuse a second open draft against the same parent. `approve()` atomically supersedes the parent and its `-AR` translations.
- **M365:** one SharePoint item per document with major versions. The approval flow promotes the new version and retires the old one in the same transaction.

**Recurrence test:**
- File a revision through the UI, confirm, approve.
- Exactly one Current record in the family; the old one is `superseded` with `supersededBy` set; revision = old + 1.

### PI-03: A withdrawn document is shown as "Current, OK to use" from title-only links (V)

**Classification:** P0 · confirmed bug · CONFIRMED · Employee (any reader) · viewer, reached from Home policy links, bookmarks, the Master List "Open document", and QR or share links · all platforms.

**Reproduce:**
1. QMS withdraws a policy (e.g. Health Protection Policy, number `TQ-QHSE-P###`).
2. An Employee opens it from Home, or from `viewer.html?seg=company&type=policy&title=Health%20Protection%20Policy`.
3. Or: bookmark `TQ-QHSE-SOP-004` from the viewer, withdraw it, then open the bookmark.

**Actual:** "Status: Current, OK to use", no withdrawn banner, Download enabled.

**Impact:** withdrawn content used at the point of work, the exact failure document control exists to stop.

**Root cause:**
- `viewer.html:972-975`: when `doc` is missing or unresolvable, the viewer looks the title up in `TAQA_MASTER_DOCS` (the shipped file), ignoring withdrawals held in the store. The last fallback matches a title in any area.
- `viewer.html:891`: the number sanitiser strips `#`, so `TQ-QHSE-P###` becomes `TQ-QHSE-P`.
- Home omits `&doc=` for provisional numbers (`index.html:2424`).
- Viewer-saved bookmarks store the title only (`shared.js:846`).

**Fix A, then B.**
- **Frontend:** the fallback must use `TAQA_STORE.all()` and the same area only. Every link, bookmark and QR code carries the number. Allow `#`, or retire placeholder numbers.
- **M365:** QR codes and links target an immutable item ID.

**Recurrence test:** for each link builder (Home, bookmark, share/QR, Master List, segment, search), withdraw the document and assert the viewer shows the withdrawn banner and Download is disabled.

### PI-04: Delegation adds to the holder's own powers instead of replacing them (V)

**Classification:** P0 · design weakness / confirmed bug · CONFIRMED · Director, Maintenance Manager, QMS · dashboard (delegation box, desk) · all platforms. **PRODUCTION CONTROL REQUIRED.**

**Reproduce (a), through the UI:**
1. A Director grants a delegation with "Include the approval signature" unticked, then clicks "Act as this".
2. The banner reads "…without approval", but the desk still shows Approve.
3. Approve releases the document as "<delegate> (delegate for <Director>)".

**Reproduce (b), console:**
1. QMS calls `TAQA_DELEGATION.actAs(<a Director's delegation>)`.
2. `effective()` returns `{approve:true, countersign:true}`.
3. QMS files, checks and finally approves the same document.

**Expected:** BUSINESS-RULES §4 says QMS "never gives final approval, including when acting under someone's delegation". A delegate gets only what was delegated.

**Root cause:** `roles.js:566` `cap.approve = cap.approve || (…)` merges the delegation with the role's own powers, and `countersign` is never cleared while acting.

**Impact:** a no-approval delegate approves. Both release steps can collapse into one person.

**Fix C.**
- While acting, take capability from the delegation only: `approve = includesApproval && grantor.approve`, `countersign = false`. Refuse approval by whoever countersigned the same document.
- **M365:** delegation as an Entra or approvals-list grant evaluated server-side.

**Recurrence test:** a no-approval delegate sees no Approve button and `approve()` refuses. QMS acting as a delegate cannot approve.

### PI-05: Stored script injection from document titles (V)

**Classification:** P0 · confirmed bug (security) · CONFIRMED · any filer → any later uploader or reader · `upload.html` (Supersedes list, "Related IDs" line), `segment.html` (tab search highlight) · all platforms.

**Reproduce:**
1. File a document titled `Pump "><img src=x onerror="window.__x1=1">`.
2. Open Upload, choose that area and type: the script runs (`window.__x1 === 1`).
3. Separately: a live title with markup renders safely on the segment page until "pump" is typed in the tab search, when it runs.

**Impact:** in production, titles come from other users. Script running in a QMS or Director session can confirm, approve or withdraw in their name.

**Root cause:**
- `upload.html:1495` builds `<option value="${t}">${t}</option>` unescaped.
- `upload.html:1515` does the same for the "Related IDs" list.
- `segment.html:2217` does `t.innerHTML = t.textContent.replace(…)`, turning escaped text back into markup. The bell had this exact fault and it was fixed there.

**Fix A, plus B.**
- **Frontend:** escape, or use `textContent` / DOM option nodes. Reuse the escape-then-highlight helper from `glossary.html`.
- **M365:** server-side title validation and a strict CSP.

**Recurrence test:** a markup title on the register never executes in the Supersedes list, Related IDs, segment search, the bell or the Workbench.

---

## P1 findings

### PI-06: Enter files the upload before the review screen is shown (V, code)

- **Where:** P1 · confirmed bug · CONFIRMED · any filer · upload · desktop; the phone keyboard "Go" key too.
- **Reproduce:** on step 3, press Enter in Title or Keywords. A record is filed although step 4 ("Check the record") was never shown. On step 2, press Enter after editing the number to "9": a record numbered "9" is filed.
- **Root cause:** all panels sit in one `<form onsubmit=submitUpload>` (`upload.html:571`), and `submitUpload` does not check the current step.
- **Fix:** A. Require step 4 (review painted) in `submitUpload`; suppress implicit submit.
- **Test:** Enter in each step-2 and step-3 field adds 0 records.

### PI-07: Repeated Enter in the QMS Workbench confirms the queue without review (V)

- **Where:** P1 · confirmed bug, **introduced by PR #24** · CONFIRMED · QMS · Master List Workbench · desktop, tablet keyboard.
- **Reproduce:** open a waiting document (focus is on "Confirm QMS check") and press Enter repeatedly. *Verified: 10 presses at 40 ms recorded 5 QMS checks (queue 12 → 7).* Holding Enter cleared 12 → 0.
- **Root cause:** after a decision, focus moves to "Next document" (`master-list.html:1431`). Opening the next document focuses Confirm again (`:1290`). There is no guard on repeated or held keys.
- **Impact:** a QMS conformance attestation is recorded for documents shown for milliseconds. It is P1, not P0, only because the Director's approval still gates release.
- **Fix:** A. Do not auto-focus Next after a decision; ignore `e.repeat`; disable Confirm briefly after each document paints.
- **Test:** 30 Enter presses at 33 ms → at most 1 countersignature.

### PI-08: Installed iPhone app: the Workbench / record drawer cannot be closed (V, code)

- **Where:** P1 · confirmed bug · CONFIRMED in the installed-app simulation · QMS, Auditor · Master List · PWA on phone.
- **Actual:**
  - The drawer is `position:fixed; top:0` (`master-list.html:487`), above the bar.
  - Its × sits at y 16–60 under the status bar, and the full-width drawer leaves no scrim to tap.
  - The only ways out are Confirm, Reject, or leaving the page.
- **Same class:** the `segment.html:568` document modal (a bottom Close button exists, so P3).
- **Why it was missed:** PR #25 fixed the header but not overlays drawn above it.
- **Fix:** A. Pad the drawer header by `env(safe-area-inset-top)` (or start it at `--nav-h`); add a Close button in the footer.
- **Test:** every top-anchored overlay's close control must be hit-testable below 47 px in `installed-app.spec.js`.

### PI-09: The register functions accept forged lifecycle, identity and authority (console)

- **Where:** P1 · design weakness / API-contract gap · CONFIRMED (console) · Employee, Auditor, QMS, Director, Maintenance Manager · any page · all platforms. **PRODUCTION CONTROL REQUIRED.** It would be P0 in production if the server copies this contract.
- **Actual:**
  - **`add()`:** files `status:'current'`, `approvedBy`, `countersignedBy` and `submittedBy` as given, so a document goes straight to "Current". An Employee can also file a Policy (Upload says QMS only), several files, or a maintenance department in a corporate function.
  - **`setStatus()`:** any transition. A draft can go to "under-review", which counts as live; a withdrawn document can come back; a current document can go back to draft keeping its old approval; and arbitrary strings are accepted.
  - **`patch()`:** can rewrite number, area, department, type, files and revision on an approved document. SOP-007 vanished and two records carried SOP-022.
  - **`countersign` / `approve`:** accept a caller-chosen signature name.
  - **`TAQA_DELEGATION.grant` / `revoke`:** trust the caller's role and area. An Employee can grant itself Director power; anyone can revoke.
  - **`TAQA_STORE.reset()`:** wipes every filing and approval, and is exported.
  - **`reject()`:** accepts a 1-character reason; the UI requires 20.
- **Root cause:**
  - `store.js:207-226` (add)
  - `store.js:245-271` (setStatus)
  - `store.js:372-385` (patch)
  - `store.js:291-344` (signer parameter)
  - `roles.js:476-522` (grant / revoke)
  - `store.js:416-439` (reset)
- **Fix:** C.
  - `add()` forces draft at the QMS stage and strips lifecycle fields.
  - `setStatus` uses an allow-list of transitions.
  - `patch` uses an allow-list of fields, with none on current documents beyond review metadata.
  - No signer parameter; `grant` / `revoke` check the caller; remove `reset` from the export.
  - Document all of this as server rules.
- **Test:** each forbidden call returns refused and leaves the record unchanged.

### PI-10: Bulk Withdraw cancels in-flight drafts silently

- **Where:** P1 · confirmed bug · CONFIRMED · QMS · Master List (including the Waiting on QMS view) · desktop and phone.
- **Actual:**
  - Ticking drafts and clicking "Withdraw selected" marks them obsolete, including drafts at the Director stage.
  - The dialog says they "leave the live list" (drafts were never live), names no titles, and asks no reason.
  - The submitter gets no notice, and the toast counts successes only.
- **Root cause:** `master-list.html:1107` treats anything not already withdrawn as eligible; `:1119-1125`; the bell notifies only on rejected or current.
- **Fix:** C. Exclude drafts from Withdraw. Offer an explicit, reasoned "cancel submission" if wanted, with a preview listing and per-document results like bulk confirm.
- **Test:** bulk withdraw over drafts leaves them untouched and names them as left out.

### PI-11: Withdrawal leaves no record; the trail and history show events that did not happen

- **Where:** P1 · confirmed bug · CONFIRMED · QMS, Director, Maintenance Manager; read by Auditor · documents, Master List, viewer, analytics · all platforms.
- **Actual:**
  - A withdrawal stores only `status:'obsolete'`: no who, when or why, and no reason is asked.
  - The viewer's approval trail shows a withdrawn **draft** with green "QMS check" and "Final approval" ticks (`viewer.html:1392-1395`). The 12 shipped drafts carry an `approvedDate` that also appears in the F086 export and in Analytics' "Approved" count.
  - The version history is synthesised. It includes invented notes such as "Incorporated feedback raised at internal audit". The only caveat is an HTML comment, and a superseded revision is tagged "CURRENT".
  - The analytics audit log shows roles instead of signers, dates releases at their old issue date, and omits rejections.
- **Fix:** C.
  - Record withdrawer, time and mandatory reason; draw them in the trail; show "never released" when there is no approval.
  - Remove `approvedDate` from drafts.
  - Label or remove synthetic history.
  - **M365:** an append-only audit log (SharePoint version history / Purview).
- **Test:** withdraw records actor and reason; a withdrawn draft's trail has no approval tick; the history shows a visible "illustrative" label or real data.

### PI-12: Approvers release documents they cannot see

- **Where:** P1 · confirmed bug plus production dependency · CONFIRMED · Director, Maintenance Manager, QMS · dashboard, Workbench, viewer · all platforms. **PRODUCTION CONTROL REQUIRED** (file binding).
- **Actual:**
  - "Preview Document" on desk cards does nothing (`dashboard.html:1159`, no handler) and the card has no link to the document.
  - Approve releases with one click, with no confirmation.
  - Uploads keep only the file name and size; the SHA-256 computed at upload is thrown away. The viewer shows "Preview not connected" and labels every document "<title>.pdf".
  - "Replaces →" and "EXACT DUPLICATE" never render, because the card never sets them (`dashboard.html:1080-1108`).
- **Fix:** C.
  - **Frontend:** link Preview and the title to the viewer, show "Replaces X", confirm before release naming the document, and block release when there is no file.
  - **M365:** approval bound to a specific SharePoint file version and hash.
- **Test:** Preview opens that number in the viewer; Approve asks for confirmation; the desk card for a revision shows "Replaces".

### PI-13: Duplicate and similarity detection never shows anything

- **Where:** P1 · confirmed bug · CONFIRMED · filers, QMS, Director · upload, dashboard · all platforms.
- **Actual:**
  - The similar-title and exact-duplicate panels on Upload use the same `display:''` → CSS `none` fault as PI-02 (`upload.html:299, 308, 1534, 1557`).
  - The file-fingerprint check reads `taqa-doc-hashes`, which nothing writes, so it always says "✓ Unique file". The same PDF was filed three times.
  - An identical title scores only 75%, because the number is part of the compared text.
  - Arabic is stripped to nothing, so an Arabic translation shows "100% match".
  - The desk hides exact-title matches (`dashboard.html:954`).
  - Only the Workbench "Same title already in this area" note works.
- **Fix:** C.
  - Show the panels. Distinguish **hard duplicates** (same number, same file hash, same number + revision: block) from **possibly related** (same or similar title, same or other area: warn).
  - **M365:** server-side hash index and title search.
- **Test:** the same file twice shows the duplicate panel; an existing title shows the similar-title panel; the desk flags an exact title.

### PI-14: Number integrity: stale number after changing area or type; free text accepted

- **Where:** P1 · confirmed bug · CONFIRMED · filers · upload · all platforms.
- **Actual:**
  - Click Edit on the number without typing, then switch Coiled Tubing/SOP to Fracturing/Form. The record is filed as `TQ-TWS-CTSS-SOP-013` labelled conformant.
  - "9" and "TQ-…-099 (draft)" are accepted as numbers, still marked conformant. The submitter's own "Your submissions" link then opens "no entry in the register".
- **Root cause:** `upload.html:1411, 1689` (a user flag set by a click alone); no format validation.
- **Fix:** A. Re-generate on area or type change unless the text was actually changed; validate the number stem against area and type; mark any manual number provisional for QMS. M365 assigns numbers in production (PI-01).
- **Test:** an Edit click followed by an area change re-numbers; a malformed number is blocked.

### PI-15: The approver named to the submitter is not who approves

- **Where:** P1 · confirmed bug / documentation gap · CONFIRMED · filers, approvers · upload review and toast · all platforms.
- **Actual:**
  - Lesson says "QHSE Manager", Manual "Subject Matter Expert", Alert "Corp Function VP / Director". In every case the area's Segment Director can approve.
  - Policy says "the CEO approves it", but the "Corporate Sponsor" (owner of `company`) approves.
  - This is already open as BUSINESS-RULES §12 #1; the test checks only the wording (TB-10).
- **Fix:** C. Owner decision, then route by type in the rules (Entra group per authority), or change the wording to match the routing.
- **Test:** for each type, assert who actually holds Approve.

### PI-16: A maintenance procedure uploaded from the normal Upload button goes to the Segment Director (V, code)

- **Where:** P1 · design weakness · CONFIRMED · Maintenance Manager, anyone on a Maintenance tab · upload · all platforms.
- **Reproduce:** as Maintenance Manager, click the top-bar Upload.
  - The area is blank and "Maintenance department document" is unticked.
  - After choosing area and SOP it is still unticked, so `department` is null.
  - After the QMS check, the Segment Director approves a maintenance procedure.
- **Root cause:** the box is ticked only by `?dept=maintenance` (`upload.html:1816`); the top-bar link carries no context (`segment.html:721`).
- **Fix:** C. Default the area to the user's area, tick the box for the maintenance role, and carry `seg` / `dept` on Upload links. **M365:** derive department from role or claim server-side.
- **Test:** maintenance role on plain `upload.html` → box ticked, area chosen.

### PI-17: Director / Maintenance Manager bell "Open your queue" leads to a refusal page (V, code)

- **Where:** P1 · confirmed bug · CONFIRMED · Segment Director, Maintenance Manager · any other segment's page · all platforms.
- **Reproduce:** as the Coiled Tubing Director with documents waiting, open `segment.html?id=drilling`, open the bell, then "Open your queue" (or "+N more").
- **Actual:** opens `dashboard.html?id=drilling`, "Managing an area is its director's desk", refused.
- **Root cause:** `shared.js` `openQueue()` uses the page's segment, not the signer's own. This is the same class as the QMS fix in PR #23.
- **Fix:** A. Use `effective().ownSegment` for an own-scoped role.
- **Test:** from another area's page the link lands on the signer's own desk and lists the badge's documents.

### PI-18: Pressing Back shows a blank, untappable page (V, code)

- **Where:** P1 · confirmed bug · CONFIRMED (Chromium with the back-forward cache on) · all roles · index, segment, viewer, ai-search, glossary, support-ticket, upload, analytics · all platforms, likely on iPhone.
- **Actual:** after following a link and pressing Back, the page is restored still faded out (`body.page-exit`: opacity 0, pointer-events none).
- **Why it was missed:** the test server sends `no-store`, which disables that cache; Azure does not.
- **Root cause:** the exit class is added on click (e.g. `segment.html:2328`) and never removed; there is no `pageshow` handler.
- **Fix:** A. On `pageshow` with `persisted`, remove `page-exit`. Also ignore Ctrl/Cmd-click (PI-55).
- **Test:** serve without `no-store`, navigate, go Back, assert opacity 1.

### PI-19: "Review overdue" means two different things

- **Where:** P1 · confirmed bug · CONFIRMED · QMS and all readers · Master List, search, Home, segment, dashboard, documents, analytics · all platforms.
- **Actual:**
  - 92 live documents are past their review date, but only 82 carry the `reviewOverdue` flag.
  - 8 of the missing 10 are CEO company policies (e.g. QHSE Policy `TQ-QHSE-P007`, due 2 Sep 2026). The "Review overdue" cut and filters miss them while the same rows say "N days late".
  - The Maintenance Manager's Home line counts the whole segment's overdue documents.
- **Root cause:** some screens use the shipped flag (`documents-master.js:996`, `search-index.js:61`, `store.js:189`), others compute from the date.
- **Fix:** A. One date-based overdue helper everywhere, excluding drafts. **M365:** a calculated column or scheduled flow.
- **Test:** with a frozen date, the overdue count equals the rows showing "late".

### PI-20: Counts and badges count different populations from what they open

- **Where:** P1 · confirmed bug · CONFIRMED · all signer roles; Auditor · bell, Home, dashboard, segment, Master List · all platforms.
- **Actual:**
  - The bell treats **every record filed in this browser** as "Your submissions" for every role (`shared.js:1664-1676`, `upload.html:1768`).
    - QMS bell 14 against a queue of 12.
    - A Director's bell 2, with "Nothing waiting right now".
    - The Auditor, who cannot file, gets a bell showing an employee's rejection reason.
  - "Awaiting QMS Approval" on Home and the desk "Pending" count all drafts, including rejected, other stage and other department. Examples: "2 documents" above "All caught up!"; at scale "205 documents" over 85 cards.
  - Director and Maintenance Manager published totals disagree between desk (37), Home (37) and documents / segment (36).
  - The desk and the Master List do not repaint when another tab acts (`dashboard.html` never subscribes; `master-list.html:1722` listens to the same tab only). Example: "Waiting on QMS 11" beside a bell of 10.
- **Fix:** C. Each figure equals the records it opens, per role and department. Subscribe every painter to store changes. "Mine" filtered by the signed-in person (**M365:** Entra object ID).
- **Test:** for each role, badge = destination membership; after confirm and reject, every pending figure equals its cards.

### PI-21: Release keeps stale dates: a just-approved document is instantly "review overdue"

- **Where:** P1 · confirmed bug / data defect · CONFIRMED · approvers, all readers · viewer, lists · all platforms.
- **Actual:**
  - Approving `TQ-TDS-DSS-SOP-022` today keeps issue date 23 Aug 2023 and next review 23 Aug 2025. It is current and overdue the moment it is released.
  - Upload stamps the issue date at filing, before approval.
- **Root cause:** `store.js:303` keeps `issueDate`; `upload.html:1218`.
- **Fix:** C. On release, issue date = approval date; recompute the next review from the cycle; clear overdue.
- **Test:** after approve, `issueDate ≥ approvedDate` and the record is not overdue.

### PI-22: Searching the exact number of a superseded or withdrawn document says "no such document"

- **Where:** P1 · design weakness · CONFIRMED · Employee and all readers · Document Search · all platforms.
- **Actual:** a worker holding an old printed copy who searches `TQ-TWS-CTSS-SOP-003` is told to "check the document number", instead of "Superseded, do not use". The 13 superseded records point at "Rev 4.0" text, not at an existing successor.
- **Root cause:** `search-index.js:40` drops withdrawn records entirely.
- **Fix:** C. On an exact number or legacy-ID hit, show the record with a withdrawn banner and a link to its successor. **M365:** a real revision chain.
- **Test:** exact-number search for a superseded document returns one card marked withdrawn.

### PI-23: The viewer shows the wrong area when a link has no `seg`

- **Where:** P1 · confirmed bug · CONFIRMED · all readers · viewer · all platforms.
- **Actual:**
  - `viewer.html?doc=TQ-TWS-CTSS-SOP-011` (the shape of deep links and old QR codes) shows "Drilling Services".
  - The breadcrumb goes to Drilling, "Related" lists Drilling SOPs, and the share link and QR code are rebuilt with `seg=drilling`.
- **Root cause:** `viewer.html:890` defaults the area to Drilling and never corrects it from the record.
- **Fix:** A. Take area and type from the resolved record.
- **Test:** a doc-only URL and a wrong-`seg` URL both show the record's own area.

### PI-24: Rejected drafts are orphaned: no resubmit link, still counted as pending

- **Where:** P1 · confirmed bug / design gap · CONFIRMED · Employee, QMS · upload, Master List, Workbench, counts · all platforms.
- **Actual:**
  - Re-filing after a rejection mints a new number with no link to the rejected one.
  - The rejected record stays `draft` forever. It is counted in Home, segment and desk pending; shown as plain "DRAFT" with no reason; offered as a revision target; and flagged by the Workbench as a "same title" duplicate.
  - The Master List text says it "comes back to QMS when it is resubmitted", but nothing implements that.
- **Fix:** C. A "Returned" state with resubmit on the same record (next draft revision); show the rejection reason to QMS; exclude returned drafts from pending counts.
- **Test:** reject then resubmit gives one record with the same number, back in the QMS queue, and no pending count includes the returned version.

### PI-25: A stale approval in the browser is applied to a new revision after the register changes

- **Where:** P1 · confirmed bug · CONFIRMED · all roles · every page · returning app, UAT reopened days later.
- **Reproduce:**
  1. On day 1, QMS and the Director release `TQ-TWS-CTSS-S005` rev 1.0.
  2. A later `documents-master.js` ships S005 rev 2.0 as a draft.
  3. On reload, the record is rev 2.0, "Current", with day 1's signatures.
- **Root cause:** `store.js:106-115` applies saved overrides by number only, with no revision check and no storage versioning.
- **Fix:** C. Key overrides by number + revision and version the storage per release. **PRODUCTION CONTROL REQUIRED:** server-held state; never trust a client copy of an approval.
- **Test:** seed an override, change the revision in the register, assert the override is ignored.

### PI-26: "Last synced: just now" is shown for a cached copy when the server is unreachable

- **Where:** P1 · design weakness · CONFIRMED · all readers · viewer, every page · PWA, phone.
- **Actual:** with the service worker installed and the server unreachable but the phone "online" (a captive portal or a dead link on a rig), pages load from cache with no offline indicator, and the viewer says "Last synced: just now".
- **Root cause:** `shared.js:985-989` writes last-sync from `navigator.onLine`, not from a successful fetch; there are no fetch timeouts.
- **Consequence:** a withdrawn revision cached earlier could be read as current. This consequence is **suspected**; the label behaviour is confirmed.
- **Fix:** C. The service worker reports when it served from cache; the page shows the cache age; last-sync is set only on a successful network fetch; fetches time out after about 4 s.
- **Test:** serve from cache while `onLine` is true and assert a visible "cached copy from <time>" label.

### PI-27: Classification is fixed at upload, and restricted titles are listed to everyone

- **Where:** P1 · confirmed bug / design weakness · CONFIRMED · filers, Employee readers · upload, segment, Home counts · all platforms.
- **Actual:**
  - Upload always stores `classification:'internal'` and `language:'en'` (`upload.html:1225-1226`). A confidential document would be published as internal, and an Arabic translation cannot be filed as one.
  - The viewer and search correctly deny restricted documents to an Employee, but the segment page lists their titles tagged "Restricted". Coiled Tubing shows Employees 12 restricted titles and 1 confidential.
  - Counts include them: Home "Documents in Force" 520, of which an Employee can open 352.
- **Fix:** C.
  - Classification, language and translation-of fields at upload, checked by QMS.
  - Owner decision on whether restricted titles may be listed (BUSINESS-RULES §11 reads as no).
  - **M365:** sensitivity labels and SharePoint permissions decide visibility and counts.
- **Test:** an Employee's lists and counts contain only records they can open.

### PI-28: Actions report success when nothing was sent

- **Where:** P1 · production dependency · CONFIRMED · Employee · upload, Ask Expert · PWA, phone.
- **Actual:**
  - Offline, Upload still says "Submitted for review".
  - Ask Expert stores nothing at all and shows a random "Ticket #TKT-…". A "Critical, Safety Concern" is promised "a reply within 2 hours", with no stop-work or emergency guidance.
- **Fix:** C.
  - **Frontend:** block or queue writes offline with an explicit "Not sent yet" state; for a Critical safety ticket, show the emergency route.
  - **M365:** success only after the SharePoint / Graph response, with an idempotency key; a real ticket list.
- **Test:** submit offline and expect no success wording.

### PI-30: A new release or first install reloads every open page mid-task

- **Where:** P1 · confirmed bug · CONFIRMED · all roles · upload, desk reject, Workbench, Ask Expert · PWA, phone, desktop.
- **Reproduce:** fill Upload to step 3 with a file, then deploy a new cache version. The tab reloads to step 1 and the file is gone; the "Update now" bar never shows. On a first visit, a page reloads about 0.6 s after loading.
- **Root cause:** `service-worker.js:75` calls `skipWaiting()` on every install, `:91` calls `clients.claim()`, and `shared.js:245` reloads on `controllerchange`. The update bar path (`shared.js:252`) is dead.
- **Fix:** A. Install waits; reload only after "Update now" or when no form is dirty; no reload on the first claim.
- **Test:** with a dirty form, a new cache version → no reload, bar visible.

*(PI-29 is intentionally unused; the CI coverage gap appears as TB-05.)*

---

## P2 findings

| ID | Finding | Role / page / platform | Evidence and root cause | Fix |
|---|---|---|---|---|
| PI-31 | Same person can file and then check or approve their own document | Director, QMS · desk, Workbench | `submittedBy` = `approvedBy` = "Segment Director"; QMS can check its own filing. BUSINESS-RULES silent. **PRODUCTION CONTROL REQUIRED** | B (+ rule) |
| PI-32 | Delegation gaps | Director / MM delegates · dashboard, documents | A "no approval" delegate can still withdraw 36 documents; a document-type limit is ignored for withdrawal (`roles.js:327-337`); the 90-day limit depends on the time of day (`roles.js:489`, UTC rounding); Revoke has no confirmation and revoked delegations vanish from history | C |
| PI-33 | Software / Tool can be chosen but can never be filed | filers · upload | No number is assigned, so the user gets "No document number"; review shows Approver ", "; the "Software Version" field is never saved | A |
| PI-34 | Translations are not tied to their source's lifecycle | QMS · all lists | Withdrawing `TQ-TWS-CTSS-SOP-005` leaves `-005-AR` Current | C |
| PI-35 | "undefined" filter pill; bulletins badged "SOP" (V, code) | Director / MM / QMS · Published Documents | `documents.html:489` maps `form` onto the SOP pill with no label; `TYPE_KEY` lacks `bulletin` | A |
| PI-36 | Document Search problems | all · ai-search · phone especially | Typed query is dropped when a filter changes (`ai-search.html:1068, 1105, 1126`); no Maintenance Bulletin type filter; the Filters button sits off-screen in a hidden-scrollbar chip row on phones (x 494 on a 390 screen, 50×20 px); "Draft" is offered to an Employee and always returns nothing | A |
| PI-37 | A long filename pushes the ✕ (remove) button off-screen | filers · upload · phone and desktop | An 89-character name puts ✕ at x 830 on a 390 screen; with one file per upload the user cannot swap files without reloading. Cause: no `min-width:0` (`upload.html:117, 128`) | A |
| PI-38 | File fingerprint goes stale | filers · upload | Removing a file keeps its hash on screen; a large-then-small race shows the large file's hash against the small file; the whole file is read into memory (large files on iPhone, suspected) | A |
| PI-39 | Ask Expert validation | Employee · support-ticket | Whitespace-only title and description pass; 6 photos keeps 5 silently; two quick batches exceed the 5-photo limit; a 12 MB photo is accepted (limit 10 MB); a HEIC with no type is dropped silently | A (+B storage) |
| PI-40 | Upload state is easily lost or leaks | filers · upload | No warning before leaving with entered data; Back or refresh drops everything; after filing a Policy the next upload hides the area field; after a Bulletin, functions stay disabled | A |
| PI-41 | Bookmarks | all · top bar | The oldest is dropped silently at 50; no withdrawn or superseded status in the panel; keyed on area + title, not number | A (+B) |
| PI-42 | Master List side "Dashboard" link | Auditor, QMS · Master List | The Auditor lands on a refusal page; QMS lands on the last-used area (same class as PI-17) | A |
| PI-43 | Large queues | Director, QMS · desk, bell, Workbench | The desk renders every card (120 cards = 39,547 px tall on a phone); Director bell items link to the desk top, not the card; the Workbench has no sort and puts new submissions last; the panel's "x of N" ignores the active filter ("7 of 12" while the list shows 2) | A |
| PI-44 | Ask Expert never receives area, department or document context | all · viewer, segment → support-ticket | The page supports `?area=&dept=` but no link passes them | A (+B) |
| PI-45 | Published Documents is a dead end | Director / MM / QMS · documents | Rows have no link to the document; searching "withdraw" matches all rows (it searches button text); an unknown area shows an empty "Nonexistent" page; wording ignores department | A |
| PI-46 | Arabic search finds almost nothing | all · search, Master List | Arabic records are English titles plus "(النسخة العربية)"; Arabic words return nothing; type names are not searchable | C |
| PI-47 | Maintenance header total leaves out bulletins | all · segment Maintenance side | Header "1" against the All tab's 3 (`segment.html:1578`) | A |
| PI-48 | Offline bars cover the bell and menu on phones; three bars stack | all · phone browser | `.offline-bar{position:sticky;top:0;z-index:2500}` above the nav (`shared.js:1336`), duplicated at `:220` and `:971`; up to 155 px of bars | A |
| PI-49 | A stale desk says "You cannot countersign" and locks the card | QMS, Director · dashboard | When another tab already rejected the document, the stale card disables both buttons and names a role error instead of the real state. **PRODUCTION CONTROL REQUIRED** (If-Match / ETag) | C |
| PI-50 | Unknown URLs show "You're offline" | all · Azure | `staticwebapp.config.json:2-10` rewrites unknown paths to `offline.html` with status 200 | A |
| PI-51 | iPhone: "Next →" on a segment library lands at the bottom; list top under sticky tabs | all · segment · phone, PWA | Smooth scroll to a hard-coded `listTop-90`, cancelled by re-render (`segment.html:2035`); other JS offsets ignore `--nav-h` (`index.html:2411, 2450`, `segment.html:2466`) | A |
| PI-52 | **SUSPECTED:** landscape notch and home indicator in the installed app | all · PWA landscape | Since PR #25 pages draw edge to edge; only the bar and viewer use side and bottom safe-area insets; bottom bars (update, offline, bulk, toasts, Workbench footer) ignore the home indicator. Needs a real-device check | A |
| PI-53 | Register data gaps | all · data | 13 superseded records point to non-existent "Rev N" successors; drafts at Rev 2–4 with no predecessor; placeholder `TQ-QHSE-P###` is Current; 119 revisions >1 without `supersedes` | B (migration) + A (data check in CI) |
| PI-54 | Delegation reason "." accepted; delegate may be named as the grantor's own title; today's date refused as "before the start" | Director / MM · dashboard | Upload-audit polish, rated P2 because it affects audit evidence | A |

---

## P3 findings

| ID | Finding | Fix |
|---|---|---|
| PI-55 | Ctrl/Cmd-click opens links in the same tab (page-exit handler ignores modifier keys) | A |
| PI-56 | Geothermal Centre of Excellence is filed and titled as a Corporate Function (`documents-master.js:240`) | A, B |
| PI-57 | "Your submissions" bell entries go nowhere (no link to the document or resubmit) | A |
| PI-58 | "Under review" reads five different ways across screens ("Review due", "Under review", "Current, OK to use", "Current, under periodic review", "Current") | A |
| PI-59 | Upload polish: the step lamp jumps to 2 on file choice; the summary "/500" counter is not enforced and not reset; ZIP missing from the sidebar list | A |
| PI-60 | Touch and toast polish: shared toasts clip at 320 px; Master List checkboxes 15×15 px with dead near-miss area; several targets under 40 px; bookmarks "Clear" has no confirmation; `/fonts/*` and `/icons/*` cached `immutable` for a year with unhashed names | A |
| PI-61 | Segment document modal × sits under the iPhone status bar in the installed app (a bottom Close button exists) | A |

---

## Phone / PWA findings (index)

| ID | Summary | Sev |
|---|---|---|
| PI-08 | Workbench / record drawer cannot be closed in the installed iPhone app | P1 |
| PI-18 | Back shows a blank, untappable page (back-forward cache) | P1 |
| PI-26 | "Last synced: just now" for a cached copy | P1 |
| PI-28 | Success shown for writes that were not sent (offline) | P1 |
| PI-30 | New release or first install reloads open pages mid-task | P1 |
| PI-25 | Stale browser-stored approval applied to a new revision | P1 |
| PI-36 | Search Filters button off-screen on phones | P2 |
| PI-37 | Long filename hides the remove button | P2 |
| PI-43 | Desk with no pagination becomes huge on phones | P2 |
| PI-48 | Offline bars cover the menu and bell on phones | P2 |
| PI-50 | Unknown URLs show "You're offline" | P2 |
| PI-51 | iPhone pager scroll and JS offsets ignore the taller bar | P2 |
| PI-52 | Landscape notch / home indicator (suspected) | P2 |
| PI-60, PI-61 | Touch-target and modal polish | P3 |

Verified working on phone and in the installed-app simulation:
- the bell, menu and bookmarks are reachable on every page;
- no horizontal page scroll at 390 or 320 px with 100-character titles;
- the bell with 512 items fits ("+506 more");
- the one-file upload rule holds on every path (picker, drag-and-drop, re-add, double-tap).

## Role / permission findings (index)

| ID | Summary | Sev |
|---|---|---|
| PI-04 | Delegation adds to own powers: no-approval delegate approves; QMS can do both steps | P0 |
| PI-05 | Script injection could act in an approver's session | P0 |
| PI-09 | Register functions accept forged status, identity, signatures and delegations (console) | P1 |
| PI-15 | Named approver ≠ actual approver for Lesson / Manual / Alert / Policy | P1 |
| PI-16 | Maintenance procedure routed to the Segment Director from the normal Upload button | P1 |
| PI-17 | Director / Maintenance Manager queue link opens a refusal page | P1 |
| PI-27 | Restricted titles listed to Employees | P1 |
| PI-31 | No segregation of duties (file, then check or approve your own) | P2 |
| PI-32 | Delegation: withdraw power, type limit, 90-day rule, revoke history | P2 |
| PI-42 | Master List "Dashboard" link refuses the Auditor | P2 |

Verified holding:
- URL tampering on another area's desk, documents page, Master List or Analytics is refused for every role.
- A Director cannot approve a Maintenance document, and a Maintenance Manager cannot approve an Operations one.
- QMS desk cards and the Workbench never offer final approval.
- Bulk confirm re-checks each document.
- Double-click on Approve, Workbench Confirm / Reject, bulk Go and Upload submit does not repeat the action.
- An expired or revoked delegation stops working.

## Data-integrity findings (index)

| ID | Summary | Sev |
|---|---|---|
| PI-01 | Duplicate numbers; actions hit the wrong record | P0 |
| PI-02 | Two Current revisions; revision filing broken | P0 |
| PI-03 | Withdrawn document shown Current | P0 |
| PI-10 | Bulk Withdraw cancels drafts | P1 |
| PI-11 | Withdrawal unrecorded; trail and history show non-events | P1 |
| PI-13 | Duplicate detection dead | P1 |
| PI-14 | Stale or free-text numbers | P1 |
| PI-19 | Overdue flag vs date | P1 |
| PI-20 | Counts ≠ destinations | P1 |
| PI-21 | Release keeps stale dates | P1 |
| PI-24 | Rejected drafts orphaned | P1 |
| PI-25 | Stale approval applied to a new revision | P1 |
| PI-34 | Translations not cascaded | P2 |
| PI-53 | Register data gaps | P2 |
| PI-58 | Status wording inconsistent | P3 |

---

## Microsoft 365 production dependencies

These cannot be made safe in browser code. The production build must own them. The prototype should mirror the rules so the specification is right.

| Need | Findings | Suggested Microsoft 365 mechanism |
|---|---|---|
| Unique document numbers, allocated atomically | PI-01, PI-14 | Server-side allocation (a counter list or function) plus an "enforce unique values" `DocNumber` column; act on item ID, never number |
| Revision chain and supersede-on-release in one transaction | PI-02, PI-22, PI-34, PI-53 | One SharePoint item per document with major versions; approval flow promotes the new version and retires the old one, cascading to translations |
| Approval bound to the exact file reviewed | PI-12, PI-13 | Approval references the SharePoint file version ID and content hash; block release if the file changed |
| Who may check or approve, delegation, segregation of duties | PI-04, PI-09, PI-15, PI-16, PI-31, PI-32 | Entra ID groups per authority; delegation records evaluated server-side; refuse an actor who filed or already signed |
| Concurrency (two people, stale screens) | PI-25, PI-49, PI-30 | ETag / If-Match on every approve, countersign, reject and withdraw; server state is the only state |
| Audit trail | PI-11 | SharePoint version history and an append-only approvals / events list; Purview audit for retention |
| Visibility and counts by classification | PI-27 | Sensitivity labels and SharePoint permissions; counts computed from permission-trimmed queries |
| "Mine", notifications, tickets | PI-20, PI-28, PI-44 | Entra object ID for "mine"; Ask Expert as a SharePoint list or Teams / Planner item with real IDs; notifications via Power Automate or Teams |
| Search (exact number of withdrawn documents, Arabic) | PI-22, PI-46 | Microsoft Search / SharePoint search with managed properties for number, legacy ID and Arabic title |
| Duplicate detection | PI-13 | Hash index on upload (flow or function); title similarity via search |
| File safety | PI-12 (accepted `report.exe.pdf` with executable content) | Server-side content-type sniffing and malware scanning on upload |

## Licensing / quotation flags

**LICENSING / QUOTATION CHECK REQUIRED.** No prices are given here; these only need confirming with TAQA IT or the vendor.

- **Power Automate:** approvals with the standard SharePoint / Outlook / Teams connectors are usually covered by Microsoft 365 licences. Atomic number allocation, HTTP calls, Dataverse or custom connectors use **premium** connectors (a per-user or per-flow licence).
- **Azure Functions or another Azure service:** for atomic numbering, hashing and duplicate detection beyond what a flow can do. Needs an Azure subscription and hosting cost.
- **Purview / Microsoft 365 audit:** standard audit retention is limited. Long retention or Audit (Premium) depends on the licence tier (typically E5 or an add-on).
- **Malware scanning of uploaded files in SharePoint:** e.g. Defender for Office 365 Safe Attachments for SharePoint / OneDrive / Teams. Licence-dependent.
- **Arabic-aware search or AI similarity:** Microsoft Search configuration may suffice. Anything using Azure AI Search, Copilot or a vendor component needs a licence and possibly vendor work.
- **Sensitivity labels with automatic labelling:** auto-labelling requires higher-tier Purview licensing.

---

## Test-suite blind spots

These are counted separately from the product findings above. The test suite is a strong safety net on main paths: about 1,000 runs, and exact membership checks on the QMS queue. Where it gave false confidence, the pattern is the same each time: **it proves a screen element exists, or that a store call works, but not that the real user path produces the right record.**

| ID | Blind spot | Evidence | Sev |
|---|---|---|---|
| TB-01 | The delegation "approval included" test checks a flag, not whether Approve works; its own comment says approval "is still true here regardless". Missed PI-04 | `tests/approval-workflow.spec.js:409-431`, `tests/roles.spec.js:359-377` | P1 |
| TB-02 | Number uniqueness is tested on the shipped static data and a single tab only. Missed PI-01 | `tests/numbering.spec.js:51-55, 123-173` | P1 |
| TB-03 | The Director / MM queue link is tested only from their own segment's page, by URL. Missed PI-17 | `tests/qms-queue.spec.js:136-152` | P2 |
| TB-04 | The installed-app test covers only the bell; it sets the status-bar inset itself, runs on Chromium only, and skips overlays drawn above the bar. Missed PI-08 | `tests/installed-app.spec.js` | P2 |
| TB-05 | **CI runs desktop Chromium only** (`tests.yml:38, 41`). Phone, iPhone (WebKit) and Firefox never run in CI, although spec headers claim "checked on desktop and phone". A local iPhone-engine run found 3 failures (one is the iPhone Safari install sheet covering the bell in a browser tab; one an approve button scrolled under the bar). Azure and Pages deploy on push without depending on tests | `.github/workflows/tests.yml`, `pages.yml`, Azure workflow | P1 |
| TB-06 | Service workers are blocked for every spec except the offline spec; update behaviour is never tested; the offline fallback test skips itself in CI. Missed PI-30 | `playwright.config.js:47`, `tests/offline.spec.js:329-363` | P2 |
| TB-07 | No test covers classification visibility (§11). Count tests compare against all classifications, which locks in PI-27 | `tests/documents.spec.js:31`, segment spec | P2 |
| TB-08 | `add()` is never tested against forged lifecycle fields; tests themselves seed `status:'current'` through it | `tests/release-journey.spec.js:126-198`, `tests/documents.spec.js:363-373` | P2 |
| TB-09 | Console errors are **not** asserted automatically, despite the fixture's comment. Only 100 of 407 tests call `assertNoConsoleErrors`; an ignore pattern swallows anything mentioning "service worker" | `tests/helpers/fixtures.js:15-43` | P2 |
| TB-10 | The policy approver test checks the words "the CEO approves", not who can approve. Missed PI-15 | `tests/maintenance-manager.spec.js:484-490` | P2 |
| TB-11 | Most approvals and stale-screen tests call the store directly instead of clicking the real (stale) button in a second tab | `tests/approval-workflow.spec.js`, `tests/release-journey.spec.js:226-245`, `tests/qms-workbench.spec.js:184-191` | P2 |
| TB-12 | Test names claim more than they assert (e.g. "a revision names what it supersedes" checks only a new document); revision filing and resubmission have no test at all. Missed PI-02 | `tests/upload.spec.js:333-342`, `tests/maintenance-manager.spec.js:384-401` | P2 |
| TB-13 | **Time bomb:** a segment test depends on `TQ-GEO-M003` being due 2026-10-16 and will start failing around **17 Oct 2026**; other tests assume all drafts fit one page or "cementing ships zero drafts" | `tests/segment.spec.js:265-321`, `tests/master-list.spec.js:61`, `tests/dashboard.spec.js:30` | P3 |
| TB-14 | The F086 export is never checked for content (download or toast is enough) | `tests/master-list.spec.js:338-385` | P2 |
| TB-15 | CI retries once and uploads the report only on failure, so tests that pass on retry leave no trace | `playwright.config.js:24`, `tests.yml:44` | P3 |
| TB-16 | Delegation Revoke, the 90-day limit and expiry are tested at store level only; "Edit details" has no UI anywhere | `tests/roles.spec.js:229-340` | P3 |
| TB-17 | 57 weak assertions (`toBeGreaterThan(0)`, `toBeTruthy()`) where an exact number matters | e.g. `tests/upload.spec.js:441-443` | P3 |
| TB-18 | Tests lock in behaviour the owner has already decided against (glossary term not pending review; Contributors with Editor / Viewer / Owner) | `tests/glossary.spec.js:101-133`, `tests/dashboard.spec.js:33` | P3 |
| TB-19 | Double-click, Back and refresh after a decision, refresh mid-upload, and held Enter are not tested. Missed PI-07 | n/a | P2 |
| TB-20 | `tests/home.spec.js:273` asserts "Awaiting QMS Approval" equals all drafts, which locks in PI-20; segment membership (§14) has no tests | `tests/home.spec.js:273` | P2 |

**Where the automated tests gave false confidence, specifically:**
- PI-01 (TB-02)
- PI-02 (TB-12)
- PI-04 (TB-01)
- PI-07 (TB-19)
- PI-08 (TB-04)
- PI-15 (TB-10)
- PI-17 (TB-03)
- PI-18: the test server's `no-store` hides the back-forward cache
- PI-20 (TB-20)
- PI-27 (TB-07)
- PI-30 (TB-06)
- The CI gap (TB-05) means every phone and iPhone claim in spec headers is unverified on each PR.

---

## Recommended fix order

This is a proposal only; nothing is fixed until you decide.

1. **Stop wrong records and wrong content (P0).**
   - PI-01 duplicate numbers (block in Upload and `add()`, re-derive at submit).
   - PI-03 withdrawn shown Current (viewer fallback uses the live store; links always carry the number).
   - PI-05 script injection (escape the three sites).
   - PI-02 revision filing and supersede-on-approve.
2. **Stop authority leaks (P0 / P1).**
   - PI-04 delegation replaces rather than adds.
   - PI-07 Workbench held-Enter guard (my PR #24 defect).
   - PI-06 Enter-before-review.
   - PI-16 maintenance routing from Upload.
   - PI-09 harden the register functions to match BUSINESS-RULES (and record them as server rules).
3. **Make the record tell one story (P1).**
   - PI-11 withdrawal record and honest trail.
   - PI-10 bulk withdraw excludes drafts.
   - PI-12 Preview / file / confirm before release.
   - PI-13 show duplicate panels.
   - PI-19, PI-20, PI-21 counts, overdue and dates.
   - PI-24 resubmission.
   - PI-25 stale browser overlays.
4. **Phone / installed-app reachability and lost work (P1).**
   - PI-08 drawer close.
   - PI-17 queue link.
   - PI-18 Back blank page.
   - PI-30 no silent reload.
   - PI-26 cache age.
   - PI-28 no false success.
5. **Tests that would have caught these.** Add the recurrence tests named in each finding. Put the phone and iPhone projects into CI (TB-05). Make console errors fail tests (TB-09). Fix the 17 October time bomb (TB-13).
6. **P2 / P3 polish** in batches by page.
7. **Microsoft 365 handover.** Add the dependencies table above to `docs/AZURE-INTEGRATION-REQUIREMENTS.md` and `docs/AZURE-UAT-CHECKLIST.md`, and confirm the licensing flags with IT.

**Open owner decisions this audit surfaced:**
- Who finally approves Lessons, Manuals, Alerts and Policies (PI-15, BUSINESS-RULES §12 #1).
- May Employees see restricted titles listed (PI-27).
- Should QMS be able to cancel a submitted draft, and with what reason and notice (PI-10).
- Segregation of duties: may a Director approve a document they filed (PI-31).
