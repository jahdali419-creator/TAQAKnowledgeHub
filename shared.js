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
    /* clip, not hidden: hidden makes html and body scroll containers, which
       quietly broke every position:sticky on the site (tab bars, the glossary
       rail). Browsers without clip fall back to hidden. */
    'html{overflow-x:clip;max-width:100vw;}'+
    'body{overflow-x:clip;width:100%;max-width:100%;}'+
    '@supports not (overflow:clip){html,body{overflow-x:hidden;}}'+
    '*{box-sizing:border-box;}'+
    /* clamp decorative wide elements that bleed past viewport */
    '.hub-glow,.bg-blob,.bg-blob-1,.bg-blob-2,.bg-blob-3{max-width:100vw!important;overflow:hidden;}'+
    'img,svg:not([class*="icon"]):not(#stp-ring){max-width:100%;}'+
    '@media(max-width:768px){'+
      /* prevent any child from being wider than screen */
      '.page-wrapper>*,.main-wrapper,.main-inner,.search-hub,'+
      '.results-section,.prompts-section,.chat-log,'+
      '.seg-panel,.doc-list,.doc-toolbar{max-width:100vw!important;overflow-x:clip!important;}'+
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
      '.btn{min-height:44px!important;display:inline-flex!important;align-items:center!important;}'+
      '.annot-tool-btn{min-width:44px!important;min-height:44px!important;}'+
      // Dashboard's approve/reject buttons carry their own classes, not
      // .btn, so the rule above never reached them: on a phone they measured
      // well under a comfortable tap target.
      '.btn-approve,.btn-reject{min-height:44px!important;display:inline-flex!important;align-items:center!important;}'+
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
    '.toast.error{background:rgba(200,16,46,0.96);color:#fff;border:1px solid rgba(200,16,46,0.5);}'+
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
  wrap.setAttribute('role','status');
  wrap.setAttribute('aria-live','polite');
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

// An automatic breadcrumb used to be injected here on the four pages without
// their own (search, glossary, upload, ask an expert). It was inserted
// straight after the fixed nav, so it sat at the top of the page underneath
// it and was never visible. Each of those pages names itself in its own
// hero and highlights itself in the nav, so it is not replaced.

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
    '<p class="sc-hint">Part of <em style="color:#00BBB6;font-style:italic;">TechHub Platform</em></p>'+
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

// ── The top bar ──
/* One bar for the whole site. Every page carries the same <nav id="navbar">
   markup and links topbar.css, so it is drawn in its final form before this
   runs. What is added here depends on who is looking: Master List for the
   roles that may open the register, Upload for the roles that may file, the
   Areas sheet (built from the register, so a renamed area cannot survive as
   stale markup) and the phone menu. */
