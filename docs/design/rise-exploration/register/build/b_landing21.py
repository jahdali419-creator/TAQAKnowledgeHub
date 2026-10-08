"""Landing page built with 21st.dev components + UI UX Pro Max guidance.

21st.dev (via the 21st MCP, code retrieved): Horizon Glow Hero (ruixen.ui) and Card Hand Gallery (ruixen.ui),
ported from React/motion to plain HTML/CSS/JS for the static prototype. Command Search (arihantcodes) and Spotlight
(kevingirelli) were found in the catalogue but their code was over the free daily limit, so they are built from their
published descriptions. UI UX Pro Max: Real-Time/Operations landing pattern (hero with live preview > metrics > how it
works > CTA), honest "live" labelling with a snapshot time, pause control on the marquee, no scroll-jacking, reduced
motion renders the final state, 44px targets, visible focus. Colours and type are TAQA's, not the skill's suggestion.
Design exploration only."""
import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
import b_segments as SG
from reg import *

EMP = inforce('employee')
N_ALERT = sum(r['docType'] == 'alert' for r in EMP)
TYPEW = {'sop': 'Procedure', 'manual': 'Work instruction', 'standard': 'Standard', 'alert': 'Technical alert', 'lesson': 'Lesson learned', 'form': 'Form', 'policy': 'Policy'}
# search index: in-force documents (Employee view) + one superseded number, the areas, and the glossary
docs = [{'n': r['docNumber'], 's': short(r['docNumber']), 't': r['title'], 'a': segname(r['segment']), 'y': TYPEW.get(r['docType'], ''), 'm': MARK.get(r['docType'], ''), 'r': r['revision'],
         'st': 'alt' if r['docType'] == 'alert' else 'cur', 'h': 'document.html' if r['docNumber'] == 'TQ-TWS-CTSS-WI-003' else '#'} for r in EMP if not r.get('translationOf')]
S3 = BYNUM['TQ-TWS-CTSS-SOP-003']
docs.append({'n': S3['docNumber'], 's': short(S3['docNumber']), 't': S3['title'], 'a': segname(S3['segment']), 'y': 'Procedure', 'm': 'SOP', 'r': S3['revision'], 'st': 'sup', 'h': 'search-superseded.html'})
areas = [{'k': k, 'n': SEGS[k]['name'], 'c': SEGS[k]['spl'], 'm': count_for(k)} for k in SG.ALLK]
gl = [{'a': g.get('abbr', ''), 'f': g.get('full', '')} for g in GLOSS if g.get('abbr')]
IDX = json.dumps({'d': docs, 'a': areas, 'g': gl}, ensure_ascii=False)

def img_of(k):
    if k == 'coiled-tubing': return 'taqa-hero.webp'
    f = f'seg-{k}.jpg'
    return f if os.path.exists(os.path.join(REG_ROOT, 'img', f)) else 'taqa-hero-2.jpg'
HAND = ['coiled-tubing', 'wireline', 'fracturing', 'well-testing', 'marine-services', 'pt-drilling-coe', 'geothermal-coe']
cards = [{'id': k, 'src': f'../img/tone/{img_of(k)}', 'title': SEGS[k]['name'].replace(' Center of Excellence', ''), 'desc': SG.META.get(k, ('', ''))[1], 'n': count_for(k), 'h': f'seg-{k}.html'} for k in HAND]
CARDS = json.dumps(cards, ensure_ascii=False)
tick = ''.join(f'<li><b>{SEGS[k]["spl"]}</b>{SEGS[k]["name"]}</li>' for k in SG.ALLK if k != 'company')

