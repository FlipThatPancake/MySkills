// @js:room-shell — walls, floor and openings from a floor plan, with a dollhouse cutaway.
// plan = { height, thickness, rooms: [{ name, outline: [[x, z], ...] }], openings: [{ at: [x, z], width, kind: 'door' | 'window', sill, height }] }
// Millimetres; x right, z toward the viewer, floor at y 0. Outlines run either way round; walls stand outside each outline (the outline is the inner face).
// A wall shared by two rooms is built once, centred on the shared edge. An opening sits on the wall nearest its `at` point.
// Cutaway: an outer wall whose outside faces the camera sinks into the floor, leaving a stub at `stub` mm, so the camera sees in from any side and,
// zoomed out, sees every room at once. It sinks over about 0.4 s, so nothing pops.
export function roomShell(kit, plan) {
  const { THREE } = kit, H = plan.height || 2500, T = plan.thickness || 120, STUB = plan.stub ?? 160;
  const g = kit.group(), walls = [];
  const key = (a, b) => [a, b].map((p) => p.join(',')).sort().join('|');
  const edges = new Map();
  for (const room of plan.rooms) {
    const o = room.outline, area = o.reduce((s, p, i) => { const q = o[(i + 1) % o.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
    for (let i = 0; i < o.length; i++) {
      const a = o[i], b = o[(i + 1) % o.length], k = key(a, b);
      // outward normal in plan (x, z): the outline's winding tells which side is outside
      const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), s = area > 0 ? 1 : -1;
      const out = [s * dz / len, -s * dx / len];
      if (edges.has(k)) edges.get(k).shared = true;
      else edges.set(k, { a, b, len, out, room: room.name, shared: false });
    }
  }
  const floorShape = (o) => new THREE.Shape(o.map(([x, z]) => new THREE.Vector2(x, -z)));
  for (const room of plan.rooms) {
    const f = kit.solid(new THREE.ShapeGeometry(floorShape(room.outline)), 0, 0, 0, { tone: 'lo' });
    f.rotation.x = -Math.PI / 2; f.userData.part = 'floor'; g.add(f);
  }
  // The ground round the rooms, a little below the floors: it hides a sunken wall and melts into the backdrop.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200000, 200000), kit.fadeFill);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -6; g.add(ground);
  for (const e of edges.values()) {
    // Wall-local: u along the edge from a, v up; the slab sits outside the outline (or centred when shared).
    const shape = new THREE.Shape([[0, 0], [e.len, 0], [e.len, H], [0, H]].map(([u, v]) => new THREE.Vector2(u, v)));
    const ops = [];
    for (const op of plan.openings || []) {
      const ex = e.b[0] - e.a[0], ez = e.b[1] - e.a[1], u = ((op.at[0] - e.a[0]) * ex + (op.at[1] - e.a[1]) * ez) / e.len;
      const off = Math.abs((op.at[0] - e.a[0]) * e.out[0] + (op.at[1] - e.a[1]) * e.out[1]), w = op.width;
      if (off > T || u - w / 2 < 0 || u + w / 2 > e.len) continue;
      const v0 = op.kind === 'door' ? 0 : (op.sill ?? 900), v1 = v0 + (op.height ?? (op.kind === 'door' ? 2100 : 1200));
      if (op.kind === 'door') {   // a door cuts the bottom edge: rebuild the outline round it
        ops.push({ u0: u - w / 2, u1: u + w / 2, v0, v1, kind: 'door' });
      } else {
        shape.holes.push(new THREE.Path([[u - w / 2, v0], [u + w / 2, v0], [u + w / 2, v1], [u - w / 2, v1]].map(([a, b]) => new THREE.Vector2(a, b))));
        ops.push({ u0: u - w / 2, u1: u + w / 2, v0, v1, kind: 'window' });
      }
    }
    let wallShape = shape;
    const doors = ops.filter((o) => o.kind === 'door').sort((p, q) => p.u0 - q.u0);
    if (doors.length) {
      const pts = [[0, 0]];
      for (const d of doors) pts.push([d.u0, 0], [d.u0, d.v1], [d.u1, d.v1], [d.u1, 0]);
      pts.push([e.len, 0], [e.len, H], [0, H]);
      wallShape = new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v)));
      wallShape.holes = shape.holes;
    }
    // Local x runs along the edge, local +z after the turn points one way across it; shift the slab so it sits outside the outline (or straddles a shared edge).
    const ang = Math.atan2(-(e.b[1] - e.a[1]), e.b[0] - e.a[0]);
    const lz = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ang), outward = lz.x * e.out[0] + lz.z * e.out[1] > 0;
    const geo = new THREE.ExtrudeGeometry(wallShape, { depth: T, bevelEnabled: false });
    geo.translate(0, 0, e.shared ? -T / 2 : outward ? 0 : -T);
    const holder = kit.group();
    holder.add(kit.solid(geo, 0, 0, 0));
    holder.position.set(e.a[0], 0, e.a[1]);
    holder.rotation.y = ang;
    holder.userData = { part: 'wall', edge: e, sink: 0, mid: new THREE.Vector3((e.a[0] + e.b[0]) / 2, H / 2, (e.a[1] + e.b[1]) / 2), out: new THREE.Vector3(e.out[0], 0, e.out[1]) };
    walls.push(holder); g.add(holder);
  }
  g.userData.walls = walls;
  g.userData.plan = plan;
  // Call each frame: sinks the outer walls the camera is outside of.
  g.userData.cutaway = (camera, dt) => {
    for (const w of walls) {
      const d = w.userData, facing = !d.edge.shared && camera.position.clone().sub(d.mid).dot(d.out) > 0;
      const target = facing ? -(H - STUB) : 0;
      d.sink += (target - d.sink) * (1 - Math.exp(-dt * 9));
      w.position.y = d.sink;
    }
  };
  return g;
}
