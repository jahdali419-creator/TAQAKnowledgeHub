"""Builds round-5/n-states/: N + TAQA with motion, press feedback and designed states.
Source pages: ../n-taqa/*.html (sprite and shell already inlined). Run: python3 build.py"""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'n-taqa')
rd = lambda f: open(os.path.join(SRC, f)).read()

ICONS = '''<symbol id="i-offline" viewBox="0 0 24 24"><path fill="currentColor" opacity=".32" d="M7 19h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.6 4.75 4.75 0 0 0 7 19z"/><path fill="currentColor" d="M4.2 3.1 20.9 19.8l-1.4 1.4L2.8 4.5z"/></symbol>
<symbol id="i-refresh" viewBox="0 0 24 24"><path fill="currentColor" d="M12 4a8 8 0 1 0 7.75 10h-2.1A6 6 0 1 1 12 6c1.6 0 3.05.63 4.12 1.65L13.5 10.3H20V3.8l-2.45 2.45A7.97 7.97 0 0 0 12 4z"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path fill="currentColor" d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z"/></symbol>
'''
TOAST = '<div class="toast" role="status" aria-live="polite"><svg><use href="#i-check"/></svg><span></span></div>'
SAVE_ON = '<button class="btn icon on" type="button" data-save aria-pressed="true" aria-label="Save"><svg class="ic-s o"><use href="#i-saved"/></svg><svg class="ic-s f"><use href="#i-saved-f"/></svg></button>'
SAVE_OFF = SAVE_ON.replace('btn icon on', 'btn icon').replace('aria-pressed="true"', 'aria-pressed="false"')

def prep(h, title=None, motion=True, head_extra=''):
    h = h.replace('<link rel="stylesheet" href="n.css">',
        '<link rel="stylesheet" href="../n-taqa/n.css">\n<link rel="stylesheet" href="states.css">' + head_extra +
        ('\n<script src="motion.js" defer></script>' if motion else ''))
    h = h.replace('<symbol id="s-cur"', ICONS + '<symbol id="s-cur"', 1)
    h = h.replace('href="area.html"', 'href="../n-taqa/area.html"')
    if title: h = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', h)
    return h

def swap_main(h, main):
    return re.sub(r'<main[^>]*>.*?</main>', main, h, count=1, flags=re.S)

def nav_on(h, key):
    h = h.replace(' class="it on" aria-current="page"', ' class="it"').replace(' class="on" aria-current="page"', '')
    h = h.replace(f'data-k="{key}" class="it"', f'data-k="{key}" class="it on" aria-current="page"')
    return h.replace(f'<a data-k="{key}" href', f'<a data-k="{key}" class="on" aria-current="page" href')

def w(name, h):
    open(os.path.join(HERE, name), 'w').write(h); print('wrote', name)

def ix(code, num, title, meta, end='<svg class="ic-s end"><use href="#i-chev-r"/></svg>', cls='ix', href='#'):
    return f'<a class="{cls}" href="{href}"><span class="code"><b>{code}</b><span>{num}</span></span><span><span class="t">{title}</span><span class="m">{meta}</span></span>{end}</a>'
CUR = '<span class="sig cur"><svg><use href="#s-cur"/></svg>Current</span>'
DUE = '<span class="sig due"><svg><use href="#s-due"/></svg>Review due</span>'
ALT = '<span class="sig alt"><svg><use href="#s-alert"/></svg>Active alert</span>'
LK = '<span class="lk"><svg><use href="#i-lock"/></svg></span>'
rv = lambda r: f'<span class="rv">Rev {r}</span>'

