"""Register component library: page shell, role-aware navigation and the shared parts every screen uses.
Static prototypes only (design exploration). Data comes from the live register file, read-only."""
import json, os, re, datetime as dt, html as _h
HERE = os.path.dirname(os.path.abspath(__file__))
REG_ROOT = os.path.abspath(os.path.join(HERE, '..'))
REPO = os.path.abspath(os.path.join(REG_ROOT, '..', '..', '..', '..'))
PAGES = os.path.join(REG_ROOT, 'pages')
e = _h.escape

# ── register data (read-only) ─────────────────────────────────────────────
SRC = open(os.path.join(REPO, 'documents-master.js')).read()
REG = []
for _l in SRC.splitlines():
    _i = _l.find('{"docNumber')
    if _i > -1:
        REG.append(json.loads(_l[_i:].strip().rstrip(',')))
BYNUM = {r['docNumber']: r for r in REG if r.get('docNumber')}
INF = [r for r in REG if r['status'] in ('current', 'under-review')]
def segname(k):
    m = re.search(r'"%s":\s*\{[^{}]*?"name":\s*"([^"]+)"' % re.escape(k), SRC)
    return m.group(1) if m else k
def short(n):
    if n.endswith('-AR'): return short(n[:-3]) + ' AR'
    p = n.split('-')
    return p[-2] + '-' + p[-1] if len(p) > 1 and p[-2] in ('SOP', 'WI', 'LL', 'ALT', 'MB', 'F') else p[-1]
def d(s, fmt='%d %b %Y'):
    return dt.date.fromisoformat(s).strftime(fmt) if s else '—'
TYPE = {'sop': 'Procedure', 'manual': 'Work instruction', 'standard': 'Standard', 'alert': 'Technical alert', 'lesson': 'Lesson learned', 'form': 'Form', 'policy': 'Policy', 'bulletin': 'Maintenance bulletin'}

# ── icons (single-weight, filled, 24px grid) ─────────────────────────────
ICON = {
 'search': 'M10.5 4a6.5 6.5 0 0 1 5.2 10.4l4.4 4.4-1.4 1.4-4.4-4.4A6.5 6.5 0 1 1 10.5 4zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z',
 'home': 'M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z',
 'areas': 'M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z',
 'saved': 'M6 3h12v18l-6-4.2L6 21z',
 'more': 'M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z',
 'bell': 'M12 3a6 6 0 0 0-6 6v4l-2 3v1h16v-1l-2-3V9a6 6 0 0 0-6-6zm-2 16a2 2 0 0 0 4 0z',
 'lock': 'M7 10V7a5 5 0 0 1 10 0v3h1.5v11h-13V10zm2 0h6V7a3 3 0 0 0-6 0z',
}
def ico(name, cls=''):
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="{ICON[name]}"/></svg>'
LOCK = '<svg class="lk" viewBox="0 0 24 24" aria-label="Access restricted"><path fill="currentColor" d="%s"/></svg>' % ICON['lock']

# ── roles (filled from the product inventory) ─────────────────────────────
# Each role: label shown in the nav, people, which control links appear, upload rights.
ROLES = {
 'employee': dict(label='Employee', who='Faisal Al-Ghamdi', init='FA', title='Field Supervisor', area='Coiled Tubing', control=[], upload=True),
}
def set_roles(r): ROLES.update(r)

NAV_MAIN = [('home', 'Home', 'home.html'), ('areas', 'Areas', 'areas.html'), ('saved', 'Saved', 'saved.html'),
            ('ask', 'Ask an Expert', 'ask.html'), ('glossary', 'Field Glossary', 'glossary.html')]

