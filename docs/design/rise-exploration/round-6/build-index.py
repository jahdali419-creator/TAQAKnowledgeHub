"""Builds round-6/index.html: the Halo showcase."""
import importlib.util, os, html, io, contextlib
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('halo_build', os.path.join(HERE, 'halo', 'build.py'))
hb = importlib.util.module_from_spec(spec)
with contextlib.redirect_stdout(io.StringIO()): spec.loader.exec_module(hb)
e = html.escape

seal = hb.seal('x', 'WI-003', '4.0', hb.WI003_RING, label=hb.WI003_LABEL)
MARK = [(1, 200, 14), (2, 318, 92), (3, 352, 346), (4, 96, 262)]
marks = ''.join(f'<g><circle cx="{x}" cy="{y}" r="15" fill="#FF6720" opacity="0"/><circle cx="{x}" cy="{y}" r="14" fill="#fff"/><text x="{x}" y="{y+5}" text-anchor="middle" font-family="BwGradual,sans-serif" font-weight="800" font-size="15" fill="#002B32">{n}</text></g>' for n, x, y in MARK)
ANAT = [('Engraved rim', 'The full number, title, area and side, written around the seal. You can screenshot it and it still says exactly which document it is.'),
        ('36 month-ticks', 'One tick for every month of WI-003’s 36-month review cycle. Lit ticks have passed: 13 of 36 since it took effect on 30 Aug 2025.'),
        ('This month', 'The single orange spark, the only orange on the screen. Next review is 30 Aug 2028, when the ring closes.'),
        ('The centre', 'Number, revision and status, readable in two seconds from arm’s length.')]
anat = ''.join(f'<li><span class="nb">{i+1}</span><span><b>{e(t)}</b>{e(d)}</span></li>' for i, (t, d) in enumerate(ANAT))

def ph(k, cap): return f'<figure><a class="phone" href="halo/{k}.html"><img src="shots/halo-{k}-phone.jpg" alt="{e(cap)}, phone" width="780" height="1688" loading="lazy"></a><figcaption>{e(cap)}</figcaption></figure>'
def dk(k, cap): return f'<figure><a class="screen" href="halo/{k}.html"><img src="shots/halo-{k}-desktop.jpg" alt="{e(cap)}, desktop" width="1440" height="900" loading="lazy"></a><figcaption>{e(cap)}</figcaption></figure>'
S = [('home', 'Home · “One change touches your work.”'), ('search', 'Search · “pressure test”'), ('document', 'Document · WI-003')]

SKILLS = [('TAQA brand + TAQA UI/UX', 'Teal Green #00585A, Legacy Teal #00BFB2 for every lit tick, orange only as a single spark, Crimson safety callout for ALT-002, BW Gradual everywhere, filled two-tone icons, the official RISE logo files.'),
          ('TAQA KnowledgeHub frontend', 'The surface scale (#F4F6F6 sheet, white cards), teal-tinted shadows, 100dvh layouts, skip link, visible focus rings, role indicator, and logical structure ready for Arabic.'),
          ('Design taste', 'An asymmetric split hero instead of a centred one, dark and light materials with a real reason (the hero is identity, the sheet is work), inner-edge glass on the dock, and no generic card grids.'),
          ('Motion polish', 'Ease-out curves, every tap under 250 ms, presses scale to 0.97–0.98, entrances play once and never loop. The seal’s ticks sweep in, the rim settles, the figures count up. Reduced-motion users get none of it.'),
          ('Data visualisation', 'The shelf bar uses Coiled Tubing’s real counts (15 SOPs, 8 manuals, 5 standards, 4 lessons, 2 forms, 2 alerts = 36) with every value written next to its colour, so colour is never the only signal.')]
skills = ''.join(f'<tr><th>{e(a)}</th><td>{e(b)}</td></tr>' for a, b in SKILLS)
RISK = [('Sunlight', 'A deep hero is beautiful indoors and harder in direct sun. The live app already has a Sunlight mode for the quick reference card; Halo would need a light variant of the hero.'),
        ('Every seal needs a review cycle', 'The seal is only honest if each document type has a known review period. Where it is missing, the seal should show the status without ticks.'),
        ('It is one direction', 'Halo is shown on its own so you can judge it. N, N + TAQA and the earlier rounds are unchanged, and nothing is chosen or built.')]
risk = ''.join(f'<p><b>{e(a)}.</b> {e(b)}</p>' for a, b in RISK)

