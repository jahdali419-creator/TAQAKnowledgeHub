"""Builds the RISE Design Directions catalogue (A4 landscape) as HTML.
Render to PDF with render.js. Content uses only the real register figures in ../content.md."""
import html, os
HERE = os.path.dirname(os.path.abspath(__file__))
R2 = '../round-2/shots/'
CI = 'img/'
e = html.escape

D = [
 dict(k='a', name='Instrument', short='A precise work tool, built around the document register.', rnd=1,
  idea='A precise work tool. The document register is the hero: a calm app with a side menu, dense tables and the same layout for every role.',
  why=['The fastest way to scan many documents and check their status.',
       'Handles the heaviest work (QMS checks, approvals, audits) without new screens.',
       'Every role sees the same layout, so training is simple.'],
  watch=['The quietest brand of the six: little emotion, no photography.',
         'Heavier on the phone than the round 2 directions.'],
  phones=['home', 'document'], desks=[('browse', 'Coiled Tubing area'), ('viewer', 'Document'), ('upload', 'Filing a revision'), ('qms', 'QMS check (concept)')]),
 dict(k='b', name='Flagship', short='A premium flagship product with large type and TAQA field photography.', rnd=1,
  idea='RISE as TAQA\'s flagship product: WHAT WE KNOW. set large, deep ink bands and real TAQA field photography, like a premium annual report.',
  why=['The strongest sense of pride and the most premium first impression.',
       'One big idea per screen, so pages are easy to read.',
       'Uses the logo\'s own colours and shapes throughout.'],
  watch=['Shows fewer documents per screen.',
         'Could drift towards a marketing website if the style spreads.'],
  phones=['home', 'document'], desks=[('browse', 'Coiled Tubing area'), ('viewer', 'Document'), ('upload', 'Filing a revision'), ('qms', 'QMS check (concept)')]),
 dict(k='c', name='Atlas', short='A calm reference library that makes every document\'s status and history clear.', rnd=1,
  idea='A reference library. Every document has a place, a code and a history, presented with the clarity of a technical publisher.',
  why=['The best reading experience and the clearest proof that a document is current.',
       'The approval history reads like a family tree, which builds trust.',
       'Teaches people the document numbering system as they use it.'],
  watch=['A quieter brand moment; it relies on typography.',
         'Less dense than Instrument for heavy QMS work.'],
  phones=['home', 'document'], desks=[('browse', 'Coiled Tubing area'), ('viewer', 'Document'), ('upload', 'Filing a revision'), ('qms', 'QMS check (concept)')]),
 dict(k='d', name='Beacon', short='Dark and dramatic: the logo\'s colours are the only light on the screen.', rnd=2,
  idea='RISE as a lit signal. The deep ink of the logo is the background, and the logo\'s own colours are the only light. The logo assembles on screen when the app opens.',
  why=['The strongest first impression of the six.',
       'The phone home shows only three things: search, the critical alert and the last document opened.',
       'Calm and very legible in control cabins and on night shifts.'],
  watch=['Dark screens are harder to read in direct sunlight on site.',
         'Long procedures switch to a light page for reading.'],
  moment=['100', '260', '420', '1000'], moment_label='The logo assembles in 0.7 seconds, once per session',
  phones=['entrance', 'home', 'search', 'area', 'document', 'upload', 'workspace', 'ask', 'glossary']),
 dict(k='e', name='Full Stop', short='Light and typographic, with the orange full stop as the only accent.', rnd=2,
  idea='Typography does the work. One typeface on warm paper, and the orange full stop from WHAT WE KNOW. is the only accent in the whole product.',
  why=['The calmest, most readable screens of the six.',
       'The orange dot marks what matters: the active tab, alerts, new notifications.',
       'Trust is written in plain sentences: "Current. Approved 28 Aug 2025 by Segment Director, Coiled Tubing."'],
  watch=['The brand depends on the TAQA typeface loading correctly.',
         'Some may find the first screen too empty.'],
  moment=['60', '200', '380', '1000'], moment_label='WHAT WE KNOW. builds on the home screen, no splash screen',
  phones=['home', 'search', 'area', 'document', 'upload', 'workspace', 'ask', 'glossary']),
 dict(k='f', name='Rise', short='The logo becomes the interface: colour tiles with the logo\'s 45° cut.', rnd=2,
  idea='The logo becomes the interface. The teal pillar is the header (a side rail on desktop), the orange and cyan bars become colour tiles, and every tile carries the logo\'s 45° cut.',
  why=['The most recognisable brand of the six, on every screen.',
       'Big, glove-friendly buttons for field use.',
       'Each colour has one job: orange means alert, cyan means action.'],
  watch=['Colour blocks are loud; the "orange means alert" rule must be strict.',
         'Tiles show fewer items, so busy screens switch to lists.'],
  moment=['120', '300', '480', '1000'], moment_label='The screen rises into the logo in 0.7 seconds, once per session',
  phones=['entrance', 'home', 'search', 'area', 'document', 'upload', 'workspace', 'ask', 'glossary']),
]
LBL = dict(entrance='Opening', home='Home', search='Search', area='Area', document='Document', upload='Filing',
           workspace='QMS check', ask='Ask an Expert', glossary='Glossary')