# ───────────── HOME (bento desktop) ─────────────
home = prep(rd('home.html'))
alertx = re.search(r'<a class="alertx".*?</a>', home, re.S).group(0)
tl = re.search(r'<ol class="tl">.*?</ol>', home, re.S).group(0)
mini = re.search(r'<a class="mini" href="document.html">.*?</a>', home, re.S).group(0)
saved = re.search(r'<section class="mod m-sav".*?</section>', home, re.S).group(0)
saved_rows = ''.join(re.findall(r'<a class="ix".*?</a>', saved, re.S))
tools = re.search(r'<section class="mod m-tools".*?</section>', home, re.S).group(0)
tools_rows = ''.join(re.findall(r'<a class="lnk".*?</a>', tools, re.S))
els_row = re.search(r'<section class="mod m-els".*?(<a class="ix".*?</a>)', home, re.S).group(1)
reg = re.search(r'<div class="reg">.*?</div>\s*</section>', home, re.S).group(0).replace('</section>', '')
hello = re.search(r'<section class="hello">.*?</section>', home, re.S).group(0)
hello = re.sub(r'\s*<div class="figs desk">.*?</div>\s*</div>', '', hello, flags=re.S)
main = f'''<main class="homews">
<div class="bento" data-reveal>
  {hello}
  <section class="tile-c b-att mod" aria-labelledby="att">
    <div class="mod-h"><h2 class="h2" id="att">Needs attention</h2><span class="ct">2</span></div>
    {alertx}
    <div class="acts3"><a class="btn pri" href="document.html"><svg class="ic-s"><use href="#i-doc"/></svg>Open WI-003 §5</a><a class="btn sec" href="#"><svg class="ic-s"><use href="#i-lock"/></svg>Request ALT-002 access</a></div>
    {ix('ALT','003','Chemical compatibility update for H2S environments', DUE + rv('2.0'))}
  </section>
  <section class="tile-c b-rec mod" aria-labelledby="rec">
    <div class="mod-h"><h2 class="h2" id="rec">Continue reading</h2><span class="ct">3</span></div>
    {mini}
    {ix('SOP','005','Pressure Testing Procedure', CUR + rv('2.0') + LK, cls='ix')}
    {ix('ALT','002','New pressure rating for 2-inch CT string', ALT + rv('2.0') + LK, cls='ix')}
  </section>
  <section class="tile-c b-fig" aria-label="Coiled Tubing in numbers">
    <div><b>36</b><span>In force</span></div><div><b class="o">2</b><span>Active alerts</span></div><div><b>45</b><span>In the register</span></div>
  </section>
  <section class="tile-c b-chg mod" aria-labelledby="chg">
    <div class="mod-h"><h2 class="h2" id="chg">Changed in Coiled Tubing</h2><span class="ct">2026</span></div>
    {tl}
  </section>
  <section class="tile-c b-sav mod" aria-labelledby="sav">
    <div class="mod-h"><h2 class="h2" id="sav">Saved</h2><span class="ct">3</span><a class="go" href="saved-empty.html" aria-label="All saved"><svg class="ic-s"><use href="#i-arrow-r"/></svg></a></div>
    {saved_rows}
  </section>
  <section class="tile-c b-tools mod" aria-labelledby="tools">
    <div class="mod-h"><h2 class="h2" id="tools">Tools</h2></div>
    {tools_rows}
  </section>
  <section class="tile-c b-els mod" aria-label="Elsewhere in TAQA and the RISE register">
    <div><div class="mod-h"><h2 class="h2">Elsewhere in TAQA</h2><span class="ct">1</span></div>{els_row}</div>
    <div><div class="mod-h"><h2 class="h2">RISE register</h2></div>{reg}</div>
  </section>
</div>
</main>'''
w('home.html', swap_main(home, main))

# ───────────── SEARCH (skeleton, then results with reveal) ─────────────
def skrow(wt):
    return f'<div class="ix skx"><span class="code"><span class="sk"></span><span class="sk"></span></span><span><span class="t sk" style="width:{wt}%"></span><span class="m"><span class="sk" style="width:66px"></span><span class="sk" style="width:46px"></span><span class="sk" style="width:84px"></span></span></span><span></span></div>'
SK_LIST = f'''<div class="skeleton" aria-busy="true" aria-label="Loading results">
    <nav class="tabs" aria-hidden="true">{''.join('<a><span class="sk sk-tab"></span></a>' for _ in range(5))}</nav>
    <div class="sbar"><span class="sk sk-count"></span><a class="fbtn" href="#"><svg><use href="#i-sliders"/></svg>Area · Status</a></div>
    <p class="loading-note"><i></i>Searching 520 documents in force</p>
    <section class="grp"><div class="grp-h"><span class="sk sk-h"></span></div>{''.join(skrow(x) for x in (78, 62, 86, 70, 58, 74, 66))}</section>
  </div>'''
