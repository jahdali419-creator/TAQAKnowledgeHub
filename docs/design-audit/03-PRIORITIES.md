# RISE — Design Audit · Part 3: Priorities

81 findings (UX-001 … UX-081). This part ranks them. Nothing here is new —
every entry points back to a numbered finding in Part 2, where the evidence sits.

**Superseded in part, 5 November 2026.** The Field Knowledge review (Part 6) added
UX-082 … UX-094, four of them P0, and Part 5 carries them in a new Phase 2F. The
rankings below still hold for UX-001 … UX-081; read them together with Part 6 §7.
Two entries are affected directly: **UX-041** is closed as working as intended
(the owner has confirmed the Director-per-segment model, and Part 6 §5 verifies
the prototype already enforces it), and **UX-053** ("no scoped search") is refined
by UX-091 — search does have a segment filter, it simply cannot be entered
pre-scoped.

`[C]` confirmed · `[P]` proposal · `[A]` assumption.

---

## A. Top 20 high-impact improvements

Ranked by *how much the product changes for a real user per unit of work*, not by
severity alone. Rows 1–9 are the user-visible P0 set — each is something a person
can watch going wrong today. Row 10 is the tenth P0 and the highest-leverage item
in the whole audit, even though no user will ever see it directly.

| # | ID | Improvement | Impact | Effort | Who it helps |
|---|---|---|---|---|---|
| 1 | UX-043 `[C]` | Make the director's hero stat agree with the queue below it. Today the header says **1 PENDING** above a panel reading **"All caught up!"** | H | S | Director, Manager |
| 2 | UX-035 `[C]` | Strip Download PDF / Bookmark / Share from the viewer's "document not found" state | H | S | All |
| 3 | UX-023 `[C]` | Resolve the two competing 1·2·3 sequences on the upload screen into one | H | S | Employee, Manager |
| 4 | UX-065 `[C]` | Fix the three avatar-initial colour pairs that fail AA (3.01:1, 3.97:1, 4.50:1) | H | S | All |
| 5 | UX-067 `[C]` | Give every icon-only control an accessible name | H | S | All |
| 6 | UX-078 `[C]` | Hide the honour board until three real contributors exist | H | S | All |
| 7 | UX-006 `[C]` | Move the role-switch chips out of production chrome into a dev-only affordance | H | S | All |
| 8 | UX-044 `[C]` | Demote "Delegate your authority"; lead the director page with the queue | H | S | Director |
| 9 | UX-040 `[P]` | Make the QMS needs-attention card actionable instead of informational | H | S | QMS |
| 10 | UX-081 `[C]` | Adopt the token system that already exists in `techhub.css`. Every page links it; only `glossary.html` uses it | H | M | All |
| 11 | UX-001 `[C]` | Collapse 24 rendered text sizes onto an 8-step scale | H | M | All |
| 12 | UX-003 `[C]` | Lift the shared chrome out of 19 inline `<style>` blocks into one stylesheet | H | L | All |
| 13 | UX-010 `[P]` | Systematise the status vocabulary into one badge component | H | M | All |
| 14 | UX-030 `[C]` | Reuse the Master List's count-bearing sidebar as the app's navigation pattern | H | M | All |
| 15 | UX-020 `[C]` | Give an employee a personal starting point on Home | H | M | Employee |
| 16 | UX-022 `[P]` | Add a "my documents" view — what I filed, where it is, what came back | H | M | Employee |
| 17 | UX-032 `[P]` | Make the register's checkboxes do something (bulk actions) | H | M | QMS |
| 18 | UX-045 `[P]` | Approve / return from the queue row | H | M | Director |
| 19 | UX-033 `[C]` | Break the 16,109px glossary into something navigable | H | M | All |
| 20 | UX-057 `[C]` | Keep Upload reachable in the mobile topbar | H | S | Employee |

**Why these 20 and not others.** Rows 1–9 are visible defects or launch
embarrassments at small effort. Rows 10–14 are the five that make every
subsequent change cheaper — and UX-081 changes the character of that work
entirely: it is adoption, not design. Rows 15–18 are the "this product has no
desk for me" gap, which is the single largest structural weakness: Home is an
index, and neither an employee nor a controller nor a director has a page that
opens on their own work.

**UX-029** (saved views for the register) is the strongest finding that just
missed this list; it is `H / M / P1` and belongs in the same phase as UX-032.