(function(){
  var navEl=document.getElementById('navbar')||document.querySelector('nav');
  var R=(typeof TAQA_ROLE!=='undefined')?TAQA_ROLE:null;
  var cap=null; try{ cap=R&&R.effective?R.effective():null; }catch(e){}
  var canRegister=false; try{ canRegister=!R||R.canRegister(); }catch(e){}
  // Upload is for any role that may file a document for approval (roles.js
  // submit), not only the ones that manage an area.
  var canUpload=!!(cap&&cap.submit);
  var p=location.pathname;
  var onPage=function(f){ return f==='index.html' ? (/\/$/.test(p)||/\/index\.html$/.test(p)) : p.indexOf('/'+f)>-1; };
  var esc=function(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
  var L=(typeof TAQA_DOC_LOOKUPS!=='undefined')?TAQA_DOC_LOOKUPS.segments:null;
  var here=(p.indexOf('segment.html')>-1)?new URLSearchParams(location.search).get('id'):null;
  var live=function(id){ try{ return (typeof TAQA_STORE!=='undefined')?TAQA_STORE.area(id).live:null; }catch(e){ return null; } };
  var FAM=[
    {group:'segment', title:'Operational Segments'},
    {group:'function',title:'Corporate Functions'},
    {group:'product', title:'Products & Technology'}
  ];
  var famIds=function(g){ return Object.keys(L).filter(function(k){return L[k].group===g;})
    .sort(function(a,b){return L[a].name.localeCompare(L[b].name);}); };
  /* The bar's four popovers (Areas, the door, Bookmarks, the phone menu) are
     one family: opening any of them closes the others, so two can never be
     drawn over each other. Each one publishes its own close function. */
  function closeOthers(keep){
    var all={areas:'taqaCloseAreas',door:'taqaCloseDoor',bm:'taqaCloseBookmarks',menu:'taqaCloseMenu',bell:'taqaCloseBell'};
    Object.keys(all).forEach(function(k){ if(k!==keep && typeof window[all[k]]==='function') window[all[k]](); });
  }
  window.taqaCloseBarPopovers=closeOthers;
  var ICON={
    bm:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 3.5h11a1 1 0 0 1 1 1V21l-6.5-4.2L5.5 21V4.5a1 1 0 0 1 1-1Z"/></svg>',
    up:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"/><path d="M6.5 9.5 12 4l5.5 5.5"/><path d="M4 20h16"/></svg>',
    chev:'<svg class="mm-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>'
  };

  /* ---- Role pieces on the desktop bar ----
     Master List and Upload are in the static markup, and a one-line hint in
     the <nav> shows them from the first paint for the roles that usually hold
     them, so the links do not jump sideways once this runs. Here the real
     answer from TAQA_ROLE (delegation included) replaces the hint, and a
     piece the reader may not use is taken out of the page altogether. */
  var docEl=document.documentElement;
  if(canRegister) docEl.setAttribute('data-tb-reg',''); else docEl.removeAttribute('data-tb-reg');
  if(canUpload) docEl.setAttribute('data-tb-up',''); else docEl.removeAttribute('data-tb-up');
  if(navEl && navEl.id==='navbar'){
    if(!canRegister) navEl.querySelectorAll('.nav-reg').forEach(function(e){ e.remove(); });
    if(!canUpload) navEl.querySelectorAll('.nav-up').forEach(function(e){ e.remove(); });
    navEl.querySelectorAll('.nav-links a.active').forEach(function(a){ a.setAttribute('aria-current','page'); });
  }

  /* ---- Areas sheet ---- */
  var ddLi=document.getElementById('seg-dropdown-li'), ddBtn=document.getElementById('seg-dropdown-btn');
  var ddPanel=ddLi?ddLi.querySelector('.nav-dropdown-panel'):null;
  if(ddPanel && L){
    var h='';
    if(L.company){
      var cn=live('company');
      h+='<a class="ad-company'+(here==='company'?' here':'')+'" href="segment.html?id=company"'+(here==='company'?' aria-current="page"':'')+'>'+
         '<span>Company policies</span><span class="ad-sub">Apply to everyone</span>'+(cn!=null?'<span class="ad-n">'+cn+'</span>':'')+'</a>';
    }
    h+='<div class="ad-cols">'+FAM.map(function(f){
      var ids=famIds(f.group); if(!ids.length) return '';
      return '<div class="ad-col"><div class="ad-head"><span>'+esc(f.title)+'</span><span class="ad-n">'+ids.length+'</span></div>'+
        ids.map(function(k){
          var n=live(k), me=(k===here);
          return '<a href="segment.html?id='+encodeURIComponent(k)+'"'+(me?' class="here" aria-current="page"':'')+'><span>'+esc(L[k].name)+'</span>'+
                 (n!=null?'<span class="ad-n">'+n+'</span>':'')+'</a>';
        }).join('')+'</div>';
    }).join('')+'</div>';
    ddPanel.innerHTML=h;
  }
  function closeAreas(){ if(ddLi){ ddLi.classList.remove('open'); if(ddBtn) ddBtn.setAttribute('aria-expanded','false'); } }
  if(ddLi && ddBtn){
    ddBtn.addEventListener('click',function(e){
      e.stopPropagation();
      var open=ddLi.classList.toggle('open');
      ddBtn.setAttribute('aria-expanded',open?'true':'false');
      if(open) closeOthers('areas');
    });
    ddLi.addEventListener('click',function(e){ e.stopPropagation(); });
    document.addEventListener('click',closeAreas);
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape' && ddLi.classList.contains('open')){ closeAreas(); ddBtn.focus(); }
    });
    // Tabbing out of the sheet closes it, so it never stays open behind focus.
    ddLi.addEventListener('focusout',function(e){
      if(ddLi.classList.contains('open') && e.relatedTarget && !ddLi.contains(e.relatedTarget)) closeAreas();
    });
  }
  window.taqaCloseAreas=closeAreas;

  /* ---- Phone menu styles ---- */
  var s=document.createElement('style');
  s.textContent=
    '.nav-hamburger{display:none;}'+
    '.nav-mobile-menu{display:none;position:fixed;inset-inline:0;top:var(--nav-h,64px);z-index:998;'+
      'background:var(--tb-solid,#fff);border-bottom:1px solid var(--tb-rule,rgba(117,106,97,.13));'+
      'padding:6px 16px 28px;box-shadow:0 22px 44px -26px rgba(0,88,90,.28);'+
      'overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;font-family:"Inter",system-ui,sans-serif;}'+
    '.nav-mobile-menu.open{display:block;}'+
    /* On a tablet the menu drops as a sheet from the end of the bar rather
       than stretching a phone list across a 1000px screen. */
    '@media (min-width:641px){.nav-mobile-menu{inset-inline-start:auto;inset-inline-end:12px;inline-size:min(420px,calc(100vw - 24px));'+
      'border:1px solid var(--tb-rule,rgba(117,106,97,.13));border-radius:16px;padding:6px 18px 18px;'+
      'box-shadow:var(--tb-shadow,0 22px 44px -26px rgba(0,88,90,.28));}}'+
    'html.taqa-menu-open .scroll-top-btn,html.taqa-menu-open #back-to-top,html.taqa-menu-open .bm-panel{display:none!important;}'+
    '.nav-mobile-menu a,.nav-mobile-menu .mm-row{display:flex;align-items:center;gap:12px;width:100%;min-height:52px;padding:0 4px;margin:0;'+
      'font:500 15.5px/1.2 "Inter",system-ui,sans-serif;color:var(--tb-text,#1E1C1A);text-decoration:none;text-align:start;'+
      'background:none;border:0;border-bottom:1px solid var(--tb-rule,rgba(117,106,97,.13));cursor:pointer;}'+
    '.nav-mobile-menu .mm-main a:last-child{border-bottom:0;}'+
    '.nav-mobile-menu .mm-main a.active{color:var(--tb-ink,#005D63);font-weight:600;}'+
    '.nav-mobile-menu .mm-main a.active::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;margin-inline-start:-2px;}'+
    '.nav-mobile-menu .mm-tools{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0 4px;}'+
    '.nav-mobile-menu .mm-tools .mm-row,.nav-mobile-menu .mm-tools a{min-height:48px;justify-content:center;border:1px solid var(--tb-rule,rgba(117,106,97,.13));border-radius:12px;padding:0 12px;font-weight:600;font-size:14.5px;}'+
    '.nav-mobile-menu .mm-tools .mm-row:only-child{grid-column:1/-1;}'+
    '.nav-mobile-menu .mm-tools a.mm-up{background:var(--tb-primary,#005D63);border-color:transparent;color:#FFFFFF;}'+
    '.nav-mobile-menu .mm-tools svg{flex:none;}'+
    '.nav-mobile-menu .mm-bmn{font-variant-numeric:tabular-nums;color:var(--tb-light,#756A61);font-weight:500;}'+
    '.nav-mobile-menu .mm-label{font:700 13px/1.2 "BwGradual","Urbanist",sans-serif;letter-spacing:0;text-transform:none;'+
      'color:var(--tb-light,#756A61);padding:22px 4px 6px;margin:0;border:0;}'+
    '.nav-mobile-menu a.mm-company,.nav-mobile-menu .mm-grp>summary{display:flex!important;align-items:center;gap:10px;min-height:52px;padding:0 4px;'+
      'font:700 15.5px/1.25 "BwGradual","Urbanist",sans-serif;color:var(--tb-text,#1E1C1A);text-decoration:none;'+
      'border-bottom:1px solid var(--tb-rule,rgba(117,106,97,.13));cursor:pointer;}'+
    '.nav-mobile-menu .mm-grp>summary{list-style:none;}'+
    '.nav-mobile-menu .mm-grp>summary::-webkit-details-marker{display:none;}'+
    '.nav-mobile-menu .mm-n{margin-inline-start:auto;font:500 12.5px/1 "Inter",system-ui,sans-serif;color:var(--tb-light,#756A61);font-variant-numeric:tabular-nums;}'+
    '.nav-mobile-menu .mm-chev{flex:none;color:var(--tb-ink,#005D63);transition:transform .2s cubic-bezier(.23,1,.32,1);}'+
    '.nav-mobile-menu .mm-grp[open]>summary .mm-chev{transform:rotate(180deg);}'+
    '.nav-mobile-menu .mm-grp[open]>summary{color:var(--tb-ink,#005D63);border-bottom-color:transparent;}'+
    '.nav-mobile-menu .mm-list{margin:0 0 10px;padding:2px 0 10px;border-inline-start:2px solid var(--tb-rule,rgba(117,106,97,.13));border-bottom:1px solid var(--tb-rule,rgba(117,106,97,.13));}'+
    '.nav-mobile-menu .mm-list a{min-height:44px;padding:0 4px;padding-inline-start:14px;margin-inline-start:-2px;border:0;border-inline-start:2px solid transparent;'+
      'font:300 15.5px/1.3 "BwGradual","Urbanist",sans-serif;color:var(--tb-text,#1E1C1A);}'+
    '.nav-mobile-menu .mm-dc{margin-inline-start:auto;font:500 12.5px/1 "Inter",system-ui,sans-serif;color:var(--tb-light,#756A61);font-variant-numeric:tabular-nums;}'+
    '.nav-mobile-menu .mm-list a.mm-here{color:var(--tb-ink,#005D63);font-weight:400;border-inline-start-color:var(--tb-ink,#005D63);}'+
    '.nav-mobile-menu a.mm-company.mm-here{color:var(--tb-ink,#005D63);}'+
    '.nav-mobile-menu .mm-door{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:2px 0 0;}'+
    '.nav-mobile-menu .mm-door button{display:flex;align-items:center;gap:9px;min-height:48px;padding:0 12px;border-radius:12px;'+
      'border:1px solid var(--tb-rule,rgba(117,106,97,.13));background:transparent;color:var(--tb-text,#1E1C1A);'+
      'font:500 14px/1.2 "Inter",system-ui,sans-serif;cursor:pointer;text-align:start;}'+
    '.nav-mobile-menu .mm-door button[aria-pressed="true"]{border-color:var(--tb-ink,#005D63);color:var(--tb-ink,#005D63);font-weight:600;background:var(--tb-active,rgba(0,93,99,.07));}'+
    '.nav-mobile-menu .mm-door-area{margin-top:10px;}'+
    '.nav-mobile-menu .mm-door-area label{display:block;font:500 12.5px/1.3 "Inter",system-ui,sans-serif;color:var(--tb-light,#756A61);margin:0 4px 6px;}'+
    '.nav-mobile-menu .mm-door-area select{width:100%;min-height:48px;padding:0 12px;border-radius:12px;border:1px solid var(--tb-rule,rgba(117,106,97,.13));'+
      'background:var(--tb-solid,#fff);color:var(--tb-text,#1E1C1A);font:500 15px "Inter",system-ui,sans-serif;}'+
    '.nav-mobile-menu .mm-note{font-size:12.5px;line-height:1.45;color:var(--tb-light,#756A61);padding:10px 4px 0;}'+
    '@media (hover:hover){.nav-mobile-menu a:hover,.nav-mobile-menu .mm-row:hover{color:var(--tb-ink,#005D63);}'+
      '.nav-mobile-menu .mm-tools a.mm-up:hover{color:#FFFFFF;background:#004A4F;}}';
  document.head.appendChild(s);

  // Fallback for any page still without the canonical bar.
  if(!document.getElementById('nav-hamburger')){
    var nr=document.querySelector('.nav-right');
    if(nr){
      var hb0=document.createElement('button');
      hb0.id='nav-hamburger';hb0.className='nav-hamburger';hb0.type='button';hb0.setAttribute('aria-label','Menu');
      hb0.innerHTML='<span></span><span></span><span></span>';
      nr.appendChild(hb0);
    }
  }

  /* ---- Phone menu ---- */
  var menu=document.getElementById('nav-mobile-menu');
  if(!menu && navEl){
    menu=document.createElement('div');
    menu.id='nav-mobile-menu';menu.className='nav-mobile-menu';
    navEl.parentNode.insertBefore(menu,navEl.nextSibling);
  }
  if(menu){
    menu.setAttribute('aria-label','Menu');
    var items=[{href:'index.html',label:'Home'},{href:'maintenance.html',label:'Maintenance'},{href:'ai-search.html',label:'Document Search'}];
    if(canRegister) items.push({href:'master-list.html',label:'Master List'});
    items.push({href:'glossary.html',label:'Field Glossary'},{href:'support-ticket.html',label:'Ask Expert'});
    var html='<div class="mm-main">'+items.map(function(l){
      var a=onPage(l.href);
      return '<a href="'+l.href+'"'+(a?' class="active" aria-current="page"':'')+'>'+l.label+'</a>';
    }).join('')+'</div>';

    html+='<div class="mm-tools"><button type="button" class="mm-row" id="mm-bm">'+ICON.bm+'<span>Bookmarks</span><span class="mm-bmn" id="mm-bmn"></span></button>'+
          (canUpload?'<a class="mm-up" href="upload.html"'+(onPage('upload.html')?' aria-current="page"':'')+'>'+ICON.up+'<span>Upload</span></a>':'')+'</div>';

    if(L){
      html+='<div class="mm-label">Areas</div>';
      if(L.company){
        var cn2=live('company');
        html+='<a class="mm-company'+(here==='company'?' mm-here':'')+'" href="segment.html?id=company"'+(here==='company'?' aria-current="page"':'')+'>'+
              '<span>Company policies</span>'+(cn2!=null?'<span class="mm-n">'+cn2+'</span>':'')+'</a>';
      }
      FAM.forEach(function(f){
        var ids=famIds(f.group);
        if(!ids.length)return;
        var open=here&&ids.indexOf(here)>-1;
        html+='<details class="mm-grp"'+(open?' open':'')+'><summary><span>'+esc(f.title)+'</span><span class="mm-n">'+ids.length+'</span>'+ICON.chev+'</summary><div class="mm-list">'+
          ids.map(function(k){
            var n=live(k), me=(k===here);
            return '<a href="segment.html?id='+encodeURIComponent(k)+'"'+(me?' class="mm-here" aria-current="page"':'')+'><span>'+esc(L[k].name)+'</span>'+
                   (n!=null?'<span class="mm-dc">'+n+'</span>':'')+'</a>';
          }).join('')+'</div></details>';
      });
    }
    if(canRegister && R){
      html+='<div class="mm-label">More</div><div class="mm-main"><a href="whats-new.html"'+(onPage('whats-new.html')?' class="active" aria-current="page"':'')+'>About this platform</a></div>';
    }
    menu.innerHTML=html;
  }

  function setMenu(open){
    var m=document.getElementById('nav-mobile-menu'); if(!m) return;
    if(open){
      var t=navEl?Math.round(navEl.getBoundingClientRect().bottom):64;
      var sheet=window.matchMedia&&window.matchMedia('(min-width:641px)').matches;
      if(sheet) t+=8;
      m.style.top=t+'px';
      m.style.maxHeight='calc(100dvh - '+(t+(sheet?12:0))+'px)';
      closeOthers('menu');
    }
    m.classList.toggle('open',!!open);
    document.documentElement.classList.toggle('taqa-menu-open',!!open);
    var hb=document.getElementById('nav-hamburger');
    if(hb){ hb.setAttribute('aria-expanded',open?'true':'false'); hb.setAttribute('aria-label',open?'Close menu':'Menu'); }
  }
  window.toggleMobileNav=function(){
    var m=document.getElementById('nav-mobile-menu');
    setMenu(!(m&&m.classList.contains('open')));
  };
  window.taqaCloseMenu=function(){ setMenu(false); };

  document.addEventListener('click',function(e){
    var hb=document.getElementById('nav-hamburger');
    var m=document.getElementById('nav-mobile-menu');
    if(hb&&(hb===e.target||hb.contains(e.target))){ window.toggleMobileNav(); return; }
    if(m&&m.classList.contains('open')&&!m.contains(e.target)) setMenu(false);
  });
  document.addEventListener('keydown',function(e){
    var m=document.getElementById('nav-mobile-menu');
    if(e.key==='Escape'&&m&&m.classList.contains('open')){
      setMenu(false); var hb=document.getElementById('nav-hamburger'); if(hb) hb.focus();
    }
  });
  // A menu left open across a rotate to a wide screen would sit under the desktop bar.
  window.addEventListener('resize',function(){
    var hb=document.getElementById('nav-hamburger');
    if(hb && getComputedStyle(hb).display==='none') setMenu(false);
  },{passive:true});
})();

