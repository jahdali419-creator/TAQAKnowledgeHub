# TQ-QHSE-S001 Document Management Standard — gap analysis

Review of **TQ-QHSE-S001 Document Management Standard, V3.0, 22 July 2024**
against **ISO 9001:2015** and **API Specification Q2, 3rd Edition (September 2026)**.

Prepared for the TAQA Learning Center · 20 September 2026
Classification: Internal Use

---

## What was compared, and why

Three documents were supplied: the TAQA standard and the two external standards it
has to satisfy. This review treats **TQ-QHSE-S001 as the document under review** and the
two standards as the yardstick. That is the comparison that produces an action list.

Clause references are paraphrased, not reproduced. The source standards are licensed to
TAQA through Accuris and must not be copied into internal documents.

| Yardstick | Clauses that govern this standard |
|---|---|
| ISO 9001:2015 | 7.5.1 General · 7.5.2 Creating and updating · 7.5.3.1 and 7.5.3.2 Control of documented information |
| API Spec Q2, 3rd Ed. | 4.4.1 General · 4.4.2 Procedures · 4.4.3 Control of Internal Documents · 4.4.4 Control and Use of External Documents · 4.5 Control of Records |

---

## Headline

**The standard is broadly sound in structure but is now out of date against API Q2, and
one clause is directly non-compliant.**

The single most important finding: **TQ-QHSE-S001 §7.5 and §7.6 set record retention at a
minimum of five years**, with a ten-year exception only for API Q1 and medical records.
**API Q2 3rd Edition §4.5 requires a ten-year minimum for all records in its scope**, including
records originating from outsourced activities. The expansion of the retention period is
listed by API itself as one of the notable changes from the 2nd to the 3rd Edition.

The second most important finding: **V3.0 was written to API Q1 10th Edition** — that is what
its own version history says was added in the July 2024 revision. It predates API Q2 3rd
Edition entirely. **The API Monogram effective date for the 3rd Edition is 1 October 2027**, so
there is a fixed deadline for the transition, and document control is normally the first
clause an auditor tests.

Everything else below is a gap, an omission, or a defect — ranked so the work can be
sequenced.

---

## Part 1 — Compliance gaps

Severity: **Critical** = a finding an auditor would raise as a non-conformity.
**Major** = a requirement of the standard that the document does not address.
**Minor** = addressed but weakly, or an internal inconsistency.

