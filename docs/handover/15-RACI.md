# 15 RACI

**RACI** says who does what for each activity:
- **R – Responsible:** does the work.
- **A – Accountable:** owns the outcome and signs it off. There is exactly one per activity.
- **C – Consulted:** asked before the decision. Two-way.
- **I – Informed:** told after. One-way.

**Roles:**
- **Product Owner:** Mohammed.
- **QMS:** Document Control.
- **IT / M365:** TAQA IT, Microsoft 365 and Azure.
- **Cybersecurity.**
- **QHSE.**
- **SMEs:** technical subject-matter experts, per discipline.
- **Business users:** Employees, Segment Directors, Maintenance Managers.

**"Unconfirmed"** marks an owner nobody has formally agreed yet. Each one is listed in 17. The whole table is a **proposal** for the Product Owner, QMS and IT to confirm; the governance sign-offs (UAT, go-live, release) are not set by any decision yet.

| Activity | Product Owner | QMS | IT / M365 | Cybersecurity | QHSE | SMEs | Business users |
|---|---|---|---|---|---|---|---|
| Business rules and decisions (BD register) | **A/R** | C | C | C | C | I | I |
| Approval matrix for document types beyond the two routes (BD-02) | C | **A/R** *(unconfirmed)* | I | — | C | C | I |
| Classification policy at upload (BD-03) | C | **A/R** *(unconfirmed)* | C | C | C | — | I |
| Production architecture (SharePoint / Power Automate / API / hosting / database) | C | I | **A/R** | C | — | — | — |
| Identity, roles and areas mapping (Entra ID) | C | C | **A/R** | C | — | — | I |
| Permission trimming and sensitivity enforcement | C | C | **R** | **A** *(unconfirmed)* | — | — | I |
| Workflow build (BD-02 routes) | C | C | **A/R** | I | — | — | I |
| Audit trail design and retention | C | C | **R** | C | C | — | — |

*(The audit-trail row has no confirmed Accountable owner; 17.)*
| Backup, recovery and monitoring | I | I | **A/R** | C | — | — | — |
| Caching / offline policy (BD-05) | C | I | **R** | **A** *(unconfirmed)* | — | — | I |
| Ask Expert destination and triage (BD-04) | C | **A** (triage) | **R** (destination) | C | C | R (answers) | I |
| Emergency wording and contacts on Critical | I | I | I | — | **A/R** | — | I |
| Field Glossary meaning (BD-06) | I | C | — | — | — | **A/R** *(SMEs per category unconfirmed)* | I |
| Field Glossary governance (duplicates, categories, withdrawal) | I | **A/R** | — | — | — | C | I |
| SCORE reconciliation and migration (12) | C | **A** | **R** | C | C | C | I |
| Any SCORE → RISE transition of authority (BD-01) | C | **A** *(TAQA document governance)* | C | C | C | — | I |
| User Acceptance Testing (10) | **A** | R | R | C | C | C | **R** |
| Real iPhone checks (11) | **A** | I | C | — | — | — | **R** |
| Production release approval (14) | C | C | **A** *(approver unconfirmed)* | C | I | — | I |
| Go-live decision (18) | **A** | C | C | C | C | — | I |
| Support after go-live | I | C | **A/R** *(support owner unconfirmed)* | C | — | — | I |
