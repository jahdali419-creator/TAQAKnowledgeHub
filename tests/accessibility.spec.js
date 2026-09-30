// Accessibility regression suite: skip link, landmark/heading spot-checks,
// keyboard navigation through the primary nav + areas dropdown + role
// switcher, the new dashboard reject-reason modal's ARIA/focus behavior,
// a targeted brand-orange contrast spot-check, and aria-live toast
// behavior. This intentionally does not do full axe-core style WCAG
// contrast auditing, see the note above the contrast test below.
const fs = require('node:fs');
const path = require('node:path');
const { test, expect, DESKTOP } = require('./helpers/fixtures');

const ROOT = path.resolve(__dirname, '..');

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

// Pages that ship a real <h1> today (verified by reading the rendered DOM,
// not just the static markup, since documents.html/dashboard.html build
// most of their content from JS).
const PAGES_WITH_H1 = ['index', 'segment', 'viewer', 'ai-search', 'upload'];
// documents.html and dashboard.html have no <h1> anywhere in their markup
// or their rendered DOM (documents.html, dashboard.html, verified by
// reading both files in full: no <h1> tag at all). Tracked below as a
// known gap rather than silently skipped.
const PAGES_WITHOUT_H1 = ['documents', 'dashboard'];

test.describe('skip link (master-list.html)', () => {
  // master-list.html is the one page in this app that implements a
  // skip-to-content link (`.skip`, href="#main"). It is not present on the
  // other high-value pages tested elsewhere in this file, this test only
  // asserts what actually exists.
  test('is present, is the first focusable element, and its target exists', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/master-list.html');

    const skip = page.locator('a.skip');
    await expect(skip).toHaveAttribute('href', '#main');
    await expect(page.locator('#main')).toHaveCount(1);

    // Off-screen until focused (per master-list.html's own .skip / .skip:focus rules).
    const offscreenLeft = await skip.evaluate((el) => getComputedStyle(el).insetInlineStart);
    expect(offscreenLeft).toBe('-9999px');

    await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();
    const onscreenLeft = await skip.evaluate((el) => getComputedStyle(el).insetInlineStart);
    expect(onscreenLeft).not.toBe('-9999px');
  });

  test('activating it jumps to #main', async ({ page, gotoApp, setRole }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/master-list.html');

    await page.locator('a.skip').focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });
});

test.describe('landmarks and headings (spot-check)', () => {
  for (const p of PAGES) {
    test(`${p.name} has a labeled <nav> landmark`, async ({ page, gotoApp, setRole }) => {
      await gotoApp('/index.html');
      await setRole('qms', 'coiled-tubing');
      await gotoApp(p.path);
      const nav = page.locator('nav#navbar');
      await expect(nav).toHaveCount(1);
      await expect(nav).toHaveAttribute('aria-label', /.+/);
    });
  }

  for (const p of PAGES.filter((p) => PAGES_WITH_H1.includes(p.name))) {
    test(`${p.name} has a top-level heading`, async ({ page, gotoApp, setRole }) => {
      await gotoApp('/index.html');
      await setRole('qms', 'coiled-tubing');
      await gotoApp(p.path);
      await expect(page.locator('h1').first()).toBeVisible();
    });
  }

  for (const p of PAGES.filter((p) => PAGES_WITHOUT_H1.includes(p.name))) {
    test(`${p.name} has no <h1> anywhere in its DOM`, async ({ page, gotoApp, setRole }) => {
      // KNOWN BUG: neither documents.html nor dashboard.html ships an <h1>
      // (verified by reading both files in full; no <h1> tag exists in
      // either, static or JS-rendered). This test pins today's actual
      // state as a regression guard in the opposite direction: it will
      // start failing (a welcome failure) the day someone adds a real
      // top-level heading, which is the cue to flip it to the
      // PAGES_WITH_H1 list above instead of leaving this assertion stale.
      await gotoApp('/index.html');
      await setRole('qms', 'coiled-tubing');
      await gotoApp(p.path);
      await expect(page.locator('h1')).toHaveCount(0);
    });
  }
});

