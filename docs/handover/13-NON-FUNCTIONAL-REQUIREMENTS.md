# 13 Non-functional requirements

No numbers have been agreed. Where a target is needed it says **"Target to be confirmed by IT/business"**. Nothing below is a measured or promised figure unless it says "measured".

| Area | Requirement | Target |
|---|---|---|
| **Availability** | RISE is available to staff when they need to confirm a document, including field shifts | Target to be confirmed by IT/business (hours of service and percentage) |
| **Performance** | A document page, an area page and a search answer quickly enough to use on a phone in the field | Target to be confirmed by IT/business (for example a time to first useful content on a stated network) |
| **Capacity** | The number of users, documents, revisions and files RISE must hold, and their growth | Target to be confirmed by IT/business. The prototype holds 585 demonstration records; the real numbers come from SCORE (12) |
| **Recovery point** | How much recent work may be lost in a failure | Target to be confirmed by IT/business |
| **Recovery time** | How long RISE may be unavailable after a failure | Target to be confirmed by IT/business |
| **Backup** | Register, files, versions, grants and audit trail are backed up, and restores are tested | Frequency and test schedule: target to be confirmed by IT/business |
| **Retention** | Each document type kept for its retention period (`retentionYears` in the type lookups), withdrawn revisions and the audit trail included | Periods from TQ-QHSE-S001 / the type lookups; QMS to confirm |
| **Audit** | Every controlled action recorded, append-only, with identity and server time; exportable | Retention of the audit trail: target to be confirmed by IT/business with QMS |
| **Security** | Entra ID sign-in, MFA / Conditional Access, server-side authorisation and permission trimming, no secrets in code, headers (for example Content Security Policy) | Policies set by IT and Cybersecurity |
| **Accessibility** | Usable by keyboard and screen reader; readable at phone sizes down to 320 px wide (the prototype is tested at 320–1440 px: measured) | Standard: target to be confirmed by IT/business (for example a WCAG level) |
| **Browsers and devices** | Current Chrome / Edge on desktop; Safari and Chrome on iPhone and Android; the installed phone app (PWA) | Supported versions: target to be confirmed by IT/business |
| **Offline** | Read offline, send online (BD-05) | What may be cached and for how long: IT and Cybersecurity |
| **Languages** | English and Arabic documents; right-to-left display for Arabic | Interface languages: target to be confirmed by IT/business |
| **Support** | A named support owner, a way for users to report a problem, and hours of support | Target to be confirmed by IT/business |
| **Data residency and regulation** | Where RISE's data may be hosted and any regulatory requirements | Target to be confirmed by IT/business/Cybersecurity |
| **Personal data** | Names and identities in the audit trail; usage analytics (the prototype keeps search text in `localStorage`, `taqa-analytics`) | Handling and retention: to be confirmed by IT/business/Cybersecurity |
| **Monitoring** | Availability, errors and workflow failures alert the support owner | Thresholds: target to be confirmed by IT/business |
