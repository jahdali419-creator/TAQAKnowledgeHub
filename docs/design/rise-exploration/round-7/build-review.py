"""Builds round-7/index.html: review page for the single RISE direction."""
import os, html
HERE = os.path.dirname(os.path.abspath(__file__))
e = html.escape
DNA = [
 ('Quiet chrome, content in charge.', 'A light neutral sidebar and a thin top bar fade back so documents carry the screen. TAQA teal appears only on the selected item and the one primary action.'),
 ('Typography does the hierarchy.', 'One large BW Gradual title per page; everything else is 13–14px Inter, separated by weight and grey level rather than boxes, sizes or colour.'),
 ('Lists before cards.', 'Grouped rows with counts and fixed columns (date, code, title, area, revision, status) make every list scan the same way. Containers appear only where they group a warning or a preview.'),
 ('Every object gets a properties rail.', 'Pages keep their main subject in a wide column and its facts in a 272px rail of label/value pairs, so details never compete with content.'),
 ('Trust as one line.', 'The document opens with a single control strip, Current · Revision · Effective · Approver, readable in two seconds. Status is always a shape plus a word, never colour alone.'),
 ('Restraint as identity.', 'Hairlines, generous rhythm and a consistent document-code column are what make RISE recognisable. Crimson marks safety only; orange lives only in the logo and one unread dot.'),
]
SCREENS = [
 ('home', 'Home', 'The entrance leads with search, then the one safety change that affects Faisal’s work, then what changed in their area and what they were reading. The rail answers “my area, my saved, where to get help”. Browse areas sits below for wider exploration. There is no greeting and no KPI tiles.'),
 ('search', 'Search · “pressure test”', 'A list-and-preview workspace: the query and filters on top, results grouped (their area first, then by type) on the left, and the selected document’s control facts and first page on the right. Rows stay one line, the same as on Home and Area.'),
 ('area', 'Area · Well Intervention', 'A real destination: what it contains (four member areas as tabs), what needs attention, what changed, and the main shelves, with experts and a cross-area topic in the rail. Well Intervention is a proposed grouping and is labelled so. Maintenance bulletins show an honest empty state: the register defines the type but none are issued yet.'),
 ('document', 'Document · WI-003', 'Title, type, area and the trust strip are answered before anything else, then the ALT-002 safety note, then the document itself. Record, history, related documents and the expert sit in the rail. Saved, Share and Download PDF live in the top bar where they are always reachable.'),
]
RESP = [
 ('Sidebar', 'Becomes a bottom bar: Home, Search, Areas, Saved. Ask an Expert, Field Glossary and role tools move to a “More” sheet. The search field becomes the top of every screen.'),
 ('Properties rail', 'Moves under the title as a collapsible “Record” section. Facts stay label/value; nothing is removed.'),
 ('List rows', 'Code and title stay on line one; area, revision and status drop to line two. Status is never hidden.'),
 ('Search preview', 'Tapping a result opens the document; the preview pane is a desktop convenience only.'),
 ('Filters', 'Collapse into one “Filters” button with a sheet. The active filter count stays visible.'),
 ('Trust strip', 'Stacks to three rows and stays first after the title. This is the one region that must always be visible.'),
]
CRIT = [
 ('Does it still look like an AI dashboard?', 'No KPI tiles, no greeting and no card grid. The first pass had three boxed regions; they became hairline sections.'),
 ('Too many cards?', 'Three containers are left on purpose: the safety note, the search preview and the document page.'),
 ('Is the hierarchy obvious?', 'Yes on every screen: search, then safety, then your area’s changes. Title, then trust, then content.'),
 ('Does typography do enough?', 'Mostly. The first pass truncated titles; the rail went from 296px to 272px and columns were tightened so titles read in full.'),
 ('Would it hold without TAQA colours?', 'Yes. Structure, rhythm and the code column carry the identity; colour only marks selection, actions and safety.'),
 ('Can a technician use it untrained?', 'Six plain destinations and one search field, and the same row pattern everywhere. The weak point is filter vocabulary, which needs testing with field users.'),
]
dna = ''.join(f'<li><span><b>{e(a)}</b> {e(b)}</span></li>' for a, b in DNA)
screens = ''.join(f'''<section class="scr" id="{k}"><div class="scr-h"><span class="no">{i+1:02d}</span><h2>{e(t)}</h2></div><p>{e(d)}</p>
<a class="frame" href="rise/{k}.html"><img src="shots/r7-{k}.jpg" alt="{e(t)} at 1440 by 900" width="2160" height="1350" loading="lazy"></a></section>''' for i, (k, t, d) in enumerate(SCREENS))
resp = ''.join(f'<tr><th>{e(a)}</th><td>{e(b)}</td></tr>' for a, b in RESP)
crit = ''.join(f'<tr><th>{e(a)}</th><td>{e(b)}</td></tr>' for a, b in CRIT)
css = '''
:root{--ink:#0E1A1C;--ink2:#46575A;--ink3:#748386;--line:#E8ECEC;--side:#F7F8F8;--teal:#00585A;--display:'BwGradual','Inter',system-ui,sans-serif;--ui:'Inter',system-ui,sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#fff;color:var(--ink);font:400 15px/1.6 var(--ui);-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
img{display:block;max-width:100%;height:auto}
.wrap{max-width:1180px;margin:0 auto;padding:0 40px}
@media (max-width:640px){.wrap{padding:0 16px}}
header{padding:28px 0 0}
.mt{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-bottom:22px;border-bottom:1px solid var(--line)}
.mt img{height:26px;width:auto}
.badge{display:inline-flex;align-items:center;gap:8px;height:28px;padding:0 10px;border-radius:7px;border:1px solid var(--line);font:500 12.5px/1 var(--ui);color:var(--ink2)}
.badge i{width:6px;height:6px;border-radius:50%;background:#FF6720}
.eyebrow{margin-top:48px;font:500 13px/1 var(--ui);color:var(--ink3)}
h1{margin-top:12px;font:700 clamp(34px,5vw,52px)/1.05 var(--display);letter-spacing:-.025em;max-width:20ch}
.lede{margin-top:16px;max-width:68ch;font-size:16.5px;color:var(--ink2)}
.toc{display:flex;flex-wrap:wrap;gap:4px 22px;margin-top:22px;font:500 13.5px/2 var(--ui);color:var(--ink3)}
.toc a:hover{color:var(--teal)}
.dna{margin-top:56px;display:grid;grid-template-columns:220px minmax(0,1fr);gap:40px;padding-top:28px;border-top:1px solid var(--line)}
.dna h2,.blk h2{font:700 22px/1.2 var(--display);letter-spacing:-.01em}
.dna ol{list-style:none;counter-reset:d;border-top:1px solid var(--line)}
.dna li{counter-increment:d;display:grid;grid-template-columns:40px minmax(0,1fr);padding:14px 0;border-bottom:1px solid var(--line);font-size:15px;color:var(--ink2)}
.dna li::before{content:counter(d,decimal-leading-zero);font:500 13px/1.7 var(--ui);color:var(--ink3)}
.dna li b{color:var(--ink);font-weight:600}
@media (max-width:820px){.dna{grid-template-columns:1fr;gap:16px}}
.scr{margin-top:72px}
.scr-h{display:flex;align-items:baseline;gap:14px}
.scr-h .no{font:500 13px/1 var(--ui);color:var(--ink3)}
.scr-h h2{font:700 26px/1.2 var(--display);letter-spacing:-.015em}
.scr p{margin-top:10px;max-width:78ch;color:var(--ink2)}
.frame{display:block;margin-top:20px;border:1px solid var(--line);border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(14,26,28,.04),0 24px 60px -36px rgba(14,26,28,.45)}
.blk{margin-top:80px;padding-top:28px;border-top:1px solid var(--line)}
.blk > p{margin-top:10px;max-width:78ch;color:var(--ink2)}
.navs{display:grid;grid-template-columns:auto auto minmax(0,1fr);gap:32px;align-items:start;margin-top:24px}
.navs figure img{width:210px;border:1px solid var(--line);border-radius:10px}
.navs figcaption{margin-top:10px;font:500 13px/1.4 var(--ui);color:var(--ink2)}
.navs ul{list-style:none;border-top:1px solid var(--line)}
.navs li{padding:12px 0;border-bottom:1px solid var(--line);font-size:14.5px;color:var(--ink2)}
.navs li b{color:var(--ink);font-weight:600}
@media (max-width:900px){.navs{grid-template-columns:1fr 1fr}.navs ul{grid-column:1/-1}.navs figure img{width:100%}}
table{width:100%;border-collapse:collapse;margin-top:20px;font-size:14.5px;line-height:1.55}
th,td{text-align:left;vertical-align:top;padding:12px 18px 12px 0;border-top:1px solid var(--line)}
th{width:30%;font-weight:600}
td{color:var(--ink2)}
@media (max-width:700px){tr{display:block;border-top:1px solid var(--line);padding:10px 0}th,td{display:block;width:auto;border:0;padding:2px 0}}
.stop{margin-top:72px;padding:20px 22px;border-radius:10px;background:var(--side);border:1px solid var(--line);font-size:14.5px;color:var(--ink2)}
.stop b{color:var(--ink)}
footer{margin-top:56px;padding:22px 0 40px;border-top:1px solid var(--line);font-size:13px;color:var(--ink3)}
'''
doc = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RISE Direction Review</title>
<link rel="stylesheet" href="../kit/fonts.css">
<style>{css}</style>
</head>
<body>
<div class="wrap">
<header>
  <div class="mt"><img src="../kit/brand/rise-lockup-header.png" alt="RISE" width="69" height="26"><span class="badge"><i></i>Design exploration · not implemented · awaiting approval</span></div>
  <p class="eyebrow">Round 7 · One direction</p>
  <h1>The core RISE web experience</h1>
  <p class="lede">Home, Search, Area and Document designed as one product at 1440 × 900, with one navigation system for every role. All content comes from the RISE register: Faisal Al-Ghamdi, Field Supervisor, Employee, home area Coiled Tubing. Nothing has changed in authorisation or document rules.</p>
  <nav class="toc"><a href="#dna">Design DNA</a><a href="#home">Home</a><a href="#search">Search</a><a href="#area">Area</a><a href="#document">Document</a><a href="#nav">Navigation</a><a href="#resp">Responsive plan</a><a href="#crit">Self-review</a></nav>
