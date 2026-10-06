"""Builds round-7/rise: home, search, area, document (+ QMS nav variant). Data: real register (documents-master.js)."""
import json, os, datetime as dt, collections
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..', '..'))
SPRITE_SRC = os.path.join(HERE, '..', '..', 'round-5', 'n-taqa', 'home.html')

# ── register ──
REG = []
for line in open(os.path.join(ROOT, 'documents-master.js')):
    line = line.strip().rstrip(',')
    if line.startswith('{"docNumber'):
        try: REG.append(json.loads(line))
        except ValueError: pass
WI_SEGS = {'coiled-tubing': 'Coiled Tubing', 'wireline': 'Wireline Services', 'pt-intervention-coe': 'Well Intervention CoE', 'slickline': 'Slickline'}
inforce = lambda r: r['status'] in ('current', 'under-review')
WI = [r for r in REG if r['segment'] in WI_SEGS and inforce(r) and not r.get('translationOf')]
WI_AR = [r for r in REG if r['segment'] in WI_SEGS and inforce(r) and r.get('translationOf')]
fmt = lambda s: dt.date.fromisoformat(s).strftime('%d %b %Y')
short = lambda n: '-'.join(n.split('-')[-2:]) if n.split('-')[-1].isdigit() or len(n.split('-')[-1]) > 3 else n.split('-')[-1]
def short(n):
    p = n.split('-')
    return p[-2] + '-' + p[-1] if p[-2] in ('SOP', 'WI', 'LL', 'ALT') else p[-1]

def sprite():
    h = open(SPRITE_SRC).read()
    i = h.index('<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"')
    j = h.index('</svg>', h.rindex('</symbol>')) + 6
    extra = ('<symbol id="i-check" viewBox="0 0 24 24"><path fill="currentColor" d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z"/></symbol>'
             '<symbol id="i-panel" viewBox="0 0 24 24"><path fill="currentColor" opacity=".32" d="M4 5h5v14H4z"/><path fill="currentColor" d="M3 4h18v16H3zm2 2v12h14V6z"/></symbol>'
             '<symbol id="i-list" viewBox="0 0 24 24"><path fill="currentColor" d="M4 5h3v3H4zm5 0h11v3H9zM4 10.5h3v3H4zm5 0h11v3H9zM4 16h3v3H4zm5 0h11v3H9z"/></symbol>'
             '<symbol id="i-shield" viewBox="0 0 24 24"><path fill="currentColor" opacity=".32" d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5z"/><path fill="currentColor" d="m10.6 15.6-3.3-3.3 1.4-1.4 1.9 1.9 4.7-4.7 1.4 1.4z"/></symbol>'
             '<symbol id="i-caret" viewBox="0 0 24 24"><path fill="currentColor" d="m7 10 5 5 5-5z"/></symbol>')
    return h[i:j - 6] + extra + '</svg>'
SPR = sprite()
I = lambda n, c='i': f'<svg class="{c}"><use href="#{n}"/></svg>'
ST = {'cur': f'<span class="st cur">{I("s-cur")}Current</span>', 'due': f'<span class="st due">{I("s-due")}Review due</span>',
      'alt': f'<span class="st alt">{I("s-alert")}Active alert</span>', 'sup': f'<span class="st sup">{I("s-sup")}Superseded</span>'}
LOCK = f'<span class="lk">{I("i-lock")}</span>'
def access(c, word=True):
    return '' if not c or c in ('internal', 'Internal') else (f'<span class="lk">{I("i-lock")}{c.capitalize()}</span>' if word else LOCK)
CH = I('i-chev-r')

