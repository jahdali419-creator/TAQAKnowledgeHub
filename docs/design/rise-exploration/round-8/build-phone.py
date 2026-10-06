"""Builds round-8/phone.html: the Register direction on a phone, six screens."""
import os, html
HERE = os.path.dirname(os.path.abspath(__file__))
e = html.escape
S = [('1-home', 'Home', 'Search comes first, at headline size. Tap anywhere on the line to type; example searches sit under it.'),
     ('2-continue', 'Continue reading', 'The manual you opened last, as a sheet with earlier revisions stacked behind. Status, dates, approver and the §5 change in one glance.'),
     ('3-changed', 'Changed in your area', 'Your register: code and status on top, title in the middle, date, area and revision underneath. Restricted items show a lock.'),
     ('4-alerts', 'Alerts', 'One tap to the alerts for Coiled Tubing. The active alert carries the only red on the screen.'),
     ('5-search', 'Typing “WI-003”', 'Ten areas each have a WI-003. Yours comes first; the full register number tells the others apart.'),
     ('6-menu', 'More', 'Ask an Expert, Field Glossary, Upload and notifications. QMS roles would also see Master List and QMS Workspace here.')]
figs = ''.join(f'<figure><span class="ph"><img src="shots/phone-{k}.png" alt="{e(t)}, phone" width="1170" height="2532" loading="lazy"></span><figcaption><span class="n">{i+1:02d}</span><b>{e(t)}</b>{e(d)}</figcaption></figure>' for i, (k, t, d) in enumerate(S))
css = '''
:root{--paper:#F3F1EC;--ink:#11201F;--ink2:#4A5553;--ink3:#878D89;--ink4:#B3B5AF;--rule:#DFDBD3;--spark:#FD5805;--display:'BwGradual','Inter',system-ui,sans-serif;--ui:'Inter',system-ui,sans-serif;--mono:'PlexMono',ui-monospace,monospace}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font:400 16px/1.55 var(--ui);-webkit-font-smoothing:antialiased}
img{display:block;width:100%;height:auto}
.wrap{max-width:1240px;margin:0 auto;padding:0 40px}
@media (max-width:640px){.wrap{padding:0 16px}}
.lab{font:500 11.5px/1 var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--ink3)}
.mt{display:flex;justify-content:space-between;align-items:center;padding:30px 0 20px;border-bottom:1px solid var(--rule)}
.mt img{height:24px;width:auto}
h1{margin-top:52px;font:700 clamp(48px,9vw,108px)/.92 var(--display);letter-spacing:-.045em}
h1 span{display:block;font-weight:300;color:var(--ink4)}
.lede{margin-top:20px;max-width:62ch;font-size:17px;color:var(--ink2)}
.lede b{color:var(--ink);font-weight:600}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:56px 40px;margin-top:56px}
@media (max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:40px 20px}}
.ph{display:block;border-radius:44px;padding:10px;background:#141B1A;box-shadow:0 40px 80px -40px rgba(17,32,31,.55);max-width:340px;margin:0 auto}
.ph img{border-radius:34px}
figcaption{max-width:340px;margin:18px auto 0;font-size:14.5px;line-height:1.5;color:var(--ink2)}
figcaption .n{display:block;font:500 11px/1 var(--mono);letter-spacing:.09em;color:var(--ink3);margin-bottom:8px}
figcaption b{display:block;font:700 19px/1.2 var(--display);letter-spacing:-.01em;color:var(--ink);margin-bottom:4px}
footer{margin-top:72px;padding:22px 0 40px;border-top:1px solid var(--rule)}
'''
doc = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RISE Register on Phone</title>
<link rel="stylesheet" href="../kit/fonts.css">
<style>{css}</style>
</head>
<body>
<div class="wrap">
  <div class="mt"><img src="../kit/brand/rise-lockup-header.png" alt="RISE" width="64" height="24"><span class="lab">Design direction · phone · 390 × 844</span></div>
  <h1>Register<span>on your phone.</span></h1>
  <p class="lede">The direction is called <b>Register</b>, after its signature: every document carries its register line (number, revision, status, date) in the same precise voice, on warm paper. These six screens are the same Home on an iPhone-size screen, as Faisal Al-Ghamdi, Field Supervisor, Coiled Tubing, with real register content.</p>
  <div class="grid">{figs}</div>
  <footer class="lab">RISE design exploration · round 8 · Register · branch design/rise-exploration</footer>
</div>
</body>
</html>'''
open(os.path.join(HERE, 'phone.html'), 'w').write(doc)
print('ok')