</header>
<section class="dna" id="dna"><h2>Design DNA</h2><ol>{dna}</ol></section>
{screens}
<section class="blk" id="nav">
  <h2>Navigation</h2>
  <p>One quiet sidebar: search first, then four everyday destinations, then the viewer’s areas. Role tools sit at the bottom and only appear for the roles that hold them, so the Employee view stays short without hiding anything from QMS.</p>
  <div class="navs">
    <figure><img src="shots/r7-nav-employee.png" alt="Sidebar for an Employee" width="372" height="1350"><figcaption>Employee: Upload only</figcaption></figure>
    <figure><img src="shots/r7-nav-qms.png" alt="Sidebar for a QMS role" width="372" height="1350"><figcaption>QMS role: Document control section</figcaption></figure>
    <ul>
      <li><b>Search</b> is the first item and opens from anywhere with ⌘K.</li>
      <li><b>Home, Saved, Ask an Expert, Field Glossary</b> are the everyday destinations.</li>
      <li><b>Areas</b> lists the viewer’s home area and followed groups; All areas opens the directory of 25.</li>
      <li><b>Upload</b> is available to Employees as a single item. <b>Master List</b> and <b>QMS Workspace</b> appear only for QMS, Segment Director and Maintenance Manager roles.</li>
      <li><b>Notifications</b> live in the top bar; <b>role and identity</b> sit at the foot of the sidebar.</li>
    </ul>
  </div>
</section>
<section class="blk" id="resp"><h2>Responsive plan</h2><p>Not designed for the phone yet; these are the rules each desktop region follows when it collapses.</p><table><tbody>{resp}</tbody></table></section>
<section class="blk" id="crit"><h2>Self-review</h2><p>Questions asked of the first pass, and what changed because of them.</p><table><tbody>{crit}</tbody></table></section>
<p class="stop"><b>Stopping here.</b> Upload, QMS Workspace, the phone layouts and any implementation wait for your approval of this direction.</p>
<footer>RISE design exploration · round 7 · Built by TAQA Learning Center · branch design/rise-exploration</footer>
</div>
</body>
</html>'''
open(os.path.join(HERE, 'index.html'), 'w').write(doc)
print('ok')
