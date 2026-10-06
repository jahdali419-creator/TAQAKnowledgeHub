"""Document record (viewer.html on main) in Register: the answer to “Is this the current approved document I should use?” first,
then the control record, actions with their real disabled states, preview (not connected), what changed, history, related.
Lifecycle banners use the live wording. Employee: brief record + fold; controllers: full 12-cell record, history, approval trail."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from reg import *

WI3 = BYNUM['TQ-TWS-CTSS-WI-003']
CLAUSE = {'Document number': 'TQ-QHSE-S001 5.3', 'Revision': 'API Q2 4.4.3 d)', 'Issued': 'API Q2 4.4.3', 'Approved': 'API Q2 4.4.3 b)', 'Document owner': 'API Q2 4.4.3 a) · role',
          'Approval authority': 'API Q2 4.4.3 b) · role', 'Next review': 'API Q2 4.4.3 c)', 'Review cycle': 'TQ-QHSE-S001', 'Classification': 'ISO 9001 7.5.3.1 b)',
          'Retention': 'ISO 9001 7.5.3.2', 'Language': 'TQ-QHSE-S001', 'Master copy': 'SCORE'}

# the answer block — one sentence, shape + word, never colour alone
ANS = {
 'cur':   ('ok',  'Yes. Use this document.', 'Rev {rev} is the approved revision in force.'),
 'sup':   ('sup', 'No. This revision is superseded.', 'Rev {rev} was replaced by {by}. Use the current revision from SCORE.'),
 'wd':    ('al',  'No. Withdrawn, do not use.', 'This document has been withdrawn and must not be used for any activity.'),
 'draft': ('draft', 'Not yet. Draft, not approved.', 'Your filing is waiting on its QMS conformance check. Rev {prev} stays in force; use that.'),
 'ret':   ('ret', 'No. Returned, not in force.', 'This attempt was returned with a reason. Rev {prev} stays in force; use that.'),
 'nye':   ('pend', 'Not yet. Approved, effective {eff}.', 'Until then the revision in force stays current and is the one to use.'),
}
def answer(kind, **k):
    c, h, s = ANS[kind]
    return f'<section class="ans {c}" aria-label="Can I use this document?"><p class="lab">Is this the current approved document I should use?</p><h2>{h.format(**k)}</h2><p>{s.format(**k)}</p></section>'

def brief(r, status_word, status_cls):
    return kv([('Status', status_word, status_cls), ('Revision', 'Rev ' + r['revision']), ('Issued', d(r['issueDate'])), ('Owner', owner_of(r))], 'c4')

def full_record(r, review_note=None):
    cyc = TYPEINFO[r['docType']][3]
    cells = [('Document number', r['docNumber']), ('Revision', 'Rev ' + r['revision']), ('Issued', d(r['issueDate'])), ('Approved', d(r.get('approvedDate'))),
             ('Document owner', owner_of(r)), ('Approval authority', approver_of(r)), ('Next review', review_note or d(r.get('nextReviewDate'))), ('Review cycle', f'{cyc} months'),
             ('Classification', r['classification'].capitalize()), ('Retention', '10 years'), ('Language', 'English' if r['language'] == 'en' else 'العربية'), ('Master copy', '<a class="lnk" href="#">Open in SCORE</a>')]
    return '<div class="kv c4 rec">' + ''.join(f'<div><span>{k}</span><b>{v}</b><small>{CLAUSE[k]}</small></div>' for k, v in cells) + '</div>'

def actions(disabled=None, reason='', form=False, saved=True):
    dis = ' dis' if disabled else ''
    pri = '<a class="btn pri{0}" href="form.html">Fill in or print</a>' if form else '<a class="btn pri{0}" href="#">Download PDF</a>'
    bk = '<a class="btn{1}" href="#"><span class="star">★</span> Bookmarked</a>' if saved else '<a class="btn{1}" href="#">Bookmark</a>'
    allx = ' dis' if disabled == 'all' else ''
    html = f'''<div class="acts docacts">{pri.format(dis)}{bk.format('', allx)}<a class="btn{allx}" href="document-share.html">Share</a><a class="btn{allx}" href="document-qrc.html">More ▾</a>
  <span class="sync">{"Last synced: just now" if not disabled else ""}</span></div>'''
    if reason: html += f'<p class="small disr">{reason}</p>'
    return html

def preview(r, live=True):
    return f'''<div class="pvw"><div class="hd"><span>PDF document</span><span>{r["docNumber"]} · Rev {r["revision"]}</span></div>
  <div class="ph"><b>Preview not connected</b><p>{r["title"]} · {segname(r["segment"])}</p><p class="small">The full preview appears here once document storage is connected. Download the file to read it offline.</p>
  {'<a class="btn sm" href="#">Download PDF</a>' if live else ''}</div></div>'''

def related(r, role='employee'):
    rel = [x for x in inforce(role) if x['segment'] == r['segment'] and x['docType'] == r['docType'] and x['docNumber'] != r['docNumber'] and not x.get('translationOf')][:4]
    return '<div class="mini">' + ''.join(f'<a href="#"><b>{x["title"]}</b><span>{short(x["docNumber"])} · Rev {x["revision"]}</span></a>' for x in rel) + '</div>'

def head(r, crumb_title=None, banners=''):
    return f'''<header class="phead dh"><div class="meta"><span class="crumb">{crumbs(("Home", "home.html"), (segname(r["segment"]), "area.html"), (crumb_title or r["title"], None))}</span><span class="lab">{TYPEINFO[r["docType"]][0]} · {segname(r["segment"])}</span></div>
  {banners}
  <p class="rline" style="margin-top:26px"><b>{r["docNumber"]}</b><span>Rev {r["revision"]}</span><span>{r["classification"].capitalize()}</span></p>
  <h1 class="t1">{crumb_title or r["title"]}</h1></header>'''

def doc(name, r, kind, role='employee', banners='', status=('Current, OK to use', 'ok'), disabled=None, reason='', form=False, saved=True,
        changed=True, controller=False, extra_left='', ans_kw=None, crumb_title=None, acting=None):
    ans_kw = ans_kw or {}
    ans_kw.setdefault('rev', r['revision'])
    rec_fold = (full_record(r) if controller else f'<details class="fold"><summary>Full control record <span>12 fields</span></summary>{full_record(r)}</details>')
    hist = (f'''{sech("Version history", None)}<ol class="hist"><li class="cur"><span class="d">{d(r["issueDate"], "%b %Y")}</span><i></i><span><b>Rev {r["revision"]} · Current</b><small>Issued {d(r["issueDate"])} · approved {d(r.get("approvedDate"))}</small></span></li>
              <li><span class="d">—</span><i></i><span><b>{r.get("supersedes") or "No earlier revision"}</b><small>{"Replaced by Rev " + r["revision"] + ". Earlier dates are not recorded in the register." if r.get("supersedes") else "First issue."}</small></span></li></ol>
              <div class="acts" style="margin-top:14px"><a class="btn sm" href="#">Compare revisions</a></div>
              {sech("Approval &amp; e-signature trail")}<div class="route" style="--n:3"><div class="done"><span>Submitted for approval</span><b>Filer</b></div><div class="done"><span>QMS conformance check</span><b>QMS / Document Controller</b></div><div class="done"><span>Final approval</span><b>{approver_of(r)}</b><small>{d(r.get("approvedDate"))}</small></div></div>
              <p class="small" style="margin-top:10px">Signer identity shown by role until sign-in is connected.</p>'''
            if controller else
            f'{sech("Version history")}<p class="body" style="margin-top:12px">Current revision: <b>Rev {r["revision"]}</b>. The full revision history is available to the document owner, QMS and an auditor.</p>')
    chg = (f'''{sech("What changed in Rev " + r["revision"])}<p class="body" style="margin-top:12px">Traction pressure limits for 2-inch string.</p>
              <p class="small" style="margin-top:6px">Replaces {r.get("supersedes") or "—"} · <span class="prop" style="margin-left:0">proposed field</span> the register holds no change note yet.</p>''' if changed else '')
    area_alerts = [x for x in inforce(role) if x['segment'] == r['segment'] and x['docType'] == 'alert']
    al = ''.join(f'<a class="hot" href="#"><b>{x["title"]}</b><span>{short(x["docNumber"])} · Rev {x["revision"]}</span></a>' for x in area_alerts)
    body = f'''{head(r, crumb_title, banners)}
<div class="g84"><div>
  {answer(kind, **ans_kw)}
  <div style="margin-top:22px">{brief(r, *status) if not controller else ""}</div>
  {rec_fold}
  {actions(disabled, reason, form, saved)}
  {extra_left}
  <div class="sp40"></div>{preview(r, not disabled)}
  {chg}
  {hist}
</div><aside class="aside">
  {sech("Alerts in this area", len(area_alerts))}<div class="mini">{al or '<p class="small" style="padding:12px 0">No active alerts in this area.</p>'}</div>
  {sech("Related documents")}{related(r, role)}
  <p class="help" style="margin-top:26px">Unsure how to apply it? <a class="lnk" href="ask.html">Ask the Coiled Tubing Expert</a></p>
</aside></div>'''
    page(name, f'RISE · {crumb_title or r["title"]}', body, 'areas', role, acting=acting, dock_active='areas')

def banner(kind, title, text):
    return f'<div class="bnr {kind}" style="margin-top:24px"><span class="ic"></span><div><b>{title}</b> {text}</div><span></span></div>'

# 1 · current (Employee)
doc('document.html', WI3, 'cur')
# 2 · controller (QMS) — full record open, history, approval trail
doc('document-controller.html', WI3, 'cur', role='qms', controller=True)
# 3 · superseded (SOP-003)
S3 = BYNUM['TQ-TWS-CTSS-SOP-003']
doc('document-superseded.html', S3, 'sup', banners=banner('sup', 'Superseded. A newer revision exists.', f'This revision has been replaced by {S3["supersededBy"]}. Use the current revision from SCORE.'),
    status=('Superseded', 'due'), disabled='some', reason='Superseded revision. Download, Pin offline, Quick reference card and Print are disabled to prevent an uncontrolled copy.',
    changed=False, saved=False, ans_kw={'by': S3['supersededBy']})
# 4 · withdrawn (SOP-012, obsolete)
S12 = BYNUM['TQ-TWS-CTSS-SOP-012']
doc('document-withdrawn.html', S12, 'wd', banners=banner('al', 'Obsolete. Do not use.', 'This document has been withdrawn by QMS / Document Controller and must not be used for any activity. Destroy or mark any printed copy. Obtain the current document from SCORE.'),
    status=('Withdrawn, do not use', 'al'), disabled='some', reason='Withdrawn document. Download is disabled to prevent an uncontrolled copy.', changed=False, saved=False)
# 5 · own draft submitted (Employee filed a revision of SOP-009)
S9 = dict(BYNUM['TQ-TWS-CTSS-SOP-009']); S9d = dict(S9, revision='4.0', status='draft', issueDate='2026-10-06', approvedDate=None, supersedes='Rev 3.0')
own = f'''<div class="route" style="--n:4;margin-top:30px"><div class="done"><span>Filed</span><b>You</b><small>06 Oct 2026, 08:40</small></div><div class="now"><span>QMS check</span><b>QMS / Document Controller</b><small>Waiting</small></div>
  <div><span>Final approval</span><b>Segment Director, Coiled Tubing</b></div><div><span>Published</span><b>Coiled Tubing library</b></div></div>'''
doc('document-draft.html', S9d, 'draft', banners=banner('lock', 'Submitted for approval, not in force yet.', 'Filed 06 Oct 2026 and now waiting on the <b>QMS conformance check</b>. You will see the outcome under the bell.'),
    status=('Draft, not approved', ''), disabled='some', reason='Not approved for use, so download is disabled.', changed=False, saved=False, extra_left=own, ans_kw={'prev': '3.0'})
# 6 · own draft returned
RSN = 'Section 6 still cites SOP-003 Well Entry Protocol Rev 3.0, which is superseded. Cite the revision in force and file it again.'
ret = f'''<div class="acts" style="margin-top:16px"><a class="btn pri" href="upload-again.html">File it again</a><span class="small">Same number and revision, as its next attempt. This attempt stays as history.</span></div>'''
doc('document-returned.html', S9d, 'ret', banners=banner('al', 'Returned, not in force.', f'Returned by QMS / Document Controller on 06 Oct 2026: “{RSN}” Revise it and <b>file it again</b> as its next attempt.'),
    status=('Returned, not in force', 'al'), disabled='some', reason='Not approved for use, so download is disabled.', changed=False, saved=False, extra_left=ret, ans_kw={'prev': '3.0'})
# 7 · approved, not yet effective (S005, Director chose 20 Oct 2026)
S5 = dict(BYNUM['TQ-TWS-CTSS-S005'], status='approved', approvedDate='2026-10-06', issueDate='2026-10-20')
doc('document-notyet.html', S5, 'nye', role='owner', banners=banner('due', 'Approved, not yet effective.', 'Approved 06 Oct 2026. It takes effect on 20 Oct 2026; until then the revision in force stays current and is the one to use.'),
    status=('Approved, effective 20 Oct 2026', 'due'), disabled='some', reason='Not in force until 20 Oct 2026, so download is disabled.', changed=False, saved=False, ans_kw={'eff': '20 Oct 2026'})

# 8 · not available to your role (link to a restricted record, or a number that does not exist — they read the same)
na = f'''<header class="phead dh"><div class="meta"><span class="crumb">{crumbs(("Home", "home.html"), ("Document", None))}</span><span class="lab">From a shared link</span></div></header>
<div class="refuse" style="padding-top:20px"><p class="lab">TQ-TWS-CTSS-SOP-005</p><h1 class="t0" style="margin-top:16px">Not in the Master Document List <span class="m">available to your role.</span></h1>
<p class="body" style="margin-top:18px">RISE has no document matching this link that your role can open, so its revision, approval and review status cannot be confirmed here. Check the number, ask the QMS function if you believe you need access, and check SCORE before using any copy.</p>
<div class="acts" style="margin-top:26px"><a class="btn pri" href="search.html">Search the documents</a><a class="btn" href="home.html">Home</a></div>
<p class="small" style="margin-top:22px">A number that does not exist reads exactly the same, so this page never confirms that a restricted document exists.</p></div>'''
page('document-unavailable.html', 'RISE · Document', na, 'areas', dock_active='areas')

# 9 · access restricted (classification, lock) — ALT-002 is Confidential
A2 = BYNUM['TQ-TWS-CTSS-ALT-002']
den = f'''<header class="phead dh"><div class="meta"><span class="crumb">{crumbs(("Home", "home.html"), ("Coiled Tubing", "area.html"), ("Document", None))}</span><span class="lab">Technical alert</span></div>
<div class="bnr lock" style="margin-top:24px"><span class="ic"></span><div><b>Access restricted.</b> This document is classified CONFIDENTIAL. Your role (Employee) has access to internal documents. ISO 9001 7.5.3.1 b). If you need it, request access through the QMS function.</div><span></span></div></header>
<div class="g84"><div><div class="lockpane">{LOCK.replace('class="lk"', 'class="lk big"')}<b>Not available to your role</b><p>No title, revision or status is shown for a document your role cannot open.</p><a class="btn" href="ask.html">Ask the QMS function</a></div>
{actions('all', 'Not available to your role, so these actions are disabled.', saved=False)}</div>
<aside class="aside">{sech("While you are here")}<p class="body" style="margin-top:12px">Every document you need is still open to you, and each one tells you whether it is current before you use it.</p></aside></div>'''
page('document-denied.html', 'RISE · Access restricted', den, 'areas', dock_active='areas')

# 10 · Quick reference card (More → Quick reference card), Sunlight Mode on
qrc = f'''<div class="scrim"></div><section class="dlg qrc sun" role="dialog" aria-label="Quick reference card">
  <div class="qbar"><a class="on" href="#">◐ Sunlight Mode</a><span class="mute">Last synced: just now</span><span class="sp"></span><a href="#">Print card</a><a href="document.html">✕ Close</a></div>
  <p class="pill">Manual · Coiled Tubing</p><h2>Injector Head Operations Manual</h2>
  <div class="chips"><span><i>Document no.</i>TQ-TWS-CTSS-WI-003</span><span><i>Revision</i>4.0</span><span><i>Issued</i>30 Aug 2025</span><span><i>Status</i>Current</span><span><i>Classification</i>Internal</span><span><i>Segment</i>Coiled Tubing</span></div>
  <p class="lab" style="margin-top:20px;color:#000">Key points</p><ul class="kp"><li>Rev 4.0</li><li>Internal</li><li>Review due Aug 2028</li></ul>
  <p class="foot"><b>UNCONTROLLED WHEN PRINTED.</b> Valid at time of printing only. This revision is due for review on 30 Aug 2028. Verify the current revision in SCORE before use.</p></section>'''
menu = '''<div class="menu-pop"><a href="document-qrc.html">Quick reference card</a><a href="#">Pin offline</a><a href="#">Print</a></div>'''
doc('document-qrc.html', WI3, 'cur')
p = os.path.join(PAGES, 'document-qrc.html'); h = open(p).read().replace('</main>', '</main>' + qrc); open(p, 'w').write(h)

# 11 · Share (QR) popover
share = '''<div class="scrim"></div><section class="dlg" role="dialog" aria-label="Share this document"><p class="lab">Share this document</p>
  <div class="qrbox" aria-label="QR code"></div><p class="body" style="margin-top:16px">Scan with a phone or tablet to open this document there, or copy the link.</p>
  <div class="g75" style="column-gap:10px;margin-top:14px"><div class="in ro code">rise.taqa.com/viewer?doc=TQ-TWS-CTSS-WI-003</div><a class="btn" href="#">Copy link</a></div>
  <div class="acts"><a class="btn pri" href="document.html">Done</a></div></section>'''
doc('document-share.html', WI3, 'cur')
p = os.path.join(PAGES, 'document-share.html'); h = open(p).read().replace('</main>', '</main>' + share); open(p, 'w').write(h)

# 12 · form record (F001): primary action becomes Fill in or print
F1 = BYNUM['TQ-TWS-CTSS-F001']
doc('document-form.html', F1, 'cur', form=True, changed=False)

# 13 · form page (form.html): fill in on screen, print blank or as PDF
rows = [('1', 'Permit to Work issued, signed and displayed at the unit', 'y'), ('2', 'Job safety analysis reviewed with the whole crew', 'y'), ('3', 'Emergency disconnect procedure briefed', 'n'), ('4', 'H2S monitors bump-tested and worn', ''), ('5', 'Simultaneous operations identified and coordinated', 'na')]
def chk(v):
    return ''.join(f'<span class="ck{" on" if v == k else ""}">{lab}</span>' for k, lab in (('y', '✓'), ('n', '✗'), ('na', 'N/A')))
tbl = ''.join(f'<tr><td class="d">{n}</td><td class="t">{c}</td><td><span class="cks">{chk(v)}</span></td><td>{"<span class=in style=min-height:36px>Disconnect not briefed, holding job</span>" if v == "n" else ""}</td></tr>' for n, c, v in rows)
form = f'''<header class="phead"><div class="meta"><span class="crumb">{crumbs(("Coiled Tubing", "area.html"), ("Pre-Job Safety Checklist", "document-form.html"), ("Fill in", None))}</span><span class="lab">Answers are kept on this device only</span></div>
<div class="acts" style="margin-top:22px"><a class="btn" href="document-form.html">← Back to the record</a><a class="btn ghost" href="#">Clear answers</a><span class="sp" style="flex:1"></span><a class="btn" href="#">Print blank</a><a class="btn pri" href="#">Print or save as PDF</a></div></header>
{note('due', '<b>Sample content.</b> These checks are placeholders that show the TAQA form template. The approved checklist replaces them before the form is used on a job.')}
<div class="paper watermark fsheet" data-wm="Uncontrolled when printed" style="margin-top:22px">
  <div class="hd"><span>TQ-TWS-CTSS-F001</span><span>REV 4.0 · ISSUED 20 JUL 2025 · COILED TUBING</span></div>
  <h2 class="t2" style="margin-top:22px">Pre-Job Safety Checklist</h2><p class="small" style="margin-top:6px">Status in the register: <b style="color:var(--ok)">Current, OK to use</b></p>
  <div class="kv c4" style="margin-top:22px"><div><span>Well / location</span><b>Haradh-14, Rig 7</b></div><div><span>Date</span><b>06 Oct 2026</b></div><div><span>Job number</span><b class="mute">—</b></div><div><span>Crew lead</span><b>Faisal Al-Ghamdi</b></div></div>
  <h3>Permits and documents</h3>
  <table class="tbl" style="margin-top:8px"><thead><tr><th>No.</th><th>Check</th><th>✓ ✗ N/A</th><th>Remarks</th></tr></thead><tbody>{tbl}</tbody></table>
  <p class="tally"><b>4 of 5</b> checks answered · 1 marked ✗, add a remark and stop the job if it is unsafe</p>
  <div class="g66" style="margin-top:26px"><div class="sign"><span class="lab">Completed by</span><i></i><small>Name · Date · Signature</small></div><div class="sign"><span class="lab">Verified by (CT Supervisor)</span><i></i><small>Name · Date · Signature</small></div></div>
  <p class="small" style="margin-top:26px">Rev 4.0 · 20 Jul 2025 · TQ-TWS-CTSS-F001 · Owner: QHSE / Relevant SPL / Function · Approver: Relevant Operation Director. This document is uncontrolled when printed unless over stamped “CONTROLLED DOCUMENT”. Scan the code for the current revision.</p>
</div>'''
page('form.html', 'RISE · Pre-Job Safety Checklist', form, 'areas', dock_active='areas')
print('doc ok')
