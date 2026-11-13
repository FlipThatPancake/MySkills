---
name: cozy-interiors
description: Use when the user asks for a cozy interactive 3D interior as a web page (a kitchen, a living room, a mixed space, any room), or for changes to one built with this skill.
---

# Cozy interiors

A calm three.js interior on one page: paper-white fills, thin grey lines, soft shadows, small signs of life.

`scene/` holds a worked example, a kitchen, with the kit, the checks and the camera tour. Reuse those and build the room the user asks for.

## Build
- Scale and layout: [scene-format.md](references/scene-format.md). scene.json is the single source; positions in real mm.
- Asset: `export function name(kit, params) { return group }`, origin at the left-front-floor corner, built from kit fills and lines.
- New or imported asset: restyle to the look; keep its own look when the user asks (e.g. a hero product from Blender).
- Look: [look.md](references/look.md).
- Frame: a neutral page; a product frame when the project asks for one.

## Check
- `node build.mjs`, then `node check-scene.mjs` (global esbuild and Playwright). Fix each hard issue in the geometry or the mm; the checks measure true parts.
- Door or drawer clash: 90° hinge stop first, then a filler strip.
- Then look: a wide view and 4× close-ups of every junction. A bare face up close gets a small real part.

## Camera
[camera.md](references/camera.md).

## Deliver
One self-contained HTML page (`build.mjs`). Say what the checks reported and what was looked at by eye.
