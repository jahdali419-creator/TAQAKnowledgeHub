# TAQA Knowledge Hub: D&T handover and integration plan

Prepared by Mohammed Al-Jahdali, Maintenance Instructor Lead, TAQA Learning Center
For D&T Demand (Mashael Al Muhanna, Rafa Al Zahrani) and D&T Corporate (Hilal Al Malki)
Sponsor: Ahmed Al Mubarak, TAQA Well Solutions
Status: Demand Register form submitted, awaiting demand assessment
Classification: Internal Use

---

## 1. Purpose

The Demand Register form captures what is being requested. This document captures what already exists, what is physically being handed to D&T, and the specific tasks required from each side, so that the demand team can size time, effort and cost against a concrete scope rather than a concept.

Nothing in this plan requires new licensing. Every proposed component sits inside TAQA's existing Microsoft 365 and Azure tenant.

---

## 2. What exists today

The frontend is complete and running. It is a static web application with no backend.

| Item | Current state |
|---|---|
| Technology | Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies to patch |
| Size | About 13,700 lines across 11 pages and 4 shared scripts |
| Pages | Home, dashboard, segment view, document library, document viewer, AI search, analytics, glossary, upload, support ticket, offline fallback |
| Segments modelled | 12: Cementing, Coiled Tubing, Cybersecurity, Drilling, Fracturing, HR, Inspection, QHSE, TWS Maintenance, Well Safety, Well Testing, Wireline |
| Offline capability | Progressive Web App with a service worker, installable, with an offline fallback page |
| Language | English only. No Arabic version exists today |
| Branding | TAQA corporate colour and typography system throughout |
| Hosting today | Azure Static Web Apps and GitHub Pages, both from the same repository |
| CI/CD | GitHub Actions, automatic deploy on merge to `main` |
| Authentication | None. The site is currently open, with no sign-in |
| Document storage | None. Document titles are reference metadata held in JavaScript files, and the viewer shows a placeholder rather than the real file |
| Upload page | Interface only. Files are not persisted anywhere |
| User data such as bookmarks, notifications and read progress | Stored in the browser's `localStorage`, so it is per-device, not shared, and lost when the cache is cleared |

Read that as: the user experience layer is done and proven. Everything behind it, meaning identity, document storage, workflow and real analytics, is what D&T support is being requested for.

---

## 3. How the frontend gets handed over

### Recommended: transfer the repository into TAQA's GitHub or Azure DevOps organisation

The code currently lives in a personal GitHub repository. The clean handover looks like this:

1. D&T creates a repository under the TAQA organisation, either GitHub Enterprise or Azure DevOps, whichever is the standard.
2. Full commit history is pushed into it, with no rewrite and no loss of audit trail.
3. Branch protection is switched on: no direct pushes to `main`, and a pull request plus one approval required. This satisfies the code review enforcement control from the Kosli Secure SDLC audit.
4. Deployment moves to a TAQA-owned Azure subscription. The GitHub Pages deployment is retired at that point, since it should not remain live once the platform holds real content.
5. My access continues as a contributor so that Learning Center content and UI work is not blocked, with a nominated D&T technical reviewer approving merges.

### Why not simply send a ZIP

A ZIP hands over files but not the deploy pipeline, the history, or the review gate. D&T would inherit a snapshot with no traceability, which is the opposite of what the SDLC audit established. If policy requires an offline copy for records, a tagged release archive can be provided alongside the repository transfer.

### What D&T receives at handover

The repository with full history, including the CI/CD workflow definitions. This plan and the task register below. The Kosli Secure SDLC audit results, which are already complete with all code-level gaps closed. A walkthrough session on the codebase and page structure. Finally, the list of external dependencies to be resolved in section 6.

---

## 4. Tasks required from D&T

Sized as our indicative estimate to anchor discussion. D&T's own sizing governs.

### Blocking: nothing progresses until these close

