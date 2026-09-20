# Knowledge Hub — document control alignment specification

How to change the Knowledge Hub code so it satisfies TQ-QHSE-S001, ISO 9001:2015 §7.5
and API Spec Q2 3rd Edition §4.4–4.5.

Prepared for the TAQA Learning Center, for hand-over to IT · 20 September 2026
Assessed against the working tree at `claude/inspiring-mayer-pm1350`
Classification: Internal Use

---

## The constraint that shapes everything

The Hub is a static site. It makes **no network calls of any kind** — this is verified in
`docs/CYBERSECURITY-REVIEW-PACK.md` and still true of the current code. There is no server, no
database and no identity.

That splits the work in two, and the split must be stated up front so nobody promises an auditor
something the architecture cannot deliver:

| Can be done in the static site today | Needs a backend — cannot be faked |
|---|---|
| Document identification and metadata (ISO §7.5.2 a) | Approval workflow with recorded approver identity (API Q2 §4.4.3 a, b) |
| Current revision status and change history (API Q2 §4.4.3 d) | Audit trail of who viewed, changed or approved what |
| Obsolete and superseded marking (API Q2 §4.4.3) | Access control by role (ISO §7.5.3.1 b) |
| Availability at point of use, offline (API Q2 §4.4.3 f) | Retention enforcement and disposal records (API Q2 §4.5 g–i) |
| Master document list as a single source | Record correction with audit trail (API Q2 §4.5 d) |
| Review-due dates and overdue flags (API Q2 §4.4.3 c) | Distribution acknowledgement (ISO §7.5.3.2 a) |
| External document register (API Q2 §4.4.4) | Electronic signature |
| Classification labels (ISO §7.5.3.1 b) | Backup, restore and DR (ISO §7.5.3.2 b) |

**The honest position for IT:** the Hub can become a compliant *point-of-use distribution channel*
for controlled documents. It cannot become the system of record. SCORE stays the master. Anything
in the right-hand column is a SCORE or SharePoint responsibility, and the Hub should link to it
rather than imitate it.

Everything below is scoped to the left-hand column.

---

## Finding 1 — The Hub fabricates document metadata and displays it as fact

**This is the one to fix first. It is a live compliance risk, not a gap.**

`viewer.html:490-493` defines four arrays:

```js
const AUTHORS=['Mohammed Al-Ghamdi','Ahmed Al-Zahrani','Saud Al-Harbi',
               'Faisal Al-Otaibi','Khalid Al-Shehri','Omar Al-Dosari'];
const VERSIONS=['Rev 1.0','Rev 2.1','v3.0','v4.2','Rev 5.0','v2.3'];
const DATES=['Jan 2026','Feb 2026','Mar 2026','Apr 2026','May 2026'];
```

`viewer.html:552-563` then picks one of each **by hashing the document title** and renders the
result into the metadata grid as Revision, Issued and Author:

```js
const vi = Math.abs(hashStr(docTitle)) % VERSIONS.length;
const di = Math.abs(hashStr(docTitle + '1')) % DATES.length;
const ai = Math.abs(hashStr(docTitle + '2')) % AUTHORS.length;
```

Real revision data exists in `segments-data.js` under `docRevisions`, and is preferred when present
— but **it is present for 3 documents out of roughly 620**. Every other document in the Hub displays
an invented revision number, an invented issue date and the name of a real TAQA employee who may
never have touched it. `segment.html:1186-1187` does the same thing for sizes and dates in the list
view.

Against ISO 9001 §7.5.2 a), identification must be *appropriate*. Against §7.5.3.1 a), documented
information must be *suitable for use*. A field supervisor reading "Rev 4.2, Issued Apr 2026" on a
well control SOP has been given a fabricated control status. This is worse than showing nothing.

### Fix

1. Delete the four arrays and every hash-derived metadata path in `viewer.html` and `segment.html`.
2. Render only metadata that exists in the data model.
3. Where metadata is absent, render an explicit **"Not recorded — refer to SCORE"** state with a
   link, not a placeholder value.
4. Add a build-time check that fails if any document renders a metadata field with no source value.

