"""Areas index and Area detail (segment.html on main), rebuilt in Register.
Live rules kept: in force only, role-trimmed counts (BD-03), Operations | Maintenance switch, tab set per family,
New/Revised within 120 days, Overdue-first sort and review flags only for Director / QMS / Auditor, ⋯ menu (Bookmark, QR, Copy link)."""
import sys, os, datetime as dt
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from reg import *
TODAY = dt.date(2026, 10, 6)
DESC = {'coiled-tubing': 'Coiled tubing operations, equipment specifications, and continuous operation field procedures for all CT units.',
        'company': 'Company wide policies, signed by the CEO. Apply to every segment, function and center.'}
TABS = [('standard', 'Standards', 'Standards'), ('sop', 'SOPs', 'Standard Operating Procedures'), ('manual', 'Manuals', 'Technical Manuals'),
        ('form', 'Forms &amp; Checklists', 'Forms &amp; Checklists'), ('alert', 'Alerts', 'Technical Alerts'), ('lesson', 'Lessons Learned', 'Lessons Learned')]
SOFT = [r for r in REG if r['segment'] == 'coiled-tubing' and r['docType'] == 'software']

def badge(r):
    days = (TODAY - dt.date.fromisoformat(r['issueDate'])).days
    if days > 120: return ''
    return '<span class="bdg new">New</span>' if r['revision'] in ('1.0', '1') else '<span class="bdg rev">Revised</span>'

def review_note(r, role):
    if role == 'employee' or not r.get('nextReviewDate'): return ''
    days = (dt.date.fromisoformat(r['nextReviewDate']) - TODAY).days
    if r.get('reviewOverdue') or days < 0:
        n = -days; s = f'{n // 30} months' if n >= 60 else f'{n} days'
        return f'<small class="ov">{s} past its review date</small>'
    if days <= 30: return f'<small class="ds">Review due soon, {days} days</small>'
    return ''

def arow(r, role='employee', href='#', cls='', menu=False, read=False, saved=False):
    t = r['title'] + (' <span class="type">· AR</span>' if r['docNumber'] in AR_OF else '')
    k = st_for(r, role)
    cl = '' if r.get('classification') == 'internal' else f'<small>{r["classification"].capitalize()}</small>'
    extra = (' <span class="bdg rd">Read</span>' if read else '') + (' <span class="star" aria-label="Bookmarked">★</span>' if saved else '')
    mn = '''<span class="mnu"><b>⋯</b><span class="pop"><i>Bookmark</i><i>Show QR code</i><i>Copy link</i></span></span>''' if menu else '<span class="mnu"><b>⋯</b></span>'
    return (f'<a href="{href}" class="{cls}{" hot" if status_of(r) == "alt" else ""}" style="--cols:118px minmax(0,1fr) 62px 132px 28px">'
            f'<span class="c">{short(r["docNumber"])}</span><span class="t"><span class="one">{t}{badge(r)}{extra}</span>{review_note(r, role)}{cl}</span>'
            f'<span class="r">Rev {r["revision"]}</span>{k}{mn}</a>')

def area_head(role, side='ops', tab='All'):
    vis = [r for r in inforce(role) if r['segment'] == 'coiled-tubing']
    alerts = [r for r in vis if r['docType'] == 'alert']
    last = max(r['issueDate'] for r in vis)
    days = (TODAY - dt.date.fromisoformat(last)).days
    manage = '<a class="btn sm" href="manage.html">Manage segment</a>' if role in ('owner', 'maintenance', 'qms') else ''
    n_in = len(vis) if side == 'ops' else 0
    return vis, f'''<header class="phead"><div class="meta"><span class="crumb">{crumbs(("Home", "home.html"), ("Areas", "areas.html"), ("Coiled Tubing", None))}</span><span class="lab">Operational segment · TWS · CTSS</span></div>
  <h1 class="t0">Coiled Tubing</h1><p class="sub dk-only">{DESC['coiled-tubing']}</p>
  <div class="ahead"><nav class="seg" aria-label="Department"><a{" class=on" if side == "ops" else ""} href="area.html">Operations</a><a{" class=on" if side == "maint" else ""} href="area-maint.html">Maintenance</a></nav>
  <div class="stats"><div><b>{n_in}</b><span>in force</span></div><div><b{" class=al" if side == "ops" and alerts else ""}>{len(alerts) if side == "ops" and alerts else "None"}</b><span>active alert{"s" if len(alerts) != 1 else ""}</span></div><div class=dk-only><b>{days}</b><span>days since last update</span></div></div>
  <span class="sp"></span><div class="acts">{manage}<a class="btn sm ghost" href="#">Copy link</a></div></div></header>'''

