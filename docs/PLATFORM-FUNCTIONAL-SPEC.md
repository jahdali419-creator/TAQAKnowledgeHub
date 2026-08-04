# What the platform does

TAQA Knowledge Hub, functional description
Prepared by Mohammed Al-Jahdali, TAQA Learning Center
4 August 2026

---

## 1. Summary

The TAQA Knowledge Hub is an internal reference platform for TAQA Well Solutions. It gives field and office staff one place to find the procedures, manuals, policies, technical alerts and lessons learned that belong to their part of the business.

The content is organised into 12 operational segments. Within each segment, documents are grouped into six categories, and the platform currently indexes 546 document records across all segments.

It runs in a web browser, works on phones and tablets, and continues to work without a network connection once a page has been opened.

### What is real today, and what is not

This distinction runs through the whole document, so it is worth stating at the start.

The navigation, search, filtering, bookmarking, glossary and offline behaviour are all fully working. What is not yet connected is anything that needs a server: there is no login, the document viewer shows a placeholder instead of the real file, and the upload and support ticket forms display a confirmation without sending anything anywhere.

Those parts are built and waiting for the Microsoft 365 integration described in the migration plan.

---

## 2. Who uses it and how

| Audience | Typical use |
|---|---|
| Field crews | Look up a procedure or technical alert on a phone, often with poor connectivity |
| Office and technical staff | Search across segments for a manual, policy or lesson learned |
| Segment owners | Review what is published for their segment and what is awaiting approval |
| Learning Center | Maintain content and structure |

There are no user accounts today, so the platform does not distinguish between these groups. Everyone sees the same content. Role separation arrives with Entra ID sign-in.

---

## 3. Structure of the content

### The 12 segments

Cementing, Coiled Tubing, Cybersecurity, Drilling, Fracturing, Human Resources, Inspection Services, QHSE, TWS Maintenance, Well Safety, Well Testing, and Wireline.

### The six document categories

| Category | What it holds | Records indexed |
|---|---|---|
| SOPs | Standard operating procedures | 170 |
| Manuals | Equipment and system manuals | 119 |
| Policies | Governing policies and requirements | 121 |
| Technical alerts | Time-sensitive safety and equipment notices | 37 |
| Lessons learned | Incident and near-miss learning | 73 |
| Software | Tools and systems used by the segment | 26 |

Total: 546 records.

These are document records, meaning title, type, segment and reference identifier. The document files themselves are not yet held in the platform.

---

## 4. Page by page

### Home

The landing page. It carries a hero panel with a platform-wide search box, a live count of documents, segments and active technical alerts, and a grid of the 12 segment cards. Each card shows the segment name, its discipline label, how many documents it holds and how many technical alerts are open.

Below the grid are shortcuts to the glossary, the document library, the upload page and the expert request page. A five-step guided tour runs on a visitor's first arrival and can be dismissed. Once dismissed it does not return.

A "continue reading" panel appears if the visitor has opened a document before, taking them back to it.

### Segment page

Opened by selecting a segment card. Everything for one segment in one place.

Documents are presented in six tabs matching the categories above. Within each tab the visitor can sort alphabetically or leave the default order, and page through longer lists. Selecting a document opens a preview panel with its title, type and reference identifier.

Each document can be bookmarked, and each has a QR code button that generates a scannable code for the page address. The QR code is produced inside the browser. A copy-link button puts the page address on the clipboard, which is how a supervisor would share a specific segment with a crew.

The page also shows recently visited segments, so returning to a frequently used area takes one click.

### Document viewer

Opened by selecting a document. It shows the document's title, segment, type and reference identifier, along with a revision history where one exists.

The document body itself is a placeholder. The real file is not in the platform yet, and the page says so rather than pretending otherwise. A "request access" button is present for when the SharePoint integration is connected; today it displays an on-screen message only.

Supporting functions on this page: bookmark, print, a pinnable quick-reference panel, a QR code for the document, and a sunlight mode that raises contrast for reading on a screen outdoors. There is also a reading-progress bar down the side.

### Document library

A single table of all published documents across every segment. It can be filtered by document type and sorted by document name, type, date or owner. A search box narrows the list as the visitor types. This is the view for someone who knows what they are looking for but not which segment it belongs to.

### Search

A cross-segment search over all 502 indexed records. Results show the document title, its segment and its type, and lead through to the viewer.

The page is labelled "AI Document Search" and offers example prompts, but it performs keyword matching against a fixed list held in the browser. There is no artificial intelligence behind it and no connection to any language model. Nothing typed into it is transmitted anywhere.

### Field glossary

