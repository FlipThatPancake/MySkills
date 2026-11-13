// @js:scene-run — createScene(canvas, sceneJson): the page-side runner for any scene.json.
// Builds the shell and objects (scene-build.js), an orbit camera (full orbit, zoom limits and the home view fitted to the plan), the shell's view fade each frame,
// click-to-open fronts, each object's userData.update(dt) / tick(dt), and the idle tour (tour.js). ?check keeps parts separate, ?cuts=<s> shortens the tour waits.
// window.cozyScene: { scene, camera, controls, kit, shell, objects, openables, tour, look(dist, az, el, target?), at(pos, target), openAll(on), setDetail(on), S }.
import * as THREE from './vendor/three/three.module.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { createKit } from './kitchen3d.js';
import { buildScene } from './scene-build.js';
import { createTour } from './tour.js';

const rad = THREE.MathUtils.degToRad, FOV = 30;

export function createScene(canvas, S) {
  const q = new URLSearchParams(location.search);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setClearColor(0xf4f4f1);
  const scene = new THREE.Scene(), kit = createKit();
  kit.keepParts = q.has('check');
  const { shell, root, objects, openables } = buildScene(kit, S);
  scene.add(shell, root, kit.backdrop());
  kit.setOpacity(1, 1);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 400000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false;
  controls.minPolarAngle = rad(5); controls.maxPolarAngle = rad(88);

  // Plan bounds -> the home view and the zoom limits.
  const pts = S.plan.rooms.flatMap((r) => r.outline), xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs), H = S.plan.height || 2500;
  const home = S.camera?.home || {}, centre = new THREE.Vector3(...(home.target || [(x0 + x1) / 2, H * 0.25, (z0 + z1) / 2]));
  const radius = Math.hypot(x1 - x0, z1 - z0, H) / 2;
  const sph = (d, az, el) => new THREE.Vector3().setFromSphericalCoords(d, rad(90 - el), rad(az));
  let fitDist = 0;
  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    kit.setResolution(w, h);
    const half = Math.tan(rad(FOV / 2));
    fitDist = radius * 0.85 / (half * Math.min(1, camera.aspect));
    controls.minDistance = 700; controls.maxDistance = fitDist * 1.8;
  }
  resize();
  const homeDist = home.dist || fitDist;
  const look = (d, az, el, target) => { if (target) controls.target.set(...target); camera.position.copy(controls.target).add(sph(d, az, el)); camera.lookAt(controls.target); controls.update(); shell.userData.view(camera, controls.target, 10); };
  const at = (pos, target) => { controls.target.set(...target); camera.position.set(...pos); camera.lookAt(controls.target); controls.update(); shell.userData.view(camera, controls.target, 10); };
  controls.target.copy(centre);
  camera.position.copy(centre).add(sph(homeDist, home.az ?? 20, home.el ?? 35));
  controls.update();
  addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);

  // Idle tour.
  const quick = Number(q.get('cuts')) || 0, cam = S.camera || {};
  const homeView = { pos: camera.position.clone(), target: controls.target.clone() };
  const tour = createTour({ THREE, camera, controls, room: root, home: homeView, cfg: { after: cam.after, cutsAfter: cam.cutsAfter, cutEvery: cam.cutEvery, shots: cam.shots, ...(quick ? { after: quick, cutsAfter: quick } : {}) } });
  let lastInput = performance.now();
  for (const ev of ['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart']) addEventListener(ev, () => { lastInput = performance.now(); }, { capture: true, passive: true });

  // Click (not drag) on a front opens it; a second click shuts it.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const frontAt = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(root.children, true).find((h) => h.object.isMesh && !h.object.isLineSegments2);
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
  renderer.setAnimationLoop((now) => {
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000)); last = now;
    if (!tour.update(now, now - lastInput)) controls.update();
    for (const g of Object.values(objects)) { g.userData.tick?.(dt); g.userData.update?.(dt); }
    moveFronts(dt);
    shell.userData.view(camera, tour.look || controls.target, dt);
    renderer.render(scene, camera);
  });
  const api = {
    scene, camera, controls, kit, shell, objects, openables, tour, look, at, S,
    openAll(on) { openables.forEach((f) => { f.userData.open.target = on ? 1 : 0; }); moveFronts(1, true); },
    setDetail(on) { for (const o of S.objects) if (o.detail) objects[o.id].visible = on; },
  };
  window.cozyScene = api;
  return api;
}
