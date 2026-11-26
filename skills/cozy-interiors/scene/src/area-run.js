// @js:area-run — createAreaScene(canvas, S): the page-side runner for a scene.json with `home` and `areas` (see home.js). The whole home is one world, built once; an area is a view into it:
// its bounds (what stays solid; the fills, lines and objects thin out past them) and its home camera { target, az, el, dist }, with the orbit limited to about 80 degrees either side of that az.
// cozyScene.setArea(id) glides there: camera, target and the fade box ease together over about 1.6 s, so a neighbouring area's nearest pieces pass through the edge of the frame.
// Ways to shift: click a door or arch that names `to: <area id>`, the left/right arrow keys, the area names at the bottom of the page.
// window.cozyScene: { scene, camera, controls, kit, home, areas, areaIds (array of ids, in order), area (id), setArea(id, snap), startGlide(id, hold), glideAt(k), objects, openables, tour, look(dist, az, el, target?), at(pos, target), openAll(on), S }.
import * as THREE from './vendor/three/three.module.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { createKit } from './kitchen3d.js';
import { REGISTRY } from './library/index.js';
import { buildHome, FADE } from './home.js';
import { bakeLight } from './lightbake.js';
import { VIEW, PORTAL_REF } from './sheet.js';
import { createTour } from './tour.js';
import { route, glidePath, glideSecs, camPos } from './glidepath.js';
import { createMotion } from './motion/index.js';

const rad = THREE.MathUtils.degToRad, deg = THREE.MathUtils.radToDeg, FOV = 30, SPAN = 80;
const smooth = (k) => k * k * (3 - 2 * k);

