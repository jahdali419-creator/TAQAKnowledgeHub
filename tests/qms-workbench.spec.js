// QMS Workbench: the Master List's "Waiting on QMS" view as the one place QMS
// works its queue.
//
// Opening a document waiting on the QMS check, as QMS, shows a check panel:
// the facts the check needs, Confirm, Reject (with a reason of at least 20
// characters, as on the desk) and then the next document. The bell, Home and
// the area desks send QMS straight there. Nothing about who may do what
// changes: the panel calls TAQA_STORE.countersign and TAQA_STORE.reject, the
// same calls the desks make, and both re-check the rules for that document.
//
// The suite's chromium (1440) and mobile-chrome (Pixel 7) projects run every
// test here, so each is checked on desktop and phone.
const { test, expect, assertNoConsoleErrors } = require('./helpers/fixtures');

const DOCS = [
  { seg: 'coiled-tubing', area: 'Coiled Tubing, Operations' },
  { seg: 'drilling', area: 'Drilling Services, Operations' },
  { seg: 'wireline', area: 'Wireline Services, Maintenance', maint: true },
];
const num = (seg) => 'TQ-WB-' + seg;
const title = (seg) => 'WB ' + seg + ' procedure';
const REASON = 'Section 4 is missing the isolation steps; add them and resubmit.';

async function seedAsQms(page, gotoApp, extra) {
  await gotoApp('/index.html');
  await page.evaluate(({ docs, extra }) => {
    localStorage.clear();
    localStorage.setItem('taqa-tour-done', '1');
    localStorage.setItem('taqa-install-dismissed', String(Date.now()));
    TAQA_ROLE.set('employee');
    docs.forEach((s) => TAQA_STORE.add({
      title: 'WB ' + s.seg + ' procedure', segment: s.seg, docType: 'sop', docNumber: 'TQ-WB-' + s.seg,
      summary: 'Workbench check document for ' + s.seg + '.', department: s.maint ? 'maintenance' : null,
      files: [{ name: s.seg + '.pdf', size: 20480 }],
    }));
    (extra || []).forEach((r) => TAQA_STORE.add(r));
    TAQA_ROLE.set('qms');
  }, { docs: DOCS, extra });
}

const openCheck = (page, gotoApp, seg) => gotoApp('/master-list.html?view=qms&doc=' + num(seg));
const stageOf = (page, n) => page.evaluate((n) => {
  const d = TAQA_STORE.findDoc(n);
  return { stage: TAQA_APPROVAL.stageOf(d), status: d.status, rejected: !!d.rejected, reason: d.rejectedReason || null, by: d.countersignedBy || null };
}, n);

test.describe('getting to the Workbench', () => {
  test('a QMS bell item opens that document\'s check in the Workbench', async ({ page, gotoApp, consoleErrors }) => {
    await seedAsQms(page, gotoApp);
    await gotoApp('/segment.html?id=drilling');
    await page.locator('#nav-bell').click();
    const item = page.locator('.bell-i', { hasText: title('coiled-tubing') });
    await expect(item).toHaveAttribute('href', 'master-list.html?view=qms&doc=' + num('coiled-tubing'));
    await item.click();
    await expect(page.locator('#dw')).toHaveClass(/open/);
    await expect(page.locator('#dw-title')).toHaveText(title('coiled-tubing'));
    await expect(page.locator('#wb-confirm')).toBeVisible();
    assertNoConsoleErrors(consoleErrors);
  });

  test('Home\'s "Check" opens the Workbench, not one area\'s desk', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp);
    await gotoApp('/index.html');
    await expect(page.locator('#desk-go')).toHaveAttribute('href', 'master-list.html?view=qms');
  });

  test('an area desk seen by QMS points to the Workbench; a Director\'s desk does not', async ({ page, gotoApp, setRole }) => {
    await seedAsQms(page, gotoApp);
    await gotoApp('/dashboard.html?id=drilling');
    const note = page.locator('#qms-wb-note');
    await expect(note).toBeVisible();
    await expect(note).toContainText('This desk shows Drilling Services only.');
    await expect(note.locator('a')).toHaveAttribute('href', 'master-list.html?view=qms');
    await setRole('owner', 'coiled-tubing');
    await gotoApp('/dashboard.html?id=coiled-tubing');
    await expect(note).toBeHidden();
  });

  test('a Director\'s bell still opens their own area desk', async ({ page, gotoApp, setRole }) => {
    await seedAsQms(page, gotoApp);
    await page.evaluate(() => TAQA_STORE.countersign('TQ-WB-coiled-tubing'));
    await setRole('owner', 'coiled-tubing');
    await gotoApp('/segment.html?id=coiled-tubing');
    await page.locator('#nav-bell').click();
    await expect(page.locator('.bell-i', { hasText: title('coiled-tubing') })).toHaveAttribute('href', 'dashboard.html?id=coiled-tubing');
  });
});