def nav(active, role):
    R = ROLES[role]
    links = ''.join(f'<a href="{h}"{" class=on aria-current=page" if k == active else ""}>{t}</a>' for k, t, h in NAV_MAIN)
    if R['control']:
        links += '<span class="sep" aria-hidden="true"></span>' + ''.join(
            f'<a class="ctl{" on" if k == active else ""}" href="{h}"{" aria-current=page" if k == active else ""}>{t}{f"<sup>{n}</sup>" if n else ""}</a>' for k, t, h, n in R['control'])
    up = '<a class="up" href="upload.html">Upload</a>' if R['upload'] else ''
    return f'''<div class="wrap"><header class="nav">
    <a class="logo" href="home.html" aria-label="RISE home"><img src="../../kit/brand/rise-lockup-header.png" alt="RISE" width="69" height="26"></a>
    <nav class="links" aria-label="Main">{links}</nav>
    <span class="sp"></span>
    <div class="tools">
      <a class="k" href="search.html">Search <kbd>⌘K</kbd></a>{up}
      <span class="role">{R.get("short", R["label"])}</span>
      <a class="psearch" href="search.html" aria-label="Search">{ico("search")}</a>
      <a class="bell" href="{"notifications-director.html" if role in ("owner", "delegate") else "notifications.html"}" aria-label="Notifications, new">{ico("bell")}<i></i></a>
      <a class="av" href="{"account-director.html" if role == "owner" else "account.html"}" aria-label="{R["who"]}, account">{R["init"]}</a>
    </div>
  </header></div>'''

def dock(active, role):
    R = ROLES[role]
    items = [('home', 'Home', 'home.html', 'home'), ('search', 'Search', 'search.html', 'search'), ('areas', 'Areas', 'areas.html', 'areas'),
             ('saved', 'Saved', 'saved.html', 'saved'), ('more', 'More', {'owner': 'more-director.html', 'qms': 'more-qms.html'}.get(role, 'more.html'), 'more')]
    dot = any(n for *_, n in R['control'])
    return '<nav class="dock" aria-label="Main">' + ''.join(
        f'<a href="{h}"{" class=on aria-current=page" if k == active else ""}>{ico(ic)}{t}{"<i class=n></i>" if k == "more" and dot else ""}</a>' for k, t, h, ic in items) + '</nav>'

def acting_bar(a):
    return f'''<div class="acting" role="status"><div class="wrap"><i></i><span>Acting for <b>{a["for"]}</b></span><span class="mute dk-only">{a["perm"]}</span>
  <span class="mute">until {a["until"]}</span><span class="sp"></span><span class="mute dk-only">Signed in as {a["me"]}</span><a href="{a.get("stop", "#")}">Stop acting</a></div></div>'''

def page(name, title, body, active='home', role='employee', acting=None, dock_active=None, overlays='', script=''):
    html = f'''<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<link rel="stylesheet" href="../css/register.css">
</head>
<body>
{acting_bar(acting) if acting else ""}
{nav(active, role)}
<main class="wrap">
{body}
<div class="page-end"></div>
</main>
{dock(dock_active or active, role)}
{overlays}
{f"<script>{script}</script>" if script else ""}
</body>
</html>'''
    open(os.path.join(PAGES, name), 'w').write(html)
    return name

# ── parts ────────────────────────────────────────────────────────────────
STW = {'cur': 'Current', 'due': 'Review due', 'alt': 'Active alert', 'draft': 'Draft', 'pend': 'Pending', 'ret': 'Returned',
       'sup': 'Superseded', 'wd': 'Withdrawn', 'obs': 'Obsolete'}
def st(k, word=None):
    cls = 'sup' if k == 'obs' else k
    return f'<span class="st {cls}">{word or STW[k]}</span>'
def status_of(r):
    s = r['status']
    if s == 'current': return 'alt' if r['docType'] == 'alert' else 'cur'
    return {'under-review': 'due', 'superseded': 'sup', 'obsolete': 'obs', 'draft': 'draft'}.get(s, 'cur')
def locked(r): return r.get('classification') in ('restricted', 'confidential')

def sech(title, n=None, right='', href='#'):
    return f'<div class="sech"><h2>{title}</h2>{f"<sup>{n}</sup>" if n is not None else ""}{f"<a class=r href={href}>{right}</a>" if right else ""}</div>'

