# Research for the cozy-interiors skill

Scope: what the Anatomy skill has that our kitchen does not, and what similar skills, tools and papers offer. Read-only. Reading depth is marked per source; nothing was run from any repo.

## Part 1. Anatomy: what transfers to a three.js room

Anatomy (github.com/wheresryan22/anatomy, MIT) makes isometric SVG "figures" of a physical object. Our kitchen borrows its look (paper fills, thin grey lines, halos). The look is the small part of it. Most of its value is the process around the look.

### 1.1 How it is built (worth copying as structure)
- A SKILL.md of about 34 KB with a long tail of `references/` (craft, kit API, motion, verify, webgl, print, publish). Our skill should keep SKILL.md thin and push the rest down, which fits the user's taste for short skills.
- Eight complete examples, ranked by size ("open the closest one first"). Two are named quality bars: one for the drawing, one for shader work. A bar example works better than rules alone.
- Size tiers with a gate: Figure (40-80 parts), Hero (80-150), Epic (build only after the user picks it; the agent proposes a Hero instead). Room equivalent: Nook, Room, Apartment.
- A parts vocabulary with recipes (base plate on feet, drawer with pull and label holder, knurled knob, perforations and vents). Our asset library should ship as recipes plus code, not code alone.
- `evals/evals.json` holds realistic prompts with a long "expected output" paragraph each, and `scripts/*.test.mjs` hold one regression test per audit check. CI rebuilds every example. Our skill needs the same two layers: prompt evals and check tests.
- A community gallery with a publish script that records a "kit fingerprint", so a shared figure proves which kit version made it. Fits a shareable asset or room library later.

### 1.2 The checkers (the part our kitchen lacks)
`kit/audit.mjs` is 93 KB. Every drawn thing records its **true shape** as it is built. The audit then measures, instead of eyeballing:

