// the settle test: one Rapier world in metres, free objects dynamic, everything else fixed, one second of gravity. A home that stands still passes.
// Free objects: one convex hull per part, mass from the part (volume × 500 kg/m³; an open part, a vessel or a shade, weighs its surface × 3 mm; parts at the foot weigh ×10 so a lamp stands).
// Left out: drapes and cushions (a draped cloth as a fixed mesh pushed its table 105 mm) and objects resting on something soft (a cat on a cushion): the sunk rule checks those.
import { RAPIER, M, partDesc, hullDesc } from './shapes.mjs';
import { environment } from './env.mjs';
import { DRAPE, SOFT, isFree } from './kinds.mjs';
import { supports } from './rules.mjs';

export const SETTLE = { secs: 1, hz: 240, iters: 8, linError: 0.0001, friction: 0.6, density: 500, shell: 3, ballast: 10, foot: 3, maxMove: 5, maxTurn: 2 };
const qrot = (q, [x, y, z]) => { const ix = q.w * x + q.y * z - q.z * y, iy = q.w * y + q.z * x - q.x * z, iz = q.w * z + q.x * y - q.y * x, iw = -q.x * x - q.y * y - q.z * z; return [ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y, iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z, iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x]; };
const hull2 = (P) => { P = [...P].sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (P.length < 3) return P; const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = []; for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of [...P].reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
const margin = (H, p) => { if (H.length < 3) return H.length ? -Math.min(...H.map((q) => Math.hypot(q[0] - p[0], q[1] - p[1]))) : -Infinity; let m = Infinity; for (let i = 0; i < H.length; i++) { const a = H[i], b = H[(i + 1) % H.length], ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez) || 1; m = Math.min(m, (ex * (p[1] - a[1]) - ez * (p[0] - a[0])) / L); } return m; };

