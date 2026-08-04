# Azure migration plan

TAQA Knowledge Hub, migration onto TAQA Azure and Microsoft 365
For Rafa Al Zahrani, D&T, Azure migration owner
From Mohammed Al-Jahdali, TAQA Learning Center
4 August 2026. Classification: Internal Use

---

## 1. What is being migrated

The Knowledge Hub is a folder of files. That is the whole thing.

42 files, about 2.2 MB. No database, no server, no backend. No build step, no compiling, no package manager. The files sitting in the repository are exactly the files served to the browser.

This is the most important fact for planning, because it means there is nothing to migrate except static files. No data to export, no server to rebuild, no dependencies to resolve, no downtime to schedule.

| Type | Files | What they are |
|---|---|---|
| Pages | 11 `.html` | Home, segment view, document viewer, library, search, glossary, upload, support, control panel, analytics, offline page |
| Scripts | 5 `.js` | Shared UI, two data files, the QR library and the service worker |
| Fonts | 13 files | TAQA corporate typeface plus self-hosted web fonts |
| Images | 5 plus icons | Hero images and app icons |
| Config | `manifest.json`, `staticwebapp.config.json` | App install settings and Azure routing rules |

The current state of the application, and what it does and does not do, is covered in the companion document "What the platform does".

---

## 2. Microsoft 365 and Azure services used

Every service below is already owned by TAQA. **The migration requires no new licences and no new products.**

### Phase 1: identity

| Service | Role in the platform | Licence position |
|---|---|---|
| Microsoft Entra ID | Provides sign-in. Replaces having no login at all. Supplies the user's name, email and group membership to the platform | Included in existing TAQA M365 |
| Entra ID App Registration | The registered identity of the platform, so Entra will issue it tokens | No cost |
| Entra security groups | Map the 12 segments to sets of users, which is how per-segment access is enforced later | Included |
| Azure Static Web Apps | Hosts the site and handles the sign-in redirect natively | Free tier is $0. Standard tier is recommended for the SLA and custom domains |

### Phase 2: document storage

| Service | Role in the platform | Licence position |
|---|---|---|
| SharePoint Online | Holds the actual document files. Becomes the source of truth, replacing the placeholder in the viewer | Included in existing TAQA M365 |
| Microsoft Graph API | The interface the platform uses to read document metadata and files from SharePoint | No cost |
| SharePoint metadata columns | Segment, document type, revision, owner and review date, so the platform's filters read live data rather than a static file | Included |
| Microsoft Search | Optional. Can back the cross-segment search with a real index instead of the current fixed list | Included |

### Phase 3: workflow

| Service | Role in the platform | Licence position |
|---|---|---|
| Power Automate | Runs the document upload and approval flow, and the support ticket flow. Turns the two forms that currently do nothing into working processes | Included in M365. Premium connectors would need review, but this design does not require them |
| Microsoft Lists or SharePoint lists | Holds support tickets and the approval queue | Included |
| Exchange Online | Sends the notification emails the flows produce | Included |

### Phase 4: analytics, notifications and protection

| Service | Role in the platform | Licence position |
|---|---|---|
| Application Insights | Real usage analytics, replacing the per-browser counters | Consumption based, minimal at this volume |
| Microsoft Purview | Sensitivity labels, data loss prevention and retention on the documents | Included in existing TAQA M365 |
| Microsoft Defender for Cloud Apps or Defender for Storage | Malware scanning on uploaded files. This is the control that makes the upload path safe | Subject to TAQA's existing Defender coverage |
| Azure Key Vault | Optional. Holds the Entra client secret if D&T prefers it over Static Web Apps configuration | Minimal |

### Phase 5: operations

| Service | Role in the platform | Licence position |
|---|---|---|
| Azure Monitor | Uptime and availability monitoring | Consumption based |
| Microsoft Sentinel | Security logging and alerting, if TAQA routes application logs there | Per TAQA's existing arrangement |
| Azure DevOps or GitHub Enterprise | Source control and the deployment pipeline under TAQA governance | Per TAQA's existing arrangement |

### What is not needed

No virtual machines. No App Service. No SQL or Cosmos database. No storage account. No Application Gateway. No API Management. No container registry.

If a design or a quote comes back including any of those, the scope has been misread. This is a static site reading from SharePoint.

---

## 3. Target architecture

The finished state, in one paragraph. A TAQA employee opens the Hub's address. Azure Static Web Apps sees no valid session and redirects them to Microsoft Entra ID. They sign in with their normal TAQA account, with whatever MFA and conditional access policies TAQA already enforces. Entra returns them to the Hub with a token. The Hub reads their name, email and group membership, and uses the group membership to decide which segments they may see. When they open a document, the Hub calls Microsoft Graph to fetch it from SharePoint, and SharePoint's own permissions apply as a second check. When they upload a document, it lands in SharePoint, Defender scans it, and Power Automate routes it to the segment owner for approval.

