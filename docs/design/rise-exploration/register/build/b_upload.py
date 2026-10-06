"""Upload (upload.html on main): four panels — File · Where it belongs · What it is · Check the record — with the live wording,
routing (filer → QMS check → area holder or Maintenance Manager → published), number chip and its checks, revision picker,
filing again, refusals and success. Story: Faisal files Rev 4.0 of TQ-TWS-CTSS-SOP-009 Acid Stimulation SOP."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from reg import *
S9 = BYNUM['TQ-TWS-CTSS-SOP-009']
STEPS = ['File', 'Where it belongs', 'What it is', 'Check the record']

def steps(n):
    return '<nav class="steps" aria-label="Steps">' + ''.join(f'<span class="{"done" if i < n else "on" if i == n else ""}">{i + 1} · {s}</span>' for i, s in enumerate(STEPS)) + '</nav>'

def route(final, sub='', now=-1):
    cells = [('Filed', 'You', ''), ('QMS check', 'QMS / Document Controller', 'Checks the record and the numbering'), ('Final approval', final, sub), ('Published', 'Coiled Tubing library', '')]
    return '<div class="route" style="--n:4">' + ''.join(f'<div class="{"now" if i == now else ""}"><span>{k}</span><b>{v}</b>{f"<small>{s}</small>" if s else ""}</div>' for i, (k, v, s) in enumerate(cells)) + '</div>'

ASIDE = f'''<aside class="aside"><div class="sticky">{sech('Who signs it')}
  <p class="body" style="margin-top:12px">Every document is checked by QMS, then approved by the holder of its area. Maintenance documents and every Maintenance Bulletin go to the segment’s Maintenance Manager instead.</p>
  <p class="small" style="margin-top:12px">Submitter, QMS checker and final approver are three different people.</p>
  {sech('Before you file')}<ul class="tips"><li>Use a clear, descriptive title.</li><li>Make sure the document is final.</li><li>PDF reads best on every device.</li><li>One controlled document per upload.</li></ul></div></aside>'''

def up(name, n, inner, role='employee', aside=ASIDE, acting=None, title=''):
    body = f'''<header class="phead"><div class="meta"><span class="lab">Upload a document</span><span class="lab">All documents go through approval before going live</span></div>
  <h1 class="t1">{title or STEPS[n]}</h1></header>{steps(n)}
<div class="g84" style="margin-top:30px"><div class="upf">{inner}</div>{aside}</div>'''
    page(name, 'RISE · Upload · ' + STEPS[n], body, 'upload', role, acting=acting, dock_active='more')

NAV = lambda back, nxt, dis=False, hint='': f'''<div class="acts navb">{f'<a class="btn" href="{back}">← Back</a>' if back else ''}<span class="sp"></span>{f'<span class="small">{hint}</span>' if hint else ''}<a class="btn pri{" dis" if dis else ""}" href="{nxt}">Continue →</a></div>'''

# 1 · File
drop = '''<div class="drop"><b>Drag &amp; drop your file here</b><p class="small" style="margin-top:8px;max-width:46ch">One controlled document per upload. Max file size: 500 MB.</p>
  <a class="btn" style="margin-top:16px" href="upload-file.html">Browse files</a><p class="code" style="margin-top:14px">.pdf · .docx · .xlsx · .pptx · .zip</p></div>'''
up('upload.html', 0, drop + NAV(None, '#', True, 'Add a file to continue.'))
FILE = '''<div class="file"><span class="ext">PDF</span><span><b style="font:500 15px/1.3 var(--ui)">CTSS-SOP-009_Acid-Stimulation_Rev4.pdf</b><small class="code" style="display:block;margin-top:4px">2.4 MB · fingerprint 9f2c…e81a</small></span><a class="mute" href="upload.html">✕</a></div>
  <p class="res ok" style="font-size:14px">No other record you can open carries this file.</p>'''
up('upload-file.html', 0, FILE + NAV(None, 'upload-where.html'))
ERR = f'''<div class="drop bad"><b>Drag &amp; drop your file here</b><p class="small" style="margin-top:8px">One controlled document per upload. Max file size: 500 MB.</p><a class="btn" style="margin-top:16px" href="#">Browse files</a></div>
  {note('al', '<b>File type not permitted.</b> 1 file was refused. Allowed: pdf, doc, docx, xls, xlsx, ppt, pptx, zip.')}'''
up('upload-file-error.html', 0, ERR + NAV(None, '#', True, 'Add a file to continue.'))

# 2 · Where it belongs (revision of SOP-009)
def where(extra='', typ='Standard Operating Procedure', maint=False, lockm=False, rev=True, number='TQ-TWS-CTSS-SOP-009', numline=None, final='Segment Director, Coiled Tubing', numbad=False):
    numline = numline or f'Revision of {number}: Rev 3.0 → Rev 4.0. A revision keeps its number.'
    m = f'''<div class="opt{" on" if maint else ""}{" dis" if lockm else ""}"><span class="cb"></span><span><b>Maintenance department document</b><small>Filed under this segment’s Maintenance tab. The segment’s Maintenance Manager approves it instead of the Segment Director.{" A Maintenance Bulletin is always a maintenance document." if lockm else ""}</small></span></div>'''
    revs = (f'''<label class="f"><span class="lab">Supersedes · the document being replaced *</span><span class="in">{S9["docNumber"]}  {S9["title"]}, Rev 3.0<span class="car">▾</span></span>
      <span class="hint">The revision keeps the document’s number. When it is approved, Rev 3.0 is marked Superseded and keeps its history; its translation is marked for re-issue.</span></label>''' if rev else '')
    return f'''<p class="small">Two answers decide the rest: which area owns it, and what kind of document it is. The controlled number follows from them.</p>
  <div class="g66" style="column-gap:16px"><label class="f"><span class="lab">Area *</span><span class="in">Coiled Tubing<span class="car">▾</span></span></label><label class="f"><span class="lab">Document type *</span><span class="in">{typ}<span class="car">▾</span></span></label></div>
  <div class="f">{m}</div>
  <div class="f"><span class="lab">Document status *</span><div class="seg"><a{"" if rev else " class=on"} href="#">New document</a><a{" class=on" if rev else ""} href="#">Revision / update</a></div></div>
  {revs}
  <div class="numchip{" bad" if numbad else ""}"><span class="lab">Controlled number</span><b>{number}</b><a class="btn sm ghost" href="#">Edit</a><p>{numline}</p></div>
  {extra}
  <p class="lab" style="margin-top:30px">Route once you file</p>{route(final, 'after the QMS check')}'''
up('upload-where.html', 1, where() + NAV('upload-file.html', 'upload-what.html'))
up('upload-where-error.html', 1, where(rev=False, numbad=True, number='TQ-TWS-CTSS-SOP-009', numline='✕ TQ-TWS-CTSS-SOP-009 is already the number of “Acid Stimulation SOP”. A number names one document and is never reused.')
   + NAV('upload-file.html', '#', True, 'Fix the number, or choose Revision / update.'))
up('upload-maint.html', 1, where(typ='Maintenance Bulletin', maint=True, lockm=True, rev=False, number='TQ-TWS-CTSS-MB-001', final='Maintenance Manager, Coiled Tubing',
   numline='Awaiting QHSE: TQ-QHSE-S001 has no code for Maintenance Bulletins yet, so this uses “MB” until QHSE assigns one. The number may change then.')
   + NAV('upload-file.html', 'upload-what.html'))
pol = f'''<p class="small">Two answers decide the rest: which area owns it, and what kind of document it is.</p>
  <label class="f"><span class="lab">Document type *</span><span class="in">Policy<span class="car">▾</span></span><span class="hint">Only QMS files a policy.</span></label>
  <div class="polbox"><p class="lab">A policy follows different rules</p><ul><li><b>No area owns it.</b> It is filed as Company Wide and binds every segment, function and center.</li><li><b>The CEO approves it</b>, not an Operation Director.</li>
  <li><b>It numbers as TQ-&lt;Function&gt;-PXXX</b>, for example TQ-QHSE-P007 (TQ-QHSE-S001 5.3, row 02).</li><li><b>It is Internal and cannot be restricted.</b> TQ-QHSE-S001 5.5 says policies shall be accessible to all employees.</li><li>Review cycle 24 months.</li></ul></div>
  <div class="g66" style="column-gap:16px"><label class="f"><span class="lab">Issuing function *</span><span class="in">QHSE<span class="car">▾</span></span></label><label class="f"><span class="lab">Approver</span><span class="in ro">Chief Executive Officer</span></label></div>
  {note('due', '<b>Open decision.</b> BD-02 invents no CEO route; who gives a policy final approval needs QMS and business confirmation.')}'''
up('upload-policy.html', 1, pol + NAV('upload-file.html', 'upload-what.html'), role='qms')

# 3 · What it is
what = f'''<p class="small">This is what a person sees in the library before they open the file, so it is worth getting right.</p>
  <label class="f"><span class="lab">Document title *</span><span class="in focus">Acid Stimulation SOP</span>
  <span class="hint dup">Possibly related: TQ-TWS-CTSS-SOP-009-AR “Acid Stimulation SOP (النسخة العربية)” (Same title in this area). Check before you file; it does not stop the filing.</span></label>
  <label class="f"><span class="lab">What does this document cover? *</span><span class="in ta ph">One or two sentences people read before they open it</span><span class="hint">0 / 500 characters</span><span class="err">A summary is needed, it is what people read first.</span></label>
  <label class="f"><span class="lab">Who it applies to *</span><span class="in">Field Operators<span class="car">▾</span></span></label>
  <label class="f"><span class="lab">Keywords</span><span class="in ph">well control, BOP, H2S, pressure testing</span></label>
  <details class="fold" open style="margin-top:22px"><summary>Add related documents or a change note <span>Optional</span></summary>
  <label class="f" style="margin-top:0"><span class="lab">What changed in this revision</span><span class="in ta ph">Shown on the record as “What changed in Rev 4.0”</span></label></details>'''
up('upload-what.html', 2, what + NAV('upload-where.html', 'upload-review.html', True, 'A summary is needed.'))

# 4 · Check the record
def rec(rows):
    return '<div class="recrows">' + ''.join(f'<div><span>{k}{"<em>derived</em>" if dv else ""}</span><b>{v}</b>{f"<small>{s}</small>" if s else ""}</div>' for k, v, s, dv in rows) + '</div>'
ROWS = [('Document number', 'TQ-TWS-CTSS-SOP-009', '', True), ('Title', 'Acid Stimulation SOP', '', False), ('Type', 'Standard Operating Procedure', '', True), ('Area', 'Coiled Tubing', '', False),
        ('Department', 'Segment (general)', '', False), ('Revision', 'Revision of TQ-TWS-CTSS-SOP-009: Rev 3.0 → Rev 4.0', 'When this revision is approved, Rev 3.0 is marked Superseded and keeps its history.', True),
        ('Owner', 'Relevant SPL / Function', '', True), ('Approver', 'Segment Director, Coiled Tubing, after the QMS check', 'The register names: Relevant Operation Director.', True),
        ('Issued', 'When it is released', 'The date of final approval, or a later effective date chosen then.', True), ('Review cycle', '24 months', '', True), ('Next review due', 'Issued date + 24 months', '', True),
        ('Retention', '10 years', 'TQ-QHSE-S001 7.5 says five. API Q2 4.5 requires ten, so ten is used.', True), ('Classification', 'Internal', '', True), ('Applies to', 'Field Operators', '', False),
        ('Status on filing', 'Draft, pending approval', '', True)]
review = f'''<p class="small">This is the register entry that will be created. Nothing below was typed by you unless it says so.</p>
  {rec(ROWS)}
  <p class="body" style="margin-top:18px">Filed as <b>Employee</b>. Your name, your email and the document owner come from your sign-in, so there is nothing here to type.</p>
  {note('due', '<b>Possibly related documents in this area.</b> Shown so you can check; they do not stop the filing. TQ-TWS-CTSS-SOP-009-AR · Same title in this area.')}
  <p class="lab" style="margin-top:28px">What happens next</p>{route('Segment Director, Coiled Tubing', 'after the QMS check')}
  <div class="acts navb"><a class="btn" href="upload-what.html">← Back</a><a class="btn ghost" href="home.html">Cancel</a><span class="sp"></span><a class="btn pri" href="upload-done.html">Submit for review →</a></div>'''
up('upload-review.html', 3, review)

# success + Your submissions
subs = f'''<div class="reg sr">{row("TQ-TWS-CTSS-SOP-009", "Acid Stimulation SOP · Rev 4.0", "filed 06 Oct 2026", "", st("pend", "Waiting on QMS check"), None, "document-draft.html", " mine", "")}</div>'''
done = f'''<div class="ok-big"><p class="lab">Submitted for review</p><h2 class="t1" style="margin-top:12px">Queued as TQ-TWS-CTSS-SOP-009 <span class="m">Rev 4.0.</span></h2>
  <p class="body" style="margin-top:14px">Next: QMS checks it, then the Segment Director, Coiled Tubing approves it. It is in force only after both. Until then Rev 3.0 stays in force.</p></div>
  {route('Segment Director, Coiled Tubing', 'after the QMS check', 1)}
  {sech('Your submissions', 1)}<p class="small" style="margin-top:8px">Every document filed under your sign-in, newest first.</p>{subs}
  <div class="acts" style="margin-top:22px"><a class="btn" href="upload.html">Upload another</a><a class="btn ghost" href="home.html">Home</a></div>'''
up('upload-done.html', 3, done, title='Filed')

# filing again after a return
RSN = 'Section 6 still cites SOP-003 Well Entry Protocol Rev 3.0, which is superseded. Cite the revision in force and file it again.'
again = f'''{note('al', f'<b>Filing again:</b> TQ-TWS-CTSS-SOP-009 Rev 4.0 was returned by QMS / Document Controller on 06 Oct 2026: “{RSN}” This filing keeps the same number and revision as attempt 2. The returned attempt stays in the register as history.')}
  <div class="g66" style="column-gap:16px"><label class="f"><span class="lab">Area · locked</span><span class="in ro">Coiled Tubing</span></label><label class="f"><span class="lab">Document type · locked</span><span class="in ro">Standard Operating Procedure</span></label></div>
  <div class="numchip"><span class="lab">Controlled number</span><b>TQ-TWS-CTSS-SOP-009</b><p>Same number and revision: filed again as attempt 2.</p></div>
  <p class="lab" style="margin-top:30px">Route once you file</p>{route('Segment Director, Coiled Tubing', 'after the QMS check')}''' + NAV('upload-file.html', 'upload-what.html')
up('upload-again.html', 1, again, title='Filing again')

# refusal: acting under a delegation (filing is never delegable)
ref = f'''<div class="refuse"><p class="lab">Upload</p><h1 class="t0" style="margin-top:16px">Filing is not part of a delegation.</h1>
  <p class="body" style="margin-top:16px">You are acting for CT Director. A delegation carries approval, and document management if granted, but never filing or export. Stop acting to file under your own name.</p>
  <p class="body" style="margin-top:10px">You are signed in as <b>Ahmed Saleh</b>.</p>
  <div class="acts" style="margin-top:24px"><a class="btn pri" href="desk.html">Stop acting</a><a class="btn" href="search.html">Search the documents</a></div></div>'''
page('upload-acting.html', 'RISE · Upload · not while acting', ref, 'upload', 'delegate', acting=ACT, dock_active='more')
print('upload ok')