# ── shell ──
def side(active, role='employee'):
    nav = [('home', 'Home', 'home.html', 'i-home', ''), ('saved', 'Saved', '#', 'i-saved', '<span class="ct">3</span>'),
           ('ask', 'Ask an Expert', '#', 'i-ask', ''), ('glossary', 'Field Glossary', '#', 'i-glossary', '')]
    items = ''.join(f'<a href="{h}"{" class=on aria-current=page" if k == active else ""}>{I(ic)}{t}{x}</a>' for k, t, h, ic, x in nav)
    areas = (f'<a href="#"{" class=on" if active == "ct" else ""}><span class="ar-i" style="background:#013F4E">C</span>Coiled Tubing<span class="home">Your area</span></a>'
             f'<a href="area.html"{" class=on aria-current=page" if active == "wi" else ""}><span class="ar-i" style="background:#00585A">W</span>Well Intervention<span class="home">Group</span></a>'
             f'<a href="#">{I("i-areas")}All areas<span class="ct">25</span></a>')
    if role == 'qms':
        tools = (f'<p class="sl">Document control</p><div class="nv"><a href="#">{I("i-list")}Master List</a>'
                 f'<a href="#">{I("i-shield")}QMS Workspace<span class="ct">4</span></a><a href="#">{I("i-upload")}Upload</a></div>')
        who = '<div class="who"><span class="av">QD</span><span><b>QMS Document Control</b><span>QMS role</span></span></div>'
    else:
        tools = f'<div class="nv" style="margin-top:14px"><a href="#">{I("i-upload")}Upload a document</a></div>'
        who = '<div class="who"><span class="av">FA</span><span><b>Faisal Al-Ghamdi</b><span>Field Supervisor · Employee</span></span></div>'
    return f'''<aside class="side" aria-label="Main navigation">
  <div class="brand"><a href="home.html"><img src="../../kit/brand/rise-lockup-header.png" alt="RISE" width="64" height="24"></a><button class="tg" aria-label="Collapse sidebar">{I("i-panel")}</button></div>
  <a class="find" href="search.html">{I("i-search")}<span>Search RISE</span><kbd>⌘</kbd><kbd>K</kbd></a>
  <nav class="nv">{items}</nav>
  <p class="sl">Areas</p>
  <div class="nv">{areas}</div>
  <span class="grow"></span>
  {tools}
  {who}
</aside>'''

def top(crumbs, right=''):
    c = ' <i>/</i> '.join(f'<b>{x}</b>' if k == len(crumbs) - 1 else x for k, x in enumerate(crumbs))
    return f'''<header class="top"><nav class="crumb" aria-label="Breadcrumb">{c}</nav><span class="sp"></span>{right}
  <a class="tb" href="#" aria-label="Notifications, 1 new">{I("i-bell")}<span class="bdot"></span></a></header>'''

def page(title, active, crumbs, body, right='', role='employee', scroll=True):
    inner = f'<div class="scroll"><div class="page">{body}</div></div>' if scroll else body
    return f'''<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<link rel="stylesheet" href="rise.css">
</head>
<body>
{SPR}
<div class="app">
{side(active, role)}
<div class="main">
{top(crumbs, right)}
{inner}
</div>
</div>
</body>
</html>'''

def w(name, html):
    open(os.path.join(HERE, name), 'w').write(html); print('wrote', name)

# ═════════ HOME ═════════
CHG = [('16 May', 'LL-003', 'Lessons from coiled tubing fishing operation', '', '4.0', 'cur'),
       ('14 May', 'SOP-010', 'Fishing Operations SOP', 'restricted', '3.0', 'cur'),
       ('13 Apr', 'ALT-002', 'New pressure rating for 2-inch CT string', 'confidential', '2.0', 'alt'),
       ('07 Feb', 'SOP-007', 'Nitrogen Injection SOP', '', '1.0', 'cur'),
       ('29 Jan', 'WI-008', 'Data Acquisition Manual', 'restricted', '2.0', 'cur'),
       ('10 Jan', 'SOP-011', 'Logging While CT SOP', '', '3.0', 'cur')]
chg = ''.join(f'<a class="row r-chg" href="#"><span class="d">{d}</span><span class="code">{c}</span><span class="t">{t}</span><span>{access(a, False)}</span><span class="rev">Rev {r}</span><span>{ST[s]}</span></a>' for d, c, t, a, r, s in CHG)
CONT = [('WI-003', 'Injector Head Operations Manual', '4.0', 'cur', '', 'document.html'),
        ('SOP-005', 'Pressure Testing Procedure', '2.0', 'cur', LOCK, '#'),
        ('ALT-002', 'New pressure rating for 2-inch CT string', '2.0', 'alt', LOCK, '#')]
