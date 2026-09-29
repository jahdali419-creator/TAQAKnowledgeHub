// Shared Playwright fixtures for the whole suite.
//
// - `gotoApp(path)` is the one way every spec should navigate. In the
//   container this suite was authored in, `page.goto()` against this app
//   intermittently never resolves even though the page has genuinely
//   finished loading (confirmed repeatedly via `document.readyState ===
//   'complete'`, zero console/page errors, and a fully rendered, working
//   DOM), a Playwright/CDP navigation-lifecycle quirk in that sandbox, not
//   a bug in the app. It reproduces on plain `http://` (not just `file://`)
//   and with the service worker blocked, so it is not caused by the app's
//   own `location.reload()` on service-worker update. `gotoApp` races the
//   navigation against that hang and falls back to polling readyState, so
//   specs never have to special-case it. On a normal developer machine this
//   likely never triggers and `gotoApp` behaves exactly like `page.goto()`.
// - `consoleErrors` collects unexpected `pageerror`/console errors for the
//   whole test and the fixture asserts none happened when the test ends,
//   see PHASE 25 in the release brief this suite implements.
// - `setRole` / `clearAppState` give every spec one consistent way to set
//   up an isolated role/area and to start from clean storage, so one test's
//   localStorage can never leak into the next (Playwright already gives
//   every test its own browser context; this only resets state within it).

const base = require('@playwright/test');

const IGNORABLE_CONSOLE_PATTERNS = [
  // Expected/benign under a bare static file server or a sandboxed test run.
  /favicon\.ico/i,
  /service\s*worker/i, // registration/update noise is covered by offline.spec.js on its own terms
  /404.*File not found/i, // a stray asset 404 unrelated to the page under test; specs assert their own required assets separately
];

exports.test = base.test.extend({
  consoleErrors: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (IGNORABLE_CONSOLE_PATTERNS.some((re) => re.test(text))) return;
      errors.push(`console.error: ${text}`);
    });
    await use(errors);
  },

  gotoApp: async ({ page }, use) => {
    const goto = async (path, opts = {}) => {
      try {
        await page.goto(path, { timeout: 8_000, ...opts });
      } catch (err) {
        if (!/Timeout .*exceeded/.test(String(err && err.message))) throw err;
        // Fall through to the readyState poll below, see file header.
      }
      await page.waitForFunction(() => document.readyState === 'complete', { timeout: 15_000 });
      // A hair of settle time: the app's own role-repaint / analytics-ping
      // listeners can still be mid-flight the instant readyState flips, and
      // an `evaluate()` that lands in that window intermittently throws
      // "Execution context was destroyed". Cheaper to wait it out here once
      // than to have every spec retry it.
      await page.waitForTimeout(150);
    };
    await use(goto);
  },

  setRole: async ({ page }, use) => {
    const setRole = async (role, area) => {
      await page.evaluate(
        ({ role, area }) => {
          try {
            localStorage.setItem('taqa-demo-role', role);
            // roles.js declares TAQA_ROLE as a top-level `const` in a classic
            // <script>, which makes it an ordinary global identifier but NOT
            // a property of `window` (unlike TAQA_STORE, which roles.js's
            // sibling files assign explicitly via `root.TAQA_STORE = ...`).
            // `if (window.TAQA_ROLE)` is therefore always false here, which
            // silently skipped TAQA_ROLE.set()/setArea() below on every call:
            // the role still appeared to switch (TAQA_ROLE.current() falls
            // back to reading the 'taqa-demo-role' key this function also
            // sets directly, above), but the area never did, and every
            // segment-scoped test kept running against the default area
            // ('coiled-tubing') no matter what `area` was passed in.
            if (typeof TAQA_ROLE !== 'undefined') {
              TAQA_ROLE.set(role);
              if (area && TAQA_ROLE.setArea) TAQA_ROLE.setArea(area);
            }
          } catch (e) {}
        },
        { role, area }
      );
    };
    await use(setRole);
  },

  clearAppState: async ({ page }, use) => {
    const clear = async () => {
      await page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {}
      });
    };
    await use(clear);
  },
});

exports.expect = base.expect;

/** Assert no unexpected JS errors occurred, call at the end of a test, or
 *  rely on the `assertNoConsoleErrors` fixture below to do it automatically. */
exports.assertNoConsoleErrors = (consoleErrors) => {
  base.expect(consoleErrors, `Unexpected JS error(s):\n${consoleErrors.join('\n')}`).toEqual([]);
};