At no point does the platform hold credentials, store documents itself, or call anything outside the TAQA tenant.

### Trust boundaries

| Boundary | What crosses it | Control |
|---|---|---|
| Browser to Azure Static Web Apps | Page requests, authenticated session cookie | HTTPS, HSTS, Entra session |
| Static Web Apps to Entra ID | Authentication redirect and token exchange | Managed natively by the platform. The client secret is held in configuration, never in code |
| Browser to Microsoft Graph | Document metadata and file requests, carrying the user's own token | Delegated permissions, so a user can only reach what they could reach in SharePoint directly |
| Power Automate to SharePoint | Approval actions and file moves | Service account or managed identity, per D&T standard |

Delegated permissions matter here. The platform never holds elevated rights of its own. It acts as the signed-in user, so SharePoint's permission model remains the single source of truth for who can see what.

---

## 4. Prerequisites

### Required to host it

| # | What | Notes |
|---|---|---|
| 1 | Resource group in the TAQA tenant | With a cost centre assigned |
| 2 | Azure Static Web App resource | Standard tier recommended, needed for the SLA and custom domains. Free tier works for a pilot |
| 3 | Deployment token stored as a repository secret | Azure issues this when the resource is created |
| 4 | Repository under the TAQA organisation | GitHub Enterprise or Azure DevOps, D&T's choice |
| 5 | A URL | Azure-generated address, or a TAQA custom domain |

### Required for sign-in

| # | What | Notes |
|---|---|---|
| 6 | Entra ID App Registration | The main blocker. Nothing about login can start without it |
| 7 | Client ID and Tenant ID | Issued by the App Registration |
| 8 | Client secret in Static Web App configuration | Never in code. Key Vault is an alternative |
| 9 | Redirect URI registered | `https://<final-url>/.auth/login/aad/callback` |
| 10 | Graph permission `User.Read` with admin consent | The minimum for sign-in |

### Required for documents

| # | What | Notes |
|---|---|---|
| 11 | SharePoint site with a library structure for the 12 segments | Metadata columns agreed first |
| 12 | Graph permissions `Sites.Read.All` and `Files.Read.All` with admin consent | Read only. Write scopes are added at Phase 3, not before |
| 13 | A permission model per segment | Decided with the segment owners |

---

## 5. Migration steps

Six steps. Steps 1 to 4 complete the move. Steps 5 and 6 add sign-in.

### Step 1: take the code

The repository transfers into the TAQA organisation, or D&T forks it, whichever matches policy. Full commit history comes across intact, which preserves the audit trail from the Secure SDLC review.

D&T receives the repository, this plan, the functional description, the SDLC assessment and the cybersecurity review pack.

### Step 2: create the Azure resource

Create the Static Web App in the TAQA resource group and link it to the repository. Azure generates the deployment workflow automatically.

One setting causes most first-time failures, because there is no build step:

```
app_location:    "/"
api_location:    ""
output_location: ""     <-- must be EMPTY
```

If `output_location` is set to `dist` or `build`, the deployment fails looking for a folder that does not exist. There is no build output. The source is the site.

### Step 3: deploy and verify

Push to `main` and the site deploys in about two minutes.

Check five things:

1. The home page loads with the TAQA typeface, not a fallback
2. Navigation between pages works
3. Search returns results
4. With the network switched off, the site still loads
5. The browser console shows no errors and no requests to any outside host

`staticwebapp.config.json` is already in the repository and handles routing, font MIME types, caching and the security headers. No configuration is needed.

### Step 4: lock the code down

Enable branch protection on `main`: no direct pushes, pull request plus one approval required. Nominate the D&T technical reviewer as approver.

This closes the code review control from the Secure SDLC assessment and is the point at which the platform comes formally under D&T governance.

At this stage the migration is complete. The site runs on TAQA Azure, under TAQA source control, with a review gate.

### Step 5: add Entra ID sign-in

Create the App Registration, store the client secret in the Static Web App configuration, then add this to `staticwebapp.config.json`:

```json
"auth": {
  "identityProviders": {
    "azureActiveDirectory": {
      "registration": {
        "openIdIssuer": "https://login.microsoftonline.com/<TENANT_ID>/v2.0",
        "clientIdSettingName": "AAD_CLIENT_ID",
        "clientSecretSettingName": "AAD_CLIENT_SECRET"
      }
    }
  }
},
"routes": [
  { "route": "/*", "allowedRoles": ["authenticated"] }
]
```

Sequence matters. Add this after the App Registration exists. Applying it first locks everyone out of a site that has no way to let them back in.

