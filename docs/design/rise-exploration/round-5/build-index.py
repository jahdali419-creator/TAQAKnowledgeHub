"""Builds round-5/index.html: M, N and O, mobile first."""
import html, os
HERE = os.path.dirname(os.path.abspath(__file__))
e = html.escape

C = [
 dict(k='m', name='Smooth Product Experience', nav='Floating capsule tab bar · floating navigation panel on desktop',
  philosophy='A calm, carefully made app: soft tinted ground, large rounded surfaces and one clear job per region, with the rest one tap away. Trust appears as designed objects (a “Current · Rev 4.0” capsule and an approval card), not grey sentences.',
  better=['Each phone screen leads with one thing: a greeting and search, the best match, the area and its alerts, or the trust card.',
          'Interaction carries the structure: floating tab bar, segmented controls and a floating action bar on the document.',
          'Rows hold a title and one short line; access rules are said once instead of on every row.',
          'Real type contrast (large display titles, 17px body) and groups separated by space, not borders.'],
  mobile='The home first screen — greeting, search and a swipeable “For you” row with the active alert and WI-003 to continue — feels light, finished and easy to pick up.',
  desktop='A floating rounded navigation panel beside one large canvas gives desktop the same calm as the phone, with a three-card “For you” row and room to breathe.',
  weak='Its grouped, rounded look follows familiar app conventions closely, so it is the most polished but the least distinctive of the three.',
  scores=[8, 9, 9, 7]),
 dict(k='n', name='Structured Technical Clarity', nav='Persistent top search + 4-item bar · three-pane desktop',
  philosophy='A serious, calm instrument for people who need the right revision fast: crisp white, cool greys, teal for action and orange only for alerts. Every document gets an identity plate — number and revision set large, status as a signal with a shape, a word and a review-cycle gauge.',
  better=['Trust is visible in about two seconds: the identity plate, the green Current tile and a review-cycle bar with today marked.',
          'Its own component: a stacked code column (SOP over 005) that makes lists scannable the way field users say numbers.',
          'Search is always one tap away at the top of the phone; desktop becomes a real list-and-detail workspace.',
          'Facts are labelled rows and dated timelines instead of metadata strings.'],
  mobile='The WI-003 phone screen shows identity, revision, status, approver, review cycle and the ALT-002 §5 warning in the first view, with Open PDF one thumb-tap away.',
  desktop='Search becomes a three-pane workspace: results on the left, the selected document’s identity plate, record and preview on the right, without leaving the list.',
  weak='It is the coolest and most information-rich of the three, so occasional readers may find it slightly dense next to M and O.',
  scores=[8, 8, 8, 8]),
 dict(k='o', name='Refined Editorial Utility', nav='No tab bar · floating “Search RISE” pill · editorial masthead on desktop',
  philosophy='RISE reads like a calm, well-edited brief: each screen leads with one written answer, and everything else follows in a clear reading order. Documents are designed covers you recognise at a glance, and trust is said in one sentence instead of a metadata grid.',
  better=['No tab bar and no repeated row skeleton: home is a brief, the area is a contents page, the document is cover, trust sentence and reading index.',
          'Change is shown, not described: the ALT-002 cover linked to WI-003 §5, and §5 marked in the reading index.',
          'Secondary facts move into footnotes and disclosure; access rules and hidden results are said once.',
          'The strongest type contrast of the three: large display headlines and light date numerals with a 17px reading body.'],
  mobile='The home first screen is one idea, beautifully set: the headline, two covers linked by a thin rule to §5, one action, and search waiting at the thumb.',
  desktop='A centred editorial page with an asymmetric grid puts the brief beside “Your shelf” and your area, using the full width without a single dashboard tile.',
  weak='Pages are long on the phone, and destinations like Ask an Expert and the Glossary sit in the menu rather than in a tab bar.',
  scores=[8, 8, 7, 9]),
]
S = [('home', 'Home'), ('search', 'Search · “pressure test”'), ('area', 'Area · Coiled Tubing'), ('document', 'Document · WI-003')]
LBL = ['Global product readiness', 'Mobile elegance', 'Ease of use', 'Visual distinction']

def phone(o, p, t, n):
    return f'<figure><span class="num">{n}</span><a class="phone" href="{o["k"]}/{p}.html"><img src="shots/{o["k"]}-{p}-phone.jpg" alt="{e(o["name"])}, mobile {e(t)}" loading="lazy" width="780" height="1688"></a><figcaption>Mobile · {e(t)}</figcaption></figure>'
def desk(o, p, t, n):
    return f'<figure><span class="num">{n}</span><a class="screen" href="{o["k"]}/{p}.html"><img src="shots/{o["k"]}-{p}-desktop.jpg" alt="{e(o["name"])}, desktop {e(t)}" loading="lazy" width="1440" height="900"></a><figcaption>Desktop · {e(t)}</figcaption></figure>'
def bar(v):
    return f'<span class="bar"><i style="width:{v*10}%"></i></span><b>{v}</b>'

