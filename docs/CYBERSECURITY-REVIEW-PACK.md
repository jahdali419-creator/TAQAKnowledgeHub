# TAQA Knowledge Hub: cybersecurity review pack

Prepared by Mohammed Al-Jahdali, TAQA Learning Center, for TAQA Cybersecurity
4 August 2026. Assessed commit: `main` @ 65248c8
Classification: Internal Use

This pack answers the questions raised in the review meeting. It covers the technologies in use, third-party components, the security controls in place, the risks that remain open, and a full inventory of every interactive control in the application with what each one does.

Everything here was verified against the running code rather than from documentation or memory. Where a claim was tested, the test is stated so it can be repeated.

---

## 1. The single most important fact

The application makes no network calls of any kind.

A search across all 42 site files for `fetch()`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon` and HTML form `action` attributes returns nothing. There is no code path that transmits data anywhere.

The only network activity is the service worker retrieving the site's own files from its own origin so that pages work offline.

This was confirmed a second way. All eleven pages were loaded in an instrumented browser with every network request recorded, and no request reached any host other than the site's own origin.

Everything in section 6 follows from this. No button in this application sends data anywhere, because there is nowhere for it to send data to.

---

## 2. Technology inventory

### What the application is built from

| Component | Version or detail | Purpose | Source |
|---|---|---|---|
| HTML, CSS, JavaScript | No framework | The entire application | Written in house |
| `qrcode.js` | 1.4.4, MIT licence | Generates QR codes inside the browser | Kazuhiko Arase, vendored into the repository |
| Urbanist typeface | Latin subset, woff2 | Body and heading text | SIL Open Font License, self-hosted |
| Inter typeface | Latin subset, woff2 | Body text | SIL Open Font License, self-hosted |
| Bw Gradual | OTF | TAQA corporate typeface | TAQA brand assets, self-hosted |

There is no `package.json`, no `node_modules` and no package manager. The application has no dependency tree, so there is no transitive dependency risk and nothing to patch for CVEs.

### Platform and hosting

| Layer | What is used | Notes |
|---|---|---|
| Source control | GitHub | Currently a personal repository, to be transferred to TAQA |
| CI/CD | GitHub Actions | Automatic deploy on merge to `main` |
| Hosting, live copy 1 | GitHub Pages | Public, free tier, serving the current build |
| Hosting, live copy 2 | Azure Static Web Apps `agreeable-river-0ab0a3310` | Public, serving the current build |
| Hosting, dormant | Azure Static Web Apps `gray-mud-003cdea10` | Returns 404. The free-trial subscription behind it has expired |
| Runtime | The visitor's browser | No server-side execution of any kind |

### Browser APIs used

These are the only browser capabilities the application touches. None of them requires a permission prompt, and none accesses the camera, microphone, location or contacts.

| API | Where it is used | What it does |
|---|---|---|
| `localStorage` | Throughout | Stores preferences on the visitor's own device. Contents listed in section 4 |
| `sessionStorage` | `fixes.js` | Reads a key named `taqa_user` if present. This is a placeholder for the future Entra ID integration and nothing currently writes to it |
| Service Worker | `service-worker.js` | Caches the site's own pages so they open offline |
| `navigator.clipboard` | Segment and QR views | Copies a page link when the user clicks Copy |
| `navigator.onLine` | Shared script | Shows an offline banner when the connection drops |
| `window.print` | Document viewer | Opens the browser's own print dialog |
| File input | Upload and support pages | Lets the user select a file. The file is never read, stored or transmitted |

The application does not use cookies, IndexedDB, WebRTC, geolocation, camera access, push notifications or Web Bluetooth.

---

## 3. Third-party components and services

### External services: none

The application previously called four external services. All were removed on 3 August 2026 and the removal was verified by network recording.

| Service that was removed | What it received | Removed on | Replaced by |
|---|---|---|---|
| Google Apps Script endpoint | Names and work email addresses submitted through a sign-up form | 3 August 2026 | The form is deleted. Entra ID sign-in will provide identity |
| Google Analytics and Tag Manager | Page view telemetry | 3 August 2026 | Nothing. A TAQA-approved analytics tool is to be selected |
| `api.qrserver.com` | Document URLs, sent to generate QR images | 3 August 2026 | QR codes are generated inside the browser using the vendored MIT library |
| Google Fonts CDN | An asset request on every page load | 3 August 2026 | Fonts are self-hosted at 398 KB |

The Google Apps Script endpoint is worth flagging explicitly. Between the platform going live and 3 August 2026, any user who completed the sign-up form had their name and work email address transmitted to a Google-hosted endpoint outside the TAQA tenant. This may have implications under PDPL for cross-border transfer of personal data, and Cybersecurity should decide whether it needs to go any further. The code path is now removed.

### Third-party code in the repository

One file: `qrcode.js`, MIT licensed, roughly 2,300 lines, added specifically so that QR generation no longer required calling an outside service. It performs mathematical encoding only, and contains no network code.

### Supply chain position

With no package manager and one vendored library, the supply chain surface is close to zero. This is the strongest part of the platform's security posture and it is a deliberate design choice rather than an accident.

---

## 4. Data handling

### What data the application holds

Nothing on any server, because there is no server. Everything below lives in the individual visitor's own browser and never leaves their device.

| Storage key | Contents | Sensitivity |
|---|---|---|
| `taqa-theme` | Light or dark preference | None |
| `taqa-tour-done` | Whether the introductory tour has been dismissed | None |
| `taqa-install-dismissed` | Whether the install prompt has been dismissed | None |
| `taqa-bell-count` | A notification badge number | None |
| `taqa-last-sync` | A timestamp | None |
| `taqa-bookmarks` | Titles of bookmarked documents | Low |
| `taqa-pins` | Pinned documents: title, type, segment and link | Low |
| `taqa-recent` | Recently viewed document and segment titles | Low |
| `taqa-read-docs` | Which documents have been opened | Low |
| `taqa-doc-hashes` | File fingerprints used for duplicate detection on the upload page | Low |
| `taqa-analytics` | Up to 300 usage events: event type, page or document key, timestamp | Low |
| `taqa-errors` | Up to 50 script errors: message, source file, line, column, page path, timestamp | Low |
| `taqa_glossary_custom` | Glossary terms the visitor has added themselves | Low |
| `taqa_delegation` | The name of the person work is being delegated to | **Personal data** |
| `taqa-draft-upload` | Every field typed on the upload form, saved as the visitor types | **See below** |
| `taqa-draft-ticket` | Every field typed on the support ticket form, saved as the visitor types | **See below** |
| `sessionStorage: taqa_user` | Read only. A placeholder for the future Entra ID integration. Nothing currently writes to it | None |

### The two draft keys need stating plainly

The upload and support ticket pages save every text field, dropdown and text area to the browser as the visitor types, so that a half-completed form survives a refresh. The draft is deleted when the form is submitted, but persists until then.

On the support ticket page those fields include the reporter's work email, their employee identifier, the equipment involved, and **the well, rig or location** the issue relates to. On the upload page they include the document title, reference identifier, owner and summary.

So the platform does hold personal data and operational detail, on the visitor's own device, in the ordinary course of use. It is never transmitted, but it is retained locally and survives closing the browser. This should be considered when the offline caching decision in R-03 is made, and it is a reason to prefer managed devices for the support ticket workflow.

No credentials, no session tokens and no document files are stored. Personal data and operational detail can be present in the two draft keys described above. Clearing the browser cache removes all of it, and nothing is shared between users or devices.

### What data the application does not have

There are no real documents in the platform. Document titles are reference metadata held in JavaScript files, and the viewer displays a placeholder rather than an actual file. No operational TAQA document has been loaded into the system.

---

## 5. Security controls in place

| Control | Status | Evidence |
|---|---|---|
| Content-Security-Policy | In place | Enforced on every page, restricted to `'self'`. Any attempt to contact a third party is blocked by the browser itself rather than merely being absent from the source |
| Transport security | In place | HTTPS only. `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` and `Referrer-Policy` are configured in `staticwebapp.config.json` for the Azure deployment |
| Output encoding | In place | All user-controlled values are HTML-escaped before display. Added 3 August 2026 after a confirmed cross-site scripting finding, covered in section 7 |
| File type restriction | In place | A code-level allow-list, not the HTML `accept` attribute. `.exe` and `.msi` are refused, including double extensions such as `trick.pdf.exe`. Verified through the drag-and-drop bypass path |
| Secret management | In place for current scope | No secrets exist in the platform. Every commit in the repository history was scanned and no hardcoded credentials were found. Deployment tokens are held in GitHub's encrypted secret store and referenced by name only |
| Dependency management | In place | No package manager and no dependency tree |
| Change traceability | In place | Every change is a commit and every deployment is a logged GitHub Actions run tied to that commit |
| Authentication | Not in place | No login exists. Requires the Azure App Registration |
| Authorisation | Not in place | No roles or permissions exist. Requires authentication first |
| Server-side logging | Not possible yet | There is no server to log on |
| Malware scanning | Not possible yet | No file is stored or transmitted, so there is nothing to scan |
| Branch protection | Not in place | `main` is unprotected. The GitHub API reports `"protected": false`. Requires a nominated technical reviewer |

---

## 6. Interactive control inventory

Every interactive element in the application, and what happens when it is used.

The three columns that matter for review are the last three. **Network** is whether the control sends data anywhere. **Storage** is whether it writes to the browser's local storage. **Data** is whether it touches anything sensitive.

Across all 126 buttons and 151 click handlers in the application, the Network column reads "None" without exception.

### Controls that appear on every page

| Control | What happens when clicked | Network | Storage | Data |
|---|---|---|---|---|
| Dark mode toggle | Switches the colour theme | None | Writes `taqa-theme` | None |
| Navigation links | Moves to another page in the same site | None | None | None |
| Back to top | Scrolls the page upward | None | None | None |
| Notification bell | Scrolls to a list already on the page | None | None | None |
| Search box in the header | Filters items already loaded in the browser | None | None | None |

### Home page

| Control | What happens when clicked | Network | Storage | Data |
|---|---|---|---|---|
| Segment cards, 12 of them | Opens that segment's page | None | None | None |
| Search button | Filters the list held in the browser. No query is sent anywhere | None | None | Search text stays in the page |
| Accordion sections | Expands or collapses a panel | None | None | None |
| Guided tour, Next and Skip | Advances or dismisses a five-step introduction | None | Writes `taqa-tour-done` | None |

### Segment page

| Control | What happens when clicked | Network | Storage | Data |
|---|---|---|---|---|
| Document card | Opens a preview panel showing the document's title and type | None | Writes `taqa-recent` and `taqa-read-docs` | Title only |
| Bookmark star | Adds or removes the title from a local list | None | Writes `taqa-bookmarks` | Title only |
| QR code button | Generates a QR image inside the browser encoding the page link | None | None | The page URL |
| Copy link | Copies the current page address to the clipboard | None | None | The page URL |
| Sort controls | Reorders the list already displayed | None | None | None |
| Pagination | Shows a different slice of the same list | None | None | None |

### Document viewer

| Control | What happens when clicked | Network | Storage | Data |
|---|---|---|---|---|
| Request Access | Displays an on-screen message. No request is sent to anyone | None | None | None |
| Bookmark | Adds or removes the title from a local list | None | Writes `taqa-bookmarks` | Title only |
| Print | Opens the browser's own print dialog | None | None | None |
| Pin, Quick Reference, Revision History, Sunlight mode | Show, hide or restyle panels already on the page | None | None | None |

### Upload page

| Control | What happens when clicked | Network | Storage | Data |
|---|---|---|---|---|
| Browse Files, or drag and drop | Opens the file picker and lists the chosen filenames on screen. The file contents are never read, stored or transmitted | None | None | Filename displayed only |
| A file with a blocked extension | Refused, with an on-screen message naming the permitted types. `.exe` and `.msi` are rejected including double extensions | None | None | None |
| Remove file | Removes an entry from the on-screen list | None | None | None |
| Submit | Shows a confirmation with a randomly generated reference number. **Nothing is uploaded, stored or sent.** The page is an interface awaiting the SharePoint integration | None | None | None |

### Support ticket page

| Control | What happens when clicked | Network | Storage | Data |
|---|---|---|---|---|
| Attach photo | Opens the file picker for images. The image is displayed in the page and never leaves the browser. No camera permission is requested | None | None | Image held in page memory only |
| Annotation tools: rectangle, circle, arrow, freehand, colour, width, undo, clear | Draw on the attached image inside the browser | None | None | None |
| Priority selection | Highlights the chosen priority | None | None | None |
| Submit | Shows a confirmation with a randomly generated ticket number. **No ticket is created and nothing is sent.** The page awaits the Power Automate integration | None | None | None |

### Dashboard

| Control | What happens when clicked | Network | Storage | Data |
|---|---|---|---|---|
| Approve or Reject a document | Updates the on-screen list only. No approval is recorded anywhere and nothing is sent | None | None | None |
| Add Contributor | Adds a name to the on-screen list for the current session only. Lost on refresh | None | None | Name displayed only |

### Analytics page

| Control | What happens when clicked | Network | Storage | Data |
|---|---|---|---|---|
| Export CSV | Builds a file in the browser from the local counters and saves it to the user's own device. Nothing is transmitted | None | Reads `taqa-analytics` | Local counters only |
| Clear analytics | Deletes the local counters | None | Clears `taqa-analytics` | None |

### Glossary and search pages

| Control | What happens when clicked | Network | Storage | Data |
|---|---|---|---|---|
| Search, filter, alphabet and category controls | Filter a list already held in the browser | None | None | None |
| Submit a term | Displays a confirmation. Nothing is saved or sent | None | None | None |
| Ask a question, on the search page | Matches the typed text against a fixed local list and shows results. **There is no AI service behind this and no query leaves the browser** | None | None | Query stays in the page |

### A note on the AI-labelled pages

The pages named "AI Document Search" and "Ask Expert" contain no artificial intelligence and no connection to any language model. They perform keyword matching against a fixed list held in a JavaScript file. No text typed into them is transmitted anywhere.

If an actual AI service is connected in future, that will be a material change requiring its own security review, covering where prompts are sent, whether document content leaves the tenant, retention, and whether data is used for training.

---

## 7. Open risks

Rated for the platform as it exists today, and again for after the SharePoint integration, because several change severity sharply once real documents are stored.

| # | Risk | Today | After integration | Status and treatment |
|---|---|---|---|---|
| R-01 | No authentication. The site is open to anyone with the URL | Medium | Critical | Open. Closed by Entra ID sign-in. Until then the platform must not hold real operational documents. This is the reason none have been loaded |
| R-02 | The repository is public. All code and document titles are readable on the internet | Low | Medium | Open, deliberate and time-boxed. GitHub requires a public repository for the free preview link. To be made private once TAQA hosting is live. No credentials or real documents are exposed |
| R-12 | Form drafts on the upload and support ticket pages save every typed field to the device as the visitor types, including work email, employee identifier and the well, rig or location an issue relates to. The draft is cleared on submission but persists until then, and survives closing the browser | Low | Medium | Open. Identified 4 August 2026. Options are to exclude identifying fields from the draft, shorten its lifetime, or accept it and cover it under the device policy decided for R-03 |
| R-13 | The home page displays fixed headline figures that do not match the data, including a "Registered Users: 1,200" figure on a platform with no user accounts. The other four figures understate documents, segments, alerts and glossary terms | Low | Low | Open. No security impact, but it misrepresents the platform to anyone reviewing it and should be corrected before wider demonstration |
| R-11 | Three deployment targets exist and two are publicly live: GitHub Pages and an Azure Static Web App (`agreeable-river-0ab0a3310`). A third (`gray-mud-003cdea10`) is dormant. Each live copy is a separate public URL serving the same content, and each has its own deployment token held in GitHub secrets | Medium | High | Open. Consolidate to one TAQA-owned deployment at handover and retire the others, including revoking their deployment tokens. Identified 4 August 2026 while verifying the file inventory |
| R-03 | Progressive Web App offline caching. The application installs on phones and caches pages for offline reading. Once real documents are added, TAQA content will be cached on whatever device installed it, including personal devices outside MDM control | Low | High | Open, needs a decision. No policy exists yet on whether offline caching of operational documents on personal devices is acceptable. Recommend deciding this before Phase 2 |
| R-04 | `.zip` archives are accepted for upload and their contents cannot be inspected in the browser. An executable can be placed inside an archive | Low | Medium | Open and accepted. To be mitigated by server-side antivirus through Defender for Storage or SharePoint at Phase 3. Recorded for the exception register |
| R-05 | `script-src` permits `'unsafe-inline'`, which weakens the Content-Security-Policy's ability to contain script injection | Medium | Medium | Open and deferred. Removing it requires relocating every inline script across roughly 13,000 lines. Recommend doing this during the Azure migration rather than as an isolated change |
| R-06 | No branch protection. Changes can reach the live site without review | Medium | High | Open. Requires D&T to nominate a technical reviewer. Protection can be enabled immediately |
| R-07 | Segregation of duties. One person is currently developer, approver and platform owner | Medium | High | Open. Resolved by the technical reviewer and the assigned IT coordinator |
| R-08 | Historical personal data transfer. The removed sign-up form transmitted names and work email addresses to a Google-hosted endpoint outside the TAQA tenant | Medium | n/a | Code path removed 3 August 2026. Cybersecurity to decide whether any PDPL notification obligation arises |
| R-09 | The platform was built outside IT governance, on a personal GitHub account and a personal Azure trial subscription | Medium | High | Being resolved. The handover to D&T transfers the repository, the hosting and the ownership |
| R-10 | No server-side audit trail of who accessed which document | Low | High | Not yet possible, as there is no server. Arrives with SharePoint and Azure logging |

### Findings already closed

| Finding | Severity | Closed |
|---|---|---|
| Cross-site scripting through a filename on the upload page. A file named `<img src=x onerror=alert("XSS")>.pdf` executed script. Confirmed by test rather than inspection | Low today, high after integration | 3 August 2026. All user-controlled values are escaped. Re-tested with the same payload, which now renders as inert text |
| Executable file types accepted for upload | Low today, high after integration | 3 August 2026. Code-level allow-list, verified through the bypass path |
| A function-name collision was silently suppressing upload warnings, so a refused file would have failed with no message to the user | Medium | 3 August 2026 |
| Four external service dependencies | Medium | 3 August 2026. Verified by network recording |

---

## 8. What we are asking Cybersecurity for

1. Confirmation of which framework this platform is assessed against. The Kosli Secure SDLC template has been used for the delivery process, and an OWASP-style application review was run alongside it. We would like to know whether NCA ECC, NCA CCC or any Aramco third-party requirement applies.
2. A decision on R-03, offline caching of operational documents on personal devices. This needs answering before real documents are loaded.
3. A view on R-08, whether the historical personal data transfer requires any notification.
4. Agreement that penetration testing and dynamic scanning are scheduled after Entra ID and SharePoint are in place. Testing the current platform would examine a static file server rather than the system that will go live.
5. A named security contact for the integration phases.

---

## 9. Summary

The application is a front end with no server, no backend, no database and no network calls. Every button either changes what is displayed on screen or writes a preference to the visitor's own browser. Nothing transmits data, because there is no code path capable of doing so.

There are no third-party services. All four that previously existed were removed and the removal was verified. One MIT-licensed library is vendored into the repository, and there is no package manager and no dependency tree.

Four findings were identified and closed during this review, including a confirmed cross-site scripting vulnerability. Thirteen risks remain open. Six close through the Azure and Entra ID integration, four need a decision from Cybersecurity or D&T, one is a repository setting that can be changed today, one is the consolidation of three deployment targets down to a single TAQA-owned one, and one is a display error on the home page with no security impact.

The controls that are missing are missing because the platform has no identity provider, no server and no stored data. They become implementable at integration, not before, and this assessment should be repeated once that work is complete.

---

Mohammed Al-Jahdali. mohammed.jahdali@tq.com. +966 54 773 3744
