"""Separate the chosen design from the explorations.

Copies only the screens in the chosen style (dark photo hero + bright rounded cards, TAQA teal photo tone) into
docs/design/rise-exploration/final/, gives them clean names (home.html, landing.html), rewires every link so nothing
points back into the explorations, and writes a gallery of just this design. The explorations stay untouched in
register/ and the round folders. Run after the other builders and gshoot2.js. Design exploration only."""
import os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__)); REG = os.path.abspath(os.path.join(HERE, '..'))
FIN = os.path.abspath(os.path.join(REG, '..', 'final'))
sys.path.insert(0, os.path.join(REG, 'lib'))
from reg import SEGS

RENAME = {'bold-mix': 'home', 'landing-21': 'landing'}
# old or alternative screens that are not part of the chosen design → where their links should land instead
DROP = {'home': 'home', 'home-director': 'home', 'landing': 'landing', 'landing-horizon': 'landing', 'bold-day': 'home',
        'bold-night': 'home', 'states': 'home', 'system': 'home'}

G = [  # (section id, title, intro, [(page, label, note)])
 ('front', 'Front door', 'What people see first: the landing page before sign-in, then Home.', [
  ('landing-21', 'Landing', 'Horizon hero, working search over the register, card fan of areas.'),
  ('bold-mix', 'Home', 'Dark hero with the live answer, then your area, the three families and what changed.')]),
 ('areas', 'Areas', 'One TAQA, three families, 25 areas. Every area photo shares the TAQA teal tone.', [
  ('family-segments', 'Operational segments', 'Showcase: large list, one photo that changes per area.'),
  ('family-products', 'Products & Technology', 'Edmonton, Stavanger and Aberdeen.'),
  ('family-functions', 'Corporate functions', 'Code panels where a function has no photo.'),
  ('areas', 'All areas', 'Every area, grouped by family.'),
  ('area', 'Coiled Tubing library', 'Operations side, all document types.'),
  ('area-sops', 'Coiled Tubing · SOPs', 'One type, searchable.'),
  ('area-maint', 'Coiled Tubing · Maintenance', 'The maintenance side of a segment.'),
  ('area-nomatch', 'No match in an area', 'Search inside an area finds nothing.'),
  ('area-policies', 'Company policies', 'CEO-signed policies for everyone.')]),
 ('find', 'Find and read', 'Search, the document record, and every state a document can be in.', [
  ('search', 'Search', ''), ('search-typing', 'Search · typing', ''), ('search-results', 'Search · results', ''),
  ('search-number', 'Search · a number', 'WI-003 in every area that uses it.'), ('search-filters', 'Search · filters', ''),
  ('search-none', 'Search · nothing found', ''), ('search-superseded', 'Search · old number', 'Shown as “do not use”.'),
  ('document', 'Document', 'Current, OK to use.'), ('document-superseded', 'Document · superseded', ''),
  ('document-withdrawn', 'Document · withdrawn', ''), ('document-notyet', 'Document · not yet in force', ''),
  ('document-form', 'Form record', ''), ('form', 'Form · fill in', ''), ('document-share', 'Share', ''), ('document-qrc', 'Quick reference', ''),
  ('document-denied', 'No access', ''), ('document-unavailable', 'Unavailable', '')]),
 ('you', 'Your things', 'Saved documents, notifications, account.', [
  ('saved', 'Saved', ''), ('saved-empty', 'Saved · empty', ''), ('notifications', 'Notifications', ''), ('account', 'Account', ''), ('more', 'More', '')]),
 ('tools', 'Ask and Glossary', 'Help from people and from the field glossary.', [
  ('ask', 'Ask an Expert', ''), ('ask-photo', 'Ask · with a photo', ''), ('ask-critical', 'Ask · safety-critical', ''), ('ask-sent', 'Ask · sent', ''),
  ('ask-result', 'Ask · not sent', ''), ('glossary', 'Field Glossary', ''), ('glossary-search', 'Glossary · search', ''), ('glossary-term', 'Glossary · term', ''),
  ('glossary-none', 'Glossary · no match', ''), ('glossary-propose', 'Glossary · propose a term', '')]),
 ('upload', 'Upload', 'Four steps to file a document for approval.', [
  ('upload', 'Upload · file', ''), ('upload-file', 'Upload · file chosen', ''), ('upload-file-error', 'Upload · wrong file type', ''),
  ('upload-where', 'Upload · where it belongs', ''), ('upload-where-error', 'Upload · number already used', ''), ('upload-maint', 'Upload · maintenance', ''),
  ('upload-policy', 'Upload · policy', ''), ('upload-again', 'Upload · filing again', ''), ('upload-what', 'Upload · what it is', ''),
  ('upload-review', 'Upload · check the record', ''), ('upload-done', 'Upload · filed', ''), ('document-draft', 'Your filing · draft', ''),
  ('document-returned', 'Your filing · returned', '')]),
 ('director', 'Segment Director', 'Approvals, managing documents and delegation.', [
  ('desk', 'Approvals desk', ''), ('desk-approve', 'Approve', ''), ('desk-reject', 'Return with a reason', ''), ('desk-approved', 'Approved', ''),
  ('desk-maint', 'Maintenance desk', ''), ('desk-delegate', 'Acting for the Director', ''), ('manage', 'Manage documents', ''),
  ('manage-withdraw', 'Withdraw a document', ''), ('delegation', 'Delegation', ''), ('delegation-new', 'New delegation', ''),
  ('delegation-revoke', 'Revoke a delegation', ''), ('area-director', 'Area · director view', ''), ('notifications-director', 'Waiting for your signature', ''),
  ('account-director', 'Account · director', ''), ('more-director', 'More · director', ''), ('upload-acting', 'Upload while acting', ''), ('acting-broken', 'Delegation ended', '')]),
 ('qms', 'QMS and audit', 'Document control: the Master List and the QMS check.', [
  ('master', 'Master List', ''), ('master-record', 'Master record', ''), ('master-bulk', 'Bulk actions', ''), ('master-auditor', 'Master List · auditor', ''),
  ('workbench', 'QMS check', ''), ('workbench-done', 'QMS check · passed', ''), ('workbench-reject', 'QMS check · returned', ''),
  ('workbench-escalated', 'QMS check · escalated', ''), ('search-qms', 'Search · QMS view', ''), ('document-controller', 'Document · controller view', ''),
  ('more-qms', 'More · QMS', ''), ('refuse-desk', 'Not your role · desk', ''), ('refuse-master', 'Not your role · Master List', ''), ('refuse-upload', 'Not your role · upload', '')]),
]
SEG_KEYS = [k for k in ['coiled-tubing', 'wireline', 'drilling', 'fracturing', 'cementing', 'inspection', 'well-safety', 'well-testing', 'slickline',
            'well-completions', 'marine-services', 'pt-drilling-coe', 'pt-intervention-coe', 'pt-completions-coe', 'qhse', 'hr', 'cybersecurity',
            'finance', 'it', 'supply-chain', 'legal', 'learning-center', 'commercial', 'geothermal-coe', 'company']]
