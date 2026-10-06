"""Delegation, Manage (withdraw), Master List, QMS check (Workbench), Auditor, refusal screens."""
import sys, os, collections
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from reg import *

# ═════ Delegation ═════
GRANTS = [
 ('Ahmed Saleh', 'active', 'Active', 'Approval, no document management · Coiled Tubing, every type you hold · 06 Oct to 20 Oct 2026', 'Annual leave, desk cover while away', 'DEL-MG2K1Q-4XH7A · granted by CT Director 06 Oct 2026', '<a class="btn sm danger" href="delegation-revoke.html">Revoke</a>'),
 ('Deputy Director', 'sched', 'Scheduled', 'Approval and document management · Coiled Tubing, every type you hold · 22 Oct to 31 Oct 2026', 'Field visit to Stavanger, desk cover', 'DEL-MG9P2D-7QK1B · granted by CT Director 06 Oct 2026', '<a class="btn sm danger" href="delegation-revoke.html">Revoke</a>'),
 ('Deputy Director', 'exp', 'Expired', 'Approval, no document management · Coiled Tubing · 01 Sep to 10 Sep 2026', 'Annual leave, desk cover while away', 'DEL-LZ0W8C-2HF5E · granted by CT Director 28 Aug 2026', ''),
 ('Omar Al-Harbi', 'rev', 'Revoked', 'Approval, no document management · Coiled Tubing · 14 Jul to 30 Jul 2026', 'Cover during the CT unit audit week', 'DEL-LY3T1A-9MP2C · granted by CT Director 10 Jul 2026 · revoked by CT Director 18 Jul 2026', ''),
 ('Old Deputy', 'exp', 'Expired', 'Approval · Coiled Tubing', 'Recorded before RISE kept full delegation evidence', 'DEL-LEGACY1 · grantor identity, department and document management not recorded', ''),
]
glist = ''.join(f'<div class="grant"><h4>{n} <span class="gst {c}">{w}</span></h4><p class="m">{m}<br><span class="mute">{why}</span></p><p class="ev">{ev}</p><div class="acts">{a}</div></div>' for n, c, w, m, why, ev, a in GRANTS)
deleg_head = f'''<header class="phead"><div class="meta"><span class="crumb">{crumbs(("Coiled Tubing", "area.html"), ("Desk", "desk.html"), ("Delegation", None))}</span><span class="lab">Segment Director · Coiled Tubing</span></div>
  <h1 class="t1">Delegate your authority <span class="m">while you are away.</span></h1>
  <p class="sub">It expires on its own, and every document records who actually signed. Grants are never deleted: revoked and expired ones stay here as evidence.</p></header>'''
rules = '''<aside class="aside">{}<div class="kv c1">{}</div><p class="small" style="margin-top:14px">Never delegable: the QMS check, filing a document and the register export.</p></aside>'''.format(
    sech('The rules'), ''.join(f'<div><span>{a}</span><b>{b}</b></div>' for a, b in [('Who can grant', 'Segment Director, Maintenance Manager'), ('Two separate permissions', 'Approval · Manage documents'), ('Dates', 'Start today or later · at most 90 days, counting both'), ('Reason', 'At least 20 characters'), ('While acting', 'No filing, no export, no re-delegation')]))
page('delegation.html', 'RISE · Delegation', deleg_head + f'''<div class="g84"><div>
  <div class="acts" style="margin-bottom:24px"><a class="btn pri" href="delegation-new.html">Delegate…</a></div>
  {sech("Grants", len(GRANTS))}{glist}</div>{rules}</div>''', 'desk', 'owner')

