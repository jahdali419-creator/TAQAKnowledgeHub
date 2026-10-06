"""Builds round-5/taqa-states.html: N + TAQA with the design-taste skill's states and motion."""
import html, os
HERE = os.path.dirname(os.path.abspath(__file__))
e = html.escape

def fig(src, cap, kind, href):
    w, h = (780, 1688) if kind == 'phone' else (1440, 900)
    return f'<figure><a class="{kind}" href="{href}"><img src="shots/{src}.jpg" alt="{e(cap)}" loading="lazy" width="{w}" height="{h}"></a><figcaption>{e(cap)}</figcaption></figure>'

STATES = [
 ('search-loading', 'Loading · Search “pressure test”',
  'Grey rows shaped exactly like the results, plus one plain line: “Searching 520 documents in force”. The layout does not jump when results arrive, and nothing spins.'),
 ('saved-empty', 'Empty · Saved, before anything is saved',
  'An empty list that teaches: what Saved is for, how to save (open a document, tap Save), two ways forward, and the documents you opened recently, each with a Save button.'),
 ('document-restricted', 'Restricted · SOP-010 Fishing Operations SOP',
  'The record stays open to every employee (number, revision, Current, issue date). Only the file is locked: a blurred cover, one clear request to QMS, and a reason field with its label above it.'),
 ('document-offline', 'Offline · WI-003 pinned on the device',
  'A dark bar says what happened. Trust changes from “Current” to “Current when last checked” with the time, the ALT-002 safety warning stays, and what needs a connection is greyed with a short reason.'),
]
TOOK = [
 ('Designed states', 'Loading, empty, restricted and offline screens for every key place, instead of showing only the “everything loaded” moment.'),
 ('Press feedback', 'Buttons and cards shrink slightly (to 97–98%) while pressed, rows tint, and tab icons dip. You feel the tap even with gloves.'),
 ('One short reveal', 'Lists appear top to bottom, 40 ms apart, once. Only transform and opacity are animated, so it stays smooth on older phones.'),
 ('Uneven tile grid on desktop Home', 'The safety alert gets the biggest tile, “Continue reading” sits beside it in TAQA teal, and figures, changes, Saved and Tools fill the rest.'),
 ('Quality checks', 'No pure black, no glows, shadows tinted teal, a label above every input, no emoji, and real data only.'),
]
LEFT = [
 ('Its fonts (Geist, Satoshi)', 'TAQA’s brand requires BW Gradual and Somar, and the brand wins. BW Gradual is already not Inter, so the skill’s real concern is met.'),
 ('The flashy effects', 'Endless animations, magnetic buttons, particle bursts, scrambling text, frosted glass, tilting cards and moving gradients would distract from a safety-critical document.'),
 ('Its default dials', 'The skill defaults to layout variance 8, motion 6 and density 4. For RISE I used 4, 3 and 6: ordered, calm and informative.'),
 ('React, Tailwind and Framer', 'Those only apply when the real app is built. These are static design mockups.'),
]
states = ''
for k, t, d in STATES:
    states += f'''<section class="scr st" id="{k}">
  <div class="scr-h"><h2>{e(t)}</h2></div>
  <p class="why">{e(d)}</p>
  <div class="pair">{fig(f"nst-{k}-phone", "Mobile · 390 × 844", "phone", f"n-states/{k}.html")}{fig(f"nst-{k}-desktop", "Desktop · 1440 × 900", "screen", f"n-states/{k}.html")}</div>
</section>'''
took = ''.join(f'<tr><th>{e(a)}</th><td>{e(b)}</td></tr>' for a, b in TOOK)
left = ''.join(f'<p><b>{e(a)}.</b> {e(b)}</p>' for a, b in LEFT)