SK_DETAIL = '''<div class="skeleton" aria-hidden="true">
    <div class="dplate"><p class="pre"><span class="sk" style="width:260px"></span></p><span class="sk" style="width:190px;height:58px;border-radius:8px"></span><div class="mid"><span class="sk" style="width:62%;height:22px"></span><span class="sk" style="width:38%;margin-top:12px"></span></div><span class="sk" style="width:96px;height:74px;border-radius:10px"></span></div>
    <div class="dsignal"><span class="sk" style="width:44px;height:44px;border-radius:10px"></span><div><span class="sk" style="width:120px;height:16px"></span><span class="sk" style="width:260px;margin-top:10px"></span></div><span class="sk" style="width:180px;height:42px;border-radius:10px"></span></div>
    <div class="split"><div class="preview"><div class="sheet"><span class="sk" style="width:100%;height:10px"></span><span class="sk" style="width:70%;height:24px;margin-top:58px"></span><span class="sk" style="width:46%;margin-top:14px"></span>''' + ''.join(f'<span class="sk" style="width:{x}%;height:8px;margin-top:14px"></span>' for x in (100, 94, 71, 100, 88, 96, 52)) + '''</div></div>
    <div class="side">''' + ''.join(f'<span class="sk" style="width:{x}%;height:{h}px;margin-top:{m}px"></span>' for x, h, m in ((40, 16, 0), (100, 12, 22), (86, 12, 16), (92, 12, 16), (70, 12, 16), (36, 16, 40), (100, 12, 22), (78, 12, 16))) + '''</div></div>
  </div>'''
src = rd('search.html')
def search_page(frozen):
    h = prep(src, motion=not frozen, head_extra='' if frozen else
        "\n<script>if(!matchMedia('(prefers-reduced-motion: reduce)').matches){var r=document.documentElement;r.classList.add('is-loading');r.setAttribute('data-load','700')}</script>")
    if frozen:
        h = h.replace('<html lang="en">', '<html lang="en" class="is-loading">')
        h = re.sub(r'<title>.*?</title>', '<title>RISE · Search · loading</title>', h)
    h = h.replace('<div class="pane list">', '<div class="pane list">\n  ' + SK_LIST + '\n  <div class="results" data-reveal>', 1)
    h = h.replace('\n</div>\n\n<div class="pane detail" aria-label="Selected document">',
                  '\n  </div>\n</div>\n\n<div class="pane detail" aria-label="Selected document">\n  ' + SK_DETAIL + '\n  <div class="results">', 1)
    h = h.replace('\n</div>\n</div>\n</main>', '\n</div>\n</div>\n</div>\n</main>', 1)
    return h
w('search.html', search_page(False))
w('search-loading.html', search_page(True))

# ───────────── DOCUMENT (save toggle + toast + reveal) ─────────────
doc = prep(rd('document.html'))
doc = doc.replace('<div class="phone-doc">', '<div class="phone-doc" data-reveal>', 1)
doc = doc.replace('<a class="btn icon on" href="#" aria-label="Saved"><svg class="ic-s"><use href="#i-saved-f"/></svg></a>', SAVE_ON)
doc = doc.replace('</body>', TOAST + '\n</body>')
w('document.html', doc)

