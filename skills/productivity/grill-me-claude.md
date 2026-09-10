---
name: grill-me
description: Grill the user in a relentless, dependency-aware interview about a plan, project, or list of issues until you reach a shared understanding. Use when the user says "grill me". If the user shares a plan without asking to be grilled, you may offer a grilling session in one line, but don't start one unless they accept.
---

# Grill me

Interview the user relentlessly about their plan until you both reach a shared understanding. Challenge it: press on vague answers, point out contradictions with what's already settled, ask what would make it fail. Don't manufacture disagreement when their reasoning is sound. Don't act on the plan until the user confirms the shared understanding.

## Prepare first

Read everything available (the plan, the issue list, the existing project) and do the organizing work before asking anything: group issues that overlap, conflict, or depend on each other, and find the gaps. Model it as a decision tree, where each decision branches into the decisions that depend on it.

Open with a brief map: what you read, how things group, the conflicts and gaps you found, and where you'd start. Refer to the user's issues by their numbers. If there are many plausible starting points, offer the main branches as choices instead of picking one. If the session looks big (a new project, a long issue list), ask whether they want one question at a time or rounds of up to 5. Then ask the first question in the same message.

## Walk the tree

Each branch has a frontier: the questions answerable now because nothing they depend on is still open. Pick the branch yourself unless the user steers. Within a frontier, start with the smallest, most concrete decisions; the user sees the bigger picture more clearly once details are settled. Exception: raise first anything that could kill or reshape the whole plan.

Ask one question at a time by default. In round mode, keep rounds short: any answer can change what comes next, so drop or rewrite queued questions when one does.

After each answer, update the tree. "I don't know" gets a reversible default, marked provisional. If an answer changes something fundamental (the goal, the scope, a core issue), rebuild the tree and tell the user which settled decisions are reopened. Don't list a question's dependencies unless the user asks or tries to jump to a question that's still blocked.

## Find facts yourself

Facts are your job; decisions are the user's. If a question needs something discoverable from files, tools, or the web, look it up rather than asking. With sub-agents, dispatch lookups and keep asking questions that don't depend on them; without, look it up before asking.

## Ask clearly

Every question must make sense on its own, without scrolling back. Use plain language, not AI or insider jargon, and define any technical term you need. Give context first: which issue or branch it belongs to, what's at stake, and the risk it guards against, especially after switching branches. Offer 3–5 options (fewer if only a few are feasible; never pad) and mark one or two as recommended. Describe each option by what happens if it's chosen. The user can always answer in their own words.

Use the platform's question tool (e.g. AskUserQuestion) when there is one, with the context in the message above it. Otherwise:

❓ **Q3 — [Question]**
_[Context: issue/branch, what's at stake, the risk]_

1️⃣ ⭐ **[Option]** — [reasons, implications, tradeoffs]
2️⃣ **[Option]** — [main tradeoff]
3️⃣ **[Option]** — [main tradeoff]

Number questions across the whole session so replies like "Q3: 2" are unambiguous.

## Commands

The user can say at any point:

- **print tree**: show the whole tree, marking each node settled, provisional, open, waiting on a lookup, or pruned. If it's large, offer it as an artifact or other rendered view where the platform has one.
- **list questions**: show the answerable questions on every branch. The user can jump to any; land on that branch's first answerable question, never a deeper one that's still blocked.
- **digest**: take in what they just sent (a partial answer, new context, new issues), update the tree, and acknowledge in one line. Don't ask the next question; wait for their next message.
- **wrap up**: pause. Summarize what's settled, provisional, and still open, then ask whether to save it.

## Saving and finishing

Save only when the user says yes, since they sometimes want it done their own way. With local file access, offer `grill-decisions-<YYYY-MM-DD>-<topic>.md`. If they later point you to a saved file, resume from its open questions.

Offer a `glossary.md` (or project memory) once, when the first project term worth pinning down comes up, and again at wrap-up if many came up.

When no branch has open questions, give the wrap-up summary and ask the user to confirm you've reached a shared understanding. If they correct it, update the tree and keep going.
