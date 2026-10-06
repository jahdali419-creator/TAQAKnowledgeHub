# RISE business decisions register

**Status: CURRENT. This is the single authoritative register of the product owner's business decisions for RISE (TAQA Knowledge Hub).**

Owner of this register: Mohammed (Product Owner). Last updated 6 October 2026.

Where another document disagrees with a decision recorded here, this register wins. Rules that are already written in detail in `docs/BUSINESS-RULES.md` stay there. This register records the decision, the reason for it and where it applies.

## Who decides what

This boundary applies to every decision below and to every handover document.

| Mohammed (Product Owner) decides | IT decides |
|---|---|
| Business rules | Whether SharePoint Lists and Power Automate are enough |
| Workflow outcomes: who files, checks, approves, returns, withdraws and delegates | Whether a custom API is needed |
| Priorities | Hosting, database, deployment architecture |
| Acceptance criteria (what "correct" looks like to the business) | How authentication is implemented (Entra ID configuration, MFA, Conditional Access) |
| | Monitoring, backup and recovery mechanisms |

QMS, QHSE and Cybersecurity confirm the items marked for them below.

For example, "Two people must not approve the same controlled step, and a second approval must be refused" is Mohammed's requirement. Which technology enforces it is IT's decision, for instance a SharePoint item version check, a Power Automate condition or an API. RISE documents never ask Mohammed to choose the architecture.

## Summary

| ID | Decision | Status | Approved | IT / QMS confirmation still needed |
|---|---|---|---|---|
| BD-01 | SCORE remains the system of record; RISE is the specification, user experience and reference prototype | Approved | 6 Oct 2026 | Yes: QMS/document governance and IT, if a transition is ever proposed |
| BD-02 | Approval ownership: Operations → QMS check → Segment Director; Maintenance → QMS check → Maintenance Manager | Approved | 6 Oct 2026 | Yes: QMS/business, for document types not yet confirmed |
| BD-03 | Restricted / confidential titles and metadata are not shown to users who may not open them | Approved | 6 Oct 2026 | Yes: IT and Cybersecurity, for the enforcing mechanism |
| BD-04 | Ask Expert: QMS triages and routes to the technical SME; Critical is not an emergency channel | Approved | 6 Oct 2026 | Yes: QHSE (wording and contacts), IT (destination) |
| BD-05 | Offline: read offline, send online | Approved | 6 Oct 2026 | Yes: IT and Cybersecurity (what may be cached) |
| BD-06 | Field Glossary: the technical SME owns meaning; QMS/admin owns governance | Approved | 6 Oct 2026 | Yes: business, to name the SMEs per category |
| BD-07 | Sequencing: lock decisions → close narrow integrity findings → M365/IT handover → then reassess premium design and the full QMS Dashboard | Approved | 6 Oct 2026 | No |
| BD-08 | Final approval of a Restricted / Confidential document goes only to an approver cleared to open it; otherwise the workflow is blocked and escalated | Approved | 6 Oct 2026 | Yes: IT (clearance and assignment mechanism); governance process for assigning an authorised approver |
| BD-09 | Document-number validation never reveals that a Restricted / Confidential document exists | Approved | 6 Oct 2026 | Yes: IT (number allocation mechanism) |

---

## BD-01 System of record

**Decision.** SCORE remains TAQA's existing authoritative register of controlled documents until TAQA formally approves a transition.

RISE is three things:
- the product and workflow specification;
- the user-facing knowledge experience;
- the prototype and reference implementation.

RISE is never described as the official production system of record. If RISE and SCORE disagree, the prototype does not claim to override SCORE.

**Business reason.** SCORE is the register TAQA's QMS and auditors rely on today. Replacing a register of record is a governance change, not a software release. Two registers that both claim authority would be a document-control failure (TQ-QHSE-S001 4.6, 5.5).

**What it means for the prototype.**
- The prototype keeps its register in the browser (`localStorage`). It is demonstration data and never authoritative.
- Document pages keep the line "Verify the current revision in SCORE before use".
- No RISE screen, document or test claims that RISE is the register of record.

**What it means for production.**
- Any transition from SCORE to RISE (or to a RISE-backed M365 store) needs, in order:
  1. QMS / document-governance approval;
  2. IT approval;
  3. a reconciliation and migration (see `docs/handover/12-MIGRATION-AND-SCORE-RECONCILIATION.md`).
- Until then, production RISE reads from or links to SCORE, or runs beside it with an agreed reconciliation. **How** RISE and SCORE are integrated (link, sync, read replica, one-off import) is **IT's decision, not Mohammed's**.

**Owner.** Mohammed (business position); QMS / document governance (any transition); IT (integration pattern).

**Status.** Approved.

**Date approved.** 6 October 2026.

