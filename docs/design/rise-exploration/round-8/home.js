/* RISE Home: tab switching and phone sheets via the URL hash (progressive enhancement). */
(function(){
  function show(){
    var h=location.hash.slice(1);
    document.querySelectorAll('[data-sheet]').forEach(function(s){s.hidden=s.dataset.sheet!==h});
    if(h==='alerts'||h==='changed'){
      document.querySelectorAll('[data-tab]').forEach(function(t){t.classList.toggle('on',t.dataset.tab===h)});
      document.querySelectorAll('[data-panel]').forEach(function(p){p.hidden=p.dataset.panel!==h});
    }
    document.body.classList.toggle('locked',h==='menu'||h==='search');
  }
  window.addEventListener('hashchange',show);show();
  document.querySelectorAll('.sheet-bg').forEach(function(b){b.addEventListener('click',function(){location.hash=''})});
})();
