# Azure integration requirements

What the IT team must build or decide to turn the TechHub prototype into a system real employees use. Rules: `BUSINESS-RULES.md`. Endpoints: `API-REQUIREMENTS.md`. Entities: `DATA-MODEL.md`. Findings below were measured on 1 October 2026 (`docs/QA/FIVE-ROLE-QA-AUDIT.md`, and the handover audit in `HANDOVER-TO-IT.md` §8).

---

## 1. Architecture

**Current prototype**

```mermaid
flowchart LR
  B[Browser] --> F[TechHub pages<br/>HTML, CSS, JavaScript]
  F --> R[roles.js + store.js<br/>rules run in the browser]
  R --> L[(localStorage<br/>this browser only)]
  F --> M[documents-master.js<br/>register shipped as a file]
```

Everything runs in one browser. A role is chosen from a switcher, records exist only on that computer, and anyone with the developer console can change them.

**Target**

```mermaid
flowchart TB
  U[Employee browser] --> E[Microsoft Entra ID<br/>sign-in, groups, claims]
  E --> F[TechHub frontend<br/>static pages]
  F -->|bearer token| A[TechHub API on Azure]
  A --> Z[Authorization and business rules<br/>roles, areas, departments, stages, delegation]
  Z --> D[(Database<br/>documents, steps, delegations)]
  Z --> S[(Azure file storage<br/>private, scanned)]
  A --> N[Notification service<br/>email or Teams]
  A --> T[(Audit trail<br/>append-only)]
```

The frontend stays a set of static pages. Everything that decides who may do what, every record, every file and every notification moves behind the API.

## 2. Configuration strategy

Values that differ between **LOCAL / DEV / TEST(UAT) / PRODUCTION**, where they are today, and what to do:

| Value | Where it is today | Recommendation |
|---|---|---|
| API base URL | none (no API) | `TECHHUB_CONFIG.apiBaseUrl` |
| Entra tenant ID, SPA client ID, authority, redirect / logout URLs, API scopes | none | `TECHHUB_CONFIG.entra` (identifiers, not secrets) or the hosting platform's built-in auth |
| Application public URL (QR codes, shared links) | derived from `location` at runtime | keep runtime derivation; `appBaseUrl` only if a canonical host is required |
| SCORE library link | `documents-master.js`, `TAQA_DOC.scoreUrl` (`https://score.taqa.com.sa/library/`) | `TECHHUB_CONFIG.links.scoreLibraryBase` |
| Viva Engage community link | `index.html` hero link | `TECHHUB_CONFIG.links.vivaEngageCommunity` |
| Content-Security-Policy | a `<meta>` tag repeated in 13 pages: `connect-src 'self'` | **Must change** for any API on another origin and for Entra sign-in (`login.microsoftonline.com`). Recommended: move the policy to a response header in the hosting config, one place per environment. `tests/security-regression.spec.js` pins today's meta policy and must be updated with it |
| Security headers | `staticwebapp.config.json` `globalHeaders` | keep; add CSP here (see above) |
| Service worker cache name | `service-worker.js` `const CACHE = 'taqa-hub-vNN'` | bump on every release, or stamp it in CI (§10) |
| Feature flags: role switcher, local register, demo fixtures | always on | `TECHHUB_CONFIG.features.*`, all **false** in UAT and production (§9) |
| Logging level / client error endpoint | errors kept in `localStorage` `taqa-errors` | `TECHHUB_CONFIG.logging` |
| Static Web Apps deployment token | GitHub secret `AZURE_STATIC_WEB_APPS_API_TOKEN_…` (referenced, not committed) | IT's own Static Web App and secret; the current one belongs to the prototype |

**Template:** `config/techhub.config.example.js` shows the shape with placeholders only. Copy it to `config/techhub.config.js` per environment (git-ignored) and load it before `shared.js`. **Nothing in a browser config is secret**: never put a client secret, storage key, connection string or SAS token there; they belong to the API (Key Vault / managed identity). No page loads the template today, so the prototype behaves exactly as before.

## 3. Microsoft Entra ID

The final system must derive identity and permissions from **trusted server-side identity** (token claims and group/app-role mappings resolved by the API), **never** from the browser role switcher (`localStorage taqa-demo-role` / `taqa-demo-area`).