CSS = r'''
:root{--night:#020706;--panel:#0A1413;--ink:#0E1B1A;--paper:#FAFAF7;--mute:#5F6B68;--line:#E4E2DC;--fg:#ECF2F0;--fg2:#A7B7B3;--fg3:#7D8F8A;
--teal:#00585A;--teal2:#00BFB2;--mint:#8FE3D8;--spark:#FF6720;--ok:#3CD69B;--crim:#C8102E;
--display:'BwGradual',Inter,sans-serif;--ui:Inter,system-ui,sans-serif;--mono:'PlexMono',ui-monospace,monospace;
--spring:cubic-bezier(.34,1.45,.64,1);--out:cubic-bezier(.16,1,.3,1)}
*{box-sizing:border-box;margin:0;padding:0}html{overflow-x:clip;background:var(--night);scroll-behavior:smooth}
body{background:var(--paper);color:var(--ink);font:400 16px/1.5 var(--ui);-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}img{display:block;max-width:100%}button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
:focus-visible{outline:2px solid var(--teal2);outline-offset:3px;border-radius:10px}
.w{width:1240px;max-width:calc(100% - 48px);margin:0 auto}
.mono{font:500 12px/1.2 var(--mono);letter-spacing:.12em;text-transform:uppercase}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* ── nav ── */
.nav{position:absolute;z-index:50;top:0;left:0;right:0}
.nav .w{display:flex;align-items:center;gap:26px;height:84px}
.nav img{height:28px;filter:brightness(0) invert(1)}
.nav .links{display:flex;gap:2px;padding:5px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(14px)}
.nav .links a{display:inline-flex;align-items:center;min-height:36px;padding:0 15px;border-radius:999px;font:500 14px var(--ui);color:#C3D0CC;transition:color .2s,background .2s}
.nav .links a:hover{color:#fff;background:rgba(255,255,255,.07)}
.nav .grow{flex:1}
.nav .cta{display:inline-flex;align-items:center;min-height:44px;padding:0 20px;border-radius:999px;background:#fff;color:var(--ink);font:600 14.5px var(--ui);transition:transform .25s var(--spring)}
.nav .cta:hover{transform:translateY(-1px)}

/* ── HERO · Horizon Glow Hero (21st.dev / ruixen.ui), ported ── */
.hero{position:relative;overflow:hidden;background:var(--night);color:var(--fg);isolation:isolate;container-type:inline-size;
 --orb:max(135cqw,56rem);--cap:clamp(13rem,30%,19rem)}
.hair{position:absolute;inset:0;pointer-events:none;background-image:repeating-linear-gradient(to right,rgba(236,242,240,.03) 0 1px,transparent 1px 8px)}
.streaks i{position:absolute;top:0;width:2px;height:360px;transform-origin:top left;background:linear-gradient(transparent,rgba(143,227,216,.5) 50%,transparent);opacity:0;animation:fall linear infinite}
@keyframes fall{0%{transform:translateY(-100%) scale(var(--sx),var(--sy));opacity:0}50%{opacity:var(--pk)}100%{transform:translateY(260%) scale(var(--sx),var(--sy));opacity:0}}
.orb{position:absolute;left:50%;width:calc(var(--orb) + 2 * var(--g,0px));height:calc(var(--orb) + 2 * var(--g,0px));margin-left:calc((var(--orb) + 2 * var(--g,0px)) / -2);top:calc(100% - var(--cap) - var(--g,0px))}
.halo{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden}
.halo .orb{--g:calc(var(--orb) * .15);background:radial-gradient(circle closest-side,transparent 64%,rgba(0,191,178,.05) 71%,rgba(0,191,178,.13) 74.5%,rgba(0,191,178,.17) 75.5%,rgba(0,191,178,.13) 77.5%,rgba(0,191,178,.07) 80.5%,rgba(0,191,178,.035) 85%,rgba(0,191,178,.015) 91%,transparent 98%);
 opacity:0;transform:scale(.84);animation:halo 2.4s var(--out) .15s forwards}
@keyframes halo{to{opacity:1;transform:none}}
.planet{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden;-webkit-mask-image:linear-gradient(to top,transparent 0,#000 64px);mask-image:linear-gradient(to top,transparent 0,#000 64px)}
.rimwrap{position:absolute;inset:0;opacity:0;clip-path:inset(-64px 100% -64px -64px);animation:wipe 2.6s var(--out) .35s forwards}
@keyframes wipe{30%{opacity:1}to{opacity:1;clip-path:inset(-64px -64px -64px -64px)}}
.rimhue{position:absolute;inset:0;filter:hue-rotate(-30deg) saturate(.4);animation:sat 3s var(--out) .35s forwards}
@keyframes sat{to{filter:hue-rotate(0deg) saturate(1.2)}}
.rim{position:absolute;inset:0}
.rim .orb{border-radius:50%;background:conic-gradient(from 0deg at 50% 50%,#ffffff 0deg,#FFB27A 6deg,#FF6720 12deg,#00BFB2 40deg,#00BFB2 180deg,#00585A 180deg,#0AA39A 300deg,#8FE3D8 350deg,#ffffff 360deg);
 -webkit-mask-image:conic-gradient(from 0deg at 50% 50%,rgba(0,0,0,.4) 0deg,#000 35deg,#000 325deg,rgba(0,0,0,.4) 360deg);mask-image:conic-gradient(from 0deg at 50% 50%,rgba(0,0,0,.4) 0deg,#000 35deg,#000 325deg,rgba(0,0,0,.4) 360deg)}
.rim.soft{filter:blur(10px);opacity:.45}.rim.soft .orb{--g:3px}
.rim.line{filter:blur(2px)}.rim.line .orb{--g:2px}
.disk{position:absolute;inset:0;filter:blur(.5px)}.disk .orb{border-radius:50%;background:var(--night)}
.edge .orb{border-radius:50%;box-shadow:inset 0 1px 0 rgba(236,242,240,.55);opacity:0;animation:fade .9s ease forwards}
.hcopy{position:relative;z-index:10;padding:150px 24px calc(var(--cap) + 3rem);display:flex;flex-direction:column;align-items:center;text-align:center}
.eyebrow{display:inline-flex;align-items:center;gap:10px;font:500 13px var(--ui);color:var(--fg2);opacity:0;filter:blur(1.5px);animation:unblur .9s ease 1.1s forwards}
.eyebrow i{width:7px;height:7px;border-radius:50%;background:var(--ok);box-shadow:0 0 10px var(--ok)}
.hero h1{margin-top:14px;font:700 clamp(44px,7vw,104px)/.95 var(--display);letter-spacing:-.045em;text-wrap:balance;max-width:14ch;opacity:0;filter:blur(2.5px);transform:translateY(6px);animation:unblur 1s ease 1.4s forwards}
.hero h1 em{font-style:normal;background:linear-gradient(100deg,#fff 20%,var(--mint) 60%,var(--teal2));-webkit-background-clip:text;background-clip:text;color:transparent}
@keyframes unblur{to{opacity:1;filter:none;transform:none}}
@keyframes fade{to{opacity:1}}

/* Command Search (21st.dev / arihantcodes, rebuilt from its description) */
.cs{position:relative;width:min(680px,100%);margin-top:30px;text-align:left;border-radius:20px;background:rgba(10,20,19,.78);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(18px);
 box-shadow:0 40px 100px -40px rgba(0,191,178,.4),0 30px 60px -30px rgba(0,0,0,.8);opacity:0;filter:blur(2px);animation:unblur 1s ease 1.7s forwards}
.cs label{display:flex;align-items:center;gap:12px;min-height:60px;padding:0 18px}
.cs label svg{width:20px;height:20px;color:var(--teal2);flex:none}
.cs input{flex:1;min-width:0;height:60px;background:none;border:0;outline:0;color:#fff;font:600 21px var(--display);letter-spacing:-.01em}
.cs input::placeholder{color:#6F827D;font-weight:500}
.cs kbd{font:500 11.5px var(--mono);padding:5px 8px;border:1px solid rgba(255,255,255,.14);border-radius:7px;color:var(--fg3)}
.cs .list{position:relative;max-height:236px;overflow:auto;border-top:1px solid rgba(255,255,255,.08);padding:6px;scrollbar-width:thin}
.cs .hl{position:absolute;left:6px;right:6px;top:0;height:0;border-radius:12px;background:rgba(0,191,178,.12);border:1px solid rgba(0,191,178,.3);transition:transform .28s var(--spring),height .2s;pointer-events:none}
.cs .grp{padding:10px 12px 4px;color:var(--fg3)}
.cs .it{position:relative;display:flex;align-items:center;gap:12px;min-height:52px;padding:8px 12px;border-radius:12px}
.cs .it .tg{flex:none;min-width:52px;padding:4px 7px;border-radius:7px;background:rgba(255,255,255,.06);font:600 10.5px var(--mono);color:var(--mint);text-align:center}
.cs .it b{display:block;font:600 15px/1.3 var(--ui);color:#fff}.cs .it small{display:block;margin-top:2px;font:500 11.5px var(--mono);color:var(--fg3);letter-spacing:.02em}
.cs .it mark{background:none;color:var(--mint);box-shadow:inset 0 -2px 0 rgba(255,103,32,.8)}
.cs .st{margin-left:auto;flex:none;display:inline-flex;align-items:center;gap:7px;padding:5px 10px;border-radius:999px;font:600 12px var(--ui)}
.cs .st i{width:7px;height:7px;border-radius:50%;background:currentColor}
.cs .st.cur{background:rgba(60,214,155,.12);color:var(--ok)}
.cs .st.alt{background:rgba(200,16,46,.18);color:#FF9AA9}.cs .st.alt i{border-radius:1px;transform:rotate(45deg)}
.cs .st.sup{background:rgba(200,16,46,.18);color:#FF9AA9}.cs .st.sup i{border-radius:0;height:2px;width:9px}
.cs .empty{padding:18px 12px;color:var(--fg2);font-size:14.5px}
.cs .foot{display:flex;gap:14px;align-items:center;padding:10px 16px;border-top:1px solid rgba(255,255,255,.08);color:var(--fg3);font:500 11.5px var(--mono)}
.cs .foot span:last-child{margin-left:auto}
.hcta{display:flex;gap:10px;margin-top:22px;opacity:0;animation:fade .8s ease 2s forwards}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:0 24px;border-radius:999px;font:600 15px var(--ui);transition:transform .25s var(--spring)}
.btn:hover{transform:translateY(-2px)}
.btn.lt{background:#fff;color:var(--ink)}.btn.gh{border:1px solid rgba(255,255,255,.2);color:#fff}
.snap{position:absolute;z-index:10;left:0;right:0;bottom:26px;text-align:center;color:#6F827D}

/* ── metrics ── */
.metrics{background:var(--night);color:var(--fg);padding:0 0 80px}
.metrics .w{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid rgba(255,255,255,.1)}
.metrics div div{padding:30px 24px 0 0}
.metrics b{display:block;font:700 64px/1 var(--display);letter-spacing:-.05em}
.metrics span{display:block;margin-top:10px;color:var(--fg2)}

/* ── sections ── */
.sec{padding:120px 0 0}
.eb{display:flex;align-items:center;gap:10px;color:var(--teal)}.eb i{width:18px;height:1px;background:currentColor}
.h2{margin-top:16px;font:700 clamp(38px,5vw,68px)/.98 var(--display);letter-spacing:-.045em;max-width:16ch;text-wrap:balance}
.h2 em{font-style:normal;color:var(--teal)}
.lead{margin-top:16px;max-width:54ch;font-size:18px;color:var(--mute)}

/* Card Hand Gallery (21st.dev / ruixen.ui), ported */
.hand{display:grid;grid-template-columns:220px minmax(0,1fr) 260px;gap:36px;align-items:center;margin-top:40px}
.hand .ttl{text-align:right}.hand .ttl p{color:var(--mute);font:500 12px var(--mono)}
.hand .ttl h3{margin-top:8px;font:700 32px/1.05 var(--display);letter-spacing:-.03em;text-wrap:balance}
.hand .ds p{color:var(--mute);font-size:15.5px}
.hand .ds a{display:inline-flex;align-items:center;min-height:44px;margin-top:16px;padding:0 18px;border-radius:999px;background:var(--ink);color:#fff;font:600 14px var(--ui)}
.hand .ds .n{display:block;margin-top:12px;font:500 12px var(--mono);color:var(--teal)}
.swap{animation:swap .32s ease}@keyframes swap{from{opacity:0;transform:translateY(10px)}}
.fan{position:relative;min-width:0}
.card{position:absolute;left:50%;transition:transform .55s var(--spring);will-change:transform}
.card .lift{transition:transform .5s var(--spring)}
.card button{display:block;border-radius:16px;overflow:hidden;box-shadow:0 30px 60px -30px rgba(14,27,26,.55);border:4px solid #fff;background:#0E1B1A}
.card img{width:100%;height:100%;object-fit:cover;pointer-events:none}
.card.on button{cursor:default;box-shadow:0 50px 90px -30px rgba(0,88,90,.6)}

/* how it works */
.steps{display:grid;grid-template-columns:repeat(3,1fr);margin-top:48px;border-top:1px solid var(--line)}
.steps div{padding:28px 28px 0 0}
.steps .mono{color:var(--teal)}
.steps h3{margin-top:14px;font:700 26px/1.1 var(--display);letter-spacing:-.025em}
.steps p{margin-top:8px;color:var(--mute)}

/* bento with Spotlight (21st.dev / kevingirelli, rebuilt from its description) */
.bento{display:grid;grid-template-columns:repeat(6,1fr);grid-auto-rows:230px;gap:14px;margin-top:48px}
.sp{position:relative;overflow:hidden;border-radius:24px;background:#0B1615;color:var(--fg);padding:26px;isolation:isolate}
.sp::before{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(420px circle at var(--mx,50%) var(--my,50%),rgba(0,191,178,.16),transparent 45%);opacity:0;transition:opacity .3s}
.sp::after{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;background:radial-gradient(300px circle at var(--mx,50%) var(--my,50%),rgba(143,227,216,.7),rgba(255,255,255,.08) 45%);
 -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
.sp:hover::before{opacity:1}
.sp h3{font:700 24px/1.1 var(--display);letter-spacing:-.02em}.sp p{margin-top:8px;color:var(--fg2);font-size:15px;max-width:34ch}
.s4{grid-column:span 4}.s2{grid-column:span 2}.s3{grid-column:span 3}
.sp .vis{position:absolute;left:26px;right:26px;bottom:24px}
.pillrow{display:flex;flex-wrap:wrap;gap:8px}
.pillrow span{display:inline-flex;align-items:center;gap:8px;padding:8px 13px;border-radius:999px;font:600 13px var(--ui)}
.pillrow .c{background:rgba(60,214,155,.12);color:var(--ok)}.pillrow .c i,.pillrow .x i{width:7px;height:7px;border-radius:50%;background:currentColor}
.pillrow .x{background:rgba(200,16,46,.18);color:#FF9AA9}.pillrow .x i{border-radius:0;height:2px;width:9px}
.sp .big{font:700 74px/1 var(--display);letter-spacing:-.05em;color:var(--mint)}
.sp .arb{direction:rtl;text-align:right;font:600 21px/1.4 Tahoma,'Noto Sans Arabic',sans-serif}
.sp.ph{padding:0}.sp.ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}
.sp.ph .tx{position:absolute;left:26px;right:26px;bottom:24px}
.sp.ph .sh{position:absolute;inset:0;z-index:-1;background:linear-gradient(to top,rgba(2,7,6,.92),rgba(2,7,6,.15) 60%)}

/* marquee (with pause control) */
.mq{margin-top:120px;border-block:1px solid var(--line);display:flex;align-items:center;gap:16px;padding:0 24px}
.mq .track{flex:1;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.mq ul{display:flex;gap:44px;width:max-content;list-style:none;padding:22px 0;animation:mq 70s linear infinite}
.mq:hover ul{animation-duration:140s}
.mq.paused ul{animation-play-state:paused}
.mq li{display:inline-flex;align-items:center;gap:10px;font:500 16px var(--ui);color:var(--mute);white-space:nowrap}
.mq li b{padding:4px 8px;border-radius:8px;background:#EFEEE8;font:600 11px var(--mono);color:var(--ink)}
.mq button{flex:none;min-width:44px;min-height:44px;border-radius:999px;border:1px solid var(--line);font:600 12px var(--mono)}
@keyframes mq{to{transform:translateX(-50%)}}

/* closing */
.close{margin-top:120px;background:var(--teal);color:#fff;padding:96px 0 40px;overflow:hidden}
.close .row{display:grid;grid-template-columns:minmax(0,1fr) 420px;gap:40px;align-items:end}
.close h2{font:700 clamp(54px,8vw,124px)/.9 var(--display);letter-spacing:-.055em}.close h2 em{font-style:normal;color:var(--mint)}
.close .card2{background:#04211F;border-radius:20px;padding:28px}
.close .card2 p{margin-top:10px;color:#B8CFCB}.close .card2 .mono{color:var(--mint)}
.close .card2 .btn{margin-top:20px;background:#fff;color:var(--ink)}
.close footer{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:80px;color:#A9D2CD}

.rv{opacity:0;transform:translateY(24px);transition:opacity .8s var(--out),transform .8s var(--out)}.rv.in{opacity:1;transform:none}

@media (prefers-reduced-motion:reduce){
 *,*::before,*::after{animation-duration:1ms!important;animation-delay:0s!important;animation-iteration-count:1!important;transition-duration:1ms!important}
 .streaks{display:none}.rv{opacity:1;transform:none}.mq ul{animation:none}
}
@media (max-width:900px){
 .w{max-width:calc(100% - 32px)}
 .nav .links{display:none}.nav .w{height:68px}.nav img{height:23px}.nav .cta{min-height:44px;padding:0 16px;font-size:13.5px}
 .hero{--cap:9rem}.hcopy{padding-top:110px}.hero h1{font-size:44px}
 .cs input{font-size:18px}.cs kbd{display:none}.cs .it small{display:none}.cs .list{max-height:250px}
 .hcta{flex-direction:column;width:100%}.hcta .btn{width:100%}
 .metrics .w{grid-template-columns:1fr 1fr}.metrics b{font-size:44px}
 .sec{padding-top:84px}
 .hand{grid-template-columns:1fr;gap:16px}.hand .ttl{text-align:center}.hand .ds{text-align:center}
 .steps{grid-template-columns:1fr}.steps div{padding:24px 0 0}
 .bento{grid-template-columns:1fr;grid-auto-rows:210px}.s4,.s2,.s3{grid-column:auto}
 .mq{margin-top:84px;padding:0 12px}
 .close{margin-top:84px;padding-top:64px}.close .row{grid-template-columns:1fr}
}
'''

