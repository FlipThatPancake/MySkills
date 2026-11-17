---
name: cozy-interiors
description: Use when the user asks for a cozy interactive 3D interior as a web page (a kitchen, a living room, a mixed space, any room), or for changes to one built with this skill.
---

# Cozy interiors

Beautiful views of home areas on one page: paper-white fills, thin grey lines, soft shadows, daylight, small signs of life. Look: [look.md](references/look.md).

## Home and areas
- Home: one sensible layout in real mm; sizes in [scale.md](references/scale.md). An area may be larger than a real room to serve its view.
- Area: an open, spacious space backed by one wall or two at an angle. One area in focus at a time; the page glides between areas.
- Each area is a picture of its own: a hero piece, groups at floor, waist and wall height, something living, something soft. Every object belongs to a group and serves the area's use.
- Openings give a wall character, as the roll deals them: two-sash, tall-pair, bay, picture and window-wall windows, glass doors, and passages (arch, cased opening, pass-through, portal, pocket door); thick frames, slightly open, a view outside. A way through shows floor running on beyond it.
- Each home differs in layout and object choice: follow the roll.

## Build
Run from `scene/` with Node, global esbuild (`npm i -g esbuild`) and Playwright (Pillow for shots.mjs). Keep the spec, scene json and page in the user's project.
1. `node roll.mjs <seed> <kinds...>`: this home's choices, including where each plant lives, each area's foreground piece and the accent textile. A kind the tables lack: add it to tables.json.
2. `node assets.mjs`: every asset with origin, size, mount, params and forms. Missing: a new generator in `src/library/` in the same style, registered in index.js and meta.js.
3. A spec script importing compose.mjs (its header lists the calls) writes the scene json; start from `example.spec.mjs`.
4. `node check-home.mjs <scene.json>`: fix every layout issue; shot issues wait for step 5. `--quick` skips the slow renders while you work; run it in full before delivering.
5. Views: [camera.md](references/camera.md). `node fitshots.mjs <scene.json>` finds a camera per tour shot; put them in the spec, rerun step 3, then check-home until "No problems".
6. Look by eye: `node snap.mjs <scene.json> out.png all` and `node shots.mjs <scene.json> sheet.png`. Each view a still photo of a lived-in home? Fix what reads wrong.

## Deliver
`node build.mjs <scene.json> <out.html>`: one self-contained page. Say what the checks reported and what was looked at by eye.
