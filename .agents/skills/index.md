# Skills

<!-- written by scripts/skill-index.mjs -->
- `blender-access`: Choose and connect Blender tools for an agent. Use when starting Blender work or troubleshooting access to a live scene, background scripts, or validation tools. `.agents/skills/blender-access/SKILL.md`
- `graph-memory-manager`: Maintains project memory as selectively readable nodes with nested parent folders and cross-references. Use for saving, organizing, restructuring, auditing retrieval, upgrading existing graphs after skill updates, or reporting session retrieval quality and efficiency for skill maintenance. Routine reading follows AGENTS.md. `.agents/skills/graph-memory-manager/SKILL.md`
- `grill-me`: Interviews the user about plans, issues, and open decisions when they say "grill me". A shared plan alone does not start an interview. `.agents/skills/grill-me/SKILL.md`
- `save-changes`: Review proposed project-file changes, get approval before writing, and commit and push approved changes to GitHub. Show non-code changes as diff blocks. `.agents/skills/save-changes/SKILL.md`
- `ship`: Use when the user says "ship it", "push now", "save my work", "ship to main", or "PR to main", or wants to commit and push at the end of a session. Two targets: the current branch (default) or main through a pull request that merges at once. `.agents/skills/ship/SKILL.md`
- `try-variants`: Use when the user asks for prototypes, variants, or "a few ideas" of a screen, or wants to try how some logic feels before building it. Builds throwaway versions to compare; any worth comparing again become a setting in the real product. `.agents/skills/try-variants/SKILL.md`
- `wait-what`:  `.agents/skills/wait-what/SKILL.md`
- `writing-skills`: Create, revise, generalize, or evaluate agent skills and their SKILL.md files. Use when turning a repeatable workflow into a skill, improving skill activation or behavior, or adapting a skill for Claude Code and ChatGPT/Codex. Also use for project instructions that load or share a skill's workflow. Excludes ordinary task execution and unrelated edits to app or repository instructions. `.agents/skills/writing-skills/SKILL.md`
