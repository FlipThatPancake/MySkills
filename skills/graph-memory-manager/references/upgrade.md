# Upgrade an existing graph

Use for `upgrade` after installing a skill revision. Always preview the required changes before applying them. The target is the installed skill's current contract, including [format](format.md) and [organization](organization.md). A new package fingerprint does not imply that the graph needs a structural change. Do not invent a schema version, require intermediate releases, or fetch/install another revision unless requested.

## Compare before migrating

Identify the project root, installed skill directory, graph location, reader, configuration, and project instructions. Inspect current file differences before preparing edits; preserve unrelated or concurrent work. Use the existing reader rather than assuming this package also installed the bootstrap tools.

Record the installed skill identity with its read-only helper, resolving the path from the installed skill directory:

```sh
python3 /path/to/graph-memory-manager/scripts/skill_fingerprint.py
```

The helper hashes SKILL.md and maintained files under references/, scripts/, and agents/. Its fingerprint identifies guidance and helper contents, not a database schema version or a compatibility verdict. Also record a release or repository commit when actually available. Look for a previous successful upgrade receipt in the project's report location; otherwise label the previous skill identity **unknown** and infer compatibility from the graph itself. Never label the current fingerprint as the previous version merely because the skill is now installed.

Inspect the node index, root/foundation configuration, node syntax, nesting, cross-references, and relevant reader behavior. Establish baseline validation and layout findings. If tooling is missing or cannot parse the graph, inspect enough source to identify the mismatch; do not treat failed discovery as an empty graph or rebuild from scratch. Preserve extensions used by another reader. Do not add version fields to strict node frontmatter or `knowledge/context.json`.

An unqualified upgrade covers the existing graph; a requested branch limits the scope. Classify actual differences:

| Finding | Response |
| --- | --- |
| Already compatible, including a documentation-only skill revision | Report no structural change; do not rewrite nodes or copy starter files. |
| Legacy inline or misplaced node files | Plan extraction or moves under the current parent-folder rule. |
| Reader, configuration, or instruction mismatch | Propose only the adaptations needed for current behavior; preserve project customizations. Use supplied compatible tooling when available, rather than guessing a replacement. |
| Ambiguous parentage, conflicting IDs, or conflicting destination content | Resolve from evidence where possible; leave unresolved items explicit instead of choosing a destructive interpretation. |

Report pre-existing failures separately from changes required by the skill. A package upgrade is not a reason to redesign otherwise useful semantic branches. Use the organization guidance when a real ownership or retrieval problem requires it.

## Preview required changes

Make a reviewable migration plan with scope, baseline findings, required changes, and an ID-to-old/new-path mapping. Include inline anchor destinations, affected links, configuration or tool edits, validation commands, and the proposed rollback location. Show the exact proposed edits or diff where required by the project's change rules. The default `upgrade` request produces this preview in the chat and writes no project files, backups, or receipts. If the graph is already compatible, report that no migration is required and stop.

## Apply the approved plan

After presenting the complete preview, obtain approval for the proposed changes before editing. Once the user approves that plan, apply it under the project's change rules without requesting the same approval again. If new evidence materially changes the plan, show the revised changes for approval before applying them.

Before applying, retain a recoverable snapshot of every file to be changed, removed, or overwritten, plus a record of newly created paths. Store snapshots outside the reader's discovery tree: a backup containing Markdown under `knowledge/` can create duplicate IDs. Verify that the snapshot can be read and check source/destination files have not changed since the plan. Reconcile concurrent changes before editing.

Preserve node IDs, parent relationships, root/foundation IDs, facts, qualifications, decision status, rationale, and required verbatim source text. Read all content being transformed, using [complete reads](complete-reads.md) when necessary. For a mechanical extraction or move, compare per-ID titles and bodies before and after, allowing only the planned link rewrites and wrapper changes. Review any intentional content change separately.

Derive paths from authoritative parentage. Extract legacy inline nodes into individual files; move a parent and its descendants consistently; inspect occupied destinations before merging. Repair inbound and outbound relative links, including old inline anchors and links in project instructions or other project files. Preserve existing link routes or report external references that cannot be repaired from this project. Remove superseded canonical copies only after their content and links are accounted for. Do not overwrite an existing graph with bootstrap starter knowledge.

## Verify and record

Run the project's structural/link validation and the installed [layout checker](format.md). Capture command exit statuses separately so a failed index command is not mistaken for an empty or successful layout check. For the bundled reader, use `python3 tools/context.py validate` and pass a successfully produced `index --json` to `scripts/check_layout.py`. Run applicable existing tests after structural or tool changes.

Compare inventories for missing/duplicate IDs, changed ancestry, lost source text, stale copies, broken anchors, and unexpected empty directories. Exercise a narrow detail read and, where multiple branches exist, a comparison: necessary ancestors appear once and unrelated bodies stay excluded. Compare against the baseline, including failures that predate the migration. Repeat the compatibility check: a completed upgrade should propose no further structural changes.

If a required check fails, repair the introduced problem or restore only this migration's changes without discarding concurrent work. Report an incomplete or rolled-back result and outstanding blockers; do not record success or advance the applied identity. A limited branch upgrade cannot establish whole-graph compatibility.

After verification, write a compact upgrade receipt outside maintained knowledge, using the project's reporting convention or `reports/graph-memory/upgrades/<timestamp>-<short-id>.md`. Avoid overwriting existing reports. Record:

- Project and graph scope; date; previous identity or unknown; target fingerprint and available release/commit.
- Outcome: migrated or already compatible, and the verified scope; a limited branch upgrade is partial at project level. Record the target as successfully applied only for that verified scope, including a verified no-op.
- Actual changes and old/new path mapping; preservation checks and retrieval examples; validation results and pre-existing findings.
- Snapshot location and restoration steps, when changes were made; unresolved compatibility limits.

A failure or rollback report may use the same report location, but must clearly state its outcome and must not be treated as a successful upgrade receipt. A receipt is maintenance evidence, not a new required reader schema or permission to mutate future graphs. On later runs, inspect the live graph even if its receipt matches the installed fingerprint.