DLBL = dict(home='Home', search='Search results', area='Coiled Tubing area', document='Document',
            upload='Filing a revision', workspace='QMS check (concept)', ask='Ask an Expert', glossary='Field Glossary')

def ph(o, p):
    return (R2 if o['rnd'] == 2 else CI) + f"{o['k']}-{p}-phone.jpg"
def dk(o, p):
    return (R2 if o['rnd'] == 2 else CI) + f"{o['k']}-{p}-desktop.jpg"

pages = []
def page(body, label='', cls=''):
    pages.append((body, label, cls))

# ---------- cover
cover_strip = ''.join(f'<div class="cv-ph"><img src="{ph(o, "home")}" alt=""><span>{o["name"]}</span></div>' for o in D)
page(f'''
<div class="cv-top"><img class="cv-logo" src="../kit/brand/rise-logo-reverse.png" alt="RISE. What we know."></div>
<div class="cv-text">
  <p class="eyebrow inv">Design review · October 2026</p>
  <h1>Six design directions for RISE<span class="fs"></span></h1>
  <p class="cv-sub">How TAQA's controlled-document and field-knowledge platform could look and feel, on the phone and on the desktop.</p>
</div>
<div class="cv-strip">{cover_strip}</div>
<p class="cv-foot">Prepared by TAQA Learning Center · For review · Not yet built</p>
''', cls='cover')

# ---------- intro
page('''
<div class="two">
  <div>
    <p class="eyebrow">About this catalogue</p>
    <h2>What RISE is, and what we need to decide<span class="fs"></span></h2>
    <p class="lead">RISE is where about 5,000 TAQA employees find the current, approved version of every procedure, manual, standard and technical alert before they start a job. It is also where documents are filed, checked by QMS and approved.</p>
    <p>The system already works. This catalogue is about how it should look and feel, so that it is trusted in the field, easy to use on a phone, and clearly a TAQA product.</p>
    <p>We explored six directions in two rounds. Every direction shows the same real RISE content, so the comparison is about design, not data.</p>
  </div>
  <div>
    <div class="facts">
      <div><b>520</b><span>documents in force</span></div>
      <div><b>25</b><span>areas across the company</span></div>
      <div><b>33</b><span>active technical alerts</span></div>
      <div><b>~5,000</b><span>employees, field and office</span></div>
    </div>
    <div class="rounds">
      <div><p class="tag">Round 1 · A, B, C</p><p>Desktop-first, premium product directions. Feedback: too dense for a phone, and the RISE brand should stand out more.</p></div>
      <div><p class="tag">Round 2 · D, E, F</p><p>Designed for the phone first, with fewer elements per screen and a strong, distinctive RISE brand moment. Each then scales up to the desktop.</p></div>
    </div>
    <p class="note">Nothing in the live RISE system has been changed. All existing functions and business rules (approvals, QMS checks, separation of duties, Arabic translations) are kept in every direction.</p>
  </div>
</div>
''', 'Introduction')

