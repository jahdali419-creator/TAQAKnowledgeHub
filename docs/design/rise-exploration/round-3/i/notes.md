# I · RISE FIELD MODE

## Design thesis
RISE starts from the person standing at the equipment, not the person at a desk. Home asks one question, "What's in front of you?", and answers it three ways: scan a QR, pick the equipment, or type. Whatever you open, a full-width Trust Card comes first, so in two seconds you know whether this document is safe to use on the job.

## Signature interaction
The two-second Trust Card. Scan the QR on a printed procedure, tap equipment, or open a search result, and the first thing RISE shows is a huge verdict: CURRENT with a tick shape, "In force. Safe to use on the job.", Rev 4.0, effective 30 Aug 2025, approved by Segment Director, Coiled Tubing, next review, what changed in Rev 4.0, and the linked alert ALT-002 that changes §5. If someone hands you an old print, scanning it shows an unmistakable SUPERSEDED stop card with one button: "Rev 4.0".

## Assumption challenged
That an internal knowledge system is navigated by organisation (area, shelf, list). Field Mode navigates by what is physically in front of you (the equipment or the paper in your hand) and puts the trust verdict ahead of the content.

## Why it could win
- It answers the field's real question ("can I use this?") in two seconds, in sunlight, with gloves: very large targets (cards of 72–92px and full-width buttons), huge status shapes and words, and a Sunlight contrast mode.
- Equipment-first navigation and QR entry remove most decisions. A technician never needs to know the shelf or the numbering system to reach the right document.
- Offline is designed in, not bolted on. An online/offline indicator on every screen, pinned documents, and a supervisor's job pack prepare the crew before they lose signal.

## What could fail
- Equipment tags and asset QR codes do not exist in the register yet. Until they are curated, the equipment view covers only 12 of 36 documents and leans on shelves.
- Large type and big cards show fewer documents per screen. Office users and QMS may find it slow for browsing and will need the denser views from other directions.
- The job pack, sync state and asset tags add operational process (who prepares packs, who labels equipment) beyond the software itself.

## Difficulty to implement
Medium-High. The trust card, filters and status rules come from data RISE already holds. The new work is offline pinning and sync (service worker, storage), the camera QR flow, equipment tagging, and a high-contrast Sunlight theme.

## Motion
- Trust Card: the verdict word rises in (12px, 500ms), the tick pops in (450ms, slight overshoot), then the three checks fade in one after another (300ms each, 80ms apart) and the facts fade in (350ms). Nothing else animates, so field screens feel instant.
- Scan screen: the scan line sweeps twice (1.6s) and stops.
- Nothing pulses or loops. `prefers-reduced-motion` removes every animation, and every page is complete at rest.

## Proposed / concept-only elements
- Equipment grouping and tags (Injector head, CT string, CT unit, BHA, Control cabin, Wellhead equipment, Nitrogen, Crane & rigging), derived from titles today. Labelled "Proposed".
- Asset-tag QR scanning (document QR codes already exist in the live app).
- Job pack for a crew, the "Synced 06:12" sync state and the "3 offline" count. Pinning offline is a live capability; the pack and sync display are concept.
- "Opens now" filter (hides records the viewer cannot open and states how many were hidden), "My area first" ranking and the Sunlight theme.
- Synonym table isolate ↔ isolation ↔ shutdown and filler-word removal for plain-language queries ("Proposed keyword table").
- Phone tabs are Home · Scan · Equipment · Type. Ask an Expert and Field Glossary are reached from documents and search results in this concept; a production version would keep them first-class.