KEEP = [p for _, _, _, items in G for p, *_ in items] + [f'seg-{k}' for k in SEG_KEYS] + ['segments']
ENH = [
 ('Finish the two screens that still look half-converted', 'The Director’s own Home and the three “not part of your role” pages only got a thin dark bar. Give them the full photo top like every other screen.'),
 ('Arabic, right to left', 'Every screen is English only. RISE serves Arabic readers and keeps Arabic copies of documents, so the key screens (Home, Search, Document, an area) need an Arabic version with Somar type and mirrored layout.'),
 ('One navigation everywhere', 'Home, the area pages and the family pages use a slightly different top bar from the rest (“Ask” vs “Ask an Expert”, search button missing). Make it one bar with the same links in the same order.'),
 ('Reading a document on site', 'The document page shows a “preview not connected” box. Design the real reader: page view, jump to a section, “what changed in this revision” highlighted, and readable in sunlight.'),
 ('Loading, offline and error states', 'Show what a screen looks like while it loads, when the phone has no signal, and when the register cannot be reached, in the new style.'),
 ('Real photos for the support functions', 'HR, Finance, IT, Legal, Supply Chain, Commercial and Aberdeen still use stand-in pictures.'),
 ('Use the full 21st components', 'The command search and spotlight cards were rebuilt by hand from their descriptions. Swap in the real 21st code once the daily download limit allows.'),
 ('Accessibility check', 'Check text contrast on the toned photos, keyboard order in Search and Upload, and every screen with motion turned off.'),
]

