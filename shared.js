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
