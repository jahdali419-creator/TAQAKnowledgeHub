"""Family pages: what opens when a family is chosen on Home (Operational segments, Products & Technology, Corporate functions).
Calm by design: one big photo with a dark layer and a slow drift, then one clean list of the family's areas. Design exploration only."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
import b_segments as S
from reg import *

def img_of(k):
    if k == 'pt-completions-coe': return 'taqa-hero-2.jpg'
    f = f'seg-{k}.jpg'
    return f if os.path.exists(os.path.join(REG_ROOT, 'img', f)) else None

FAMS = [('segment', 'segments', 'Operational segments', 'The service lines that deliver the work in the field.', 'seg-wireline.jpg'),
        ('product', 'products', 'Products &amp; Technology', 'Centres of Excellence that design and build TAQA’s tools.', 'seg-pt-intervention-coe.jpg'),
        ('function', 'functions', 'Corporate functions', 'The teams that support every segment.', 'seg-qhse.jpg')]

CSS = '''
.fh{min-height:560px}
.fh .bg{z-index:0;inset:0;filter:none;opacity:1;transform-origin:60% 40%;animation:kb 26s ease-in-out infinite alternate;will-change:transform}
.fh::after{z-index:1;background:linear-gradient(to bottom,rgba(7,13,13,.85),rgba(7,13,13,.5) 38%,rgba(7,13,13,.65) 62%,rgba(7,13,13,.95)),linear-gradient(90deg,rgba(0,88,90,.4),rgba(0,88,90,0) 60%)}
@keyframes kb{0%{transform:scale(1.02)}100%{transform:scale(1.16) translate(-2.5%,-1.5%)}}
.fh .hc{margin-top:auto;padding:0 0 64px;animation:rise 1s cubic-bezier(.2,.7,.2,1) both}
@keyframes rise{from{opacity:0;transform:translateY(14px)}}
.fh .k{font:500 12px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:#8FE3D8}
.fh h1{margin-top:14px;font:700 clamp(52px,7vw,104px)/.95 var(--display);letter-spacing:-.05em;max-width:14ch}
.fh p.d{margin-top:16px;font:400 18px/1.5 var(--ui);color:#C9D3D0;max-width:46ch}
.fh .m{margin-top:22px;font:500 13px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:#C9D3D0}.fh .m b{color:#fff}
.fl{margin-top:-36px;position:relative;z-index:3;background:#fff;border:1px solid var(--line);border-radius:26px;box-shadow:0 30px 60px -40px rgba(14,27,26,.45);overflow:hidden}
.fl a{display:grid;grid-template-columns:72px minmax(0,1fr) auto;align-items:center;gap:22px;padding:18px 26px;border-top:1px solid var(--line);transition:background .2s}
.fl a:first-child{border-top:0}.fl a:hover{background:#F6F8F7}
.fl .th{width:72px;height:72px;border-radius:18px;background:#0E1B1A center/cover}
.fl .bd{width:72px;height:72px;border-radius:18px;display:grid;place-items:center;background:var(--tealbg);color:var(--teal);font:700 13px var(--mono)}
.fl b{display:block;font:700 22px/1.15 var(--display);letter-spacing:-.02em}
.fl .s{display:block;margin-top:4px;color:var(--mute);font-size:14px}
.fl .you{display:inline-block;margin-left:10px;padding:4px 10px;border-radius:999px;background:var(--teal2);color:#062221;font:600 11.5px var(--ui);vertical-align:4px}
.fl .n{text-align:right}.fl .n b{font:700 30px/1 var(--display);color:var(--teal)}.fl .n span{display:block;margin-top:4px;font:500 11px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--mute)}
.fl.big a{grid-template-columns:200px minmax(0,1fr) auto;padding:20px 26px}.fl.big .th{width:200px;height:130px;border-radius:20px}
.oth{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:44px;color:var(--mute);font-size:14px}
.oth a{padding:11px 18px;border-radius:999px;background:#fff;border:1px solid var(--line);color:var(--ink);font:500 14px var(--ui)}
@media (prefers-reduced-motion:reduce){.fh .bg,.fh .hc{animation:none}}
@media (max-width:720px){
 .fh{min-height:440px}.fh .hc{padding-bottom:56px}.fh h1{font-size:44px}.fh p.d{font-size:15.5px}
 .fl{border-radius:22px;margin-top:-30px}
 .fl a{grid-template-columns:52px minmax(0,1fr) auto;gap:14px;padding:14px 16px}
 .fl .th,.fl .bd{width:52px;height:52px;border-radius:14px}.fl .bd{font-size:11px}
 .fl b{font-size:17px}.fl .s{font-size:12.5px}.fl .n b{font-size:22px}.fl .n span{display:none}
 .fl .you{display:block;width:max-content;margin:6px 0 0}
 .fl.big a{grid-template-columns:1fr auto;gap:12px}.fl.big .th{grid-column:1/-1;width:100%;height:150px}
 .oth{margin-top:30px}
}
'''

def build(g, slug, title, desc, hero):
    keys = sorted([k for k in S.ALLK if SEGS[k]['group'] == g], key=lambda k: (k != 'coiled-tubing', -count_for(k)))
    docs = sum(count_for(k) for k in keys)
    rows = ''
    for k in keys:
        s = SEGS[k]; tag = S.META.get(k, ('', ''))[0]
        im = img_of(k) if g != 'function' else None
        pic = f'<span class="th" style="background-image:url(../img/{im})"></span>' if im else f'<span class="bd">{s["spl"]}</span>'
        if g == 'product': sub = f'{tag} · Centre of Excellence'
        elif g == 'function': sub = tag if tag.lower() not in (s['name'].lower(), s['spl'].lower()) else 'Corporate function'
        else: sub = f'{tag} · {s["spl"]}'
        name = s['name'].replace(' Center of Excellence', '') if g == 'product' else s['name']
        you = '<span class="you">Your area</span>' if k == 'coiled-tubing' else ''
        rows += f'''<a href="seg-{k}.html">{pic}<span><b>{name}{you}</b><span class="s">{sub}</span></span><span class="n"><b>{count_for(k)}</b><span>in force</span></span></a>'''
    others = ''.join(f'<a href="family-{sl}.html">{t}</a>' for gg, sl, t, *_ in FAMS if gg != g)
    body = f'''<header class="mx fh"><div class="bg" style="background-image:url(../img/{hero})"></div>
<div class="w hn"><a href="bold-mix.html"><img src="../../kit/brand/rise-lockup-header.png" alt="RISE"></a><nav class="links"><a href="bold-mix.html">Home</a><a class="on" href="areas.html">Areas</a><a href="saved.html">Saved</a><a href="ask.html">Ask</a><a href="glossary.html">Glossary</a></nav>
<span class="sp"></span><a class="up" href="upload.html">Upload</a><span class="av">FA</span></div>
<div class="w hc"><a class="crumbp" href="bold-mix.html#all">← Home <i>·</i> One TAQA</a>
<h1>{title}</h1><p class="d">{desc}</p><p class="m"><b>{len(keys)}</b> areas · <b>{docs}</b> documents in force</p></div></header>
<main class="w"><div class="fl{" big" if g == "product" else ""}">{rows}</div>
<div class="oth">Other families{others}</div></main>
<footer class="w foot"><span>RISE · TAQA knowledge</span><span>{title.replace("&amp;", "&")} · design exploration</span></footer>
<nav class="dockn"><a href="bold-mix.html">Home</a><a href="search.html">Search</a><a class="on" href="areas.html">Areas</a><a href="saved.html">Saved</a><a href="more.html">More</a></nav>'''
    html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RISE · {title.replace("&amp;", "&")}</title><link rel="stylesheet" href="../../kit/fonts.css"><link rel="stylesheet" href="../css/nova.css"><style>{CSS}</style></head><body>
{body}
</body></html>'''
    open(os.path.join(PAGES, f'family-{slug}.html'), 'w').write(html)

for f in FAMS: build(*f)
print('family', len(FAMS))