cont = ''.join(f'<a class="row r-doc" href="{h}"><span class="code">{c}</span><span class="t">{t}</span><span>{l}</span><span class="rev">Rev {r}</span><span>{ST[s]}</span>{CH}</a>' for c, t, r, s, l, h in CONT)
DIR = [('Drilling Services', 68), ('Safety Services', 66), ('Fracturing', 59), ('Coiled Tubing', 45), ('Inspection', 45), ('Cementing', 36),
       ('Well Testing', 32), ('Wireline Services', 29), ('Slickline', 3), ('Well Completions', 3), ('Marine Services', 3)]
dirl = ''.join(f'<a href="#"{" class=me" if n == "Coiled Tubing" else ""}>{n}<span class="tn">{c}</span></a>' for n, c in DIR) + '<a href="#">Corporate functions<span>10 areas</span></a>'
SHELF = [('SOPs', 15, '#013F4E'), ('Manuals', 8, '#00585A'), ('Standards', 5, '#2E8B85'), ('Lessons learned', 4, '#7FC4BE'), ('Forms &amp; checklists', 2, '#B9D9D6'), ('Alerts', 2, '#C8102E')]
bar = ''.join(f'<i style="flex:{n};background:{c}"></i>' for _, n, c in SHELF)
shelf = ''.join(f'<dt>{t}</dt><dd class="num tn">{n}</dd>' for t, n, _ in SHELF)
home = f'''<div class="cols">
<div>
  <p class="kick">Search 520 documents in force across 25 areas</p>
  <label class="q" style="margin-top:10px">{I("i-search")}<span class="ph">Document title, number or Field Glossary term</span><kbd>⌘</kbd><kbd>K</kbd></label>
  <p class="qh"><span>Recent</span><a href="search.html">pressure test</a><a href="document.html">WI-003</a><a href="#">BOP</a><span class="sep">|</span><span>Coiled Tubing results appear first</span></p>

  <div class="alert" style="margin-top:28px">{I("s-alert")}<div><b>ALT-002 changes the limits in WI-003 <span class="chip">§5 Operating limits</span></b><span>New pressure rating for 2-inch CT string · active alert, effective immediately · 13 Apr 2026 · Confidential, request access through QMS</span></div><a class="go" href="document.html">Review §5{I("i-arrow-r")}</a></div>

  <div class="sh"><h2>Changed recently in Coiled Tubing</h2><span class="n">2026</span><a class="more" href="#">View all</a></div>
  <div class="rows">{chg}</div>

  <div class="sh"><h2>Continue reading</h2><a class="more" href="#">History</a></div>
  <div class="rows">{cont}</div>

  <div class="sh"><h2>Browse areas</h2><span class="n">Operational segments</span><a class="more" href="#">All 25 areas</a></div>
  <div class="dir">{dirl}</div>
</div>
<aside class="rail">
  <section class="rs areacard">
    <h3>Your area</h3>
    <a class="nm" href="#" style="margin-top:14px"><span class="ar-i" style="background:#013F4E;width:28px;height:28px;border-radius:7px;font-size:12px">C</span><span><b>Coiled Tubing</b><small>Operations · 36 in force</small></span></a>
    <div class="bar" role="img" aria-label="15 SOPs, 8 manuals, 5 standards, 4 lessons learned, 2 forms and checklists, 2 alerts">{bar}</div>
    <dl class="props cnt">{shelf}</dl>
  </section>
  <section class="rs"><h3>Saved <span class="n">3</span><a href="#">All</a></h3>
    <a class="mini-row" href="document.html"><span class="code">WI-003</span><span><span class="t">Injector Head Operations Manual</span><span class="m">Rev 4.0 · Current</span></span></a>
    <a class="mini-row" href="#"><span class="code">F001</span><span><span class="t">Pre-Job Safety Checklist</span><span class="m">Rev 4.0 · Current</span></span></a>
    <a class="mini-row" href="#"><span class="code">SOP-009</span><span><span class="t">Acid Stimulation SOP</span><span class="m">Rev 3.0 · Current · Arabic</span></span></a>
  </section>
  <section class="rs"><h3>Elsewhere in TAQA</h3>
    <a class="mini-row" href="#"><span class="code">S002</span><span><span class="t">High Pressure Operations Standard</span><span class="m">Fracturing · Rev 2.0 · 18 Aug 2026 · Restricted</span></span></a>
  </section>
  <section class="rs"><h3>Get help</h3>
    <div style="padding-top:6px"><a class="link" href="#">{I("i-ask")}Ask an Expert<span class="c">Coiled Tubing expert</span></a><a class="link" href="#">{I("i-glossary")}Field Glossary<span class="c">190+ terms</span></a></div>
  </section>
</aside>
</div>'''
w('home.html', page('RISE · Home', 'home', ['Home'], home))

