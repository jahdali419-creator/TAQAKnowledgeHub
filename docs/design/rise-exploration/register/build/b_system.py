"""States catalogue and the lightweight Register design system: only the parts the screens use."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from reg import *
from b_doc import answer  # noqa: builds doc pages too (idempotent)

def R(n): return BYNUM[n]
STATES = [
 ('Current', st('cur'), 'TQ-TWS-CTSS-WI-003', 'Injector Head Operations Manual', '', answer('cur', rev='4.0'), 'Everyone it is classified for. In force; OK to use.'),
 ('Draft · pending QMS check', st('pend', 'Waiting on QMS check'), 'TQ-TWS-CTSS-SOP-009', 'Acid Stimulation SOP · Rev 4.0', note('lock', '<b>Submitted for approval, not in force yet.</b> Waiting on the QMS conformance check.'), answer('draft', prev='3.0'),
  'Its filer, QMS and the auditor. There is no “Pending QMS” status in the register: it is draft + stage.'),
 ('Draft · pending final approval', st('pend', 'Waiting on the Segment Director'), 'TQ-TWS-CTSS-S005', 'CT Asset Management Standard', note('lock', '<b>Checked by QMS.</b> Waiting for final approval by the Segment Director, Coiled Tubing.'), '',
  'Filer, QMS, auditor and the approver of that route. Maintenance documents wait on the Maintenance Manager instead.'),
 ('Returned', st('ret'), 'TQ-TWS-CTSS-SOP-009', 'Acid Stimulation SOP · Rev 4.0', note('al', '<b>Returned, not in force.</b> Returned by QMS / Document Controller with a reason of at least 20 characters.'), answer('ret', prev='3.0'),
  'Its filer, QMS, auditor. It stays as history; the filer files it again as the next attempt.'),
 ('Approved, not yet effective', st('pend', 'Effective 20 Oct 2026'), 'TQ-TWS-CTSS-S005', 'CT Asset Management Standard', note('due', '<b>Approved, not yet effective.</b> It takes effect on 20 Oct 2026; until then the revision in force stays current.'), answer('nye', eff='20 Oct 2026'),
  'Download, print and pin stay disabled until the date.'),
 ('Superseded', st('sup'), 'TQ-TWS-CTSS-SOP-003', 'Well Entry Protocol · Rev 3.0', note('sup', '<b>Superseded. A newer revision exists.</b> Use the current revision from SCORE.'), answer('sup', rev='3.0', by='Rev 4.0'),
  'Never listed or searched. Reached by link, QR or an exact-number search (red card).'),
 ('Withdrawn', st('wd'), 'TQ-TWS-CTSS-SOP-012', 'Post-Job Reporting SOP', note('al', '<b>Obsolete. Do not use.</b> Destroy or mark any printed copy.'), answer('wd'),
  'Never listed. Reached by link or QR. The register word is “Obsolete”; screens say “Withdrawn”: an open decision.'),
 ('Review due', st('due', 'Review overdue'), 'TQ-TWS-CTSS-SOP-004', 'Emergency Disconnect Procedure', note('due', '<b>Periodic review overdue.</b> The content stays in force (API Q2 4.4.3 c).'), '',
  'Director, QMS and auditor only. An Employee sees “Current, OK to use”.'),
 ('Restricted / confidential', '<span class="st lockd">' + LOCK + ' Access restricted</span>', '—', 'No title shown', note('lock', '<b>Not in the Master Document List available to your role.</b>'), '',
  'Invisible to a role that may not open it: no row, no count, no hint. A link reads like a missing number.'),
 ('Technical alert', st('alt', 'Active alert'), 'TQ-TWS-CTSS-ALT-003', 'Chemical compatibility update for H2S environments', '', '',
  'The only place crimson appears besides withdrawn and error states. Rows carry a crimson edge; tabs a dot.'),
 ('Maintenance Bulletin', '<span><span class="st cur">Current</span><span class="bdg rev">MB · provisional</span></span>', 'TQ-TWS-CTSS-MB-001', 'Injector Chain Wear Bulletin',
  note('', '<b>Provisional number.</b> TQ-QHSE-S001 has no code for Maintenance Bulletins yet, so they use MB.'), '',
  'Always a maintenance document; listed on the Maintenance side; approved by the Maintenance Manager. None exists in the register yet.'),
]
rows = ''
for name, s, num, title, ban, ans, who in STATES:
    rows += f'''<section class="stx"><div class="stl"><p class="lab">{name}</p><p class="small" style="margin-top:8px">{who}</p></div>
  <div class="stc"><div class="reg"><div class="row" style="--cols:200px minmax(0,1fr) 210px"><span class="c">{num}</span><span class="t"><span class="one">{title}</span></span>{s}</div></div>
  {ban}{ans}</div></section>'''
body = f'''<header class="phead"><div class="meta"><span class="lab">Register · states</span><span class="lab">Shape + word, never colour alone</span></div>
  <h1 class="t0">Every state <span class="m">reads the same everywhere.</span></h1>
  <p class="sub">One row form, one banner, one answer per state, used by Home, Search, Areas, the record, desks and the Master List. Red stays for safety: technical alerts, withdrawn, errors.</p></header>
<div class="legend-row">{st("cur")}{st("pend", "Pending")}{st("draft")}{st("ret")}{st("due")}{st("sup")}{st("wd")}{st("alt")}</div>
{rows}'''
page('states.html', 'RISE · Register states', body, 'home', dock_active='more')

# ── design system ─────────────────────────────────────────────────────────
sw = lambda n, v, t='': f'<div class="sw2"><i style="background:{v}"></i><b>{n}</b><span class="code">{v}</span><small>{t}</small></div>'
fr = [r for r in inforce() if r['segment'] == 'fracturing' and r['issueDate'] >= '2026-06-08' and not r.get('translationOf')][:3]
from b_browse import arow  # noqa
ds = f'''<header class="phead"><div class="meta"><span class="lab">Register · design system</span><span class="lab">Only what the screens use</span></div>
  <h1 class="t0">Register <span class="m">design system.</span></h1><p class="sub">Warm paper, one register line, strong type, a mono voice for numbers, one orange spark, crimson for safety. Desktop 1440, phone 390.</p></header>
{sech('Colour', 10)}
<div class="sws">{sw('Paper', '#F3F1EC', 'Page')}{sw('Sheet', '#FFFEFB', 'Records, dialogs')}{sw('Tint', '#ECE9E2', 'Read-only, superseded')}{sw('Ink', '#11201F', 'Text, primary button')}{sw('Ink 2', '#4A5553', 'Body')}{sw('Ink 3', '#878D89', 'Labels')}
{sw('Rule', '#DFDBD3', 'Lines')}{sw('Spark', '#FD5805', 'Active, caret, your area · ≤5%')}{sw('Crimson', '#C8102E', 'Alerts, withdrawn, errors only')}{sw('OK', '#1D7A5E', 'Current')}{sw('Due', '#9A6200', 'Review due, provisional')}{sw('Superseded', '#8F948F', 'Not in force')}</div>
{sech('Type')}
<div class="tys"><div><span class="lab">Display · BwGradual 700</span><p class="t0">Search</p></div><div><span class="lab">Title · 46 / phone 34</span><p class="t1">Coiled Tubing</p></div><div><span class="lab">Section · BwGradual 500 19</span><p class="t3">Recently changed</p></div>
<div><span class="lab">Body · Inter 15.5</span><p class="body">Rev 4.0 is the approved revision in force.</p></div><div><span class="lab">Register voice · IBM Plex Mono</span><p class="rline"><b>TQ-TWS-CTSS-WI-003</b><span>Rev 4.0</span><span>Internal</span></p></div></div>
{sech('Search line')}<div class="q md" style="margin-top:18px"><span class="w">Search</span><span class="caret"></span><span class="ph">by number or title</span></div>
{sech('Register rows')}<div class="reg sr" style="margin-top:14px">{row("TQ-TWS-CTSS-WI-003", "Injector Head Operations Manual", "Coiled Tubing", "Rev 4.0", st("cur"), None, "#", " mine", "Work instruction · issued 30 Aug 2025")}{row("TQ-TWS-CTSS-ALT-003", "Chemical compatibility update for H2S environments", "Coiled Tubing", "Rev 2.0", st("alt", "Active alert"), None, "#", " hot", "")}</div>
<p class="small" style="margin-top:10px">Spark edge = your area · crimson edge = technical alert · ink edge = selected.</p>
<div class="reg" style="margin-top:14px">{"".join(arow(r) for r in fr)}</div>
<p class="small" style="margin-top:10px">New = issued in the last 120 days at Rev 1.0 · Revised = issued in the last 120 days at a later revision (Fracturing, live data).</p>
{sech('Answer, banners')}<div style="margin-top:14px">{answer('cur', rev='4.0')}</div>
<div class="g66" style="margin-top:18px;row-gap:12px">{note('al', '<b>Technical alert or withdrawn.</b> Crimson.')}{note('due', '<b>Review due, provisional, sample.</b> Amber.')}{note('sup', '<b>Superseded.</b> Grey line.')}{note('spark', '<b>Your desk, local number.</b> Spark.')}</div>
{sech('Controls')}<div class="acts" style="margin-top:16px"><a class="btn pri" href="#">Download PDF</a><a class="btn" href="#">Bookmark</a><a class="btn danger" href="#">Withdraw…</a><a class="btn ghost" href="#">Cancel</a><a class="btn dis" href="#">Disabled</a><a class="btn sm" href="#">Small</a></div>
<div class="g66" style="margin-top:8px"><label class="f"><span class="lab">Field *</span><span class="in focus">Acid Stimulation SOP</span><span class="hint">Hint text.</span></label><label class="f"><span class="lab">Reason *</span><span class="in bad">Scope missing</span><span class="err">13 of at least 20 characters.</span></label></div>
<div class="g66"><div class="f"><div class="opt on"><span class="rd"></span><span><b>Approval</b><small>Independent permission</small></span></div><div class="opt"><span class="cb"></span><span><b>Manage documents</b><small>Off by default</small></span></div></div>
<div class="f"><div class="seg"><a class="on" href="#">Operations</a><a href="#">Maintenance</a></div><div class="stats" style="margin-top:20px"><div><b>23</b><span>in force</span></div><div><b class="al">1</b><span>active alert</span></div></div></div></div>
{sech('Flow parts')}<div style="margin-top:16px"><nav class="steps"><span class="done">1 · File</span><span class="on">2 · Where it belongs</span><span>3 · What it is</span><span>4 · Check the record</span></nav></div>
<div class="route" style="--n:4;margin-top:22px"><div class="done"><span>Filed</span><b>You</b></div><div class="now"><span>QMS check</span><b>QMS</b></div><div><span>Final approval</span><b>Segment Director</b></div><div><span>Published</span><b>Library</b></div></div>
<div class="g66" style="margin-top:22px">{kv([("Status", "Current, OK to use", "ok"), ("Revision", "Rev 4.0"), ("Issued", "30 Aug 2025"), ("Owner", "Subject Matter Expert")])}<div><div class="grant" style="border-top:1px solid var(--rule)"><h4>Ahmed Saleh <span class="gst active">Active</span></h4><p class="m">Approval · 06 Oct to 20 Oct 2026</p><p class="ev">DEL-… evidence id</p></div>
<p style="margin-top:12px"><span class="gst sched">Scheduled</span> <span class="gst exp">Expired</span> <span class="gst rev">Revoked</span> <span class="prop">proposed</span> <span class="bdg new">New</span> <span class="bdg rev">Revised</span></p></div></div>
{sech('Shell')}<p class="body" style="margin-top:12px">Desktop: one text line of navigation; role links after a divider, counts in spark. Phone: top bar (logo, search, bell, avatar) and a five-item dock: Home, Search, Areas, Saved, More. Role work lives under More. Acting under a delegation adds a dark bar above everything with Stop acting.</p>'''
page('system.html', 'RISE · Register design system', ds, 'home', dock_active='more')
print('system ok')
