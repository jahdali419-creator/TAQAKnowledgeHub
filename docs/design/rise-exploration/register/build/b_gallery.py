"""Gallery “RISE — Register”: every screen by journey, desktop 1440×900 and phone 390×844, plus inventory, coverage and open decisions.
Writes register/index.html (repo) and a JSON page list used by the screenshot script."""
import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from reg import REG_ROOT, e

P = 'proposed'
J = [
 ('Landing', 'The front door: what RISE is, shown before sign-in and to anyone new to it.', [
   ('landing.html', 'Landing page', 'Thesis, live search answer, real screens and figures, three ways in, file-to-force, five roles.', 'new'),
 ]),
 ('Segment landings', 'Every area’s landing page, generated from the register.', [
   ('segments.html', 'All 25 area landings', 'One template; each area told apart by its register code and the real mix of its library.', 'new'),
   ('seg-company.html', 'Company Wide', '', ''),
   ('seg-cementing.html', 'Cementing', '', ''),
   ('seg-coiled-tubing.html', 'Coiled Tubing', '', ''),
   ('seg-drilling.html', 'Drilling Services', '', ''),
   ('seg-fracturing.html', 'Fracturing', '', ''),
   ('seg-inspection.html', 'Inspection', '', ''),
   ('seg-marine-services.html', 'Marine Services', '', ''),
   ('seg-well-safety.html', 'Safety Services', '', ''),
   ('seg-slickline.html', 'Slickline', '', ''),
   ('seg-well-completions.html', 'Well Completions', '', ''),
   ('seg-well-testing.html', 'Well Testing', '', ''),
   ('seg-wireline.html', 'Wireline Services', '', ''),
   ('seg-commercial.html', 'Commercial & Sales', '', ''),
   ('seg-finance.html', 'Finance', '', ''),
   ('seg-geothermal-coe.html', 'Geothermal Center of Excellence', '', ''),
   ('seg-cybersecurity.html', 'Governance, Risk & Compliance', '', ''),
   ('seg-hr.html', 'Human Resources', '', ''),
   ('seg-it.html', 'Information Technology', '', ''),
   ('seg-learning-center.html', 'Learning and Development', '', ''),
   ('seg-legal.html', 'Legal', '', ''),
   ('seg-qhse.html', 'QHSE', '', ''),
   ('seg-supply-chain.html', 'Supply Chain', '', ''),
   ('seg-pt-drilling-coe.html', 'Drilling Solutions Center of Excellence', '', ''),
   ('seg-pt-completions-coe.html', 'Well Completions Center of Excellence', '', ''),
   ('seg-pt-intervention-coe.html', 'Well Intervention Center of Excellence', '', ''),
 ]),
 ('Employee', 'Find the right document and know it is the one to use.', [
   ('home.html', 'Home', 'Employee. Continue reading, changed in my area, alerts, saved. 352 in force.', ''),
   ('home-director.html', 'Home · Segment Director', 'Same page trimmed for the role: 423 in force, confidential alert note, “Your desk” line.', ''),
   ('search.html', 'Search · start', 'How search reads what you type. Areas to go straight to.', ''),
   ('search-typing.html', 'Search · typing', '“inject”: document matches as you type.', ''),
   ('search-results.html', 'Search · results with preview', '“pressure”: 11 for an Employee. Your area first.', P),
   ('search-number.html', 'Search · same local number', 'WI-003 in 8 areas. Full register numbers; your area first.', P),
   ('search-filters.html', 'Search · filters', 'Area, Type, Status, Issued: the four real filters.', ''),
   ('search-superseded.html', 'Search · exact superseded number', 'TQ-TWS-CTSS-SOP-003: red “Superseded. Do not use.” card.', ''),
   ('search-none.html', 'Search · no results', 'Honest empty state, shorter-term suggestion, Ask an Expert.', ''),
   ('search-qms.html', 'Search · restricted results (QMS)', '19 for QMS, 11 for an Employee. Nothing hidden is hinted.', ''),
   ('areas.html', 'Areas', 'Company policies plus three families, Employee counts.', ''),
   ('area.html', 'Area · Coiled Tubing', 'Operations side, all tabs, important now, your recent, recently changed, related.', ''),
   ('area-sops.html', 'Area · SOPs tab with ⋯ menu', 'Search in tab, sort, Bookmark / QR / Copy link.', ''),
   ('area-nomatch.html', 'Area · no match in tab', '“No procedures match”.', ''),
   ('area-maint.html', 'Area · Maintenance side', 'Bulletins and maintenance SOPs empty states; Software.', ''),
   ('area-director.html', 'Area · Director view', 'Review flags, Overdue first, Manage segment.', ''),
   ('area-policies.html', 'Company policies', '12 CEO policies, one provisional number.', ''),
   ('document.html', 'Document · current (Employee)', 'The answer first, brief record, full record fold, actions, preview, related.', ''),
   ('document-controller.html', 'Document · controller view (QMS)', '12-cell record, version history, approval trail.', ''),
   ('document-share.html', 'Document · share / QR', '', ''),
   ('document-qrc.html', 'Document · quick reference card', 'Sunlight Mode on.', ''),
   ('document-form.html', 'Document · form record', 'Primary action becomes Fill in or print.', ''),
   ('form.html', 'Form · fill in and print', 'F001 Pre-Job Safety Checklist, sample-content note.', ''),
   ('saved.html', 'Saved', 'Bookmarks; Pinned offline lives here.', P),
   ('saved-empty.html', 'Saved · empty', '', ''),
   ('notifications.html', 'Notifications · Employee', 'Your submissions (built) + urgent alert / revised / information types.', P),
   ('notifications-director.html', 'Notifications · approval request', '“Waiting for your signature”.', ''),
   ('more.html', 'More (phone)', 'Role functions live here on the phone.', ''),
   ('account.html', 'Account', '', ''),
 ]),
 ('Knowledge tools', 'Ask the people who know, and learn the language.', [
   ('ask.html', 'Ask an Expert', 'Five sections, routing card, response times, segment experts.', ''),
   ('ask-critical.html', 'Ask · Critical + validation', 'Not-an-emergency-channel warning; missing title.', ''),
   ('ask-photo.html', 'Ask · photo markup', 'Annotation tools, thumbnails.', ''),
   ('ask-result.html', 'Ask · not sent (built)', '“This preview has no connected ticket system.”', ''),
   ('ask-sent.html', 'Ask · sent (target BD-04)', 'QMS triages; reference from the ticket system.', P),
   ('glossary.html', 'Field Glossary', '254 terms, 11 categories, A–Z, open row.', ''),
   ('glossary-search.html', 'Glossary · search', '“WI”: two meanings with Also: notes.', ''),
   ('glossary-term.html', 'Glossary · term', 'BOP with related terms and documents.', P),
   ('glossary-none.html', 'Glossary · no match', '', ''),
   ('glossary-propose.html', 'Glossary · propose a term', 'Target BD-06 review flow.', P),
 ]),
 ('Publishing', 'File a document: four panels, routing shown before you file.', [
   ('upload.html', 'Upload · 1 File', '', ''),
   ('upload-file.html', 'Upload · file added', 'Fingerprint check.', ''),
   ('upload-file-error.html', 'Upload · file refused', '', ''),
   ('upload-where.html', 'Upload · 2 Where it belongs', 'Revision of SOP-009, number chip, route.', ''),
   ('upload-where-error.html', 'Upload · number already used', '', ''),
   ('upload-maint.html', 'Upload · Maintenance Bulletin', 'Locked maintenance tick, Maintenance Manager route, provisional MB.', ''),
   ('upload-policy.html', 'Upload · Policy (QMS)', 'Policy rules box; CEO approver flagged.', ''),
   ('upload-what.html', 'Upload · 3 What it is', 'Duplicate hint, summary required.', ''),
   ('upload-review.html', 'Upload · 4 Check the record', 'Derived register entry.', ''),
   ('upload-done.html', 'Upload · filed', 'Your submissions.', ''),
   ('document-draft.html', 'Your filing · waiting on QMS', '', ''),
   ('document-returned.html', 'Your filing · returned', 'Reason, File it again.', ''),
   ('upload-again.html', 'Upload · filing again', 'Locked fields, attempt 2.', ''),
   ('upload-acting.html', 'Upload · refused while acting', '', ''),
   ('refuse-upload.html', 'Upload · refused for Auditor', '', ''),
 ]),
 ('Document Control', 'Master List: the register, read and controlled.', [
   ('master.html', 'Master List · QMS', 'Quick views, filters, sort, F086 export.', ''),
   ('master-bulk.html', 'Master List · bulk confirm', 'Preview first; never bulk reject.', ''),
   ('master-record.html', 'Master List · record drawer', 'Superseded SOP-003, read-only.', ''),
   ('master-auditor.html', 'Master List · Auditor', 'Read only, everything.', ''),
   ('refuse-master.html', 'Master List · refused', 'Employee.', ''),
 ]),
 ('QMS', 'The conformance check. QMS never gives final approval.', [
   ('workbench.html', 'QMS check · queue + record', '12 waiting.', ''),
   ('workbench-reject.html', 'QMS check · return', 'Reason of at least 20 characters.', ''),
   ('workbench-done.html', 'QMS check · confirmed', 'Sent on for final approval.', ''),
   ('workbench-escalated.html', 'QMS check · restricted, escalated', 'Waits on an authorised final approver.', ''),
   ('more-qms.html', 'More · QMS (phone)', 'Master List and QMS check under More.', ''),
 ]),
 ('Management', 'Final approval, managing documents, delegation.', [
   ('desk.html', 'Director desk', '', ''),
   ('desk-approve.html', 'Director · approve', 'Effective from.', ''),
   ('desk-reject.html', 'Director · return', 'Validation.', ''),
   ('desk-approved.html', 'Director · approved', '', ''),
   ('document-notyet.html', 'Approved, not yet effective', '', ''),
   ('desk-maint.html', 'Maintenance Manager desk', '', ''),
   ('manage.html', 'Manage documents', '', ''),
   ('manage-withdraw.html', 'Withdraw', '', ''),
   ('delegation.html', 'Delegation · grants', 'Active, scheduled, expired, revoked; evidence ids.', ''),
   ('delegation-new.html', 'Delegation · grant', 'Two independent permissions; reason.', ''),
   ('delegation-revoke.html', 'Delegation · revoke', '', ''),
   ('desk-delegate.html', 'Acting as delegate', 'Acting bar, Stop acting.', ''),
   ('acting-broken.html', 'Delegation ended', 'A broken grant holds no powers.', ''),
   ('refuse-desk.html', 'Desk · refused', '', ''),
   ('account-director.html', 'Account & delegation', '', ''),
   ('more-director.html', 'More · Director (phone)', '', ''),
 ]),
 ('States', 'Every state reads the same everywhere.', [
   ('states.html', 'States catalogue', '', ''),
   ('document-superseded.html', 'Document · superseded', '', ''),
   ('document-withdrawn.html', 'Document · withdrawn', '', ''),
   ('document-unavailable.html', 'Not available to your role', '', ''),
   ('document-denied.html', 'Access restricted', '', ''),
   ('system.html', 'Register design system', 'Only the components the screens use.', ''),
 ]),
]
ALL = [p for _, _, ps in J for p in ps]
json.dump([p[0] for p in ALL], open(os.path.join(REG_ROOT, 'build', 'pages.json'), 'w'))
assert all(os.path.exists(os.path.join(REG_ROOT, 'pages', p[0])) for p in ALL), [p[0] for p in ALL if not os.path.exists(os.path.join(REG_ROOT, 'pages', p[0]))]
extra = sorted(set(os.listdir(os.path.join(REG_ROOT, 'pages'))) - {p[0] for p in ALL})