SVG_S = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10.5 4a6.5 6.5 0 0 1 5.2 10.4l4.4 4.4-1.4 1.4-4.4-4.4A6.5 6.5 0 1 1 10.5 4zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z"/></svg>'
STREAKS = [(2, .68, .79, .2, 7, 0), (10, .54, .65, .16, 9, 3.2), (29, .63, .92, .22, 8, 1.4), (41, 1, .66, .21, 10, 5.1), (67, .71, .65, .26, 7.5, 2.3), (81, .86, .9, .18, 8.5, 4.4)]
streaks = ''.join(f'<i style="left:{l}%;--sx:{sx};--sy:{sy};--pk:{pk};animation-duration:{du}s;animation-delay:{de}s"></i>' for l, sx, sy, pk, du, de in STREAKS)

JS = r'''(function(){
var RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* ── Command Search ── */
var IDX=__IDX__,inp=document.getElementById('cq'),list=document.getElementById('cl'),hl=document.getElementById('chl'),live=document.getElementById('clive'),sel=0,items=[],typing=true;
function esc(s){return s.replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function mk(s,q){if(!q)return esc(s);var i=s.toLowerCase().indexOf(q.toLowerCase());return i<0?esc(s):esc(s.slice(0,i))+'<mark>'+esc(s.slice(i,i+q.length))+'</mark>'+esc(s.slice(i+q.length))}
var STW={cur:'Current',alt:'Active alert',sup:'Superseded, do not use'};
function render(q){q=(q||'').trim();var h='',n=0;items=[];
 var ql=q.toLowerCase(),D=[],A=[],G=[];
 if(q){D=IDX.d.filter(function(d){return (d.st!='sup'&&(d.n.toLowerCase().indexOf(ql)>-1||d.t.toLowerCase().indexOf(ql)>-1))||(d.st=='sup'&&d.n.toLowerCase()==ql)}).slice(0,5);
  A=IDX.a.filter(function(a){return a.n.toLowerCase().indexOf(ql)>-1||a.c.toLowerCase()==ql}).slice(0,3);
  G=IDX.g.filter(function(g){return g.a.toLowerCase()==ql||g.f.toLowerCase().indexOf(ql)>-1}).slice(0,2);}
 else{D=IDX.d.filter(function(d){return d.n=='TQ-TWS-CTSS-WI-003'||d.st=='alt'}).slice(0,3);A=IDX.a.slice(1,3)}
 function add(html){items.push(1);return html.replace('class="it"','class="it" role="option" id="ci'+(items.length-1)+'"')}
 if(D.length){h+='<p class="grp mono">Documents</p>';D.forEach(function(d){h+=add('<a class="it" href="'+d.h+'"><span class="tg">'+esc(d.m)+'</span><span><b>'+mk(d.t,q)+'</b><small>'+mk(d.n,q)+' · Rev '+d.r+' · '+esc(d.a)+'</small></span><span class="st '+d.st+'"><i></i>'+STW[d.st]+'</span></a>')})}
 if(A.length){h+='<p class="grp mono">Areas</p>';A.forEach(function(a){h+=add('<a class="it" href="seg-'+a.k+'.html"><span class="tg">'+esc(a.c)+'</span><span><b>'+mk(a.n,q)+'</b><small>'+a.m+' documents in force</small></span></a>')})}
 if(G.length){h+='<p class="grp mono">Field Glossary</p>';G.forEach(function(g){h+=add('<a class="it" href="glossary-term.html"><span class="tg">'+esc(g.a)+'</span><span><b>'+mk(g.f,q)+'</b><small>Term</small></span></a>')})}
 if(!items.length)h='<p class="empty">No document in force matches “'+esc(q)+'”. Try a number such as WI-003.</p>';
 list.innerHTML='<div class="hl" id="chl" aria-hidden="true"></div>'+h;hl=document.getElementById('chl');sel=0;move();
 live.textContent=items.length?items.length+' results':'No results';}
function move(){var el=document.getElementById('ci'+sel);if(!el){hl.style.height='0';return}
 hl.style.height=el.offsetHeight+'px';hl.style.transform='translateY('+el.offsetTop+'px)';inp.setAttribute('aria-activedescendant','ci'+sel);
 if(!typing)el.scrollIntoView({block:'nearest'})}
inp.addEventListener('input',function(){typing=false;render(inp.value)});
inp.addEventListener('focus',function(){typing=false});
inp.addEventListener('keydown',function(e){if(e.key=='ArrowDown'){sel=Math.min(items.length-1,sel+1);move();e.preventDefault()}
 else if(e.key=='ArrowUp'){sel=Math.max(0,sel-1);move();e.preventDefault()}
 else if(e.key=='Enter'){var el=document.getElementById('ci'+sel);if(el)location.href=el.getAttribute('href')}});
list.addEventListener('mousemove',function(e){var it=e.target.closest('.it');if(it){var i=+it.id.slice(2);if(i!=sel){sel=i;move()}}});
document.addEventListener('keydown',function(e){if(e.key=='/'&&document.activeElement!=inp){e.preventDefault();inp.focus()}});
render('');
/* types sample queries until the person takes over */
var Q=['WI-003','pressure','H2S','SOP-003','Coiled'],qi=0;
function demo(){if(!typing)return;var s=Q[qi],i=0;inp.value='';
 var t=setInterval(function(){if(!typing){clearInterval(t);return}inp.value=s.slice(0,++i);render(inp.value);
  if(i>=s.length){clearInterval(t);setTimeout(function(){if(!typing)return;qi=(qi+1)%Q.length;demo()},2600)}},95)}
if(!RM)setTimeout(demo,2300);else{inp.value='WI-003';render('WI-003')}

/* ── Card Hand Gallery ── */
var C=__CARDS__,fan=document.getElementById('fan'),ttl=document.getElementById('httl'),ds=document.getElementById('hds'),act=0,hov=-1,els=[];
C.forEach(function(c,i){var d=document.createElement('div');d.className='card';
 d.innerHTML='<div class="lift"><button type="button" aria-label="'+c.title+'" aria-pressed="false"><img src="'+c.src+'" alt="" loading="lazy"></button></div>';
 var b=d.querySelector('button');b.addEventListener('click',function(){pick(i)});
 d.addEventListener('mouseenter',function(){if(i!=act){hov=i;lay()}});d.addEventListener('mouseleave',function(){if(hov==i){hov=-1;lay()}});
 b.addEventListener('focus',function(){if(i!=act){hov=i;lay()}});b.addEventListener('blur',function(){if(hov==i){hov=-1;lay()}});
 fan.appendChild(d);els.push(d)});
function text(){var c=C[act];ttl.innerHTML='<div class="swap"><p>'+String(act+1).padStart(2,'0')+' / '+String(C.length).padStart(2,'0')+'</p><h3>'+c.title+'</h3></div>';
 ds.innerHTML='<div class="swap"><p>'+c.desc+'</p><span class="n">'+c.n+' DOCUMENTS IN FORCE</span><a href="'+c.h+'">Open '+c.title+'</a></div>'}
function pick(i){if(i==act)return;act=i;hov=-1;lay();text()}
function lay(){var fw=fan.clientWidth,w=Math.min(224,fw*(fw<520?.4:.55)),h=w*1.4,bb=h*.09,hl2=h*.34,al=h*.62,S=.72;
 fan.style.minHeight=(h*1.78)+'px';
 var hand=C.map(function(_,i){return i}).filter(function(i){return i!=act}),n=hand.length,mo=(n-1)/2,half=fw/2-w*.45,
     sp=mo>0?Math.min(w*(n>5?.43:.52),Math.max(w*.23,half/mo)):0,hi=hand.indexOf(hov);
 els.forEach(function(d,i){var b=d.querySelector('button'),L=d.querySelector('.lift');b.style.width=w+'px';b.style.height=h+'px';d.style.bottom=bb+'px';d.style.marginLeft=(-w/2)+'px';
  b.setAttribute('aria-pressed',i==act);d.classList.toggle('on',i==act);
  if(i==act){d.style.transform='translate(0,'+(-al)+'px)';d.style.zIndex=100;L.style.transform='none';return}
  var k=hand.indexOf(i),off=k-mo,step=n>1?Math.min(9,46/(n-1)):0,rot=off*step,x=off*sp,y=Math.abs(rot)*1.9,isH=i==hov;
  var dx=(hi>-1&&!isH)?Math.sign(k-hi)*w*.14/Math.max(1,Math.abs(k-hi)):0,dy=isH?-hl2-y:0,rad=-rot*Math.PI/180;
  d.style.transform='translate('+x+'px,'+y+'px) rotate('+rot+'deg) scale('+S+')';d.style.zIndex=isH?60:10+k;
  L.style.transform='translate('+((dx*Math.cos(rad)-dy*Math.sin(rad))/S)+'px,'+((dx*Math.sin(rad)+dy*Math.cos(rad))/S)+'px) rotate('+(isH?-rot*.45:0)+'deg) scale('+(isH?1.08:1)+')'});}
fan.addEventListener('keydown',function(e){if(e.key=='ArrowRight'){pick((act+1)%C.length);els[act].querySelector('button').focus()}if(e.key=='ArrowLeft'){pick((act-1+C.length)%C.length);els[act].querySelector('button').focus()}});
lay();text();addEventListener('resize',lay);

/* ── Spotlight ── */
document.querySelectorAll('.sp').forEach(function(s){s.addEventListener('pointermove',function(e){var r=s.getBoundingClientRect();s.style.setProperty('--mx',(e.clientX-r.left)+'px');s.style.setProperty('--my',(e.clientY-r.top)+'px')})});
/* ── marquee pause ── */
var mq=document.querySelector('.mq'),mb=mq.querySelector('button');mb.addEventListener('click',function(){var p=mq.classList.toggle('paused');mb.textContent=p?'Play':'Pause';mb.setAttribute('aria-pressed',p)});
document.addEventListener('visibilitychange',function(){mq.classList.toggle('hidden',document.hidden)});
/* ── reveal + count ── */
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.2});
document.querySelectorAll('.rv').forEach(function(el){io.observe(el)});
var co=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var el=e.target,to=+el.dataset.n,t0=0;co.unobserve(el);if(RM){el.textContent=to;return}
 (function f(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/1300);el.textContent=Math.round(to*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)})(performance.now())})},{threshold:.5});
document.querySelectorAll('[data-n]').forEach(function(el){co.observe(el)});
})();'''.replace('__IDX__', IDX).replace('__CARDS__', CARDS)