| # | Task | Owner | Why it is needed | Done when | Est. |
|---|---|---|---|---|---|
| DT-01 | Assign a named IT coordinator to co-own the integration phases | D&T Corporate | A single point of accountability, requested by Ahmed Al Mubarak on 20 July | Name, role and time allocation confirmed in writing | n/a |
| DT-02 | Nominate a technical reviewer to approve code changes before deployment | D&T | Required by the Secure SDLC code review control | Reviewer named and added to the repository with approval rights | n/a |
| DT-03 | Create the repository under the TAQA organisation and enable branch protection | D&T Platform | Moves the code under corporate governance | Repo exists, `main` protected, PR plus 1 approval enforced, history intact | 0.5 day |
| DT-04 | Provision a TAQA-owned Azure subscription and resource group for hosting | D&T Cloud | The platform must run on TAQA infrastructure rather than a personal account | Resource group created, cost centre assigned, access granted | 1 day |
| DT-05 | Approve and create the Azure App Registration for Microsoft Graph | D&T Security and Cloud | Prerequisite for Entra ID sign-in and SharePoint access, and the single largest blocker | App registration exists, client ID and tenant ID issued, redirect URIs configured | 1 to 2 days |
| DT-06 | Grant Graph API permissions with admin consent | D&T Security | Without consent the integration cannot authenticate or read documents | Delegated scopes consented: `User.Read`, `Sites.Read.All`, `Files.Read.All`. Write scopes only for the upload phase | 1 day |

### Phase 1: identity through Entra ID sign-in

| # | Task | Owner | Done when | Est. |
|---|---|---|---|---|
| DT-07 | Configure Entra ID authentication on the Azure Static Web App | D&T Cloud | Unauthenticated visitors are redirected to TAQA sign-in | 1 to 2 days |
| DT-08 | Define the access model: who can see the Hub, and which segments | D&T and Learning Center | Entra security groups created and mapped to the 12 segments | 2 to 3 days |
| DT-09 | Decide whether segment-level restriction is required at launch | D&T Security and segment owners | A written decision: open to all employees, or group-restricted per segment | n/a |

### Phase 2: document storage in SharePoint

| # | Task | Owner | Done when | Est. |
|---|---|---|---|---|
| DT-10 | Provision the SharePoint site and document library structure for the 12 segments | D&T M365 | Libraries exist with agreed metadata columns for segment, document type, revision, owner and review date | 3 to 5 days |
| DT-11 | Define document permissions and the inheritance model | D&T M365 and segment owners | Permission matrix approved | 2 days |
| DT-12 | Confirm retention and classification policy for operational documents | D&T Governance | Retention labels applied and classification confirmed | 2 days |
| DT-13 | Expose document metadata to the frontend through Graph or a search index | D&T and Learning Center | The library and viewer read live SharePoint data instead of static JavaScript files | 5 to 8 days |

### Phase 3: workflow through Power Automate

| # | Task | Owner | Done when | Est. |
|---|---|---|---|---|
| DT-14 | Build the document upload and approval flow | D&T Power Platform | Upload triggers review, and approved documents publish to the library | 5 to 8 days |
| DT-15 | Build the support ticket flow | D&T Power Platform | The support form creates a tracked item and notifies the owner | 2 to 3 days |
| DT-16 | Confirm the Power Platform environment and DLP policy allow these flows | D&T Power Platform | Environment assigned and DLP reviewed | 1 to 2 days |

### Phase 4: analytics and notifications

| # | Task | Owner | Done when | Est. |
|---|---|---|---|---|
| DT-17 | Replace browser-local analytics with a tenant-approved solution | D&T | Real usage data covering views, searches and per-segment activity, from an approved source. See CMP-02 | 3 to 5 days |
| DT-18 | Server-side notifications and bookmarks | D&T | User state follows the person across devices instead of living in one browser | 3 to 5 days |

### Phase 5: operations

| # | Task | Owner | Done when | Est. |
|---|---|---|---|---|
| DT-19 | Add the Hub to the corporate monitoring and support model | D&T Operations | Uptime monitoring, a support queue and an escalation path defined | 2 days |
| DT-20 | Penetration test and security assessment before broad rollout | D&T Security | Assessment completed and findings closed | Per D&T |
| DT-21 | Confirm the production URL and publish it internally | D&T and Comms | Final URL live and the announcement issued | 1 day |

---

## 5. Tasks on the Learning Center side

These do not depend on D&T and are proceeding in parallel.

