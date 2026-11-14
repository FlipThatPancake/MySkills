// @js:home — a whole home as one world of flat walls and objects, in the old kitchen's way: every wall is a one-sided plane in the backdrop tone, so the only sign of a room is the melting seams where walls meet the floor
// and each other, the frames of the doors, arches and windows, and the soft contact shadows. Everything is built once; areas (area-run.js) are views into it.
// buildHome(kit, home, registry) -> { group, objects, openables, walls, bounds, update(camera, target) }.
// home = { height, floor: { style: 'tiles' | 'boards' | 'plain', angle, board }, tiles, walls: [{ id, from: [x, z], to: [x, z], openings }], objects }, all in millimetres, x right, y up, z toward the viewer.
//   A wall is a flat plane facing its room, which is on the LEFT of from -> to as seen from above with x to the right and z down the page (a room's walls run counter-clockwise on that page:
//   back wall right to left, left wall top to bottom, front wall left to right, right wall bottom to top). Seen from behind, a wall is not drawn.
//   An opening is { kind: 'window' | 'door' | 'arch', at (mm along the wall from `from`, to its middle), width, height, sill, hinge: 'l' | 'r', open (deg), to (area id: a click goes there), beyond: false (a real room lies beyond) }.
//   Furniture faces the room as it stands: a wall's face is where an object's back sits.
//   An object is { id, asset, at: [x, y, z], turn (deg about the vertical), mount: 'floor' | 'on' | 'wall' | 'ceiling' | 'lines', params, shadow: false, lift (mm: it stands on something this thick, like a rug) }; its contact shadow comes from the mount.
import { halo } from './sheet.js';
import { opening } from './openings.js';

export const FADE = [0.15, 0.6];   // the planes thin out between these distances beyond an area's bounds, in area widths
const step = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
const EDGE = 30000;

