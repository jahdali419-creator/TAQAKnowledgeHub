# IT handover: questions IT is likely to ask

**Status: CURRENT (6 October 2026).** It describes `main` after the integrity close-out (PR #34, merge `a6f4180`). Each answer has three parts:
- a **simple answer for Mohammed**;
- the **technical detail for IT**;
- a **status**, one of:
  - **Answered**;
  - **IT to decide**;
  - **Business to confirm**;
  - **Production test required**.

Section numbers refer to `docs/handover/`.

---

### 1. Is RISE production-ready?
- **Simple answer for Mohammed:** No. It is a detailed specification, with open business confirmations (17), and a working prototype. Production must enforce on the server side what the prototype only shows.
- **Technical detail for IT:**
  - static HTML/JS;
  - no server code;
  - simulated identity;
  - a register in `localStorage` over a demonstration data file.

  See 02 and 07.
- **Status:** Answered.

### 2. Who tested it, and how?
- **Simple answer for Mohammed:** Automated tests run on every change, and the role journeys were run end to end in the QA audits (`docs/QA/`). Nobody has tested it with real accounts in a real Microsoft 365 environment yet.
- **Technical detail for IT:** Playwright suites on Chromium desktop and phone (`npm test`; CI runs the desktop Chromium suite), plus an iPhone-engine (WebKit) smoke set in CI, and a register-data checker. CI results do not block merges or deploys today (14). Numbers and limits are in 09.
- **Status:** Answered. Production test required (10, 11).

### 3. Where would the documents live?
- **Simple answer for Mohammed:** That is IT's decision. The business requirement is one controlled place, every revision kept, and links that always reach the right one.
- **Technical detail for IT:** No storage exists today. Candidates include SharePoint libraries with major versions, or another store (16, IT-02).
- **Status:** IT to decide.

### 4. Which system is authoritative?
- **Simple answer for Mohammed:** SCORE, until TAQA formally approves a change.
- **Technical detail for IT:** BD-01. RISE must not claim to override SCORE. The integration pattern is IT-03.
- **Status:** Answered (business). IT to decide (pattern).

### 5. How are permissions handled?
- **Simple answer for Mohammed:** People see only what their role may open. Restricted titles are not even listed. In production the system must enforce that, not the screen.
- **Technical detail for IT:**
  - five roles with classification and area scope (04);
  - BD-03 requires server-side permission trimming of lists, counts, search and links;
  - the prototype's trimming is cosmetic, because the whole register file ships to the client.
- **Status:** Answered (rule). IT to decide (IT-06).

### 6. How are duplicate document numbers prevented?
- **Simple answer for Mohammed:** A number is used once, for good. The prototype refuses a reused number everywhere. In production the system must enforce that.
- **Technical detail for IT:** Uniqueness across all statuses and legacy IDs, case-insensitive (`BUSINESS-RULES.md` §16). Candidates: server allocation or server validation, plus a unique column (07 §17; BC-17).
- **Status:** Answered (rule). IT to decide (mechanism).

### 7. What if two approvers act at the same time?
- **Simple answer for Mohammed:** Only one may succeed, and the other must be refused with nothing changed.
- **Technical detail for IT:**
  - each decision names the exact record and step;
  - the prototype refuses stale decisions only within one browser;
  - production needs optimistic concurrency, for example ETag / If-Match (IT-07).
- **Status:** IT to decide. Production test required.

### 8. What happens if SharePoint or Power Automate fails mid-approval?
- **Simple answer for Mohammed:** The approval must either fully happen or not happen at all. Nobody may be told it worked when it didn't.
- **Technical detail for IT:**
  - release, supersede and translation re-issue form one transition;
  - a failed run must leave the record unchanged and be visible and safely retryable;
  - this is part of deciding IT-01 (are flows enough?) and IT-12 (monitoring).
- **Status:** IT to decide. Production test required.

### 9. Does it work offline?
- **Simple answer for Mohammed:** You can read pages you've already opened. Nothing can be sent offline, and nothing is queued.
- **Technical detail for IT:** BD-05; service-worker cache. What may be cached on devices, and for how long, is IT-17 with Cybersecurity.
- **Status:** Answered (rule). IT to decide (caching policy).

### 10. How do we recover from a failure?
- **Simple answer for Mohammed:** That is IT's design. I need the register, files, history and audit trail recoverable, with a tested restore.
- **Technical detail for IT:** Recovery point and time are "Target to be confirmed by IT/business" (13). IT-13.
- **Status:** IT to decide. Business to confirm (targets).

### 11. What is backed up?
- **Simple answer for Mohammed:** Today nothing, because the prototype has no server. Production must back up everything controlled.
- **Technical detail for IT:** Scope: register, files and versions, grants, audit trail (07 §10), and configuration if IT includes it.
- **Status:** IT to decide.

### 12. What is logged?
- **Simple answer for Mohammed:** Every controlled action: who, what, which record, when, and under which delegation. It can never be edited.
- **Technical detail for IT:**
  - the prototype rebuilds the trail in the page;
  - production needs an append-only, server-written audit trail with export (07 §6, IT-09);
  - operational logging and monitoring come under IT-12.
- **Status:** IT to decide.

### 13. Who supports it after go-live?
- **Simple answer for Mohammed:** That needs a named support owner. It isn't decided yet.
- **Technical detail for IT:** RACI marks the support owner unconfirmed (15). Hours and targets are in 13.
- **Status:** Business to confirm. IT to decide.

### 14. What licences are needed?
- **Simple answer for Mohammed:** That depends on IT's design. I can't answer it before the architecture is chosen.
- **Technical detail for IT:** Possible items include Power Automate premium connectors, Purview features and the web font licence (16, IT-19 and IT-20).
- **Status:** IT to decide.

### 15. How do we migrate from SCORE?
- **Simple answer for Mohammed:** We don't migrate as such. SCORE stays authoritative. If a transition is ever approved, we reconcile first, under QMS, with a tested rollback.
- **Technical detail for IT:** Plan in 12. The prototype's 585 records carry 302 known findings and are not a migration source.
- **Status:** Business to confirm (BC-04). IT to decide (mechanism).

### 16. Will existing links and QR codes keep working?
- **Simple answer for Mohammed:** In the prototype, every link and QR carries the document number and the document's own area. In production, links should use a permanent identity, and we need a plan for links already printed.
- **Technical detail for IT:**
  - the prototype's links are `viewer.html?doc=<number>&seg=<area>`, plus `rev`/`rid` for a non-default revision (PI-23);
  - production should use immutable item / version ids;
  - redirecting existing prototype URLs, if any are in use, is an IT decision.
- **Status:** IT to decide.

### 17. How do external auditors get access?
- **Simple answer for Mohammed:** Read-only, for the period of the audit, then removed.
- **Technical detail for IT:** The Auditor role reads everything and changes nothing. Time-boxing is not enforced in the prototype. Suggested: Entra guest access with expiry or access reviews (IT-04).
- **Status:** IT to decide. Production test required.

### 18. How do we prove the approver approved that exact version?
- **Simple answer for Mohammed:** The approval must be tied to the exact file and revision they reviewed. The prototype ties it to the exact record, but stores no file.
- **Technical detail for IT:** Bind approval to the file version and a fingerprint computed by the server at upload (PI-12, 08 row 2, IT-08).
- **Status:** IT to decide. Production test required.

### 19. Why should we trust the tests?
- **Simple answer for Mohammed:** They are written to try the forbidden thing and check it is refused. Each fix was shown to fail on the old version first. But they test the prototype, not production.
- **Technical detail for IT:**
  - specs per finding, with old-main proof runs (the fix's tests fail on the previous `main`);
  - known pre-existing WebKit failures are listed in `docs/TESTING.md`;
  - figures in 09.
  - The tests do not cover multiple users, real identity, real storage or real devices.
- **Status:** Answered.

### 20. What remains untested?
- **Simple answer for Mohammed:**
  - real accounts;
  - real storage;
  - two people at once on different devices;
  - real iPhones;
  - SCORE reconciliation;
  - backup and restore.
- **Technical detail for IT:** See 09 ("Not covered") and 11. These need the production design and UAT (10).
- **Status:** Production test required.

### 21. What does the Download button on a document page do?
- **Simple answer for Mohammed:** In this preview it says "Download is not connected in this preview": no file is stored and nothing is requested. (It used to claim a request had been sent; fixed on 6 Oct 2026, NEW-13.) In production, Download must give the approved file version or say plainly why it can't.
- **Technical detail for IT:** `viewer.html` `requestAccess()`, wired to `#dl-btn` and `#pdf-dl-btn`, shows a toast only. Recorded as NEW-13 in `docs/QA/PRODUCT-INTEGRITY-REASSESSMENT-POST-PR29.md`. Production download is part of file storage (IT-02, IT-08).
- **Status:** Answered (prototype wording fixed). IT to decide (production download).
