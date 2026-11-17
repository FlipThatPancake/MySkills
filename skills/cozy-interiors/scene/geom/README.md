# geom: the geometry core

One place that answers every physical question about a built home (touching, how deep inside, what holds it up, does it stay put), from the real parts, in Node, in a few seconds. Rapier 0.19.3 (Apache-2.0, `../src/vendor/rapier/`) does the shapes, distances and the settle test; it is never imported by the page.

- `node geom/index.mjs <scene.json> [--parts] [--no-settle] [--json out]` prints `[rule] text` lines like the old physics.mjs. `checkScene(scene)` is the same as a function; `checkParts(scene)` (`parts.mjs`) looks inside each asset.
- Files: `load.mjs` builds the home with the page's own buildHome; `shapes.mjs` part → hull or mesh; `env.mjs` floor, wall slabs, opening frames; `world.mjs` contacts with signed distance; `rules.mjs` penetrates, floating, overhangs, sunk (tolerances in `TOL`); `settle.mjs` one second of gravity; `parts.mjs` joins inside an asset; `kinds.mjs` asset kinds (soft, free, built-in).
- A part may pass through others of its own asset only when its kit call says `{ through: true }`; `kit.content(...)` parts may not cross anything.
- Measured gotchas: a 200 m floor made thin bodies jitter and distances 8 mm off (the floor is as wide as the home); a 7 mm by 2.4 m convex hull lets things fall through in Rapier (very flat fixed parts stay triangle meshes); a top-heavy lamp rocks up to 3° without tipping (the settle test measures the foot, not the centre of mass).
- Tests: `node tests/cozy-interiors/geom/run.mjs` (exact fixtures), `node scene/regress.mjs` (bug memory), `node scene/selftest.mjs` (parts inside assets).
