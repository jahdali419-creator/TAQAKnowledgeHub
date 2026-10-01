# TechHub API requirements (proposed starting contract)

A starting contract for the Azure team, derived from what the frontend does today. It is not a finished API design: names, paging, and versioning are IT's to decide. Rules are in `BUSINESS-RULES.md`; entities in `DATA-MODEL.md`. `docs/FRONTEND-API-CONTRACT.md` maps each prototype JavaScript function to these endpoints.

## Conventions
- Every endpoint requires an authenticated Entra ID user (bearer token). The **actor is always taken from the token**; no request body field may name the actor, the signer, a timestamp, a status or a stage.
- Authorization uses the actor's server-side roles and areas (`AZURE-INTEGRATION-REQUIREMENTS.md` §3), **including any active delegation**, never a value sent by the browser.
- Writes to a document send the version token read with it (`If-Match: <etag>`); a stale token or a stage that has moved returns **409**.
- Errors: `400` invalid input, `401` not signed in / expired, `403` signed in but not allowed (body says which rule), `404` not found **or not visible to this user**, `409` stale or wrong stage, `413` file too large, `415` file type not allowed, `422` business rule refused (for example a bulletin for a function), `5xx` server.
- Every successful write appends an audit event and the corresponding approval step.

## 1. Identity and lookups

| Method | Path | Purpose | Notes |
|---|---|---|---|
| GET | `/me` | Current user context | `{userId, displayName, roles[], areas[], department?, activeDelegations[], capabilities{submit, countersign, approve, delegate, manage, registerView, export}}`. The frontend uses this instead of `TAQA_ROLE` / `localStorage` |
| GET | `/areas` | Areas with group, names, short forms | Replaces `TAQA_DOC_LOOKUPS.segments` |
| GET | `/document-types` | Types with approver text, review cycle, retention | Replaces `TAQA_DOC_LOOKUPS.types` |

## 2. Reading documents

| Method | Path | Purpose | Authorization |
|---|---|---|---|
| GET | `/documents?area=&type=&status=&department=&q=&page=` | Area libraries, published lists, search | Return **only** rows the actor may see (`canSee`): status and classification by role; drafts only to QMS, Auditor, the area's Director/Maintenance Manager, and the submitter |
| GET | `/documents/{docNumber}` | Document page | Same rule; a hidden document is `404` |
| GET | `/documents/{docNumber}/trail` | Approval / audit trail for one document | Anyone who may see the document; full detail to QMS and Auditor |
| GET | `/documents/{docNumber}/revisions` | Version history | As above |
| GET | `/register?…` | Master List (all revisions incl. withdrawn) | QMS, Auditor only |
| GET | `/register/export?format=csv` | TQ-QHSE-F086 export | QMS, Auditor only |
| GET | `/queues/mine` | What waits on the actor: QMS → stage `qms`; Director → own area, stage `director`, non-maintenance; Maintenance Manager → own segment, stage `director`, maintenance | Drives the desk and the bell |
| GET | `/submissions/mine` | The actor's filings and their outcomes | Submitter only |

## 3. Workflow writes

