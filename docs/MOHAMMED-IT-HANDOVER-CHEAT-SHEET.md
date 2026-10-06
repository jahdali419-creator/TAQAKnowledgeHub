# IT handover cheat sheet (for Mohammed)

**Status: CURRENT (6 October 2026).** These are the terms IT is likely to use in the RISE handover meetings, in plain language. The last column gives a safe thing to say. It keeps the line between business decisions (Mohammed's) and technical decisions (IT's).

| Term | Say it | Full form | Simple meaning | RISE example | What Mohammed should say |
|---|---|---|---|---|---|
| UAT | "you-ay-tee" | User Acceptance Testing | The business checks that the real system does what it needs before go-live | An Employee, QMS and a Segment Director each run their scenarios in the test copy of RISE (handover 10) | "UAT is ours to run and sign off, but it has to happen in IT's test environment with real accounts, not on the prototype." |
| CI | "see-eye" | Continuous Integration | Automatic tests that run every time code changes | Every pull request runs the Chromium tests and the iPhone-engine smoke tests on GitHub | "Every change runs the automated tests on GitHub, but today a failing run does not block a merge or a deployment. In production I want that gate." |
| PR | "pee-are" | Pull Request | A proposed change, reviewed and tested before it is accepted | The integrity close-out was one PR covering four findings | "Recent changes came in as PRs with their tests; there is no enforced independent review yet." |
| API | "ay-pee-eye" | Application Programming Interface | A defined way for one program to ask another for data or actions | A "custom API" would be a service IT builds for RISE's rules | "Whether we need a custom API is IT's decision. I can tell you the rules it would have to enforce." |
| Entra ID | "en-trah eye-dee" | Microsoft Entra ID (formerly Azure Active Directory) | Microsoft's company sign-in and directory | Who you are, and which role and area you hold, would come from Entra ID, not the "View as" switch | "Roles and areas must come from the directory, not from anything the user can choose." |
| SharePoint | "share-point" | Microsoft SharePoint | Microsoft's place for documents, lists and libraries | One candidate place for the register and files | "Whether SharePoint is enough is IT's call. These are the rules it must hold (handover 08)." |
| Power Automate | "power ought-oh-mate" | Microsoft Power Automate | Microsoft's tool for automatic workflows and approvals | One candidate for the QMS check → final approval flow | "Whatever IT builds must refuse a second approval of the same step and keep who approved what." |
| System of record | — | — | The one place whose data is official when two places disagree | **SCORE**, not RISE (BD-01) | "SCORE stays the system of record until TAQA formally approves otherwise." |
| RACI | "ray-see" | Responsible, Accountable, Consulted, Informed | A table of who does, who owns, who is asked and who is told | Handover 15 | "Each activity has one Accountable owner. Where it says 'unconfirmed', we need a name." |
| ETag / If-Match | "ee-tag" / "if-match" | Entity tag / conditional request header | A version stamp: "only save my change if the record is still the version I saw" | Two QMS users confirm the same filing: one succeeds, the other is refused | "Two people must not both succeed on the same step. How that is enforced is IT's choice." |
| Concurrency | "con-curr-en-see" | — | Two people changing the same thing at the same time | Two approvers open the same document | "The second decision must be refused and nothing changed." |
| Audit trail | — | — | A permanent, unchangeable record of who did what and when | Who withdrew a document, when and why | "It must be append-only and written by the system, not by the screen." |
| Migration | "my-gray-shun" | — | Moving data from one system to another | Bringing SCORE's documents into production RISE, if ever approved | "We reconcile with SCORE first. The prototype's data is not migrated as truth (handover 12)." |
| Rollback | "roll-back" | — | Undoing a release or a data load to the last good state | A bad release is reversed to yesterday's version | "Every release and every data load needs a tested way back." |
| Environment | — | — | A separate copy of the system for a purpose | Development, test / UAT, production | "Nothing reaches production without passing test / UAT with real accounts. How many environments is IT's call." |
| Production | "pro-duck-shun" | — | The live system real users rely on | RISE with real users and real documents | "The prototype is not production." |
| Staging / test | — | — | A copy of production's design used to test before release | Where UAT runs | "UAT happens there, with real test accounts." |
| Deployment | "dee-ploy-ment" | — | Putting a version of the system live | Today a merge to `main` goes straight to the demo sites | "In production I'd want a release approval before deployment." |
| Backup | — | — | A saved copy to recover from | Register, files, versions, grants, audit trail | "What exactly is backed up, and has a restore been tested?" |
| Restore | — | — | Bringing data back from a backup | Recovering yesterday's register after a fault | "Please show a restore working before go-live." |
| Disaster recovery | — | DR | The plan to get the service back after a major failure | The hosting region fails | "What are the recovery targets? They are to be confirmed by IT and the business (handover 13)." |
| Retention | "ree-ten-shun" | — | How long records are kept before disposal | Each document type has a retention period | "Retention periods come from QMS. IT applies them." |
| MFA | "em-eff-ay" | Multi-Factor Authentication | Sign-in with a second proof, such as a phone prompt | Every RISE sign-in | "That is a Cybersecurity and IT policy. RISE should follow it." |
| Conditional Access | — | Microsoft Entra Conditional Access | Rules about when and from where people may sign in | Block sign-in from unmanaged devices | "IT and Cybersecurity set it. I only need to know if it affects field staff on phones." |
| Service worker | — | — | A small script that lets a web app work offline and update itself | It keeps opened pages readable offline and offers "Update now" | "Read offline, send online. Nothing is queued (BD-05)." |
| PWA | "pee-double-you-ay" | Progressive Web App | A website that can be installed on a phone like an app | "Add to Home Screen" on an iPhone | "It is installable, but it still needs real-iPhone checks (handover 11)." |
| WebKit | "web-kit" | — | The browser engine inside Safari and every iPhone browser | The iPhone-engine tests in CI | "We test the iPhone engine automatically, but some things only a real iPhone can prove." |
| SLA | "ess-ell-ay" | Service Level Agreement | Agreed targets for availability and support response | How fast IT responds if RISE is down | "The targets are to be confirmed by IT and the business. I have not set numbers." |
| Data integrity | — | — | Data is correct, complete and consistent | One number per document, one revision in force | "These are the integrity rules (handover 08). The prototype proves them in the browser only." |
| Separation of duties | — | — | No single person can complete a controlled process alone | Filer ≠ QMS checker ≠ final approver | "That is a business rule. How it is enforced (by identity, on the server) is IT's design." |

## Three sentences to keep handy

1. "The prototype shows what the system must do. It does not make it secure; production must enforce it."
2. "I own the business rules and acceptance; IT owns the architecture and how each rule is enforced."
3. "SCORE stays the system of record until TAQA formally approves a change."
