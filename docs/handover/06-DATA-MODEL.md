# 06 Data model in plain language

The field-level model is in `docs/DATA-MODEL.md`. It is logical and prescribes no product. This page says the same thing in words. Which store holds each thing (SharePoint lists and libraries, Dataverse, a database, or a mix) is **IT DECISION REQUIRED**.

## The things RISE keeps

| Thing | What it is | Key facts |
|---|---|---|
| **Document family** | One controlled document, identified by its **number** (for example `TQ-TWS-CTSS-SOP-011`) | A number is used once, for good. The family has an area, a type, a department (Operations / Maintenance) and a scope (area or company) |
| **Revision** | One approved version of the family: Rev 1.0, Rev 2.0… | At most one revision is in force and at most one is in progress. Each revision keeps its own dates, signatures and file |
| **Attempt** | One filing of a revision. A returned filing filed again is the next attempt of the **same** revision | Each attempt has a permanent **record id**. The returned attempt keeps its history |
| **Record** | One attempt of one revision: the row the workflow acts on | Status: `draft` (stage `qms` or `director`, or returned), `approved` (not yet effective), `current`, `under-review`, `superseded`, `obsolete` (withdrawn or cancelled), and `asset` for the 24 Software / Tool records, which are not under document control |
| **File** | The approved document file | Not stored in the prototype. In production it is bound to the revision by a trusted fingerprint (PI-12) |
| **Classification** | `internal`, `confidential`, `restricted` | Decides who may see the record at all (BD-03). A policy is always `internal` |
| **Translation** | A record in another language (`translationOf` → its source number) | Follows its source's revisions and withdrawal |
| **Delegation grant** | A time-limited grant of approval and/or management for one area and department | Never deleted. Revocation is recorded |
| **Audit event** | Who did what to which record, when, and under which grant | Production only: append-only, written by the server |
| **Area** | A segment, function or centre (25 in the prototype lookups), with its group and holder title | Owned by the business. Lookups in `documents-master.js` (`TAQA_DOC_LOOKUPS`) |
| **Document type** | SOP, Work Instruction / Manual, Form, Standard, Policy, Maintenance Bulletin, Alert, Lesson Learned (Software / Tool: closed for filing) | Review cycle, retention and numbering code per type. Per-type approver names are **not** approval routes (BD-02) |
| **Glossary term** *(target)* | A term proposed, reviewed by the category's SME, then shared | Not built (BD-06) |
| **Segment membership** *(target)* | A person's segment and department | Not built (`BUSINESS-RULES.md` §14) |
| **Ask Expert question** *(target)* | A question routed by QMS triage to an SME | Not built. Nothing is sent today (BD-04) |

## Who may write what

- **The server owns every lifecycle field:** status, stage, every signature (who, when, which identity, which grant), the dates, the attempt and the record id. The browser may display or propose them but never set them (`DATA-MODEL.md`, "server-owned").
- **Descriptive fields** (title, summary, keywords, audience, related, change note, next review, review overdue, language) may be edited by someone with "Manage" authority. Identity fields (number, area, department, type, revision, files, supersedes, classification, scope) are not editable. A new revision carries classification over, so there is **no reclassification path** today; how a document is reclassified is **BUSINESS DECISION REQUIRED** (17).

## The prototype's data, and why it is not authoritative

- `documents-master.js` holds **585 register records** reconstructed for the prototype, and the lookups.
- `scripts/check-register.js` reports **302 known legacy findings** in that data: missing successors, placeholder numbers, provisional codes and similar. They are listed in its baseline. Each is a reconciliation item, not something to migrate as is (12).
- Changes made in the prototype live in the browser (`localStorage`) and in no shared store.
- SCORE is the system of record (BD-01).
