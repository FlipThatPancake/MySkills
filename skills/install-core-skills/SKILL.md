---
name: install-core-skills
description: "Use when the user asks to install the core skills in a repo, or to update a repo's skills from MySkills."
---

# Install and update skills in a repo

Core set: add-skill, grill-me, icon-box-spacing, propose-changes, ship, talkback, try-variants, wait-what, writing-skills.

Source: `skills/<name>/` in this repo at its current commit. Target: the repo the user names; if this session can't reach it, ask the user to add it.

## Install and update
- Add each core skill the target lacks, with add-skill.
- For every other skill the target has that MySkills also has, compare it with the version at the commit the project recorded, or with MySkills' current version if none is recorded.
- No local edits: replace it with the new version.
- Local edits: list them for the user to resolve, and leave those skills as they are until then.
- Leave skills MySkills lacks alone.
- Record the commit where add-skill records its source and revision.

## Make threads read them
- Copy `scripts/skill-index.mjs` and `scripts/ship-checks/skill-index.sh` into the target, then run the script to write `.agents/skills/index.md`.
- `AGENTS.md` holds: "When a skill in `.agents/skills/index.md` fits the task, or the user names one, read its `SKILL.md` and follow it."
  If the file is missing, create it with only that line; if it exists, add the line and change nothing else.
- Root `CLAUDE.md` holds `@AGENTS.md` and `@.agents/skills/index.md`.
  Same rule: create it with only those two lines, or add what's missing to the existing file.

## Ship
Put the changes on a branch in the target and open a PR to main.

## Check
Does every core skill open from `.claude/skills` and `.agents/skills`? Does the index list every installed skill? Does `CLAUDE.md` reach the index through real files? Is the commit recorded?

Report each skill as added, updated, unchanged or held for local edits, plus the commit, and say a fresh session is needed to see the index.
