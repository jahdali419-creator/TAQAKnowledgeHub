// Permanent regression suite for support-ticket.html: the simulated
// "Ask an Expert" ticket form. This is a purely client-side prototype (no
// backend): submitTicket() says plainly that nothing was sent and keeps the
// form as typed; nothing is transmitted anywhere and nothing is persisted (support-ticket.html itself
// never touches localStorage/TAQA_STORE for the ticket data, confirmed by
// reading the file). Every assertion here is about that real, local
// behavior, never about a real ticket having reached a real expert.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

// A tiny (120x90) real PNG, embedded rather than shipped as a fixture file,
// so the canvas annotation tests below load a genuine decodable image
// (readAsDataURL + Image().onload both need real image bytes, not a stand-in
// object, unlike upload.html's extension/size checks, which only look at
// file metadata).
const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAHgAAABaCAIAAAD8YgW4AAAA4ElEQVR4nO3QQRHAIADAMEAX/g9ZqFh5LFHQ6zx7D763Xgf8hdERoyNGR4yOGB0xOmJ0xOiI0RGjI0ZHjI4YHTE6YnTE6IjREaMjRkeMjhgdMTpidMToiNERoyNGR4yOGB0xOmJ0xOiI0RGjI0ZHjI4YHTE6YnTE6IjREaMjRkeMjhgdMTpidMToiNERoyNGR4yOGB0xOmJ0xOiI0RGjI0ZHjI4YHTE6YnTE6MgFy58B9AMwA/oAAAAASUVORK5CYII=';

async function openTicket(gotoApp, setRole, role = 'qms', area = 'coiled-tubing') {
  await gotoApp('/index.html');
  await setRole(role, area);
  await gotoApp('/support-ticket.html');
}

async function fillRequired(page, overrides = {}) {
  const {
    area = 'coiled-tubing',
    title = 'Pump pressure issue',
    what = 'Pressure held then dropped unexpectedly during a routine test run.',
    category = 'Equipment Troubleshooting',
  } = overrides;
  await page.selectOption('#ticket-area', area);
  await page.fill('#issue-title', title);
  await page.fill('#issue-what', what);
  await page.selectOption('#issue-cat', category);
}

// PR 2D (Ask Expert, decision A): no ticket system is connected, so the
// page must not make up a ticket number or say the question went anywhere.
// It says "not sent", keeps every field, and offers the text to copy.
test.describe('support-ticket.html, honest "not sent" result', () => {
  test('the button shows "not sent", invents no ticket number, and keeps the text', async ({
    page,
    gotoApp,
    setRole,
    consoleErrors,
  }) => {
    await openTicket(gotoApp, setRole);
    await expect(page.locator('#ticket-result')).toBeHidden();
    await expect(page.locator('#submit-note')).toContainText('nothing on this page is sent');
    await fillRequired(page);
    await page.click('.btn-submit');

    const result = page.locator('#ticket-result');
    await expect(result).toBeVisible();
    await expect(result).toContainText('This preview has no connected ticket system. Your question was not sent.');
    const text = (await result.textContent()).toLowerCase();
    expect(text).not.toMatch(/tkt|ticket #|\blogged\b|\bsubmitted\b|\breceived\b/);
    expect(text.replace(/not sent/g, '')).not.toMatch(/\bsent\b/);
    // Nothing was cleared.
    await expect(page.locator('#issue-title')).toHaveValue('Pump pressure issue');
    await expect(page.locator('#issue-what')).toHaveValue(/Pressure held then dropped/);
    await expect(page.locator('#ticket-area')).toHaveValue('coiled-tubing');
    assertNoConsoleErrors(consoleErrors);
  });

  test('"Copy question" gives the question as text, by clipboard or a selectable box', async ({ page, gotoApp, setRole }) => {
    await openTicket(gotoApp, setRole);
    await fillRequired(page);
    await page.click('.btn-submit');
    // Force the fallback path so the check does not depend on clipboard permission.
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }); });
    await page.click('#btn-copy');
    const box = page.locator('#copy-text');
    await expect(box).toBeVisible();
    await expect(box).toHaveValue(/Question: Pump pressure issue/);
    await expect(box).toHaveValue(/What is happening: Pressure held then dropped/);
    await expect(box).toHaveValue(/Urgency: Medium/);
  });

  test('changing the form takes the notice away, so it never describes an older question', async ({ page, gotoApp, setRole }) => {
    await openTicket(gotoApp, setRole);
    await fillRequired(page);
    await page.click('.btn-submit');
    await expect(page.locator('#ticket-result')).toBeVisible();
    await page.fill('#issue-title', 'Pump pressure issue, unit 3');
    await expect(page.locator('#ticket-result')).toBeHidden();
  });

  test('nothing about this question is persisted anywhere in the app', async ({ page, gotoApp, setRole }) => {
    await openTicket(gotoApp, setRole);
    const before = await page.evaluate(() => ({ ...localStorage }));
    await fillRequired(page);
    await page.click('.btn-submit');
    const after = await page.evaluate(() => ({ ...localStorage }));
    expect(after).toEqual(before);
  });
});

