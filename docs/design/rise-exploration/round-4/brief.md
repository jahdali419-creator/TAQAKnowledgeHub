# RISE · Round 4 · Professional directions J, K, L

Design exploration only, on `design/rise-exploration`. Nothing here touches the app, `main`, tests or production.
Folders: `round-4/j/`, `round-4/k/`, `round-4/l/`.

## The owner's brief (intent)
No more experimental or futuristic concepts. Three strong, polished, realistic product directions that a very good
professional design team would propose after studying RISE, any of which could become the final interface.
All three must feel modern, premium, clean, professional, technical, easy to use and right for TAQA, and work for
employees, technicians, managers and QMS users. Do not try to shock. Do not make something strange to be different.

The three must differ in design PHILOSOPHY, not colour: navigation structure, page composition, density, typography,
card usage, information hierarchy, document presentation, search presentation, use of desktop width, mobile
navigation, side panels, contextual information, visual emphasis. Same layout with different colours is a failure.

### J · Clean Enterprise Product
Simplicity and usability as the highest priority. Refined enterprise SaaS quality (Stripe / Linear / Notion / modern
Atlassian level, copying none of them). Very clean, restrained colour, excellent typography, precise spacing, minimal
noise, clear hierarchy, strong search, elegant navigation, fast scanning. Few cards; whitespace used intelligently.
### K · Technical Operations Hub
Built around oil & gas, maintenance and operations. A serious technical knowledge system, not an office portal.
Stronger operational hierarchy, technical areas clearly visible, status instantly recognisable, revision and approval
emphasised, area and discipline navigation, clear document types, metadata where useful, efficient dense desktop,
simplified mobile. Premium and modern: not old industrial software, not SAP.
### L · Editorial Knowledge Platform
RISE as a premium knowledge publication; the content feels important. Strong typography, excellent document titles,
clear categories, large content areas, restrained cards, editorial spacing, strong document previews, sections that
guide the eye. Home says "Here is the most important knowledge available to you", not "12 dashboard widgets".
Slightly more sophisticated visually while remaining extremely usable.

## Brand
RISE belongs to TAQA without looking like the corporate website. TAQA colours mainly for emphasis, important states,
active navigation, selected areas and key actions. No orange gradients over the interface; not every button orange.
The RISE logo needs room to feel like a real internal product. Logo files: `../../kit/brand/` (`rise-logo.png`,
`rise-logo-reverse.png`, `rise-lockup-header.png`, `rise-lockup-header-reverse.png`, `rise-icon.png`); never redraw or
recolour. Fonts: `../../kit/fonts.css` → `'BwGradual'` 300/400/700/800 and `'Inter'` 300–700 (no other fonts; no network).
Colours: logo ink `#002B32`, pillar teal `#013F4E`, TAQA Teal Green `#005D63`, Legacy Teal `#00BBB6`, logo cyan `#00ADC2`,
logo orange `#FD5805` / TAQA Brave Orange `#FD691D` (accent only, small), Crimson `#C8102E` (critical only). Status colours
are separate from brand (Current green, Review due amber, Superseded/Obsolete muted) and always word + shape.

## Navigation (each concept chooses its own structure; they must differ)
Suggested split (the designer may improve it, but the three must stay different):
J = left sidebar navigation · K = top bar + area/discipline navigation (hybrid) · L = top navigation, editorial.
Every concept keeps these destinations reachable on desktop AND phone: Home, Areas, Search, Saved, Ask an Expert,
Field Glossary. Role-specific: Upload is available to the Employee (the live app lets employees file documents);
Master List and QMS Workspace appear only for QMS / Segment Director / Maintenance Manager (they are absent for the
Employee shown here; you may show a role switcher "Viewing as Employee"). Notifications and the role indicator stay.
Mobile navigation must be practical, comfortable (44px+ targets, 16px+ body), and never overloaded.

