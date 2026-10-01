# TechHub Azure UAT checklist

**Not for now.** Mohammed and IT run this **after** Azure integration, in the UAT environment, with real Entra accounts. Each line passes only if it is observed, not assumed. Record the account used, the document number and the result.

Test accounts needed (one real user each): Employee who is a member of segment **A, Operations** · Employee who is a member of segment **A, Maintenance** · Employee who is a member of segment **B** · two spare employee accounts with no membership (**P** and **Q**) · QMS · Segment Director of area **A** · Segment Director of area **B** · Maintenance Manager of segment **A** · Maintenance Manager of segment **B** · Auditor · a delegate · a glossary SME for category **X** (for example Drilling) · a glossary SME for a different category **Y**.

## 1. Sign-in and identity
| # | Check | Pass |
|---|---|---|
| I1 | Opening TechHub redirects to TAQA Entra sign-in; after sign-in the user's name shows | ☐ |
| I2 | **There is no role switcher** ("View as …", "Preview only") anywhere, on desktop or in the phone menu | ☐ |
| I3 | Each test account gets exactly its mapped role (desk, Master List, Upload visibility match `BUSINESS-RULES.md` §4) | ☐ |
| I4 | Directors and Maintenance Managers see only their mapped area; a Maintenance Manager is mapped to an operational segment | ☐ |
| I5 | Changing a user's Entra group changes their access after re-sign-in, without any browser change | ☐ |
| I6 | Editing `localStorage` in the browser changes nothing a user can do | ☐ |

## 2. Operations journey (area A)
| # | Step | Pass |
|---|---|---|
| O1 | **Employee** files an SOP for area A with a PDF; it shows "Waiting on QMS check" | ☐ |
| O2 | **QMS** sees it on the desk with the real submitter's name and time; Confirm moves it to final approval | ☐ |
| O3 | **Segment Director of A** sees it; Approve publishes it ("Current, OK to use") | ☐ |
| O4 | **Employee (member of A, Operations)** finds it in area A's Operations shelf and Search, not on the Maintenance side; downloads the real file | ☐ |
| O5 | **Auditor** sees it in the Master List; the trail shows submitter, QMS checker and Director **by name** with server times | ☐ |

## 3. Maintenance journey (segment A)
| # | Step | Pass |
|---|---|---|
| M1 | **Employee** files a maintenance SOP (box ticked) and, separately, a **Maintenance Bulletin** for segment A | ☐ |
| M2 | **QMS** confirms both; the message says they go to the Maintenance Manager | ☐ |
| M3 | **Maintenance Manager of A** approves both; they publish on the **Maintenance** side (Bulletins shelf for the bulletin) | ☐ |
| M4 | **Auditor** trail shows the Maintenance Manager as final approver, by name | ☐ |
| M5 | A Maintenance Bulletin **cannot be filed for a corporate function or centre** (Upload and API both refuse) | ☐ |

## 4. Negative checks (the API must refuse, not just the page)
| # | Attempt | Expected | Pass |
|---|---|---|---|
| N1 | Employee calls approve / confirm / reject / withdraw (UI and direct API call) | 403 | ☐ |
| N2 | Segment Director of A approves or withdraws a **maintenance** document of A | 403 | ☐ |
| N3 | Maintenance Manager of A approves or withdraws an **Operations** document of A | 403 | ☐ |
| N4 | Director or Maintenance Manager of **B** acts on A's documents | 403 | ☐ |
| N5 | Auditor files, edits, withdraws, approves or delegates | 403 | ☐ |
| N6 | Approver acts before QMS has checked; QMS approves its own check | 409 / 403 | ☐ |
| N7 | **Stale simultaneous action:** two sessions open the same draft; both approve (or one approves, one rejects) | first succeeds, second gets a conflict, record unchanged by the second | ☐ |
| N8 | Edit request that includes status, approvedBy or a timestamp | refused, record unchanged | ☐ |
| N9 | Reject without a reason | refused | ☐ |
| N10 | An **expired** delegation and a **revoked** delegation try to approve | 403 | ☐ |
| N11 | A Director's delegate approves a maintenance document; a Maintenance Manager's delegate approves an Operations document | 403 | ☐ |
| N12 | Employee opens someone else's draft or a `restricted` document by URL | not found / restricted, no content | ☐ |

