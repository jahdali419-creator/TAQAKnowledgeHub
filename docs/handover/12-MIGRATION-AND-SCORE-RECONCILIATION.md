# 12 Migration and SCORE reconciliation plan

**A plan only.** Nothing here has been run, and nothing here deletes or overwrites data.

Under **BD-01, SCORE remains the system of record**. This plan covers two situations:
- **(A) Starting production RISE beside SCORE.** RISE reads from, or reconciles to, SCORE, and SCORE stays authoritative. This is the default.
- **(B) A transition of authority from SCORE to RISE**, only if TAQA formally approves one. That needs QMS / document-governance approval, IT approval, and the reconciliation below completed first.

The mechanism in both cases (a link, a read, a sync, or a one-off import) is **IT DECISION REQUIRED**.

## 1. What exists today

| Source | What it holds | Status |
|---|---|---|
| **SCORE** | TAQA's authoritative controlled-document register and files | Authoritative (BD-01) |
| **Prototype register** (`documents-master.js`) | 585 records reconstructed for the prototype, across 25 areas, with lookups for areas and types | Demonstration data, **not authoritative** |
| **Register checker** (`node scripts/check-register.js`) | 302 known findings in the prototype register, listed in its baseline | Evidence for cleanup, not a migration source |
| **Cleanup report** (`docs/QA/REGISTER-CLEANUP-REPORT.md`) | QMS-facing list of the register findings | Input to reconciliation |

## 2. Steps

1. **Agree the scope and the owner.**
   - Which document types, areas and statuses are in scope.
   - QMS owns the reconciliation decisions. IT owns the extraction and the tooling.
   - Mark unconfirmed owners per area (15).
2. **Extract SCORE.**
   - A read-only export of numbers, titles, revisions, statuses, dates, owners, classification and file references, taken as of a stated date and time.
3. **Compare with the prototype register.**
   - Match by document number, then by legacy ID.
   - Report, per record:
     - in both and identical;
     - in both and different (field by field);
     - in SCORE only;
     - in the prototype only.
   - Nothing is changed in either source by the comparison.
4. **Classify each difference**, with QMS deciding each one. Typical classes:
   - numbering (placeholder `###`, provisional codes, legacy IDs);
   - a revision chain (a superseded revision whose successor is missing, for example "Rev 4.0");
   - status (withdrawn in one, current in the other);
   - ownership / area;
   - classification;
   - translations (source missing or not in force).
5. **Ownership.** Confirm the owning area, department (Operations / Maintenance) and final approver (BD-02) of every in-scope document. Unconfirmed approvers go to 17.
6. **Revisions.**
   - Confirm exactly one revision in force per number.
   - Superseded revisions keep their history and point at a real successor.
   - Open revisions in progress are listed for QMS to finish or cancel before cutover, never migrated half-way.
7. **Classification.** Confirm the classification of every in-scope document (BD-03). A document whose classification is unknown is treated as the most restrictive until QMS decides. **BUSINESS DECISION REQUIRED** (17): this is a proposal, not decided here.
8. **Validation.**
   - Re-run the comparison on the cleaned data.
   - Run the register checks against the target store: one number once, one in force, chains complete, translations linked.
   - Sample-check files: open, correct revision, fingerprint recorded.
   - QMS signs off the counts per area and type.
9. **Cutover** (only in situation B, or when production RISE first goes live in situation A):
   - freeze changes in the source for an agreed window;
   - take the final extract;
   - load;
   - validate the counts and samples;
   - QMS and IT sign off;
   - open to users.
10. **Rollback.**
    - Before cutover, agree the point of no return and how to go back: the source stays read-only and intact until sign-off, and the load can be discarded.
    - A rollback is tested in the UAT environment before it is needed.

## 3. What must never happen

- The prototype register is not loaded into production as if it were true.
- No record is deleted to make the numbers match. Differences are resolved by QMS decision and recorded.
- SCORE is not changed by RISE unless a transition (B) has been approved.

## 4. Decisions this plan needs

| Decision | Owner |
|---|---|
| Situation A or B, and when | TAQA QMS / document governance, with the Product Owner and IT (BD-01) |
| Integration or import mechanism | IT |
| Scope (types, areas, statuses, history depth) | QMS with the Product Owner |
| Treatment of each difference class | QMS |
| Freeze window, cutover date, rollback point | IT and QMS |