| # | Task | Owner | Done when |
|---|---|---|---|
| LC-01 | Collect and organise the real source documents for all 12 segments | Learning Center and segment owners | Documents gathered with owner and revision confirmed |
| LC-02 | Confirm each segment's content owner and approver | Learning Center | A named owner per segment |
| LC-03 | Wire the frontend to Graph and SharePoint once DT-05, DT-06 and DT-10 are complete | Learning Center, with the DT-02 reviewer | Library, viewer and search read live data |
| LC-04 | Close the Cybersecurity gap in the search index. The segment exists in the data model but has no searchable entries | Learning Center | Cybersecurity documents indexed like the other 11 segments |
| LC-05 | Decide whether an Arabic version is required, and scope it if so. The platform is English only today | Learning Center and segment owners | A written decision. If Arabic is required, the translation and right-to-left work is scoped as its own phase |
| LC-06 | Codebase walkthrough session for the D&T coordinator and reviewer | Learning Center | Session delivered and questions closed |
| LC-07 | User acceptance testing with a pilot segment before full rollout | Learning Center and pilot segment | UAT signed off |

---

## 6. Compliance items

Raised here rather than left for D&T review to surface. The four code-level items are already closed, and the two remaining depend on D&T action.

| # | Item | Risk | Status |
|---|---|---|---|
| CMP-01 | The user registration form posted to an external Google Apps Script endpoint | Internal names and email addresses left the TAQA tenant | Closed. The external call is removed, and the name is stored in the user's own browser only. Entra ID sign-in (DT-07) replaces the form entirely |
| CMP-02 | Google Analytics and Tag Manager loaded on every page | Usage telemetry sent to a third party | Closed. Removed completely. The replacement should be a D&T-approved tool (DT-17) |
| CMP-03 | QR codes generated through the external `api.qrserver.com` service | Document references sent to a third party | Closed. Generated in the browser through a bundled MIT-licensed library, with output verified to decode correctly |
| CMP-06 | Web fonts loaded from the Google Fonts CDN | Every page view requested assets from Google | Closed. Urbanist and Inter are self-hosted at 398 KB, Latin subset, with appearance unchanged |
| CMP-04 | The site is publicly reachable with no sign-in | Anyone with the URL can browse it | Open, with D&T. Closed by DT-07. Until then the Hub must not hold real operational documents |
| CMP-05 | GitHub Pages deployment runs alongside Azure | A second public copy outside TAQA hosting | Open, pending a decision. Retire the workflow at repository transfer (DT-03). Left running for now, as it may be the URL in current use |

All ten pages were loaded in a browser with network traffic recorded. The site now makes no requests to any third-party host. The Content-Security-Policy on every page was tightened to `'self'` only, so any future third-party call is blocked by the browser rather than merely absent from the code.

CMP-04 is the reason no real operational content has been loaded into the platform yet.

---

## 7. Decisions D&T needs to make

The demand assessment cannot be costed without these, and each one changes the effort materially.

1. Hosting: Azure Static Web Apps as now, which is the lowest effort, or migrate to SharePoint Online or another approved pattern?
2. Source control: GitHub Enterprise or Azure DevOps?
3. Document source of truth: a new dedicated SharePoint site, or integration with the segments' existing libraries?
4. Access scope at launch: all 5,000 employees, or a pilot segment first?
5. Segment-level permissions: required at launch, or open internally and restricted later?
6. Support model: who owns the platform operationally after handover?
7. Phasing: all five phases as one programme, or approve Phase 1 first and gate the rest on adoption?

---

## 8. Suggested path through the assessment

The recommendation is to approve Phase 1 first and gate the rest on it.

Phase 1 is identity only: App Registration, Entra ID sign-in, and the access model. It is the smallest increment that produces a genuinely usable, governed platform, meaning a real TAQA sign-in on a working frontend hosted on TAQA infrastructure. It is also the blocker for everything else, so it has to come first regardless.

That gives D&T a small, low-cost first decision instead of a five-phase commitment, and gives the business something demonstrable to judge adoption on before further investment.

The immediate next step is a 45-minute session with the D&T coordinator and technical reviewer once they are named (DT-01, DT-02), covering a live demo, a codebase walkthrough, and confirmation of the decisions in section 7.

---

Mohammed Al-Jahdali. mohammed.jahdali@tq.com. +966 54 773 3744