## 5. Delegation (positive)
| # | Check | Pass |
|---|---|---|
| D1 | Maintenance Manager of A delegates to a named user for 14 days with approval; the delegate signs in as themselves and approves a maintenance document of A | ☐ |
| D2 | The record shows "‹delegate› (delegate for Maintenance Manager, A)" with the delegation reference | ☐ |
| D3 | A delegation longer than 90 days, or with no reason or end date, is refused | ☐ |
| D4 | The grantor revokes it; the delegate can no longer approve immediately | ☐ |

## 6. Files, audit, notifications
| # | Check | Pass |
|---|---|---|
| F1 | Upload accepts the allowed types; refuses an empty file, `.pdf.exe` and an oversized file with a clear message | ☐ |
| F2 | Malware-scan result is respected (test file per IT policy) | ☐ |
| F3 | Download works for a current document; refused for a withdrawn or unapproved one; a direct storage URL without authorization fails | ☐ |
| F4 | An approved document's file cannot be replaced; a change requires a new revision | ☐ |
| A1 | Every step above appears in the audit trail with actor, time and action; entries cannot be edited | ☐ |
| A2 | Rejection shows the reason to the submitter and in the audit trail | ☐ |
| B1 | QMS is notified on submission; the right final approver (Director or Maintenance Manager) on confirmation; the submitter on approval and on rejection | ☐ |
| B2 | A notification failure does not undo or block the workflow step | ☐ |

## 7. Search, Master List, platform
| # | Check | Pass |
|---|---|---|
| S1 | Search returns only documents the user may see; new documents appear after publication | ☐ |
| S2 | Master List and F086 export work for QMS and Auditor only | ☐ |
| P1 | Phone (iOS Safari and Android Chrome): sign-in, both journeys' key steps, the menu | ☐ |
| P2 | Every page opened by **direct URL** and **refreshed** works after sign-in; an unknown URL shows a proper not-found page | ☐ |
| P3 | **Session expiry**: leave a form open past expiry, submit; the user is asked to sign in again and does not lose the form | ☐ |
| P4 | **Deployment update**: deploy a visible change; an open TechHub tab shows it after one reload; an installed PWA shows it after reopening | ☐ |
| P5 | Edge and Firefox desktop smoke | ☐ |

## 8. Field Glossary contributions (`BUSINESS-RULES.md` §13)
The prototype adds a term immediately in one browser; that is **not** what is tested here.

| # | Check | Expected | Pass |
|---|---|---|---|
| G1 | **Employee** proposes a term in category X with term, full name, definition and a source reference | Saved as **Pending Review**; the employee sees it under their proposals with that status | ☐ |
| G2 | Another Employee searches and browses the glossary | The pending term is **not** shown | ☐ |
| G3 | **SME of X** opens the review queue | The term is there with the real submitter's name and server time | ☐ |
| G4 | **SME of X** approves it | Status **approved**; `reviewedBy` / `reviewedAt` recorded; the term now appears for every user in the shared glossary | ☐ |
| G5 | A second proposal in X; **SME of X** rejects it with a reason | Status **rejected**; the submitter sees the reason; the term never appears in the shared glossary | ☐ |
| G6 | Reject without a reason | Refused | ☐ |
| G7 | **SME of Y**, an Employee and the Auditor try to approve or reject the X proposal (UI and direct API call) | 403 | ☐ |
| G8 | **QMS / glossary administration** tries to approve a pending technical term in a category it is not mapped to as SME | 403 (QMS is not automatically the technical approver) | ☐ |
| G9 | **QMS / glossary administration** corrects an approved term's category, removes a duplicate and withdraws an entry | Allowed; changes appear in the shared glossary; each is in the audit trail | ☐ |
| G10 | Anyone other than glossary administration tries to recategorise or withdraw an approved term | 403 | ☐ |
| G11 | A request that sets `status`, `submittedBy`, `reviewedBy`, `reviewedAt` or a timestamp directly | Refused, record unchanged | ☐ |
| G12 | Two reviewers act on the same pending term at the same time | First succeeds, second gets a conflict | ☐ |
| G13 | The SME of X is notified of the new proposal; the submitter is notified of approval and of rejection | Received | ☐ |
| G14 | Editing `localStorage` in the browser cannot add a term to the shared glossary | Nothing changes for other users | ☐ |

