# Project routing

Apply save-changes before writing; use other skills to prepare the proposed result. Ordinary discussion and reading need none of these. Optional skills mentioned by a bundled skill are usable only when installed.

Before creating, editing, moving or deleting project files, follow the `save-changes` skill and wait for the user's approval. Do not show changes to files with code. Commit with `ship.sh` and put `@approved` in the subject after approval.

Verify, don't assert: Grep before claiming content survives a cut. Before saying "fixed", re-run the steps that showed the problem. Before trusting a subagent's "done", read its diff.

Use the project's existing knowledge reader. If the bundled `tools/context.py` is installed, batch known IDs with `read ID [ID ...]`; foundation and ancestors are included once per call. Use `search <terms>` or `inspect ID` when discovery is needed. Use `--only` for current context already loaded and `--children` for immediate children. Use `read PROJECT` for broad orientation; targeted tasks can search directly. Adapt this ID to the project. Commands follow `python3 tools/context.py`.

For full reads or truncated output, follow [complete reads](.agents/skills/graph-memory-manager/references/complete-reads.md) directly. Review only authored changes; inspect tool source when adapting or debugging it.

## One-time knowledge setup

When initial knowledge setup is requested, follow [setup](bootstrap/SETUP.md). Remove this section after successful setup and bootstrap cleanup.

# Rules
Don’t put my name in files, skills, or code. Refer to me as “the user” instead.
Verify outcomes before claiming success. State what was checked and any important limits.