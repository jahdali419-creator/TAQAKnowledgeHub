"""Builds round-8/index.html: review page for the RISE Home direction."""
import os, html
HERE = os.path.dirname(os.path.abspath(__file__))
e = html.escape
DNA = [
 ('Warm paper, not white.', 'A calm off-white ground (#F3F1EC) that is easy on the eyes all day; true white is kept for the document itself, so documents literally stand out.'),
 ('Type is the interface.', 'BW Gradual at display scale for the one thing that matters on each screen, Inter for reading, nothing in between. Two tones, ink and a light grey, replace boxes and colour.'),
 ('The register voice.', 'Codes, revisions, dates and counts are set in a mono face with spaced capitals. It reads like a controlled register: precise, technical and unmistakably RISE.'),
 ('One or two moments per screen.', 'Home has two: the search line and the document you are working with. Everything else is quiet rows and labels.'),
 ('Lines, not containers.', 'Thin rules organise the page. Exactly one object is lifted: the document, because it is the thing you trust.'),
 ('Asymmetric grid.', 'A 12-column grid split 8/4: work on the left, the current document and your areas on the right. It reads left to right, top to bottom, with no centred hero.'),
 ('One spark of colour.', 'RISE orange marks only the caret, the active place and live items. Crimson is reserved for safety. Status stays shape plus word.'),
 ('Real numbers only.', 'Every count comes from the live register (519 in force, 177 procedures, 33 alerts). Where something does not exist yet, such as maintenance bulletins, it says so.'),
]
TR = [
 ('Large display type with a muted second tone', 'became the search line: “Search” in ink, the prompt in light grey, sized like a headline but working as an input.'),
 ('Warm paper surfaces and calm app framing', 'became the page ground and the off-white document sheet.'),
 ('Mono micro-labels and data strips', 'became the register voice: the meta line, scope index, row codes and the “Across TAQA” strip at the foot.'),
 ('Tabs with counts in a mail-style inbox', 'became the personal register: Changed, Alerts, Saved, Recently opened, each one tab away.'),
 ('Precise, quiet tool chrome', 'became a single-line text navigation with role tools on the right instead of a sidebar.'),
 ('One accent used sparingly', 'became the RISE orange spark, used on fewer than ten small marks.'),
]
RESP = [
 'The 8/4 grid collapses to one column in this order: search, the current document, your register tabs, your areas. Nothing is removed.',
 'The search line keeps its scale contrast but drops to about 34px; the scope index becomes a horizontal scroll of mono chips.',
 'The text navigation becomes a four-item bottom bar (Home, Search, Areas, Saved); Ask an Expert, Field Glossary and role tools move into a menu.',
 'The revision stack becomes a compact “Continue reading” sheet at full width; the stacked edges stay as the visual cue for revisions.',
 'Register rows keep code, title and status on the first line and move area, revision and date to a second mono line. The Across TAQA strip becomes a swipeable row.',
]
CRIT = [
 ('Does it look AI-generated?', 'No KPI tiles, gradients, glass or greeting. The structure comes from the content: search, my changes, my document.'),
 ('Too many boxes?', 'One lifted object (the document). Everything else is lines and type.'),
 ('Hierarchy in 3 seconds?', 'Search, then the changes list, then the document on the right. The ALT-002 row and the §5 note carry the only red.'),
 ('Without the orange?', 'It still holds: ink, grey and the paper ground do the work.'),
 ('Too empty?', 'The first pass had a dead band under the search; the scope index and tabs now sit there and the specimen gained the “What changed in 4.0” line.'),
 ('Tiring every day?', 'Low contrast ground, no motion except the caret (off for reduced motion), and one consistent row pattern.'),
]
dna = ''.join(f'<li><b>{e(a)}</b> {e(b)}</li>' for a, b in DNA)
tr = ''.join(f'<tr><th>{e(a)}</th><td>{e(b)}</td></tr>' for a, b in TR)
resp = ''.join(f'<li>{e(x)}</li>' for x in RESP)
crit = ''.join(f'<tr><th>{e(a)}</th><td>{e(b)}</td></tr>' for a, b in CRIT)
css = '''
:root{--paper:#F3F1EC;--sheet:#FFFEFB;--ink:#11201F;--ink2:#4A5553;--ink3:#878D89;--rule:#DFDBD3;--spark:#FD5805;--display:'BwGradual','Inter',system-ui,sans-serif;--ui:'Inter',system-ui,sans-serif;--mono:'PlexMono',ui-monospace,monospace}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font:400 16px/1.6 var(--ui);-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%;height:auto}
.wrap{max-width:1200px;margin:0 auto;padding:0 40px}
@media (max-width:640px){.wrap{padding:0 16px}}
.lab{font:500 11.5px/1 var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--ink3)}
header{padding:32px 0 0}
.mt{display:flex;justify-content:space-between;align-items:center;padding-bottom:22px;border-bottom:1px solid var(--rule)}
.mt img{height:26px;width:auto}
h1{margin-top:56px;font:700 clamp(40px,7vw,84px)/.98 var(--display);letter-spacing:-.04em}
h1 span{color:#B3B5AF;font-weight:300}
.lede{margin-top:20px;max-width:64ch;font-size:17px;color:var(--ink2)}
.shot{margin-top:40px;border:1px solid var(--rule);border-radius:10px;overflow:hidden;box-shadow:0 30px 70px -40px rgba(17,32,31,.45)}
.cap{display:flex;justify-content:space-between;gap:16px;margin-top:12px}
.det{display:grid;grid-template-columns:2fr 1fr;gap:24px;margin-top:28px}
.det figure img{border:1px solid var(--rule);border-radius:8px;background:#fff}
.det figcaption{margin-top:10px}
@media (max-width:820px){.det{grid-template-columns:1fr}}
section{margin-top:84px;padding-top:24px;border-top:1px solid var(--rule);display:grid;grid-template-columns:280px minmax(0,1fr);gap:40px}
section h2{font:700 26px/1.15 var(--display);letter-spacing:-.02em}
section h2 + .lab{margin-top:10px}
@media (max-width:820px){section{grid-template-columns:1fr;gap:16px}}
ol.dna{list-style:none;counter-reset:d;border-top:1px solid var(--rule)}
ol.dna li{counter-increment:d;display:grid;grid-template-columns:44px 1fr;padding:14px 0;border-bottom:1px solid var(--rule);color:var(--ink2)}
ol.dna li::before{content:counter(d,decimal-leading-zero);font:500 12px/1.9 var(--mono);color:var(--ink3)}
ol.dna li b{color:var(--ink);font-weight:600}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;vertical-align:top;padding:13px 18px 13px 0;border-top:1px solid var(--rule);font-size:15.5px}
th{width:40%;font-weight:600}
td{color:var(--ink2)}
@media (max-width:700px){tr{display:block;border-top:1px solid var(--rule);padding:10px 0}th,td{display:block;width:auto;border:0;padding:2px 0}}
.sig p{color:var(--ink2);max-width:64ch}
.sig p + p{margin-top:12px}
.sig b{color:var(--ink)}
.sig .line{margin-top:20px;display:inline-flex;flex-wrap:nowrap;white-space:nowrap;gap:6px 18px;align-items:center;padding:14px 16px;border:1px solid var(--rule);border-radius:8px;background:var(--sheet);font:500 13px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ink2)}
.sig .line b{color:var(--ink)}
.sig .line .ok{color:#1D7A5E}
.sig .line i{width:6px;height:6px;border-radius:50%;background:var(--spark)}
ul.rs{list-style:none;border-top:1px solid var(--rule)}
ul.rs li{padding:13px 0;border-bottom:1px solid var(--rule);color:var(--ink2)}
.stop{margin-top:84px;padding:18px 20px;border-left:2px solid var(--spark);background:var(--sheet);color:var(--ink2)}
.stop b{color:var(--ink)}
footer{margin-top:56px;padding:22px 0 40px;border-top:1px solid var(--rule)}
'''
doc = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RISE Home Direction</title>
<link rel="stylesheet" href="../kit/fonts.css">
<style>{css}</style>
</head>
<body>
<div class="wrap">
<header>
  <div class="mt"><img src="../kit/brand/rise-lockup-header.png" alt="RISE" width="69" height="26"><span class="lab">Round 8 · Home · for review</span></div>
  <h1>RISE Home.<br><span>One direction.</span></h1>
  <p class="lede">The first screen an employee sees after signing in, at 1440 × 900. It is built to answer one question, “what knowledge do I need, and how do I get to it?”, with real register content for Faisal Al-Ghamdi, Field Supervisor, Coiled Tubing.</p>
  <img class="shot" src="shots/r8-home.png" alt="RISE Home at 1440 by 900" width="2160" height="1350">
  <p class="cap lab"><span>RISE / Home · 1440 × 900</span><span>Design exploration · not implemented</span></p>
  <div class="det">
    <figure><img src="shots/r8-detail-search.png" alt="Detail: the search line" width="1305" height="345" loading="lazy"><figcaption class="lab">Moment 1 · the search line</figcaption></figure>
    <figure><img src="shots/r8-detail-stack.png" alt="Detail: the revision stack" width="630" height="780" loading="lazy"><figcaption class="lab">Moment 2 · the revision stack</figcaption></figure>
  </div>
