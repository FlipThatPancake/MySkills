// @js:home — a whole home as one world of flat walls and objects, in the old kitchen's way: every wall is a one-sided plane in the backdrop tone, so the only sign of a room is the melting seams where walls meet the floor
// and each other, the frames of the doors, arches and windows, and the soft contact shadows. Everything is built once; areas (area-run.js) are views into it.
// buildHome(kit, home, registry) -> { group, objects, openables, walls, bounds, update(camera, target) }.
// home = { height, floor: { style: 'tiles' | 'boards' | 'plain', angle, board }, tiles, walls: [{ id, from: [x, z], to: [x, z], openings }], objects }, all in millimetres, x right, y up, z toward the viewer.
//   A wall is a flat plane facing its room, which is on the LEFT of from -> to as seen from above with x to the right and z down the page (a room's walls run counter-clockwise on that page:
//   back wall right to left, left wall top to bottom, front wall left to right, right wall bottom to top). Seen from behind, a wall is not drawn.
//   An opening is { kind: 'window' | 'door' | 'arch', at (mm along the wall from `from`, to its middle), width, height, sill, hinge: 'l' | 'r', open (deg), to (area id: a click goes there), beyond: false (a real room lies beyond) }.
//   Furniture faces the room as it stands: a wall's face is where an object's back sits.
//   An object is { id, asset, at: [x, y, z], turn (deg about the vertical), mount: 'floor' | 'on' | 'wall' | 'ceiling' | 'lines', params, shadow: false, lift (mm: it stands on something this thick, like a rug) }; its contact shadow comes from the mount.
import { halo, stencilOut } from './sheet.js';
import { floorLines } from './floor.js';
import { opening } from './openings.js';

export const FADE = [0.04, 0.12];   // the planes thin out between these distances beyond an area's bounds, in area widths
const step = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
const EDGE = 30000;

