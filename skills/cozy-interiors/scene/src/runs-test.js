// Test page for library/runs.js: the L-shaped test kitchen (library/test-kitchen.js) in its room. Click a front to open it.
// window.runsTest: look(dist, az, el, target) and at(position, target) place the camera at once; openAll(true | false) opens or shuts every front.
import * as THREE from './vendor/three/three.module.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { createKit } from './kitchen3d.js';
import { testKitchen } from './library/test-kitchen.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setClearColor(0xf4f4f1);
const scene = new THREE.Scene(), kit = createKit();
const q = new URLSearchParams(location.search);
kit.keepParts = q.has('check');
const k = testKitchen(kit, { withShell: true });
scene.add(k.shell, k.root, kit.backdrop());
kit.setOpacity(1, 1);
const camera = new THREE.PerspectiveCamera(30, 1, 10, 400000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.49;
const look = (d, a, e, t) => { if (t) controls.target.set(...t); camera.position.copy(controls.target).add(new THREE.Vector3().setFromSphericalCoords(d, THREE.MathUtils.degToRad(90 - e), THREE.MathUtils.degToRad(a))); controls.update(); k.shell.userData.view(camera, controls.target, 10); };
const at = (pos, t) => { controls.target.set(...t); camera.position.set(...pos); controls.update(); k.shell.userData.view(camera, controls.target, 10); };
look(Number(q.get('d')) || 9000, Number(q.get('az') ?? 20), Number(q.get('el') ?? 35), [1800, 700, -1500]);
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); kit.setResolution(w, h); }
resize(); addEventListener('resize', resize);

const openables = k.runs.flatMap((r) => r.obj.userData.openables);
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const frontAt = (e) => {
  const r = canvas.getBoundingClientRect();
  ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(k.root.children, true).find((h) => h.object.isMesh && !h.object.isLineSegments2);
  for (let o = hit && hit.object; o; o = o.parent) if (o.userData.open) return o;
  return null;
};
let downAt = null;
canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', (e) => { if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return; const f = frontAt(e); if (f) f.userData.open.target = 1 - f.userData.open.target; });
canvas.addEventListener('pointermove', (e) => { if (!e.buttons) canvas.style.cursor = frontAt(e) ? 'pointer' : ''; });
const move = (dt, snap) => {
  for (const f of openables) {
    const o = f.userData.open; o.v = snap ? o.target : o.v + (o.target - o.v) * (1 - Math.exp(-dt * 7));
    if (o.kind === 'door') f.rotation.y = o.dir * THREE.MathUtils.degToRad(o.max) * o.v; else f.position.z = o.max * o.v;
  }
};
let last = performance.now();
renderer.setAnimationLoop((now) => { const dt = Math.min(0.1, (now - last) / 1000); last = now; controls.update(); k.shell.userData.view(camera, controls.target, dt); move(dt); renderer.render(scene, camera); });
window.runsTest = { camera, controls, kit, kitchen: k, look, at, openAll(on) { openables.forEach((f) => { f.userData.open.target = on ? 1 : 0; }); move(1, true); } };
