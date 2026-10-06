# 07 Microsoft 365 production requirements by capability

Each capability below gives:
- the **business need**;
- the **required outcome** (what must be true, whatever is built);
- **why the prototype cannot guarantee it**;
- the **decision IT must make**.

Products are named only as *candidates IT may consider*. **No custom API, database or hosting model is prescribed.** Whether SharePoint lists and Power Automate are enough, or a custom service is needed, is IT's decision (16).

## 1. Identity: Microsoft Entra ID

- **Business need.** Every action is taken by a real, named person, and the five roles and their areas come from TAQA's directory, not from a switch.
- **Required outcome.**
  - Sign-in with TAQA accounts.
  - Each person's role (Employee, QMS, Segment Director, Maintenance Manager, External Auditor) and held area / department are resolved on the server side.
  - The person's directory identity (Entra object id) is the identity used for separation of duties, delegation and audit.
  - External Auditors get time-boxed access per audit.
- **Why the prototype cannot.** The "View as" switch is chosen in the browser. Identities are simulated per role and area (`sim:owner@coiled-tubing`).
- **IT decision.**
  - App registration(s).
  - Group or app-role mapping, and where "area held" and department come from (HR attribute, group, list).
  - Built-in platform sign-in or a library (MSAL).
  - Guest access for auditors.
  - MFA and Conditional Access policy (with Cybersecurity).

## 2. Document storage: SharePoint (or equivalent)

- **Business need.** One controlled place for each document family and its revisions and files.
- **Required outcome.**
  - Every revision is kept, with its file, for its retention period.
  - Superseded and withdrawn revisions stay readable as "do not use".
  - Every link and QR code resolves to an immutable identity: document / family / revision (PI-23).
- **Why the prototype cannot.** No file is stored. The register is a script file plus browser storage.
- **IT decision.**
  - Library and list design: one item per family with major versions, or one item per revision.
  - The immutable identifier used in links.
  - How the content relates to SCORE (BD-01, 12).

## 3. Workflow

- **Business need.** The two routes of BD-02, with return, re-filing, revision, future-effective approval, withdrawal and delegation, exactly as in 05.
- **Required outcome.**
  - Every transition is checked against the current state and the actor's authority at the moment it is applied.
  - A refused transition changes nothing.
  - A future-effective revision is promoted once, on the business date.
- **Why the prototype cannot.** The state machine runs in the browser, and two browsers do not see each other.
- **IT decision.**
  - Power Automate approvals, a custom service, or a combination.
  - How a transition is made atomic (for example, release + supersede + translation re-issue in one step).
  - The scheduler for effective dates.

## 4. File and version binding

- **Business need.** The approver approves exactly the file they reviewed, and readers get exactly the approved file.
- **Required outcome.**
  - The approval is bound to the exact file version, using a fingerprint (for example SHA-256) computed by the platform at upload, not by the browser.
  - A file changed after approval is a new revision.
- **Why the prototype cannot.** Files are not stored. The fingerprint is computed in the browser and can be forged (PI-12).
- **IT decision.** Where the fingerprint is computed and stored, and how the approval references the file version.

## 5. Concurrency

- **Business need.** Two people acting on the same record at once must not both succeed. A decision made on an out-of-date screen must be refused.
- **Required outcome.**
  - Every decision names the exact record and version the person saw.
  - The platform applies it only if that record and version and the expected step still match. Otherwise it refuses, and the screen reloads.
- **Why the prototype cannot.** Separate browsers keep separate copies. The prototype only compares within one browser (NEW-01).
- **IT decision.** The mechanism, for example ETag / If-Match on list items, version checks in a flow, or transactions in a service.

## 6. Audit trail

- **Business need.** Who did what, to which exact record, when, and under which delegation, provable to an auditor.
- **Required outcome.**
  - Append-only.
  - Written by the platform from the signed-in identity and server time.
  - It covers: filing, check, approval, return, withdrawal, cancellation, grant, revocation, edits of details, and access changes.
  - Exportable for audits (F086).
- **Why the prototype cannot.** The trail is rebuilt in the page from the record. Some rows are placeholders. Browser storage can be edited.
- **IT to confirm** that the chosen store is append-only (version history can be trimmed by version limits or deleted by privileged users) and that its retention meets the audit retention period (which may depend on licence).
- **IT decision.**
  - The audit store: SharePoint version history, Purview audit, a separate log, or a combination.
  - Its protection from edits.
  - Its export.

## 7. Permissions and classification

- **Business need.** BD-03: nobody sees a title, metadata or count of a document they may not open.
- **Required outcome.**
  - Permission trimming happens on the server for lists, counts, search, links and exports.
  - Classification (`internal`, `confidential`, `restricted`) is applied at filing and enforced.
