"""Segment landing pages: one Register template, generated for all 25 areas from the live register (Employee view, BD-03 counts).
Each area is told apart by its own data, not by decoration: its register code set large (CTSS, FS, QHSE…), and its library strip —
the real mix of its documents by type, drawn to scale. Tabs relabel per family as the live app does. Plus a board of all 25."""
import sys, os, re, datetime as dt
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from reg import *

TODAY = dt.date(2026, 10, 7)
SD = open(os.path.join(REPO, 'segments-data.js')).read()
META = {m.group(1): (m.group(5), m.group(7)) for m in re.finditer(
    r"'([a-z-]+)':\s*\{\s*name:\s*(['\"])(.*?)\2,.*?tag:\s*(['\"])(.*?)\4,\s*desc:\s*(['\"])(.*?)\6,", SD, re.S)}
FAMILY = {'segment': 'Operational segment', 'function': 'Corporate function', 'product': 'Products & Technology', 'company': 'Company Wide'}
ORDER = ['sop', 'manual', 'standard', 'form', 'alert', 'lesson', 'policy']
LABEL = {  # section names by family, as segment.html relabels them
 'segment': {'sop': 'Standard Operating Procedures', 'manual': 'Technical Manuals', 'standard': 'Standards', 'form': 'Forms & Checklists', 'alert': 'Technical Alerts', 'lesson': 'Lessons Learned', 'policy': 'Policies'},
 'function': {'sop': 'Procedures', 'manual': 'Manuals', 'standard': 'Standards', 'form': 'Forms', 'alert': 'Notices', 'lesson': 'Lessons Learned', 'policy': 'Policies'},
 'product': {'sop': 'Procedures', 'manual': 'Product Manuals', 'standard': 'Standards', 'form': 'Forms', 'alert': 'Product Bulletins', 'lesson': 'Lessons Learned', 'policy': 'Policies'},
 'company': {'policy': 'Policies'}}
SHORT = {'sop': 'SOP', 'manual': 'WI', 'standard': 'ST', 'form': 'FRM', 'alert': 'ALT', 'lesson': 'LL', 'policy': 'POL'}
EXPERT = {'coiled-tubing': ('Coiled Tubing Expert', 'CT Operations · Stimulation'), 'drilling': ('Drilling Expert', 'Drilling · Well Control'),
          'well-safety': ('Safety Services Expert', 'Safety Critical · BOP Systems'), 'qhse': ('QHSE Expert', 'Quality · HSE · Compliance')}
CONTRIB = {'cybersecurity': 'Mohammed Al Obaid, Cybersecurity Director · Afnan Al Khabty, Senior Cyber Security Analyst'}

def strip(vis, big=True):
    n = len(vis) or 1
    cnt = [(k, sum(r['docType'] == k for r in vis)) for k in ORDER]
    cnt = [(k, c) for k, c in cnt if c]
    bar = ''.join(f'<i class="t-{k}" style="flex:{c}" title="{c} {SHORT[k]}"></i>' for k, c in cnt)
    leg = ''.join(f'<span><i class="t-{k}"></i>{SHORT[k]} <b>{c}</b></span>' for k, c in cnt) if big else ''
    return f'<div class="lib{"" if big else " sm"}"><div class="bar">{bar}</div>{f"<div class=leg>{leg}</div>" if leg else ""}</div>'

def mini_row(r):
    hot = ' hot' if r['docType'] == 'alert' else ''
    href = 'document.html' if r['docNumber'] == 'TQ-TWS-CTSS-WI-003' else '#'
    return (f'<a class="{hot}" href="{href}"><span class="c">{short(r["docNumber"])}</span><span class="t"><span class="one">{r["title"]}'
            f'{" <span class=type>· AR</span>" if r["docNumber"] in AR_OF else ""}</span></span><span class="r">Rev {r["revision"]}</span>{st_for(r)}</a>')

