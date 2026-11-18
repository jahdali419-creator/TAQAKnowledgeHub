# How we handle problems in RISE

**Status: CURRENT (18 November 2026).** One page. Plain language.
Written for everyone who uses RISE, not only for engineers.

---

## Where problems go

**One place: the Issues list on GitHub.**

https://github.com/jahdali419-creator/TAQAKnowledgeHub/issues → **New issue** →
**Report a problem**

Not Teams. Not email. Not a message to Mohammed.

Those are fine for talking about a problem, but they are a bad place to *keep*
one. A message scrolls away in a day. A list does not. Before this page existed,
RISE had **zero** problems recorded anywhere — not because there were none, but
because there was nowhere to put them.

## What to report

Anything that looks wrong, does not work, or confused you. You do not need to be
sure it is a bug. "This confused me" is a real report and often the most useful
kind.

Three lines are enough. The form asks for more, but short answers are better than
no report.

## The three levels

The form asks how bad it is. Pick honestly — this decides what gets fixed first.

| Level | Means | Example |
|---|---|---|
| **Blocker** | You cannot do your work at all | The upload button does nothing, so I cannot file my case |
| **Major** | It is wrong, but you found a way around it | The dashboard count is wrong, but the list below it is right |
| **Minor** | It looks wrong, nothing is broken | The text is cut off on my phone |

Everybody thinks their own problem is a blocker. It usually is not. Keeping
"blocker" for real blockers is what makes the word mean something.

## What happens after you report

1. It appears in the list, with a number.
2. It is read and given a level, if the reporter did not set one.
3. **Blockers** are looked at first, then majors, then minors.
4. When it is fixed, the issue is closed with a note saying what changed.
5. You get told, because GitHub tells the person who opened it.

Nothing is deleted. A problem that is decided *not* to fix is closed with the
reason written down, so the next person does not re-report it.

## What already exists — do not re-report these

Two lists are already written and do not need issues raising for them:

- **`docs/design-audit/`** — 94 design findings (UX-001 to UX-094), 14 of them
  urgent. Measured, with evidence.
- **`docs/handover/16-OPEN-IT-DECISIONS.md` and `17-OPEN-BUSINESS-CONFIRMATIONS.md`**
  — 22 open IT decisions and 19 open business confirmations.

If what you found is already in one of those, say so in your report and quote the
number. That is still worth doing: it tells us the problem is real for a user and
not only on paper.

## What RISE is today, so expectations are fair

RISE is a **working prototype**. Some things are not bugs — they are not built
yet:

- **Signing in is simulated.** You pick a role from a menu; there is no password.
- **Your work is saved in your own browser only.** If you file a case, nobody else
  sees it. Clearing your browser clears it.
- **The permissions are a specification, not a security control.** `roles.js` says
  so in its own first lines.

A real server with real sign-in and shared data is what the Data and Technology
team is being asked to build. See `docs/handover/`.

Please **do** still report these if they surprise you. "I did not expect my case
to disappear" is useful evidence for how the real system must behave.

---

## For whoever maintains the list

**Three labels to create once** (Issues → Labels → New label). The form records
the level as a field, so the list works without them — labels only make the list
easier to sort by colour:

| Label | Suggested colour |
|---|---|
| `blocker` | `#C8102E` |
| `major` | `#FD691D` |
| `minor` | `#968C83` |

**One setting worth turning on.** Today a failing test does not stop a deployment:
there is no branch-protection rule on `main`. The tests exist and are good — 4,405
of them in 47 files — but nothing makes anyone look. On 3 November they went red
and it was not noticed until 18 November, because GitHub changed their build
machine.

A repository admin can fix this in Settings → Branches → add a rule on `main` →
require the `playwright` check to pass. **Only an admin can do it.**
