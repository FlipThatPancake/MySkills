// @js:set — an area of a home as one stage set, in the old kitchen's way: a back wall, an optional side wall and a floor are huge one-sided planes in the backdrop tone,
// so the only sign of the room is the melting seams where they meet; they die out about 400 mm past the furniture, and the planes themselves thin into the backdrop (kit.setFade).
// buildArea(kit, area, registry) -> { group, objects, openables, bounds, activate(), update(camera, target, dt) }.
// area = { id, name, walls: { side: 'left' | 'right' | null }, tiles, openings: [{ wall: 'back' | 'side', kind, at, width, height, sill }], objects, camera }.
// Area-local millimetres: origin at the back wall's left floor corner, x right, y up, z toward the viewer; the back wall's face is z = 0. The side wall stands 14 mm outside the furniture.
// An opening's `at` is its centre: x on the back wall, z on the side wall. Objects are listed like any scene.json objects; `mount` and `shadow` decide their contact shadows.
import { halo } from './sheet.js';
import { opening } from './openings.js';

export const FADE = [0.15, 0.6];   // the planes thin out between these distances beyond the furniture, in area widths
const EDGE = { x0: 28000, x1: 33000, depth: 28000, bottom: -4000, top: 36000 };   // 60 m each way, so no edge comes into view at any allowed angle or zoom
const step = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };

