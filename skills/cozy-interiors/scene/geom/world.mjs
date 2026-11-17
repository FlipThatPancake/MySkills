// the query world: every part a fixed collider with its exact shape (convex hull or triangle mesh), and pair queries with signed distance.
import { RAPIER, M, partDesc, tally } from './shapes.mjs';
import { environment } from './env.mjs';
import { isFree } from './kinds.mjs';

const centre = (p) => { const b = p.box; return [(b.mn[0] + b.mx[0]) / 2, (b.mn[1] + b.mx[1]) / 2, (b.mn[2] + b.mx[2]) / 2]; };

// queryWorld(loaded) → { W, entries, byOwner, objects, tally, failed }. An entry is { owner, k, part, role, c (collider), how, mn, mx, kind }.
// owners are object ids, 'floor' and 'env' (walls and openings). Flat decals are left out of free objects (nothing stands on a scuff mark).
export function queryWorld(loaded) {
  const W = new RAPIER.World({ x: 0, y: 0, z: 0 }), entries = [], byOwner = {}, objects = Object.fromEntries(loaded.objects.map((o) => [o.id, o])), n = tally(), failed = [];
  const add = (owner, p, k, role) => {
    const c0 = centre(p), s = partDesc(p, c0);
    if (!s.d) { n.failed++; failed.push({ owner, k, type: p.type, kind: p.kind }); return; }
    n[s.how === 'hull' ? 'hull' : 'mesh']++;
    const b = W.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(c0[0] * M, c0[1] * M, c0[2] * M));
    const c = W.createCollider(s.d, b), e = { owner, k, part: p, role, c, how: s.how, kind: p.kind, mn: p.box.mn, mx: p.box.mx };
    entries.push(e); (byOwner[owner] ||= []).push(e);
  };
  for (const p of environment(loaded)) add(p.role === 'floor' ? 'floor' : 'env', p, entries.length, p.role);
  for (const o of loaded.objects) o.parts.forEach((p, k) => { if (p.kind === 'flat' && isFree(o)) return; add(o.id, p, k, 'object'); });
  return { W, entries, byOwner, objects, loadedObjects: loaded.objects, loaded, tally: n, failed };
}

const near = (a, b, m) => a.mn[0] <= b.mx[0] + m && a.mx[0] >= b.mn[0] - m && a.mn[1] <= b.mx[1] + m && a.mx[1] >= b.mn[1] - m && a.mn[2] <= b.mx[2] + m && a.mx[2] >= b.mn[2] - m;
const ok = (a, b) => a.owner !== b.owner && !(a.role !== 'object' && b.role !== 'object');   // the surroundings are not tested against each other

// every pair of parts of different owners within `within` mm: { a, b (entries), d (mm; negative = inside), normal (on b, pointing toward a), pointA, pointB (mm, world), approx }
export function contacts(Q, { within = 5 } = {}) {
  const all = [...Q.entries].sort((a, b) => a.mn[0] - b.mn[0]), out = []; let unsupported = 0;
  for (let i = 0; i < all.length; i++) {
    const A = all[i];
    for (let j = i + 1; j < all.length; j++) {
      const B = all[j]; if (B.mn[0] > A.mx[0] + within) break; if (!ok(A, B) || !near(A, B, within)) continue;
      let r = null; try { r = A.c.contactCollider(B.c, within * M); } catch { r = undefined; }
      if (r) { const ta = A.c.translation(), tb = B.c.translation(); out.push({ a: A, b: B, d: r.distance / M, normal: r.normal2, pointA: [r.point1.x / M, r.point1.y / M, r.point1.z / M], pointB: [r.point2.x / M, r.point2.y / M, r.point2.z / M] }); continue; }
      if (A.how === 'mesh' && B.how === 'mesh' || r === undefined) {   // two meshes (or an unsupported pair): only "touching or crossing" is known, depth is not
        let hit = false; try { hit = Q.W.intersectionPair(A.c, B.c); } catch { unsupported++; }
        if (hit) { const pa = A.c.translation(); out.push({ a: A, b: B, d: 0, normal: { x: 0, y: 0, z: 0 }, pointA: [pa.x / M, pa.y / M, pa.z / M], pointB: [pa.x / M, pa.y / M, pa.z / M], approx: true }); }
      }
    }
  }
  return { list: out, unsupported };
}

// the deepest contact of each pair of owners
export function pairs(list) {
  const m = new Map();
  for (const c of list) { const x = c.a.owner, y = c.b.owner, k = x < y ? x + '|' + y : y + '|' + x, cur = m.get(k); if (!cur || c.d < cur.d) m.set(k, c); }
  return m;
}
