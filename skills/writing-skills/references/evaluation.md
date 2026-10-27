# Evaluating a skill's added value

Use this reference when a question about the skill remains after the host's normal checks, or when the user requests evaluation. It offers methods, not a mandatory test cycle.

## Match evidence to the question

| Question | Useful evidence |
| --- | --- |
| Does it activate for the right work? | Actual host loading on natural requests and close near-misses |
| Does it improve the task? | Comparable outputs with and without the new guidance, or against the previous version |
| Does a rule prevent a real failure? | A representative case that exposes that failure and an adjacent case that checks overreach |
| Does it work on another host? | Representative execution there, including its capabilities and discovery mechanism |
| Does a package parse? | The target's structural validator; this does not establish task quality |

## Design a useful comparison

Choose realistic tasks and the outcomes or constraints that matter. Include relevant boundaries without building an exhaustive suite by default. Use comparable models, tools, and inputs; distinguish the candidate's effect from the host's existing instructions.

Keep expected answers and diagnoses separate from an executing agent. Isolate candidate and baseline contexts so the baseline cannot discover the candidate. Use fresh sessions or permitted runners when they improve the comparison; choose the mechanism the environment supports.

Inspect task artifacts and available traces. Use deterministic checks for objective properties and human or rubric-based review for judgment. Look for unnecessary questions, tool calls, delays, rigidity, or loss of quality as well as the intended improvement. A baseline that already succeeds is useful evidence; do not force it to fail.

## Interpret the result

Distinguish format, activation, task behavior, and output quality. An agent saying it would load a skill is not observed activation. A single successful run is not a reliability estimate. Independent review is not execution.

Generalize from failures rather than tuning only to known examples. Repeat or add held-out cases when variability or the strength of the claim warrants it. Preserve real failure cases when they remain useful regression checks; avoid creating permanent test machinery without a demonstrated need.

Report the evidence relevant to the claim and its limits. If a target or runner is unavailable, narrow the conclusion accordingly. Stop when additional evaluation would not materially resolve the question being asked.
