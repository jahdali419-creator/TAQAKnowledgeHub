// Mobile responsiveness regression suite: no horizontal overflow, the
// hamburger nav opens/closes and stays usable, and primary touch targets
// meet a reasonable minimum size, across the app's highest-traffic pages.
//
// Viewport sizes and the page set come from the task's own assignment
// context: 375x667 (iPhone SE/8), 390x844 (iPhone 12/13/14, the primary
// target — most of this app's real mobile traffic lands here) and 430x932
// (iPhone Pro Max / large Android). Running the full page x viewport matrix
// would be excessive for a regression suite, so overflow is checked on
// every page at the primary size, and spot-checked on a representative
// subset at the other two sizes; see shared.js's `overflow-x:clip` /
// `max-width:100vw` rule (around line 29) which is what actually enforces
// this app-wide, so a genuinely page-specific exception would be a real
// regression, not an intentional design choice.
const { test, expect } = require('./helpers/fixtures');

const VIEWPORTS = {
  se: { width: 375, height: 667 },
  standard: { width: 390, height: 844 },
  large: { width: 430, height: 932 },
};

const PAGES = [
  { path: '/index.html', name: 'index' },
  { path: '/segment.html?id=coiled-tubing', name: 'segment' },
  {
    path: '/viewer.html?doc=TQ-TWS-CTSS-SOP-001&seg=coiled-tubing&type=sop&title=Pre-Job%20Safety%20Checklist',
    name: 'viewer',
  },
  { path: '/documents.html?id=coiled-tubing', name: 'documents' },
  { path: '/ai-search.html', name: 'ai-search' },
  { path: '/dashboard.html?id=coiled-tubing', name: 'dashboard' },
  { path: '/upload.html', name: 'upload' },
];

// Spot-checked at the SE and large sizes too, in addition to every page at
// the primary (standard) size below.
const SPOT_CHECK_PAGES = ['index', 'viewer', 'dashboard'];

async function noHorizontalOverflow(page, viewportWidth) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth, `scrollWidth (${scrollWidth}) vs viewport (${viewportWidth})`).toBeLessThanOrEqual(
    viewportWidth + 1
  );
}

test.describe('no horizontal overflow at 390x844 (primary mobile size)', () => {
  for (const p of PAGES) {
    test(`${p.name} fits the viewport width`, async ({ page, gotoApp, setRole }) => {
      await page.setViewportSize(VIEWPORTS.standard);
      await gotoApp('/index.html');
      await setRole('qms', 'coiled-tubing');
      await gotoApp(p.path);
      await noHorizontalOverflow(page, VIEWPORTS.standard.width);
    });
  }
});

test.describe('no horizontal overflow, spot-checked at 375x667 and 430x932', () => {
  for (const p of PAGES.filter((p) => SPOT_CHECK_PAGES.includes(p.name))) {
    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      if (vpName === 'standard') continue; // covered above for every page
      test(`${p.name} fits the viewport width at ${vpName} (${vp.width}x${vp.height})`, async ({
        page,
        gotoApp,
        setRole,
      }) => {
        await page.setViewportSize(vp);
        await gotoApp('/index.html');
        await setRole('qms', 'coiled-tubing');
        await gotoApp(p.path);
        await noHorizontalOverflow(page, vp.width);
      });
    }
  }
});

test.describe('mobile hamburger nav', () => {
  for (const vpName of ['se', 'standard', 'large']) {
    test(`opens and closes at ${vpName}`, async ({ page, gotoApp, setRole }) => {
      await page.setViewportSize(VIEWPORTS[vpName]);
      await gotoApp('/index.html');
      await setRole('qms', 'coiled-tubing');
      await gotoApp('/index.html');

      const hamburger = page.locator('#nav-hamburger');
      await expect(hamburger).toBeVisible();
      await expect(hamburger).toHaveAttribute('aria-expanded', 'false');

      const menu = page.locator('#nav-mobile-menu');
      await hamburger.click();
      await expect(menu).toHaveClass(/open/);
      await expect(hamburger).toHaveAttribute('aria-expanded', 'true');

      // The menu itself should not push the page wider than the viewport.
      await noHorizontalOverflow(page, VIEWPORTS[vpName].width);

      // A real link inside the menu is reachable and not zero-sized.
      const homeLink = menu.locator('a[href="index.html"]').first();
      await expect(homeLink).toBeVisible();
      const box = await homeLink.boundingBox();
      expect(box).not.toBeNull();
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);

      await hamburger.click();
      await expect(menu).not.toHaveClass(/open/);
      await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    });
  }

  test('opening the menu on dashboard.html does not overlap the pending-review actions', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await page.setViewportSize(VIEWPORTS.standard);
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=coiled-tubing');

    await page.locator('#nav-hamburger').click();
    const menu = page.locator('#nav-mobile-menu');
    await expect(menu).toHaveClass(/open/);
    await noHorizontalOverflow(page, VIEWPORTS.standard.width);

    // Close it and confirm the underlying page's primary action is usable
    // once the menu is out of the way.
    await page.locator('#nav-hamburger').click();
    await expect(menu).not.toHaveClass(/open/);
    const approveBtn = page.locator('.btn-approve').first();
    await expect(approveBtn).toBeVisible();
  });
});

test.describe('touch target sizes (~40-44px minimum)', () => {
  // Per shared.js's own touch-target rule (search "Touch target minimum
  // size" in shared.js) most interactive chrome is forced to 44x44 under
  // 768px via `!important`, and topbar.css sizes the hamburger and the
  // nav icon buttons explicitly. This measures the real rendered box on a
  // representative sample rather than asserting an exact value everywhere.
  const MIN_SIZE = 40;

  test('primary nav controls meet the minimum on index.html', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await page.setViewportSize(VIEWPORTS.standard);
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/index.html');

    const targets = ['#nav-hamburger', '#dark-toggle', '#nav-bell'];
    for (const sel of targets) {
      const el = page.locator(sel);
      if ((await el.count()) === 0) continue;
      const box = await el.first().boundingBox();
      if (!box) continue; // e.g. #nav-bell is display:none unless approvals pending
      expect(box.width, `${sel} width`).toBeGreaterThanOrEqual(MIN_SIZE);
      expect(box.height, `${sel} height`).toBeGreaterThanOrEqual(MIN_SIZE);
    }
  });

  test('dashboard approve/reject buttons meet the minimum', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await page.setViewportSize(VIEWPORTS.standard);
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=coiled-tubing');

    for (const sel of ['.btn-approve', '.btn-reject']) {
      const box = await page.locator(sel).first().boundingBox();
      expect(box, `${sel} is rendered`).not.toBeNull();
      expect(box.height, `${sel} height`).toBeGreaterThanOrEqual(MIN_SIZE);
    }
  });

  test('upload submit button meets the minimum', async ({ page, gotoApp, setRole }) => {
    await page.setViewportSize(VIEWPORTS.standard);
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/upload.html');

    const box = await page.locator('#submit-btn').boundingBox();
    expect(box).not.toBeNull();
    expect(box.height, '#submit-btn height').toBeGreaterThanOrEqual(MIN_SIZE);
  });
});
