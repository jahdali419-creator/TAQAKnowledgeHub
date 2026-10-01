// Maintenance lives inside each operational segment (its Operations |
// Maintenance switch), not in the top bar or on the home page. Ask Expert
// routes a maintenance question to that segment's Maintenance Manager.
const { test, expect } = require('./helpers/fixtures');

async function start(page, gotoApp, setRole, clearAppState, role = 'employee', area = 'coiled-tubing') {
  await gotoApp('/index.html');
  await clearAppState();
  await page.evaluate(() => { localStorage.setItem('taqa-tour-done', '1'); localStorage.setItem('taqa-install-dismissed', String(Date.now())); });
  await setRole(role, area);
}

test('maintenance is reached inside a segment, not from the top bar or the home page', async ({ page, gotoApp, setRole, clearAppState }) => {
  await start(page, gotoApp, setRole, clearAppState);
  await gotoApp('/index.html');
  await expect(page.locator('a[href^="maintenance"]')).toHaveCount(0);
  await expect(page.locator('#nav-mobile-menu a', { hasText: /^Maintenance$/ })).toHaveCount(0);
  await expect(page.locator('.doors-strip .door-card')).toHaveCount(3);
  await gotoApp('/segment.html?id=coiled-tubing');
  await expect(page.locator('#dept-mnt')).toBeVisible();
});

test('the home page has no Continue Reading, even after a document was opened', async ({ page, gotoApp, setRole, clearAppState }) => {
  await start(page, gotoApp, setRole, clearAppState);
  await gotoApp('/viewer.html?doc=TQ-TWS-CTSS-SOP-011&seg=coiled-tubing&type=sop');
  await expect(page.locator('#doc-title')).toBeVisible();
  await gotoApp('/index.html');
  await expect(page.locator('#continue-strip')).toHaveCount(0);
  await expect(page.getByText('Continue Reading', { exact: false })).toHaveCount(0);
});

test('upload takes ?type=, so a bulletin link opens with the type chosen', async ({ page, gotoApp, setRole, clearAppState }) => {
  await start(page, gotoApp, setRole, clearAppState, 'maintenance', 'drilling');
  await gotoApp('/upload.html?type=bulletin&dept=maintenance&seg=drilling');
  await expect(page.locator('#doc-type-select')).toHaveValue('bulletin');
  await expect(page.locator('#seg-select')).toHaveValue('drilling');
});

test.describe('Ask Expert', () => {
  test('an operational segment offers Operations or Maintenance; Maintenance goes to that segment\'s Maintenance Manager', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState);
    await gotoApp('/support-ticket.html');
    await expect(page.locator('#dept-group')).toBeHidden();
    await page.selectOption('#ticket-area', 'coiled-tubing');
    await expect(page.locator('#dept-group')).toBeVisible();
    await expect(page.locator('#ask-to-in .ask-n')).toHaveText('Coiled Tubing Expert');

    await page.locator('#dept-mnt-opt').click();
    await expect(page.locator('#ask-to-in .ask-n')).toHaveText('Coiled Tubing Maintenance Manager');
    await expect(page.locator('#expert-list .expert-item[data-dept="maintenance"]')).toHaveAttribute('aria-current', 'true');

    // A function has no maintenance department.
    await page.selectOption('#ticket-area', 'qhse');
    await expect(page.locator('#dept-group')).toBeHidden();
    await expect(page.locator('#ask-to-in .ask-n')).not.toContainText('Maintenance');
  });

  test('the saved draft brings back the area and department, and every button keeps its own value', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState);
    await gotoApp('/support-ticket.html');
    await page.selectOption('#ticket-area', 'coiled-tubing');
    await page.locator('#dept-mnt-opt').click();
    await page.locator('#pill-high').click();
    await page.reload();

    await expect(page.locator('#ticket-area')).toHaveValue('coiled-tubing');
    await expect(page.locator('#dept-group')).toBeVisible();
    await expect(page.locator('#dept-mnt-opt input')).toBeChecked();
    await expect(page.locator('#ask-to-in .ask-n')).toHaveText('Coiled Tubing Maintenance Manager');
    // The draft used to write the last radio's value into all of them.
    expect(await page.$$eval('input[name="dept"]', (rs) => rs.map((r) => r.value))).toEqual(['operations', 'maintenance']);
    expect(await page.$$eval('input[name="priority"]', (rs) => rs.map((r) => r.value))).toEqual(['critical', 'high', 'medium', 'low']);
    await expect(page.locator('#pill-high input')).toBeChecked();
  });

  test('a link with dept=maintenance arrives already addressed', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'employee', 'drilling');
    await gotoApp('/support-ticket.html?dept=maintenance&area=drilling');
    await expect(page.locator('#ticket-area')).toHaveValue('drilling');
    await expect(page.locator('#dept-mnt-opt input')).toBeChecked();
    await expect(page.locator('#ask-to-in .ask-n')).toHaveText('Drilling Services Maintenance Manager');
  });

  test('a Maintenance Manager asks from their own department and segment', async ({ page, gotoApp, setRole, clearAppState }) => {
    await start(page, gotoApp, setRole, clearAppState, 'maintenance', 'cementing');
    await gotoApp('/support-ticket.html');
    await expect(page.locator('#ticket-area')).toHaveValue('cementing');
    await expect(page.locator('#ask-to-in .ask-n')).toHaveText('Cementing Maintenance Manager');
  });
});