def tabs(items, cls=''):
    """items: (label, count, on, href, alertdot)"""
    out = ''
    for it in items:
        lab, n, on, href = it[:4]; al = it[4] if len(it) > 4 else False
        out += f'<a href="{href}"{" class=on" if on else ""}>{lab}{f"<sup>{n}</sup>" if n is not None else ""}{"<span class=al></span>" if al else ""}</a>'
    return f'<nav class="tabs {cls}">{out}</nav>'

def row(code, title, area='', rev='', status='', date='', href='#', cls='', sub='', lock=False, cols=None):
    style = f' style="--cols:{cols}"' if cols else ''
    ds = '' if date is None else f'<span class="d">{date}</span>'
    return (f'<a href="{href}" class="{cls}"{style}>{ds}<span class="c">{code}</span>'
            f'<span class="t"><span class="one">{title}{LOCK if lock else ""}</span>{f"<small>{sub}</small>" if sub else ""}</span>'
            f'<span class="a">{area}</span><span class="r">{rev}</span>{status}</a>')
def rrow(r, href='#', cls='', sub='', datefmt='%d %b', code=None):
    return row(code or short(r['docNumber']), r['title'], segname(r['segment']), 'Rev ' + r['revision'], st(status_of(r)),
               d(r['issueDate'], datefmt), href, cls + (' hot' if status_of(r) == 'alt' else ''), sub, locked(r))

def kv(pairs, cls=''):
    out = ''
    for p in pairs:
        k, v = p[0], p[1]; c = p[2] if len(p) > 2 else ''; sm = p[3] if len(p) > 3 else ''
        out += f'<div><span>{k}</span><b class="{c}">{v}</b>{f"<small>{sm}</small>" if sm else ""}</div>'
    return f'<div class="kv {cls}">{out}</div>'

def note(kind, text, go='', href='#'):
    return f'<div class="bnr {kind}"><span class="ic"></span><div>{text}</div>{f"<a class=go href={href}>{go}</a>" if go else "<span></span>"}</div>'

def phead(meta_l, meta_r, title, sub='', crumb=None):
    left = crumb if crumb else meta_l
    return f'''<header class="phead"><div class="meta"><span class="{"crumb" if crumb else "lab"}">{left}</span><span class="lab">{meta_r}</span></div>
  <h1 class="t1">{title}</h1>{f"<p class=sub>{sub}</p>" if sub else ""}</header>'''

def crumbs(*parts):
    return '<i>/</i>'.join(f'<a href="{h}">{t}</a>' if h else t for t, h in parts)

def stack(inner, flat=False):
    return f'<div class="stack{" flat" if flat else ""}"><span class="pg p3"></span><span class="pg p2"></span><span class="pg p1"></span><div class="pg p0">{inner}</div></div>'

def menu_sheet(role, open_=False):
    R = ROLES[role]
    ctl = ''.join(f'<a href="{h}">{t}<span{" class=n" if n else ""}>{f"{n} waiting" if n else "Open"}</span></a>' for k, t, h, n in R['control'])
    return f'''<div class="scrim"{"" if open_ else " hidden"}></div><section class="sheet menu" aria-label="More"{"" if open_ else " hidden"}><span class="grab"></span>
  <p class="lab"><span>{R["who"]} · {R["label"]}</span></p>
  <a href="ask.html">Ask an Expert<span>By area</span></a><a href="glossary.html">Field Glossary<span>254 terms</span></a>
  {"<a href=upload.html>Upload a document<span>Filed for QMS check</span></a>" if R["upload"] else ""}
  <a href="notifications.html">Notifications<span class="n">New</span></a>
  {f"<span class=lab>{R.get('ctl_label', 'Document control')}</span>" + ctl if ctl else ""}
  <a href="account.html">Account &amp; delegation<span>Settings</span></a></section>'''

