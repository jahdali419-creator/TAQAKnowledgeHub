// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// This app is served as plain static files (no build step). Playwright
// starts a minimal static server for the test run and tears it down after,
// so `npm test` is the only command another developer needs.
const PORT = process.env.TAQA_TEST_PORT || 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// The sandbox this suite was authored in ships only a pinned Chromium at
// PLAYWRIGHT_BROWSERS_PATH (no `playwright install` is available there), so
// the chromium project pins that binary explicitly. On a normal developer
// machine, remove `executablePath` (or leave PLAYWRIGHT_BROWSERS_PATH unset)
// and run `npx playwright install`, Firefox and WebKit need that install
// there too; this repo does not vendor those binaries.
const CHROMIUM_PATH = process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium';
const fs = require('fs');
const hasPinnedChromium = fs.existsSync(CHROMIUM_PATH);

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 8_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    // shared.js registers the service worker and reloads the page on
    // 'controllerchange' (the standard PWA update pattern: a real visitor's
    // tab picks up the new build without a manual refresh). Every test here
    // starts from a fresh, storage-isolated context, so that install/activate
    // cycle runs fresh every time too, and its reload can land mid-test,
    // destroying whatever page/evaluate call is in flight and racing the
    // next navigation. That reload is correct app behavior, not a bug, and
    // it is offline.html's and offline.spec.js's concern to exercise, not
    // this suite's, so it is turned off here and re-enabled with
    // `test.use({ serviceWorkers: 'allow' })` in the spec that actually
    // tests the service worker.
    serviceWorkers: 'block',
  },

  // Starts a static server before the suite and reuses it locally if you
  // already have one running on this port (`npm run serve`).
  //
  // Uses `http-server` (a devDependency-free npx package, already available
  // wherever Node/npm is) rather than `python3 -m http.server`: Python's
  // server handles one connection at a time, and this suite's default
  // `fullyParallel: true` opens many browser contexts against it at once,
  // under that load requests intermittently stalled and failed with no
  // server-side error at all. `http-server` handles concurrent requests
  // and the suite is reliable under it. `python3 -m http.server` still
  // works fine for manually poking at the app (`npm run serve:python`);
  // it just is not concurrency-safe enough to be the test runner's server.
  webServer: {
    command: `npx http-server -p ${PORT} -a 127.0.0.1 -c-1 --silent`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        ...(hasPinnedChromium ? { launchOptions: { executablePath: CHROMIUM_PATH } } : {}),
      },
    },
    // Requires `npx playwright install firefox` on a machine that has one.
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } },
    },
    // Requires `npx playwright install webkit` on a machine that has one.
    // WebKit is the closest local stand-in for Safari/iOS behavior, which
    // matters here since a real share of this app's traffic is mobile.
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
        ...(hasPinnedChromium ? { launchOptions: { executablePath: CHROMIUM_PATH } } : {}),
      },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
  ],
});