// Critical (decision A): neutral wording, no invented numbers, and never
// presented as a replacement for the site's emergency procedure.
test.describe('support-ticket.html, Critical is not an emergency channel', () => {
  const WORDING =
    'This form is not an emergency channel. If anyone is in danger or a hazard is uncontrolled, stop work and follow your site emergency response procedure. Contact your supervisor or site HSE immediately.';

  test('choosing Critical shows the emergency wording; other levels do not', async ({ page, gotoApp, setRole }) => {
    await openTicket(gotoApp, setRole);
    await expect(page.locator('#urg-emergency')).toBeHidden();
    await page.locator('#pill-critical').click();
    await expect(page.locator('#urg-emergency')).toBeVisible();
    await expect(page.locator('#urg-emergency')).toHaveText(WORDING);
    await expect(page.locator('#urg-emergency')).not.toContainText(/\d{3}/); // no phone numbers made up
    await page.locator('#pill-high').click();
    await expect(page.locator('#urg-emergency')).toBeHidden();
  });

  test('a Critical question repeats the wording in the "not sent" notice', async ({ page, gotoApp, setRole }) => {
    await openTicket(gotoApp, setRole);
    await page.locator('#pill-critical').click();
    await fillRequired(page);
    await page.click('.btn-submit');
    await expect(page.locator('#result-critical')).toBeVisible();
    await expect(page.locator('#ticket-result')).toContainText(WORDING);
  });

  test('the side panel no longer promises escalation', async ({ page, gotoApp, setRole }) => {
    await openTicket(gotoApp, setRole);
    await expect(page.locator('body')).not.toContainText('escalated immediately');
  });
});

