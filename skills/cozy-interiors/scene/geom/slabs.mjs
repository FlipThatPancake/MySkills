// report only: which assets read as flat slabs? For each asset the front-facing (+z) faces of at least 300 mm² are grouped into depth planes (faces within 2 mm of one z are one plane); an asset at least 250 x 250 mm in front view with 1 or 2 planes is one slab with no relief. Parts are counted too: the planes per part show which part is flat.
import { loadScene } from './load.mjs';
export const SLAB = { area: 300, gap: 2, min: 250, planes: 2 };
export async function slabReport(scene, { src } = {}) {
  const L = scene.objects ? scene : await loadScene(scene, { src }), rows = [];
  for (const o of L.objects) {
    const Z = [], per = []; let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    o.parts.forEach((p, k) => { const t = p.tris, zs = []; x0 = Math.min(x0, p.box.mn[0]); x1 = Math.max(x1, p.box.mx[0]); y0 = Math.min(y0, p.box.mn[1]); y1 = Math.max(y1, p.box.mx[1]);
      for (let i = 0; i + 8 < t.length; i += 9) { const ux = t[i + 3] - t[i], uy = t[i + 4] - t[i + 1], uz = t[i + 5] - t[i + 2], vx = t[i + 6] - t[i], vy = t[i + 7] - t[i + 1], vz = t[i + 8] - t[i + 2], nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz); if (l / 2 < SLAB.area || nz / l < 0.95) continue; zs.push(t[i + 2]); Z.push(t[i + 2]); }
      per.push(planes(zs)); });
    const n = planes(Z); rows.push({ id: o.id, asset: o.asset, planes: n, perPart: per, w: Math.round(x1 - x0), h: Math.round(y1 - y0), slab: n >= 1 && n <= SLAB.planes && x1 - x0 >= SLAB.min && y1 - y0 >= SLAB.min });
  }
  return rows;
}
function planes(zs) { zs.sort((a, b) => a - b); let n = 0, last = -Infinity; for (const z of zs) if (z - last > SLAB.gap) { n++; last = z; } return n; }
