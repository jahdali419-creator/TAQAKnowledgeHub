"""Builds round-6/halo: home.html, search.html, document.html. Run: python3 build.py"""
import math, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
SPRITE_SRC = os.path.join(HERE, '..', '..', 'round-5', 'n-taqa', 'home.html')

def sprite():
    h = open(SPRITE_SRC).read()
    i = h.index('<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"')
    j = h.index('</svg>', h.rindex('</symbol>')) + 6
    extra = '<symbol id="i-check" viewBox="0 0 24 24"><path fill="currentColor" d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z"/></symbol>'
    s = h[i:j]
    return s.replace('</svg>', extra + '</svg>', 1) if s.endswith('</svg>') and s.count('</svg>') == 1 else s[:-6] + extra + '</svg>'

def seismic(w=1440, h=760, n=30):
    """Seismic-section texture: stacked traces with a bright, folded reflector band."""
    out = []
    for k in range(n):
        y0 = 18 + k * (h / n)
        pts = []
        for x in range(-20, w + 40, 24):
            fold = 46 * math.exp(-((x - w * .72) / 330) ** 2) * math.sin(k / 3.2 + .6)
            wav = 7 * math.sin(x / 61 + k * .7) + 4 * math.sin(x / 23 + k * 1.9) * math.exp(-((x - w * .7) / 420) ** 2)
            pts.append(f'{x},{y0 + fold + wav:.1f}')
        out.append('<path d="M' + ' L'.join(pts) + '"/>')
    return f'<svg class="seis" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + ''.join(out) + '</svg>'

def seal(uid, code, rev, ring, elapsed=13, total=36, cls='', mini=False, label=''):
    """Trust seal: 36 month-ticks of the review cycle (lit = elapsed, orange = this month), identity on the rim."""
    ticks = []
    for i in range(total):
        a = math.radians(-90 + (i + .5) * 360 / total)
        r1, r2 = (150, 168) if not mini else (148, 176)
        x1, y1, x2, y2 = 200 + r1 * math.cos(a), 200 + r1 * math.sin(a), 200 + r2 * math.cos(a), 200 + r2 * math.sin(a)
        if i == elapsed:
            cx, cy = 200 + (r1 + r2) / 2 * math.cos(a), 200 + (r1 + r2) / 2 * math.sin(a)
            ticks.append(f'<circle class="now" style="--i:{i}" cx="{cx:.1f}" cy="{cy:.1f}" r="{7 if not mini else 11}"/>')
        else:
            ticks.append(f'<line class="tk{" lit" if i < elapsed else ""}" style="--i:{i}" x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}"/>')
    defs = f'''<defs><radialGradient id="discg" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#0E5D60"/><stop offset=".7" stop-color="#013A44"/><stop offset="1" stop-color="#012F37"/></radialGradient>
      <path id="rp-{uid}" d="M200,200 m0,-183 a183,183 0 1,1 0,366 a183,183 0 1,1 0,-366"/></defs>'''
    if mini:
        inner = f'''<circle class="disc" cx="200" cy="200" r="126" style="fill:#002B32;stroke:none"/>
      <text x="200" y="190" text-anchor="middle" class="rev" style="font-size:34px;fill:rgba(255,255,255,.7)">REV</text>
      <text x="200" y="262" text-anchor="middle" class="code" style="font-size:96px">{rev}</text>'''
        return f'<svg class="seal light {cls}" viewBox="0 0 400 400" role="img" aria-label="{label}">{defs}{"".join(ticks)}{inner}</svg>'
    inner = f'''<circle class="rim" cx="200" cy="200" r="198"/>
      <text class="ringtxt"><textPath href="#rp-{uid}" textLength="1140" lengthAdjust="spacing">{ring}</textPath></text>
      {"".join(ticks)}
      <circle class="disc" cx="200" cy="200" r="134"/>
      <text x="200" y="128" text-anchor="middle" class="rev">REV {rev}</text>
      <text x="200" y="214" text-anchor="middle" class="code">{code}</text>
      <rect x="140" y="236" width="120" height="34" rx="17" fill="rgba(127,230,218,.14)" stroke="rgba(127,230,218,.35)"/>
      <path d="M161 253.5l4.5 4.5 9-9" fill="none" stroke="#7FE6DA" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="212" y="259" text-anchor="middle" class="stt">Current</text>
      <text x="200" y="300" text-anchor="middle" class="cap">{elapsed} OF {total} MONTHS</text>'''
    return f'<svg class="seal {cls}" viewBox="0 0 400 400" role="img" aria-label="{label}">{defs}{inner}</svg>'

