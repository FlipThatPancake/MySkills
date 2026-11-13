# cozy-interiors skill: first draft (planner)

Status: draft for grilling. Round 1 answers (2026-11-13): the oven is NOT part of the skill (imported from Blender, realistic, keeps its own materials). No grid: free placement in mm, checks catch overlaps. No ceiling rose (the hanging cord is liked). No poster or print sheets. Idle tour starts after 12 s and hands over smoothly. Generated assets follow the skill look; an imported asset may keep its own look when the user says so. Skill shape ok for now.

Round 2 (2026-11-13): kitchens only, done well.
The agent writes mm positions in scene.json and the checks report problems.
A placer that turns relations into mm comes only if new rooms keep failing.
The editor comes later and reads scene.json.
The library grows from hand-written assets plus free CC0 models restyled on import.
A neutral page frame by default; product frames (like Inspira) are added per project.
Door swing clashes: a check finds them, and fitter fixes remove them (a 90° hinge stop first, then a filler strip).

## 1. What Anatomy does that our kitchen doesn't (yet)

Anatomy is a skill for drawing small technical machines (isometric SVG, plus optional WebGL and 3D). Our kitchen borrowed its *look* (paper-white faces, thin grey lines, soft halos). It did not borrow its *working method*, and most of the gaps are there.

| Anatomy idea | What it means | Where our kitchen stands |
|---|---|---|
| **Two looks: 1× and 4×** | At normal size it reads as one clear thing; zoomed in 4×, every area still has something real to find. A bare face is "unfinished work, not calm". | Cabinets, wall and fridge sides are big bare slabs. Fine at 1×, empty at 4×. |
| **Every part sits on another part** | Nothing floats; detail comes from parts that hold parts (feet, rails, hinges, screws). | Mostly true, but placement is done by hand-typed coordinates, so nothing proves it. |
| **Lines end on something** | Every line lands on an edge, another line or a dot; if it must stop, it fades. A script (`lines.mjs`) rings every line end that touches nothing. | The lamp cord rises and stops in mid-air (there is no ceiling). Scratches stop dead. |
| **Measured, not eyeballed** | An audit script proves no part passes through another, every end has a mount, and depth order is right, at rest and in every frame of a movement. "Fixing one close-up by eye" is listed as an anti-pattern. | No scene checks at all. Each round was checked by screenshots and the user's eye. |
| **Halo under anything lifted** | A soft shadow under the base and under anything raised. | Halos exist, but `atmosphere.js` places each one by hand with numbers; new objects get none. |
| **Light on paper** | On a white theme, glow is a saturated body with a pale core and a coloured rim, and the cavity that holds it gets a darker *physical* ground. Darkening a dark-theme glow gives "red ink smoke". | This is exactly the brown cavity glow the user rejected in round 11. The recipe is the fix. |
| **Nothing pops** | Every animated value rides an attack/decay curve; checked with a slowed-down contact sheet (many frames on one image). | Plant gusts and butterfly were checked by eye from a few frames. |
| **Idle tour** | When nobody touches the figure, it runs a calm loop; a touch takes over smoothly and it resumes later. | The 3D view sits still until dragged. |
| **Size it first** | Figure / Hero / Epic tiers with part counts and time estimates; an Epic is never started without asking. | Rounds grew one request at a time. |
| **Accessible** | Keyboard works, stops when off-screen. | Mouse only. |

## 2. Proposed kitchen improvements (ranked)

1. **Fix the cavity glow with Anatomy's paper-light recipe** (saturated orange body, pale core, darker enamel ground, no tint on charcoal). Small, and it removes the brown the user disliked.
2. **4× detail pass on the big bare faces**: plinth recess and kickboard line, skirting board, worktop front edge bevel, wall socket and switch on the backsplash, a tile or panel backsplash, hood filter grille, sink drain, fridge feet and hinge caps, oven-column vent slot. Each sits on something; no texture.
3. **Ceiling rose for the lamp cord** (or a short ceiling slab that fades out), so the cord ends on something.
4. **Automatic halos** from each object's footprint instead of hand-placed ones, so every new prop gets its shadow.
5. **Idle tour** in the 3D view: a slow camera drift after about 20 s idle, handing over smoothly on touch.
6. **Opening parts**: cabinet doors and drawers open on hover or click, like the oven door (the "apart" pose in Anatomy terms).
7. **Install sheet**: an A4 drawing of the oven column with the niche sizes and the slide-out views, for engineers.
8. **Keyboard orbit** (arrow keys) and Tab between the leader buttons.