export function settleScene(Q, list, opt = {}) {
  const S = { ...SETTLE, ...opt }, L = Q.loaded, find = [], O = Q.objects;
  const W = new RAPIER.World({ x: 0, y: -9.81, z: 0 }); W.timestep = 1 / S.hz; W.integrationParameters.normalizedAllowedLinearError = S.linError; W.integrationParameters.numSolverIterations = S.iters;
  // which objects fall: free, not a drape, and nothing soft under them
  const softUnder = new Set(), rests = []; // objects resting on something soft stay out, and so does whatever rests on them
  for (const c of list) for (const mine of ['a', 'b']) { const A = mine === 'a' ? c.a : c.b, B = mine === 'a' ? c.b : c.a; if (c.d > 2 || !supports(c, mine)) continue; rests.push([A.owner, B.owner]); if (SOFT.test(O[B.owner]?.asset || '') && !/rug/i.test(O[B.owner]?.asset || '')) softUnder.add(A.owner); }
  for (let grew = true; grew;) { grew = false; for (const [a, b] of rests) if ((softUnder.has(b) || DRAPE.test(O[b]?.asset || '')) && !softUnder.has(a) && O[a]) { softUnder.add(a); grew = true; } }
  const dyn = new Map(); let lost = 0;
  const fixedBody = W.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  const addFixed = (p, owner) => { const c = [(p.box.mn[0] + p.box.mx[0]) / 2, (p.box.mn[1] + p.box.mx[1]) / 2, (p.box.mn[2] + p.box.mx[2]) / 2], s = partDesc(p, c); if (!s.d) { lost++; find.push({ rule: 'shape-failed', id: owner, text: `${owner}: a part could not be made into a shape for the settle test` }); return; } const b = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(c[0] * M, c[1] * M, c[2] * M)); W.createCollider(s.d.setFriction(S.friction), b); };
  for (const p of environment(L)) addFixed(p, p.role);
  for (const o of L.objects) {
    const free = isFree(o);
    if (DRAPE.test(o.asset || '') || softUnder.has(o.id)) continue;   // left out of the world (a fixed cat sunk into its cushion would push the seat down)
    if (!free) { for (const p of o.parts) if (p.kind !== 'flat' || !isFree(o)) addFixed(p, o.id); continue; }
    let cx = 0, cy = 0, cz = 0, n = 0, y0 = Infinity; for (const p of o.parts) { y0 = Math.min(y0, p.box.mn[1]); for (let i = 0; i < p.tris.length; i += 3) { cx += p.tris[i]; cy += p.tris[i + 1]; cz += p.tris[i + 2]; n++; } } if (!n) continue; cx /= n; cy /= n; cz /= n;
    const body = W.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(cx * M, cy * M, cz * M).setCanSleep(false)); let any = false; const verts = [];
    for (const p of o.parts) {
      if (p.kind === 'flat') continue; const h = hullDesc(p.tris, [cx, cy, cz]); if (!h) { lost++; find.push({ rule: 'shape-failed', id: o.id, text: `${o.id} (${o.asset}): a part could not be made into a hull for the settle test` }); continue; }
      const mm3 = p.kind === 'open' ? p.area * S.shell : p.vol, kg = Math.max(mm3 * 1e-9 * S.density * (p.box.mn[1] < y0 + S.foot ? S.ballast : 1), 1e-4);
      W.createCollider(h.d.setMass(kg).setFriction(S.friction).setContactSkin(0), body); any = true;
      for (let i = 0; i < p.tris.length; i += 30) verts.push([(p.tris[i] - cx) * M, (p.tris[i + 1] - cy) * M, (p.tris[i + 2] - cz) * M]);
    }
    if (!any) { W.removeRigidBody(body); continue; }
    dyn.set(o.id, { body, o, verts, com0: { ...body.worldCom() }, y0 });
  }
  // centre of mass over the support polygon, from the contacts after one tiny step
  W.timestep = 1e-6; W.step(); W.timestep = 1 / S.hz;
  const owner = new Map(); for (const [id, d] of dyn) for (let i = 0; i < d.body.numColliders(); i++) owner.set(d.body.collider(i).handle, id);
  for (const [id, d] of dyn) {
    const com = d.body.worldCom(), pts = [];
    for (let i = 0; i < d.body.numColliders(); i++) { const col = d.body.collider(i); W.contactPairsWith(col, (other) => { if (owner.get(other.handle) === id) return; W.contactPair(col, other, (m, flipped) => { const ny = flipped ? -m.normal().y : m.normal().y; for (let k = 0; k < m.numSolverContacts(); k++) { const p = m.solverContactPoint(k); if (Math.abs(ny) > 0.5 && p.y < com.y) pts.push([p.x / M, p.z / M]); } }); }); }
    d.margin = margin(hull2(pts), [com.x / M, com.z / M]);
  }
  for (let i = 0; i < S.secs * S.hz; i++) W.step();
  for (const [id, d] of dyn) {
    const com = d.body.worldCom(), r = d.body.rotation(), dx = (com.x - d.com0.x) / M, dy = (com.y - d.com0.y) / M, dz = (com.z - d.com0.z) / M, mv = Math.hypot(dx, dy, dz);
    const turn = 2 * Math.acos(Math.min(1, Math.abs(r.w))) * 180 / Math.PI;
    d.mv = mv; d.turn = turn; d.dy = dy; if (mv <= S.maxMove && turn <= S.maxTurn) continue;
    const how = turn > S.maxTurn && !(dy < -S.maxMove && !Number.isFinite(d.margin)) ? `tips over (turns ${turn.toFixed(1)}°, ${Number.isFinite(d.margin) ? `its centre of mass is ${Math.round(-d.margin)} mm past its support` : 'nothing under it holds it'})` : dy < -S.maxMove ? `falls ${Math.round(-dy)} mm` : dy > S.maxMove ? `is pushed ${Math.round(dy)} mm up out of something` : `slides ${Math.round(Math.hypot(dx, dz))} mm`;
    find.push({ rule: 'moves', id, asset: d.o.asset, mm: +mv.toFixed(1), dy: +dy.toFixed(1), deg: +turn.toFixed(1), margin: Math.round(d.margin), text: `${id} (${d.o.asset}) ${how} in one second` });
  }
  Q.settled = Object.fromEntries([...dyn].map(([id, d]) => [id, { mm: d.mv, deg: d.turn, dy: d.dy, margin: d.margin }]));
  W.free(); return find;
}
