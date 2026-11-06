---
name: ship
description: "Use at the start of a session, and when the user says \"ship it\", \"push now\", \"save my work\", \"sync\", \"pull\", \"update from GitHub\", \"ship to main\" or \"PR to main\". Keeps this copy and GitHub in step: brings in new work, runs the project's checks, commits and pushes, and gets cloud work onto main through a pull request."
---

# Ship: keep this copy and GitHub in step

Run `scripts/ship.sh` from this skill's folder. Without a shell, do the same steps with git by hand.

Locally it pushes the branch you are on, main included. A cloud session works on its own branch and never pushes main; Claude Code marks the cloud with `CLAUDE_CODE_REMOTE`, and elsewhere set `SHIP_CLOUD=1`. Where the cloud cannot push (ChatGPT's cloud), commit and tell the user to press "Create PR".

## Start of a session
Run `ship.sh start`. It brings in new commits from GitHub when no file changed on both sides and lists each file with the date and commit that changed it; on a branch other than main it also brings in main. Tell the user what came in, any clash table, and branches with work not on main yet.

In Claude Code, a start hook runs it. Add this to the project's `.claude/settings.json`, with the skill's installed path:
`{"hooks":{"SessionStart":[{"hooks":[{"type":"command","command":"bash \"$CLAUDE_PROJECT_DIR/skills/ship/scripts/ship.sh\" start","timeout":30}]}]}}`

## Saving
1. Files that are not code go through `propose-changes` first. After the user's ok, put `@approved` in the commit subject.
2. Use the user's commit message, else a one-line summary of the session (imperative, at most 72 characters).
3. Run `ship.sh "<message>"`. It runs every check, commits, brings in new commits from the branch on GitHub, and pushes. A failing check stops the commit: fix the cause and ship again.
4. Report the commit and the branch. On a cloud branch, say that nothing reached main and that "ship to main" does that.

## When both sides changed the same files
The script stops and prints a table: each file with its date and commit here and on GitHub (the date last saved when not committed). Nothing is combined. Add a suggestion per file of which side should win and why (for example newer, merged after review, or the larger intended change), and wait for the user's pick. "Remote wins" or "local wins" from the user decides every file without the table.

Before overwriting uncommitted edits, `git stash` them so they can be recovered. Then merge, take the chosen side per file, keep both sides' intent where the user asked for that, and ship again.

## Ship to main (cloud)
The user's "ship to main" is the approval to merge, so do not ask again.
1. Ship to the branch.
2. Open a pull request into main, or find the open one for this branch.
3. On a merge conflict, merge `origin/main` into the branch, resolve as above, and ship again.
4. Merge the pull request with a merge commit. If a check fails, fix it on the branch and ship again. If GitHub refuses the merge, say why and leave the pull request open.
5. Report the pull request link and whether main has the change.

## Checks
Any skill can bring a `ship-checks/` folder, and the project can have its own `scripts/ship-checks/`. Each file there is `.mjs`, `.js`, `.py` or `.sh`. It runs from the project root with `--msg "<commit subject>"` and exits 0 to pass; any other exit stops the commit once every check has run. A check may write files, such as a generated index; they join the commit.

## Guardrails
- Never force-push.
- Nothing to commit: say so. For "ship to main", still check the open pull request, because pushed commits may be waiting.