| # | Severity | Clause | Gap | Required action |
|---|---|---|---|---|
| G-01 | Critical | API Q2 §4.5 | Retention is set at five years minimum (§7.5, §7.6). API Q2 3rd Ed. requires ten years minimum for all records, or longer where customer, legal or other requirements demand it. | Rewrite §7.5 and §7.6 to a ten-year minimum. Keep the "whichever is longer" rule. Remove the framing that treats ten years as an API Q1 and medical exception. |
| G-02 | Critical | API Q2 §4.4.3 | The procedure must cover revisions, **translations** and updates. The standard contains nothing on translated documents — which language version governs, how a translation is verified, how translations are kept in step when the source is revised. TAQA operates across KSA, UAE, India and other jurisdictions. | Add a translation control clause: nominated source language, verification of translation by a competent person, translation revised with the source, and a rule that the source language governs in a conflict. |
| G-03 | Critical | API Q2 §4.5 d) | Record **correction** is not addressed anywhere. There is no rule for correcting an erroneous entry on a hard copy record (single-line strike-through, initial, date, no obliteration) and no rule on audit trails for electronic records. | Add a record correction clause covering both media. |
| G-04 | Critical | API Q2 §4.4.3, ISO 9001 §7.5.3.2 a) | Obsolete control stops at the repository. The standard only requires obsolete documents to be moved to an obsolete folder in SCORE. It does not require **removal or identification of obsolete copies at points of issue and use** — rigs, workshops, bases, laboratories, client sites. | Add a recall rule for controlled hard copies, an "OBSOLETE / SUPERSEDED" stamping rule for anything retained, and a retention period for obsolete masters. |
| G-05 | Critical | API Q2 §4.4.3 c) | Review for continued suitability is undefined for most document types, and the two statements that exist **conflict**: §3.2 requires an annual review of all corporate management system documents, §6.2 requires policy review every 24 months. No review cycle is stated at all for standards, SOPs, work instructions, forms or quality plans. | Publish one review-frequency table by document type. Reference the form on which the review is recorded. Resolve the annual versus 24-month conflict. |
| G-06 | Major | API Q2 §4.4.3 d) | "Identification of changes and current revision status" is not required by the text. The template carries a version history table, but the standard never mandates a summary of change, change marking, or a rule for when a revision is minor (3.1) versus major (4.0). | Mandate the version history block, a summary of change, and a revision numbering rule. |
| G-07 | Major | API Q2 §4.4.3, ISO 9001 §7.5.3.2 a) | §5.2 is titled "Approval, Re-approval, and **Dissemination**" but contains no dissemination mechanism. §3.2 says QHSE will "communicate any update or revision … to all employees" with no method, no timescale, no record and no acknowledgement. There is no controlled copy register and no distribution list. | Define the notification route, the timescale, the acknowledgement record, and the link to briefing or training where a change affects how work is done. |
| G-08 | Major | API Q2 §4.4.4 c), e), f) | External document control (§5.4) identifies changes through IHS Markit notifications and tasks an SME to assess impact — but stops at "the relevant personnel will then be notified". It does not require the affected internal documents to be **updated**, does not require the impact assessment to be **recorded**, sets no timescale, and makes no link to Management of Change. | Close the loop: impact assessment recorded on a form, affected documents listed, revision raised, MOC triggered where the change affects service execution, target dates assigned. |
| G-09 | Major | API Q2 §4.4.4 | **Customer-supplied documents** are named in the scope of §5.4 but have no controls of their own — who registers a client specification, how its version is tracked per job, how it reaches the well site, what happens to it at job close-out. | Add a customer document control clause tied to the job number and the Service Quality Plan. |
| G-10 | Major | API Q2 §4.4.1 | The standard never states what the QMS documentation must **contain**: the scope of the QMS and the services covered, the quality policy and objectives, and the identification of legal and other applicable requirements the organization claims compliance with. §4 lists document *types* but not this required content. | Add a clause stating the required QMS documentation set and where each element is held. |
| G-11 | Major | API Q2 §5.7.1 | API Q2 3rd Ed. uses **Service Quality Plan (SQP)** with ten defined content requirements, revision-on-change and documented approval. The standard still uses the loose term "Quality Plan" in §4 with a one-line definition and no reference to the required content. | Rename to Service Quality Plan and reference §5.7.1 content, revision and approval requirements. |
| G-12 | Major | ISO 9001 §7.5.3.1 b), §7.5.3.2 b) | Protection and preservation of electronic records is largely absent. Daily backup is required only for electronic field job recording. **SCORE itself, SAP SuccessFactors, CMMS, the LMS and SharePoint have no stated backup, restore-test, access-control, audit-trail or retention-enforcement requirement.** Nothing covers readability over a ten-year horizon (file formats, software obsolescence) or what happens to records when a system is decommissioned or migrated. | Add an electronic records clause: backup and restore testing, access model, audit trail, approved long-term formats, and a migration and decommissioning rule. |
| G-13 | Major | ISO 9001 §7.5.3.1 b) | The cover block marks the document "Sensitivity: Internal Use Document" but the body defines **no classification scheme** and no handling rules. | Add the classification scheme and the handling and sharing rules for each level. |
| G-14 | Major | API Q2 §4.4.3 a) | Three competing sources of truth for approval authority: the §4 table, the QHSE Manual (cited in §3.1 and twice in §5.2), and §6.2 for policies. §5.2 says document **removal** is approved per the QHSE Manual; §6.2 says removal is approved by the Policy Committee. | Pick one authoritative source. If the §4 table governs, delete the QHSE Manual cross-references; if the Manual governs, delete the table. |
| G-15 | Minor | API Q2 §4.4.3 a) | The §4 approval table has a column headed "P&T APPROVER" and a column headed "CHECK & ISSUE" that are never explained. There is no rule that the approver must be independent of the author, no delegation or acting rule, and no statement that electronic approval in SCORE constitutes signature. | Define the roles, add independence, delegation and e-signature rules. |
| G-16 | Minor | ISO 9001 §7.5.2 b) | Format and media control is limited to policies (§6.1). There is no required template or mandatory header and footer fields for standards, SOPs, work instructions or forms, even though they are used in practice. | Mandate the template set and the minimum identification fields. |
| G-17 | Minor | API Q2 §4.5 | Records originating from **outsourced activities** are explicitly in scope of API Q2 §4.5. The standard covers third-party storage back-up (§7.3) but not contractor-generated records — ownership, hand-over, retention, and access on contract termination. | Add an outsourced records clause. |

