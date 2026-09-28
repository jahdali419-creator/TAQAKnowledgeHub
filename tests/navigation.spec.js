// Regression suite for the shared global navigation/topbar: the same
// <nav id="navbar"> markup every page carries (topbar.css), wired up at
// runtime by shared.js. Every claim here was checked against the real code
// first (shared.js, roles.js, topbar.css, index.html/segment.html's actual
// <nav> markup), not assumed from a "typical" nav bar.
//
// A few things worth knowing going in, because they shape the assertions:
//
//  - The Areas dropdown (and the phone menu's Areas list) only ever render
//    the register's "segment" / "function" / "product" groups (shared.js's
//    FAM list). "Company Wide" is handled as its own row; areas whose org
//    placement is still "Pending Reassignment" (group 'pending', e.g.
//    tws-maintenance) are not linked from either at all. That is
//    deliberate (see shared.js's FAM and the door's own 5-group picker,
//    which explicitly labels that 5th group "Pending Reassignment"), so
//    the test asserts that real subset, not the full register.
//  - The approvals bell is shown for a role that can sign something
//    (cap.approve || cap.countersign from TAQA_ROLE.effective()), not
//    directly by controlPanel: owner and qms hold approve/countersign and
//    also controlPanel, but auditor holds controlPanel with neither
//    approve nor countersign, and the code (shared.js's bell `sync()`)
//    hides the bell for auditor. Verified by reading the code, not assumed.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');
const { loadRegisterDetail } = require('./helpers/areaGroups');

test.describe('Logo / brand link', () => {
  test('navigates to index.html from another page', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/segment.html?id=coiled-tubing');
    await clearAppState();
    await gotoApp('/segment.html?id=coiled-tubing');

    const logo = page.locator('#navbar .nav-brand');
    await expect(logo).toHaveAttribute('href', 'index.html');
    await logo.click();
    await expect(page).toHaveURL(/\/index\.html$/);
  });
});

test.describe('Areas dropdown', () => {
  test('opens and closes via its button, toggling aria-expanded and the panel', async ({
    page,
    gotoApp,
    clearAppState,
  }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');

    const btn = page.locator('#seg-dropdown-btn');
    const panel = page.locator('#nav-areas-panel');

    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();

    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();

    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();
  });

  test('lists the real areas from the register: Company Wide plus every segment/function/product area, nothing else', async ({
    page,
    gotoApp,
    clearAppState,
  }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');

    const { byGroup } = loadRegisterDetail();
    const expectedIds = [
      ...(byGroup.company || []),
      ...(byGroup.segment || []),
      ...(byGroup.function || []),
      ...(byGroup.product || []),
    ].sort();

    await page.locator('#seg-dropdown-btn').click();
    const panel = page.locator('#nav-areas-panel');
    await expect(panel).toBeVisible();

    const hrefs = await panel
      .locator('a[href*="segment.html?id="]')
      .evaluateAll((as) => as.map((a) => new URLSearchParams(a.getAttribute('href').split('?')[1] || '').get('id')));

    expect([...new Set(hrefs)].sort()).toEqual(expectedIds);

    // Areas still "Pending Reassignment" are verified absent, not assumed.
    for (const pendingId of byGroup.pending || []) {
      expect(hrefs).not.toContain(pendingId);
    }
  });
});

test.describe('Primary nav links', () => {
  const CASES = [
    { label: 'Document Search', href: 'ai-search.html' },
    { label: 'Field Glossary', href: 'glossary.html' },
    { label: 'Ask Expert', href: 'support-ticket.html' },
  ];

  for (const { label, href } of CASES) {
    test(`"${label}" points to ${href} and navigates there`, async ({ page, gotoApp, clearAppState }) => {
      await gotoApp('/index.html');
      await clearAppState();
      await gotoApp('/index.html');

      const link = page.locator('#navbar .nav-links > li > a', { hasText: label });
      await expect(link).toHaveAttribute('href', href);
      await link.click();
      await expect(page).toHaveURL(new RegExp(href.replace('.', '\\.') + '$'));
    });
  }
});

