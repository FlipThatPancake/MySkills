# Evaluating a skill

Separate structure, activation, execution, and output quality. A pass in one does not establish the others. Choose the smallest evaluation that can expose the changed behavior.

## Cases and scope

For a new workflow, begin with two or three realistic cases: ordinary work, a meaningful boundary, and a likely failure. For revisions, preserve relevant existing cases and add the failure being fixed. Typo-only edits need a diff and structure check, not fresh behavioral runs.

Define each prompt, source fixture, expected result, and important observable checks before tuning the skill. Keep answers, grading rubrics, and prior diagnoses separate from the executing agent. Use deterministic checks for facts, files, schemas, and tool effects; use a short rubric or human review for quality that cannot be reduced to those checks.

Choose boundaries relevant to the workflow:

- Missing input or missing prerequisite; ambiguous or empty tool output.
- A fresh project without the original repository's helpers.
- A user correction, cancellation, or prior decision that changes the next action.
- Repeated execution, partial completion, or a retry after failure.
- A similar request that belongs to another skill.
- A different intended host or model with different capabilities.

Do not add every boundary to every small skill. For a workflow that governs consequential actions, include a realistic temptation to skip its required check while preserving valid user authorization.

## Execute and compare

1. Run the task in a clean, isolated workspace and fresh context. Give the runner the user request, task artifacts, and candidate skill; provide no author commentary about the intended solution.
2. Compare the same task and inputs against no skill for a new skill, or the unchanged previous version for a revision. Keep model, tools, and relevant project context comparable. Ensure the baseline cannot discover the candidate elsewhere.
3. Inspect the outputs and available action traces. Check required tool effects and intermediate checks as well as final artifacts. Distinguish an environmental failure from an instruction failure; either can block a compatibility claim.
4. Fix the underlying class of failure, then rerun affected cases. Keep a held-out or fresh case for broader tuning so the revision is not judged only on examples it was shaped around.

Fresh subagents are useful when available and permitted. Give them only task-local context and the files being exercised; a review request is not an execution test. If they cannot be used, run a separate session or the target's supported evaluation tool. If neither exists, perform static review and clearly mark execution as untested.

Start with a small round. Repeat unstable or consequential cases to check consistency; do not present a single success as a reliability estimate. Use real fixtures or safe mocks for external side effects. Follow the task's existing authorization for evaluation cost and actions; seek a decision only for a material new commitment.

An explicitly invoked skill can be tested for execution quality, but its baseline cannot fail simply because that command does not exist. Give the baseline the equivalent natural task. A baseline that already passes can still reveal regressions or unnecessary overhead; retain it when it serves that purpose.

## Test activation separately

Use the host's actual discovery path and observe whether it loads the skill. Include natural positive requests and difficult near-misses, including requests that resemble neighboring skills. An agent saying “I would use this skill” is a judgment about the description, not an activation test.

For larger description optimization, use a balanced set of varied prompts, repeated runs, and separate development and held-out cases. Roughly twenty prompts can be a useful starting point, not a required minimum. Broaden or narrow the intent category instead of appending failed prompts as keywords.

Test with neighboring descriptions present when collisions matter. Distinguish failure to discover the skill from failure to use it well once loaded. Explicit invocation does not establish implicit activation.

## Structural checks

Use the host's current validator where available. Also check required frontmatter, supported fields, name and description limits, linked resources, placeholders, dependencies, and metadata consistency. For exported folders, check that packaging preserves every necessary file.

A validator checks only the properties it implements. State its scope instead of treating it as proof of workflow quality.

## Evidence and stopping

Keep reusable prompts, fixtures, and assertions with the skill or its repository test area. Keep generated results, traces, and temporary workspaces outside the installed skill. Respect the host's actual evaluation schema; a JSON file of cases is not automatically an executable test suite.

Record the revision, host/model, cases, baseline, observed results, and important limits. Report timing, tokens, or cost only when measured or clearly labeled as an estimate. Do not invent pass rates, activation scores, or billing totals.

Stop when the relevant checks support the intended behavior and further additions have no demonstrated benefit. If target execution remains unavailable, deliver the source with that limit; do not claim it was tested on that target.