# ---------- at a glance
cells = ''.join(f'''<div class="gl">
  <div class="gl-h"><span class="lt">{o["k"].upper()}</span><div><b>{o["name"]}</b><span>Round {o["rnd"]}</span></div></div>
  <div class="gl-img"><img class="gl-ph" src="{ph(o, "home")}" alt=""><img class="gl-dk" src="{dk(o, "home")}" alt=""></div>
  <p>{e(o["short"])}</p>
</div>''' for o in D)
page(f'''<p class="eyebrow">At a glance</p><h2 class="h2s">The six directions, home screen on the phone and on the desktop</h2><div class="glance">{cells}</div>''', 'At a glance')

# ---------- direction pages
for o in D:
    lab = f'Round {o["rnd"]} · {o["k"].upper()} · {o["name"]}'
    why = ''.join(f'<li>{e(x)}</li>' for x in o['why'])
    watch = ''.join(f'<li>{e(x)}</li>' for x in o['watch'])
    if o['rnd'] == 2:
        film = ''.join(f'<figure><img src="{R2}{o["k"]}-moment-{t}.jpg" alt=""><figcaption>{"done" if t == "1000" else str(int(t)/1000) + " s"}</figcaption></figure>' for t in o['moment'])
        lower = f'''<div class="low"><figure class="lp"><img src="{ph(o, "home")}" alt=""><figcaption>Home on the phone</figcaption></figure>
          <div class="film-w"><p class="cap">Brand moment · {e(o["moment_label"])}</p><div class="film">{film}</div></div></div>'''
    else:
        lower = '<div class="low">' + ''.join(f'<figure class="lp"><img src="{ph(o, p)}" alt=""><figcaption>{LBL[p]} on the phone</figcaption></figure>' for p in o['phones']) + '<p class="r1note">Round 1 was designed for the desktop first. Feedback on this round led to directions D, E and F.</p></div>'
    page(f'''
<div class="dir">
  <div class="dir-txt">
    <p class="eyebrow">{lab}</p>
    <div class="dir-name"><span class="lt big">{o["k"].upper()}</span><h2>{o["name"]}</h2></div>
    <p class="lead">{e(o["idea"])}</p>
    <h4>Why it works</h4><ul class="why">{why}</ul>
    <h4>Watch out for</h4><ul class="watch">{watch}</ul>
  </div>
  <div class="dir-img">
    <figure class="hero-dk"><img src="{dk(o, "home")}" alt=""><figcaption>Home on the desktop</figcaption></figure>
    {lower}
  </div>
</div>''', lab)
    if o['rnd'] == 1:
        grid = ''.join(f'<figure><img src="{CI}{o["k"]}-{p}-desktop.jpg" alt=""><figcaption>{t}</figcaption></figure>' for p, t in o['desks'])
        page(f'<p class="eyebrow">{lab}</p><h2 class="h2s">Key screens on the desktop</h2><div class="g22">{grid}</div>', lab)
    else:
        prow = ''.join(f'<figure><img src="{ph(o, p)}" alt=""><figcaption>{LBL[p]}</figcaption></figure>' for p in o['phones'] if p != 'entrance')
        d3 = ''.join(f'<figure><img src="{dk(o, p)}" alt=""><figcaption>{DLBL[p]}</figcaption></figure>' for p in ['document', 'upload', 'workspace'])
        page(f'<p class="eyebrow">{lab}</p><h2 class="h2s">The eight key screens on the phone</h2><div class="prow">{prow}</div><h3 class="h3s">And on the desktop</h3><div class="g3">{d3}</div>', lab)
        g = ''.join(f'<figure><img src="{dk(o, p)}" alt=""><figcaption>{DLBL[p]}</figcaption></figure>' for p in ['search', 'area', 'ask', 'glossary'])
        page(f'<p class="eyebrow">{lab}</p><h2 class="h2s">More desktop screens</h2><div class="g22">{g}</div>', lab)