html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RISE · TAQA knowledge</title><meta name="description" content="RISE, TAQA's register of controlled documents.">
<link rel="stylesheet" href="../../kit/fonts.css"><style>{CSS}</style></head><body>
<header class="nav"><div class="w"><a href="#top" aria-label="RISE home"><img src="../../kit/brand/rise-lockup-header.png" alt="RISE" width="74" height="28"></a>
<nav class="links" aria-label="Main"><a href="#areas">Areas</a><a href="#how">How it works</a><a href="#inside">Inside RISE</a><a href="glossary.html">Field Glossary</a></nav>
<span class="grow"></span><a class="cta" href="bold-mix.html">Sign in with TAQA account</a></div></header>
<main id="top">
<section class="hero" aria-labelledby="ht"><div class="hair" aria-hidden="true"></div><div class="streaks" aria-hidden="true">{streaks}</div>
<div class="halo" aria-hidden="true"><div class="orb"></div></div>
<div class="planet" aria-hidden="true"><div class="rimwrap"><div class="rimhue"><div class="rim soft"><div class="orb"></div></div><div class="rim line"><div class="orb"></div></div></div></div>
 <div class="disk"><div class="orb"></div></div><div class="edge"><div class="orb"></div></div></div>
<div class="hcopy"><p class="eyebrow"><i></i>{len(EMP)} controlled documents in force</p>
<h1 id="ht">The right document, <em>before the job starts.</em></h1>
<div class="cs" role="combobox" aria-expanded="true" aria-haspopup="listbox" aria-owns="cl"><label for="cq">{SVG_S}<span class="sr">Search the register</span>
<input id="cq" type="text" autocomplete="off" spellcheck="false" placeholder="Search a number, title or area" aria-autocomplete="list" aria-controls="cl"><kbd>/</kbd></label>
<div class="list" id="cl" role="listbox" aria-label="Results"></div>
<div class="foot"><span>↑↓ to move</span><span>↵ to open</span><span>Prototype data · register snapshot 06 Oct 2026</span></div><p class="sr" id="clive" aria-live="polite"></p></div>
<div class="hcta"><a class="btn lt" href="bold-mix.html">Open RISE</a><a class="btn gh" href="#how">How it works</a></div></div>
</section>
<section class="metrics" aria-label="The register in numbers"><div class="w"><div><b data-n="{len(EMP)}">{len(EMP)}</b><span>Documents in force</span></div><div><b data-n="25">25</b><span>Areas across TAQA</span></div>
<div><b data-n="{len(GLOSS)}">{len(GLOSS)}</b><span>Field terms explained</span></div><div><b data-n="{N_ALERT}">{N_ALERT}</b><span>Active technical alerts</span></div></div></section>

