/**
 * TAQA KnowledgeHub — Frontend Fixes v1.0
 * Covers all 10 frontend improvements agreed with Claude.
 * One file. Drop into repo. Add script tag to 4 pages.
 *
 * FIX 1  — Upload: file size contradiction (50MB vs 500MB)
 * FIX 2  — Upload: auto-fill Submitted By from login (M365-ready stub)
 * FIX 3  — Upload: approval workflow text matches 11-director reality
 * FIX 4  — AI Search: permanent safety disclaimer
 * FIX 5  — AI Search: segment filter chips actually filter instant results
 * FIX 6  — Dashboard: Reject requires a reason (modal + reason stored)
 * FIX 7  — Dashboard: Remove button requires confirmation (two-click)
 * FIX 8  — Dashboard: Delegate Approvals full UI
 * FIX 9  — Glossary: submitted terms flagged Pending Review
 * FIX 10 — Support ticket: proper reference number generation
 */

(function () {
  'use strict';

  const page = location.pathname.split('/').pop() || 'index.html';

  // ─────────────────────────────────────────────────────────
  // SHARED UTILITIES
  // ─────────────────────────────────────────────────────────

  function showToast(msg, type) {
    if (window.showToast) { window.showToast(msg, type || 'info'); return; }
    // fallback if shared.js not yet loaded
    console.info('[TAQA]', msg);
  }

  function injectStyles(css) {
    const s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ─────────────────────────────────────────────────────────
  // FIX 1 + 3 — UPLOAD PAGE
  // ─────────────────────────────────────────────────────────

  if (page === 'upload.html') {

    document.addEventListener('DOMContentLoaded', function () {

      // FIX 1: Standardise file size to 500 MB everywhere
      document.querySelectorAll('*').forEach(el => {
        if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
          const txt = el.textContent;
          if (txt.includes('Max 50 MB') || txt.includes('Max file size: 50')) {
            el.textContent = txt
              .replace(/Max 50 MB per file/g, 'Max 500 MB per file')
              .replace(/Max file size: 50 MB/g, 'Max file size: 500 MB')
              .replace(/larger than 50 MB/g, 'larger than 500 MB');
          }
        }
      });
      // Also fix text nodes inside elements with mixed content
      function fixTextNodes(node) {
        if (node.nodeType === 3) {
          node.textContent = node.textContent
            .replace(/Max 50 MB/g, 'Max 500 MB')
            .replace(/50 MB per file/g, '500 MB per file')
            .replace(/larger than 50 MB/g, 'larger than 500 MB');
        } else {
          node.childNodes.forEach(fixTextNodes);
        }
      }
      fixTextNodes(document.body);

      // FIX 2: Auto-fill Submitted By — stub ready for M365 MSAL
      // When Microsoft login is connected, replace getLoggedInUser() with real MSAL call
      function getLoggedInUser() {
        // STUB — replace with: msalInstance.getAllAccounts()[0]
        // Returns null if not logged in (no change to form)
        try {
          const stored = sessionStorage.getItem('taqa_user');
          return stored ? JSON.parse(stored) : null;
        } catch { return null; }
      }

      const user = getLoggedInUser();
      if (user) {
        const nameInput = document.querySelector('input[placeholder*="Name"], #submitter-name, input[name="submitterName"]');
        const emailInput = document.querySelector('input[type="email"], #submitter-email, input[name="submitterEmail"]');
        if (nameInput && user.name) {
          nameInput.value = user.name;
          nameInput.readOnly = true;
          nameInput.style.cssText += 'background:rgba(0,104,106,0.05);cursor:not-allowed;';
        }
        if (emailInput && user.email) {
          emailInput.value = user.email;
          emailInput.readOnly = true;
          emailInput.style.cssText += 'background:rgba(0,104,106,0.05);cursor:not-allowed;';
        }
      }

      // FIX 3: Fix approval workflow text — replace "Knowledge Team Lead" with reality
      document.querySelectorAll('p, span, div, li').forEach(el => {
        if (el.children.length === 0 && el.textContent.includes('Knowledge Team Lead')) {
          el.textContent = el.textContent
            .replace(/Knowledge Team Lead/g, 'your Segment Director (or their delegated expert)');
        }
      });

      // Also fix the workflow step descriptions
      document.querySelectorAll('.step-label, .workflow-step, [class*="workflow"], [class*="step"]').forEach(el => {
        if (el.children.length === 0 && el.textContent.includes('Knowledge Team')) {
          el.textContent = el.textContent.replace(/Knowledge Team Lead/g, 'Segment Director');
        }
      });

    });
  }

  // ─────────────────────────────────────────────────────────
  // FIX 4 + 5 — AI SEARCH PAGE
  // ─────────────────────────────────────────────────────────

  if (page === 'ai-search.html') {

    injectStyles(`
      .ai-safety-banner {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(245,158,11,0.07);
        border: 1px solid rgba(245,158,11,0.22);
        border-left: 3px solid #f59e0b;
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
      html[data-theme="dark"] .ai-safety-banner {
        background: rgba(245,158,11,0.05);
        color: #c9930f;
        border-color: rgba(245,158,11,0.18);
      }
      .ai-safety-icon { font-size: 12px; flex-shrink: 0; }
      .ai-safety-text strong { font-weight: 700; }
      .seg-chip-active-real {
        background: var(--primary, #00686A) !important;
        color: #fff !important;
        border-color: var(--primary, #00686A) !important;
      }
    `);

    document.addEventListener('DOMContentLoaded', function () {

      // FIX 4: Safety disclaimer — insert above search area
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

      // FIX 5: Segment filter chips actually filter instant results
      // Track active segment
      let activeSegment = 'all';

      // Intercept chip clicks
      document.querySelectorAll('.seg-chip, [class*="seg-filter"], [class*="filter-chip"]').forEach(chip => {
        chip.addEventListener('click', function () {
          const chipText = (this.textContent || '').trim().toLowerCase();
          activeSegment = chipText === 'all' ? 'all' : chipText;

          // Visual update — add our active class
          document.querySelectorAll('.seg-chip, [class*="seg-filter"], [class*="filter-chip"]')
            .forEach(c => c.classList.remove('seg-chip-active-real'));
          this.classList.add('seg-chip-active-real');
        });
      });

      // Intercept the instant results render
      // We hook into the MutationObserver pattern to filter rendered results
      const resultObserver = new MutationObserver(function (mutations) {
        if (activeSegment === 'all') return;
        mutations.forEach(m => {
          m.addedNodes.forEach(node => {
            if (node.nodeType !== 1) return;
            const items = node.querySelectorAll
              ? node.querySelectorAll('[class*="result-item"], [class*="instant-result"], [class*="search-result"]')
              : [];
            items.forEach(item => {
              const segText = (item.textContent || '').toLowerCase();
              const matches = segText.includes(activeSegment) ||
                activeSegment === 'all';
              item.style.display = matches ? '' : 'none';
            });
            // Also handle if node itself is a result item
            if (node.matches && node.matches('[class*="result-item"], [class*="instant-result"]')) {
              const segText = (node.textContent || '').toLowerCase();
              node.style.display = segText.includes(activeSegment) || activeSegment === 'all' ? '' : 'none';
            }
          });
        });
      });

      const resultsContainer = document.querySelector(
        '[class*="results"], [class*="instant"], [class*="dropdown"], #search-results, .search-results'
      );
      if (resultsContainer) {
        resultObserver.observe(resultsContainer, { childList: true, subtree: true });
      }

      // Also filter any existing results when chip changes
      document.querySelectorAll('.seg-chip, [class*="seg-filter"]').forEach(chip => {
        chip.addEventListener('click', function () {
          if (activeSegment === 'all') return;
          document.querySelectorAll(
            '[class*="result-item"], [class*="instant-result"], [class*="search-result"]'
          ).forEach(item => {
            const segText = (item.textContent || '').toLowerCase();
            item.style.display = segText.includes(activeSegment) ? '' : 'none';
          });
        });
      });

    });
  }

  // ─────────────────────────────────────────────────────────
  // FIX 6 + 7 + 8 — DASHBOARD PAGE
  // ─────────────────────────────────────────────────────────

  if (page === 'dashboard.html') {

    injectStyles(`
      /* ── Reject Reason Modal ── */
      .reject-modal-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5);
        z-index: 3000; display: none; align-items: center; justify-content: center;
        backdrop-filter: blur(4px);
      }
      .reject-modal-overlay.open { display: flex; }
      .reject-modal {
        background: #fff; border-radius: 16px; padding: 28px;
        width: 100%; max-width: 440px;
        box-shadow: 0 24px 64px rgba(0,0,0,0.2);
        animation: pageFadeIn 0.2s ease;
      }
      html[data-theme="dark"] .reject-modal { background: #19263a; }
      .reject-modal h3 {
        font-family: 'Urbanist', sans-serif; font-size: 17px; font-weight: 800;
        color: var(--text, #1a2235); margin-bottom: 4px;
      }
      .reject-modal p {
        font-size: 13px; color: var(--text-muted, #64748b); margin-bottom: 18px;
      }
      .reject-reason-input {
        width: 100%; padding: 10px 14px;
        border: 1px solid var(--border, rgba(0,0,0,0.08)); border-radius: 10px;
        font-size: 13.5px; font-family: 'Inter', sans-serif;
        color: var(--text, #1a2235); background: #fff;
        outline: none; resize: vertical; min-height: 90px;
        transition: border-color 0.2s;
      }
      html[data-theme="dark"] .reject-reason-input {
        background: #111e2d; border-color: #243044; color: #dde4ef;
      }
      .reject-reason-input:focus {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
      }
      .reject-reason-input.error { border-color: #ef4444 !important; }
      .reject-char-hint { font-size: 11px; color: var(--text-dim, #94a3b8); margin-top: 4px; }
      .reject-modal-actions { display: flex; gap: 10px; margin-top: 20px; }
      .btn-reject-confirm {
        flex: 1; padding: 11px; border-radius: 10px;
        background: #ef4444; color: #fff; font-size: 14px; font-weight: 600;
        border: none; cursor: pointer; font-family: 'Inter', sans-serif;
        transition: opacity 0.2s;
      }
      .btn-reject-confirm:hover { opacity: 0.88; }
      .btn-reject-confirm:disabled { opacity: 0.45; cursor: not-allowed; }
      .btn-reject-cancel {
        padding: 11px 20px; border-radius: 10px; background: transparent;
        border: 1px solid var(--border, rgba(0,0,0,0.08));
        color: var(--text-muted, #64748b); font-size: 14px; font-weight: 500;
        cursor: pointer; font-family: 'Inter', sans-serif;
      }
      /* ── Remove Confirm ── */
      .remove-confirm-bar {
        display: none; align-items: center; justify-content: space-between;
        gap: 8px; background: rgba(239,68,68,0.06);
        border: 1px solid rgba(239,68,68,0.2); border-radius: 8px;
        padding: 8px 12px; margin-top: 8px; font-size: 12.5px;
      }
      .remove-confirm-bar.show { display: flex; }
      .remove-confirm-bar span { color: var(--text-muted, #64748b); }
      .remove-confirm-bar strong { color: #ef4444; }
      .btn-confirm-remove {
        background: #ef4444; color: #fff; border: none;
        padding: 5px 14px; border-radius: 7px; font-size: 12px;
        font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
        transition: opacity 0.2s;
      }
      .btn-confirm-remove:hover { opacity: 0.85; }
      .btn-cancel-remove {
        background: none; border: 1px solid var(--border, rgba(0,0,0,0.08));
        color: var(--text-muted, #64748b); padding: 5px 12px; border-radius: 7px;
        font-size: 12px; cursor: pointer; font-family: 'Inter', sans-serif;
      }
      /* ── Delegate Modal ── */
      .delegate-modal-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5);
        z-index: 3000; display: none; align-items: center; justify-content: center;
        backdrop-filter: blur(4px);
      }
      .delegate-modal-overlay.open { display: flex; }
      .delegate-modal {
        background: #fff; border-radius: 16px; padding: 28px;
        width: 100%; max-width: 460px;
        box-shadow: 0 24px 64px rgba(0,0,0,0.2);
        animation: pageFadeIn 0.2s ease;
      }
      html[data-theme="dark"] .delegate-modal { background: #19263a; }
      .delegate-modal h3 {
        font-family: 'Urbanist', sans-serif; font-size: 17px; font-weight: 800;
        color: var(--text, #1a2235); margin-bottom: 4px;
      }
      .delegate-modal .dm-sub {
        font-size: 13px; color: var(--text-muted, #64748b); margin-bottom: 20px;
        line-height: 1.5;
      }
      .delegate-active-banner {
        display: none; background: rgba(0,191,178,0.07);
        border: 1px solid rgba(0,191,178,0.25); border-radius: 10px;
        padding: 12px 14px; margin-bottom: 16px; font-size: 13px;
      }
      .delegate-active-banner.show { display: block; }
      .delegate-active-banner strong { color: var(--primary, #00686A); }
      .delegate-form-group { margin-bottom: 14px; }
      .delegate-form-group label {
        font-size: 11px; font-weight: 600; text-transform: uppercase;
        letter-spacing: 0.5px; color: var(--text-muted, #64748b);
        display: block; margin-bottom: 6px;
      }
      .delegate-input {
        width: 100%; padding: 10px 14px;
        border: 1px solid var(--border, rgba(0,0,0,0.08)); border-radius: 10px;
        font-size: 14px; font-family: 'Inter', sans-serif;
        color: var(--text, #1a2235); background: #fff; outline: none;
        transition: border-color 0.2s;
      }
      html[data-theme="dark"] .delegate-input {
        background: #111e2d; border-color: #243044; color: #dde4ef;
      }
      .delegate-input:focus {
        border-color: var(--primary-light, #00BFB2);
        box-shadow: 0 0 0 3px rgba(0,191,178,0.1);
      }
      .delegate-scope-note {
        background: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.2);
        border-radius: 8px; padding: 10px 14px; font-size: 12px;
        color: #92670a; margin-bottom: 16px; line-height: 1.5;
      }
      html[data-theme="dark"] .delegate-scope-note { color: #d4a017; }
      .delegate-modal-actions { display: flex; gap: 10px; margin-top: 20px; }
      .btn-delegate-save {
        flex: 1; padding: 11px; border-radius: 10px;
        background: linear-gradient(135deg,#00686A,#00BFB2);
        color: #fff; font-size: 14px; font-weight: 600;
        border: none; cursor: pointer; font-family: 'Inter', sans-serif;
        transition: opacity 0.2s;
      }
      .btn-delegate-save:hover { opacity: 0.88; }
      .btn-delegate-clear {
        padding: 11px 18px; border-radius: 10px;
        background: rgba(239,68,68,0.08); color: #ef4444;
        border: 1px solid rgba(239,68,68,0.2); font-size: 13px; font-weight: 600;
        cursor: pointer; font-family: 'Inter', sans-serif;
      }
      .btn-delegate-cancel {
        padding: 11px 18px; border-radius: 10px; background: transparent;
        border: 1px solid var(--border, rgba(0,0,0,0.08));
        color: var(--text-muted, #64748b); font-size: 14px; font-weight: 500;
        cursor: pointer; font-family: 'Inter', sans-serif;
      }
      /* ── Delegate button in hero ── */
      .btn-delegate-hero {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 8px 18px; border-radius: 9px; font-size: 13px; font-weight: 600;
        background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.75);
        border: 1px solid rgba(255,255,255,0.15); cursor: pointer;
        font-family: 'Inter', sans-serif; transition: all 0.2s; margin-top: 12px;
      }
      .btn-delegate-hero:hover {
        background: rgba(0,191,178,0.15); border-color: rgba(0,191,178,0.4);
        color: #00BFB2;
      }
      .btn-delegate-hero.delegating {
        background: rgba(0,191,178,0.12); border-color: rgba(0,191,178,0.3);
        color: #00BFB2;
      }
      .delegate-hero-indicator {
        display: none; font-size: 11px; color: rgba(0,191,178,0.8);
        margin-top: 6px; font-weight: 500;
      }
      .delegate-hero-indicator.show { display: block; }
    `);

    document.addEventListener('DOMContentLoaded', function () {

      // ── FIX 6: Reject requires a reason ──
      const rejectOverlay = document.createElement('div');
      rejectOverlay.className = 'reject-modal-overlay';
      rejectOverlay.id = 'reject-modal-overlay';
      rejectOverlay.innerHTML = `
        <div class="reject-modal">
          <h3>Reject Document</h3>
          <p id="reject-modal-doc-name" style="font-size:12.5px;color:var(--text-muted);margin-bottom:14px;font-style:italic;"></p>
          <p>Provide a clear reason so the submitter knows exactly what to fix before resubmitting.</p>
          <textarea class="reject-reason-input" id="reject-reason-input"
            placeholder="e.g. Section 4.2 is incomplete — scope of application missing. Please revise and resubmit."
            maxlength="500"></textarea>
          <div class="reject-char-hint"><span id="reject-char-count">0</span> / 500 characters (minimum 20 required)</div>
          <div class="reject-modal-actions">
            <button class="btn-reject-cancel" id="reject-modal-cancel">Cancel</button>
            <button class="btn-reject-confirm" id="reject-modal-confirm" disabled>Reject & Notify</button>
          </div>
        </div>
      `;
      document.body.appendChild(rejectOverlay);

      let rejectTargetCard = null;
      let rejectTargetBtn = null;

      const rejectInput = document.getElementById('reject-reason-input');
      const rejectConfirm = document.getElementById('reject-modal-confirm');
      const rejectCount = document.getElementById('reject-char-count');

      rejectInput.addEventListener('input', function () {
        const len = this.value.trim().length;
        rejectCount.textContent = this.value.length;
        rejectConfirm.disabled = len < 20;
        this.classList.toggle('error', len > 0 && len < 20);
      });

      document.getElementById('reject-modal-cancel').addEventListener('click', function () {
        rejectOverlay.classList.remove('open');
        rejectInput.value = '';
        rejectCount.textContent = '0';
        rejectConfirm.disabled = true;
        rejectTargetCard = null;
      });

      document.getElementById('reject-modal-confirm').addEventListener('click', function () {
        if (!rejectTargetCard) return;
        const reason = rejectInput.value.trim();

        // Mark card as rejected
        rejectTargetCard.classList.add('rejected');
        const badge = rejectTargetCard.querySelector('.pending-status-badge');
        if (badge) { badge.textContent = 'Rejected'; badge.className = 'pending-status-badge badge-rejected'; }
        const actions = rejectTargetCard.querySelector('.pending-actions');
        if (actions) {
          actions.innerHTML = `<span style="font-size:12px;color:#ef4444;font-weight:600;">✕ Rejected — reason sent to submitter</span>`;
        }

        // Add reason to card
        const reasonEl = document.createElement('div');
        reasonEl.style.cssText = 'font-size:12px;color:#ef4444;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);border-radius:8px;padding:8px 12px;margin-top:10px;line-height:1.5;';
        var strongEl = document.createElement('strong');
        strongEl.textContent = 'Rejection reason:';
        reasonEl.appendChild(strongEl);
        reasonEl.appendChild(document.createTextNode(' ' + reason));
        rejectTargetCard.appendChild(reasonEl);

        // Decrement counter
        const pendingStat = document.getElementById('stat-pending');
        if (pendingStat) pendingStat.textContent = Math.max(0, parseInt(pendingStat.textContent) - 1);
        const bellBadge = document.getElementById('bell-badge');
        if (bellBadge) bellBadge.textContent = Math.max(0, parseInt(bellBadge.textContent) - 1);

        rejectOverlay.classList.remove('open');
        rejectInput.value = '';
        rejectCount.textContent = '0';
        rejectConfirm.disabled = true;

        showToast('✕ Document rejected — reason sent to submitter');

        setTimeout(() => {
          if (rejectTargetCard) {
            rejectTargetCard.style.transition = 'opacity 0.4s, max-height 0.4s';
            rejectTargetCard.style.opacity = '0.5';
          }
          rejectTargetCard = null;
        }, 400);
      });

      // Intercept ALL existing reject buttons
      function interceptRejectButtons() {
        document.querySelectorAll('.btn-reject, [class*="reject"]:not(.reject-modal):not(.reject-reason):not([class*="modal"]):not([class*="overlay"])').forEach(btn => {
          if (btn.dataset.fixedReject) return;
          btn.dataset.fixedReject = '1';

          // Only intercept actual reject buttons (text check)
          if (!btn.textContent.toLowerCase().includes('reject')) return;

          btn.addEventListener('click', function (e) {
            e.preventDefault(); e.stopImmediatePropagation();

            const card = this.closest('.pending-card, [class*="pending"], [class*="approval-card"]');
            rejectTargetCard = card;

            // Set doc name in modal
            const docName = card
              ? (card.querySelector('.pending-doc-title, [class*="doc-title"], h3, h4')?.textContent || 'this document')
              : 'this document';
            document.getElementById('reject-modal-doc-name').textContent = '"' + docName + '"';

            rejectInput.value = '';
            rejectCount.textContent = '0';
            rejectConfirm.disabled = true;
            rejectOverlay.classList.add('open');
          }, true);
        });
      }

      interceptRejectButtons();
      // Re-run after any dynamic content loads
      setTimeout(interceptRejectButtons, 1000);
      setTimeout(interceptRejectButtons, 2500);

      // Close modal on overlay click
      rejectOverlay.addEventListener('click', function (e) {
        if (e.target === rejectOverlay) rejectOverlay.classList.remove('open');
      });


      // ── FIX 7: Remove requires confirmation ──
      function interceptRemoveButtons() {
        document.querySelectorAll('.pub-remove-btn, [class*="remove"]:not([data-fixed-remove])').forEach(btn => {
          if (btn.dataset.fixedRemove) return;
          if (!btn.textContent.toLowerCase().includes('remove') && !btn.getAttribute('aria-label')?.toLowerCase().includes('remove')) return;
          btn.dataset.fixedRemove = '1';

          btn.addEventListener('click', function (e) {
            e.preventDefault(); e.stopImmediatePropagation();

            const row = this.closest('tr, [class*="doc-row"], [class*="pub-row"]');
            if (!row) return;

            // Check if confirm bar already exists
            if (row.querySelector('.remove-confirm-bar.show')) return;

            let confirmBar = row.querySelector('.remove-confirm-bar');
            if (!confirmBar) {
              const td = document.createElement('td');
              td.colSpan = 10;
              const newRow = document.createElement('tr');
              newRow.appendChild(td);
              row.insertAdjacentElement('afterend', newRow);

              confirmBar = document.createElement('div');
              confirmBar.className = 'remove-confirm-bar';
              confirmBar.innerHTML = `
                <span>Remove this document? <strong>This cannot be undone.</strong></span>
                <div style="display:flex;gap:6px;">
                  <button class="btn-cancel-remove">Cancel</button>
                  <button class="btn-confirm-remove">Yes, Remove</button>
                </div>
              `;
              td.appendChild(confirmBar);

              confirmBar.querySelector('.btn-cancel-remove').addEventListener('click', () => {
                confirmBar.classList.remove('show');
                newRow.remove();
              });

              confirmBar.querySelector('.btn-confirm-remove').addEventListener('click', () => {
                row.style.transition = 'opacity 0.3s';
                row.style.opacity = '0';
                newRow.remove();
                setTimeout(() => {
                  row.remove();
                  showToast('Document removed from published library');
                  const pubStat = document.getElementById('stat-published');
                  if (pubStat) pubStat.textContent = Math.max(0, parseInt(pubStat.textContent) - 1);
                }, 320);
              });
            }
            confirmBar.classList.add('show');
          }, true);
        });
      }

      interceptRemoveButtons();
      setTimeout(interceptRemoveButtons, 1000);


      // ── FIX 8: Delegate Approvals ──
      const delegateOverlay = document.createElement('div');
      delegateOverlay.className = 'delegate-modal-overlay';
      delegateOverlay.id = 'delegate-modal-overlay';
      delegateOverlay.innerHTML = `
        <div class="delegate-modal">
          <h3>Delegate Approvals</h3>
          <div class="dm-sub">
            Temporarily hand your approval authority to a trusted expert.
            They will receive approval requests in your place until you remove the delegation.
          </div>

          <div class="delegate-active-banner" id="delegate-active-banner">
            Currently delegating to: <strong id="delegate-current-name">—</strong>
            (<span id="delegate-current-email">—</span>)<br>
            <span style="font-size:11.5px;opacity:0.7;">Set on <span id="delegate-set-date">—</span></span>
          </div>

          <div class="delegate-scope-note">
            ⚠️ The delegate will only be notified — they cannot permanently publish or remove documents.
            Final authority remains with you. You will receive a copy of all delegate actions.
          </div>

          <div class="delegate-form-group">
            <label>Delegate's Full Name</label>
            <input class="delegate-input" id="delegate-name" type="text" placeholder="e.g. Khalid Al-Otaibi">
          </div>
          <div class="delegate-form-group">
            <label>Delegate's Email (TAQA)</label>
            <input class="delegate-input" id="delegate-email" type="email" placeholder="k.alotaibi@taqa.com.sa">
          </div>
          <div class="delegate-form-group">
            <label>Delegation Period</label>
            <select class="delegate-input" id="delegate-period">
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7" selected>1 week</option>
              <option value="14">2 weeks</option>
              <option value="30">1 month</option>
              <option value="0">Until I remove it</option>
            </select>
          </div>

          <div class="delegate-modal-actions">
            <button class="btn-delegate-cancel" id="delegate-modal-cancel">Cancel</button>
            <button class="btn-delegate-clear" id="delegate-modal-clear" style="display:none;">Remove Delegation</button>
            <button class="btn-delegate-save" id="delegate-modal-save">Save Delegation</button>
          </div>
        </div>
      `;
      document.body.appendChild(delegateOverlay);

      // Add Delegate button to hero
      const heroLeft = document.querySelector('.dash-hero-left');
      if (heroLeft) {
        const delegateBtn = document.createElement('button');
        delegateBtn.className = 'btn-delegate-hero';
        delegateBtn.id = 'open-delegate-btn';
        delegateBtn.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Delegate Approvals
        `;
        heroLeft.appendChild(delegateBtn);

        const delegateIndicator = document.createElement('div');
        delegateIndicator.className = 'delegate-hero-indicator';
        delegateIndicator.id = 'delegate-hero-indicator';
        heroLeft.appendChild(delegateIndicator);

        delegateBtn.addEventListener('click', () => openDelegateModal());
      }

      // Load saved delegation
      function loadDelegation() {
        try {
          const saved = localStorage.getItem('taqa_delegation');
          if (!saved) return null;
          return JSON.parse(saved);
        } catch { return null; }
      }

      function saveDelegation(data) {
        localStorage.setItem('taqa_delegation', JSON.stringify(data));
      }

      function clearDelegation() {
        localStorage.removeItem('taqa_delegation');
      }

      function updateDelegateUI() {
        const d = loadDelegation();
        const openBtn = document.getElementById('open-delegate-btn');
        const indicator = document.getElementById('delegate-hero-indicator');
        const banner = document.getElementById('delegate-active-banner');
        const clearBtn = document.getElementById('delegate-modal-clear');

        if (d && d.name) {
          if (openBtn) openBtn.classList.add('delegating');
          if (indicator) {
            indicator.textContent = '↗ Delegating to ' + d.name;
            indicator.classList.add('show');
          }
          if (banner) {
            document.getElementById('delegate-current-name').textContent = d.name;
            document.getElementById('delegate-current-email').textContent = d.email;
            document.getElementById('delegate-set-date').textContent = d.setDate;
            banner.classList.add('show');
          }
          if (clearBtn) clearBtn.style.display = '';
        } else {
          if (openBtn) openBtn.classList.remove('delegating');
          if (indicator) indicator.classList.remove('show');
          if (banner) banner.classList.remove('show');
          if (clearBtn) clearBtn.style.display = 'none';
        }
      }

      function openDelegateModal() {
        const d = loadDelegation();
        if (d) {
          document.getElementById('delegate-name').value = d.name || '';
          document.getElementById('delegate-email').value = d.email || '';
        } else {
          document.getElementById('delegate-name').value = '';
          document.getElementById('delegate-email').value = '';
        }
        updateDelegateUI();
        delegateOverlay.classList.add('open');
      }

      document.getElementById('delegate-modal-cancel').addEventListener('click', () => {
        delegateOverlay.classList.remove('open');
      });

      document.getElementById('delegate-modal-clear').addEventListener('click', () => {
        clearDelegation();
        updateDelegateUI();
        delegateOverlay.classList.remove('open');
        showToast('Delegation removed — you are the sole approver again');
      });

      document.getElementById('delegate-modal-save').addEventListener('click', () => {
        const name = document.getElementById('delegate-name').value.trim();
        const email = document.getElementById('delegate-email').value.trim();
        const period = document.getElementById('delegate-period').value;

        if (!name || !email) {
          showToast('Please enter both name and email');
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          showToast('Please enter a valid email address');
          return;
        }
        if (!email.toLowerCase().includes('@taqa.')) {
          showToast('Please use your official TAQA email address');
          return;
        }

        const now = new Date();
        saveDelegation({
          name, email, period,
          setDate: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        });

        updateDelegateUI();
        delegateOverlay.classList.remove('open');
        showToast('✓ Delegation saved — ' + name + ' will receive approval requests');
      });

      delegateOverlay.addEventListener('click', e => {
        if (e.target === delegateOverlay) delegateOverlay.classList.remove('open');
      });

      // Init on load
      updateDelegateUI();

    }); // end DOMContentLoaded dashboard
  }

  // ─────────────────────────────────────────────────────────
  // FIX 9 — GLOSSARY PAGE
  // ─────────────────────────────────────────────────────────

  if (page === 'glossary.html') {

    injectStyles(`
      .glossary-pending-badge {
        display: inline-block; padding: 2px 9px; border-radius: 99px;
        font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
        background: rgba(245,158,11,0.12); color: #f59e0b;
        border: 1px solid rgba(245,158,11,0.25); margin-left: 8px;
        vertical-align: middle;
      }
      .glossary-pending-notice {
        font-size: 12px; color: var(--text-dim, #94a3b8);
        margin-top: 4px; font-style: italic;
      }
    `);

    document.addEventListener('DOMContentLoaded', function () {

      // FIX 9: Hook into the "Submit Term" button
      function interceptGlossarySubmit() {
        const submitBtn = document.querySelector(
          'button[type="submit"], .submit-term-btn, [class*="submit-term"], form button:last-child'
        );
        const form = document.querySelector('form, .add-term-form, [class*="term-form"]');

        if (!submitBtn || submitBtn.dataset.fixedGlossary) return;
        submitBtn.dataset.fixedGlossary = '1';

        submitBtn.addEventListener('click', function (e) {
          // Let the original handler run first, then find the new card and mark it
          setTimeout(() => {
            // Find the most recently added term card that doesn't have a pending badge
            const allCards = document.querySelectorAll('.term-card, .glossary-card, [class*="term-item"]:not([data-pending-marked])');
            const newest = allCards[allCards.length - 1];
            if (newest) {
              newest.dataset.pendingMarked = '1';
              newest.style.opacity = '0.75';
              newest.style.borderLeft = '3px solid #f59e0b';

              // Add pending badge next to the term name
              const termName = newest.querySelector('h3, h4, .term-name, strong, [class*="term-title"]');
              if (termName) {
                const badge = document.createElement('span');
                badge.className = 'glossary-pending-badge';
                badge.textContent = 'PENDING REVIEW';
                termName.appendChild(badge);
              }

              // Add notice
              const notice = document.createElement('div');
              notice.className = 'glossary-pending-notice';
              notice.textContent = 'This term is awaiting review by a Knowledge Controller before it goes live.';
              newest.appendChild(notice);
            }

            showToast('Term submitted — pending review before going live');
          }, 300);
        });
      }

      interceptGlossarySubmit();
      setTimeout(interceptGlossarySubmit, 1000);
    });
  }

  // ─────────────────────────────────────────────────────────
  // FIX 10 — SUPPORT TICKET REFERENCE NUMBER
  // ─────────────────────────────────────────────────────────

  if (page === 'support-ticket.html') {

    document.addEventListener('DOMContentLoaded', function () {

      function generateTicketRef() {
        const year = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const suffix = letters[Math.floor(Math.random() * letters.length)] +
                       letters[Math.floor(Math.random() * letters.length)];
        return `TKT-${year}-${rand}-${suffix}`;
      }

      // Replace broken ticket ref on page
      function fixTicketRef() {
        document.querySelectorAll('*').forEach(el => {
          if (el.children.length === 0 && el.textContent.includes('TKT-2026---')) {
            el.textContent = el.textContent.replace(/TKT-2026---/g, generateTicketRef());
          }
        });

        // Also target common selectors
        const refEl = document.querySelector('.ticket-ref, .ref-number, [class*="ticket-ref"], [class*="ref-num"]');
        if (refEl && refEl.textContent.includes('---')) {
          refEl.textContent = generateTicketRef();
        }
      }

      // Hook into submit button to generate ref on submission
      const submitBtn = document.querySelector('[type="submit"], .submit-ticket-btn, button:last-of-type');
      if (submitBtn) {
        submitBtn.addEventListener('click', function () {
          setTimeout(fixTicketRef, 400);
        });
      }

      // Fix any pre-rendered broken refs
      fixTicketRef();

      // Watch for dynamic rendering of the success message
      const observer = new MutationObserver(fixTicketRef);
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

})();