197 oilfield abbreviations and terms, from BOP and CT through to WOB. Terms can be searched, filtered by category, or browsed alphabetically. Selecting a term expands its definition.

A form lets staff propose a new term. It currently shows a confirmation without saving or sending anything.

### Upload

For submitting a document into the review process.

The visitor selects or drags in a file, chooses the segment and document type, and states whether the document is new or a revision of an existing one. The page generates a reference identifier automatically from the segment and document type, then checks it against existing identifiers and warns if it is already in use or looks close to one already present.

It also fingerprints the selected file and warns if the same file appears to have been uploaded before.

File types are restricted to documents and archives. Executables are refused, and the visitor is told why.

The submit button shows a confirmation with a reference number. **No file is uploaded, stored or transmitted.** The page is the interface for a process that arrives with the SharePoint and Power Automate integration.

### Ask an expert

For raising a question or a problem to the segment's technical authority.

The visitor describes the issue, sets a priority from critical to low, and can attach photographs. Attached photographs can be annotated in the browser with rectangles, circles, arrows and freehand drawing in a choice of colours and line weights, with undo and clear. This is aimed at field use, where marking up a photograph of equipment is faster than describing it.

Submitting shows a confirmation with a ticket number. **No ticket is created and nothing is sent.** The page awaits the Power Automate integration.

### Segment control panel

A management view for segment owners. It lists documents awaiting approval with approve and reject controls, shows contributors for the segment, and displays document counts and activity.

Approving or rejecting changes only what is displayed on screen. Nothing is recorded and no notification is sent. Contributors added here persist for the current browser session only.

### Analytics

Usage figures collected in the visitor's own browser: pages viewed, documents opened, searches run. The figures can be exported to a CSV file saved to the visitor's own device, or cleared.

Because the counters are per-browser, these are not organisation-wide figures. Real usage analytics arrive with the integration.

### Offline page

Shown when the visitor navigates to a page that has not been cached and there is no connection. It explains that previously opened documents remain available.

---

## 5. Functions that work across the whole platform

| Function | What it does |
|---|---|
| Offline reading | Pages the visitor has opened stay available without a network connection. The platform installs to a phone home screen like an app |
| Language | English only. There is no Arabic version and no right-to-left layout. Every page is marked `lang="en"` |
| Dark mode | Switches the colour theme. The choice is remembered on that device |
| Bookmarks | A personal list of saved documents, held on that device |
| Reading history | Recently viewed documents and read progress, held on that device |
| Search | Narrows lists as the visitor types, on every list-bearing page |
| QR codes | Generated in the browser for any segment or document, so a printed procedure can carry a link back to the current version |
| Mobile layout | Every page reflows for phone screens, with touch targets sized for gloved hands |
| Sunlight mode | Raises contrast in the document viewer for outdoor reading |
| Print | The document viewer and segment page produce a clean printed layout with the navigation removed. Other pages print as they appear |

---

## 6. What the platform does not do

Stated plainly, because the gaps matter as much as the features.

| Not available | Why | Arrives with |
|---|---|---|
| Login | No identity provider is connected | Entra ID, Phase 1 |
| Real document files | No document storage is connected. The viewer shows a placeholder | SharePoint, Phase 2 |
| Working upload | The form is an interface with no destination | SharePoint and Power Automate, Phase 3 |
| Working support tickets | The form is an interface with no destination | Power Automate, Phase 3 |
| Approval workflow | Approvals change the screen only | Power Automate, Phase 3 |
| Shared bookmarks and history | Everything is stored per browser, so it does not follow the person between devices | Phase 4 |
| Organisation-wide analytics | Counters are per browser | Phase 4 |
| Access control by segment | No accounts exist, so no permissions exist | Phase 1 and 2 |
| Notifications | The bell is a display element only | Phase 4 |

---

## 7. How it is built

A static web application: HTML, CSS and JavaScript only. There is no server, no database and no backend. Every function described above runs inside the visitor's own browser.

The platform makes no network calls. There is no code in it capable of transmitting data. This was verified by searching all 42 site files for network functions and by loading every page with all traffic recorded.

It is 42 files and about 2.2 MB in total, with no build step and no package manager.

---

## 8. Why it was built this way

The platform was built to prove the concept and the content model before asking for infrastructure. Building the front end first meant the 12 segments, the six document categories and the 546 records could be reviewed by the business without waiting for provisioning, licences or a development environment.

That decision is why the integration work is now well defined. The interface exists, the structure is agreed, and what remains is connecting it to Microsoft 365 services TAQA already owns.

---

Mohammed Al-Jahdali. mohammed.jahdali@tq.com. +966 54 773 3744