def seg_page(key):
    s = SEGS[key]; fam = s['group']; name = s['name']
    tag, desc = META.get(key, ('', ''))
    vis = [r for r in inforce('employee') if r['segment'] == key]
    alerts = [r for r in vis if r['docType'] == 'alert']
    last = max((r['issueDate'] for r in vis), default=None)
    days = (TODAY - dt.date.fromisoformat(last)).days if last else None
    recent = sorted([r for r in vis if not r.get('translationOf')], key=lambda r: r['issueDate'], reverse=True)[:4]
    code = s['spl'] if key != 'company' else 'POL'
    bu = s.get('bu')
    numline = f'TQ · {bu} · {s["spl"]}' if bu else (f'TQ · {s["spl"]}' if key != 'company' else 'TQ · ‹Function› · P')
    lab = LABEL[fam if fam in LABEL else 'function']
    # library by type; operational segments always show their six sections, others only non-empty ones
    groups = ''
    for k in ORDER:
        rs = sorted([r for r in vis if r['docType'] == k], key=lambda r: r['docNumber'])
        if not rs and not (fam == 'segment' and k != 'policy'): continue
        if k not in lab: continue
        if rs:
            more = f'<a class="all" href="{"area-sops.html" if key == "coiled-tubing" and k == "sop" else "#"}">All {len(rs)} →</a>' if len(rs) > 4 else ''
            groups += f'<section class="grp"><p class="grph"><b>{lab[k]}</b><span>{len(rs)}</span>{more}</p><div class="reg sl">{"".join(mini_row(r) for r in rs[:4])}</div></section>'
        else:
            groups += f'<section class="grp"><p class="grph"><b>{lab[k]}</b><span>0</span></p><p class="none">No {lab[k].lower()} issued for {name} yet.</p></section>'
    ex = EXPERT.get(key)
    ask = (f'<b>{ex[0]}</b><span>{ex[1]}</span>' if ex else
           (f'<b>All Segment Experts</b><span>No named expert for {name}. Shared with all segment experts.</span>' if key != 'company' else ''))
    alert_block = (''.join(f'<a class="alc" href="#"><span class="lab">Technical alert · {short(r["docNumber"])} · Rev {r["revision"]}</span><b>{r["title"]}</b><span class="d">Issued {d(r["issueDate"])}</span></a>' for r in alerts[:2])
                   if alerts else f'<p class="calm"><i></i>No active alerts in {name}.</p>')
    prov = note('due', f'<b>Provisional area code.</b> {s["note"] or "Its short form is waiting on QHSE assignment."}') if s.get('provisional') else ''
    seg_switch = ('<nav class="seg" aria-label="Department"><a class="on" href="#">Operations</a><a href="#">Maintenance</a></nav>' if fam == 'segment' else '')
    body = f'''<div class="sl-page">
<header class="sl-hero">
  <div class="id"><p class="crumb">{crumbs(("Areas", "areas.html"), (FAMILY[fam], None))}</p>
    <h1>{name}</h1>
    <p class="tagl">{tag}{f" · {s['splName']}" if s.get('splName') and s['splName'] != name and key != 'company' else ""}</p>
    <p class="desc">{desc}</p>
    <div class="facts"><div><b>{len(vis)}</b><span>in force</span></div><div><b class="{"al" if alerts else ""}">{len(alerts) if alerts else "None"}</b><span>active alert{"s" if len(alerts) != 1 else ""}</span></div>
      {f'<div class="dk-only"><b>{days}</b><span>days since last issue</span></div>' if days is not None else ''}</div>
    {seg_switch}
  </div>
  <div class="mark ph"><span class="code" aria-hidden="true">{code}</span><span class="num">{numline}</span>{plate(photo_of(key), PHOTO_CAP[photo_of(key)])}</div>
</header>
{strip(vis)}
{prov}
<div class="sl-grid">
  <div class="main">
    <section class="now"><p class="grph"><b>Important now</b></p>{alert_block}</section>
    {f'<section class="grp"><p class="grph"><b>Recently issued</b><span>{len(recent)}</span></p><div class="reg sl">{"".join(mini_row(r) for r in recent)}</div></section>' if recent and len(vis) > 6 else ''}
    <div class="lib-groups">{groups}</div>
  </div>
  <aside class="side">
    {f'<div class="askc"><p class="lab">A question about {name}?</p>{ask}<a class="btn" href="ask.html">Ask an Expert</a></div>' if ask else ''}
    {f'<div class="contrib"><p class="lab">Contributors</p><p>{CONTRIB[key]}</p></div>' if key in CONTRIB else ''}
    <div class="numc"><p class="lab">How numbers read here</p><p class="code full">{numline.replace(" · ", "-").replace("‹Function›", "QHSE")}-…</p></div>
  </aside>
</div></div>'''
    page(f'seg-{key}.html', f'RISE · {name}', body, 'areas', dock_active='areas')
    return key, name, fam, vis, alerts, code

ALLK = ['company'] + [k for f in ('segment', 'function', 'product') for k in sorted([k for k, s in SEGS.items() if s['group'] == f], key=lambda k: SEGS[k]['name'])]
# Importing this module (b_seg2, b_family, b_bold, b_landing21 reuse META/ALLK…) must not rewrite pages:
# the old seg-* template and the board are written only when this file is run directly.
if __name__ == '__main__':
    built = [seg_page(k) for k in ALLK]

    # board: every area at a glance, each with its own code and library strip
    def tile(b):
        key, name, fam, vis, alerts, code = b
        al = f' · <em>{len(alerts)} alert{"s" if len(alerts) != 1 else ""}</em>' if alerts else ''
        return (f'<a class="tile" href="seg-{key}.html"><span class="tc">{code}</span><b>{name}</b><span class="tf">{FAMILY[fam]}</span>'
                f'{strip(vis, big=False)}<span class="tn"><b>{len(vis)}</b> in force{al}</span></a>')
    board = f'''<header class="phead"><div class="meta"><span class="lab">Areas · every landing page</span><span class="lab"><b>25</b> areas · one template</span></div>
      <h1 class="t0">Twenty-five areas. <span class="m phx">Each with its own signature.</span></h1>
      <p class="sub">The same landing page for every area, filled from the register. What tells them apart is real: the area’s register code, and the mix of its library, drawn to scale.</p></header>
    <div class="legend2">{"".join(f'<span><i class="t-{k}"></i>{SHORT[k]}</span>' for k in ORDER)}<span class="sp"></span></div>
    {"".join(f'<p class="grph" style="margin-top:34px"><b>{t}</b><span>{len([b for b in built if b[2] == g])}</span></p><div class="tiles">{"".join(tile(b) for b in built if b[2] == g)}</div>' for g, t in (("company", "Company Wide"), ("segment", "Operational segments"), ("function", "Corporate functions"), ("product", "Products &amp; Technology")))}'''
    page('segments.html', 'RISE · All area landings', board, 'areas', dock_active='areas')
    print('segments', len(built))
