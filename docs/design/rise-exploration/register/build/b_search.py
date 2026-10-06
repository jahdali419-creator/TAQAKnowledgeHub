"""Search, rebuilt on the live rules (ai-search.html on main):
whole-query match on title, number, area name and type; filters Area / Status / Type / Issued; in force only;
role-trimmed (BD-03: nothing the role may not open is listed or counted); exact superseded number → red card.
'Your area first' ordering is a PROPOSAL (needs BR §14 membership) and is labelled as such."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from reg import *

EMP = inforce('employee')
N = {k: sum(r['docType'] == k for r in EMP) for k in ('sop', 'manual', 'standard', 'alert', 'lesson', 'form', 'policy')}

def qline(val=None, md=True, ph='by number or title'):
    if val:
        return f'<div class="q{" md" if md else ""}{" long" if val.startswith("TQ-") else ""}"><span class="val">{val}</span><span class="caret"></span><a class="clr" href="search.html">Clear</a></div>'
    return f'<div class="q{" md" if md else ""}"><span class="w">Search</span><span class="caret"></span><span class="ph">{ph}</span></div>'

def srow(r, role='employee', href='#', cls='', mine=False):
    sub = f'{TYPE[r["docType"]]} · issued {d(r["issueDate"])}'
    area = segname(r['segment'])
    t = r['title'] + (' <span class="type">· AR</span>' if r['docNumber'] in AR_OF else '')
    k = st_for(r, role)
    if role != 'employee' and r.get('classification') != 'internal':
        sub += f' · <span class="cls">{r["classification"].capitalize()}</span>'
    return row(r['docNumber'], t, area, 'Rev ' + r['revision'], k, None, href, cls + (' mine' if mine else '') + (' hot' if status_of(r) == 'alt' else ''), sub, False)

def fbar(area='Any', typ='Any', status='In force', issued='Any', n=None, sort=True):
    on = lambda v: ' on' if v not in ('Any', 'In force') else ''
    return f'''<nav class="fbar" style="margin-top:20px"><span>Filter</span><a class="car{on(area)}" href="search-filters.html">Area <b>{area}</b></a><a class="car{on(typ)}" href="search-filters.html">Type <b>{typ}</b></a>
  <a class="car{on(status)}" href="search-filters.html">Status <b>{status}</b></a><a class="car{on(issued)}" href="search-filters.html">Issued <b>{issued}</b></a>
  {f'<span class="dk-only" style="margin-left:auto"></span><a class="car dk-only" href="#">Order <b>Your area first</b><span class="prop">proposed</span></a>' if sort else ''}</nav>'''

# ── 1 · start ────────────────────────────────────────────────────────────
scope = f'''<nav class="fbar" style="margin-top:24px"><span>In</span><a class="on" href="#">Everything <b>{len(EMP)}</b></a><a href="#">Procedures <b>{N['sop']}</b></a><a href="#">Work instructions <b>{N['manual']}</b></a>
  <a href="#">Standards <b>{N['standard']}</b></a><a href="#">Technical alerts <b>{N['alert']}</b></a><a href="#">Lessons <b>{N['lesson']}</b></a><a href="#">Policies <b>{N['policy']}</b></a><a href="#">Forms <b>{N['form']}</b></a></nav>'''
areas_q = ''.join(f'<a href="{"area.html" if k == "coiled-tubing" else "#"}">{SEGS[k]["name"]}<span>{count_for(k)}</span></a>' for k in ('coiled-tubing', 'well-safety', 'drilling', 'fracturing', 'qhse'))
start = f'''<header class="phead" style="padding-bottom:6px"><div class="meta"><span class="lab">Search the register</span><span class="lab"><b>{len(EMP)}</b> documents in force · <b>25</b> areas</span></div></header>
{qline(md=False)}
<p class="try">Try <a href="search-number.html">WI-003</a><a href="search-results.html">pressure</a><a href="search-typing.html">inject</a><a href="search-superseded.html">TQ-TWS-CTSS-SOP-003</a><span class="enter">Press <kbd>↵</kbd> to search · <kbd>/</kbd> from any page</span></p>
{scope}
<div class="g84" style="margin-top:60px"><div>
  <div class="dk-only">{sech('How search reads what you type')}
  {kv([("Looks in", "Title, register number, area name, type"), ("Matches", "The whole phrase you type", "", "“pressure test” finds titles containing exactly that"),
       ("Shows", "Documents in force only", "", "Superseded and withdrawn documents are left out"),
       ("Exception", "A full superseded number", "", "Shown as a red “do not use” card, so an old reference is caught")], 'c2')}
  </div><p class="small" style="margin-top:16px">Search does not read inside documents or expand abbreviations. For a term, use the <a class="lnk" href="glossary.html">Field Glossary</a>.</p>
</div><aside class="aside">
  {sech('Or go straight to an area')}
  <div class="idx">{areas_q}<a href="areas.html">All 25 areas<span>→</span></a></div>
</aside></div>'''
page('search.html', 'RISE · Search', start, 'search')

# ── 2 · typing (type-ahead from 2 characters: "Document Matches") ─────────
inj = search('inject')
def hl(t, q):
    i = t.lower().find(q)
    return t if i < 0 else t[:i] + f'<mark>{t[i:i+len(q)]}</mark>' + t[i+len(q):]
sug = ''.join(f'<a href="{"document.html" if r["docNumber"].endswith("WI-003") else "#"}"><span class="code full">{r["docNumber"]}</span><span class="t">{hl(r["title"], "inject")}</span><span class="a">{TYPEINFO[r["docType"]][0].split(" /")[0]} · {segname(r["segment"])}</span></a>' for r in inj)
typing = f'''<header class="phead" style="padding-bottom:6px"><div class="meta"><span class="lab">Search the register</span><span class="lab">Matches as you type</span></div></header>
{qline('inject', md=False)}
<div class="g84" style="margin-top:34px"><div>
  <p class="grph"><b>Document matches</b><span>{len(inj)} found</span></p>
  <div class="sugg">{sug}</div>
  <p class="small" style="margin-top:16px">Press <kbd>↵</kbd> to see every matching document with filters.</p>
</div><aside class="aside"><p class="lab">Tip</p><p class="body" style="margin-top:10px">Type a register number such as <b>WI-003</b> to find it in every area that uses it. A full number, such as <b>TQ-TWS-CTSS-WI-003</b>, goes to one document.</p></aside></div>'''
page('search-typing.html', 'RISE · Search · typing', typing, 'search')

# ── 3 · results: "pressure" (11 for an Employee) ─────────────────────────
res = search('pressure')
mine = [r for r in res if r['segment'] == 'coiled-tubing']
rest = [r for r in res if r['segment'] != 'coiled-tubing']
sel = BYNUM['TQ-TWS-CMT-SOP-005']
rows_m = ''.join(srow(r, href='#', mine=True) for r in mine)
rows_r = ''.join(srow(r, href='#', cls=' sel' if r is sel else '') for r in rest)
def preview(r, role='employee'):
    return f'''<aside class="aside pv"><p class="lab">Preview</p>
  {stack(f"""<div class="hd"><span>{r['docNumber']}</span><span>REV {r['revision']}</span></div>
  <p class="type" style="margin-top:22px">{TYPEINFO[r['docType']][0]} · {segname(r['segment'])}</p><h2 class="t2" style="margin-top:10px;font-size:26px">{r['title']}</h2>
  <div style="margin-top:18px">{kv([("Status", "Current, OK to use", "ok"), ("Revision", "Rev " + r['revision']), ("Issued", d(r['issueDate'])), ("Owner", owner_of(r))])}</div>
  <p class="small why" style="margin-top:14px">Matched <mark>pressure</mark> in the title.</p>
  <div class="acts" style="margin-top:18px"><a class="btn pri sm" href="document.html">Open the record</a><a class="btn sm" href="#">Bookmark</a></div>""", flat=True)}</aside>'''
results = f'''<header class="phead" style="padding-bottom:6px"><div class="meta"><span class="lab">Search the register</span><span class="lab"><b>{len(res)}</b> documents in force match</span></div></header>
{qline('pressure')}
{fbar()}
<div class="g84 sr" style="margin-top:6px"><div>
  <p class="grph"><span class="dot"></span><b>Coiled Tubing</b><span>{len(mine)} · your area</span></p><div class="reg">{rows_m}</div>
  <p class="grph"><b>Every other area</b><span>{len(rest)} · best match first</span></p><div class="reg">{rows_r}</div>
  <p class="small" style="margin-top:18px">All {len(res)} shown. Try <a class="lnk" href="#">pressure test</a> for fewer, more exact matches.</p>
</div>{preview(sel)}</div>'''
page('search-results.html', 'RISE · Search · pressure', results, 'search')

# ── 4 · same local number in many areas ─────────────────────────────────
wi3 = sorted(search('WI-003'), key=lambda r: (r['segment'] != 'coiled-tubing', segname(r['segment'])))
rows3 = ''.join(srow(r, href='document.html' if r['segment'] == 'coiled-tubing' else '#', mine=r['segment'] == 'coiled-tubing') for r in wi3)
number = f'''<header class="phead" style="padding-bottom:6px"><div class="meta"><span class="lab">Search the register · register number</span><span class="lab"><b>{len(wi3)}</b> areas use this number</span></div></header>
{qline('WI-003')}
{fbar(sort=False)}
<div class="g84 sr" style="margin-top:22px"><div>
  {note("spark", f"<b>WI-003 is a local number.</b> Each area numbers its own work instructions, so {len(wi3)} different documents carry it. The full register number tells them apart.")}
  <p class="grph"><span class="dot"></span><b>Work instruction WI-003</b><span>{len(wi3)} · your area first</span></p><div class="reg">{rows3}</div>
</div><aside class="aside"><p class="lab">How a register number reads</p>
  <p class="rline" style="margin-top:14px"><b>TQ</b><span>TWS</span><span>CTSS</span><b>WI-003</b></p>
  <div class="kv c1" style="margin-top:14px">{"".join(f"<div><span>{a}</span><b>{b}</b></div>" for a, b in [("TQ", "TAQA"), ("TWS", "TAQA Well Solution · business unit"), ("CTSS", "Coil Tubing &amp; Stimulation Services"), ("WI-003", "Work instruction 003 in that area")])}</div>
  <p class="small" style="margin-top:14px">Quote the full number on permits and job packs.</p>
</aside></div>'''
page('search-number.html', 'RISE · Search · WI-003', number, 'search')

# ── 5 · exact superseded number (PI-22) ──────────────────────────────────
s3 = BYNUM['TQ-TWS-CTSS-SOP-003']
sup = f'''<header class="phead" style="padding-bottom:6px"><div class="meta"><span class="lab">Search the register · exact number</span><span class="lab"><b>0</b> in force · 1 superseded</span></div></header>
{qline(s3['docNumber'])}
<div class="g84" style="margin-top:34px"><div>
  <p class="body">No document in force matches <b>{s3['docNumber']}</b>. One superseded document carries this number:</p>
  <div class="supcard" style="margin-top:20px">
    <div class="hd"><span>Withdrawn, not in force</span><span>{s3['docNumber']} · Rev {s3['revision']}</span></div>
    <h2 class="t2">Superseded. Do not use.</h2>
    <p class="nm">{s3['title']} · {segname(s3['segment'])}</p>
    <p class="body">This document exists, but the matching revision is superseded. The register names <b>{s3['supersededBy']}</b> as its replacement but holds no record of it here. Verify the current revision in SCORE before use.</p>
    <div class="acts" style="margin-top:18px"><a class="btn" href="document-superseded.html">Open the record</a></div>
  </div>
  <p class="small" style="margin-top:18px">Only a full number shows a superseded or withdrawn document. A partial number such as SOP-003 lists documents in force only.</p>
</div><aside class="aside"><p class="lab">Why this card is red</p><p class="body" style="margin-top:10px">Old numbers live on in printed job packs and QR codes. RISE catches them here instead of saying “no results”, so nobody works from a revision that is no longer in force.</p></aside></div>'''
page('search-superseded.html', 'RISE · Search · superseded number', sup, 'search')

# ── 6 · no results ──────────────────────────────────────────────────────
none = f'''<header class="phead" style="padding-bottom:6px"><div class="meta"><span class="lab">Search the register</span><span class="lab"><b>0</b> documents match</span></div></header>
{qline('isolate a pump')}
<div class="g84" style="margin-top:6px"><div>
  <div class="empty"><h2 class="t2">No documents found<br><span class="m">for “isolate a pump”.</span></h2>
  <p class="body">Search matches the whole phrase in titles and numbers. Try a shorter term, check the document number, or clear the filters.</p>
  <div class="acts" style="margin-top:20px"><a class="btn" href="#">Search “pump”</a><a class="btn ghost" href="search.html">Clear search</a></div></div>
  <p class="grph"><b>“pump” would find</b><span>{len(search("pump"))}</span></p>
  <div class="reg sr">{"".join(srow(r) for r in search("pump"))}</div>
</div><aside class="aside"><p class="lab">Still stuck</p>
  <p class="body" style="margin-top:10px">Ask the people who own the procedures. Choose the area and your question goes to its expert.</p>
  <div class="acts" style="margin-top:16px"><a class="btn pri" href="ask.html">Ask an Expert</a></div>
  <p class="small" style="margin-top:14px">Looking for a word like <b>PTW</b> or <b>SIMOPS</b>? It is in the <a class="lnk" href="glossary.html">Field Glossary</a>.</p></aside></div>'''
page('search-none.html', 'RISE · Search · no results', none, 'search')

# ── 7 · filters (dialog on desktop, sheet on phone): the four real filters ──
fsheet = f'''<div class="scrim"></div><section class="dlg" aria-label="Filters"><p class="lab" style="display:flex;justify-content:space-between"><span>Filters</span><span>{len(res)} results</span></p>
  <label class="f"><span class="lab">Area</span><div class="in">All areas<span class="car">▾</span></div><span class="hint">25 areas, A to Z</span></label>
  <label class="f"><span class="lab">Type</span><div class="in">All types<span class="car">▾</span></div></label>
  <div class="f"><span class="lab">Status</span><div class="opt on"><span class="rd"></span><span><b>All in force</b></span><span class="code">{len(res)}</span></div><div class="opt"><span class="rd"></span><span><b>Published</b></span></div><div class="opt"><span class="rd"></span><span><b>Your drafts</b><small>Documents you filed that are not approved yet</small></span></div></div>
  <div class="f"><span class="lab">Issued</span><div class="g66" style="column-gap:12px"><div class="in ph">From</div><div class="in ph">To</div></div></div>
  <div class="acts"><a class="btn ghost" href="#">Clear all filters</a><a class="btn pri" href="search-results.html">Show {len(res)} results</a></div></section>'''
page('search-filters.html', 'RISE · Search · filters', results, 'search', overlays=fsheet)

# ── 8 · QMS sees restricted and confidential results (Employee sees none of them, not even a count) ──
QR = search('pressure', 'qms')
rowsq = ''.join(srow(r, 'qms') for r in QR)
qms = f'''<header class="phead" style="padding-bottom:6px"><div class="meta"><span class="lab">Search the register · QMS</span><span class="lab"><b>{len(QR)}</b> documents in force match</span></div></header>
{qline('pressure')}
{fbar(sort=False)}
<div class="g84 sr" style="margin-top:6px"><div>
  {note("lock", f"<b>Classification decides what is listed.</b> QMS and auditors see every class. A Segment Director sees internal and confidential. An Employee sees internal only, and never a hint that more exist: {len(res)} results, not {len(QR)}.")}
  <p class="grph"><b>Best match first</b><span>{len(QR)}</span></p><div class="reg">{rowsq}</div>
</div><aside class="aside"><p class="lab">Same search, three roles</p>
  {kv([("Employee", f"{len(res)} results", "", "internal"), ("Segment Director", f"{len(search('pressure', 'owner'))} results", "", "internal · confidential"), ("QMS · Auditor", f"{len(QR)} results", "", "every class")], 'c1')}</aside></div>'''
page('search-qms.html', 'RISE · Search · QMS view', qms, 'search', role='qms')
print('search', len(res), len(QR), len(wi3))