export function buildHome(kit, home, registry, areas = []) {
  const T = kit.THREE, group = kit.group(), objRoot = kit.group(), objects = {}, H = home.height || 2700;
  group.add(objRoot);
  for (const o of home.objects || []) {
    const make = registry[o.asset];
    if (!make) throw new Error(`scene.json: unknown asset "${o.asset}" (object "${o.id}"); known assets: ${Object.keys(registry).join(', ')}`);
    const g = make(kit, { ...o.params, ...(o.asset === 'woodStove' || o.asset === 'hood' ? { ceil: H - (o.at?.[1] || 0) } : {}) });   // a flue or chimney rises to the home's ceiling; the area's top fade thins it out
    g.rotation.y = (o.turn || 0) * Math.PI / 180;
    g.position.set(...(o.at || [0, 0, 0]));
    g.userData.scene = o;
    objects[o.id] = g; objRoot.add(g);
  }
  objRoot.updateMatrixWorld(true);
  // what stands between the camera and its target fades out (and returns once it no longer blocks): every object gets its own fade, except flat floor pieces; the area's own subject group (the hero's group) never fades in the home view
  const heroGroups = {}; for (const o of home.objects || []) if (o.hero) (heroGroups[o.area] ||= new Set()).add(o.group);
  const NOFADE = new Set(['rug', 'runner', 'doormat']), blockers = [];
  for (const o of home.objects || []) { if (NOFADE.has(o.asset)) continue; const g = objects[o.id], fa = kit.fadable(); kit.useFade(g, fa); blockers.push({ id: o.id, g, fa, main: !!(o.hero || heroGroups[o.area]?.has(o.group)), goal: 1, cur: undefined, last: 1, sv: { value: 1 } }); }   // sv: how much of the piece's contact shadow is drawn, the same number as its fade (halos and the baked light both read it)
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
  const END = 900, endMats = {};
  const endMat = (len, Hh, freeTo, freeFrom) => {   // wall tone with an alpha map: full inside, fading over END mm at a free end and over the top edge
    const key = [Math.round(len), freeTo, freeFrom].join(), cv = document.createElement('canvas'); if (endMats[key]) return endMats[key];
    cv.width = 256; cv.height = 128; const ctx = cv.getContext('2d'), im = ctx.createImageData(256, 128);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 256; x++) {
      const px = x / 255 * len, py = (1 - y / 127) * Hh;   // canvas row 0 is the top (v = 1)
      let a = Math.min(1, (Hh - py) / 700 * 1);
      if (freeTo) a = Math.min(a, px / END); if (freeFrom) a = Math.min(a, (len - px) / END);
      a = Math.max(0, Math.min(1, a)); a = a * a * (3 - 2 * a);
      const v = Math.round(255 * Math.min(1, a * 1.0)), o = (y * 256 + x) * 4; im.data[o] = im.data[o + 1] = im.data[o + 2] = v; im.data[o + 3] = 255;
    }
    ctx.putImageData(im, 0, 0);
    const tex = new T.CanvasTexture(cv); tex.flipY = true;
    return (endMats[key] = new T.MeshBasicMaterial({ color: new T.Color('#f4f4f1'), toneMapped: false, alphaMap: tex, transparent: true }));
  };
  const P = (a) => new T.Vector2(a[0], a[1]), near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 40;
  const walls = (home.walls || []).map((w, i) => {
    const len = Math.hypot(w.to[0] - w.from[0], w.to[1] - w.from[1]), d = [(w.to[0] - w.from[0]) / len, (w.to[1] - w.from[1]) / len], n = [d[1], -d[0]];
    return { ...w, i, len, d, n, vis: { value: 1 }, node: kit.group(), frames: kit.group(), fa: kit.fadable(), through: [], walk: [], holes: [], built: [] };
  });
  const walls_ = walls;
  for (const W of walls_) {
    const { node, len, vis } = W;
    node.position.set(W.to[0], 0, W.to[1]); node.rotation.y = Math.atan2(W.d[1], -W.d[0]);   // local x runs from `to` back toward `from`, local z is the room side
    for (const op of W.openings || []) {
      const b = opening(kit, op, vis), xc = len - op.at;
      op.width ??= b.width; op.height ??= b.height; if (op.kind !== 'arch' || b.sill) op.sill ??= b.sill;   // the checks read the sizes the style gave
      b.group.rotation.y = -Math.PI / 2; b.group.position.set(xc, 0, 0);
      W.frames.add(b.group); W.built.push({ op, group: b.group, openables: b.openables }); openables.push(...b.openables); 
      W.holes.push(b.hole.map(([z, y]) => [xc - z, y]));
      if (op.kind !== 'window' && !(op.sill > 0 || /pass$/.test(op.style || ''))) W.through.push([xc - b.width / 2, xc + b.width / 2, b.height]);
      if (op.kind === 'arch' && !(op.sill > 0 || /pass$/.test(op.style || ''))) W.walk.push([xc - b.width / 2, xc + b.width / 2]);   // a way through: the floor runs on beyond it
    }
    const square = (o) => Math.abs(o.d[0] * W.d[0] + o.d[1] * W.d[1]) < 0.9;   // a corner, square or wide (120 degrees); two walls in a line are no corner
    W.joinedTo = walls_.some((o) => o !== W && near(o.from, W.to) && square(o)); W.joinedFrom = walls_.some((o) => o !== W && near(o.to, W.from) && square(o));
    const line = (o) => Math.abs(o.d[0] * W.d[0] + o.d[1] * W.d[1]) > 0.999;   // an open-plan seam: the next wall runs on in a straight line, so this one does not thin out or draw a corner there
    W.runsOnTo = walls_.some((o) => o !== W && near(o.from, W.to) && line(o)); W.runsOnFrom = walls_.some((o) => o !== W && near(o.to, W.from) && line(o));
    const s = new T.Shape([[0, -4], [len, -4], [len, H], [0, H]].map(([a, y]) => new T.Vector2(a, y)));
    W.holes.forEach((h) => s.holes.push(new T.Path(h.map(([a, y]) => new T.Vector2(a, y)))));
    const sg = new T.ShapeGeometry(s); { const ps = sg.attributes.position, uv = new Float32Array(ps.count * 2); for (let k = 0; k < ps.count; k++) { uv[2 * k] = ps.getX(k) / len; uv[2 * k + 1] = ps.getY(k) / H; } sg.setAttribute('uv', new T.BufferAttribute(uv, 2)); }
    // a free end and the top edge melt into the backdrop over their last END mm: the plane carries an alpha map (1 inside, 0 at the very edge)
    const plane = new T.Mesh(sg, endMat(len, H, !W.joinedTo && !W.runsOnTo, !W.joinedFrom && !W.runsOnFrom)); plane.position.z = -4; plane.userData.caster = true; plane.material = plane.material.clone(); W.plane = plane;   // an own copy of the tone, so the wall can fade out with its frames
    node.add(plane, W.frames);
    // seams: the wall meets the floor (broken where a door or arch lets the floor through), and the corner it makes with the next wall
    const seams = kit.group(); let a = 0;
    for (const [t0, t1] of [...W.through].sort((p, q) => p[0] - q[0]).concat([[len, len]])) { if (t0 > a) seams.add(kit.meltingLine([a, -1, 3], [Math.min(t0, len), -1, 3], () => 0)); a = Math.max(a, t1); }
    // a corner, or the free end of a loose wall, gets an edge line that melts out toward the top
    if (W.joinedTo) seams.add(kit.meltingLine([0, -1, 3], [0, 2900, 3], (p) => step((p[1] - 2400) / 400)));   // no line at a free end: the wall just thins out
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
  const BEYOND = 1600, back = walls.filter((w) => w.walk.length).flatMap((w) => [w.from, w.to].map((q) => [q[0] - w.n[0] * BEYOND, q[1] - w.n[1] * BEYOND]));   // behind a wall with a way through, the floor runs on
  const xs = [...walls.flatMap((w) => [w.from[0], w.to[0]]), ...areas.flatMap((a) => [a.bounds.x0, a.bounds.x1]), ...back.map((q) => q[0])], zs = [...walls.flatMap((w) => [w.from[1], w.to[1]]), ...areas.flatMap((a) => [a.bounds.z0, a.bounds.z1]), ...back.map((q) => q[1])];
  const bb = { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
  const floor = new T.Mesh(new T.PlaneGeometry(bb.x1 - bb.x0 + 2 * EDGE, bb.z1 - bb.z0 + 2 * EDGE), stencilOut(kit, wallMat));
  floor.rotation.x = -Math.PI / 2; floor.position.set((bb.x0 + bb.x1) / 2, -4, (bb.z0 + bb.z1) / 2);
  group.add(floor);
  const style = home.floor?.style || (home.tiles ? 'tiles' : 'plain'), M = 1500;
  const out = (p) => Math.hypot(Math.max(bb.x0 - p[0], p[0] - bb.x1, 0), Math.max(bb.z0 - p[2], p[2] - bb.z1, 0));
  // the floor of an area stops at its backing walls (nothing lies behind them, at any angle) and runs out freely on its open sides
  const EXT = 3000, regions = areas.map((a) => ({ b: a.bounds, ws: walls.filter((w) => w.id && w.id.startsWith(a.id + '-')) }));
  const behind = (p) => !regions.length ? 0 : Math.min(...regions.map(({ b, ws }) => {
    let d = Math.hypot(Math.max(b.x0 - EXT - p[0], p[0] - b.x1 - EXT, 0), Math.max(b.z0 - EXT - p[2], p[2] - b.z1 - EXT, 0));
    for (const w of ws) { const dx = p[0] - w.to[0], dz = p[2] - w.to[1], s = -(dx * w.d[0] + dz * w.d[1]); if (s >= 0 && s <= w.len) { const k = -(dx * w.n[0] + dz * w.n[1]); d = Math.max(d, k > 0 && k < BEYOND && w.walk.some(([a, b]) => s > a && s < b) ? k * 80 / BEYOND : k); } }   // beyond an arch the floor lines carry on for BEYOND mm, fading
    return d;
  }));
  const tone = (p) => Math.max(step(out(p) / M), step(behind(p) / 80));
  let floorDraw = null;   // pencil seams (tiles or boards): redrawn as the camera moves, so lines that bunch up fade out
  if (style === 'tiles' || style === 'boards') {
    const F = home.floor || {};
    const zones = F.zones || [], base = { bb, M, tone, seed: F.seed || 1, board: F.board || 120 + 20 * ((F.seed || 1) % 4), angle: (F.angle || 0) * Math.PI / 180, cell: home.tiles?.size || 600, origin: home.tiles?.origin };
    const draws = [floorLines(kit, { ...base, style, except: zones.map((z) => z.rect) }), ...zones.map((z) => floorLines(kit, { ...base, style: z.style, clip: z.rect, edge: z.edge }))];   // open plan: a zone carries its own floor style, cut clean at the seam
    floorDraw = { update: (camera) => draws.forEach((d) => d.update(camera)) }; for (const d of draws) group.add(d.object);
  }

  // ---- contact shadows, generated from each object's footprint and mount
  const shadows = kit.group(), shadowMasks = [];   // shadowMasks: where the baked light must let go of a faded floor piece's own contact shadow
  for (const o of home.objects || []) {
    if (o.shadow === false) continue;
    const b = feet[o.id], g = objects[o.id], sv = blockers.find((B) => B.id === o.id)?.sv || null;
    if (o.mount === 'ceiling') continue;   // it is daylight: a lamp casts no light and no shadow
    if (o.mount === 'floor') { shadows.add(halo(kit, 'floor', b.min.x, b.max.x, b.min.z, b.max.z, (o.lift || 0) + 1.5, o.asset === 'rug' ? 0.14 : 0.26, sv)); if (sv) shadowMasks.push({ box: [b.min.x, b.min.z, b.max.x, b.max.z], sv }); }
    else if (o.mount === 'on' && o.asset !== 'hob') shadows.add(halo(kit, 'floor', b.min.x, b.max.x, b.min.z, b.max.z, b.min.y + 1.5, 0.3, sv));
    else if (o.mount === 'wall') {   // under a wall unit: on the wall it hangs from
      for (const W of walls) {
        const c = [...[b.min.x, b.max.x].flatMap((x) => [b.min.z, b.max.z].map((z) => [x, z]))].map(([x, z]) => [(x - W.to[0]) * -W.d[0] + (z - W.to[1]) * -W.d[1], (x - W.to[0]) * W.n[0] + (z - W.to[1]) * W.n[1]]);
        const xa = Math.min(...c.map((p) => p[0])), xb = Math.max(...c.map((p) => p[0])), zn = Math.min(...c.map((p) => p[1]));
        if (xb - xa >= 300 && zn < 80 && zn > -80 && xa > -10 && xb < W.len + 10) { W.shadows.add(halo(kit, 'back', xa, xb, b.min.y, b.min.y + 250, -2, 0.22, W.vis)); break; }
      }
    }
  }
  group.add(shadows);

  const w3 = 3 * Math.PI / 180; let lastT;
  return {
    group, objects, openables, walls, bounds: bb, blockers, shadowMasks,
    // the footprint halos and wall-base shadows: kept as the fallback, hidden once the light is baked
    useBake(on = true) { shadows.visible = !on; for (const W of walls) W.shadows.visible = !on; },
    // Each frame: a wall's frames, window light, seams and shadows fade away once the camera is past that wall (over about 3 degrees).
    update(camera, target, rest = false, instant = false) {
      floorDraw?.update(camera);
      const now = performance.now(), dt = Math.min(0.1, (now - (lastT ?? now)) / 1000), ease = instant ? 1 : 1 - Math.exp(-dt / 0.07); lastT = now;   // what blocks the view fades over about a tenth of a second, then comes back the same way
      const dist = camera.position.distanceTo(target), span = Math.min(200, Math.max(1, dist * Math.sin(w3)));   // never more than 200 mm: a wall the camera passes thins out over a short distance, not over metres
      for (const W of walls) {
        const d = (camera.position.x - W.to[0]) * W.n[0] + (camera.position.z - W.to[1]) * W.n[1];
        let s = Math.min(step((d + span / 2) / span), d > 300 ? 1 : 0);   // a wall is out altogether when the camera is within 300 mm of its plane, so no half-faded sheet hangs in front of the lens
        if (s > 0 && blocksView(W, camera.position, target, home.height || 2700)) s = 0;   // a wall that stands between the camera and the view centre (not through one of its openings) fades too, so a glide through the house never looks at the back of a wall
        W.goal = s; let c = W.cur === undefined ? s : W.cur + (s - W.cur) * ease; if (Math.abs(c - s) < 0.02) c = s; W.cur = c;   // goal: where the fade is heading (the checks read it); cur: what is drawn now
        if (c !== W.last) { W.last = c; W.vis.value = c; W.fa.set(c); if (W.plane) { W.plane.visible = c > 0.001; W.plane.material.opacity = c; } }
      }
      // the objects on the line from the camera to its target
      const P = camera.position, ax = target.x - P.x, ay = target.y - P.y, az = target.z - P.z, pad = 30, tb = new T.Box3();
      for (const B of blockers) {
        const b = boxes[B.id]; let hit = false;
        if (!(rest && B.main) && !b.isEmpty()) {
          tb.copy(b).expandByScalar(pad); let t0 = 0, t1 = 1;
          for (const [o, d, lo, hi] of [[P.x, ax, tb.min.x, tb.max.x], [P.y, ay, tb.min.y, tb.max.y], [P.z, az, tb.min.z, tb.max.z]]) { if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) { t0 = 2; break; } } else { let u = (lo - o) / d, v = (hi - o) / d; if (u > v) [u, v] = [v, u]; t0 = Math.max(t0, u); t1 = Math.min(t1, v); if (t0 > t1) break; } }
          hit = t0 <= t1 && t0 <= 1 && !tb.clone().expandByScalar(70).containsPoint(target);   // not the thing the camera looks at
        }
        if (B.wall === undefined) { B.wall = null; if (!b.isEmpty() && b.min.y > 250) { let best = 160; for (const W of walls) { const x = (b.min.x + b.max.x) / 2, z = (b.min.z + b.max.z) / 2, side = (x - W.to[0]) * W.n[0] + (z - W.to[1]) * W.n[1], al = -((x - W.to[0]) * W.d[0] + (z - W.to[1]) * W.d[1]), half = Math.abs(W.n[0]) * (b.max.x - b.min.x) / 2 + Math.abs(W.n[1]) * (b.max.z - b.min.z) / 2, gap = Math.abs(side) - half; if (gap < best && al > -100 && al < W.len + 100) { best = gap; B.wall = W; } } } }   // a piece hung on a wall (off the floor, touching its plane) takes that wall's fade
        if (home.blockerFade === false) hit = false;
        B.goal = hit || (B.wall && B.wall.goal === 0) ? 0 : 1; let c = B.cur === undefined ? B.goal : B.cur + (B.goal - B.cur) * ease; if (Math.abs(c - B.goal) < 0.02) c = B.goal; B.cur = c;
        if (c !== B.last) { B.last = c; B.fa.set(c); B.sv.value = home.shadowFade === false ? 1 : c; }
        if (c <= 0.001 && B.g.visible) { B.g.visible = false; B.fh = true; } else if (c > 0.001 && B.fh) { B.g.visible = true; B.fh = false; }   // fully faded: not drawn at all (area-run's only() resets fh)
      }
    },
  };
}

