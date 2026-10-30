# Session retrieval report for skill maintenance

Use for `usage-report [PATH]`, usually near the end of a session. Assess whether the graph supplied the right knowledge at the right time and whether its retrieval overhead was worthwhile. Produce a self-contained handoff for a separate maintenance chat. Report available evidence without modifying the skill or graph or sending the report elsewhere. Prior audit logging is optional.

## Questions the report must answer

| Question | Evidence to assess |
| --- | --- |
| Were nodes read on demand? | Relate the first read of each relevant subject to the task need that arose; identify unnecessary advance loading and useful reuse of current context. |
| When and why were nodes read throughout the session? | Trace retrieval episodes in order, with the visible trigger, information needed, requested nodes, emitted bodies, and observed use or outcome. |
| Did the graph help save tokens? | Compare observed retrieval overhead with an explicit, task-equivalent baseline when measurements allow it; state what remains unmeasured. |
| Were too many files read or branches explored too deeply? | Identify avoidable bodies, repeated context, unrelated siblings, or unnecessary descendants relative to the need at that moment. |
| Was retrieval too shallow? | Identify relevant knowledge missed or fetched too late, and the resulting omission, unsupported assumption, correction, or rework. |

Answer every question, including **unknown** where evidence is insufficient. A successful report may recommend preserving current behavior. Few reads alone do not establish good retrieval; enough relevant knowledge must reach the agent to support the task.

## Reconstruct the observable session

Set the assessment window to the work before the report request. State missing earlier context, compacted history, and audit coverage. Use visible user requests, tool results, and authored changes; do not invent hidden reasoning, timestamps, or other agents' private context. Give a brief task-level reason for a read only when supported by the visible task or an explicit stated need; otherwise mark the reason uncertain. If the skill was only discussed, report that no graph-retrieval behavior was observed.

Record the installed skill identity using [the fingerprint helper](upgrade.md), plus any available release/commit. If skill or graph contents changed, distinguish the revisions relevant to each episode; the current graph cannot establish what was available earlier. Record the reader, root/foundation conventions, and relevant project instructions. Generalize private project details and omit secrets or unnecessary source bodies.

Group related reads into episodes around a user request, new question, decision, correction, or task change. For each, record the need at the time, discovery operations, requested IDs, automatically included foundation/ancestors, optional children or linked subjects, and direct file reads when visible. Distinguish metadata discovery from emitted node bodies, and first reads from rereads of unchanged or revised content. If known, identify the receiving agent/context and whether previously loaded content remained available.

A reader may open every graph file internally to build an index while emitting only selected nodes. Internal file access is not evidence that all those bodies entered the model's context. Conversely, a direct file read may emit an entire container or subtree. Count emitted material and observable direct reads accurately; do not equate filesystem scans, files, nodes, and model-context consumption.

If a matching [audit](audit.md) run exists, use `python3 tools/context_audit.py report --run RUN_ID --details` and identify its coverage. Include each relevant run when a session spans several. Do not silently use a prior run, start logging retroactively, or stop an active run for this report. Without a matching run, continue from visible tool results and label unobserved activity. Audit signals measure instrumented emissions; they do not establish the reason for a read, comprehension, downstream use, or whether unread knowledge was needed.

## Judge breadth and depth against the task

For each significant episode, compare actual retrieval with a justified sufficient set of knowledge. Account for necessary shared context, decision status, and important qualifications. Give concrete IDs/paths and the smaller read or missing follow-up that would have supported the same task. Evaluate the knowledge and instructions available then, without treating hindsight as the agent's prior knowledge.

Look for broad initial dumps before a need arose, whole-file reads where a node would suffice, unrelated siblings, automatic child expansion, excessive ancestor bodies, and rereads of unchanged material already available. Distinguish required context and useful verification from avoidable overhead. A deep branch or full read can be appropriate for the task; an audit target may become outdated when the user changes the task. Rereads after compaction, a source revision, or entry into a separate agent context may be justified. Unused material is a candidate for review, not proof it was unnecessary when read.

For insufficient retrieval, look for claims made from an overview while a relevant detail, exception, source, or decision node was needed; unvisited links that mattered; premature stopping after discovery; and relevant reads made only after an error or user correction. Name the missed knowledge and its effect. If needed, inspect likely branches during report preparation to verify a suspected omission. Label those reads **retrospective**, exclude them from the assessed session's retrieval totals, and state when the earlier content revision is unknown. Do not emit the full graph merely to look for every possible missed fact. Distinguish an unread existing fact from knowledge absent from the graph, a failed discovery route, or a fact already present in the user's request or current context. Without a coverage check, say no shallow-retrieval issue was observed rather than claiming none occurred.

