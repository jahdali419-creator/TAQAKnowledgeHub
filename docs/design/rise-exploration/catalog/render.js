// Renders rise-design-catalog.html to the PDF. Run: node render.js (needs Playwright + Chromium).
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
(async () => {
  const b = await pw.chromium.launch();
  const p = await b.newPage();
  const errs = [];
  p.on('requestfailed', r => errs.push('FAILED ' + r.url()));
  await p.goto('file://' + path.join(__dirname, 'rise-design-catalog.html'), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(__dirname, '..', 'RISE-Design-Directions-Catalog.pdf'), width: '297mm', height: '210mm', printBackground: true, preferCSSPageSize: true });
  console.log(errs.length ? errs.join('\n') : 'ok');
  await b.close();
})();
