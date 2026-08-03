# TAQA Knowledge Hub — Secure SDLC Assessment

**Platform:** TAQA Knowledge Hub ("The One Platform")
**Prepared by:** Mohammed Al-Jahdali, TAQA Learning Center
**For:** TAQA Cybersecurity
**Assessment date:** 3 August 2026
**Assessed commit:** `main` @ 9db9b68
**Classification:** Internal Use

---

## 1. How to read this document

This is an assessment of the platform **as it exists today**, carried out by
inspecting the live code and testing the running application — not a
self-declaration. Where something was tested, the test and its result are
stated so they can be repeated.

Controls fall into three groups:

| | Meaning |
|---|---|
| **Closed** | Implemented and verified today |
| **Open** | Can and should be fixed now — does not depend on anyone else |
| **Blocked** | Cannot be completed until the platform is on TAQA Azure with Entra ID |

The **Blocked** group is the important one for this meeting. A meaningful part
of a security assessment cannot be performed on a static prototype with no
identity, no server, and no real data. Those tests belong after Azure
onboarding, and are listed in Section 5 so they are scheduled rather than
forgotten.

---

## 2. What the platform is — scope of assessment

Assessing this correctly depends on understanding what it is.

- A **static website**: 33 files, ~2.3 MB. HTML, CSS and JavaScript only.
- **No server, no backend, no database, no API.**
- **No build pipeline** and **no package manager** — there is no `package.json`
  and no `node_modules`, so there is no npm dependency tree and no third-party
  supply chain to compromise.
- The only vendored third-party code is `qrcode.js` (MIT, Kazuhiko Arase), added
  to remove a dependency on an external QR service.
- **No real documents are stored in the platform.** Document titles are
  reference metadata in JavaScript files; the viewer displays a placeholder.
- All user state (bookmarks, theme, read progress) is held in the browser's own
  `localStorage`. Nothing is transmitted or stored centrally.

This materially limits today's attack surface. It also means several standard
controls are not yet applicable, rather than missing through oversight.

---

## 3. Closed — implemented and verified

| # | Control | Evidence |
|---|---|---|
| **C-01** | **Version control** | Full Git history preserved, no rewritten history. Every change traceable to a commit and author. |
| **C-02** | **No hardcoded secrets** | Every commit in the repository's history was scanned for API keys, tokens, passwords and private keys. **No hardcoded secrets found.** The only token references are GitHub Actions secret *names* (`${{ secrets.… }}`), which is correct practice — the values are held in GitHub's encrypted secret store, never in code. |
| **C-03** | **No third-party runtime dependencies** | No `package.json`, no npm tree. This removes the single most common software supply-chain risk entirely. |
| **C-04** | **No third-party network calls** | Previously the site called Google Analytics, Google Fonts, a Google Apps Script endpoint, and an external QR service. **All four were removed on 3 August 2026.** Verified by loading every page in an instrumented browser and recording all network traffic: **zero requests to any host other than the site's own origin.** |
| **C-05** | **No data leaves TAQA** | The registration form that posted names and email addresses to an external Google Apps Script endpoint has been **removed entirely**. No user data is transmitted anywhere. |
| **C-06** | **Content-Security-Policy** | Enforced on every page, restricted to `'self'`. Any future attempt to call a third-party host is blocked by the browser, not merely absent from the source. |
| **C-07** | **Transport security** | Served over HTTPS only. `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` and `Referrer-Policy` are configured in `staticwebapp.config.json` for the Azure deployment. |
| **C-08** | **Automated deployment** | Deployment is via GitHub Actions from a specific commit. No manual file copying, no FTP, no direct server access. Every deployment is logged and attributable. |
| **C-09** | **Cross-site scripting — upload page** | **Fixed and verified 3 August 2026.** See F-02 below for the finding and the proof of fix. |
| **C-10** | **No sensitive data in browser storage** | Browser storage holds only: theme preference, recently viewed titles, read progress, tour-completed flag, notification count. No credentials, no personal data, no document content. |

---

## 4. Open — fixable now, no dependency on D&T

These are within the Learning Center's control and do not require Azure.