# ---------- comparison
rows = [
 ('Look and feel', ['Precise work tool', 'Premium flagship, photography', 'Reference library', 'Dark, the logo glows', 'Light, typographic, calm', 'Bold colour blocks']),
 ('Brand presence', ['Quiet', 'Very strong', 'Moderate', 'Very strong', 'Strong but subtle', 'Strongest']),
 ('On the phone', ['Works, but dense', 'Good, long pages', 'Good', 'Excellent, very few elements', 'Excellent, the calmest', 'Excellent, big buttons']),
 ('Brand moment', ['None', 'Large statement and photo', 'Typographic masthead', 'Logo assembles on opening', 'Statement builds on home', 'Screen rises into the logo']),
 ('Strongest at', ['Heavy QMS and audit work', 'Pride and first impression', 'Reading and trust', 'First impression, night shifts', 'Reading and trust', 'Field use with gloves']),
 ('Best suited to', ['QMS, directors, auditors', 'Company-wide pride', 'Everyone who reads procedures', 'Field crews, control rooms', 'Everyone, on any device', 'Field crews with gloves']),
 ('Main risk', ['Feels like generic software', 'Fewer documents per screen', 'Can look plain', 'Glare in direct sun', 'Can feel empty', 'Needs strict colour rules']),
]
th = ''.join(f'<th><span class="lt">{o["k"].upper()}</span>{o["name"]}<small>Round {o["rnd"]}</small></th>' for o in D)
tb = ''.join('<tr><th scope="row">' + r + '</th>' + ''.join(f'<td>{e(c)}</td>' for c in cs) + '</tr>' for r, cs in rows)
page(f'<p class="eyebrow">Comparison</p><h2 class="h2s">The six directions side by side</h2><table class="cmp"><thead><tr><th></th>{th}</tr></thead><tbody>{tb}</tbody></table>', 'Comparison')

# ---------- decision
page('''
<div class="two">
  <div>
    <p class="eyebrow">Decision</p>
    <h2>What we are asking for<span class="fs"></span></h2>
    <p class="lead">Choose one direction to take forward, or a combination of two (for example the calm typography of Full Stop with the opening moment of Beacon).</p>
    <h4>A simple way to choose</h4>
    <ul class="choose">
      <li><b>If field use on the phone comes first</b><span>Rise (F) or Full Stop (E)</span></li>
      <li><b>If brand pride and first impression come first</b><span>Beacon (D) or Flagship (B)</span></li>
      <li><b>If reading and trust in documents come first</b><span>Full Stop (E) or Atlas (C)</span></li>
      <li><b>If heavy QMS and audit work comes first</b><span>Instrument (A)</span></li>
    </ul>
  </div>
  <div>
    <h4 style="margin-top:28mm">What happens next</h4>
    <ol class="steps">
      <li><b>Complete the chosen design</b><span>The remaining screens: Director approvals, Master Document List, the full filing steps and every document status.</span></li>
      <li><b>Agree an implementation plan</b><span>Scope, timing and testing, presented for approval before any build starts.</span></li>
      <li><b>Build and test with field users</b><span>On real phones, on site, before release.</span></li>
    </ol>
    <p class="note">Until a direction and a plan are approved, nothing changes in the live RISE system.</p>
  </div>
</div>
''', 'Decision')

# ---------- assemble
out = []
n = len(pages)
for i, (body, label, cls) in enumerate(pages, 1):
    chrome = '' if cls == 'cover' else f'''<header class="ph"><img src="../kit/brand/rise-lockup-header.png" alt="RISE"><span>{e(label)}</span></header>
<footer class="pf"><span>RISE Design Directions · October 2026</span><span>{i} / {n}</span></footer>'''
    out.append(f'<section class="page {cls}">{chrome}<div class="pc">{body}</div></section>')

css = open(os.path.join(HERE, 'catalog.css')).read()
doc = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>RISE Design Directions</title>
<link rel="stylesheet" href="../kit/fonts.css"><style>{css}</style></head>
<body>
{''.join(out)}
</body></html>'''
open(os.path.join(HERE, 'rise-design-catalog.html'), 'w').write(doc)
print(n, 'pages')
