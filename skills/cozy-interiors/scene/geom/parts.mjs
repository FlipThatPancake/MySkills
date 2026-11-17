// inside one asset: does a part pass right through another? (replaces physics.mjs --parts)
// Two parts that cross deeper than 20 mm are one of two things, told apart along the direction that separates them fastest (the contact normal):
//   an embedded end (one part ends inside the other: a leg into a top, a rail into a post): joinery, allowed;
//   a pass-through (one part sticks out of the other on both sides): a bug, unless a part is declared with { through: true } on the kit call.
// A kit.content(...) part (a magazine, a log) is a separate body inside the asset: any crossing deeper than 20 mm fails, embedded or not.
import { RAPIER, M, partDesc } from './shapes.mjs';
import { loadScene } from './load.mjs';

export const PARTS = { depth: 20, slack: 1 };

export async function checkParts(scene, { src, depth = PARTS.depth, all = false } = {}) {
  const L = scene.objects ? scene : await loadScene(scene, { src }), W = new RAPIER.World({ x: 0, y: 0, z: 0 }), find = [];
  for (const o of L.objects) {
    const P = []; o.parts.forEach((p, k) => { if (p.kind === 'flat') return; const c = [(p.box.mn[0] + p.box.mx[0]) / 2, (p.box.mn[1] + p.box.mx[1]) / 2, (p.box.mn[2] + p.box.mx[2]) / 2], s = partDesc(p, c); if (!s.d) return; const b = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(c[0] * M, c[1] * M, c[2] * M)); P.push({ k, p, col: W.createCollider(s.d, b), mesh: s.how === 'mesh' }); });
    let worst = null; const every = [];
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const A = P[i], B = P[j], a = A.p.box, b = B.p.box;
      if (a.mn[0] > b.mx[0] - depth || a.mx[0] < b.mn[0] + depth || a.mn[1] > b.mx[1] - depth || a.mx[1] < b.mn[1] + depth || a.mn[2] > b.mx[2] - depth || a.mx[2] < b.mn[2] + depth) continue;
      let r = null; try { r = A.col.contactCollider(B.col, 0); } catch {} if (!r || r.distance >= 0) continue;
      const d = -r.distance / M; if (d <= depth) continue;
      const n = r.normal1, proj = (t) => { let lo = Infinity, hi = -Infinity; for (let q = 0; q < t.length; q += 3) { const v = t[q] * n.x + t[q + 1] * n.y + t[q + 2] * n.z; if (v < lo) lo = v; if (v > hi) hi = v; } return [lo, hi]; };
      const [al, ah] = proj(A.p.tris), [bl, bh] = proj(B.p.tris), E = PARTS.slack, pierce = (al < bl - E && ah > bh + E) || (bl < al - E && bh > ah + E);
      const content = A.p.content || B.p.content, declared = A.p.through || B.p.through;
      if (declared && !content) continue; if (!pierce && !content) continue;
      const o0 = [Math.min(...o.parts.map((q) => q.box.mn[0])), Math.min(...o.parts.map((q) => q.box.mn[1])), Math.min(...o.parts.map((q) => q.box.mn[2]))]; every.push({ d: Math.round(d), parts: [A.k, B.k], types: [A.p.type, B.p.type], boxes: [A, B].map((x) => [...x.p.box.mn.map((v, i) => Math.round(v - o0[i])), ...x.p.box.mx.map((v, i) => Math.round(v - o0[i]))].join(',')), content });
      if (!worst || d > worst.depth) worst = { depth: Math.round(d), parts: [A.k, B.k], boxes: [A, B].map((x) => [...x.p.box.mn, ...x.p.box.mx].map(Math.round)), types: [A.p.type, B.p.type], content, pierce };
    }
    if (worst) find.push({ rule: 'parts', id: o.id, asset: o.asset, ...(all ? { all: every } : {}), ...worst, text: `${o.id} (${o.asset}): two of its own parts pass ${worst.depth} mm ${worst.pierce ? 'right through' : 'into'} each other (parts ${worst.parts[0]} [${worst.boxes[0].join(',')}] and ${worst.parts[1]} [${worst.boxes[1].join(',')}])${worst.content ? ', one marked content' : ''}` });
  }
  W.free(); return find;
}