## 9. Segment membership (`BUSINESS-RULES.md` §14)
The prototype's "Add Contributor" (typed name, Editor / Viewer / Owner) is **not** what is tested here. A and B are operational segments. Membership is segment + department (Operations or Maintenance).

**Visibility**

| # | Check | Expected | Pass |
|---|---|---|---|
| SM1 | **Employee (A, Operations)** and **Employee (A, Maintenance)** each browse Home, Search and the area lists | Both see segment A (both sides), every Corporate Function, every Center of Excellence and Company Wide; neither sees segment B or any other operational segment | ☐ |
| SM2 | Employee (A, Operations) opens a segment-B area page and a segment-B document **by URL**, by QR link and by search | Not found / no content | ☐ |
| SM3 | The same Employee calls the API directly with `area=B`, edits JavaScript or `localStorage`, or changes an area id in a request | No segment-B data returned | ☐ |

**Who manages membership**

| # | Check | Expected | Pass |
|---|---|---|---|
| SM4 | **Employee** and **Auditor** look for Add Member on every page, desktop and phone | Not shown anywhere; direct API calls to view, add or remove members return 403 | ☐ |
| SM5 | **Segment Director of A** opens segment A's members | Sees both Operations and Maintenance members of A; only **"Add Operations Member"** is offered | ☐ |
| SM6 | **Maintenance Manager of A** opens segment A's members | Sees both departments' members of A; only **"Add Maintenance Member"** is offered | ☐ |
| SM7 | Director of A opens Add Operations Member | Asks **only** for a corporate email; no name, title, initials, Editor / Viewer / Owner, role, segment or department field | ☐ |
| SM8 | Director of A enters account **P**'s email | The resolved person (display name, email, job title if available) is shown **before** confirming; the button reads "Add to ‹A› Operations" | ☐ |
| SM9 | Director of A confirms | Stored against the Entra object id with segment A, department **Operations**, added-by and server time (check the record); P now sees segment A | ☐ |
| SM10 | **Maintenance Manager of A** adds account **Q** with Add Maintenance Member | Stored as segment A, department **Maintenance**; Q now sees segment A | ☐ |
| SM11 | Director of A tries to add or remove a **Maintenance** member of A (UI and direct API call) | 403 | ☐ |
| SM12 | Maintenance Manager of A tries to add or remove an **Operations** member of A (UI and direct API call) | 403 | ☐ |
| SM13 | Director of A or Maintenance Manager of A tries to add or remove members of **segment B** | 403 | ☐ |
| SM14 | A manager edits the request to change the segment or department (path, body or hidden field) | Refused; nothing stored outside their permitted segment and department | ☐ |
| SM15 | **QMS / authorised administration** views, adds and removes Operations and Maintenance members in A and B | Allowed; each change is in the audit trail | ☐ |

**Identity and authority**

| # | Check | Expected | Pass |
|---|---|---|---|
| SM16 | Add Member with an unknown email, a disabled account, or a person already a member | Refused with a clear message | ☐ |
| SM17 | A request to Add Member that includes a role, "Owner", a name or a title | Refused; no role changes | ☐ |
| SM18 | **P** (A, Operations) and **Q** (A, Maintenance) after being added | Both still Employees: can file documents and track their submissions; cannot QMS-check, approve, delegate or manage members. Q is **not** a Maintenance Manager and cannot approve maintenance documents; P is **not** a Segment Director | ☐ |
| SM19 | Director of A removes P; Maintenance Manager of A removes Q | Their segment-A access ends (unless another membership grants it); audit entries recorded | ☐ |
| SM20 | If IT implemented automatic assignment: an employee whose authoritative attributes say segment A, Maintenance signs in for the first time | Member of A, Maintenance automatically; source recorded as automatic | ☐ |
