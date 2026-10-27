# Project routing

Load a skill when its task begins, not at chat start. Reuse loaded guidance while current.

| Task | Skill |
| --- | --- |
| Choose or connect Blender tools | [blender-access](.claude/skills/blender-access/SKILL.md) |
| Prepare project-file changes | [save-changes](.claude/skills/save-changes/SKILL.md) |
| Save, organize, or restructure knowledge; audit retrieval | [graph-memory-manager](.claude/skills/graph-memory-manager/SKILL.md) |
| User says “grill me” | [grill-me](.claude/skills/grill-me/SKILL.md) |
| Lesson or guided practice | [teach-me](.claude/skills/teach-me/SKILL.md) |

Apply save-changes before writing; use other skills to prepare the proposed result. Ordinary discussion and reading need none of these. Optional skills mentioned by a bundled skill are usable only when installed.

Use the project's existing knowledge reader. If the bundled `tools/context.py` is installed, batch known IDs with `read ID [ID ...]`; foundation and ancestors are included once per call. Use `search <terms>` or `inspect ID` when discovery is needed. Use `--only` for current context already loaded and `--children` for immediate children. Use `read PROJECT` for broad orientation; targeted tasks can search directly. Adapt this ID to the project. Commands follow `python3 tools/context.py`.

For full reads or truncated output, follow [complete reads](.claude/skills/graph-memory-manager/references/complete-reads.md) directly. Review only authored changes; inspect tool source when adapting or debugging it.

## One-time knowledge setup

When initial knowledge setup is requested, follow [setup](bootstrap/SETUP.md). Remove this section after successful setup and bootstrap cleanup.
