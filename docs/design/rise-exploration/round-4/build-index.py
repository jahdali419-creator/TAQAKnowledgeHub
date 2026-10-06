"""Builds round-4/index.html: J, K and L compared screen by screen."""
import html, os
HERE = os.path.dirname(os.path.abspath(__file__))
e = html.escape

C = [
 dict(k='j', name='Clean Enterprise Product', nav='Left sidebar',
  philosophy='The interface steps back so the documents are the content. Near-white surfaces, hairlines instead of cards and precise typography; TAQA Teal marks only where you are and what you can do.',
  best='Search is the fastest to scan: a slim filter column with real counts and a clean results table grouped by type, with your area first.',
  weak='It is the quietest of the three, so TAQA identity rests on the logo, BW Gradual titles and the teal accent and could drift towards generic SaaS.',
  suited='Everyday use by the whole workforce, from technicians to QMS controllers, who need to find, check and open the right document quickly.',
  scores=[9, 9, 6]),
 dict(k='k', name='Technical Operations Hub', nav='Top bar + area tree',
  philosophy='RISE as the document-control desk for operations: every screen leads with your area, the state of the register and the trust facts of each document. Dense register tables on desktop, calm single-column lists on the phone, and colour used only for state.',
  best='The document-control band on WI-003 answers “is this the right, current document?” — status, revision, effective, next review, owner, approver, classification and the ALT-002 link — before the preview even loads.',
  weak='The density and full document numbers are powerful for daily users but can feel heavy for an occasional reader.',
  suited='Field supervisors, engineers and QMS users who check revisions, alerts and approvals every day and compare documents across areas.',
  scores=[8, 8, 8]),
 dict(k='l', name='Editorial Knowledge Platform', nav='Top navigation',
  philosophy='RISE as a quiet, authoritative publication: every page is composed like a section front, not a dashboard. Large light display type, strong document titles, cover-sheet previews and status stated in plain sentences.',
  best='Home leads with what matters today — the active alert and the exact section it changes — and the document page pairs a large cover with “Current: this is the revision to use”.',
  weak='Editorial spacing makes pages longer, so users who want many rows on screen scroll more than in a table-first design.',
  suited='Supervisors, engineers and managers who need to understand what changed and trust the document they open.',
  scores=[9, 8, 7]),
]
S = [('home', 'Home'), ('search', 'Search · “pressure test”'), ('area', 'Area · Coiled Tubing'), ('document', 'Document · WI-003')]
LBL = ['Visual maturity', 'Usability', 'TAQA / RISE identity']

def fig(o, p, v):
    cls = 'screen' if v == 'desktop' else 'phone'
    return f'<figure><a class="{cls}" href="{o["k"]}/{p}.html"><img src="shots/{o["k"]}-{p}-{v}.jpg" alt="{e(o["name"])}, {p}, {v}" loading="lazy" width="{1440 if v=="desktop" else 780}" height="{900 if v=="desktop" else 1688}"></a><figcaption><span class="lt">{o["k"].upper()}</span>{e(o["name"])}</figcaption></figure>'

screens = ''
for p, title in S:
    d = ''.join(fig(o, p, 'desktop') for o in C)
    m = ''.join(fig(o, p, 'phone') for o in C)
    screens += f'''<section class="scr" id="{p}">
  <div class="scr-h"><h2>{e(title)}</h2></div>
  <p class="row-l">Desktop · 1440 × 900</p><div class="row3 dk">{d}</div>
  <p class="row-l">Mobile · 390 × 844</p><div class="row3 mb">{m}</div>
</section>'''

def bar(v):
    return f'<span class="bar"><i style="width:{v*10}%"></i></span><b>{v}</b>'
cards = ''.join(f'''<article class="card">
  <header><span class="lt big">{o["k"].upper()}</span><div><h3>{e(o["name"])}</h3><p class="nav">{e(o["nav"])}</p></div></header>
  <h4>Design philosophy</h4><p>{e(o["philosophy"])}</p>
  <h4>Best feature</h4><p>{e(o["best"])}</p>
  <h4>Main weakness</h4><p>{e(o["weak"])}</p>
  <h4>Best suited for</h4><p>{e(o["suited"])}</p>
  <div class="scores">{''.join(f'<div class="sc"><span>{l}</span>{bar(v)}</div>' for l, v in zip(LBL, o["scores"]))}</div>
</article>''' for o in C)

css = open(os.path.join(HERE, 'index.css')).read()
doc = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>RISE Design Directions J K L</title>
<link rel="stylesheet" href="../kit/fonts.css">
<style>{css}</style>
</head>
<body>
<header class="wrap mast">
  <div class="mast-top"><img class="logo-l" src="../kit/brand/rise-lockup-header.png" alt="RISE" width="320" height="120"><img class="logo-d" src="../kit/brand/rise-lockup-header-reverse.png" alt="RISE" width="320" height="120"><span class="badge"><i></i>Design exploration · not implemented</span></div>
  <p class="eyebrow">Round 4 · Professional directions</p>
  <h1>Three realistic directions for RISE</h1>
  <p class="lede">J, K and L are polished, production-credible alternatives. Each takes a different design philosophy (navigation, density, typography, document presentation), and all three show the same real RISE content to the same Employee, with every existing function still reachable.</p>
  <div class="legend">{''.join(f'<a href="#cards"><span class="lt">{o["k"].upper()}</span><b>{e(o["name"])}</b><small>{e(o["nav"])}</small></a>' for o in C)}</div>
</header>
<nav class="tabs" aria-label="Screens"><div class="wrap"><a href="#home">Home</a><a href="#search">Search</a><a href="#area">Area</a><a href="#document">Document</a><a href="#cards">Assessment</a></div></nav>
<main class="wrap">
{screens}
<section class="plain" id="cards">
  <h2>The three directions</h2>
  <div class="cards">{cards}</div>
  <p class="note">Scores are the design team's first read, out of 10. No winner is declared. Nothing is implemented in the live RISE application.</p>
</section>
</main>
<footer class="wrap">RISE design exploration · round 4 · Built by TAQA Learning Center · branch design/rise-exploration</footer>
</body>
</html>'''
open(os.path.join(HERE, 'index.html'), 'w').write(doc)
print('ok')
