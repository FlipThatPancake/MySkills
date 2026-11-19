// @js:sheet — painted flat helpers shared by the set and the openings: a canvas, a transparent textured plane that follows the kit's fade, and soft contact halos.
// (Generalised from kitchen/atmosphere.js, which stays as the old kitchen's own copy.)
const HALO = 'rgba(138,138,128,';   // anatomy's halo colour; its alpha is passed per halo

export function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.ceil(w)); c.height = Math.max(2, Math.ceil(h));
  return c;
}
// What the view fade is doing now (home.js sets it next to kit.setViewFade): a sheet thins out with the distance of its middle from `c`, like everything else.
export const VIEW = { c: null, h: null, r0: 1e9, r1: 2e9 };
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// A transparent textured plane that follows the kit's opacity and the view fade and never writes depth. `vis` ({ value } 0..1) is a wall's own visibility, for things standing on that wall.
export function sheet(kit, canvas, w, h, vis = null, first = false) {
  const t = new kit.THREE.CanvasTexture(canvas); t.colorSpace = kit.THREE.SRGBColorSpace;
  return sheetTex(kit, t, w, h, vis, null, first);
}
// the same plane from any texture (a baked render target, say)
export function sheetTex(kit, t, w, h, vis = null, gain = null, first = false) {   // gain: { value } 0..1, a fade a caller drives; first: a backdrop drawn before everything else (see below)
  const T = kit.THREE, mid = new T.Vector3();
  // first: the plane is drawn in the opaque pass before every other piece, writes no depth, and fades by custom blending (so opacity still works): whatever is drawn later, a sash or a bird outside a window, lies over it whatever its depth
  const mat = first ? new T.MeshBasicMaterial({ map: t, transparent: false, blending: T.CustomBlending, blendSrc: T.SrcAlphaFactor, blendDst: T.OneMinusSrcAlphaFactor, blendSrcAlpha: T.OneFactor, blendDstAlpha: T.OneMinusSrcAlphaFactor, depthWrite: false, toneMapped: false })
    : new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const m = new T.Mesh(new T.PlaneGeometry(w, h), mat);
  m.renderOrder = first ? -10 : 1;
  m.onBeforeRender = () => {
    let f = 1;
    if (VIEW.c) { m.getWorldPosition(mid); mid.sub(VIEW.c); mid.set(Math.max(Math.abs(mid.x) - VIEW.h.x, 0), Math.max(Math.abs(mid.y) - VIEW.h.y, 0), Math.max(Math.abs(mid.z) - VIEW.h.z, 0)); f = 1 - sm(VIEW.r0, VIEW.r1, mid.length()); }
    mat.opacity = kit.fill.uniforms.uOpacity.value * f * (vis ? vis.value : 1) * (gain ? gain.value : 1);
  };
  return m;
}
// The outside picture of a window is clipped to its opening with the stencil buffer, so nothing drawn after it (the paper floor that runs on beyond the wall, a fade fill) can paint over it, and a sash or a bird outside still lies over it.
// openingMask(kit, pts) -> a mesh (the opening's outline [z, y] at the wall face, in the opening's frame) to add next to the picture; stencilClip(sky) restricts the picture to it; STENCIL_OUT(material) keeps a material off the masked pixels.
export const MASK_REF = 7;
export function openingMask(kit, pts) {
  const T = kit.THREE, shape = new T.Shape(pts.map(([z, y]) => new T.Vector2(-z, y)));
  const m = new T.Mesh(new T.ShapeGeometry(shape), new T.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false, side: T.DoubleSide, stencilWrite: true, stencilRef: MASK_REF, stencilFunc: T.AlwaysStencilFunc, stencilZPass: T.ReplaceStencilOp }));
  m.rotation.y = Math.PI / 2; m.renderOrder = -11; m.name = 'opening-mask'; m.userData.kitLine = true; m.frustumCulled = false;
  return m;
}
export function stencilClip(kit, sky) {
  const T = kit.THREE; Object.assign(sky.material, { stencilWrite: true, stencilRef: MASK_REF, stencilFunc: T.EqualStencilFunc, stencilFail: T.KeepStencilOp, stencilZFail: T.KeepStencilOp, stencilZPass: T.KeepStencilOp });
  return sky;
}
export function stencilOut(kit, material) {   // the paper that runs on behind the walls: not where an opening's picture lies
  const T = kit.THREE; Object.assign(material, { stencilWrite: true, stencilRef: MASK_REF, stencilFunc: T.NotEqualStencilFunc, stencilFail: T.KeepStencilOp, stencilZFail: T.KeepStencilOp, stencilZPass: T.KeepStencilOp });
  return material;
}
// A blurred halo round a footprint (a0..a1 by b0..b1): on a floor-like surface at height `at` ('floor': a = x, b = z), on the back wall at depth `at` ('back': a = x, b = y)
// or on a side wall at x = `at` ('side': a = z, b = y).
export function halo(kit, orient, a0, a1, b0, b1, at, alpha = 0.26, vis = null) {
  const pad = 140, k = 0.1, W = a1 - a0 + 2 * pad, H = b1 - b0 + 2 * pad;
  const c = canvasOf(W * k, H * k), g = c.getContext('2d');
  g.filter = 'blur(8px)';
  g.fillStyle = HALO + alpha + ')';
  g.fillRect(pad * k, pad * k, (a1 - a0) * k, (b1 - b0) * k);
  const m = sheet(kit, c, W, H, vis), ca = (a0 + a1) / 2, cb = (b0 + b1) / 2;
  if (orient === 'floor') { m.rotation.x = -Math.PI / 2; m.position.set(ca, at, cb); }
  else if (orient === 'back') m.position.set(ca, cb, at);
  else if (orient === 'sideR') { m.rotation.y = -Math.PI / 2; m.position.set(at, cb, ca); }   // right-hand side wall: the plane faces -x
  else { m.rotation.y = Math.PI / 2; m.position.set(at, cb, ca); }
  return m;
}
// A soft round patch of light (an ellipse w x h with a radial falloff) on the floor ('floor', centred x = cx, z = cy at height `at`) or on a wall facing +z ('back', centred x = cx, y = cy at depth `at`).
export function glow(kit, orient, cx, cy, w, h, rgb, alpha, at, vis = null) {
  const c = canvasOf(96, 96 * h / w), g = c.getContext('2d'), gr = g.createRadialGradient(c.width / 2, c.height / 2, 0, c.width / 2, c.height / 2, c.width / 2);
  gr.addColorStop(0, `rgba(${rgb},${alpha})`); gr.addColorStop(0.5, `rgba(${rgb},${alpha * 0.45})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.save(); g.scale(1, c.height / c.width); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.width); g.restore();
  const m = sheet(kit, c, w, h, vis);
  if (orient === 'floor') { m.rotation.x = -Math.PI / 2; m.position.set(cx, at, cy); } else m.position.set(cx, cy, at);
  return m;
}
