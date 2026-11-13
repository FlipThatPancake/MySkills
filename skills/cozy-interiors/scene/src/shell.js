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
  // Split every edge at any corner of another room that lies on it, so a wall two rooms share is found as the same edge from both sides.
  const corners = plan.rooms.flatMap((r) => r.outline);
  const split = (o) => o.flatMap((a, i) => {
    const b = o[(i + 1) % o.length], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz;
    const on = corners.map((c) => ({ c, t: ((c[0] - a[0]) * dx + (c[1] - a[1]) * dz) / L2 }))
      .filter(({ c, t }) => t > 1e-6 && t < 1 - 1e-6 && Math.abs((c[0] - a[0]) * dz - (c[1] - a[1]) * dx) / Math.sqrt(L2) < 1)
      .sort((p, q) => p.t - q.t);
    return [a, ...on.map((x) => x.c).filter((c, k, arr) => k === 0 || c.join() !== arr[k - 1].join())];
  });
  for (const room of plan.rooms) {
    const o = split(room.outline), area = o.reduce((s, p, i) => { const q = o[(i + 1) % o.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
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
  // Fitted parts, generated from each opening's size: a box between two corners in the wall's local frame (u along, v up, z across).
  const piece = (u0, v0, za, u1, v1, zb, opts) => { const zf = Math.max(za, zb); return kit.box(Math.min(u0, u1), Math.min(v0, v1), zf, Math.abs(u1 - u0), Math.abs(v1 - v0), Math.abs(zb - za), opts); };
  const CASE = 60, PROUD = 18;   // casing width round an opening, and how far it stands off the wall face
  const casing = (o, z, dir, top = true, bottom = false) => {   // a frame on one face of the wall; dir is +1 or -1 away from the wall
    const g = kit.group(), zo = z + dir * PROUD;
    g.add(piece(o.u0 - CASE, o.v0 - (bottom ? CASE : 0), z, o.u0, o.v1 + (top ? CASE : 0), zo));
    g.add(piece(o.u1, o.v0 - (bottom ? CASE : 0), z, o.u1 + CASE, o.v1 + (top ? CASE : 0), zo));
    if (top) g.add(piece(o.u0, o.v1, z, o.u1, o.v1 + CASE, zo));
    if (bottom) g.add(piece(o.u0, o.v0 - CASE, z, o.u1, o.v0, zo));
    return g;
  };
  // Window: a casing outside and in, a sill board inside, a frame in the reveal with a cross of glazing bars, and faint glass.
  function windowParts(o, z0, z1, shared) {
    const g = kit.group(), din = z0 < z1 ? -1 : 1, dout = -din, mid = (z0 + z1) / 2, F = 45, B = 22;
    g.add(casing(o, z0, din), casing(o, z1, dout, true, true));
    g.add(piece(o.u0 - CASE - 20, o.v0 - 28, z0 + din * 70, o.u1 + CASE + 20, o.v0, mid));   // sill board, 70 mm proud inside
    const fz0 = mid - 30, fz1 = mid + 30;
    g.add(piece(o.u0, o.v0, fz0, o.u0 + F, o.v1, fz1), piece(o.u1 - F, o.v0, fz0, o.u1, o.v1, fz1), piece(o.u0, o.v1 - F, fz0, o.u1, o.v1, fz1), piece(o.u0, o.v0, fz0, o.u1, o.v0 + F, fz1));
    const cu = (o.u0 + o.u1) / 2, cv = o.v0 + (o.v1 - o.v0) * 0.62;
    g.add(piece(cu - B / 2, o.v0 + F, mid - 20, cu + B / 2, o.v1 - F, mid + 20, { tone: 'lo' }), piece(o.u0 + F, cv - B / 2, mid - 20, o.u1 - F, cv + B / 2, mid + 20, { tone: 'lo' }));
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(o.u1 - o.u0 - 2 * F, o.v1 - o.v0 - 2 * F), new THREE.MeshBasicMaterial({ color: 0xdfe8ee, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }));
    glass.position.set(cu, (o.v0 + o.v1) / 2, mid);
    g.add(glass);
    return g;
  }
  // Door: a casing both sides, a lining in the reveal, and a leaf standing open against the room side.
  function doorParts(o, z0, z1) {
    const g = kit.group(), din = z0 < z1 ? -1 : 1, L = 18, leafT = 40, w = o.u1 - o.u0;
    g.add(casing(o, z0, din), casing(o, z1, -din));
    g.add(piece(o.u0, 0, z0, o.u0 + L, o.v1, z1, { tone: 'lo' }), piece(o.u1 - L, 0, z0, o.u1, o.v1, z1, { tone: 'lo' }), piece(o.u0, o.v1 - L, z0, o.u1, o.v1, z1, { tone: 'lo' }));
    const leaf = kit.group(), open = 100 * Math.PI / 180;
    leaf.add(kit.box(0, 8, 0, w - 2 * L - 4, o.v1 - L - 12, leafT));
    leaf.add(kit.cyl(w - 2 * L - 70, 1000, 8, 9, 26, { axis: 'z' }));   // a round knob
    const hinge = kit.group(); hinge.add(leaf);
    hinge.position.set(o.u0 + L + 2, 0, z0); hinge.rotation.y = din < 0 ? open : -open;
    g.add(hinge);
    return g;
  }
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
    // The slab's faces in local z: z0 is the room side (or one side of a shared wall), z1 the other.
    const z0 = e.shared ? -T / 2 : 0, z1 = e.shared ? T / 2 : outward ? T : -T;
    for (const o of ops) holder.add(o.kind === 'door' ? doorParts(o, z0, z1) : windowParts(o, z0, z1, e.shared));
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
