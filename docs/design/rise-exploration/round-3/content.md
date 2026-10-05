# RISE · Round 3 (Future Concepts G, H, I) · shared real content

Every concept uses exactly this content. All records come from the live register
(`documents-master.js`, read 5 Oct 2026) or from `../content.md`. Do not invent documents,
numbers, people, equipment or figures. Where a concept needs something the register does not hold
(equipment tags, topic groupings, synonyms), use only what is listed here and label it
"proposed" or "concept" on the screen or in the notes.

## Viewer
- Signed in as **Faisal Al-Ghamdi · Field Supervisor**, role **Employee**, home area **Coiled Tubing · Operations**.
- Employee sees Internal documents in full. Restricted and Confidential records appear with a lock and
  "Access restricted · request access through QMS" (the live app's wording). Drafts are never shown.
- Superseded and Obsolete documents are excluded from search results; say so ("2 not in force are hidden").
- Register status words: Current · Review due (in force, past its review date) · Draft · Superseded · Obsolete.
  Classification: Internal · Restricted · Confidential.

## Register figures
520 documents in force (455 Current + 65 Review due) · 25 areas · 33 active technical alerts ·
190+ Field Glossary terms · 14 Arabic translations · ~5,000 employees.

## Brand
RISE logo files in `../kit/brand/` (`rise-logo.png`, `rise-logo-reverse.png`, `rise-lockup-header*.png`,
`rise-icon.png`). Never redraw or recolour the logo (you may cut it into parts with clip-path).
Fonts via `../../kit/fonts.css`: `'BwGradual'` 300/400/700/800 and `'Inter'` 300–700.
Colours: logo ink `#002B32`, pillar teal `#013F4E`, TAQA Teal Green `#005D63`, Legacy Teal `#00BBB6`,
logo cyan `#00ADC2`, logo orange `#FD5805`, TAQA Brave Orange `#FD691D`, TAQA Crimson Red `#C8102E`.
The **orange → red gradient** (`#FD691D → #C8102E`) may be a signature accent or interaction cue,
under 5% of any screen. Never orange body text on light grounds. Status colours stay separate from brand.

## Search 1 · `pressure test` (the signature search, used by all three concepts)
Deterministic register search on titles. In force only. Grouped:
- **Procedures (SOP)**
  - TQ-TWS-CTSS-SOP-005 · Pressure Testing Procedure · Coiled Tubing · Rev 2.0 · Current · Restricted · issued 12 Jun 2025 · Arabic version TQ-TWS-CTSS-SOP-005-AR
  - TQ-TWS-FS-SOP-003 · Iron Pressure Test · Fracturing · Rev 4.0 · Current · Internal · 14 Apr 2025 · Arabic version
  - TQ-TWS-CMT-SOP-005 · Pressure Test SOP · Cementing · Rev 1.0 · Current · Internal · 05 Mar 2025
  - TQ-TWS-WIS-SOP-004 · Pressure Test Inspection SOP · Inspection · Rev 3.0 · Current · Restricted · 05 Jan 2026
  - TQ-TWS-WTS-SOP-004 · Pressure Buildup Test SOP · Well Testing · Rev 3.0 · Review due · Internal · 21 Dec 2023
  - TQ-TWS-WS-SOP-007 · Pressure Control Equipment Check · Wireline Services · Rev 2.0 · Review due · Confidential · 07 Apr 2024
- **Work Instructions / Manuals**
  - TQ-TWS-WTS-WI-004 · Pressure Gauge Calibration Manual · Well Testing · Rev 3.0 · Current · Internal · 15 Mar 2024
  - TQ-TWS-FS-WI-003 · High-Pressure Iron Manual · Fracturing · Rev 1.0 · Current · Internal · 25 Dec 2025
  - TQ-TDS-DSS-WI-006 · BOP Testing Manual · Drilling Services · Rev 1.0 · Current · Restricted · 30 Jan 2025
- **Standards**
  - TQ-TWS-WSS-S002 · BOP Testing Standard · Safety Services · Rev 2.0 · Current · Internal · 09 Mar 2026
  - TQ-TWS-FS-S002 · High Pressure Operations Standard · Fracturing · Rev 2.0 · Current · Restricted · 18 Aug 2026
  - TQ-TWS-WS-S003 · Pressure Control Standard · Wireline Services · Rev 2.0 · Current · Confidential · 26 Feb 2025
- **Lessons Learned**
  - TQ-TWS-CTSS-LL-005 · Pressure integrity test failure, field findings · Coiled Tubing · Rev 4.0 · Review due · Internal
  - TQ-TWS-FS-LL-005 · Wellhead pressure anomaly, identification and mitigation · Fracturing · Rev 4.0 · Current · Internal
  - TQ-TWS-CMT-LL-004 · Float collar failure, pre-job testing enhancement · Cementing · Rev 4.0 · Current · Internal
- **Technical alerts**
  - TQ-TWS-CTSS-ALT-002 · New pressure rating for 2-inch CT string, effective immediately · Coiled Tubing · Rev 2.0 · Current · Confidential · 13 Apr 2026
  - TQ-TWS-WTS-ALT-002 · Separator pressure rating update, verify all units before deployment · Well Testing · Rev 4.0 · Current · Restricted · 29 Mar 2026
- **Experts** (role titles, never names): Coiled Tubing expert · Fracturing expert · Well Testing expert
  (Ask an Expert routes by area; maintenance questions go to "<Area> Maintenance Manager").
- **Areas** with matches: Coiled Tubing · Fracturing · Cementing · Well Testing · Wireline Services · Drilling Services · Safety Services · Inspection
- **Field Glossary**: BOP · Blowout Preventer (Well Control): "A large specialised valve installed at the wellhead that can be closed to prevent uncontrolled flow of formation fluids (kick) to surface during drilling or well intervention."
- **Hidden, not in force**: TQ-TWS-WTS-SOP-002 Surface Testing Equipment Rig-Up SOP (Superseded) · TQ-TWS-WTS-WI-001 Well Testing Operations Manual v3.0 (Obsolete) → "2 not in force are hidden".
- Totals to show: **17 strongest matches** (the groups above), plus 3 experts, 8 areas, 1 glossary term. The register holds more partial matches on one word only (e.g. TQ-TDS-DSS-S009 BOP Testing Standard, TQ-SS-SOP-002 Wireline Valve Function Test, even TQ-GRC-SOP-009 Penetration Testing Procedure); show them behind "More partial matches" without inventing a count.
- Context ranking idea (concept): because the viewer's home area is Coiled Tubing, Coiled Tubing matches can rank first, labelled "Your area first".
- Proposed equipment tags for this query (concept, derived from titles): BOP · High-pressure iron · Pressure gauge · Separator · CT string.

## Search 2 · `I need to isolate a pump` (plain-language query, still deterministic)
Not a chatbot. RISE removes filler words and matches the remaining terms **isolate** and **pump**:
- No in-force document title contains "isolate" or "isolation". Say so honestly: "No approved document is titled for pump isolation."
- **Section match**: TQ-TWS-CTSS-WI-003 Injector Head Operations Manual · section 7 "Shutdown and isolation" (Coiled Tubing, Rev 4.0, Current, Internal).
- **Field Glossary**: PTW · Permit to Work (Safety & HSE): "A formal written authorisation system ensuring tasks are approved, hazards assessed, and safe isolations in place before starting non-routine or hazardous work."
- **"pump" matches (in force)**: TQ-TWS-FS-WI-002 Pump Unit Operations Manual · Fracturing · Rev 1.0 · Current · Confidential ·
  TQ-TWS-FS-LL-006 Crew safety observation, confined space near pump unit · Fracturing · Rev 2.0 · Current · Restricted ·
  TQ-TWS-WS-SOP-006 Pump-Down Operations SOP · Wireline Services · Rev 3.0 · Review due · Internal.
- Hidden: TQ-TWS-FS-SOP-002 Pump Rig-Up Procedure (Draft, not in force).
- Suggested next step: Ask the Fracturing expert (Ask an Expert, prefilled "I need to isolate a pump").
- Synonym handling (isolate ↔ isolation ↔ shutdown) is a **proposed** deterministic keyword table; label it.

## Area · Coiled Tubing (all three concepts use this area)
Operational segment · 45 documents in the register · Operations side: 39 · 36 in force · 2 active alerts · 1 awaiting approval.
Shelves (Operations): Standards 5 · SOPs 15 · Manuals 8 · Forms & Checklists 2 · Alerts 2 · Lessons Learned 4. Maintenance side adds Maintenance Bulletins.
Records (in force unless stated):
- SOPs: SOP-002 BHA Assembly Procedure (Rev 2.0, Current, Restricted, Arabic) · SOP-004 Emergency Disconnect Procedure (Rev 1.0, Review due) · SOP-005 Pressure Testing Procedure (Rev 2.0, Current, Restricted, Arabic) · SOP-006 CT Unit Rig-Up & Rig-Down (Rev 4.0, Review due, Restricted) · SOP-007 Nitrogen Injection SOP (Rev 1.0, Current, issued 07 Feb 2026, Arabic) · SOP-008 Milling Operations SOP (Rev 4.0, Review due) · SOP-009 Acid Stimulation SOP (Rev 3.0, Current, Arabic) · SOP-010 Fishing Operations SOP (Rev 3.0, Current, Restricted, issued 14 May 2026, Arabic) · SOP-011 Logging While CT SOP (Rev 3.0, Current, issued 10 Jan 2026, Arabic)
- Manuals: WI-001 CT Unit Maintenance Manual v3.2 (Rev 1.0) · WI-003 Injector Head Operations Manual (Rev 4.0) · WI-004 Control Cabin Systems Manual (Rev 4.0, Restricted) · WI-005 CT String Inspection Manual (Rev 3.0) · WI-006 Crane & Rigging Safety Manual (Rev 3.0) · WI-007 Chemical Handling Manual (Rev 2.0) · WI-008 Data Acquisition Manual (Rev 2.0, Restricted) · WI-009 CT Wellhead Equipment Manual (Rev 1.0, Review due)
- Standards: S001 CT Operations Authorization Standard (Rev 3.0) · S002 Equipment Certification Standard (Rev 4.0, Restricted) · S003 Crew Competency Requirements (Rev 1.0) · S004 Environmental Compliance Standard (Rev 2.0) · S006 Incident Reporting Standard (Rev 1.0, Restricted)
- Form: F001 Pre-Job Safety Checklist (Rev 4.0)
- Alerts: ALT-002 New pressure rating for 2-inch CT string, effective immediately (Rev 2.0, Confidential, 13 Apr 2026) · ALT-003 Chemical compatibility update for H2S environments (Rev 2.0, Review due)
- Lessons: LL-001 Near-miss during CT rig-up, lessons from H2 field · LL-002 CT string failure analysis, root cause and prevention (Review due, Restricted) · LL-003 Lessons from coiled tubing fishing operation (issued 16 May 2026) · LL-005 Pressure integrity test failure, field findings (Review due)
- Software assets (not controlled): Orion CT Control System v2.3 · WellPlan CT Simulator v4.1 · CoilScan Inspection Reporter v1.8
- Expert: Coiled Tubing expert. Maintenance questions: Coiled Tubing Maintenance Manager.
- **Proposed equipment grouping** (concept; today derived from titles, would become a register tag):
  Injector head → WI-003 · CT string → WI-005, ALT-002, LL-002 · CT unit → SOP-006, WI-001, LL-001 · BHA → SOP-002 · Control cabin → WI-004 · Wellhead equipment → WI-009 · Nitrogen → SOP-007 · Crane & rigging → WI-006.

## Neighbouring areas for map / landscape views (real)
- Operational segments (count in register): Drilling Services 68 · Safety Services 66 · Fracturing 59 · Coiled Tubing 45 · Inspection 45 · Cementing 36 · Well Testing 32 · Wireline Services 29 · Slickline 3 · Well Completions 3 · Marine Services 3
- Corporate functions: QHSE 58 · Governance, Risk & Compliance 43 · Human Resources 39 · Finance 3 · Information Technology 3 · Supply Chain 3 · Legal 3 · Learning and Development 3 · Commercial & Sales 3 · Geothermal Center of Excellence 3
- Products & Technology: Drilling Solutions CoE 8 · Well Intervention CoE 8 · Well Completions CoE 7
- Company Wide (policies, CEO): 12
- **Proposed grouping "Well Intervention"** (concept, not in today's register): Coiled Tubing (45) · Wireline Services (29) · Slickline (3) · Well Intervention Center of Excellence (8).
  Real topic thread across them: **Pressure control** → TQ-TWS-WS-S003 Pressure Control Standard (Confidential) · TQ-TWS-WS-SOP-007 Pressure Control Equipment Check (Review due) · TQ-SS-SOP-001 Slickline Pressure Control Equipment Rig-Up (Review due) · TQ-TWS-WS-WI-003 PCE Maintenance Manual (Current) · TQ-TWS-CTSS-SOP-005 Pressure Testing Procedure.
  Well Intervention CoE documents: SOP-001 Through-Tubing Intervention Tool Qualification Procedure · SOP-002 Fishing Tool Redress and Test Procedure · SOP-003 Milling Assembly Build and Dress Procedure · WI-004 Coiled Tubing Tractor Operating Manual · WI-005 Downhole Video Tool Product Manual · S001 Intervention Technology Readiness Standard · ALT-007 Tractor Wheel Wear Limits Revised · LL-008 Milling Assembly Failure, North Sea Campaign (all TQ-P&T-WIC-…, Current, Internal).
  "Well Integrity" is NOT an area in the register; do not show it as one.

## Document · TQ-TWS-CTSS-WI-003 · Injector Head Operations Manual (all three concepts)
Rev 4.0 · Current · Internal · Coiled Tubing · Operations · English · Manual (36-month review cycle)
- Issued 30 Aug 2025 (effective) · Approved 28 Aug 2025 · Next review 30 Aug 2028
- Owner: Coiled Tubing segment · Final approver: Segment Director, Coiled Tubing
- Summary: "How to rig up, operate, monitor and shut down the CT injector head safely: chain tension, gripper block inspection, traction pressure limits, and what to do on a chain slip."
- What changed in Rev 4.0: "Traction pressure limits for 2-inch string"
- Approval trail: Filed 19 Aug 2025 by Khalid Al-Otaibi (CT Engineer) → QMS check 24 Aug 2025 by QMS Document Control → Final approval 28 Aug 2025 by Segment Director, Coiled Tubing → Current from 30 Aug 2025
- History: Rev 4.0 Current 30 Aug 2025 · Rev 3.0 Superseded 11 Mar 2024 · Rev 2.0 Superseded 02 Feb 2023 · Rev 1.0 Superseded 14 Jan 2022
  (Employee sees "Current revision only" for earlier files; the dates may be listed.)
- Contents: 1 Scope · 2 Injector head components · 3 Pre-job inspection · 4 Chain tension and traction pressure · 5 Operating limits (2-inch string) · 6 Chain slip response · 7 Shutdown and isolation · Appendix A Inspection record (F001)
- Related: WI-005 CT String Inspection Manual · SOP-006 CT Unit Rig-Up & Rig-Down · ALT-002 New pressure rating for 2-inch CT string (associated technical alert; it changes the limits in section 5) · F001 Pre-Job Safety Checklist (Appendix A)
- Proposed equipment: Injector head · CT string (2-inch)
- Expert: Coiled Tubing expert (Ask an Expert, sample question: "Chain slip on the injector at 4,200 ft — can we continue at reduced traction pressure?")
- Actions (live app): Download PDF · Bookmark · Share (QR + Copy link) · More (Quick reference card with Sunlight mode, Pin offline, Print)
- Preview: the PDF viewer is not connected in the prototype; a cover / page placeholder is fine.
- Trust in 2 seconds: Current · Rev 4.0 · Approved by Segment Director, Coiled Tubing · Effective 30 Aug 2025 · Next review 30 Aug 2028.
- Superseded-state demo (optional, for one small inset): Rev 3.0 viewed directly shows "Superseded. A newer revision exists: Rev 4.0" (live banner wording).