---

## B. Top 15 quick wins

Small, low-risk, visible. All are `S` effort and none touches a workflow,
a permission or data.

| # | ID | Win | Why it is cheap |
|---|---|---|---|
| 1 | UX-065 `[C]` | Darken three avatar background tones to clear 4.5:1 | Three colour values |
| 2 | UX-067 `[C]` | Add `aria-label` to the unnamed controls | Attribute-only |
| 3 | UX-068 `[C]` | Label the one unlabelled input | One attribute |
| 4 | UX-043 `[C]` | Point the hero stat at the same query as the queue | One expression |
| 5 | UX-044 `[C]` | Reorder two cards on the director page | Markup order |
| 6 | UX-035 `[C]` | Hide three buttons in the viewer's error branch | One conditional |
| 7 | UX-078 `[C]` | Gate the podium on a real-contributor count | One conditional |
| 8 | UX-016 `[C]` | Raise mobile segment tabs from 34px to 44px | Padding |
| 9 | UX-017 `[C]` | Grow the 24px copy-link target to 44px | Padding |
| 10 | UX-060 `[C]` | Add the existing back-to-top control to the long routes | Reuse |
| 11 | UX-064 `[C]` | Delete the duplicate skip-link implementation | Deletion |
| 12 | UX-070 `[C]` | Extend `prefers-reduced-motion` to the older animations | One media query |
| 13 | UX-002 `[C]` | Snap 22 radii onto four tokens | Find-and-replace with review |
| 14 | UX-013 `[C]` | Lighten the "Company policies" panel so it stops out-weighing the beds | Two rules |
| 15 | UX-036 `[C]` | Suppress "Not recorded ×4" and the clause codes in the employee view | One conditional |

**Deliberately not in this list** even though they are `S`: UX-006 (role chips)
and UX-041 (director cross-area gate) are small to *change* but both are policy
decisions, not styling — they need your call first.

---

## C. Top 10 mobile improvements

Measured at 390×844 and 360×900. Mobile is the app's strongest surface — see
UX-056 — so these are refinements on a working base, not a rescue.

| # | ID | Improvement | Measured fact |
|---|---|---|---|
| 1 | UX-016 `[C]` | Segment tabs to 44px | 34px tall at 390px wide |
| 2 | UX-057 `[C]` | Keep Upload in the mobile topbar | Topbar collapses to logo + theme + hamburger |
| 3 | UX-017 `[C]` | 44px copy-link target | 24px wide |
| 4 | UX-033 `[C]` | Paginate or section the glossary | 13,619px tall on mobile |
| 5 | UX-034 `[C]` | Shorten the case list's first screen | 6,282px tall on mobile |
| 6 | UX-018 `[C]` | Reduce what sits above the segment fold | 2,067px with 7 tabs before content |
| 7 | UX-024 `[C]` | Cut the upload hero so the form starts sooner | 340px before the first field |
| 8 | UX-060 `[C]` | Back-to-top on every route over ~4,000px | Several routes exceed it |
| 9 | UX-058 `[C]` | Decide whether the level chip should really vanish under 1280px | Hidden by a breakpoint |
| 10 | UX-059 `[P]` | Consider a bottom bar for the four actions a field user repeats | Proposal, not a defect |

---

## D. Top 10 premium design enhancements

These are the ones that change how the product *reads* rather than what it does.
Each is grounded in a measurement, not in taste alone.

| # | ID | Enhancement | The measurement behind it |
|---|---|---|---|
| 0 | UX-081 `[C]` | **Use the system that exists** — the precondition for rows 1–4 | 9 of 10 sampled pages reference `var(--th-*)` zero times |
| 1 | UX-001 `[C]` | One type scale | 24 sizes, including 10/11/12/13 and 17/18/19 |
| 2 | UX-079 `[C]` | One ink ramp | 7 near-identical greys, 6 near-identical dark teals |
| 3 | UX-080 `[C]` | One elevation scale | 177 shadowed elements across 18 routes; 39 on glossary |
| 4 | UX-002 `[C]` | One radius scale | 22 distinct radii |
| 5 | UX-010 `[P]` | One status badge | Status is spelled differently per surface |
| 6 | UX-051 `[C]` | Charts that carry their own labels and units | Small, unlabelled charts on analytics |
| 7 | UX-072 `[C]` | One empty-state component | Quality varies from excellent to bare |
| 8 | UX-012 / UX-070 `[C]` | Motion discipline — one curve, one duration pair, honoured reduced-motion | Per-row stagger on Home; older animations ignore the media query |
| 9 | UX-066 `[C]` | Decide where gradients are allowed | 23–42 text nodes per page sit on gradients and cannot be contrast-verified |
| 10 | UX-013 `[C]` | Weight hierarchy — panels should not out-weigh the content they introduce | Policies panel is heavier than the beds beneath it |

