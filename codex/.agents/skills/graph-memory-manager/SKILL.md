---
name: graph-memory-manager
description: Maintains project memory as selectively readable nodes with nested parent folders and cross-references. Use for saving, organizing, restructuring, auditing retrieval, upgrading existing graphs after skill updates, or reporting session retrieval quality and efficiency for skill maintenance. Routine reading follows AGENTS.md.
---

# Graph memory manager

Use the project's reader and identity format. Memory has a parent tree with explicit cross-references. Store each node in its own file; put its children in a sibling folder named after its ID and repeat at every level. Follow [format](references/format.md) for nested layout, migration, and its read-only checker; leave unrelated content in place.

## Commands

These are requests to the agent after invoking this skill, not shell commands or new reader options. For example: `$graph-memory-manager upgrade`.

| Request | Behavior | Reference |
| --- | --- | --- |
| `upgrade` | Compare an existing graph with the installed skill and preview required changes. Apply the reviewed plan only after approval, then validate and record the result. | [Upgrade](references/upgrade.md) |
| `usage-report [PATH]` | Assess when and why nodes were read, excessive or insufficient retrieval, and evidence for token savings; produce a portable maintenance report at PATH when supplied. | [Usage report](references/usage-report.md) |

Installing a revision does not itself authorize or require a graph rewrite. Run these workflows when requested; ordinary saves retain their affected-branch scope. A usage report does not require prior audit logging.

## Saving and organizing

Before every save, ask internally:

- Does this answer the same question as an existing node and normally belong in the same read? Update it; shared subject alone is insufficient.
- What realistic read needs either information group without the other? Separate useful subjects or optional details; keep dependent fragments together.
- Which existing parent encompasses it and supplies useful shared context? A leaf can gain children; related topics may need links instead.
- Could separation hide a qualification needed to act correctly? Keep essential conditions visible in the node or shared ancestor.

Use [organization](references/organization.md) for the remaining placement checks. Reuse junctions and IDs; split when retrieval warrants it, not at a size threshold. Create only nodes justified by supplied material.

Keep parents brief: their bodies load with descendants. Give each fact one owner and link elsewhere. Preserve facts and inbound links when moving content; replace superseded placeholder claims.

Write compact, self-contained notes. Preserve decision status, conditions, units, and meaningful rationale. Keep transcripts and quoted source material verbatim unless transformation is requested.

For saves, use the proposer–critic–approval workflow in [review](references/review.md); apply only the approved proposal. Load other references as needed:

- [Organization](references/organization.md): creating or restructuring branches, node patterns, and substantial placement proposals.
- [Review](references/review.md): session handoff, proposal, independent critique, revisions, approval, and application.
- [Evaluation](references/evaluation.md): testing changes to this skill, not ordinary knowledge updates.
- [Format](references/format.md): writing node syntax or checking reader behavior.
- [Audit](references/audit.md): investigating retrieval usage.
- [Complete reads](references/complete-reads.md): full or truncated reads.

Validate affected knowledge and exercise a realistic narrow read: include the intended subject and necessary ancestors, exclude unrelated bodies. Fix introduced failures and rerun affected checks; report unresolved failures. Review authored changes, not unchanged tooling dumps.

Reader: Python 3, standard library only. Optional audit: macOS/Linux.
