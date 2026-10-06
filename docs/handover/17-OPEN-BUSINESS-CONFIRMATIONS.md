# 17 Open business confirmations

These are business questions. Nobody, IT included, may assume an answer. Each is owned by the Product Owner, QMS or QHSE, as shown.

| # | Confirmation needed | Why it matters | Owner | Source |
|---|---|---|---|---|
| BC-01 | **Approver for document types beyond the two confirmed routes:** Policy, Manual, Lesson Learned, Alert, and any type not covered | The register's per-type names (Policy → CEO, Lesson → QHSE Manager, Manual → SME, Alert → Corporate Function VP / Director) were never confirmed. Under BD-02 no route is invented: in production these types are not configured until confirmed. *Prototype:* every type is routed to the area holder / Maintenance Manager, while the names are still *displayed* on Upload, the type table, the document page, the Master List drawer and the **F086 export's "Approver Role" column** (PI-15, partially fixed) | QMS with the Product Owner and QHSE | BD-02; `BUSINESS-RULES.md` §12 #1 |
| BC-02 | **TAQA emergency wording and contacts** for Ask Expert's Critical option | The approved neutral wording stands until QHSE supplies TAQA's. No numbers are invented | QHSE | BD-04 |
| BC-03 | **Named technical SMEs per Field Glossary category** | The SME approves meaning (BD-06). The workflow cannot start without them | Product Owner with discipline heads | BD-06 |
| BC-04 | **SCORE → RISE transition, if ever proposed** | SCORE is the system of record. A transition needs QMS / document-governance approval, IT approval and a reconciliation (12) | TAQA QMS / document governance | BD-01 |
| BC-05 | **Classification and language at upload:** who sets them, and whether there is a default | The prototype files every document `internal` / `en`. Visibility (BD-03) depends on classification being right | QMS | PI-27; `BUSINESS-RULES.md` §21 |
| BC-06 | ~~Who approves a restricted document~~ **Decided: BD-08 (6 Oct 2026)** | Only an approver cleared for the classification; otherwise blocked and escalated. Remaining: QMS's escalation and assignment procedure | QMS | BD-08 |
| BC-07 | **QMS triage procedure for Ask Expert** (who in QMS, how fast, how routing to the SME is recorded) | BD-04 makes QMS the triage point | QMS | BD-04 |
| BC-08 | **Retention periods and disposal approval** | Production must apply retention (13) | QMS | TQ-QHSE-S001 |
| BC-09 | **Who holds each area** (Segment Directors, Function Heads, Centre Managers, Maintenance Managers) and **segment membership** sources | Identity mapping (IT-04) needs the business list | Product Owner with HR / business | `BUSINESS-RULES.md` §14 |
| BC-10 | **Service targets** for availability, performance, recovery point and recovery time | 13 has no agreed numbers | Product Owner with IT | 13 |
| BC-11 | **Geothermal Centre of Excellence grouping** (filed as a Corporate Function in the lookups) | Area grouping is the business's | Product Owner | PI-56 |
| BC-12 | **OPEN: POTENTIAL PUBLIC INFORMATION EXPOSURE** (owner's ruling, 6 Oct 2026). Confirm whether the prototype register titles are derived from real TAQA documents | Only the generated labels and control fields are confirmed as demonstration data. Every other title is treated as potentially sensitive until TAQA confirms otherwise. The review, containment plan and confirmation questions are held privately by the Product Owner, not published here. No visibility change, takedown, deletion or history rewrite is made without the owner's explicit approval | Product Owner with QMS and Cybersecurity | Handover review; IT-21 |
| BC-13 | ~~Number existence probe~~ **Decided: BD-09 (6 Oct 2026)** | Number validation refuses in neutral words and reveals nothing about a document the filer may not open. Preferably the platform allocates numbers (BC-17, IT) | — | BD-09 |
| BC-14 | **Area holder for Company Wide documents** (the code calls it "Corporate Sponsor"; BD-02 names Segment Director / Function Head / Centre Manager) | Who approves company-wide documents | QMS with the Product Owner | BD-02 |
| BC-15 | **Retention trigger:** does the period run from issue, supersession or withdrawal? | Needed to apply retention (13) | QMS | BC-08 |
| BC-16 | **Reclassification:** how a document's classification is changed, and the default for an unknown classification at migration | No reclassification path exists (06); migration needs a rule (12) | QMS | BD-03 |
| BC-17 | **Typed numbers:** may filers type a number in production, or does the platform always allocate? | Affects Upload and number allocation (07 §17) | QMS / QHSE | `BUSINESS-RULES.md` §19 |
| BC-18 | **UAT exit and sign-offs:** who signs exceptions, go-live and releases; whether a real-iPhone failure blocks UAT exit | The RACI and 10 propose owners; none is decided | Product Owner with QMS and IT | 10, 15, 18 |
| BC-19 | **Accountable owner of the audit trail design and retention** | RACI row has no confirmed Accountable | Product Owner with QMS and IT | 15 |
