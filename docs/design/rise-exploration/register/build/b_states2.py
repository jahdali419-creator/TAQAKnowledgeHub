"""Loading, offline and error states in the chosen style. Design exploration only."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from reg import *

SAVED = [BYNUM[n] for n in ('TQ-TWS-CTSS-WI-003', 'TQ-TWS-CTSS-F001', 'TQ-TWS-CTSS-SOP-009') if n in BYNUM]
EMP = inforce('employee')

# 1 · loading: results on their way, the page keeps its shape (no jump when they arrive)
skel = ''.join(f'<div class="sk-row" style="--d:{i * 90}ms"><i class="b c"></i><span><i class="b t" style="width:{w}%"></i><i class="b s"></i></span><i class="b r"></i></div>' for i, w in enumerate([62, 48, 71, 55, 66, 44]))
body = f'''<header class="phead" style="padding-bottom:6px"><div class="meta"><span class="lab">Search the register</span><span class="lab" aria-live="polite">Searching {len(EMP)} documents…</span></div></header>
<div class="q"><span class="val">pressure</span><span class="caret"></span><span class="clr">Clear</span></div>
<div class="sk-wrap" role="status" aria-label="Loading results"><p class="sk-note"><span class="spin" aria-hidden="true"></span>Looking in titles and numbers. This usually takes under a second.</p>
<div class="reg sk">{skel}</div></div>'''
page('state-loading.html', 'RISE · Search · Loading', body, 'search', dock_active='search')

# 2 · offline: no signal on site; saved documents still open
rows = ''.join(rrow(r, href='document.html' if r['docNumber'] == 'TQ-TWS-CTSS-WI-003' else '#', sub='Saved copy · synced Tue 6 Oct, 09:14') for r in SAVED)
off = ''.join(row(short(r['docNumber']), r['title'], segname(r['segment']), 'Rev ' + r['revision'], '<span class="st lockd">Needs a connection</span>', d(r['issueDate'], '%d %b'), '#', 'off') for r in sorted(EMP, key=lambda r: r['issueDate'], reverse=True)[:3] if r not in SAVED)
body = f'''<header class="phead"><div class="meta"><span class="lab">Saved</span><span class="lab">Offline</span></div><h1 class="t1">You’re offline. <span class="m">Your saved documents still open.</span></h1></header>
<div class="offbar" role="status"><span class="dot" aria-hidden="true"></span><span><b>No signal.</b> Showing the copies saved on this device, last synced Tue 6 Oct, 09:14. They were current then; RISE checks them again as soon as you’re back online.</span><a class="btn sm" href="#">Try again</a></div>
<div class="sech"><h2>Ready offline</h2><sup>{len(SAVED)}</sup></div><div class="reg">{rows}</div>
<div class="sech"><h2>Needs a connection</h2><sup>3</sup></div><p class="small" style="margin:-4px 0 12px">Recently changed in Coiled Tubing. Save a document while online to keep it for site.</p><div class="reg muted">{off}</div>'''
page('state-offline.html', 'RISE · Saved · Offline', body, 'saved', dock_active='saved')

# 3 · error: the register cannot be reached
body = f'''<header class="phead"><div class="meta"><span class="lab">Connection problem</span><span class="lab">Error RS-503</span></div><h1 class="t1">We can’t reach the register <span class="m">right now.</span></h1>
<p class="sub">Your connection is working, but RISE can’t get an answer from the document register. Nothing you saved is lost.</p></header>
<div class="errc"><div><p class="lab">What you can do now</p><ul><li><b>Open your saved documents.</b> They work without the register.</li><li><b>Wait a minute and try again.</b> RISE retries on its own.</li><li><b>Still down after 15 minutes?</b> Call the IT Service Desk and quote error RS-503.</li></ul>
<div class="acts" style="margin-top:22px"><a class="btn pri" href="#" id="retry">Try again now</a><a class="btn" href="saved.html">Open saved documents</a></div></div>
<div class="errs" aria-live="polite"><p class="lab">Status</p><p class="big"><span id="cd">30</span><small>s</small></p><p class="small">until RISE tries again by itself</p><p class="small" style="margin-top:14px">Last tried 09:14:02 · 3 tries</p></div></div>'''
SCRIPT = "(function(){var n=30,el=document.getElementById('cd');setInterval(function(){n=n>1?n-1:30;el.textContent=n},1000);document.getElementById('retry').onclick=function(e){e.preventDefault();n=30;el.textContent=n}})();"
page('state-error.html', 'RISE · Register unavailable', body, 'home', script=SCRIPT)
print('states ok')
