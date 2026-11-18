# Living things

Each area gets one to three moving things of different kinds, as `roll.mjs` deals them in `areas[id].motion`; pass them on with `a.alive(roll.areas[id].motion)` after the walls.

- A flier (butterfly, bee, bird) comes and goes through one window or glass door that opens, or else through an arch or an open door; `a.alive` opens it and names it the way in. While it is shut, the flier waits outside.
- Wind moves plants near an open window or glass door; with none open, nothing moves in the wind.
- Every moving thing keeps clear of furniture and walls at every moment; check-home replays the motion and names any crossing. Fix it in the motion plug-in or the tables, so every home gains.