# ── the five real roles (roles.js on main) ───────────────────────────────
set_roles({
 'employee':    dict(label='Employee', who='Faisal Al-Ghamdi', init='FA', title='Field Supervisor', area='Coiled Tubing', control=[], upload=True),
 'owner':       dict(label='Segment Director · Coiled Tubing', short='Director · CT', who='CT Director', init='CD', title='Segment Director', area='Coiled Tubing', upload=True,
                     control=[('desk', 'Approvals', 'desk.html', 1), ('manage', 'Manage', 'manage.html', None)], ctl_label='Coiled Tubing desk'),
 'maintenance': dict(label='Maintenance Manager · Coiled Tubing', short='Maintenance · CT', who='Maintenance Manager', init='MM', title='Maintenance Manager', area='Coiled Tubing', upload=True,
                     control=[('desk', 'Approvals', 'desk-maint.html', 2), ('manage', 'Manage', 'manage.html', None)], ctl_label='Maintenance desk'),
 'qms':         dict(label='QMS', who='QMS / Document Controller', init='QD', title='Document Controller', area='All areas', upload=True,
                     control=[('master', 'Master List', 'master.html', None), ('wb', 'QMS check', 'workbench.html', 12)], ctl_label='Document control'),
 'auditor':     dict(label='External Auditor · read only', short='Auditor', who='External Auditor', init='EA', title='External Auditor', area='All areas', upload=False,
                     control=[('master', 'Master List', 'master-auditor.html', None)], ctl_label='Register'),
 'delegate':    dict(label='Delegate · Coiled Tubing', short='Delegate', who='Ahmed Saleh', init='AS', title='Delegate for CT Director', area='Coiled Tubing', upload=False,
                     control=[('desk', 'Approvals', 'desk-delegate.html', 1)], ctl_label='Acting for CT Director'),
})
ACT = dict(**{'for': 'CT Director', 'perm': 'Approval · no document management', 'until': '20 Oct 2026', 'me': 'Ahmed Saleh', 'stop': 'desk.html'})

# ── role visibility (BD-03) and the real search scoring (ai-search.html on main) ──
CLASS_OK = {'employee': {'internal'}, 'owner': {'internal', 'confidential'}, 'maintenance': {'internal', 'confidential'},
            'qms': {'internal', 'confidential', 'restricted'}, 'auditor': {'internal', 'confidential', 'restricted'}, 'delegate': {'internal', 'confidential'}}
def visible(r, role='employee'):
    return r['status'] in ('current', 'under-review') and r.get('classification') in CLASS_OK[role]
def inforce(role='employee'):
    return [r for r in REG if visible(r, role)]
def search(q, role='employee', segment=None, dtype=None):
    ql = q.strip().lower(); out = []
    for r in inforce(role):
        if segment and r['segment'] != segment: continue
        if dtype and r['docType'] != dtype: continue
        tl, nl, sl, tp = r['title'].lower(), (r['docNumber'] or '').lower(), segname(r['segment']).lower(), r['docType']
        sc = 10 if tl == ql else 6 if tl.startswith(ql) else 4 if ql in tl else 0
        if nl: sc += 9 if nl == ql else 5 if nl.startswith(ql) else 3 if ql in nl else 0
        sc += 2 if ql in sl else 0
        sc += 1 if ql in tp else 0
        if sc: out.append((sc, r))
    out.sort(key=lambda x: -x[0])
    return [r for _, r in out]
# Employees never see review-overdue flags on area pages or the viewer (BR §0.4): an in-force document reads "Current".
def st_for(r, role='employee'):
    k = status_of(r)
    if role == 'employee' and k == 'due': return st('cur', 'Current')
    if k == 'alt' and r['status'] == 'under-review' and role != 'employee': return st('due', 'Alert · review overdue')
    if k == 'due' and r.get('reviewOverdue'): return st('due', 'Review overdue')
    return st(k)
