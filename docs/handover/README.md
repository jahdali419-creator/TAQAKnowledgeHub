# RISE: IT handover and production-readiness pack

**Status: CURRENT (6 October 2026).** This pack is where TAQA IT starts. It replaces `docs/HANDOVER-TO-IT.md` as the entry point. The older documents it draws on are listed in `docs/handover/DOCUMENT-STATUS.md`, each with its status.

RISE (formerly TechHub / TAQA Knowledge Hub) is a **working prototype and specification**. It is not a production system, and it does not provide production security (see 02).

## Owners

- **Product Owner:** Mohammed, TAQA Learning Center. Owns business rules, workflow outcomes, priorities and acceptance criteria.
- **IT:** owns every architecture and implementation decision. That includes:
  - whether SharePoint Lists / Power Automate are enough;
  - whether a custom API is needed;
  - hosting, database and deployment;
  - how authentication is implemented;
  - monitoring and backup.

Nothing in this pack decides architecture on IT's behalf.

## Labels used throughout

| Label | Meaning |
|---|---|
| **PROTOTYPE-PROVEN** | The prototype behaves this way and automated tests prove it, **in the browser only**. This shows the intended behaviour. It is not a production control. |
| **PRODUCTION CONTROL REQUIRED** | The production system must enforce this on the server or platform side. The prototype cannot. |
| **IT DECISION REQUIRED** | IT chooses the mechanism. |
| **BUSINESS DECISION REQUIRED** | The Product Owner, QMS or QHSE must decide. Nobody may assume an answer. |

## Contents

| # | Section | For |
|---|---|---|
| 01 | [Executive overview](01-EXECUTIVE-OVERVIEW.md) | Everyone |
| 02 | [Current production position](02-CURRENT-PRODUCTION-POSITION.md) | IT, Cybersecurity |
| 03 | [Business decision register](03-BUSINESS-DECISIONS.md) (summary; the register is `docs/RISE-BUSINESS-DECISIONS.md`) | Everyone |
| 04 | [Role and authority matrix](04-ROLE-AND-AUTHORITY-MATRIX.md) | IT, QMS |
| 05 | [End-to-end workflow](05-END-TO-END-WORKFLOW.md) | IT, QMS |
| 06 | [Data model in plain language](06-DATA-MODEL.md) | IT |
| 07 | [Microsoft 365 production requirements by capability](07-M365-PRODUCTION-REQUIREMENTS.md) | IT |
| 08 | [Security and control matrix](08-SECURITY-CONTROL-MATRIX.md) | IT, Cybersecurity, QMS |
| 09 | [Test evidence](09-TEST-EVIDENCE.md) | IT, QMS |
| 10 | [User Acceptance Testing plan](10-UAT-PLAN.md) | Business, QMS, IT |
| 11 | [Real iPhone User Acceptance Testing](11-REAL-IPHONE-UAT.md) | Business |
| 12 | [Migration and SCORE reconciliation plan](12-MIGRATION-AND-SCORE-RECONCILIATION.md) | QMS, IT |
| 13 | [Non-functional requirements](13-NON-FUNCTIONAL-REQUIREMENTS.md) | IT |
| 14 | [Deployment and environments](14-DEPLOYMENT-AND-ENVIRONMENTS.md) | IT |
| 15 | [RACI](15-RACI.md) | Everyone |
| 16 | [Open IT decisions](16-OPEN-IT-DECISIONS.md) | IT |
| 17 | [Open business confirmations](17-OPEN-BUSINESS-CONFIRMATIONS.md) | Product Owner, QMS, QHSE |
| 18 | [Go-live checklist](18-GO-LIVE-CHECKLIST.md) | Everyone |

There are also two companion documents:
- `docs/MOHAMMED-IT-HANDOVER-CHEAT-SHEET.md`: the terms IT will use, in plain language;
- `docs/IT-HANDOVER-QA.md`: the questions IT is likely to ask, each with a simple answer and a technical one.

## Detailed references still current

| Document | Use it for |
|---|---|
| `docs/RISE-BUSINESS-DECISIONS.md` | The owner's decisions (authoritative) |
| `docs/BUSINESS-RULES.md` | The detailed rules, section by section (authoritative for rules) |
| `docs/DATA-MODEL.md` | Field-level entities, server-owned fields, concurrency |
| `docs/AZURE-INTEGRATION-REQUIREMENTS.md` | Detailed integration notes: configuration, routing, the PWA, error states. Its architecture diagram is one option, not a decision (16) |
| `docs/API-REQUIREMENTS.md`, `docs/FRONTEND-API-CONTRACT.md` | A *candidate* request/response contract and the map from each prototype function to it, if IT chooses an API. Not a decision |
| `docs/AZURE-UAT-CHECKLIST.md` | Detailed checks for the User Acceptance Testing in 10 |
| `docs/TESTING.md` | How to run the automated tests |
| `docs/QA/PRODUCT-INTEGRITY-REASSESSMENT-POST-PR29.md` | Every finding and its current status |
