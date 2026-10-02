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
| `TAQA_STORE.findDoc(docNumber)` | `GET /documents/{docNumber}` |
| `TAQA_STORE.add(rec)` | `POST /documents` (draft creation, from `upload.html`) |
| `TAQA_STORE.patch(docNumber, fields)` | `PATCH /documents/{docNumber}` |
| `TAQA_STORE.setStatus(docNumber, status)` | `PATCH /documents/{docNumber}/status` — this is the one call every withdraw/approve/bulk-action button in the UI ultimately makes today |
| `TAQA_STORE.approve(docNumber, signer)` | `POST /documents/{docNumber}/approve` — must be rejected server-side unless the caller's Entra token satisfies `TAQA_APPROVAL.canApprove` for that document (see §3); the front end's check is a UI convenience only, never a security boundary |
| `TAQA_STORE.countersign(docNumber, signer)` | `POST /documents/{docNumber}/countersign` — same rule, checked against `canCountersign` |
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
| `TAQA_DELEGATION.current()` / `.actAs()` | "Acting as" is fully client-side today (a note in the code says so explicitly: "the prototype has no signed-in identity, so acting as a delegate is a..."). A real delegation needs a real record of who granted it, to whom, until when, and with what scope — an audit trail, not a `localStorage` key |

### 3.1 Rules the API must enforce, decided by the owner (1 Oct 2026)

1. **Maintenance Bulletins exist only for operational segments.** `POST /documents` must refuse `docType: bulletin` for any area whose group is not `segment` (corporate functions, centres, company). Those areas have no Maintenance Manager, so a bulletin there would have no valid final approver. The front end refuses it in Upload and in `TAQA_STORE.add`.
2. **Document management follows department as well as area** (`canManage(doc)` above). QMS's global document control is unchanged.
3. **Lifecycle and signature fields never change by editing.** `status`, `approvalStage`, every `*By` / `*At` / `*Date` of submission, check, approval and rejection, and `rejected` change only through submit, countersign, approve, reject and withdraw. An edit that names one is refused (`TAQA_STORE.patch`). A content change to a published document is a **new controlled revision** that goes through the same release steps; approval history is never rewritten.
4. **A Maintenance Manager holds an operational segment only** (`TAQA_ROLE.holds`). The identity claim that maps a person to a Maintenance Manager role must name an operational segment.

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
(tracked in `localStorage` under `taqa-ack-outcomes-v1`, keyed by
`docNumber:approved` / `docNumber:rejected`).

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
