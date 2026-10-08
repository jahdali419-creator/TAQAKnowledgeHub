"""Two bold homepage directions ("surprise me"): A · Night Shift (dark, cinematic) and B · Daylight (bright, modern).
Real register data and TAQA's own photography; design exploration only."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from reg import *

EMP = inforce('employee')
CT = [r for r in EMP if r['segment'] == 'coiled-tubing']
CHANGED = sorted([r for r in CT if not r.get('translationOf')], key=lambda r: r['issueDate'], reverse=True)[:5]
ALERT = BYNUM['TQ-TWS-CTSS-ALT-003']
ACROSS = sorted(EMP, key=lambda r: r['issueDate'], reverse=True)[:6]
N = {k: sum(r['docType'] == k for r in EMP) for k in ('sop', 'manual', 'standard', 'alert', 'lesson')}
BOP = next(g for g in GLOSS if g.get('abbr') == 'BOP')

SVG = {
 'search': 'M10.5 4a6.5 6.5 0 0 1 5.2 10.4l4.4 4.4-1.4 1.4-4.4-4.4A6.5 6.5 0 1 1 10.5 4zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z',
 'arrow': 'M13 5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2l-4.6-4.6z',
 'alert': 'M12 2 22 20H2zm-1 7v5h2V9zm0 7v2h2v-2z',
 'book': 'M6 3h12v18l-6-4.2L6 21z',
 'chat': 'M4 4h16v12H8l-4 4z',
 'abc': 'M4 18 8 6h2l4 12h-2l-1-3H7l-1 3zm3.6-5h2.8L9 8.8zM15 6h2v12h-2z',
 'layers': 'M12 3 22 8l-10 5L2 8zm-8 9 8 4 8-4 2 1-10 5L2 13z',
}
def ic(n, c=''): return f'<svg class="{c}" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="{SVG[n]}"/></svg>'

def shell(title, css, body, script=''):
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><link rel="stylesheet" href="../../kit/fonts.css"><style>{css}</style></head><body>{body}{f"<script>{script}</script>" if script else ""}</body></html>'''

rowsA = ''.join(f'<a class="doc" href="document.html"><span class="n">{short(r["docNumber"])}</span><b>{r["title"]}</b><span class="m">Rev {r["revision"]} · {d(r["issueDate"])}</span><span class="ok"><i></i>Current</span></a>' for r in CHANGED)
tickA = ''.join(f'<span><em class="{"al" if r["docType"] == "alert" else ""}"></em>{short(r["docNumber"])} · {r["title"]} · {segname(r["segment"])}</span>' for r in ACROSS)

TYPE_SCRIPT = '''(function(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;var t=document.getElementById('tq'),a=document.getElementById('ta'),w='WI-003',i=0;
a.classList.add('wait');t.textContent='';setTimeout(function s(){t.textContent=w.slice(0,++i);if(i<w.length)setTimeout(s,130);else setTimeout(function(){a.classList.remove('wait')},350)},700)})();'''

# ════════════════ A · NIGHT SHIFT ════════════════
cssA = '''
:root{--bg:#070D0D;--panel:#0F1918;--line:rgba(255,255,255,.09);--fg:#F2F5F3;--mute:#8FA09C;--teal:#00BFB2;--spark:#FF6720;--crim:#E8324A;--ok:#3CD69B;
--display:'BwGradual',Inter,sans-serif;--ui:Inter,system-ui,sans-serif;--mono:'PlexMono',ui-monospace,monospace}
*{box-sizing:border-box;margin:0;padding:0}html{overflow-x:clip}body{background:var(--bg);color:var(--fg);font:400 15px/1.5 var(--ui);-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}svg{width:20px;height:20px;flex:none}
.w{width:1280px;max-width:calc(100% - 48px);margin:0 auto}
.hero{position:relative;min-height:760px;display:flex;flex-direction:column;overflow:hidden}
.hero .bg{position:absolute;inset:0;background:url(../img/taqa-hero-5.jpeg) center 40%/cover;transform:scale(1.06);animation:drift 28s ease-in-out infinite alternate}
.hero .bg::after{content:"";position:absolute;inset:0;background:radial-gradient(120% 90% at 70% 10%,rgba(7,13,13,.25),rgba(7,13,13,.86) 60%,var(--bg) 100%),linear-gradient(to bottom,rgba(7,13,13,.55),transparent 30%)}
@keyframes drift{to{transform:scale(1.14) translate(-1.5%,-1%)}}
.nav{position:relative;z-index:2;display:flex;align-items:center;gap:34px;height:84px}
.nav img{height:28px;filter:brightness(0) invert(1)}.nav .links{display:flex;gap:28px;font:500 14px/1 var(--ui);color:#C9D3D0}.nav .links a.on{color:#fff}
.nav .sp{flex:1}.nav .av{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.12);backdrop-filter:blur(10px);font:600 12px var(--ui)}
.nav .bell{position:relative;color:#C9D3D0}.nav .bell i{position:absolute;top:-2px;right:-3px;width:7px;height:7px;border-radius:50%;background:var(--spark)}
.hc{position:relative;z-index:2;margin-top:auto;padding-bottom:70px}
.kick{display:inline-flex;align-items:center;gap:10px;padding:8px 14px;border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.06);backdrop-filter:blur(12px);font:500 12px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:#D7E0DD}
.kick i{width:7px;height:7px;border-radius:50%;background:var(--ok);box-shadow:0 0 12px var(--ok)}
h1{margin-top:22px;font:700 clamp(54px,8vw,124px)/.92 var(--display);letter-spacing:-.05em;max-width:12ch}
h1 span{background:linear-gradient(90deg,#fff,var(--teal));-webkit-background-clip:text;background-clip:text;color:transparent}
.sbox{margin-top:34px;max-width:760px;padding:10px;border:1px solid rgba(255,255,255,.14);border-radius:22px;background:rgba(15,25,24,.55);backdrop-filter:blur(18px);box-shadow:0 40px 90px -30px rgba(0,0,0,.8)}
.sline{display:flex;align-items:center;gap:14px;padding:12px 16px}.sline svg{width:26px;height:26px;color:var(--teal)}
.sline .v{font:600 34px/1 var(--display);letter-spacing:-.02em}.sline .c{width:3px;height:34px;background:var(--spark);animation:blink 1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}.sline kbd{margin-left:auto;font:500 12px var(--mono);padding:6px 9px;border:1px solid var(--line);border-radius:8px;color:var(--mute)}
.ans{display:flex;align-items:center;gap:16px;margin:4px 6px 6px;padding:16px 18px;border-radius:14px;background:linear-gradient(90deg,rgba(60,214,155,.16),rgba(60,214,155,.04));border:1px solid rgba(60,214,155,.25);transition:opacity .4s,transform .4s}
.ans.wait{opacity:0;transform:translateY(8px)}.ans .dot{width:12px;height:12px;border-radius:50%;background:var(--ok);box-shadow:0 0 16px var(--ok)}
.ans b{font:700 19px/1.2 var(--display)}.ans span{display:block;margin-top:3px;font:500 12px/1 var(--mono);color:#B6C6C1;letter-spacing:.04em}.ans .go{margin-left:auto;color:var(--ok)}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.chips a{padding:9px 14px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.05);font:500 13.5px/1 var(--ui);color:#D7E0DD}
.stats{display:flex;gap:44px;margin-top:40px}.stats b{display:block;font:700 40px/1 var(--display);letter-spacing:-.03em}.stats span{font:500 11px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--mute)}
.sec{padding:90px 0 0}.sh{display:flex;align-items:baseline;gap:16px}.sh h2{font:700 36px/1 var(--display);letter-spacing:-.03em}.sh span{font:500 12px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}.sh a{margin-left:auto;color:var(--teal);font:500 14px var(--ui)}
.bento{display:grid;grid-template-columns:1.25fr 1fr 1fr;grid-template-rows:260px 220px;gap:16px;margin-top:26px}
.tile{position:relative;border-radius:22px;border:1px solid var(--line);background:var(--panel);padding:26px;overflow:hidden;transition:transform .25s,border-color .25s}
.tile:hover{transform:translateY(-3px);border-color:rgba(0,191,178,.4)}
.tile .lab{font:500 11px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--mute)}
.tile h3{margin-top:12px;font:700 28px/1.05 var(--display);letter-spacing:-.025em}
.tile .big{font:700 64px/1 var(--display);letter-spacing:-.04em}
.t-ct{grid-row:span 2;background:url(../img/taqa-hero-3.jpeg) center/cover;display:flex;flex-direction:column;justify-content:flex-end}
.t-ct::before{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(7,13,13,.95),rgba(7,13,13,.2) 55%)}
.t-ct > *{position:relative}.t-ct .row{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}.t-ct .row span{padding:7px 12px;border-radius:999px;background:rgba(255,255,255,.1);backdrop-filter:blur(8px);font:500 12.5px var(--ui)}
.t-al{background:radial-gradient(120% 120% at 0% 0%,rgba(232,50,74,.28),var(--panel) 60%);border-color:rgba(232,50,74,.35)}
.t-al .lab{color:#FF8A9A}.t-al svg{color:var(--crim);width:28px;height:28px}.t-al h3{font-size:22px}.t-al .m{margin-top:10px;font:500 12px var(--mono);color:#C9A3AA}
.t-sv .big{color:var(--teal)}.t-sv p,.t-gl p{margin-top:8px;color:var(--mute)}
.t-gl{background:radial-gradient(110% 110% at 100% 100%,rgba(0,191,178,.2),var(--panel) 60%)}.t-gl .abbr{font:600 46px/1 var(--mono);letter-spacing:-.04em;color:#fff}.t-gl .def{margin-top:10px;font:400 14px/1.5 var(--ui);color:#B6C6C1}
.t-ask{background:linear-gradient(135deg,var(--spark),#FF8B4D);color:#1A0B03;border:0}.t-ask .lab{color:rgba(26,11,3,.65)}.t-ask h3{font-size:30px}.t-ask .go{position:absolute;right:24px;bottom:24px;width:48px;height:48px;border-radius:50%;background:#1A0B03;color:#fff;display:grid;place-items:center}
.list{margin-top:26px;display:grid;gap:10px}
.doc{display:grid;grid-template-columns:110px minmax(0,1fr) 190px 110px;align-items:center;gap:16px;padding:18px 22px;border-radius:16px;border:1px solid var(--line);background:var(--panel);transition:border-color .2s,background .2s}
.doc:hover{border-color:rgba(0,191,178,.45);background:#122120}.doc .n{font:600 13px var(--mono);color:var(--teal)}.doc b{font:600 16.5px/1.3 var(--ui)}.doc .m{font:500 12px var(--mono);color:var(--mute)}
.doc .ok{justify-self:end;display:inline-flex;align-items:center;gap:8px;font:500 13px var(--ui);color:var(--ok)}.doc .ok i{width:8px;height:8px;border-radius:50%;background:var(--ok);box-shadow:0 0 10px var(--ok)}
.tick{margin-top:90px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);overflow:hidden;white-space:nowrap}
.tick div{display:inline-flex;gap:54px;padding:18px 0;animation:tk 50s linear infinite;font:500 13px var(--mono);color:#B6C6C1}
.tick em{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--ok);margin-right:12px;vertical-align:1px}.tick em.al{background:var(--crim);border-radius:1px;transform:rotate(45deg)}
@keyframes tk{to{transform:translateX(-50%)}}
.foot{display:flex;justify-content:space-between;padding:34px 0 60px;font:500 11.5px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
@media (prefers-reduced-motion:reduce){.hero .bg,.tick div,.sline .c{animation:none}}
@media (max-width:720px){
 .w{max-width:calc(100% - 32px)}.nav{height:64px}.nav .links,.nav .bell{display:none}.nav img{height:22px}
 .hero{min-height:auto}.hc{padding:40px 0 40px}h1{font-size:50px}.sbox{border-radius:18px}.sline .v{font-size:26px}.sline kbd{display:none}
 .ans b{font-size:16px}.chips a:nth-child(n+4){display:none}.stats{display:grid;grid-template-columns:1fr 1fr;gap:18px}.stats b{font-size:30px}.stats span{display:block;margin-top:6px}
 .sec{padding-top:56px}.sh{flex-wrap:wrap}.sh span{display:none}.sh h2{font-size:26px}.bento{grid-template-columns:1fr 1fr;grid-template-rows:auto}.t-ct{grid-column:span 2;grid-row:auto;min-height:260px}
 .tile{padding:20px;border-radius:18px}.tile .big{font-size:46px}.t-al,.t-ask{grid-column:span 2}.t-gl .abbr{font-size:34px}
 .doc{grid-template-columns:1fr auto;gap:6px 12px;padding:16px}.doc .n{grid-column:1}.doc .ok{grid-column:2;grid-row:1}.doc b{grid-column:1/-1}.doc .m{grid-column:1/-1}
 .tick{margin-top:56px}
}
'''
bodyA = f'''<header class="hero"><div class="bg"></div>
<div class="w nav"><img src="../../kit/brand/rise-lockup-header.png" alt="RISE"><nav class="links"><a class="on" href="#">Home</a><a href="areas.html">Areas</a><a href="saved.html">Saved</a><a href="ask.html">Ask an Expert</a><a href="glossary.html">Field Glossary</a></nav>
<span class="sp"></span><a class="bell" href="notifications.html">{ic("alert")}<i></i></a><span class="av">FA</span></div>
<div class="w hc"><span class="kick"><i></i>Register live · {len(EMP)} documents in force</span>
<h1>Every answer, <span>within reach.</span></h1>
<div class="sbox"><div class="sline">{ic("search")}<span class="v" id="tq">WI-003</span><span class="c"></span><kbd>/ to search</kbd></div>
<a class="ans" id="ta" href="document.html"><span class="dot"></span><span><b>Injector Head Operations Manual</b><span>TQ-TWS-CTSS-WI-003 · REV 4.0 · CURRENT, OK TO USE</span></span><span class="go">{ic("arrow")}</span></a></div>
<div class="chips"><a href="search-results.html">pressure</a><a href="search-typing.html">inject</a><a href="seg-coiled-tubing.html">Coiled Tubing</a><a href="glossary.html">H2S</a></div>
<div class="stats"><div><b>{len(EMP)}</b><span>In force</span></div><div><b>25</b><span>Areas</span></div><div><b>{N["alert"]}</b><span>Active alerts</span></div><div><b>254</b><span>Field terms</span></div></div></div></header>
<main class="w">
<section class="sec"><div class="sh"><h2>Your Coiled Tubing</h2><span>Tuesday 6 October</span><a href="seg-coiled-tubing.html">Open area →</a></div>
<div class="bento">
 <a class="tile t-ct" href="seg-coiled-tubing.html"><span class="lab">Your area · Operations</span><h3 style="font-size:44px">Coiled Tubing</h3><div class="row"><span>{len(CT)} in force</span><span>8 SOPs</span><span>6 manuals</span><span>1 alert</span></div></a>
 <a class="tile t-al" href="#">{ic("alert")}<p class="lab" style="margin-top:14px">Technical alert · {short(ALERT["docNumber"])}</p><h3>{ALERT["title"]}</h3><p class="m">Rev {ALERT["revision"]} · Coiled Tubing</p></a>
 <a class="tile t-sv" href="saved.html"><span class="lab">Saved on this device</span><p class="big" style="margin-top:14px">3</p><p>WI-003 · F001 · SOP-009</p></a>
 <a class="tile t-gl" href="glossary-term.html"><span class="lab">Field Glossary · term of the day</span><p class="abbr" style="margin-top:14px">{BOP["abbr"]}</p><p class="def">{BOP["full"]}. {BOP["def"][:92]}…</p></a>
 <a class="tile t-ask" href="ask.html"><span class="lab">Stuck on site?</span><h3>Ask the Coiled Tubing Expert</h3><span class="go">{ic("arrow")}</span></a>
</div></section>
<section class="sec"><div class="sh"><h2>Changed in your area</h2><span>Newest first</span><a href="seg-coiled-tubing.html">View all →</a></div><div class="list">{rowsA}</div></section>
</main>
<div class="tick" aria-label="Across TAQA"><div>{tickA}{tickA}</div></div>
<footer class="w foot"><span>RISE · TAQA knowledge</span><span>Direction A · Night Shift · design exploration</span></footer>'''
open(os.path.join(PAGES, 'bold-night.html'), 'w').write(shell('RISE · Night Shift', cssA, bodyA, TYPE_SCRIPT))

# ════════════════ B · DAYLIGHT ════════════════
cssB = '''
:root{--bg:#FAFAF7;--card:#FFFFFF;--ink:#0E1B1A;--mute:#6B7774;--line:#E7E5DF;--teal:#00585A;--teal2:#00BFB2;--tealbg:#E5F4F2;--spark:#FF6720;--sparkbg:#FFEFE6;--crim:#C8102E;--crimbg:#FCECEE;--ok:#1D7A5E;
--display:'BwGradual',Inter,sans-serif;--ui:Inter,system-ui,sans-serif;--mono:'PlexMono',ui-monospace,monospace}
*{box-sizing:border-box;margin:0;padding:0}html{overflow-x:clip}body{background:var(--bg);color:var(--ink);font:400 15px/1.5 var(--ui);-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}svg{width:20px;height:20px;flex:none}
.w{width:1280px;max-width:calc(100% - 48px);margin:0 auto}
.nav{display:flex;align-items:center;gap:30px;height:80px}.nav img{height:28px}
.nav .links{display:flex;gap:6px;padding:5px;border-radius:999px;background:#fff;border:1px solid var(--line);box-shadow:0 6px 20px -14px rgba(14,27,26,.3)}
.nav .links a{padding:9px 16px;border-radius:999px;font:500 14px/1 var(--ui);color:var(--mute)}.nav .links a.on{background:var(--ink);color:#fff}
.nav .sp{flex:1}.nav .up{padding:11px 18px;border-radius:999px;border:1px solid var(--line);background:#fff;font:500 14px var(--ui)}
.nav .av{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--teal);color:#fff;font:600 13px var(--ui)}
.hero{display:grid;grid-template-columns:1.05fr 1fr;gap:48px;align-items:center;padding:46px 0 20px}
.hi{font:500 13px var(--ui);display:inline-flex;align-items:center;gap:10px;padding:8px 14px 8px 8px;border-radius:999px;background:#fff;border:1px solid var(--line)}
.hi b{padding:4px 9px;border-radius:999px;background:var(--sparkbg);color:var(--spark);font:600 11px var(--mono);letter-spacing:.06em}
h1{margin-top:22px;font:700 clamp(52px,6.6vw,96px)/.95 var(--display);letter-spacing:-.05em}
h1 em{font-style:normal;color:var(--teal)}
.lede{margin-top:20px;max-width:44ch;font:400 18px/1.55 var(--ui);color:var(--mute)}
.pill{margin-top:30px;display:flex;align-items:center;gap:12px;padding:10px 10px 10px 22px;border-radius:999px;background:#fff;border:1px solid var(--line);box-shadow:0 24px 50px -30px rgba(14,27,26,.45);max-width:600px}
.pill svg{color:var(--mute)}.pill .v{font:500 19px var(--ui)}.pill .c{width:2px;height:24px;background:var(--spark);animation:blink 1s steps(1) infinite}@keyframes blink{50%{opacity:0}}
.pill .btn{margin-left:auto;padding:14px 24px;border-radius:999px;background:var(--ink);color:#fff;font:600 15px var(--ui)}
.try{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;font:400 14px var(--ui);color:var(--mute);align-items:center}.try a{padding:7px 12px;border-radius:999px;background:#fff;border:1px solid var(--line);color:var(--ink);font-weight:500}
.vis{position:relative;height:560px}
.vis .ph{position:absolute;inset:0 0 0 40px;border-radius:32px;background:url(../img/product-centre.webp) center/cover;box-shadow:0 50px 90px -50px rgba(14,27,26,.6)}
.float{position:absolute;background:rgba(255,255,255,.92);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.7);border-radius:20px;box-shadow:0 30px 60px -30px rgba(14,27,26,.5);padding:18px 20px;animation:fl 6s ease-in-out infinite}
@keyframes fl{50%{transform:translateY(-8px)}}
.f1{left:0;bottom:70px;width:330px;transition:opacity .4s,transform .4s}.f1.wait{opacity:0;transform:translateY(12px)}
.f1 .n{font:600 11.5px var(--mono);letter-spacing:.05em;color:var(--teal)}.f1 b{display:block;margin-top:6px;font:700 20px/1.15 var(--display);letter-spacing:-.02em}
.f1 .st{display:inline-flex;align-items:center;gap:8px;margin-top:12px;padding:7px 12px;border-radius:999px;background:#E3F4EC;color:var(--ok);font:600 13px var(--ui)}.f1 .st i{width:8px;height:8px;border-radius:50%;background:var(--ok)}
.f2{right:26px;top:30px;display:flex;align-items:center;gap:12px;animation-delay:-3s}.f2 .ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--crimbg);color:var(--crim)}
.f2 b{display:block;font:600 14px var(--ui)}.f2 span{font:500 12px var(--mono);color:var(--mute)}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:40px}
.stat{padding:22px 24px;border-radius:22px;background:#fff;border:1px solid var(--line)}.stat b{display:block;font:700 44px/1 var(--display);letter-spacing:-.04em}.stat span{display:block;margin-top:8px;font:500 13px var(--ui);color:var(--mute)}
.stat.t{background:var(--teal);border-color:var(--teal);color:#fff}.stat.t span{color:#BFE3E0}
.sec{padding:80px 0 0}.sh{display:flex;align-items:end;gap:16px}.sh h2{font:700 40px/1 var(--display);letter-spacing:-.035em}.sh p{color:var(--mute);margin-top:8px}.sh a{margin-left:auto;padding:11px 18px;border-radius:999px;border:1px solid var(--line);background:#fff;font:500 14px var(--ui)}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:28px}
.card{border-radius:24px;background:#fff;border:1px solid var(--line);padding:24px;display:flex;flex-direction:column;gap:12px;min-height:250px;transition:transform .25s,box-shadow .25s}
.card:hover{transform:translateY(-4px);box-shadow:0 30px 50px -34px rgba(14,27,26,.45)}
.card .ic{width:46px;height:46px;border-radius:14px;display:grid;place-items:center}.card .ic svg{width:22px;height:22px}
.card h3{font:700 23px/1.1 var(--display);letter-spacing:-.02em}.card p{color:var(--mute);font-size:14px}.card .go{margin-top:auto;display:flex;justify-content:space-between;align-items:center;font:600 14px var(--ui)}
.card.ct{grid-column:span 2;background:url(../img/taqa-hero-5.jpeg) center/cover;color:#fff;border:0;position:relative;overflow:hidden}
.card.ct::before{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(14,27,26,.92),rgba(14,27,26,.15) 60%)}.card.ct > *{position:relative}.card.ct p{color:#D5E2DF}
.card.ct h3{font-size:40px;margin-top:auto}.card.ct .chips{display:flex;gap:8px;flex-wrap:wrap}.card.ct .chips span{padding:7px 12px;border-radius:999px;background:rgba(255,255,255,.18);backdrop-filter:blur(8px);font:500 13px var(--ui)}
.c-al .ic{background:var(--crimbg);color:var(--crim)}.c-sv .ic{background:var(--tealbg);color:var(--teal)}.c-ask .ic{background:var(--sparkbg);color:var(--spark)}.c-gl .ic{background:#EEF0FF;color:#4450B8}
.c-al{border-color:#F4CCD3}.card.wide{grid-column:span 2}.c-al .m{font:500 12px var(--mono);color:var(--crim)}
.list{margin-top:28px;border-radius:24px;background:#fff;border:1px solid var(--line);overflow:hidden}
.doc{display:grid;grid-template-columns:56px 110px minmax(0,1fr) 170px 110px;align-items:center;gap:16px;padding:16px 24px;border-top:1px solid var(--line)}.doc:first-child{border-top:0}
.doc:hover{background:#FBFBF8}.doc .t{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--tealbg);color:var(--teal);font:600 10.5px var(--mono)}
.doc .n{font:600 13px var(--mono);color:var(--mute)}.doc b{font:600 16px/1.3 var(--ui)}.doc .m{font:500 12.5px var(--mono);color:var(--mute)}.doc .ok{justify-self:end;padding:6px 12px;border-radius:999px;background:#E3F4EC;color:var(--ok);font:600 12.5px var(--ui)}
.band{margin-top:80px;border-radius:32px;background:var(--ink);color:#fff;padding:56px;display:grid;grid-template-columns:1fr auto;gap:30px;align-items:center}
.band h2{font:700 54px/1 var(--display);letter-spacing:-.04em}.band h2 em{font-style:normal;color:var(--teal2)}.band a{padding:16px 28px;border-radius:999px;background:var(--spark);color:#fff;font:600 16px var(--ui)}
.foot{display:flex;justify-content:space-between;padding:30px 0 50px;font:500 11.5px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
@media (prefers-reduced-motion:reduce){.float,.pill .c{animation:none}}
@media (max-width:720px){
 .w{max-width:calc(100% - 32px)}.nav{height:64px}.nav .links,.nav .up{display:none}.nav img{height:22px}
 .hero{grid-template-columns:1fr;gap:28px;padding-top:20px}h1{font-size:46px}.lede{font-size:16px}
 .pill{padding:8px 8px 8px 16px}.pill .v{font-size:16px}.pill .btn{padding:12px 16px}.try a:nth-child(n+4){display:none}
 .vis{height:380px}.vis .ph{inset:0;border-radius:24px}.f1{left:12px;bottom:14px;width:auto;right:12px}.f2{right:12px;top:12px}
 .stats{grid-template-columns:1fr 1fr;gap:10px}.stat b{font-size:34px}.stat{padding:18px}
 .sec{padding-top:56px}.sh{flex-wrap:wrap}.sh h2{font-size:30px}.sh a{margin-left:0}
 .grid{grid-template-columns:1fr 1fr;gap:10px}.card{min-height:180px;padding:18px;border-radius:20px}.card.ct,.card.wide{grid-column:span 2}.card.ct{min-height:240px}.card h3{font-size:19px}.card.ct h3{font-size:32px}.card p{display:none}.card.ct p{display:block}
 .doc{grid-template-columns:40px 1fr auto;gap:6px 12px;padding:14px 16px}.doc .t{grid-row:span 2}.doc .n{grid-column:2}.doc .ok{grid-column:3;grid-row:1}.doc b{grid-column:2/-1}.doc .m{display:none}
 .band{padding:32px 24px;grid-template-columns:1fr;border-radius:24px}.band h2{font-size:34px}.band a{text-align:center}
}
'''
MK = {'sop': 'SOP', 'manual': 'WI', 'standard': 'ST', 'form': 'FRM', 'alert': 'ALT', 'lesson': 'LL'}
rowsB = ''.join(f'<a class="doc" href="document.html"><span class="t">{MK[r["docType"]]}</span><span class="n">{short(r["docNumber"])}</span><b>{r["title"]}</b><span class="m">Rev {r["revision"]} · {d(r["issueDate"], "%d %b")}</span><span class="ok">Current</span></a>' for r in CHANGED)
bodyB = f'''<div class="w nav"><img src="../../kit/brand/rise-lockup-header.png" alt="RISE"><nav class="links"><a class="on" href="#">Home</a><a href="areas.html">Areas</a><a href="saved.html">Saved</a><a href="ask.html">Ask</a><a href="glossary.html">Glossary</a></nav>
<span class="sp"></span><a class="up" href="upload.html">Upload</a><span class="av">FA</span></div>
<main class="w">
<section class="hero"><div>
  <span class="hi"><b>LIVE</b>Register 06 Oct 2026 · {len(EMP)} in force</span>
  <h1>Find the right document. <em>Know it’s current.</em></h1>
  <p class="lede">Every procedure, manual, standard and alert TAQA controls, with its revision and status, one search away.</p>
  <div class="pill">{ic("search")}<span class="v" id="tq">WI-003</span><span class="c"></span><a class="btn" href="search-number.html">Search</a></div>
  <div class="try">Try<a href="search-results.html">pressure</a><a href="search-typing.html">inject</a><a href="seg-coiled-tubing.html">Coiled Tubing</a><a href="glossary.html">H2S</a></div>
</div>
<div class="vis"><div class="ph" role="img" aria-label="Precision parts, checked by hand"></div>
  <a class="float f1" id="ta" href="document.html"><span class="n">TQ-TWS-CTSS-WI-003 · REV 4.0</span><b>Injector Head Operations Manual</b><span class="st"><i></i>Current, OK to use</span></a>
  <a class="float f2" href="#"><span class="ic">{ic("alert")}</span><span><b>1 active alert</b><span>{short(ALERT["docNumber"])} · Coiled Tubing</span></span></a>
</div></section>
<div class="stats"><div class="stat t"><b>{len(EMP)}</b><span>Documents in force</span></div><div class="stat"><b>25</b><span>Areas across TAQA</span></div><div class="stat"><b>{N["alert"]}</b><span>Active technical alerts</span></div><div class="stat"><b>254</b><span>Field terms</span></div></div>
<section class="sec"><div class="sh"><div><h2>Good morning, Faisal</h2><p>Coiled Tubing · Operations · Tuesday 6 October</p></div><a href="seg-coiled-tubing.html">Open your area</a></div>
<div class="grid">
 <a class="card ct" href="seg-coiled-tubing.html"><div class="chips"><span>{len(CT)} in force</span><span>Your area</span></div><h3>Coiled Tubing</h3><p>Procedures, manuals, standards, forms, alerts and lessons for every CT unit.</p></a>
 <a class="card c-al" href="#"><span class="ic">{ic("alert")}</span><span class="m">ALERT · {short(ALERT["docNumber"])}</span><h3>{ALERT["title"]}</h3><span class="go">Read <span>→</span></span></a>
 <a class="card c-sv" href="saved.html"><span class="ic">{ic("book")}</span><h3>Saved</h3><p>WI-003, F001 and SOP-009, ready offline.</p><span class="go">3 documents <span>→</span></span></a>
 <a class="card c-ask" href="ask.html"><span class="ic">{ic("chat")}</span><h3>Ask an Expert</h3><p>Send a field problem, with a marked-up photo.</p><span class="go">Coiled Tubing Expert <span>→</span></span></a>
 <a class="card c-gl" href="glossary-term.html"><span class="ic">{ic("abc")}</span><h3>{BOP["abbr"]} · {BOP["full"]}</h3><p>Term of the day from 254 field terms.</p><span class="go">Glossary <span>→</span></span></a>
 <a class="card c-sv wide" href="areas.html"><span class="ic">{ic("layers")}</span><h3>All 25 areas</h3><p>Segments, functions and Centres of Excellence.</p><span class="go">Browse <span>→</span></span></a>
</div></section>
<section class="sec"><div class="sh"><div><h2>Changed in Coiled Tubing</h2><p>Newest first · in force</p></div><a href="seg-coiled-tubing.html">View all</a></div><div class="list">{rowsB}</div></section>
<section class="band"><h2>Knowledge is better <em>together.</em></h2><a href="ask.html">Ask an Expert</a></section>
</main><footer class="w foot"><span>RISE · TAQA knowledge</span><span>Direction B · Daylight · design exploration</span></footer>'''
open(os.path.join(PAGES, 'bold-day.html'), 'w').write(shell('RISE · Daylight', cssB, bodyB, TYPE_SCRIPT))
print('bold ok')

# ════════════════ MIX · Night Shift hero + Daylight body (chosen) ════════════════
cssHero = '''
.mx{position:relative;min-height:720px;display:flex;flex-direction:column;overflow:hidden;background:#070D0D;color:#F2F5F3;border-radius:0 0 36px 36px}
.mx .bg{position:absolute;inset:0;background:url(../img/taqa-hero-5.jpeg) center 40%/cover;transform:scale(1.06);animation:drift 28s ease-in-out infinite alternate}
.mx .bg::after{content:"";position:absolute;inset:0;background:radial-gradient(120% 90% at 70% 10%,rgba(7,13,13,.25),rgba(7,13,13,.86) 62%,#070D0D 100%),linear-gradient(to bottom,rgba(7,13,13,.55),transparent 30%)}
@keyframes drift{to{transform:scale(1.14) translate(-1.5%,-1%)}}
.mx .hn{position:relative;z-index:2;display:flex;align-items:center;gap:30px;height:84px}
.mx .hn img{height:28px;filter:brightness(0) invert(1)}
.mx .hn .links{display:flex;gap:6px;padding:5px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(14px)}
.mx .hn .links a{padding:9px 16px;border-radius:999px;font:500 14px/1 var(--ui);color:#C9D3D0}.mx .hn .links a.on{background:#fff;color:#0E1B1A}
.mx .hn .sp{flex:1}.mx .hn .up{padding:11px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);font:500 14px var(--ui);color:#fff}
.mx .hn .av{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:#00BFB2;color:#062221;font:700 13px var(--ui)}
.mx .hc{position:relative;z-index:2;margin-top:auto;padding:0 0 64px}
.mx .kick{display:inline-flex;align-items:center;gap:10px;padding:8px 14px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.06);backdrop-filter:blur(12px);font:500 12px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:#D7E0DD}
.mx .kick i{width:7px;height:7px;border-radius:50%;background:#3CD69B;box-shadow:0 0 12px #3CD69B}
.mx h1{margin-top:22px;font:700 clamp(54px,8vw,120px)/.92 var(--display);letter-spacing:-.05em;max-width:12ch}
.mx h1 span{background:linear-gradient(90deg,#fff,#00BFB2);-webkit-background-clip:text;background-clip:text;color:transparent}
.mx .sbox{margin-top:32px;max-width:760px;padding:10px;border:1px solid rgba(255,255,255,.14);border-radius:22px;background:rgba(15,25,24,.55);backdrop-filter:blur(18px);box-shadow:0 40px 90px -30px rgba(0,0,0,.8)}
.mx .sline{display:flex;align-items:center;gap:14px;padding:12px 16px}.mx .sline svg{width:26px;height:26px;color:#00BFB2}
.mx .sline .v{font:600 34px/1 var(--display);letter-spacing:-.02em}.mx .sline .c{width:3px;height:34px;background:#FF6720;animation:blink 1s steps(1) infinite}
.mx .sline kbd{margin-left:auto;font:500 12px var(--mono);padding:6px 9px;border:1px solid rgba(255,255,255,.12);border-radius:8px;color:#8FA09C}
.mx .ans{display:flex;align-items:center;gap:16px;margin:4px 6px 6px;padding:16px 18px;border-radius:14px;background:linear-gradient(90deg,rgba(60,214,155,.16),rgba(60,214,155,.04));border:1px solid rgba(60,214,155,.25);transition:opacity .4s,transform .4s}
.mx .ans.wait{opacity:0;transform:translateY(8px)}.mx .ans .dot{width:12px;height:12px;border-radius:50%;background:#3CD69B;box-shadow:0 0 16px #3CD69B}
.mx .ans b{font:700 19px/1.2 var(--display)}.mx .ans span span{display:block;margin-top:3px;font:500 12px/1 var(--mono);color:#B6C6C1;letter-spacing:.04em}.mx .ans .go{margin-left:auto;color:#3CD69B}
.mx .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.mx .chips a{padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);font:500 13.5px/1 var(--ui);color:#D7E0DD}
.mxstats{position:relative;z-index:3;margin-top:-44px}
@media (prefers-reduced-motion:reduce){.mx .bg,.mx .sline .c{animation:none}}
@media (max-width:720px){
 .mx{min-height:auto;border-radius:0 0 26px 26px}.mx .hn{height:64px}.mx .hn .links,.mx .hn .up{display:none}.mx .hn img{height:22px}
 .mx .hc{padding:36px 0 70px}.mx h1{font-size:48px}.mx .sline .v{font-size:26px}.mx .sline kbd{display:none}.mx .ans b{font-size:16px}.mx .chips a:nth-child(n+4){display:none}
 .mxstats{margin-top:-40px}
}
'''

# ── All of TAQA, calm: one card per family (user found the full grid too busy) ──
import b_segments as SG
_n = lambda g: sum(1 for k in SG.ALLK if SEGS[k]['group'] == g)
_docs = lambda g: sum(count_for(k) for k in SG.ALLK if SEGS[k]['group'] == g)
_FAM3 = [('segment', 'Operational segments', 'seg-coiled-tubing.jpg', 'Coiled Tubing · Drilling · Fracturing · Wireline and more', '#segment'),
         ('product', 'Products &amp; Technology', 'seg-pt-drilling-coe.jpg', 'Edmonton · Stavanger · Aberdeen', '#product'),
         ('function', 'Corporate functions', 'seg-qhse.jpg', 'QHSE · HR · Finance · IT and more', '#function')]
_cards = ''.join(f'''<a class="f3" href="areas.html{h}" style="background-image:url(../img/{img})"><span class="n">{_n(g)}</span>
  <span class="tx"><b>{t}</b><span>{sub}</span><span class="dc">{_docs(g)} documents in force</span></span><span class="arr">→</span></a>''' for g, t, img, sub, h in _FAM3)
ALLSEC = f'''<section class="sec" id="all"><div class="sh"><div><h2>All of TAQA</h2><p>Three families · 25 areas</p></div></div>
<div class="f3s">{_cards}</div></section>'''
cssAll = """
.f3s{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:28px}
.f3{position:relative;display:flex;flex-direction:column;justify-content:flex-end;min-height:420px;padding:28px;border-radius:28px;overflow:hidden;background:#0E1B1A center/cover;color:#fff;isolation:isolate;transition:transform .3s,box-shadow .3s}
.f3::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(to top,rgba(7,13,13,.96) 12%,rgba(7,13,13,.55) 50%,rgba(7,13,13,.25) 72%,rgba(7,13,13,.6))}
.f3:hover{transform:translateY(-6px);box-shadow:0 40px 70px -40px rgba(14,27,26,.7)}
.f3 .n{position:absolute;top:24px;left:28px;font:700 64px/1 var(--display);letter-spacing:-.05em}
.f3 b{display:block;font:700 30px/1.05 var(--display);letter-spacing:-.03em}
.f3 .tx > span{display:block;margin-top:10px;font:400 15px/1.45 var(--ui);color:#D3DEDB;max-width:28ch}
.f3 .tx .dc{margin-top:16px;font:500 12px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:#8FE3D8}
.f3 .arr{position:absolute;right:24px;bottom:28px;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#0E1B1A;font:600 18px var(--ui)}
@media (max-width:720px){
 .f3s{grid-template-columns:1fr;gap:12px;margin-top:20px}
 .f3{min-height:220px;padding:20px;border-radius:24px}.f3 .n{top:18px;left:20px;font-size:44px}.f3 b{font-size:24px}
 .f3 .tx > span{font-size:14px}.f3 .arr{right:18px;bottom:20px;width:40px;height:40px}
}
"""
start = bodyB.find('<div class="stats">')
stats_end = bodyB.find('</div></div>', start) + len('</div></div>')
statsB = bodyB[start:stats_end]
rest = bodyB[bodyB.find('<section class="sec">'):].replace('Direction B · Daylight · design exploration', 'Home · Night Shift hero + Daylight cards · design exploration')
rest = rest.replace('<section class="sec"><div class="sh"><div><h2>Changed', ALLSEC + '\n<section class="sec"><div class="sh"><div><h2>Changed', 1)
rest = rest.replace('href="areas.html"><span class="ic">', 'href="#all"><span class="ic">', 1)
bodyM = f'''<header class="mx"><div class="bg"></div>
<div class="w hn"><img src="../../kit/brand/rise-lockup-header.png" alt="RISE"><nav class="links"><a class="on" href="#">Home</a><a href="areas.html">Areas</a><a href="saved.html">Saved</a><a href="ask.html">Ask</a><a href="glossary.html">Glossary</a></nav>
<span class="sp"></span><a class="up" href="upload.html">Upload</a><span class="av">FA</span></div>
<div class="w hc"><span class="kick"><i></i>Register live · {len(EMP)} documents in force</span>
<h1>Every answer, <span>within reach.</span></h1>
<div class="sbox"><div class="sline">{ic("search")}<span class="v" id="tq">WI-003</span><span class="c"></span><kbd>/ to search</kbd></div>
<a class="ans" id="ta" href="document.html"><span class="dot"></span><span><b>Injector Head Operations Manual</b><span>TQ-TWS-CTSS-WI-003 · REV 4.0 · CURRENT, OK TO USE</span></span><span class="go">{ic("arrow")}</span></a></div>
<div class="chips"><a href="search-results.html">pressure</a><a href="search-typing.html">inject</a><a href="seg-coiled-tubing.html">Coiled Tubing</a><a href="glossary.html">H2S</a></div></div></header>
<main class="w"><div class="mxstats">{statsB}</div>
{rest}'''
open(os.path.join(PAGES, 'bold-mix.html'), 'w').write(shell('RISE · Home', cssB + cssHero + cssAll, bodyM, TYPE_SCRIPT))
print('mix ok')
