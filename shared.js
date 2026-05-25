// ── Toast ──
(function(){
  var s=document.createElement('style');
  s.textContent=
    '.toast-wrap{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;}'+
    '.toast{display:inline-flex;align-items:center;gap:8px;padding:11px 20px;border-radius:12px;font-size:13px;font-weight:600;letter-spacing:0.2px;white-space:nowrap;box-shadow:0 8px 32px rgba(0,0,0,0.28);pointer-events:none;animation:toastIn 0.3s cubic-bezier(.34,1.56,.64,1) forwards;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);}'+
    '.toast.success{background:rgba(0,104,106,0.96);color:#fff;border:1px solid rgba(0,191,178,0.35);}'+
    '.toast.error{background:rgba(220,38,38,0.96);color:#fff;border:1px solid rgba(239,68,68,0.4);}'+
    '.toast.info{background:rgba(15,23,42,0.96);color:#e2e8f0;border:1px solid rgba(255,255,255,0.12);}'+
    '.toast.out{animation:toastOut 0.25s ease forwards;}'+
    '@keyframes toastIn{from{opacity:0;transform:translateY(10px) scale(0.95);}to{opacity:1;transform:translateY(0) scale(1);}}'+
    '@keyframes toastOut{to{opacity:0;transform:translateY(8px) scale(0.95);}}'+
    'html[data-theme="dark"] .toast.success{background:rgba(0,72,74,0.97);}'+
    'html[data-theme="dark"] .toast.info{background:rgba(8,15,28,0.97);}';
  document.head.appendChild(s);
  var wrap=document.createElement('div');
  wrap.className='toast-wrap';
  wrap.id='toast-wrap';
  document.body.appendChild(wrap);
})();
window.showToast=function(msg,type){
  type=type||'success';
  var wrap=document.getElementById('toast-wrap');
  if(!wrap)return;
  var t=document.createElement('div');
  t.className='toast '+type;
  t.textContent=msg;
  wrap.appendChild(t);
  setTimeout(function(){
    t.classList.add('out');
    setTimeout(function(){t.remove();},300);
  },2600);
};

// ── Back-to-top (only on pages without .scroll-top-btn) ──
(function(){
  if(document.getElementById('scroll-top-btn'))return;
  var s=document.createElement('style');
  s.textContent=
    '#back-to-top{position:fixed;bottom:24px;right:24px;width:40px;height:40px;border-radius:12px;background:var(--primary,#00686A);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 4px 20px rgba(0,104,106,0.45);opacity:0;transform:translateY(10px);transition:opacity 0.3s,transform 0.3s;z-index:9100;pointer-events:none;}'+
    '#back-to-top.visible{opacity:1;transform:translateY(0);pointer-events:auto;}'+
    '#back-to-top:hover{background:var(--primary-light,#00BFB2);transform:translateY(-2px);}';
  document.head.appendChild(s);
  var btn=document.createElement('button');
  btn.id='back-to-top';
  btn.title='Back to top';
  btn.setAttribute('aria-label','Back to top');
  btn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
  btn.onclick=function(){window.scrollTo({top:0,behavior:'smooth'});};
  document.body.appendChild(btn);
  window.addEventListener('scroll',function(){
    btn.classList.toggle('visible',window.scrollY>300);
  },{passive:true});
})();

// ── Auto breadcrumb for static pages ──
(function(){
  var p=location.pathname;
  var map={'ai-search':'AI Search','glossary':'Field Glossary','upload':'Upload Document','support-ticket':'Ask an Expert'};
  var label=null;
  for(var k in map){if(p.indexOf(k)>-1){label=map[k];break;}}
  if(!label)return;
  var s=document.createElement('style');
  s.textContent=
    '.auto-bc{padding:9px 32px;font-size:11px;font-weight:500;color:var(--text-muted,#94a3b8);display:flex;align-items:center;gap:6px;border-bottom:1px solid var(--glass-border,rgba(255,255,255,0.08));}'+
    '.auto-bc a{color:var(--text-muted,#94a3b8);text-decoration:none;transition:color 0.2s;}'+
    '.auto-bc a:hover{color:var(--primary,#00686A);}'+
    '.auto-bc .bc-sep{opacity:0.4;}'+
    '.auto-bc .bc-cur{color:var(--primary,#00686A);font-weight:600;}'+
    'html[data-theme="dark"] .auto-bc{border-color:rgba(255,255,255,0.05);}';
  document.head.appendChild(s);
  var bc=document.createElement('div');
  bc.className='auto-bc';
  bc.innerHTML='<a href="index.html">Home</a><span class="bc-sep">›</span><span class="bc-cur">'+label+'</span>';
  var nav=document.querySelector('nav');
  if(nav&&nav.parentNode)nav.parentNode.insertBefore(bc,nav.nextSibling);
})();

