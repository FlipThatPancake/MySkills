// @js:sheet — painted flat helpers shared by the set and the openings: a canvas, a transparent textured plane that follows the kit's fade, and soft contact halos.
// (Generalised from kitchen/atmosphere.js, which stays as the old kitchen's own copy.)
const HALO = 'rgba(138,138,128,';   // anatomy's halo colour; its alpha is passed per halo

export function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.ceil(w)); c.height = Math.max(2, Math.ceil(h));
  return c;
}
// A transparent textured plane that follows the kit's opacity and never writes depth. `side` also follows kit.sideVis (things on the side wall).
export function sheet(kit, canvas, w, h, side = false) {
  const T = kit.THREE, t = new T.CanvasTexture(canvas);
  t.colorSpace = T.SRGBColorSpace;
  const mat = new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const m = new T.Mesh(new T.PlaneGeometry(w, h), mat);
  m.renderOrder = 1;
  m.onBeforeRender = () => { mat.opacity = kit.fill.uniforms.uOpacity.value * (side ? kit.sideVis.value : 1); };
  return m;
}
// A blurred halo round a footprint (a0..a1 by b0..b1): on a floor-like surface at height `at` ('floor': a = x, b = z), on the back wall at depth `at` ('back': a = x, b = y)
// or on a side wall at x = `at` ('side': a = z, b = y).
export function halo(kit, orient, a0, a1, b0, b1, at, alpha = 0.26) {
  const pad = 140, k = 0.1, W = a1 - a0 + 2 * pad, H = b1 - b0 + 2 * pad;
  const c = canvasOf(W * k, H * k), g = c.getContext('2d');
  g.filter = 'blur(8px)';
  g.fillStyle = HALO + alpha + ')';
  g.fillRect(pad * k, pad * k, (a1 - a0) * k, (b1 - b0) * k);
  const m = sheet(kit, c, W, H, orient === 'side'), ca = (a0 + a1) / 2, cb = (b0 + b1) / 2;
  if (orient === 'floor') { m.rotation.x = -Math.PI / 2; m.position.set(ca, at, cb); }
  else if (orient === 'back') m.position.set(ca, cb, at);
  else { m.rotation.y = Math.PI / 2; m.position.set(at, cb, ca); }
  return m;
}
