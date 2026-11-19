// @js:library-artplane — a toned classic painting as a flat textured plane, shared by the picture's painting forms (variants.js) and the standing photo (decor.js). The page decodes the JPEG and draws it; the node checks have no image decoder and keep the blank paper.
// artPlane(kit, P, { w, h, fit: 'contain' | 'cover', margins: [l, r, t, b] mm, mode, crop: { x, y, w } fractions of the source, px }) -> a Mesh w x h mm facing +z, centred on its own origin.
// fitFrame(P, w, h): a frame outer size that follows the painting's own proportions inside the box w x h, with even mat margins (the bottom a fifth deeper): { W, H, iw, ih (the mat opening), margins }.
import { PAPER, adapt } from './paintTone.js';
const LOADED = new Map();
export const FRAME = { F: 28, mat: 46 };   // frame width, mat margin (mm)
export function fitFrame(P, w, h, F = FRAME.F, mat = FRAME.mat) {
  const a = P.w / P.h, ml = mat, mt = mat, mb = Math.round(mat * 1.2), ph = Math.max(60, Math.min((w - 2 * F - 2 * ml) / a, h - 2 * F - mt - mb)), pw = ph * a;
  return { W: pw + 2 * (F + ml), H: ph + 2 * F + mt + mb, iw: pw + 2 * ml, ih: ph + mt + mb, margins: [ml, ml, mt, mb] };
}
export function artPlane(kit, P, { w, h, fit = 'contain', margins = [0, 0, 0, 0], mode = 'keep', crop, px = 480 } = {}) {
  const T = kit.THREE, cw = px, ch = Math.max(64, Math.min(2 * px, Math.round(px * h / w))), c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const q = c.getContext('2d'), sx = cw / w, mat = kit.paint(c, false, true), m = new T.Mesh(new T.PlaneGeometry(w, h), mat); q.fillStyle = `rgb(${PAPER})`; q.fillRect(0, 0, cw, ch);
  if (typeof Image !== 'undefined') {
    const draw = (img) => {
      const nw = img.naturalWidth || P.w, nh = img.naturalHeight || P.h, bx = Math.round(margins[0] * sx), by = Math.round(margins[2] * sx), bw = Math.round(cw - (margins[0] + margins[1]) * sx), bh = Math.round(ch - (margins[2] + margins[3]) * sx);
      let dx = bx, dy = by, dw = bw, dh = bh, src = [0, 0, nw, nh];
      if (crop) { const sw = nw * crop.w, shh = Math.min(nh, sw * bh / bw); src = [nw * crop.x, nh * crop.y, sw, shh]; }
      else if (fit === 'contain') { const s = Math.min(bw / nw, bh / nh); dw = Math.round(nw * s); dh = Math.round(nh * s); dx = bx + Math.round((bw - dw) / 2); dy = by + Math.round((bh - dh) / 2); }
      q.drawImage(img, ...src, dx, dy, dw, dh); adapt(q, dx, dy, dw, dh, mode); mat.uniforms.uMap.value.needsUpdate = true;
    };
    let img = LOADED.get(P.src); if (!img) { img = new Image(); img.src = P.src; LOADED.set(P.src, img); }
    if (img.complete && img.naturalWidth) draw(img); else img.addEventListener('load', () => draw(img));
  }
  return m;
}
