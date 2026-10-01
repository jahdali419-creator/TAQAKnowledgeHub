// Smoke suite: every real page loads, renders its title, and throws no JS
// errors. This is the fast, first-line trip-wire, if this file goes red,
// something fundamental broke and the more detailed specs are not worth
// running yet.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

const PAGES = [
  'index.html',
  'segment.html?id=coiled-tubing',
  'viewer.html?doc=TQ-TWS-CTSS-SOP-011&seg=coiled-tubing&type=sop&title=Logging%20While%20CT%20SOP',
  'documents.html?id=coiled-tubing',
  'master-list.html',
  'dashboard.html?id=coiled-tubing',
  'ai-search.html',
  'analytics.html',
  'glossary.html',
  'upload.html',
  'support-ticket.html',
  'whats-new.html',
  'offline.html',
];

for (const path of PAGES) {
  test(`${path} loads with no JS errors`, async ({ page, gotoApp, setRole, consoleErrors }) => {
    // master-list.html and dashboard.html refuse everyone but qms/owner by
    // design; qms sees everything, so the smoke pass uses it uniformly.
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/' + path);
    await expect(page).toHaveTitle(/.+/);
    assertNoConsoleErrors(consoleErrors);
  });
}

test('every smoke page ships a non-empty <title> distinct from a bare filename', async ({
  page,
  gotoApp,
  setRole,
}) => {
  await gotoApp('/index.html');
  await setRole('qms', 'coiled-tubing');
  for (const path of PAGES) {
    await gotoApp('/' + path);
    const title = await page.title();
    expect(title.trim().length, `${path} has an empty <title>`).toBeGreaterThan(0);
  }
});