I = lambda n, c='i': f'<svg class="{c}"><use href="#{n}"/></svg>'
CUR = f'<span class="st cur">{I("s-cur")}Current</span>'
DUE = f'<span class="st due">{I("s-due")}Review due</span>'
ALT = f'<span class="st alt">{I("s-alert")}Active alert</span>'
LK = f'<span class="lk">{I("i-lock")}</span>'
LKR = f'<span class="lk">{I("i-lock")}Restricted</span>'
CH = '<svg class="is ch"><use href="#i-chev-r"/></svg>'

WI003_RING = 'TQ-TWS-CTSS-WI-003 · Injector Head Operations Manual · Coiled Tubing · Operations · '
WI003_LABEL = 'WI-003 Rev 4.0, Current. Review cycle: 13 of 36 months elapsed; next review 30 Aug 2028.'

def page(title, body_cls, body, dock):
    return f'''<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#002B32">
<title>{title}</title>
<link rel="stylesheet" href="halo.css">
<script>if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('mo')</script>
<script src="halo.js" defer></script>
</head>
<body class="{body_cls}">
<a class="skip" href="#main">Skip to content</a>
{sprite()}
{body}
{dock}
</body>
</html>'''

def bar(active, search_val=None):
    nav = ''.join(f'<a href="{h}"{" class=on aria-current=page" if k == active else ""}>{k}</a>'
                  for k, h in [('Home', 'home.html'), ('Areas', '#'), ('Search', 'search.html'), ('Saved', '#'), ('Ask', '#'), ('Glossary', '#'), ('Upload', '#')])
    pill = (f'<label class="pill on">{I("i-search","is")}<span class="val">{search_val}</span><span class="x" aria-label="Clear">{I("i-x","is")}</span></label>'
            if search_val else f'<a class="pill" href="search.html">{I("i-search","is")}<span class="phx">Search documents, codes, terms</span><kbd>/</kbd></a>')
    return f'''<header class="bar">
    <a class="logo" href="home.html" aria-label="RISE home"><img src="../../kit/brand/rise-icon.png" alt="RISE" width="30" height="34"></a>
    <a href="home.html" aria-label="RISE home"><img class="lock" src="../../kit/brand/rise-lockup-header-reverse.png" alt="RISE" width="91" height="34"></a>
    <nav class="nav" aria-label="Main">{nav}</nav>
    {pill}
    <span class="role"><i></i>Viewing as <b>Employee</b></span>
    <a class="bell" href="#" aria-label="Notifications, new">{I("i-bell")}<i></i></a>
    <a class="av" href="#" aria-label="Faisal Al-Ghamdi, account">FA<i class="ph"></i></a>
  </header>'''

def dock(active):
    items = [('Home', 'home.html', 'i-home'), ('Search', 'search.html', 'i-search'), ('Areas', '#', 'i-areas'), ('Saved', '#', 'i-saved'), ('Ask', '#', 'i-ask')]
    return '<nav class="dock" aria-label="Main">' + ''.join(
        f'<a href="{h}"{" class=on aria-current=page" if k == active else ""}>{I(ic)}{k}</a>' for k, h, ic in items) + '</nav>'