form = f'''<div class="g84"><div>
  <p class="steps"><span class="on">New delegation</span></p>
  <label class="f"><span class="lab">Who holds it</span><span class="in focus">Ahmed Saleh</span><span class="hint">Name the person, not a role, so the record shows who acted.</span></label>
  <div class="g66" style="column-gap:20px"><label class="f"><span class="lab">From</span><span class="in">06 Oct 2026<span class="car">▾</span></span></label><label class="f"><span class="lab">Until</span><span class="in">20 Oct 2026<span class="car">▾</span></span></label></div>
  <span class="hint" style="display:block;margin-top:8px;font-size:13px;color:var(--ink3)">Valid for the whole of both dates, at most 90 days counting both. 15 days.</span>
  <div class="f"><span class="lab">What they may do</span>
    <div class="opt on"><span class="cb"></span><span><b>Approval</b><small>Give final approval in your place, or return a document with a reason.</small></span><span></span></div>
    <div class="opt"><span class="cb"></span><span><b>Manage documents</b><small>Edit details and withdraw. Separate from approval; off unless you tick it.</small></span><span></span></div></div>
  <label class="f"><span class="lab">Why</span><span class="in ta bad">Annual leave</span><span class="err">Record why, in at least 20 characters. An auditor will ask. (12 of 20)</span></label>
  <div class="acts" style="margin-top:26px"><a class="btn" href="delegation.html">Cancel</a><a class="btn pri dis" href="#">Grant</a></div>
</div>{rules}</div>'''
page('delegation-new.html', 'RISE · New delegation', deleg_head + form, 'desk', 'owner')

REVOKE = '''<div class="scrim"></div><section class="dlg" role="dialog" aria-label="Revoke delegation"><p class="lab">Delegation</p><h2 class="t2" style="margin-top:10px">Revoke this delegation?</h2>
  <p class="body" style="margin-top:14px"><b>Ahmed Saleh</b>, with approval and without document management, 06 Oct to 20 Oct 2026 <span class="code">(DEL-MG2K1Q-4XH7A)</span>.</p>
  <p class="body" style="margin-top:10px">It stops working at once, in every open tab. It is not deleted: it stays in this list as a record of what was granted, and who revoked it and when.</p>
  <div class="acts"><a class="btn pri" href="delegation.html">Keep it</a><a class="btn danger" href="delegation.html">Revoke</a></div></section>'''
page('delegation-revoke.html', 'RISE · Revoke delegation', deleg_head + f'<div class="g84"><div>{sech("Grants", len(GRANTS))}{glist}</div>{rules}</div>', 'desk', 'owner', overlays=REVOKE)

# broken grant: acting banner with no powers
broken = {'for': 'CT Director', 'perm': 'Revoked or ended', 'until': '—', 'me': 'Ahmed Saleh', 'stop': 'home.html'}
bbody = f'''<div class="refuse"><p class="lab">Delegation</p><h1 class="t0" style="margin-top:20px">Nothing can be done<br><span class="m">under this delegation.</span></h1>
  <p class="body" style="margin-top:18px">The delegation you were acting under has been <b>revoked or has ended</b>. Until you stop acting under it you hold no powers at all, not even your own. Stop acting to return to your own role.</p>
  <div class="acts" style="margin-top:24px"><a class="btn pri" href="home.html">Stop acting</a></div></div>'''
page('acting-broken.html', 'RISE · Delegation ended', bbody, 'desk', 'delegate', acting=broken)

# ═════ Manage published documents (documents.html) + withdraw ═════
ct = [r for r in INF if r['segment'] == 'coiled-tubing' and not r.get('translationOf') and r['docType'] != 'alert']
ct = sorted(ct, key=lambda r: (r['docType'], r['docNumber']))[:12]
mrows = ''.join(f'<a href="#" style="--cols:170px minmax(0,1fr) 62px 118px 96px"><span class="c">{r["docNumber"]}</span><span class="t"><span class="one">{r["title"]}{LOCK if locked(r) else ""}</span></span><span class="r">Rev {r["revision"]}</span>{st(status_of(r))}<span class="x"><span class="btn sm danger">Withdraw…</span></span></a>' for r in ct)
mhead = f'''<header class="phead"><div class="meta"><span class="crumb">{crumbs(("Coiled Tubing", "area.html"), ("Desk", "desk.html"), ("Manage", None))}</span><span class="lab">Segment Director · Coiled Tubing</span></div>
  <h1 class="t1">Operations documents <span class="m">you manage.</span></h1><p class="sub">Coiled Tubing documents in force. Withdrawing one marks it obsolete for every reader, with your reason; its approval history is kept. Superseding happens on its own when a new revision is released.</p></header>'''
manage = mhead + f'''<nav class="fbar" style="margin-bottom:16px"><span>Show</span><a class="on" href="#">Operations <b>{len(ct)}</b></a><a href="#">Search within</a></nav><div class="reg">{mrows}</div>
  <p class="small" style="margin-top:14px">Maintenance department documents are managed by the Maintenance Manager, Coiled Tubing.</p>'''
