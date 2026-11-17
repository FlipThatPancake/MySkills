# Bug memory (regression corpus)

Each bug Paul or the evaluator found becomes a tiny scene in `fixtures/` (bugs.mjs, good.mjs, pending.mjs, assets.mjs; common.mjs is a shared bare room). `node skills/cozy-interiors/scene/regress.mjs` builds them all, runs check-home (physics included) on each and checks the verdict:
- `bug`: some check must report it (rule names in `expect.rules`, object ids in `expect.ids`). `known: true` marks a bug the checks still miss (XFAIL); when a check starts catching it the run prints XPASS: delete the flag.
- `good`: no physical finding may appear (composition rules such as "needs 8 objects" are ignored). A known false alarm carries `known: true`.
- `pending`: a rule not written yet; prints NOW-CAUGHT once a rule outside the old list names the object, then change it to `bug`.
- fixtures with `asset` register a throwaway asset and run `physics.mjs --parts` on it.
Flags: `--only=name,name`, `--jobs=N` (default 4), `--json out.json`, `--keep`. Exit 1 when a bug is missed, a good scene raises an alarm, or a fixture errors. Add a fixture for every new bug before fixing it. Results and gaps: test/rounds/checks/regress-report.md in the project files.
