"""Builds round-3/index.html, the RISE — Future Concepts comparison page."""
import html, os
HERE = os.path.dirname(os.path.abspath(__file__))
e = html.escape

C = [
 dict(k='g', name='RISE Command', tag='Knowledge as an operating system',
  thesis='RISE has no home page: home is a command surface that asks “What do you need?” and carries your context — your area, the active alert, the last document you opened. Search, area and document are the same bar with a scope, and every result shows why it matched, what was hidden and what you may open.',
  signature='Lanes and peek. Type, and results arrive in typed lanes (Procedures, Work Instructions, Standards, Lessons, Alerts, Experts, Areas, Glossary, proposed Equipment), each tagged with why it matched. Arrow keys move, Space opens a live preview with the trust verdict beside the results, and filters are tokens typed into the bar (status:current, area:coiled-tubing).',
  assumption='That a knowledge platform is a website of pages you navigate. Here you state a need; navigation becomes a trail you can step back through.',
  win=['One surface for every need: keyboard-first on desktop, thumb-first on the phone.',
       'Radical honesty: it says “No approved document is titled for pump isolation” instead of guessing.',
       'Scales to 520 documents and 25 areas without adding menus.'],
  fail=['Field users who never touch a keyboard may miss the power features.',
        'The dark, OS-like look can read as a developer tool; it needs a light theme.',
        'Ranking rules and the synonym table need governance to stay trusted.'],
  difficulty='Medium', diff_note='Search, filters and role rules exist; the new work is lanes, match reasons, token parsing and a preview panel.',
  scores=dict(Innovation=8, Usability=8, Identity=7)),
 dict(k='h', name='RISE Knowledge Map', tag='Knowledge as a place',
  thesis='TAQA’s knowledge is a place, not a list. Home is a calm map of all 25 areas in their four families, each sized by its real document count; zooming changes meaning, from area to equipment to the document and everything around it. On the phone the same idea becomes a vertical descent, and every map has a list beside it.',
  signature='Semantic zoom with an altitude gauge. Zooming into Coiled Tubing turns it into its equipment, each carrying its documents, with a “Pressure control” thread running out to Wireline and Slickline. A five-level gauge (TAQA › Grouping › Area › Equipment › Document) always shows how deep you are and takes you back up.',
  assumption='That knowledge is lists and folders. Search shows where knowledge lives, and a document is a node with its equipment, alert, expert and lineage drawn around it.',
  win=['Shows at a glance where knowledge is, where it is thin and where alerts sit.',
       'Makes cross-area knowledge visible (pressure control across three segments) without searching.',
       'Never traps anyone: a Map/List toggle and the trust verdict are always on screen.'],
  fail=['Equipment tags and topic threads don’t exist yet; the map is only as good as that curation.',
        'A much larger register would need clustering rules to stay calm.',
        'Some people may treat the map as decoration and go straight to search.'],
  difficulty='High', diff_note='The landscape is easy; semantic zoom plus curating equipment tags and topic threads is real product and data work.',
  scores=dict(Innovation=9, Usability=6, Identity=6)),
 dict(k='i', name='RISE Field Mode', tag='Knowledge from where the work is',
  thesis='RISE starts from the person standing at the equipment. Home asks one question, “What’s in front of you?”, and answers it three ways: scan, equipment or type. Whatever you open, a full-width Trust Card comes first, so in two seconds you know whether the document is safe to use.',
  signature='The two-second Trust Card. Scan, tap or search, and a huge verdict appears first: CURRENT with a tick, “In force. Safe to use on the job.”, revision, effective date, approver, what changed and the linked alert. Scanning an old print shows an unmistakable SUPERSEDED stop card with one button to Rev 4.0.',
  assumption='That knowledge is navigated by organisation chart (area, shelf, list). Field Mode navigates by what is physically in front of you and puts trust before content.',
  win=['Answers the field’s real question — can I use this? — in two seconds, in sunlight, with gloves.',
       'Equipment and QR entry remove most decisions; nobody needs to know the numbering system.',
       'Offline is designed in: status on every screen, pinned documents and crew job packs.'],
  fail=['Equipment tags and asset QR codes don’t exist yet.',
        'Big type shows fewer documents per screen; office and QMS users will want denser views.',
        'Job packs and asset labelling add operational process beyond the software.'],
  difficulty='Medium', diff_note='Trust data, Pin offline and document QR codes already exist in the live app; equipment tags, camera scan, job packs and a Sunlight theme are new.',
  scores=dict(Innovation=7, Usability=9, Identity=7)),
]
VIEWS = [('home', 'Home'), ('search', 'Search · “pressure test”'), ('area', 'Area · Coiled Tubing'), ('document', 'Document · WI-003')]
EXTRA = [('search-start', 'Search · start state'), ('search-intent', 'Search · “I need to isolate a pump”')]

def pair(o, p, label, n):
    return f'''<div class="pair">
  <figure class="dk"><span class="num">{n}</span><a class="screen" href="{o}/{p}.html"><img src="shots/{o}-{p}-desktop.jpg" alt="{e(label)}, desktop" loading="lazy" width="1440" height="900"></a><figcaption>Desktop · {e(label)}</figcaption></figure>
  <figure class="ph"><span class="num">{n+1}</span><a class="phone" href="{o}/{p}.html"><img src="shots/{o}-{p}-phone.jpg" alt="{e(label)}, mobile" loading="lazy" width="780" height="1688"></a><figcaption>Mobile · {e(label)}</figcaption></figure>
</div>'''