| Operation | Endpoint | Actor / role | Area | Department | Stage required | Request | Result | Refused when |
|---|---|---|---|---|---|---|---|---|
| **Submit** | `POST /documents` | any role with `submit` (not Auditor) | any fileable area | maintenance only in an operational segment; bulletin ⇒ maintenance and operational segment only | — | title, summary, area, type, department, audience, supersedes?, attachment ids | `201`, record with server-allocated `docNumber`, `status=draft`, `approvalStage=qms`, `submittedBy/At` | Auditor `403`; bulletin for a function/centre `422`; missing fields `400`; attachment not scanned/allowed `422` |
| **QMS check** | `POST /documents/{n}/qms-confirm` | QMS | any | any | `qms` | `If-Match` | `approvalStage=director`, `countersignedBy/At` | not QMS `403`; stage ≠ `qms` or rejected `409`; stale `409` |
| **Final approval** | `POST /documents/{n}/approve` | Segment Director or Maintenance Manager (or their active delegate with approval) | **actor's own area** | Director: non-maintenance only; Maintenance Manager: maintenance only; delegate: grantor's department and listed types | `director` | `If-Match` | `status=current`, `approvalStage=null`, `approvedBy/At`, `issueDate` | wrong role/area/department/type `403`; stage ≠ `director` `409`; stale `409`; already approved `409` |
| **Reject** | `POST /documents/{n}/reject` | whoever may act at the current stage | as above | as above | `qms` or `director` | `{reason}` (non-empty; UI requires ≥ 20 chars), `If-Match` | `rejected=true`, `rejectedAtStage`, `rejectedBy/At`, `rejectedReason`, stage `null` | no reason `400`; not the stage's actor `403`; wrong stage / stale `409` |
| **Withdraw** | `POST /documents/{n}/withdraw` | QMS (any); Director (own area, Operations); Maintenance Manager (own segment, maintenance) | as stated | as stated | published (`current`/`under-review`) | `{reason}`, `If-Match` | `status=obsolete`, audit event | other roles/areas/departments `403`; already withdrawn `409` |
| **Edit details** | `PATCH /documents/{n}` | same as withdraw | as stated | as stated | any | allowed fields only (title, summary, audience, review date …) | updated record | any lifecycle/signature field in the body `422`; not the manager `403`; stale `409` |
| **Revision** | `POST /documents` with `supersedes` | as Submit | as Submit | as Submit | the superseded doc must be published | as Submit | new draft at `qms` | superseded doc not found / not current `422` |
| **Resubmission** | `POST /documents` (new filing) | as Submit | | | | as Submit, may reference the returned record | new draft at `qms` | — (the returned record is never reopened) |

Decide with the owner (`BUSINESS-RULES.md` §12): whether **final approval of a revision** also marks the superseded revision `superseded` in the same transaction.

## 4. Delegation

| Method | Path | Actor | Rules |
|---|---|---|---|
| GET | `/delegations?grantedBy=me` | Director, Maintenance Manager | Only their own grants for their area |
| GET | `/delegations?delegate=me` | anyone | Delegations the actor may act under |
| POST | `/delegations` | Director, Maintenance Manager | delegate (real user), area = grantor's, docTypes?, includesApproval, from, until (required, ≤ 90 days), reason (required). Cannot delegate what the grantor lacks; a delegate cannot re-delegate |
| POST | `/delegations/{id}/revoke` | the grantor (and QMS if policy allows) | Idempotent |

An expired or revoked delegation must stop authorizing immediately, server-side.

## 5. Files

| Method | Path | Rules |
|---|---|---|
| POST | `/attachments` (or upload-session + direct-to-storage SAS issued by the API) | Authenticated; allowed types `pdf, doc, docx, xls, xlsx, ppt, pptx, zip`; reject empty files and files over **500 MB** (the prototype's limits; confirm with IT policy); malware scan before the file can be linked to a submission |
| GET | `/attachments/{id}/content` | Only if the actor may see the document; refuse download for withdrawn and unapproved documents (the prototype disables download, print and pin for both) |

Approved content is immutable: a change is a new revision with a new attachment.

## 6. Notifications
| Method | Path | Purpose |
|---|---|---|
| GET | `/notifications` | The bell: items awaiting the actor, and outcomes of the actor's submissions |
| POST | `/notifications/{id}/read` | Mark read |

The API (or a worker) emits notifications on submit, QMS confirm, approve and reject, to the next actor and the submitter. Delivery channel (email, Teams) is IT's decision; a failed delivery must not undo the workflow step.

## 7. Other
| Area | Endpoint | Note |
|---|---|---|
| Search | `GET /documents?q=` or a search service | Must apply the same visibility filter as `/documents` |
| Glossary | `GET /glossary`, `POST /glossary/terms` | Only if the owner wants shared community terms (today they are per browser) |
| Ask Expert | `POST /expert-requests` | Only if the owner wants it connected; today nothing is sent |
| Analytics | tenant-approved telemetry | Today per browser only |
