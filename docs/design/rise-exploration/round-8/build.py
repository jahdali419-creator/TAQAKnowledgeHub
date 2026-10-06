"""Builds round-8/home.html (RISE Home, 1440 x 900) from the live register."""
import json, os, re, datetime as dt
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
SRC = open(os.path.join(ROOT, 'documents-master.js')).read()
REG = []
for line in SRC.splitlines():
    s = line.strip().rstrip(',')
    if s.startswith('{"docNumber'):
        REG.append(json.loads(s))
INF = [r for r in REG if r['status'] in ('current', 'under-review')]
N = {k: sum(r['docType'] == k for r in INF) for k in ('sop', 'manual', 'standard', 'alert', 'lesson')}
AREAS = len({r['segment'] for r in INF})
def segname(k):
    m = re.search(r'"%s":\s*\{[^{}]*?"name":\s*"([^"]+)"' % re.escape(k), SRC)
    return m.group(1) if m else k
def short(n):
    p = n.split('-'); return p[-2] + '-' + p[-1] if p[-2] in ('SOP', 'WI', 'LL', 'ALT') else p[-1]

LOCK = '<svg class="lk" viewBox="0 0 24 24" aria-label="Access restricted"><path fill="currentColor" d="M7 10V7a5 5 0 0 1 10 0v3h1.5v11h-13V10zm2 0h6V7a3 3 0 0 0-6 0z"/></svg>'
BELL = '<svg class="i" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a6 6 0 0 0-6 6v4l-2 3v1h16v-1l-2-3V9a6 6 0 0 0-6-6zm-2 16a2 2 0 0 0 4 0z"/></svg>'

CHG = [('16 May', 'LL-003', 'Lessons from coiled tubing fishing operation', 0, '4.0', 'cur', 'Current', ''),
       ('14 May', 'SOP-010', 'Fishing Operations SOP', 1, '3.0', 'cur', 'Current', ''),
       ('13 Apr', 'ALT-002', 'New pressure rating for 2-inch CT string', 1, '2.0', 'alt', 'Active alert', 'hot'),
       ('07 Feb', 'SOP-007', 'Nitrogen Injection SOP', 0, '1.0', 'cur', 'Current', ''),
       ('29 Jan', 'WI-008', 'Data Acquisition Manual', 1, '2.0', 'cur', 'Current', ''),
       ('10 Jan', 'SOP-011', 'Logging While CT SOP', 0, '3.0', 'cur', 'Current', '')]
rows = ''.join(f'<a href="#" class="{h}"><span class="d">{d}</span><span class="c">{c}</span><span class="t">{t}{LOCK if l else ""}</span>'
               f'<span class="a">Coiled Tubing</span><span class="r">Rev {r}</span><span class="st {s}">{w}</span></a>' for d, c, t, l, r, s, w, h in CHG)

ALR = [('13 Apr', 'ALT-002', 'New pressure rating for 2-inch CT string, effective immediately', 1, '2.0', 'alt', 'Active alert', 'hot'),
       ('06 Jun', 'ALT-003', 'Chemical compatibility update for H2S environments', 0, '2.0', 'due', 'Review due', '')]
alert_rows = ''.join(f'<a href="#" class="{h}"><span class="d">{d}</span><span class="c">{c}</span><span class="t">{t}{LOCK if l else ""}</span>'
               f'<span class="a">Coiled Tubing</span><span class="r">Rev {r}</span><span class="st {s}">{w}</span></a>' for d, c, t, l, r, s, w, h in ALR)
WI3 = [('TQ-TWS-CTSS-WI-003', 'Injector Head Operations Manual', 'Coiled Tubing · your area', 1),
       ('TQ-TWS-WS-WI-003', 'PCE Maintenance Manual', 'Wireline Services', 0),
       ('TQ-TWS-FS-WI-003', 'High-Pressure Iron Manual', 'Fracturing', 0),
       ('TQ-SS-WI-003', 'Toolstring Make-Up and Inspection', 'Slickline', 0),
       ('TQ-TWS-WIS-WI-003', 'BOP System Inspection Manual', 'Inspection', 0)]
