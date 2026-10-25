# Placement and node patterns

Inspect candidate owners, necessary ancestors, and immediate children. Search plausible names and other branches before concluding no owner exists; failed discovery is not an empty graph. Derive file locations from parentage using [format](format.md). Preserve IDs.

## Before placement

Use the core questions in [SKILL.md](../SKILL.md), then ask:

- Was persistence requested, or is there a clear future use within this graph's purpose? Omit incidental material unless explicitly requested.
- Does the input contain several independently useful groups? Route each separately; a message need not have one owner.
- Is each claim already recorded, an addition, a correction, a changed decision, or a conflict? Skip duplicates. Replace superseded current claims; retain useful history distinctly. Preserve unresolved conflicts rather than silently choosing a winner.
- What source, scope, date, condition, or status is needed to interpret the claim accurately? Keep meaningful qualifiers with it; do not require metadata on every fact.
- Does evidence distinguish plausible owners? Resolve routine choices directly; surface material ambiguity instead of inventing categories.

## Placement decisions

| Action | Use when |
| --- | --- |
| No change | The information is already represented or is incidental and was not requested for preservation. |
| Update | New facts answer the same question and are normally read with the node's existing body. |
| Add child | A distinct subject or optional detail can be read or maintained independently under an existing parent. |
| Promote or split | An existing leaf now contains multiple subjects or details worth retrieving separately. Retain its ID as the overview or junction where possible. |
| Cross-link | The material already has an appropriate owner and another branch needs a route to it. |
| Merge | Nodes duplicate ownership or answer the same question without useful separate reads. Preserve content and repair inbound links; frequent co-reading alone is insufficient. |

Prefer the narrowest suitable parent, including a leaf that can gain children. New nodes may be siblings under an existing parent; add an intermediate junction only for a useful grouping supported by supplied material. Keep established ownership unless retrieval warrants a change. Cross-cutting topics get one home and links elsewhere; association alone is not parentage.

Independence matters more than length. A project with its own overview and detailed requirements deserves a branch as soon as that information arrives. A short list normally consulted together can stay one node. Avoid a node per noun, arbitrary size quotas, or speculative empty sections.

## Flexible node patterns

All nodes use the existing identity, parent, and title format. These patterns describe content roles, not additional required metadata or mutually exclusive types.

| Pattern | Content |
| --- | --- |
| Junction | Collection scope, context shared across its children, and brief routes to them. |
| Subject overview | What the subject is, its purpose, and concise context useful across its descendants. It may also route to children. |
| Detail | One coherent set of requirements, decisions, plans, evidence, or source material useful separately. |

A clear title and self-contained body are enough; add sections only when supported. Decisions may need status, rationale, and conditions; sources may need provenance and verbatim text. Avoid mandatory timestamps, confidence scores, or duplicate summaries.

Put facts in ancestors only when useful across the branch. Keep optional detail below; retain essential caveats with the claim they qualify. Links do not load bodies: an overview must not imply approval while only a child records that approval is pending.

For example: update an existing schedule's deadline; give an independently useful rollout procedure a child; link a shared policy from projects using it; keep a short packing list together.

## Growing a placeholder into a collection

An existing `WORK-PROJECTS` says "No projects yet." The user now supplies Atlas's purpose, requirements, and decisions, plus Beacon's purpose and rollout plan. Where those sections are independently useful, reuse the junction:

```text
WORK-PROJECTS
  ATLAS                    Overview and shared context
    ATLAS-REQUIREMENTS
    ATLAS-DECISIONS
  BEACON                   Overview and shared context
    BEACON-ROLLOUT
```

Preserve the junction ID and inbound links; replace the obsolete empty-state claim. Move each fact to its owner, preserving qualifications and source fidelity. Add only supplied sections. In a later session, extend Atlas's existing branch or add a new project beside it.

Each node has its own file. `work-projects.md` has a sibling `work-projects/` folder containing `atlas.md` and `beacon.md`. Atlas's children go inside `work-projects/atlas/`, and so on. Create child folders only when needed. Keep the parent file in place when a leaf gains children; normalize the affected branch if migrating an older layout. Update affected parents and links after moves; do not leave duplicate copies behind.

## Compact placement proposals

Use [review](review.md) before saving. Keep small proposals inline; no separate artifact is required.

- **Action:** update, add child, promote/split, cross-link, merge, or no change.
- **Location:** existing target and parent IDs, proposed new IDs, and any source/destination paths for moves.
- **Ownership:** the destination for each distinct supplied information group and any preserved source material.
- **Retrieval check:** a realistic question, expected nodes, and unrelated bodies that should remain excluded.
- **Edits:** exact proposed text or diff, including deletions and link repairs; identify exclusions and unresolved questions.

Check the resulting reads with ancestors included: junction alone; one subject overview; one detail; and a comparison when relevant. Preserve all information selected for saving in canonical homes and remove contradictory placeholders. Structural validity alone does not establish useful grouping.