---

## Part 2 — Sections missing outright

These are not weaknesses in existing clauses. They are clauses that do not exist.

1. **Normative and reference documents.** V2.0 deliberately removed section 7.8 "Related documents"
   and it was never replaced. The standard therefore claims compliance with ISO 9001, ISO 14001,
   ISO 45001, API Q1 and API Q2 (via the QHSE Manual row in §4) without citing a single edition.
   Restore it, with editions and dates.
2. **Definitions of terms.** §4 is titled "DEFINITION" but defines document *types* only. Terms used
   throughout and never defined: document, record, controlled copy, master, obsolete, document owner,
   document controller, SCORE admin, Policy Committee, SCORE, point of use.
3. **Document change request and initiation.** There is no process for raising a new document or
   proposing a change. §3.3 asks employees to "notify line management and QHSE" — that is the entire
   mechanism. No form, no register, no workflow, no timescale, no rejection route.
4. **Role definitions.** Document Owner, Document Controller, SCORE Admin, Author, Approver and
   Policy Committee are named repeatedly but their duties are never set out.
5. **Compliance monitoring.** §3.2 says QHSE will "monitor compliance with this standard" but defines
   no metric, no audit checklist and no reporting line. A percentage-of-documents-overdue-for-review
   measure is the obvious one, and is exactly what an auditor will ask for.
6. **Deviation and waiver.** The legal statement allows addenda for higher local requirements and the
   Quality Plan row requires deviations to be "documented and approved", but no deviation process or
   form exists for this standard.
7. **Competence of document controllers.** No training or competence requirement for the people who
   operate document control — a direct read-across from API Q2 §4.3.2.
8. **Clause cross-reference matrix.** No table maps TQ-QHSE-S001 clauses to ISO 9001 and API Q2
   clauses. This is the first artefact requested in most external audits and it does not exist.
9. **Form references.** TQ-QHSE-F086 (Master Document List) and TQ-QHSE-F088 (external documents)
   are cited. There is no form named for: document change request, document review record,
   controlled copy distribution list, impact assessment of external changes, or record disposal —
   even though §7.5 requires that hard copy disposals be recorded.
10. **Contractors and joint ventures.** The scope covers "all TAQA Business Units". Nothing states how
    document control applies to contractors working at TAQA sites or to JV operations, although the
    records matrix includes contractor pre-qualifications.

---

## Part 3 — Records Requirements Matrix (§7.2)

### The matrix has the wrong columns

It has three: Record Type, Storage, Initiate. To satisfy API Q2 §4.5 it needs, per record type:
**retention period, record owner or custodian, media (hard copy or electronic), protection and
backup requirement, disposition method, and the legal or customer basis for the retention.**

As it stands, the matrix cannot tell anyone how long a given record is kept — the reader has to
fall back on the blanket rule in §7.5. Once G-01 is fixed and retention becomes ten years with
longer periods for specific record types, per-record retention in the matrix is unavoidable.

### Record types required by API Q2 that the matrix omits

The matrix lists 22 record types. API Q2 3rd Edition requires records in clauses that have no
matrix entry at all:

