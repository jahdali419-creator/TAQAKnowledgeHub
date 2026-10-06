# 02 Current production position

## In one sentence

The prototype shows **what** the system must do; it cannot **guarantee** any of it, because everything runs in the user's browser.

## Facts

| Topic | Today (prototype) | Consequence |
|---|---|---|
| Hosting | Static files (HTML, JavaScript, CSS) with no build step. Deployed to an Azure Static Web App and GitHub Pages. There is no server code | Anything the page does, a user can undo or bypass |
| Identity | A "View as" switch picks one of five roles and an area. There is no sign-in | Anyone can be anyone. **PRODUCTION CONTROL REQUIRED:** Microsoft Entra ID sign-in, with roles and areas from the server |
| Register | `documents-master.js`: 585 records reconstructed for the prototype, plus changes stored in the browser's `localStorage` (`taqa-uploads-v1` for filings, `taqa-status-v2` for decisions on shipped records, `taqa-delegations-v1` for grants) | Each browser has its own copy. Nothing is shared between users. Developer tools can change any record. **Not authoritative.** SCORE is (BD-01) |
| Rules | `roles.js`, `store.js` | They demonstrate the rules. They do not enforce them against a determined user |
| Visibility | Lists, counts, search, bookmarks and the document page are trimmed to what the role may open (BD-03, PI-27) | The **whole** register file is still delivered to and cached on every device. **PRODUCTION CONTROL REQUIRED:** server-side permission trimming |
| Files | No file is stored. The document body is a "Preview not connected" placeholder. File fingerprints (SHA-256) are computed in the browser | **PRODUCTION CONTROL REQUIRED:** controlled file storage, with the approved file bound to the approval (PI-12) |
| Audit | The approval trail is rebuilt in the page from the record's fields, and some rows are placeholders | **PRODUCTION CONTROL REQUIRED:** an append-only audit trail written by the server |
| Time | Dates come from the browser's clock | **PRODUCTION CONTROL REQUIRED:** server time |
| Offline | Pages already opened stay readable offline. Every change is refused offline and nothing is queued (BD-05) | Production decides what may be cached, and for how long (IT and Cybersecurity) |
| Notifications | The bell is computed in the browser from this browser's copy of the register; outcome notices (approved / returned) cover only filings made in this browser | **PRODUCTION CONTROL REQUIRED:** a notification service (IT decides which) |
| Ask Expert | Nothing is sent: "This preview has no connected ticket system. Your question was not sent." | Production needs a real Microsoft 365 destination that confirms receipt (BD-04) |
| Secrets | None in the repository (checked at each audit) | Keep it that way: configuration per environment, not in code |
| **Public exposure today** | The repository (`jahdali419-creator/TAQAKnowledgeHub`) is **public**, on a personal GitHub account. Neither the Azure Static Web App nor GitHub Pages has any sign-in. GitHub Pages publishes the whole repository, `docs/` and `tests/` included (the Azure site blocks those two folders). The Content Security Policy is a `<meta>` tag that allows inline script and style, not a header. The Azure workflow also builds preview sites for pull requests | Anyone on the internet can read the source, these documents and the whole prototype register, restricted and confidential titles included. **The business must confirm the register holds no real confidential TAQA content (17).** Repository ownership, visibility and hosting are IT decisions (16) |

## Relationship with SCORE (BD-01)

- SCORE is the system of record. RISE does not override it.
- Every document page says "Verify the current revision in SCORE before use". Its "Open in SCORE" link is built from the document number and a hard-coded base (`TAQA_DOC.scoreUrl`, `https://score.taqa.com.sa/library/<number>`), and so is the F086 export's "SCORE URL" column. That host and pattern are **unverified**; they are configuration for IT (`AZURE-INTEGRATION-REQUIREMENTS.md`, `links.scoreLibraryBase`).
- If RISE and SCORE disagree, SCORE wins. The disagreement is a reconciliation finding (12).
- How RISE and SCORE are connected in production (a link only, a read of SCORE, a sync, or a one-off migration after an approved transition) is **IT DECISION REQUIRED**. Any transition of authority is also a QMS / document-governance decision.

## What "PROTOTYPE-PROVEN" does and does not mean

**It means:**
- the rule is written down;
- the prototype follows it in every path the tests exercise;
- a test fails if it stops doing so (see 09 for the numbers).

**It does not mean:**
- the rule is secure;
- the rule holds with two people on two devices at once;
- the rule survives a user with developer tools;
- the rule has been checked in a real Microsoft 365 tenant.