def rewire(html):
    for old, new in RENAME.items():
        html = html.replace(f'{old}.html', f'{new}.html')
    for old, new in DROP.items():
        if old not in ('home', 'landing'):
            html = html.replace(f'"{old}.html', f'"{new}.html')
    return html

def build():
    for sub in ('pages', 'css', 'img', 'shots'):
        shutil.rmtree(os.path.join(FIN, sub), ignore_errors=True)
    os.makedirs(os.path.join(FIN, 'pages')); os.makedirs(os.path.join(FIN, 'shots'))
    shutil.copytree(os.path.join(REG, 'css'), os.path.join(FIN, 'css'))
    shutil.copytree(os.path.join(REG, 'img'), os.path.join(FIN, 'img'))
    n = 0
    for p in KEEP:
        q = RENAME.get(p, p)
        src = os.path.join(REG, 'pages', f'{p}.html')
        open(os.path.join(FIN, 'pages', f'{q}.html'), 'w').write(rewire(open(src).read()))
        for v in 'dm':
            s = os.path.join(REG, 'shots', f'{p}-{v}.jpg')
            if os.path.exists(s): shutil.copy(s, os.path.join(FIN, 'shots', f'{q}-{v}.jpg'))
        n += 1
    # no link may lead out of the chosen design
    have = {f[:-5] for f in os.listdir(os.path.join(FIN, 'pages'))}
    bad = set()
    for f in os.listdir(os.path.join(FIN, 'pages')):
        for h in re.findall(r'href="([a-z0-9-]+)\.html', open(os.path.join(FIN, 'pages', f)).read()):
            if h not in have: bad.add(h)
    return n, sorted(bad)

