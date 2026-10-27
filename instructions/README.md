# Instruction templates — setup guide

This file is guidance for the person setting up a project. The other files in this folder contain only copyable instructions.

## Choose what to copy

| Source file | Destination |
| --- | --- |
| [global.md](global.md) | ChatGPT custom instructions; Claude chat account instructions |
| [global.md](global.md) | Local Codex: `~/.codex/AGENTS.md`; local Claude Code: `~/.claude/CLAUDE.md` |
| [projects/building.md](projects/building.md) | Project instructions for building projects in ChatGPT or Claude |
| [projects/learning.md](projects/learning.md) | Project instructions for learning projects |
| [projects/writing-and-brainstorming.md](projects/writing-and-brainstorming.md) | Project instructions for writing and brainstorming projects |
| [repo/AGENTS.md](repo/AGENTS.md) | Root `AGENTS.md` in a working coding repo |
| [repo/CLAUDE.md](repo/CLAUDE.md) | Root `CLAUDE.md` alongside that `AGENTS.md` |

Copy the entire contents of the selected instruction file. Do not paste this setup guide into an instruction field.

Use the global instructions across projects and choose the relevant project module. If a project mixes brainstorming and building, both modules can apply; discussing an idea does not approve its implementation.

## Working repos

The ready-to-copy `repo/AGENTS.md` combines the global communication rules and the building workflow. It deliberately includes the communication rules so cloud coding sessions do not depend on local home-directory configuration.

The ready-to-copy `repo/CLAUDE.md` imports the adjacent `AGENTS.md`. Keep both files together. Add Claude-specific rules only if needed.

Add actual project facts and procedures to the working repo's `AGENTS.md`: purpose, constraints, authoritative records, relevant skills, build/test commands, and release procedures. These vary by project and are not included in this generic template.

For an existing working repo, merge these instructions with its current rules. Preserve its skill routing and any stricter approval requirements rather than overwriting them.

## Existing skill packs in this repository

The existing [Claude pack](../claude/) and [Codex pack](../codex/) contain their own skill routing and bootstrap procedures. They remain unchanged. If using a pack, merge the communication and building sections from the new `repo/AGENTS.md` into the pack's existing `AGENTS.md`; preserve its routing and setup sections. Do not replace the pack's file wholesale with the generic template.

These templates do not install skills or change when existing skills activate. Approval of an approach does not bypass a project's requirement to approve exact edits.

## App and local setup

- ChatGPT: Settings → Personalization → Custom instructions.
- Claude chat: Settings → Your Claude → Instructions (older layout: Account → Instructions for Claude).
- Learning, writing, and building modules go in the relevant project's instruction field.
- `~` means the home directory of the environment running the coding tool. WSL has its own home directory.
- Codex can use a custom `CODEX_HOME`; in that case, place the global `AGENTS.md` there.
- This folder stores templates. Copying them to this repository does not configure an app or install them in another project.
