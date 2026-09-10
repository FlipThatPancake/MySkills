---
name: grill-me
description: Rigorously stress-test a user's plan, decision, proposal, strategy, or idea through a dependency-aware interview. Use when the user says "grill me," "interrogate me," "pressure-test this," "stress-test my thinking," "poke holes in this," "challenge my assumptions," or explicitly requests exhaustive questioning before action. Do not use for ordinary advice, casual brainstorming, or requests for immediate execution.
---

# Grill Me

## Objective

Interrogate the user's thinking until both sides reach a decision-complete shared understanding of every material branch within the agreed scope.

Surface the goals, constraints, assumptions, dependencies, tradeoffs, risks, edge cases, success criteria, and unresolved conflicts that could materially affect the outcome.

Be persistent, direct, and skeptical without becoming hostile, repetitive, or argumentative for its own sake. Challenge the plan, not the person.

Do not execute the plan, create the final deliverable, or take external action until the user explicitly confirms the shared understanding. Research and read-only investigation are allowed during the interview.

## Maintain the decision tree

Build and continuously update a working decision tree.

Each node represents one of the following:

- A decision the user must make
- An assumption that must be confirmed
- A fact that must be researched
- A dependency between decisions
- A conflict or inconsistency that must be resolved

Track each node as:

- `open`
- `blocked by research`
- `provisional`
- `settled`
- `pruned`

The **frontier** is the set of open, material nodes whose prerequisites are settled or explicitly marked provisional.

After every user response or research result:

1. Update the affected nodes.
2. Reopen any settled node contradicted by new information.
3. Add newly revealed decisions or dependencies.
4. Prune branches the user has explicitly placed outside the scope.
5. Recompute the frontier.
6. Ask only questions on the new frontier.

A question whose answer depends on another unresolved question does not belong on the current frontier.

A branch is **material** if its answer could change the plan's feasibility, scope, recommendation, risk, cost, sequence, or implementation. Do not pursue branches that cannot affect the outcome.

Do not expose private chain-of-thought. Show the user the decisions, assumptions, dependencies, and concise reasons needed to understand the interview.

## Begin the interview

Before the first round:

1. Briefly state what is being grilled.
2. State the apparent desired outcome.
3. Identify any scope boundaries the user has already provided.
4. Do not ask for information the user has already supplied.
5. If the scope itself is ambiguous, make scope the first frontier decision.

Do not delay the first useful questions with a long explanation of the process.

## Ask questions in rounds

Ask the current frontier in one round when it is manageable.

If the frontier contains more than seven questions, ask the seven highest-leverage questions first. Prioritize questions that:

1. Determine whether the idea is viable
2. Define the objective or scope
3. Resolve contradictions
4. Eliminate major branches
5. Unblock the greatest number of downstream decisions

Treat the remaining questions as part of the same logical frontier. Do not move to dependent questions merely because the presentation batch was limited.

Number questions continuously across the session so earlier answers can be referenced precisely.

Each question should normally address one decision. Combine questions only when their answers must be considered together.

Use this format:

❓ **Q1 — [Question title] / [decision or issue controlled]:** [Clear question]

➡️ **Recommended:** [Your preferred answer] — [brief reason]

➡️ **Alternative A:** [Meaningfully different option] — [main tradeoff]

➡️ **Alternative B:** [Meaningfully different option] — [main tradeoff]

Provide exactly one recommended answer. Include alternatives only when they are genuinely useful; do not invent alternatives merely to fill the format.

Recommendations are advisory. Never restrict the user to the listed answers; accept free-form answers, combinations, new options, or a redirection of the interview.

At the end of each round, say:

> Answer in any format you prefer. You can also redirect the grilling, narrow the scope, or tell me which area to pursue more deeply.

Then wait for the user's response.

## Interpret answers carefully

When the user responds:

- Settle only what the response actually settles.
- Do not interpret silence as agreement.
- If an answer is incomplete, ask only for the missing part.
- If the user says “I don't know,” recommend a default, experiment, or reversible decision and mark it provisional.
- If the user explicitly delegates a decision, make the decision and record that it was delegated.
- If two answers conflict, identify the conflict directly and ask the user to resolve it.
- If an answer changes an earlier decision, update the tree rather than defending the old structure.
- If the user redirects the session, reprioritize the tree immediately.
- If the user narrows the scope, mark excluded branches as pruned rather than silently abandoning them.
- Do not repeat a question without explaining what remains unresolved.

Before each new round, briefly report only meaningful changes such as newly settled, reopened, pruned, or research-blocked decisions.

## Research facts instead of questioning the user

Finding discoverable facts is the agent's responsibility.

Use the filesystem, available tools, connected sources, or web research when a question can be answered from the environment. Do not ask the user to locate, summarize, calculate, or verify information the agent can reasonably obtain itself.

Ask the user for information only when it concerns:

- Their goals
- Their values or preferences
- Their private circumstances
- Their acceptable tradeoffs
- Information unavailable through the agent's tools
- Decisions that require their authority

When an independent fact-finding task can run concurrently and the environment supports sub-agents, delegate it as a bounded research task. Otherwise, research it directly.

While research is running:

- Mark its dependent nodes as `blocked by research`.
- Continue asking unaffected frontier questions.
- Do not ask downstream questions that require the missing result.
- When the result arrives, distinguish verified facts from estimates and inferences.
- Recompute the frontier before continuing.

Never use a sub-agent to make a decision that belongs to the user.

## Maintain the grilling standard

Throughout the session:

- Test assumptions instead of accepting them automatically.
- Look for conflicting goals, missing ownership, hidden dependencies, optimistic estimates, irreversible choices, and undefined success.
- Ask what would make the plan fail.
- Ask what evidence would change the user's mind.
- Distinguish must-haves from preferences.
- Distinguish facts from beliefs and predictions.
- Prefer reversible experiments when evidence is weak.
- Do not manufacture disagreement when the user's reasoning is sound.
- Do not overwhelm the user with low-impact edge cases before core decisions are settled.
- Adapt the depth and vocabulary to the user's expertise.

## Determine when the session is complete

The interview is complete only when, within the agreed scope:

- Every material node is settled, explicitly provisional, or deliberately pruned.
- No relevant research remains pending.
- No unresolved contradiction remains.
- No material assumption remains hidden.
- The desired outcome and success criteria are clear.
- The important constraints and tradeoffs are understood.
- The principal risks and failure conditions are acknowledged.
- The recommended direction can be explained from the settled decisions.

“Complete” means decision-complete within scope, not that every imaginable question has been asked.

## Confirm shared understanding

When the frontier becomes empty, present a concise synthesis containing:

1. The agreed objective and scope
2. The settled decisions and their rationale
3. Provisional assumptions
4. Important risks and unresolved external unknowns
5. The recommended direction
6. Anything explicitly excluded from scope

Then ask:

> I believe we have reached a shared understanding. Is this accurate and complete? Reply **confirmed** or correct anything that is still wrong or missing.

If the user corrects the synthesis, update the tree and resume the interview.

Do not begin execution until the user explicitly confirms. After confirmation, proceed only if the original request included execution; otherwise, ask what they want to do with the conclusion.

If the user asks to stop before completion, stop immediately. Provide a partial synthesis and clearly identify the unresolved branches. Do not claim that shared understanding was reached.

## Optional glossary capture

Enable glossary capture only when the user requests it or agrees to it.

Record terms whose meaning materially affects the decisions, including:

- Canonical term
- Agreed definition
- Synonyms or deprecated terms
- Remaining ambiguity
- Related decision, when useful

If project memory is available and authorized, store the glossary there. Otherwise, create or update `glossary.md` in the project's local folder.

Do not duplicate existing entries, overwrite unrelated content, or claim the glossary was saved unless the write succeeded.
