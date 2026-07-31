# TAQA Knowledge Hub — Azure Migration Pack

**For:** Rafa Al Zahrani — D&T, Azure migration owner
**From:** Mohammed Al-Jahdali — TAQA Learning Center
**Classification:** Internal Use

Everything needed to move the Knowledge Hub onto TAQA Azure. Written to be read
in one sitting — Section 1 is what it is, Section 2 is what you need from Azure,
Section 3 is the step-by-step move.

---

## 1. What the website actually is

**It is a folder of files. That is the whole thing.**

31 files, 1.9 MB. No database. No server. No backend. No `npm install`, no build
step, no compiling. The files that sit in the repository are exactly the files
that get served to the browser.

This is the single most important fact for planning: **there is nothing to
migrate except static files.** No data to export, no server to rebuild, no
dependencies to resolve.

### What's in the folder

| Type | Files | What they are |
|---|---|---|
| Pages | 11 `.html` | Home, dashboard, segment view, document library, document viewer, search, analytics, glossary, upload, support ticket, offline page |
| Scripts | 4 `.js` | Shared navigation and UI, plus two data files holding document titles, and the service worker |
| Fonts | 2 `.otf` | TAQA corporate typeface (Bw Gradual) — self-hosted, 144 KB |
| Images | 5 + icons | Hero images and app icons, 868 KB |
| Config | `manifest.json`, `staticwebapp.config.json` | App install settings and Azure routing rules |

### What it does today

Staff open it and browse documents organised by the 12 TAQA segments — Coiled
Tubing, Drilling, QHSE, Cybersecurity, and so on. They can search across
segments, read a glossary, bookmark items, and raise a support ticket. It works
offline and installs on a phone like an app.

### What it does *not* do today — and this is the honest part

- **No login.** The site is open to anyone with the link.
- **No real documents.** Document titles are text typed into a JavaScript file.
  The viewer shows a placeholder image, not the actual PDF.
- **Nothing is saved centrally.** Bookmarks and notifications are stored in the
  individual browser. Not shared, not backed up.

So: the front of the platform is complete and proven. The Azure move is what
turns it into a real, governed TAQA system.

---

## 2. What you need from Azure

Deliberately small. This is a static site, so the footprint is minimal.

### Required now — to host it

| # | What | Notes |
|---|---|---|
| 1 | **Resource group** in the TAQA tenant | With cost centre assigned |
| 2 | **Azure Static Web App** resource | Standard tier — needed for Entra ID auth and custom domains. Free tier works for a pilot but has no SLA |
| 3 | **Deployment token** stored as a repository secret | Azure issues this when the resource is created |
| 4 | **Repository under the TAQA organisation** | GitHub Enterprise or Azure DevOps — your call. Code moves with full history |
| 5 | **A URL** | Either the Azure-generated address, or a TAQA custom domain — your preference |

### Required for login — Phase 1

| # | What | Notes |
|---|---|---|
| 6 | **Entra ID App Registration** | This is the main blocker. Nothing about login can start without it |
| 7 | **Client ID + Tenant ID** | Issued by the App Registration |
| 8 | **Client secret**, stored in the Static Web App settings | Never in the code |
| 9 | **Redirect URI** registered | `https://<your-final-url>/.auth/login/aad/callback` |
| 10 | **Graph permission `User.Read`** with admin consent | Minimum for sign-in. SharePoint scopes come later, in Phase 2 |

### Not needed

No virtual machines. No App Service. No database. No storage account. No
Application Gateway. If a quote comes back including those, the scope has been
misread.

---

## 3. Step-by-step migration

Six steps. Steps 1–4 are the move; steps 5–6 add login.

### Step 1 — Take the code

I transfer the repository into the TAQA organisation, or you fork it — whichever
matches D&T policy. Full commit history comes across intact, which preserves the
audit trail from the Secure SDLC review already completed.