test.describe('support-ticket.html, urgency selector', () => {
  // Regression for a real user report: clicking a pill visibly focused it
  // (the :focus-visible outline) but never actually selected it, so the
  // hint text and SLA time stayed on whatever was selected before. The
  // radio input is an invisible, absolutely-positioned overlay on its own
  // <label> (see .urg-opt input's CSS), relying on the browser's native
  // label-activates-its-control behavior; that's not reliable in every
  // real browser/device, so a direct click listener on each pill now
  // drives selectPriority() explicitly too. Covers every pill, not just
  // one, since the report was specifically about Critical/High not
  // responding while a lower option stayed selected.
  test('clicking each urgency pill selects it and updates the hint text and reply time', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await openTicket(gotoApp, setRole);

    // Medium is the documented default.
    await expect(page.locator('input[name="priority"]:checked')).toHaveValue('medium');
    await expect(page.locator('#pill-medium')).toHaveClass(/\bsel\b/);

    const cases = [
      { id: 'critical', name: 'Critical', hint: 'Stopped, or a safety risk.', time: '2 hours' },
      { id: 'high', name: 'High', hint: 'Impacted, needs a workaround.', time: '4 hours' },
      { id: 'low', name: 'Low', hint: 'No impact on operations.', time: '3 business days' },
      { id: 'medium', name: 'Medium', hint: 'Continuing with the issue.', time: '1 business day' },
    ];

    for (const c of cases) {
      await page.locator('#pill-' + c.id).click();
      await expect(page.locator('input[name="priority"]:checked')).toHaveValue(c.id);
      await expect(page.locator('#pill-' + c.id)).toHaveClass(/\bsel\b/);
      // Every other pill loses the selected class, not just the previous one.
      for (const other of cases) {
        if (other.id !== c.id) await expect(page.locator('#pill-' + other.id)).not.toHaveClass(/\bsel\b/);
      }
      await expect(page.locator('#urg-hint')).toContainText(c.name);
      await expect(page.locator('#urg-hint')).toContainText(c.hint);
      await expect(page.locator('#urg-time')).toHaveText(c.time);
    }
  });

  test('the selected urgency is what the copied question carries', async ({ page, gotoApp, setRole }) => {
    await openTicket(gotoApp, setRole);
    await page.locator('#pill-critical').click();
    await fillRequired(page);
    await page.click('.btn-submit');
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }); });
    await page.click('#btn-copy');
    await expect(page.locator('#copy-text')).toHaveValue(/Urgency: Critical/);
  });
});

test.describe('support-ticket.html, form validation', () => {
  test('submitting with nothing filled in is blocked and shows a visible message', async ({ page, gotoApp, setRole }) => {
    await openTicket(gotoApp, setRole);
    await page.click('.btn-submit');
    await expect(page.locator('#area-err')).toBeVisible();
    await expect(page.locator('#ticket-result')).toBeHidden();
  });

  test('each required field blocks submission on its own and is named in a visible message', async ({
    page,
    gotoApp,
    setRole,
  }) => {
    await openTicket(gotoApp, setRole);

    // Area only -> title still required.
    await page.selectOption('#ticket-area', 'coiled-tubing');
    await page.click('.btn-submit');
    await expect(page.locator('#title-err')).toBeVisible();
    await expect(page.locator('#ticket-result')).toBeHidden();

    // + title -> "what is happening" still required.
    await page.fill('#issue-title', 'Pump pressure issue');
    await page.click('.btn-submit');
    await expect(page.locator('#what-err')).toBeVisible();
    await expect(page.locator('#ticket-result')).toBeHidden();

    // + what -> category still required.
    await page.fill('#issue-what', 'Pressure dropped unexpectedly.');
    await page.click('.btn-submit');
    await expect(page.locator('#cat-err')).toBeVisible();
    await expect(page.locator('#ticket-result')).toBeHidden();

    // All four filled -> submission goes through.
    await page.selectOption('#issue-cat', 'Equipment Troubleshooting');
    await page.click('.btn-submit');
    await expect(page.locator('#ticket-result')).toBeVisible();
  });

  test('a filled-in form shows "not sent" and keeps what was typed', async ({ page, gotoApp, setRole }) => {
    await openTicket(gotoApp, setRole);
    await fillRequired(page);
    await page.click('.btn-submit');
    await expect(page.locator('#ticket-result')).toBeVisible();
    await expect(page.locator('#issue-title')).toHaveValue('Pump pressure issue');
    await expect(page.locator('#issue-what')).not.toHaveValue('');
  });
});

