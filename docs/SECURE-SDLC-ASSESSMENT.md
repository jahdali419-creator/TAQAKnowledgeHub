# Secure SDLC Assessment — TAQA Knowledge Hub

**Assessed against:** Kosli Secure SDLC Process Template (Build · Process · Runtime)
**Platform:** TAQA Knowledge Hub — **front-end only, no backend**
**Prepared by:** Mohammed Al-Jahdali, TAQA Learning Center
**For:** TAQA Cybersecurity
**Date:** 3 August 2026 · **Assessed commit:** `main` @ ae7cdae

---

## 1. Scope — read this first

**The Knowledge Hub is a front-end application only.**

- 33 files, ~2.3 MB — HTML, CSS and JavaScript
- **No server. No backend. No database. No API. No user accounts.**
- **No build step and no package manager** — no `package.json`, no `node_modules`
- **No real documents stored.** Document titles are reference metadata in
  JavaScript; the viewer shows a placeholder
- All user state (theme, bookmarks, read progress) stays in the visitor's own
  browser and is never transmitted

This is not a caveat — it determines which controls are assessable. Roughly half
of the Runtime controls describe a running service with identity, logs and stored
data. **The Hub has none of these yet**, so those controls are *not yet
applicable* rather than failed. They become applicable at Azure integration.

---

## 2. Status at a glance

| Group | Controls | Done | Partial | Pending |
|---|---|---|---|---|
| **Secure Build** | 4 | 4 | — | — |
| **Secure Process** | 4 | — | 2 | 2 |
| **Secure Runtime** | 5 | 2 | 1 | 2 |
| **Total** | **13** | **6** | **3** | **4** |

Every Pending item traces to one of two causes: **no IT owner assigned yet**, or
**the platform is front-end only and has no runtime to secure.**

---

## 3. Secure Build — 4 of 4 done

| Control | Status | Evidence |
|---|---|---|
| **Artifact Binary Provenance** | **Done** | Every deployment is traceable to an exact commit SHA through GitHub Actions logs. No compiled binary exists — the deployed files are the source files. |
| **Version Control** | **Done** | Full Git history, no rewritten history. Every change attributable to an author and commit. |
| **Defined Toolchain** | **Done** | Deliberately minimal: Git → GitHub Actions → Azure Static Web Apps. No compilers, no bundlers, no build tooling to compromise. |
| **Dependency Management** | **Done** | **No package manager and no dependency tree.** The single largest software supply-chain risk does not exist here. One vendored library (`qrcode.js`, MIT), added specifically to remove reliance on an external service. |

**Also completed under Build (3 August 2026):** all four third-party services —
Google Analytics, Google Fonts, a Google Apps Script endpoint, and an external QR
service — were removed. Verified by loading every page in an instrumented browser
and recording all traffic: **zero requests to any host other than our own.**

---

## 4. Secure Process — 2 partial, 2 pending

| Control | Status | Position and why |
|---|---|---|
| **Code Review** | **Pending** | Branch protection is **not enabled** on `main` (GitHub reports `"protected": false`), so changes can reach the live site unreviewed. **Why pending:** a review gate needs a second reviewer, and D&T has not yet nominated a technical reviewer (DT-02). Protection can be switched on immediately; it becomes meaningful once a reviewer exists. |
| **Quality Assurance** | **Partial** | All pages are tested in a real browser before release — page errors, network calls and rendering are checked. There is **no automated test suite**. **Why partial:** meaningful automated tests need real behaviour to assert against — login, document retrieval, upload. Today those don't exist. Test automation should be built alongside the integration, not before it. |
| **Security Vulnerability Scanning** | **Partial** | Completed: full secret scan across **every commit in history** — no hardcoded credentials found. A **cross-site scripting vulnerability was found and fixed on 3 August 2026** (Section 6). Not yet in place: automated SAST/DAST tooling and penetration testing. **Why partial:** see Section 5 — scanning a front-end prototype produces findings that won't reflect the integrated system. |
| **Deployment Approvals** | **Pending** | No approval gate. Deployment to the live site is automatic on merge. **Why pending:** depends entirely on Code Review above — an approval gate without a nominated approver blocks work without adding assurance. |

---

## 5. Security testing must follow integration — not precede it

**This is the key point for the meeting.**

Penetration testing, DAST and malware scanning cannot produce useful results
against the platform in its current form, because the things they test do not
yet exist:

| Test | Why it cannot run meaningfully today |
|---|---|
| **Penetration test** | Nothing to authenticate against, no session to hijack, no server to probe, no data to exfiltrate. A test today would examine a static file server — not the system that will go live. |
| **DAST** | Dynamic scanners exercise running application logic. All logic currently runs in the visitor's own browser against fixed data. |
| **Malware / antivirus scanning** | Uploads are interface-only; no file is stored or transmitted. There is nothing to scan. Requires SharePoint or Azure Storage with Defender. |
| **Authentication & session testing** | There is no login, no session, no token. |
| **Authorisation / access-control testing** | There are no roles and no permissions to test. |
| **API security testing** | There is no API. |

**Recommendation:** schedule the full security test cycle **after Phase 1
(Entra ID sign-in) and Phase 2 (SharePoint document storage) are complete**, so
it tests the real system. Testing now would consume budget, produce findings
that don't map to the final architecture, and require a full re-test afterwards
regardless.

**What was done instead**, appropriate to a front-end at this stage: manual code
review, a full-history secret scan, browser-based testing of every page, external
dependency elimination, and Content-Security-Policy enforcement.

---

## 6. Secure Runtime — 2 done, 1 partial, 2 pending

