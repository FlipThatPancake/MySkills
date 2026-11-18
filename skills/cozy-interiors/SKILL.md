---
name: cozy-interiors
description: Use when the user asks for a cozy interactive 3D interior as a web page (a kitchen, a living room, a mixed space, any room), or for changes to one built with this skill.
---

# Cozy interiors

Beautiful views of home areas on one page: paper-white fills, thin grey lines, soft shadows, daylight, small signs of life. Look: [look.md](references/look.md).

## Home and areas
- Home: one sensible layout in real mm; sizes in [scale.md](references/scale.md). An area may be larger than a real room to serve its view.
- Area: an open, spacious space backed by one wall or two at an angle. One area in focus at a time; the page glides between areas.
- Each area is a picture of its own: a hero piece, groups at floor, waist and wall height, something living, something soft. Every object belongs to a group and stands where its owner would use it: [placement.md](references/placement.md).
- Openings give a wall character, as the roll deals them: two-sash, tall-pair, bay, picture and window-wall windows, glass doors, and passages (arch, cased opening, pass-through, portal, pocket door); thick frames, slightly open, a view outside. A way through shows floor running on beyond it.
- Open plan, as the roll deals it: two or three areas share one floor and back wall, in a row or round a corner. Join them with `H.join`, give each its floor with `H.floorZones`, and mark each seam with a separator piece (`sep`), at least one of them furniture.
- Living things move in each area, as the roll deals them: [motion.md](references/motion.md).
- Each home differs in layout and object choice: follow the roll.

## Build
Run from `scene/` with Node, global esbuild (`npm i -g esbuild`) and Playwright (Pillow for shots.mjs). Keep the spec, scene json and page in the user's project.
1. `node roll.mjs [seed] <kinds...>`: this home's choices, including where each plant lives, each area's foreground piece and the accent textile. For a new home leave the seed out: the roll picks one and prints it. A kind the tables lack: add it to tables.json.
2. `node assets.mjs`: every asset with origin, size, mount, params and forms. Missing: a new generator in `src/library/` in the same style, registered in index.js and meta.js; a new painting: [paintings.md](references/paintings.md).
3. A spec script importing compose.mjs (its header lists the calls) writes the scene json, calling `a.alive(roll.areas[id].motion)` for each area; start from `example.spec.mjs`. Pass the roll to `H.roll` so the check sees everything dealt; leave a thing out only with `a.skip(what, why)`.
4. `node check-home.mjs <scene.json>`: fix every layout issue; shot issues wait for step 5. `--quick` skips the slow renders while you work; run it in full before delivering.
5. Views: [camera.md](references/camera.md). `node fitshots.mjs <scene.json>` writes a camera per tour shot to `<scene>.cameras.json`, which the spec reads through cameras.mjs; rerun step 3, then check-home until "No problems".
6. Look by eye: `node snap.mjs <scene.json> out.png all` and `node shots.mjs <scene.json> sheet.png`. `node watch.mjs <scene.json>` shows the living things moving. Each view a still photo of a lived-in home? Fix what reads wrong.

## Deliver
`node build.mjs <scene.json> <out.html>`: one self-contained page. Say what the checks reported and what was looked at by eye.
