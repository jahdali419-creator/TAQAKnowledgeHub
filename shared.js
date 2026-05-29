// ── Global mobile overflow fix ──
(function(){
  var s=document.createElement('style');
  s.textContent=
    'html{overflow-x:hidden;max-width:100vw;}'+
    'body{overflow-x:hidden;width:100%;max-width:100%;}'+
    '*{box-sizing:border-box;}'+
    /* clamp decorative wide elements that bleed past viewport */
    '.hub-glow,.bg-blob,.bg-blob-1,.bg-blob-2,.bg-blob-3{max-width:100vw!important;overflow:hidden;}'+
    'img,svg:not([class*="icon"]):not(#stp-ring){max-width:100%;}'+
    '@media(max-width:768px){'+
      /* prevent any child from being wider than screen */
      '.page-wrapper>*,.main-wrapper,.main-inner,.search-hub,'+
      '.results-section,.prompts-section,.chat-log,'+
      '.seg-panel,.doc-list,.doc-toolbar{max-width:100vw!important;overflow-x:hidden!important;}'+
      /* stats strips that use flex but don't wrap */
      '.stats-strip-inner,.stat-pill-row{flex-wrap:wrap!important;}'+
      /* hero sections: contain text */
      'h1,h2,h3,p{word-break:break-word;overflow-wrap:break-word;}'+
    '}';
  document.head.appendChild(s);
})();

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

// ── Mobile nav hamburger (injected on all pages that have a nav) ──
(function(){
  var s=document.createElement('style');
  s.textContent=
    '.nav-hamburger{display:none;background:none;border:1px solid rgba(0,0,0,0.1);border-radius:7px;padding:7px 9px;cursor:pointer;flex-direction:column;gap:4px;align-items:center;justify-content:center;flex-shrink:0;}'+
    'html[data-theme="dark"] .nav-hamburger{border-color:rgba(255,255,255,0.15);}'+
    '.nav-hamburger span{display:block;width:17px;height:2px;background:#64748b;border-radius:2px;transition:all 0.25s;}'+
    '.nav-mobile-menu{display:none;position:fixed;left:0;right:0;z-index:998;background:rgba(255,255,255,0.97);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,0,0,0.08);padding:8px 20px 20px;box-shadow:0 8px 32px rgba(0,0,0,0.1);}'+
    '.nav-mobile-menu.open{display:block;}'+
    '.nav-mobile-menu a{display:block;padding:13px 0;font-size:15px;font-weight:500;color:#1c2b3a;text-decoration:none;border-bottom:1px solid rgba(0,0,0,0.07);transition:color 0.2s;}'+
    '.nav-mobile-menu a:last-child{border-bottom:none;}'+
    '.nav-mobile-menu a.active,.nav-mobile-menu a:hover{color:#00686A;}'+
    'html[data-theme="dark"] .nav-mobile-menu{background:rgba(14,24,36,0.97);border-color:#243044;}'+
    'html[data-theme="dark"] .nav-mobile-menu a{color:#e2e8f0;border-color:#243044;}'+
    '@media(max-width:640px){'+
      '.nav-hamburger{display:flex!important;}'+
      '.nav-links{display:none!important;}'+
      '.nav-right a.btn,.nav-right .btn-primary,.nav-right .btn-outline,.nav-right .btn-ghost{display:none!important;}'+
    '}';
  document.head.appendChild(s);

  // Inject hamburger into .nav-right (index.html already has one — skip)
  if(!document.getElementById('nav-hamburger')){
    var nr=document.querySelector('.nav-right');
    if(nr){
      var hb=document.createElement('button');
      hb.id='nav-hamburger';hb.className='nav-hamburger';hb.setAttribute('aria-label','Menu');
      hb.innerHTML='<span></span><span></span><span></span>';
      nr.insertBefore(hb,nr.firstChild);
    }
  }

  // Inject mobile dropdown menu (index.html already has one — skip)
  if(!document.getElementById('nav-mobile-menu')){
    var nav=document.querySelector('nav');
    if(nav){
      var p=location.pathname;
      var items=[
        {href:'index.html',label:'Home'},
        {href:'ai-search.html',label:'Document Search'},
        {href:'glossary.html',label:'Field Glossary'},
        {href:'upload.html',label:'Upload'},
        {href:'support-ticket.html',label:'Ask Expert'}
      ];
      var menu=document.createElement('div');
      menu.id='nav-mobile-menu';menu.className='nav-mobile-menu';
      items.forEach(function(l){
        var a=document.createElement('a');
        a.href=l.href;a.textContent=l.label;
        var key=l.href.replace('.html','');
        var active=(l.href==='index.html')
          ?(p.endsWith('/')||p.endsWith('/index.html'))
          :(p.indexOf('/'+key+'.html')>-1);
        if(active)a.className='active';
        menu.appendChild(a);
      });
      nav.parentNode.insertBefore(menu,nav.nextSibling);
    }
  }

  // Toggle (overrides index.html's identical version safely)
  window.toggleMobileNav=function(){
    var menu=document.getElementById('nav-mobile-menu');
    var nav=document.querySelector('nav');
    if(menu){
      if(nav&&!menu.style.top)menu.style.top=nav.offsetHeight+'px';
      menu.classList.toggle('open');
    }
  };

  // Wire hamburger click
  document.addEventListener('click',function(e){
    var hb=document.getElementById('nav-hamburger');
    if(hb&&(hb===e.target||hb.contains(e.target)))window.toggleMobileNav();
  });

  // Close when clicking outside
  document.addEventListener('click',function(e){
    var menu=document.getElementById('nav-mobile-menu');
    var hb=document.getElementById('nav-hamburger');
    if(menu&&menu.classList.contains('open')&&!menu.contains(e.target)&&hb&&!hb.contains(e.target))
      menu.classList.remove('open');
  });
})();