def tabbar(vis, on='All', side='ops', role='employee'):
    if side == 'maint':
        items = [('All', 0, on == 'All', 'area-maint.html')] + [(lab, 0, False, '#') for k, lab, _ in TABS[:4]] + [('Bulletins', 0, on == 'Bulletins', '#'), ('Software', len(SOFT), on == 'Software', '#')] + [(lab, 0, False, '#') for k, lab, _ in TABS[4:]]
        return tabs(items)
    items = [('All', len(vis), on == 'All', 'area.html')]
    for k, lab, _ in TABS:
        n = sum(r['docType'] == k for r in vis)
        items.append((lab, n, on == lab, 'area-sops.html' if k == 'sop' else '#', k == 'alert' and n > 0))
    return tabs(items)

def aside(vis, role):
    recent = [BYNUM[n] for n in ('TQ-TWS-CTSS-WI-003', 'TQ-TWS-CTSS-SOP-009', 'TQ-TWS-CTSS-F001')]
    changed = sorted([r for r in vis if not r.get('translationOf')], key=lambda r: r['issueDate'], reverse=True)[:4]
    alerts = [r for r in vis if r['docType'] == 'alert']
    rel = BYNUM['TQ-P&T-WIC-WI-004']
    return f'''<aside class="aside">
  {sech('Important now', len(alerts))}
  <div class="mini">{"".join(f'<a class="hot" href="#"><b>{r["title"]}</b><span>{short(r["docNumber"])} · Rev {r["revision"]} · {d(r["issueDate"])}</span></a>' for r in alerts) or '<p class="small" style="padding:14px 0">No active alerts. Coiled Tubing has no outstanding technical alerts.</p>'}</div>
  {sech('Your recent', 3)}
  <div class="mini">{"".join(f'<a href="{"document.html" if "WI-003" in r["docNumber"] else "#"}"><b>{r["title"]}</b><span>{TYPE[r["docType"]]} · Coiled Tubing</span></a>' for r in recent)}</div>
  {sech('Recently changed')}
  <div class="mini">{"".join(f'<a href="#"><b>{r["title"]}</b><span>{short(r["docNumber"])} · Rev {r["revision"]} · {d(r["issueDate"])}</span></a>' for r in changed)}</div>
  {sech('Related elsewhere')}
  <div class="mini"><a href="#"><b>{rel["title"]}</b><span>{segname(rel["segment"])} · Rev {rel["revision"]}</span></a></div>
  <p class="help" style="margin-top:26px">A question about CT work? <a class="lnk" href="ask.html">Ask the Coiled Tubing Expert</a></p>
</aside>'''

def area_all(role='employee', name='area.html'):
    vis, head = area_head(role)
    body = head + tabbar(vis, role=role) + '<div class="g84" style="margin-top:8px"><div>'
    for k, lab, h in TABS:
        rs = sorted([r for r in vis if r['docType'] == k], key=lambda r: r['docNumber'])
        body += f'<p class="grph"><b>{h}</b><span>{len(rs)}</span></p>'
        body += '<div class="reg">' + ''.join(arow(r, role, 'document.html' if r['docNumber'].endswith('CTSS-WI-003') else ('document-form.html' if r['docNumber'] == 'TQ-TWS-CTSS-F001' else '#'),
                                               read=r['docNumber'] in ('TQ-TWS-CTSS-WI-003', 'TQ-TWS-CTSS-SOP-009'), saved=r['docNumber'] in ('TQ-TWS-CTSS-WI-003', 'TQ-TWS-CTSS-F001', 'TQ-TWS-CTSS-SOP-009')) for r in rs) + '</div>'
    body += '</div>' + aside(vis, role) + '</div>'
    page(name, 'RISE · Coiled Tubing', body, 'areas', role)