# ───────────── DOCUMENT · OFFLINE (WI-003, pinned copy) ─────────────
off = doc.replace('<div class="app">', '<div class="app off">', 1)
off = re.sub(r'<title>.*?</title>', '<title>RISE · WI-003 · offline</title>', off)
off = off.replace('</header>\n\n<main>', '''</header>
<div class="offline" role="status"><svg><use href="#i-offline"/></svg><span><b>No connection.</b> Showing the copy pinned on this device.</span><a href="#">Retry</a></div>
<main>''', 1)
off = off.replace('<div class="signal cur">\n        <span class="tile"><svg><use href="#s-cur"/></svg></span>\n        <div class="w"><b>Current</b><span>Approved by Segment Director, Coiled Tubing</span></div>\n      </div>',
  '<div class="signal cached">\n        <span class="tile"><svg><use href="#s-cur"/></svg></span>\n        <div class="w"><b>Current when last checked</b><span>Pinned copy · Rev 4.0 · checked today 05:40</span></div>\n      </div>')
off = off.replace('<span class="tile"><svg><use href="#s-cur"/></svg></span>\n    <div class="w"><b>Current</b><span>Approved 28 Aug 2025 by Segment Director, Coiled Tubing</span></div>',
  '<span class="tile"><svg><use href="#s-cur"/></svg></span>\n    <div class="w"><b>Current when last checked</b><span>Pinned copy on this device · Rev 4.0 · checked with RISE today 05:40</span></div>')
off = off.replace('<div class="dsignal">', '<div class="dsignal cached">', 1)
ERR = '<p class="inline-err"><svg><use href="#i-offline"/></svg><span>Couldn’t check RISE for a newer revision. The ALT-002 warning above was saved with this copy.<a href="#">Retry</a></span></p>'
off = off.replace('<p class="summary">', ERR + '\n\n    <p class="summary">', 1)
off = off.replace('</a>\n  <div class="split">', '</a>\n  ' + ERR + '\n  <div class="split">', 1)
NOTE = '<p class="offnote"><svg><use href="#i-offline"/></svg>Opens when you’re back online</p>'
off = off.replace('<section class="mod" aria-labelledby="rel">', '<section class="mod dim-w" aria-labelledby="rel">', 1)
off = re.sub(r'(<section class="mod dim-w" aria-labelledby="rel">\s*<div class="mod-h">.*?</div>)(.*?)(</section>)', lambda m: m.group(1) + NOTE + '<div class="dim">' + m.group(2) + '</div>' + m.group(3), off, count=1, flags=re.S)
off = re.sub(r'(<div class="dview outline">.*?<section class="mod">\s*<div class="mod-h"><h2 class="h2">Related</h2><span class="ct">4</span></div>)(.*?)(</section>)', lambda m: m.group(1) + NOTE + '<div class="dim">' + m.group(2) + '</div>' + m.group(3), off, count=1, flags=re.S)
off = off.replace('<a class="btn sec" href="#"><svg class="ic-s"><use href="#i-ask"/></svg>Ask an Expert</a>', '<a class="btn sec dim" href="#" aria-disabled="true"><svg class="ic-s"><use href="#i-ask"/></svg>Ask an Expert · needs connection</a>')
off = off.replace('<svg class="ic-s"><use href="#i-download"/></svg>Download PDF', '<svg class="ic-s"><use href="#i-doc"/></svg>Open pinned copy')
off = off.replace('<svg class="ic-s"><use href="#i-download"/></svg>Open PDF', '<svg class="ic-s"><use href="#i-doc"/></svg>Open pinned copy')
off = off.replace('<span>Cover · PDF viewer not connected in this prototype</span>', '<span>Pinned copy · Rev 4.0 · readable offline</span>')
w('document-offline.html', off)

# ───────────── DOCUMENT · RESTRICTED (SOP-010) ─────────────
rs = prep(rd('document.html'), title='RISE · SOP-010 Fishing Operations SOP · restricted')
rs = rs.replace('<span class="ph">Search in WI-003</span>', '<span class="ph">Search documents, codes, terms</span>')
GATE = '''<section class="gatebox" aria-labelledby="gate">
      <span class="state-tag"><svg class="ic-xs"><use href="#i-lock"/></svg>Restricted</span>
      <h2 id="gate" style="margin-top:12px">You can see the record, not the file</h2>
      <p>QMS Document Control shares Restricted files on request. Ask once and you’ll be able to open and download SOP&#8209;010.</p>
      <div class="fld"><label for="why">Reason <small>Optional</small></label><div class="in" id="why" role="textbox" aria-multiline="true">For example: fishing job planned on your site</div></div>
      <a class="btn pri" href="#"><svg class="ic-s"><use href="#i-lock"/></svg>Request access through QMS</a>
      <p class="who"><svg><use href="#i-person"/></svg>Sent with your role: Employee, Coiled Tubing</p>
    </section>'''