# ───────────────── HOME ─────────────────
SHELVES = [('SOPs', 15, '#00585A'), ('Manuals', 8, '#008675'), ('Standards', 5, '#00BFB2'), ('Lessons learned', 4, '#66D8D6'), ('Forms &amp; checklists', 2, '#99AFAF'), ('Alerts', 2, '#C8102E')]
bar6 = ''.join(f'<i style="flex:{n};background:{c};--i:{k}" title="{t}: {n}"></i>' for k, (t, n, c) in enumerate(SHELVES))
lg = ''.join(f'<a href="#"><i style="background:{c}"></i><span>{t}</span><b class="tn">{n}</b></a>' for t, n, c in SHELVES)
CHANGES = [('16', 'May', 'Lessons from coiled tubing fishing operation', 'LL-003', 'Rev 4.0', '', ''),
           ('14', 'May', 'Fishing Operations SOP', 'SOP-010', 'Rev 3.0', LKR, ''),
           ('13', 'Apr', 'New pressure rating for 2-inch CT string', 'ALT-002', 'Rev 2.0', ALT, 'hot'),
           ('07', 'Feb', 'Nitrogen Injection SOP', 'SOP-007', 'Rev 1.0', '', ''),
           ('29', 'Jan', 'Data Acquisition Manual', 'WI-008', 'Rev 2.0', LKR, ''),
           ('10', 'Jan', 'Logging While CT SOP', 'SOP-011', 'Rev 3.0', '', '')]
chg = ''.join(f'<a href="#" class="{h}"><span class="d"><b class="tn">{d}</b><span>{m}</span></span><span><span class="t">{t}</span><span class="m"><span class="cd">{c}</span><span>{r}</span>{x}</span></span></a>' for d, m, t, c, r, x, h in CHANGES)
SAVED = [('WI', 'WI-003', 'Injector Head Operations Manual', CUR + '<span>Rev 4.0</span>', 'document.html'),
         ('F', 'F001', 'Pre-Job Safety Checklist', CUR + '<span>Rev 4.0</span>', '#'),
         ('SOP', 'SOP-009', 'Acid Stimulation SOP', CUR + '<span>Rev 3.0</span><span class="ar">AR</span>', '#')]
saved = ''.join(f'<a class="card" href="{h}"><span class="k">{k}</span><span class="c">{c}</span><span class="t">{t}</span><span class="m">{m}</span></a>' for k, c, t, m, h in SAVED)

