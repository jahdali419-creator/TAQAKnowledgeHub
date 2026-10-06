"""Builds round-5/taqa-skill.html: direction N before and after the TAQA UI/UX skill rules."""
import html, os
HERE = os.path.dirname(os.path.abspath(__file__))
e = html.escape

def fig(src, cap, kind, href):
    w, h = (780, 1688) if kind == 'phone' else (1440, 900)
    return f'<figure><a class="{kind}" href="{href}"><img src="shots/{src}.jpg" alt="{e(cap)}" loading="lazy" width="{w}" height="{h}"></a><figcaption>{e(cap)}</figcaption></figure>'

def pair(p, title):
    return f'''<section class="scr" id="{p}">
  <div class="scr-h"><h2>{e(title)}</h2></div>
  <p class="row-l">Mobile · 390 × 844</p>
  <div class="row2 mb">{fig(f"n-{p}-phone", "Before · N as designed", "phone", f"n/{p}.html")}{fig(f"nt-{p}-phone", "After · N + TAQA skill", "phone", f"n-taqa/{p}.html")}</div>
  <p class="row-l">Desktop · 1440 × 900</p>
  <div class="row2 dk">{fig(f"n-{p}-desktop", "Before · N as designed", "screen", f"n/{p}.html")}{fig(f"nt-{p}-desktop", "After · N + TAQA skill", "screen", f"n-taqa/{p}.html")}</div>
</section>'''

RULES = [
 ('Official colours', 'TAQA Teal Green #00585A for headers, primary actions and the active tab; Legacy Teal #00BFB2 for highlights; Alpine Green family for “Current”.', 'Teal #005D63 and a generic green'),
 ('Orange at 5% or less', 'Brave Orange #FF6720 appears only as a notification spark on the bell and avatar. Nothing else is orange.', 'Orange used for alerts'),
 ('Safety comes first, in Crimson', 'ALT-002 (it changes WI-003 §5 operating limits) is now a Safety Warning callout: 4px Crimson #C8102E rule on #FFF5F5, at the top of Home and on the document.', 'An orange-tinted notice box'),
 ('BW Gradual for everything Latin', 'Headings and body text both use BW Gradual. Inter is kept only as a fallback.', 'BW Gradual titles, Inter body'),
 ('Filled two-tone icons', 'Every navigation and action icon is redrawn as a solid shape with a 32% tint for the second tone, so it reads as TAQA, not a generic line set.', 'Thin outline icons'),
 ('Arabic and RTL', 'A full Arabic Home in Somar with right-to-left layout: the rail, timeline, safety rule and counters mirror; document codes and revisions stay left-to-right.', 'English only'),
 ('Correct O&G terms', 'CT string, WI, SOP, ALT, §5 operating limits kept exactly as in the register; nothing simplified.', 'Already correct; kept'),
]
SKIPPED = [
 ('E-learning screen limits', '60–80 words per screen, Next/Back buttons and a progress bar are for training modules. RISE is a document register, so they would get in the way.'),
 ('Monument Gray for body text', '#968C83 on white is about 3.3:1, below the WCAG AA 4.5:1 minimum for text. Body text stays near-black ink; grey is used for dividers only.'),
 ('Two brand sources disagree', 'The skill says Teal #00585A and Orange #FF6720; the RISE kit used #005D63 and #FD691D. I followed the skill here. Before anything is built, the values should be checked against the official TAQA Brand Guidelines PDF.'),
]

rules = ''.join(f'<tr><th>{e(a)}</th><td>{e(b)}</td><td class="was">{e(c)}</td></tr>' for a, b, c in RULES)
skipped = ''.join(f'<p><b>{e(a)}.</b> {e(b)}</p>' for a, b in SKIPPED)
allp = ''.join(fig(f'nt-{p}-phone', t, 'phone', f'n-taqa/{p}.html') for p, t in [('home','Home'),('search','Search · “pressure test”'),('area','Area · Coiled Tubing'),('document','Document · WI-003')])

