// @js:scene-main — the kitchen scene on its own: one canvas, an orbit camera, the room's own motion and an idle tour.
// Everything in kitchen millimetres (the room's origin is the left-front-floor corner of the base run).
import * as THREE from './vendor/three/three.module.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { createKit } from './kitchen3d.js';
import { buildKitchen, SIZE, FADE } from './kitchen/room.js';
import { createTour } from './tour.js';

const FOV = 30;
const rad = THREE.MathUtils.degToRad;

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setClearColor(0xf4f4f1);
renderer.toneMapping = THREE.NeutralToneMapping;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 300000);
const kit = createKit();
kit.keepParts = new URLSearchParams(location.search).has('check');
const room = buildKitchen(kit);
scene.add(room);
kit.setOpacity(1, 1);
// 4× detail on unless the address says ?plain; the Settings switch flips it.
const detailSwitch = document.getElementById('setting-detail');
const plain = new URLSearchParams(location.search).has('plain');
room.userData.setDetail(!plain);
if (detailSwitch) {
  detailSwitch.setAttribute('aria-checked', String(!plain));
  detailSwitch.addEventListener('click', () => room.userData.setDetail(detailSwitch.getAttribute('aria-checked') === 'true'));
}

// The orbit: the front half of the room, from a little below eye level to nearly straight down.
const controls = new OrbitControls(camera, canvas);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minAzimuthAngle = -rad(80);
controls.maxAzimuthAngle = rad(80);
controls.minPolarAngle = rad(5);
controls.maxPolarAngle = rad(95);

const centre = new THREE.Vector3(SIZE.w / 2, SIZE.h / 2 - 150, SIZE.front - SIZE.d / 2);
function resize() {
  const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  kit.setResolution(w, h);
  kit.setFade(centre, new THREE.Vector3(SIZE.w / 2, SIZE.h / 2 + 300, SIZE.d / 2), FADE[0] * SIZE.w, FADE[1] * SIZE.w);
  // Fit the whole kitchen; zoom from close to a little wider than that.
  const half = Math.tan(rad(FOV / 2));
  const fit = Math.max((SIZE.w + 1100) / (2 * half * camera.aspect), (SIZE.h + 500) / (2 * half)) * 1.1 + SIZE.d / 2;
  controls.minDistance = 600; controls.maxDistance = fit * 1.6;
  return fit;
}
// Start in the wide view: the whole kitchen, 20 degrees from the right, 15 degrees from above.
const fit = resize();
controls.target.copy(centre);
camera.position.copy(centre).add(new THREE.Vector3().setFromSphericalCoords(fit, rad(90 - 15), rad(20)));
controls.update();
addEventListener('resize', resize);
if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);

// Idle tour (tour.js): a sway after 12 s idle, then video-style cuts between composed views; input brings the camera home.
// ?cuts=<s> shortens the wait before the tour and before the cuts, to watch it quickly.
const quick = Number(new URLSearchParams(location.search).get('cuts')) || 0;
const home = { pos: camera.position.clone(), target: controls.target.clone() };
const tour = createTour({ THREE, camera, controls, room, home, cfg: { ...room.userData.SCENE.camera, ...(quick ? { after: quick, cutsAfter: quick } : {}) } });
let lastInput = performance.now();
for (const ev of ['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart']) addEventListener(ev, () => { lastInput = performance.now(); }, { capture: true, passive: true });

// Opening fronts: a click (not a drag) on a drawer or door opens it, a second click shuts it. Each eases like the oven door, about 0.5 s.
const openables = room.userData.objects['base-run'].userData.openables || [];
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const frontAt = (e) => {
  const r = canvas.getBoundingClientRect();
  ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(room.children, true).find((h) => h.object.isMesh && !h.object.isLineSegments2);
  for (let o = hit && hit.object; o; o = o.parent) if (o.userData.open) return o;
  return null;
};
let downAt = null;
canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
  const f = frontAt(e); if (f) f.userData.open.target = 1 - f.userData.open.target;
});
canvas.addEventListener('pointermove', (e) => { if (!e.buttons) canvas.style.cursor = frontAt(e) ? 'pointer' : ''; });
const moveFronts = (dt) => {
  for (const f of openables) {
    const o = f.userData.open;
    o.v += (o.target - o.v) * (1 - Math.exp(-dt * 7));
    if (o.kind === 'door') f.rotation.y = o.dir * THREE.MathUtils.degToRad(o.max) * o.v;
    else f.position.z = o.max * o.v;
  }
};

let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.max(0, Math.min(0.1, (now - last) / 1000)); last = now;
  if (!tour.update(now, now - lastInput)) controls.update();
  room.userData.tick(dt, { butterfly: true });
  moveFronts(dt);
  // Outside the side wall the window and its seam fade away over about 3 degrees.
  const cam = room.worldToLocal(camera.position.clone()), w3 = camera.position.distanceTo(controls.target) * Math.sin(rad(3));
  const s = Math.min(1, Math.max(0, (cam.x + 14 + w3 / 2) / w3)), side = s * s * (3 - 2 * s);
  kit.sideVis.value = side;
  room.userData.fade.set(side);
  renderer.render(scene, camera);
});
window.kitchenScene = { scene, camera, controls, room, kit, renderer, tour };