export function createAreaScene(canvas, S) {
  const q = new URLSearchParams(location.search);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: true });
  renderer.setClearColor(0xf4f4f1);
  renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene(), kit = createKit();
  if (S.home.accent) kit.setAccent(S.home.accent);
  kit.keepParts = q.has('check');
  const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 400000);
  const home = buildHome(kit, S.home, REGISTRY, S.areas);
  kit.setTopFade((S.home.height || 2700) - 400, S.home.height || 2700);   // the shared top rule: anything that reaches the home's top melts out over its last 400 mm (a chimney, a flue, a cord)
  scene.add(home.group);
  kit.setOpacity(1, 1);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minPolarAngle = rad(5); controls.maxPolarAngle = rad(95);

  const sph = (d, az, el) => new THREE.Vector3().setFromSphericalCoords(d, rad(90 - el), rad(az));
  const areas = Object.fromEntries(S.areas.map((a) => [a.id, a]));
  const order = S.areas.map((a) => a.id);
  const links = S.home.plan?.links, walk = S.home.plan?.walk;   // the house plan: the glide walks its ways through
  let cur = null, tour = null, glide = null, lastInput = performance.now(), aspect = 1;

  // An area's numbers: the camera's home and the fade, all in world mm.
  const fit = (b) => { const half = Math.tan(rad(FOV / 2)); return Math.max(((b.x1 - b.x0) + 1100) / (2 * half * aspect), ((b.top || 2500) + 500) / (2 * half)) * 1.1 + (b.z1 - b.z0) / 2; };
  // `camera.home.fit: 'objects'` frames the area's own objects: the camera keeps its az and el, moves its target so the objects' outline is centred, and backs off until every
  // object sits inside the frame with a 6% margin. (Without it, the distance comes from the bounds.)
  const solidBox = (g, out) => {
    g.updateMatrixWorld(true); const bb = new THREE.Box3();
    g.traverse((o) => { if (!o.isMesh || o.isLineSegments2 || o.material.isMeshBasicMaterial || kit.hulls.includes(o.material) || o.material === kit.depth) return; o.geometry.computeBoundingBox(); out.union(bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); });
    return out;
  };
  const inArea = (A, g) => g.userData.scene.area ? g.userData.scene.area === A.id : (() => { const c = new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3()), b = A.bounds; return c.x >= b.x0 && c.x <= b.x1 && c.z >= b.z0 && c.z <= b.z1; })();
  const fitted = {};
  const fitView = (A, v) => {
    const key = A.id + '@' + aspect.toFixed(3); if (fitted[key]) return fitted[key];
    home.group.updateMatrixWorld(true);
    const pts = []; for (const g of Object.values(home.objects)) if (inArea(A, g)) { const b = solidBox(g, new THREE.Box3()); if (b.isEmpty()) continue; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) pts.push(new THREE.Vector3(x, y, z)); }
    for (const W of home.walls) if (W.id && W.id === A.id + '-back') for (const o of W.built) { const b = solidBox(o.group, new THREE.Box3()); if (b.isEmpty()) continue; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) pts.push(new THREE.Vector3(x, y, z)); }   // doors, arches and windows of the backing walls count too
    const cam = new THREE.PerspectiveCamera(FOV, aspect, 10, 400000), tg = new THREE.Vector3(...v.target), LIM = 0.92;
    let d = v.dist || 8000;
    const place = () => { cam.position.copy(tg).add(sph(d, v.az, v.el)); cam.lookAt(tg); cam.updateMatrixWorld(true); cam.updateProjectionMatrix(); };
    const ndc = () => pts.map((p) => p.clone().project(cam));
    for (let it = 0; it < 14; it++) {
      place(); const n = ndc(), x0 = Math.min(...n.map((p) => p.x)), x1 = Math.max(...n.map((p) => p.x)), y0 = Math.min(...n.map((p) => p.y)), y1 = Math.max(...n.map((p) => p.y));
      const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1), k = d * Math.tan(rad(FOV / 2));
      tg.addScaledVector(right, (x0 + x1) / 2 * k * aspect).addScaledVector(up, (y0 + y1) / 2 * k);   // centre the outline
      place(); const m = ndc(), w = Math.max(...m.map((p) => Math.abs(p.x))), h = Math.max(...m.map((p) => Math.abs(p.y)));
      const q = Math.max(w / LIM, h / 0.93); d *= q; if (Math.abs(q - 1) < 0.01) break;   // width keeps a 13% margin, height 7% (the frame is wide)
    }
    { place(); const n = ndc(), y0 = Math.min(...n.map((p) => p.y)), k = d * Math.tan(rad(FOV / 2)), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1); tg.addScaledVector(up, Math.max(0, y0 + 0.84) * k); }   // the lowest piece sits 8% above the frame's bottom edge: a wide arrangement leaves wall above it, not empty floor below
    return (fitted[key] = { target: tg.toArray(), az: v.az, el: v.el, dist: d });
  };
  const viewOf = (A) => {
    const h = A.camera?.home || {}, b = A.bounds, top = b.top || 2500;
    const target = h.target || [(b.x0 + b.x1) / 2, top / 2 - 150, (b.z0 + b.z1) / 2];
    const v = { target, az: h.az ?? 20, el: h.el ?? 15, dist: h.dist || fit(b) };
    if (h.fit !== 'objects') return v; const f = fitView(A, v); return [...f.target, f.dist].every(Number.isFinite) ? f : v;   // an area with nothing in it keeps its plain view
  };
  // open plan: areas of one group share a floor and are drawn together, and the fade box is the group's bounds, so nothing thins out at a seam
  const groupOf = (id) => areas[id].group || id, together = (a, b) => !!a && !!b && groupOf(a) === groupOf(b);
  const boundsOf = (A) => { if (!A.group) return A.bounds; const m = S.areas.filter((x) => x.group === A.group).map((x) => x.bounds); return { x0: Math.min(...m.map((b) => b.x0)), x1: Math.max(...m.map((b) => b.x1)), z0: Math.min(...m.map((b) => b.z0)), z1: Math.max(...m.map((b) => b.z1)), top: A.bounds.top }; };
  const fadeOf = (A) => {
    let b = boundsOf(A); const top = b.top || 2500, w = Math.max(b.x1 - b.x0, b.z1 - b.z0), r0 = 0;
    for (const W of home.walls) if (W.walk.length && W.id && together(order.find((q) => W.id.startsWith(q + '-')), A.id)) b = { ...b, ...[W.from, W.to].reduce((e, q) => { const x = q[0] - W.n[0] * 1600, z = q[1] - W.n[1] * 1600; return { x0: Math.min(e.x0, x), x1: Math.max(e.x1, x), z0: Math.min(e.z0, z), z1: Math.max(e.z1, z) }; }, { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 }) };   // the floor beyond a way through stays in view
    if (S.home.neighbourFade === true) for (const n of portal) { const nb = boundsOf(areas[n]); b = { ...b, x0: Math.min(b.x0, nb.x0), x1: Math.max(b.x1, nb.x1), z0: Math.min(b.z0, nb.z0), z1: Math.max(b.z1, nb.z1) }; }   // opt-in (neighbourFade: true): the fade box takes in a room drawn through an arch or door; off by default because the floor lines of the enlarged box then show outside the opening
    const bx = b.x1 - b.x0, bz = b.z1 - b.z0;   // objects past the bounds thin from the edge: about 35% gone at 1 m, all gone at 2 m
    return [(b.x0 + b.x1) / 2, top / 2 - 150, (b.z0 + b.z1) / 2, bx / 2, top / 2 + 300, bz / 2, FADE[0] * w, FADE[1] * w, r0, 900];
  };
  const applyFade = (f) => {
    kit.setFade(new THREE.Vector3(f[0], f[1], f[2]), new THREE.Vector3(f[3], f[4], f[5]), f[6], f[7]);
    const c = new THREE.Vector3(f[0], f[1], f[2]), h = new THREE.Vector3(f[3], f[4], f[5]); kit.setViewFade(c, f[8], f[9], h);
    VIEW.c = c; VIEW.h = h; VIEW.r0 = f[8]; VIEW.r1 = f[9];
  };
  const limits = (az) => { controls.minAzimuthAngle = rad(az - SPAN); controls.maxAzimuthAngle = rad(az + SPAN); };

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = aspect = w / h; camera.updateProjectionMatrix();
    kit.setResolution(w, h);
    if (cur) { const v = viewOf(areas[cur]); controls.minDistance = 600; controls.maxDistance = v.dist * 1.6; }
  }
  const look = (d, az, el, target) => { if (target) controls.target.set(...target); camera.position.copy(controls.target).add(sph(d, az, el)); camera.lookAt(controls.target); controls.update(); };
  const at = (pos, target) => { controls.target.set(...target); camera.position.set(...pos); camera.lookAt(controls.target); controls.update(); };

  function makeTour(id) {
    const A = areas[id], cam = A.camera || {}, quick = Number(q.get('cuts')) || 0;
    tour = createTour({ THREE, camera, controls, room: home.group, home: { pos: camera.position.clone(), target: controls.target.clone() }, cfg: { ...Object.fromEntries(['after', 'cutsAfter', 'cutEvery'].filter((k) => cam[k] != null).map((k) => [k, cam[k]])), shots: cam.shots, swayFit: (maxDeg) => api.swayFit(maxDeg), ...(quick ? { after: quick, cutsAfter: quick } : {}) } });
    api.tour = tour;
  }
  // at rest the current area is drawn, with the first room beyond each of its arches and doors while the camera stands on this side (sync); other areas' walls (frames, seams, shadows) and objects are hidden outright; a glide shows everything
  const shown = (id, area) => id === null || (area ? area === id || groupOf(area) === groupOf(id) : false);
  // beyond an arch or a door (a way through that is not open plan) the first room is drawn too, but only while the camera stands on this side of the way's plane: the wall hides it everywhere except through the opening, so no angle of the orbit shows empty white behind it, and no neighbour ever stands between the camera and the area (it is switched off the moment the camera passes the wall)
  // the pieces and walls of a neighbouring room are drawn only where a door's or arch's mask wrote PORTAL_REF into the stencil buffer (portalMask in sheet.js): through the opening, never through a window or past a wall's end. The state is set around each draw, so materials shared with the area's own pieces stay as they were.
  const portal = new Set();
  const hookPortal = (root, area) => root.traverse((m) => {
    if (!(m.isMesh || m.isLine || m.isLineSegments2)) return;
    const before = m.onBeforeRender, after = m.onAfterRender;
    m.onBeforeRender = function (...a) { const mat = a[4]; if (portal.has(area) && mat && !mat.stencilWrite && !this.userData.noPortal) { Object.assign(mat, { stencilWrite: true, stencilRef: PORTAL_REF, stencilFunc: THREE.EqualStencilFunc, stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.KeepStencilOp }); this.userData.ptMat = mat; } before.apply(this, a); };
    m.onAfterRender = function (...a) { if (this.userData.ptMat) { this.userData.ptMat.stencilWrite = false; this.userData.ptMat = null; } after.apply(this, a); };
  });
  let homePose = null;   // the camera and target of the area's home view, as arrive() sets them
  const sync = () => {
    S.home.curArea = cur; S.home.homeView = !!(cur && !glide && homePose && camera.position.distanceTo(homePose.p) < 60 && controls.target.distanceTo(homePose.t) < 60);   // the home view fades none of its own area's groups (home.js)
    if (!cur || glide || !links || S.home.passageView === false) return;
    let fadeChanged = false;
    for (const l of links) { if (l.kind === 'open' || (l.a !== cur && l.b !== cur)) continue;
      const n = l.a === cur ? l.b : l.a, dir = l.a === cur ? 1 : -1, side = ((camera.position.x - l.p[0]) * l.d[0] + (camera.position.z - l.p[1]) * l.d[1]) * dir, on = side < -100 && !together(cur, n);   // l.d points from a to b
      if (!l.shows) l.shows = {}; if (l.shows[n] === on) continue; l.shows[n] = on; fadeChanged = true;
      for (const m of order.filter((q) => groupOf(q) === groupOf(n))) {   // the room beyond is the whole open plan it belongs to: kitchen, dining and living all stand behind the arch
        if (on) portal.add(m); else portal.delete(m);
        for (const o of Object.values(home.objects)) if (o.userData.scene.area === m) o.visible = on;
        for (const W of [...home.walls, ...home.closers]) if ((W.id || '').startsWith(m + '-')) { W.node.visible = on; solid(W, on); }
        for (const b of home.blockers) if (b.g.userData.scene.area === m) b.fh = false; } }
    if (fadeChanged) applyFade(fadeOf(areas[cur]));
  };
  const orderArea = (W) => order.find((a) => (W.id || '').startsWith(a + '-'));
  if (S.home.portalClip !== false) for (const o of Object.values(home.objects)) hookPortal(o, o.userData.scene.area);
  if (S.home.portalClip !== false) for (const W of [...home.walls, ...home.closers]) if (orderArea(W) && !W.walk.length) hookPortal(W.node, orderArea(W));
  const solid = (W, on) => { const m = W.plane && W.plane.material; if (!m) return; if (on) { if (m.alphaMap) { m.userData.am = m.alphaMap; m.alphaMap = null; m.needsUpdate = true; } } else if (m.userData.am && !m.alphaMap) { m.alphaMap = m.userData.am; m.needsUpdate = true; } };   // a room seen through an opening has whole walls: no melting ends
  const only = (id) => { portal.clear(); for (const W of home.closers) { W.node.visible = false; solid(W, false); } for (const W of home.walls) { solid(W, false); W.node.visible = id === null || shown(id, order.find((a) => (W.id || '').startsWith(a + '-'))); } for (const o of Object.values(home.objects)) o.visible = shown(id, o.userData.scene.area); for (const b of home.blockers) b.fh = false; for (const l of links || []) l.shows = null; };   // an area's whole open-plan group is drawn at rest
  function arrive(id) {
    cur = id; api.area = id; only(id);
    const v = viewOf(areas[id]);
    controls.target.set(...v.target); camera.position.copy(controls.target).add(sph(v.dist, v.az, v.el)); camera.lookAt(controls.target);
    camera.fov = FOV; limits(v.az); controls.enabled = true; resize(); controls.update();   // resize() updates the projection; a glide that cut a tour shot short would otherwise keep the shot's lens
    applyFade(fadeOf(areas[id])); makeTour(id); markLabels();
    homePose = { p: camera.position.clone(), t: controls.target.clone() };
  }
  // Where the camera is now, as target + spherical offset.
  const stance = () => { const off = camera.position.clone().sub(controls.target), s = new THREE.Spherical().setFromVector3(off); return { target: controls.target.toArray(), az: deg(s.theta), el: 90 - deg(s.phi), dist: s.radius }; };
  function startGlide(id, hold = false) {
    if (!areas[id]) throw new Error(`no area "${id}"; areas: ${order.join(', ')}`);
    if (id === cur && !glide) return;
    const from = stance(), to = viewOf(areas[id]);
    let daz = ((to.az - from.az + 540) % 360) - 180;   // the short way round
    const ways = cur && links ? route(links, cur, id) : [], path = ways.length || (cur && links && !together(cur, id)) ? glidePath(from, to, ways, { height: S.home.height || 2700 }) : null;
    glide = { id, from, to, daz, path, secs: path ? path.secs : glideSecs(Math.max(Math.hypot(...to.target.map((v, i) => v - from.target[i])), Math.hypot(...[0, 1, 2].map((i) => camPos(to.target, to.dist, to.az, to.el)[i] - camPos(from.target, from.dist, from.az, from.el)[i])))), fade0: cur ? fadeOf(areas[cur]) : fadeOf(areas[id]), fade1: fadeOf(areas[id]), t0: performance.now(), hold, k: 0 };
    glide.apart = !together(cur, id); controls.enabled = false; markLabels(id); if (glide.apart) only(cur);   // the first frame is the start view itself; the other areas are drawn from the first step on (glideAt)   // between areas of one group nothing switches on or off
  }
  function glideAt(k) {
    const g = glide, e = smooth(Math.min(1, Math.max(0, k))); g.k = k;
    if (g.path) { controls.target.set(...g.path.tgt(e)); camera.position.set(...g.path.pos(e)); }   // walk the plan: position and aim follow the curve through the ways, so the view turns as it goes
    else {
      const tg = g.from.target.map((a, i) => a + (g.to.target[i] - a) * e);
      controls.target.set(...tg);
      camera.position.copy(controls.target).add(sph(g.from.dist + (g.to.dist - g.from.dist) * e, g.from.az + g.daz * e, g.from.el + (g.to.el - g.from.el) * e));
    }
    camera.lookAt(controls.target); if (k > 0 && !g.shown && g.apart) { g.shown = true; only(null); }
    let f = g.fade0.map((a, i) => a + (g.fade1[i] - a) * e);
    if (g.apart && g.path) {   // on the way the fade box (what is drawn solid) grows to hold both areas and the walk between them, so nothing along the route thins into a milky veil; it is the start's box at k = 0 and the destination's at k = 1
      const U = g.union ||= (() => { const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; const add = (p, m) => { for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p[i] - m[i]); hi[i] = Math.max(hi[i], p[i] + m[i]); } }; for (const F of [g.fade0, g.fade1]) add(F.slice(0, 3), F.slice(3, 6)); for (let j = 0; j <= 20; j++) add(g.path.pos(j / 20), [2500, 0, 2500]); return [...lo.map((l, i) => (l + hi[i]) / 2), ...lo.map((l, i) => (hi[i] - l) / 2), Math.max(g.fade0[6], g.fade1[6]), Math.max(g.fade0[7], g.fade1[7]), g.fade0[8], Math.max(g.fade0[9], g.fade1[9])]; })(), a = smooth(Math.min(1, Math.min(e, 1 - e) / 0.15));
      f = f.map((v, i) => v + (U[i] - v) * a); }
    applyFade(f);
    if (k >= 1) { const id = g.id; glide = null; arrive(id); }
  }
  function setArea(id, snap = false) { if (snap || !cur) { glide = null; arrive(id); } else startGlide(id); }

  // ---- ways to shift: the area names at the bottom, the arrow keys, a click on a door or arch with `to`
  // the light bake treats an open-plan group as one area: one floor sheet, so daylight shows no step at a seam
  const bakeAreas = () => { const seen = {}, list = []; for (const A of S.areas) { if (!A.group) { list.push({ id: A.id, bounds: A.bounds }); continue; } if (seen[A.group]) continue; seen[A.group] = 1; const m = S.areas.filter((x) => x.group === A.group); list.push({ id: A.group, ids: m.map((x) => x.id), bounds: boundsOf(A) }); } return list; };
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:0;right:0;bottom:14px;display:flex;justify-content:center;gap:6px;font:13px/1 system-ui,-apple-system,sans-serif;pointer-events:none';
  const btns = Object.fromEntries(S.areas.map((a) => {
    const b = document.createElement('button');
    b.textContent = a.name || a.id;
    b.style.cssText = 'pointer-events:auto;cursor:pointer;border:0;background:none;padding:6px 10px;border-radius:14px;color:#777;font:inherit;letter-spacing:.01em';
    b.addEventListener('click', () => { lastInput = performance.now(); setArea(a.id); });
    bar.appendChild(b); return [a.id, b];
  }));
  if (S.areas.length > 1) document.body.appendChild(bar);
  function markLabels(id = cur) { for (const [k, b] of Object.entries(btns)) { b.style.color = k === id ? '#222' : '#8a8a85'; b.style.background = k === id ? 'rgba(0,0,0,.06)' : 'none'; } }
  addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const seq = walk?.length ? walk : order, i = seq.indexOf(glide ? glide.id : cur), j = i + (e.key === 'ArrowRight' ? 1 : -1);   // the arrow keys follow the plan's walk
    if (j >= 0 && j < seq.length) setArea(seq[j]);
  });
  addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  for (const ev of ['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart']) addEventListener(ev, () => { lastInput = performance.now(); }, { capture: true, passive: true });

  // Click (not drag) on a front opens it, a second click shuts it; a door or arch with `to` goes to that area.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const targetAt = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(home.group.children, true).find((h) => h.object.isMesh && !h.object.isLineSegments2 && h.object.visible && !(h.object.material.isMeshBasicMaterial && !h.object.userData.go));
    for (let o = hit && hit.object; o; o = o.parent) if (o.userData.open || o.userData.go) return o;
    return null;
  };
  const neighbourAt = (e) => {   // the open-plan neighbour a click lands on: the area of the object hit, when it is not the current area but shares its group
    if (!cur || !areas[cur].group) return null;
    const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(home.group.children, true).find((h) => h.object.isMesh && !h.object.isLineSegments2 && h.object.visible && !h.object.material.isMeshBasicMaterial);
    for (let o = hit && hit.object; o; o = o.parent) { const a = o.userData.scene?.area; if (a) return a !== cur && together(a, cur) ? a : null; }
    return null;
  };
  let downAt = null;
  canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt || glide || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
    const f = targetAt(e); if (!f) { const n = neighbourAt(e); if (n) setArea(n); return; }   // a click on a piece of an open-plan neighbour glides there
    if (f.userData.go) { setArea(f.userData.go); return; }
    const o = f.userData.open;
    if (o.states) { o.i = (o.i + 1) % o.states.length; for (const m of (o.pair || [f])) { const mo = m.userData.open; mo.i = o.i; mo.target = mo.states[o.i]; } }
    else o.target = 1 - o.target;
  });
  canvas.addEventListener('pointermove', (e) => { if (!e.buttons) canvas.style.cursor = !glide && (targetAt(e) || neighbourAt(e)) ? 'pointer' : ''; });
  const moveFronts = (dt, snap) => {
    for (const f of home.openables) {
      const o = f.userData.open; o.v = snap ? o.target : o.v + (o.target - o.v) * (1 - Math.exp(-dt * 7));
      if (o.kind === 'door') f.rotation.y = o.dir * rad(o.max) * o.v; else f.position.z = o.max * o.v;
    }
  };

  let last = performance.now();
  const api = {
    groupOf, groupBounds: (id) => boundsOf(areas[id]), scene, camera, controls, kit, home, areas, areaIds: order, area: null, setArea, startGlide, glideAt, look, at, S, tour: null,
    get glide() { return glide; }, objects: home.objects, openables: home.openables,
    openAll(on) { home.openables.forEach((f) => { f.userData.open.target = on ? 1 : 0; }); moveFronts(1, true); },
  };
  api.motion = createMotion(kit, home, S);   // living things (motion/index.js): what the roll dealt each area
  {   // the cameras fliers keep away from: an area's home view (its fitted view is known once the area is on show) and its tour shot cameras; the live camera too on the page (not in ?check)
    const home0 = {}, shotsOf = (id) => (areas[id].camera?.shots || []).map((x) => new THREE.Vector3(...x.from)), plain = /[?&]check\b/.test(location.search);
    api.motion.cameraOf = (id) => {
      if (api.area !== id) return shotsOf(id);
      if (!home0[id]) { const v = viewOf(areas[id]); home0[id] = [new THREE.Vector3(...v.target).add(sph(v.dist, v.az, v.el)), ...shotsOf(id)]; }
      return plain ? home0[id] : [...home0[id], camera.position];
    };
  }
  resize();
  arrive(q.get('area') || order[0]);
  const loopFn = (now) => {
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000)); last = now;
    if (glide) { lastInput = now; if (!glide.hold) glideAt((now - glide.t0) / 1000 / glide.secs); }
    else if (!tour.update(now, now - lastInput)) controls.update();
    for (const g of Object.values(home.objects)) { g.userData.tick?.(dt); g.userData.update?.(dt); }
    api.motion.update(dt, api.area);
    moveFronts(dt);
    sync(); home.update(camera, tour.look || controls.target, !glide);
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(loopFn);
  // for the checks (check-home ghosts): stop the live loop (one software-GL frame takes over half a second), settle the fades without drawing, then draw one frame on demand
  api.loop = (on) => renderer.setAnimationLoop(on ? loopFn : null);
  api.advance = (sec, live) => { const dt = live ? 0.05 : 0.1; for (let t = 0; t < sec - 1e-9; t += dt) { for (const g of Object.values(home.objects)) { g.userData.tick?.(dt); g.userData.update?.(dt); } if (live) api.motion.update(dt, api.area); moveFronts(dt); sync(); home.update(camera, tour.look || controls.target, !glide); } };   // live: the living things move too (watch.mjs)
  api.swayFit = (maxDeg = 25) => {   // the idle sway turns the camera round the home view's target: objects of the area that are inside the frame now stay inside, by pulling the camera back (up to 35%) as it turns; where that is not enough the swing is cut short
    const T = THREE, Y = new T.Vector3(0, 1, 0), id = api.area, tgt = controls.target, off0 = camera.position.clone().sub(tgt), pos = camera.position.clone(), quat = camera.quaternion.clone();
    home.group.updateMatrixWorld(true);
    const boxes = Object.values(home.objects).filter((g) => { const sc = g.userData.scene; return sc && sc.area === id && !['rug', 'scratches', 'socket', 'lightSwitch', 'scuff', 'leaf', 'heightChart'].includes(sc.asset); }).map((g) => new T.Box3().setFromObject(g));
    const pt = new T.Vector3(), put = (deg, s) => { camera.position.copy(tgt).add(off0.clone().applyAxisAngle(Y, deg * Math.PI / 180).multiplyScalar(s)); camera.lookAt(tgt); camera.updateMatrixWorld(true); camera.matrixWorldInverse.copy(camera.matrixWorld).invert(); };
    const out = (b) => { let o = 0; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { pt.set(x, y, z).project(camera); o = Math.max(o, Math.abs(pt.x), Math.abs(pt.y)); } return o; };
    put(0, 1); const keep = boxes.filter((b) => out(b) <= 1);   // the ones in the frame now (a dealt foreground piece already cut by the edge may stay cut)
    const ok = (deg, s) => { put(deg, s); return keep.every((b) => out(b) <= 1); };
    const table = {}; let max = maxDeg;
    for (let d = 0; d <= maxDeg; d++) for (const sg of [1, -1]) { const deg = d * sg; let s = 1; while (s < 1.35 && !ok(deg, s)) s += 0.025; if (s >= 1.35 && !ok(deg, 1.35)) { max = Math.min(max, Math.max(0, d - 1)); } else table[deg] = s; }
    camera.position.copy(pos); camera.quaternion.copy(quat); camera.updateMatrixWorld(true);
    const scale = (deg) => { const lo = Math.floor(deg), hi = Math.ceil(deg), a = table[lo] ?? 1.35, b = table[hi] ?? 1.35; return a + (b - a) * (deg - lo); };
    return { max, scale };
  };
  api.sync = sync; api.portal = portal; api.orderArea = orderArea; api.draw = () => { sync(); home.update(camera, tour.look || controls.target, !glide); renderer.render(scene, camera); return renderer.domElement; };
  window.cozyScene = api;
  // the light is baked after the page is up (the passes are spread over frames) and fades in; until then, and if the bake is not possible, the old halos stand in
  window.cozyBaked = q.has('nobake') || q.has('check');
  if (!window.cozyBaked) {
    const withAll = (fn) => { const ws = home.walls.map((W) => W.node.visible), os = Object.values(home.objects).map((o) => o.visible); only(null); try { fn(); } finally { home.walls.forEach((W, i) => { W.node.visible = ws[i]; }); Object.values(home.objects).forEach((o, i) => { o.visible = os[i]; }); } };   // every area's pieces must stand in the light passes, though only one is shown
    const gain = { value: 0 }, tune = (q.get('baket') || '').split(',').map(Number);   // ?baket=strength,contact,wWin,wSky
    home.useBake(true);   // no halos while the light is baking: the page shows plain, then the soft light fades in
    bakeLight({ THREE, renderer, scene, kit, walls: home.walls, areas: bakeAreas(), group: home.group, quality: Number(q.get('bake')) || 1, debug: q.has('bakedebug'), gain, withAll, masks: home.shadowMasks, ...(tune[0] ? { strength: tune[0], contact: tune[1], wWin: tune[2], wSky: tune[3] } : {}) }).then((bake) => {
      if (!bake) { home.useBake(false); window.cozyBaked = true; return; }
      window.cozyBake = bake; const t0 = performance.now(), fade = (now) => { gain.value = Math.min(1, (now - t0) / 1200); if (gain.value < 1) requestAnimationFrame(fade); else window.cozyBaked = true; }; requestAnimationFrame(fade);
    });
  }
  return api;
}
