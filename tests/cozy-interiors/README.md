# cozy-interiors tests (work in progress)

Working files for building the cozy-interiors skill; delete this folder once the skill is done.

- `kitchen-prototype/`: the original corner kitchen. `node build.mjs` writes kitchen-scene.html; `node check-scene.mjs` checks it.
- `scenes/`: seeded test homes. `node seed-<n>.spec.mjs` writes seed-<n>.json; check and build it with the skill's scene scripts. `python3 applyshots.py <n>` writes fitted shots into a spec.
- `check-runs.mjs`: cabinet run widths and the swing check on `scenes/l-kitchen.json`.
- `planning/`: plan.md (decisions so far) and research.md.

The PP Neue Montreal font in `kitchen-prototype/src/assets/fonts/` is licensed: keep this repo private until it is replaced with a free font.