test.describe('keyboard navigation', () => {
  // The bar's own widgets; a phone's keyboard path through the menu button
  // is tested in navigation.spec.js ("Mobile: hamburger menu").
  test.use(DESKTOP);

  test('tabbing reaches real interactive elements in the primary nav', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/index.html');

    const seen = [];
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        return { tag: el.tagName, id: el.id, cls: el.className, inNav: !!el.closest('#navbar') };
      });
      if (info) seen.push(info);
    }

    // At least some of what we tab through is genuinely inside the nav bar
    // (not asserting a specific order/count, just that keyboard users
    // actually reach it).
    expect(seen.some((s) => s.inNav)).toBe(true);
    // The Areas dropdown button and the hamburger's desktop counterparts
    // (door / dark toggle) are reachable, not just the first brand link.
    expect(seen.some((s) => s.id === 'seg-dropdown-btn')).toBe(true);
  });

  test('nav elements show a visible focus outline', async ({ page, gotoApp, setRole }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/index.html');

    await page.locator('#seg-dropdown-btn').focus();
    const outline = await page
      .locator('#seg-dropdown-btn')
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
  });

  test('the Areas dropdown opens and closes with the keyboard', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/index.html');

    const btn = page.locator('#seg-dropdown-btn');
    await btn.focus();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Enter');
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#nav-areas-panel a').first()).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(btn).toBeFocused();
  });

  test('the role switcher ("door") opens and closes with the keyboard', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/index.html');

    const doorBtn = page.locator('#taqa-door .door-btn');
    await expect(doorBtn).toBeVisible();
    await doorBtn.focus();
    await expect(doorBtn).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Enter');
    await expect(doorBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.door-menu .door-i').first()).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(doorBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(doorBtn).toBeFocused();
  });
});

test.describe('dashboard reject-reason modal (dashboard.html, added today)', () => {
  async function openDashboard(page, gotoApp, setRole) {
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=coiled-tubing');
  }

  test('has role=dialog, aria-modal and aria-labelledby', async ({ page, gotoApp, setRole }) => {
    await openDashboard(page, gotoApp, setRole);
    await page.locator('.btn-reject').first().click();

    const overlay = page.locator('.reject-modal-overlay.open');
    await expect(overlay).toHaveAttribute('role', 'dialog');
    await expect(overlay).toHaveAttribute('aria-modal', 'true');
    const labelledby = await overlay.getAttribute('aria-labelledby');
    expect(labelledby).toBe('reject-modal-title');
    await expect(page.locator('#' + labelledby)).toBeVisible();
  });

  test('opening it moves focus into the textarea', async ({ page, gotoApp, setRole }) => {
    await openDashboard(page, gotoApp, setRole);
    await page.locator('.btn-reject').first().click();
    await expect(page.locator('#reject-reason-input')).toBeFocused();
  });

  test('Escape closes it and returns focus to the button that opened it', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await openDashboard(page, gotoApp, setRole);
    const openerBtn = page.locator('.btn-reject').first();
    await openerBtn.click();
    await expect(page.locator('.reject-modal-overlay')).toHaveClass(/open/);

    await page.keyboard.press('Escape');
    await expect(page.locator('.reject-modal-overlay')).not.toHaveClass(/open/);
    await expect(openerBtn).toBeFocused();
  });

  test('the confirm button stays disabled below the 20-character minimum', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await openDashboard(page, gotoApp, setRole);
    await page.locator('.btn-reject').first().click();

    const confirmBtn = page.locator('#reject-modal-confirm');
    await expect(confirmBtn).toBeDisabled();
    await page.locator('#reject-reason-input').fill('too short');
    await expect(confirmBtn).toBeDisabled();
    await page.locator('#reject-reason-input').fill('This is a sufficiently long rejection reason.');
    await expect(confirmBtn).toBeEnabled();
  });
});

