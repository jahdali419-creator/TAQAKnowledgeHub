/**
 * TAQA KnowledgeHub, AI Search page fixes.
 *
 * Used to carry ten fixes across five pages. Nine of them no longer had
 * anything to attach to (the pages they targeted had already been rebuilt
 * with the real fix built in natively, or their own selectors had drifted
 * off the current markup and the code was running as a silent no-op), and
 * one (Dashboard's reject-reason modal) was actively wrong: it ran as a
 * *second* click handler on the same Reject button, registered after the
 * page's own onclick, so the native handler always rejected the document
 * before the modal asking for a reason ever opened. That fix is now built
 * natively into dashboard.html, in the one place that touches the store,
 * so cancelling the modal actually cancels the rejection. See git history
 * for the removed nine if any of them are needed again.
 *
 * FIX 4, AI Search: permanent safety disclaimer
 */

(function () {
  'use strict';

  const page = location.pathname.split('/').pop() || 'index.html';

  function injectStyles(css) {
    const s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ─────────────────────────────────────────────────────────
  // FIX 4, AI SEARCH PAGE
  // ─────────────────────────────────────────────────────────

  if (page === 'ai-search.html') {

    injectStyles(`
      .ai-safety-banner {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(245,158,11,0.07);
        border: 1px solid rgba(245,158,11,0.22);
        border-left: 3px solid #FFB81C;
        border-radius: 8px;
        padding: 6px 12px;
        margin: 0 auto 12px;
        max-width: 700px;
        font-size: 11px;
        color: #92670a;
        line-height: 1.4;
        position: relative;
        z-index: 1;
      }
      html[data-taqa-theme="dark"] .ai-safety-banner {
        background: rgba(245,158,11,0.05);
        color: #c9930f;
        border-color: rgba(245,158,11,0.18);
      }
      .ai-safety-icon { font-size: 12px; flex-shrink: 0; }
      .ai-safety-text strong { font-weight: 700; }
    `);

    document.addEventListener('DOMContentLoaded', function () {

      // FIX 4: Safety disclaimer, insert above search area
      const banner = document.createElement('div');
      banner.className = 'ai-safety-banner';
      banner.innerHTML = `
        <span class="ai-safety-icon">⚠️</span>
        <div class="ai-safety-text">
          <strong>AI answers are not a substitute for approved documents.</strong> Always verify against the official source before acting.
        </div>
      `;

      // Insert directly above the search card
      const searchCard = document.querySelector('.search-card');
      if (searchCard) {
        searchCard.parentNode.insertBefore(banner, searchCard);
      } else {
        const hero = document.querySelector('.hero, .page-hero, h1');
        if (hero) hero.insertAdjacentElement('afterend', banner);
      }

    });
  }

})();