page('manage.html', 'RISE · Manage documents', manage, 'manage', 'owner')
WD = '''<div class="scrim"></div><section class="dlg" role="dialog" aria-label="Withdraw"><p class="lab">Withdraw</p><h2 class="t2" style="margin-top:10px">Withdraw TQ-TWS-CTSS-SOP-008 Rev 4.0?</h2>
  <p style="margin-top:6px;font:500 16px/1.4 var(--ui)">Milling Operations SOP</p>
  <p class="body" style="margin-top:12px">It will be marked obsolete and every reader will see <b>“Withdrawn, do not use.”</b> It stays in the register with your reason, and its approval history is kept.</p>
  <label class="f"><span class="lab">Reason for withdrawal</span><span class="in ta focus">Replaced by the milling section of the Well Intervention CoE procedure; no longer used in Coiled Tubing.</span><span class="hint">104 / 500 · at least 20 characters</span></label>
  <div class="acts"><a class="btn" href="manage.html">Cancel</a><a class="btn danger" href="manage.html">Withdraw</a></div></section>'''
page('manage-withdraw.html', 'RISE · Withdraw', manage, 'manage', 'owner', overlays=WD)

# ═════ Master List (QMS) ═════
ALL = [r for r in REG if r['status'] != 'asset']
overdue = sum(1 for r in INF if r.get('reviewOverdue'))
prov = sum(1 for r in REG if r.get('numberStatus') == 'provisional')
ar = sum(1 for r in REG if r.get('translationOf'))
assets = sum(1 for r in REG if r['status'] == 'asset')
drafts = [r for r in REG if r['status'] == 'draft']
MLW = {'current': 'Current', 'under-review': 'Review due', 'draft': 'Draft', 'superseded': 'Superseded', 'obsolete': 'Withdrawn'}
MLK = {'current': 'cur', 'under-review': 'due', 'draft': 'draft', 'superseded': 'sup', 'obsolete': 'wd'}
def due(r):
    if r['status'] == 'obsolete': return 'Withdrawn'
    if r.get('reviewOverdue'): return f'<span style="color:var(--due)">{d(r["nextReviewDate"])}</span>'
    return d(r['nextReviewDate']) if r.get('nextReviewDate') else 'Not set'
def mrow(r, sel=False, ck=True):
    ttl = r['title'] + (' <span class="type">AR</span>' if r.get('translationOf') else '')
    return (f'<tr{" class=sel" if sel else ""}>' + (f'<td><span class="ckb" style="display:inline-block{";background:var(--ink);border-color:var(--ink)" if sel else ""}"></span></td>' if ck else '') +
            f'<td style="grid-area:c"><span class="code full">{r["docNumber"]}</span></td><td class="t" style="grid-area:t">{ttl}<br><span class="small">{segname(r["segment"])} · {TYPE.get(r["docType"], r["docType"])}</span></td>'
            f'<td class="d hide-ph">Rev {r["revision"]}</td><td class="d hide-ph">{d(r["issueDate"]) if r.get("issueDate") and r["status"] != "draft" else "Not issued yet"}</td><td class="d hide-ph">{due(r)}</td>'
            f'<td style="grid-area:s">{st(MLK[r["status"]], MLW[r["status"]])}</td><td class="hide-ph">{r["classification"].capitalize()}</td></tr>')
sample = [BYNUM[n] for n in ['TQ-TWS-CTSS-S005', 'TQ-TWS-CTSS-WI-003', 'TQ-TWS-CTSS-ALT-002', 'TQ-TWS-CTSS-SOP-004', 'TQ-TWS-CTSS-SOP-003', 'TQ-TWS-CTSS-SOP-012', 'TQ-TWS-CTSS-SOP-005',
                                 'TQ-TWS-CTSS-SOP-005-AR', 'TQ-TWS-CTSS-WI-009', 'TQ-TWS-CTSS-SOP-010', 'TQ-TWS-CTSS-LL-002', 'TQ-TWS-CTSS-F001']]
def mtable(rows, ck=True):
    th = ('<th></th>' if ck else '') + '<th>Number</th><th>Title · area · type</th><th>Rev</th><th>Issued</th><th class="sort">Review due</th><th>Status</th><th>Class</th>'
    return f'<table class="tbl"><thead><tr>{th}</tr></thead><tbody>{rows}</tbody></table>'
