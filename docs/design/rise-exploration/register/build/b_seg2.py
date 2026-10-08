"""Segment landings in the chosen style (Night Shift hero + Daylight cards), with the user's TAQA photography.
Overwrites seg-<key>.html for all 25 areas. Data and rules as before: Employee view, in force only, family relabels."""
import sys, os, datetime as dt
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
import b_segments as S  # noqa: reuses META, LABEL, EXPERT, CONTRIB, FAMILY, ORDER (and builds the old pages, which we overwrite)
from reg import *

PHOTO = {k: f'seg-{k}.jpg' for k in ['wireline', 'pt-intervention-coe', 'drilling', 'qhse', 'coiled-tubing', 'inspection', 'fracturing',
                                       'learning-center', 'cementing', 'pt-drilling-coe', 'well-testing', 'well-safety',
                                       'slickline', 'well-completions', 'marine-services', 'geothermal-coe']}
PHOTO['company'] = 'taqa-hero.webp'
PHOTO['pt-completions-coe'] = 'taqa-hero-2.jpg'  # the Aberdeen photo sent was the Stavanger team photo; placeholder until a real one
# the user's rule: areas with no photo of their own use the Well Completions photo
FALLBACK = {'segment': 'seg-well-completions.jpg', 'function': 'seg-well-completions.jpg', 'product': 'seg-well-completions.jpg', 'company': 'taqa-hero.webp'}
POS = {'pt-drilling-coe': '80% 20%'}  # keep the Cougar sign clear of the caption chip
def photo(k): return PHOTO.get(k) or FALLBACK[SEGS[k]['group']]
TODAY = dt.date(2026, 10, 7)
ICON = {'search': 'M10.5 4a6.5 6.5 0 0 1 5.2 10.4l4.4 4.4-1.4 1.4-4.4-4.4A6.5 6.5 0 1 1 10.5 4zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z',
        'arrow': 'M13 5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2l-4.6-4.6z', 'alert': 'M12 2 22 20H2zm-1 7v5h2V9zm0 7v2h2v-2z',
        'chat': 'M4 4h16v12H8l-4 4z', 'ok': 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z'}
def ic(n): return f'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="{ICON[n]}"/></svg>'
MK = {'sop': 'SOP', 'manual': 'WI', 'standard': 'ST', 'form': 'FRM', 'alert': 'ALT', 'lesson': 'LL', 'policy': 'POL'}
TINT = {'sop': ('#E5F4F2', '#00585A'), 'manual': ('#EAF0FB', '#2F5DA8'), 'standard': ('#F1EEF9', '#5B47A8'), 'form': ('#FFF4E5', '#A86200'),
        'alert': ('#FCECEE', '#C8102E'), 'lesson': ('#EEF6E9', '#3F7A2A'), 'policy': ('#F2F1EC', '#4A5553')}

CSS = open(os.path.join(REG_ROOT, 'css', 'nova.css')).read() if os.path.exists(os.path.join(REG_ROOT, 'css', 'nova.css')) else ''

def page_html(key):
    s = SEGS[key]; fam = s['group']; name = s['name']
    tag, desc = S.META.get(key, ('', ''))
    vis = [r for r in inforce('employee') if r['segment'] == key]
    alerts = [r for r in vis if r['docType'] == 'alert']
    last = max((r['issueDate'] for r in vis), default=None)
    days = (TODAY - dt.date.fromisoformat(last)).days if last else None
    lab = S.LABEL[fam if fam in S.LABEL else 'function']
    code = s['spl'] if key != 'company' else 'POL'
    num = f'TQ-{s["bu"]}-{s["spl"]}' if s.get('bu') else (f'TQ-{s["spl"]}' if key != 'company' else 'TQ-‹Function›-P')
    ph = photo(key)
    counts = [(k, sum(r['docType'] == k for r in vis)) for k in S.ORDER if k in lab]
    counts = [(k, c) for k, c in counts if c]
    # stat tiles
    tiles = f'<div class="stat t"><b>{len(vis)}</b><span>Documents in force</span></div>'
    tiles += f'<div class="stat{" al" if alerts else ""}"><b>{len(alerts) if alerts else "0"}</b><span>{"Active alert" + ("s" if len(alerts) != 1 else "") if alerts else "No active alerts"}</span></div>'
    for k, c in counts[:2]:
        tiles += f'<div class="stat"><b>{c}</b><span>{lab[k]}</span></div>'
    # alert or calm card
    if alerts:
        a = alerts[0]
        now = f'''<a class="alertc" href="#"><span class="ic">{ic("alert")}</span><span class="tx"><span class="m">TECHNICAL ALERT · {short(a["docNumber"])} · REV {a["revision"]}</span><b>{a["title"]}</b>
          <span class="d">Issued {d(a["issueDate"])}{f" · and {len(alerts) - 1} more" if len(alerts) > 1 else ""}</span></span><span class="go">{ic("arrow")}</span></a>'''
    else:
        now = f'<div class="calmc"><span class="ic">{ic("ok")}</span><b>No active alerts in {name}.</b></div>'
    # library cards
    cards = ''
    for k, c in counts:
        rs = sorted([r for r in vis if r['docType'] == k and not r.get('translationOf')], key=lambda r: r['issueDate'], reverse=True)[:3]
        bg, fg = TINT[k]
        items = ''.join(f'<li><span>{short(r["docNumber"])}</span>{r["title"]}</li>' for r in rs)
        href = 'area-sops.html' if key == 'coiled-tubing' and k == 'sop' else '#'
        cards += f'''<a class="lib" href="{href}"><span class="tg" style="background:{bg};color:{fg}">{MK[k]}</span><span class="n">{c}</span>
          <h3>{lab[k]}</h3><ul>{items}</ul><span class="go">All {c} <span>→</span></span></a>'''
    recent = sorted([r for r in vis if not r.get('translationOf')], key=lambda r: r['issueDate'], reverse=True)[:5]
    rows = ''.join(f'''<a class="doc" href="{"document.html" if r["docNumber"] == "TQ-TWS-CTSS-WI-003" else "#"}"><span class="t" style="background:{TINT[r["docType"]][0]};color:{TINT[r["docType"]][1]}">{MK[r["docType"]]}</span>
      <span class="n">{short(r["docNumber"])}</span><b>{r["title"]}</b><span class="m">Rev {r["revision"]} · {d(r["issueDate"])}</span>
      <span class="{"okp" if r["docType"] != "alert" else "alp"}">{"Current" if r["docType"] != "alert" else "Active alert"}</span></a>''' for r in recent)
    ex = S.EXPERT.get(key)
    ask_t = ex[0] if ex else ('All Segment Experts' if key != 'company' else 'QMS')
    ask_s = ex[1] if ex else (f'No named expert for {name} yet. Shared with all segment experts.' if key != 'company' else 'Questions about a company policy.')
    switch = ('<nav class="sw"><a class="on" href="#">Operations</a><a href="#">Maintenance</a></nav>' if fam == 'segment' else '')
    prov = (f'<p class="prov">Provisional area code · waiting on QHSE assignment</p>' if s.get('provisional') else '')
    contrib = (f'<p class="contrib">Contributors · {S.CONTRIB[key]}</p>' if key in S.CONTRIB else '')
    sub = f'{tag}{" · " + s["splName"] if s.get("splName") and s["splName"] != name and key != "company" else ""}'
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RISE · {name}</title><link rel="stylesheet" href="../../kit/fonts.css"><link rel="stylesheet" href="../css/nova.css"></head><body>
<header class="mx sg"><div class="bg" style="background-image:url(../img/tone/{ph})"></div>
<div class="w hn"><a href="bold-mix.html"><img src="../../kit/brand/rise-lockup-header.png" alt="RISE"></a><nav class="links"><a href="bold-mix.html">Home</a><a class="on" href="segments.html">Areas</a><a href="saved.html">Saved</a><a href="ask.html">Ask</a><a href="glossary.html">Glossary</a></nav>
<span class="sp"></span><a class="up" href="upload.html">Upload</a><span class="av">FA</span></div>
<div class="w sgh"><div class="sgl">
  <a class="crumbp" href="segments.html">← Areas <i>·</i> {S.FAMILY[fam]}</a>
  <h1>{name}</h1><p class="tagl">{sub}</p><p class="desc">{desc}</p>
  <div class="meta"><span class="code">{code}</span><span class="numl">{num}-…</span>{f'<span class="upd">Updated {days} days ago</span>' if days is not None else ''}</div>
  {switch}{prov}
</div>
<figure class="sgp"><img src="../img/tone/{ph}" alt="{name}"{f' style="object-position:{POS[key]}"' if key in POS else ""}><figcaption><span>{code}</span>{name}</figcaption></figure></div></header>
<main class="w">
<div class="mxstats"><div class="stats">{tiles}</div></div>
<section class="sec"><div class="sh"><div><h2>Important now</h2><p>{name} · {"Operations · " if fam == "segment" else ""}Tuesday 6 October</p></div></div>{now}{contrib}</section>
<section class="sec"><div class="sh"><div><h2>The library</h2><p>{len(vis)} documents in force, by type</p></div><a href="#">Search {name}</a></div><div class="libs">{cards}</div></section>
{f'<section class="sec"><div class="sh"><div><h2>Recently issued</h2><p>Newest first · in force</p></div><a href="#">View all</a></div><div class="list">{rows}</div></section>' if recent else ''}
<section class="band"><div><p class="k">A question about {name}?</p><h2>{ask_t}</h2><p class="s">{ask_s}</p></div><a href="ask.html">Ask an Expert</a></section>
</main><footer class="w foot"><span>RISE · TAQA knowledge</span><span>{name} · design exploration</span></footer>
<nav class="dockn"><a href="bold-mix.html">Home</a><a href="search.html">Search</a><a class="on" href="segments.html">Areas</a><a href="saved.html">Saved</a><a href="more.html">More</a></nav>
</body></html>'''

ALLK = S.ALLK
for k in ALLK:
    open(os.path.join(PAGES, f'seg-{k}.html'), 'w').write(page_html(k))
print('seg2', len(ALLK))