NOT_DESIGNED = [
 ('Usage Analytics', 'analytics.html · QMS and Auditor only: local counters, trends, top queries, audit log placeholder, CSV export.'),
 ('About this platform', 'whats-new.html · QMS and Auditor: register, metadata, numbering Was/Now, roles.'),
 ('Offline page and connectivity bars', 'offline.html, the offline / RISE-not-reached bar, the new-version bar.'),
 ('Published documents list (area manager)', 'documents.html · covered in spirit by Manage documents; its own search and type pills are not drawn.'),
 ('First-visit tour, install sheet, keyboard-shortcuts modal, toasts', 'Global behaviours from shared.js.'),
 ('Preview side panel from “Your recent”', 'The area page opens a side panel, not the record; drawn as links to the record.'),
 ('Compare revisions', 'The controller history has the button; the compare view itself is not drawn.'),
 ('Dark theme', 'The live app has light and dark; Register is drawn light only.'),
 ('Functions and Centres of Excellence area pages', 'Their relabelled tabs (Procedures / Product Manuals / Notices / Systems) are not drawn; Coiled Tubing and Company policies are.'),
 ('Role switcher (“View as”)', 'Prototype only; it will not exist in production.'),
]
DECISIONS = [
 ('“Your area first” in Search', 'The live search has no home area (no membership yet, BR §14). Drawn and labelled proposed.'),
 ('Review overdue in Search', 'Search shows Employees review-overdue notes and a filter; every other page hides them. Register hides them everywhere.'),
 ('Obsolete vs Withdrawn', 'The register says “Obsolete”; screens say “Withdrawn”. Register uses Withdrawn with the banner “Obsolete. Do not use.”'),
 ('Approver wording', 'Upload’s success text and the record name the register’s type approver (e.g. “Relevant Operation Director”); the desk that actually signs is the area holder’s.'),
 ('Policy approver', 'Upload says the CEO approves a policy; BD-02 invents no CEO route.'),
 ('Step bar', 'The live bar shows 3 steps for 4 panels. Register shows the 4 panels.'),
 ('What changed in a revision', 'No change-note field is shown on the record today. Drawn as a proposed field, filled from Upload’s “What changed in this revision”.'),
 ('Pins and Saved', 'Pin offline has no list. Register puts pins under Saved.'),
 ('Alert / revision notifications', 'Not built (no subscriptions). Drawn as proposed types.'),
 ('Glossary and Ask targets', 'BD-06 review flow and BD-04 sent state drawn as proposed; the built behaviour is drawn too.'),
]