qv = lambda on: ''.join(f'<a href="{h}"{" class=on" if k == on else ""}>{t}<span>{n}</span></a>' for k, t, n, h in [
    ('all', 'All controlled', len(ALL), 'master.html'), ('qms', 'Waiting on QMS', len(drafts), 'workbench.html'), ('over', 'Review overdue', overdue, '#'),
    ('prov', 'Provisional number', prov, '#'), ('ar', 'Arabic', ar, '#'), ('sw', 'Software assets', assets, '#')])
mfil = '<nav class="fbar"><span>Filter</span><a class="car" href="#">Search number or title</a><a class="on car" href="#">Area <b>Coiled Tubing</b></a><a class="car" href="#">Type <b>Any</b></a><a class="car" href="#">Status <b>Any</b></a><a class="car" href="#">Class <b>Any</b></a><a class="car" href="#">Language <b>Both</b></a><a class="clear" href="#">Clear</a></nav>'
def master(role, name, sel_rows=0, overlay=''):
    ck = role == 'qms'
    rows = ''.join(mrow(r, i < sel_rows, ck) for i, r in enumerate(sample))
    exp = '<a class="btn" href="#">Export F086 (CSV)</a>'
    body = f'''<header class="phead"><div class="meta"><span class="lab">Document control · TQ-QHSE-S001</span><span class="lab"><b>{len(INF)}</b> in force · <b>{len(ALL)}</b> in the register · 25 areas</span></div>
  <h1 class="t1">Master Document List <span class="m phx">every controlled document, one list.</span></h1>
  <p class="sub">Number, revision, owner, issue date and review date on every record, so the current revision can be confirmed before a job starts.{" You read everything and change nothing." if role == "auditor" else ""}</p>
  <div class="stats"><div><b class="sp">{overdue}</b><span>Reviews overdue</span></div><div><b>{prov}</b><span>Waiting on a short form</span></div><div><b>{len(drafts)}</b><span>In draft</span></div><div><b>{ar}</b><span>Arabic versions</span></div></div></header>
<div style="display:grid;grid-template-columns:220px minmax(0,1fr);column-gap:40px" class="ml">
  <aside class="dk-only"><p class="lab" style="margin-bottom:10px">Views</p><div class="qv">{qv("all")}</div></aside>
  <div>{mfil}<div class="mlbar" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:16px 0 4px"><span class="lab"><b>{len(sample)}</b> of 42 in Coiled Tubing · sorted by review due</span><span class="acts">{exp}</span></div>
  {mtable(rows, ck)}
  {"<div class=bulk><span>2 documents selected</span><span class=sp></span><a class=btn href=#>Clear</a><a class=btn href=#>Withdraw selected…</a><a class='btn pri' href=master-bulk.html>Confirm selected (QMS check)…</a></div>" if sel_rows else ""}
  <p class="small" style="margin-top:14px">Every number here follows TQ-QHSE-S001 5.3. Retention runs to 10 years under API Q2 3rd Edition 4.5.</p></div></div>'''
    return page(name, 'RISE · Master List', body, 'master', role, overlays=overlay)
master('qms', 'master.html')
BULK = f'''<div class="scrim"></div><section class="dlg" style="width:640px" role="dialog" aria-label="Bulk confirm"><p class="lab">QMS check · bulk</p><h2 class="t2" style="margin-top:10px">Confirm 1 document as checked by QMS</h2>
  <p class="body" style="margin-top:12px">Each document is confirmed on its own and sent to its next approver. None of them is in force until that approver approves. Rejecting is not done here: return a document from its own record, with a reason.</p>
  <p class="grph"><b>Will be confirmed</b><span>1</span></p><div class="reg">{row("TQ-TWS-CTSS-S005", "CT Asset Management Standard", "", "", '<span class="small">Now: QMS check → next: Segment Director, Coiled Tubing</span>', None, "#", "", "", False, "150px 1fr 0 0 auto")}</div>
  <p class="grph"><b>Left out</b><span>1</span></p><div class="reg">{row("TQ-TWS-CTSS-WI-003", "Injector Head Operations Manual", "", "", '<span class="small">Already in force (Current), so there is no QMS check to do.</span>', None, "#", "", "", False, "150px 1fr 0 0 auto")}</div>
  <div class="acts"><a class="btn" href="master.html">Cancel</a><a class="btn pri" href="master.html">Confirm 1 document</a></div></section>'''
