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
import { VIEW } from './sheet.js';
import { createTour } from './tour.js';
import { createMotion } from './motion/index.js';

const rad = THREE.MathUtils.degToRad, deg = THREE.MathUtils.radToDeg, FOV = 30, GLIDE_S = 1.6, SPAN = 80;
const smooth = (k) => k * k * (3 - 2 * k);

export function createAreaScene(canvas, S) {
  const q = new URLSearchParams(location.search);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setClearColor(0xf4f4f1);
  renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene(), kit = createKit();
  if (S.home.accent) kit.setAccent(S.home.accent);
  kit.keepParts = q.has('check');
  const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 400000);
  const home = buildHome(kit, S.home, REGISTRY, S.areas);
  scene.add(home.group);
  kit.setOpacity(1, 1);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minPolarAngle = rad(5); controls.maxPolarAngle = rad(95);

  const sph = (d, az, el) => new THREE.Vector3().setFromSphericalCoords(d, rad(90 - el), rad(az));
  const areas = Object.fromEntries(S.areas.map((a) => [a.id, a]));
  const order = S.areas.map((a) => a.id);
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
    return h.fit === 'objects' ? fitView(A, v) : v;
  };
  // open plan: areas of one group share a floor and are drawn together, and the fade box is the group's bounds, so nothing thins out at a seam
  const groupOf = (id) => areas[id].group || id, together = (a, b) => !!a && !!b && groupOf(a) === groupOf(b);
  const boundsOf = (A) => { if (!A.group) return A.bounds; const m = S.areas.filter((x) => x.group === A.group).map((x) => x.bounds); return { x0: Math.min(...m.map((b) => b.x0)), x1: Math.max(...m.map((b) => b.x1)), z0: Math.min(...m.map((b) => b.z0)), z1: Math.max(...m.map((b) => b.z1)), top: A.bounds.top }; };
  const fadeOf = (A) => {
    let b = boundsOf(A); const top = b.top || 2500, w = Math.max(b.x1 - b.x0, b.z1 - b.z0), r0 = 0;
    for (const W of home.walls) if (W.walk.length && W.id && together(order.find((q) => W.id.startsWith(q + '-')), A.id)) b = { ...b, ...[W.from, W.to].reduce((e, q) => { const x = q[0] - W.n[0] * 1600, z = q[1] - W.n[1] * 1600; return { x0: Math.min(e.x0, x), x1: Math.max(e.x1, x), z0: Math.min(e.z0, z), z1: Math.max(e.z1, z) }; }, { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 }) };   // the floor beyond a way through stays in view
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
    tour = createTour({ THREE, camera, controls, room: home.group, home: { pos: camera.position.clone(), target: controls.target.clone() }, cfg: { ...Object.fromEntries(['after', 'cutsAfter', 'cutEvery'].filter((k) => cam[k] != null).map((k) => [k, cam[k]])), shots: cam.shots, ...(quick ? { after: quick, cutsAfter: quick } : {}) } });
    api.tour = tour;
  }
  // at rest only the current area exists: other areas' walls (frames, seams, shadows) and objects are hidden outright, so no half-faded ghost of a neighbour shows in any view or tour shot; a glide shows everything
  const shown = (id, area) => id === null || (area ? area === id || groupOf(area) === groupOf(id) : false);
  const only = (id) => { for (const W of home.walls) W.node.visible = id === null || shown(id, order.find((a) => (W.id || '').startsWith(a + '-'))); for (const o of Object.values(home.objects)) o.visible = shown(id, o.userData.scene.area); };   // an area's whole open-plan group is drawn at rest
  function arrive(id) {
    cur = id; api.area = id; only(id);
    const v = viewOf(areas[id]);
    controls.target.set(...v.target); camera.position.copy(controls.target).add(sph(v.dist, v.az, v.el)); camera.lookAt(controls.target);
    camera.fov = FOV; limits(v.az); controls.enabled = true; resize(); controls.update();   // resize() updates the projection; a glide that cut a tour shot short would otherwise keep the shot's lens
    applyFade(fadeOf(areas[id])); makeTour(id); markLabels();
  }
  // Where the camera is now, as target + spherical offset.
  const stance = () => { const off = camera.position.clone().sub(controls.target), s = new THREE.Spherical().setFromVector3(off); return { target: controls.target.toArray(), az: deg(s.theta), el: 90 - deg(s.phi), dist: s.radius }; };
  function startGlide(id, hold = false) {
    if (!areas[id]) throw new Error(`no area "${id}"; areas: ${order.join(', ')}`);
    if (id === cur && !glide) return;
    const from = stance(), to = viewOf(areas[id]);
    let daz = ((to.az - from.az + 540) % 360) - 180;   // the short way round
    glide = { id, from, to, daz, fade0: cur ? fadeOf(areas[cur]) : fadeOf(areas[id]), fade1: fadeOf(areas[id]), t0: performance.now(), hold, k: 0 };
    controls.enabled = false; markLabels(id); if (!together(cur, id)) only(null);   // between areas of one group nothing switches on or off
  }
  function glideAt(k) {
    const g = glide, e = smooth(Math.min(1, Math.max(0, k))); g.k = k;
    const tg = g.from.target.map((a, i) => a + (g.to.target[i] - a) * e);
    controls.target.set(...tg);
    camera.position.copy(controls.target).add(sph(g.from.dist + (g.to.dist - g.from.dist) * e, g.from.az + g.daz * e, g.from.el + (g.to.el - g.from.el) * e));
    camera.lookAt(controls.target);
    applyFade(g.fade0.map((a, i) => a + (g.fade1[i] - a) * e));
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
    const i = order.indexOf(glide ? glide.id : cur), j = i + (e.key === 'ArrowRight' ? 1 : -1);
    if (j >= 0 && j < order.length) setArea(order[j]);
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
  renderer.setAnimationLoop((now) => {
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000)); last = now;
    if (glide) { lastInput = now; if (!glide.hold) glideAt((now - glide.t0) / 1000 / GLIDE_S); }
    else if (!tour.update(now, now - lastInput)) controls.update();
    for (const g of Object.values(home.objects)) { g.userData.tick?.(dt); g.userData.update?.(dt); }
    api.motion.update(dt, api.area);
    moveFronts(dt);
    home.update(camera, tour.look || controls.target);
    renderer.render(scene, camera);
  });
  window.cozyScene = api;
  // the light is baked after the page is up (the passes are spread over frames) and fades in; until then, and if the bake is not possible, the old halos stand in
  window.cozyBaked = q.has('nobake') || q.has('check');
  if (!window.cozyBaked) {
    const withAll = (fn) => { const ws = home.walls.map((W) => W.node.visible), os = Object.values(home.objects).map((o) => o.visible); only(null); try { fn(); } finally { home.walls.forEach((W, i) => { W.node.visible = ws[i]; }); Object.values(home.objects).forEach((o, i) => { o.visible = os[i]; }); } };   // every area's pieces must stand in the light passes, though only one is shown
    const gain = { value: 0 }, tune = (q.get('baket') || '').split(',').map(Number);   // ?baket=strength,contact,wWin,wSky
    home.useBake(true);   // no halos while the light is baking: the page shows plain, then the soft light fades in
    bakeLight({ THREE, renderer, scene, kit, walls: home.walls, areas: bakeAreas(), group: home.group, quality: Number(q.get('bake')) || 1, debug: q.has('bakedebug'), gain, withAll, ...(tune[0] ? { strength: tune[0], contact: tune[1], wWin: tune[2], wSky: tune[3] } : {}) }).then((bake) => {
      if (!bake) { home.useBake(false); window.cozyBaked = true; return; }
      window.cozyBake = bake; const t0 = performance.now(), fade = (now) => { gain.value = Math.min(1, (now - t0) / 1200); if (gain.value < 1) requestAnimationFrame(fade); else window.cozyBaked = true; }; requestAnimationFrame(fade);
    });
  }
  return api;
}
