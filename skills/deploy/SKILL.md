---
name: deploy
description: Use only when the user asks to deploy or publish the page to its hosting branches. Commits the page as a file on each branch, which deploys on push. Never run it as part of another skill or on your own.
---

# Deploy

Each project fills in the settings below once, when it copies this skill in. If a setting still shows its `<placeholder>`, stop and ask the user to fill it in.

## Settings

- Targets: `<name = branch>`, one per line (for example `site = hosting-branch`). Each branch deploys when a commit lands on it.
- Page: `<how to find the file to publish: a path, or a command that prints it>`
- Build command: `<command that rebuilds the page, or "none">`
- Never publish: `<files that must never go out, or "none">`
- File name on the branch: `index.html`
- Commit message: "Update index.html with the latest build"

## Rules

- Targets: the ones the user names, otherwise all of them. If the user names any other place, ask.
- Page: use the file named under Page. Run the build command first only if the user wants the latest code. Never publish anything listed under Never publish.
- Change only the file named under File name on the branch. Skip a branch where it already matches. Start from the latest branch on GitHub (fetch first). Do the branch work in a temporary copy of the project (a git worktree) and delete it afterwards, so the folder you are working in is never switched or changed.
- If a push is rejected, stop that target and tell the user why. Do not work around it.

Done when: each target is pushed or skipped as unchanged, and the reply names the branch, commit and source file for each.