| TechHub persona | Entra mapping (IT decides names) | Extra attribute needed |
|---|---|---|
| Employee | every signed-in TAQA user, or `<GROUP_TECHHUB_USERS>` | — |
| QMS / Document Controller | `<GROUP_OR_APP_ROLE_QMS>` | — |
| Segment Director (Function Head, Centre Manager, Corporate Sponsor) | `<GROUP_OR_APP_ROLE_AREA_HOLDER>` | **which area(s)**: one group per area (`<GROUP_HOLDER_{AREA}>`) or an attribute |
| Maintenance Manager | `<GROUP_OR_APP_ROLE_MAINTENANCE_MANAGER>` | **which operational segment(s)**; must be an operational segment |
| External Auditor | `<GROUP_OR_APP_ROLE_AUDITOR>`, time-boxed per audit (for example access reviews / guest expiry) | audit window |
| Glossary reviewer: technical SME / discipline owner (not one of the five document personas) | `<GROUP_GLOSSARY_SME_{CATEGORY}>` or an attribute | **which glossary categories**; mapping defined by the business / IT implementation (`BUSINESS-RULES.md` §13) |
| Glossary administration | `<GROUP_OR_APP_ROLE_GLOSSARY_ADMIN>` (expected: QMS) | administrative only; not technical approval |

After sign-in the frontend needs (`GET /me`): `userId`, `displayName`, `roles[]`, `areas[]` for scoped roles, `memberships[]` and the server-computed `visibleAreas[]`, department where relevant, active delegations the user may act under, and the capability flags. If a user holds more than one role, IT and the owner must decide whether TechHub asks which hat they are wearing or merges capabilities; the prototype assumes one role at a time.

