# 16 Open IT decisions

These belong to IT. The Product Owner does not choose among them. Where IT needs a business answer first, the dependency is shown. Earlier documents (`AZURE-INTEGRATION-REQUIREMENTS.md`, `API-REQUIREMENTS.md`, `HANDOVER-TO-IT.md`) describe an "Azure API + database" design. **That is one option, not a decision.**

| # | Decision | Notes | Depends on |
|---|---|---|---|
| IT-01 | **Are SharePoint lists / libraries and Power Automate sufficient, or is a custom service (API) needed?** | Test against 08: atomic release + supersede, optimistic concurrency, identity-based separation of duties, grant evaluation, append-only audit, server-side permission trimming of counts | — |
| IT-02 | Where the register and files live (SharePoint, Dataverse, a database, or a mix) | One item per family with versions, or one per revision | IT-01, BD-01 |
| IT-03 | How RISE relates to SCORE in production: link, read, sync, or (after an approved transition) import | SCORE remains authoritative (BD-01) | BD-01; QMS |
| IT-04 | Entra ID design: app registration(s), group or app-role mapping, source of "area held" and department, guest access for auditors | Business supplies who holds which area | Business data |
| IT-05 | Sign-in implementation (platform sign-in or MSAL), MFA and Conditional Access | Includes sign-in inside the installed iPhone app (11) | Cybersecurity |
| IT-06 | Permission trimming and classification enforcement mechanism (item permissions, sensitivity labels, search trimming) | BD-03 | Classification policy (17) |
| IT-07 | Concurrency mechanism (for example ETag / If-Match) | 08 row 5 | IT-01 |
| IT-08 | File-version binding and where the fingerprint is computed and stored | PI-12 | IT-02 |
| IT-09 | Audit trail store, protection and export | 08 row 9 | IT-02 |
| IT-10 | Notification channel (email, Teams) and its trigger | Only after a successful transition | IT-01 |
| IT-11 | Ask Expert destination and receipt confirmation | BD-04 | QMS triage procedure |
| IT-12 | Monitoring and alerting tooling; support owner and hours | 13 | — |
| IT-13 | Backup scope, tooling, recovery targets, restore testing | 13 | Business targets |
| IT-14 | Retention implementation and disposal approval | 13 | QMS periods |
| IT-15 | Environments, pipeline, release approval, rollback, branch protection | 14 | — |
| IT-16 | Hosting of the user interface; whether GitHub Pages stays | GitHub Pages is a public host | Cybersecurity |
| IT-17 | Device caching policy for the installed app (what, how long) | BD-05 | Cybersecurity |
| IT-18 | Error / 404 page behaviour on the host | PI-50 | — |
| IT-19 | Font licence for the web (BW Gradual) | Raised in the earlier handover | Procurement |
| IT-20 | Licences needed for the chosen design (for example Power Automate premium connectors, Purview features) | Depends on IT-01 / IT-06 / IT-09 | IT-01 |
| IT-21 | Repository ownership and visibility (today public, on a personal GitHub account); transfer to a TAQA organisation; ownership of the Azure subscription and deployment token | 02 "Public exposure today" | Cybersecurity |
| IT-22 | Pull-request preview sites (built by the Azure workflow): reachability and whether to keep them | 14 | Cybersecurity |
