"""Home: the approved round-8 composition, generated from the register for each role (BD-03 trimming)."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from reg import *
SCRIPT = open(os.path.join(REG_ROOT, '..', 'round-8', 'home.js')).read()

def home(role, name, desk_line=''):
    vis = inforce(role)
    N = {k: sum(r['docType'] == k for r in vis) for k in ('sop', 'manual', 'standard', 'alert', 'lesson')}
    ct = [r for r in vis if r['segment'] == 'coiled-tubing']
    changed = sorted([r for r in ct if not r.get('translationOf')], key=lambda r: r['issueDate'], reverse=True)[:6]
    alerts = [r for r in ct if r['docType'] == 'alert']
    rows = ''.join(rrow_role(r, role, 'document.html' if r['docNumber'].endswith('CTSS-WI-003') else '#', code=short(r['docNumber'])) for r in changed)
    arows = ''.join(rrow_role(r, role, '#', code=short(r['docNumber'])) for r in alerts)
    saved = [BYNUM[n] for n in ('TQ-TWS-CTSS-WI-003', 'TQ-TWS-CTSS-F001', 'TQ-TWS-CTSS-SOP-009')]
    srows = ''.join(rrow_role(r, role, 'document.html' if 'WI-003' in r['docNumber'] else '#', code=short(r['docNumber'])) for r in saved)
    pol = sum(1 for r in vis if r['segment'] == 'company')
    recent = sorted(vis, key=lambda r: r['issueDate'], reverse=True)[:5]
    tick = ''.join(f'<span class="it"><span class="ar">↘</span> {d(r["issueDate"], "%d %b")} <b{" class=x" if r["docType"] == "alert" else ""}>{short(r["docNumber"])}</b> {r["title"]} · {segname(r["segment"])}</span>' for r in recent)
    director = role != 'employee'
    note = ('<span class="note"><i></i><span>§5 Operating limits changed by ALT-002<span>New pressure rating for 2-inch CT string · 13 Apr 2026 · Confidential</span></span></span>' if director else '<span class="note n"><i></i><span>In your Saved list<span>Bookmarked on this device · Rev 4.0 is the revision in force</span></span></span>')
    body = f'''<div class="home">
  <section class="left" aria-labelledby="q">
    <p class="meta"><span>RISE <b>/</b> TAQA knowledge</span><span><b>{len(vis)}</b> in force · <b>25</b> areas<span class="dkonly"> · register 06 Oct 2026</span></span></p>
    <p class="kick">Tuesday 6 October · <b>Coiled Tubing</b>, Operations</p>
    <a class="q" id="q" href="search.html"><span class="w">Search</span><span class="caret" aria-hidden="true"></span><span class="ph">by number or title</span></a>
    <p class="try">Try <a href="search-number.html">WI-003</a><a href="area.html">Coiled Tubing</a><a href="search-results.html">pressure</a><a href="search-typing.html">inject</a><span class="enter">Press <kbd>↵</kbd> to search · <kbd>/</kbd> from anywhere</span></p>
    <nav class="scope" aria-label="Search in"><span class="lbl">In</span><a class="on" href="search.html">Everything</a><a href="#">Procedures <b>{N['sop']}</b></a><a href="#">Work instructions <b>{N['manual']}</b></a><a href="#">Standards <b>{N['standard']}</b></a><a href="#">Technical alerts <b>{N['alert']}</b></a><a href="#">Lessons <b>{N['lesson']}</b></a><a href="#">Bulletins <b>—</b></a><a href="areas.html">Areas <b>25</b></a></nav>
    {desk_line}
    <nav class="tabs" aria-label="Your knowledge">
      <a class="on" href="#changed" data-tab="changed">Changed in Coiled Tubing<sup>{len(changed)}</sup></a>
      <a href="#alerts" data-tab="alerts">Alerts<sup>{len(alerts)}</sup>{"<span class=al></span>" if any(status_of(r) == "alt" for r in alerts) else ""}</a>
      <a href="#saved" data-tab="saved">Saved<sup>3</sup></a>
      <a class="more" href="area.html">View all →</a>
    </nav>
    <div class="reg" data-panel="changed">{rows}</div>
    <div class="reg" data-panel="alerts" hidden>{arows}</div>
    <div class="reg" data-panel="saved" hidden>{srows}</div>
  </section>
  <aside class="right" aria-label="Continue reading">
    <p class="lab"><span>Continue reading</span><span>4 revisions · 1 in force</span></p>
    <a class="stack" href="document.html" aria-label="WI-003 Injector Head Operations Manual, Revision 4.0, Current">
      <span class="pg p3"></span><span class="pg p2"></span><span class="pg p1"></span>
      <span class="pg p0">
        <span class="hd"><span>TQ-TWS-CTSS-WI-003</span><span>REV 4.0</span></span>
        <span class="typ">Manual · Coiled Tubing</span>
        <h2>Injector Head Operations Manual</h2>
        <span class="ctl"><span class="cell"><span class="k">Status</span><b class="ok">Current, OK to use</b></span><span class="cell"><span class="k">Effective</span><b>30 Aug 2025</b></span>
          <span class="cell"><span class="k">Approver</span><b>Subject Matter Expert</b></span><span class="cell"><span class="k">Next review</span><b>30 Aug 2028</b></span></span>
        <span class="new"><span class="k">What changed in 4.0</span>Traction pressure limits for 2-inch string</span>
        {note}
      </span>
    </a>
    <p class="also">Also open <a href="#"><span class="c">SOP-009</span>Acid Stimulation SOP</a></p>
    <div class="areas"><p class="lab" style="margin-bottom:14px"><span>Your areas</span></p>
      <a href="area.html"><b>Coiled Tubing</b><span>{len(ct)} in force · home</span></a>
      <a href="area-policies.html"><b>Company policies</b><span>{pol} · apply to everyone</span></a>
      <a class="all" href="areas.html"><b>All 25 areas</b><span>→</span></a></div>
    <p class="help">Stuck? <a href="ask.html">Ask an Expert</a> or look up a term in the <a href="glossary.html">Field Glossary</a>.</p>
  </aside>
  <footer class="foot" aria-label="Recently published across TAQA"><div class="wrap"><span class="h">Across TAQA</span>{tick}</div></footer>
</div>'''
    page(name, 'RISE · Home', body, 'home', role, script=SCRIPT)
    return len(vis), len(ct)

print(home('employee', 'home.html'))
ov = sum(1 for r in inforce('owner') if r['segment'] == 'coiled-tubing' and r.get('reviewOverdue'))
line = f'<p class="bnr spark" style="margin-top:34px;grid-template-columns:auto 1fr auto"><span class="ic"></span><span><b>Your desk.</b> 1 document waiting on your sign-off in Coiled Tubing, and {ov} past review there.</span><a class="go" href="desk.html">Approve</a></p>'
print(home('owner', 'home-director.html', line))
