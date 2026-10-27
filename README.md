# MySkills

Reusable project-skill packs and instruction templates for Codex, ChatGPT, and Claude.

- [Instruction templates and setup guide](instructions/README.md): global app instructions, project instructions, and ready-to-copy `AGENTS.md` and `CLAUDE.md` files.
- [Writing Skills](skills/writing-skills/SKILL.md): one shared skill for creating, improving, and evaluating skills across Claude Code and ChatGPT/Codex, with [matching project instructions](instructions/projects/skills.md).
- Copy `codex/.agents` and `codex/AGENTS.md` into a Codex project.
- Copy `claude/.claude`, `claude/CLAUDE.md`, and `claude/AGENTS.md` into a Claude project.

Each skill-pack folder also includes the matching `bootstrap/` starter materials.

The `skills/` directory holds canonical shared skills. To use Writing Skills locally, copy its complete folder into `.claude/skills/` for Claude Code or `.agents/skills/` for Codex. For hosted ChatGPT, use its supported skill installation mechanism, or copy the matching project instructions into the project's instruction field. A repository link does not install a skill or change project settings.