- **Why the prototype cannot.** The whole register file is sent to every browser, and trimming happens on the screen.
- **IT to verify:**
  - that the chosen mechanism hides **titles and metadata**, not only file content (sensitivity labels protect content; hiding a title depends on access control);
  - that every **count** is computed from a security-trimmed query (a list's item count may not be trimmed).
- **IT decision.**
  - Item / library permissions, sensitivity labels (Purview), search security trimming, or a combination.
  - How classification at upload is captured, once the business decides the policy (17).

## 8. Notifications

- **Business need.** People waiting on a decision, and filers waiting on an outcome, are told.
- **Required outcome.**
  - Notifications are sent from the platform when a transition succeeds, never from a browser.
  - A notification never claims something that did not happen.
- **Why the prototype cannot.** The bell is computed in one browser.
- **IT decision.** Email, Teams, or both, and through what (for example Power Automate).

## 9. Monitoring

- **Business need.** IT knows when RISE is down, slow or failing before users report it.
- **Required outcome.**
  - Availability, error and workflow-failure monitoring, with alerts to a named support owner.
  - Failed workflow runs are visible and can be retried safely.
- **Why the prototype cannot.** There is nothing on the server side to monitor.
- **IT decision.** Tooling (for example Azure Monitor / Application Insights, Power Platform admin analytics), alert routing and support hours.

## 10. Backup and recovery

- **Business need.** Controlled documents and their history are not lost, and service can be restored.
- **Required outcome.**
  - The register, files, versions, grants and audit trail can be restored to a known point.
  - Restores are tested.
- **Why the prototype cannot.** Browser storage has no backup.
- **IT decision.** Backup scope and tooling, recovery point and recovery time targets (13; *Target to be confirmed by IT/business*), and the restore test schedule.

## 11. Retention

- **Business need.** Each document type is kept for its retention period (`retentionYears` in the type lookups), including withdrawn revisions and the audit trail (TQ-QHSE-S001, API Q2 4.5).
- **Required outcome.**
  - Retention is applied by the platform.
  - Nothing is deleted before its period ends.
  - Disposal is recorded.
- **Why the prototype cannot.** It cannot keep anything beyond the browser.
- **IT decision.** Retention labels or policies (Purview), and who approves disposal (QMS).

## 12. Migration

- **Business need.** Production starts from correct data.
- **Required outcome.** A reconciled, validated starting register with an agreed cutover and rollback (12).
- **Why the prototype cannot.** Its 585 records are reconstructed for demonstration and carry 302 known findings.
- **IT decision.** Source of truth for the import (SCORE, per BD-01), tooling, and validation method.

## 13. Environment and deployment

- **Business need.** Changes reach users only after they have been tested and approved, and a bad change can be undone.
- **Required outcome.**
  - Separate development, test / User Acceptance Testing and production environments.
  - A test gate before production.
  - Release approval.
  - Rollback (14).
- **Why the prototype cannot.** Today a merge to `main` deploys straight to the live Azure Static Web App and GitHub Pages. There is no gate between them.
- **IT decision.** Environments, pipeline, approvals, branch protection, and the hosting of the user interface.

## 14. Offline and caching

- **Business need.** BD-05: read offline, send online.
- **Required outcome.**
  - Only content approved for caching is kept on devices, with an expiry agreed with Cybersecurity.
  - Nothing is queued.
  - Reachability is judged from the platform's own responses.
- **Why the prototype cannot.** It caches what it has opened, and it caches the whole demonstration register.
- **IT decision.** What may be cached (classified content may be excluded), for how long, and sign-in behaviour in the installed iPhone app.

## 15. Ask Expert destination

- **Business need.** BD-04: QMS triages each question and routes it to the technical SME.
- **Required outcome.**
  - "Sent" and a ticket number appear only after the destination confirms receipt.
  - Critical shows TAQA's approved emergency wording.
- **Why the prototype cannot.** Nothing is sent.
- **IT decision.** The destination (for example a SharePoint list with a flow, Dataverse, Teams), and how receipt is confirmed back to the page.

## 16. Search

- **Business need.** Find a document by title, number, legacy ID or area, in English and Arabic.
- **Required outcome.**
  - Results and counts are permission-trimmed (BD-03).
  - An exact number or legacy ID of a withdrawn document returns it marked "Do not use", never as current (PI-22).
  - Arabic titles are searchable (PI-46).
- **Why the prototype cannot.** It searches its own copy of the register in the browser.
- **IT decision.** Microsoft Search / SharePoint search with security trimming, or another index, and how withdrawn revisions are kept findable by exact number only.

## 17. Number allocation

- **Business need.** A number is used once, for good (`BUSINESS-RULES.md` §16, §19).
- **Required outcome.** Uniqueness enforced by the platform across every status and legacy ID; the number format validated against the TQ-QHSE-S001 §5.3 table.
- **Why the prototype cannot.** Two browsers cannot see each other's filings.
- **IT decision.** Whether the platform allocates every number or validates a typed one (the business must also confirm whether filers may type numbers, 17), and the uniqueness mechanism.
