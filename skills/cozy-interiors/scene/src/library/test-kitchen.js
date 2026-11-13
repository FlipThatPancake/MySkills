// @js:test-kitchen — an L-shaped kitchen built from library/runs.js, the fixture for the runs checks and the runs test page.
// Room 4400 x 3600 (x 0..4400, z -3200..400). Run A stands on the north wall with a blind corner at its west end; run B stands on the west wall and ends at A's front.
import { baseRun, wallRun, fillWidths } from './runs.js';
import { roomShell } from '../shell.js';
import { hob } from '../kitchen/hob.js';

export const CORNER_FILLER = 490;   // mm at B's corner end: wide enough for A's drawers and B's fronts to open together (check-runs.mjs finds the minimum)
export const PLAN = {
  height: 2500, thickness: 120,
  rooms: [{ name: 'kitchen', outline: [[0, -3200], [4400, -3200], [4400, 400], [0, 400]] }],
  openings: [
    { at: [1900, -3200], width: 1400, kind: 'window', sill: 950, height: 1200 },
    { at: [2800, 400], width: 900, kind: 'door' },
    { at: [4400, -1200], width: 900, kind: 'window', sill: 900, height: 1300 },
  ],
};
const DEPTH = 600, LA = 4400, WB = 2200;

export function testKitchen(kit, { filler = CORNER_FILLER, withShell = false } = {}) {
  const root = kit.group(), runs = [];
  const fixedA = [{ w: 900, kind: 'blind', dead: 'l' }, { w: 600, kind: 'drawers' }, { w: 800, kind: 'sink' }, { w: 600, kind: 'doors' }, { w: 900, kind: 'hob' }];
  const A = [...fixedA, ...fillWidths(LA, fixedA).fill];
  const restB = fillWidths(WB - filler - 600).fill;
  const B = [...restB, { w: 600, kind: 'drawers', n: 2 }, ...(filler ? [{ w: filler, kind: 'filler' }] : [])];
  const wallC = fillWidths(1700).fill, wallD = fillWidths(1100).fill;
  const put = (obj, name, x, z, rot, mods, depth) => { obj.position.set(x, 0, z); obj.rotation.y = rot; obj.userData.name = name; root.add(obj); runs.push({ name, obj, x, z, rot, depth, modules: mods, length: mods.reduce((s, m) => s + m.w, 0) }); return obj; };
  put(baseRun(kit, { modules: A, depth: DEPTH, joins: { side: 'start', length: WB } }), 'A', 0, -3200 + DEPTH, 0, A, DEPTH);
  put(baseRun(kit, { modules: B, depth: DEPTH, ownsTop: false }), 'B', DEPTH, -3200 + DEPTH + WB, Math.PI / 2, B, DEPTH);
  put(wallRun(kit, { modules: wallC }), 'C', 2700, -3200 + 320, 0, wallC, 320);
  put(wallRun(kit, { modules: wallD }), 'D', 0, -3200 + 320, 0, wallD, 320);
  const h = hob(kit); h.position.set(2900, 0, -3200 + DEPTH); root.add(h);
  return { root, runs, hob: h, shell: withShell ? roomShell(kit, PLAN) : null };
}
