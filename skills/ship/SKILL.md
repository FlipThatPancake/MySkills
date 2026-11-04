---
name: ship
description: "Use when the user says \"ship it\", \"push now\", \"save my work\", \"ship to main\", or \"PR to main\", or wants to commit and push at the end of a session. Two targets: the current branch (default) or main through a pull request that merges at once."
---

# Ship: commit and push to a clearly chosen target

A cloud session's git repository disappears when the session ends, so a push is what keeps the work. Never work on the local `main`.

## Which target
- **branch** (default, also when no destination is named): "ship it", "push now", "save my work". Say plainly that nothing reached main and that "ship to main" does that.
- **main**: "ship to main", "PR to main", "open a PR", "get this on main".

## Branch
1. Use the user's commit message, else a one-line summary of the session (imperative, at most 72 characters).
2. If the changes include non-code project files, follow `save-changes` first and add `@approved` to the subject only after the user approved them.
3. Run `skills/ship/scripts/ship.sh "<message>"` (use the installed path of the skill). Report the commit and the branch.

## Main
The user's "ship to main" is the approval to merge, so do not ask again.
1. Ship to the branch as above.
2. Open a pull request into `main`, or find the open one for this branch.
3. On a merge conflict, merge `origin/main` into the branch, resolve each conflict yourself after reading both sides, run the project's checks, and ship again. Ask the user only when the two sides want opposite things.
4. Merge the pull request with a merge commit. If a check fails, fix it on the branch and ship again.
5. If GitHub refuses the merge, say why and leave the pull request open. Do not merge locally.
6. Report the pull request link and whether main has the change.

## Guardrails
- Never push to `main` directly or force-push.
- Nothing to commit: say so. For main, still check the open pull request, because pushed commits may be waiting.