</header>
<section><div><h2>RISE Design DNA</h2><p class="lab">8 principles</p></div><ol class="dna">{dna}</ol></section>
<section><div><h2>Inspiration translation</h2><p class="lab">Principles, not screens</p></div><table><tbody>{tr}</tbody></table></section>
<section class="sig"><div><h2>Signature element</h2><p class="lab">The register line</p></div><div>
  <p><b>Every document in RISE carries its register line:</b> number, revision, status and date set in the mono register voice, with one orange spark when something is live. It is the same line in the search results, the changes list, the footer strip and on the document sheet itself.</p>
  <p>Its largest form is the <b>revision stack</b> on Home: the current revision as a sheet of paper, earlier revisions as thin edges behind it. You see “4 revisions · 1 in force” before you read a word. No other knowledge tool looks like this, and it says what RISE is for: the right revision.</p>
  <p class="line"><i></i><b>TQ-TWS-CTSS-WI-003</b><span>Rev 4.0</span><span class="ok">● Current</span><span>Effective 30 Aug 2025</span></p>
</div></section>
<section><div><h2>Responsive strategy</h2><p class="lab">For later · 5 rules</p></div><ul class="rs">{resp}</ul></section>
<section><div><h2>Design-director check</h2><p class="lab">Asked before presenting</p></div><table><tbody>{crit}</tbody></table></section>
<p class="stop"><b>Stopping here.</b> Search, Area, Document, QMS and any implementation wait until you approve this visual direction.</p>
<footer class="lab">RISE design exploration · round 8 · branch design/rise-exploration</footer>
</div>
</body>
</html>'''
open(os.path.join(HERE, 'index.html'), 'w').write(doc)
print('ok')