home_body = f'''<div class="hero">
  {seismic()}
  <div class="wrap">
  {bar('Home')}
  <div class="hh" id="main">
    <div>
      <p class="kick rz" style="--d:0">Tuesday 6 October · <b>Coiled Tubing</b> · Operations</p>
      <h1 class="mega rz" style="--d:1"><span>One change</span><span>touches <em>your</em> work.</span></h1>
      <a class="safety rz" style="--d:3" href="document.html">
        <span class="lab">{I("s-alert")}Active alert · effective immediately<span>ALT-002</span></span>
        <span class="t" style="display:block">New pressure rating for 2-inch CT string</span>
        <span class="d" style="display:block">Changes <span class="chip5">WI-003 §5</span> <b>Operating limits</b>, in the manual you opened last.</span>
        <span class="f"><span>{I("i-lock","is")} Confidential · request access through QMS</span><span class="go">Review §5{I("i-arrow-r","is")}</span></span>
      </a>
      <div class="pulse rz" style="--d:4">
        <div><b class="tn" data-n="36">36</b><span>In force</span></div>
        <div><b class="tn o" data-n="2">2</b><span>Active alerts</span></div>
        <div><b class="tn" data-n="45">45</b><span>In the register</span></div>
      </div>
    </div>
    <a class="hseal dk rz" style="--d:2" href="document.html" aria-label="Continue reading WI-003">
      {seal('h', 'WI-003', '4.0', WI003_RING, label=WI003_LABEL)}
      <span class="tag">Continue reading · <b>WI-003</b></span>
    </a>
  </div>
  </div>
</div>
<main class="sheet">
  <div class="wrap hg">
    <div>
      <section class="sec ph" aria-labelledby="c1">
        <div class="sh"><h2 id="c1">Continue reading</h2></div>
        <a class="card cont" href="document.html">
          {seal('m1', '', '4.0', '', mini=True, label=WI003_LABEL)}
          <span><span class="c">WI-003<small>REV 4.0</small></span><span class="t" style="display:block">Injector Head Operations Manual</span><span class="w">{I("s-alert")}§5 limits changed by ALT-002</span></span>
        </a>
      </section>
      <section class="sec" aria-labelledby="c2">
        <div class="sh"><h2 id="c2">Coiled Tubing, by shelf</h2><a class="more" href="#">Open area</a></div>
        <div class="card comp">
          <div class="bar6" role="img" aria-label="36 in force: 15 SOPs, 8 manuals, 5 standards, 4 lessons learned, 2 forms and checklists, 2 alerts">{bar6}</div>
          <div class="lg">{lg}</div>
          <p class="cap"><b>36</b> in force on the Operations side · 1 awaiting approval</p>
        </div>
      </section>
    </div>
    <div>
      <section class="sec" aria-labelledby="c3">
        <div class="sh"><h2 id="c3">Changed in 2026</h2><span class="n">6</span></div>
        <div class="card chg">{chg}</div>
      </section>
      <section class="sec" aria-labelledby="c4">
        <div class="sh"><h2 id="c4">Elsewhere in TAQA</h2><span class="n">1</span></div>
        <div class="card list"><a href="#"><span class="k">S<b>002</b></span><span><span class="t">High Pressure Operations Standard</span><span class="m"><span>Fracturing</span><span>Rev 2.0 · 18 Aug 2026</span>{LK}</span></span>{CH}</a></div>
      </section>
    </div>
    <div>
      <section class="sec" aria-labelledby="c5">
        <div class="sh"><h2 id="c5">Saved</h2><span class="n">3</span></div>
        <div class="rail">{saved}</div>
      </section>
      <section class="sec" aria-labelledby="c6">
        <div class="sh"><h2 id="c6">Tools</h2></div>
        <div class="tools">
          <a class="card" href="#"><span class="ic">{I("i-ask")}</span><span>Ask an Expert<small>Coiled Tubing expert</small></span></a>
          <a class="card" href="#"><span class="ic">{I("i-glossary")}</span><span>Field Glossary<small>190+ terms</small></span></a>
          <a class="card" href="#"><span class="ic">{I("i-upload")}</span><span>Upload<small>Filed for QMS check</small></span></a>
        </div>
      </section>
    </div>
  </div>
</main>'''
open(os.path.join(HERE, 'home.html'), 'w').write(page('RISE · Home', 'pg-home', home_body, dock('Home')))

# ───────────────── SEARCH ─────────────────
def row(k, n, t, meta, sel=False):
    return f'<a href="#"{" class=sel" if sel else ""}><span class="k">{k}<b>{n}</b></span><span><span class="t">{t}</span><span class="m">{meta}</span></span>{CH}</a>'
