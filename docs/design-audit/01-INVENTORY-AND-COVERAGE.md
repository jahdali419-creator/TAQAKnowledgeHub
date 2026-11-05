# RISE — Design Audit · Part 1: Inventory and Coverage

**Audited:** 5 November 2026 · branch `claude/affectionate-carson-duwb3p`
**Method:** source inspection + a Playwright measurement harness driving the real
application at five viewports and five roles, with screenshots retained.
**Status:** audit only. No application file was changed for this audit.

---

## 1. Page and route inventory

19 HTML entry points. There is no router: each page is a standalone document.

| # | Route | Title | Lines | Primary users |
|---|---|---|---|---|
| 1 | `index.html` | RISE — What We Know | 2591 | All |
| 2 | `segment.html?id=<area>` | Segment | 2805 | All |
| 3 | `master-list.html` | Master Document List | 1934 | QMS, Auditor |
| 4 | `master-list.html?view=qms` | QMS Workbench | — | QMS |
| 5 | `master-list.html?doc=<n>` | Register row deep link | — | QMS, Auditor |
| 6 | `documents.html?id=<area>` | Published Documents | 746 | All |
| 7 | `dashboard.html?id=<area>` | Segment Control Panel | 1840 | Director, QMS, Maintenance |
| 8 | `upload.html` / `?type=<t>` | Upload Document | 2211 | Employee, Manager |
| 9 | `viewer.html` | Document Viewer | 1922 | All |
| 10 | `cases.html` | Field Cases | 918 | All |
| 11 | `case.html` | Field Case detail | 738 | All |
| 12 | `case-new.html` | Add a Case | 1787 | Employee |
| 13 | `prejob.html` | Pre-job Pack | 993 | Field |
| 14 | `ai-search.html` | Search | 1106 | All |
| 15 | `glossary.html` | Field Glossary | 1369 | All |
| 16 | `recognition.html?area=<a>` | My Contributions | 721 | All earners |
| 17 | `analytics.html` | Analytics | 667 | Director, QMS |
| 18 | `support-ticket.html` | Ask an Expert | 1228 | All |
| 19 | `form.html` | Form | 387 | All |
| 20 | `whats-new.html` | About this platform | 542 | All |
| 21 | `offline.html` | Offline | 50 | All (service worker) |

**Shared modules:** `shared.js` (topbar, menus, bookmarks, PWA), `store.js`
(document register), `roles.js` (5 roles), `recognition.js` (points/levels),
`cases.js`, `documents-master.js` (561 records), `segments-data.js`,
`search-index.js`, `forms-data.js`, `qr.js`.

**Stylesheets:** `techhub.css`, `topbar.css`, `fonts/fonts.css`, plus a large
inline `<style>` block in every page.

### Content dimensions

- **25 areas** in three families: 11 Operational Segments, 10 Corporate
  Functions, 3 Products & Technology centres, plus `company`.
- **561 controlled documents**, 585 register rows, 84 reviews overdue.
- **5 roles:** Employee, Segment Director (`owner`), Maintenance Manager
  (`maintenance`), QMS / Document Controller (`qms`), External Auditor.

**True page count is far higher than 21.** `segment.html` alone renders 25
distinct areas; `dashboard.html` renders 25 × 3 role variants. A realistic
surface is **~150 meaningful page states**.

---

## 2. Coverage matrix

What was actually opened and measured. Nothing below is inferred from source
alone unless the cell says so.

### By role, at 1440×900 — all 18 reachable routes each

| Role | Routes probed | Screenshots | Notes |
|---|---|---|---|
| Employee | 18 | 18 | Baseline |
| QMS / Document Controller | 18 | 18 | Unlocks Master List, Workbench |
| Segment Director (no area) | 18 | 18 | Dashboard **gated** — see UX-041 |
| Segment Director (area=drilling) | 5 | 5 | Real director desk reached |
| Maintenance Manager | 18 | 18 | |
| External Auditor | 18 | 18 | |