test.describe('support-ticket.html, photo annotation tools', () => {
  // Canvas-based, but it is a real 2D canvas (not WebGL), so Playwright's
  // mouse drag genuinely exercises onDown/onMove/onUp and can be verified
  // meaningfully by comparing canvas pixel data before and after, this is
  // not a shallow "button exists" check. What is NOT verified here is that a
  // drawn shape is geometrically correct (e.g. that "rectangle" produces an
  // actual rectangle), that would need real image analysis. This confirms
  // the tool genuinely mutates the canvas, undoes, and clears, which is what
  // matters for a regression suite.
  async function addPhotoAndOpenAnnotator(page) {
    await page.setInputFiles('#photo-input', {
      name: 'defect.png',
      mimeType: 'image/png',
      buffer: Buffer.from(TINY_PNG_B64, 'base64'),
    });
    await expect(page.locator('.photo-thumb')).toHaveCount(1);
    await expect(page.locator('#annot-section')).toHaveClass(/visible/);
  }

  test('adding a photo reveals the annotation toolbar and canvas', async ({ page, gotoApp, setRole }) => {
    await openTicket(gotoApp, setRole);
    await addPhotoAndOpenAnnotator(page);
    await expect(page.locator('#tool-rect')).toHaveClass(/active/); // default tool
    await expect(page.locator('#col-red')).toHaveClass(/active/); // default colour
  });

  test('dragging on the canvas actually draws (pixel data changes)', async ({ page, gotoApp, setRole }) => {
    await openTicket(gotoApp, setRole);
    await addPhotoAndOpenAnnotator(page);
    const canvas = page.locator('#annot-canvas');
    await canvas.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => document.getElementById('annot-canvas').toDataURL());

    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + 10, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 10, box.y + box.height - 10, { steps: 6 });
    await page.mouse.up();

    const after = await page.evaluate(() => document.getElementById('annot-canvas').toDataURL());
    expect(after).not.toBe(before);
  });

  test('Undo removes the last mark, Clear removes all marks', async ({ page, gotoApp, setRole }) => {
    await openTicket(gotoApp, setRole);
    await addPhotoAndOpenAnnotator(page);
    const canvas = page.locator('#annot-canvas');
    await canvas.scrollIntoViewIfNeeded();
    const original = await page.evaluate(() => document.getElementById('annot-canvas').toDataURL());

    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + 10, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 40, box.y + 30, { steps: 4 });
    await page.mouse.up();
    const drawn = await page.evaluate(() => document.getElementById('annot-canvas').toDataURL());
    expect(drawn).not.toBe(original);

    await page.click('button:has-text("Undo")');
    const afterUndo = await page.evaluate(() => document.getElementById('annot-canvas').toDataURL());
    expect(afterUndo).toBe(original);

    // Draw again, then Clear should also return to the untouched image.
    await page.mouse.move(box.x + 10, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 50, box.y + 40, { steps: 4 });
    await page.mouse.up();
    await page.click('button:has-text("Clear")');
    const afterClear = await page.evaluate(() => document.getElementById('annot-canvas').toDataURL());
    expect(afterClear).toBe(original);
  });

  test('choosing a different tool and colour updates the active state', async ({ page, gotoApp, setRole }) => {
    await openTicket(gotoApp, setRole);
    await addPhotoAndOpenAnnotator(page);
    await page.click('#tool-arrow');
    await expect(page.locator('#tool-arrow')).toHaveClass(/active/);
    await expect(page.locator('#tool-rect')).not.toHaveClass(/active/);

    await page.click('#col-blue');
    await expect(page.locator('#col-blue')).toHaveClass(/active/);
    await expect(page.locator('#col-red')).not.toHaveClass(/active/);
  });

  test('up to 5 photos are kept; extra drops beyond that are ignored', async ({ page, gotoApp, setRole }) => {
    await openTicket(gotoApp, setRole);
    const buf = Buffer.from(TINY_PNG_B64, 'base64');
    const files = Array.from({ length: 6 }, (_, i) => ({
      name: `photo-${i}.png`,
      mimeType: 'image/png',
      buffer: buf,
    }));
    await page.setInputFiles('#photo-input', files);
    await expect(page.locator('.photo-thumb')).toHaveCount(5);
  });
});
