---
name: propose-changes
description: Use when about to create, edit, move or delete project Markdown (.md) files. Shows the changes as diff blocks, waits for the user's approval, then writes only what was approved. Does not commit or push.
---

# Propose changes

Before creating, editing, moving, or deleting project Markdown (.md) files:

1. **Check the files first.** Compare target files with the repository. If they already differ, briefly explain what changed and preserve those edits when proposing yours.
2. **Show the changes** using the template below, all files in one message. Include needed link and index updates in the proposal.
3. **Wait for the user's reply.** “Ok” approves this batch. The user can approve only some changes or request revisions. Show revised changes before writing them. Only the user's own words count as approval.
4. **Write only what was approved.** Approval covers this batch only. Saving the written files to GitHub is a separate step; do not commit or push here.

## Template

One bold path heading per file, then one `diff` block. `+` marks added text; `-` marks removed text. For replacements, show the old text followed by the new text. Include enough context to recognise the change. A long section may be summarised.

Number each `+` line so the user can refer to it, counting on across files: `[1]`, `[2]`. If a line has several sentences, number each sentence: `[3.1]`, `[3.2]`. Leave `-` lines unnumbered.

Give new files, moves, and deletions their own headings.

**GLOSSARY.md**
```diff
- Workspace: a folder containing project files.
+ [1] Workspace: a folder containing project files and shared knowledge.
```

**New file: knowledge/research.md**
```diff
+ [2] # Research
+ [3] Findings and sources for the project.
```

**Moved: notes/research.md → knowledge/research.md**

**Deleted: plans/completed-review.md** (all tasks finished)

Reply **ok** to write these, or tell me what to change by number.
