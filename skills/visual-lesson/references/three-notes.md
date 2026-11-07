# three.js notes

Use three.js only when the idea is truly 3D and needs smooth rotation or many triangles, for example gradient descent on a loss surface. For a simple wireframe, `LV.project` and `LV.orbit` on Canvas 2D are enough.

## Loading (current three.js, not the old global build)

```html
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/"
} }
</script>
<script type="module">
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  // …
</script>
```

- The `three.min.js` global build was removed in r161. Do not write `<script src=".../three.min.js">` or use `THREE` as a global.
- Import add-ons from `three/addons/`, not from `three/examples/jsm/` paths of older tutorials.
- Use `renderer.setAnimationLoop(fn)` and `THREE.Timer`. `Clock` and `outputEncoding` are outdated; light the scene with `scene.environmentIntensity` or plain lights.
- Use WebGL (`WebGLRenderer`), not WebGPU.
- The stage is scaled with CSS, so set `renderer.setPixelRatio(Math.min(devicePixelRatio, 2) * LV.scale)` and call it again when `LV.scale` changes, or the canvas looks blurry. Size the renderer to its host in stage units (`host.offsetWidth`), and dispose of geometry you replace.
- The pinned version was chosen without a live load test. If it fails to load, try the nearest earlier version and keep the fallback.
- Since the module loads asynchronously, call kit functions such as `LV.on` from inside the module, after it has loaded.
- When several slides show the same 3D scene, keep one renderer and move `renderer.domElement` into the active slide's host in `LV.on(id, {enter})`. Stop drawing when no 3D slide is shown.

## Fallback

Keep the state and a 2D view (for example a contour map from above, with the same ball and path) in the classic script. The module only adds the 3D view. Switch to 2D when the module fails, or when it has not loaded after a few seconds:

```html
<script type="module" onerror="useFlat()">…</script>
<script>
  window.addEventListener('load', function () { setTimeout(function () { if (!window.view3d) useFlat(); }, 8000); });
</script>
```

## Loss-surface recipe

- Same black stage. Draw the surface as a semi-transparent plane coloured by height with a grey ramp, since the surface is structure and the accents belong to the ball, slope and steps. Mark the minimum in green. No rainbow maps. Add a faint floor grid or contour lines projected on the floor.
- The optimiser is a bright yellow ball with a short fading trail. Draw the path so far as a line, and the next step as a short arrow along the downhill direction.
- Objects drawn on a semi-transparent surface disappear under it. Give the ball, arrows and path `depthTest: false`, `transparent: true` and a higher `renderOrder`.
- WebGL lines are always 1 pixel wide. Build arrows and tangent lines from cylinder and cone meshes. On a bowl, draw an arrow as a chord that follows the surface, because an arrow along the tangent plane hides under the bowl.
- Labels are HTML placed over the canvas. Each frame, project their 3D anchor: `v.copy(anchor).project(camera)`, then `left = (v.x + 1) / 2 * width` and `top = (1 - v.y) / 2 * height`, and hide the label when `|v.x|` or `|v.y|` is near 1.
- A wide host (for example 960 × 440) needs a lower camera that faces the surface from the front, or the floor is cut off.
- One main control: the learning rate, with a cue. Optional: click the surface to pick a start point, plus Step, Run, and Reset buttons.
- One state drives both the 3D scene and the readouts (loss, step count).
- Use `OrbitControls` with damping, a fixed starting angle that shows the shape, and a "reset view" button. A slow auto-rotate may run for a few seconds and stops at the first drag.
- Give the canvas the class `lv-interactive` so dragging does not change slides.
- If WebGL or the module fails, show the 2D view described under Fallback.
