# 03 Business decision register (summary)

The authoritative register is **`docs/RISE-BUSINESS-DECISIONS.md`**. Each decision there has its reason, its prototype and production meaning, its owner, its date and its open confirmations. This page is the short version. If the two ever differ, the register wins.

| ID | Decision | What IT must take from it |
|---|---|---|
| BD-01 | **SCORE remains the system of record** until TAQA formally approves a transition. RISE is the specification, the user experience and the reference prototype | Do not design production RISE as a second authoritative register. How RISE connects to SCORE is IT's choice. Any transition needs QMS / document-governance approval, IT approval and a reconciliation (12) |
| BD-02 | **Approvals:** Operations: Employee → QMS check → Segment Director. Maintenance: Employee → QMS check → Maintenance Manager. No other final-approval route is invented | Implement these two routes only. The approver for other document types waits for the business approval matrix (17) |
| BD-03 | **Restricted / confidential:** a user who may not open a document does not see its title or metadata, not even as a locked item. Lists, counts and search are permission-trimmed | Server-side / Microsoft 365 permission trimming is the control. Browser filtering is not |
| BD-04 | **Ask Expert:** QMS triages and routes to the technical SME. Critical is not an emergency channel, and the neutral wording stays until QHSE supplies TAQA's. "Sent" and a ticket number appear only after the Microsoft 365 destination confirms receipt | Choose a destination that can confirm receipt |
| BD-05 | **Read offline, send online.** Offline reading only of content approved for caching. Nothing authoritative is queued | No offline write queue without a new decision. Decide the caching policy (with Cybersecurity) |
| BD-06 | **Field Glossary:** the technical SME approves or rejects the meaning. QMS / admin manages duplicates, categories, lifecycle and withdrawal | The workflow needs an SME per category (named by the business) |
| BD-07 | **Sequencing:** decisions → narrow integrity close-out → this handover → only then premium design or the full QMS Dashboard | No design or dashboard work is in scope of this handover |

## Ownership boundary

Mohammed owns:
- business rules;
- workflow outcomes;
- priorities;
- acceptance criteria.

IT owns:
- whether SharePoint Lists / Power Automate are enough;
- any custom API;
- hosting, database and deployment architecture;
- authentication implementation;
- monitoring and backup.

**Example:** "Two people must not approve the same controlled step, and a second approval must be refused" is the business requirement. Which technology enforces it is IT's decision.