test.describe('Master List link (registerView roles only)', () => {
  for (const role of ['employee', 'owner']) {
    test(`is not in the nav for ${role}`, async ({ page, gotoApp, setRole }) => {
      await gotoApp('/index.html');
      await setRole(role, 'coiled-tubing');
      await gotoApp('/index.html');
      await expect(page.locator('#navbar .nav-links a[href="master-list.html"]')).toHaveCount(0);
    });
  }

  for (const role of ['qms', 'auditor']) {
    test(`is visible and opens the real Master List (not the refusal page) for ${role}`, async ({
      page,
      gotoApp,
      setRole,
      consoleErrors,
    }) => {
      await gotoApp('/index.html');
      await setRole(role, 'coiled-tubing');
      await gotoApp('/index.html');

      const link = page.locator('#navbar .nav-links a[href="master-list.html"]');
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(/master-list\.html/);
      await expect(page.locator('h1')).toHaveText('Master Document List');
      await expect(page.getByText("document controller’s view")).toHaveCount(0);
      assertNoConsoleErrors(consoleErrors);
    });
  }

  test('a role without registerView is refused if it opens master-list.html directly', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await gotoApp('/index.html');
    await setRole('employee', 'coiled-tubing');
    await gotoApp('/master-list.html');
    await expect(page.getByText("The Master List is the document controller’s view")).toBeVisible();
  });
});

test.describe('Upload link (editMetadata roles only)', () => {
  for (const role of ['employee', 'auditor']) {
    test(`is not in the nav for ${role}`, async ({ page, gotoApp, setRole }) => {
      await gotoApp('/index.html');
      await setRole(role, 'coiled-tubing');
      await gotoApp('/index.html');
      await expect(page.locator('#navbar a[href="upload.html"]')).toHaveCount(0);
    });
  }

  for (const role of ['owner', 'qms']) {
    test(`is visible and points at upload.html for ${role}`, async ({ page, gotoApp, setRole }) => {
      await gotoApp('/index.html');
      await setRole(role, 'coiled-tubing');
      await gotoApp('/index.html');
      const link = page.locator('#navbar a.nav-cta.nav-up');
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', 'upload.html');
      await link.click();
      await expect(page).toHaveURL(/upload\.html/);
    });
  }
});

test.describe('Approvals bell', () => {
  // shared.js's bell sync() shows the bell for a role that can sign
  // something right now (cap.approve || cap.countersign), not for
  // controlPanel alone. owner (approve) and qms (countersign) show it;
  // employee and auditor do not, confirmed by reading shared.js's sync().
  const CASES = [
    { role: 'employee', visible: false },
    { role: 'owner', visible: true },
    { role: 'qms', visible: true },
    { role: 'auditor', visible: false },
  ];

  for (const { role, visible } of CASES) {
    test(`is ${visible ? 'visible' : 'hidden'} for ${role}`, async ({ page, gotoApp, setRole }) => {
      await gotoApp('/index.html');
      await setRole(role, 'coiled-tubing');
      await gotoApp('/index.html');
      const bell = page.locator('#nav-bell');
      if (visible) await expect(bell).toBeVisible();
      else await expect(bell).toBeHidden();
    });
  }

  test('opening it toggles aria-expanded and shows a menu', async ({ page, gotoApp, setRole }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/index.html');
    const bell = page.locator('#nav-bell');
    await expect(bell).toHaveAttribute('aria-expanded', 'false');
    await bell.click();
    await expect(bell).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.bell-menu')).toBeVisible();
  });
});