secs = ''
for o in C:
    ph = ''.join(phone(o, p, t, i + 1) for i, (p, t) in enumerate(S))
    dk = ''.join(desk(o, p, t, i + 5) for i, (p, t) in enumerate(S))
    better = ''.join(f'<li>{e(x)}</li>' for x in o['better'])
    sc = ''.join(f'<div class="sc"><span>{l}</span>{bar(v)}</div>' for l, v in zip(LBL, o['scores']))
    secs += f'''<section class="dir" id="{o["k"]}">
  <header class="d-head"><span class="lt big">{o["k"].upper()}</span><div><p class="eyebrow">Direction {o["k"].upper()}</p><h2>{e(o["name"])}</h2><p class="navl">{e(o["nav"])}</p></div></header>
  <div class="phones">{ph}</div>
  <div class="desks">{dk}</div>
  <div class="assess">
    <div class="a1">
      <h3>Design philosophy</h3><p class="phil">{e(o["philosophy"])}</p>
      <h3>What is better than the previous round</h3><ul class="better">{better}</ul>
    </div>
    <div class="a2">
      <h3>Best mobile quality</h3><p>{e(o["mobile"])}</p>
      <h3>Best desktop quality</h3><p>{e(o["desktop"])}</p>
      <h3>Main weakness</h3><p>{e(o["weak"])}</p>
      <div class="scores">{sc}</div>
    </div>
  </div>
</section>'''

seg = ''.join(f'<button type="button" data-k="{p}" aria-pressed="{"true" if p=="home" else "false"}">{e(t.split(" · ")[0])}</button>' for p, t in S)
cmpm = ''.join(f'<figure><span class="phone"><img data-o="{o["k"]}" data-v="phone" src="shots/{o["k"]}-home-phone.jpg" alt="{e(o["name"])} mobile" width="780" height="1688"></span><figcaption><span class="lt">{o["k"].upper()}</span>{e(o["name"])}</figcaption></figure>' for o in C)
cmpd = ''.join(f'<figure><span class="screen"><img data-o="{o["k"]}" data-v="desktop" src="shots/{o["k"]}-home-desktop.jpg" alt="{e(o["name"])} desktop" width="1440" height="900"></span><figcaption><span class="lt">{o["k"].upper()}</span>{e(o["name"])}</figcaption></figure>' for o in C)

css = open(os.path.join(HERE, 'index.css')).read()
doc = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>RISE Directions M N O</title>
<link rel="stylesheet" href="../kit/fonts.css">
<style>{css}</style>
</head>
<body>
<header class="wrap mast">
  <div class="mast-top"><img class="logo-l" src="../kit/brand/rise-lockup-header.png" alt="RISE" width="320" height="120"><img class="logo-d" src="../kit/brand/rise-lockup-header-reverse.png" alt="RISE" width="320" height="120"><span class="badge"><i></i>Design exploration · not implemented</span></div>
  <p class="eyebrow">Round 5 · Mobile first</p>
  <h1>Three product directions for RISE, designed for the phone first</h1>
  <p class="lede">M, N and O start from the phone and aim for the clarity, polish and confidence of a modern global product. Each has its own navigation model, rhythm and component language, and all three show the same real RISE content to the same Employee.</p>
  <div class="legend">{''.join(f'<a href="#{o["k"]}"><span class="lt">{o["k"].upper()}</span><b>{e(o["name"])}</b><small>{e(o["nav"])}</small></a>' for o in C)}</div>
</header>
<nav class="tabs" aria-label="Sections"><div class="wrap"><a href="#m">M · Smooth</a><a href="#n">N · Technical</a><a href="#o">O · Editorial</a><a href="#same">Same screen</a><a href="#critique">Why round 4 wasn’t enough</a></div></nav>
<main class="wrap">
{secs}
<section class="plain" id="same">
  <h2>The same screen in all three</h2>
  <div class="seg" role="group" aria-label="Screen">{seg}</div>
  <p class="row-l">Mobile</p><div class="row3 mb">{cmpm}</div>
  <p class="row-l">Desktop</p><div class="row3 dk">{cmpd}</div>
</section>
<section class="plain" id="critique">
  <h2>Why round 4 wasn’t enough</h2>
  <div class="crit">
    <p><b>Too similar.</b> On the phone J, K and L shared one skeleton: logo, bell, the same five-icon tab bar and rows repeating code, area, status, revision, classification and date.</p>
    <p><b>Stiff.</b> Screens explained themselves in grey sentences; breadcrumbs, stat strips and hairlines gave a form feel rather than a product feel.</p>
    <p><b>No signature.</b> Search and documents used the same components in all three, and nothing was carried by interaction.</p>
    <p><b>Phone not elegant enough.</b> Small, crowded metadata, loud highlights, competing badges and too many borders made the phone read as a compressed desktop.</p>
    <p><b>Enterprise energy and low confidence.</b> Everything was shown, labelled and explained at once; the brand was only a logo and a teal accent.</p>
  </div>
</section>
<p class="note">Scores are the design team’s first read, out of 10. No winner is chosen. Nothing is implemented in the live RISE application.</p>
</main>
<footer class="wrap">RISE design exploration · round 5 · Built by TAQA Learning Center · branch design/rise-exploration</footer>
<script>
(function(){{var b=document.querySelectorAll('.seg button');b.forEach(function(x){{x.addEventListener('click',function(){{b.forEach(function(y){{y.setAttribute('aria-pressed',y===x?'true':'false')}});var k=x.dataset.k;document.querySelectorAll('#same img').forEach(function(i){{i.src='shots/'+i.dataset.o+'-'+k+'-'+i.dataset.v+'.jpg'}})}})}})}})();
</script>
</body>
</html>'''
open(os.path.join(HERE, 'index.html'), 'w').write(doc)
print('ok')