**Related findings and rules.**
- `docs/AZURE-INTEGRATION-REQUIREMENTS.md` (SCORE link base);
- `docs/BUSINESS-RULES.md` §16 (document identity);
- PI-12 (production file / hash binding);
- `docs/QA/REGISTER-CLEANUP-REPORT.md`.

**IT / QMS confirmation still needed.** Yes:
- IT chooses the SCORE integration pattern;
- QMS and IT approve any transition.

---

## BD-02 Approval ownership

**Decision.**
- **Operations documents:** Employee files → QMS check → **Segment Director** approves. The Segment Director is the area holder: the Function Head or Centre Manager, by area family.
- **Maintenance documents:** Employee files → QMS check → **Maintenance Manager** approves.

No CEO, QHSE Manager or SME final-approval route is invented. Where a document type's approver has not been confirmed, it is marked **requires QMS / business confirmation**. The workflow is extended only after the business approval matrix is confirmed.

**Business reason.** These two routes are the ones the business has confirmed. Approvers named per type in older register data (for example Policy → CEO, Lesson → QHSE Manager, Manual → SME, Alert → Corporate Function VP / Director) were never confirmed by the owner or QHSE. Encoding them would invent authority.

**What it means for the prototype.**
- The prototype already routes this way (`roles.js` `TAQA_APPROVAL`; `docs/BUSINESS-RULES.md` §2, §4, §17).
- Separation of duties is already enforced in the prototype: the filer, the QMS checker and the final approver must be three different people (§12 #8).
- Five places still *display* the unconfirmed per-type approver names beside the real route (PI-15, partially fixed):
  1. Upload's confirmation;
  2. the document-type table;
  3. the document page's "Approval authority" cell;
  4. the Master List record drawer;
  5. the **F086 register export's "Approver Role" column**.

  That display is recorded here as **requires QMS / business confirmation**. It is outside the four findings closed in October 2026 and is not changed by them.
- *Correction, 6 Oct 2026 (approved by Mohammed):* this note first said "Upload and the type table" (two places). There are five, as listed above. Factual correction only; BD-02 itself is unchanged.

**What it means for production.**
- The production workflow implements these two routes only.
- Any other document type's approver is configured only after QMS and the business confirm the approval matrix.
- Separation of duties and "one decision per step" must be enforced by the server. How is IT's decision.

**Owner.** Mohammed; QMS (the approval matrix per document type).

**Status.** Approved. The per-type matrix beyond these two routes is open.

**Date approved.** 6 October 2026.

**Related findings and rules.**
- `docs/BUSINESS-RULES.md` §2, §4, §12 #1 (open: approver by type), §12 #8, §17;
- PI-15 (partially fixed), PI-16, PI-31.

**IT / QMS confirmation still needed.** Yes: QMS / business must confirm the approver for these types:
- Policy;
- Manual;
- Lesson Learned;
- Alert;
- any type not yet covered by the two routes.

---

## BD-03 Restricted / confidential visibility

**Decision.**
- A user who is not authorised to open a restricted or confidential document must **not** see its title or metadata, not even as a locked item.
- Search results, lists and counts are **permission-trimmed**: they contain only what the user may open.

**Business reason.** A title alone can disclose sensitive information, for example a client, an incident or a commercial matter. A count that includes documents the reader cannot open also misstates what is "in force" for them. `docs/BUSINESS-RULES.md` §11 already read this way, and the owner has now confirmed it.

**What it means for the prototype.**
- Reader-facing lists, counts, search, the viewer, bookmarks and related lists use the same role check (`TAQA_ROLE.canSee`) as the Master List, as far as is practical.
- A document the role may not open behaves like a document that does not exist for that user. Its title, number and metadata are not shown.
- **This is browser filtering of demonstration data. It is not security.** Anyone with the browser's developer tools can read the whole prototype register.

**What it means for production.**
- **PRODUCTION CONTROL REQUIRED:** Microsoft 365 / server-side permission trimming and sensitivity / access enforcement are authoritative. Examples are SharePoint item permissions, sensitivity labels and search security trimming. IT and Cybersecurity choose the mechanism.
- The server must never send a restricted title to a client that may not see it.

**Owner.** Mohammed (the rule); IT and Cybersecurity (the enforcing mechanism).

**Status.** Approved.

**Date approved.** 6 October 2026.

**Related findings and rules.**
- PI-27 (closed in the prototype in October 2026, production control still required);
- `docs/BUSINESS-RULES.md` §11, §14.

**IT / QMS confirmation still needed.** Yes:
- IT and Cybersecurity choose and configure the mechanism.
- QMS confirms the **classification policy at upload**. Who sets the classification, and is there a default? Today the prototype's Upload always files `internal`; see PI-27.
- **Who approves a restricted document:** answered by **BD-08** (6 Oct 2026). Only an approver cleared for the classification; otherwise blocked and escalated.

---

## BD-04 Ask Expert

**Decision.**
- **QMS is the triage point** for Ask Expert questions. QMS routes each question to the relevant technical SME. QMS is not automatically the owner of the answer.
- **Critical is not an emergency channel.** RISE shows the approved neutral wording until QHSE supplies official wording and contacts. No phone numbers are invented.
- Production must not say "sent" or show a ticket number until the Microsoft 365 destination has confirmed receipt.

**Business reason.**
- QMS knows who owns which subject. The technical SME knows the answer.
- A worker in danger must use the site emergency procedure, not a web form.
- A false "sent" leaves a question unanswered with nobody aware of it.

**What it means for the prototype.**
- The prototype has no ticket system. It says: "This preview has no connected ticket system. Your question was not sent."
- The question text is kept, and no ticket number is made (PR 2D; `docs/BUSINESS-RULES.md` §20).
- The approved neutral Critical wording is shown.
- The page today describes the question as going to "the expert for this area". Production routing goes through QMS triage, as above. The prototype sends nothing, so nothing is mis-routed today.

**What it means for production.**
- There is a real M365 destination, chosen by IT.
- QMS triage and routing happen in it.
- "Sent" and the ticket number appear only after the server confirms.
- QHSE supplies the official emergency wording and contacts.

**Owner.** Mohammed (the rule); QMS (triage); QHSE (emergency wording and contacts); IT (destination).

**Status.** Approved.

**Date approved.** 6 October 2026.

**Related findings and rules.** `docs/BUSINESS-RULES.md` §20; PR 2D decisions A (Ask Expert) and A (Critical wording).

**IT / QMS confirmation still needed.** Yes:
- QHSE: official emergency wording and contacts;
- IT: the destination and how receipt is confirmed;
- QMS: the triage procedure and the SME list.

---

## BD-05 Offline

**Decision.** **Read offline, send online.**
- Offline viewing is allowed only for content that is safe and approved for caching on the device.
- None of these are queued for later: Upload, QMS decisions, approvals, returns, withdrawals, delegation, or any other authoritative change.
- Any future offline write queue is a separate business, security and architecture decision.

**Business reason.**
- A change made offline and sent later can arrive after someone else's decision and silently overwrite it.
- A cached copy of a controlled document can go out of date without the reader knowing.

**What it means for the prototype.**
- Already implemented in PR 2D (`docs/BUSINESS-RULES.md` §20). Every register change is refused while RISE cannot be reached; nothing is written and typed work is kept.
- Pages already opened stay readable offline, with a bar that says they are saved copies.

**What it means for production.**
- The server is the only authority.
- IT and Cybersecurity decide which content may be cached on devices, and for how long. Controlled documents may need expiry or no caching at all.
- No offline queue is built without a new decision.

**Owner.** Mohammed (the rule); IT and Cybersecurity (what may be cached and how).

**Status.** Approved.

**Date approved.** 6 October 2026.

**Related findings and rules.** PI-26, PI-28, PI-30, PI-48; `docs/BUSINESS-RULES.md` §20.

**IT / QMS confirmation still needed.** Yes: IT and Cybersecurity, for the caching policy for controlled and classified content.

---

## BD-06 Field Glossary ownership

**Decision.**
- The **technical SME / discipline owner** approves or rejects the technical meaning of a term.
- **QMS / admin** manages governance:
  - duplicates;
  - categories;
  - lifecycle;
  - withdrawal and cleanup.
- QMS is not automatically the technical authority.

**Business reason.** A wrong definition of a field term is a safety and quality risk. Only a discipline expert can judge it. Keeping the glossary tidy is a governance task, not a technical one.

**What it means for the prototype.** The prototype is unchanged: "Add term" adds a local, unreviewed "Community" term in this browser only (`docs/BUSINESS-RULES.md` §12 #6, §13). That behaviour is not the target.

**What it means for production.** The flow is propose → Pending Review → the technical SME approves or rejects with a reason → published. QMS / admin handles duplicates, categories and withdrawal (`docs/BUSINESS-RULES.md` §13).

**Owner.** Mohammed (the rule); the named technical SMEs (meaning); QMS / admin (governance).

**Status.** Approved.

**Date approved.** 6 October 2026.

**Related findings and rules.** `docs/BUSINESS-RULES.md` §12 #6, §13.

**IT / QMS confirmation still needed.** Yes: the business must name the technical SME for each glossary category.

---

## BD-07 Sequencing

**Decision.** The order of work is:
1. Lock these decisions.
2. Close the narrow integrity findings PI-27, PI-22, PI-23 and PI-17.
3. Prepare the Microsoft 365 / IT handover.
4. Only then reassess premium design and the full QMS Dashboard.

Premium design and the full QMS Dashboard are **not** started now.

**Business reason.** IT needs a stable, honest specification before it can size and build production. Visual redesign and a dashboard add surface without reducing production risk.

**What it means for the prototype.** No premium-design or dashboard work in this phase. The premium-design branch is not touched.

**What it means for production.** The handover pack (`docs/handover/`) is the input to IT's production design.

**Owner.** Mohammed.

**Status.** Approved.

**Date approved.** 6 October 2026.

**Related findings and rules.** Dashboard-fold candidates PI-19, PI-20, PI-43, PI-45, NEW-07, NEW-09, NEW-10 stay open (`docs/QA/PRODUCT-INTEGRITY-REASSESSMENT-POST-PR29.md`).

**IT / QMS confirmation still needed.** No.

---

## BD-08 Final approval of a Restricted or Confidential document

**Decision.**
- A Restricted or Confidential document is never sent for final approval to a person who is not permitted to open it.
- The final-approval roles stay as in BD-02: Operations → Segment Director; Maintenance → Maintenance Manager. The individual acting in that role, a delegate included, must also be permitted for the document's classification.
- If no eligible final approver exists:
  - classification is not bypassed;
  - QMS does not become the final approver merely to let the workflow continue;
  - the workflow is blocked and escalated until an authorised approver is assigned under the production governance process.

**Business reason.** An approver who cannot open a document cannot judge it, and would either approve it unseen or be given access the classification forbids. Neither is acceptable for a controlled document.

**What it means for the prototype.**
- `TAQA_APPROVAL.canApprove` refuses a role not cleared for the classification, and `TAQA_STORE.approve` refuses with it.
- The approver's desk, bell and Home count do not list or count such a document.
- The document shows as waiting on "an authorised final approver (escalated …)" to those who may see it: QMS, the auditor and its filer.
- In the prototype, clearance is the role's classification list. Segment Directors and Maintenance Managers hold `internal` and `confidential`, so a Restricted document reaching final approval is always blocked and escalated in the prototype.
- This is browser behaviour over demonstration data, not security.

**What it means for production.**
- **PRODUCTION CONTROL REQUIRED.** The server checks the individual approver's clearance for the classification before routing and at approval, and holds the item in an escalated state when nobody eligible exists.
- How Microsoft 365 records clearance and assigns an authorised approver is **IT's decision**.
- The governance process that names that approver is the business's (QMS).

**Owner.** Mohammed (the rule); QMS (assignment governance); IT (mechanism).

**Status.** Approved. Answers BC-06.

**Date approved.** 6 October 2026.

**Related findings and rules.** BD-02, BD-03; BC-06; PI-27; `docs/BUSINESS-RULES.md` §21.

**IT / QMS confirmation still needed.** Yes:
- IT: the clearance and assignment mechanism;
- QMS: the escalation and assignment procedure.

---

## BD-09 Document-number validation does not reveal Restricted or Confidential documents

**Decision.**
- An unauthorised user must not learn from document-number validation that a Restricted or Confidential document exists.
- A clash with such a document is refused in neutral words: "This number cannot be used. Choose another number or contact QMS."
- The refusal never reveals:
  - that the document exists;
  - its title;
  - its area;
  - its classification;
  - any other metadata.

**Business reason.** Confirming that a restricted number exists is itself disclosure (BD-03).

**What it means for the prototype.**
- Upload, and the register's own filing check, use the neutral wording when the clashing record is one the person may not open. Uniqueness is still enforced against the whole register.
- Possible-duplicate advice (same file, similar title) never mentions a document the filer may not open; that advice never stops a filing.

**What it means for production.** Preferably the platform allocates controlled document numbers authoritatively rather than relying on user-chosen numbers. How is **IT's decision**.

**Owner.** Mohammed (the rule); IT (mechanism).

**Status.** Approved. Answers BC-13.

**Date approved.** 6 October 2026.

**Related findings and rules.** BD-03; BC-13, BC-17; `docs/BUSINESS-RULES.md` §16, §21.

**IT / QMS confirmation still needed.** Yes: IT, for number allocation.

---

## Open items recorded by the owner

- **BC-12: OPEN, POTENTIAL PUBLIC INFORMATION EXPOSURE** (6 Oct 2026).
  - **Treatment:** only the generated labels and control fields of the prototype register are confirmed as demonstration data. Every other register title is treated as potentially sensitive until TAQA confirms otherwise. None is reclassified as safe on assumption.
  - **Kept private:** the review, the containment plan and the confirmation questions are held by the Product Owner, not in this repository.
  - **Owner's approval required:** no repository-visibility change, site takedown, deletion or history rewrite is made without the owner's explicit approval.

## Change control for this register

- A new decision gets the next ID (BD-08, …), with every field above, and is approved by Mohammed.
- A changed decision keeps its ID. Record the change and the new approval date beneath the decision; never silently rewrite it.
- Implementation never changes a decision. If code or a handover document would need a different decision, work stops and the question goes to Mohammed.