// ── PWA Install Prompt (mobile only) ──
(function(){
  // Skip if already installed in standalone mode
  if(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)return;
  if(window.navigator.standalone)return;
  // Skip on desktop
  if(window.innerWidth>=768)return;
  // Skip if dismissed within 30 days
  var KEY='taqa-install-dismissed';
  var ts=localStorage.getItem(KEY);
  if(ts&&(Date.now()-parseInt(ts,10))<30*24*60*60*1000)return;

  var ua=navigator.userAgent;
  var isIPhone=/iphone/i.test(ua);
  // True Safari on iPhone: has Version/, has Safari, no other browser markers
  var isSafariIPhone=isIPhone&&/version\//i.test(ua)&&/safari/i.test(ua)&&!/crios|fxios|edgios|opios|opt\/|gsa\//i.test(ua);
  var deferredPrompt=null;

  var s=document.createElement('style');
  s.textContent=
    '#pwa-overlay{position:fixed;inset:0;z-index:99997;background:rgba(0,0,0,0.4);opacity:0;pointer-events:none;transition:opacity 0.3s;}'+
    '#pwa-overlay.pwa-open{opacity:1;pointer-events:auto;}'+
    '#pwa-sheet{position:fixed;bottom:0;left:0;right:0;z-index:99998;'+
    'background:rgba(255,255,255,0.99);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);'+
    'border-top:1px solid rgba(0,0,0,0.07);border-radius:24px 24px 0 0;'+
    'padding:16px 24px 36px;box-shadow:0 -8px 40px rgba(0,0,0,0.18);'+
    'transform:translateY(100%);transition:transform 0.4s cubic-bezier(.32,1.12,.64,1);pointer-events:none;}'+
    '#pwa-sheet.pwa-open{transform:translateY(0);pointer-events:auto;}'+
    'html[data-theme="dark"] #pwa-sheet{background:rgba(11,20,34,0.99);border-color:rgba(255,255,255,0.07);}'+
    '.pwa-handle{width:36px;height:4px;border-radius:2px;background:rgba(0,0,0,0.12);margin:0 auto 22px;}'+
    'html[data-theme="dark"] .pwa-handle{background:rgba(255,255,255,0.1);}'+
    '.pwa-row{display:flex;align-items:flex-start;gap:16px;margin-bottom:22px;}'+
    '.pwa-app-icon{width:52px;height:52px;border-radius:14px;flex-shrink:0;'+
    'background:linear-gradient(135deg,#00686A,#00BFB2);display:flex;align-items:center;justify-content:center;'+
    'box-shadow:0 6px 20px rgba(0,104,106,0.38);}'+
    '.pwa-app-icon svg{color:#fff;}'+
    '.pwa-text-block{flex:1;}'+
    '.pwa-title{font-family:"Urbanist",sans-serif;font-size:18px;font-weight:800;color:#1a2235;margin-bottom:4px;line-height:1.2;}'+
    'html[data-theme="dark"] .pwa-title{color:#dde4ef;}'+
    '.pwa-sub{font-size:13px;color:#64748b;line-height:1.5;}'+
    '.pwa-steps{margin-bottom:20px;}'+
    '.pwa-step{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.06);}'+
    '.pwa-step:last-child{border-bottom:none;}'+
    'html[data-theme="dark"] .pwa-step{border-color:rgba(255,255,255,0.06);}'+
    '.pwa-step-n{width:26px;height:26px;border-radius:50%;background:rgba(0,104,106,0.1);flex-shrink:0;'+
    'display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#00686A;}'+
    '.pwa-step-t{font-size:13px;color:#64748b;line-height:1.45;}'+
    '.pwa-step-t strong{color:#1a2235;}'+
    'html[data-theme="dark"] .pwa-step-t strong{color:#dde4ef;}'+
    '.pwa-install-btn{display:block;width:100%;padding:15px;border-radius:14px;text-align:center;'+
    'font-size:15px;font-weight:700;color:#fff;border:none;cursor:pointer;font-family:"Inter",sans-serif;'+
    'background:linear-gradient(135deg,#00686A,#00BFB2);box-shadow:0 6px 20px rgba(0,104,106,0.38);'+
    'transition:transform 0.2s,box-shadow 0.2s;margin-bottom:10px;}'+
    '.pwa-install-btn:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,104,106,0.5);}'+
    '.pwa-later{display:block;width:100%;padding:13px;background:none;border:none;'+
    'font-size:13.5px;color:#64748b;cursor:pointer;font-family:"Inter",sans-serif;text-align:center;}';
  document.head.appendChild(s);

  var overlay=document.createElement('div');
  overlay.id='pwa-overlay';
  document.body.appendChild(overlay);

  var sheet=document.createElement('div');
  sheet.id='pwa-sheet';

  var APP_ICON='<div class="pwa-app-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>';

  // Safari on iPhone: show 3-step install guide
  var iosSafariContent=
    '<div class="pwa-handle"></div>'+
    '<div class="pwa-row">'+APP_ICON+
      '<div class="pwa-text-block">'+
        '<div class="pwa-title">Install The One</div>'+
        '<div class="pwa-sub">Access all TAQA documents offline, anytime.</div>'+
      '</div>'+
    '</div>'+
    '<div class="pwa-steps">'+
      '<div class="pwa-step"><div class="pwa-step-n">1</div><div class="pwa-step-t">Tap the <strong>Share</strong> button at the bottom <strong>(↑)</strong></div></div>'+
      '<div class="pwa-step"><div class="pwa-step-n">2</div><div class="pwa-step-t">Scroll down and tap <strong>"Add to Home Screen"</strong></div></div>'+
      '<div class="pwa-step"><div class="pwa-step-n">3</div><div class="pwa-step-t">Tap <strong>"Add"</strong> — the app will appear on your home screen</div></div>'+
    '</div>'+
    '<button class="pwa-later" id="pwa-later">Maybe later</button>';

  // Other iPhone browsers (Chrome, Firefox, Edge…): inform them Safari is required
  var iosOtherContent=
    '<div class="pwa-handle"></div>'+
    '<div class="pwa-row">'+APP_ICON+
      '<div class="pwa-text-block">'+
        '<div class="pwa-title">Install The One</div>'+
        '<div class="pwa-sub">Access all TAQA documents offline, anytime.</div>'+
      '</div>'+
    '</div>'+
    '<div class="pwa-steps">'+
      '<div class="pwa-step"><div class="pwa-step-n" style="font-size:14px;">!</div>'+
        '<div class="pwa-step-t"><strong>Open this page in Safari</strong> to install the app.<br>'+
        '<span style="font-size:11.5px;margin-top:3px;display:block;color:#94a3b8;">Apple only allows app installation through Safari — this is an Apple restriction, not ours.</span></div>'+
      '</div>'+
    '</div>'+
    '<button class="pwa-later" id="pwa-later">Got it</button>';

  // Android: native install button
  var androidContent=
    '<div class="pwa-handle"></div>'+
    '<div class="pwa-row">'+APP_ICON+
      '<div class="pwa-text-block">'+
        '<div class="pwa-title">Install The One</div>'+
        '<div class="pwa-sub">Access all TAQA documents offline, anytime.</div>'+
      '</div>'+
    '</div>'+
    '<button class="pwa-install-btn" id="pwa-install-btn">Install App</button>'+
    '<button class="pwa-later" id="pwa-later">Maybe later</button>';

  var content=isSafariIPhone?iosSafariContent:(isIPhone?iosOtherContent:androidContent);
  sheet.innerHTML=content;
  document.body.appendChild(sheet);

  function dismiss(){
    sheet.classList.remove('pwa-open');
    overlay.classList.remove('pwa-open');
    localStorage.setItem(KEY,Date.now().toString());
  }
  function showSheet(){
    sheet.classList.add('pwa-open');
    overlay.classList.add('pwa-open');
  }

  overlay.addEventListener('click',dismiss);
  document.addEventListener('click',function(e){
    if(document.getElementById('pwa-later')&&e.target===document.getElementById('pwa-later'))dismiss();
  });

  if(isIPhone){
    // Show to all iPhone users — Safari gets install steps, others get "open in Safari" guidance
    setTimeout(showSheet,2500);
  } else {
    window.addEventListener('beforeinstallprompt',function(e){
      e.preventDefault();
      deferredPrompt=e;
      setTimeout(showSheet,2000);
      document.addEventListener('click',function(e2){
        var btn=document.getElementById('pwa-install-btn');
        if(btn&&e2.target===btn){
          if(deferredPrompt){
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(function(r){
              if(r.outcome==='accepted')dismiss();
              deferredPrompt=null;
            });
          }
        }
      });
    });
  }
})();