### By viewport, as Employee — all 18 routes each

| Viewport | Probed | Horizontal overflow found |
|---|---|---|
| 1440×900 desktop | 18 | none |
| 1024×900 laptop | 18 | none |
| 768×900 tablet | 18 | none |
| 390×844 mobile | 18 | none |
| 360×900 small mobile | 18 | none |

**No horizontal overflow at any viewport, on any page, in any role.** That is
unusual and a genuine strength.

### Measured per page

Document height · horizontal overflow · interactive targets under 44px ·
WCAG AA text contrast (opaque backgrounds only) · controls with no accessible
name · inputs with no label · heading-level jumps · images without alt ·
border-radius and shadow inventory · console errors.

### Not inspected — stated plainly

These were **not** opened, and nothing in this report claims otherwise:

1. **Modal and dropdown interiors.** Bookmarks panel, Areas mega-menu, upload
   step 2 and 3, case-new multi-step body, delegate dialog, share sheet, the
   document "More" menu. Only their triggers were measured.
2. **Live workflow transitions.** Submit → QMS check → Director approve →
   Published was exercised in an earlier session via the store API, not
   re-walked through the UI for this audit.
3. **24 of 25 areas.** Only `drilling` was opened. Areas differ in document
   volume, so empty/overflowing variants are unverified.
4. **Firefox and WebKit.** Chromium only. The repo has a WebKit smoke job.
5. **Real screen-reader output.** Semantics were measured programmatically;
   no NVDA/VoiceOver pass.
6. **Keyboard traversal.** Focus-visible rules exist in CSS, but a tab-through
   of each page was not performed.
7. **Dark theme.** `data-taqa-theme="dark"` exists and was not swept.
8. **Arabic / RTL.** The register holds 14 Arabic documents; RTL layout was
   not exercised.
9. **`case.html` and `form.html` with real records.** Opened without
   parameters only, so both were in an empty state.
10. **Print styles.** `@media print` rules exist; not rendered.

### Corrections made during the audit

My first contrast pass reported ~18 WCAG failures. **Those were wrong.** The
probe read only `background-color`, so any panel painted with a
`linear-gradient` resolved as transparent and fell through to white, making
white-on-dark-teal headings appear as 1.00:1. The probe was fixed to treat a
gradient ancestor as *indeterminate* rather than guess. The corrected count is
**2–4 real failures**, listed in Part 2. 23–42 text nodes per page sit on
gradients and cannot be measured this way; they need visual review, which is
noted as a gap rather than reported as passing.

---

## 3. Evidence location

The report lives in `docs/design-audit/`. That matters operationally: the Azure
Static Web Apps workflow assembles the deployed site by excluding
`docs|tests|scripts|holding|config|.github|.claude`, so anything under `docs/` is
**not published to the live site**. A top-level `design-audit/` folder would have
been deployed.

```
docs/design-audit/
  00-EXECUTIVE-SUMMARY.md
  01-INVENTORY-AND-COVERAGE.md        this file
  02-FINDINGS-BACKLOG.md              UX-001 … UX-081
  03-PRIORITIES.md
  04-DESIGN-SYSTEM-AND-DIRECTIONS.md
  05-ROADMAP.md
  evidence/
    probe-<role>-<width>.json         measured facts per page — all 9 retained
    areas.json                        the 25 areas as the app reports them
    shots/<role>-<width>--<page>.png  14 curated shots
```

**All nine probe files are committed** — they are the measured record and they are
small. **Of ~167 screenshots captured, 14 are committed**: the ones that evidence a
confirmed finding. The full set was 33MB, which does not belong in a repository
that is cloned to deploy a website. The probe JSON, not the screenshot, is what
every number in Part 2 is drawn from.

The harness that produced all of this (`tests/_audit.spec.js`) was temporary and
**has been deleted**. It was env-driven — role, area, viewport, page list — and
re-creating it is roughly 150 lines against the existing Playwright fixtures. The
numbers in Part 2 are the baseline to compare a future run against.
