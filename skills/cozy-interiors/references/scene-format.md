# scene.json

## Scale
1 unit = 1 mm, real-world sizes, so rooms built in separate projects match.
- Origin: left-front-floor corner of the main run; x right, y up, z toward the viewer; floor at y 0.
- Reference sizes (mm): ceiling 2500; door 2100 × 800; window sill 900–1000; worktop top 900, depth 600; wall units 1450–2170 high, depth 320; table top 740; chair seat 450; sofa seat 420, depth 900; bed top 500; standing eye height 1600.
- Camera lens: 30° home view; shots 26–40°.

## Fields
- `room`: `backWall` z, `sideWall` x, `floor` y.
- `objects[]`: `id`, `asset`, `at` [x,y,z], `turn` deg about y, `mount`, optional `inset` (mm sunk into its support, e.g. a hob), `detail` (4× detail part; Settings or `?plain` hides it), `params`.
- `mount`: `floor`, `wall` (back wall), `on` (rests on another object's top), `in:<id>` (inside that object), `ceiling`, `lines` (drawn marks).
- `camera`: tour timings and `shots` (camera.md).

## Checks (check-scene.mjs)
Loads the page with `?check` (parts kept unmerged) and measures true parts:
- support: rests where `mount` says.
- overlap: objects stay clear of each other.
- room: everything stays inside the walls and above the floor.
- swing: every opening front, alone and in pairs, through its whole travel.
Soft notes (e.g. a missing ceiling) are reported for a look.
