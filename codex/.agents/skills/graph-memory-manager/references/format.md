# Memory format and folder layout

Use the installed reader and its identity conventions. The bundled reader recursively discovers Markdown files under `knowledge/`; `knowledge/context.json` names the root and foundation. Keep foundation small.

## One file per node, nested by parent

Every node is a file named `<lowercase-id>.md`. A parent's immediate children live in a sibling directory named `<lowercase-parent-id>/`; repeat this rule for every level. The root file sits directly in `knowledge/` beside its child directory and `context.json`:

```text
knowledge/
  context.json
  project.md
  project/
    work-projects.md
    work-projects/
      atlas.md
      atlas/
        atlas-requirements.md
        atlas-decisions.md
      beacon.md
      beacon/
        beacon-rollout.md
```

`atlas.md` stays in place when Atlas gains its first child; create `atlas/` for that child. Leaf nodes need no empty directory. Keep full ID-based filenames even when an ancestor's name appears in them: the bundled reader requires filenames to match IDs. Do not replace node filenames with `index.md`.

For any child, take its parent's file directory, append the parent's lowercase ID as a directory, then append the child's lowercase ID plus `.md`. The `parent` field remains authoritative; check that folder locations agree with it. Cross-references do not change ownership or add folder ancestry.

Each file has plain, unquoted `id` and `parent` frontmatter and an H1 title. IDs match `[A-Z][A-Z0-9-]*`; only the sole root has `parent: null`. Example `knowledge/project/work-projects/atlas.md`:

```markdown
---
id: ATLAS
parent: WORK-PROJECTS
---
# Atlas
Supplier portal overview.

Details: [requirements](atlas/atlas-requirements.md) and [decisions](atlas/atlas-decisions.md).
```

Use explicit relative file links for cross-references; they do not load bodies. A requirements node can link back to its overview with `../atlas.md`. Ordinary body headings organize text within one node.

## Existing layouts and moves

For a requested upgrade after installing a skill revision, use [upgrade](upgrade.md) to compare the existing graph with the current contract, preserve a recoverable baseline, and record verification. The affected-branch rule below applies to ordinary knowledge updates; an unqualified upgrade checks the full graph.

The reader also supports older inline nodes marked by identified headings and matching anchors. Treat these as legacy input, not the layout for new nodes. When creating, promoting, or moving nodes in an affected branch, extract its inline children and place its node files in the nested layout. Preserve IDs, parent relationships, facts, qualifications, and required verbatim source text. Leave unrelated branches for their own tasks.

Move a parent file and its child directory together when changing its location. Derive descendant paths from the resulting ancestry, update changed `parent` fields, and repair inbound and outbound relative links, including links in project instructions. Inspect existing destinations before merging; do not overwrite an unrelated node or leave duplicate canonical files. Retain `context.json` root/foundation IDs unless identities actually change.

The reader validates identities, ancestry, and links, but does not enforce this directory convention. After reader validation, pipe its index into the skill's read-only [layout checker](../scripts/check_layout.py), resolving the checker path from the installed skill directory:

```sh
python3 tools/context.py index --json | python3 /path/to/graph-memory-manager/scripts/check_layout.py
```

The checker reports expected paths and exits nonzero for misplaced or inline nodes; it never moves files. It checks the full index. In an existing project with unrelated legacy branches, distinguish those pre-existing findings from affected nodes and report them rather than broadening the migration. If another reader uses a different index schema, check equivalent locations with that reader instead. Inspect empty directories separately. Do not infer a correct layout from structural validation alone.

## Verification

Validate with `python3 tools/context.py validate`; run `python3 -m unittest discover -s tests` after structural or tool changes. Check a narrow read excludes sibling bodies and optional details, and a comparison retrieves known IDs with shared ancestors once. Use [complete reads](complete-reads.md) when verifying all content; preserve facts across migrations.

Write compact authored notes while retaining decision status and meaningful rationale: "Candidate: weekly volunteer rota; not yet approved." Keep source documents verbatim unless transformation is requested.
