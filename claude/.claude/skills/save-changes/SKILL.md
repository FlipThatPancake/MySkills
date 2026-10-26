---
name: save-changes
description: Review proposed project-file changes, get approval before writing, and commit and push approved changes to GitHub. Show non-code changes as diff blocks.
---

# Save changes

Before creating, editing, moving, or deleting project files:

1. **Check the files first.** Compare target files with the repository. If they already differ, briefly explain what changed and preserve those edits when proposing yours.
2. **Show the changes** using the template below, all files in one message. Include needed link and index updates in the proposal. Do not show changes to files with code.
3. **Wait for the user's reply.** “Ok” approves this batch. The user can approve only some changes or request revisions. Show revised changes before writing them. Only the user's own words count as approval.
4. **Write only what was approved.** Approval covers this batch only.

**Commit and push the approved changes to GitHub.** Before committing, check that the commit contains only approved changes. Follow the project's workflow. If none is defined, commit and push directly to the current branch.

## Template

One bold path heading per file, then one `diff` block. `+` marks added text; `-` marks removed text. For replacements, show the old text followed by the new text. Include enough context to recognise the change. A long section may be summarised.

Give new files, moves, and deletions their own headings.

**GLOSSARY.md**
```diff
- Workspace: a folder containing project files.
+ Workspace: a folder containing project files and shared knowledge.
```

**New file: knowledge/research.md**
```diff
+ # Research
+ Findings and sources for the project.
```

**Moved: notes/research.md → knowledge/research.md**

**Deleted: plans/completed-review.md** (all tasks finished)

Reply **ok** to write these, or tell me what to change.