# ═════════ SEARCH ═════════
def rrow(code, title, area, rev, st, acc, sel=False):
    return f'<a class="row r-res{" sel" if sel else ""}" href="#"><span class="code">{code}</span><span class="t">{title}</span><span class="a">{area}</span><span class="rev">{rev}</span><span>{ST[st]}</span><span>{LOCK if acc else ""}</span></a>'
GR = [('Coiled Tubing', True, [('SOP-005', 'Pressure Testing Procedure', 'Coiled Tubing', '2.0', 'cur', 1), ('LL-005', 'Pressure integrity test failure, field findings', 'Coiled Tubing', '4.0', 'due', 0), ('ALT-002', 'New pressure rating for 2-inch CT string, effective immediately', 'Coiled Tubing', '2.0', 'alt', 1)]),
      ('Procedures', False, [('SOP-003', 'Iron Pressure Test', 'Fracturing', '4.0', 'cur', 0), ('SOP-005', 'Pressure Test SOP', 'Cementing', '1.0', 'cur', 0), ('SOP-004', 'Pressure Test Inspection SOP', 'Inspection', '3.0', 'cur', 1), ('SOP-004', 'Pressure Buildup Test SOP', 'Well Testing', '3.0', 'due', 0), ('SOP-007', 'Pressure Control Equipment Check', 'Wireline Services', '2.0', 'due', 1)]),
      ('Manuals and work instructions', False, [('WI-004', 'Pressure Gauge Calibration Manual', 'Well Testing', '3.0', 'cur', 0), ('WI-003', 'High-Pressure Iron Manual', 'Fracturing', '1.0', 'cur', 0), ('WI-006', 'BOP Testing Manual', 'Drilling Services', '1.0', 'cur', 1)]),
      ('Standards', False, [('S002', 'BOP Testing Standard', 'Safety Services', '2.0', 'cur', 0), ('S002', 'High Pressure Operations Standard', 'Fracturing', '2.0', 'cur', 1), ('S003', 'Pressure Control Standard', 'Wireline Services', '2.0', 'cur', 1)]),
      ('Lessons learned', False, [('LL-005', 'Wellhead pressure anomaly, identification and mitigation', 'Fracturing', '4.0', 'cur', 0), ('LL-004', 'Float collar failure, pre-job testing enhancement', 'Cementing', '4.0', 'cur', 0)]),
      ('Technical alerts', False, [('ALT-002', 'Separator pressure rating update, verify all units before deployment', 'Well Testing', '4.0', 'alt', 1)])]
grps = ''
for name, mine, rs in GR:
    head = f'<span class="yours"><i></i>{name} · your area</span>' if mine else name
    grps += f'<section class="grp"><h3>{head}<span class="n">{len(rs)}</span></h3><div class="rows">' + ''.join(rrow(*r[:5], r[5], sel=(r[0] == 'SOP-003')) for r in rs) + '</div></section>'
