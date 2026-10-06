# 08 Security and control matrix

For each control:
- the **business rule** (the owner's);
- how the **prototype behaves**;
- the **test evidence**;
- the **production control** required;
- a **suggested Microsoft 365 capability**, which **IT must confirm** (a suggestion, not a decision);
- the **owner**.

"Browser only" applies to every row of the prototype column. None of it is a security control (02).

| # | Business rule | Prototype behaviour | Test evidence (`tests/`) | Production control required | Suggested M365 capability (IT to confirm) | Owner |
|---|---|---|---|---|---|---|
| 1 | **Separation of duties:** filer ≠ QMS checker ≠ final approver, delegation included | Refused in the register and explained on the desk and in the Workbench. Where two actors cannot be shown to be different people, it refuses | `integrity-p1`, `routing-separation`, `delegation-integrity` | The server compares Entra object ids at each transition | Workflow condition on the signed-in identity; or service-side check | Rule: Mohammed. Mechanism: IT |
| 2 | **Exact-file approval:** the approver approves the exact revision and file reviewed | Exact revision and attempt bound to the decision; Preview opens that record; the final confirmation repeats it. **No file is stored** | `decision-integrity`, `revision-control` | Approval bound to file version + server-computed fingerprint | Library major versions + stored hash column; approval references version | Rule: Mohammed. Mechanism: IT |
| 3 | **Never more than one Current revision** per number | Release supersedes the previous revision in the same step; future-effective approval keeps the old one current until the date | `revision-control`, `record-truth` | Atomic release + supersede; one in-force constraint | Single transaction in a flow or service; uniqueness check on "in force" | IT |
| 4 | **Uniqueness:** a number is used once, for good, in any status (legacy IDs included) | `add()` refuses; Upload stops it at step 2 and at submit; restricted clashes refused without naming them | `doc-identity`, `numbering`, `integrity-closeout` | Server validates or allocates numbers (IT decides); uniqueness enforced server-side | Counter list or service; unique column | Rule: Mohammed / QHSE (numbering table). Mechanism: IT |
| 5 | **Stale-decision prevention:** a decision on a changed record is refused | Each decision carries the record identity and step; refused and reloaded if they changed (within one browser) | `decision-integrity` | Optimistic concurrency across users | ETag / If-Match on items; version check in flow | IT |
| 6 | **Delegation scope:** a delegation replaces authority; own area / department / types; ≤ 90 days; no re-delegation; QMS check not delegable | Enforced in `roles.js`; grants recorded with evidence; revocation immediate; broken grants hold nothing | `delegation-integrity`, `dashboard`, `approval-workflow` | Grants stored and evaluated by the server; delegate signs in as themselves | List of grants + server-side evaluation; Entra people picker | Rule: Mohammed. Mechanism: IT |
| 7 | **Withdrawal evidence:** who, when, why (≥ 20 characters), previous status; cancels open revisions | Recorded on the record; reason required; bulk withdrawal previews each record | `record-truth`, `decision-integrity` | Written by the server from identity and server time, append-only | Version history + audit log; flow writes the fields | Rule: Mohammed / QMS. Mechanism: IT |
| 8 | **Classification / visibility (BD-03):** no title or metadata of what the user may not open | Lists, counts, search, bookmarks, the desk's activity and counts, Upload messages and the document page trimmed by role (PI-27). **Exception:** the area approver's approval queue still lists a restricted draft's title (BC-06) | `integrity-closeout` | Server-side permission trimming; nothing restricted sent to the client | Item permissions, sensitivity labels, search security trimming | Rule: Mohammed. Policy at upload: QMS (17). Mechanism: IT / Cybersecurity |
| 9 | **Immutable audit trail** | Trail rebuilt in the page; some rows placeholders | — (not provable in the prototype) | Append-only, server-written, exportable | Purview audit / version history / separate log | IT / Cybersecurity |
| 10 | **Effective dates:** the effective date may be later than the approval date, never earlier; promoted once on the date | Implemented with the user's local calendar day | `record-truth` | Server business date; idempotent scheduled promotion | Scheduled flow or job | IT |
| 11 | **Lifecycle-field protection:** status and signatures change only through the workflow | `patch()` refuses anything but descriptive fields; `add()` strips forged lifecycle fields (PI-09) | `integrity-p1` | Server ignores client-sent lifecycle fields | Column-level permissions / flow-only writes | IT |
| 12 | **Nothing sent offline (BD-05)** | Every change refused when RISE cannot be reached; nothing queued; typed work kept | `phone-reliability`, `offline` | Server is the only authority; caching policy | Service-worker cache rules agreed with Cybersecurity | Rule: Mohammed. Mechanism: IT / Cybersecurity |
| 13 | **No stored script injection** from titles and other register text | All register text escaped before display (PI-05). The Content Security Policy is a `<meta>` tag allowing inline script and style | `security-regression` | Output encoding + a strict Content Security Policy as headers | Hosting headers | IT |
| 14 | **Exact identity in links (PI-23):** links and QR resolve to the document's own identity | Number + record's area in share / QR / bookmarks; nothing guessed | `integrity-closeout`, `doc-identity` | Immutable item / version id in links | SharePoint item id + version | IT |
| 15 | **Auditor changes nothing; access time-boxed** | Auditor role has no write capability; no time box | `roles` | Read-only, expiring access | Entra guest access with expiry / access reviews | IT / QMS |

## Known gaps, stated plainly

- The prototype sends the whole register to every browser (row 8).
- The audit trail is not real (row 9).
- No file is stored (row 2).
- Identity is simulated (rows 1, 6).
- The repository and both demonstration sites are public, with no sign-in (02, "Public exposure today").

These are the reasons the prototype is not production security.