area_all()

# SOPs tab: search box, sort, count, ⋯ menu open
vis = [r for r in inforce() if r['segment'] == 'coiled-tubing']
sops = sorted([r for r in vis if r['docType'] == 'sop'], key=lambda r: r['docNumber'])
_, head = area_head('employee', tab='SOPs')
sop_body = head + tabbar(vis, 'SOPs') + f'''<div class="tool"><div class="in"><span class="mute">Search SOPs…</span></div>
  <nav class="fbar"><span>Sort</span><a class="on" href="#">Default</a><a href="#">A–Z</a></nav><span class="lab">Showing <b>{len(sops)}</b> procedures</span></div>
<div class="g84"><div><p class="grph"><b>Standard Operating Procedures</b><span>{len(sops)}</span></p>
<div class="reg">{"".join(arow(r, menu=(r["docNumber"] == "TQ-TWS-CTSS-SOP-009"), cls=" sel" if r["docNumber"] == "TQ-TWS-CTSS-SOP-009" else "", saved=r["docNumber"] == "TQ-TWS-CTSS-SOP-009", read=r["docNumber"] == "TQ-TWS-CTSS-SOP-009") for r in sops)}</div>
<p class="small" style="margin-top:14px">Page 1 of 1 · 25 rows per page</p></div>{aside(vis, 'employee')}</div>'''
page('area-sops.html', 'RISE · Coiled Tubing · SOPs', sop_body, 'areas')

# search inside a tab: no match
nm_body = head + tabbar(vis, 'SOPs') + f'''<div class="tool"><div class="in focus">wellhead<span class="car">✕</span></div><nav class="fbar"><span>Sort</span><a class="on" href="#">Default</a><a href="#">A–Z</a></nav><span class="lab">Showing <b>0</b> procedures</span></div>
<div class="g84"><div><div class="empty"><h2 class="t2">No procedures match<br><span class="m">“wellhead”.</span></h2><p class="body">Try fewer words, or search every area from Search.</p>
<div class="acts" style="margin-top:18px"><a class="btn" href="#">Clear search</a><a class="btn ghost" href="search.html">Search every area</a></div></div></div>{aside(vis, 'employee')}</div>'''
page('area-nomatch.html', 'RISE · Coiled Tubing · no match', nm_body, 'areas')

# Maintenance side: empty tabs with the real wording; Software shown
_, mhead = area_head('employee', side='maint')
soft = ''.join(f'<div class="row" style="--cols:118px minmax(0,1fr) 220px"><span class="c">{r["revision"]}</span><span class="t"><span class="one">{r["title"]}</span><small>Software asset, not under document control · Distributed by Digital Transformation</small></span><span class="a">Not controlled</span></div>' for r in SOFT)
m_body = mhead + tabbar(vis, 'All', side='maint') + f'''<div class="g84" style="margin-top:8px"><div>
  <p class="grph"><b>Maintenance Bulletins</b><span>0</span></p>
  <div class="empty sm"><h3 class="t3">No maintenance bulletins for Coiled Tubing yet</h3><p class="small">The Coiled Tubing maintenance department’s bulletins appear here once its Maintenance Manager approves them.</p></div>
  <p class="grph"><b>Standard Operating Procedures</b><span>0</span></p>
  <div class="empty sm"><h3 class="t3">No maintenance SOPs for Coiled Tubing yet</h3><p class="small">The Coiled Tubing maintenance department’s SOPs appear here once its Maintenance Manager approves them.</p></div>
  <p class="grph"><b>Software &amp; Tools</b><span>{len(SOFT)}</span></p><div class="reg">{soft}</div>
</div><aside class="aside">{sech('About this side')}<p class="body" style="margin-top:12px">Maintenance documents, and every Maintenance Bulletin, are released by the segment’s <b>Maintenance Manager</b> and listed only here.</p>
<p class="help" style="margin-top:20px">A maintenance question? <a class="lnk" href="ask.html">Ask the Coiled Tubing Maintenance Manager</a></p></aside></div>'''
page('area-maint.html', 'RISE · Coiled Tubing · Maintenance', m_body, 'areas')

