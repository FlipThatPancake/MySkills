# Placement and node patterns

Inspect the affected node, necessary ancestors, and immediate children. Search nearby subjects when ownership is unclear. Map information to nodes, then derive their nested file locations from parentage using [format](format.md). Preserve existing IDs.

## Placement decisions

| Action | Use when |
| --- | --- |
| Update | New facts answer the same question and are normally read with the node's existing body. |
| Add child | A distinct subject or optional detail can be read or maintained independently under an existing parent. |
| Promote or split | An existing leaf now contains multiple subjects or details worth retrieving separately. Retain its ID as the overview or junction where possible. |
| Cross-link | The material already has an appropriate owner and another branch needs a route to it. |

Prefer the narrowest existing parent that supplies appropriate shared context. Keep established ownership unless the new material exposes a retrieval problem. A cross-cutting topic gets one canonical home with links from other branches; a link does not make its target an ancestor.

Independence matters more than length. A project with its own overview and detailed requirements deserves a branch as soon as that information arrives. A short list normally consulted together can stay one node. Avoid a node per noun, arbitrary size quotas, or speculative empty sections.

## Flexible node patterns

All nodes use the existing identity, parent, and title format. These patterns describe content roles, not additional required metadata or mutually exclusive types.

| Pattern | Content |
| --- | --- |
| Junction | Collection scope, context shared across its children, and brief routes to them. |
| Subject overview | What the subject is, its purpose, and concise context useful across its descendants. It may also route to children. |
| Detail | One coherent set of requirements, decisions, plans, evidence, or source material useful separately. |

A clear title and self-contained body are enough; do not require identical section headings. Add sections only when information supports them. A decision may need status, rationale, and conditions; a source node may need provenance and verbatim text. Do not force either template onto every node. Avoid mandatory timestamps, confidence scores, or summaries that duplicate the body.

Put a fact in an ancestor only when it helps across that branch. Reading a project's requirements should not automatically include its full decision history. Keep detail in the lowest appropriate owner while retaining enough context to interpret it.

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

For a substantial change, make a concise proposal before editing. A structured result makes the decision reviewable; it does not guarantee a correct or repeatable semantic judgment. Routine updates do not need a separate proposal artifact.

- **Action:** update, add child, promote/split, or cross-link; list operations separately when needed.
- **Location:** existing target and parent IDs, proposed new IDs, and any source/destination paths for moves.
- **Ownership:** the destination for each distinct supplied information group and any preserved source material.
- **Retrieval check:** a realistic question, expected nodes, and unrelated bodies that should remain excluded.

Check the resulting reads with ancestors included: junction alone; one subject overview; one detail; and a comparison when relevant. Preserve all supplied information in canonical homes and remove contradictory placeholders. Structural validity alone does not establish useful grouping. For unresolved ownership or extensive moves, use [review](review.md).