## 3. Skill shape (modules)

One short `SKILL.md` that says the workflow and points to modules. Intent and look live in `references/` so the skill stays portable.

```
cozy-interiors/
  SKILL.md                 workflow: brief → size it → plan on the grid → pick or make assets → build → check → deliver
  references/
    intent.md              what "cozy" and "good" mean (the user's taste, things turned down)
    look.md                tones, line widths, halos, colour budget, light-on-paper recipe
    scene-format.md        the scene file: grid, walls, openings, objects, effects
    assets.md              how an asset is written, its metadata, how to make a new one in style
  kit/                     the shared look (today's kitchen3d.js, generalised): fills, lines, halos, paint
  library/                 ready assets, one file each, with metadata
    furniture/ appliances/ props/ effects/ surfaces/
  editor/                  one HTML page: grid plan view + 3D preview; draw walls, drag/rotate objects, export the scene file
  browser/                 one HTML page: every asset from three angles, searchable by tag
  scripts/
    new-asset.mjs          scaffold an asset file with metadata and a preview
    check-assets.mjs       asset checks
    check-scene.mjs        scene checks
    check-render.mjs       browser checks (line ends, pops, frame rate, phone width)
    build.mjs              scene file → one self-contained HTML page
```

**The scene file** (JSON): the grid size, walls as lines along grid edges with openings (doors, windows), and a list of objects, each `{ asset, cell, rotation, mount: floor | counter | wall | ceiling, params }`, plus effects (wind, butterfly, daylight) and camera presets.

**An asset** stays what our kitchen elements already are: `export function name(kit, params) { return group }`, plus a small metadata block: footprint in cells, height, where it mounts, the anchor points others can sit on (a worktop offers a "counter" surface), tags, and which params it takes (width, door count, colour from the palette).

### Starting library from what exists
Base run, wall cabinets, hob + hood, oven column with niche, fridge, countertop oven, window with daylight, pendant lamp, floor tiles, fruit bowl, potted plant with wind gusts, butterfly, cutting board, fridge magnets and notes, family photo, cat (hidden, rig pending), contact halos, leader buttons, slide-out hero view.

## 4. Checks (the user prefers checks over rules)

- **Asset checks**: metadata present; footprint matches the drawn bounding box; origin at the left-front-floor corner; uses only the kit's materials and the palette; three preview screenshots render without errors.
- **Scene checks**: no two objects overlap (per layer: floor, counter, wall); everything rests on a surface or a wall (nothing floats); wall-mounted things touch a wall; doors and drawers have room to swing; a walk path about 700–900 mm wide stays free; objects stay inside the walls; every line ends on something.
- **Render checks** (headless browser): no console errors; line-end check; a slowed contact sheet of every animation to catch pops; frame rate while orbiting; still reads at phone width.
- The editor shows the scene checks live: an overlapping or floating object turns red.

## 4b. What the research changes (from `research.md`)