def bar(v):
    return f'<span class="bar"><i style="width:{v*10}%"></i></span><b>{v}</b><small>/10</small>'

secs = []
for c in C:
    pairs = ''.join(pair(c['k'], p, l, 1 + 2*i) for i, (p, l) in enumerate(VIEWS))
    extras = ''.join(f'''<figure><a class="phone" href="{c["k"]}/{p}.html"><img src="shots/{c["k"]}-{p}-phone.jpg" alt="{e(l)}, mobile" loading="lazy" width="780" height="1688"></a><figcaption>{e(l)}</figcaption></figure>''' for p, l in EXTRA)
    extras_d = ''.join(f'''<figure><a class="screen" href="{c["k"]}/{p}.html"><img src="shots/{c["k"]}-{p}-desktop.jpg" alt="{e(l)}, desktop" loading="lazy" width="1440" height="900"></a><figcaption>{e(l)}, desktop</figcaption></figure>''' for p, l in EXTRA)
    win = ''.join(f'<li>{e(x)}</li>' for x in c['win'])
    fail = ''.join(f'<li>{e(x)}</li>' for x in c['fail'])
    sc = ''.join(f'<div class="sc"><span>{"RISE identity" if k=="Identity" else k}</span>{bar(v)}</div>' for k, v in c['scores'].items())
    secs.append(f'''
<section class="concept" id="{c["k"]}">
  <header class="c-head">
    <span class="c-let">{c["k"].upper()}</span>
    <div><p class="eyebrow">Concept {c["k"].upper()} · {e(c["tag"])}</p><h2>{e(c["name"])}</h2></div>
  </header>
  <div class="views">{pairs}</div>
  <details class="more"><summary>Two more search states</summary><div class="extra">{extras}{extras_d}</div></details>
  <div class="assess">
    <div class="a-main">
      <h3>Design thesis</h3><p class="thesis">{e(c["thesis"])}</p>
      <h3>Signature interaction</h3><p>{e(c["signature"])}</p>
      <h3>Assumption it challenges</h3><p>{e(c["assumption"])}</p>
    </div>
    <div class="a-side">
      <div class="wf"><h3>Why it could win</h3><ul class="win">{win}</ul></div>
      <div class="wf"><h3>What could fail</h3><ul class="fail">{fail}</ul></div>
      <div class="meta">
        <div class="sc diff"><span>Difficulty to implement</span><b class="d-{c["difficulty"].lower()}">{c["difficulty"]}</b></div>
        <p class="dnote">{e(c["diff_note"])}</p>
        {sc}
      </div>
    </div>
  </div>
</section>''')

rows = ''.join(f'<tr><th scope="row"><span class="c-let sm">{c["k"].upper()}</span>{e(c["name"])}</th><td>{e(c["tag"])}</td><td>{c["difficulty"]}</td>' + ''.join(f'<td class="n">{v}</td>' for v in c['scores'].values()) + '</tr>' for c in C)

css = open(os.path.join(HERE, 'index.css')).read()
doc = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>RISE — Future Concepts</title>
<link rel="stylesheet" href="../kit/fonts.css">
<style>{css}</style>
</head>
<body>
<header class="wrap mast">
  <div class="mast-top"><img class="logo-l" src="../kit/brand/rise-lockup-header.png" alt="RISE" width="320" height="120"><img class="logo-d" src="../kit/brand/rise-lockup-header-reverse.png" alt="RISE" width="320" height="120"><span class="badge"><i></i>Design exploration · not implemented</span></div>
  <p class="eyebrow">Round 3 · Future concepts for 2030</p>
  <h1>RISE — Future Concepts</h1>
  <p class="lede">Three ideas that each break one assumption about how an internal knowledge platform should work. Same functions, same business rules and the same real RISE content in all three; only the experience changes.</p>
  <div class="cards">
    <a href="#g"><span class="c-let">G</span><b>Command</b><span>What do you need? One command surface instead of pages.</span></a>
    <a href="#h"><span class="c-let">H</span><b>Knowledge Map</b><span>Knowledge as a place you can zoom into, not a list.</span></a>
    <a href="#i"><span class="c-let">I</span><b>Field Mode</b><span>What’s in front of you? Trust first, built for the field.</span></a>
  </div>
  <p class="same">Every concept shows the same searches (“pressure test”, “I need to isolate a pump”), the same area (Coiled Tubing) and the same document (TQ-TWS-CTSS-WI-003 Injector Head Operations Manual, Rev 4.0), seen by an Employee. Equipment tags, the Well Intervention grouping and synonym tables are proposals and are labelled on screen.</p>
</header>
<nav class="tabs" aria-label="Concepts"><div class="wrap"><a href="#g">G · Command</a><a href="#h">H · Knowledge Map</a><a href="#i">I · Field Mode</a><a href="#scores">Scores</a></div></nav>
<main class="wrap">
{''.join(secs)}
<section class="plain" id="scores">
  <h2>The three side by side</h2>
  <div class="tbl"><table><thead><tr><th>Concept</th><th>Idea</th><th>Difficulty</th><th>Innovation</th><th>Usability</th><th>RISE identity</th></tr></thead><tbody>{rows}</tbody></table></div>
  <p class="note">Scores are the design team’s first read, out of 10, to start the conversation. No winner is chosen and the concepts are not combined. Nothing is implemented until a direction is approved.</p>
</section>
</main>
<footer class="wrap">RISE design exploration · round 3 · Built by TAQA Learning Center · branch design/rise-exploration</footer>
</body>
</html>'''
open(os.path.join(HERE, 'index.html'), 'w').write(doc)
print('ok')