wi3 = ''.join(f'<a href="#"{" class=mine" if m else ""}><span class="c">{n}</span><span class="t">{t}</span><span class="a">{a}</span></a>' for n, t, a, m in WI3)
recent = sorted(INF, key=lambda r: r['issueDate'], reverse=True)[:5]
tick = ''.join(f'<span class="it"><span class="ar">↘</span> {dt.date.fromisoformat(r["issueDate"]).strftime("%d %b")} '
               f'<b{" class=x" if r["docType"] == "alert" else ""}>{short(r["docNumber"])}</b> {r["title"]} · {segname(r["segment"])}</span>' for r in recent)

html = f'''<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RISE · Home</title>
<link rel="stylesheet" href="home.css">
</head>
<body>
<div class="wrap">
  <header class="nav">
    <a class="logo" href="home.html" aria-label="RISE home"><img src="../kit/brand/rise-lockup-header.png" alt="RISE" width="69" height="26"></a>
    <nav class="links" aria-label="Main">
      <a class="on" href="home.html" aria-current="page">Home</a><a href="#">Areas</a><a href="#">Saved</a><a href="#">Ask an Expert</a><a href="#">Field Glossary</a>
    </nav>
    <span class="sp"></span>
    <div class="tools">
      <a class="k" href="#">Search <kbd>⌘K</kbd></a>
      <a href="#">Upload</a>
      <span class="role">Employee</span>
      <a class="bell" href="#" aria-label="Notifications, 1 new">{BELL}<i></i></a>
      <a class="av" href="#" aria-label="Faisal Al-Ghamdi, account">FA</a>
      <a class="psearch" href="#search" aria-label="Search"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M10.5 4a6.5 6.5 0 0 1 5.2 10.4l4.4 4.4-1.4 1.4-4.4-4.4A6.5 6.5 0 1 1 10.5 4zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z"/></svg></a>
    </div>
  </header>
</div>
<main class="wrap grid">
  <section class="left" aria-labelledby="q">
    <p class="meta"><span>RISE <b>/</b> TAQA knowledge</span><span><b>{len(INF)}</b> in force · <b>{AREAS}</b> areas<span class="dkonly"> · register 06 Oct 2026</span></span></p>
    <p class="kick">Tuesday 6 October · <b>Coiled Tubing</b>, Operations</p>
    <label class="q" id="q"><span class="w">Search</span><span class="caret" aria-hidden="true"></span><span class="ph">by number or name</span></label>
    <p class="try">Try <a href="#">WI-003</a><a href="#">Coiled Tubing</a><a href="#">pressure test</a><a href="#">injector head</a><span class="enter">Press <kbd>↵</kbd> to search · <kbd>/</kbd> from anywhere</span></p>
    <nav class="scope" aria-label="Search in">
      <span class="lbl">In</span>
      <a class="on" href="#">Everything</a>
      <a href="#">Procedures <b>{N['sop']}</b></a>
      <a href="#">Work instructions <b>{N['manual']}</b></a>
      <a href="#">Standards <b>{N['standard']}</b></a>
      <a href="#">Technical alerts <b>{N['alert']}</b></a>
      <a href="#">Lessons <b>{N['lesson']}</b></a>
      <a href="#">Bulletins <b>—</b></a>
      <a href="#">Equipment</a>
      <a href="#">Areas <b>{AREAS}</b></a>
    </nav>

    <nav class="tabs" aria-label="Your knowledge">
      <a class="on" href="#changed" data-tab="changed">Changed in Coiled Tubing<sup>6</sup></a>
      <a href="#alerts" data-tab="alerts">Alerts<sup>2</sup><span class="al" aria-label="includes an active alert"></span></a>
      <a href="#">Saved<sup>3</sup></a>
      <a href="#">Recently opened<sup>3</sup></a>
      <a class="more" href="#">View all →</a>
    </nav>
    <div class="reg" data-panel="changed">{rows}</div>
    <div class="reg" data-panel="alerts" hidden>{alert_rows}</div>
  </section>

  <aside class="right" aria-label="Continue reading">
    <p class="lab"><span>Continue reading</span><span>4 revisions · 1 in force</span></p>
    <a class="stack" href="#" aria-label="WI-003 Injector Head Operations Manual, Revision 4.0, Current">
      <span class="pg p3"></span><span class="pg p2"></span><span class="pg p1"></span>
      <span class="pg p0">
        <span class="hd"><span>TQ-TWS-CTSS-WI-003</span><span>REV 4.0</span></span>
        <span class="typ">Manual · Coiled Tubing</span>
        <h2>Injector Head Operations Manual</h2>
        <span class="ctl">
          <span class="cell"><span class="k">Status</span><b class="ok">Current</b></span><span class="cell"><span class="k">Effective</span><b>30 Aug 2025</b></span>
          <span class="cell"><span class="k">Approved by</span><b>Segment Director</b></span><span class="cell"><span class="k">Next review</span><b>30 Aug 2028</b></span>
        </span>
        <span class="new"><span class="k">What changed in 4.0</span>Traction pressure limits for 2-inch string</span>
        <span class="note"><i></i><span>§5 Operating limits changed by ALT-002<span>New pressure rating for 2-inch CT string · 13 Apr 2026</span></span></span>
      </span>
    </a>
    <p class="also">Also open <a href="#"><span class="c">SOP-005</span>Pressure Testing Procedure</a></p>
    <div class="areas">
      <p class="lab" style="margin-bottom:14px"><span>Your areas</span></p>
      <a href="#"><b>Coiled Tubing</b><span>36 in force · home</span></a>
      <a href="#"><b>Well Intervention</b><span>64 · group, proposed</span></a>
      <a class="all" href="#"><b>All {AREAS} areas</b><span>→</span></a>
    </div>
    <p class="help">Stuck? <a href="#">Ask the Coiled Tubing expert</a> or look up a term in the <a href="#">Field Glossary</a>.</p>
  </aside>
</main>
<nav class="dock" aria-label="Main">
  <a class="on" href="home.html" aria-current="page"><svg viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z"/></svg>Home</a>
  <a href="#search"><svg viewBox="0 0 24 24"><path d="M10.5 4a6.5 6.5 0 0 1 5.2 10.4l4.4 4.4-1.4 1.4-4.4-4.4A6.5 6.5 0 1 1 10.5 4zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z"/></svg>Search</a>
  <a href="#"><svg viewBox="0 0 24 24"><path d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z"/></svg>Areas</a>
  <a href="#"><svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4.2L6 21z"/></svg>Saved</a>
  <a href="#menu"><svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>More</a>
</nav>
<div class="sheet-bg" data-sheet="menu" hidden></div>
<section class="sheet" data-sheet="menu" hidden aria-label="More">
  <span class="grab"></span>
  <p class="lab"><span>Faisal Al-Ghamdi</span><span>Employee</span></p>
  <a href="#">Ask an Expert<span>Coiled Tubing expert</span></a>
  <a href="#">Field Glossary<span>190+ terms</span></a>
  <a href="#">Upload a document<span>Filed for QMS check</span></a>
  <a href="#">Notifications<span class="n">1 new</span></a>
  <p class="lab note">Master List and QMS Workspace appear here for QMS roles</p>
</section>
<section class="srch" data-sheet="search" hidden aria-label="Search">
  <div class="sq"><span class="w">WI-003</span><span class="caret"></span><a class="x" href="#">Cancel</a></div>
  <p class="lab"><span>Document number</span><span>10 areas use WI-003</span></p>
  <div class="hits">{wi3}</div>
  <p class="more2">5 more WI-003 documents in other areas →</p>
  <p class="lab" style="margin-top:22px"><span>Press ↵ for full results</span></p>
</section>
<footer class="foot" aria-label="Recently published across TAQA"><div class="wrap"><span class="h">Across TAQA</span>{tick}</div></footer>
<script src="home.js"></script>
</body>
</html>'''
open(os.path.join(HERE, 'home.html'), 'w').write(html)
print('ok', len(INF), AREAS, N)