export function buildArea(kit, area, registry) {
  const { THREE } = kit, T = THREE, group = kit.group(), objRoot = kit.group(), objects = {};
  group.add(objRoot);
  for (const o of area.objects || []) {
    const make = registry[o.asset];
    if (!make) throw new Error(`scene.json: unknown asset "${o.asset}" (object "${o.id}"); known assets: ${Object.keys(registry).join(', ')}`);
    const g = make(kit, { ...o.params });
    g.rotation.y = (o.turn || 0) * Math.PI / 180;
    g.position.set(...(o.at || [0, 0, 0]));
    g.userData.scene = o;
    objects[o.id] = g; objRoot.add(g);
  }
  objRoot.updateMatrixWorld(true);
  const openables = Object.values(objects).flatMap((g) => g.userData.openables || []);

  // The furniture's footprint: everything except what hangs from the ceiling or is only lines.
  const boxes = {}, bb = new T.Box3();
  for (const o of area.objects || []) { if (o.mount === 'ceiling' || o.mount === 'lines') continue; boxes[o.id] = new T.Box3().setFromObject(objects[o.id]); bb.union(boxes[o.id]); }
  if (bb.isEmpty()) bb.set(new T.Vector3(0, 0, 0), new T.Vector3(1000, 2000, 1000));
  const side = area.walls?.side || null;
  const bounds = { x0: bb.min.x, x1: bb.max.x, z1: Math.max(bb.max.z, 300), top: Math.min(Math.max(bb.max.y, 2000), 2500) };
  const wallX = side === 'left' ? bounds.x0 - 14 : side === 'right' ? bounds.x1 + 14 : null;
  const left = side === 'left' ? wallX : bounds.x0, right = side === 'right' ? wallX : bounds.x1;   // the stretch the seams and tiles cover
  const width = right - left;

  // ---- openings: each one cuts its wall and brings its own frame
  const backHoles = [], sideHoles = [], sideGroup = kit.group();
  for (const op of area.openings || []) {
    const built = opening(kit, op), at = op.at;
    if (op.wall === 'side') {
      if (!side) throw new Error(`area "${area.id}": an opening on the side wall, but the area has no side wall`);
      if (side === 'left') { built.group.position.set(wallX, 0, at); sideHoles.push(built.hole.map(([z, y]) => [-(at + z), y])); }
      else { built.group.position.set(wallX, 0, at); built.group.rotation.y = Math.PI; sideHoles.push(built.hole.map(([z, y]) => [at - z, y])); }
      sideGroup.add(built.group);
    } else {
      built.group.rotation.y = -Math.PI / 2; built.group.position.set(at, 0, 0);
      backHoles.push(built.hole.map(([z, y]) => [at - z, y]));
      group.add(built.group);
    }
  }
  group.add(sideGroup);

  // ---- the planes (one-sided: from behind the side wall the room is open)
  const holeOf = (pts) => new T.Path(pts.map(([a, y]) => new T.Vector2(a, y)));
  const slab = (a0, a1, holes) => {
    const s = new T.Shape([[a0, EDGE.bottom], [a1, EDGE.bottom], [a1, EDGE.top], [a0, EDGE.top]].map(([a, y]) => new T.Vector2(a, y)));
    holes.forEach((h) => s.holes.push(holeOf(h)));
    return new T.Mesh(new T.ShapeGeometry(s), kit.fadeFill);
  };
  const bx0 = side === 'left' ? wallX : -EDGE.x0, bx1 = side === 'right' ? wallX : EDGE.x1;
  const back = slab(bx0, bx1, backHoles); back.position.set(0, 0, -4);
  const floor = new T.Mesh(new T.PlaneGeometry(bx1 - bx0, EDGE.depth + 4), kit.fadeFill);
  floor.rotation.x = -Math.PI / 2; floor.position.set((bx0 + bx1) / 2, -4, (EDGE.depth - 4) / 2);
  group.add(back, floor);
  if (side) {
    const sw = slab(side === 'left' ? -EDGE.depth : -4, side === 'left' ? 4 : EDGE.depth, sideHoles);   // local x runs toward -z (left wall) or +z (right wall)
    sw.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
    sw.position.set(side === 'left' ? wallX - 4 : wallX + 4, 0, 0);
    group.add(sw);
  }

  // ---- seams: where the planes meet; they melt out within 400 mm past the furniture, the corner line between 2400 and 2800 mm up
  const out = (p) => Math.hypot(Math.max(left - p[0], p[0] - right, 0), Math.max(p[2] - bounds.z1, 0));
  const seamTone = (p) => step(out(p) / 400), cornerTone = (p) => step((p[1] - 2400) / 400);
  const sx0 = side === 'left' ? wallX + 3 : left - 500, sx1 = side === 'right' ? wallX - 3 : right + 500;
  group.add(kit.meltingLine([sx0, -1, -1], [sx1, -1, -1], seamTone));   // back wall meets floor
  let sideSeam = null;
  if (side) {
    const sx = side === 'left' ? wallX + 3 : wallX - 3;
    sideSeam = kit.meltingLine([sx, -1, -1], [sx, -1, bounds.z1 + 500], seamTone);   // side wall meets floor
    group.add(sideSeam, kit.meltingLine([sx, -1, -1], [sx, 2900, -1], cornerTone));   // back wall meets side wall
  }
  // tiles: a 600 mm grid square to the back wall that fades out 1.5 m beyond the furniture
  if (area.tiles) {
    const tone = (p) => step(Math.min(1, out(p) / 1500)), xa = side === 'left' ? wallX : left - 1500, xb = side === 'right' ? wallX : right + 1500, org = side ? wallX : left;
    for (let z = 600; z <= bounds.z1 + 1500; z += 600) group.add(kit.meltingLine([xa, -2, z], [xb, -2, z], tone, 80, 'lo'));
    for (let x = org + (side === 'right' ? -600 : 600); x >= xa && x <= xb; x += side === 'right' ? -600 : 600) group.add(kit.meltingLine([x, -2, 0], [x, -2, bounds.z1 + 1500], tone, 80, 'lo'));
  }

  // ---- contact shadows, generated from each object's footprint and mount
  const shadows = kit.group();
  const sz = (v) => Math.max(0, v);
  for (const o of area.objects || []) {
    const b = boxes[o.id]; if (!b || o.shadow === false) continue;
    if (o.mount === 'floor') shadows.add(halo(kit, 'floor', b.min.x, b.max.x, b.min.z, b.max.z, 1.5, 0.26));
    else if (o.mount === 'on' && o.asset !== 'hob') shadows.add(halo(kit, 'floor', b.min.x, b.max.x, b.min.z, b.max.z, b.min.y + 1.5, 0.3));
    else if (o.mount === 'wall' && b.max.x - b.min.x >= 300 && b.min.z < 80) shadows.add(halo(kit, 'back', b.min.x, b.max.x, b.min.y, b.min.y + 250, -2, 0.22));
  }
  shadows.add(halo(kit, 'floor', left - 14, right + 400, -4, 40, 1.5, 0.3));                               // back wall meets floor
  if (side) {
    shadows.add(halo(kit, 'floor', side === 'left' ? wallX : wallX - 54, side === 'left' ? wallX + 54 : wallX, -4, bounds.z1 + 400, 1.5, 0.3));   // side wall meets floor
    shadows.add(halo(kit, 'back', side === 'left' ? wallX : wallX - 54, side === 'left' ? wallX + 54 : wallX, 0, 2300, -2, 0.3));                  // wall corner, back wall side
    shadows.add(halo(kit, 'side', -4, 54, 0, 2300, side === 'left' ? wallX + 2 : wallX - 2, 0.3));                                                 // wall corner, side wall side
  }
  group.add(shadows);

  // ---- the side wall's things fade away together once the camera is past that wall
  const fa = kit.fadable();
  kit.useFade(sideGroup, fa);
  if (sideSeam) kit.useFade(sideSeam, fa);

  const centre = new T.Vector3((left + right) / 2, bounds.top / 2 - 150, bounds.z1 / 2), half = new T.Vector3(width / 2, bounds.top / 2 + 300, bounds.z1 / 2);
  return {
    group, objects, openables, bounds: { ...bounds, left, right, width, wallX, side, centre },
    // Call when this area becomes the one on show: the planes fade out round its furniture.
    activate() { kit.setFade(centre, half, FADE[0] * width, FADE[1] * width); },
    // Each frame: outside the side wall (past it, over about 3 degrees) its window, seam and shadow fade away.
    update(camera, target) {
      let s = 1;
      if (side) {
        const w3 = Math.max(1, camera.position.distanceTo(target) * Math.sin(3 * Math.PI / 180)), d = side === 'left' ? camera.position.x - wallX : wallX - camera.position.x;
        s = step((d + w3 / 2) / w3);
      }
      kit.sideVis.value = s; fa.set(s);
    },
  };
}
