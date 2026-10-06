/* RISE N + TAQA + States: progressive enhancement only. Every page is complete without this file. */
(function(){
  var d=document,root=d.documentElement,reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* 1. list reveal: once, top to bottom, 40ms apart (max 12 steps) */
  if(!reduce){
    root.classList.add('js');
    var items=d.querySelectorAll('[data-reveal] > *');
    items.forEach(function(el,i){el.classList.add('rvl');el.style.setProperty('--i',Math.min(i,12))});
    var go=function(){items.forEach(function(el){el.classList.add('in')})};
    var hold=root.getAttribute('data-load');            /* search: show the skeleton first, then results */
    if(hold){setTimeout(function(){root.classList.remove('is-loading');requestAnimationFrame(go)},+hold)}
    else requestAnimationFrame(function(){requestAnimationFrame(go)});
  }else{root.classList.remove('is-loading')}
  /* 2. save toggle with confirmation */
  var toast=d.querySelector('.toast'),t;
  d.querySelectorAll('[data-save]').forEach(function(b){
    b.addEventListener('click',function(e){
      e.preventDefault();
      var on=!b.classList.contains('on');
      d.querySelectorAll('[data-save]').forEach(function(x){x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});
      b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');
      if(toast){toast.querySelector('span').textContent=on?'Saved. WI-003 is in your Saved list.':'Removed from Saved.';
        toast.classList.add('show');clearTimeout(t);t=setTimeout(function(){toast.classList.remove('show')},2200)}
    });
  });
})();