R = lambda r: f'<span>Rev {r}</span>'
GROUPS = [
 ('Procedures', [('SOP', '003', 'Iron Pressure Test', CUR + R('4.0') + '<span>Fracturing</span><span class="ar">AR</span>', True),
                 ('SOP', '005', 'Pressure Test SOP', CUR + R('1.0') + '<span>Cementing</span>', False),
                 ('SOP', '004', 'Pressure Test Inspection SOP', CUR + R('3.0') + '<span>Inspection</span>' + LK, False),
                 ('SOP', '004', 'Pressure Buildup Test SOP', DUE + R('3.0') + '<span>Well Testing</span>', False),
                 ('SOP', '007', 'Pressure Control Equipment Check', DUE + R('2.0') + '<span>Wireline Services</span>' + LK, False)]),
 ('Work instructions &amp; manuals', [('WI', '004', 'Pressure Gauge Calibration Manual', CUR + R('3.0') + '<span>Well Testing</span>', False),
                 ('WI', '003', 'High-Pressure Iron Manual', CUR + R('1.0') + '<span>Fracturing</span>', False),
                 ('WI', '006', 'BOP Testing Manual', CUR + R('1.0') + '<span>Drilling Services</span>' + LK, False)]),
 ('Standards', [('S', '002', 'BOP Testing Standard', CUR + R('2.0') + '<span>Safety Services</span>', False),
                ('S', '002', 'High Pressure Operations Standard', CUR + R('2.0') + '<span>Fracturing</span>' + LK, False),
                ('S', '003', 'Pressure Control Standard', CUR + R('2.0') + '<span>Wireline Services</span>' + LK, False)]),
 ('Lessons learned', [('LL', '005', 'Pressure integrity test failure, field findings', DUE + R('4.0') + '<span>Coiled Tubing</span>', False),
                ('LL', '005', 'Wellhead pressure anomaly, identification and mitigation', CUR + R('4.0') + '<span>Fracturing</span>', False),
                ('LL', '004', 'Float collar failure, pre-job testing enhancement', CUR + R('4.0') + '<span>Cementing</span>', False)]),
 ('Technical alerts', [('ALT', '002', 'New pressure rating for 2-inch CT string, effective immediately', ALT + R('2.0') + '<span>Coiled Tubing</span>' + LK, False),
                ('ALT', '002', 'Separator pressure rating update, verify all units before deployment', ALT + R('4.0') + '<span>Well Testing</span>' + LK, False)]),
]
groups = ''.join(f'<section class="grp"><h3>{g}<span>{len(rs)}</span></h3><div class="card list">{"".join(row(*r) for r in rs)}</div></section>' for g, rs in GROUPS)
chips = ''.join(f'<a href="#"{" class=on" if i == 0 else ""}>{t} <i>{n}</i></a>' for i, (t, n) in enumerate([('All', 17), ('SOPs', 6), ('Manuals', 3), ('Standards', 3), ('Lessons', 3), ('Alerts', 2)]))
search_body = f'''<div class="hero shero">
  {seismic()}
  <div class="wrap">
  {bar('Search', 'pressure test')}
  <div class="sh2" id="main">
    <p class="res rz" style="--d:0"><b class="tn" data-n="17">17</b><span>documents in force<br>match <em>“pressure test”</em></span></p>
    <nav class="chips rz" style="--d:1" aria-label="Document type">{chips}</nav>
  </div>
  </div>
</div>
<main class="sheet">
  <div class="wrap sg">
    <div>
      <section class="sec" style="margin-top:18px">
        <div class="card hit">
          <p class="y"><i></i>Your area first<em>Coiled Tubing</em></p>
          <p class="r1"><span class="c">SOP-005</span><span class="revp">Rev 2.0</span>{CUR}</p>
          <p class="t">Pressure Testing Procedure</p>
          <p class="m"><span>Issued 12 Jun 2025</span>{LKR}<span class="ar">AR</span></p>
        </div>
      </section>
      {groups}
      <div class="fn">
        <p>{I("s-sup","is")}2 documents not in force are hidden</p>
        <p>{I("i-lock","is")}Locked items: request access through QMS</p>
      </div>
    </div>
    <aside class="card prev" aria-label="Selected document">
      <p class="pre"><span>TQ-TWS-FS</span><b>Procedure (SOP)</b><b>Fracturing</b></p>
      <div class="id"><span class="c">SOP-003</span><span class="revb"><small>REV</small><b>4.0</b></span></div>
      <h2>Iron Pressure Test</h2>
      <div class="sig"><span class="tile">{I("s-cur")}</span><span><b>Current</b><span>Issued 14 Apr 2025 · in force</span></span><a class="op" href="#">{I("i-arrow-r","is")}Open</a></div>
      <dl><dt>Number</dt><dd>TQ-TWS-FS-SOP-003</dd><dt>Access</dt><dd>Internal</dd><dt>Language</dt><dd>English · Arabic version available</dd></dl>
      <p class="why">Title contains <b>pressure</b> and <b>test</b>.</p>
    </aside>
  </div>
</main>'''
open(os.path.join(HERE, 'search.html'), 'w').write(page('RISE · Search · pressure test', 'pg-search', search_body, dock('Search')))

