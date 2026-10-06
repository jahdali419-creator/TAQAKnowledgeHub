# 14 Deployment and environments

**IT owns the implementation of everything on this page.** What follows is the business's requirement and the facts about today.

## Today (facts)

- The repository's `main` branch deploys automatically to an **Azure Static Web App** and to **GitHub Pages** on every merge.
- Every push and pull request runs the automated tests in GitHub Actions (`tests.yml`):
  - the `playwright` job: the full suite on desktop Chromium, including the register-data check (`scripts/check-register.js` via `register-integrity.spec.js`);
  - the `webkit-smoke` job: a smoke set on the iPhone engine (`mobile-safari`) and desktop WebKit.
- **The result blocks nothing.** No branch-protection rule requires these checks, so a failing run does not stop a merge or a deployment (`tests.yml` header; `docs/TESTING.md`). Commits have also been pushed to `main` directly, without a pull request.
- The Azure workflow also builds a preview site for each pull request against `main`.
- There is **no separate test / UAT or production environment, and no release approval between a merge and the live sites**. The live sites are the prototype's demonstration environment, not production.
- The service worker's cache name (`CACHE` in `service-worker.js`, `taqa-hub-v108` at this handover) is bumped on every release, so devices pick up the new version.

## Required (business requirement; IT decides how)

1. **Separate environments** (how many is IT's call; at least these purposes):
   - **Development:** for building.
   - **Test / UAT:** a copy of production's design with test data and real test accounts, where User Acceptance Testing (10) runs.
   - **Production:** real users and real data.

   Each has its own configuration. No production data or secrets are used in development.
2. **A test gate before production:**
   - the automated tests;
   - the register / data checks;
   - the UAT sign-off for the release.

   All must pass before a release reaches production.
3. **Release approval:** a named approver signs off each production release (15).
4. **Rollback:**
   - every release can be undone to the previous known-good version;
   - data changes in a release have a tested way back;
   - the rollback is rehearsed in test / UAT.
5. **Branch protection:**
   - no direct pushes to the branch that deploys to production;
   - changes arrive through reviewed pull requests with the required checks green.
6. **Release notes:** what changed, which findings or decisions it addresses, and what users will notice.
7. **Phone app updates:**
   - a release must never reload a page in the middle of someone's work (PI-30);
   - users are offered "Update now".

## IT decisions (see 16)

- Hosting of the user interface (keep Azure Static Web Apps, move into SharePoint, or other).
- Pipeline tooling and where the test gate runs.
- Who approves releases.
- Whether GitHub Pages stays (it is a public host; IT and Cybersecurity to decide).
- How per-environment configuration is supplied (template: `config/techhub.config.example.js`).
- Error pages: unknown URLs currently fall back to the offline page on the live Azure site (PI-50).