This is a small change — under a day — and it removes the single most defensible audit finding
against the platform.

---

## Finding 2 — There is no master document list, there are three

The document set exists in three independent copies that nothing keeps in step:

| Source | Object | Consumed by |
|---|---|---|
| `segments-data.js` | `TAQA_SEGMENTS` | `documents.html`, `index.html` |
| `segment.html:730` inline | `SEGMENTS` | `segment.html` only |
| `search-index.js` | `TAQA_SEARCH_INDEX` | `ai-search.html` |

`segment.html` does not load `segments-data.js` at all — its script tags are `qrcode.js`, `qr.js`
and `shared.js`. But `segment.html:1245` reads `TAQA_SEGMENTS`, guarded by a `typeof … undefined`
check. So the guard always fires and **revision history silently never renders on the segment page**.
It fails quietly, which is why nobody has noticed.

TQ-QHSE-S001 §5.1 requires one Master Document List. The code has three lists and a dead reference.

### Fix

One file, `documents-master.js`, exporting a single flat array of document records. Every page
derives its view from it:

- `segment.html` filters by segment — delete the inline `SEGMENTS` object, add the script tag.
- `ai-search.html` builds its index from it at load — delete `search-index.js`.
- `documents.html` and `index.html` keep reading it.

Counts (`sops: 12`, `manuals: 9`, …) must be **computed from the array**, never stored. They are
currently hand-maintained integers that can drift from the arrays they describe.

---

## Finding 3 — The data model carries no control metadata

Documents are plain strings:

```js
sops:['CT-001 Pre-Job Safety Checklist','CT-002 BHA Assembly Procedure', …]
```

The reference number, title, revision and status are fused into one display string. Nothing can be
filtered, sorted, validated or flagged, because there are no fields.

### Proposed record schema

Every field maps to a clause. Nothing is included that no clause asks for.

```js
{
  // Identification — ISO 9001 §7.5.2 a) · TQ-QHSE-S001 §5.3
  docNumber:    'TQ-TWS-CTSS-SOP-001',   // conformant number, see Finding 4
  legacyId:     'CT-001',                // old Hub ID, kept for redirects only
  title:        'Pre-Job Safety Checklist',
  segment:      'coiled-tubing',
  docType:      'sop',                   // sop|manual|policy|standard|wi|form|guideline|sqp

  // Revision status — API Q2 §4.4.3 d)
  revision:     '2.0',
  issueDate:    '2026-03-14',            // ISO 8601, not 'Mar 2026'
  changeSummary:'Added H2S entry criteria to section 4.',

  // Approval — API Q2 §4.4.3 a), b)
  owner:        'Operations Manager, CTSS',   // role, not person
  approver:     'Executive Director, TWS',    // role, not person
  approvedDate: '2026-03-12',

  // Periodic review — API Q2 §4.4.3 c)
  reviewCycleMonths: 24,
  nextReviewDate:    '2028-03-14',       // derived, but stored so it is auditable

  // Lifecycle — API Q2 §4.4.3 obsolete control
  status:       'current',               // draft|current|under-review|superseded|obsolete
  supersedes:   'TQ-TWS-CTSS-SOP-001 Rev 1.0',
  supersededBy: null,

  // Protection — ISO 9001 §7.5.3.1 b)
  classification: 'internal',            // public|internal|confidential|restricted

  // Source of truth — the Hub is a distribution channel, not the master
  scoreUrl:     'https://score.taqa.../TQ-TWS-CTSS-SOP-001',
  language:     'en',
  translationOf: null                    // API Q2 §4.4.3 translations
}
```

**Two decisions worth defending to IT:**

`owner` and `approver` hold **roles, not names**. Names go stale, create a data-protection surface
on a public-facing site, and are not what the standard asks for — §4.4.3 a) is about approval
authority, which is positional. This also directly fixes the Finding 1 exposure of employee names.

`scoreUrl` is mandatory on every record. It is what makes the Hub a legitimate distribution channel
rather than an uncontrolled second copy, and it is the answer to the auditor's question "how does a
user get to the master?"

---

## Finding 4 — Every document number in the Hub violates TQ-QHSE-S001 §5.3, and two collide