| Missing record type | API Q2 clause |
|---|---|
| Risk management records and actions taken | §5.3 |
| Design records — inputs, outputs, review, verification and approval, design changes | §5.4.2 to §5.4.6 |
| Contingency planning records | §5.5 |
| Supplier evaluation and re-evaluation, approved supplier list, customer-specified and limited suppliers | §5.6.1.6 |
| Outsourcing records and evidence of conformity | §5.6.1.7 |
| Verification of purchased services and SRP | §5.6.3 |
| Service Quality Plan and its revisions | §5.7.1 |
| Identification and traceability of SRP | §5.7.2 |
| Externally owned property — control and disposition | §5.7.4 |
| Preservation assessment results | §5.7.5 |
| Validation of SRP | §5.7.6 |
| PMITP records, including deferrals and concessions | §5.7.7 |
| TMMDE registry, in addition to calibration records | §5.8.5 |
| Service performance validation | §5.9 |
| Nonconformity records with the required content | §5.10.5 |
| Customer notification of nonconforming service | §5.10.4 |
| Customer satisfaction information | §6.2.1 |
| Internal audit records and audit closure | §6.2.2 |
| Analysis of data | §6.3 |
| Corrective action records | §6.4.2 |

The matrix does carry Management Review minutes, MOC, NCR, JSA, training and calibration records,
so the omissions are specific rather than wholesale — but design, purchasing, traceability, audit
and corrective action are significant absences.

### Other matrix gaps

- **Document approval records.** §5.2 requires that "records of approval shall be maintained by each
  corporate administration group" — this record type is not in the matrix, has no owner and no retention.
- **ISO 14001 and ISO 45001 records.** The standard's declared compliance scope includes both, but the
  matrix carries almost nothing environmental or occupational-health: no legal register, no waste
  manifests, no emissions or discharge monitoring, no emergency drill records, no medical surveillance
  (medical records are mentioned only in the retention clause), no PPE or exposure records.
- **Duplicate storage answers.** Several rows give two or three storage locations
  ("Quality & HSE files or SCORE", "BU Administration Central Records / SharePoint") without saying
  which is the master. §5.2 establishes SCORE as master for documents; the equivalent statement for
  records is missing.

---

## Part 4 — Internal consistency and editorial defects

These are small but several are the kind of thing an auditor photographs.

| # | Location | Defect |
|---|---|---|
| E-01 | §6.2 | "the functional VP … will be asked to confirm or update their policy **not** every 24 months". The stray "not" inverts the requirement. |
| E-02 | §3.1 | "The approver role … are listed in the QHSE Manual **and need to add the reference document number**." An unfinished editorial action left in the published text. |
| E-03 | §3.2, §5.2, §5.4, §5.6, §6.2 | The obsolete-documents paragraph is reproduced **verbatim five times**. It should be stated once in §5.6 and cross-referenced. As it stands, the next revision will almost certainly update some copies and not others. |
| E-04 | §5.3, numbering table | The TWI row reads "TWC- TAQA Well Intervention" and the TDS row reads "TWC- TAQA Drilling Solutions". Both carry the wrong short form, copied from the TWC row. |
| E-05 | §5.3, work instructions | Work instruction numbering is given for TWS only. Standards, SOPs and Forms each list all five business units; WI does not. There is no WI format for corporate functions, P&T, TWC, TWI or TDS. |
| E-06 | §5.3, numbering tables | No numbering format exists for **Guidelines** (defined in §4), **Quality Plans / SQPs**, checklists as distinct from forms, registers and logs, or drawings. |
| E-07 | §5.3, short forms | "Supply Chain SC" appears in both the Corporate Function table (05) and the Support Functions table (07). "Pumping Services PS" appears twice in the Service & Product Line table (09 and 19). |
| E-08 | §5.3, short forms | There is **no short form for the Learning Center or Training**, although the Training Department is a named record initiator in §7.2 and the LMS is a named record system. Learning Center documents currently have no legitimate number format. |
| E-09 | §7.6 | Records are described as "the property of **TAQA Well Services**". The short-form table calls the business unit "TAQA Well Solution (TWS)". The name is used inconsistently across the document. |
| E-10 | Version history | The V2.0 entry refers to "section 7.3 Records requirement matrix"; that content is now §7.2. Stale cross-reference. |
| E-11 | §4 table | The Quality Plan row breaks across pages 6 and 7, leaving "Compliance is required. Any deviation or issues to be documented and approved" detached from its row. |
| E-12 | Footers | Footer pagination reads "Page 1 of 16" on the second PDF page and the document runs to 17 pages. The "Valid at time of printing" field is hard-set to 22 July 2024 rather than a print-time field. |

