# Propose, critique, approve, save

Use for saving or reorganizing knowledge. Upgrade and usage-report retain their own workflows. The main agent owns source fidelity, resolves feedback, and obtains approval. With subagents available and permitted, use one proposer and a separate critic, without inherited chat history when supported; neither may delegate further or publish. Otherwise perform the same stages locally and state that independent review was unavailable.

## Handoff and proposal

Give a fresh proposer the save request, relevant skill/project rules, graph location and reader, and a compact source packet: facts to preserve, decisions and statuses, conditions, corrections, rejected/superseded ideas, and source references or required verbatim excerpts. Do not dump the whole chat or send only a conclusion. Let it inspect relevant existing nodes; request missing evidence rather than infer omitted session facts.

The proposer returns the [placement proposal](organization.md#compact-placement-proposals), exact edits, and expected reads. Before approval, both agents may inspect project files and draft in isolated scratch space, but must not modify project files. The main agent checks coverage against the session before critique.

## Critique and revision

Give the separate critic the source packet, applicable rules, proposal, and access to relevant existing nodes. Ask:

- Is any supplied fact, qualification, status, or source text lost, distorted, or unsupported?
- Do owners avoid duplication, unnecessary splitting, and unrelated content in the same read?
- Do parentage and links provide discoverability and essential context without unrelated bodies?
- Are IDs, nested paths, moves, and link repairs sound? Would a smaller change suffice?

Return `accept` or `revise`, concrete findings tied to sources/node IDs, and minimal corrections. The critic is advisory and read-only. The main agent resolves supported findings, returning them to the proposer when revision is needed. Use at most two critic passes per proposal cycle; recheck changed points only. If disagreement remains, present the evidence and unresolved choice rather than looping for consensus.

## User approval and application

Present the resolved exact edits, placement rationale, and unresolved choices for approval. Feedback alone is not approval: send it through the proposer and critic, then present the revised proposal. Each feedback cycle gets the same bounded review; retain prior approval except where edits or their dependencies materially change. Partial approval permits only independent approved edits; defer changes requiring unapproved parents, moves, or links. Do not ask again for an already approved proposal or disregard an explicit instruction to apply directly.

After approval, the main agent or proposer applies only approved edits, with one writer. Check affected files still match the reviewed baseline; reconcile changes and re-present material deviations. Validate identities, ancestry, links, layout, source preservation, and realistic narrow reads using [format](format.md). Repair introduced failures within the approved intent; seek approval for material changes. Report actual changes and unresolved failures; approval of a proposal is not evidence it was saved successfully.
