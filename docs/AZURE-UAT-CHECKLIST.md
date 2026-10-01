# TechHub Azure UAT checklist

**Not for now.** Mohammed and IT run this **after** Azure integration, in the UAT environment, with real Entra accounts. Each line passes only if it is observed, not assumed. Record the account used, the document number and the result.

Test accounts needed (one real user each): Employee · QMS · Segment Director of area **A** · Segment Director of area **B** · Maintenance Manager of segment **A** · Maintenance Manager of segment **B** · Auditor · a delegate.

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
| O4 | **Employee** finds it in area A's Operations shelf and Search, not on the Maintenance side; downloads the real file | ☐ |
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
