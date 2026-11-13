// Test page for the room shell: two rooms (a kitchen with an alcove and a living room) joined by a door, with the view fade (blocking walls fade, edges thin out).
import * as THREE from './vendor/three/three.module.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { createKit } from './kitchen3d.js';
import { roomShell } from './shell.js';
import { fridge } from './kitchen/fridge.js';
import { plant } from './kitchen/plant.js';

const PLAN = {
  height: 2500, thickness: 120,
  rooms: [
    { name: 'kitchen', outline: [[0, -3000], [3400, -3000], [3400, 0], [1200, 0], [1200, 800], [0, 800]] },
    { name: 'living', outline: [[3400, -3000], [7600, -3000], [7600, 800], [3400, 800]] },
  ],
  openings: [
    { at: [3400, -1000], width: 900, kind: 'door' },
    { at: [1700, -3000], width: 1400, kind: 'window', sill: 950, height: 1200 },
    { at: [5500, -3000], width: 1800, kind: 'window', sill: 600, height: 1600 },
    { at: [7600, -1200], width: 1200, kind: 'window', sill: 800, height: 1300 },
    { at: [5500, 800], width: 900, kind: 'door' },
  ],
};
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setClearColor(0xf4f4f1);
const scene = new THREE.Scene(), kit = createKit();
const shell = roomShell(kit, PLAN);
scene.add(shell, kit.backdrop());
const f = fridge(kit); f.position.set(2500, 0, -2350); scene.add(f);
const wallBox = kit.box(300, 1450, -2680, 900, 720, 320);   // a wall cabinet on the kitchen's north wall
scene.add(wallBox);
const p = plant(kit); p.position.set(6900, 0, -2600); scene.add(p);
kit.setOpacity(1, 1);
const q0 = new URLSearchParams(location.search);
const camera = new THREE.PerspectiveCamera(30, 1, 10, 400000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(...(q0.get('t') || '3800,600,-1100').split(',').map(Number));
const q = new URLSearchParams(location.search), dist = Number(q.get('d')) || 14000, az = Number(q.get('az') ?? 25), el = Number(q.get('el') ?? 35);
camera.position.copy(controls.target).add(new THREE.Vector3().setFromSphericalCoords(dist, THREE.MathUtils.degToRad(90 - el), THREE.MathUtils.degToRad(az)));
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); kit.setResolution(w, h); }
resize(); addEventListener('resize', resize);
let last = performance.now();
renderer.setAnimationLoop((now) => { const dt = Math.min(0.1, (now - last) / 1000); last = now; controls.update(); shell.userData.view(camera, controls.target, dt); renderer.render(scene, camera); });
// shellTest.look(dist, az, el, target?) jumps the camera at once (the fades settle in about a second) for screenshots.
const look = (d, a, e, t) => { if (t) controls.target.set(...t); camera.position.copy(controls.target).add(new THREE.Vector3().setFromSphericalCoords(d, THREE.MathUtils.degToRad(90 - e), THREE.MathUtils.degToRad(a))); controls.update(); shell.userData.view(camera, controls.target, 10); };
const at = (pos, t) => { controls.target.set(...t); camera.position.set(...pos); controls.update(); shell.userData.view(camera, controls.target, 10); };   // camera at a position (e.g. eye height 1600)
window.shellTest = { camera, controls, shell, kit, look, at };
