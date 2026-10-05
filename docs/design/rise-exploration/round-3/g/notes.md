# G · RISE COMMAND

## Design thesis
RISE has no home page: home is a command surface that asks "What do you need?" and carries your context (your area, the active alert, the last thing you opened). Every other screen (search, area, document) is that one bar plus a scope, so people go from a need to an answer they can trust, and never stop to pick a page. Search is deterministic and shows its working: every result says why it matched, what was hidden, and what you may open.

## Signature interaction
Type into the bar and results arrive in typed lanes (Procedures, Work Instructions, Standards, Lessons, Alerts, Experts, Areas, Glossary, proposed Equipment), each row tagged with why it matched ("Title · both terms", "Your area first", "Section heading · isolation"). Arrow keys move through the lanes and Space peeks: a live preview with the trust verdict opens beside the results (on the phone, a half-height sheet), so you never lose the list. Filters are tokens typed into the bar (`status:current`) or tapped as chips, and entering an area or a document scopes the bar (`in Coiled Tubing ›`, `in WI-003 ›`).

## Assumption challenged
That an internal knowledge platform is a website of pages you navigate (home, then area, then list, then document). In G you state a need, and navigation becomes a trail you can step back through (`Alt ←`), shown as a timeline instead of breadcrumbs.

## Why it could win
- Speed with honesty: one surface, keyboard-first on desktop and thumb-first on the phone, and it never pretends. "No approved document is titled for pump isolation" is shown as a result.
- Trust in 2 seconds: the same verdict block (Current, Rev, approver, effective, next review) appears in the peek and on the document, and locks, hidden counts and Review due are always stated in words.
- It scales to 520 documents and 25 areas without new menus, because a scope or a filter token is just one more word in the bar.

## What could fail
- Field users who never touch a keyboard may not find the power features. Tappable chips, lane tabs and sheets carry the phone, but shortcuts still need onboarding.
- A dark, "OS-like" look can feel too much like a developer tool to some leaders, and needs a light theme for bright offices.
- Lane ranking ("your area first") and the synonym table need governance, or people will stop trusting why a result ranked where it did.

## Difficulty to implement
Medium. The register search, filters and role rules already exist. The new work is lane grouping, match-reason strings, token parsing, a filler-word and synonym table, section-heading indexing for section matches, and a preview panel/sheet.

## Motion
- Results and context rows rise in (8px translate and fade, 420ms, staggered by 50ms).
- Peek panel slides in from the right on desktop (24px, 320ms, 120ms delay). On the phone the sheet rises from the bottom (same timing).
- Caret blinks once on load, then stays solid.
- `prefers-reduced-motion: reduce` turns off all entrance animation and the caret blink. Everything renders complete at rest.

## Proposed / concept-only elements
- Equipment lane, equipment facet and tags (Injector head, CT string, CT unit, BHA, Control cabin, Wellhead equipment, Nitrogen, Crane & rigging; High-pressure iron and the others derived from titles). Labelled "Proposed".
- Synonym table isolate ↔ isolation ↔ shutdown and filler-word removal. Labelled "Proposed keyword table".
- "Your area first" ranking, match-reason tags, section-heading match (WI-003 §7).
- Filter-token syntax (`area:`, `type:`, `status:`, `lang:`, `def:`, `in:`), shortcut keys (G then a letter for scopes, 1–7 shelves, D/B/S/A/Q/O/P actions), and the trail timeline. The trail contents are an example session.
- Lane tab counts like "14 of 17" come from applying `status:current` to the 17 strongest matches in content.md (3 Review due set aside). SOP shelf shows the 9 SOPs listed in content.md; the shelf holds 15.
- Routing "Ask the Fracturing expert" is explained by "2 of the 3 pump matches are Fracturing".
