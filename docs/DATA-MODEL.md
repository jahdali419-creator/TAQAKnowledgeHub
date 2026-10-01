# TechHub data model: prototype objects and their Azure equivalents

What the frontend holds today, where, and what each object should become. No database product is prescribed; the entities are logical. Field names are the prototype's, so the API can return the same shape and the pages need the least change.

**Server-owned** means the browser may display or propose the value but the API must set it: from the authenticated identity, the server clock, or the workflow transition. A value the browser sends for a server-owned field must be ignored or rejected.

## 1. Where the prototype keeps data today

| Data | Prototype location | Production |
|---|---|---|
| Register of ~585 shipped documents | `documents-master.js` (`TAQA_MASTER_DOCS`), a JavaScript file loaded by every page | Database, served by the API |
| Areas and document types (lookups) | `documents-master.js` (`TAQA_DOC_LOOKUPS`) | Reference tables or configuration, served by the API |
| Filed documents (drafts, published uploads) | `localStorage` `taqa-uploads-v1` | Database |
| Status / stage / signature changes to shipped documents | `localStorage` `taqa-status-v1` (an overlay applied on read) | The document rows themselves |
| Delegations | `localStorage` `taqa-delegations-v1`; acting-as: `taqa-acting-delegation` | Database |
| Current role and area | `localStorage` `taqa-demo-role`, `taqa-demo-area` (the role switcher) | **Entra ID claims / group mapping, never the browser** |
| Notification read-state | `localStorage` `taqa-ack-outcomes-v1`, `taqa-read-docs` | Database (per user) |
| File fingerprints for duplicate warnings | `localStorage` `taqa-doc-hashes` | Computed and stored server-side with the file |
| Custom glossary terms | `localStorage` `taqa_glossary_custom` | Database if the owner wants shared terms (decision) |
| Usage analytics | `localStorage` `taqa-analytics` (this browser only) | Tenant-approved telemetry (decision) |
| Per-user conveniences: bookmarks, theme, pins, form drafts, tour/install flags, recent docs, error log | `localStorage` `taqa-bookmarks`, `taqa-theme-v3`, `taqa-pins`, `taqa-draft-*`, `taqa-tour-done`, `taqa-install-dismissed`, `taqa-recent-docs`, `taqa-errors`, `taqa-last-sync`, `taqa-strata-bed` | May stay in the browser (not records), or move to a user-preferences store |
| Area page content (contributors, descriptions, sample activity) | `segments-data.js`, `DASH_DATA` in `dashboard.html` | Demo fixtures: replace with real data or remove (see `AZURE-INTEGRATION-REQUIREMENTS.md` §9) |
| Attachments | **Not stored.** Only name and size are recorded | Azure file storage (`AZURE-INTEGRATION-REQUIREMENTS.md` §6) |
| Ask Expert tickets | **Not stored or sent** (a reference number is shown locally) | Ticketing system or API (decision) |

## 2. Entities

### Document (one row per document revision)