REC = '''<dl class="spec">
          <dt>Number</dt><dd>TQ-TWS-CTSS-SOP-010</dd>
          <dt>Type</dt><dd>Procedure (SOP)</dd>
          <dt>Area</dt><dd>Coiled Tubing · Operations</dd>
          <dt>Revision</dt><dd>Rev 3.0</dd>
          <dt>Issued</dt><dd>14 May 2026</dd>
          <dt>Access</dt><dd><span class="lk"><svg><use href="#i-lock"/></svg>Restricted</span></dd>
          <dt>Language</dt><dd>English<small>Arabic version available</small></dd>
        </dl>'''
EXPERT = '''<div class="expert">
        <div class="who"><span class="ico"><svg class="ic-s"><use href="#i-person"/></svg></span><div><b>Coiled Tubing expert</b><span>Ask about this procedure</span></div></div>
        <a class="btn sec" href="#"><svg class="ic-s"><use href="#i-ask"/></svg>Ask an Expert</a>
      </div>'''
SOPS = [('002','BHA Assembly Procedure',CUR+rv('2.0')+LK), ('004','Emergency Disconnect Procedure',DUE+rv('1.0')),
        ('005','Pressure Testing Procedure',CUR+rv('2.0')+LK), ('006','CT Unit Rig-Up &amp; Rig-Down',DUE+rv('4.0')+LK),
        ('007','Nitrogen Injection SOP',CUR+rv('1.0')), ('008','Milling Operations SOP',DUE+rv('4.0')),
        ('009','Acid Stimulation SOP',CUR+rv('3.0')), ('010','Fishing Operations SOP',CUR+rv('3.0')+LK), ('011','Logging While CT SOP',CUR+rv('3.0'))]