AR_OF = {r['translationOf'] for r in REG if r.get('translationOf')}
def rrow_role(r, role='employee', href='#', cls='', sub='', date=True, code=None, cols=None):
    t = r['title'] + (' <span class="type">· AR</span>' if r['docNumber'] in AR_OF else '')
    return row(code or r['docNumber'], t, segname(r['segment']), 'Rev ' + r['revision'], st_for(r, role),
               d(r['issueDate'], '%d %b') if date else None, href, cls + (' hot' if status_of(r) == 'alt' else ''), sub, locked(r), cols)

# ── areas (TAQA_DOC_LOOKUPS.segments, read-only) ──────────────────────────
def _segments():
    i = SRC.find('"segments": {', SRC.find('const TAQA_DOC_LOOKUPS')) + len('"segments": ')
    j = SRC.find('\n  },', i)
    return json.loads(SRC[i:j + 4])
LOOK = {'segments': _segments()}
SEGS = LOOK['segments']
GROUPS = [('segment', 'Operational segments'), ('function', 'Corporate functions'), ('product', 'Products & Technology')]
def count_for(seg, role='employee'):
    return sum(1 for r in inforce(role) if r['segment'] == seg)
# area tags as the live Areas menu shows them (segments-data.js)
TAG = {'cementing': 'Well Integrity', 'coiled-tubing': 'Operations', 'drilling': 'Well Operations', 'fracturing': 'Stimulation', 'inspection': 'Compliance',
       'marine-services': 'Marine', 'well-safety': 'HSE Critical', 'slickline': 'Logging', 'well-completions': 'Well Operations', 'well-testing': 'Testing Services',
       'wireline': 'Logging', 'commercial': 'Commercial', 'geothermal-coe': 'Advisory', 'cybersecurity': 'GRC', 'hr': 'HR & People', 'it': 'IT',
       'learning-center': 'Training', 'qhse': 'Quality & Safety', 'supply-chain': 'Procurement', 'pt-drilling-coe': 'Edmonton, Canada',
       'pt-completions-coe': 'Aberdeen, United Kingdom', 'pt-intervention-coe': 'Stavanger, Norway'}
MARK = {'sop': 'SOP', 'manual': 'WI', 'standard': 'ST', 'policy': 'POL', 'form': 'FRM', 'bulletin': 'MB', 'alert': 'ALT', 'lesson': 'LL'}
# owner / approver / review cycle by type (TAQA_DOC_LOOKUPS.types, roles not names)
TYPEINFO = {
 'sop': ('Standard Operating Procedure', 'Relevant SPL / Function', 'Relevant Operation Director', 24),
 'manual': ('Manual / Work Instruction', 'Subject Matter Expert', 'Subject Matter Expert', 36),
 'standard': ('Standard', 'Relevant SPL / Function', 'Relevant Operation Director', 36),
 'policy': ('Policy', 'Corporate Function VP', 'CEO', 24),
 'alert': ('Technical Alert', 'QHSE Manager', 'Corp Function VP / Director', 12),
 'lesson': ('Lesson Learned', 'QHSE Manager', 'QHSE Manager', 36),
 'form': ('Form / Checklist', 'QHSE / Relevant SPL / Function', 'Relevant Operation Director', 24),
 'bulletin': ('Maintenance Bulletin', 'Segment Maintenance Department', 'Maintenance Manager', 12)}
def owner_of(r): return TYPEINFO[r['docType']][1]
def approver_of(r):
    if r.get('department') == 'maintenance': return 'Maintenance Manager'
    a = TYPEINFO[r['docType']][2]
    return 'Translation verified by: ' + a if r.get('translationOf') else a

# ── Field Glossary (glossary.html BUILT_IN, read-only) ───────────────────
_G = open(os.path.join(REPO, 'glossary.html')).read()
_g0 = _G.find('const BUILT_IN = ['); _g1 = _G.find('\n];', _g0)
GLOSS = []
for _m in re.finditer(r"\{((?:abbr|term):'(?:[^'\\]|\\.)*'.*?)\},?\s*$", _G[_g0:_g1], re.M):
    GLOSS.append({k: v.replace("\\'", "'") for k, v in re.findall(r"(\w+):'((?:[^'\\]|\\.)*)'", _m.group(1))})
