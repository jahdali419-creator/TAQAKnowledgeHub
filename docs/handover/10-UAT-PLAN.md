# 10 User Acceptance Testing plan

**User Acceptance Testing (UAT)** is the stage where the people who will use RISE check, in a test copy of the real system, that it does what the business needs. It takes place **after** IT has built the production design in a test / UAT environment (14), with real Microsoft Entra ID accounts. It cannot be done on the prototype, because the prototype has no real sign-in, storage or server.

The detailed check-by-check list is `docs/AZURE-UAT-CHECKLIST.md`. This plan says who tests what, and how a result is recorded.

## Rules for the UAT

- A check passes only when it is **observed**, not assumed.
- Record for each check:
  - the account used;
  - the document number and revision;
  - the date and time;
  - pass or fail;
  - a screenshot for every fail.
- Every negative check ("must be refused") is also tried **directly against the platform**, not only through the screen. IT shows how: for example a direct list write or a flow run with another account's token. The screen hiding a button is not the control.
- A failed check opens a defect. A business question opens a confirmation (17). Nobody resolves either by assumption.
- Real-iPhone checks are recorded separately (11).

## Accounts needed

- One real account per role, with defined areas: Employee, QMS / Document Controller, Segment Director (area A), Maintenance Manager (segment A), External Auditor (time-boxed).
- A second Employee.
- A second Segment Director (area B), for the out-of-area checks.
- One spare account to act as a delegate.

## Scenarios by role

### Employee
1. Sign in; RISE shows the right name and role, with no "View as" switch.
2. Find a current document by search, by area and by its exact number; it says "Current, OK to use" and to verify against SCORE.
3. Search the exact number of a superseded document: it is shown marked "Superseded. Do not use", never as current.
4. Restricted and confidential documents: no title, no count, no search hit, no bookmark; a direct link reads like an unknown number (BD-03).
5. File a document (one file); see it as "Submitted", waiting on QMS; the number cannot be reused.
6. Cannot check, approve, withdraw or delegate, through the screen **or** directly against the platform.
7. Offline: an opened page stays readable; filing is refused with "Not sent" and the typed work is kept (BD-05).
8. Ask Expert: "sent" and a ticket number appear only after the destination confirms receipt. Critical shows TAQA's approved emergency wording (BD-04).

### QMS / Document Controller
1. The "Waiting on QMS" queue holds every area's filings; the bell count equals the queue.
2. Confirm one filing; return one with a reason (≥ 20 characters); the filer sees the reason.
3. Cannot check their own filing; cannot give final approval (also directly against the platform).
4. Withdraw a document with a reason; any revision in progress is cancelled in the same step; the audit trail shows who, when and why.
5. Two QMS users act on the same filing at once: exactly one decision succeeds, and the other is refused without changing anything.
6. Export the register (F086) and match it to the platform's records.

### Segment Director (area A)
1. "Open your queue" from any page reaches area A's desk, listing exactly what the bell counted (PI-17).
2. Approve an Operations document after the QMS check; it becomes current, and the previous revision superseded, at once.
3. Approve with a future effective date: the old revision stays current until that date, then is superseded once.
4. Cannot approve: a maintenance document; area B's document; their own filing; a document they checked.
5. Delegate approval to the spare account for 30 days; the delegate approves as themselves; the record shows the delegate, the grant and the grantor; revoke, and the next delegate action is refused.
6. A grant longer than 90 days, starting in the past, or for another area is refused.

### Maintenance Manager (segment A)
1. Approve a maintenance document or a Maintenance Bulletin of segment A after the QMS check.
2. Cannot approve an Operations document.
3. Withdraw a maintenance document with a reason; cannot withdraw an Operations one.
4. Delegation, as for the Director, for the maintenance department only.

### External Auditor
1. Reads everything, including the register export and the audit trail; the trail shows each filing, check, approval, return, withdrawal, grant and revocation, with identities and server times.
2. Changes nothing (screen and platform).
3. Access ends on the agreed date.

### Cross-cutting (IT with QMS)
1. A new release reaches users without reloading a page in the middle of their work.
2. A restore from backup to a known point, checked by QMS against the register (13).
3. The SCORE reconciliation sample checks (12).

## Exit criteria

UAT passes only when all of the following hold *(proposed; the sign-off owners and whether real-iPhone failures block exit are BUSINESS DECISION REQUIRED, 17)*:
- every check passes or has an accepted, recorded exception signed off by the Product Owner and QMS;
- no open defect touches separation of duties, visibility (BD-03), revision control or the audit trail;
- the real-iPhone checks are recorded (11).