test.describe('the check panel', () => {
  test('shows what the check needs and where it is in the queue', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp);
    const total = await page.evaluate(() => TAQA_STORE.all().filter((d) => TAQA_APPROVAL.stageOf(d) === 'qms').length);
    await openCheck(page, gotoApp, 'wireline');
    const body = page.locator('#dw-body');
    await expect(page.locator('#wb-pos')).toHaveText(new RegExp('^QMS check · \\d+ of ' + total + ' waiting on QMS$'));
    await expect(body).toContainText('Waiting on your QMS check.');
    await expect(body).toContainText('Confirming sends it to Maintenance Manager');
    await expect(body).toContainText(num('wireline'));
    await expect(body).toContainText('Wireline Services, Maintenance');
    await expect(body).toContainText('wireline.pdf');
    await expect(body).toContainText('20.0 KB');
    await expect(body).toContainText(/Submitted\s*\d{2} \w{3} \d{4}, \d{2}:\d{2}/);
    await expect(body).toContainText('Workbench check document for wireline.');
    await expect(page.locator('#wb-confirm')).toHaveText('Confirm QMS check');
    await expect(page.locator('#wb-reject')).toHaveText('Reject…');
  });

  test('a document with the same title already in its area is flagged', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp, [{ title: 'WB drilling procedure', segment: 'drilling', docType: 'sop', docNumber: 'TQ-WB-drilling-2', summary: 'x' }]);
    await openCheck(page, gotoApp, 'drilling');
    await expect(page.locator('#wb-twins')).toContainText('Same title already in this area');
    await expect(page.locator('#wb-twins')).toContainText('TQ-WB-drilling-2');
  });

  test('a title carrying markup is shown as text, never run', async ({ page, gotoApp }) => {
    const evil = 'WB <img src=x onerror="window.__wbXss=1">';
    await seedAsQms(page, gotoApp, [{ title: evil, segment: 'drilling', docType: 'sop', docNumber: 'TQ-WB-XSS', summary: 'x' }]);
    await gotoApp('/master-list.html?view=qms&doc=TQ-WB-XSS');
    await expect(page.locator('#dw-title')).toHaveText(evil);
    expect(await page.evaluate(() => window.__wbXss)).toBeUndefined();
    expect(await page.locator('#dw img').count()).toBe(0);
  });

  test('its buttons fit on screen', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp);
    await openCheck(page, gotoApp, 'drilling');
    await expect(page.locator('#wb-confirm')).toBeInViewport();
    await expect(page.locator('#wb-reject')).toBeInViewport();
    const box = await page.locator('#dw').boundingBox();
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
  });
});

