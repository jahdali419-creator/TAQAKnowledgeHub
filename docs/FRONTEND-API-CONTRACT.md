# Frontend API contract

> **Current endpoint contract: `docs/API-REQUIREMENTS.md`.** This file stays as the map from each prototype JavaScript function to its future endpoint; rules: `docs/BUSINESS-RULES.md`.

What the browser code actually calls today, as a reference for whoever wires
it to Azure. This is not the plan (see `AZURE-MIGRATION-RAFA.md` for that,
and `HUB-DOCUMENT-CONTROL-SPEC.md` for the document schema's reasoning) — it
is the current contract, read out of the code, so a backend can be built to
match it instead of guessed at.

Every function below lives in a plain global object loaded by `<script src>`
today (`store.js`, `roles.js`). Nothing here is a real network call; every
one of them reads and writes `localStorage`. The column on the right is what
each one becomes once there is a real backend.

---

## 1. The document record

Defined in `documents-master.js`, one object per document, all of them
already carrying this shape:

```js
{
  docNumber:      'TQ-TWS-CTSS-SOP-001',   // TQ-QHSE-S001 §5.3 conformant number
  legacyId:       'CT-001',                // old id, kept for redirects only, may be null
  title:          'Pre-Job Safety Checklist',
  segment:        'coiled-tubing',         // key into TAQA_DOC_LOOKUPS.segments
  docType:        'sop',                   // key into TAQA_DOC_LOOKUPS.types
  scope:          'segment',               // segment|company, who the document applies to
  revision:       '4.0',
  issueDate:      '2025-07-20',            // ISO 8601
  approvedDate:   '2025-06-20',            // ISO 8601
  nextReviewDate: '2027-07-20',            // derived from issueDate + the type's review cycle
  reviewOverdue:  false,                   // true when today is past nextReviewDate
  status:         'current',               // draft|current|under-review|superseded|obsolete
  approvalStage:  null,                    // director|qms|null, only meaningful while status is draft
  supersedes:     'Rev 3.0',               // free text or null
  supersededBy:   null,                    // docNumber or null
  classification: 'internal',              // public|internal|confidential|restricted
  language:       'en',
  translationOf:  null,                    // docNumber or null
  numberStatus:   'conformant'             // conformant|provisional
}
```

**What Azure must supply that the record does not carry today:** who
approved it (a name, not a role) and when, e-signature evidence, and a real
version history (see §5 and §6). Those are placeholder/synthesized in the
front end right now and every place that does it says so in a code comment.

**What resolves the record's owner/approver by role**: `TAQA_DOC_LOOKUPS.types[docType].approver` —
a role string ("Operations Manager, CTSS"), not a person. Azure resolves
this to an actual signer through Entra ID group membership; the front end
only ever has the role text.

---

## 2. TAQA_STORE — the document register (`store.js`)

| Call | Becomes, on Azure |
|---|---|
| `TAQA_STORE.all()` | `GET /documents` — every record, register-shipped plus locally added, overrides applied |
| `TAQA_STORE.rows(pop, filter)` | `GET /documents?population=<pop>&segment=<filter.segment>&docType=<filter.docType>` — `pop` is one of `register`, `controlled`, `live`, `pending`, `awaiting-director`, `awaiting-qms`, `visible` |
| `TAQA_STORE.count(pop, filter)` | Same query, count only. Client-side today; Azure should support a `?count=true` or return `X-Total-Count` rather than have the client page through everything |
| `TAQA_STORE.findDoc(docNumber)` | `GET /documents/{docNumber}`. Resolves by rule, never "last match": the revision in force, then an open draft, then a returned draft, then superseded, then withdrawn (`BUSINESS-RULES.md` §16). In Azure, actions address the item ID |
| `TAQA_STORE.revisionsOf(number)` / `findRev(number, rev)` / `openDraft(number)` / `revisionParent(number)` / `nextRevision(rev)` | `GET /documents/{number}/versions`, `GET /documents/{number}/versions/{rev}`, the open version, the version a new revision would replace, and the next major revision number (PR 2A-2, `BUSINESS-RULES.md` §8) |
| `TAQA_STORE.numberInUse(number)` | `GET /document-numbers/{number}`: the record already carrying that number or legacy ID, in any area and status (case-insensitive), or nothing |
| `TAQA_STORE.checkFiling(rec)` | The reason `POST /documents` would refuse a filing, in words a filer can act on, or none |
| `TAQA_STORE.add(rec)` | `POST /documents` (draft creation, from `upload.html`). Always creates `status: draft` at stage `qms`; every lifecycle field in the request is ignored and `submittedBy` / `submittedAt` come from the token and the server clock. Refuses a Policy from anyone but QMS, more than one file, a maintenance department outside an operational segment (`BUSINESS-RULES.md` §10), Software / Tool, a filing with no number, and a number already in the register in any area or status (§16), except a **revision**: a filing that names `supersedes` and the number of the document it revises, which the register files as the next revision of that document, at most one open at a time (§8). **In Azure the server allocates the number** |
| `TAQA_STORE.patch(docNumber, fields)` | `PATCH /documents/{docNumber}`. Allow-list only: `title`, `summary`, `keywords`, `audience`, `related`, `changeNote`, `nextReviewDate`, `reviewOverdue`, `language`. Anything else (number, area, department, type, revision, files, supersedes, classification, any lifecycle field) is refused |
| `TAQA_STORE.setStatus(docNumber, status, rev?)` | `PATCH /documents/{docNumber}/versions/{rev}/status` — what withdraw calls. Without `rev`, the revision in force; withdrawing or superseding it cascades to its translations in force. Allowed moves only: `obsolete` from anything not already withdrawn, `superseded` from `current` / `under-review`; `current` only through approve. Everything else is refused |
| `TAQA_STORE.approve(docNumber, expect)` | `POST /documents/{docNumber}/approve` — `expect = {key, stage}` names the exact record the person reviewed (`TAQA_STORE.recordKey(d)`) and its step; the store refuses with `{ok:false, stale:true, error}` and writes nothing if that is no longer the record waiting (PR 2B). Production: item ID + version with `If-Match`, 409/412 on mismatch. Must be rejected server-side unless the caller's Entra token satisfies `TAQA_APPROVAL.canApprove` for that document (see §3); the front end's check is a UI convenience only, never a security boundary. There is no signer parameter: the signature is the caller's identity. Refused for whoever performed the QMS check on the same document |
| `TAQA_STORE.countersign(docNumber, expect)` | `POST /documents/{docNumber}/countersign` — same rule, checked against `canCountersign`; same `expect` binding; no signer parameter |
| `TAQA_STORE.reject(docNumber, reason, expect)` | `POST /documents/{docNumber}/reject` — reason of at least 20 characters; same `expect` binding; no signer parameter |
| `TAQA_STORE.setStatus(docNumber, 'obsolete', rev, {reason, expect})` | `POST /documents/{itemId}/withdraw` with `If-Match`. Reason of at least 20 characters; `expect = {key, status}` binds it to the record shown, and a mismatch is refused with nothing written (`statusError()` says why). Records `withdrawnBy/At/Date/Reason/FromStatus` and cancels open revisions in the same step (PR 2C-1) |
| `TAQA_STORE.approve(docNumber, expect, {effectiveDate})` | Final approval. `effectiveDate` (YYYY-MM-DD) defaults to today, never earlier; a later date leaves the version `approved` until a scheduled flow makes it current on that date (PR 2C-1, PI-21) |
| `TAQA_STORE.numberFormat(segment, docType, fn)`, `numberFormatProblem(rec)` | The TQ-QHSE-S001 5.3 number rule for a new filing (PI-14); the API enforces the same |
| `TAQA_STORE.related({title, segment, sha256, docNumber})` | Advisory possible duplicates with reasons (PI-13); never blocks |
| `TAQA_STORE.add({…, resubmitOf: key})` | Files a returned attempt again: same number and revision, next attempt (PI-24) |
| `TAQA_STORE.recordKey(d)`, `byKey(key)`, `revisionLabel(d)` | A record's permanent identity (`recordId`, or `number@revision` for a shipped row), the record it names, and "Rev 2.0 (attempt 2)". Production: the SharePoint item ID and version |
| ~~`TAQA_STORE.reset()`~~ | Removed from the API (PI-09). No endpoint may wipe the register |
| `TAQA_STORE.remove(docNumber)` | Not exposed in any UI today; document lifecycle goes through `status`, not deletion |
| `TAQA_STORE.onChange(fn)` | Real time updates. Today it is a `CustomEvent` on `window` (`taqa:register-changed`) fired after any local write, which is how the bell badge and dashboard counters stay live without a reload. A real backend needs an equivalent push (websocket, SignalR, or a poll) so two open tabs/devices do not disagree |

`isControlled(d)`, `isLive(d)`, `isVisible(d, role)` are pure filters over
the record above (no state), safe to reimplement server-side verbatim from
`store.js`.

---

## 3. TAQA_ROLE / TAQA_APPROVAL / TAQA_DELEGATION — identity and authorization (`roles.js`)

This is the part every page's "Preview only. Azure uses Entra ID." note is
about. Five roles exist: `employee`, `owner` (Segment Director),
`maintenance` (Maintenance Manager), `qms`, `auditor`. Today `TAQA_ROLE.set(role)` just writes a `localStorage` key and
reloads the page — there is no server checking anything, which is the whole
reason the door pill carries that disclaimer.

| Call | Real equivalent |
|---|---|
| `TAQA_ROLE.current()` | Derived from the signed-in user's Entra ID token, not chosen by the user |
| `TAQA_ROLE.area()` | The segment(s) the signed-in user's Entra security group maps to (see `AZURE-MIGRATION-RAFA.md` §2, "Entra security groups") |
| `TAQA_ROLE.effective(roleKey)` → `{approve, countersign, delegate, editMetadata, controlPanel, export, scope, ownSegment}` | The capability set a real authorization layer derives from the token's role/group claims. **Every one of these flags is checked in front-end JS only today** — a determined user can flip them in devtools. Every corresponding backend write (`setStatus`, `approve`, `countersign`, `patch`) must re-check the equivalent server-side; the front-end check is UX only |
| `TAQA_ROLE.canSee(doc, roleKey)` | Row-level read authorization — must be enforced server-side (an employee's `GET /documents` should never even return withdrawn/restricted rows they cannot see, not just hide them client-side) |
| `TAQA_ROLE.canManage(areaId)` | Whether the signed-in user may act as an area's desk (its queue, contributors, published list) |
| `TAQA_ROLE.canManage(doc)` | Whether the signed-in user may **withdraw** a document or **edit its details**: `PATCH /documents/{docNumber}` and `PATCH …/status` must enforce it. QMS: any document in any area. Otherwise the document's area must be the caller's **and** its department must be: an Operations document is its area's Segment Director's, a maintenance document (department `maintenance`, or type Maintenance Bulletin) is its area's Maintenance Manager's. Another area's Director or Maintenance Manager manages neither. The same split as final approval |
| `TAQA_APPROVAL.canApprove(doc, roleKey)` / `canCountersign(doc, roleKey)` / `TAQA_STORE.reject(doc, reason)` | The exact rule a `POST /documents/{docNumber}/approve`, `/countersign` or `/reject` endpoint must enforce. **Order matters and was changed this round**: QMS checks conformance first (`countersign`, despite the name — it is a gate, not a co-signature after the fact), then the named approver (Segment Director for an SOP/Standard) gives final approval, and that is what releases the document. Either step can instead reject with a required reason, which sends the draft back to whoever submitted it |
| `TAQA_DELEGATION.grant(g)` / `.revoke(id)` | `POST /delegations`, `DELETE /delegations/{id}`. The grantor is the caller and the area is the one they hold; a request naming another role or area is refused. Only the grantor, not acting under a delegation, may revoke |
| `TAQA_DELEGATION.current()` / `.actAs()` | "Acting as" is fully client-side today (a note in the code says so explicitly: "the prototype has no signed-in identity, so acting as a delegate is a..."). A real delegation needs a real record of who granted it, to whom, until when, and with what scope — an audit trail, not a `localStorage` key |

### 3.1 Rules the API must enforce, decided by the owner (1 Oct 2026)

1. **Maintenance Bulletins exist only for operational segments.** `POST /documents` must refuse `docType: bulletin` for any area whose group is not `segment` (corporate functions, centres, company). Those areas have no Maintenance Manager, so a bulletin there would have no valid final approver. The front end refuses it in Upload and in `TAQA_STORE.add`.
2. **Document management follows department as well as area** (`canManage(doc)` above). QMS's global document control is unchanged.
3. **Lifecycle and signature fields never change by editing.** `status`, `approvalStage`, every `*By` / `*At` / `*Date` of submission, check, approval and rejection, and `rejected` change only through submit, countersign, approve, reject and withdraw. An edit that names one is refused (`TAQA_STORE.patch`). A content change to a published document is a **new controlled revision** that goes through the same release steps; approval history is never rewritten.
4. **A Maintenance Manager holds an operational segment only** (`TAQA_ROLE.holds`). The identity claim that maps a person to a Maintenance Manager role must name an operational segment.

### 3.3 Rules added by Priority 2A-3 (October 2026). PRODUCTION CONTROL REQUIRED

10. **Submitter ≠ QMS checker ≠ final approver** (PI-31). `TAQA_APPROVAL.separationReason(doc)` gives the reason a person may not act; `canCountersign` / `canApprove` refuse it (pass `{ignoreSeparation: true}` to ask only about role and area). The API compares Entra ID object ids, not role labels.
11. **Approval data is keyed by number + revision** (PI-25): the browser overlay is `taqa-status-v2`, `"number@revision"`; the server holds approval state per item version.
12. **Routing**: department and area defaults come from the user's role and area (PI-16); the server derives the department from the role or claim.
13. **Register integrity** (PI-53): `scripts/check-register.js` (`TAQA_REGISTER_CHECK.check(records, lookups)` in the browser) is the specification of the integrity rules the migration and the API must hold.

### 3.4 Rules added by Priority 2B (October 2026). PRODUCTION CONTROL REQUIRED

14. **Every decision is bound to the record and step reviewed** (NEW-01). Check, approval and both rejections carry the item ID + version (`If-Match`) and the expected stage; any mismatch is refused with 409/412 and nothing is written (`BUSINESS-RULES.md` §18).
15. **Withdrawing the revision in force cancels the open revision** of that document and of its translations, in the same transaction (NEW-02, `BUSINESS-RULES.md` §8): `status = obsolete`, `cancelled = true`, `cancelledReason`, `cancelledBy/At/Date`. A cancelled version can never be checked, approved or made current.
16. **A returned revision filed again is the same revision, next attempt** (NEW-03, `BUSINESS-RULES.md` §7): its own item/record id and `attempt`; number + revision unique among records not returned.
17. **Final approval names the file version and its server-computed hash** (PI-12); the client's confirmation dialog is convenience, not the control.

### 3.5 Rules added by Priority 2C-1 (October 2026). PRODUCTION CONTROL REQUIRED

18. **Withdrawal needs a reason and is recorded** (PI-11): who, when, why, previous status, server-side, append-only; check and approval history untouched (`BUSINESS-RULES.md` §8).
19. **Bulk withdrawal is per exact record** (PI-10): each item names the item ID + version it withdraws; drafts and versions not in force are refused.
20. **Approval and effective dates are the server's** (PI-21): `approvedDate/At` at final approval; `issueDate` = effective date, default the approval date, never earlier; status `approved` until a scheduled flow promotes it; `nextReviewDate` = effective + cycle. Filings carry no dates.
21. **Returned filings** (PI-24): status Returned, out of every pending count; filing again reuses the number and revision as the next attempt.
22. **Number format for new filings** (PI-14) and **file-hash duplicate warnings** (PI-13), as in `BUSINESS-RULES.md` §19.

### 3.2 Rules added by the Priority 1 integrity remediation (October 2026). PRODUCTION CONTROL REQUIRED

5. **A delegation replaces authority** (PI-04). Acting under a delegation, the caller holds approve only if the delegation includes it and the grantor holds it, never the QMS check, and management only as the grantor. A role that performs the QMS check never approves, delegated or not.
6. **The checker is not the approver.** `approve` is refused for the identity recorded as `countersignedBy` on that document.
7. **Filing, status moves, editable fields and signatures** follow the allow-lists in §2 and `BUSINESS-RULES.md` §10 (PI-09).
8. **Every text field is text** (PI-05). The API stores and returns titles, numbers, revisions, types and lookup values as data; the client escapes them on output; the hosting sends a CSP that does not allow inline script.
9. **Open:** whether the filer may check or approve their own filing (PI-31, `BUSINESS-RULES.md` §12 row 8).

**The one rule that matters most for the handoff:** nothing in `roles.js`
is a security boundary today. It exists so the UI can be walked through and
signed off before the backend exists. Every gate it draws (`TAQA_ROLE.refuse`,
`canSee`, `canManage`, `canApprove`/`canCountersign`) needs a server-side
twin that makes the same decision from the caller's real Entra ID token, not
from a value the browser handed itself.

---

## 4. Notifications (new this round, `shared.js`)

Two different notification needs live in the same bell (`#nav-bell`, synced
by `shared.js`'s `sync()`), and Azure needs to replace both — they are not
the same feed.

### 4.1 The reviewer's queue

Shows the signed-in user's real pending-approval queue: documents where
`TAQA_APPROVAL.canApprove(d)` or `canCountersign(d)` is true for them. It is
computed client-side from `TAQA_STORE.all()` on every load and on
`taqa:register-changed`/`taqa:role-changed`/`storage` events.

Azure equivalent: `GET /users/me/queue` returning the same shape (`docNumber`,
`title`, `awaiting: 'qms-conformance-check'|'final-approval'`), ideally
pushed rather than polled so the badge count updates when someone else
clears an item from the queue.

### 4.2 Telling the submitter what happened to their document

This is the part that genuinely cannot be built for real without a backend,
and it matters for the handoff: **right now there is no real submitter
identity to route a notification to.** There is no login, so "the
submitter" is approximated as "whoever's browser has this document in its
own local uploads" (`TAQA_STORE.added()`, the same set the register already
calls `locallyAdded`). The bell shows that browser's own submissions once
they are decided — `rejected: true` with `rejectedReason`, or `status:
'current'` for a fresh approval — and lets that person dismiss each one
(tracked in `localStorage` under `taqa-ack-outcomes-v2`, keyed by the
record and outcome, `‹recordKey›:approved` / `‹recordKey›:rejected`, so each
revision and attempt is told separately; version 1 keys, `docNumber:outcome`,
are migrated once, PR 2B NEW-05).

**What IT must build for real, once Entra ID identity exists:**

- `POST /documents/{docNumber}/approve` and `/reject` must record who
  actually submitted the document (from their Entra ID token at upload
  time, not a role or a browser), not just leave it to be inferred from
  local storage.
- An email (or Teams notification) to that real person on both outcomes:
  - **Approved:** document title/number, that it is now published, a link
    to it.
  - **Rejected:** document title/number, the reason typed by whoever
    rejected it (QMS or the Director — `reject()`'s `rejectedAtStage`
    tells you which), and a way to resubmit. The in-app reason text is
    already captured and stored (`rejectedReason` on the record) — the
    only missing piece is delivering it somewhere the submitter will
    actually see it, since they may not be back in the hub for days.
  - This is exactly what `upload.html`'s own "Approval Workflow" note
    already promises the submitter ("You'll see it in your notifications
    bell here... email notifications arrive once this connects to
    Azure") — so this is a promise already made in the UI, not a new
    scope decision.
- No resubmission flow exists yet either: a rejected draft stays rejected
  with no way to edit and resend it through `upload.html`. Worth building
  alongside the email step, since a rejection notice with nowhere to act
  on it is only half the feature.

---

## 5. Version history (new this round, `viewer.html`)

The viewer's version-history panel and revision-compare view are currently
**synthesized**, not real: a seeded, deterministic generator builds
plausible-looking past revisions from the record's own `revision`,
`issueDate` and `docNumber` fields, because no real revision log exists yet.
This is flagged in a code comment at the point it happens.

Azure needs a real `GET /documents/{docNumber}/revisions` returning actual
past revisions (revision number, date, author, change summary) — most
naturally backed by SharePoint Online's own version history once the
document body itself lives there (see `AZURE-MIGRATION-RAFA.md` §2, phase 2).

---

## 6. Approval / e-signature trail (new this round, `viewer.html`)

Same caveat as §5: the approval-trail block shown to owner/qms/auditor is
synthesized from the record's existing dates and the type's named approver
role, not a real signature. A real e-signature trail needs, per document:
who (a person, resolved through Entra ID, not a role string), which step
(technical approval vs. countersignature), and when — probably the same
event log that would back the audit log in §7.

---

## 7. Trend charts and audit log (new this round, `analytics.html`)

Both are built from the current data snapshot, not a real history:

- The overdue-backlog and publishing-velocity charts recompute a trend from
  today's `nextReviewDate`/`issueDate` values, not from stored historical
  snapshots (none exist yet).
- The audit/activity log synthesizes "Approved"/"Countersigned"/"Withdrawn"
  entries from the record's own dates, and folds in genuinely real local
  data where it exists (this device's own document-open events, already
  tracked by `TAQA_Analytics` in `shared.js`).

Azure needs an actual append-only event log (`document.approved`,
`document.countersigned`, `document.withdrawn`, `document.viewed`, each with
who/when) for this to become real rather than reconstructed. This is also
the API Q2 §4.4.3 c) evidence an auditor will ask for directly — worth
prioritizing over the charts themselves.

---

## 8. Search (`ai-search.html`, `search-index.js`)

The search box matches against an in-memory index built from
`documents-master.js` at page load (title, docNumber, segment name, and any
summary text the record carries) plus the filter panel (segment, status,
document type, date range), all computed client-side over the full document
set. This works today because the whole register is small enough to ship to
the browser in one file.

Azure equivalent: `GET /documents/search?q=...&segment=...&status=...&docType=...&from=...&to=...`,
most naturally backed by Microsoft Search / Graph search once documents live
in SharePoint (see `AZURE-MIGRATION-RAFA.md` §2, phase 2) — the current
client-side index already covers a smaller fraction of the real document
set than a real search service would (see `HUB-DOCUMENT-CONTROL-SPEC.md`,
Finding 3 area, for the historical gap this closes).

---

## 9. What is real vs. simulated, at a glance

| Real today (safe to build on) | Simulated (needs a backend equivalent) |
|---|---|
| Document record shape and fields (§1) | Who is signed in, and their role/segment (§3) |
| `TAQA_STORE` read/filter logic (`rows`, `isLive`, `isVisible` etc.) | Every write's authorization check (§3) |
| `TAQA_APPROVAL`'s approve/countersign eligibility rules | Delegation ("acting as") records (§3) |
| This device's own local analytics (page views, document opens) | Revision history (§5) |
| The document number format and segment/type taxonomy | Approval / e-signature trail (§6) |
| The QMS-then-Director approval order and the reject-with-reason rule | Historical trend data and the audit event log (§7) |
| | Cross-document full-text search at real register scale (§8) |
| | Email/Teams notification of approval or rejection to the real submitter (§4.2) |

This table is the honest version of "what's simulated vs. what Azure must
supply" that every page's own disclaimers point back to individually.
