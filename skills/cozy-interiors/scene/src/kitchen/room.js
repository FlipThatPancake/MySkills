// @js:kitchen-room — puts the kitchen together: every element in its place, the wall, the floor
// and soft contact shadows, floor tiles, props and the window. Millimetres, origin at the left-front-floor corner of the
// base run, room at -z; the oven (the live oven's 880 x 760 front picture, or the 3D model that replaces it when the camera leaves home) sits in the column's opening at OVEN.
import { ovenColumn } from './ovenColumn.js';
import { fridge } from './fridge.js';
import { baseRun } from './baseRun.js';
import { hob } from './hob.js';
import { hood } from './hood.js';
import { wallCabinets } from './wallCabinets.js';
import { counterOven } from './counterOven.js';
import { pan } from './pan.js';
import { cuttingBoard } from './cuttingBoard.js';
import { plant } from './plant.js';
import { catScratches } from './catScratches.js';
import { socket, lightSwitch, fridgeFeet } from './details.js';
import SCENE from './scene.json';
import { cat } from './cat.js';
import { fruitBowl } from './fruitBowl.js';
import { butterfly } from './butterfly.js';
import { builtinOven } from './builtinOven.js';
import { shadows, tiles, windowAndLight, pendantLamp, WIN } from './atmosphere.js';

// Main run along the wall, left to right: corner unit 1000, sink unit 800, drawer unit 600, hob unit 900,
// oven column 920, fridge 910; a 1500 mm return run comes forward from the left end.
export const OVEN = { x: 3320, y: 790, w: 880, h: 870, d: 560 };   // the opening: the model (910 x 883 mm, scaled to 880 wide) fills it; the live oven's 760 mm picture sits in its middle at home
export const SIZE = { w: 5130, h: 2250, d: 2100, front: 1500 };      // the units, without wall and floor; `front` is how far the return reaches forward of z = 0
// The niche in the column: the oven's sheet-metal body (870 x 859 mm of the model, scaled by 880 / 910) plus 4 mm clearance each side. The oven's front frame (880 x 854) is
// bigger and sits on the column's face, so it overlaps the niche's edges and no gap shows round the front.
export const NICHE = { w: Math.round(870 * 880 / 910) + 8, h: Math.round(859 * 880 / 910) + 8 };
export const OVEN_FACE = { x: OVEN.x + OVEN.w / 2, y: OVEN.y + OVEN.h / 2 };   // centre of the oven's front
export const FADE = [0.15, 0.6];   // the wall and floor thin out between these distances beyond the units' ends, in kitchen widths
const WALL_Z = -600;
// The cat is hidden while it is rebuilt; set this to true to bring it (and its Settings row) back.
export const SHOW_CAT = false;
// 60 m each way, so no edge comes into view at any allowed angle or zoom.
const EDGE = { x0: -28000, x1: 33000, depth: 28000, height: 40000 };