def gallery(prefix):
    """prefix: path from the gallery to the final/ folder ('' when the gallery sits in final/)."""
    def card(p, label, note, big=False):
        q = RENAME.get(p, p)
        return f'''<article class="card{' big' if big else ''}"><a class="shots" href="{prefix}pages/{q}.html" aria-label="Open {label}">
<img class="d" src="{prefix}shots/{q}-d.jpg" alt="{label}, desktop" loading="lazy" width="1440" height="900"><img class="m" src="{prefix}shots/{q}-m.jpg" alt="{label}, phone" loading="lazy" width="780" height="1688"></a>
<div class="cap"><h3><a href="{prefix}pages/{q}.html">{label}</a></h3>{f'<p>{note}</p>' if note else ''}<span class="fn">{q}.html</span></div></article>'''
    nav = ''.join(f'<a href="#{sid}">{t}</a>' for sid, t, *_ in G) + '<a href="#all-areas">25 areas</a><a href="#next">Next</a>'
    secs = ''
    for sid, t, intro, items in G:
        cls = ' two' if sid == 'front' else ''
        secs += f'<section class="sec" id="{sid}"><header class="sh"><h2>{t}</h2><p>{intro}</p><span class="ct">{len(items)} screens</span></header><div class="grid{cls}">{"".join(card(*it, big=(sid == "front")) for it in items)}</div></section>'
    tiles = ''.join(f'<a class="tile" href="{prefix}pages/seg-{k}.html"><img src="{prefix}shots/seg-{k}-d.jpg" alt="{SEGS[k]["name"]}" loading="lazy" width="1440" height="900"><span><b>{SEGS[k]["name"]}</b><i>{SEGS[k]["spl"]}</i></span></a>' for k in SEG_KEYS)
    secs += f'<section class="sec" id="all-areas"><header class="sh"><h2>Every area page</h2><p>The same page for all 25 areas, filled from the register.</p><span class="ct">25 screens</span></header><div class="tiles">{tiles}</div></section>'
    enh = ''.join(f'<li><b>{a}</b><p>{b}</p></li>' for a, b in ENH)
    secs += f'<section class="sec" id="next"><header class="sh"><h2>Where we can enhance</h2><p>In the order I would take them.</p></header><ol class="enh">{enh}</ol></section>'
    total = sum(len(i) for *_, i in G) + 25
    return f'''<title>RISE · Chosen design</title>
<link rel="stylesheet" href="{prefix}../kit/fonts.css">
<style>
/* Layout: dark title band like the product itself, then one section per part of RISE, desktop + phone side by side. */
:root{{--bg:#F6F6F2;--surface:#FFFFFF;--ink:#0E1B1A;--mute:#5C6966;--line:#E2E1DB;--accent:#00585A;--accent2:#00BFB2;--band:#061110;--bandfg:#ECF2F0;
--display:'BwGradual',Inter,system-ui,sans-serif;--ui:Inter,system-ui,sans-serif;--mono:'PlexMono',ui-monospace,monospace}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#0A1211;--surface:#111C1B;--ink:#E8EFED;--mute:#93A39F;--line:#22302E;--accent:#5FD0C4;--accent2:#00BFB2;--band:#030807;--bandfg:#ECF2F0;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#0A1211;--surface:#111C1B;--ink:#E8EFED;--mute:#93A39F;--line:#22302E;--accent:#5FD0C4;--accent2:#00BFB2;--band:#030807;--bandfg:#ECF2F0;color-scheme:dark}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:400 15px/1.55 var(--ui)}}
a{{color:inherit;text-decoration:none}}img{{display:block;max-width:100%}}
:focus-visible{{outline:2px solid var(--accent2);outline-offset:3px;border-radius:6px}}
.wrap{{max-width:1280px;margin:0 auto;padding-inline:24px}}
.band{{background:var(--band);color:var(--bandfg);padding-block:56px 40px;border-radius:0 0 28px 28px}}
.band .k{{font:500 12px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--accent2)}}
.band h1{{margin:14px 0 0;font:700 clamp(40px,6vw,76px)/.95 var(--display);letter-spacing:-.045em;text-wrap:balance}}
.band p{{max-width:62ch;margin:16px 0 0;color:#A9B9B5;font-size:17px}}
.band .go{{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}}
.band .go a{{display:inline-flex;align-items:center;min-height:44px;padding:0 20px;border-radius:999px;border:1px solid rgba(255,255,255,.18);font:600 14px var(--ui)}}
.band .go a:first-child{{background:#fff;color:#0E1B1A;border-color:#fff}}
.band .meta{{margin-top:24px;font:500 12.5px var(--mono);color:#7D8F8A;font-variant-numeric:tabular-nums}}
.nav{{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}}
.nav .wrap{{display:flex;gap:6px;overflow-x:auto;padding-block:10px;scrollbar-width:none}}
.nav a{{flex:none;padding:8px 14px;border-radius:999px;font:500 13.5px var(--ui);color:var(--mute)}}.nav a:hover{{background:var(--surface);color:var(--ink)}}
.sec{{padding-block:56px 0;scroll-margin-top:60px}}
.sh{{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 20px;align-items:end;padding-bottom:18px;border-bottom:1px solid var(--line)}}
.sh h2{{margin:0;font:700 34px/1.05 var(--display);letter-spacing:-.03em}}.sh p{{margin:0;grid-column:1;color:var(--mute)}}
.sh .ct{{grid-column:2;grid-row:1/3;font:500 12px var(--mono);color:var(--mute);font-variant-numeric:tabular-nums}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,360px),1fr));gap:28px 22px;margin-top:24px}}
.grid.two{{grid-template-columns:repeat(auto-fill,minmax(min(100%,560px),1fr))}}
.shots{{display:grid;grid-template-columns:minmax(0,1fr) 22%;gap:10px;align-items:end;padding:12px;border-radius:16px;background:var(--surface);border:1px solid var(--line);transition:border-color .2s}}
.shots:hover{{border-color:var(--accent2)}}
.shots img{{width:100%;height:auto;border-radius:8px;border:1px solid var(--line);object-fit:cover;object-position:top}}
.shots .d{{aspect-ratio:16/10}}.shots .m{{aspect-ratio:390/844}}
.cap{{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 12px;padding:12px 4px 0}}
.cap h3{{margin:0;font:600 16px/1.3 var(--ui)}}.cap h3 a:hover{{color:var(--accent)}}
.cap p{{margin:0;grid-column:1;color:var(--mute);font-size:14px}}
.cap .fn{{grid-column:2;grid-row:1;font:500 11.5px var(--mono);color:var(--mute)}}
.tiles{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,230px),1fr));gap:14px;margin-top:24px}}
.tile{{border-radius:14px;overflow:hidden;background:var(--surface);border:1px solid var(--line);transition:border-color .2s}}.tile:hover{{border-color:var(--accent2)}}
.tile img{{height:auto;aspect-ratio:16/10;object-fit:cover;object-position:top;width:100%}}
.tile span{{display:flex;justify-content:space-between;gap:10px;padding:10px 12px}}.tile b{{font:600 14px var(--ui)}}.tile i{{font:500 11.5px var(--mono);font-style:normal;color:var(--mute)}}
.enh{{margin:24px 0 0;padding:0;list-style:none;counter-reset:e;display:grid;gap:12px}}
.enh li{{counter-increment:e;display:grid;grid-template-columns:44px minmax(0,1fr);gap:4px 14px;padding:18px 20px;border-radius:14px;background:var(--surface);border:1px solid var(--line)}}
.enh li::before{{content:counter(e,decimal-leading-zero);grid-row:1/3;font:600 13px var(--mono);color:var(--accent);padding-top:2px}}
.enh b{{font:600 16px var(--ui)}}.enh p{{margin:0;color:var(--mute);max-width:80ch}}
footer{{padding-block:56px 40px;color:var(--mute);font:500 12px var(--mono)}}
@media (max-width:640px){{.sh h2{{font-size:27px}}.band{{padding-block:40px 30px}}}}
</style>
<header class="band"><div class="wrap"><p class="k">RISE · TAQA knowledge · design exploration</p><h1>The chosen design, on its own.</h1>
<p>Only the screens in the chosen style: dark photo top, bright rounded cards, one TAQA teal tone for photos. The earlier directions and experiments stay in the exploration gallery and are not mixed in here.</p>
<div class="go"><a href="{prefix}pages/landing.html">Open the landing page</a><a href="{prefix}pages/home.html">Open Home</a></div>
<p class="meta">{total} screens · desktop and phone · branch design/rise-exploration</p></div></header>
<nav class="nav" aria-label="Sections"><div class="wrap">{nav}</div></nav>
<main class="wrap">{secs}</main>
<footer class="wrap">RISE · chosen design · static prototype, not the live application</footer>'''

if __name__ == '__main__':
    n, bad = build()
    frag = gallery('')
    open(os.path.join(FIN, 'index.html'), 'w').write('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + frag + '</body></html>')
    out = os.environ.get('FINAL_PUB')
    if out:  # artifact copy: gallery at the root, final/ and kit/ beside it
        open(os.path.join(out, 'index.html'), 'w').write(gallery('final/').replace('final/../kit/', 'kit/'))
    print('final', n, 'pages · links out of the design:', bad or 'none')