sop003 = next(r for r in REG if r['docNumber'] == 'TQ-TWS-FS-SOP-003')
search = f'''<div style="padding:22px 56px 0;flex:none">
  <div class="qrow"><label class="q">{I("i-search")}<span class="val">pressure test</span><button class="x" aria-label="Clear search">{I("i-x")}</button></label>
    <p class="qmeta"><b>17</b> in force · 2 not in force hidden</p></div>
  <div class="fbar">
    <a class="fb" href="#">Type <b>Any</b>{I("i-caret")}</a><a class="fb" href="#">Area <b>Any</b>{I("i-caret")}</a>
    <a class="fb set" href="#">Status <b>In force</b>{I("i-caret")}</a><a class="fb" href="#">Access <b>Any</b>{I("i-caret")}</a>
    <a class="fb" href="#">Language <b>Any</b>{I("i-caret")}</a><a class="fb add" href="#">+ Equipment <span style="color:var(--ink4)">proposed</span></a>
    <span class="sp"></span><a class="fb" href="#">Sort <b>Relevance</b>{I("i-caret")}</a>
  </div>
</div>
<div class="split">
  <div class="lst">
    {grps}
    <dl class="also">
      <dt>Field Glossary</dt><dd><b>BOP</b> · Blowout Preventer, Well Control</dd>
      <dt>Experts</dt><dd>Coiled Tubing expert · Fracturing expert · Well Testing expert</dd>
      <dt>Areas</dt><dd>8 areas have matches · <a href="#" style="color:var(--teal);font-weight:500">More partial matches</a></dd>
    </dl>
    <p class="hidden"><span>{I("s-sup")}2 not in force are hidden</span><span>{I("i-lock")}Locked: request access through QMS</span></p>
  </div>
  <aside class="pv" aria-label="Preview">
    <p class="pc">TQ-TWS-FS-SOP-003 · Procedure · Fracturing</p>
    <h2>Iron Pressure Test</h2>
    <div class="ctl"><span>{ST["cur"]}</span><span>Rev <b>4.0</b></span><span>Issued <b>14 Apr 2025</b></span></div>
    <div class="acts"><a class="tb pri" href="#">{I("i-arrow-r")}Open</a><a class="tb bd" href="#">{I("i-saved")}Save</a><a class="tb bd" href="#">Arabic version</a></div>
    <p class="why">Matched <mark>pressure</mark> and <mark>test</mark> in the title.</p>
    <dl class="props">
      <dt>Access</dt><dd>Internal</dd>
      <dt>Language</dt><dd>English<small>Arabic version available</small></dd>
      <dt>Next review</dt><dd>{fmt(sop003['nextReviewDate'])}</dd>
    </dl>
    <div class="paper"><p class="ph"><span>TQ-TWS-FS-SOP-003</span><span>REV 4.0</span></p><h4>Iron Pressure Test</h4><p class="pm">Standard operating procedure · Fracturing · Internal</p>
      <div class="ln"><i class="h"></i><i></i><i style="width:92%"></i><i style="width:70%"></i><i class="h"></i><i></i><i style="width:86%"></i><i style="width:95%"></i><i style="width:58%"></i></div></div>
  </aside>
</div>'''
w('search.html', page('RISE · Search · pressure test', 'search', ['Search', '“pressure test”'], f'<div style="display:flex;flex-direction:column;flex:1;min-height:0">{search}</div>', scroll=False))

# ═════════ AREA · Well Intervention (proposed group) ═════════
seg_n = collections.Counter(r['segment'] for r in WI)
types = collections.Counter(r['docType'] for r in WI)
cur_n = sum(r['status'] == 'current' for r in WI); due_n = sum(r['status'] == 'under-review' for r in WI)
COL = dict(WI_SEGS, **{'pt-intervention-coe': 'Intervention CoE'})
TL = {'sop': 'Procedures', 'manual': 'Manuals and work instructions', 'standard': 'Standards', 'lesson': 'Lessons learned', 'alert': 'Technical alerts', 'form': 'Forms and checklists'}
def st_of(r): return 'alt' if r['docType'] == 'alert' and r['status'] == 'current' else ('cur' if r['status'] == 'current' else 'due')
def arow(r):
    return (f'<a class="row r-area" href="{"document.html" if r["docNumber"] == "TQ-TWS-CTSS-WI-003" else "#"}"><span class="code">{short(r["docNumber"])}</span><span class="t">{r["title"]}</span>'
            f'<span class="a">{COL[r["segment"]]}</span><span>{access(r["classification"], False)}</span><span class="rev">Rev {r["revision"]}</span><span>{ST[st_of(r)]}</span></a>')
