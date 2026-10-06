# 04 Role and authority matrix

Read from the prototype's role table (`roles.js`, `TAQA_ROLES`) and the rules in `docs/BUSINESS-RULES.md` §4–§9 and §21. Under BD-02, no role or route has been added beyond these.

**PROTOTYPE-PROVEN** for every cell below (except where marked *target*), in the browser only. **PRODUCTION CONTROL REQUIRED** for every cell: in production the server or platform decides, from the signed-in identity. The role names are the business's. How Entra ID groups or app roles map onto them is **IT DECISION REQUIRED**.

| Capability | Employee | QMS / Document Controller | Segment Director | Maintenance Manager | External Auditor |
|---|---|---|---|---|---|
| **View documents in force** | Yes, `internal` only | Yes, all classifications | Yes, `internal` and `confidential` | Yes, `internal` and `confidential` | Yes, all classifications |
| **View withdrawn / superseded** (marked "do not use") | Yes, `internal` only | Yes | Yes (classification as above) | Yes (classification as above) | Yes |
| **View drafts and approved-not-yet-effective** | Own filings only | All areas | Own area only | Own area only | All areas (read only) |
| **File (Upload) a document** | Yes (not a Policy) | Yes; **only QMS files a Policy** | Yes (not a Policy) | Yes (not a Policy) | No |
| **QMS conformance check** (first step) | No | **Yes**, every area, never their own filing | No | No | No |
| **Final approval** (releases the document) | No | **Never** (QMS never gives final approval, delegation included) | **Yes**: Operations documents of the area they hold, after QMS | **Yes**: maintenance documents (department Maintenance, or type Maintenance Bulletin) of their segment, after QMS | No |
| **Return (reject) with a reason** | No | Yes, at the QMS step | Yes, at the final step, own area / Operations | Yes, at the final step, own segment / Maintenance | No |
| **Manage** (edit descriptive details) | No | Yes, every area | Own area, Operations | Own segment, Maintenance | No |
| **Withdraw** (with a recorded reason) | No | Yes, every area | Own area, Operations | Own segment, Maintenance | No |
| **Delegate** (grant authority for a period) | No | No | Yes: approval and/or "Manage documents", own area, ≤ 90 days | Yes: same, own maintenance department | No |
| **Act as a delegate** *(target: the delegate signs in as themselves)* | Yes, if granted | Never approves, delegation included | Yes, if granted | Yes, if granted | No |
| **Register view / F086 export** | No | Yes | No | No | Yes (read only) |
| **Scope** | All areas, to read | All areas | The area they hold | The segment's maintenance department | All areas, read only |

## Rules that cut across the matrix

- **Separation of duties** (decided 4 Oct 2026, `BUSINESS-RULES.md` §4 and §12 #8): the filer, the QMS checker and the final approver are three different people, delegation included.
- **A delegation replaces authority while it is in use; it does not add to it** (PI-04):
  - a delegate never re-delegates;
  - the QMS check is not delegable;
  - a delegate cannot file or export under the delegation;
  - the grant is limited to the grantor's area and department and any document types it names;
  - its grant and revocation are recorded (`BUSINESS-RULES.md` §9).
- **The Auditor changes nothing.**
  - *Production:* access is time-boxed per audit and revoked at close. The prototype does not enforce the time box. **PRODUCTION CONTROL REQUIRED.**
- **Delegation in the prototype:** the grantor simulates the delegate in their own session ("Act as this"); the prototype cannot show a second person (`delegateId` is null). QMS cannot act under a Director's delegation at all. The row above is the target; **PRODUCTION CONTROL REQUIRED**.
- **Policies:** only QMS may file a Policy (`BUSINESS-RULES.md` §10). With one simulated QMS identity, a QMS-filed Policy cannot then be QMS-checked by "another" QMS person, so no Policy completes the workflow in the prototype (a documented limitation, §17).
- **Unconfirmed approvers** (BD-02): the register's per-type "approver" names (Policy → CEO, Lesson → QHSE Manager, Manual → SME, Alert → Corporate Function VP / Director) are **not** approval routes. They are still *displayed* on Upload's confirmation, the type table, the document page's "Approval authority" cell, the Master List drawer and the **F086 export's "Approver Role" column** (PI-15). *Prototype:* every type is routed to the area holder or Maintenance Manager. *Production:* Policy, Manual, Lesson Learned, Alert and any type not covered are not configured until the approval matrix is confirmed (**BUSINESS DECISION REQUIRED**, 17 BC-01).
- **Restricted and Confidential documents and their approver (BD-08).** Final approval goes only to an approver cleared for the classification; the route is unchanged. With no eligible approver the workflow is blocked and escalated for an authorised approver to be assigned; QMS does not step in. In the prototype a Restricted document at final approval is always blocked, since Directors and Maintenance Managers are cleared for `internal` and `confidential` only.
- **Target, not built:** segment membership.
  - Employees see their own operational segment(s) plus the shared areas.
  - The Director manages Operations members, the Maintenance Manager Maintenance members, QMS all.
  - Details are in `docs/BUSINESS-RULES.md` §14. The prototype lets every Employee read every area.
