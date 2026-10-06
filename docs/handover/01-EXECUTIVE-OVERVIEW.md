# 01 Executive overview

## What RISE is

RISE is TAQA's knowledge hub for controlled documents. It covers:
- procedures, work instructions, standards, policies, forms, maintenance bulletins, alerts and lessons learned;
- every operational segment, corporate function and centre;
- a field glossary and an "Ask Expert" form.

It also specifies how a controlled document is filed, checked, approved, revised, withdrawn and delegated.

Today RISE is three things (BD-01):
1. **A product and workflow specification.** The rules are written down (`docs/BUSINESS-RULES.md`) and decided by the Product Owner (`docs/RISE-BUSINESS-DECISIONS.md`).
2. **A user-facing knowledge experience.** Desktop, phone and installed phone app (PWA).
3. **A working prototype / reference implementation.** It shows the document-control workflow rules working end to end, with automated tests. The Field Glossary review flow (BD-06), segment membership (`BUSINESS-RULES.md` §14) and Ask Expert routing (BD-04) are specified but not built.

It is **not** the official system of record. **SCORE remains TAQA's authoritative register** until TAQA formally approves a transition (BD-01).

## What it is not

- **Not production security.** Every rule runs in the user's browser. Identity is a "View as" switch. The register is demonstration data kept in the browser's `localStorage`. Anyone with the browser's developer tools can change it. See 02.
- **Not connected to Microsoft 365.** There is no Entra ID sign-in, no SharePoint, no Power Automate, no real file storage, no notifications and no server audit trail.
- **Not a decided architecture.** Which Microsoft 365 or Azure services carry each requirement is IT's decision (07, 16).

## What has been achieved

- **Two approved workflows** (BD-02):
  - Operations: Employee → QMS check → Segment Director.
  - Maintenance: Employee → QMS check → Maintenance Manager.

  Both are implemented with rejection, re-filing, revisions, future-effective approval, withdrawal and scoped delegation.
- **Integrity rules proven in the prototype**, each with automated tests (09):
  - one number per document;
  - one revision in force;
  - filer ≠ QMS checker ≠ final approver;
  - decisions bound to the exact record shown;
  - withdrawal with a recorded reason;
  - delegation that replaces authority rather than adding to it;
  - classification-trimmed visibility;
  - honest offline behaviour (nothing is sent offline).
- **An integrity audit and reassessment** with every finding tracked (`docs/QA/`).
- **The business decisions locked** (BD-01 to BD-07, 6 October 2026; BD-08 and BD-09 added the same day).

## What production needs

Production must enforce on the server or platform side what the prototype only demonstrates:
- identity and authorisation;
- permission trimming;
- the workflow state machine;
- separation of duties;
- uniqueness;
- concurrency;
- exact-file binding;
- an immutable audit trail;
- backup and recovery;
- monitoring;
- retention;
- a reconciliation with SCORE.

07 lists each capability: the business need, the required outcome, why the prototype cannot guarantee it, and the decision IT has to make.

## Readiness in one line

**Ready to hand over as a specification and reference prototype, with conditions.** This pack describes `main` at `a6f4180` (PR #34, the integrity close-out, merged 6 Oct 2026): cache `taqa-hub-v108`, with PI-17, PI-22, PI-23 and PI-27 closed in the prototype. Both demonstration sites serve that build (checked file by file against `main`). It is not ready to go live, and nothing here should be read as production-ready. The conditions are IT's design choices (16), the business confirmations (17), User Acceptance Testing in a real Microsoft 365 environment (10), and the real-iPhone checks (11).