## Assess token benefit without sacrificing correctness

Separate these kinds of evidence:

- **Observed retrieval volume:** calls, direct files and node bodies emitted, unique versus repeated content, metadata/discovery output, and foundation/ancestor overhead, where available. Include relevant skill/reference and instrumentation overhead separately when known. Characters and node counts are useful volume measures, not tokens or proof of savings.
- **Tokenized content comparison:** when exact emitted text and a suitable model tokenizer are available, compare the actual cumulative retrieval output with an explicit baseline for the same task, graph revision, and context boundaries. A baseline might load the full graph once per agent context, not on every read. Label it counterfactual unless actually observed, explain why it is plausible, and include repeated reads and discovery overhead. Compute baseline sizes locally without emitting extra bodies to the agent. If only knowledge-body volume is measured, limit the conclusion to that scope.
- **Model usage and cost:** use supplied or observed input/output/cache usage with clear session or run boundaries. Tokenized output text is not equivalent to billed input tokens across repeated model calls. A causal savings claim needs a comparable baseline with equivalent task quality; one session's total usage alone cannot establish it. Never turn character counts into billed tokens or infer money saved without the required usage and pricing evidence.

Report the supported conclusion: measured benefit against the stated baseline; lower emitted context with token benefit unmeasured; no benefit observed; or inconclusive. Consider whether discovery, repeated ancestors, instructions, or retries offset the avoided bodies. Reading fewer tokens while missing required facts is a retrieval failure, not a successful saving. Do not introduce an arbitrary traversal-depth or file-count quota.

## Write a portable handoff

Use the following structure. Keep uneventful sessions brief, but preserve the sequence and concrete evidence needed to evaluate material retrieval decisions. Use **none observed**, **unknown**, or **not measured** for missing evidence.

```markdown
# Graph memory manager — session retrieval report

Report format: 1
Date / session identifier (if available):
Skill identity and relevant graph revisions:
Assessment window and gaps; audit run IDs/coverage or unavailable:
Project context: tasks, reader, graph conventions, relevant constraints

## Assessment
- On-demand reading: conclusion and evidence.
- Timing and reasons: summary of retrieval across the session.
- Token benefit: conclusion, comparison baseline, measured scope, and limits.
- Excessive breadth/depth: concrete episodes or none observed.
- Insufficient depth: concrete episodes or none observed; coverage limits.
- Task correctness: what the retrieved knowledge supported or failed to support.

## Retrieval timeline
| Episode / stage | Trigger and information need | Requested IDs/files → emitted context | First read / reread; volume if known | Observed use or outcome; assessment |
| --- | --- | --- | --- | --- |

## Findings and maintenance candidates
For each material episode:
- Evidence and impact: relevant command/output, node IDs, minimal content, or visible correction.
- Better retrieval: sufficient narrower selection or missing follow-up, and expected outcome.
- Attribution: agent behavior, skill guidance, graph organization/content, reader/tooling, or uncertain.
- Candidate change: smallest supported revision and affected file/section; label hypotheses.
- Reproduction and acceptance check: minimal setup/request, expected retrieval, and task-quality check.
Preserve successful patterns; recommend no change when evidence does not justify one.

## Measurements and limits
Observed volume and coverage; unique/repeated/automatic context where available.
Baseline definition, units, method, comparable quality, and measured or unmeasured token benefit.
Separate model/cache usage from emitted text; identify retrospective report-preparation reads.
```

Include enough redacted content or a minimal fixture for the maintenance chat to understand a finding without local files. Paths alone are insufficient when a conclusion depends on unseen contents. Preserve meaningful conditions and statuses; do not attach the whole graph or present an untested recommendation as proven. Prioritize changes that improve sufficient retrieval with less unnecessary context, and state tradeoffs or open questions.

## Deliver and consume

Write to PATH when supplied; otherwise follow the project's report convention or use `reports/graph-memory/session-<timestamp>-<short-id>.md`. Keep reports outside `knowledge/` and other reader-discovery locations. If PATH would enter the graph, explain the conflict and propose a location outside it. Avoid overwriting an earlier report. Follow existing project write rules; when a file cannot yet be written, deliver the exact report in the chat and identify the pending save.

Return the report location with a short description of its coverage and strongest supported retrieval finding, if any. In the maintenance chat, assess its recommendations against current skill files and [evaluation guidance](evaluation.md); the report does not authorize automatic changes or transmission elsewhere.
