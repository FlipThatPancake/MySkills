// @js:area-run — createAreaScene(canvas, S): the page-side runner for a scene.json with `areas` (see set.js). One area is on show at a time (?area=<id>, or cozyScene.setArea(id)).
// The orbit is the old kitchen's: the front half of the area, a little below eye level to nearly straight down, the home view and zoom limits fitted to the furniture.
// window.cozyScene: { scene, camera, controls, kit, areas, area (active id), setArea(id), objects, openables, tour, look(dist, az, el, target?), at(pos, target), openAll(on), S }.
import * as THREE from './vendor/three/three.module.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { createKit } from './kitchen3d.js';
import { REGISTRY } from './library/index.js';
import { buildArea } from './set.js';
import { createTour } from './tour.js';

const rad = THREE.MathUtils.degToRad, FOV = 30;

export function createAreaScene(canvas, S) {
  const q = new URLSearchParams(location.search);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setClearColor(0xf4f4f1);
  renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene(), kit = createKit();
  kit.keepParts = q.has('check');
  const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 400000);
  const areas = {};
  for (const a of S.areas) { areas[a.id] = { cfg: a, ...buildArea(kit, a, REGISTRY) }; areas[a.id].group.visible = false; scene.add(areas[a.id].group); }
  scene.add(kit.backdrop());
  kit.setOpacity(1, 1);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minAzimuthAngle = -rad(80); controls.maxAzimuthAngle = rad(80);
  controls.minPolarAngle = rad(5); controls.maxPolarAngle = rad(95);

  const sph = (d, az, el) => new THREE.Vector3().setFromSphericalCoords(d, rad(90 - el), rad(az));
  let cur = null, tour = null, openables = [], objects = {}, lastInput = performance.now();
  const fit = (A) => {   // the whole set in view, from the home angle
    const b = A.bounds, half = Math.tan(rad(FOV / 2)), asp = camera.aspect || 1;
    return Math.max((b.width + 1100) / (2 * half * asp), (b.top + 500) / (2 * half)) * 1.1 + b.z1 / 2;
  };
  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    kit.setResolution(w, h);
    if (cur) { const f = fit(cur); controls.minDistance = 600; controls.maxDistance = f * 1.6; }
  }
  const look = (d, az, el, target) => { if (target) controls.target.set(...target); camera.position.copy(controls.target).add(sph(d, az, el)); camera.lookAt(controls.target); controls.update(); };
  const at = (pos, target) => { controls.target.set(...target); camera.position.set(...pos); camera.lookAt(controls.target); controls.update(); };

  function setArea(id) {
    const A = areas[id]; if (!A) throw new Error(`no area "${id}"; areas: ${Object.keys(areas).join(', ')}`);
    if (cur) cur.group.visible = false;
    cur = A; A.group.visible = true; A.activate();
    objects = A.objects; openables = A.openables; api.area = id;
    resize();
    const home = A.cfg.camera?.home || {};
    controls.target.copy(A.bounds.centre);
    camera.position.copy(A.bounds.centre).add(sph(home.dist || fit(A), home.az ?? 20, home.el ?? 15));
    controls.update();
    const cam = A.cfg.camera || {}, quick = Number(q.get('cuts')) || 0;
    tour = createTour({ THREE, camera, controls, room: A.group, home: { pos: camera.position.clone(), target: controls.target.clone() }, cfg: { after: cam.after, cutsAfter: cam.cutsAfter, cutEvery: cam.cutEvery, shots: cam.shots, ...(quick ? { after: quick, cutsAfter: quick } : {}) } });
    api.tour = tour;
  }
  addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  for (const ev of ['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart']) addEventListener(ev, () => { lastInput = performance.now(); }, { capture: true, passive: true });

  // Click (not drag) on a front opens it; a second click shuts it.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const frontAt = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(cur.group.children, true).find((h) => h.object.isMesh && !h.object.isLineSegments2 && h.object.visible);
    for (let o = hit && hit.object; o; o = o.parent) if (o.userData.open) return o;
    return null;
  };
  let downAt = null;
  canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', (e) => { if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return; const f = frontAt(e); if (f) f.userData.open.target = 1 - f.userData.open.target; });
  canvas.addEventListener('pointermove', (e) => { if (!e.buttons) canvas.style.cursor = frontAt(e) ? 'pointer' : ''; });
  const moveFronts = (dt, snap) => {
    for (const f of openables) {
      const o = f.userData.open; o.v = snap ? o.target : o.v + (o.target - o.v) * (1 - Math.exp(-dt * 7));
      if (o.kind === 'door') f.rotation.y = o.dir * rad(o.max) * o.v; else f.position.z = o.max * o.v;
    }
  };
  let last = performance.now();
  const api = {
    scene, camera, controls, kit, areas, area: null, setArea, look, at, S, tour: null,
    get objects() { return objects; }, get openables() { return openables; },
    openAll(on) { openables.forEach((f) => { f.userData.open.target = on ? 1 : 0; }); moveFronts(1, true); },
  };
  setArea(q.get('area') || S.areas[0].id);
  renderer.setAnimationLoop((now) => {
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000)); last = now;
    if (!tour.update(now, now - lastInput)) controls.update();
    for (const g of Object.values(objects)) { g.userData.tick?.(dt); g.userData.update?.(dt); }
    moveFronts(dt);
    cur.update(camera, tour.look || controls.target, dt);
    renderer.render(scene, camera);
  });
  window.cozyScene = api;
  return api;
}