Items 1–4 are the whole of "it looks expensive". They are also the cheapest four
things on this list, and they are what the design system in Part 4 delivers.

---

## E. Design system opportunities

Ranked by how much each removes future work.

1. **Adopt the tokens that are already there.** (UX-081, and therefore UX-001,
   002, 079, 080.) `techhub.css` ships a type scale, ink ramp, spacing scale,
   radii and three elevations on every page. One page uses them. This is not a
   design task, it is a migration task, and it is the cheapest route to every
   "premium" item in section D.
2. **One shared stylesheet for the chrome.** (UX-003.) Today a change to the skip
   link, the topbar or a card has to be made 19 times; the audit found the skip
   link already implemented twice with different values, which is what drift looks
   like before anyone notices.
3. **A status badge component.** (UX-010.) Draft / Submitted / With QMS /
   Awaiting Director / Published / Returned / Overdue — seven states, one
   component, one colour mapping.
4. **A table/register kit.** (UX-028, 031, 032, 039.) Master List already *is*
   this pattern, done well. Extract it rather than design it.
5. **A filter bar.** (UX-028.) Five controls in a row is the symptom; the fix is
   one component with overflow behaviour and a visible active-filter state.
6. **An empty / error / loading triplet.** (UX-035, 038, 071, 072.) Every data
   surface needs all three, and the viewer's error state proves what happens when
   one is improvised.
7. **A page shell.** (UX-004, 005, 009, 011.) Header, breadcrumb, title, actions,
   body — one shell would resolve the two navigation models and the
   now-you-see-them breadcrumbs at once.
8. **A count-bearing sidebar.** (UX-030.) Already built, in one place.
9. **Icon-only button primitive** with the label baked in. (UX-017, 067.) The
   accessible-name failures and the sub-44px targets are the same component
   missing twice.
10. **Chart primitives.** (UX-049, 050, 051.) Axis, legend, unit, empty state.

---

## F. Improvements to avoid

Things a reviewer would plausibly recommend that I am explicitly recommending
**against**.

1. **Do not replace the landing page with a dashboard.** You have ruled this out,
   and the audit agrees independently: the segment beds are the only place in the
   product where all 25 areas are legible at once, and they are the one screen
   with a clear point of view.
2. **Do not remove the expand/collapse beds**, and do not re-introduce the
   exclusive accordion. The open-by-default change was a correct call.
3. **Do not adopt a component framework.** No router, no build step, 19 standalone
   documents — that is a deliberate shape, and it is why there are zero console
   errors. Tokens and a shared stylesheet get you 90% of the consistency for none
   of the migration risk.
4. **Do not chase the dark theme yet.** `data-taqa-theme="dark"` exists and was
   not swept (Part 1, gap 7). Shipping a half-verified dark theme is worse than
   not offering one.
5. **Do not add skeleton loaders everywhere.** (Against a literal reading of
   UX-071.) The data is local and renders instantly; skeletons would be theatre on
   most routes. They belong only where a real network call appears.
6. **Do not add a command palette before the sidebar and scoped search exist.**
   (UX-008 is a `[P]` for a reason.) A palette is how power users move through a
   structure they already understand; the structure comes first.
7. **Do not "fix" the gating copy by making it shorter.** (Against a literal
   reading of UX-007.) The refusals are unusually well written. The problem is the
   full-viewport takeover, not the words.
8. **Do not normalise the Master List down to the other pages.** It is the
   reference, not an outlier.
9. **Do not introduce purple, pink or violet accents.** Three avatar colours
   currently sit outside the TAQA palette; the correct direction is to pull them
   in, not to formalise them.
10. **Do not soften the EXAMPLE labelling.** (UX-077.) It is a strength. The honour
    board problem (UX-078) is that it celebrates fictional people, not that it
    admits they are examples.