alerts = sorted([r for r in WI if r['docType'] == 'alert'], key=lambda r: (r['status'] != 'current', r['issueDate']), reverse=False)
alerts = sorted(alerts, key=lambda r: r['issueDate'], reverse=True)
recent = sorted(WI, key=lambda r: r['issueDate'], reverse=True)[:6]
def rrow2(r): return arow(r).replace('<span class="code">', f'<span class="d">{fmt(r["issueDate"])[:6]}</span><span class="code">', 1).replace('r-area', 'r-chg2')
sops = sorted([r for r in WI if r['docType'] == 'sop'], key=lambda r: r['issueDate'], reverse=True)
mans = sorted([r for r in WI if r['docType'] == 'manual'], key=lambda r: r['issueDate'], reverse=True)
ORDER = ['sop', 'manual', 'standard', 'lesson', 'alert', 'form']
SC = {'sop': '#013F4E', 'manual': '#00585A', 'standard': '#2E8B85', 'lesson': '#7FC4BE', 'alert': '#C8102E', 'form': '#B9D9D6'}
sbar = ''.join(f'<i style="flex:{types[k]};background:{SC[k]}"></i>' for k in ORDER)
shelves = ''.join(f'<dt>{TL[k]}</dt><dd class="num tn">{types[k]}</dd>' for k in ORDER)
PC = ['TQ-TWS-WS-S003', 'TQ-TWS-WS-SOP-007', 'TQ-SS-SOP-001', 'TQ-TWS-WS-WI-003', 'TQ-TWS-CTSS-SOP-005']
pcr = [next(r for r in REG if r['docNumber'] == n) for n in PC]
pc = ''.join(f'<a class="mini-row" href="#"><span class="code">{short(r["docNumber"])}</span><span><span class="t">{r["title"]}</span><span class="m">{WI_SEGS[r["segment"]]} · Rev {r["revision"]} · {"Current" if r["status"] == "current" else "Review due"}</span></span></a>' for r in pcr)
tabs = (f'<a class="on" href="#">All <span>{len(WI)}</span></a>' + ''.join(f'<a href="#">{WI_SEGS[s]} <span>{seg_n[s]}</span></a>' for s in ('coiled-tubing', 'wireline', 'pt-intervention-coe', 'slickline')))
area = f'''<div class="ahead">
  <div>
    <p class="kick">Area group · proposed · Operations</p>
    <h1 class="h1" style="margin-top:6px">Well Intervention</h1>
    <p class="lead">Coiled Tubing, Wireline Services, Slickline and the Well Intervention Center of Excellence in one place. Each document keeps its own area, owner and approval.</p>
  </div>
  <div class="figs">
    <div><b class="tn">{len(WI)}</b><span>In force</span></div>
    <div><b class="tn">{len(WI_AR)}</b><span>Arabic translations</span></div>
    <div><b class="tn" style="color:var(--crim-ink)">{len(alerts)}</b><span>Technical alerts</span></div>
  </div>
</div>
<nav class="tabs" aria-label="Member areas">{tabs}</nav>
<div class="cols area-cols" style="margin-top:4px">
<div>
  <div class="sh"><h2>Technical alerts</h2><span class="n">{len(alerts)}</span></div>
  <div class="rows">{''.join(arow(r) for r in alerts)}</div>
  <div class="sh"><h2>Recently updated</h2><a class="more" href="#">View all</a></div>
  <div class="rows">{''.join(rrow2(r) for r in recent)}</div>
  <div class="sh"><h2>Procedures</h2><span class="n">{types['sop']}</span><a class="more" href="#">View all {types['sop']}</a></div>
  <div class="rows">{''.join(arow(r) for r in sops[:5])}</div>
  <div class="sh"><h2>Manuals and work instructions</h2><span class="n">{types['manual']}</span><a class="more" href="#">View all {types['manual']}</a></div>
  <div class="rows">{''.join(arow(r) for r in mans[:5])}</div>
  <div class="sh"><h2>Maintenance bulletins</h2><span class="n">0</span></div>
  <div class="empty">{I("i-doc")}<div><b>No maintenance bulletins issued yet</b>Bulletins use the provisional code MB until QHSE assigns one in TQ-QHSE-S001. They will appear here, newest first.</div></div>
</div>
<aside class="rail">
  <section class="rs"><h3>Shelves <span class="n">{len(WI)}</span></h3>
    <div class="sbar" style="height:6px;margin-top:14px" role="img" aria-label="Documents by type">{sbar}</div>
    <dl class="props cnt" style="margin-top:6px">{shelves}</dl>
  </section>
  <section class="rs"><h3>Review status</h3>
    <div class="sbar"><i style="flex:{cur_n};background:var(--ok)"></i><i style="flex:{due_n};background:#E3A84A"></i></div>
    <p class="lg"><span><i style="background:var(--ok)"></i>Current <b class="tn">{cur_n}</b></span><span><i style="background:#E3A84A"></i>Review due <b class="tn">{due_n}</b></span></p>
  </section>
  <section class="rs"><h3>Topic · Pressure control <span class="n">5</span></h3>{pc}</section>
  <section class="rs"><h3>Experts</h3>
    <div class="exp"><span class="av">{I("i-person")}</span><span><b>Coiled Tubing expert</b><span>Operations questions</span></span></div>
    <div class="exp"><span class="av">{I("i-person")}</span><span><b>Wireline Services expert</b><span>Operations questions</span></span></div>
    <div class="exp"><span class="av">{I("i-wrench")}</span><span><b>Coiled Tubing Maintenance Manager</b><span>Maintenance questions</span></span></div>
  </section>
</aside>
</div>'''
area_right = f'<a class="tb bd" href="#">{I("i-saved")}Follow</a><a class="tb bd" href="#">{I("i-share")}Share</a>'
w('area.html', page('RISE · Well Intervention', 'wi', ['Areas', 'Well Intervention'], area, area_right))

