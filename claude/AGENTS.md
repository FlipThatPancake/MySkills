# Project routing

Load a skill when its task begins, not at chat start. Reuse loaded guidance while current.

| Task | Skill |
| --- | --- |
| Prepare project-file changes | [approval-first-changes](.claude/skills/approval-first-changes/SKILL.md) |
| Save, organize, or restructure knowledge; audit retrieval | [hierarchical-knowledge](.claude/skills/hierarchical-knowledge/SKILL.md) |
| User says âgrill meâ | [grill-me](.claude/skills/grill-me/SKILL.md) |

Apply approval-first before writing; use other skills to prepare the proposed result. Ordinary discussion and reading need none of these. Optional skills mentioned by a bundled skill are usable only when installed.

Use the project's existing knowledge reader. If the bundled `tools/context.py` is installed, batch known IDs with `read ID [ID ...]`; foundation and ancestors are included once per call. Use `search <terms>` or `inspect ID` when discovery is needed. Use `--only` for current context already loaded and `--children` for immediate children. Use `read PROJECT` for broad orientation; targeted tasks can search directly. Adapt this ID to the project. Commands follow `python3 tools/context.py`.

For full reads or truncated output, follow [complete reads](.claude/skills/hierarchical-knowledge/references/complete-reads.md) directly. Review only authored changes; inspect tool source when adapting or debugging it.

## One-time knowledge setup

When initial knowledge setup is requested, follow [setup](bootstrap/SETUP.md). Remove this section after successful setup and bootstrap cleanup.