The Hub invents its own scheme in `upload.html:858-871`: `CT-001`, `FRAC-MAN-003`, `ALERT-WL-001`,
`LL-CS-007`. The standard mandates `TQ-<BU>-<SPL/Function>-<type><NNN>`.

Worse, two Hub prefixes collide with short forms the standard has already assigned:

| Hub prefix | Hub means | TQ-QHSE-S001 §5.3 assigns it to |
|---|---|---|
| `WS-` | Well Safety | **WS = Wireline Services** |
| `CS-` | Cybersecurity | **CS = Customer Service** |

A document numbered `WS-001` is ambiguous the moment the Hub's contents meet SCORE's.

### Mapping to apply

| Hub segment | Correct short form | Conformant pattern |
|---|---|---|
| coiled-tubing | CTSS | `TQ-TWS-CTSS-SOP-001` |
| fracturing | FS | `TQ-TWS-FS-SOP-001` |
| wireline | WS | `TQ-TWS-WS-SOP-001` |
| drilling | DSS | `TQ-TDS-DSS-SOP-001` |
| cementing | CMT | `TQ-TWS-CMT-SOP-001` |
| inspection | WIS | `TQ-TWS-WIS-SOP-001` |
| well-safety | WSS | `TQ-TWS-WSS-SOP-001` |
| well-testing | WTS | `TQ-TWS-WTS-SOP-001` |
| qhse | QHSE | `TQ-QHSE-SOP-001` (corporate) |
| hr | HR | `TQ-HR-SOP-001` (corporate) |
| tws-maintenance | MNT | `TQ-TWS-MNT-SOP-001` |
| cybersecurity | **none exists** | blocked — see below |

**Two segments cannot be numbered conformantly today**, and this is a finding against the standard,
not against the code:

- **Cybersecurity** has no short form in §5.3. `IT` and `GRC` exist; neither is cybersecurity.
- **The Learning Center** has no short form either, although §7.2 names the Training Department as a
  record initiator and the LMS as a record system. The Hub's own owning department cannot legally
  number its documents.

Both need a short form assigned by QHSE before this work completes. Raise it with the same change
request that fixes the V3.0 defects.

### Implementation

Add a validator to `upload.html` that rejects a non-conformant reference on entry, replacing
`SEG_ID_FORMATS` with a generator built from the table above:

```js
const PATTERN = /^TQ-(QHSE|GRC|PMO|CFP|SC|HR|DT|CPL|IT|IA|MBD|VM|PR|CP|FMP|STC|CD
                |TWS|TWC|TWI|TDS|P&T)(-[A-Z]{2,4})?-(M|P|S|SOP|WI|F)-?\d{3}$/;
```

Keep `legacyId` on every record and add redirects, so existing QR codes and bookmarks — which
encode the old IDs — keep resolving. This matters: QR codes are printed and in the field.

---

## Finding 5 — Documents are addressed by title

`viewer.html:514-518` reads the document from the query string:

```js
const docTitle = decodeURIComponent(params.get('title') || 'Document')…
```

So a document's identity in a URL is its title. Rename the document and every printed QR code,
bookmark and cross-reference breaks. `docRevisions` is keyed by title too, which is why revision
history is so brittle.

Against ISO §7.5.2 a) and §7.5.3.2 c), version control needs a stable identifier.

### Fix

Address documents by `docNumber`: `viewer.html?doc=TQ-TWS-CTSS-SOP-001`. Title becomes display data.
Support the old `?title=` form as a permanent redirect for printed QR codes.

---

## Finding 6 — The upload form collects control metadata and discards all of it

`upload.html` asks for Revision Number, Document Date, Author/Owner, Supersedes, Change Summary,
Purpose, Scope, Target Audience and Prerequisites. It is a genuinely well-designed form.

Then `submitUpload()` at `upload.html:833-855` reads **none of it**. It generates a random reference,
shows a toast and calls `form.reset()`. Most of those inputs have no `id` and no `name` attribute, so
they could not be read even if someone tried.

