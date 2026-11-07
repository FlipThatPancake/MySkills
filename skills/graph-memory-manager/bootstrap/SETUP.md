# Reader setup

For a project's copy of this skill, never for the repository the skill comes from. Follow it when the project has no knowledge reader.

1. Preserve an established knowledge system. For a new one, copy `tools/`, `tests/` and `knowledge/` from this folder into matching project paths without printing code or test bodies. Merge the reading guidance in this folder's `AGENTS.md` into the project's `AGENTS.md`, replace the illustrative brief in `knowledge/project.md`, and use the skill to organize supplied material. Python 3 needs no external packages.
2. Check the copied bytes locally. Run `python3 tools/context.py validate` and `python3 -m unittest discover -s tests`, or the existing system's equivalents. Verify source preservation, a narrow read, and a batched comparison. Fix introduced failures and rerun the affected checks. Keep this folder if setup is incomplete or checks fail, and report unresolved failures.
3. After success, delete this `bootstrap/` folder from the project's copy of the skill. Keep project knowledge, installed tools and tests, and the reading instructions. Never delete user-authored additions as cleanup.
4. Check the remaining local links and run a targeted read without this folder present.
