# Project routing

When a skill in `.agents/skills/index.md` fits the task, or the user names one, read its `SKILL.md` and follow it.

Skills here are shared with other projects and must work in Claude Code and in ChatGPT/Codex. Create and edit them only in `skills/<name>/`; `.agents/skills` and `.claude/skills` are symlinks. Before drafting a new skill or a change to any file in `skills/`, read `skills/writing-skills/SKILL.md` and follow it.

Verify, don't assert: Grep before claiming content survives a cut. Before saying "fixed", re-run the steps that showed the problem. Before trusting a subagent's "done", read its diff.

Write each fact in one file only, the one that owns it. Never restate what is loaded every session (this file, `CLAUDE.md`, the skill index).