test.describe('deciding from the Workbench', () => {
  test('Confirm checks it, says what happens next, and moves to the next document', async ({ page, gotoApp, consoleErrors }) => {
    await seedAsQms(page, gotoApp);
    await openCheck(page, gotoApp, 'coiled-tubing');
    const before = await page.locator('#rows .row-chk').count();
    await page.locator('#wb-confirm').click();

    await expect(page.locator('#wb-res')).toHaveAttribute('data-ok', 'true');
    await expect(page.locator('#wb-res')).toContainText("Confirmed. Now waiting on the Director's final approval.");
    const s = await stageOf(page, num('coiled-tubing'));
    expect(s).toMatchObject({ stage: 'director', status: 'draft', rejected: false });
    expect(s.by).toBeTruthy();
    // It has left the queue on screen.
    await expect(page.locator('#rows .row-chk')).toHaveCount(before - 1);
    await expect(page.locator(`#rows .row-chk[data-doc="${num('coiled-tubing')}"]`)).toHaveCount(0);

    await page.locator('#wb-next').click();
    await expect(page.locator('#dw-title')).toHaveText(title('drilling'));
    await expect(page.locator('#wb-confirm')).toBeVisible();
    assertNoConsoleErrors(consoleErrors);
  });

  test('Reject needs a real reason, returns it to the author with that reason', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp);
    await openCheck(page, gotoApp, 'drilling');
    await page.locator('#wb-reject').click();
    await expect(page.locator('#wb-reason')).toBeFocused();
    await page.locator('#wb-reason').fill('Too short');
    await expect(page.locator('#wb-reject-go')).toBeDisabled();
    await page.locator('#wb-reason').fill(REASON);
    await expect(page.locator('#wb-reject-go')).toBeEnabled();
    await page.locator('#wb-reject-go').click();

    await expect(page.locator('#wb-res')).toContainText('Rejected and returned to its author with your reason.');
    const s = await stageOf(page, num('drilling'));
    expect(s).toMatchObject({ stage: null, status: 'draft', rejected: true, reason: REASON });
    expect(await page.evaluate((n) => TAQA_STORE.findDoc(n).rejectedAtStage, num('drilling'))).toBe('qms');
  });

  test('cancelling a reject changes nothing', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp);
    await openCheck(page, gotoApp, 'drilling');
    await page.locator('#wb-reject').click();
    await page.locator('#wb-reason').fill(REASON);
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('#wb-confirm')).toBeVisible();
    await expect(page.locator('#wb-rej')).toBeHidden();
    expect((await stageOf(page, num('drilling'))).stage).toBe('qms');
  });

  test('a document that changed after the panel opened is refused, with the reason', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp);
    await openCheck(page, gotoApp, 'drilling');
    await page.evaluate(() => TAQA_STORE.countersign('TQ-WB-drilling'));
    await page.locator('#wb-confirm').click();
    await expect(page.locator('#wb-res')).toHaveAttribute('data-ok', 'false');
    await expect(page.locator('#wb-res')).toContainText('Not confirmed. Already checked by QMS.');
  });

  test('the last document: no Next, and the queue says it is clear', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp);
    // Clear everything else waiting on QMS, the shipped register drafts too.
    await page.evaluate(() => TAQA_STORE.all()
      .filter((d) => TAQA_APPROVAL.stageOf(d) === 'qms' && d.docNumber !== 'TQ-WB-wireline')
      .forEach((d) => TAQA_STORE.countersign(d.docNumber)));
    await openCheck(page, gotoApp, 'wireline');
    await expect(page.locator('#wb-pos')).toHaveText('QMS check · 1 of 1 waiting on QMS');
    await page.locator('#wb-confirm').click();
    await expect(page.locator('#wb-res')).toContainText("the Maintenance Manager's final approval");
    await expect(page.locator('#wb-pos')).toHaveText('0 waiting on QMS');
    await expect(page.locator('#dw-body')).toContainText('Nothing else is waiting on the QMS check.');
    await expect(page.locator('#wb-next')).toHaveCount(0);
  });
});

test.describe('what does not change', () => {
  test('an auditor opening the same document gets the read-only record, no decisions', async ({ page, gotoApp, setRole }) => {
    await seedAsQms(page, gotoApp);
    await setRole('auditor', 'coiled-tubing');
    await openCheck(page, gotoApp, 'drilling');
    await expect(page.locator('#dw')).toHaveClass(/open/);
    await expect(page.locator('#dw-title')).toHaveText(title('drilling'));
    await expect(page.locator('#wb-confirm')).toHaveCount(0);
    await expect(page.locator('#wb-reject')).toHaveCount(0);
    await expect(page.locator('#dw-foot')).toContainText('Open document');
  });

  test('QMS opening a document past the QMS stage gets the record and is told why', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp);
    await page.evaluate(() => TAQA_STORE.countersign('TQ-WB-drilling'));
    await openCheck(page, gotoApp, 'drilling');
    await expect(page.locator('#toast')).toContainText('TQ-WB-drilling is no longer waiting on QMS. Already checked by QMS.');
    await expect(page.locator('#wb-confirm')).toHaveCount(0);
  });

  test('bulk confirm is still there for several documents at once', async ({ page, gotoApp }) => {
    await seedAsQms(page, gotoApp);
    await gotoApp('/master-list.html?view=qms');
    await page.locator(`#rows .row-chk[data-doc="${num('drilling')}"]`).check();
    await expect(page.locator('#bulk-approve')).toBeVisible();
  });
});
