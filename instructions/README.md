# Instruction templates — setup guide

This file is guidance for the person setting up a project. The other files in this folder contain only copyable instructions.

## Choose what to copy

| Source file | Destination |
| --- | --- |
| [global.md](global.md) | ChatGPT custom instructions; Claude chat account instructions |
| [global.md](global.md) | Local Codex: `~/.codex/AGENTS.md`; local Claude Code: `~/.claude/CLAUDE.md` |
| [global-detailed.md](global-detailed.md) | Alternative global instructions with detailed language rules; the same app and local destinations apply |
| [projects/building.md](projects/building.md) | Project instructions for building projects in ChatGPT or Claude |
| [projects/learning.md](projects/learning.md) | Project instructions for learning projects |
| [projects/writing-and-brainstorming.md](projects/writing-and-brainstorming.md) | Project instructions for writing and brainstorming projects |
| [projects/skills.md](projects/skills.md) | Project instructions for creating and improving skills; loads the canonical Writing Skills workflow |
| [global.md](global.md), then [projects/building.md](projects/building.md) | Root `AGENTS.md` in a working coding repo |
| One line: `@AGENTS.md` | Root `CLAUDE.md` alongside that `AGENTS.md` |

The current default is [global.md](global.md), which uses Uniform Information Density (UID) guidance. Choose one global version.

Copy the entire contents of the selected instruction file. Do not paste this setup guide into an instruction field.

Use the global instructions across projects and choose the relevant project module. If a project mixes brainstorming and building, both modules can apply; discussing an idea does not approve its implementation.

## Working repos

A working repo's root `AGENTS.md` starts with the contents of `global.md`, followed by `projects/building.md`. Include the communication rules there so cloud coding sessions do not depend on local home-directory configuration. Its root `CLAUDE.md` holds `@AGENTS.md`, which imports it; add Claude-specific rules only if needed.

Add actual project facts and procedures to the working repo's `AGENTS.md`: purpose, constraints, authoritative records, relevant skills, build/test commands, and release procedures. These vary by project and are not included in this generic template.

For an existing working repo, merge these instructions with its current rules. Preserve its skill routing and any stricter approval requirements rather than overwriting them.

## This repository's own pack

The root `AGENTS.md`, `CLAUDE.md`, `skills/` and `bootstrap/` of this repository are the skill pack, with their own skill routing and setup procedure. When adding the instructions above to a project that already uses the pack, merge them into its `AGENTS.md` and keep its routing and setup sections.

These templates do not install skills or change when existing skills activate. Approval of an approach does not bypass a project's requirement to approve exact edits.

## App and local setup

- ChatGPT: Settings → Personalization → Custom instructions.
- Claude chat: Settings → Your Claude → Instructions (older layout: Account → Instructions for Claude).
- Learning, writing, and building modules go in the relevant project's instruction field.
- `~` means the home directory of the environment running the coding tool. WSL has its own home directory.
- Codex can use a custom `CODEX_HOME`; in that case, place the global `AGENTS.md` there.
- This folder stores templates. Copying them to this repository does not configure an app or install them in another project.
