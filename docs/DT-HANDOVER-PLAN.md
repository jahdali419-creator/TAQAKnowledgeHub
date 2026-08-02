# TAQA Knowledge Hub — D&T Handover & Integration Plan

**Prepared by:** Mohammed Al-Jahdali, Maintenance Instructor Lead, TAQA Learning Center
**For:** D&T Demand (Mashael Al Muhanna, Rafa Al Zahrani) · D&T Corporate (Hilal Al Malki)
**Sponsor:** Ahmed Al Mubarak, TAQA Well Solutions
**Status:** Demand Register form submitted — awaiting demand assessment
**Classification:** Internal Use

---

## 1. Purpose of this document

The Demand Register form captures *what* is being requested. This document captures *what already
exists*, *what is physically being handed to D&T*, and *the specific tasks required from each side*
so the demand team can size time, effort, and cost against a concrete scope rather than a concept.

Nothing in this plan requires new licensing. Every proposed component is inside TAQA's existing
Microsoft 365 / Azure tenant.

---

## 2. What exists today — technical fact sheet

The frontend is complete and running. It is a **static web application** with no backend.

| Item | Current state |
|---|---|
| Technology | Plain HTML / CSS / JavaScript — no framework, no build step, no dependencies to patch |
| Size | ~13,700 lines across 11 pages + 4 shared scripts |
| Pages | Home, Dashboard, Segment view, Document library, Document viewer, AI search, Analytics, Glossary, Upload, Support ticket, Offline fallback |
| Segments modelled | 12 (Cementing, Coiled Tubing, Cybersecurity, Drilling, Fracturing, HR, Inspection, QHSE, TWS Maintenance, Well Safety, Well Testing, Wireline) |
| Offline capability | Progressive Web App — service worker, installable, offline fallback page |
| Bilingual | English / Arabic with full RTL support |
| Branding | TAQA corporate colour and typography system applied throughout |
| Hosting today | Azure Static Web Apps + GitHub Pages (both from the same repository) |
| CI/CD | GitHub Actions, automatic deploy on merge to `main` |
| Authentication | **None** — the site is currently open, no sign-in |
| Document storage | **None** — document titles are reference metadata held in JavaScript files; the viewer shows a placeholder, not the real file |
| Upload page | UI only — files are not persisted anywhere |
| User data (bookmarks, notifications, read progress, analytics counters) | Stored in the browser's `localStorage` — per-device, not shared, lost when cache is cleared |

**Read this as:** the user experience layer is done and proven. Everything behind it — identity,
document storage, workflow, real analytics — is what D&T support is being requested for.

---

## 3. How the frontend gets handed over

### Recommended: transfer the repository into TAQA's GitHub / Azure DevOps organisation

The code currently lives in a personal GitHub repository. The clean handover is:

1. D&T creates a repository under the TAQA organisation (GitHub Enterprise or Azure DevOps —
   D&T's choice, whichever is the standard).
2. Full commit history is pushed into it. No rewrite, no loss of audit trail.
3. Branch protection is switched on: no direct pushes to `main`, pull request + one approval
   required. This is what satisfies the "code review enforcement" control from the Kosli
   Secure SDLC audit.
4. Deployment moves to a TAQA-owned Azure subscription. The GitHub Pages deployment is retired
   at that point — it should not remain live once the platform holds real content.
5. My access continues as a contributor so Learning Center content and UI work is not blocked,
   with a nominated D&T technical reviewer approving merges.

### Why not simply send a ZIP

A ZIP hands over files but not the deploy pipeline, the history, or the review gate. D&T would
inherit a snapshot with no traceability — the opposite of what the SDLC audit established. If
policy requires an offline copy for records, a tagged release archive can be provided alongside
the repository transfer.

### What D&T receives at handover

- Repository with full history, including the CI/CD workflow definitions
- This plan and the task register below
- The Kosli Secure SDLC audit results (already completed — all code-level gaps closed)
- A walkthrough session on the codebase and page structure
- The list of external dependencies to be resolved (Section 7)

---

## 4. Tasks required from D&T

Sized as our indicative estimate to anchor discussion — D&T's own sizing governs.

### Blocking — nothing progresses until these close

| # | Task | Owner | Why it is needed | Done when | Est. |
|---|---|---|---|---|---|
| **DT-01** | Assign a named IT coordinator to co-own the integration phases | D&T Corporate | Single point of accountability; requested by Ahmed Al Mubarak on 20 July | Name, role, and time allocation confirmed in writing | — |
| **DT-02** | Nominate a technical reviewer to approve code changes before deployment | D&T | Required by the Secure SDLC code-review control | Reviewer named and added to the repository with approval rights | — |
| **DT-03** | Create the repository under the TAQA organisation and enable branch protection | D&T Platform | Moves the code under corporate governance | Repo exists, `main` protected, PR + 1 approval enforced, history intact | 0.5 day |
| **DT-04** | Provision a TAQA-owned Azure subscription / resource group for hosting | D&T Cloud | Platform must run on TAQA infrastructure, not a personal account | Resource group created, cost centre assigned, access granted | 1 day |
| **DT-05** | Approve and create the Azure App Registration for Microsoft Graph | D&T Security + Cloud | Prerequisite for Entra ID sign-in and SharePoint access — the single largest blocker | App registration exists; client ID and tenant ID issued; redirect URIs configured | 1–2 days |
| **DT-06** | Grant Graph API permissions with admin consent | D&T Security | Without consent the integration cannot authenticate or read documents | Delegated scopes consented: `User.Read`, `Sites.Read.All`, `Files.Read.All` (write scopes only for the upload phase) | 1 day |

### Phase 1 — Identity (Entra ID sign-in)

| # | Task | Owner | Done when | Est. |
|---|---|---|---|---|
| **DT-07** | Configure Entra ID authentication on the Azure Static Web App | D&T Cloud | Unauthenticated visitors are redirected to TAQA sign-in | 1–2 days |
| **DT-08** | Define the access model — who can see the Hub, and which segments | D&T + Learning Center | Entra security groups created and mapped to the 12 segments | 2–3 days |
| **DT-09** | Decide whether segment-level restriction is required at launch | D&T Security + segment owners | Written decision: open-to-all-employees vs. group-restricted per segment | — |

### Phase 2 — Document storage (SharePoint)

| # | Task | Owner | Done when | Est. |
|---|---|---|---|---|
| **DT-10** | Provision the SharePoint site / document library structure for the 12 segments | D&T M365 | Libraries exist with agreed metadata columns (segment, document type, revision, owner, review date) | 3–5 days |
| **DT-11** | Define document permissions and inheritance model | D&T M365 + segment owners | Permission matrix approved | 2 days |
| **DT-12** | Confirm retention and classification policy for operational documents | D&T Governance | Retention labels applied; classification confirmed | 2 days |
| **DT-13** | Expose document metadata to the frontend via Graph or a search index | D&T + Learning Center | The library and viewer read live SharePoint data instead of static JavaScript files | 5–8 days |

### Phase 3 — Workflow (Power Automate)

| # | Task | Owner | Done when | Est. |
|---|---|---|---|---|
| **DT-14** | Build the document upload and approval flow | D&T Power Platform | Upload triggers review; approved documents publish to the library | 5–8 days |
| **DT-15** | Build the support ticket flow | D&T Power Platform | Support form creates a tracked item and notifies the owner | 2–3 days |
| **DT-16** | Confirm the Power Platform environment and DLP policy allow these flows | D&T Power Platform | Environment assigned; DLP reviewed | 1–2 days |

### Phase 4 — Analytics and notifications

| # | Task | Owner | Done when | Est. |
|---|---|---|---|---|
| **DT-17** | Replace browser-local analytics with a tenant-approved solution | D&T | Real usage data — views, searches, per-segment activity — from an approved source (see CMP-02) | 3–5 days |
| **DT-18** | Server-side notifications and bookmarks | D&T | User state follows the person across devices instead of living in one browser | 3–5 days |

### Phase 5 — Operations

| # | Task | Owner | Done when | Est. |
|---|---|---|---|---|
| **DT-19** | Add the Hub to the corporate monitoring and support model | D&T Operations | Uptime monitoring, support queue, and escalation path defined | 2 days |
| **DT-20** | Penetration test / security assessment before broad rollout | D&T Security | Assessment completed, findings closed | Per D&T |
| **DT-21** | Confirm the production URL and publish it internally | D&T + Comms | Final URL live; announcement issued | 1 day |

---

## 5. Tasks on the Learning Center side

These do not depend on D&T and are proceeding in parallel.

| # | Task | Owner | Done when |
|---|---|---|---|
| **LC-01** | Collect and organise the real source documents for all 12 segments | Learning Center + segment owners | Documents gathered with owner and revision confirmed |
| **LC-02** | Confirm each segment's content owner and approver | Learning Center | Named owner per segment |
| **LC-03** | Wire the frontend to Graph / SharePoint once DT-05, DT-06 and DT-10 are complete | Learning Center (with DT-02 reviewer) | Library, viewer and search read live data |
| **LC-04** | Close the Cybersecurity gap in the search index — the segment exists in the data model but has no searchable entries | Learning Center | Cybersecurity documents indexed like the other 11 segments |
| **LC-05** | Arabic content review across all pages | Learning Center | Translations verified by a native reviewer |
| **LC-06** | Codebase walkthrough session for the D&T coordinator and reviewer | Learning Center | Session delivered; questions closed |
| **LC-07** | User acceptance testing with a pilot segment before full rollout | Learning Center + pilot segment | UAT signed off |

---

## 6. Compliance items

Raised proactively rather than left for D&T review to surface. The four code-level items have
already been closed; the two remaining depend on D&T action.

| # | Item | Risk | Status |
|---|---|---|---|
| **CMP-01** | User registration form posted to an external Google Apps Script endpoint | Internal names and email addresses left the TAQA tenant | **Closed.** External call removed. Name is stored in the user's own browser only. Entra ID sign-in (DT-07) replaces the form entirely |
| **CMP-02** | Google Analytics / Tag Manager loaded on every page | Usage telemetry sent to a third party | **Closed.** Removed completely. Replacement to be a D&T-approved tool (DT-17) |
| **CMP-03** | QR codes generated via the external `api.qrserver.com` service | Document references sent to a third party | **Closed.** Generated in the browser via a bundled MIT-licensed library. Output verified to decode correctly |
| **CMP-06** | Web fonts loaded from the Google Fonts CDN | Every page view requested assets from Google | **Closed.** Urbanist and Inter self-hosted (398 KB, Latin subset). Appearance unchanged |
| **CMP-04** | The site is publicly reachable with no sign-in | Anyone with the URL can browse it | **Open — D&T.** Closed by DT-07. Until then the Hub must not hold real operational documents |
| **CMP-05** | GitHub Pages deployment runs alongside Azure | A second public copy outside TAQA hosting | **Open — decision.** Retire the workflow at repository transfer (DT-03). Left running for now as it may be the URL in current use |

**Verification:** all ten pages were loaded in a browser with network traffic recorded. The site
now makes **zero requests to any third-party host**. The Content-Security-Policy on every page has
been tightened to `'self'` only, so any future third-party call is blocked by the browser rather
than merely absent from the code.

CMP-04 is the reason no real operational content has been loaded into the platform yet.

---

## 7. Decisions D&T needs to make

The demand assessment cannot be costed without these. Each one changes the effort materially.

1. **Hosting** — Azure Static Web Apps (current, lowest effort), or migrate to SharePoint Online /
   another approved pattern?
2. **Source control** — GitHub Enterprise or Azure DevOps?
3. **Document source of truth** — a new dedicated SharePoint site, or integrate with the segments'
   existing libraries?
4. **Access scope at launch** — all 5,000 employees, or a pilot segment first?
5. **Segment-level permissions** — required at launch, or open internally and restrict later?
6. **Support model** — who owns the platform operationally after handover?
7. **Phasing** — all five phases as one programme, or approve Phase 1 (identity) first and gate
   the rest on adoption?

---

## 8. Suggested path through the assessment

**Recommendation: approve Phase 1 first, gate the rest on it.**

Phase 1 is identity only — App Registration, Entra ID sign-in, access model. It is the smallest
increment that produces a genuinely usable, governed platform: a real TAQA sign-in on a working
frontend, hosted on TAQA infrastructure. It is also the blocker for everything else, so it has to
come first regardless.

That gives D&T a small, low-cost first decision instead of a five-phase commitment, and gives the
business something demonstrable to judge adoption on before further investment.

**Immediate next step:** a 45-minute session with the D&T coordinator and technical reviewer, once
named (DT-01, DT-02), covering a live demo, a codebase walkthrough, and confirmation of the
decisions in Section 7.

---

*Contact: Mohammed Al-Jahdali · mohammed.jahdali@tq.com · +966 54 773 3744*