master('qms', 'master-bulk.html', 2, BULK)
master('auditor', 'master-auditor.html')

# record drawer (read-only record) on the Master List
def drawer_record(r):
    return f'''<div class="drawer"><div class="hd"><span class="code full">{r["docNumber"]}</span><span class="lab">Rev {r["revision"]}</span></div>
  <h3>{r["title"]}</h3>
  <div class="bnr sup" style="margin-top:14px"><span class="ic"></span><div><b>Superseded by Rev 4.0.</b> Use the current revision from SCORE.</div><span></span></div>
  <div class="sect"><span class="lab">Identification</span>{kv([("Type", TYPE[r["docType"]]), ("Area", segname(r["segment"])), ("Language", "English"), ("Translation of", "—")])}</div>
  <div class="sect"><span class="lab">Revision and approval · API Q2 4.4.3 d</span>{kv([("Revision", r["revision"]), ("Issued", d(r["issueDate"])), ("Approved", d(r["approvedDate"])), ("Superseded by", "Rev 4.0")])}</div>
  <div class="sect"><span class="lab">Authority</span>{kv([("Owner", "Coiled Tubing segment"), ("Approval authority", "Relevant Operation Director", "", "Register text; the receiving desk is the Segment Director")])}</div>
  <div class="sect"><span class="lab">Review, protection, retention</span>{kv([("Review cycle", "24 months"), ("Classification", "Internal"), ("Retention", "10 years"), ("Status", "Superseded")])}</div>
  <div class="acts"><a class="btn" href="#">Open document</a><a class="btn" href="#">Master in SCORE</a><a class="btn ghost" href="master.html">Close</a></div></div>'''
page('master-record.html', 'RISE · Master List · record', f'''<header class="phead"><div class="meta"><span class="crumb">{crumbs(("Master List", "master.html"), ("TQ-TWS-CTSS-SOP-003", None))}</span><span class="lab">Read-only record</span></div></header>
  <div class="g75"><div>{mtable("".join(mrow(r, r["docNumber"] == "TQ-TWS-CTSS-SOP-003") for r in sample[:8]))}</div><div>{drawer_record(BYNUM["TQ-TWS-CTSS-SOP-003"])}</div></div>''', 'master', 'qms')

# ═════ QMS check (Workbench) ═════
qrows = ''.join(f'<a href="#" class="{"sel" if r["docNumber"] == "TQ-TWS-CTSS-S005" else ""}{" hot" if r["classification"] == "restricted" else ""}" style="--cols:minmax(0,1fr) 92px"><span class="t"><span class="one">{r["title"]}{LOCK if locked(r) else ""}</span><small><span class="code">{r["docNumber"]}</span> · {segname(r["segment"])} · Rev {r["revision"]}</small></span>{st("pend", "QMS check")}</a>' for r in drafts)
def wb(name, drawer_inner, title='QMS check'):
    body = f'''<header class="phead"><div class="meta"><span class="crumb">{crumbs(("Master List", "master.html"), ("Waiting on QMS", None))}</span><span class="lab"><b>{len(drafts)}</b> waiting · every area</span></div>
  <h1 class="t1">{title} <span class="m">before final approval.</span></h1>
  <p class="sub">Check the number against TQ-QHSE-S001 5.3, the revision and the dates. Confirming sends a document to its Segment Director or Maintenance Manager. QMS never gives final approval.</p></header>
<div class="g66" style="grid-template-columns:minmax(0,5fr) minmax(0,7fr)"><div><div class="reg">{qrows}</div></div><div class="sticky">{drawer_inner}</div></div>'''
    return page(name, 'RISE · QMS check', body, 'wb', 'qms')
WHAT = kv([("Number", "TQ-TWS-CTSS-S005", "", "Standard · Coiled Tubing"), ("Revision", "Rev 1.0", "", "First issue"), ("File", "TQ-TWS-CTSS-S005.pdf", "", "1.2 MB · fingerprint unique"),
           ("Submitted by", "Khalid Al-Otaibi", "", "06 Oct 2026, 09:14"), ("Classification", "Internal"), ("Next approver", "Segment Director, Coiled Tubing", "", "The register names: Relevant Operation Director")])