def card(p):
    f, t, n, flag = p
    b = f.replace('.html', '')
    return f'''<article class="card"><header><span class="t">{t}</span>{f'<span class="pp">{flag}</span>' if flag else ''}<a class="open" href="pages/{f}">Open ↗</a></header>
  <div class="pair"><a class="d" href="pages/{f}"><img loading="lazy" src="shots/{b}-d.jpg" alt="{e(t)} on desktop"></a><a class="m" href="pages/{f}"><img loading="lazy" src="shots/{b}-m.jpg" alt="{e(t)} on phone"></a></div>
  {f'<p>{n}</p>' if n else ''}<p class="fn">{f}</p></article>'''

nav = ''.join(f'<a href="#j{i}">{name}<b>{len(ps)}</b></a>' for i, (name, _, ps) in enumerate(J))
secs = ''.join(f'<section id="j{i}"><div class="jh"><h2>{name}</h2><span>{len(ps)} screens · desktop + phone</span></div><p class="jd">{d}</p><div class="cards">{"".join(card(p) for p in ps)}</div></section>' for i, (name, d, ps) in enumerate(J))
inv = ''.join(f'<tr><td>{name}</td><td>{"".join(f"<span>{t}</span>" for _, t, _, _ in ps)}</td><td class="n">{len(ps)}</td><td class="n">{len(ps)}</td></tr>' for name, _, ps in J)
html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RISE — Register</title>
<link rel="stylesheet" href="../kit/fonts.css"><style>
:root{{--paper:#F3F1EC;--sheet:#FFFEFB;--ink:#11201F;--ink2:#4A5553;--ink3:#878D89;--rule:#DFDBD3;--spark:#FD5805;--mono:'PlexMono',ui-monospace,monospace;--display:'BwGradual','Inter',sans-serif;--ui:'Inter',system-ui,sans-serif}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--paper:#F3F1EC}}}}
*{{box-sizing:border-box;margin:0;padding:0}}body{{background:var(--paper);color:var(--ink);font:400 15px/1.5 var(--ui)}}a{{color:inherit;text-decoration:none}}
.w{{max-width:1440px;margin:0 auto;padding:0 40px}}
.top{{padding:44px 0 28px;border-bottom:1.5px solid var(--ink)}}.top .lab{{font:500 11.5px/1 var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--ink3)}}
h1{{margin-top:20px;font:700 64px/1 var(--display);letter-spacing:-.035em}}h1 span{{font-weight:300;color:#B3B5AF}}
.top p.s{{margin-top:16px;max-width:80ch;font-size:16.5px;color:var(--ink2)}}
.jn{{position:sticky;top:0;z-index:5;display:flex;flex-wrap:wrap;gap:6px 26px;padding:14px 0;background:rgba(243,241,236,.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--rule);font:500 12px/1 var(--mono);letter-spacing:.07em;text-transform:uppercase;color:var(--ink2)}}
.jn b{{margin-left:6px;color:var(--spark);font-weight:500}}
section{{padding:46px 0 10px}}.jh{{display:flex;align-items:baseline;gap:18px;padding-bottom:10px;border-bottom:1px solid var(--rule)}}.jh h2{{font:700 34px/1.1 var(--display);letter-spacing:-.025em}}.jh span{{margin-left:auto;font:500 11.5px/1 var(--mono);letter-spacing:.07em;text-transform:uppercase;color:var(--ink3)}}
.jd{{margin-top:10px;color:var(--ink2)}}
.cards{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:34px 34px;margin-top:24px}}
.card header{{display:flex;align-items:baseline;gap:10px;padding-bottom:10px}}.card .t{{font:500 17px/1.25 var(--ui)}}.card .open{{margin-left:auto;font:500 12.5px/1 var(--ui);color:var(--ink3)}}
.pp{{padding:3px 6px;border:1px dashed #B3B5AF;border-radius:4px;font:500 10px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink3)}}
.pair{{display:grid;grid-template-columns:minmax(0,1fr) 25%;gap:12px;align-items:start}}.pair img{{display:block;width:100%;height:auto;border:1px solid var(--rule);border-radius:4px;background:var(--sheet)}}.pair .m img{{border-radius:10px}}
.card p{{margin-top:8px;font-size:13.5px;color:var(--ink2)}}.card p.fn{{margin-top:4px;font:500 11px/1 var(--mono);color:var(--ink3)}}
.tbl{{width:100%;border-collapse:collapse;margin-top:18px}}.tbl th{{text-align:left;padding:10px 12px 10px 0;border-bottom:1.5px solid var(--ink);font:500 10.5px/1 var(--mono);letter-spacing:.09em;text-transform:uppercase;color:var(--ink3)}}
.tbl td{{padding:12px 12px 12px 0;border-bottom:1px solid var(--rule);vertical-align:top;font-size:14px;color:var(--ink2)}}.tbl td:first-child{{font-weight:600;color:var(--ink);white-space:nowrap}}.tbl td span{{display:inline-block;margin:0 10px 4px 0}}.tbl td span::after{{content:" ·";color:#B3B5AF}}.tbl .n{{font:500 13px/1 var(--mono);text-align:right}}
.ls div{{display:grid;grid-template-columns:320px 1fr;gap:20px;padding:13px 0;border-bottom:1px solid var(--rule)}}.ls b{{font-weight:600}}.ls span{{color:var(--ink2)}}
.ba{{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:22px}}.ba figure div{{display:grid;grid-template-columns:1fr 1fr;gap:8px}}.ba img{{width:100%;border:1px solid var(--rule);border-radius:10px}}.ba figcaption{{margin-top:8px;font:500 11.5px/1.3 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ink3)}}
@media (max-width:720px){{.ba{{grid-template-columns:1fr}}}}
.foot{{padding:40px 0 80px;color:var(--ink3);font-size:13px}}
@media (max-width:720px){{.w{{padding:0 16px}}h1{{font-size:40px}}.cards{{grid-template-columns:1fr}}.ls div{{grid-template-columns:1fr;gap:4px}}.tbl td:nth-child(2){{display:none}}.jh h2{{font-size:26px}}}}
</style></head><body><div class="w">
<header class="top"><p class="lab">RISE · TAQA knowledge · approved design language</p><h1>RISE — Register <span>across the whole product.</span></h1>
<p class="s">{len(ALL)} screens, each at desktop 1440×900 and phone 390×844, built from the live register (585 records) with the live business rules. Role-aware: an Employee never sees QMS or Manager items. Anything not built today is tagged <span class="pp">proposed</span>. Design exploration only: nothing here touches the live application.</p></header>
<nav class="jn"><a href="#ba">Phone before / after</a>{nav}<a href="#inv">Inventory</a><a href="#nd">Not yet designed</a><a href="#od">Open decisions</a></nav>
<section id="ba"><div class="jh"><h2>Phone, before and after</h2><span>calm pass</span></div>
<p class="jd">Feedback: too much text on the phone, and every screen looked the same. Now the top bar names the screen and gives a way back; labels, hints, side panels and second sentences stay on desktop; each kind of screen keeps one signature: the search line, the area switch, the coloured answer card, the step count, the waiting count.</p>
<div class="ba">{"".join(f'<figure><div><img src="shots/before/{n}-m.jpg" alt="{t} before"><img src="shots/{n}-m.jpg" alt="{t} after"></div><figcaption>{t} · before → after</figcaption></figure>' for n, t in (("document", "Document"), ("area", "Coiled Tubing"), ("upload-where", "Upload step 2"), ("search-results", "Search results")))}</div></section>
{secs}
<section id="inv"><div class="jh"><h2>Page inventory &amp; coverage</h2><span>{len(ALL)} screens · {len(ALL)} desktop · {len(ALL)} phone</span></div>
<table class="tbl"><thead><tr><th>Journey</th><th>Screens</th><th>Desktop</th><th>Phone</th></tr></thead><tbody>{inv}</tbody></table></section>
<section id="nd"><div class="jh"><h2>In the live app, not yet in Register</h2><span>{len(NOT_DESIGNED)}</span></div><div class="ls">{"".join(f"<div><b>{a}</b><span>{b}</span></div>" for a, b in NOT_DESIGNED)}</div></section>
<section id="od"><div class="jh"><h2>Open decisions</h2><span>not fixed silently</span></div><div class="ls">{"".join(f"<div><b>{a}</b><span>{b}</span></div>" for a, b in DECISIONS)}</div></section>
<p class="foot">Built on branch design/rise-exploration · static prototypes in docs/design/rise-exploration/register · data read-only from documents-master.js and glossary.html.</p>
</div></body></html>'''
open(os.path.join(REG_ROOT, 'index.html'), 'w').write(html)
print(len(ALL), 'screens; not in gallery:', extra)
