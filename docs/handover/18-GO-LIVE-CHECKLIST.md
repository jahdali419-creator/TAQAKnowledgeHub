# 18 Go-live checklist

A production go-live of RISE may happen only when **every** line below is ticked, each with evidence. Not one is ticked at this handover, because production does not exist yet.

## Decisions

- [ ] Every business confirmation in 17 that affects the go-live scope is answered and recorded in `docs/RISE-BUSINESS-DECISIONS.md` (at least BC-01, BC-02, BC-05, BC-06, BC-07, BC-08, BC-09, BC-10, BC-12).
- [ ] Every IT decision in 16 is made and written down.
- [ ] RISE's relationship to SCORE is agreed (BD-01). Any transition is approved by TAQA document governance.

## Build

- [ ] Every PRODUCTION CONTROL REQUIRED line in 07 and 08 is implemented on the server / platform side, and IT has shown how each is enforced.
- [ ] The "View as" switch and every prototype-only feature (`AZURE-INTEGRATION-REQUIREMENTS.md` §9) are removed from production.
- [ ] No secrets in code; configuration per environment.

## Data

- [ ] SCORE reconciliation completed and signed off by QMS (12).
- [ ] Classification of every in-scope document confirmed.
- [ ] Cutover and rollback rehearsed in test / UAT.

## Testing

- [ ] Automated tests pass against the production design in test / UAT.
- [ ] User Acceptance Testing passed (10), including the negative checks tried directly against the platform.
- [ ] Real iPhone checks recorded (11).
- [ ] Security review by Cybersecurity completed; findings closed or accepted in writing.
- [ ] Restore from backup tested (13).

## Operations

- [ ] Monitoring and alerting live; support owner named; hours agreed.
- [ ] Release approval and rollback procedure in place (14).
- [ ] Retention applied (13).
- [ ] Users told how to report a problem.

## Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Product Owner | | | |
| QMS | | | |
| IT / M365 | | | |
| Cybersecurity | | | |
| QHSE | | | |