| Field | Type | Owner | Notes |
|---|---|---|---|
| `docNumber` | string | server | TQ-QHSE-S001 §5.3 number. The prototype proposes one in Upload; the server must allocate it (uniqueness, provisional numbering) |
| `legacyId` | string? | server | Old identifier, for redirects only |
| `title`, `summary`, `audience`, `language` | string | submitter (editable by the managing role) | |
| `segment` | area id | submitter, validated by server | Area key (`coiled-tubing`, `qhse`, …) |
| `docType` | type key | submitter, validated | `policy`, `standard`, `sop`, `manual`, `form`, `bulletin`, `alert`, `lesson`, `software` |
| `department` | `"maintenance"` or null | submitter, validated | Bulletins are always maintenance; only operational segments may have maintenance documents |
| `scope` | `segment` / `company` | server | |
| `revision` | string | server | |
| `supersedes`, `supersededBy` | docNumber? | server | Revision chain |
| `classification` | `internal` / `confidential` / `restricted` | submitter within rules, validated | Policy always `internal` |
| `status` | `draft` / `current` / `under-review` / `superseded` / `obsolete` | **server** (workflow transitions only) | |
| `approvalStage` | `qms` / `director` / null | **server** | Stage `director` = final approval, for both workflows |
| `issueDate`, `approvedDate`, `nextReviewDate`, `reviewOverdue` | date / bool | **server** | Review date derives from the type's review cycle |
| `submittedBy`, `submittedAt` | user ref, timestamp | **server** | From the token and server clock |
| `countersignedBy`, `countersignedAt`, `countersignedDate` | user ref, timestamp | **server** | QMS check |
| `approvedBy`, `approvedAt` | user ref, timestamp | **server** | Final approval. For a delegate: the delegate, plus a reference to the delegation |
| `rejected`, `rejectedAtStage`, `rejectedBy`, `rejectedAt`, `rejectedDate`, `rejectedReason` | | **server** (reason from the actor) | |
| `numberStatus` | `conformant` / `provisional` | server | |
| `files[]` | attachment refs | server | See Attachment |
| *(new)* `version` / `etag` | opaque | **server** | Concurrency token (§3) |

The prototype stores signers as **role labels** ("Segment Director"); production stores **user references** and displays names.

### Approval step (recommended as its own table/collection)
`{ id, docNumber, step: submit|qms_check|final_approval|reject|withdraw, actor (user ref), actingForDelegationId?, at (server time), reason?, fromStatus, toStatus, fromStage, toStage }`. The document's signature fields are a projection of these steps; the steps are the record.

### Audit event
`{ id, at, actor, action, target (docNumber / delegation id / file id), detail, correlationId, clientIp? }`. Append-only. Covers every write above plus reads where policy needs them (for example controlled-document downloads). The prototype's trail (`viewer.html`) and analytics log are reconstructed from record fields in one browser; they are not an audit log.

### Area
`{ id, name, group: segment|function|product|company, spl (short form), bu, hasMaintenanceDepartment (= group == segment) }` from `TAQA_DOC_LOOKUPS.segments`.

### Department
`operations` (implicit, the default) or `maintenance`. Only operational segments have a maintenance department.

### Document type
`{ key, label, letter, owner, approver (register text), reviewCycleMonths, retentionYears, controlled, provisional }` from `TAQA_DOC_LOOKUPS.types`. See `BUSINESS-RULES.md` §12 #1 on the `approver` text.

### User identity reference
`{ userId (Entra object id), displayName, email?, roles[], areas[] (for scoped roles), department? }`, derived from Entra ID at sign-in (`AZURE-INTEGRATION-REQUIREMENTS.md` §3). Records store the user id; display names are looked up.

### Delegation
`{ id, grantor (user ref), grantorRole, delegate (user ref), area, department (from the grantor), docTypes[]?, includesApproval, from, until (≤ 90 days), reason, createdAt, revokedAt?, revokedBy? }`. The prototype stores the delegate as a typed name; production must reference a real user.

### Attachment
`{ id, docNumber, revision, fileName, contentType, size, sha256, storageKey, uploadedBy, uploadedAt, scanStatus, immutableAfterApproval }`.

### Notification
`{ id, recipient (user ref), kind: awaiting_check|awaiting_approval|approved|returned, docNumber, createdAt, readAt? }`. The prototype derives these in the browser from the register (`shared.js` bell).

## 3. Concurrency

Two people load the same draft and both act. Only the first valid transition may succeed; the second must get a **conflict**, not overwrite it.
- Every document carries a version token (ETag, row version or equivalent). Every write sends the token it read (`If-Match`). The API applies the transition only if the token and the expected stage still match, atomically, and returns **409 Conflict** (or 412) otherwise.
- The prototype approximates this by re-reading storage before each write and re-checking the stage (`store.js` `fresh()`), so a stale tab is refused ("You cannot approve this document."). That is a single-browser safeguard, not a substitute.
- Delegation revoke/grant and withdrawal need the same protection.