Azure Static Web Apps handles the sign-in flow natively, so no authentication code needs writing. The signed-in user's details become available to the pages at `/.auth/me`. The platform already contains the placeholder that reads this, so wiring it up is small.

### Step 6: decide who gets in

Two options, to be decided with the business.

Open to all TAQA staff means anyone with a TAQA account can sign in and see everything. It is the simplest to run and the fastest to launch.

Restricted by segment means Entra security groups control which segments each person sees. It needs a decision per segment from the owners, and ongoing group administration as people move roles.

My recommendation is open to all staff at launch. The content is internal reference material, and per-segment restriction can be added afterwards once real usage shows whether it is needed. Starting restricted means 12 permission decisions before anyone can use the platform.

---

## 6. Phases after the migration

The migration itself ends at step 6. These are the phases that turn the platform into a full document system.

| Phase | What it delivers | Main services | Indicative effort |
|---|---|---|---|
| 1. Identity | TAQA sign-in on a TAQA-hosted site | Entra ID, Static Web Apps | 2 to 3 days after approvals |
| 2. Documents | Real files in the viewer, live metadata driving the lists and search | SharePoint, Graph | 8 to 13 days |
| 3. Workflow | Upload and support forms actually work, with approval routing | Power Automate, Lists, Exchange | 8 to 13 days |
| 4. Analytics and protection | Real usage figures, shared bookmarks, sensitivity labels, malware scanning | Application Insights, Purview, Defender | 6 to 10 days |
| 5. Operations | Monitoring, support model, penetration test, rollout | Azure Monitor, Sentinel | Per D&T |

Effort figures are our estimate to anchor discussion. D&T's own sizing governs.

---

## 7. Security and compliance during migration

| Item | Position |
|---|---|
| Data residency | The Azure region must satisfy TAQA's requirements. Worth confirming against NCA Cloud Cybersecurity Controls |
| Secrets | The Entra client secret lives in Static Web Apps configuration or Key Vault. Never in the repository. No secrets exist in the code today, verified across every commit |
| Least privilege | Graph permissions start read only. Write scopes are added at Phase 3 and not before |
| Public repository | The repository is public today because GitHub requires it for the free preview link. It should be made private once TAQA hosting is live |
| Offline caching | The platform caches pages on the device for offline reading. Before real documents are loaded, a decision is needed on whether caching operational documents onto personal devices is acceptable |
| Penetration testing | Should follow Phase 1 and Phase 2. Testing the current static site would examine a file server rather than the system that will go live |
| Existing findings | Four issues were found and closed during the security review. Details are in the Secure SDLC assessment and the cybersecurity review pack |

---

## 8. Current status: three deployment targets, two of them live

The repository currently deploys to three targets. Two are live and serving the current build.

| Target | State | Notes |
|---|---|---|
| Azure Static Web Apps `agreeable-river-0ab0a3310` | Live | Serving the current build |
| GitHub Pages | Live | Public, free tier, serving the current build |
| Azure Static Web Apps `gray-mud-003cdea10` | Dormant, returns 404 | The free-trial subscription behind it expired and now shows as Disabled |

Two points follow from this.

First, one Azure deployment is working, so the platform is not offline. That is the URL to use for any demonstration.

Second, three deployment targets is two too many. Each live copy is a separate public address serving the same content, and each carries its own deployment token in the repository's secrets. Part of the handover should be consolidating to a single TAQA-owned deployment and retiring the others, including revoking the tokens that publish to them.

The `gray-mud` subscription is a free trial inside the TAQA directory (`taqa.com.sa`) whose credit has expired. Whether it is revived or abandoned is a decision for D&T. The Static Web Apps Free tier carries no licence or hosting cost either way. What the platform needs is a TAQA-owned subscription to sit under, with one deployment target rather than three.

---

## 9. What we need from D&T

1. Confirm GitHub Enterprise or Azure DevOps for the repository
2. Confirm Standard or Free tier for the Static Web App
3. Confirm the URL: Azure default or a TAQA custom domain
4. Name the technical reviewer, so branch protection becomes meaningful
5. Name the IT coordinator to co-own the integration phases
6. Start the App Registration request. It has the longest lead time and blocks everything else

---

## 10. Timeline

| Stage | Effort | Waiting on |
|---|---|---|
| Steps 1 to 4, running on TAQA Azure | 1 to 2 days | Resource group and repository decision |
| Steps 5 and 6, Entra ID sign-in live | 2 to 3 days | App Registration approval |
| Phase 2 onward | See section 6 | Phase 1 completion and business decisions |

The engineering work is small. The waiting is on approvals.

---

Mohammed Al-Jahdali. mohammed.jahdali@tq.com. +966 54 773 3744
Happy to walk through the codebase or the architecture whenever suits you.