css = open(os.path.join(HERE, 'index.css')).read() + '''
.why{max-width:760px;font-size:17px;line-height:1.55;color:var(--ink-2);margin-top:6px}
.why b{color:var(--ink)}
.dials{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.dials span{display:inline-flex;align-items:baseline;gap:8px;padding:8px 14px;border:1px solid var(--rule);border-radius:999px;background:var(--sheet);font-size:14px;color:var(--ink-2)}
.dials b{font-size:17px;color:var(--ink)}
.dials s{color:var(--ink-3)}
.pair{display:grid;grid-template-columns:300px minmax(0,1fr);gap:40px;align-items:start;margin:18px 0 34px}
.pair figcaption,.row2 figcaption{margin-top:10px;font-size:14px;color:var(--ink-2)}
.row2{display:grid;gap:28px;margin:10px 0 30px;grid-template-columns:repeat(2,minmax(0,1fr))}
.row2 figure:last-child figcaption{color:var(--teal);font-weight:600}
.mv{display:grid;grid-template-columns:320px minmax(0,1fr);gap:48px;align-items:start;margin-top:18px}
.mv .phone video{display:block;width:100%;height:100%;object-fit:cover}
.steps{counter-reset:s;display:flex;flex-direction:column;gap:14px;margin-top:4px}
.steps li{counter-increment:s;list-style:none;display:grid;grid-template-columns:34px 1fr;gap:12px;font-size:16.5px;line-height:1.5;color:var(--ink-2)}
.steps li::before{content:counter(s);display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--chip);color:var(--ink);font-weight:700;font-size:14px}
.steps b{color:var(--ink)}
.rules{width:100%;border-collapse:collapse;margin-top:14px;font-size:15.5px;line-height:1.45}
.rules th,.rules td{text-align:left;vertical-align:top;padding:14px 16px 14px 0;border-top:1px solid var(--rule)}
.rules th{width:30%;color:var(--ink);font-weight:700}
@media (max-width:900px){.pair,.mv{grid-template-columns:1fr}.pair .phone,.mv .phone{max-width:300px}.row2{grid-template-columns:1fr}}
@media (max-width:700px){.rules tr{display:block;border-top:1px solid var(--rule);padding:12px 0}.rules th,.rules td{display:block;width:auto;border:0;padding:3px 0}}
'''
doc = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>RISE N States</title>
<link rel="stylesheet" href="../kit/fonts.css">
<style>{css}</style>
</head>
<body>
<header class="wrap mast">
  <div class="mast-top"><img class="logo-l" src="../kit/brand/rise-lockup-header.png" alt="RISE" width="320" height="120"><img class="logo-d" src="../kit/brand/rise-lockup-header-reverse.png" alt="RISE" width="320" height="120"><span class="badge"><i></i>Design exploration · not implemented</span></div>
  <p class="eyebrow">Round 5 · Applying the design-taste skill</p>
  <h1>N + TAQA, with real-life states and motion</h1>
  <p class="why">The earlier mockups showed only the moment when everything has loaded. Here, N + TAQA also covers the moments people actually meet on the job: waiting for results, an empty list, a locked file, and no signal on site. Taps get physical feedback, and desktop Home becomes an uneven tile grid led by the safety alert.</p>
  <div class="dials"><span>Layout variance <b>4</b> <s>8</s></span><span>Motion <b>3</b> <s>6</s></span><span>Density <b>6</b> <s>4</s></span><span>RISE setting, with the skill default crossed out</span></div>
</header>
<nav class="tabs" aria-label="Sections"><div class="wrap"><a href="#motion">Motion</a><a href="#home">Desktop Home</a><a href="#search-loading">Loading</a><a href="#saved-empty">Empty</a><a href="#document-restricted">Restricted</a><a href="#document-offline">Offline</a><a href="#took">What I took</a></div></nav>
<main class="wrap">
<section class="scr" id="motion">
  <div class="scr-h"><h2>See it move · phone, 23 seconds</h2></div>
  <div class="mv">
    <figure><span class="phone"><video src="shots/nst-motion-phone.webm" autoplay muted loop playsinline aria-label="Screen recording of the phone prototype"></video></span><figcaption>Recorded from the HTML prototype</figcaption></figure>
    <ol class="steps">
      <li><span><b>Home.</b> Sections rise in, top to bottom, once. Pressing the ALT-002 safety card shrinks it slightly.</span></li>
      <li><span><b>Search “pressure test”.</b> Grey placeholder rows first, then the 17 results ripple in without the page jumping.</span></li>
      <li><span><b>Press a result.</b> The row tints while your finger is down.</span></li>
      <li><span><b>WI-003, tap Save.</b> The bookmark pops and a confirmation slides up: “Removed from Saved”, then “Saved. WI-003 is in your Saved list.”</span></li>
      <li><span><b>Offline, then Saved (empty).</b> The two other states, as they appear on the phone.</span></li>
      <li><span>Phones set to <b>reduce motion</b> get no movement at all; every page is also complete without JavaScript.</span></li>
    </ol>
  </div>
</section>
<section class="scr" id="home">
  <div class="scr-h"><h2>Desktop Home · even columns → uneven tile grid</h2></div>
  <p class="why">The safety alert gets the largest tile, with its two actions on the tile itself. “Continue reading” sits beside it in TAQA teal. The phone keeps N’s single column.</p>
  <div class="row2">{fig("nt-home-desktop", "Before · N + TAQA", "screen", "n-taqa/home.html")}{fig("nst-home-desktop", "After · tile grid", "screen", "n-states/home.html")}</div>
</section>
{states}
<section class="plain" id="took">
  <h2>What I took from the skill</h2>
  <table class="rules"><tbody>{took}</tbody></table>
  <h2 style="margin-top:44px">What I left out, and why</h2>
  <div class="crit">{left}</div>
</section>
<p class="note">Same real content as round 5. “Checked today 05:40” and the empty Saved list are example states. N and N + TAQA are untouched; nothing is implemented in the live RISE application, and no winner is chosen.</p>
</main>
<footer class="wrap">RISE design exploration · round 5 · N + TAQA + states · Built by TAQA Learning Center · branch design/rise-exploration</footer>
</body>
</html>'''
open(os.path.join(HERE, 'taqa-states.html'), 'w').write(doc)
print('ok')