# ═════════ DOCUMENT · WI-003 ═════════
wi3 = next(r for r in REG if r['docNumber'] == 'TQ-TWS-CTSS-WI-003')
TOC = [('1', 'Scope'), ('2', 'Injector head components'), ('3', 'Pre-job inspection'), ('4', 'Chain tension and traction pressure'), ('5', 'Operating limits (2-inch string)'), ('6', 'Chain slip response'), ('7', 'Shutdown and isolation'), ('A', 'Inspection record (F001)')]
toc = ''.join(f'<li class="f"><span class="n">{n}</span><span>{t}</span><span>ALT-002</span></li>' if n == '5' else f'<li><span class="n">{n}</span><span>{t}</span><span></span></li>' for n, t in TOC)
doc = f'''<div class="cols">
<div>
  <div class="dhead">
    <p class="code">TQ-TWS-CTSS-WI-003 · Manual · Coiled Tubing, Operations</p>
    <h1 class="h1">Injector Head Operations Manual</h1>
  </div>
  <div class="trust" aria-label="Document control">
    <div><span class="ok">{I("i-check")}</span><span><b>Current · Revision 4.0</b><span>Safe to use · latest of 4 revisions</span></span></div>
    <div><b>Effective 30 Aug 2025</b><span>Next review 30 Aug 2028</span></div>
    <div><b>Segment Director, Coiled Tubing</b><span>Approved 28 Aug 2025</span></div>
  </div>
  <div class="alert one" style="margin-top:12px">{I("s-alert")}<div><b>ALT-002 changes the limits in <span class="chip">§5 Operating limits</span></b><span>New pressure rating for 2-inch CT string · active alert since 13 Apr 2026</span></div><a class="go" href="#">Go to §5{I("i-arrow-r")}</a></div>
  <nav class="dtabs"><a class="on" href="#">Document</a><a href="#">Contents <span>8</span></a><a href="#">History <span>4</span></a><a href="#">Related <span>4</span></a></nav>
  <div class="reader">
    <div class="sheet">
      <p class="sh1"><span>TQ-TWS-CTSS-WI-003</span><span>REV 4.0 · INTERNAL</span></p>
      <h4>Injector Head Operations Manual</h4>
      <div class="ctrl"><div><b>Revision 4.0</b>Current</div><div><b>30 Aug 2025</b>Effective</div><div><b>Coiled Tubing</b>Owner</div><div><b>Segment Director</b>Approver</div></div>
      <h5>1 Scope</h5>
      <p>How to rig up, operate, monitor and shut down the CT injector head safely: chain tension, gripper block inspection, traction pressure limits, and what to do on a chain slip.</p>
      <h5>Contents</h5>
      <ol>{toc}</ol>
    </div>
  </div>
  <p class="rcap"><span>Page 1 · PDF viewer not connected in this prototype</span><span>Quick reference card, Sunlight mode, Pin offline and Print are under More</span></p>
</div>
<aside class="rail">
  <section class="rs"><h3>Record</h3>
    <dl class="props" style="margin-top:4px">
      <dt>Type</dt><dd>Manual</dd>
      <dt>Area</dt><dd>Coiled Tubing<small>Operations</small></dd>
      <dt>Owner</dt><dd>Coiled Tubing segment</dd>
      <dt>Access</dt><dd>Internal</dd>
      <dt>Language</dt><dd>English</dd>
      <dt>Review cycle</dt><dd>36 months</dd>
      <dt>New in 4.0</dt><dd>Traction pressure limits for 2-inch string</dd>
      <dt>Equipment</dt><dd>Injector head · CT string<small>Proposed tags</small></dd>
    </dl>
  </section>
  <section class="rs"><h3>History <span class="n">4</span></h3>
    <ol class="hist" style="margin-top:6px">
      <li class="cur"><i></i><b>Rev 4.0 · Current</b><span>30 Aug 2025</span></li>
      <li><i></i><b>Rev 3.0 · Superseded</b><span>11 Mar 2024</span></li>
      <li><i></i><b>Rev 2.0 · Superseded</b><span>02 Feb 2023</span></li>
      <li><i></i><b>Rev 1.0 · Superseded</b><span>14 Jan 2022</span></li>
    </ol>
    <p style="font:400 12.5px/1.45 var(--ui);color:var(--ink3);margin-top:4px">Filed 19 Aug by Khalid Al-Otaibi, CT Engineer · QMS check 24 Aug · approved 28 Aug 2025</p>
  </section>
  <section class="rs"><h3>Related <span class="n">4</span></h3>
    <a class="mini-row" href="#"><span class="code">ALT-002</span><span><span class="t">New pressure rating for 2-inch CT string</span><span class="m">Changes §5 · Confidential</span></span></a>
    <a class="mini-row" href="#"><span class="code">F001</span><span><span class="t">Pre-Job Safety Checklist</span><span class="m">Appendix A · Rev 4.0</span></span></a>
    <a class="mini-row" href="#"><span class="code">WI-005</span><span><span class="t">CT String Inspection Manual</span><span class="m">Rev 3.0 · Current</span></span></a>
    <a class="mini-row" href="#"><span class="code">SOP-006</span><span><span class="t">CT Unit Rig-Up &amp; Rig-Down</span><span class="m">Rev 4.0 · Review due · Restricted</span></span></a>
  </section>
  <section class="rs"><h3>Questions</h3>
    <div class="exp"><span class="av">{I("i-person")}</span><span><b>Coiled Tubing expert</b><span>Answers by role</span></span><a class="tb bd" href="#">Ask</a></div>
  </section>
</aside>
</div>'''
doc_right = (f'<a class="tb on" href="#" aria-pressed="true">{I("i-saved-f")}Saved</a><a class="tb" href="#">{I("i-share")}Share</a>'
             f'<a class="tb pri" href="#">{I("i-download")}Download PDF</a><a class="tb" href="#" aria-label="More">{I("i-more")}</a>')
w('document.html', page('RISE · WI-003 Injector Head Operations Manual', 'ct', ['Coiled Tubing', 'Manuals', 'WI-003'], doc, doc_right))

# QMS variant of the navigation (for the review page)
w('nav-qms.html', page('RISE · Home · QMS view', 'home', ['Home'], home, role='qms'))
print('WI', len(WI), dict(seg_n), dict(types), cur_n, due_n, len(WI_AR), [short(r['docNumber']) for r in alerts])
