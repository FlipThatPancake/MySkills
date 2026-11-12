---
name: add-skill
description: "Use when the user asks to add, import, install or update a skill in a project."
---

# Add a skill

Skill = folder with `SKILL.md` plus resources. Copy it whole, then do its setup.

## Place
- Use the project's existing skill layout.
- No layout yet: real folder `skills/<name>/`, relative links from `.claude/skills/<name>` and `.agents/skills/<name>`. Can't link: say so; never keep two copies.
- Copy all files from one revision, unchanged; folder name = `name:`.
- Same name exists: diff, keep project edits, show the user.

## Connect
- Run the skill's own setup (hooks, setup files, `bootstrap/`) with installed paths.
- Add skills it needs, or name the missing ones.
- Update the project's skill list or index (run its script if any) and any lock file or sync list, with source and revision.
- Replacing a skill: delete its folder and links; rename every mention.

## Check
- Does each link open `SKILL.md` in Claude Code and Codex? Does every named path exist? Any mentions of removed names left? Do the project's checks pass?

Report where it went, what setup ran, what's left.
