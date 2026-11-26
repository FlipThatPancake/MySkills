// pathrules.mjs — the rule 'path', one implementation for check-home and for a.blocking's score (it ran in the page before; the page's own buildHome is built in Node by load.mjs, so the data is the same).
//   pathRules(L) → [{ rule: 'path', id, text }]   L = loadScene(...): objects with .box (world mm, the solid parts, as the page measured them) and walls with .d .n .to .ops
//   4  a door or arch keeps a path 1000 mm wide and 1500 deep (2400 for an arch) straight ahead (floor pieces; rugs do not count)
//   4a the ways through into one area stay joined by a 900 mm wide corridor, from 900 mm in front of one to 900 mm in front of the next (rugs, curtains do not count)
//   4b the front of a console, desk, sideboard, wardrobe, ... keeps 600 mm clear (750 wardrobe, 900 stove; a rug, its own chair or stool excepted)
const toLocal = (W, bb) => { const xs = [], zs = []; for (const x of [bb.min.x, bb.max.x]) for (const z of [bb.min.z, bb.max.z]) { const dx = x - W.to[0], dz = z - W.to[1]; xs.push(-(dx * W.d[0] + dz * W.d[1])); zs.push(dx * W.n[0] + dz * W.n[1]); } return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y0: bb.min.y, y1: bb.max.y }; };
const hit3 = (a, b, tol = 2) => a.x1 - b.x0 > tol && b.x1 - a.x0 > tol && a.z1 - b.z0 > tol && b.z1 - a.z0 > tol && a.y1 - b.y0 > tol && b.y1 - a.y0 > tol;
const FRONT = ['console', 'desk', 'sideboard', 'wardrobe', 'chestOfDrawers', 'bedsideTable', 'glazedCabinet', 'bench', 'fridge', 'baseRun', 'woodStove'];
const FRONT_FREE = ['rug', 'runner', 'curtain', 'chair', 'deskChair', 'stool', 'footstool', 'cat', 'scuff', 'leaf', 'mat', 'logBasket'];

export function pathRules(L) {
  const out = [], O = L.objects.filter((o) => o.box), by = Object.fromEntries(O.map((o) => [o.id, o])), walls = L.walls.filter((w) => w.d);
  const push = (o, what) => out.push({ rule: 'path', id: o.id, text: what });
  for (const W of walls) for (const op of W.ops || []) {
    if (op.kind === 'window' || op.sill > 0 || /pass$/.test(op.style || '')) continue;
    const xc = W.len - op.at, zone = { x0: xc - 500, x1: xc + 500, z0: 0, z1: op.kind === 'arch' ? 2400 : 1500, y0: 0, y1: 1900 };
    for (const o of O) { if (o.mount !== 'floor' || o.asset === 'rug') continue; if (hit3(toLocal(W, o.box), zone, 20)) push(o, `${o.id} blocks the path in front of the ${op.kind} on ${W.id} at ${op.at}`); }
  }
  { const byArea = {}; for (const W of walls) for (const op of W.ops || []) { if (op.kind === 'window' || !op.to) continue; const xc = W.len - op.at, area = String(W.id).replace(/-(back|left|right)$/, ''); (byArea[area] ||= []).push({ W, op, p: [W.to[0] - W.d[0] * xc + W.n[0] * 900, W.to[1] - W.d[1] * xc + W.n[1] * 900] }); }
    for (const [area, ws] of Object.entries(byArea)) for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) { const A = ws[i].p, B = ws[j].p, len = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(1, Math.ceil(len / 100));
      for (const o of O) { if (o.mount !== 'floor' || ['rug', 'curtain'].includes(o.asset) || !o.id.startsWith(area + '-')) continue; const bb = o.box; if (bb.min.y > 1900 || bb.max.y < 50) continue;
        for (let k = 0; k <= n; k++) { const x = A[0] + (B[0] - A[0]) * k / n, z = A[1] + (B[1] - A[1]) * k / n; if (Math.hypot(Math.max(bb.min.x - x, 0, x - bb.max.x), Math.max(bb.min.z - z, 0, z - bb.max.z)) < 450) { push(o, `${o.id} stands in the corridor between the ${ws[i].op.kind} on ${ws[i].W.id} and the ${ws[j].op.kind} on ${ws[j].W.id} of ${area}: keep a 900 mm wide strip of floor clear from one to the other`); break; } } } } }
  for (const f of O) { if (!FRONT.includes(f.asset)) continue; for (const W of walls) { const l = toLocal(W, f.box); if (l.z0 < -60 || l.z0 > 90 || l.x1 < 0 || l.x0 > W.len) continue; const tn = f.scene?.turn; if (tn != null && Math.sin(tn * Math.PI / 180) * W.n[0] + Math.cos(tn * Math.PI / 180) * W.n[1] < 0.7) continue;   // a piece in a corner touches two walls: its front is cleared from the one it stands against (it faces away from)
    const hot = f.asset === 'woodStove', zone = { x0: l.x0 - (hot ? 300 : 0), x1: l.x1 + (hot ? 300 : 0), z0: l.z1, z1: l.z1 + (hot ? 900 : f.asset === 'wardrobe' ? 750 : 600), y0: 0, y1: 1500 };
    for (const o of O) { if (o === f || o.mount !== 'floor' || FRONT_FREE.includes(o.asset)) continue; if (hit3(toLocal(W, o.box), zone, 20)) push(o, `${o.id} stands within 600 mm in front of ${f.id}: keep 600 mm of floor clear in front of a ${f.asset} (750 for a wardrobe, 900 for a stove; only a rug or its own chair or stool may stand there; move the ${o.asset} to a side or to another group)`); } break; } }
  return out;
}