# Director view: review flags, Overdue-first sort, Manage segment
dvis = [r for r in inforce('owner') if r['segment'] == 'coiled-tubing']
_, dhead = area_head('owner', tab='SOPs')
dsops = sorted([r for r in dvis if r['docType'] == 'sop'], key=lambda r: (not r.get('reviewOverdue'), r['docNumber']))
d_body = dhead + tabbar(dvis, 'SOPs', role='owner') + f'''<div class="tool"><div class="in"><span class="mute">Search SOPs…</span></div>
  <nav class="fbar"><span>Sort</span><a href="#">Default</a><a href="#">A–Z</a><a class="on" href="#">Overdue first</a></nav><span class="lab">Showing <b>{len(dsops)}</b> procedures</span></div>
<div class="g84"><div><div class="reg">{"".join(arow(r, "owner") for r in dsops)}</div></div>{aside(dvis, 'owner')}</div>'''
page('area-director.html', 'RISE · Coiled Tubing · Director', d_body, 'areas', role='owner')

# Company policies
pol = sorted([r for r in inforce() if r['segment'] == 'company'], key=lambda r: r['title'])
p_body = f'''<header class="phead"><div class="meta"><span class="crumb">{crumbs(("Home", "home.html"), ("Areas", "areas.html"), ("Company policies", None))}</span><span class="lab">Company Wide · apply to everyone</span></div>
  <h1 class="t0">Company policies</h1><p class="sub">{DESC['company']}</p>
  <div class="stats"><div><b>{len(pol)}</b><span>policies in force</span></div></div></header>
{tabs([('Policies', len(pol), True, '#')])}
<div class="g84" style="margin-top:8px"><div><div class="reg">{"".join(arow(r) for r in pol)}</div></div>
<aside class="aside">{sech('Numbering')}<p class="body" style="margin-top:12px">Policies are numbered by the corporate function that owns them, for example <b>TQ-QHSE-P007</b>. One policy still carries a provisional number, <b>TQ-QHSE-P###</b>, until QHSE assigns the next serial.</p></aside></div>'''
page('area-policies.html', 'RISE · Company policies', p_body, 'areas')

# Areas index: Company policies, then the three families as register columns
def fam(g, title):
    ks = sorted([k for k, s in SEGS.items() if s['group'] == g] + (['geothermal-coe'] if False else []), key=lambda k: SEGS[k]['name'])
    rows = ''.join(f'<a href="{"area.html" if k == "coiled-tubing" else "#"}"{" class=mine" if k == "coiled-tubing" else ""}><b>{SEGS[k]["name"]}</b><span class="tg">{TAG.get(k, "")}{" · provisional" if SEGS[k]["provisional"] else ""}</span><span class="n">{count_for(k)}</span></a>' for k in ks)
    return f'<div><p class="grph"><b>{title}</b><span>{len(ks)}</span></p><div class="alist">{rows}</div></div>'
a_body = f'''<header class="phead"><div class="meta"><span class="lab">Areas</span><span class="lab"><b>{len(EMP) if False else len(inforce())}</b> documents in force · <b>25</b> areas</span></div>
  <h1 class="t0">Every area<span class="m phx">, one register.</span></h1><p class="sub">Your area is marked. Counts are documents in force you can open.</p></header>
<a class="polrow" href="area-policies.html"><span class="lab">Company Wide</span><b>Company policies</b><span class="tg">Apply to everyone · signed by the CEO</span><span class="n">{count_for("company")}</span></a>
<div class="g3" style="margin-top:12px">{fam("segment", "Operational segments")}{fam("function", "Corporate functions")}{fam("product", "Products &amp; Technology")}</div>'''
page('areas.html', 'RISE · Areas', a_body, 'areas')
print('browse ok', len(vis), len(dvis))