| Check | What it measures | Room equivalent |
|---|---|---|
| clearance | a pipe passes through nothing, with about 1.5 radii to spare, at rest and in every replayed frame | furniture overlap and wall clipping; clearance round doors, drawers and the oven door swing |
| terminals / loose ends | every cable end lands on a real mount | every object stands on the floor or on a named surface (no floating things) |
| support | a solid touching nothing that leads to the stand is "loose"; one buried in another is "sunk" | grounded-on-surface and sunk-into-surface checks |
| depth order | proves which of two overlapping items is nearer and fixes draw order from geometry | transparency and render-order bugs (the kitchen's leaking hidden edges near the sink) |
| stand-in shapes | fails an item whose recorded shape covers under 60% of what it draws | stops a validator being silenced by a fake bounding box. Our validator must use the true mesh, not a hand-padded box |
| replay | checks every frame of the real springs, opening, closing and reversing mid-way | check every frame of door swing, drawer slide, the oven slide-out, butterfly and plant paths |

The rule behind it: **record the true shape of what you draw; a stand-in that silences the audit is itself a bug.** A zero audit is "necessary, not sufficient", so it is paired with a second check:

`scripts/lines.mjs` runs headless Chrome and checks the markup itself: every open line must end within 1 px of another stroke, a dot or an outline. Lines that are meant to stop must be marked `free`. It prints each floating end with coordinates and rings them on a screenshot. Room equivalent: an edge-leak check (an outline visible through a fill) and a seam check (outline gaps, doubled lines, the "corner halo stripes" we still have open).

Process rules worth stealing word for word:
- "Fixing one close-up by eye breaks another frame. Measure, then look."
- Fix an interlock in the geometry, never with a bias or a nudge.
- A mandatory close-up sweep at 4x of every junction, in both themes, then a "detail pass": any face or corner with nothing true on it is unfinished work. (Our walls are plain on purpose, but cabinets, plinths, handles, sockets and skirting could take it.)
- A review checklist with tick boxes (object, parts, lines, tone, motion, composition) and a "common faults and fixes" table keyed on what you see. A symptom table is the most reusable form for agents.

### 1.3 Gaps in our kitchen the research points at
1. **Layout lives in code twice.** `butterfly.js` keeps its own `BOXES` list of solid things that must mirror `room.js`; positions like `OVEN`, `SIZE`, lamp, bowl and plant are constants spread over files. Anatomy drives everything from one model ("every number comes from the same model that moves its parts"). The skill needs one scene file that feeds the renderer, the validator, the editor and the butterfly's no-go zones.
2. **No automatic overlap or glitch check.** Our checks are screenshots read by eye. The brown cavity, the hidden-edge leaks and the corner stripes were all found by the user, which is the failure Anatomy's whole verify chapter is written against.
3. **Cavity and glow colour.** Anatomy's light-theme chapter describes our exact bug: the oven cavity went brown when an emissive tint was added to a near-black charcoal. Its rules: a cavity gets its own darker token set that keeps all tones so it still has form; light is a tint with a long tail on surfaces, never added brightness; "opacity fades a pale colour to grey"; no bloom in empty air; light lands only where the source can see; hot things run dull red, orange, yellow, near-white with no salmon stage. For a paper-white scene, solve the colour you want to see, then derive the ink.
4. **Every colour is a token.** A colour typed into a shader or a mesh is a theme bug. Our materials hard-code tones (`TONES`, `FAINT`, tint arrays). A token table (paper, four shades, lines, one accent, cavity, daylight) is cheaper to customise, which matters for "customizable interiors".
5. **One lit accent.** Base is `lo`, structure `mid`, the subject `hi`, exactly one `lit` part. Our `autoTone` is a version of this. Making "the hero" an explicit slot lets a new room choose it.
6. **Motion discipline.** Clamp dt to 1/30 s; ease to targets (exponential or real springs); one loop; stop when offscreen; an idle tour that starts after about 1.4 s, pauses on interaction and resumes about 3.6 s after the last one; "arming" (an action waits until every spring has arrived); a take-over bug class (a helper that resets state cancels the user's own toggle in the same frame). Every shader term rides an attack and decay envelope so nothing pops. Verified by a slow-motion contact sheet (time scale 0.05). Our fade-in on leaving home, cavity glow and door light are all candidates. One conflict: Anatomy goes still under reduced motion; our project intent keeps animations on, so do not copy that line.
7. **Accessibility and keyboard.** Anatomy gives each figure a focusable root, keys for every control, an `aria-valuetext` written on choice changes only, and an `aria-live` region that announces phase changes. Our 3D view has no stated keyboard path.
8. **Printable sheets.** `print.mjs` freezes poses as vector stills and lays out A4 PDFs: poster, drawing (parts list, specification, inset, steps), detailed. For us: a "room sheet" with a top-down plan, numbered pins, a parts list and the install-niche dimensions. This would serve the engineer hand-off in the project intent.
9. **A card around the figure** (title top-right, hint bottom-left, live readout bottom-right, legend under it). Our kitchen has leaders and dimension pills but no readout strip.
10. **Auto-framing.** `fitProjection(points, w, h, {pad})` fits any figure so it fills 55-65% of the card. A room generator needs this so a bigger room still frames well.

What our kitchen has that Anatomy does not: free perspective orbit, real GLB (oven, cat), a plant and gust system, a butterfly, daylight and lamp light. Anatomy's engine cannot cover those, so the skill's engine stays our own three.js kit.

## Part 2. Similar skills, tools and papers

"Read" = the source was read in full or cloned. "Skimmed" = a summary or search excerpt only.

### 2.1 Agent skills for three.js
- **img2threejs** (github.com/img2threejs/img2threejs, Apache-2.0, read). A router SKILL.md (466 lines) plus stage guides read on demand, a stdlib-only Python pipeline, about 100 tests, and a JSON spec as the single source. Steal: a **state file as the checklist authority**, where "mark done" needs evidence (`forge/state.py`) and a `next` command prints the next step (exit 3 is a hard stop); a **fail-closed generator** that refuses to write until quality gates pass; deterministic checks before any vision review ("scripts enforce, the model judges"); a four-angle turntable gate; correction caps (3 per pass, 6 total); a word budget on SKILL.md checked in CI. Weak spots: heavy (about 1.1 MB of text), aimed at photo-to-object reconstruction, no asset library, no room layout. Its per-prop island scoring from a Reddit post could not be verified (the post could not be fetched).
- **CloudAI-X/threejs-skills** (read, MIT). 13 topic skills on one template. Steal: the **"Common Mistakes" wrong-to-right table** and a pinned library version in every header. No validators, no examples, no layout.
- **emalorenzo/three-agent-skills** (read, MIT). One file per rule with Why / Bad / Good, an ID with a priority prefix and an impact tag, and an index file. Steal: one-rule-per-file so a validator report can cite a rule ID and the skill can point to it. Its own counts disagree between files, a warning about drift.
- None of these cover room layout, an editor or an asset catalog.

### 2.2 Open-source room and floor-plan editors
- **ch-bas/threejs-sims-house-builder** (read, Next.js + TS). The most complete reference. A single JSON `RoomLayout` in metres, rotation in radians, walls as segments. Grid 0.5 m; wall ends snap to 0.1 m and 15 degree steps; items snap to grid, wall and neighbours (`lib/geometry.ts`, `lib/wall-snap.ts`). Overlap = bounding-radius test then an oriented-box separating-axis test; the reason string is shown on the red item. Also: snapshot undo, 1.5 s debounced autosave, JSON save/load, GLB / SVG / DXF export, group, align, distribute, copy-paste, distance tool, room detection from walls, walkthrough mode. Steal: the snap and OBB rules, the human-readable collision reason, and `repairItem` (repair on load rather than refuse). Weak: adding an item means a code change; no schema version.
- **Codrops "procedural 3D kitchen designer"** (read, article, no repo; inches). Click-click wall and cabinet runs, endpoint snapping within 4", auto-fill a run with standard widths plus a filler piece, auto backsplash where a run meets a wall. Steal: **auto-populate a drawn run**; a small ruleset for fillers. Weak: no undo, no collisions.
- **charmlinn/blueprint3d-modern** (read, TS). A half-edge floorplan model (corners and walls by id) with a corner and wall overlap tolerance, a categorised drag-drop catalog, serialised JSON. Steal: the corner/wall graph for "draw the walls". Weak: remote CDN models, catalog has no dimensions, no collision or undo found.
- **BuildSphere** (read, small R3F). Whole-scene snapshot undo. Little else.
- **Sweet Home 3D** (sweethome3d.com, skimmed). Mature, free, over 10,000 models in the full version; a web version exists. Useful as a feature checklist for the editor (dimensions, levels, walls with thickness, doors and windows as wall inserts). Its catalog format was not inspected.
- **three.js editor** (threejs.org/editor, skimmed). A reference for a command-pattern undo stack and a scene JSON.
- **Townscaper and Wave Function Collapse** (Game Developer interview, skimmed). A constraint solver picks which tile fits a cell from its neighbours; decorations are a separate pass with props placed against surfaces and higher priority. Stalberg's own caveat: it is poor at long thin things. Steal: **adjacency rules for wall, floor and trim modules** and "decorate after structure" as a second pass. Not a fit for furniture placement itself.

### 2.3 LLM scene-layout research (what checks they use)
No paper uses a visual check alone; all lean on geometric rules.
- **Holodeck** (arXiv 2312.09067, read). Objects are 2D boxes with 0/90/180/270 rotation. **Hard rules** reject (collision, out of room). **Soft rules** are the LLM's relations (near, far, in front of, facing, on top of, centre-aligned) and are scored. A DFS or MILP solver places objects; the LLM never writes final coordinates. Steal the hard/soft split and "LLM emits relations, a solver emits coordinates".
- **LayoutGPT** (2305.15393, read). One-shot CSS-style layout from retrieved examples; reports that LLM output still has out-of-bounds and overlaps. Steal: example retrieval as a style prior (our kitchen is the first exemplar) and out-of-bounds rate as a metric.
- **SceneCraft** (2403.01248, read). Relations become scoring functions; a vision model critiques the render and edits constraints; a growing library of constraint functions accumulates. Added a "grounded" rule after renders showed floating lamps. Steal: render-critique loop; constraint library.
- **I-Design** (2404.02838, read). A relation-only scene graph, a Layout Corrector with three checks (out of bounds including children of wall-hugging parents; conflicting adjacency; parent too small for children), acyclic graph, then a backtracking placer. Steal: a deterministic validator pass on the graph before any geometry.
- **InteriorAgent** (3DV 2026, read). The longest checker list: overlap, out-of-bounds, **clearance** (reserved space beside beds and in front of cabinets), **access** (table within reach of seating), **visibility** (sightline from seating to the TV), plus vision-model judgements of proportion and balance. Self-corrects from tracebacks. Closest to what we need.
- **AnyHome** (2312.06644, abstract only).
- **Gap:** none of them checks path-to-door or walkway width. We would add it (a grid flood fill from each door with a minimum corridor width).

### 2.4 Assets and pipelines
- **Quaternius** (Furniture Pack, Ultimate House Interior Pack, Ultimate Food Pack, Animated Animal Pack), **Kenney** (Furniture Kit, Food Kit, Building Kit), **Poly Pizza** bundles: all CC0 low-poly GLB, skimmed. Our cat already came from Kenney (`animal-cat.glb` with its licence file). **Poly Haven** and **ambientCG** supply CC0 textures, HDRIs and models, and both have a search tool available here.
- Idea: **restyle on import.** Strip the GLB's materials and give each mesh our paper fill and crease-angle outline, so any free pack matches the look. This is the cheapest route to a large library. Needs a footprint, height and anchor per asset read from the mesh bounds.
- **glTF Validator** and **glTF-Transform** (Khronos / open source, skimmed): a spec check and an optimiser/inspector CLI (triangle count, texture size). Cheap to wrap as the asset checker.
- A style guide to check against mechanically: line width, tone set, fill count, triangle budget, origin at the left-front-floor corner (our existing element convention), size in millimetres.

### 2.5 Procedural life for props
- **Grass and plant wind** (smythdesign.com, threejsresources.com grass guide, Codrops fluffy grass; skimmed). The standard technique: instanced blades, a vertex shader that moves only the top of each blade (weight by local height) and adds position to the sine phase so gusts travel. Our plant does this on the CPU with a damped spring per blade, which suits one plant; the shader route suits many plants or a hanging herb rack.
- **Bruno Simon's portfolio case study** (skimmed). No real lights or shadows: fake light bounce by face direction and height, vertex-colour cheats, a cheap blur, mobile fallbacks (clamp pixel ratio, no auto matrix updates). Matches our no-HDRI approach and is a mobile-performance checklist.
- Candidates not yet in the kitchen: dust motes in the window light shaft, kettle or pot steam (Anatomy's light-grey steam recipe), a curtain or blind that sways with the same gust series, a ceiling fan, a clock, a cat with idle poses, fish tank, hanging plants.

## Part 3. What this means for the skill (input for the planner)

1. **One scene file** (units millimetres, origin per element as now) drives the renderer, the editor, the validator and the butterfly's no-go zones. This removes the `BOXES` duplication.
2. **Validator in two tiers.** Hard (reject): overlap, out of bounds, floating or sunk, wall-child bounds, door swing and drawer clearance. Soft (score): clearance, access, visibility, symmetry. Add path-to-door and walkway width ourselves. Every rule has an ID, a one-line reason string and a "common faults" row.
3. **Record the true shape.** Footprints come from the real mesh, never a padded box.
4. **Visual checks are a second tier**, run only after the geometry checks pass: edge-leak and seam check, contact sheets slowed 20x for fades, 4x close-ups, as in Anatomy.
5. **State file with evidence** and a hard stop, from img2threejs, so an agent cannot say "done" without the checks.
6. **Assets as recipes plus restyled GLBs**, each with footprint, height, anchor, tags and licence in a data file, not in code.
7. **Colour tokens** (paper, shades, lines, one accent, cavity, daylight) so a room can be re-themed without touching code.
8. **Editor**: use the Sims builder's feature list as the floor: grid 50 mm or 100 mm, snap to grid, wall and neighbours, quarter turns, red-with-reason on collision, snapshot undo, JSON save/load, repair on load, distance tool, top-down and 3D toggle.
9. **Evals and CI**: prompt evals with long expected-output text, plus one regression test per validator rule.
10. **Open question for grilling:** the engine. Anatomy's kit is isometric SVG; ours is three.js with paper fills and outlines. Copy ideas, not code.

## Unverified or not read
- The Reddit posts for img2threejs's island and the parametric home designer could not be fetched.
- furnishup/blueprint3d, the building configurator repo, AnyHome's body, SceneCraft's second paper, Sweet Home 3D's catalog format and the three.js editor's internals were not read.
