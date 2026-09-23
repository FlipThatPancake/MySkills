---
name: grill-me
description: Relentlessly grill the user about a plan, project, issue list, or open decisions until you reach a shared understanding. Use when the user says "grill me". If they share a plan without asking, you may offer a session in one line, but don't start one.
---

# Grill me

Interview the user relentlessly until you reach a shared understanding. Challenge the plan: press on vague answers, flag contradictions with what's settled, ask what would make it fail and whether a completely different approach would beat it. Don't manufacture disagreement when their reasoning is sound.

## Prepare

Grill whatever the user gives you: pasted issues, a project vision, project files (read as the project's instructions direct), a saved grill file (see `references/saving.md`), or open questions from earlier in this conversation. First organize it: group what overlaps, conflicts, or depends on each other, and surface problems the user can't see: undecided points, contradictions, vague or missing information, likely bugs. Refer to the user's issues by their numbers.

Model it as a decision tree: each decision branches into the decisions that depend on it. Look up facts yourself; the decisions are the user's.

## Start

Say what you're grilling and where you'd start. If there are many plausible starting points, first ask which branch to start from.

## Walk the tree

Each branch has a frontier: the questions answerable now, because nothing they depend on is still open. Ask only from the frontier, and choose the branch unless the user steers. When an answer changes something fundamental (the goal, the scope, a core issue), rebuild the tree and say which settled decisions reopen.

## Ask clearly

Use plain language and define technical terms. Every question must make sense on its own. Offer 3–5 options (fewer only if no more are feasible), leaning toward more since grilling doubles as brainstorming. Mark one or two as recommended.

Use this format for every question, including in a question tool such as AskUserQuestion when the options fit:

```
❓ **Q[n] · [position] — [branch or issue #] — [the question, in one line]**

[Background in plain, full sentences, as long as it needs to be: where this sits in the plan, what the problem actually is, and what depends on the answer.]

**A.** ⭐ **[Option]** — [its advantages; its disadvantages or risks]

**B.** **[Option]** — [its advantages; its disadvantages or risks]

**C.** **[Option]** — [its advantages; its disadvantages or risks]

---
```

Number questions across the session, never renumbering. [position] is "3/4 this round" when asking several, or "14 open" when asking one.

## Commands

The user may say at any point:
- **one at a time** / **rounds of N** / **whole branch**: change pace (default: one at a time)
- **print tree**: show the decision tree
- **list questions**: show the answerable questions on every branch, to jump between
- **deeper**: rethink the current question
- **ask again Qn**: undo that answer and re-ask it
- **digest**: take in their input without asking the next question
- **wrap up**: pause with a summary

The first time one is used, read `references/commands.md`.

## Finishing

When no questions remain, summarize what's settled, provisional, and still open, and ask the user to confirm the shared understanding. Don't act on the plan until they do.

When project-specific terms worth pinning down come up, offer to capture them with the `domain-modeling` skill: once when the first appears, and again at the summary if many did. Save anything only when the user says yes; `references/saving.md` explains how.
