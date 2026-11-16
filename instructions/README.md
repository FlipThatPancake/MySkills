# Instructions

Storage for the user's instructions. The live copies are already set in ChatGPT and Claude: global instructions in the app settings, project instructions in each project's instruction field. Use this folder to change them, or to copy them from or to another repo. It is not a setup guide.

- `global.md`: global instructions (communication and working style).
- `projects/`: one file per kind of project, each pasted into that project's instruction field.
  - `writing-and-brainstorming.md`: writing, editing and brainstorming.
  - `career.md` and `life.md`: decision support (identical files).
- `model-routing-claude`: routing for Claude Code Projects, pasted into each project's instructions.

To keep a project's instructions in a repo, put `global.md` and then the project file in the repo's `AGENTS.md`, and put `@AGENTS.md` in its `CLAUDE.md`.
