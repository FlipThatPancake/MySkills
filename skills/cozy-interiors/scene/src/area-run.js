// @js:area-run — createAreaScene(canvas, S): the page-side runner for a scene.json with `home` and `areas` (see home.js). The whole home is one world, built once; an area is a view into it:
// its bounds (what stays solid; the fills, lines and objects thin out past them) and its home camera { target, az, el, dist }, with the orbit limited to about 80 degrees either side of that az.
// cozyScene.setArea(id) glides there: camera, target and the fade box ease together over about 1.6 s, so a neighbouring area's nearest pieces pass through the edge of the frame.
// Ways to shift: click a door or arch that names `to: <area id>`, the left/right arrow keys, the area names at the bottom of the page.
// window.cozyScene: { scene, camera, controls, kit, home, areas, area (id), setArea(id, snap), startGlide(id, hold), glideAt(k), objects, openables, tour, look(dist, az, el, target?), at(pos, target), openAll(on), S }.
import * as THREE from './vendor/three/three.module.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { createKit } from './kitchen3d.js';
import { REGISTRY } from './library/index.js';
import { buildHome, FADE } from './home.js';
import { VIEW } from './sheet.js';
import { createTour } from './tour.js';

const rad = THREE.MathUtils.degToRad, deg = THREE.MathUtils.radToDeg, FOV = 30, GLIDE_S = 1.6, SPAN = 80;
const smooth = (k) => k * k * (3 - 2 * k);

export function createAreaScene(canvas, S) {
  const q = new URLSearchParams(location.search);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setClearColor(0xf4f4f1);
  renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene(), kit = createKit();
  kit.keepParts = q.has('check');
  const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 400000);
  const home = buildHome(kit, S.home, REGISTRY);
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
  const viewOf = (A) => {
    const h = A.camera?.home || {}, b = A.bounds, top = b.top || 2500;
    const target = h.target || [(b.x0 + b.x1) / 2, top / 2 - 150, (b.z0 + b.z1) / 2];
    return { target, az: h.az ?? 20, el: h.el ?? 15, dist: h.dist || fit(b) };
  };
  const fadeOf = (A) => {
    const b = A.bounds, top = b.top || 2500, bx = b.x1 - b.x0, bz = b.z1 - b.z0, w = Math.max(bx, bz), r0 = 0.45 * Math.hypot(bx, bz);
    return [(b.x0 + b.x1) / 2, top / 2 - 150, (b.z0 + b.z1) / 2, bx / 2, top / 2 + 300, bz / 2, FADE[0] * w, FADE[1] * w, r0, r0 + 0.35 * w];
  };
  const applyFade = (f) => {
    kit.setFade(new THREE.Vector3(f[0], f[1], f[2]), new THREE.Vector3(f[3], f[4], f[5]), f[6], f[7]);
    const c = new THREE.Vector3(f[0], f[1], f[2]); kit.setViewFade(c, f[8], f[9]);
    VIEW.c = c; VIEW.r0 = f[8]; VIEW.r1 = f[9];
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
    tour = createTour({ THREE, camera, controls, room: home.group, home: { pos: camera.position.clone(), target: controls.target.clone() }, cfg: { after: cam.after, cutsAfter: cam.cutsAfter, cutEvery: cam.cutEvery, shots: cam.shots, ...(quick ? { after: quick, cutsAfter: quick } : {}) } });
    api.tour = tour;
  }
  function arrive(id) {
    cur = id; api.area = id;
    const v = viewOf(areas[id]);
    controls.target.set(...v.target); camera.position.copy(controls.target).add(sph(v.dist, v.az, v.el)); camera.lookAt(controls.target);
    limits(v.az); controls.enabled = true; resize(); controls.update();
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
    controls.enabled = false; markLabels(id);
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
  let downAt = null;
  canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt || glide || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
    const f = targetAt(e); if (!f) return;
    if (f.userData.go) { setArea(f.userData.go); return; }
    const o = f.userData.open;
    if (o.states) { o.i = (o.i + 1) % o.states.length; for (const m of (o.pair || [f])) { const mo = m.userData.open; mo.i = o.i; mo.target = mo.states[o.i]; } }
    else o.target = 1 - o.target;
  });
  canvas.addEventListener('pointermove', (e) => { if (!e.buttons) canvas.style.cursor = !glide && targetAt(e) ? 'pointer' : ''; });
  const moveFronts = (dt, snap) => {
    for (const f of home.openables) {
      const o = f.userData.open; o.v = snap ? o.target : o.v + (o.target - o.v) * (1 - Math.exp(-dt * 7));
      if (o.kind === 'door') f.rotation.y = o.dir * rad(o.max) * o.v; else f.position.z = o.max * o.v;
    }
  };

  let last = performance.now();
  const api = {
    scene, camera, controls, kit, home, areas, area: null, setArea, startGlide, glideAt, look, at, S, tour: null,
    get glide() { return glide; }, objects: home.objects, openables: home.openables,
    openAll(on) { home.openables.forEach((f) => { f.userData.open.target = on ? 1 : 0; }); moveFronts(1, true); },
  };
  resize();
  arrive(q.get('area') || order[0]);
  renderer.setAnimationLoop((now) => {
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000)); last = now;
    if (glide) { lastInput = now; if (!glide.hold) glideAt((now - glide.t0) / 1000 / GLIDE_S); }
    else if (!tour.update(now, now - lastInput)) controls.update();
    for (const g of Object.values(home.objects)) { g.userData.tick?.(dt); g.userData.update?.(dt); }
    moveFronts(dt);
    home.update(camera, tour.look || controls.target);
    renderer.render(scene, camera);
  });
  window.cozyScene = api;
  return api;
}