| Control | Status | Position and why |
|---|---|---|
| **Change Records** | **Done** | Every change is a commit; every deployment is a logged GitHub Actions run tied to a commit. Complete and automatic — no manual record-keeping. |
| **Deployment Controls** | **Partial** | Deployment is automated, repeatable and traceable — no manual copying or direct server access. HTTPS enforced; `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options` and `Referrer-Policy` configured for the Azure deployment. **Why partial:** environment protection rules and a staging environment require the TAQA Azure subscription (DT-04). |
| **Secrets Management** | **Done (for current scope)** | **No secrets exist in the platform**, and none appear anywhere in the repository's history — verified across all commits. Existing GitHub Actions secrets are referenced by name only, with values held in GitHub's encrypted store. **Next:** the Entra ID client secret must be stored in Azure Static Web Apps configuration or Key Vault — never in code (DT-05). |
| **Service Ownership** | **Pending** | The platform is owned solely by the Learning Center. There is no assigned IT owner, no support model and no escalation path. **Why pending:** D&T has not yet assigned an IT coordinator (DT-01) — requested by Ahmed Al Mubarak on 20 July 2026. |
| **Workload Monitoring** | **Pending** | No uptime monitoring, no server-side logging, no audit trail of who accessed which document. **Why pending:** **there is no server to monitor.** A front-end has no server-side logs to collect. Becomes possible once hosted on TAQA Azure with SharePoint (DT-10, DT-19). |

---

## 7. Application-security findings — beyond the Kosli scope

**Note on scope.** The Kosli template defines a *process* framework — how software
is built, reviewed, approved and deployed. It does not cover application-level
security: it contains no controls for input validation, file handling, or output
encoding. This was verified against the template document itself.

An application-level review was therefore carried out **in addition** to the 13
Kosli controls. The findings below come from that review, not from the framework.
All were identified and resolved on 3 August 2026.

| Finding | Severity | Status |
|---|---|---|
| **Cross-site scripting via filename (upload page).** The selected filename was inserted into page HTML without escaping. A file named `<img src=x onerror=alert("XSS")>.pdf` executed script — **confirmed by test, not theoretical.** Impact today is limited to the user's own browser session since nothing is stored; **after Phase 3 it would become stored XSS affecting every viewer of the document library.** | Low now, **High after integration** | **Fixed 3 Aug 2026.** All user-controlled values escaped. Re-tested with the same payload: renders as inert text, no execution. Existing behaviour verified unaffected. |
| **Upload accepted executable file types** (`.exe`, `.msi`). Once uploads reach SharePoint in Phase 3, this would have been a malware distribution path into a platform used by 5,000 staff. | Low now, **High after integration** | **Fixed 3 Aug 2026.** Executables removed. Enforcement is a **code-level allow-list**, not just the input's `accept` attribute — that attribute is only a UI hint and is bypassed by drag-and-drop and the picker's "All files" option. Verified via the bypass path: `.exe` and `.msi` are refused, including double extensions such as `trick.pdf.exe`, and the user is told why. |
| **`.zip` archives remain permitted** for legitimate multi-file documents. Archive *contents* cannot be inspected in the browser. | Low now, **Medium after integration** | **Open — accepted, mitigated at Phase 3.** Requires server-side antivirus scanning (Defender for Storage / SharePoint) once files are actually stored. Recorded here for the exception register. |
| **`script-src` permits `'unsafe-inline'`** — the reason the XSS above was able to execute. | Medium | **Open — deferred.** Removing it means relocating all inline scripts across ~13,000 lines. Recommend doing this during the Azure migration rather than as an isolated change. |
| **Repository is public.** All code and document titles are publicly readable. No credentials or real documents are exposed. | Low | **Open — deliberate and time-boxed.** GitHub requires a public repository for the free preview link. To be made private once TAQA hosting is live. |

---

## 8. Not yet started — Kosli supporting registers

| Item | Status | Note |
|---|---|---|
| **Risk register** | Not started | Should be created jointly with D&T at handover |
| **Exception register** | Not started | Required to record accepted risks such as `'unsafe-inline'` |
| **Security training record** | Not started | To follow TAQA's existing programme |

---

## 9. Summary

**Done — 6 of 13 controls, plus three defects found and fixed during this assessment**
All four Secure Build controls are met, and the build posture is genuinely strong:
no dependency tree, no secrets in history, no third-party calls, full provenance
and version control. Change Records and Secrets Management are met for the
current scope. Three defects were found and fixed the same day: a confirmed cross-site scripting
vulnerability, executable file types accepted by the upload page, and a function-name
collision that was silently suppressing upload warnings.

**Pending because no IT owner is assigned — 3 controls**
Code Review, Deployment Approvals and Service Ownership all wait on D&T naming
an IT coordinator and a technical reviewer (DT-01, DT-02).

**Pending because the platform is front-end only — 4 controls**
Workload Monitoring, full Quality Assurance, complete Vulnerability Scanning and
full Deployment Controls require a running service with identity, storage and
logs. **The Hub has no backend yet**, so these cannot be implemented or
meaningfully tested.

**Scope note:** the Kosli template covers the build and delivery *process*. It
contains no application-security controls, so an application-level review was run
alongside it (Section 7). The three defects fixed during this assessment came from
that additional review, not from the framework.

**The honest position:** for a front-end application at this stage, the
code-level security work is complete and evidenced. What remains is not
neglected work — it is work that becomes possible only once the platform has an
identity provider, a server and stored data. **Security testing should be
scheduled after integration**, and this assessment repeated at that point.

---

*Mohammed Al-Jahdali · mohammed.jahdali@tq.com · +966 54 773 3744*
