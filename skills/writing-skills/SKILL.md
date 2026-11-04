---
name: writing-skills
description: "Use when creating, revising, generalizing, or evaluating agent skills and their SKILL.md files, turning a repeatable workflow into a skill, improving skill activation or behavior, adapting a skill for Claude Code and ChatGPT/Codex, or editing project instructions that load or share a skill's workflow. Excludes ordinary task execution and unrelated edits to app or repository instructions."
---

# Writing skills

Add the task-specific expertise, user preferences, and constraints that improve results beyond the host agent's existing capabilities. Prefer its existing planning, tool use, approval, validation, and installation behavior when sufficient; add a procedure in those areas only when the task requires something different.

## Decide what the skill adds

Ground the skill in the user's goal, domain expertise, examples, or observed failures. Identify what the agent would otherwise miss; do not require a failure or a formal intake process before a useful skill can be written.

A user's request for the skill is enough grounding. If the idea is your own and you can name no failure it fixes, say so instead of writing it.

For each proposed instruction, consider:

- Does the current host already provide this behavior? If so, omit it unless a task-specific difference matters.
- Is this a durable preference, domain decision, required output, or known failure the skill needs to address?
- Would stating the desired result leave useful freedom? Prescribe the method only when the method is necessary for correctness or a stated preference.

A domain workflow can be valuable: one algebra step at a time may be essential to a teaching skill. Generic mandates to plan, inspect files, use particular tools, delegate, or run a fixed test cycle usually belong to the host. Judge the need in context rather than banning workflows or assuming every host has the same capabilities.

## Write useful guidance

- Give the skill one recognizable job. Its description should identify the capability and activation boundary; the body should supply the missing expertise.
- In a description, list each trigger once, most common first. Never summarize the steps, because an agent that reads a summary follows it and skips the body.
- State domain decisions, preferences, and required outputs concretely. Use conditional rules for meaningful branches, and examples where they resolve ambiguity.
- State the wanted behavior. Use "never" or "don't" only for a hard guardrail, and pair it with what to do instead.
- Give an exception its own "if" line. "X unless it matters" invites the agent to argue its way out.
- Match strictness to the consequence of getting that part wrong. Keep exact steps or schemas when necessary; leave judgment where several methods work.
- End a step with a check the agent can verify ("every changed file named", not "understood").
- Use complete sentences and consistent terms. Remove generic advice, duplication, and rules whose original reason no longer applies. Explain non-obvious constraints briefly.
- Prefer a well-known term over a sentence that describes it. Leave out what a file or command already shows; write the convention or trap that no file shows.
- Keep reusable knowledge separate from incidental project names, helpers, and paths. Preserve dependencies the task genuinely requires and identify their prerequisites.
- When improving an existing skill, preserve useful user preferences and expertise. Treat repeated failure as a reason to examine the cause, not automatically to add another prohibition.

## Keep the package small and portable

Start with the smallest useful package. Add references for conditional detail, scripts for repeated or fragile operations, and assets for material used in the output. Link resources from the main file with a clear reason to load or run them, never from another resource. A resource over 100 lines opens with a contents list. Keep each rule in one authoritative place.

Separate the shared procedure from host-specific metadata and capabilities. Do not require one host's tools or assume a portable folder guarantees identical execution. Keep sibling project instructions as a loader for the canonical skill rather than another copy of its workflow.

## Judge whether it helps

Use the host's existing authoring and verification facilities where suitable. Add evaluation for a specific uncertainty: activation, behavior, output quality, portability, or regression. Match the effort to the claim and change rather than requiring the same test process for every skill.

When assessing benefit, compare representative outcomes with the previous version or the host's existing behavior where feasible. Check for useful improvements as well as added work, lost flexibility, and unnecessary constraints. A successful example alone does not establish superiority or cross-host reliability.

## Supporting references

Read only what the task needs:

- [patterns.md](references/patterns.md): choosing between outcome guidance, a conditional rule, a template, and an exact procedure.
- [evaluation.md](references/evaluation.md): designing an evaluation when the host's normal checks leave a relevant question unanswered.
- [platforms.md](references/platforms.md): shared format, host differences, and project loaders.
- [sources.md](references/sources.md): official guidance behind these choices; recheck changing platform details when implementation depends on them.
