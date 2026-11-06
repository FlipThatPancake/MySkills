# Project routing

When a skill in `.agents/skills/index.md` fits the task, or the user names one, read its `SKILL.md` and follow it. After adding or changing a skill, run `node scripts/skill-index.mjs`.

Skills here are shared with other projects and must work in Claude Code and in ChatGPT/Codex. Create and edit them only in `skills/<name>/`; `.agents/skills` and `.claude/skills` are symlinks.

Verify, don't assert: Grep before claiming content survives a cut. Before saying "fixed", re-run the steps that showed the problem. Before trusting a subagent's "done", read its diff. State what was checked and any important limits.

Write each fact in one file only, the one that owns it. Never restate what is loaded every session (this file, `CLAUDE.md`, the skill index). Files say what to do, not design history; add half a sentence of why only where a rule would look arbitrary.

# Rules
Don’t put my name in files, skills, or code. Refer to me as “the user” instead.