wdrawer = lambda tail: f'''<div class="drawer"><div class="hd"><span class="lab">QMS check · 1 of {len(drafts)} waiting</span><a class="lab" href="#">Next →</a></div>
  <h3>CT Asset Management Standard</h3><p class="rline" style="margin-top:8px"><b>TQ-TWS-CTSS-S005</b><span>Rev 1.0</span>{st("pend", "Waiting on your QMS check")}</p>
  <div class="sect"><span class="lab">What to check</span>{WHAT}</div>
  <div class="sect"><span class="lab">Summary</span><p class="body">How Coiled Tubing registers, tracks and retires its CT units and strings, from commissioning to disposal.</p></div>
  {tail}</div>'''
w_acts = '<div class="acts"><a class="btn pri" href="workbench-done.html">Confirm QMS check</a><a class="btn danger" href="workbench-reject.html">Return…</a><a class="btn ghost" href="document-draft.html">Open the document</a></div><p class="small" style="margin-top:10px">Not in force until the Segment Director approves it.</p>'
wb('workbench.html', wdrawer(w_acts))
w_rej = '''<div class="sect" style="border-top:1px solid var(--rule);padding-top:18px"><label class="f" style="margin-top:0"><span class="lab">Reason for returning it to the author</span><span class="in ta focus">Section 4.2 is incomplete and the scope of application is missing.</span><span class="hint">68 / 500 · at least 20 characters</span></label>
  <div class="acts" style="border:0;padding-top:0;margin-top:16px"><a class="btn" href="workbench.html">Cancel</a><a class="btn danger" href="workbench.html">Return to author</a></div></div>'''
wb('workbench-reject.html', wdrawer(w_rej))
w_done = '''<p class="res ok">Confirmed. Now waiting on the Segment Director’s final approval.</p>
  <div class="bnr"><span class="ic"></span><div><b>Next:</b> Pump Rig-Up Procedure · TQ-TWS-FS-SOP-002 · Fracturing</div><span></span></div>
  <div class="acts"><a class="btn" href="workbench.html">Close</a><a class="btn pri" href="workbench.html">Next document</a></div>'''
wb('workbench-done.html', wdrawer(w_done))
# escalated restricted draft
esc = f'''<div class="drawer"><div class="hd"><span class="lab">Escalated</span><span class="lab">Restricted</span></div>
  <h3>Evacuation &amp; Rescue Manual</h3><p class="rline" style="margin-top:8px"><b>TQ-TWS-WSS-WI-010</b><span>Rev 2.0</span>{st("pend", "Waiting on an authorised approver")}</p>
  <div class="bnr al" style="margin-top:16px"><span class="ic"></span><div><b>No approver for this route may open restricted documents.</b> It waits on an authorised final approver, who must be assigned. It is hidden from the approver’s desk, bell and counts.</div><span></span></div>
  <div class="sect">{kv([("Area", "Safety Services"), ("Classification", "Restricted"), ("Visible to", "QMS, the auditor and its filer"), ("Next approver", "To be assigned")])}</div></div>'''
wb('workbench-escalated.html', esc, 'Escalated')

# ═════ Refusals ═════
def refusal(name, title, why, role='employee', extra=''):
    body = f'''<div class="refuse"><p class="lab">Not part of your role</p><h1 class="t0" style="margin-top:20px">{title}</h1>
  <p class="body" style="margin-top:18px">{why} You are signed in as <b>{ROLES[role]["label"]}</b>.</p>
  <p class="body" style="margin-top:10px">Every document you need is still open to you, and each one tells you whether it is current before you use it.</p>
  <div class="acts" style="margin-top:26px"><a class="btn pri" href="search.html">Search the documents</a><a class="btn" href="home.html">Home</a></div>{extra}</div>'''
    page(name, 'RISE · ' + title.replace('<br>', ' '), body, 'home', role)
refusal('refuse-master.html', 'The Master List is<br><span class="m">the document controller’s view.</span>', 'It carries the register export, the overdue queue and every revision including withdrawn ones. QMS and an external auditor work from it.')
refusal('refuse-upload.html', 'Filing documents is<br><span class="m">not part of this role.</span>', 'An auditor reviews the register and changes nothing in it, and that includes adding drafts to it.', 'auditor')
refusal('refuse-desk.html', 'Managing an area is<br><span class="m">its director’s desk.</span>', 'The desk approves, delegates and manages documents for one area. It is open to the holder of that area and to QMS.')
print('control ok')
