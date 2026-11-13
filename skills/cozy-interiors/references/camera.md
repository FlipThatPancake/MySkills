# Camera

## Idle tour
- Idle `after` s (12): slow sway round the home view, eased in.
- `cutsAfter` s (12) into the sway: hard cut to the next shot every `cutEvery` s (4), like a video.
- Any input: the sway stops where it is; during cuts, camera, target and lens ease home (1.2 s), then orbit controls take over.
- `?cuts=1`: both waits 1 s, for testing.

## Shots
Each shot is a composed view of the room. `camera.shots` in scene.json: `{ name, from: [x,y,z], look: [x,y,z], fov, move }`, mm.
`move`: push, pull, slide, rise, turn; omitted, they cycle.

Compose like a photographer:
- Foreground piece cut by the frame edge; subject on a third; background for depth.
- Leading lines: worktop edge, tile rows, cabinet runs.
- Vary height and lens: low across the floor, eye level along a worktop, high corner overview; fov 26 (compresses) to 40 (wide).
- Window light and plants make good backgrounds.
- Camera inside the room, in free space.

Check: a contact sheet of all shots (`kitchenScene.tour.preview(i)` holds shot i). Would each work as a still photo of the room? Do cut edges fall on the frame, with the middle whole?