---

## Part 5 — Recommended structure for V4.0

Keeping the existing numbering where it works, and adding what is missing:

```
1.  Purpose
2.  Scope                        + contractors, JVs, outsourced activities
3.  Normative references         NEW — ISO 9001:2015, ISO 14001, ISO 45001,
                                 API Q1 10th Ed., API Q2 3rd Ed., with dates
4.  Definitions                  SPLIT — 4.1 terms (NEW), 4.2 document types
5.  Roles and responsibilities   EXPANDED — owner, controller, SCORE admin,
                                 author, approver, Policy Committee, employees
6.  Document control
    6.1 Master list
    6.2 Document change request and initiation      NEW
    6.3 Drafting, templates and format              NEW
    6.4 Review, approval and re-approval
    6.5 Revision numbering and change identification NEW
    6.6 Periodic review for continued suitability   NEW — frequency table
    6.7 Distribution, notification and acknowledgement NEW
    6.8 Translations                                NEW
    6.9 Identification and numbering
    6.10 Classification and handling                NEW
    6.11 External documents
    6.12 Customer-supplied documents                NEW
    6.13 Obsolete documents and recall of copies    EXPANDED
7.  Corporate policy governance                     (as is)
8.  Records control
    8.1 General and electronic systems              EXPANDED
    8.2 Records requirements matrix                 REBUILT — 8 columns
    8.3 Identification, collection and legibility
    8.4 Correction of records                       NEW
    8.5 Storage, protection, backup and access
    8.6 Retrieval
    8.7 Retention — 10-year minimum                 REWRITTEN
    8.8 Disposition and disposal records
    8.9 Service delivery records
    8.10 Outsourced and contractor records          NEW
9.  Deviations and addenda                          NEW
10. Compliance monitoring and KPIs                  NEW
11. Training and competence of document controllers NEW
Annex A  Clause cross-reference to ISO 9001 and API Q2   NEW
Annex B  Forms register                                   NEW
```

---

## Part 6 — Suggested sequence of work

**Stage 1 — correct the non-compliance (days, not weeks).**
G-01 retention, G-03 record correction, G-04 obsolete copy recall, G-02 translations, G-05 review
frequency. These five are the findings most likely to be written up. E-01 and E-02 should be fixed
in the same pass because they are errors in the published text.

**Stage 2 — rebuild the records matrix.** New columns, then the 20 missing API Q2 record types,
then the ISO 14001 and ISO 45001 record types. This is the largest single piece of work and needs
input from each function that owns a record.

**Stage 3 — add the missing clauses.** Change request, roles, distribution, electronic records and
system controls, classification, customer documents, deviations, compliance monitoring.

**Stage 4 — Annex A cross-reference matrix.** Build it last, because it is only useful once the
clauses it maps to exist. Build it before the transition audit, because it is what the auditor opens first.

**Stage 5 — editorial pass.** Part 4 in full, plus the Learning Center short form (E-08), which the
Learning Center needs before any of its own documents can be numbered correctly.

The API Monogram effective date for API Q2 3rd Edition is **1 October 2027**. Stages 1 to 4 need to
be complete, approved and communicated well before that, because the documents that depend on this
standard — every SOP, work instruction and form in SCORE — have to be re-issued under the corrected
rules afterwards.

---

## One thing worth raising with QHSE

V3.0's stated purpose for the revision was "API Q1 10th Edition requirements added". API Q1 covers
manufacturing organizations; API Q2 covers service supply organizations. TAQA's business units as
listed in this very standard — Well Solutions, Well Completions, Well Intervention, Drilling
Solutions — are service organizations, with Products & Technology sitting on the Q1 side.

The retention clause carries that confusion into the text: it treats ten-year retention as an
"API Q1 exception" when under API Q2 3rd Edition ten years is the rule for the service side of the
business. Worth confirming with the Executive Director QHSE which standard governs which entity
before V4.0 is drafted, because it changes the answer for most of the records matrix.
