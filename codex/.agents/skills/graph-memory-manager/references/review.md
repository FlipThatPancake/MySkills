# Reviewing a placement proposal

The main agent handles routine placement, including clear additions under an existing junction. Consider one independent review when ownership remains ambiguous after inspection or a restructure moves established material across several branches. Delegate only when the likely reduction in consequential mistakes or rework justifies added context, latency, and token use. Do not invent numerical confidence or expected-value estimates without evidence.

When delegation is available and permitted, use one bounded, read-only subagent for that review. Give it the incoming material, relevant existing nodes and ancestry, the [placement proposal](organization.md), and these questions:

- Does the proposed owner duplicate or conflict with an existing subject?
- Could any fact, qualification, decision status, or source material be lost or changed?
- Would realistic narrow reads include unrelated bodies or miss necessary context?
- Do node locations follow the parent-folder layout, and do moved subtrees retain IDs and valid relative links?
- Is a smaller change sufficient to meet the same retrieval needs?

Ask it to return `accept` or `revise`, concrete findings with node IDs or source references, and any minimal alternative with expected read boundaries. This is an advisory judgment, not a deterministic verdict. The reviewer must not edit files, publish changes, or delegate further.

The main agent resolves supported findings and owns the final proposal. Do not require agent consensus or start an open-ended debate. Ask one focused follow-up only if a material finding cannot be resolved from the evidence. If delegation is unavailable, perform the same checks locally; do not block routine work on a missing subagent facility.

After applying authorized edits, use deterministic tools for ID uniqueness, parent existence, cycles, links, and expected emitted IDs. Review semantic ownership and source preservation separately; passing structural checks cannot prove either. Follow the project's [format checks](format.md), and report unresolved failures.