css = open(os.path.join(HERE, 'index.css')).read() + '''
.row2{display:grid;gap:28px;margin:10px 0 30px}
.row2.mb{grid-template-columns:repeat(2,minmax(0,340px));justify-content:start;gap:56px}
.row2.dk{grid-template-columns:repeat(2,minmax(0,1fr))}
.row2.mb figure{width:100%}.row2.mb .phone{width:100%}
.row2 figcaption{margin-top:10px;font-size:14px;color:var(--ink-2)}
.row2 figure:last-child figcaption{color:var(--teal);font-weight:600}
@media (max-width:900px){.row2.dk{grid-template-columns:1fr}.row2.mb{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}}
.why{max-width:760px;font-size:17px;line-height:1.55;color:var(--ink-2)}
.why b{color:var(--ink)}
.rules{width:100%;border-collapse:collapse;margin-top:14px;font-size:15.5px;line-height:1.45}
.rules th,.rules td{text-align:left;vertical-align:top;padding:14px 16px 14px 0;border-top:1px solid var(--rule)}
.rules th{width:24%;color:var(--ink);font-weight:700}
.rules td{width:52%}
.rules td.was{width:24%;color:var(--ink-3)}
.rules thead th{border-top:0;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);font-weight:600}
@media (max-width:700px){.rules thead{display:none}.rules tr{display:block;border-top:1px solid var(--rule);padding:12px 0}.rules th,.rules td{display:block;width:auto;border:0;padding:3px 0}.rules td.was::before{content:"Before: "}}
.swatch{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.swatch span{display:inline-flex;align-items:center;gap:8px;padding:6px 12px 6px 6px;border:1px solid var(--rule);border-radius:999px;font-size:14px;color:var(--ink-2);background:var(--sheet)}
.swatch i{width:22px;height:22px;border-radius:50%;display:block}
'''
SW = [('#00585A','Teal Green · structure'),('#00BFB2','Legacy Teal · highlight'),('#007A6B','Current (Alpine family)'),('#C8102E','Crimson · safety only'),('#FF6720','Orange · ≤5% spark')]
sw = ''.join(f'<span><i style="background:{c}"></i>{e(t)} {c}</span>' for c, t in SW)

doc = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>RISE N with TAQA</title>
<link rel="stylesheet" href="../kit/fonts.css">
<style>{css}</style>
</head>
<body>
<header class="wrap mast">
  <div class="mast-top"><img class="logo-l" src="../kit/brand/rise-lockup-header.png" alt="RISE" width="320" height="120"><img class="logo-d" src="../kit/brand/rise-lockup-header-reverse.png" alt="RISE" width="320" height="120"><span class="badge"><i></i>Design exploration · not implemented</span></div>
  <p class="eyebrow">Round 5 · Applying the TAQA UI/UX skill</p>
  <h1>Direction N, rebuilt on the TAQA brand system</h1>
  <p class="why"><b>Why N.</b> RISE is a controlled-document system for field and operations people, and the skill puts safety first, then procedure, then concept. N already leads with that order (identity plate, status, revision, the ALT-002 change), so the skill’s rules strengthen it instead of fighting it. This page shows N before and after; M and O are unchanged and no winner is declared.</p>
  <div class="swatch">{sw}</div>
</header>
<nav class="tabs" aria-label="Sections"><div class="wrap"><a href="#home">Home</a><a href="#document">Document</a><a href="#arabic">Arabic</a><a href="#all">All screens</a><a href="#rules">What changed</a></div></nav>
<main class="wrap">
{pair("home", "Home · before and after")}
{pair("document", "Document WI-003 · before and after")}
<section class="scr" id="arabic">
  <div class="scr-h"><h2>Home in Arabic · Somar, right to left</h2></div>
  <div class="row2 mb">{fig("nt-home-phone", "English", "phone", "n-taqa/home.html")}{fig("nt-home-ar-phone", "العربية", "phone", "n-taqa/home-ar.html")}</div>
  <div class="row2 dk" style="grid-template-columns:1fr">{fig("nt-home-ar-desktop", "Arabic desktop · the rail moves to the right and the timeline mirrors", "screen", "n-taqa/home-ar.html")}</div>
</section>
<section class="plain" id="all">
  <h2>All four screens with the TAQA rules</h2>
  <div class="phones">{allp}</div>
</section>
<section class="plain" id="rules">
  <h2>What the skill changed</h2>
  <table class="rules"><thead><tr><th>Rule</th><th>After</th><th>Before</th></tr></thead><tbody>{rules}</tbody></table>
  <h2 style="margin-top:44px">What I did not take from the skill, and why</h2>
  <div class="crit">{skipped}</div>
</section>
<p class="note">Same real content as round 5 (Faisal Al-Ghamdi, Field Supervisor, Employee, Coiled Tubing). Original N is untouched in round-5/n/. Nothing is implemented in the live RISE application.</p>
</main>
<footer class="wrap">RISE design exploration · round 5 · N + TAQA · Built by TAQA Learning Center · branch design/rise-exploration</footer>
</body>
</html>'''
open(os.path.join(HERE, 'taqa-skill.html'), 'w').write(doc)
print('ok')