export function buildHome(kit, home, registry, areas = []) {
  const T = kit.THREE, group = kit.group(), objRoot = kit.group(), objects = {}, H = home.height || 2700;
  group.add(objRoot);
  for (const o of home.objects || []) {
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
  const boxes = {}, feet = {};
  for (const o of home.objects || []) {
    const g = objects[o.id], sz = g.userData.size;
    boxes[o.id] = new T.Box3().setFromObject(g);
    // a cabinet run knows its own footprint (its worktop may reach round a corner, its cabinets do not)
    feet[o.id] = sz && sz.length && sz.depth && sz.top < 1000 ? new T.Box3().setFromPoints([[0, 0, 0], [sz.length, 0, -sz.depth]].map(([x, y, z]) => new T.Vector3(x, y, z).applyMatrix4(g.matrixWorld))) : boxes[o.id];
  }

  // ---- walls: opaque planes in the page's own tone, so they hide whatever stands behind them and only the seams, frames and shadows show
  const wallMat = new T.MeshBasicMaterial({ color: new T.Color('#f4f4f1'), toneMapped: false });
  const P = (a) => new T.Vector2(a[0], a[1]), near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 40;
  const walls = (home.walls || []).map((w, i) => {
    const len = Math.hypot(w.to[0] - w.from[0], w.to[1] - w.from[1]), d = [(w.to[0] - w.from[0]) / len, (w.to[1] - w.from[1]) / len], n = [d[1], -d[0]];
    return { ...w, i, len, d, n, vis: { value: 1 }, node: kit.group(), frames: kit.group(), fa: kit.fadable(), through: [], holes: [], built: [] };
  });
  const walls_ = walls;
  for (const W of walls_) {
    const { node, len, vis } = W;
    node.position.set(W.to[0], 0, W.to[1]); node.rotation.y = Math.atan2(W.d[1], -W.d[0]);   // local x runs from `to` back toward `from`, local z is the room side
    for (const op of W.openings || []) {
      const b = opening(kit, op, vis), xc = len - op.at;
      b.group.rotation.y = -Math.PI / 2; b.group.position.set(xc, 0, 0);
      W.frames.add(b.group); W.built.push({ op, group: b.group, openables: b.openables }); openables.push(...b.openables); 
      W.holes.push(b.hole.map(([z, y]) => [xc - z, y]));
      if (op.kind !== 'window') W.through.push([xc - b.width / 2, xc + b.width / 2]);
    }
    const s = new T.Shape([[0, -4], [len, -4], [len, H], [0, H]].map(([a, y]) => new T.Vector2(a, y)));
    W.holes.forEach((h) => s.holes.push(new T.Path(h.map(([a, y]) => new T.Vector2(a, y)))));
    const plane = new T.Mesh(new T.ShapeGeometry(s), wallMat); plane.position.z = -4;
    node.add(plane, W.frames);
    // seams: the wall meets the floor (broken where a door or arch lets the floor through), and the corner it makes with the next wall
    const seams = kit.group(); let a = 0;
    for (const [t0, t1] of [...W.through].sort((p, q) => p[0] - q[0]).concat([[len, len]])) { if (t0 > a) seams.add(kit.meltingLine([a, -1, 3], [Math.min(t0, len), -1, 3], () => 0)); a = Math.max(a, t1); }
    const square = (o) => Math.abs(o.d[0] * W.d[0] + o.d[1] * W.d[1]) < 0.9;   // a corner, square or wide (120 degrees); two walls in a line are no corner
    W.joinedTo = walls_.some((o) => o !== W && near(o.from, W.to) && square(o)); W.joinedFrom = walls_.some((o) => o !== W && near(o.to, W.from) && square(o));
    // a corner, or the free end of a loose wall, gets an edge line that melts out toward the top
    seams.add(kit.meltingLine([0, -1, 3], [0, 2900, 3], (p) => step((p[1] - (W.joinedTo ? 2400 : 2100)) / 400)));
    if (!W.joinedFrom) seams.add(kit.meltingLine([len, -1, 3], [len, 2900, 3], (p) => step((p[1] - 2100) / 400)));
    node.add(seams); W.seams = seams;
    kit.useFade(W.frames, W.fa); kit.useFade(seams, W.fa);
    // contact shadows on this wall: where it meets the floor and the corners
    const sh = kit.group();
    sh.add(halo(kit, 'floor', 0, len, -4, 40, 1.5, 0.3, vis));
    if (W.joinedTo) sh.add(halo(kit, 'back', 0, 54, 0, 2300, 2, 0.3, vis));
    if (W.joinedFrom) sh.add(halo(kit, 'back', len - 54, len, 0, 2300, 2, 0.3, vis));
    node.add(sh); W.shadows = sh;
    group.add(node);
  }

  // ---- floor and tiles
  // the floor reaches as far as the walls and every area's bounds (areas are open: their floor runs out in front of the walls)
  const xs = [...walls.flatMap((w) => [w.from[0], w.to[0]]), ...areas.flatMap((a) => [a.bounds.x0, a.bounds.x1])], zs = [...walls.flatMap((w) => [w.from[1], w.to[1]]), ...areas.flatMap((a) => [a.bounds.z0, a.bounds.z1])];
  const bb = { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
  const floor = new T.Mesh(new T.PlaneGeometry(bb.x1 - bb.x0 + 2 * EDGE, bb.z1 - bb.z0 + 2 * EDGE), wallMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set((bb.x0 + bb.x1) / 2, -4, (bb.z0 + bb.z1) / 2);
  group.add(floor);
  const style = home.floor?.style || (home.tiles ? 'tiles' : 'plain'), M = 1500;
  const out = (p) => Math.hypot(Math.max(bb.x0 - p[0], p[0] - bb.x1, 0), Math.max(bb.z0 - p[2], p[2] - bb.z1, 0)), tone = (p) => step(out(p) / M);
  if (style === 'tiles') {   // a 600 mm grid, square to the walls' own grid; it melts out 1.5 m beyond the walls
    const org = home.tiles?.origin || [bb.x0, bb.z0], cell = home.tiles?.size || 600;
    for (let z = org[1] + Math.ceil((bb.z0 - M - org[1]) / cell) * cell; z <= bb.z1 + M; z += cell) group.add(kit.meltingLine([bb.x0 - M, -2, z], [bb.x1 + M, -2, z], tone, 60, 'lo'));
    for (let x = org[0] + Math.ceil((bb.x0 - M - org[0]) / cell) * cell; x <= bb.x1 + M; x += cell) group.add(kit.meltingLine([x, -2, bb.z0 - M], [x, -2, bb.z1 + M], tone, 60, 'lo'));
  } else if (style === 'boards') {   // long boards, 170 mm wide, running along x (or along home.floor.angle degrees)
    const ang = (home.floor?.angle || 0) * Math.PI / 180, c = Math.cos(ang), sn = Math.sin(ang), cx = (bb.x0 + bb.x1) / 2, cz = (bb.z0 + bb.z1) / 2, R = Math.hypot(bb.x1 - bb.x0, bb.z1 - bb.z0) / 2 + M, W = home.floor?.board || 170;
    for (let o = -Math.floor(R / W) * W; o <= R; o += W) group.add(kit.meltingLine([cx - c * R - sn * o, -2, cz - sn * R + c * o], [cx + c * R - sn * o, -2, cz + sn * R + c * o], tone, 80, 'lo'));
  }

  // ---- contact shadows, generated from each object's footprint and mount
  const shadows = kit.group();
  for (const o of home.objects || []) {
    if (o.shadow === false) continue;
    const b = feet[o.id], g = objects[o.id];
    if (o.mount === 'ceiling') continue;   // it is daylight: a lamp casts no light and no shadow
    if (o.mount === 'floor') shadows.add(halo(kit, 'floor', b.min.x, b.max.x, b.min.z, b.max.z, (o.lift || 0) + 1.5, o.asset === 'rug' ? 0.14 : 0.26));
    else if (o.mount === 'on' && o.asset !== 'hob') shadows.add(halo(kit, 'floor', b.min.x, b.max.x, b.min.z, b.max.z, b.min.y + 1.5, 0.3));
    else if (o.mount === 'wall') {   // under a wall unit: on the wall it hangs from
      for (const W of walls) {
        const c = [...[b.min.x, b.max.x].flatMap((x) => [b.min.z, b.max.z].map((z) => [x, z]))].map(([x, z]) => [(x - W.to[0]) * -W.d[0] + (z - W.to[1]) * -W.d[1], (x - W.to[0]) * W.n[0] + (z - W.to[1]) * W.n[1]]);
        const xa = Math.min(...c.map((p) => p[0])), xb = Math.max(...c.map((p) => p[0])), zn = Math.min(...c.map((p) => p[1]));
        if (xb - xa >= 300 && zn < 80 && zn > -80 && xa > -10 && xb < W.len + 10) { W.shadows.add(halo(kit, 'back', xa, xb, b.min.y, b.min.y + 250, -2, 0.22, W.vis)); break; }
      }
    }
  }
  group.add(shadows);

  const w3 = 3 * Math.PI / 180;
  return {
    group, objects, openables, walls, bounds: bb,
    // Each frame: a wall's frames, window light, seams and shadows fade away once the camera is past that wall (over about 3 degrees).
    update(camera, target) {
      const dist = camera.position.distanceTo(target), span = Math.max(1, dist * Math.sin(w3));
      for (const W of walls) {
        const d = (camera.position.x - W.to[0]) * W.n[0] + (camera.position.z - W.to[1]) * W.n[1], s = step((d + span / 2) / span);
        if (s !== W.last) { W.last = s; W.vis.value = s; W.fa.set(s); }
      }
    },
  };
}

// An area's fade numbers, from its bounds { x0, x1, z0, z1, top }: the planes' box and the view fade's sphere, all in world mm.
export function fadeOf(b) {
  const top = b.top || 2500;
  return { centre: [(b.x0 + b.x1) / 2, top / 2 - 150, (b.z0 + b.z1) / 2], half: [(b.x1 - b.x0) / 2, top / 2 + 300, (b.z1 - b.z0) / 2], width: Math.max(b.x1 - b.x0, b.z1 - b.z0) };
}