// ── Theme: one switch for every page ──
/* Every page used to carry its own copy, with two different icon ids. This
   one updates whichever icon the page has and keeps the same storage key. */
(function(){
  var SUN='M7.5 1a.55.55 0 0 1 .55.55v.9a.55.55 0 0 1-1.1 0v-.9A.55.55 0 0 1 7.5 1Zm0 11.1a.55.55 0 0 1 .55.55v.9a.55.55 0 0 1-1.1 0v-.9a.55.55 0 0 1 .55-.55ZM1 7.5a.55.55 0 0 1 .55-.55h.9a.55.55 0 0 1 0 1.1h-.9A.55.55 0 0 1 1 7.5Zm11.1 0a.55.55 0 0 1 .55-.55h.9a.55.55 0 0 1 0 1.1h-.9a.55.55 0 0 1-.55-.55ZM3.23 3.23a.55.55 0 0 1 .78 0l.63.64a.55.55 0 1 1-.78.77l-.63-.63a.55.55 0 0 1 0-.78Zm7.13 7.13a.55.55 0 0 1 .78 0l.63.63a.55.55 0 1 1-.78.78l-.63-.63a.55.55 0 0 1 0-.78ZM3.23 11.77a.55.55 0 0 1 0-.78l.63-.63a.55.55 0 1 1 .78.78l-.63.63a.55.55 0 0 1-.78 0Zm7.13-7.13a.55.55 0 0 1 0-.78l.63-.64a.55.55 0 1 1 .78.78l-.63.63a.55.55 0 0 1-.78 0ZM7.5 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z';
  var MOON='M6.2 2.3a.55.55 0 0 1 .2.62 5.2 5.2 0 0 0 6.7 6.7.55.55 0 0 1 .68.75A6.3 6.3 0 1 1 5.6 2.1a.55.55 0 0 1 .6.2Z';
  function isDark(){ return document.documentElement.getAttribute('data-taqa-theme')==='dark'; }
  function paint(){
    var d=isDark();
    document.querySelectorAll('#dark-icon,#theme-icon').forEach(function(svg){
      var path=svg.querySelector('path');
      if(!path){ path=document.createElementNS('http://www.w3.org/2000/svg','path'); svg.appendChild(path); }
      path.setAttribute('d',d?MOON:SUN);
      path.removeAttribute('fill');
    });
    var lbl=document.getElementById('theme-label'); if(lbl) lbl.textContent=d?'Light':'Dark';
    var b=document.getElementById('dark-toggle');
    if(b){ var t=d?'Switch to light':'Switch to dark'; b.setAttribute('aria-label',t); b.title=t; }
  }
  window.toggleDark=function(){
    var n=isDark()?'light':'dark';
    document.documentElement.setAttribute('data-taqa-theme',n);
    try{ localStorage.setItem('taqa-theme-v3',n); }catch(e){}
    paint();
    try{ window.dispatchEvent(new CustomEvent('taqa:theme-changed',{detail:{theme:n}})); }catch(e){}
  };
  window.taqaPaintTheme=paint;
  paint();
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
    'font-size:13.5px;color:#756A61;cursor:pointer;font-family:"Inter",sans-serif;text-align:center;}'+
    /* The sheet only restated its title for the dark ground, so the line under
       it, the steps and Maybe later kept the light-theme grey at 3.07:1. */
    'html[data-taqa-theme="dark"] .pwa-sub,html[data-taqa-theme="dark"] .pwa-step-t,'+
    'html[data-taqa-theme="dark"] .pwa-later{color:#8CB6B9;}';
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
        '<div class="pwa-title">Install TechHub Platform</div>'+
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
        '<div class="pwa-title">Install TechHub Platform</div>'+
        '<div class="pwa-sub">Access all TAQA documents offline, anytime.</div>'+
      '</div>'+
    '</div>'+
    '<div class="pwa-steps">'+
      '<div class="pwa-step"><div class="pwa-step-n" style="font-size:14px;">!</div>'+
        '<div class="pwa-step-t"><strong>Open this page in Safari</strong> to install the app.<br>'+
        '<span style="font-size:11.5px;margin-top:3px;display:block;">Apple only allows app installation through Safari, this is an Apple restriction, not ours.</span></div>'+
      '</div>'+
    '</div>'+
    '<button class="pwa-later" id="pwa-later">Got it</button>';

  // Android: native install button
  var androidContent=
    '<div class="pwa-handle"></div>'+
    '<div class="pwa-row">'+APP_ICON+
      '<div class="pwa-text-block">'+
        '<div class="pwa-title">Install TechHub Platform</div>'+
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
    // Not over the welcome tour. On a first visit to Home on a phone both
    // opened together and the sheet covered the tour's Skip and Next, so a
    // new user met two overlays and could not use either until closing one.
    // Wait until the tour is finished, then offer the install.
    var tourOn=false;
    try{ tourOn=!!document.getElementById('tc-skip')&&!localStorage.getItem('taqa-tour-done'); }catch(e){}
    if(tourOn){ setTimeout(showSheet,1500); return; }
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
  // A bookmark is one document whichever page made it. Cards carry
  // "NUMBER  Title" and the viewer carries the bare title, so both are
  // compared with the number stripped off the front.
  function bmBare(t){ return String(t||'').replace(/^\S+\s{2,}/,''); }
  function bmNum(t){ var m=String(t||'').match(/^(\S+)\s{2,}/); return m?m[1]:''; }
  function bmSame(i,title,segId){ return i.segId===segId && bmBare(i.title)===bmBare(title); }
  window.TAQA_Bookmarks={
    add:function(item){
      var a=load().filter(function(i){return!bmSame(i,item.title,item.segId);});
      item.ts=Date.now();a.unshift(item);save(a.slice(0,50));
    },
    remove:function(title,segId){
      save(load().filter(function(i){return!bmSame(i,title,segId);}));
    },
    toggle:function(item){
      if(this.has(item.title,item.segId)){this.remove(item.title,item.segId);return false;}
      this.add(item);return true;
    },
    has:function(title,segId){
      return load().some(function(i){return bmSame(i,title,segId);});
    },
    getAll:function(){return load();}
  };
  /* The list opens from the Bookmarks button in the top bar and hangs under
     it. It used to open from a round button floating over every page, which
     on a phone sat on top of each card's own controls. */
  var s=document.createElement('style');
  s.textContent=
    '.bm-panel{position:fixed;top:calc(var(--nav-h,64px) + 8px);inset-inline-end:12px;z-index:1002;width:min(360px,calc(100vw - 24px));max-height:min(460px,calc(100dvh - var(--nav-h,64px) - 24px));'+
    'background:var(--tb-solid,#fff);border:1px solid var(--tb-rule,rgba(117,106,97,.13));border-radius:16px;'+
    'box-shadow:0 22px 44px -26px rgba(0,88,90,.32),0 2px 6px -2px rgba(0,88,90,.08);'+
    'display:none;flex-direction:column;overflow:hidden;'+
    'animation:bmIn .16s cubic-bezier(.23,1,.32,1);font-family:"Inter",system-ui,sans-serif;}'+
    '@keyframes bmIn{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:none;}}'+
    '.bm-panel.open{display:flex;}'+
    '.bm-ph{padding-block:14px 12px;padding-inline:16px 12px;border-bottom:1px solid var(--tb-rule,rgba(117,106,97,.13));display:flex;align-items:center;justify-content:space-between;gap:8px;flex-shrink:0;}'+
    '.bm-pt{font-family:"BwGradual","Urbanist",sans-serif;font-size:15px;font-weight:700;color:var(--tb-text,#1E1C1A);}'+
    '.bm-pt .bm-pn{font-family:"Inter",sans-serif;font-weight:500;font-size:12.5px;color:var(--tb-light,#756A61);margin-inline-start:6px;font-variant-numeric:tabular-nums;}'+
    '.bm-acts{display:flex;gap:2px;}'+
    '.bm-clr{font-size:12.5px;font-weight:500;color:var(--tb-muted,#524D48);cursor:pointer;background:none;border:0;padding:0 10px;min-height:36px;border-radius:8px;font-family:"Inter",sans-serif;}'+
    '.bm-clr:hover{background:var(--tb-hover,rgba(117,106,97,.08));color:var(--tb-text,#1E1C1A);}'+
    '#bm-clr:hover{color:var(--stop-ink,#C8102E);}'+
    '.bm-list{flex:1;overflow-y:auto;padding:6px;overscroll-behavior:contain;}'+
    '.bm-item{display:flex;align-items:center;gap:12px;padding-block:8px;padding-inline:10px 6px;border-radius:10px;text-decoration:none;transition:background-color .15s;}'+
    '.bm-item:hover{background:var(--tb-hover,rgba(117,106,97,.08));}'+
    '.bm-ico{width:32px;height:32px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:700;font-family:"BwGradual","Urbanist",sans-serif;}'+
    '.bm-inf{flex:1;min-width:0;}'+
    '.bm-t{font-family:"BwGradual","Urbanist",sans-serif;font-size:14.5px;font-weight:300;line-height:1.3;color:var(--tb-text,#1E1C1A);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'+
    '.bm-m{font-size:12px;color:var(--tb-light,#756A61);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'+
    '.bm-x{background:none;border:none;color:var(--tb-light,#756A61);cursor:pointer;font-size:18px;padding:0;flex-shrink:0;line-height:1;border-radius:8px;}'+
    '.bm-x:hover{color:var(--stop-ink,#C8102E);background:var(--tb-hover,rgba(117,106,97,.08));}'+
    '.bm-empty{text-align:center;padding:30px 20px 34px;color:var(--tb-light,#756A61);font-size:13.5px;line-height:1.6;}'+
    '.bm-empty b{display:block;font-family:"BwGradual","Urbanist",sans-serif;font-size:15px;font-weight:700;color:var(--tb-text,#1E1C1A);margin-bottom:4px;}'+
    '@media (max-width:1280px){.bm-clr{min-height:44px;padding:0 12px;}}'+
    '@media (max-width:640px){.bm-panel{inset-inline:12px;width:auto;}}'+
    '@media (prefers-reduced-motion:reduce){.bm-panel{animation:none;}}';
  document.head.appendChild(s);
  var panel=document.createElement('div');panel.className='bm-panel';panel.id='bm-panel';
  panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Bookmarks');
  document.body.appendChild(panel);
  var TC={sop:'rgba(0,93,99,0.10)',form:'rgba(0,93,99,0.10)',manual:'rgba(0,93,99,0.10)',standard:'rgba(0,93,99,0.10)',policy:'rgba(0,93,99,0.10)',lesson:'rgba(0,93,99,0.10)',alert:'rgba(253,105,29,0.12)',software:'rgba(0,93,99,0.10)'};
  var TT={sop:'var(--primary-ink,#005D63)',form:'var(--primary-ink,#005D63)',manual:'var(--primary-ink,#005D63)',standard:'var(--primary-ink,#005D63)',policy:'var(--primary-ink,#005D63)',lesson:'var(--primary-ink,#005D63)',alert:'var(--alert-ink,#A8431A)',software:'var(--primary-ink,#005D63)'};
  // The square's letters come from the register so this panel can never
  // disagree with the segment page about what a Standard is called.
  var TS=(function(){var m={sop:'SOP',form:'FRM',manual:'WI',standard:'ST',policy:'POL',lesson:'LL',alert:'ALT',software:'ZIP'};
    var T=(typeof TAQA_DOC_LOOKUPS!=='undefined'&&TAQA_DOC_LOOKUPS.types)||{};
    Object.keys(T).forEach(function(k){if(T[k]&&T[k].mark)m[k]=T[k].mark;});return m;})();
  function updateBmBadge(){
    var n=window.TAQA_Bookmarks.getAll().length;
    var b=document.getElementById('bm-cnt');
    if(b){b.textContent=n>99?'99+':n;b.style.display=n>0?'flex':'none';}
    var m=document.getElementById('mm-bmn'); if(m) m.textContent=n>0?n:'';
    var btn=document.getElementById('nav-bm');
    if(btn){var t=n?'Bookmarks, '+n+' saved':'Bookmarks';btn.setAttribute('aria-label',t);btn.title=t;}
  }
  function renderBmPanel(){
    var items=window.TAQA_Bookmarks.getAll();
    updateBmBadge();
    if(!items.length){
      panel.innerHTML='<div class="bm-ph"><span class="bm-pt">Bookmarks</span></div>'+
        '<div class="bm-empty"><b>Nothing saved yet</b>Tap ☆ on any document to keep it here.</div>';
      return;
    }
    panel.innerHTML='<div class="bm-ph">'+
      '<span class="bm-pt">Bookmarks<span class="bm-pn">'+items.length+'</span></span>'+
      '<div class="bm-acts">'+
      '<button class="bm-clr" id="bm-exp" title="Export list as text">Export</button>'+
      '<button class="bm-clr" id="bm-clr">Clear</button>'+
      '</div></div>'+
      '<div class="bm-list">'+
      items.map(function(it){
        var bg=TC[it.type]||TC.sop,tc=TT[it.type]||TT.sop,lbl=TS[it.type]||'DOC';
        var bare=bmBare(it.title), num=bmNum(it.title);
        var esc=function(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');};
        return '<a class="bm-item" href="viewer.html?seg='+encodeURIComponent(it.segId)+'&type='+encodeURIComponent(it.type||'')+'&title='+encodeURIComponent(bare)+(num?'&doc='+encodeURIComponent(num):'')+'">'+
          '<div class="bm-ico" style="background:'+bg+';color:'+tc+'">'+lbl+'</div>'+
          '<div class="bm-inf"><div class="bm-t">'+esc(bare)+'</div><div class="bm-m">'+esc(it.segName)+' · '+lbl+'</div></div>'+
          '<button class="bm-x" data-t="'+it.title.replace(/"/g,'&quot;')+'" data-s="'+it.segId+'" title="Remove">×</button>'+
        '</a>';
      }).join('')+'</div>';
  }
  window.updateBmBadge=updateBmBadge;
  window.renderBmPanel=renderBmPanel;
  // Attached once, here, rather than inside renderBmPanel.
    panel.addEventListener('click',function(e){
      var x=e.target.closest('.bm-x');
      if(x){e.preventDefault();e.stopPropagation();
        window.TAQA_Bookmarks.remove(x.dataset.t,x.dataset.s);
        renderBmPanel();
        document.querySelectorAll('.bm-btn').forEach(function(b){if(bmBare(b.dataset.title)===bmBare(x.dataset.t)){b.textContent='☆';b.classList.remove('bm-on');}});
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
    });
  function trigger(){ return document.getElementById('nav-bm'); }
  function place(from){
    // Hang the list under whatever opened it. On a phone it spans the width.
    var wide=window.matchMedia&&window.matchMedia('(min-width:1281px)').matches;
    var nav=document.getElementById('navbar')||document.querySelector('nav');
    var top=nav?Math.round(nav.getBoundingClientRect().bottom)+8:72;
    panel.style.top=top+'px';
    if(wide&&from&&from.getBoundingClientRect&&from.offsetParent){
      // Line the sheet's end edge up with the button, in either direction.
      var r=from.getBoundingClientRect(), rtl=getComputedStyle(document.documentElement).direction==='rtl';
      panel.style.insetInlineEnd=Math.max(12,Math.round(rtl?r.left-8:window.innerWidth-r.right-8))+'px';
    } else { panel.style.insetInlineEnd=''; }
  }
  function setOpen(open,from){
    var t=trigger();
    if(open){ renderBmPanel(); place(from||t); if(window.taqaCloseBarPopovers) window.taqaCloseBarPopovers('bm'); }
    panel.classList.toggle('open',!!open);
    if(t) t.setAttribute('aria-expanded',open?'true':'false');
  }
  window.taqaOpenBookmarks=function(from){ setOpen(true,from); };
  window.taqaCloseBookmarks=function(){ setOpen(false); };
  document.addEventListener('click',function(e){
    var t=trigger(), mm=document.getElementById('mm-bm');
    if(t&&t.contains(e.target)){ e.stopPropagation(); setOpen(!panel.classList.contains('open'),t); return; }
    if(mm&&mm.contains(e.target)){
      e.stopPropagation();
      if(window.taqaCloseMenu) window.taqaCloseMenu();
      setOpen(true,null);
      var f=panel.querySelector('a,button'); if(f) try{f.focus({preventScroll:true});}catch(err){}
      return;
    }
    if(panel.classList.contains('open')&&!panel.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&panel.classList.contains('open')){ setOpen(false); var t=trigger(); if(t&&t.offsetParent) t.focus(); }
  });
  window.addEventListener('resize',function(){ if(panel.classList.contains('open')) place(trigger()); },{passive:true});
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
  s.textContent=':focus-visible{outline:2px solid #005D63!important;outline-offset:3px!important;}'+
    'html[data-taqa-theme="dark"] :focus-visible{outline-color:#00BBB6!important;}';
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
    '#offline-bar{position:fixed;top:var(--nav-h,64px);left:0;right:0;z-index:999;background:rgba(61,84,84,0.93);'+
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
    maintenance:{ short:'Maintenance', name:'Maintenance Manager', line:'Approve your maintenance' },
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
    '.door-dot.d-qms{background:#00BFB2;}.door-dot.d-auditor{background:#9AA7A7;}.door-dot.d-maintenance{background:#3D7A7E;}' +
    '.door-cap,.door-cap-s{white-space:nowrap;}.door-cap-s{display:none;}' +
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
    // On the shared bar the door opens the right-hand cluster. A page without
    // the bar keeps it beside its theme switch.
    var bar = document.querySelector('#navbar .nav-right');
    var anchor = bar ? bar.firstChild : document.querySelector('.dark-toggle, #theme-btn, [onclick="toggleDark()"]');
    if (!bar && (!anchor || !anchor.parentNode)) return;

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
      ? TAQA_ROLE.holderTitle() + ', ' + TAQA_ROLE.areaName()
      : 'You are viewing as: ' + TAQA_ROLES[k].label;
    btn.setAttribute('aria-label', btn.title + '. Change view');
    // Two captions: the area name where the bar has room, and the short role
    // name where it does not, so the door always says who you are.
    btn.innerHTML = '<span class="door-dot d-' + k + '"></span>' +
                    (scoped ? '<span class="door-cap-s">' + d.short + '</span>' : '') +
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
      (scoped && areaPicker(k) ? '<div class="door-area">' + areaField(k, 'door-area-sel') + '</div>' : '') +
      '<div class="door-note">Preview only. Azure uses Entra ID.</div>';

    wrap.appendChild(btn); wrap.appendChild(menu);
    if (bar) bar.insertBefore(wrap, anchor); else anchor.parentNode.insertBefore(wrap, anchor);
    phoneDoor(k, scoped);

    function closeDoor() {
      menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false');
    }
    // One of the bar's popovers: opening it closes Areas, Bookmarks and the
    // phone menu, and opening any of those closes it.
    window.taqaCloseDoor = closeDoor;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !menu.classList.contains('open');
      if (open && window.taqaCloseBarPopovers) window.taqaCloseBarPopovers('door');
      menu.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', closeDoor);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) { closeDoor(); btn.focus(); }
    });
    wrap.addEventListener('focusout', function (e) {
      if (menu.classList.contains('open') && e.relatedTarget && !wrap.contains(e.relatedTarget)) closeDoor();
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

  /* On a phone the bar has no room for the door, so the menu carries it,
     at the bottom where it is out of a reader's way. */
  function phoneDoor(k, scoped) {
    var mm = document.getElementById('nav-mobile-menu');
    if (!mm || mm.querySelector('.mm-door')) return;
    var box = document.createElement('div');
    box.innerHTML = '<div class="mm-label">Viewing as</div>' +
      '<div class="mm-door">' + TAQA_ROLE_ORDER.map(function (r) {
        var x = DESK[r] || { short: TAQA_ROLES[r].label };
        return '<button type="button" data-role="' + r + '" aria-pressed="' + (r === k) + '">' +
               '<span class="door-dot d-' + r + '"></span>' + x.short + '</button>';
      }).join('') + '</div>' +
      (scoped ? '<div class="mm-door-area">' + areaField(k, 'mm-area-sel') + '</div>' : '') +
      '<div class="mm-note">Preview only. Azure uses Entra ID.</div>';
    while (box.firstChild) mm.appendChild(box.firstChild);
    mm.addEventListener('click', function (e) {
      var b = e.target.closest('.mm-door button'); if (!b) return;
      TAQA_ROLE.set(b.dataset.role); location.reload();
    });
    mm.addEventListener('change', function (e) {
      if (e.target.id !== 'mm-area-sel') return;
      TAQA_ROLE.setArea(e.target.value);
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
               ['product','Products & Technology'], ['company','Company Wide']];
    var opts = FAM.map(function (f) {
      var ids = Object.keys(S).filter(function (x) { return S[x].group === f[0]; })
                  .sort(function (a, b) { return S[a].name.localeCompare(S[b].name); });
      if (!ids.length) return '';
      return '<optgroup label="' + f[1] + '">' + ids.map(function (x) {
        return '<option value="' + x + '"' + (x === here ? ' selected' : '') + '>' +
               S[x].name + '</option>'; }).join('') + '</optgroup>';
    }).join('');
    return opts;
  }
  function areaField(k, id) {
    var opts = areaPicker(k);
    if (!opts) return '';
    return '<label for="' + id + '">' + TAQA_ROLE.holderTitle() + ' of</label>' +
           '<select id="' + id + '">' + opts + '</select>';
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
   Offline banner
   ──────────────────────────────────────────────────────────────────────────
   The service worker already caches the shell for offline reading. This is
   the honest label for it: when the network drops, say so and say what the
   reader is looking at, instead of letting a page go quietly stale.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  if (document.getElementById('taqa-offline-bar')) return;

  var css = document.createElement('style');
  css.textContent =
    '.offline-bar{position:sticky;top:0;z-index:2500;display:flex;align-items:center;gap:8px;' +
      'justify-content:center;padding:7px 14px;background:#524D48;color:#fff;' +
      'font-size:12px;font-weight:600;text-align:center;}' +
    '.offline-bar svg{flex-shrink:0;}';
  document.head.appendChild(css);

  var ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M1 1l22 22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>' +
    '<path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>' +
    '<path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>' +
    '<line x1="12" y1="20" x2="12.01" y2="20"/></svg>';

  var bar = null;
  function show() {
    if (bar) return;
    bar = document.createElement('div');
    bar.id = 'taqa-offline-bar';
    bar.className = 'offline-bar';
    bar.innerHTML = ICON + '<span>You are offline. Showing the last cached copy of this page.</span>';
    document.body.insertBefore(bar, document.body.firstChild);
  }
  function hide() {
    if (!bar) return;
    bar.remove(); bar = null;
  }

  window.addEventListener('online', hide);
  window.addEventListener('offline', show);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
    else show();
  }
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
    /* On a phone the scroll-to-top button sits over the right-hand side of
       every card, which is exactly where a card keeps View, bookmark and QR. */
    '@media (max-width:640px){' +
      '.scroll-top-btn,#back-to-top{transition:opacity .2s ease,transform .2s ease!important;}' +
      'html.taqa-fab-away .scroll-top-btn,html.taqa-fab-away #back-to-top{' +
        'opacity:0!important;transform:translateY(28px)!important;pointer-events:none!important;}' +
      'html.taqa-fab-away .scroll-top-btn:focus-visible,html.taqa-fab-away #back-to-top:focus-visible{' +
        'opacity:1!important;transform:none!important;pointer-events:auto!important;}' +
    '}' +
    /* The scroll-to-top button fades to opacity 0 until the page has scrolled
       300px, but kept taking taps while invisible, over the card controls
       beneath it. It only accepts a tap while it can be seen. */
    '.scroll-top-btn{pointer-events:none;}.scroll-top-btn.stp-visible{pointer-events:auto;}' +
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

// The floating buttons step aside while the reader scrolls down through a
// list and come back the moment they scroll up, which is when they would
// reach for one. The CSS above confines the effect to phone widths, where
// the buttons otherwise cover each card's own controls.
(function(){
  var root = document.documentElement, last = window.pageYOffset || 0, ticking = false;
  window.addEventListener('scroll', function(){
    if (ticking) return; ticking = true;
    requestAnimationFrame(function(){
      var y = window.pageYOffset || 0;
      // Measure from the last point a decision was made, not the last frame,
      // so a slow scroll still adds up to a change of direction.
      if (y <= 160) { root.classList.remove('taqa-fab-away'); last = y; }
      else if (y > last + 6) { root.classList.add('taqa-fab-away'); last = y; }
      else if (y < last - 6) { root.classList.remove('taqa-fab-away'); last = y; }
      ticking = false;
    });
  }, {passive:true});
})();

/* ── The approvals bell ─────────────────────────────────────────────────
   The bell is a queue, not a notice board: it says "something is waiting on
   your signature". Only a role that can sign carries it, which is a Segment
   Director (or whoever holds their delegation) and QMS. An employee or an
   auditor has nothing to approve, so the bell is not drawn for them at all.

   The count is the real queue for the person signed in: drafts at the
   Director's stage in their own area, or at the QMS stage for QMS. It used
   to be a number seeded into localStorage, which is how an employee came to
   see 24 approvals waiting.

   The bell used to jump straight to the queue (scrolling to it on the desk,
   navigating there from anywhere else). It still can, but a reader should
   not have to leave the page just to see what is in the queue, so a click
   now opens a short preview first; "Open your queue" underneath is the old
   jump, kept for whoever wants it. */
(function(){
  var esc = function(t){ return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
  }); };
  var css = document.createElement('style');
  css.textContent =
    '.bell-wrap{position:relative;flex-shrink:0;display:inline-flex;}' +
    '.bell-menu{position:absolute;top:calc(100% + 8px);inset-inline-end:0;z-index:3000;width:300px;' +
      'max-height:min(380px,70vh);overflow-y:auto;background:var(--bg-white,#fff);' +
      'border:1px solid var(--border,#C7DBDD);border-radius:13px;box-shadow:0 14px 40px rgba(0,88,90,.15);' +
      'padding:6px;display:none;}' +
    '.bell-menu.open{display:block;}' +
    '.bell-hd{font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;' +
      'color:var(--text-light,#756A61);padding:7px 10px 6px;}' +
    '.bell-i{display:block;width:100%;text-align:start;padding:8px 10px;border:none;' +
      'background:transparent;border-radius:9px;cursor:pointer;font-family:inherit;' +
      'transition:background .15s;text-decoration:none;}' +
    '.bell-i:hover{background:rgba(0,93,99,.06);}' +
    '.bell-i .bt{display:block;font-size:12.5px;font-weight:700;color:var(--text,#1E1C1A);line-height:1.3;}' +
    '.bell-i .bd{display:block;font-size:11px;color:var(--text-muted,#524D48);line-height:1.35;margin-top:1px;}' +
    '.bell-i.mine-rejected .bt{color:var(--stop-ink,#C8102E);}' +
    '.bell-i.mine-approved .bt{color:var(--ok-ink,#0B7A3B);}' +
    '.bell-more{padding:6px 10px 2px;font-size:11px;color:var(--text-light,#756A61);}' +
    '.bell-foot{display:block;width:100%;text-align:center;margin-top:3px;padding:8px 10px;' +
      'border:none;border-top:1px solid var(--border,#C7DBDD);background:transparent;' +
      'font-family:inherit;font-size:12px;font-weight:700;color:var(--primary,#005D63);cursor:pointer;' +
      'text-decoration:none;}' +
    '.bell-foot:hover{background:rgba(0,93,99,.06);}' +
    // On a phone the bell is well in from the edge, so a 300px panel hung
    // from its end ran off the left of the screen and cut every title short.
    // There it spans the screen under the bar instead.
    '@media(max-width:640px){.bell-menu{position:fixed;top:calc(var(--nav-h,64px) + 8px);inset-inline:12px;width:auto;max-height:70vh;}' +
      '.bell-i{padding:10px 12px;}.bell-foot{min-height:44px;}}' +
    'html[data-taqa-theme="dark"] .bell-menu{background:#002326;border-color:#003A3D;}' +
    'html[data-taqa-theme="dark"] .bell-i:hover,html[data-taqa-theme="dark"] .bell-foot:hover{background:rgba(0,187,182,.08);}';
  document.head.appendChild(css);

  // The desk (dashboard.html) already shows the queue on the page; jumping
  // there from anywhere else is what "Open your queue" falls back to.
  function openQueue(){
    var q = document.getElementById('pending-list');
    if (q && /dashboard\.html/.test(location.pathname)) {
      var nav = document.getElementById('navbar');
      var off = (nav ? nav.getBoundingClientRect().bottom : 64) + 16;
      var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({top: Math.max(0, q.getBoundingClientRect().top + window.pageYOffset - off), behavior: still ? 'auto' : 'smooth'});
      return;
    }
    // Leaving from a segment page keeps that segment's desk, not the
    // reader's own default one.
    var id = /segment\.html/.test(location.pathname) ? new URLSearchParams(location.search).get('id') : null;
    location.href = 'dashboard.html' + (id ? '?id=' + encodeURIComponent(id) : '');
  }

  var wrap = null, menu = null;
  // The button ships in every page's static markup with no positioned
  // ancestor of its own; give it one at runtime rather than edit every page.
  function ensureWrap(btn){
    if (wrap) return wrap;
    wrap = document.createElement('div');
    wrap.className = 'bell-wrap';
    btn.parentNode.insertBefore(wrap, btn);
    wrap.appendChild(btn);
    menu = document.createElement('div');
    menu.className = 'bell-menu';
    wrap.appendChild(menu);
    function closeMenu(){ menu.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
    window.taqaCloseBell = closeMenu;
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var open = !menu.classList.contains('open');
      if (open && window.taqaCloseBarPopovers) window.taqaCloseBarPopovers('bell');
      menu.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && menu.classList.contains('open')) { closeMenu(); btn.focus(); }
    });
    wrap.addEventListener('focusout', function(e){
      if (menu.classList.contains('open') && e.relatedTarget && !wrap.contains(e.relatedTarget)) closeMenu();
    });
    menu.addEventListener('click', function(e){
      if (e.target.closest('.bell-foot')) { e.preventDefault(); closeMenu(); openQueue(); return; }
      var ackBtn = e.target.closest('[data-ack]');
      if (ackBtn) { ack(ackBtn.dataset.ack); sync(); }
    });
    return wrap;
  }

  // A submitter has no account to sign into here, so "notify the uploader"
  // can only mean this browser: the one TAQA_STORE.added() already calls
  // "locallyAdded" everywhere else. Acknowledging an outcome is local too,
  // by docNumber and which outcome, so an approval and a later rejection of
  // a resubmission never hide each other.
  var ACK_KEY = 'taqa-ack-outcomes-v1';
  function acked(){
    try { return JSON.parse(localStorage.getItem(ACK_KEY) || '[]'); } catch(e){ return []; }
  }
  function ack(key){
    try {
      var have = acked();
      if (have.indexOf(key) === -1) { have.push(key); localStorage.setItem(ACK_KEY, JSON.stringify(have)); }
    } catch(e){}
  }

  function sync(){
    var btn = document.getElementById('nav-bell');
    if (!btn) return;
    var badge = document.getElementById('bell-badge');
    var R = (typeof TAQA_ROLE !== 'undefined') ? TAQA_ROLE : null;
    var A = (typeof TAQA_APPROVAL !== 'undefined') ? TAQA_APPROVAL : null;
    var cap = (R && R.effective) ? R.effective() : null;
    var signs = !!(cap && (cap.approve || cap.countersign));
    var pending = [];
    try {
      if (typeof TAQA_STORE !== 'undefined' && A) {
        // Newest first: only the first few are drawn, and the one just filed
        // is the one a signer is most likely opening the bell to find.
        pending = TAQA_STORE.all().filter(function(d){
          return A.canApprove(d) || A.canCountersign(d);
        }).sort(function(a, b){
          return String(b.submittedAt || '').localeCompare(String(a.submittedAt || ''));
        });
      }
    } catch(e){}
    // What this browser submitted, now decided one way or the other and not
    // yet seen. A draft still moving through the two steps is not here: it
    // has nothing to tell the submitter yet.
    var have = acked();
    var mine = [];
    try {
      if (typeof TAQA_STORE !== 'undefined') {
        TAQA_STORE.added().forEach(function(d){
          if (d.rejected && have.indexOf(d.docNumber + ':rejected') === -1) {
            mine.push({doc: d, outcome: 'rejected'});
          } else if (!d.rejected && d.status === 'current' && have.indexOf(d.docNumber + ':approved') === -1) {
            mine.push({doc: d, outcome: 'approved'});
          }
        });
      }
    } catch(e){}
    var show = signs || mine.length > 0;
    btn.style.display = show ? '' : 'none';
    if (!show || !badge) return;
    var n = pending.length + mine.length;
    badge.textContent = n > 99 ? '99+' : String(n);
    badge.style.display = n > 0 ? 'flex' : 'none';
    btn.setAttribute('aria-label', n ? n + ' item' + (n === 1 ? '' : 's') + ' need your attention' : 'Approvals, nothing waiting');
    btn.title = btn.getAttribute('aria-label');
    btn.setAttribute('aria-haspopup', 'true');
    if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');

    ensureWrap(btn);
    var SHOWN = 6;
    var pendingHtml = signs
      ? '<div class="bell-hd">Waiting for your signature</div>' +
        (pending.length
          ? pending.slice(0, SHOWN).map(function(d){
              var verb = A.canCountersign(d) ? 'conformance check' : 'final approval';
              // The title is whatever the submitter typed. It went into the
              // signer's page unescaped, so a title carrying markup ran as
              // script in the Director's browser the moment the bell was built.
              // It opens the desk the signature is given from, not the viewer.
              return '<a class="bell-i" href="dashboard.html?id=' + encodeURIComponent(d.segment || '') + '">' +
                '<span class="bt">' + esc(d.title) + '</span>' +
                '<span class="bd">' + esc(d.docNumber) + ' &middot; waiting for your ' + verb + '</span></a>';
            }).join('')
          : '<div class="bell-i" style="cursor:default;"><span class="bd">Nothing waiting right now.</span></div>') +
        (pending.length > SHOWN ? '<div class="bell-more">+ ' + (pending.length - SHOWN) + ' more in your queue</div>' : '')
      : '';
    var mineHtml = mine.length
      ? '<div class="bell-hd">Your submissions</div>' +
        mine.map(function(m){
          var d = m.doc;
          return '<button type="button" class="bell-i mine-' + m.outcome + '" data-ack="' + esc(d.docNumber + ':' + m.outcome) + '">' +
            '<span class="bt">' + esc(d.title) + '</span>' +
            '<span class="bd">' + (m.outcome === 'rejected'
              ? 'Rejected: ' + esc(d.rejectedReason || 'no reason recorded')
              : 'Approved and published') + '</span></button>';
        }).join('')
      : '';
    menu.innerHTML = pendingHtml + mineHtml +
      (signs ? '<button type="button" class="bell-foot">Open your queue</button>' : '');
  }
  window.taqaSyncBell = sync;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync); else sync();
  window.addEventListener('taqa:role-changed', sync);
  window.addEventListener('taqa:register-changed', sync);
  window.addEventListener('storage', sync);
})();