**Segment membership is separate from role** (`BUSINESS-RULES.md` §14). Roles above come from Entra groups / app roles; membership says which operational segment **and department** (Operations or Maintenance) an employee belongs to; it decides what they see (their segment, every Corporate Function, every Center of Excellence, Company Wide) and who administers them, and **never** grants approval authority. For Azure:
- **Investigate first** whether membership (segment and department) can be derived automatically from an authoritative source: Entra organisational attributes (department, company, office, extension attributes), the HR system, business unit, organisational unit, cost centre or another authoritative attribute. **Do not assume one exists**; verify it with HR / Entra owners. If one does, assign membership automatically and keep Add Member for exceptions and corrections.
- **Add Member** (production name for the prototype's "Add Contributor") is contextual ("Add Operations Member" / "Add Maintenance Member"); the server sets segment and department from the manager's authorised context. It takes only a corporate email, resolves the person in Entra ID / the directory (immutable object id, display name, email, job title, account status), shows them for confirmation, and stores the object id. No name / title / initials typing and no Editor / Viewer / Owner choice. Directory lookup needs a least-privilege Microsoft Graph permission chosen by IT.
- Hidden from Employee and Auditor. Segment Director: view own segment, add/remove **Operations** members only. Maintenance Manager: view own segment, add/remove **Maintenance** members only. QMS / authorised administration: all segments and departments (`BUSINESS-RULES.md` §14.5).
- **Visibility and filing** (`BUSINESS-RULES.md` §14.2–14.3): an Employee sees and files into their member segment(s) plus Corporate Functions, Centers of Excellence and Company Wide (no operational segment without a membership); a Segment Director or Maintenance Manager sees their held segment plus the same shared areas, and other segments only through an explicit membership; QMS and the Auditor see every area. The API computes visible and fileable areas from stored membership and role on every request; nothing the browser sends can widen it.
- **One primary segment**; additional memberships only as approved exceptions with a reason and optional expiry, managed by the receiving department authority or QMS, ended automatically at expiry (§14.8). **One department per segment**; a department or segment change is an audited **transfer** performed by QMS / authorised administration (managers may request or confirm), both managers notified, old record kept and linked (§14.9).
- **Delegation outside the grantor's segment** (§14.10): no membership is created; the delegate gets only the delegated queue, its documents and the allowed actions, only while the delegation is valid, computed server-side; expiry or revocation ends it at once.

Delegation must reference real users: the delegate signs in as themselves and the API applies the delegation to them. The prototype's "Act as this" button is a stand-in and must not ship. **PRODUCTION CONTROL REQUIRED (NEW-04):** the Microsoft Entra object id is the authoritative identity for grantor, delegate, filer, checker, approver, withdrawer and revoker; a grant refuses the grantor's own object id; separation of duties compares object ids only. The prototype cannot prove two actors are different people, so it refuses where it cannot tell (BUSINESS-RULES §17, identity).

## 4. Frontend / backend boundary

**A** UI behaviour only · **B** business rule Azure must enforce · **C** data Azure must persist · **D** security rule that must never rely on the browser.

| Rule or data | Prototype location | Class |
|---|---|---|
| Who the user is; role; area | `roles.js` `TAQA_ROLE.current/area`, `localStorage` | **D** |
| Which operational segments a user sees (segment membership) | **Not in the prototype**: every Employee sees every area; "Add Contributor" (`dashboard.html`) only draws a typed name for the session | **B + C + D** (`BUSINESS-RULES.md` §14; API filters every read by stored membership) |
| Role capabilities (submit, countersign, approve, delegate, manage, register view, export) | `roles.js` `TAQA_ROLES` | **D** (+B) |
| Can this user see this document (status, classification, drafts) | `TAQA_ROLE.canSee` | **D** (filter server-side, return 404) |
| QMS check only at stage `qms` | `TAQA_APPROVAL.canCountersign`, `store.countersign` | **B + D** |
| Final approval: stage, own area, department split, delegation types | `TAQA_APPROVAL.canApprove`, `store.approve` | **B + D** |
| Reject: stage actor, reason required | `store.reject` | **B + D** |
| Withdraw / edit: area + department; QMS global | `TAQA_ROLE.canManage(doc)`, `store.setStatus/patch/remove` | **B + D** |
| Lifecycle-field protection | `store.patch` (`LIFECYCLE` list) | **D** |
| Filing always draft at `qms`, filer stamped from identity; policy QMS-only, one file, maintenance only in operational segments (PI-09) | `store.add` | **B + D** |
| Status transitions allow-list (PI-09) | `store.setStatus` (`MOVES`) | **B + D** |
| Editable fields allow-list (PI-09) | `store.patch` (`EDITABLE`) | **B + D** |
| Delegation replaces authority; grant by holder in own area; revoke by grantor (PI-04, PI-09) | `TAQA_ROLE.effective`, `TAQA_DELEGATION.grant/revoke` | **B + D** |
| The QMS checker cannot give final approval to the same document (PI-04) | `TAQA_APPROVAL.canApprove` | **B + D** |
| Submitter ≠ QMS checker ≠ final approver (PI-31) | `TAQA_APPROVAL.separationReason`, `canCountersign`, `canApprove` (simulated role identity) | **B + D** (Entra ID object id) |
| Department routing defaults (PI-16) | `upload.html` defaults; Upload links carry area and side | **B** (department from role or claim) |
| Approval data bound to one revision (PI-25) | `store.js` overlay `taqa-status-v2` keyed number@revision | **C + D** (server-held per item version) |
| Register integrity gate (PI-53) | `scripts/check-register.js`, baseline, `tests/register-integrity.spec.js`, `docs/QA/REGISTER-CLEANUP-REPORT.md` | **B + C** (pre-migration gate with QMS sign-off) |
| Register and lookup text rendered as text, never markup (PI-05) | escaping in every page | **A** in the browser, **D** at the API (validation) and hosting (CSP without `'unsafe-inline'`) |
| Maintenance classification (department or bulletin) | `TAQA_APPROVAL.isMaintenance` | **B** |
| Bulletins only for operational segments | `upload.html`, `store.add` | **B** |
| Maintenance Manager holds operational segments only | `TAQA_ROLE.holds` | **B** (identity mapping) |
| Delegation: approval and Manage documents as separate permissions; area, department and type scope on approve, reject, edit and withdraw; calendar dates (start today or later, ≤ 90 days inclusive, valid through the end date on the server's business date); revocation recorded, never deleted; stale clients refused (PI-32, PI-54) | `TAQA_DELEGATION`, `TAQA_ROLE.effective`, `TAQA_ROLE.canManage` | **B + D** |
| Signer names and timestamps | `store.actingName`, `new Date()` in the browser | **D** (from token and server clock) |
| Document numbers | `upload.html` `taqaRefId` (next number in this browser); `store.add` refuses a number already in the register in any status (PI-01) | **B + C + D** (server allocates; unique `DocNumber` column; duplicate refused by the API) |
| Document identity in links, bookmarks, QR codes and pins | every link carries `doc=<number>`; viewer resolves title-only links against the live register, same area only (PI-03) | **B + D** (links and QR codes target the immutable item ID; the server returns the real status) |
| Revisions: same number, next revision, one in force, one open; release supersedes the previous revision and its translations (PI-02, PI-34) | `store.add` (revision path), `store.approve`, `store.setStatus` cascade | **B + C + D** (SharePoint major versions; approval flow promotes and retires in one transaction; server refuses a second open version) |
| Software / Tool filing | closed: Upload omits it, `store.add` refuses it (PI-33) | **B** (open only once numbering, owner and approver are defined) |
| Document register, drafts, overlays | `documents-master.js`, `localStorage` | **C** |
| Approval steps / audit trail | reconstructed from record fields in `viewer.html`, `analytics.html` | **C** (append-only) |
| Delegations | `localStorage` | **C** |
| Attachments | not stored | **C + D** (§6) |
| Notifications | derived in the browser (`shared.js` bell) | **C** + service (§7) |
| Concurrency (stale tab) | `store.js` re-reads before writing | **B** (ETag / version, `DATA-MODEL.md` §3) |
| Desk queues, counters, "Not your area" messages, hidden buttons, refusal pages | pages | **A** (convenience; the API must refuse regardless) |
| Upload file type / size checks | `upload.html` | **A** in the browser, **D** at the API |
| Glossary contributions: propose → pending → SME approve/reject → shared; admin recategorise/withdraw | `glossary.html` adds a "Community" term immediately, this browser only (**not** the target) | **B + C + D** (`BUSINESS-RULES.md` §13) |
| Bookmarks, theme, pins, drafts, tour | `localStorage` | **A** |

Nothing in `roles.js` or `store.js` is a security control. `roles.js` says so in its first lines; the cybersecurity review pack says so too.

## 5. Concurrency
Required: optimistic concurrency on every document transition and delegation change. Two users load the same draft; both press Approve or Reject; **only the first valid transition succeeds** and the second gets **409 Conflict** with the current state. ETag / row version / version number are all acceptable. Details: `DATA-MODEL.md` §3. UAT check: `AZURE-UAT-CHECKLIST.md` N7.

**Decisions bind to what was reviewed (PR 2B, `BUSINESS-RULES.md` §18).** Every check, approval and rejection sends the SharePoint item ID and the version the person reviewed, with `If-Match: <ETag>`, plus the stage it was at. The API refuses (409/412) if a different version or record is now waiting, or the stage moved, and writes nothing; the client shows "This document changed after you opened it. Review the current revision before deciding." and reloads. Final approval also binds to the exact file version and a server-computed content hash, and Preview opens that file version. Withdrawing a document cancels its open version (and its translations' open versions) in the same transaction. The prototype's browser-side binding (`recordKey`, `expect`) is a model of this, not a control.

**Record truth (PR 2C-1, `BUSINESS-RULES.md` §8, §19).** Withdrawal is an endpoint taking a reason (20+ characters) and `If-Match`; the server records who, when, why and the previous status in an append-only audit log and cancels open versions in the same transaction. Final approval takes an optional effective date; the server stamps the approval date and time, keeps the version `approved` when the effective date is later, and a scheduled flow (site time zone, idempotent) makes it current and supersedes the previous version on that date. The server computes each file's SHA-256 at upload and stores it on the file version, so exact-file duplicates can be warned about; similar-title or content matching needs an approved search/AI capability. New numbers are validated against the 5.3 table server-side.

## 6. Files and attachments
The prototype records a file's name, size and a browser fingerprint; **the file itself is not stored or downloadable** ("Preview not connected"). Requirements:
- Authenticated upload; the API decides whether the actor may submit to that area/department.
- Allowed types: `pdf, doc, docx, xls, xlsx, ppt, pptx, zip` (prototype list); reject empty files, disguised executables (`report.pdf.exe`) and files over 500 MB (prototype limit; confirm against TAQA policy and platform limits).
- Malware scanning before a file can be linked to a submission, if TAQA policy requires it (Defender for Storage or equivalent).
- Private storage (no public containers); downloads through the API or short-lived per-user SAS issued after an authorization check.
- Download refused for withdrawn and unapproved documents.
- Version association: file ↔ document revision; **approved content can never be replaced**; a change is a new revision with a new file.
- Metadata: name, type, size, SHA-256, uploader, time, scan result. Every upload and controlled download is an audit event.

## 7. Notifications
Today the bell is computed in the browser from the register; nothing is emailed or posted. Required: on submit → QMS; on QMS confirm → the area's Segment Director, or for a maintenance document the segment's Maintenance Manager (and any active delegate); on approve or reject → the submitter. Failed delivery must be retried or logged, never roll back the workflow step. Channel (email, Teams) is IT's choice. Field Glossary (`BUSINESS-RULES.md` §13): a new proposal → the category's SME; approval or rejection → the submitter.

## 8. Hosting and routing
- **Measured:** every important page opened by direct URL and refreshed, at 1440 and 390 px: Home, segment (Operations and Maintenance side), Upload, approval desk (QMS, Director, Maintenance Manager), document page, Master List (QMS, Auditor), Search, Glossary, Ask Expert, Form, Analytics, About, offline page. **38 of 38 loaded, no 4xx asset requests, no script errors.**
- Multi-page static site: every page is a real `.html` file and state lives in the query string (`?id=`, `?doc=`, `?dept=`). No client-side router, **no rewrite rules needed**.
- All asset paths are **relative** (no leading `/`), so the app works under a sub-path. `manifest.json` uses `./`. The service worker derives its base path at runtime.
- Filenames are lower-case and every reference matches its file exactly (checked), so case-sensitive hosts are safe.
- `staticwebapp.config.json`: security headers; `no-cache` on `service-worker.js`; immutable caching for fonts and icons; **non-app paths blocked** (`/docs/*`, `/tests/*`, `/.github/*`, README, package files, Playwright config: added in this audit because the deploy publishes the whole repository).
- *Recommended:* the `navigationFallback` sends **any unknown URL to `offline.html`**, so a mistyped address says "You're offline". Add a proper 404 page (`responseOverrides`) when IT sets up hosting.
- *Recommended:* deploy only the application files (a packaging step), rather than the repository root. Until then, the route blocks above protect Static Web Apps; **GitHub Pages (`pages.yml`) publishes everything**, so retire it or restrict it.
- Platform authentication: if the hosting platform's built-in auth is used, add `"allowedRoles": ["authenticated"]` on `/*` (see the August plan, `AZURE-MIGRATION-RAFA.md`).

## 9. Prototype-only behaviour (label, then remove or switch off for production)

| Behaviour | Where | Production |
|---|---|---|
| Role switcher ("View as …", "Preview only. Azure uses Entra ID.") | `shared.js` door, phone menu; refusal pages' "View this page as" buttons | Remove; identity from Entra |
| `localStorage` trusted as the register | `store.js`, `roles.js` | Replace with API calls |
| Records exist only on this computer | everywhere | Server persistence |
| The developer console can call `TAQA_STORE` / `TAQA_ROLE` and bypass every rule | global objects | The API enforces; the globals become thin clients |
| "Act as this" delegation button | `dashboard.html` | Delegate signs in as themselves |
| Signers recorded as role labels ("Segment Director") | `store.js` | User references from the token |
| Demo people and activity (owner and contributor names, sample activity) | `dashboard.html` `DASH_DATA`, `segments-data.js` | Real data from the directory or remove |
| Register shipped as a 259 KB script | `documents-master.js` | API; keep only as seed data for migration |
| Ask Expert has no destination: it says "This preview has no connected ticket system. Your question was not sent.", keeps the text and offers "Copy question" (PR 2D) | `support-ticket.html` | A Microsoft 365 destination (SharePoint list or Dataverse table + Power Automate to the area's expert, or a Teams channel); say "sent" and show a ticket number only after the server confirms it. Replace the Critical note with TAQA-approved emergency wording and contacts (QHSE) |
| "Add term" publishes a glossary term at once as "Community", in this browser only, with no review | `glossary.html` `submitTerm` | Proposal with SME review (`BUSINESS-RULES.md` §13; `API-REQUIREMENTS.md` §7). Relabel the form "Propose a term" when connected |
| "Segment Contributors" / "+ Add Contributor": typed name, job title and an **Editor / Viewer / Owner** role, demo names, session only, grants nothing | `dashboard.html` (`openAddContributor`, `addContributor`, `DASH_DATA`) | **Segment Members / Add Operations Member / Add Maintenance Member** by email lookup in Entra ID, membership (segment + department) only, no role choice (`BUSINESS-RULES.md` §14; `API-REQUIREMENTS.md` §8). Remove the role dropdown; Owner is never assignable |
| Every Employee sees every operational segment | all area pages, search | Membership-scoped visibility enforced by the API (`BUSINESS-RULES.md` §14.2, §14.7) |
| Analytics count this browser only | `analytics.html` | Tenant telemetry |
| Document preview "Preview not connected" | `viewer.html` | File storage |
| `console.info('[upload] record to POST', rec)` | `upload.html` | Keep as integration aid or remove |
| `TAQA_STORE.reset()` callable by anyone | `store.js` | Remove |

## 10. Service worker / PWA
Measured with the service worker **enabled** (Chromium):
- First visit registers it and caches the shell; refresh is served under its control; navigation online works.
- Offline: visited pages open from cache, and the offline banner shows. An unvisited page should fall back to `offline.html`; this sandbox cannot prove that because its offline emulation does not block the worker's own requests (the same environment limitation the test suite skips). Verify on a real device in UAT.
- **New deployment (PR 2D, PI-30):** a new worker **waits**; it is never applied by reloading a page in the middle of work. It is applied quietly on the next fresh page load with nothing in progress when that is the only RISE window open (no reload; the next page opened uses it), or when the person taps "Update now" (a warning first if something is in progress, with "Keep working"). Only the tab that asked reloads. The first install still takes control at once, without a reload. `tests/phone-reliability.spec.js` deploys a bumped cache mid-Upload and mid-rejection and proves both survive. Pages and scripts stay network-first, so online users are not stuck on an old build once they open a new page.
- **Connectivity (PI-26):** the worker tells each page whether it was served from the network or from its cache (`HOW_SERVED`), and treats a network answer slower than 6 s as none for that request (a late answer still refreshes the saved copy). The page probes `manifest.json?probe=` (8 s limit; the worker never answers it from its cache) when the device comes back online, when a tab returns to view or is restored by Back, when a change is refused, and every 20 s (backing off to 60 s) while RISE cannot be reached, so it recovers without a reload. The bar shows *Offline* or *RISE cannot be reached*, and "last synced" is written only on a real network answer.
- Residual risks: images and fonts are cache-first, so a replaced image with the same filename stays stale until the cache name changes; **bump `CACHE` on every release** (or stamp it in CI). An offline user keeps the last build until they reconnect. Do not put long `max-age` on HTML/JS at the host without content-hashed filenames. A tab left open across a deploy runs old code until reloaded.
- **Production limitations (Microsoft 365), not solved by the prototype:**
  - *Writes need the server.* The prototype refuses every change while not connected (PI-28) and queues nothing. With SharePoint/Graph the API must be the only authority; any offline queue is a new design decision (conflicts with If-Match/ETag, expiry, what the person sees), not a cache feature.
  - *Reachability is a heuristic.* "Online" from the device and an 8-second probe of a static file do not prove the API or Entra token is usable. Production should treat a failed or 401/403/5xx API call as "not sent" with the same wording, and probe the API's own health endpoint rather than a static file.
  - *Saved copies can be out of date.* A page read offline is the copy from the time shown in the bar; a document withdrawn since then is not known on this device until it reconnects. Pages that matter for safety must say so (the bar does) and production should consider not caching controlled documents' content at all, or expiring it.
  - *Sign-in in the installed app.* Entra sign-in redirects and token renewal inside an installed iPhone app (standalone mode) need testing on real devices; a redirect can open Safari instead of the app.
  - *First rollout of this change.* Tabs already open from the previous release run its code, which reloads on any worker change. The new release never applies itself quietly while another window is open, so such a tab reloads only if the person taps "Update now" in a new tab while it is open. After this release, other tabs are never reloaded.
  - *Updates need the cache name bumped.* Bump `CACHE` on every release (or stamp it in CI); a release without a new name changes nothing for installed users until their cache is replaced.
- With real APIs: never cache API responses or authenticated content in the service worker; the current worker ignores cross-origin requests, which keeps an API on another origin out of its cache. If the API is same-origin, exclude its path explicitly.

## 11. Error handling the frontend will need
The prototype never waits on a network, so it has no loading or failure states. Places that will need them once the API exists:

| Place | States needed |
|---|---|
| Every page's initial data load (area libraries, document page, Master List, desk, search, glossary) | loading; timeout; network failure; 401 → sign in again; 5xx |
| Document page | 404 (not found **or not visible**); 403 |
| Desk: Confirm, Approve, Reject | **409 stale/conflict** (reload the card, say who acted); 403 (no longer allowed, for example delegation expired); network failure without losing the typed rejection reason |
| Withdraw, Edit details | 409; 403; confirm before retry |
| Upload | upload progress; failed upload / resumable; 413 / 415 / 422 (type, size, malware, bulletin rule) with the reason; submit succeeded but notification failed (still filed) |
| Delegation form | 400 (rule), 409 |
| Bell / notifications | failed fetch must not block the page |
| Session expiry | mid-form expiry must not lose drafts (Upload already keeps a local draft) |
| Master List export | long-running export, failure |

## 12. Browser readiness (measured)
| Engine | How | Result |
|---|---|---|
| Chromium desktop | full suite | **452 passed, 0 failed, 1 skipped** |
| Chromium mobile (Pixel 7) | full suite | **452 passed, 0 failed, 1 skipped** |
| Firefox | both journeys driven directly (Operations and Maintenance, correct approver, wrong approver sees nothing, Auditor trail) | **Pass, no script errors** |
| WebKit (Safari engine) | the same | **Pass, no script errors** |
| Firefox / WebKit / mobile-safari **with the test suite** | smoke + journeys | **Fail in test setup** ("navigation interrupted", "operation is insecure" from fixtures touching storage before navigation). The app passes when driven directly, so these are test-harness issues for the Chromium-built fixtures, not app defects. *Recommended:* make `tests/helpers/fixtures.js` cross-engine before relying on these projects in CI |
| Real iOS / Android devices, Edge | not available here | **UAT** |

## 13. Baselines for IT
- **Dependencies:** no runtime dependencies. Dev only: `@playwright/test 1.56.1` (pinned; 1.63.0 available, no need to upgrade before handover) and `http-server ^14.1.1`. `npm audit`: **0 vulnerabilities**. Vendored: `qrcode.js` (Kazuhiko Arase, MIT). Fonts: BW Gradual (**commercial licence: confirm TAQA holds a web licence**), Inter and Urbanist (OFL).
- **Performance** (local server, no compression): 0.8 to 1.25 MB per page uncompressed, DOMContentLoaded 0.16 to 0.57 s. The largest items are `documents-master.js` (259 KB, every page: goes away with the API) and the hero photos (150 to 240 KB each; WebP would cut them by about 80 percent). Five identical Inter and six identical Urbanist font files are shipped (one variable font each, copied per weight). With 2,000 extra documents: segment, Master List and search render in under 0.5 s; the published-documents page takes 1.5 s, so it needs paging when the API returns large lists.
- **Accessibility smoke:** no unnamed controls or images without alt text on 10 key pages (desktop and phone); visible focus on desk and Upload buttons; the existing suite covers the skip link, landmarks, keyboard use of the menus and role door, the reject dialog (focus, Escape, aria) and live regions. Remaining (not regressions): three search fields rely on placeholder text as their label (segment search, Search page question box, published-list search); add visible or `aria-label` labels. The pages honour `prefers-reduced-motion`.
