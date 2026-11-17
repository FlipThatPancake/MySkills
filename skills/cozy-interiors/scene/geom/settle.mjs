// the settle test: one Rapier world in metres, free objects dynamic, everything else fixed, one second of gravity. A home that stands still passes.
// Free objects: one convex hull per part, mass from the part (volume × 500 kg/m³; an open part, a vessel or a shade, weighs its surface × 3 mm; parts at the foot weigh ×10 so a lamp stands).
// Left out: drapes and cushions (a draped cloth as a fixed mesh pushed its table 105 mm) and objects resting on something soft (a cat on a cushion): the sunk rule checks those.
import { RAPIER, M, partDesc, hullDesc, meshDesc, slabDesc } from './shapes.mjs';
import { environment } from './env.mjs';
import { DRAPE, SOFT, isFree } from './kinds.mjs';
import { supports } from './rules.mjs';

export const SETTLE = { angDamp: 0, linDamp: 0, secs: 1, hz: 240, iters: 8, linError: 0.0001, friction: 0.6, density: 500, shell: 3, ballast: 10, foot: 3, maxMove: 5, maxTurn: 4 }   // measured on the foot (where it stands), not the centre of mass: a top-heavy lamp rocks up to 3° on its base in the solver without tipping; a body that tips turns 10° or more;
const qrot = (q, [x, y, z]) => { const ix = q.w * x + q.y * z - q.z * y, iy = q.w * y + q.z * x - q.x * z, iz = q.w * z + q.x * y - q.y * x, iw = -q.x * x - q.y * y - q.z * z; return [ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y, iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z, iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x]; };
const hull2 = (P) => { P = [...P].sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (P.length < 3) return P; const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = []; for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (const p of [...P].reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
const margin = (H, p) => { if (H.length < 3) return H.length ? -Math.min(...H.map((q) => Math.hypot(q[0] - p[0], q[1] - p[1]))) : -Infinity; let m = Infinity; for (let i = 0; i < H.length; i++) { const a = H[i], b = H[(i + 1) % H.length], ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez) || 1; m = Math.min(m, (ex * (p[1] - a[1]) - ez * (p[0] - a[0])) / L); } return m; };

export function settleScene(Q, list, opt = {}, polys = {}) {
  const S = { ...SETTLE, ...opt }, L = Q.loaded, find = [], O = Q.objects;
  const W = new RAPIER.World({ x: 0, y: -9.81, z: 0 }); W.timestep = 1 / S.hz; W.integrationParameters.normalizedAllowedLinearError = S.linError; W.integrationParameters.numSolverIterations = S.iters;
  // which objects fall: free, not a drape, and nothing soft under them
  const softUnder = new Set(), rests = []; // objects resting on something soft stay out, and so does whatever rests on them
  for (const c of list) for (const mine of ['a', 'b']) { const A = mine === 'a' ? c.a : c.b, B = mine === 'a' ? c.b : c.a; if (c.d > 2 || !supports(c, mine)) continue; rests.push([A.owner, B.owner]); if (SOFT.test(O[B.owner]?.asset || '') && !/rug/i.test(O[B.owner]?.asset || '')) softUnder.add(A.owner); }
  for (let grew = true; grew;) { grew = false; for (const [a, b] of rests) if ((softUnder.has(b) || DRAPE.test(O[b]?.asset || '')) && !softUnder.has(a) && O[a]) { softUnder.add(a); grew = true; } }
  const dyn = new Map(); let lost = 0;
  const fixedBody = W.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  const addFixed = (p, owner) => { const c = [(p.box.mn[0] + p.box.mx[0]) / 2, (p.box.mn[1] + p.box.mx[1]) / 2, (p.box.mn[2] + p.box.mx[2]) / 2];
    const ext = p.box.mx.map((v, i) => v - p.box.mn[i]), thin = Math.min(...ext) / Math.max(...ext) < 0.03, s = (thin && (slabDesc(p.tris, c) || meshDesc(p.tris, c))) || partDesc(p, c);   // a very flat hull (a rug 7 mm by 2.4 m) lets things fall through in Rapier: those fixed parts stay triangle meshes
    if (!s.d) { lost++; find.push({ rule: 'shape-failed', id: owner, text: `${owner}: a part could not be made into a shape for the settle test` }); return; } const b = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(c[0] * M, c[1] * M, c[2] * M)); W.createCollider(s.d.setFriction(S.friction), b); };
  for (const p of environment(L)) addFixed(p, p.role);
  for (const o of L.objects) {
    const free = isFree(o) && !/^(roundTable|table|desk)$/.test(o.asset || '');   // a table is heavy: a chair tucked against it must not carry it (and the books on it) sideways
    if (DRAPE.test(o.asset || '') || softUnder.has(o.id)) continue;   // left out of the world (a fixed cat sunk into its cushion would push the seat down)
    if (!free) { for (const p of o.parts) if (p.kind !== 'flat' || !isFree(o)) addFixed(p, o.id); continue; }
    let cx = 0, cy = 0, cz = 0, n = 0, y0 = Infinity; for (const p of o.parts) { y0 = Math.min(y0, p.box.mn[1]); for (let i = 0; i < p.tris.length; i += 3) { cx += p.tris[i]; cy += p.tris[i + 1]; cz += p.tris[i + 2]; n++; } } if (!n) continue; cx /= n; cy /= n; cz /= n;
    const foot = []; for (const p of o.parts) { const V = p.verts || p.tris; for (let i = 0; i < V.length; i += 3) if (V[i + 1] < y0 + S.foot) foot.push([(V[i] - cx) * M, (V[i + 1] - cy) * M, (V[i + 2] - cz) * M]); }   // the foot: where it stands. A tall lamp rocking half a degree moves its centre of mass 8 mm and its foot nothing
    const body = W.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(cx * M, cy * M, cz * M).setCanSleep(false).setAngularDamping(S.angDamp).setLinearDamping(S.linDamp)); let any = false; const verts = [];
    for (const p of o.parts) {
      if (p.kind === 'flat') continue; const h = hullDesc(p.verts || p.tris, [cx, cy, cz]); if (!h) { lost++; find.push({ rule: 'shape-failed', id: o.id, text: `${o.id} (${o.asset}): a part could not be made into a hull for the settle test` }); continue; }
      const mm3 = p.kind === 'open' ? p.area * S.shell : p.vol, kg = Math.max(mm3 * 1e-9 * S.density * (p.box.mn[1] < y0 + S.foot ? S.ballast : 1), 1e-4);
      W.createCollider(h.d.setMass(kg).setFriction(S.friction).setContactSkin(0), body); any = true;
      for (let i = 0; i < p.tris.length; i += 30) verts.push([(p.tris[i] - cx) * M, (p.tris[i + 1] - cy) * M, (p.tris[i + 2] - cz) * M]);
    }
    if (!any) { W.removeRigidBody(body); continue; }
    dyn.set(o.id, { body, o, verts, foot, com0: { ...body.worldCom() }, t0: { ...body.translation() }, y0 });
  }
  // centre of mass over the support polygon (the part of its base that lies over what holds it up, from the overhang rule)
  for (const [id, d] of dyn) d.margin = polys[id]?.length >= 3 ? margin(polys[id], [d.com0.x / M, d.com0.z / M]) : NaN;
  for (let i = 0; i < S.secs * S.hz; i++) W.step();
  for (const [id, d] of dyn) {
    const r = d.body.rotation(), t = d.body.translation(), com = d.body.worldCom(); let fx = 0, fy = 0, fz = 0; const f0 = [0, 0, 0];
    for (const v of d.foot) { const w = qrot(r, v); fx += w[0]; fy += w[1]; fz += w[2]; f0[0] += v[0]; f0[1] += v[1]; f0[2] += v[2]; }
    const nf = d.foot.length || 1, dx = ((fx - f0[0]) / nf + t.x - d.t0.x) / M, dy = ((fy - f0[1]) / nf + t.y - d.t0.y) / M, dz = ((fz - f0[2]) / nf + t.z - d.t0.z) / M, mv = Math.hypot(dx, dy, dz);
    const turn = 2 * Math.acos(Math.min(1, Math.abs(r.w))) * 180 / Math.PI;
    d.mv = mv; d.turn = turn; d.dy = dy; if (mv <= S.maxMove && turn <= S.maxTurn) continue;
    const how = turn > S.maxTurn && !(dy < -S.maxMove && !(d.margin < 0)) ? `tips over (turns ${turn.toFixed(1)}°, ${d.margin < 0 ? `its centre of mass is ${Math.round(-d.margin)} mm past its support` : Number.isFinite(d.margin) ? 'its centre of mass is over its support, so something pushed it' : 'nothing under it holds it'})` : dy < -S.maxMove ? `falls ${Math.round(-dy)} mm` : dy > S.maxMove ? `is pushed ${Math.round(dy)} mm up out of something` : `slides ${Math.round(Math.hypot(dx, dz))} mm`;
    find.push({ rule: 'moves', id, asset: d.o.asset, mm: +mv.toFixed(1), dy: +dy.toFixed(1), deg: +turn.toFixed(1), margin: Math.round(d.margin), text: `${id} (${d.o.asset}) ${how} in one second` });
  }
  Q.settled = Object.fromEntries([...dyn].map(([id, d]) => [id, { mm: d.mv, deg: d.turn, dy: d.dy, margin: d.margin }]));
  W.free(); return find;
}