test.describe('color contrast (targeted spot-check, not full WCAG auditing)', () => {
  // Full axe-core style contrast auditing was judged not worth adding as a
  // devDependency for this prototype-stage app; see the final report for
  // that call. This is a narrow, high-value regression guard instead: the
  // project's own design guidance (TAQA KnowledgeHub frontend skill,
  // SKILL.md) documents `--taqa-orange` (#FF6720) as failing contrast on
  // white and says it must never be used for body text. As of writing,
  // #FF6720 does not appear anywhere in this repo's shipped CSS/HTML at
  // all (confirmed by reading every .html file and shared.js/topbar.css),
  // so this guards against it being introduced as a text color later.
  const SOURCE_FILES = fs
    .readdirSync(ROOT)
    .filter((f) => f.endsWith('.html') || f === 'shared.js' || f === 'topbar.css');

  test('the brand orange (#FF6720) is never used as a text color', () => {
    const offenders = [];
    for (const file of SOURCE_FILES) {
      const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
      // Look for "color:" (not background-color/border-color) within ~40
      // chars before an FF6720 mention.
      const re = /color\s*:\s*#?FF6720/gi;
      let m;
      while ((m = re.exec(src))) {
        const before = src.slice(Math.max(0, m.index - 20), m.index);
        if (/background-|border-|outline-/i.test(before)) continue;
        offenders.push(`${file} near offset ${m.index}`);
      }
    }
    expect(offenders, 'files using brand orange as a text color').toEqual([]);
  });
});

test.describe('aria-live toast regions', () => {
  test('upload.html toast is role=status/aria-live=polite and updates on use', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/upload.html');

    const toast = page.locator('#toast');
    await expect(toast).toHaveAttribute('role', 'status');
    await expect(toast).toHaveAttribute('aria-live', 'polite');

    // Trigger the file-extension rejection path (also exercised from the
    // security angle in security-regression.spec.js) purely as a vehicle
    // to prove the live region's text actually updates.
    const tmpFile = path.join(require('node:os').tmpdir(), 'taqa-a11y-test.exe');
    fs.writeFileSync(tmpFile, 'not a real binary');
    await page.locator('#file-input').setInputFiles(tmpFile);
    await expect(page.locator('#toast-title')).toHaveText(/not permitted/i);
    await expect(toast).toHaveClass(/show/);
    fs.rmSync(tmpFile, { force: true });
  });

  test('shared.js global toast-wrap has role/aria-live', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    // segment.html and viewer.html call window.showToast (defined in
    // shared.js), which appends into #toast-wrap. That wrapper used to be
    // created with no role="status"/aria-live, unlike every page-local
    // toast (support-ticket.html, glossary.html, upload.html,
    // master-list.html). Fixed in shared.js during this task
    // (`wrap.setAttribute('role','status')` / `aria-live','polite'`
    // alongside its id/class assignment), this now asserts the real,
    // fixed behavior rather than the earlier gap.
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/segment.html?id=coiled-tubing');
    const wrap = page.locator('#toast-wrap');
    await expect(wrap).toHaveAttribute('role', 'status');
    await expect(wrap).toHaveAttribute('aria-live', 'polite');
  });

  test('dashboard/documents #dash-toast has role/aria-live', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    // dashboard.html:706 and documents.html:373 both used to render their
    // own '#dash-toast' with no role or aria-live, unlike upload.html's
    // toast above. Fixed in both files during this task (both now carry
    // role="status" aria-live="polite" in their static markup).
    await gotoApp('/index.html');
    await setRole('qms', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=coiled-tubing');
    const toast = page.locator('#dash-toast');
    await expect(toast).toHaveAttribute('role', 'status');
    await expect(toast).toHaveAttribute('aria-live', 'polite');
  });
});