**You get:** the repository, this document, and the handover plan in `docs/`.

### Step 2 — Create the Azure resource

Create the Static Web App in the TAQA resource group and link it to the
repository. Azure generates the deployment workflow automatically.

**Critical setting** — this trips people up, because there's no build step:

```
app_location:    "/"
api_location:    ""
output_location: ""     <-- must be EMPTY
```

If `output_location` is set to `dist` or `build`, the deploy fails looking for a
folder that doesn't exist. There is no build output. The source *is* the site.

### Step 3 — Deploy and verify

Push to `main` and the site deploys in about two minutes.

Check these five things:
- Home page loads with fonts rendering correctly (TAQA typeface, not a fallback)
- Navigation works between pages
- Search returns results
- Arabic toggle switches the layout right-to-left
- The site still loads with the network switched off (offline mode)

`staticwebapp.config.json` is already in the repository and handles routing,
font MIME types, caching, and security headers. No configuration needed from you.

### Step 4 — Lock the code down

Turn on branch protection on `main`: no direct pushes, pull request plus one
approval required. Nominate the D&T technical reviewer as approver.

This satisfies the code-review control from the Kosli audit and is the point at
which the platform is formally under D&T governance.

**At this stage the migration is done.** The site runs on TAQA Azure, under TAQA
source control, with a review gate. Everything below adds login.

### Step 5 — Add Entra ID sign-in

Create the App Registration, store the client secret in the Static Web App
configuration, then add this block to `staticwebapp.config.json`:

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

**Sequence matters:** add this *after* the App Registration exists. Applying it
first locks everyone out of a site that has no way to let them back in.

Azure Static Web Apps handles the sign-in flow natively — no authentication code
needs writing. The logged-in user's name and email become available to the pages
automatically at `/.auth/me`.

### Step 6 — Decide who gets in

Two options, your call with the business:

- **Open to all TAQA staff** — anyone with a TAQA account signs in. Simplest.
- **Restricted by segment** — Entra security groups per segment, users see only
  their own. More setup, more ongoing administration.

My recommendation: open to all staff at launch. The content is internal
reference material, and per-segment restriction can be added later once real
usage shows whether it's actually needed.

---

## 4. Housekeeping before go-live

Three things in the current code send data outside TAQA. They exist because the
site was built as a standalone prototype. I am removing them — flagging so
nothing surprises you in security review.

| What | Where it goes | Fix |
|---|---|---|
| Sign-up form posts name + email | Google Apps Script | Delete it — Entra ID login replaces it entirely |
| Page analytics | Google Analytics | Remove; replace with a D&T-approved tool |
| QR code generation | `api.qrserver.com` | Generate in the browser instead, no external call |
| Google Fonts stylesheet | Google | Already have the fonts locally — just drop the reference |

Also: the site currently deploys to **GitHub Pages** as well as Azure. That
second public copy should be switched off when we move — I'll remove the
workflow at handover.

Timing: I can close all of these before your migration starts, so you inherit
clean code. Just say the word.

---

## 5. What I need from you

1. Confirm **GitHub Enterprise or Azure DevOps** for the repository
2. Confirm **Standard or Free tier** for the Static Web App
3. Confirm the **URL** — Azure default or TAQA custom domain
4. Tell me who the **technical reviewer** is, so I can add them
5. Start the **App Registration** request — it has the longest lead time, so
   it's worth beginning even while the other items are being decided

---

## 6. Realistic timeline

| Stage | Effort | Depends on |
|---|---|---|
| Steps 1–4 — hosted on TAQA Azure | 1–2 days | Resource group + repository decision |
| Step 5–6 — Entra ID login live | 2–3 days | App Registration approval |

The work itself is small. The waiting is on approvals, not engineering.

---

*Mohammed Al-Jahdali · mohammed.jahdali@tq.com · +966 54 773 3744*
*Happy to walk through the codebase whenever suits you.*