css = '''
:root{--ink:#002B32;--teal:#00585A;--glow:#00BFB2;--orange:#FF6720;--s0:#F4F6F6;--t1:#1A2C2C;--t2:#3D5454;--t3:#5E7373;--line:rgba(0,88,90,.14);--f:'BwGradual','DM Sans',system-ui,sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
html{background:var(--ink)}
body{background:var(--s0);color:var(--t1);font:400 17px/1.55 var(--f);-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit}
img{display:block;max-width:100%;height:auto}
.wrap{max-width:1240px;margin:0 auto;padding:0 40px}
@media (max-width:640px){.wrap{padding:0 16px}}
.top{position:relative;isolation:isolate;overflow:hidden;background:var(--ink);color:#fff;padding:28px 0 120px}
.top::before{content:"";position:absolute;inset:-30% -10% auto auto;width:900px;height:900px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,191,178,.26),rgba(0,191,178,0));z-index:-1}
.seis{position:absolute;inset:0;width:100%;height:100%;z-index:-1;opacity:.9}
.seis path{fill:none;stroke:rgba(0,191,178,.11);stroke-width:1}
.seis path:nth-child(5n){stroke:rgba(0,191,178,.2)}
.mt{display:flex;align-items:center;justify-content:space-between;gap:16px}
.mt img{height:36px;width:auto}
.badge{display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.18);font:600 13px/1 var(--f);color:rgba(255,255,255,.8)}
.badge i{width:7px;height:7px;border-radius:50%;background:var(--orange)}
.eyebrow{margin-top:56px;font:700 13px/1 var(--f);letter-spacing:.16em;text-transform:uppercase;color:var(--glow)}
h1{margin-top:14px;font:800 clamp(64px,13vw,168px)/.86 var(--f);letter-spacing:-.05em}
.sub{margin-top:18px;font:700 clamp(24px,3.4vw,40px)/1.1 var(--f);letter-spacing:-.025em}
.sub em{font-style:normal;color:var(--glow)}
.lede{margin-top:16px;max-width:58ch;font-size:18px;line-height:1.55;color:rgba(255,255,255,.74)}
.stage{position:relative;margin-top:48px;padding-right:180px}
.browser{border-radius:18px;overflow:hidden;background:#0A3B42;border:1px solid rgba(255,255,255,.14);box-shadow:0 40px 90px -40px rgba(0,0,0,.8)}
.browser .chrome{display:flex;gap:7px;padding:12px 14px;background:rgba(255,255,255,.06)}
.browser .chrome i{width:11px;height:11px;border-radius:50%;background:rgba(255,255,255,.22)}
.browser video{display:block;width:100%;aspect-ratio:1440/900;object-fit:cover;background:#002B32}
.pv{position:absolute;right:0;bottom:-60px;width:260px;border-radius:38px;padding:8px;background:#0F1F22;box-shadow:0 40px 80px -30px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.12)}
.pv video{display:block;width:100%;aspect-ratio:390/844;object-fit:cover;border-radius:31px;background:#002B32}
@media (max-width:860px){.stage{padding-right:0}.pv{position:relative;right:auto;bottom:auto;margin:28px auto 0;width:min(300px,80%)}}
section.s{padding:84px 0 0}
.k{font:700 13px/1 var(--f);letter-spacing:.16em;text-transform:uppercase;color:var(--teal)}
h2{margin-top:12px;font:800 clamp(32px,4.4vw,52px)/1.02 var(--f);letter-spacing:-.035em}
.intro{margin-top:14px;max-width:62ch;font-size:18px;color:var(--t2)}
.anat{display:grid;grid-template-columns:minmax(0,440px) minmax(0,1fr);gap:56px;align-items:center;margin-top:36px}
.sealbox{position:relative;border-radius:32px;background:var(--ink);padding:36px;box-shadow:0 30px 70px -40px rgba(0,43,50,.8)}
.sealbox svg{width:100%;height:auto;display:block;overflow:visible}
.sealbox .ov{position:absolute;top:36px;left:36px;width:calc(100% - 72px)}
.anat ol{list-style:none;display:flex;flex-direction:column;gap:22px}
.anat li{display:grid;grid-template-columns:40px 1fr;gap:16px;font-size:17px;line-height:1.5;color:var(--t2)}
.anat li b{display:block;font:700 20px/1.2 var(--f);color:var(--t1);margin-bottom:4px}
.nb{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:var(--ink);color:#fff;font:800 15px/1 var(--f)}
@media (max-width:860px){.anat{grid-template-columns:1fr;gap:32px}}
.phones{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px;margin-top:36px}
.phone{display:block;border-radius:34px;overflow:hidden;border:7px solid #0F1F22;background:#0F1F22;box-shadow:0 30px 60px -36px rgba(0,43,50,.7)}
.screen{display:block;border-radius:14px;overflow:hidden;border:1px solid var(--line);box-shadow:0 30px 60px -36px rgba(0,43,50,.6)}
figcaption{margin-top:12px;font:600 15px/1.35 var(--f);color:var(--t2)}
.desks{display:flex;flex-direction:column;gap:40px;margin-top:56px}
@media (max-width:860px){.phones{grid-template-columns:repeat(3,240px);overflow-x:auto;padding-bottom:8px}}
table{width:100%;border-collapse:collapse;margin-top:28px;font-size:16.5px;line-height:1.5}
th,td{text-align:left;vertical-align:top;padding:18px 20px 18px 0;border-top:1px solid var(--line)}
th{width:28%;font:700 17px/1.35 var(--f)}
td{color:var(--t2)}
@media (max-width:700px){tr{display:block;border-top:1px solid var(--line);padding:14px 0}th,td{display:block;width:auto;border:0;padding:3px 0}}
.risk{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:28px}
.risk p{padding:22px;border-radius:20px;background:#fff;box-shadow:0 1px 2px rgba(0,43,50,.06),0 12px 32px -18px rgba(0,43,50,.28);font-size:16px;line-height:1.55;color:var(--t2)}
.risk b{display:block;font:700 18px/1.25 var(--f);color:var(--t1);margin-bottom:6px}
@media (max-width:860px){.risk{grid-template-columns:1fr}}
footer{margin-top:96px;padding:28px 0 40px;border-top:1px solid var(--line);font-size:14px;color:var(--t3)}
@media (prefers-reduced-motion:reduce){video{display:none}}
'''
doc = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#002B32">
<title>RISE Halo</title>
<link rel="stylesheet" href="../kit/fonts.css">
<style>{css}
.seal .rim{{fill:none;stroke:rgba(255,255,255,.12)}}.seal .disc{{fill:url(#discg);stroke:rgba(255,255,255,.14)}}.seal .tk{{stroke:rgba(255,255,255,.18);stroke-width:4;stroke-linecap:round}}.seal .tk.lit{{stroke:#00BFB2}}.seal .now{{fill:#FF6720}}
.seal .ringtxt{{font:700 12.5px/1 var(--f);letter-spacing:.2em;fill:rgba(255,255,255,.5);text-transform:uppercase}}.seal .code{{font:800 64px/1 var(--f);letter-spacing:-.03em;fill:#fff}}.seal .rev{{font:700 15px/1 var(--f);letter-spacing:.12em;fill:rgba(255,255,255,.7)}}.seal .stt{{font:700 17px/1 var(--f);fill:#7FE6DA}}.seal .cap{{font:500 12.5px/1 var(--f);fill:rgba(255,255,255,.55);letter-spacing:.04em}}
</style>
</head>
<body>
<header class="top">
  {hb.seismic()}
  <div class="wrap">
    <div class="mt"><img src="../kit/brand/rise-lockup-header-reverse.png" alt="RISE" width="96" height="36"><span class="badge"><i></i>Design exploration · not implemented</span></div>
    <p class="eyebrow">Round 6 · One new direction</p>
    <h1>Halo</h1>
    <p class="sub">Every document wears <em>its trust</em>.</p>
    <p class="lede">A deep TAQA-ink hero with a seismic texture, a light work sheet that rises over it, and one signature object: the trust seal. Its ring of month-ticks shows exactly where a document is in its review cycle, and its rim carries the document’s full identity. Home leads with the one change that touches your work today.</p>
    <div class="stage">
      <div class="browser"><div class="chrome"><i></i><i></i><i></i></div><video src="shots/halo-motion-desktop.webm" autoplay muted loop playsinline aria-label="Desktop screen recording of Halo"></video></div>
      <div class="pv"><video src="shots/halo-motion-phone.webm" autoplay muted loop playsinline aria-label="Phone screen recording of Halo"></video></div>
    </div>
  </div>
</header>
<main class="wrap">
  <section class="s">
    <p class="k">The signature</p>
    <h2>The trust seal</h2>
    <p class="intro">Today, “is this the right revision, and is it still trusted?” is answered by reading grey metadata. Halo turns the answer into one object you recognise from across a room.</p>
    <div class="anat">
      <div class="sealbox">{seal}<svg class="ov" viewBox="0 0 400 400" aria-hidden="true">{marks}</svg></div>
      <ol>{anat}</ol>
    </div>
  </section>
  <section class="s">
    <p class="k">Phone first</p>
    <h2>Three screens, real content</h2>
    <p class="intro">Faisal Al-Ghamdi, Field Supervisor, Coiled Tubing. Every document, date and count comes from the RISE register used in all earlier rounds. Tap a screen to open the live mockup.</p>
    <div class="phones">{''.join(ph(k, c) for k, c in S)}</div>
    <div class="desks">{''.join(dk(k, c) for k, c in S)}</div>
  </section>
  <section class="s">
    <p class="k">How it was made</p>
    <h2>Five design skills, one result</h2>
    <table><tbody>{skills}</tbody></table>
  </section>
  <section class="s">
    <p class="k">Honest notes</p>
    <h2>Before you fall in love</h2>
    <div class="risk">{risk}</div>
  </section>
</main>
<footer><div class="wrap">RISE design exploration · round 6 · Halo · Built by TAQA Learning Center · branch design/rise-exploration</div></footer>
</body>
</html>'''
open(os.path.join(HERE, 'index.html'), 'w').write(doc)
print('ok')
