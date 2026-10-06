"""Saved (bookmarks panel on main, as a page), Notifications (the bell queue as built, plus PROPOSED types, labelled),
the phone More page, Account."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from reg import *

SAVED = [BYNUM[n] for n in ('TQ-TWS-CTSS-WI-003', 'TQ-TWS-CTSS-F001', 'TQ-TWS-CTSS-SOP-009')]
def srow(r, href='#'):
    return (f'<a href="{href}" style="--cols:56px minmax(0,1fr) 132px 120px 28px"><span class="c mk">{MARK[r["docType"]]}</span>'
            f'<span class="t"><span class="one">{r["title"]}</span><small>{short(r["docNumber"])} · Rev {r["revision"]} · {segname(r["segment"])}</small></span>'
            f'<span class="a">{TYPE[r["docType"]]}</span>{st_for(r)}<span class="x rm" role="button" aria-label="Remove bookmark">✕</span></a>')

saved = f'''<header class="phead"><div class="meta"><span class="lab">Saved</span><span class="lab">On this device · up to 50</span></div>
  <h1 class="t0">Saved <span class="m">{len(SAVED)}</span></h1><p class="sub">Documents you bookmarked, newest first. Each one still tells you whether it is current before you use it.</p>
  <div class="acts" style="margin-top:22px"><a class="btn sm" href="#">Export list</a><a class="btn sm ghost" href="saved-empty.html">Clear</a></div></header>
<div class="g84"><div>
  {sech('Bookmarks', len(SAVED))}
  <div class="reg">{"".join(srow(r, "document.html" if "WI-003" in r["docNumber"] else ("document-form.html" if r["docType"] == "form" else "#")) for r in SAVED)}</div>
  {sech('Pinned offline', 1)}<p class="small" style="margin-top:8px"><span class="prop" style="margin-left:0">proposed</span> “Pin offline” exists in the record’s More menu but no page lists pins yet. This is where they would live.</p>
  <div class="reg">{srow(SAVED[0], "document.html").replace("Work instruction", "Pinned 06 Oct")}</div>
</div><aside class="aside">{sech('About Saved')}
  <p class="body" style="margin-top:12px">Bookmarks are kept on this device. A bookmark to a document your role cannot open is not shown or counted.</p>
  <p class="body" style="margin-top:12px">Every page RISE has loaded stays readable offline; nothing can be sent until you reconnect.</p></aside></div>'''
page('saved.html', 'RISE · Saved', saved, 'saved')

empty = f'''<header class="phead"><div class="meta"><span class="lab">Saved</span><span class="lab">On this device</span></div><h1 class="t0">Saved <span class="m">0</span></h1></header>
<div class="empty"><h2 class="t2">Nothing saved yet.</h2><p class="body">Tap ☆ on any document to keep it here.</p><div class="acts" style="margin-top:20px"><a class="btn" href="area.html">Browse Coiled Tubing</a><a class="btn ghost" href="search.html">Search</a></div></div>'''
page('saved-empty.html', 'RISE · Saved · empty', empty, 'saved')

# ── notifications ─────────────────────────────────────────────────────────
def nitem(kind, title, line, outcome, when, href='#', prop=False, cls=''):
    return (f'<a class="nt {kind} {cls}" href="{href}"><i></i><span class="b"><b>{title}</b><span class="code">{line}</span><span class="o">{outcome}</span></span>'
            f'<span class="w">{when}{"<em class=prop>proposed</em>" if prop else ""}</span></a>')
RSN = 'Section 6 still cites SOP-003 Well Entry Protocol Rev 3.0, which is superseded. Cite the revision in force and file it again.'
A3, L3 = BYNUM['TQ-TWS-CTSS-ALT-003'], BYNUM['TQ-TWS-CTSS-LL-003']
notif = f'''<header class="phead"><div class="meta"><span class="lab">Notifications</span><span class="lab">Tap an item to open it and clear it</span></div>
  <h1 class="t0">Notifications</h1><p class="sub">What RISE sends you today: the outcome of documents you filed. The types below the line are proposed and not built yet.</p></header>
<div class="g84"><div>
  {sech('Your submissions', 1)}
  <div class="nlist">{nitem('ret', 'Acid Stimulation SOP', 'TQ-TWS-CTSS-SOP-009 · Rev 4.0', 'Rejected: ' + RSN, 'Today 10:12', 'document-returned.html')}</div>
  <p class="small" style="margin-top:10px">Other outcomes read “Approved, in force from 20 Oct 2026” or “Approved and published”.</p>
  {sech('Proposed types', 3)}
  <div class="nlist">
    {nitem('alt', 'Urgent technical alert in Coiled Tubing', short(A3['docNumber']) + ' · Rev ' + A3['revision'], A3['title'], '06 Jun 2025', prop=True)}
    {nitem('rev', 'Revised in your area', short(L3['docNumber']) + ' · Rev ' + L3['revision'], L3['title'] + ' · replaces ' + (L3.get('supersedes') or 'Rev 3.0'), '16 May 2026', prop=True)}
    {nitem('inf', 'Information', 'Company policies', 'Field Glossary now has 254 terms in 11 categories', '—', prop=True)}
  </div>
</div><aside class="aside">{sech('How each type reads')}
  <div class="kv c1 legend"><div><span>◆ Urgent alert</span><b>Crimson, always first</b><small>Only technical alerts use red</small></div><div><span>■ Returned</span><b>Outcome of your filing</b><small>Built · with the reason</small></div>
  <div><span>● Revised</span><b>A document you rely on changed</b><small>Proposed · needs subscriptions</small></div><div><span>○ Information</span><b>No action needed</b><small>Proposed</small></div></div></aside></div>'''
page('notifications.html', 'RISE · Notifications', notif, 'more', dock_active='more')

S5 = BYNUM['TQ-TWS-CTSS-S005']
notif_d = f'''<header class="phead"><div class="meta"><span class="lab">Notifications · Segment Director</span><span class="lab">Up to 6, newest first</span></div>
  <h1 class="t0">Waiting for your signature <span class="m">1</span></h1></header>
<div class="g84"><div><div class="nlist">{nitem('req', S5['title'], S5['docNumber'] + ' · Coiled Tubing, Operations', 'Waiting for your final approval · submitted 06 Oct 2026, 09:14', 'Today', 'desk.html')}</div>
<div class="acts" style="margin-top:22px"><a class="btn pri" href="desk.html">Open your queue</a></div></div>
<aside class="aside">{sech('When it is empty')}<p class="body" style="margin-top:12px">“Nothing waiting right now.” The bell shows no badge.</p></aside></div>'''
page('notifications-director.html', 'RISE · Notifications · Director', notif_d, 'more', role='owner', dock_active='more')

# ── phone More (also reachable on desktop as a page) ─────────────────────
def more(role, name):
    R = ROLES[role]
    ctl = ''.join(f'<a href="{h}"><b>{t}</b><span{" class=n" if n else ""}>{f"{n} waiting" if n else "Open"}</span></a>' for k, t, h, n in R['control'])
    body = f'''<header class="phead"><div class="meta"><span class="lab">{R["who"]}</span><span class="lab">{R["label"]}</span></div><h1 class="t1">More</h1></header>
<div class="morel">
  <a href="ask.html"><b>Ask an Expert</b><span>By area</span></a><a href="glossary.html"><b>Field Glossary</b><span>254 terms</span></a>
  {'<a href="upload.html"><b>Upload a document</b><span>QMS checks it first</span></a>' if R['upload'] else ''}
  <a href="{"notifications-director.html" if role == "owner" else "notifications.html"}"><b>Notifications</b><span class="n">{"1 waiting" if role == "owner" else "1 new"}</span></a>
  {f'<p class="lab">{R.get("ctl_label", "Document control")}</p>' + ctl if ctl else ''}
  <p class="lab">You</p><a href="account.html"><b>Account{" &amp; delegation" if role in ("owner", "maintenance") else ""}</b><span>Settings</span></a>
</div>'''
    page(name, 'RISE · More', body, 'more', role, dock_active='more')
more('employee', 'more.html'); more('owner', 'more-director.html'); more('qms', 'more-qms.html')

# ── account ──────────────────────────────────────────────────────────────
def account(role, name):
    R = ROLES[role]
    dl = (f'''{sech('Delegation', None, 'Manage', 'delegation.html')}<p class="body" style="margin-top:12px">Let someone approve, or manage documents, for you while you are away. Up to 90 days; every grant is kept as evidence.</p>
      <div class="acts" style="margin-top:14px"><a class="btn" href="delegation-new.html">Grant a delegation</a></div>''' if role in ('owner', 'maintenance')
          else f'{sech("Delegation")}<p class="body" style="margin-top:12px">Only a Segment Director or a Maintenance Manager can grant a delegation.</p>')
    body = f'''<header class="phead"><div class="meta"><span class="lab">Account</span><span class="lab">From your TAQA sign-in</span></div>
  <h1 class="t1">{R["who"]}</h1><p class="sub">{R["title"]} · {R["area"]}</p></header>
<div class="g84"><div>
  {kv([("Role", R["label"]), ("Home area", R["area"]), ("Opens", {"employee": "Internal documents", "owner": "Internal and confidential", "qms": "Every classification"}.get(role, "—")), ("Signed in with", "Microsoft Entra ID")], 'c2')}
  <p class="small" style="margin-top:12px">Your role and area come from your TAQA account. They are not set here.</p>
  {dl}
  {sech('This device')}
  {kv([("Saved", "3 bookmarks"), ("Offline", "Every page you have opened stays readable"), ("Theme", "Light · switch to dark"), ("Last synced", "Just now")], 'c2')}
</div><aside class="aside">{sech('Keyboard')}<div class="kv c1"><div><span>/</span><b>Focus search on this page</b></div><div><span>?</span><b>Show or hide shortcuts</b></div><div><span>Esc</span><b>Close a dialog</b></div></div></aside></div>'''
    page(name, 'RISE · Account', body, 'more', role, dock_active='more')
account('employee', 'account.html'); account('owner', 'account-director.html')
print('personal ok')
