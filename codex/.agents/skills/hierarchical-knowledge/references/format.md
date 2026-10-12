# Knowledge format

Preserve the projectâs existing tools and conventions. The installed reader uses this format.

`knowledge/context.json` names the root and foundation. Keep foundation small; add nodes only when broadly necessary.

Each file has plain, unquoted `id` and `parent` frontmatter, an H1 title, and a lowercase filename matching its root ID. IDs match `[A-Z][A-Z0-9-]*`. Only the sole root has `parent: null`. Example `speeches.md`:

```markdown
---
id: SPEECHES
parent: PROJECT
---
# Speeches
Short routing overview.

<a id="SPEECH-A"></a>
## SPEECH-A Â· Welcome speech
Full source text.

<a id="SPEECH-B"></a>
## SPEECH-B Â· Thank-you speech
Full source text.
```

Identified headings use levels 2â6 and a matching anchor immediately above. The nearest preceding identified heading of lower level is the parent; otherwise the file root is. A node's body ends before the next identified section. Ordinary headings stay within the current node. Separate files can parent to any node, allowing deeper trees.

A node per speech in one file and a file per speech are both selectively readable. Choose files for convenient editing. Use relative Markdown links for cross-references; they do not load bodies. After moves, update inbound links.

Validate with `python3 tools/context.py validate`; run `python3 -m unittest discover -s tests` after structural or tool changes. For content edits, validate links and review affected content. Check that a narrow read excludes other documents and a comparison retrieves known IDs together. Use [complete reads](complete-reads.md) when verifying all content; preserve facts across migrations.

## Authored-note example

Before: âWe discussed the possibility of perhaps making the volunteer rota weekly, but we have not reached a decision on that yet.â

After: âCandidate: weekly volunteer rota; not yet approved.â

This is a style example, not a required label or template. Condense authored notes; preserve full source documents unless their transformation is requested.
