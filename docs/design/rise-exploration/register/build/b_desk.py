"""Approval desks (dashboard.html on main): Segment Director, Maintenance Manager, a delegate acting under a grant;
approve (with effective date) and return (with reason) decisions; separation of duties."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from reg import *

def route(steps):
    cells = ''.join(f'<div class="{c}"><span>{k}</span><b>{v}</b>{f"<small>{s}</small>" if s else ""}</div>' for k, v, s, c in steps)
    return f'<div class="route" style="--n:{len(steps)}">{cells}</div>'

def qitem(typ, num, rev, title, state, meta, steps, banners='', acts=True, approve='Approve', cls=''):
    a = (f'<div class="acts"><a class="btn pri" href="{approve}">Approve…</a><a class="btn" href="desk-reject.html">Return…</a><a class="btn ghost" href="document-draft.html">Open the document</a></div>' if acts else '')
    return f'''<article class="qi {cls}"><div class="top"><p class="rline"><b>{num}</b><span>Rev {rev}</span><span class="type">{typ}</span></p>{st("pend", state)}</div>
  <h3>{title}</h3><p class="meta">{meta}</p>{route(steps)}{banners}{a}</article>'''

DIR_ITEM = qitem('Standard', 'TQ-TWS-CTSS-S005', '1.0', 'CT Asset Management Standard', 'Checked by QMS · waiting for your final approval',
  'Submitted by <b>Khalid Al-Otaibi</b>, CT Engineer · 06 Oct 2026, 09:14 · TQ-TWS-CTSS-S005.pdf · 1.2 MB',
  [('Filed', 'Khalid Al-Otaibi', '06 Oct 2026', 'done'), ('QMS check', 'QMS / Document Controller', 'Confirmed 06 Oct 2026', 'done'),
   ('Final approval', 'You · Segment Director', 'Your approval publishes it', 'now'), ('Published', 'Coiled Tubing library', 'Everyone in the area', '')],
  note('', '<b>New.</b> First issue of TQ-TWS-CTSS-S005: no revision is replaced.'), approve='desk-approve.html')
WAIT = f'''<article class="qi wait"><div class="top"><p class="rline"><b>TQ-TWS-CTSS-SOP · new</b><span>Rev 1.0</span><span class="type">Procedure · Maintenance</span></p>{st("pend", "Waiting on the Maintenance Manager")}</div>
  <h3>Injector Head Overhaul</h3><p class="meta">Filed as a maintenance department document, so the <b>Maintenance Manager, Coiled Tubing</b> gives final approval, not the Segment Director.</p></article>'''

def desk(role, title, sub, items, extra_aside='', acting=None, name='desk.html', overlay='', active='desk'):
    R = ROLES[role]
    body = f'''<header class="phead"><div class="meta"><span class="crumb">{crumbs(("Areas", "areas.html"), ("Coiled Tubing", "area.html"), ("Desk", None))}</span><span class="lab">{R["label"]}</span></div>
  <h1 class="t1">{title}</h1><p class="sub">{sub}</p>
  <div class="stats"><div><b class="sp">{items[0]}</b><span>Waiting for you</span></div><div><b>36</b><span>Published here</span></div><div><b>0</b><span>Returned this month</span></div></div></header>
<div class="g84"><div>
  {sech("Awaiting your approval", items[0], "Everything in this area", "#")}
  {items[1]}
  {sech("Waiting on someone else", 1)}
  {items[2]}
  <p class="small" style="margin-top:18px">Submitter, QMS checker and final approver are three different people. The document records who actually signed.</p>
</div><aside class="aside">
  {extra_aside}
  {sech("Published documents", 36, "View &amp; manage", "manage.html")}
  <p class="small" style="margin-top:12px">Operations documents in force that you manage: withdraw one with a recorded reason.</p>
  {sech("Recent activity")}
  <ol class="hist"><li class="now"><span class="d">Today</span><i></i><span><b>Awaiting QMS check</b><small class="code">TQ-TWS-CTSS-S005</small></span></li>
  <li><span class="d">3 days ago</span><i></i><span><b>Review overdue</b><small class="code">TQ-TWS-CTSS-SOP-004</small></span></li>
  <li class="cur"><span class="d">4 months</span><i></i><span><b>Issued revision 2.0</b><small class="code">TQ-TWS-CTSS-SOP-011</small></span></li></ol>
</aside></div>'''
    return page(name, f'RISE · {title}', body, active, role, acting=acting, overlays=overlay)

DELEG = f'''{sech("Delegation", None, "Manage", "delegation.html")}
  <div class="grant" style="border-top:0"><h4>Ahmed Saleh <span class="gst active">Active</span></h4><p class="m">Approval, no document management · 06 Oct to 20 Oct 2026</p></div>
  <div class="grant"><h4>Deputy Director <span class="gst sched">Scheduled</span></h4><p class="m">Approval · 22 Oct to 31 Oct 2026</p></div>
  <div class="sp24"></div>'''

dir_items = (1, DIR_ITEM, WAIT)
desk('owner', 'Coiled Tubing <span class="m">desk</span>', 'You give final approval to Coiled Tubing’s Operations documents after QMS has checked them. Your approval is what publishes them.', dir_items, DELEG)

# approve dialog
APPROVE = '''<div class="scrim"></div><section class="dlg" role="dialog" aria-label="Approve and publish">
  <p class="lab">Final approval</p><h2 class="t2" style="margin-top:10px">Approve and publish?</h2>
  <p class="rline" style="margin-top:16px"><b>TQ-TWS-CTSS-S005</b><span>Rev 1.0</span></p><p style="margin-top:6px;font:500 16px/1.4 var(--ui)">CT Asset Management Standard</p><p class="small">First issue: no revision is replaced.</p>
  <label class="f"><span class="lab">Effective from</span><span class="in focus">06 Oct 2026<span class="car">▾</span></span><span class="hint">In force as soon as you approve it. Choose a later date to approve today and release it then.</span></label>
  <p class="body" style="margin-top:18px">Your approval releases this exact revision into the register for everyone in the area. It is signed <b>CT Director, Segment Director</b>.</p>
  <div class="acts"><a class="btn" href="desk.html">Cancel</a><a class="btn pri" href="desk-approved.html">Approve Rev 1.0 and publish</a></div></section>'''
desk('owner', 'Coiled Tubing <span class="m">desk</span>', 'You give final approval to Coiled Tubing’s Operations documents after QMS has checked them.', dir_items, DELEG, name='desk-approve.html', overlay=APPROVE)

# return dialog with validation
RETURN = '''<div class="scrim"></div><section class="dlg" role="dialog" aria-label="Return document">
  <p class="lab">Return to its author</p><h2 class="t2" style="margin-top:10px">Return it with a reason</h2>
  <p class="rline" style="margin-top:16px"><b>TQ-TWS-CTSS-S005</b><span>Rev 1.0</span><span class="type">CT Asset Management Standard</span></p>
  <label class="f"><span class="lab">What must be fixed</span><span class="in ta bad">Scope missing</span>
  <span class="err">13 of at least 20 characters. Say exactly what to fix so the author can file it again.</span></label>
  <p class="small" style="margin-top:14px">The author is told in RISE. The returned attempt stays in the register as history; a corrected filing comes back as its next attempt.</p>
  <div class="acts"><a class="btn" href="desk.html">Cancel</a><a class="btn danger dis" href="#">Return and notify</a></div></section>'''
desk('owner', 'Coiled Tubing <span class="m">desk</span>', 'You give final approval to Coiled Tubing’s Operations documents after QMS has checked them.', dir_items, DELEG, name='desk-reject.html', overlay=RETURN)

# approved result
DONE = f'''<article class="qi"><div class="top"><p class="rline"><b>TQ-TWS-CTSS-S005</b><span>Rev 1.0</span><span class="type">Standard</span></p>{st("cur", "Current")}</div>
  <h3>CT Asset Management Standard</h3><p class="res ok">Approved and published to Coiled Tubing. In force from today; everyone in the area can open it.</p>
  <p class="meta">Signed <b>CT Director, Segment Director</b> · 06 Oct 2026, 10:42 · checked by QMS / Document Controller</p></article>'''
EMPTY = '<div class="empty" style="padding:30px 0"><h2 class="t2">All caught up.<span class="m"> Nothing is waiting on your final approval.</span></h2></div>'
desk('owner', 'Coiled Tubing <span class="m">desk</span>', 'You give final approval to Coiled Tubing’s Operations documents after QMS has checked them.', (0, DONE + EMPTY, WAIT), DELEG, name='desk-approved.html')

# maintenance manager desk
M1 = qitem('Procedure · Maintenance', 'TQ-TWS-CTSS-SOP · new', '1.0', 'Injector Head Overhaul', 'Checked by QMS · waiting for your final approval',
  'Submitted by <b>Khalid Al-Otaibi</b> · Maintenance department document',
  [('Filed', 'Khalid Al-Otaibi', '', 'done'), ('QMS check', 'QMS / Document Controller', 'Confirmed', 'done'), ('Final approval', 'You · Maintenance Manager', 'Maintenance documents only', 'now'), ('Published', 'Maintenance tab', '', '')])
M2 = qitem('Maintenance bulletin', 'TQ-TWS-CTSS-MB-001', '1.0', 'Injector Chain Wear Bulletin', 'Checked by QMS · waiting for your final approval',
  'A Maintenance Bulletin is always a maintenance document, whatever the department field says.',
  [('Filed', 'Khalid Al-Otaibi', '', 'done'), ('QMS check', 'QMS / Document Controller', 'Confirmed', 'done'), ('Final approval', 'You · Maintenance Manager', '', 'now'), ('Published', 'Maintenance tab', '', '')],
  note('', '<b>Provisional number.</b> TQ-QHSE-S001 has no code for Maintenance Bulletins yet, so they use MB until QHSE assigns one. The number may change then.'))
MW = f'''<article class="qi wait"><div class="top"><p class="rline"><b>TQ-TWS-CTSS-S005</b><span>Rev 1.0</span><span class="type">Standard · Operations</span></p>{st("pend", "Waiting on the Segment Director")}</div>
  <h3>CT Asset Management Standard</h3><p class="meta">An Operations document: the <b>Segment Director, Coiled Tubing</b> approves it. You approve maintenance documents only.</p></article>'''
desk('maintenance', 'Coiled Tubing <span class="m">maintenance desk</span>', 'You approve the maintenance department’s documents for Coiled Tubing, and only those. QMS checks every one first.', (2, M1 + M2, MW), DELEG.replace('Ahmed Saleh', 'Maint Deputy'), name='desk-maint.html')

# delegate acting
DI = DIR_ITEM.replace('You · Segment Director', 'You · delegate for CT Director').replace('Your approval publishes it', 'Signed as Ahmed Saleh (delegate for CT Director)')
desk('delegate', 'Coiled Tubing <span class="m">desk</span>', 'You are acting for CT Director under a delegation: approval only, until 20 Oct 2026. Filing and export are not part of a delegation.',
     (1, DI, WAIT), '', acting=ACT, name='desk-delegate.html')
print('desk ok')
