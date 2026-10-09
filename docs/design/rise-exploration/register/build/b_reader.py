"""Document reader: what “Open the reader” shows for WI-003. Replaces the old “preview not connected” box.
Contents with the current section marked, the changes in this revision marked, find in document, text size, and a
high-contrast sunlight mode for site use. The body text is sample layout text, labelled as such: the approved text
lives only in the controlled PDF. Design exploration only."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from reg import *

R = BYNUM['TQ-TWS-CTSS-WI-003']
SECTIONS = [
 ('s1', '1', 'Purpose and scope', ['This manual sets out how the injector head is rigged up, operated and rigged down on Coiled Tubing units.', 'It applies to every CT crew and supervisor running the unit, onshore and offshore.'], False),
 ('s2', '2', 'References', ['TQ-TWS-CTSS-SOP-002 Coiled Tubing Rig-Up.', 'TQ-TWS-CTSS-S001 CT Operations Authorization Standard.', 'Manufacturer’s injector head manual for the unit in use.'], False),
 ('s3', '3', 'Safety', ['Keep clear of the gooseneck and chains while the injector is moving.', 'Stop the job if traction pressure goes above the limit in section 4.2 and call the supervisor.'], 'safety'),
 ('s4', '4', 'Pre-job checks', ['Check chain condition, gripper blocks and lubrication before rig-up.', 'Record the checks on F001 Pre-Job Safety Checklist.'], False),
 ('s42', '4.2', 'Traction pressure limits', ['For 2-inch string the traction pressure limit is set out in table 4.2. Do not run above it.', 'Set the relief valve to the table value before running in hole, and record the setting.'], True),
 ('s5', '5', 'Operating the injector head', ['Run in hole at the speeds in table 5.1, reducing speed through restrictions.', 'Watch weight and traction pressure together. A rise in one without the other means stop and check.'], False),
 ('s6', '6', 'Emergency stop and disconnect', ['Use the emergency stop on the console first. Follow SOP-004 Emergency Disconnect if the string must be released.'], False),
 ('s7', '7', 'Records', ['Keep the completed checklist and job log with the job file for 10 years.'], False),
]
N = len(SECTIONS)
toc = ''.join(f'<a href="#{i}" data-s="{i}"{" class=on" if k == 0 else ""}><span>{n}</span>{t}{"<i>Changed</i>" if c is True else ""}</a>' for k, (i, n, t, ps, c) in enumerate(SECTIONS))
def sec(i, n, t, ps, c):
    body = ''.join(f'<p{" class=chg" if c is True else ""}>{p}</p>' for p in ps)
    if c == 'safety':
        body = f'<div class="saf"><b>Safety</b>{body}</div>'
    tag = '<span class="cht">Changed in Rev 4.0</span>' if c is True else ''
    return f'<section id="{i}" class="rs"><h2><span>{n}</span>{t}{tag}</h2>{body}</section>'
paper = ''.join(sec(*s) for s in SECTIONS)

body = f'''<header class="phead dh"><div class="meta"><span class="crumb"><a href="home.html">Home</a><i>/</i><a href="area.html">Coiled Tubing</a><i>/</i><a href="document.html">{R["title"]}</a><i>/</i>Read</span><span class="lab">Reader · Rev {R["revision"]}</span></div>
<p class="rline" style="margin-top:26px"><b>{R["docNumber"]}</b><span>Rev {R["revision"]}</span><span>Current, OK to use</span></p>
<h1 class="t1">{R["title"]}</h1></header>
<div class="rbar" role="toolbar" aria-label="Reader tools">
 <span class="pos" id="rpos">Section 1 of {N}</span>
 <label class="find"><span class="vh">Find in document</span><input id="rfind" type="search" placeholder="Find in document" autocomplete="off"><span id="rcount" class="cnt"></span></label>
 <span class="grow"></span>
 <button type="button" class="tg on" id="rchg" aria-pressed="true">Changes in Rev 4.0</button>
 <span class="sz"><button type="button" id="rdn" aria-label="Smaller text">A−</button><button type="button" id="rup" aria-label="Larger text">A+</button></span>
 <button type="button" class="tg" id="rsun" aria-pressed="false">Sunlight</button>
 <a class="btn sm pri" href="#">Download PDF</a>
</div>
<div class="rd"><nav class="rtoc" aria-label="Contents"><p class="lab">Contents</p>{toc}</nav>
<article class="rpaper chg-on" id="rpaper"><div class="rhd"><span>TAQA · Coiled Tubing</span><span>{R["docNumber"]} · Rev {R["revision"]}</span></div>
<p class="note">Sample text to show the reader. The approved wording is in the controlled PDF.</p>
<div class="rwhat"><b>What changed in Rev 4.0</b><p>Traction pressure limits for 2-inch string (section 4.2). Replaces Rev 3.0.</p><a href="#s42">Go to the change</a></div>
{paper}
<p class="rfoot">Uncontrolled when printed. Check the current revision in RISE before use.</p></article></div>'''

SCRIPT = r'''(function(){
var paper=document.getElementById('rpaper'),secs=[].slice.call(paper.querySelectorAll('.rs')),links=[].slice.call(document.querySelectorAll('.rtoc a')),pos=document.getElementById('rpos');
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var i=secs.indexOf(e.target);links.forEach(function(a,k){a.classList.toggle('on',k==i)});pos.textContent='Section '+(i+1)+' of '+secs.length}})},{rootMargin:'-30% 0px -60% 0px'});
secs.forEach(function(s){io.observe(s)});
function tog(id,fn){var b=document.getElementById(id);b.addEventListener('click',function(){var on=b.getAttribute('aria-pressed')!='true';b.setAttribute('aria-pressed',on);b.classList.toggle('on',on);fn(on)})}
tog('rchg',function(on){paper.classList.toggle('chg-on',on)});
tog('rsun',function(on){document.body.classList.toggle('sun',on)});
var size=17;function setSize(d){size=Math.max(15,Math.min(23,size+d));paper.style.setProperty('--rs',size+'px')}
document.getElementById('rup').onclick=function(){setSize(2)};document.getElementById('rdn').onclick=function(){setSize(-2)};
var ps=[].slice.call(paper.querySelectorAll('.rs p')),orig=ps.map(function(p){return p.innerHTML}),cnt=document.getElementById('rcount');
document.getElementById('rfind').addEventListener('input',function(e){var q=e.target.value.trim().toLowerCase(),n=0,first=null;
 ps.forEach(function(p,i){p.innerHTML=orig[i];if(q.length<2)return;var t=p.textContent,l=t.toLowerCase(),out='',k=0,j;
  while((j=l.indexOf(q,k))>-1){out+=t.slice(k,j).replace(/</g,'&lt;')+'<mark>'+t.slice(j,j+q.length).replace(/</g,'&lt;')+'</mark>';k=j+q.length;n++}
  if(k){p.innerHTML=out+t.slice(k).replace(/</g,'&lt;');if(!first)first=p}});
 cnt.textContent=q.length<2?'':(n?n+' found':'None');if(first)first.scrollIntoView({block:'center',behavior:'smooth'})});
})();'''

page('document-read.html', f'RISE · {R["title"]} · Read', body, 'areas', script=SCRIPT)
print('reader ok')