The page also promises, in `upload.html:602` and the sidebar workflow, that "Documents are reviewed
by the Knowledge Team Lead" and "You'll receive an email notification". **No review occurs and no
email is sent.** There is no backend to send one.

This is the gap between the two columns at the top of this document, rendered as UI. An auditor
shown this screen would reasonably conclude a controlled approval workflow exists.

### Fix — pick one, do not leave it as is

**Option A, honest static (days).** Name every field. On submit, serialise the metadata to a JSON
block and have the submitter send it with the file through the existing SCORE route. Rewrite the
workflow panel to describe what actually happens. The Hub stops claiming to run an approval process.

**Option B, real workflow (weeks, needs IT).** Wire the form to SharePoint or the SCORE API. Then the
workflow panel becomes true, and the right-hand column of the opening table starts to become
achievable.

Option A is the correct next step regardless, because Option B still needs the fields named.

---

## What each page needs

| File | Change |
|---|---|
| `documents-master.js` | **New.** Single source of truth, schema above. |
| `segments-data.js` | Reduce to segment descriptions only. Remove document arrays and hand-maintained counts. |
| `search-index.js` | **Delete.** Built from the master at load. |
| `segment.html` | Remove inline `SEGMENTS` (line 730). Load the master. Remove `AUTHORS`/`SIZES`/`MONTHS` fabrication (1182-1187). Add status and review-due badges. |
| `viewer.html` | Remove `AUTHORS`/`VERSIONS`/`DATES` (490-493) and hash paths (552-563). Address by `docNumber`. Render real metadata, classification, obsolete banner, SCORE link. |
| `documents.html` | Filter by status and classification. Surface review-overdue. |
| `upload.html` | Name all fields. Conformant number validator. Option A or B on submit. Correct the workflow copy. |
| `ai-search.html` | Build index from master. Exclude `obsolete` from default results; show superseded only with an explicit badge. |
| `dashboard.html` | Replace the demo approval queue with a **document control panel**: overdue reviews, documents with no `scoreUrl`, non-conformant numbers, missing metadata. This is the API Q2 §4.4.3 c) evidence an auditor asks for. |
| `service-worker.js` | Obsolete documents must not be served from cache after supersession. Add a cache-invalidation rule keyed on `docNumber` + `revision`. |

That service worker point is easy to miss and it matters: API Q2 §4.4.3 requires obsolete documents
to be removed from points of use. A cached copy on a field tablet **is** a point of use.

---

## Suggested phasing

**Phase 1 — stop the bleeding (about a week).**
Finding 1 only. Delete the fabricated metadata; show "Not recorded" with a SCORE link. No data model
work, no migration. This removes the worst exposure and can ship on its own.

**Phase 2 — one master list (2–3 weeks).**
Findings 2 and 5. Build `documents-master.js`, migrate the three copies into it, switch addressing to
`docNumber` with redirects. Mostly mechanical, but it is the foundation for everything after.

**Phase 3 — control metadata (3–4 weeks).**
Finding 3. Populate the schema. The bottleneck is not code — it is getting real owner, approver,
issue date and review date for ~620 documents from the segment owners. Start that data collection
during Phase 1, or Phase 3 will stall.

**Phase 4 — numbering (2 weeks, blocked).**
Finding 4. Blocked until QHSE assigns short forms for Cybersecurity and the Learning Center.

**Phase 5 — upload and dashboard (scope depends on A or B).**
Finding 6 plus the document control panel.

---

## The one thing to decide before any of this starts

**Is the Hub a distribution channel or a system of record?**

Every recommendation above assumes the first. SCORE stays master, the Hub carries a controlled copy
with a link back, and the Hub's job is identification, currency, availability and obsolete marking —
the four things a static site can genuinely do well, and do better than SCORE does on a field tablet.

If TAQA wants the second, the static architecture cannot deliver it and the conversation is about a
backend, identity and an audit database — a different project with a different budget.

The current code is halfway between the two: it has the *appearance* of a system of record (approval
workflow, revision metadata, author attribution) without any of the machinery. That is the least
defensible of the three positions, and it is why Finding 1 and Finding 6 both exist.

Decide this first. The rest follows cleanly from it.