- **One scene file is the single source.** Today the layout lives in code twice (`butterfly.js` keeps its own list of solid boxes that must mirror `room.js`). The scene file feeds the renderer, the editor, the checks and the butterfly's no-go zones.
- **Checks in two tiers, each with an ID and a one-line reason.** Hard (refuse): overlap, outside the room, floating or sunk, wall-mounted thing off its wall, door, drawer and oven-door swing. Soft (score): clearance, reach, sightlines, balance. Plus a check no paper has: a walk path from every door at least about 800 mm wide (a flood fill over the grid). The editor shows the reason on the red object, like the Sims house builder does.
- **Checks use the true shape** of each object (from its mesh), never a padded box, because a fake box can silence a check.
- **Generation: the agent writes mm directly for now** (round 2); relations plus a solver (the Holodeck paper) only if rooms keep failing.
- **Draw a run, auto-fill it**: drawing a counter run fills it with standard cabinet widths plus a filler piece (Codrops kitchen designer).
- **Restyle on import**: any free CC0 model (Kenney, Quaternius, Poly Pizza) gets our paper fill and crease outlines on import, so the library can grow fast. Footprint, height, anchors, tags and licence go in a data file next to it.
- **Colour tokens**: every colour (paper, four shades, lines, one accent, cavity, daylight) comes from one table, so a room can be re-themed without touching code. The cavity gets its own darker token set (Anatomy's fix for our brown).
- **Editor feature floor** (from the Sims house builder): snap to grid, walls and neighbours; quarter turns; red with a reason on collision; undo; save and load; repair on load; a distance tool; top-down and 3D toggle.
- **Tests**: one small test per check rule, plus a few prompt evals ("make a cozy galley kitchen with a window") with the expected result written out.
- **Optional, heavier**: a progress file where "done" needs evidence from the checks (img2threejs). I'd leave it out at first because you prefer light systems; the checks at ship time do most of the job.
- **New life for props** (later): dust in the window light, pot steam, a curtain moving with the plant's gusts, a clock, a cat with idle poses.

## 5. What else the skill could offer (my suggestions)

- **Room templates**: galley, L-shape, U-shape, island; living room, bedroom, bathroom later.
- **A "coziness" dial**: how much lived-in clutter (notes, plants, scratches, a mug) the generator adds.
- **Time of day**: morning, afternoon, evening light through the window.
- **A hero slot**: one product the room is built to show off (today the oven), with the slide-out, leaders and dimension lines as a reusable module. That keeps the skill useful for product demos beyond ovens.
- **Camera presets and a tour**, saved in the scene file.
- **Poster and install sheets** printed from the built scene.

## 5b. First build step (agreed)

In MySkills: split the kitchen into one file per object (fridge, plant, window...), then add one scene file that says where each object stands. The checks, and later the editor, read that file.

## 6. Experiments to try (the user's queue)

Results (2026-11-13):
4× detail: a socket and a light switch are scene objects marked `detail`. Settings or `?plain` hides them. Fridge feet were removed because they looked odd.
Opening fronts: drawers and hob-unit doors open on click, and the units are hollow inside. Cost: about +1.5k triangles and +15 draw calls.
Swing check: every front is opened step by step, and every pair together.
Idle tour: a sway after 12 s, then a cut to a composed view every 4 s, picked from scene.json `camera.shots`. Any input eases the camera back to the starting view.

- **4× detail pass**: add small real parts so surfaces are not empty up close: a skirting board, a wall socket and switch, the cabinet plinth gap, a worktop edge line, fridge feet. Try it behind a setting, so the plain and detailed versions can be compared.
- **Opening doors and drawers**: cabinet doors and drawers open on hover or click, eased like the oven door. Each opening cabinet gets a simple inside (back panel, four walls, one shelf); doors may open only partly so less inside shows. Measure the triangle count and frame rate before and after.

## 7. Whole, varied rooms (round 3, 2026-11-13)

A room is a whole space: a floor plan (walls as a shape such as a rectangle, an L or a room with an alcove), doors and windows in the walls, a floor and a ceiling.
The skill ships parts: the kit, the library, the checks and an empty room shell.
The corner kitchen moves out of the skill to `tests/`, as a fixture for the checks.
Variety: dice tables in the skill (room size, shape, layout type, door and window walls, style, time of day, how lived-in).
A small roll script picks one option from each table using a seed, which is saved in scene.json, so a room can be rebuilt exactly.
The agent places everything in mm by room rules, and the checks report problems.
Kitchen rules: runs filled with cabinet widths of 300 to 900 mm plus a filler strip. Sink, hob and fridge 1.2 to 2.7 m apart, each pair (the work triangle). Walkways at least 900 mm, and 1000 to 1200 mm between facing runs.
Other rooms' rules are added when a room type is first asked for.
Library, two kinds. Fixed products (fridge, hob, sink, oven) come from tables of standard sizes and options.
Fitted things are generated from the scene: worktops follow the runs with cut-outs; walls, floor and tiles follow the floor plan; plinths and fillers fill the gaps; shadows follow each footprint.
Moving life is generated too: the butterfly's flight path comes from the room's free space, and gust and drift settings come from ranges.
When nothing fits a request, the agent writes a new generator in the kit's style; the checks test it like any object.
New room checks: a clear walking path from every door, windows clear of wall units, and the work triangle.
Build order: room shell, library, dice tables and roll script, kitchen moved to tests, then SKILL.md.