// does the wall W (a plan segment from `to` to `from`, with its ways through) stand between the camera and the view centre, below its top?
export function blocksView(W, cam, tgt, top) {
  const side = (p) => (p.x - W.to[0]) * W.n[0] + (p.z - W.to[1]) * W.n[1], a = side(cam), b = side(tgt);
  if (!(a > 150 && b < -150)) return false;
  const t = a / (a - b), x = cam.x + (tgt.x - cam.x) * t, y = cam.y + (tgt.y - cam.y) * t, z = cam.z + (tgt.z - cam.z) * t, s = -((x - W.to[0]) * W.d[0] + (z - W.to[1]) * W.d[1]);
  return s > -2500 && s < W.len + 2500 && y < top;   // 2.5 m beyond either end too, and an arch or door does not save it: a wall in front of any part of the frame fades, so no sheet of a neighbour's wall hangs over the view (the wall's own arch is still seen when the camera stands in its room)
}

// An area's fade numbers, from its bounds { x0, x1, z0, z1, top }: the planes' box and the view fade's sphere, all in world mm.
export function fadeOf(b) {
  const top = b.top || 2500;
  return { centre: [(b.x0 + b.x1) / 2, top / 2 - 150, (b.z0 + b.z1) / 2], half: [(b.x1 - b.x0) / 2, top / 2 + 300, (b.z1 - b.z0) / 2], width: Math.max(b.x1 - b.x0, b.z1 - b.z0) };
}