sop_list = ''.join(ix('SOP', n, t, m, cls='ix sel' if n == '010' else 'ix') for n, t, m in SOPS)
main = f'''<main>
<div class="panes">
<div class="pane list">
  <a class="back" href="../n-taqa/area.html"><svg class="ic-s"><use href="#i-chev-l"/></svg>Procedures&nbsp;<span>· Coiled Tubing</span></a>
  <div class="phone-doc" data-reveal>
    <section class="plate" aria-label="Document identity">
      <p class="top"><span>Procedure · Operations</span><span class="pre">TQ-TWS-CTSS</span></p>
      <div class="idrow"><p class="no">SOP<span class="hy">-</span>010</p><div class="rev"><small>REV</small><b>3.0</b></div></div>
      <h1 class="ttl">Fishing Operations SOP</h1>
      <div class="signal cur"><span class="tile"><svg><use href="#s-cur"/></svg></span><div class="w"><b>Current</b><span>Issued 14 May 2026 · in force</span></div></div>
    </section>
    {GATE}
    <section class="mod" aria-labelledby="rec"><div class="mod-h"><h2 class="h2" id="rec">Record</h2></div>{REC}</section>
    <section class="mod" aria-label="Ask an expert">{EXPERT}</section>
  </div>
  <div class="dview outline">
    <section class="mod" style="margin-top:20px"><div class="mod-h"><h2 class="h2">Procedures</h2><span class="ct">9</span></div>{sop_list}</section>
  </div>
</div>
<div class="pane detail dview" aria-label="Document">
  <div class="dplate">
    <p class="pre"><span>TQ-TWS-CTSS</span><b>Procedure (SOP)</b><b>Coiled Tubing · Operations</b></p>
    <h1 class="no">SOP<span class="hy">-</span>010</h1>
    <div class="mid"><p class="ttl">Fishing Operations SOP</p><p class="sub">Restricted · English, Arabic version available</p></div>
    <div class="rev"><small>REV</small><b>3.0</b></div>
  </div>
  <div class="dsignal">
    <span class="tile"><svg><use href="#s-cur"/></svg></span>
    <div class="w"><b>Current</b><span>Issued 14 May 2026 · in force · file shared by QMS on request</span></div>
    <div class="acts">
      <a class="btn pri" href="#"><svg class="ic-s"><use href="#i-lock"/></svg>Request access</a>
      {SAVE_OFF}
      <a class="btn icon" href="#" aria-label="Share"><svg class="ic-s"><use href="#i-share"/></svg></a>
    </div>
  </div>
  <div class="split">
    <div>
      <div class="preview locked-sheet">
        <div class="sheet">
          <p class="hd"><span>TQ-TWS-CTSS-SOP-010</span><span>REV 3.0</span></p>
          <h4>Fishing Operations SOP</h4>
          <p class="sm">Standard operating procedure · Coiled Tubing</p>
          <div class="bars"><i class="h"></i><i style="width:100%"></i><i style="width:92%"></i><i style="width:68%"></i><i class="h"></i><i style="width:100%"></i><i style="width:86%"></i><i style="width:97%"></i><i style="width:58%"></i></div>
          <p class="ft"><span>Restricted</span><span>Issued 14 May 2026</span></p>
        </div>
        <div class="veil"><div><svg><use href="#i-lock"/></svg>Restricted file</div></div>
      </div>
      <p class="pv-cap"><span>The record is open to every employee; the file is not</span><span>Arabic version: on request</span></p>
    </div>
    <div class="side">
      {GATE}
      <section class="mod"><div class="mod-h"><h2 class="h2">Record</h2></div>{REC}</section>
    </div>
  </div>
</div>
</div>
</main>'''
rs = swap_main(rs, main)
rs = re.sub(r'<div class="actbar">.*?</div>', f'''<div class="actbar">
  <a class="btn sec" style="flex:1" href="#"><svg class="ic-s"><use href="#i-ask"/></svg>Ask an Expert</a>
  {SAVE_OFF}
  <a class="btn icon" href="#" aria-label="Share"><svg class="ic-s"><use href="#i-share"/></svg></a>
</div>''', rs, count=1, flags=re.S)
rs = rs.replace('</body>', TOAST.replace('<span></span>', '<span></span>') + '\n</body>')
w('document-restricted.html', rs)

# ───────────── SAVED · EMPTY ─────────────
sv = nav_on(prep(rd('home.html'), title='RISE · Saved'), 'saved')
sv = re.sub(r'<style>.*?</style>', '', sv, count=1, flags=re.S)
sv_row = lambda c, n, t, m: ix(c, n, t, m, end='<button class="sv" type="button" aria-label="Save"><svg><use href="#i-saved"/></svg></button>')
main = f'''<main class="svm">
<div class="sv-wrap">
  <section class="empty" data-reveal>
    <div class="art" aria-hidden="true"><span></span><span></span><span><b></b><em></em></span><span class="mk"><svg><use href="#i-saved-f"/></svg></span></div>
    <h1>Nothing saved yet</h1>
    <p class="l">Save the documents you use on every job. They stay one tap away, here and on Home.</p>
    <p class="how"><span class="k"><svg><use href="#i-saved"/></svg></span>Open any document and tap Save.</p>
    <div class="acts2"><a class="btn pri" href="../n-taqa/area.html">Browse Coiled Tubing</a><a class="btn sec" href="search.html"><svg class="ic-s"><use href="#i-search"/></svg>Search</a></div>
  </section>
  <section class="mod" aria-labelledby="ro">
    <div class="mod-h"><h2 class="h2" id="ro">Recently opened</h2><span class="ct">3</span></div>
    {sv_row('WI','003','Injector Head Operations Manual', CUR + rv('4.0'))}
    {sv_row('SOP','005','Pressure Testing Procedure', CUR + rv('2.0') + LK)}
    {sv_row('ALT','002','New pressure rating for 2-inch CT string', ALT + rv('2.0') + LK)}
  </section>
</div>
</main>'''
w('saved-empty.html', swap_main(sv, main))
