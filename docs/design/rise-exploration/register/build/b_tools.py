"""Knowledge tools: Field Glossary (glossary.html on main, 254 terms, 11 categories) and Ask an Expert (support-ticket.html).
Glossary target BD-06: propose → Pending Review → SME decides → published. Ask target BD-04: QMS triages; “Sent” only after M365 confirms.
Both targets are drawn and labelled PROPOSED; the built behaviour is drawn too."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from reg import *

CATL = {'drilling': 'Drilling', 'wellcontrol': 'Well Control', 'production': 'Production', 'safety': 'Safety &amp; HSE', 'engineering': 'Engineering',
        'logging': 'Logging &amp; Reservoir', 'commercial': 'Commercial', 'maintenance': 'Maintenance', 'hr': 'Human Resources', 'cybersecurity': 'Cybersecurity', 'doccontrol': 'Document Control'}
G = [dict(g, abbr=g.get('abbr', g.get('term')), full=g.get('full', ''), word='term' in g) for g in GLOSS]
CNT = {k: sum(g['cat'] == k for g in G) for k in CATL}
LET = sorted({g['abbr'][0].upper() for g in G})
ALSO = {}
for g in G:
    ALSO.setdefault(g['abbr'], []).append(g)

def term(g, open_=False, q=''):
    nm = (f'<b>{g["abbr"]}</b><span>{g["full"]}</span>' if not g['word'] else f'<b class="w">{g["abbr"]}</b><span></span>')
    notes = ''
    others = [o for o in ALSO[g['abbr']] if o is not g]
    if others: notes += ''.join(f'<li>Also: {o["full"]} ({CATL[o["cat"]]})</li>' for o in others)
    if g.get('src'): notes += f'<li>Source: API {g["src"]}</li>'
    body = (f'<div class="gx"><p>{g["def"]}</p><p class="cat">{CATL[g["cat"]]}</p>{f"<ul>{notes}</ul>" if notes else ""}</div>' if open_ else '')
    return f'<div class="gt{" on" if open_ else ""}"><a href="glossary-term.html" class="gh">{nm}<em>{CATL[g["cat"]]}</em><i>{"−" if open_ else "+"}</i></a>{body}</div>'

def ghead(val=None, ph='BOP, CT, ROP, WOB…'):
    q = (f'<div class="q md"><span class="val">{val}</span><span class="caret"></span><a class="clr" href="glossary.html">Clear</a></div>' if val
         else f'<div class="q md"><span class="w">Look up</span><span class="caret"></span><span class="ph">{ph}</span></div>')
    return f'''<header class="phead" style="padding-bottom:4px"><div class="meta"><span class="lab">Field Glossary</span><span class="lab"><b>254</b> terms · <b>11</b> categories</span></div>
  <h1 class="t1">Know the language. <span class="m">Work with confidence.</span></h1></header>
  {q}'''

cats = '<nav class="fbar" style="margin-top:20px"><span>Field</span><a class="on" href="glossary.html">All <b>254</b></a>' + ''.join(f'<a href="#">{v} <b>{CNT[k]}</b></a>' for k, v in CATL.items()) + '</nav>'
rail = '<nav class="az" aria-label="Jump to letter">' + ''.join(f'<a href="#"{" class=on" if c == "B" else ""}>{c}</a>' if c in LET else f'<span>{c}</span>' for c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') + '</nav>'
def grp(c, open_abbr=None):
    ts = sorted([g for g in G if g['abbr'][0].upper() == c], key=lambda g: g['abbr'].lower())
    return f'<p class="grph"><b>{c}</b><span>{len(ts)} terms</span></p><div class="glist">' + ''.join(term(g, g['abbr'] == open_abbr) for g in ts) + '</div>'
gside = f'''<aside class="aside">{sech('Missing a term?')}<p class="body" style="margin-top:12px">Propose an abbreviation your crew uses. A subject matter expert reviews it before it joins the shared glossary.</p>
  <div class="acts" style="margin-top:16px"><a class="btn pri" href="glossary-propose.html">Propose a term</a></div>
  {sech('Your proposals', 1)}<div class="mini"><a href="glossary-propose.html"><b>WBHP · Wellbore Hydrostatic Pressure</b><span>Pending review · Well Control</span></a></div>
  <p class="small" style="margin-top:12px"><span class="prop" style="margin-left:0">proposed</span> Built today: “Add a term” saves to this device only, with no review.</p></aside>'''

idx = f'''{ghead()}{cats}
<div class="g84" style="margin-top:20px"><div class="gwrap">{rail}<div>
  <p class="small" style="margin:6px 0 0">254 terms</p>{grp("A")}{grp("B", "BOP")}</div></div>{gside}</div>'''
page('glossary.html', 'RISE · Field Glossary', idx, 'glossary', dock_active='more')

# search “WI”: exact abbreviation first, then starts-with
q = 'wi'
ex = [g for g in G if g['abbr'].lower() == q]
sw = sorted([g for g in G if g['abbr'].lower().startswith(q) and g not in ex], key=lambda g: g['abbr'])
sr = f'''{ghead('WI')}{cats.replace(' class="on" href="glossary.html">All', ' href="glossary.html">All')}
<div class="g84" style="margin-top:20px"><div>
  <p class="small">{len(ex) + len(sw)} terms matching “WI”</p>
  <p class="grph"><b>Exact abbreviation</b><span>{len(ex)}</span></p><div class="glist">{"".join(term(g, True) for g in ex)}</div>
  <p class="grph"><b>Starts with “wi”</b><span>{len(sw)}</span></p><div class="glist">{"".join(term(g) for g in sw)}</div>
</div>{gside}</div>'''
page('glossary-search.html', 'RISE · Field Glossary · WI', sr, 'glossary', dock_active='more')

none = f'''{ghead('WBHP')}
<div class="g84" style="margin-top:6px"><div><div class="empty"><h2 class="t2">No term matches <span class="m">“WBHP”.</span></h2>
  <p class="body">Check the spelling or try the full name. If your crew uses it, propose it for the glossary.</p>
  <div class="acts" style="margin-top:20px"><a class="btn pri" href="glossary-propose.html">Propose “WBHP”</a><a class="btn ghost" href="glossary.html">Show all terms</a></div></div></div>{gside}</div>'''
page('glossary-none.html', 'RISE · Field Glossary · no match', none, 'glossary', dock_active='more')

bop = next(g for g in G if g['abbr'] == 'BOP')
docs = search('BOP')
termp = f'''<header class="phead"><div class="meta"><span class="crumb">{crumbs(("Field Glossary", "glossary.html"), ("Well Control", None), ("BOP", None))}</span><span class="lab">Well Control</span></div>
  <h1 class="t0">BOP <span class="m">Blowout Preventer</span></h1></header>
<div class="g84"><div>
  <p class="lede">{bop["def"]}</p>
  {sech('Related terms', 2)}<div class="glist">{"".join(term(g) for g in G if g["abbr"] in ("BOPE", "BHA"))}</div>
  {sech('Documents with “BOP” in the title', len(docs), 'Search the register', 'search.html')}
  <div class="reg sr">{"".join(row(r["docNumber"], r["title"], segname(r["segment"]), "Rev " + r["revision"], st_for(r), None, "#", " hot" if status_of(r) == "alt" else "") for r in docs)}</div>
</div><aside class="aside">{sech('About this entry')}{kv([("Field", "Well Control"), ("Source", "TAQA glossary"), ("Shown as", "Abbreviation")], 'c1')}
  <p class="small" style="margin-top:12px"><span class="prop" style="margin-left:0">proposed</span> Related terms and the document link are new; the built glossary shows the definition and notes only.</p></aside></div>'''
page('glossary-term.html', 'RISE · BOP', termp, 'glossary', dock_active='more')

prop = f'''<div class="scrim"></div><section class="dlg" role="dialog" aria-label="Propose a term"><p class="lab">Propose a term <span class="prop">proposed flow · BD-06</span></p>
  <h2 class="t2" style="margin-top:10px">Missing an abbreviation your crew uses?</h2><p class="small" style="margin-top:8px">A subject matter expert reviews it. You see its status under Your proposals.</p>
  <div class="g66" style="column-gap:14px"><label class="f"><span class="lab">Abbreviation *</span><span class="in">WBHP</span></label><label class="f"><span class="lab">Full name *</span><span class="in">Wellbore Hydrostatic Pressure</span></label></div>
  <label class="f"><span class="lab">Definition</span><span class="in ta ph">What it means on site, in one or two sentences</span></label>
  <label class="f"><span class="lab">Field</span><span class="in">Well Control<span class="car">▾</span></span></label>
  <div class="acts"><a class="btn" href="glossary.html">Cancel</a><a class="btn pri" href="glossary.html">Send for review</a></div></section>'''
page('glossary-propose.html', 'RISE · Field Glossary · propose', idx, 'glossary', dock_active='more', overlays=prop)

# ── Ask an Expert ────────────────────────────────────────────────────────
def sect(n, title, inner, opt=False):
    return f'<section class="fs"><p class="fsn"><b>{n}</b><span>{title}</span>{"<em>Optional</em>" if opt else ""}</p>{inner}</section>'
URG = [('Critical', 'Stopped, or a safety risk.', '2 hours'), ('High', 'Impacted, needs a workaround.', '4 hours'), ('Medium', 'Continuing with the issue.', '1 business day'), ('Low', 'No impact on operations.', '3 business days')]
def urgency(on='Medium'):
    pills = ''.join(f'<a class="ug{" on" if u == on else ""}{" crit" if u == "Critical" else ""}" href="{"ask-critical.html" if u == "Critical" else "ask.html"}"><b>{u}</b><small>{h}</small></a>' for u, h, _ in URG)
    tgt = dict((u, t) for u, _, t in URG)[on]
    warn = note('al', '<b>This form is not an emergency channel.</b> If anyone is in danger or a hazard is uncontrolled, stop work and follow your site emergency response procedure. Contact your supervisor or site HSE immediately.') if on == 'Critical' else ''
    return f'<div class="ups">{pills}</div><p class="small" style="margin-top:10px">Target reply <b>{tgt}</b></p>{warn}'
def ask_form(errors=False, urg='Medium', photos=False):
    e = lambda m: f'<span class="err">{m}</span>' if errors else ''
    s1 = sect(1, 'Who you are asking', f'''<label class="f"><span class="lab">Area *</span><span class="in">Coiled Tubing<span class="car">▾</span></span><span class="hint">Your question goes to the expert for this area.</span></label>
      <div class="seg" style="margin-top:12px"><a class="on" href="#">Operations</a><a href="#">Maintenance</a></div>
      <div class="rcard"><span class="lab">Your question goes to</span><b>Coiled Tubing Expert</b><small>CT Operations · Stimulation</small></div>''')
    s2 = sect(2, 'The problem', f'''<label class="f"><span class="lab">Title *</span><span class="in{" bad ph" if errors else " ph"}">e.g. Pressure drop on pump unit 3</span>{e("Give the problem a short title.")}</label>
      <label class="f"><span class="lab">What is happening? *</span><span class="in ta">Pressure held at 3,200 psi then dropped to 900 over two minutes.</span><span class="hint">Readings, alarms or what you can see. Numbers help most.</span></label>
      <label class="f"><span class="lab">Category *</span><span class="in">Equipment Troubleshooting<span class="car">▾</span></span></label>
      <details class="fold" style="margin-top:18px"><summary>Add detail <span>Optional · gets you a better answer</span></summary></details>''')
    s3 = sect(3, 'Urgency', urgency(urg))
    ph = ('''<div class="anno"><div class="cv"><span class="mark r"></span><span class="mark a"></span><span class="lab">IMG_2041.HEIC</span></div>
      <div class="tools"><span class="lab">Tool</span><a class="on">Rectangle</a><a>Circle</a><a>Arrow</a><a>Freehand</a><span class="lab">Colour</span><a class="sw red on"></a><a class="sw yel"></a><a class="sw grn"></a><a class="sw blu"></a><a class="sw wht"></a><a>Thin</a><a class="on">Thick</a><a>Undo</a><a>Clear</a></div>
      <p class="small">Draw on the photo to mark the problem area. Each photo keeps its own marks; switch between them with the thumbnails.</p><div class="thumbs"><i class="on"></i><i></i><a>+</a></div></div>'''
          if photos else '<div class="drop" style="padding:26px"><b>Add photos</b><p class="small" style="margin-top:6px">Up to 5 photos (JPG, PNG or HEIC, 10 MB each). Mark them up once added.</p></div>')
    s4 = sect(4, 'Photos', ph, True)
    s5 = sect(5, 'You', '''<div class="who"><span class="av">FA</span><span><b>Faisal Al-Ghamdi</b><small>Employee · from your TAQA sign-in. Name, employee ID and email come across with the ticket.</small></span></div>
      <label class="f"><span class="lab">Mobile or radio</span><span class="in ph">+966 5.. .. or Channel 4</span><span class="hint">Only used if the answer cannot wait for email.</span></label>''')
    return s1 + s2 + s3 + s4 + s5 + '''<div class="acts" style="margin-top:28px"><a class="btn pri" href="ask-result.html">Send to Expert</a><a class="btn ghost" href="home.html">Cancel</a></div>
      <p class="small" style="margin-top:12px">Preview: no ticket system is connected yet, so nothing on this page is sent to an expert.</p>'''
experts = [('Coiled Tubing Expert', 'CT Operations · Stimulation'), ('Drilling Expert', 'Drilling · Well Control'), ('Safety Services Expert', 'Safety Critical · BOP Systems'),
           ('QHSE Expert', 'Quality · HSE · Compliance'), ('Segment Maintenance', 'The Maintenance Manager of each operational segment'), ('All Segment Experts', 'Fracturing, Wireline, Cementing and more')]
ask_aside = f'''<aside class="aside"><div class="sticky">{sech('Tips and response times')}
  {kv([(u, t, '', h) for u, h, t in URG], 'c2')}<p class="small" style="margin-top:8px">Target response times, once a ticket system is connected.</p>
  <ul class="tips"><li>Be specific about measurements: pressures, depths, rates.</li><li>Add a clear photo and circle or arrow the problem.</li><li>List what you have already tried.</li><li>Critical is for work stopped or a safety risk; this form is not an emergency channel.</li></ul>
  {sech('Segment experts')}<p class="small" style="margin-top:8px">Choose one to set the area.</p><div class="mini">{"".join(f'<a href="#"{" class=sel" if i == 0 else ""}><b>{a}</b><span>{b}</span></a>' for i, (a, b) in enumerate(experts))}</div></div></aside>'''
def ask_page(name, **kw):
    body = f'''<header class="phead"><div class="meta"><span class="lab">Ask an Expert</span><span class="lab">A draft is kept on this device as you type</span></div>
  <h1 class="t1">Ask an Expert</h1><p class="sub">Stuck on a technical problem in the field? Send it to the TAQA expert for your area, mark up a photo if it helps, and get a direct answer.</p></header>
<div class="g84"><div class="askf">{ask_form(**kw)}</div>{ask_aside}</div>'''
    page(name, 'RISE · Ask an Expert', body, 'ask', dock_active='more')
ask_page('ask.html')
ask_page('ask-critical.html', errors=True, urg='Critical')
ask_page('ask-photo.html', photos=True)

def result(sent=False):
    if sent:
        top = f'''<p class="lab">Ask an Expert · <span class="prop" style="margin-left:0">proposed · BD-04</span></p><h1 class="t0" style="margin-top:16px">Sent. <span class="m">QMS routes it to the right expert.</span></h1>
  <p class="body" style="margin-top:16px">Received by the TAQA ticket system on 06 Oct 2026, 11:20. You will get the answer by email, and here.</p>
  {kv([("Reference", "Issued by the ticket system on receipt"), ("Urgency", "Medium · target reply 1 business day"), ("Area", "Coiled Tubing · Operations"), ("Next", "QMS triage, then the technical SME")], 'c2')}'''
    else:
        top = f'''<p class="lab">Ask an Expert</p><h1 class="t0" style="margin-top:16px">Not sent.</h1>
  <p class="body" style="margin-top:16px">This preview has no connected ticket system. Your question was not sent.</p>
  <p class="body" style="margin-top:10px">Everything you entered is still in the form. Copy it to pass on through your usual channel.</p>
  <div class="acts" style="margin-top:22px"><a class="btn pri" href="#">Copy question</a><a class="btn" href="ask.html">Back to the form</a><a class="btn ghost" href="ask.html">Clear form</a></div>
  <div class="paper" style="margin-top:28px;padding:24px 28px"><p class="lab">Your question</p><p style="margin-top:10px;font:500 16px/1.5 var(--ui)">Coiled Tubing · Operations · Equipment Troubleshooting · Medium</p>
  <p style="margin-top:8px">Pressure held at 3,200 psi then dropped to 900 over two minutes.</p></div>'''
    body = f'<div class="refuse" style="max-width:820px">{top}</div>'
    page('ask-sent.html' if sent else 'ask-result.html', 'RISE · Ask an Expert · ' + ('sent' if sent else 'not sent'), body, 'ask', dock_active='more')
result(); result(True)
print('tools ok')