## Screens (each ONE responsive file, designed for both 1440×900 and 390×844)
`home.html` · `search.html` · `area.html` · `document.html`. No Upload, QMS, Glossary or Ask screens this round.
- Home must not be "Welcome + four KPI cards + recent + quick links". It helps answer: What knowledge do I need? What
  changed? Where should I go? What is relevant to my area? What have I recently used or saved? Useful, not decorative.
- Search: input, useful filters, result count, document type, area, status, revision where relevant, clear hierarchy,
  very fast scanning. Avoid overly complex screens. Show query `pressure test`.
- Area: a meaningful destination, not just a list: overview, document categories (shelves), latest updates, important
  documents, procedures / manuals / bulletins, experts. Use Coiled Tubing (Operations side).
- Document: WI-003. Within seconds the user knows title, type, status, revision, owner, effective date, area and whether
  it is the correct current document. The document itself (preview) stays the primary focus; metadata supports it.
  Position metadata, preview, related, history, actions and saved state deliberately.

## Content (identical in J, K, L)
Use `../round-3/content.md` (viewer, figures, the `pressure test` search, Coiled Tubing area, the WI-003 document,
classification and status rules, proposed items). Plus these real items for Home:
- Viewer: Faisal Al-Ghamdi · Field Supervisor · Employee · home area Coiled Tubing · Operations.
- **What changed recently in Coiled Tubing** (real issue dates, newest first): TQ-TWS-CTSS-LL-003 Lessons from coiled tubing
  fishing operation (Rev 4.0, 16 May 2026) · TQ-TWS-CTSS-SOP-010 Fishing Operations SOP (Rev 3.0, 14 May 2026, Restricted) ·
  TQ-TWS-CTSS-ALT-002 New pressure rating for 2-inch CT string (Rev 2.0, 13 Apr 2026, Confidential, active alert) ·
  TQ-TWS-CTSS-SOP-007 Nitrogen Injection SOP (Rev 1.0, 07 Feb 2026) · TQ-TWS-CTSS-WI-008 Data Acquisition Manual (Rev 2.0,
  29 Jan 2026, Restricted) · TQ-TWS-CTSS-SOP-011 Logging While CT SOP (Rev 3.0, 10 Jan 2026).
- **Elsewhere in TAQA** (real): TQ-TWS-FS-S002 High Pressure Operations Standard · Fracturing · Rev 2.0 · 18 Aug 2026 · Restricted.
- **Saved** (example bookmarks, label as the viewer's saved items): WI-003 Injector Head Operations Manual · F001 Pre-Job Safety
  Checklist · SOP-009 Acid Stimulation SOP.
- **Recently opened** (example): WI-003 · SOP-005 Pressure Testing Procedure · ALT-002.
- Active technical alerts in your area: ALT-002 (Current, Confidential) and ALT-003 Chemical compatibility update for H2S
  environments (Review due). Company-wide: 33 active technical alerts.
- Register: 520 in force · 25 areas · 190+ glossary terms · 14 Arabic translations.
Never invent other documents, numbers, people or areas. "Well Integrity" is not an area. Experts are role titles.
Restricted/Confidential appear with a lock and "request access through QMS". Superseded/Obsolete never appear in search.
Equipment tags and the "Well Intervention" grouping are proposals: use sparingly, if at all, and label them.

## Quality bar
Realistic, polished, production-credible. Review critically for: excessive empty space, unnecessary cards, weak
typography, generic dashboard look, poor hierarchy, awkward desktop stretching, crowded mobile, inconsistent spacing,
weak TAQA branding. Desktop 1440 must use width deliberately (no stretched lines, no dead right half). Phone is designed
for the phone, not shrunk. WCAG AA contrast, visible focus, status readable without colour. Static HTML/CSS, inline SVG
icons (one consistent set), CSS custom properties, no network, no JS needed. Every page complete at rest.

## notes.md (per concept, exactly these sections, short)
- Design philosophy (max 3 sentences)
- Best feature (1 sentence)
- Main weakness (1 sentence)
- Best suited for (1 sentence)
- Navigation (desktop and mobile, how every destination is reached)
- Tokens (colours, type scale, spacing, radius, density)