// ── Reading progress bar ──
(function(){
  var s=document.createElement('style');
  s.textContent='#read-progress{position:fixed;top:0;left:0;height:3px;z-index:9998;pointer-events:none;background:linear-gradient(90deg,#00686A,#00BFB2);width:0;opacity:0.85;transition:width 80ms linear;}';
  document.head.appendChild(s);
  var bar=document.createElement('div');
  bar.id='read-progress';
  document.body.appendChild(bar);
  window.addEventListener('scroll',function(){
    var doc=document.documentElement;
    var scrollable=doc.scrollHeight-doc.clientHeight;
    var pct=scrollable>0?(window.scrollY/scrollable)*100:0;
    bar.style.width=pct+'%';
  },{passive:true});
})();

// ── Keyboard shortcuts modal (?) ──
(function(){
  var s=document.createElement('style');
  s.textContent=
    '#shortcut-overlay{position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,0.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity 0.2s;}'+
    '#shortcut-overlay.open{opacity:1;pointer-events:auto;}'+
    '#shortcut-box{background:#0d1a26;border:1px solid rgba(0,191,178,0.2);border-radius:20px;padding:28px 32px;min-width:320px;max-width:90vw;box-shadow:0 24px 64px rgba(0,0,0,0.5);transform:scale(0.96);transition:transform 0.2s;}'+
    '#shortcut-overlay.open #shortcut-box{transform:scale(1);}'+
    '#shortcut-box h3{font-size:15px;font-weight:700;color:#fff;margin:0 0 20px;display:flex;align-items:center;justify-content:space-between;font-family:"Urbanist",sans-serif;}'+
    '.sc-close{background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.7);width:28px;height:28px;border-radius:8px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;line-height:1;transition:background 0.15s;}'+
    '.sc-close:hover{background:rgba(255,255,255,0.15);}'+
    '.sc-table{width:100%;border-collapse:collapse;}'+
    '.sc-table tr+tr td{border-top:1px solid rgba(255,255,255,0.06);}'+
    '.sc-table td{padding:11px 0;font-size:13px;color:rgba(255,255,255,0.6);}'+
    '.sc-table td:first-child{padding-right:24px;white-space:nowrap;}'+
    '.sc-key{display:inline-flex;align-items:center;justify-content:center;padding:2px 8px;border-radius:6px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);font-size:11px;font-weight:600;color:#e2e8f0;font-family:monospace;min-width:24px;}'+
    '.sc-hint{font-size:11px;color:rgba(0,191,178,0.6);margin-top:18px;text-align:center;}'+
    'html[data-theme="dark"] #shortcut-box{background:#060e18;}';
  document.head.appendChild(s);
  var ov=document.createElement('div');
  ov.id='shortcut-overlay';
  ov.innerHTML=
    '<div id="shortcut-box">'+
    '<h3>Keyboard Shortcuts <button class="sc-close" id="sc-close">×</button></h3>'+
    '<table class="sc-table">'+
    '<tr><td><span class="sc-key">/</span></td><td>Focus search on current page</td></tr>'+
    '<tr><td><span class="sc-key">?</span></td><td>Show / hide this panel</td></tr>'+
    '<tr><td><span class="sc-key">Esc</span></td><td>Close modals · dismiss overlay</td></tr>'+
    '<tr><td><span class="sc-key">Tab</span></td><td>Navigate interactive elements</td></tr>'+
    '</table>'+
    '<p class="sc-hint">Part of <em style="color:#00BFB2;font-style:italic;">The One</em> Platform</p>'+
    '</div>';
  document.body.appendChild(ov);
  document.getElementById('sc-close').onclick=function(){ov.classList.remove('open');};
  ov.addEventListener('click',function(e){if(e.target===ov)ov.classList.remove('open');});
  document.addEventListener('keydown',function(e){
    if(e.key==='?'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){
      e.preventDefault();ov.classList.toggle('open');
    }
    if(e.key==='Escape')ov.classList.remove('open');
  });
})();

// ── Offline banner ──
(function(){
  var s=document.createElement('style');
  s.textContent=
    '#offline-banner{position:fixed;bottom:0;left:0;right:0;z-index:9995;background:#1a2535;border-top:1px solid rgba(245,158,11,0.3);padding:10px 24px;display:none;align-items:center;justify-content:center;gap:10px;font-size:13px;color:rgba(255,255,255,0.8);font-weight:500;}'+
    '#offline-banner a{color:#00BFB2;text-decoration:none;font-weight:600;}';
  document.head.appendChild(s);
  var banner=document.createElement('div');
  banner.id='offline-banner';
  banner.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"><path d="M1 1l22 22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>You\'re offline — viewing cached content. <a href="#" onclick="location.reload();return false;">Retry</a>';
  document.body.appendChild(banner);
  window.addEventListener('offline',function(){banner.style.display='flex';});
  window.addEventListener('online',function(){banner.style.display='none';if(window.showToast)window.showToast('Back online!');});
  if(!navigator.onLine)banner.style.display='flex';
})();