| # | Finding | Risk | Status |
|---|---|---|---|
| **F-01** | **Branch protection is not enabled on `main`.** The GitHub API reports `"protected": false`. Anyone with write access can push directly to the branch that publishes to the live site, with no review. | Code reaches production unreviewed. This is the "code review enforcement" control. | **Open.** One setting change. Cannot be fully closed until D&T nominates the technical reviewer (DT-02) — but protection itself can be switched on immediately. |
| **F-02** | **Cross-site scripting via filename (upload page).** The selected filename was inserted unescaped into page HTML. A file named `<img src=x onerror=alert("XSS")>.pdf` caused the script to execute. **Confirmed by test, not theoretical.** | Today: low — a user can only attack their own browser session, as nothing is stored or shared. **After Phase 3**, when uploaded filenames are stored and displayed to other users, this would become stored XSS affecting any viewer. | **CLOSED 3 Aug 2026.** All user-controlled values are now HTML-escaped. Re-tested with the same payload: renders as inert text, no script execution, no `<img>` element created. Existing behaviour (including filenames with apostrophes) verified unaffected. |
| **F-03** | **File upload accepts executables.** The file picker accepts `.exe`, `.msi` and `.zip` alongside document formats. | Today: no risk — files are not stored or transmitted anywhere. **After Phase 3**, this becomes a malware distribution path into a platform used by 5,000 staff. | **Open — needs a decision.** If software distribution is intended, it requires explicit approval plus server-side antivirus scanning. If not, these types should be removed from the accepted list. |
| **F-04** | **`script-src` permits `'unsafe-inline'`.** | Weakens the CSP's ability to contain XSS — it is why F-02 executed. Removing it requires moving all inline scripts to separate files, a substantial refactor of ~13,000 lines. | **Open — deferred.** Recommend addressing during the Azure migration rather than as an isolated change. |
| **F-05** | **Repository is public.** All code, document titles and segment structure are publicly readable on the internet. | Discloses internal document naming and organisational structure. No credentials or real documents are exposed. | **Open — deliberate, time-boxed.** GitHub requires a public repository to host the free preview link. Should be switched to private once the platform runs on TAQA Azure. |
| **F-06** | **No `.gitignore`.** | Nothing sensitive has been committed, but the absence of a `.gitignore` means there is no guard against accidentally committing local config or credential files in future. | **Open.** Trivial to add. |
| **F-07** | **No documented security policy in the repository.** No `SECURITY.md`, no recorded vulnerability disclosure route. | Process gap rather than a technical one. | **Open.** |

---

## 5. Blocked — requires Azure and Entra ID first

**This is the section to walk Cybersecurity through.** These controls cannot be
assessed or implemented on the current platform. They are not outstanding
failures; they are work that becomes possible only once the platform is hosted
on TAQA Azure with real identity and real data.

| # | Control | Why it cannot be done yet | Depends on |
|---|---|---|---|
| **B-01** | **Authentication** | There is no login. The site is open to anyone with the URL. Entra ID sign-in cannot be configured without an Azure App Registration. | DT-05, DT-06, DT-07 |
| **B-02** | **Authorisation / least privilege** | With no identity, there are no roles and no per-segment access control. Cannot be designed until the access model is agreed. | DT-08, DT-09 |
| **B-03** | **Server-side file scanning (antivirus / malware)** | There is no server to scan on. Uploads are UI-only. Requires SharePoint or Azure Storage with Defender enabled. | DT-10, DT-14 |
| **B-04** | **Audit logging** | No server means no server-side log of who accessed which document. Required for any real document platform. | DT-10, DT-19 |
| **B-05** | **Data classification and retention** | No real documents are stored yet, so sensitivity labels and retention policies cannot be applied. | DT-12 |
| **B-06** | **Secrets management** | No secrets exist yet. Once Entra ID is configured, the client secret must live in Azure Static Web Apps configuration or Key Vault — never in code. | DT-05 |
| **B-07** | **Penetration test** | A meaningful test requires the authenticated, hosted application with real data flows. Testing the current static prototype would produce findings that do not reflect the final system. | DT-20 |
| **B-08** | **Backup and disaster recovery** | Nothing to back up beyond source code, which is already in Git. Becomes applicable once documents live in SharePoint. | DT-10 |
| **B-09** | **Vulnerability management process** | No runtime dependencies exist to patch today. A process is still needed for the integration phases. | DT-19 |

---

## 6. Current status of the platform

Worth stating plainly: **the platform is currently offline.**

It ran on a free-trial Azure subscription inside the TAQA directory
(`taqa.com.sa`). That trial credit expired and the subscription is now
**Disabled**, so the Azure URL returns 404. A GitHub Pages preview remains
available.

The Azure Static Web Apps **Free tier** carries no licence or hosting cost. What
is required is a TAQA-owned subscription to host the resource under.

---

## 7. Summary for the meeting

**What has been done**

- No secrets anywhere in the code or its history — verified across all commits
- No third-party dependencies and therefore no supply-chain exposure
- All external service calls removed; the site now contacts no third party at all
- Content-Security-Policy enforced on every page
- A confirmed cross-site scripting vulnerability found, fixed and re-tested today
- Deployment fully automated and traceable to individual commits

**What is open and being addressed**

- Branch protection to enforce code review — needs D&T to name the reviewer
- Executable file types in the upload picker — needs a decision
- Repository to be made private once TAQA hosting is live

**What must wait for Azure**

- Authentication, authorisation, audit logging, malware scanning, data
  classification, and penetration testing

**The honest position:** the code-level security work is in good shape and can be
evidenced. The platform-level controls — identity, logging, scanning, retention
— are genuinely not yet possible, because the platform has no identity provider,
no server and no stored data. Those controls arrive with the Azure migration,
and the assessment should be repeated once it is complete.

---

*Mohammed Al-Jahdali · mohammed.jahdali@tq.com · +966 54 773 3744*
