/* Halo: count-up for headline figures (progressive enhancement; numbers are in the HTML). */
(function(){
  if(!document.documentElement.classList.contains('mo'))return;
  document.querySelectorAll('[data-n]').forEach(function(el,k){
    var n=+el.dataset.n,t0=null,dur=900+k*120;
    function f(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=Math.round(n*e);if(p<1)requestAnimationFrame(f)}
    el.textContent='0';setTimeout(function(){requestAnimationFrame(f)},300);
  });
})();
