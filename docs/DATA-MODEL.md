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
| Custom glossary terms ("Community", added immediately, no review) | `localStorage` `taqa_glossary_custom` | Database: **GlossaryTerm** with a review workflow (§2; `BUSINESS-RULES.md` §13). The prototype's immediate add is not the target |
| Usage analytics | `localStorage` `taqa-analytics` (this browser only) | Tenant-approved telemetry (decision) |
| Per-user conveniences: bookmarks, theme, pins, form drafts, tour/install flags, recent docs, error log | `localStorage` `taqa-bookmarks`, `taqa-theme-v3`, `taqa-pins`, `taqa-draft-*`, `taqa-tour-done`, `taqa-install-dismissed`, `taqa-recent-docs`, `taqa-errors`, `taqa-last-sync`, `taqa-strata-bed` | May stay in the browser (not records), or move to a user-preferences store |
| Area page content (contributors, descriptions, sample activity) | `segments-data.js`, `DASH_DATA` in `dashboard.html` | Demo fixtures: replace with real data or remove (see `AZURE-INTEGRATION-REQUIREMENTS.md` §9). The "Segment Contributors" list becomes **SegmentMembership** (§2) |
| Segment membership (who belongs to which operational segment and department) | **Not held.** The "Add Contributor" form adds a typed name, title and Editor/Viewer/Owner badge to the page for the session only; it grants nothing | Database: **SegmentMembership** (§2; `BUSINESS-RULES.md` §14), automatic from an authoritative source where IT confirms one |
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
`{ id, name, group: segment|function|product|company, spl (short form), bu, hasMaintenanceDepartment (= group == segment) }` from `TAQA_DOC_LOOKUPS.segments`. `segment` = operational segment (11), `function` = Corporate Function (10), `product` = Center of Excellence (3, shown as "Products & Technology" in the prototype), `company` = Company Wide. Membership applies to `segment` areas only.

### Department
`operations` (implicit, the default) or `maintenance`. Only operational segments have a maintenance department.

### Document type
`{ key, label, letter, owner, approver (register text), reviewCycleMonths, retentionYears, controlled, provisional }` from `TAQA_DOC_LOOKUPS.types`. See `BUSINESS-RULES.md` §12 #1 on the `approver` text.

### User identity reference
`{ userId (Entra object id), displayName, email?, jobTitle?, accountEnabled, roles[], areas[] (held by role, for scoped roles), department? }`, derived from Entra ID at sign-in (`AZURE-INTEGRATION-REQUIREMENTS.md` §3). Records store the user id; display names are looked up. Roles never come from SegmentMembership.

### Delegation
`{ id, grantor (user ref), grantorRole, delegate (user ref), area, department (from the grantor), docTypes[]?, includesApproval, from, until (≤ 90 days), reason, createdAt, revokedAt?, revokedBy? }`. The prototype stores the delegate as a typed name; production must reference a real user. A delegation **never** creates or changes a SegmentMembership; the delegate's temporary access (the delegated queue and its documents, the allowed actions, only between `from` and `until` and until `revokedAt`) is computed from the active delegation on each request (`BUSINESS-RULES.md` §14.10).

### Attachment
`{ id, docNumber, revision, fileName, contentType, size, sha256, storageKey, uploadedBy, uploadedAt, scanStatus, immutableAfterApproval }`.

### Notification
`{ id, recipient (user ref), kind: awaiting_check|awaiting_approval|approved|returned, docNumber, createdAt, readAt? }`. The prototype derives these in the browser from the register (`shared.js` bell).

### SegmentMembership
Target requirement (`BUSINESS-RULES.md` §14); not implemented in the prototype. Organisational membership only, with two dimensions: **operational segment + department**. **No role, permission level, Editor, Viewer or Owner field**; a `maintenance` membership does not make anyone Maintenance Manager, an `operations` membership does not make anyone Segment Director.

