// ── JS error tracking (stores last 50 errors in localStorage) ──
(function(){
  var KEY='taqa-errors';
  window.addEventListener('error',function(e){
    try{
      var errs=JSON.parse(localStorage.getItem(KEY)||'[]');
      errs.push({msg:e.message,src:e.filename,line:e.lineno,col:e.colno,t:Date.now(),page:location.pathname});
      if(errs.length>50) errs=errs.slice(-50);
      localStorage.setItem(KEY,JSON.stringify(errs));
    }catch(ex){}
  });
  window.addEventListener('unhandledrejection',function(e){
    try{
      var errs=JSON.parse(localStorage.getItem(KEY)||'[]');
      errs.push({msg:'UnhandledRejection: '+(e.reason&&e.reason.message||String(e.reason)),t:Date.now(),page:location.pathname});
      if(errs.length>50) errs=errs.slice(-50);
      localStorage.setItem(KEY,JSON.stringify(errs));
    }catch(ex){}
  });
})();

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
    '}'+
    /* ── Compact gray bar text on mobile ── */
    '@media(max-width:640px){'+
      '.stat-pill,.filter-chip,.filter-label,.cat-pill,.alpha-btn,'+
      '.prompts-tag,.prompt-chip,.char-count,.stat-sep,'+
      '.seg-filters span,.source-card-seg,.source-card-type,'+
      '.ir-seg,.ir-header,.ir-footer,.auto-bc,'+
      '.hero-stat,.badge,.tag,.label-pill,'+
      '.search-meta,.doc-meta,.doc-tag,.doc-type,'+
      '.sidebar-label,.section-label,.list-meta{'+
        'font-size:10px!important;'+
      '}'+
      '.stat-pill{padding:3px 9px!important;}'+
      '.filter-chip{padding:3px 9px!important;}'+
      '.cat-pill{padding:3px 10px!important;}'+
      '.prompt-chip{font-size:11px!important;padding:5px 11px!important;}'+
    '}';
  document.head.appendChild(s);
})();

// ── Touch target minimum size (44×44px) ──
(function(){
  var s=document.createElement('style');
  s.textContent=
    '.dark-toggle{min-width:44px!important;min-height:44px!important;}'+
    '.bell-btn{min-width:44px!important;min-height:44px!important;}'+
    '.file-remove,.photo-thumb-del,.annot-del,.bm-x,.qr-close{min-width:44px!important;min-height:44px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;}'+
    '@media(max-width:768px){'+
      '.btn,.nav-links a,.mob-seg-link{min-height:44px!important;display:inline-flex!important;align-items:center!important;}'+
      '.annot-tool-btn{min-width:44px!important;min-height:44px!important;}'+
    '}';
  document.head.appendChild(s);
})();

// ── Reduce motion for users who prefer it ──
(function(){
  var s=document.createElement('style');
  s.textContent=
    '@media(prefers-reduced-motion:reduce){'+
      '*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;}'+
      '.hero-bg-layer,.hero-bg-img,.bg-blob-1,.bg-blob-2,.bg-blob-3,.page-hero-bg{animation:none!important;}'+
    '}';
  document.head.appendChild(s);
})();

// ── Toast ──
(function(){
  var s=document.createElement('style');
  s.textContent=
    '.toast-wrap{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;}'+
    '.toast{display:inline-flex;align-items:center;gap:8px;padding:11px 20px;border-radius:12px;font-size:13px;font-weight:600;letter-spacing:0.2px;white-space:nowrap;box-shadow:0 8px 32px rgba(0,0,0,0.28);pointer-events:none;animation:toastIn 0.3s cubic-bezier(.34,1.56,.64,1) forwards;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);}'+
    '.toast.success{background:rgba(0,93,99,0.96);color:#fff;border:1px solid rgba(0,187,182,0.35);}'+
    '.toast.error{background:rgba(220,38,38,0.96);color:#fff;border:1px solid rgba(239,68,68,0.4);}'+
    '.toast.info{background:rgba(19,35,35,0.96);color:#C7DBDD;border:1px solid rgba(255,255,255,0.12);}'+
    '.toast.out{animation:toastOut 0.25s ease forwards;}'+
    '@keyframes toastIn{from{opacity:0;transform:translateY(10px) scale(0.95);}to{opacity:1;transform:translateY(0) scale(1);}}'+
    '@keyframes toastOut{to{opacity:0;transform:translateY(8px) scale(0.95);}}'+
    'html[data-taqa-theme="dark"] .toast.success{background:rgba(0,72,74,0.97);}'+
    'html[data-taqa-theme="dark"] .toast.info{background:rgba(0,19,20,0.97);}';
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
    '#back-to-top{position:fixed;bottom:24px;right:24px;width:40px;height:40px;border-radius:12px;background:var(--primary,#005D63);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 4px 20px rgba(0,93,99,0.45);opacity:0;transform:translateY(10px);transition:opacity 0.3s,transform 0.3s;z-index:9100;pointer-events:none;}'+
    '#back-to-top.visible{opacity:1;transform:translateY(0);pointer-events:auto;}'+
    '#back-to-top:hover{background:var(--primary-light,#00BBB6);transform:translateY(-2px);}';
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
    '.auto-bc{padding:9px 32px;font-size:11px;font-weight:500;color:var(--text-muted,#756A61);display:flex;align-items:center;gap:6px;border-bottom:1px solid var(--glass-border,rgba(255,255,255,0.08));}'+
    '.auto-bc a{color:var(--text-muted,#756A61);text-decoration:none;transition:color 0.2s;}'+
    '.auto-bc a:hover{color:var(--primary,#005D63);}'+
    '.auto-bc .bc-sep{opacity:0.4;}'+
    '.auto-bc .bc-cur{color:var(--primary,#005D63);font-weight:600;}'+
    'html[data-taqa-theme="dark"] .auto-bc{border-color:rgba(255,255,255,0.05);}';
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
  s.textContent='#read-progress{position:fixed;top:0;left:0;height:3px;z-index:9998;pointer-events:none;background:#005D63;width:0;opacity:0.85;transition:width 80ms linear;}';
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
    '#shortcut-box{background:#002326;border:1px solid rgba(0,187,182,0.2);border-radius:20px;padding:28px 32px;min-width:320px;max-width:90vw;box-shadow:0 24px 64px rgba(0,0,0,0.5);transform:scale(0.96);transition:transform 0.2s;}'+
    '#shortcut-overlay.open #shortcut-box{transform:scale(1);}'+
    '#shortcut-box h3{font-size:15px;font-weight:700;color:#fff;margin:0 0 20px;display:flex;align-items:center;justify-content:space-between;font-family:"BwGradual","Urbanist",sans-serif;}'+
    '.sc-close{background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.7);width:28px;height:28px;border-radius:8px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;line-height:1;transition:background 0.15s;}'+
    '.sc-close:hover{background:rgba(255,255,255,0.15);}'+
    '.sc-table{width:100%;border-collapse:collapse;}'+
    '.sc-table tr+tr td{border-top:1px solid rgba(255,255,255,0.06);}'+
    '.sc-table td{padding:11px 0;font-size:13px;color:rgba(255,255,255,0.6);}'+
    '.sc-table td:first-child{padding-right:24px;white-space:nowrap;}'+
    '.sc-key{display:inline-flex;align-items:center;justify-content:center;padding:2px 8px;border-radius:6px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);font-size:11px;font-weight:600;color:#C7DBDD;font-family:monospace;min-width:24px;}'+
    '.sc-hint{font-size:11px;color:rgba(0,187,182,0.85);margin-top:18px;text-align:center;}'+
    'html[data-taqa-theme="dark"] #shortcut-box{background:#001314;}';
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
    '<p class="sc-hint">Part of <em style="color:#00BBB6;font-style:italic;">Tech Hub</em> <span style="opacity:0.7;font-style:normal;">(working name)</span></p>'+
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
    '#offline-banner{position:fixed;bottom:0;left:0;right:0;z-index:9995;background:#002D30;border-top:1px solid rgba(245,158,11,0.3);padding:10px 24px;display:none;align-items:center;justify-content:center;gap:10px;font-size:13px;color:rgba(255,255,255,0.8);font-weight:500;}'+
    '#offline-banner a{color:#00BBB6;text-decoration:none;font-weight:600;}';
  document.head.appendChild(s);
  var banner=document.createElement('div');
  banner.id='offline-banner';
  banner.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFB81C" stroke-width="2" stroke-linecap="round"><path d="M1 1l22 22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>You\'re offline, viewing cached content. <a href="#" onclick="location.reload();return false;">Retry</a>';
  document.body.appendChild(banner);
  window.addEventListener('offline',function(){banner.style.display='flex';});
  window.addEventListener('online',function(){banner.style.display='none';if(window.showToast)window.showToast('Back online!');});
  if(!navigator.onLine)banner.style.display='flex';
})();