# ───────────────── DOCUMENT ─────────────────
TOC = [('1', 'Scope'), ('2', 'Injector head components'), ('3', 'Pre-job inspection'), ('4', 'Chain tension and traction pressure'),
       ('5', 'Operating limits (2-inch string)'), ('6', 'Chain slip response'), ('7', 'Shutdown and isolation'), ('A', 'Inspection record (F001)')]
toc = ''.join(f'<li class="f" id="s5"><span class="n">{n}</span><span class="x">{t}</span><span class="fl">{I("s-alert")}ALT-002</span></li>' if n == '5'
              else f'<li><span class="n">{n}</span><span class="x">{t}</span><span></span></li>' for n, t in TOC)
doc_body = f'''<div class="hero">
  {seismic(700, 1000, 34)}
  <header class="dbar">
    <a href="home.html" class="dk" aria-label="RISE home"><img class="lock" src="../../kit/brand/rise-lockup-header-reverse.png" alt="RISE" width="80" height="30"></a>
    <a class="back" href="#">{I("i-chev-l","is")}Manuals <span>· Coiled Tubing</span></a>
    <span class="sp"></span>
    <a class="ib ph" href="#" aria-label="Share">{I("i-share","is")}</a>
    <a class="ib" href="#" aria-label="More: quick reference card, pin offline, print">{I("i-more","is")}</a>
  </header>
  <div class="dhero" id="main">
    <div class="rz" style="--d:0">{seal('d', 'WI-003', '4.0', WI003_RING, label=WI003_LABEL)}</div>
    <p class="type rz" style="--d:1">Manual · Coiled Tubing · Operations</p>
    <h1 class="rz" style="--d:2">Injector Head Operations Manual</h1>
    <p class="sigl rz" style="--d:3"><span>{I("i-check","is")}<b>Current.</b> Approved 28 Aug 2025 by Segment Director, Coiled Tubing</span></p>
    <div class="trust rz" style="--d:4">
      <div><span>Effective</span><b>30 Aug 2025</b></div>
      <div><span>Next review</span><b>30 Aug 2028</b><small>in 23 months</small></div>
      <div><span>Access</span><b>Internal</b><small>English</small></div>
    </div>
    <div class="dacts dk rz" style="--d:5">
      <a class="pri" href="#">{I("i-download","is")}Download PDF</a>
      <a class="on" href="#" aria-label="Saved">{I("i-saved-f","is")}</a>
      <a href="#" aria-label="Share">{I("i-share","is")}</a>
    </div>
  </div>
</div>
<main class="sheet">
  <div class="dgrid">
    <div>
      <a class="safety" href="#s5">
        <span class="lab">{I("s-alert")}Active alert · 13 Apr 2026<span>ALT-002</span></span>
        <span class="t" style="display:block">New pressure rating for 2-inch CT string</span>
        <span class="d" style="display:block">Changes the limits in <span class="chip5">§5</span> <b>Operating limits</b>. Read §5 with the alert.</span>
        <span class="f"><span>{I("i-lock","is")} Confidential · request access through QMS</span><span class="go">Go to §5{I("i-arrow-r","is")}</span></span>
      </a>
      <div class="seg sec" role="tablist" aria-label="Sections"><span class="on">Overview</span><span>Contents</span><span>History</span><span>Related</span></div>
      <section class="sec" aria-labelledby="d1">
        <div class="sh"><h2 id="d1">What it covers</h2></div>
        <p class="sum">How to rig up, operate, monitor and shut down the CT injector head safely: chain tension, gripper block inspection, traction pressure limits, and what to do on a chain slip.</p>
        <div class="new4"><span><b>New in Rev 4.0</b><span>Traction pressure limits for 2-inch string</span></span></div>
      </section>
      <section class="sec" aria-labelledby="d2">
        <div class="sh"><h2 id="d2">Contents</h2><span class="n">8</span></div>
        <ol class="card toc">{toc}</ol>
      </section>
      <section class="sec" aria-labelledby="d3">
        <div class="sh"><h2 id="d3">Related</h2><span class="n">4</span></div>
        <div class="card rel">
          <a href="#"><span class="k">ALT<b>002</b></span><span><span class="t">New pressure rating for 2-inch CT string</span><span class="m"><span class="st alt">{I("s-alert")}Changes §5</span>{LK}</span></span>{CH}</a>
          <a href="#"><span class="k">F<b>001</b></span><span><span class="t">Pre-Job Safety Checklist</span><span class="m"><span>Appendix A</span><span>Rev 4.0</span></span></span>{CH}</a>
          <a href="#"><span class="k">WI<b>005</b></span><span><span class="t">CT String Inspection Manual</span><span class="m"><span>Rev 3.0</span></span></span>{CH}</a>
          <a href="#"><span class="k">SOP<b>006</b></span><span><span class="t">CT Unit Rig-Up &amp; Rig-Down</span><span class="m">{DUE}{LK}</span></span>{CH}</a>
        </div>
      </section>
    </div>
    <div>
      <section class="sec" aria-labelledby="d4" style="margin-top:0">
        <div class="sh"><h2 id="d4">How Rev 4.0 was approved</h2></div>
        <ol class="card trail">
          <li><span class="d">19 Aug</span><span class="w"><b>Filed</b><span>Khalid Al-Otaibi, CT Engineer</span></span></li>
          <li><span class="d">24 Aug</span><span class="w"><b>QMS check</b><span>QMS Document Control</span></span></li>
          <li><span class="d">28 Aug</span><span class="w"><b>Final approval</b><span>Segment Director, Coiled Tubing</span></span></li>
          <li class="cur"><span class="d">30 Aug</span><span class="w"><b>Current</b><span>Rev 4.0 in force · 2025</span></span></li>
        </ol>
      </section>
      <section class="sec" aria-labelledby="d5">
        <div class="sh"><h2 id="d5">Earlier revisions</h2><span class="n">3</span></div>
        <div class="card rel">
          <a href="#"><span class="k">REV<b>3.0</b></span><span><span class="t">Superseded</span><span class="m"><span>11 Mar 2024</span></span></span>{CH}</a>
          <a href="#"><span class="k">REV<b>2.0</b></span><span><span class="t">Superseded</span><span class="m"><span>02 Feb 2023</span></span></span>{CH}</a>
          <a href="#"><span class="k">REV<b>1.0</b></span><span><span class="t">Superseded</span><span class="m"><span>14 Jan 2022 · current revision file only</span></span></span>{CH}</a>
        </div>
      </section>
      <section class="sec" aria-label="Ask an expert">
        <div class="card ask">
          <div class="who"><span class="ic">{I("i-person")}</span><span><b>Coiled Tubing expert</b><small>Answers by role, routed by area</small></span></div>
          <q>Chain slip on the injector at 4,200 ft — can we continue at reduced traction pressure?</q>
          <a class="btn" href="#">{I("i-ask","is")}Ask an Expert</a>
        </div>
      </section>
    </div>
  </div>
</main>'''
doc_dock = f'''<nav class="dock acts" aria-label="Document actions">
  <a class="pri" href="#">{I("i-download","is")}Open PDF</a>
  <a class="on" href="#" aria-label="Saved">{I("i-saved-f")}</a>
  <a href="#" aria-label="Share">{I("i-share")}</a>
  <a href="#" aria-label="More">{I("i-more")}</a>
</nav>'''
open(os.path.join(HERE, 'document.html'), 'w').write(page('RISE · WI-003 Injector Head Operations Manual', 'pg-doc', doc_body, doc_dock))
print('ok')
