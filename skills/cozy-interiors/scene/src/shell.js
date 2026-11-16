// @js:room-shell — walls, floor and openings from a floor plan, with a view that fades blocking walls.
// plan = { height, thickness, rooms: [{ name, outline: [[x, z], ...] }], openings: [{ at: [x, z], width, kind: 'door' | 'window', sill, height }] }
// Millimetres; x right, z toward the viewer, floor at y 0. Outlines run either way round; walls stand outside each outline (the outline is the inner face).
// A wall shared by two rooms is built once, centred on the shared edge. An opening sits on the wall nearest its `at` point.
// Every wall stands full height and each room has a ceiling. shell.userData.view(camera, target, dt) fades whatever blocks the view and thins the whole scene into the backdrop with distance from the target (see below).
export function roomShell(kit, plan) {
  const { THREE } = kit, H = plan.height || 2500, T = plan.thickness || 120, CEIL = 30;
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
    glass.position.set(cu, (o.v0 + o.v1) / 2, mid); glass.userData.glass = true;
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
    const dir = [(e.b[0] - e.a[0]) / e.len, (e.b[1] - e.a[1]) / e.len], zc = (z0 + z1) / 2;
    holder.userData = { part: 'wall', edge: e, fade: 0, dir, n: [lz.x, lz.z], zc, len: e.len, fa: kit.fadable(), glass: [] };
    kit.useFade(holder, holder.userData.fa);
    holder.traverse((o) => { if (o !== holder && o.userData.glass === true) holder.userData.glass.push(o); });
    // A faint line on the floor where the wall stands (broken at doors) stays when the wall fades away.
    const at = (u, z) => [e.a[0] + dir[0] * u + lz.x * z, 1, e.a[1] + dir[1] * u + lz.z * z];
    const spans = [], cuts = ops.filter((o) => o.kind === 'door').sort((p, q) => p.u0 - q.u0);
    let u = 0; for (const d of cuts) { spans.push([u, d.u0]); u = d.u1; } spans.push([u, e.len]);
    const pts = [];
    for (const [s0, s1] of spans) pts.push(at(s0, z0), at(s1, z0), at(s0, z1), at(s1, z1), at(s0, z0), at(s0, z1), at(s1, z0), at(s1, z1));
    g.add(kit.lines(pts, 'lo'));
    walls.push(holder); g.add(holder);
  }
  // A flat ceiling over each room, sitting on the wall tops.
  const ceilings = [];
  if (plan.ceiling !== false) for (const room of plan.rooms) {
    const c = kit.solid(new THREE.ExtrudeGeometry(floorShape(room.outline), { depth: CEIL, bevelEnabled: false }), 0, H, 0);
    c.rotation.x = -Math.PI / 2;
    c.userData = { part: 'ceiling', room: room.name, outline: room.outline, fade: 0, fa: kit.fadable(), glass: [] };
    kit.useFade(c, c.userData.fa);
    ceilings.push(c); g.add(c);
  }
  const blockers = [...walls, ...ceilings];
  g.userData.walls = walls; g.userData.ceilings = ceilings; g.userData.plan = plan;

  // view(camera, target, dt, opts): call each frame with the orbit camera and its target.
  //  - outside the rooms (or above the ceiling) an outer wall fades once the camera is past it and the ceilings fade once the camera is above them; inside a room only a wall that crosses the camera-to-target line fades. Fades ramp over about 3 degrees of view, frames, glass and door leaf go with their wall;
  //  - everything thins into the backdrop with distance from the target, the radius scaling with the camera distance: zoomed in shows a soft-edged cutout of one area, zoomed out covers the whole plan.
  // opts: r0, r1 (fade radii as fractions of the camera distance, default 0.7 and 1.6, with floors r0Min 2500 and r1Min 5000 mm), focus (focus-area radius as a fraction of the distance, 0.12, at most focusMax = 900 mm), rate (fade-in/out speed per second, 14).
  const sat = (x) => Math.min(1, Math.max(0, x)), S = (x) => { x = sat(x); return x * x * (3 - 2 * x); };
  const inside = (pt, o) => {   // signed distance from a point to a polygon in plan: positive inside
    let d = 1e9, ins = false;
    for (let i = 0; i < o.length; i++) {
      const a = o[i], b = o[(i + 1) % o.length], ex = b[0] - a[0], ez = b[1] - a[1], L2 = ex * ex + ez * ez;
      const t = sat(((pt[0] - a[0]) * ex + (pt[1] - a[1]) * ez) / L2);
      d = Math.min(d, Math.hypot(pt[0] - a[0] - ex * t, pt[1] - a[1] - ez * t));
      if ((a[1] > pt[1]) !== (b[1] > pt[1]) && pt[0] < a[0] + ex * (pt[1] - a[1]) / ez) ins = !ins;
    }
    return ins ? d : -d;
  };
  const C = new THREE.Vector3(), P = new THREE.Vector3(), X = new THREE.Vector3();
  const blocks = (w, w3) => {   // 0..1: does w stand between the camera C and the point P
    const d = w.userData;
    let sdC, sdP;
    if (d.part === 'wall') {
      const a = d.edge.a; sdC = (C.x - a[0]) * d.n[0] + (C.z - a[1]) * d.n[1] - d.zc; sdP = (P.x - a[0]) * d.n[0] + (P.z - a[1]) * d.n[1] - d.zc;
    } else { sdC = C.y - (H + CEIL / 2); sdP = P.y - (H + CEIL / 2); }
    const wp = Math.max(w3, 80), cs = S(sdC / w3 + 0.5), pp = S(sdP / wp + 0.5), b = cs * (1 - pp) + (1 - cs) * pp;
    if (b < 1e-3) return 0;
    const t = sat(sdC / ((sdC - sdP) || 1e-9)); X.lerpVectors(C, P, t);
    const m = Math.max(80, t * C.distanceTo(P) * Math.sin(3 * Math.PI / 180));
    if (d.part === 'wall') {
      const a = d.edge.a, u = (X.x - a[0]) * d.dir[0] + (X.z - a[1]) * d.dir[1];
      return b * S(u / m + 0.5) * S((d.len - u) / m + 0.5) * S((H - X.y) / m + 0.5);
    }
    return b * S(inside([X.x, X.z], d.outline) / m + 0.5);
  };
  g.userData.view = (camera, target, dt = 1 / 60, o = {}) => {
    const dist = camera.position.distanceTo(target), w3 = Math.max(1, dist * Math.sin(3 * Math.PI / 180)), f = Math.min((o.focus ?? 0.12) * dist, o.focusMax ?? 900), k = 1 - Math.exp(-dt * (o.rate ?? 14));
    kit.setViewFade(target, Math.max(dist * (o.r0 ?? 0.7), o.r0Min ?? 2500), Math.max(dist * (o.r1 ?? 1.6), o.r1Min ?? 5000));
    C.copy(camera.position);
    // Regime B (camera inside a room, below the ceiling): everything stands except a wall the camera-to-focus line crosses.
    // Regime A (outside, or above the ceiling): an outer wall fades once the camera is past its plane, a ceiling once the camera is above it; a shared wall fades only when it lies between camera and focus.
    // `inside` blends the two over the same 3 degree width, so nothing pops when the camera crosses a wall or the ceiling.
    const sdIn = Math.max(...plan.rooms.map((r) => inside([C.x, C.z], r.outline)));
    const inside01 = S(sdIn / w3 + 0.5) * S((H - C.y) / w3 + 0.5);
    // Focus samples: the target and four points round it, those inside some room or within a wall's thickness of one (a sample out past an outer wall is not part of the view).
    const near = (dx, dz) => Math.max(...plan.rooms.map((r) => inside([target.x + dx, target.z + dz], r.outline))) > -T;
    const spots = [[0, 0], [f, 0], [-f, 0], [0, f], [0, -f]].filter(([dx, dz], i) => i === 0 || near(dx, dz));
    for (const w of blockers) {
      const d = w.userData;
      let ray = 0;
      for (const [dx, dz] of spots) { P.set(target.x + dx, target.y, target.z + dz); ray = Math.max(ray, blocks(w, w3)); }
      ray = S((ray - 0.15) / 0.7);   // a grazing line should not leave a wall half faded: settle partial values to 0 or 1 faster
      let outer = ray;
      if (d.part === 'ceiling') outer = S((C.y - (H + CEIL / 2)) / w3 + 0.5);
      else if (!d.edge.shared) outer = S(((C.x - d.edge.a[0]) * d.edge.out[0] + (C.z - d.edge.a[1]) * d.edge.out[1] - T / 2) / w3 + 0.5);
      const want = inside01 * ray + (1 - inside01) * outer;
      d.fade += (want - d.fade) * k; if (Math.abs(d.fade - want) < 1e-3) d.fade = want;
      const a = 1 - d.fade;
      d.fa.set(a);
      w.visible = a > 0.002;
      for (const gl of d.glass) gl.material.opacity = 0.35 * a;
    }
  };
  return g;
}