export function buildKitchen(kit) {
  const { THREE } = kit;
  const room = kit.group();
  const put = (g, x, y, z) => { g.position.set(x, y, z); room.add(g); return g; };
  // Every object comes from scene.json: which asset, where (`at`, mm), `turn` in degrees about the vertical, and what it stands on (`mount`, read by the checks).
  // The oven column and the hero oven take the niche worked out above; the lamp and the scratches still draw themselves in kitchen millimetres, so they sit at the origin.
  const ASSETS = { baseRun, hob, hood, wallCabinets, counterOven, fridge, fruitBowl, pan, cuttingBoard, plant, catScratches, pendantLamp, socket, lightSwitch, fridgeFeet,
    ovenColumn: (k) => ovenColumn(k, { x: OVEN.x + OVEN.w / 2 - 3300 - NICHE.w / 2, y: OVEN.y + OVEN.h / 2 - 100 - NICHE.h / 2, w: NICHE.w, h: NICHE.h }).group,
    builtinOven: (k) => builtinOven(k, { cx: OVEN_FACE.x, cy: OVEN_FACE.y, nicheW: NICHE.w, nicheH: NICHE.h }) };   // stand-in for the prototype's Blender oven
  const obj = {};
  for (const o of SCENE.objects) {
    const g = ASSETS[o.asset](kit, o.params || {});
    g.rotation.y = (o.turn || 0) * Math.PI / 180;
    put(g, ...o.at);
    g.userData.scene = o;
    obj[o.id] = g;
  }
  const pr = obj.plant, bowl = obj['fruit-bowl'];
  room.userData.objects = obj;
  // The 4× detail pass can be switched off to compare (Settings, or ?plain in the address).
  room.userData.setDetail = (on) => SCENE.objects.forEach((o) => { if (o.detail) obj[o.id].visible = on; });
  room.userData.SCENE = SCENE;

  // Back wall, side wall along the return's outer end, and floor: three planes that meet in a corner.
  // The planes are one-sided, so from outside the side wall the room is open (a cutaway).
  const X0 = -14, L = 33000 - X0, D = EDGE.depth + 604;
  // The back wall has a hole behind the oven's opening: the oven is deeper than the column and reaches through it, and nobody sees behind the wall.
  const wallShape = new THREE.Shape(), wallHole = new THREE.Path(), wcx = X0 + L / 2, wcy = EDGE.height / 2;
  wallShape.moveTo(-L / 2, -wcy); wallShape.lineTo(L / 2, -wcy); wallShape.lineTo(L / 2, wcy); wallShape.lineTo(-L / 2, wcy); wallShape.closePath();
  const hx0 = OVEN_FACE.x - NICHE.w / 2 - wcx, hx1 = OVEN_FACE.x + NICHE.w / 2 - wcx, hy0 = OVEN_FACE.y - NICHE.h / 2 - wcy, hy1 = OVEN_FACE.y + NICHE.h / 2 - wcy;
  wallHole.moveTo(hx0, hy0); wallHole.lineTo(hx1, hy0); wallHole.lineTo(hx1, hy1); wallHole.lineTo(hx0, hy1); wallHole.closePath();
  wallShape.holes.push(wallHole);
  const wall = new THREE.Mesh(new THREE.ShapeGeometry(wallShape), kit.fadeFill);
  wall.position.set(wcx, wcy, WALL_Z - 4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(L, D), kit.fadeFill);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(X0 + L / 2, -4, WALL_Z - 4 + D / 2);
  // The side wall has the window cut into it (local x runs toward -z, local y is height - EDGE.height / 2).
  const zc = WALL_Z - 4 + D / 2, ring = new THREE.Shape(), hole = new THREE.Path();
  ring.moveTo(-D / 2, -EDGE.height / 2); ring.lineTo(D / 2, -EDGE.height / 2); ring.lineTo(D / 2, EDGE.height / 2); ring.lineTo(-D / 2, EDGE.height / 2); ring.closePath();
  hole.moveTo(zc - WIN.Z1, WIN.Y0 - EDGE.height / 2); hole.lineTo(zc - WIN.Z0, WIN.Y0 - EDGE.height / 2); hole.lineTo(zc - WIN.Z0, WIN.Y1 - EDGE.height / 2); hole.lineTo(zc - WIN.Z1, WIN.Y1 - EDGE.height / 2); hole.closePath();
  ring.holes.push(hole);
  const side = new THREE.Mesh(new THREE.ShapeGeometry(ring), kit.fadeFill);
  side.rotation.y = Math.PI / 2;
  // With the window setting off, a plain pane closes the opening.
  side.position.set(X0, EDGE.height / 2, WALL_Z - 4 + D / 2);
  // The walls are flat, so the seams are the only sign of the room: they die out within 400 mm past the units' ends, the corner line between 2400 and 2800 mm up.
  const step = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  const floorTone = (p) => step(Math.hypot(Math.max(p[0] - SIZE.w, 0), Math.max(p[2] - SIZE.front, 0)) / 400);
  const cornerTone = (p) => step((p[1] - 2400) / 400);
  const sx = X0 + 3, sz = WALL_Z - 1;
  const sideSeam = kit.meltingLine([sx, -1, sz], [sx, -1, SIZE.front + 500], floorTone);
  const win = windowAndLight(kit);
  room.add(wall, floor, side, shadows(kit, { SIZE, WALL_Z }), tiles(kit, { SIZE, WALL_Z }), win, kit.backdrop(),
    kit.meltingLine([sx, -1, sz], [SIZE.w + 500, -1, sz], floorTone),            // back wall meets floor
    sideSeam,  // side wall meets floor
    kit.meltingLine([sx, -1, sz], [sx, 2900, sz], cornerTone));     // back wall meets side wall
  const theCat = SHOW_CAT ? cat(kit) : null;
  if (theCat) { room.add(theCat.group); room.userData.cat = theCat; }
  const at = (g) => new THREE.Vector3(...g.userData.landing).applyEuler(g.rotation).add(g.position).toArray();   // a perch in room millimetres
  const bf = butterfly(kit, { plant: at(pr), bowl: at(bowl) });
  room.add(bf.group);
  room.userData.butterfly = bf;
  // One call a frame for everything in the room that moves (only while the kitchen is visible).
  room.userData.tick = (dt, o = {}) => {
    if (theCat) theCat.update(dt, o.catExplores);
    bf.update(dt, o.butterfly !== false);
    pr.userData.update(dt);
  };
  room.userData.gust = pr.userData.gust;
  kit.track(room);
  // The window and the side seam fade on their own while the camera is outside the side wall.
  const fa = kit.fadable();
  kit.useFade(win, fa); kit.useFade(sideSeam, fa);
  room.userData.fade = fa;
  return room;
}