test.describe('Bookmarks', () => {
  test('the icon opens a bookmarks panel showing what was bookmarked', async ({
    page,
    gotoApp,
    clearAppState,
  }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');

    await page.evaluate(() => {
      window.TAQA_Bookmarks.add({
        title: 'TQ-TWS-CTSS-SOP-001  Pre-Job Safety Checklist',
        type: 'sop',
        segId: 'coiled-tubing',
        segName: 'Coiled Tubing',
      });
    });

    const trigger = page.locator('#nav-bm');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const panel = page.locator('#bm-panel');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('role', 'dialog');
    await expect(panel.locator('.bm-item')).toHaveCount(1);
    await expect(panel.locator('.bm-t')).toHaveText('Pre-Job Safety Checklist');
  });

  test('closes via its icon', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');
    const trigger = page.locator('#nav-bm');
    const panel = page.locator('#bm-panel');
    await trigger.click();
    await expect(panel).toBeVisible();
    await trigger.click();
    await expect(panel).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('Dark mode toggle', () => {
  test('flips data-taqa-theme and the taqa-theme-v3 storage key, and persists across a reload', async ({
    page,
    gotoApp,
    clearAppState,
  }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');

    await expect(page.locator('html')).toHaveAttribute('data-taqa-theme', 'light');
    expect(await page.evaluate(() => localStorage.getItem('taqa-theme-v3'))).toBeNull();

    await page.locator('#dark-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-taqa-theme', 'dark');
    expect(await page.evaluate(() => localStorage.getItem('taqa-theme-v3'))).toBe('dark');

    await gotoApp('/index.html');
    await expect(page.locator('html')).toHaveAttribute('data-taqa-theme', 'dark');

    await page.locator('#dark-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-taqa-theme', 'light');
    expect(await page.evaluate(() => localStorage.getItem('taqa-theme-v3'))).toBe('light');
  });
});

test.describe('The door (role / identity switcher)', () => {
  test('changing role updates TAQA_ROLE.current() and its storage key', async ({
    page,
    gotoApp,
    clearAppState,
  }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');

    expect(await page.evaluate(() => window.TAQA_ROLE.current())).toBe('employee');

    await page.locator('#taqa-door .door-btn').click();
    await expect(page.locator('#taqa-door .door-menu')).toBeVisible();
    await page.locator('#taqa-door .door-i[data-role="qms"]').click();

    // TAQA_ROLE.set() reloads the page; wait for the door's own caption to
    // reflect the new role rather than racing the reload directly.
    await expect(page.locator('#taqa-door .door-btn')).toHaveAttribute(
      'title',
      /QMS \/ Document Controller/,
      { timeout: 10000 }
    );
    await page.waitForTimeout(150);

    expect(await page.evaluate(() => window.TAQA_ROLE.current())).toBe('qms');
    expect(await page.evaluate(() => localStorage.getItem('taqa-demo-role'))).toBe('qms');
  });

  test('area selection updates TAQA_ROLE.area() for a scoped role', async ({ page, gotoApp, setRole }) => {
    await gotoApp('/index.html');
    await setRole('owner', 'coiled-tubing');
    await gotoApp('/index.html');

    await page.locator('#taqa-door .door-btn').click();
    const areaSelect = page.locator('#taqa-door #door-area-sel');
    await expect(areaSelect).toBeVisible();
    await areaSelect.selectOption('fracturing');

    await expect(page.locator('#taqa-door .door-btn')).toHaveAttribute('title', /Fracturing/, {
      timeout: 10000,
    });
    await page.waitForTimeout(150);

    expect(await page.evaluate(() => window.TAQA_ROLE.area())).toBe('fracturing');
    expect(await page.evaluate(() => localStorage.getItem('taqa-demo-area'))).toBe('fracturing');
  });

  test('opening the door toggles aria-expanded', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');
    const btn = page.locator('#taqa-door .door-btn');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('Mobile: hamburger menu', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('opens and closes, toggling aria-expanded', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');

    const hb = page.locator('#nav-hamburger');
    const menu = page.locator('#nav-mobile-menu');

    await expect(hb).toBeVisible();
    await expect(hb).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeHidden();

    await hb.click();
    await expect(hb).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toBeVisible();

    await hb.click();
    await expect(hb).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeHidden();
  });

  test('Escape closes it and returns focus to the hamburger', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');
    const hb = page.locator('#nav-hamburger');
    await hb.click();
    await expect(page.locator('#nav-mobile-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#nav-mobile-menu')).toBeHidden();
    await expect(hb).toBeFocused();
  });

  test('the menu carries Master List and Upload for a role that holds them', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/index.html');
    await page.locator('#nav-hamburger').click();
    const menu = page.locator('#nav-mobile-menu');
    await expect(menu.locator('a[href="master-list.html"]')).toBeVisible();
  });

  test('only one of the bar\'s popovers (menu, bell) is open at a time', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    // owner holds approve, so the bell is drawn even at this width (it is
    // not in topbar.css's <=1180px hidden list, unlike Areas/door/nav-bm).
    await gotoApp('/index.html');
    await setRole('owner', 'coiled-tubing');
    await gotoApp('/index.html');

    const hb = page.locator('#nav-hamburger');
    const menu = page.locator('#nav-mobile-menu');
    const bell = page.locator('#nav-bell');
    await expect(bell).toBeVisible();

    await hb.click();
    await expect(menu).toBeVisible();

    await bell.click();
    await expect(page.locator('.bell-menu')).toBeVisible();
    await expect(menu).toBeHidden();
    await expect(hb).toHaveAttribute('aria-expanded', 'false');

    await hb.click();
    await expect(menu).toBeVisible();
    await expect(page.locator('.bell-menu')).toBeHidden();
  });
});

test.describe('Popovers are mutually exclusive on desktop, and Escape / click-outside close them with focus returning', () => {
  test('opening Areas, then Bookmarks, then the door closes whichever was open before', async ({
    page,
    gotoApp,
    clearAppState,
  }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');

    const areasBtn = page.locator('#seg-dropdown-btn');
    const areasPanel = page.locator('#nav-areas-panel');
    const bmTrigger = page.locator('#nav-bm');
    const bmPanel = page.locator('#bm-panel');
    const doorBtn = page.locator('#taqa-door .door-btn');
    const doorMenu = page.locator('#taqa-door .door-menu');

    await areasBtn.click();
    await expect(areasPanel).toBeVisible();

    await bmTrigger.click();
    await expect(bmPanel).toBeVisible();
    await expect(areasPanel).toBeHidden();
    await expect(areasBtn).toHaveAttribute('aria-expanded', 'false');

    await doorBtn.click();
    await expect(doorMenu).toBeVisible();
    await expect(bmPanel).toBeHidden();
  });

  test('Escape closes the Areas dropdown and returns focus to its button', async ({
    page,
    gotoApp,
    clearAppState,
  }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');
    const btn = page.locator('#seg-dropdown-btn');
    await btn.click();
    await expect(page.locator('#nav-areas-panel')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#nav-areas-panel')).toBeHidden();
    await expect(btn).toBeFocused();
  });

  test('clicking outside closes the Areas dropdown', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');
    await page.locator('#seg-dropdown-btn').click();
    await expect(page.locator('#nav-areas-panel')).toBeVisible();
    await page.locator('footer').click();
    await expect(page.locator('#nav-areas-panel')).toBeHidden();
  });

  test('Escape closes the Bookmarks panel and returns focus to its trigger', async ({
    page,
    gotoApp,
    clearAppState,
  }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');
    const trigger = page.locator('#nav-bm');
    await trigger.click();
    await expect(page.locator('#bm-panel')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#bm-panel')).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('clicking outside closes the Bookmarks panel', async ({ page, gotoApp, clearAppState }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');
    await page.locator('#nav-bm').click();
    await expect(page.locator('#bm-panel')).toBeVisible();
    await page.locator('footer').click();
    await expect(page.locator('#bm-panel')).toBeHidden();
  });

  test('Escape closes the door menu and returns focus to its button', async ({
    page,
    gotoApp,
    clearAppState,
  }) => {
    await gotoApp('/index.html');
    await clearAppState();
    await gotoApp('/index.html');
    const btn = page.locator('#taqa-door .door-btn');
    await btn.click();
    await expect(page.locator('#taqa-door .door-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#taqa-door .door-menu')).toBeHidden();
    await expect(btn).toBeFocused();
  });
});
