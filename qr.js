// ── QR codes, generated in the browser ──
// Replaces the previous external QR service — nothing leaves the page.
// Requires qrcode.js (MIT, Kazuhiko Arase) to be loaded first.
// Returns a data: URI, or '' if generation is unavailable.
window.TAQA_QR = function (text, cellSize) {
  if (typeof qrcode !== 'function') return '';
  try {
    var q = qrcode(0, 'M');
    q.addData(String(text));
    q.make();
    return q.createDataURL(cellSize || 5, 2);
  } catch (e) {
    return '';
  }
};