<section class="w sec" id="areas" aria-labelledby="ah"><div class="rv"><p class="eb mono"><i></i>One register, every area</p><h2 class="h2" id="ah">Pick an area. <em>See its library.</em></h2>
<p class="lead">Pick a card to bring it forward. On a computer, hover to lift and use the arrow keys.</p></div>
<div class="hand"><div class="ttl" id="httl" aria-live="polite"></div><div class="fan" id="fan" role="group" aria-label="Areas"></div><div class="ds" id="hds"></div></div></section>

<section class="w sec" id="how" aria-labelledby="hh"><div class="rv"><p class="eb mono"><i></i>How it works</p><h2 class="h2" id="hh">Three steps, <em>every time.</em></h2></div>
<div class="steps rv"><div><p class="mono">01 · Search</p><h3>Type the number or title</h3><p>From any page, press / and type. Old revisions never reach the field.</p></div>
<div><p class="mono">02 · Check</p><h3>See if it’s current</h3><p>Every result says Current, Active alert or Superseded, in words, not colour alone.</p></div>
<div><p class="mono">03 · Use or ask</p><h3>Open it, or ask an expert</h3><p>Download, save for offline, or send a field question with a photo.</p></div></div></section>

<section class="w sec" id="inside" aria-labelledby="ih"><div class="rv"><p class="eb mono"><i></i>Inside RISE</p><h2 class="h2" id="ih">Built for site, <em>not the desk.</em></h2></div>
<div class="bento">
 <div class="sp s4"><h3>Current or not, before you open it</h3><p>The status travels with the document everywhere it appears.</p><div class="vis pillrow"><span class="c"><i></i>Current, OK to use</span><span class="x"><i></i>Superseded, do not use</span></div></div>
 <div class="sp s2 ph"><img src="../img/tone/seg-wireline.jpg" alt="Wireline crew at work" loading="lazy"><div class="sh"></div><div class="tx"><h3>25 areas</h3><p>Segments, functions and Centres of Excellence.</p></div></div>
 <div class="sp s2"><h3>Field Glossary</h3><div class="vis"><span class="big">BOP</span><p>Blowout Preventer · 1 of {len(GLOSS)} terms</p></div></div>
 <div class="sp s2"><h3>English and Arabic</h3><div class="vis"><p class="arb">إجراء التشغيل القياسي للحقن بالنيتروجين</p><p class="mono" style="text-align:right;margin-top:6px">SOP-007 · AR</p></div></div>
 <div class="sp s2 ph"><img src="../img/tone/seg-marine-services.jpg" alt="Marine services vessel at sea" loading="lazy"><div class="sh"></div><div class="tx"><h3>Offline, offshore</h3><p>Saved documents open without a signal.</p></div></div>
</div></section>

<div class="mq" aria-label="All areas"><div class="track"><ul>{tick}{tick}</ul></div><button type="button" aria-pressed="false">Pause</button></div>

<section class="close" aria-labelledby="ch"><div class="w"><div class="row"><h2 class="rv" id="ch">Know it’s <em>current.</em></h2>
<div class="card2 rv"><p class="mono">TAQA · Internal</p><p>Sign in with your TAQA account. Everything you need for the job, approved and in force.</p><a class="btn" href="bold-mix.html">Open RISE</a></div></div>
<footer class="mono"><span>RISE · TAQA knowledge</span><span>Built with 21st.dev components · UI UX Pro Max · design exploration</span></footer></div></section>
</main>
<script>{JS}</script>
</body></html>'''
open(os.path.join(PAGES, 'landing-21.html'), 'w').write(html)
print('landing-21 ok', len(docs), 'docs indexed')