| Field | Type | Owner | Notes |
|---|---|---|---|
| `id` | string | server | |
| `userId` | Entra object id | **server** (resolved from the directory) | Immutable identity; the key. Never the email or display name alone |
| `segmentId` | area id | **server**, from the authorised manager's context | Operational segment (`group = segment`) only; never taken from a free field in the request |
| `department` | `operations` / `maintenance` | **server**, from the authorised manager's context | Director → `operations`, Maintenance Manager → `maintenance`, QMS / authorised administration → either. Determines who administers the member and department-specific routing; grants no authority |
| `membershipType` | `primary` / `additional` | **server** | `primary` if the person has no active primary; otherwise `additional` (an approved exception, `BUSINESS-RULES.md` §14.8) |
| `reason` | string | manager | **Required** for `additional` and for every transfer |
| `expiresOn` | date? | manager | Optional, for a temporary additional membership; the server ends it automatically |
| `source` | `automatic` / `manual` | server | Automatic from an authoritative attribute if IT confirms one (§14.6); manual from Add Member |
| `sourceAttribute` | string? | server | Which authoritative attribute produced an automatic membership |
| `status` | `active` / `ended` | server (transition) | Rows are never deleted; history is kept |
| `endedReason` | `removed` / `transferred` / `expired` | server | |
| `transferredFromId` | id? | server | On a transfer, links the new membership to the one it replaced (for example Coiled Tubing / Operations → Coiled Tubing / Maintenance) |
| `transferredBy`, `transferredAt` | user ref, datetime | **server** (token, clock) | Always QMS / authorised administration (`BUSINESS-RULES.md` §14.9) |
| `transferRequestedBy`, `transferConfirmedBy` | user ref? | server | The Director or Maintenance Manager who requested or confirmed the transfer, if the business process uses that step |
| `addedBy`, `addedAt` | user ref, datetime | **server** (token, clock) | System for automatic |
| `endedBy`, `endedAt`, `endedNote` | | **server** / manager | Who closed it, when, and the reason given |
| `displayName`, `email`, `jobTitle` | string | directory (cached) | Display only, refreshed from Entra; not identity |
| version token | | server | Concurrency (§3) |

Visible areas for a user = operational segments with an `active` membership in either department + the segment held by role for a Segment Director or Maintenance Manager + every Corporate Function + every Center of Excellence + Company Wide; QMS and Auditor see every area (`BUSINESS-RULES.md` §14.2). A person with no membership and no held segment sees no operational segment. Filing scope = visible areas.

Constraints: at most one **active primary** per `userId`; at most one active row per `userId` + `segmentId` (one department per segment, §14.9); a department or segment change is a transfer (close + open, linked) performed by QMS / authorised administration, never an update in place; both department managers are notified.

### GlossaryTerm
Target requirement (`BUSINESS-RULES.md` §13); not implemented in the prototype. One row per proposed term.

| Field | Type | Owner | Notes |
|---|---|---|---|
| `id` | string | server | |
| `term` | string | submitter | Term or abbreviation (prototype field `abbr`) |
| `fullName` | string | submitter | Prototype `full` |
| `definition` | string | submitter | Prototype `def`; validated by the SME |
| `category` | category key | submitter, correctable by glossary administration | `drilling`, `wellcontrol`, `production`, `safety`, `engineering`, `logging`, `commercial`, `maintenance`, `general`, `doccontrol`, `hr`, `cybersecurity`. The prototype's `custom` ("Community") is not a production category |
| `sourceReference` | string? | submitter | Source or reference, if applicable (standard, manual, document number) |
| `submittedBy` | user ref | **server** (token) | |
| `submittedAt` | datetime | **server** (clock) | |
| `status` | `pending` / `approved` / `rejected` / `withdrawn` | **server** (transition) | Only `approved` is visible in the shared glossary |
| `reviewedBy` | user ref? | **server** (token) | The technical SME / discipline owner who approved or rejected |
| `reviewedAt` | datetime? | **server** (clock) | |
| `rejectionReason` | string? | reviewer, via reject | Required on reject |
| `duplicateOf` | id? | glossary administration | Optional: links a removed duplicate to the surviving term |
| `withdrawnBy`, `withdrawnAt`, `withdrawalReason` | | **server** / glossary administration | Optional, for the `withdrawn` transition |
| version token | | server | Optimistic concurrency, as for documents (§3) |

The SME-to-category mapping is configuration owned by the business / IT implementation (for example an Entra group per category). Every transition is an audit event.

## 3. Concurrency

Two people load the same draft and both act. Only the first valid transition may succeed; the second must get a **conflict**, not overwrite it.
- Every document carries a version token (ETag, row version or equivalent). Every write sends the token it read (`If-Match`). The API applies the transition only if the token and the expected stage still match, atomically, and returns **409 Conflict** (or 412) otherwise.
- The prototype approximates this by re-reading storage before each write and re-checking the stage (`store.js` `fresh()`), so a stale tab is refused ("You cannot approve this document."). That is a single-browser safeguard, not a substitute.
- Delegation revoke/grant and withdrawal need the same protection, and so do glossary review transitions (two SMEs acting on the same pending term).