// ── SW update notification ──
(function(){
  if(!('serviceWorker' in navigator)) return;
  var s=document.createElement('style');
  s.textContent=
    '#sw-update-bar{position:fixed;bottom:0;left:0;right:0;z-index:9996;background:#005D63;padding:11px 20px;display:none;align-items:center;justify-content:center;gap:12px;font-size:13.5px;font-weight:600;color:#fff;box-shadow:0 -4px 20px rgba(0,93,99,0.35);}'+
    '#sw-update-bar button{background:rgba(255,255,255,0.22);border:1px solid rgba(255,255,255,0.4);color:#fff;padding:6px 16px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}'+
    '#sw-update-bar button:hover{background:rgba(255,255,255,0.35);}';
  document.head.appendChild(s);
  var bar=document.createElement('div');
  bar.id='sw-update-bar';
  bar.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.68-7.58"/></svg> New version available, <button id="sw-reload-btn">Update now</button>';
  document.body.appendChild(bar);
  navigator.serviceWorker.addEventListener('controllerchange', function(){
    window.location.reload();
  });
  navigator.serviceWorker.ready.then(function(reg){
    reg.addEventListener('updatefound', function(){
      var nw=reg.installing;
      nw.addEventListener('statechange', function(){
        if(nw.state==='installed' && navigator.serviceWorker.controller){
          bar.style.display='flex';
        }
      });
    });
  });
  document.addEventListener('click',function(e){
    if(e.target && e.target.id==='sw-reload-btn'){
      navigator.serviceWorker.ready.then(function(reg){
        if(reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'});
        else window.location.reload();
      });
    }
  });
})();

// ── Mobile nav hamburger (injected on all pages that have a nav) ──
(function(){
  var s=document.createElement('style');
  s.textContent=
    '.nav-hamburger{display:none;background:none;border:1px solid rgba(0,0,0,0.1);border-radius:7px;padding:7px 9px;cursor:pointer;flex-direction:column;gap:4px;align-items:center;justify-content:center;flex-shrink:0;}'+
    'html[data-taqa-theme="dark"] .nav-hamburger{border-color:rgba(255,255,255,0.15);}'+
    '.nav-hamburger span{display:block;width:17px;height:2px;background:#756A61;border-radius:2px;transition:all 0.25s;}'+
    '.nav-mobile-menu{display:none;position:fixed;left:0;right:0;z-index:998;background:rgba(255,255,255,0.97);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,0,0,0.08);padding:8px 20px 20px;box-shadow:0 8px 32px rgba(0,0,0,0.1);}'+
    '.nav-mobile-menu.open{display:block;}'+
    '.nav-mobile-menu a{display:block;padding:13px 0;font-size:15px;font-weight:500;color:#1E1C1A;text-decoration:none;border-bottom:1px solid rgba(0,0,0,0.07);transition:color 0.2s;}'+
    '.nav-mobile-menu a:last-child{border-bottom:none;}'+
    '.nav-mobile-menu a.active,.nav-mobile-menu a:hover{color:var(--primary-ink,#005D63);}'+
    'html[data-taqa-theme="dark"] .nav-mobile-menu{background:rgba(0,35,38,0.97);border-color:#003A3D;}'+
    'html[data-taqa-theme="dark"] .nav-mobile-menu a{color:#C7DBDD;border-color:#003A3D;}'+
    '@media(max-width:640px){'+
      '.nav-hamburger{display:flex!important;}'+
      '.nav-links{display:none!important;}'+
      '.nav-right a.btn,.nav-right .btn-primary,.nav-right .btn-outline,.nav-right .btn-ghost{display:none!important;}'+
    '}';
  document.head.appendChild(s);

  // Inject hamburger into .nav-right (index.html already has one, skip)
  if(!document.getElementById('nav-hamburger')){
    var nr=document.querySelector('.nav-right');
    if(nr){
      var hb=document.createElement('button');
      hb.id='nav-hamburger';hb.className='nav-hamburger';hb.setAttribute('aria-label','Menu');
      hb.innerHTML='<span></span><span></span><span></span>';
      nr.insertBefore(hb,nr.firstChild);
    }
  }

  // Inject mobile dropdown menu (index.html already has one, skip)
  if(!document.getElementById('nav-mobile-menu')){
    var nav=document.querySelector('nav');
    if(nav){
      var p=location.pathname;
      // The register entry is built only for a role that may open it, rather
      // than built and then removed, which would depend on which of these two
      // blocks happened to run first.
      var items=[
        {href:'index.html',label:'Home'},
        {href:'ai-search.html',label:'Document Search'}
      ];
      if (typeof TAQA_ROLE === 'undefined' || TAQA_ROLE.canRegister())
        items.push({href:'master-list.html',label:'Master List'});
      items.push({href:'glossary.html',label:'Field Glossary'},
                 {href:'support-ticket.html',label:'Ask Expert'});
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
    'html[data-taqa-theme="dark"] #pwa-sheet{background:rgba(0,35,38,0.99);border-color:rgba(255,255,255,0.07);}'+
    '.pwa-handle{width:36px;height:4px;border-radius:2px;background:rgba(0,0,0,0.12);margin:0 auto 22px;}'+
    'html[data-taqa-theme="dark"] .pwa-handle{background:rgba(255,255,255,0.1);}'+
    '.pwa-row{display:flex;align-items:flex-start;gap:16px;margin-bottom:22px;}'+
    '.pwa-app-icon{width:52px;height:52px;border-radius:14px;flex-shrink:0;'+
    'background:#005D63;display:flex;align-items:center;justify-content:center;'+
    'box-shadow:0 6px 20px rgba(0,93,99,0.38);}'+
    '.pwa-app-icon svg{color:#fff;}'+
    '.pwa-text-block{flex:1;}'+
    '.pwa-title{font-family:"BwGradual","Urbanist",sans-serif;font-size:18px;font-weight:800;color:#1E1C1A;margin-bottom:4px;line-height:1.2;}'+
    'html[data-taqa-theme="dark"] .pwa-title{color:#C7DBDD;}'+
    '.pwa-sub{font-size:13px;color:#756A61;line-height:1.5;}'+
    '.pwa-steps{margin-bottom:20px;}'+
    '.pwa-step{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.06);}'+
    '.pwa-step:last-child{border-bottom:none;}'+
    'html[data-taqa-theme="dark"] .pwa-step{border-color:rgba(255,255,255,0.06);}'+
    '.pwa-step-n{width:26px;height:26px;border-radius:50%;background:rgba(0,93,99,0.1);flex-shrink:0;'+
    'display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--primary-ink,#005D63);}'+
    '.pwa-step-t{font-size:13px;color:#756A61;line-height:1.45;}'+
    '.pwa-step-t strong{color:#1E1C1A;}'+
    'html[data-taqa-theme="dark"] .pwa-step-t strong{color:#C7DBDD;}'+
    '.pwa-install-btn{display:block;width:100%;padding:15px;border-radius:14px;text-align:center;'+
    'font-size:15px;font-weight:700;color:#fff;border:none;cursor:pointer;font-family:"Inter",sans-serif;'+
    'background:#005D63;box-shadow:0 6px 20px rgba(0,93,99,0.38);'+
    'transition:transform 0.2s,box-shadow 0.2s;margin-bottom:10px;}'+
    '.pwa-install-btn:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,93,99,0.5);}'+
    '.pwa-later{display:block;width:100%;padding:13px;background:none;border:none;'+
    'font-size:13.5px;color:#756A61;cursor:pointer;font-family:"Inter",sans-serif;text-align:center;}';
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
        '<div class="pwa-title">Install Tech Hub</div>'+
        '<div class="pwa-sub">Access all TAQA documents offline, anytime.</div>'+
      '</div>'+
    '</div>'+
    '<div class="pwa-steps">'+
      '<div class="pwa-step"><div class="pwa-step-n">1</div><div class="pwa-step-t">Tap the <strong>Share</strong> button at the bottom <strong>(↑)</strong></div></div>'+
      '<div class="pwa-step"><div class="pwa-step-n">2</div><div class="pwa-step-t">Scroll down and tap <strong>"Add to Home Screen"</strong></div></div>'+
      '<div class="pwa-step"><div class="pwa-step-n">3</div><div class="pwa-step-t">Tap <strong>"Add"</strong>, the app will appear on your home screen</div></div>'+
    '</div>'+
    '<button class="pwa-later" id="pwa-later">Maybe later</button>';

  // Other iPhone browsers (Chrome, Firefox, Edge…): inform them Safari is required
  var iosOtherContent=
    '<div class="pwa-handle"></div>'+
    '<div class="pwa-row">'+APP_ICON+
      '<div class="pwa-text-block">'+
        '<div class="pwa-title">Install Tech Hub</div>'+
        '<div class="pwa-sub">Access all TAQA documents offline, anytime.</div>'+
      '</div>'+
    '</div>'+
    '<div class="pwa-steps">'+
      '<div class="pwa-step"><div class="pwa-step-n" style="font-size:14px;">!</div>'+
        '<div class="pwa-step-t"><strong>Open this page in Safari</strong> to install the app.<br>'+
        '<span style="font-size:11.5px;margin-top:3px;display:block;color:#756A61;">Apple only allows app installation through Safari, this is an Apple restriction, not ours.</span></div>'+
      '</div>'+
    '</div>'+
    '<button class="pwa-later" id="pwa-later">Got it</button>';

  // Android: native install button
  var androidContent=
    '<div class="pwa-handle"></div>'+
    '<div class="pwa-row">'+APP_ICON+
      '<div class="pwa-text-block">'+
        '<div class="pwa-title">Install Tech Hub</div>'+
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

  // Never over a form someone is part-way through. On a phone the sheet covers
  // the lower half of the screen, which on Ask Expert lands squarely on the
  // urgency choice, and an install prompt is not worth interrupting a person
  // reporting a problem on a rig.
  var onForm = /support-ticket|upload/.test(location.pathname) ||
               !!document.querySelector('form .form-card, form .upload-form-card');
  if (onForm) return;

  if(isIPhone){
    // Show to all iPhone users, Safari gets install steps, others get "open in Safari" guidance
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

// ── Analytics ──
(function(){
  var KEY='taqa-analytics';
  window.TAQA_Track=function(event,key,extra){
    try{
      var d=JSON.parse(localStorage.getItem(KEY)||'[]');
      d.push({e:event,k:key,x:extra||null,t:Date.now()});
      if(d.length>300)d=d.slice(-300);
      localStorage.setItem(KEY,JSON.stringify(d));
    }catch(e){
      if(e&&e.name==='QuotaExceededError'){
        try{localStorage.removeItem(KEY);}catch(ex){}
      }
    }
  };
  window.TAQA_Analytics={
    get:function(){try{return JSON.parse(localStorage.getItem(KEY)||'[]');}catch(e){return[];}},
    clear:function(){try{localStorage.removeItem(KEY);}catch(e){}}
  };
  var p=location.pathname.split('/').pop()||'index.html';
  window.TAQA_Track('view',p);
})();

// ── Bookmarks ──
(function(){
  var KEY='taqa-bookmarks';
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]');}catch(e){return[];}}
  function save(a){try{localStorage.setItem(KEY,JSON.stringify(a));}catch(e){}}
  window.TAQA_Bookmarks={
    add:function(item){
      var a=load().filter(function(i){return!(i.title===item.title&&i.segId===item.segId);});
      item.ts=Date.now();a.unshift(item);save(a.slice(0,50));
    },
    remove:function(title,segId){
      save(load().filter(function(i){return!(i.title===title&&i.segId===segId);}));
    },
    toggle:function(item){
      if(this.has(item.title,item.segId)){this.remove(item.title,item.segId);return false;}
      this.add(item);return true;
    },
    has:function(title,segId){
      return load().some(function(i){return i.title===title&&i.segId===segId;});
    },
    getAll:function(){return load();}
  };
  var s=document.createElement('style');
  s.textContent=
    '.bm-fab{position:fixed;bottom:88px;right:28px;z-index:499;width:44px;height:44px;border-radius:50%;'+
    'background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);'+
    'border:1px solid rgba(0,0,0,0.09);box-shadow:0 4px 20px rgba(0,0,0,0.1);'+
    'cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:17px;line-height:1;transition:transform 0.2s,box-shadow 0.2s;padding:0;}'+
    '.bm-fab:hover{transform:scale(1.1);box-shadow:0 8px 28px rgba(0,93,99,0.28);}'+
    '.bm-cnt{position:absolute;top:-5px;right:-5px;min-width:16px;height:16px;padding:0 3px;'+
    'border-radius:50px;background:#005D63;color:#fff;font-size:9px;font-weight:700;'+
    'display:none;align-items:center;justify-content:center;border:2px solid #fff;line-height:1;}'+
    '.bm-panel{position:fixed;bottom:144px;right:28px;z-index:498;width:min(320px,calc(100vw - 40px));max-height:420px;'+
    'background:rgba(255,255,255,0.99);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);'+
    'border:1px solid rgba(0,0,0,0.08);border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,0.16);'+
    'display:none;flex-direction:column;overflow:hidden;'+
    'animation:bmIn 0.22s cubic-bezier(.34,1.56,.64,1);}'+
    '@keyframes bmIn{from{opacity:0;transform:scale(0.9) translateY(10px);}to{opacity:1;transform:none;}}'+
    '.bm-panel.open{display:flex;}'+
    '.bm-ph{padding:12px 14px 10px;border-bottom:1px solid rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}'+
    '.bm-pt{font-family:"BwGradual","Urbanist",sans-serif;font-size:13px;font-weight:700;color:#1E1C1A;}'+
    '.bm-clr{font-size:11px;color:#756A61;cursor:pointer;background:none;border:none;padding:0;font-family:"Inter",sans-serif;}'+
    '.bm-clr:hover{color:var(--stop-ink,#C8102E);}'+
    '.bm-list{flex:1;overflow-y:auto;padding:4px 0;}'+
    '.bm-item{display:flex;align-items:center;gap:10px;padding:9px 14px;text-decoration:none;transition:background 0.15s;}'+
    '.bm-item:hover{background:rgba(0,93,99,0.04);}'+
    '.bm-ico{width:30px;height:30px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;font-family:"BwGradual","Urbanist",sans-serif;}'+
    '.bm-inf{flex:1;min-width:0;}'+
    '.bm-t{font-size:12px;font-weight:600;color:#1E1C1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'+
    '.bm-m{font-size:10.5px;color:#756A61;margin-top:1px;}'+
    '.bm-x{background:none;border:none;color:#D3D8D4;cursor:pointer;font-size:16px;padding:2px;flex-shrink:0;line-height:1;}'+
    '.bm-x:hover{color:var(--stop-ink,#C8102E);}'+
    '.bm-empty{text-align:center;padding:28px 16px;color:#756A61;font-size:12.5px;line-height:1.6;}'+
    'html[data-taqa-theme="dark"] .bm-fab{background:rgba(0,35,38,0.92);border-color:rgba(255,255,255,0.08);}'+
    'html[data-taqa-theme="dark"] .bm-panel{background:rgba(0,45,48,0.99);border-color:rgba(255,255,255,0.07);}'+
    'html[data-taqa-theme="dark"] .bm-pt{color:#C7DBDD;}'+
    'html[data-taqa-theme="dark"] .bm-ph{border-color:rgba(255,255,255,0.06);}'+
    'html[data-taqa-theme="dark"] .bm-t{color:#C7DBDD;}'+
    'html[data-taqa-theme="dark"] .bm-item:hover{background:rgba(0,187,182,0.06);}';
  document.head.appendChild(s);
  var fab=document.createElement('button');
  fab.className='bm-fab';fab.title='Bookmarks';fab.setAttribute('aria-label','Bookmarks');
  fab.innerHTML='🔖<span class="bm-cnt" id="bm-cnt"></span>';
  document.body.appendChild(fab);
  var panel=document.createElement('div');panel.className='bm-panel';panel.id='bm-panel';
  document.body.appendChild(panel);
  var TC={sop:'rgba(0,93,99,0.10)',manual:'rgba(0,93,99,0.10)',standard:'rgba(0,93,99,0.10)',policy:'rgba(0,93,99,0.10)',lesson:'rgba(0,93,99,0.10)',alert:'rgba(253,105,29,0.12)',software:'rgba(0,93,99,0.10)'};
  var TT={sop:'var(--primary-ink,#005D63)',manual:'var(--primary-ink,#005D63)',standard:'var(--primary-ink,#005D63)',policy:'var(--primary-ink,#005D63)',lesson:'var(--primary-ink,#005D63)',alert:'var(--alert-ink,#A8431A)',software:'var(--primary-ink,#005D63)'};
  var TS={sop:'SOP',manual:'WI',standard:'S',policy:'P',lesson:'LL',alert:'ALT',software:'ZIP'};
  function updateBmBadge(){
    var n=window.TAQA_Bookmarks.getAll().length;
    var b=document.getElementById('bm-cnt');
    if(b){b.textContent=n;b.style.display=n>0?'flex':'none';}
  }
  function renderBmPanel(){
    var items=window.TAQA_Bookmarks.getAll();
    updateBmBadge();
    if(!items.length){
      panel.innerHTML='<div class="bm-ph"><span class="bm-pt">🔖 Bookmarks</span></div>'+
        '<div class="bm-empty">No bookmarks yet.<br>Tap ★ on any document to save it.</div>';
      return;
    }
    panel.innerHTML='<div class="bm-ph">'+
      '<span class="bm-pt">🔖 Bookmarks ('+items.length+')</span>'+
      '<div style="display:flex;gap:6px;">'+
      '<button class="bm-clr" id="bm-exp" title="Export list as text">Export</button>'+
      '<button class="bm-clr" id="bm-clr">Clear</button>'+
      '</div></div>'+
      '<div class="bm-list">'+
      items.map(function(it){
        var bg=TC[it.type]||TC.sop,tc=TT[it.type]||TT.sop,lbl=TS[it.type]||'DOC';
        return '<a class="bm-item" href="viewer.html?seg='+it.segId+'&type='+it.type+'&title='+encodeURIComponent(it.title)+'">'+
          '<div class="bm-ico" style="background:'+bg+';color:'+tc+'">'+lbl+'</div>'+
          '<div class="bm-inf"><div class="bm-t">'+it.title+'</div><div class="bm-m">'+it.segName+' · '+lbl+'</div></div>'+
          '<button class="bm-x" data-t="'+it.title.replace(/"/g,'&quot;')+'" data-s="'+it.segId+'" title="Remove">×</button>'+
        '</a>';
      }).join('')+'</div>';
    panel.addEventListener('click',function(e){
      var x=e.target.closest('.bm-x');
      if(x){e.preventDefault();e.stopPropagation();
        window.TAQA_Bookmarks.remove(x.dataset.t,x.dataset.s);
        renderBmPanel();
        document.querySelectorAll('.bm-btn[data-title="'+x.dataset.t.replace(/"/g,'&quot;')+'"]').forEach(function(b){b.textContent='☆';b.classList.remove('bm-on');});
      }
      if(e.target.id==='bm-clr'){
        try{localStorage.removeItem('taqa-bookmarks');}catch(err){}
        renderBmPanel();
        document.querySelectorAll('.bm-btn.bm-on').forEach(function(b){b.textContent='☆';b.classList.remove('bm-on');});
      }
      if(e.target.id==='bm-exp'){
        var its=window.TAQA_Bookmarks.getAll();
        var lines=['TAQA Knowledge Hub, Bookmarks','Exported: '+new Date().toLocaleDateString(),''];
        its.forEach(function(it,i){lines.push((i+1)+'. '+it.title+' | '+(it.segName||'')+' | '+(it.type||'').toUpperCase());});
        try{
          var blob=new Blob([lines.join('\n')],{type:'text/plain'});
          var url=URL.createObjectURL(blob);
          var a=document.createElement('a');a.href=url;a.download='taqa-bookmarks.txt';a.click();
          URL.revokeObjectURL(url);
        }catch(err){}
        if(window.showToast)window.showToast('Bookmarks exported','success');
      }
    },{once:false});
  }
  window.updateBmBadge=updateBmBadge;
  window.renderBmPanel=renderBmPanel;
  fab.addEventListener('click',function(e){e.stopPropagation();renderBmPanel();panel.classList.toggle('open');});
  document.addEventListener('click',function(e){
    if(!panel.contains(e.target)&&!fab.contains(e.target))panel.classList.remove('open');
  });
  setTimeout(updateBmBadge,200);
})();

// ── Keyboard "/" focuses first visible search input ──
document.addEventListener('keydown',function(e){
  if(e.key!=='/'||e.metaKey||e.ctrlKey||e.altKey)return;
  var a=document.activeElement;
  if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.contentEditable==='true'))return;
  var inputs=document.querySelectorAll('input[type="text"],input[type="search"],textarea');
  for(var i=0;i<inputs.length;i++){
    var inp=inputs[i];
    if(inp.offsetParent!==null&&!inp.disabled&&!inp.readOnly){
      e.preventDefault();inp.focus();
      try{inp.select();}catch(err){}
      break;
    }
  }
});

// ── Focus ring CSS ──
(function(){
  var s=document.createElement('style');
  s.textContent=':focus-visible{outline:2px solid #00BBB6!important;outline-offset:3px!important;border-radius:4px!important;}';
  document.head.appendChild(s);
})();

// ── Form label accessibility (auto-associate label[for] with inputs) ──
(function(){
  document.addEventListener('DOMContentLoaded',function(){
    var c=0;
    document.querySelectorAll('.fl-wrap,.form-group').forEach(function(wrap){
      var inp=wrap.querySelector('input:not([type=file]):not([type=submit]),textarea,select');
      var lbl=wrap.querySelector('label');
      if(!inp||!lbl) return;
      if(!inp.id) inp.id='taqa-field-'+(++c);
      lbl.setAttribute('for',inp.id);
    });
  });
})();

// ── iOS input zoom prevention (font-size 16px on mobile) ──
(function(){
  var s=document.createElement('style');
  s.textContent='@media(max-width:768px){input,select,textarea{font-size:16px!important;}}';
  document.head.appendChild(s);
})();


// ── Offline indicator banner ──
(function(){
  var s=document.createElement('style');
  s.textContent=
    '#offline-bar{position:fixed;top:68px;left:0;right:0;z-index:999;background:rgba(61,84,84,0.93);'+
    'color:#fff;font-size:12.5px;font-weight:500;text-align:center;font-family:"Inter",sans-serif;'+
    'max-height:0;overflow:hidden;padding:0 36px;transition:max-height 0.3s ease,padding 0.3s ease;}'+
    '#offline-bar.show{max-height:40px;padding:7px 36px;}'+
    '#offline-bar .ob-x{position:absolute;right:10px;top:50%;transform:translateY(-50%);'+
    'background:none;border:none;color:rgba(255,255,255,0.7);font-size:15px;cursor:pointer;padding:4px;line-height:1;}';
  document.head.appendChild(s);
  var bar=document.createElement('div');bar.id='offline-bar';
  bar.innerHTML='You are offline. You can still read documents you opened before.'+
    '<button class="ob-x" aria-label="Dismiss">×</button>';
  document.body.appendChild(bar);
  bar.querySelector('.ob-x').addEventListener('click',function(){bar.classList.remove('show');});
  function upd(){
    bar.classList.toggle('show',!navigator.onLine);
    if(navigator.onLine){try{localStorage.setItem('taqa-last-sync',Date.now().toString());}catch(e){}}
  }
  window.addEventListener('online',upd);
  window.addEventListener('offline',upd);
  if(navigator.onLine){try{localStorage.setItem('taqa-last-sync',Date.now().toString());}catch(e){}}
  upd();
})();

// ── Pin management ──
(function(){
  var KEY='taqa-pins';
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){return{};}}
  function save(d){try{localStorage.setItem(KEY,JSON.stringify(d));}catch(e){}}
  window.TAQA_Pins={
    pin:function(doc){
      var p=load();
      p[doc.url]={title:doc.title,type:doc.type,segId:doc.segId,segName:doc.segName,url:doc.url,ts:Date.now()};
      save(p);
    },
    unpin:function(url){var p=load();delete p[url];save(p);},
    isPinned:function(url){return!!load()[url];},
    getAll:function(){return Object.values(load());}
  };
})();

// ── Form draft auto-save ──
(function(){
  var p=location.pathname;
  var isUpload=p.indexOf('upload')>-1;
  var isTicket=p.indexOf('support-ticket')>-1;
  if(!isUpload && !isTicket) return;
  var KEY='taqa-draft-'+(isUpload?'upload':'ticket');

  function getFields(){
    return document.querySelectorAll('input:not([type=file]):not([type=submit]):not([type=button]),select,textarea');
  }

  function saveDraft(){
    var data={};
    getFields().forEach(function(f){
      if(f.id || f.name) data[f.id||f.name]=f.value;
    });
    try{ localStorage.setItem(KEY,JSON.stringify(data)); }catch(e){}
  }

  function loadDraft(){
    var raw; try{ raw=localStorage.getItem(KEY); }catch(e){ return; }
    if(!raw) return;
    var data; try{ data=JSON.parse(raw); }catch(e){ return; }
    getFields().forEach(function(f){
      var k=f.id||f.name;
      if(k && data[k] != null && data[k] !== '') f.value=data[k];
    });
    if(Object.keys(data).some(function(k){return data[k]!=='';})){
      if(window.showToast) window.showToast('Draft restored','info');
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    loadDraft();
    document.addEventListener('input', saveDraft);
    document.addEventListener('change', saveDraft);
    // Clear draft on successful submit
    var forms=document.querySelectorAll('form');
    forms.forEach(function(form){
      form.addEventListener('submit', function(){
        try{ localStorage.removeItem(KEY); }catch(e){}
      });
    });
  });
})();

/* ──────────────────────────────────────────────────────────────────────────
   The three doors
   ──────────────────────────────────────────────────────────────────────────
   One hub, one register, one URL per document. What changes between an
   employee, a Segment Director and QMS is which actions appear and which
   queue is theirs, never the address of a document or the figures behind it.

   In Azure this control does not exist: the door is decided by the Entra ID
   claim and nobody picks. It is here so the three can be walked through and
   signed off before the back end is written, and it is labelled as such.

   Changing role reloads the page rather than repainting it. Every page
   derives its queues, buttons and counts at load, so a reload is the honest
   way to show the door you just opened.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  if (typeof TAQA_ROLE === 'undefined' || typeof TAQA_ROLES === 'undefined') return;
  if (document.getElementById('taqa-door')) return;

  // Short names and one short line each. The menu is a choice, not a briefing.
  var DESK = {
    employee: { short:'Employee',  name:'Employee',         line:'Read the register' },
    owner:    { short:'Director',  name:'Segment Director', line:'Approve your segment' },
    qms:      { short:'QMS',       name:'QMS',              line:'Countersign and release' },
    auditor:  { short:'Auditor',   name:'Auditor',          line:'Read only, everything' }
  };

  var css = document.createElement('style');
  css.textContent =
    '.door-wrap{position:relative;flex-shrink:0;}' +
    '.door-btn{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 11px;' +
      'border-radius:9px;border:1px solid var(--border,#C7DBDD);background:transparent;cursor:pointer;' +
      'font-family:inherit;font-size:12.5px;font-weight:600;color:var(--text,#1E1C1A);transition:all .2s;}' +
    '.door-btn:hover{border-color:var(--primary,#005D63);color:var(--primary,#005D63);}' +
    '.door-dot{width:7px;height:7px;border-radius:50%;background:var(--primary,#005D63);flex-shrink:0;}' +
    '.door-dot.d-employee{background:#6E9294;}.door-dot.d-owner{background:#00585A;}' +
    '.door-dot.d-qms{background:#00BFB2;}.door-dot.d-auditor{background:#9AA7A7;}' +
    '.door-cap{white-space:nowrap;}' +
    '@media(max-width:760px){.door-cap{display:none;}.door-btn{padding:0 9px;}}' +
    '.door-menu{position:absolute;top:calc(100% + 8px);inset-inline-end:0;z-index:3000;width:236px;' +
      'background:var(--bg-white,#fff);border:1px solid var(--border,#C7DBDD);border-radius:13px;' +
      'box-shadow:0 14px 40px rgba(0,88,90,.15);padding:6px;display:none;}' +
    '.door-menu.open{display:block;}' +
    '.door-hd{font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;' +
      'color:var(--text-light,#756A61);padding:7px 10px 6px;}' +
    /* Grid, so the name and its line stack and the tick keeps its own column. */
    '.door-i{display:grid;grid-template-columns:auto 1fr auto;column-gap:9px;row-gap:1px;' +
      'align-items:center;width:100%;text-align:start;padding:7px 10px;border:none;' +
      'background:transparent;border-radius:9px;cursor:pointer;font-family:inherit;transition:background .15s;}' +
    '.door-i:hover{background:rgba(0,93,99,.06);}' +
    '.door-i[aria-current="true"]{background:rgba(0,93,99,.08);}' +
    '.door-i .dt{grid-column:2;font-size:13px;font-weight:700;color:var(--text,#1E1C1A);line-height:1.25;}' +
    '.door-i .dd{grid-column:2;font-size:11px;color:var(--text-muted,#524D48);line-height:1.3;}' +
    '.door-i .dk{grid-column:3;grid-row:1/3;color:var(--primary,#005D63);opacity:0;font-size:12px;font-weight:800;}' +
    '.door-i[aria-current="true"] .dk{opacity:1;}' +
    '.door-i .door-dot{grid-column:1;grid-row:1/3;}' +
    '.door-area{padding:9px 10px 4px;margin-top:3px;border-top:1px solid var(--border,#C7DBDD);}' +
    '.door-area label{display:block;font-size:9px;font-weight:700;letter-spacing:1.2px;' +
      'text-transform:uppercase;color:var(--text-light,#756A61);margin-bottom:5px;}' +
    '.door-area select{width:100%;padding:7px 9px;border:1px solid var(--border,#C7DBDD);' +
      'border-radius:8px;background:var(--bg-white,#fff);color:var(--text,#1E1C1A);' +
      'font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;}' +
    '.door-area select:focus{outline:none;border-color:var(--primary,#005D63);}' +
    'html[data-taqa-theme="dark"] .door-area select{background:#001314;border-color:#003A3D;color:#C7DBDD;}' +
    '.door-note{font-size:10px;line-height:1.45;color:var(--text-light,#756A61);' +
      'padding:7px 10px 4px;margin-top:3px;border-top:1px solid var(--border,#C7DBDD);}' +
    'html[data-taqa-theme="dark"] .door-menu{background:#002326;border-color:#003A3D;}' +
    'html[data-taqa-theme="dark"] .door-i .dk{color:#00BBB6;}' +
    'html[data-taqa-theme="dark"] .door-i[aria-current="true"]{background:rgba(0,187,182,.10);}' +
    'html[data-taqa-theme="dark"] .door-i:hover{background:rgba(0,187,182,.08);}' +
    'html[data-taqa-theme="dark"] .door-btn{border-color:#003A3D;color:#C7DBDD;}' +
    /* Acting as a delegate is never quiet. */
    '.deleg-bar{position:sticky;top:0;z-index:2500;display:flex;align-items:center;gap:10px;' +
      'padding:8px 18px;background:#FD691D;color:#fff;font-size:12.5px;font-weight:600;}' +
    '.deleg-bar b{font-weight:800;}' +
    '.deleg-bar .db-end{margin-inline-start:auto;display:flex;gap:8px;align-items:center;}' +
    '.deleg-bar button{border:1px solid rgba(255,255,255,.55);background:rgba(255,255,255,.14);' +
      'color:#fff;border-radius:7px;padding:4px 11px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;}' +
    '.deleg-bar button:hover{background:rgba(255,255,255,.26);}';
  document.head.appendChild(css);

  function cur(){ return TAQA_ROLE.current(); }

  function build() {
    var anchor = document.querySelector('.dark-toggle, #theme-btn, [onclick="toggleDark()"]');
    if (!anchor || !anchor.parentNode) return;

    var wrap = document.createElement('div');
    wrap.className = 'door-wrap';
    wrap.id = 'taqa-door';

    var k = cur(), d = DESK[k] || DESK.employee;
    var scoped = TAQA_ROLES[k].scope === 'own';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'door-btn';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    // "Director" on its own does not say which of the twenty-six.
    btn.title = scoped
      ? TAQA_ROLE.areaTitle() + ', ' + TAQA_ROLE.areaName()
      : 'You are viewing as: ' + TAQA_ROLES[k].label;
    btn.innerHTML = '<span class="door-dot d-' + k + '"></span>' +
                    '<span class="door-cap">' +
                      (scoped ? TAQA_ROLE.areaName() : d.short) + '</span>';

    var menu = document.createElement('div');
    menu.className = 'door-menu';
    menu.innerHTML =
      '<div class="door-hd">View as</div>' +
      TAQA_ROLE_ORDER.map(function (r) {
        var x = DESK[r] || { name: TAQA_ROLES[r].label, line: '' };
        return '<button type="button" class="door-i" data-role="' + r + '" ' +
                 'aria-current="' + (r === k) + '">' +
                 '<span class="door-dot d-' + r + '"></span>' +
                 '<span class="dt">' + x.name + '</span>' +
                 '<span class="dd">' + x.line + '</span>' +
                 '<span class="dk">\u2713</span></button>';
      }).join('') +
      (scoped ? areaPicker(k) : '') +
      '<div class="door-note">Preview only. Azure uses Entra ID.</div>';

    wrap.appendChild(btn); wrap.appendChild(menu);
    anchor.parentNode.insertBefore(wrap, anchor);

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function () {
      menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false');
    });
    menu.addEventListener('click', function (e) {
      e.stopPropagation();
      var i = e.target.closest('.door-i'); if (!i) return;
      TAQA_ROLE.set(i.dataset.role);          // this also drops any delegation
      location.reload();
    });
    menu.addEventListener('change', function (e) {
      if (e.target.id !== 'door-area-sel') return;
      e.stopPropagation();
      TAQA_ROLE.setArea(e.target.value);
      // Land on the desk for the area just taken, not the one just left.
      if (/dashboard\.html/.test(location.pathname))
        location.href = 'dashboard.html?id=' + encodeURIComponent(e.target.value);
      else location.reload();
    });
  }

  /* Every area has its own holder, so picking the role is only half of it.
     Grouped by family, because a Function Head and a Segment Director are not
     the same job and the list should not pretend otherwise. */
  function areaPicker(k) {
    if (typeof TAQA_DOC_LOOKUPS === 'undefined') return '';
    var S = TAQA_DOC_LOOKUPS.segments, here = TAQA_ROLE.area();
    var FAM = [['segment','Operational Segments'], ['function','Corporate Functions'],
               ['product','Products & Technology'], ['company','Company Wide'],
               ['pending','Pending Reassignment']];
    var opts = FAM.map(function (f) {
      var ids = Object.keys(S).filter(function (x) { return S[x].group === f[0]; })
                  .sort(function (a, b) { return S[a].name.localeCompare(S[b].name); });
      if (!ids.length) return '';
      return '<optgroup label="' + f[1] + '">' + ids.map(function (x) {
        return '<option value="' + x + '"' + (x === here ? ' selected' : '') + '>' +
               S[x].name + '</option>'; }).join('') + '</optgroup>';
    }).join('');
    return '<div class="door-area"><label for="door-area-sel">' +
             TAQA_ROLE.areaTitle() + ' of</label>' +
           '<select id="door-area-sel">' + opts + '</select></div>';
  }

  function banner() {
    if (typeof TAQA_DELEGATION === 'undefined') return;
    var d = TAQA_DELEGATION.current();
    if (!d) return;
    var bar = document.createElement('div');
    bar.className = 'deleg-bar';
    bar.innerHTML = '<span>Delegate for <b>' + d.fromName + '</b> until <b>' + d.until + '</b>' +
      (d.includesApproval ? '' : ', without approval') + '</span>' +
      '<span class="db-end"><button type="button" id="deleg-stop">Stop</button></span>';
    document.body.insertBefore(bar, document.body.firstChild);
    document.getElementById('deleg-stop').addEventListener('click', function () {
      TAQA_DELEGATION.actAs(null); location.reload();
    });
  }

  function go(){ build(); banner(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
})();

/* ──────────────────────────────────────────────────────────────────────────
   The register is the controller's view
   ──────────────────────────────────────────────────────────────────────────
   The Master List carries the F086 export, the overdue queue, the provisional
   numbering report and every revision including withdrawn ones. QMS and an
   auditor need that. An employee and a Segment Director do not, and showing
   it to them invites a withdrawn revision to be read as a live one.

   Hiding the nav item is not enough on its own, because the URL is guessable,
   so master-list.html refuses directly as well. This handles the links: the
   nav entry goes, and a link in the body retargets to Search, which answers
   the question an employee actually had.

   None of this narrows which documents a person may reach. TQ-QHSE-S001 5.5
   and ISO 9001 7.5.3.1 a) are satisfied by Search, the segment libraries and
   the viewer, all of which stay open to every role and all of which show the
   lifecycle of the document in front of you.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  if (typeof TAQA_ROLE === 'undefined') return;
  function apply() {
    if (TAQA_ROLE.canRegister()) return;

    document.querySelectorAll('a[href^="master-list.html"]').forEach(function (a) {
      var li = a.closest('li');
      // A navigation entry to somewhere you cannot go is noise, so it goes.
      if (li && li.parentElement && /nav-links|nav-mobile/.test(li.parentElement.className || '')) {
        li.remove(); return;
      }
      if (a.closest('.nav-mobile-menu') && !a.closest('li')) { a.remove(); return; }
      // A link in the body had a purpose. Send it at Search with whatever it
      // was looking for, rather than at a page that will turn it away.
      var q = '';
      try { q = new URL(a.getAttribute('href'), location.href).searchParams.get('q') || ''; } catch (e) {}
      a.setAttribute('href', 'ai-search.html' + (q ? '?q=' + encodeURIComponent(q) : ''));
      if (/^\s*(the register|back to the register|open the register|master list|open the master list)\s*$/i
            .test(a.textContent.trim()))
        a.textContent = 'Search the documents';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();

/* ──────────────────────────────────────────────────────────────────────────
   Nothing sits under the chevron
   ──────────────────────────────────────────────────────────────────────────
   A select with appearance:none draws its own arrow as a background image.
   Three pages set padding to 14px and then painted a 12px arrow 14px in from
   the end, so the arrow occupied space the text was still allowed to use and
   a long option ran straight underneath it.

   Reserving the space is the fix, and it belongs in one rule rather than in
   each page's stylesheet, so a select added later cannot reintroduce it.
   Logical padding, so it reserves the correct side in Arabic too.

   The same guard covers any input that carries an icon on its end side.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  var s = document.createElement('style');
  s.id = 'taqa-field-space';
  /* [hidden] comes from the browser's own stylesheet, which any class selector
     outranks. .manage-btn sets display:inline-flex, so marking it hidden set
     the attribute and changed nothing on screen: an Employee was still shown a
     control the role check had already refused. Anything the code hides stays
     hidden, whatever a class says. */
  s.textContent =
    ':root{--alert-ink:#A8431A;--warn-ink:#8A6200;--ok-ink:#00705F;--stop-ink:#C8102E;--info-ink:#0076A8;}' +
    'html[data-taqa-theme="dark"]{--alert-ink:#FF9B5E;--warn-ink:#FFB81C;--ok-ink:#4FD1B5;--stop-ink:#FF8A94;--info-ink:#6BC5EE;}' +
    '[hidden]{display:none!important;}' +
    'select.form-select,select.sf-select,select[data-arrow]{' +
      'padding-inline-end:40px!important;' +
      'background-position:right 14px center!important;' +
      'text-overflow:ellipsis;' +
    '}' +
    'html[dir="rtl"] select.form-select,html[dir="rtl"] select.sf-select{' +
      'background-position:left 14px center!important;' +
    '}' +
    /* A select is a one-line control: an option longer than the box should be
       cut with an ellipsis rather than run on under the edge. */
    'select.form-select,select.sf-select{white-space:nowrap;overflow:hidden;}';
  document.head.appendChild(s);
})();
