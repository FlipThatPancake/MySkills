// small exact fixtures for the geometry core, built with the skill's own kit primitives and handed to the core as loaded objects (no page, no buildHome).
// Assets are named so the rules treat them as intended: 'baseRun' = fixed furniture (never free), 'rug' = a flat mark, anything else = a free object.
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify } from '../../../skills/cozy-interiors/scene/geom/shapes.mjs';
const SRC = join(dirname(fileURLToPath(import.meta.url)), '../../../skills/cozy-interiors/scene/src');
globalThis.document ??= { createElement: () => ({ getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }) }) }) };
const { createKit } = await import(SRC + '/kitchen3d.js');
export const kit = createKit(); kit.keepParts = true; const T = kit.THREE;
const parts = (g) => { g.updateMatrixWorld(true); const out = []; g.traverse((o) => { if (!o.isMesh || o.userData.kitLine) return; const p = o.geometry.attributes.position, ix = o.geometry.index, n = ix ? ix.count : p.count, t = new Float64Array(n * 3), v = new T.Vector3(); for (let i = 0; i < n; i++) { v.fromBufferAttribute(p, ix ? ix.getX(i) : i).applyMatrix4(o.matrixWorld); t.set([v.x, v.y, v.z], i * 3); } const I = classify(t); out.push({ tris: t, kind: I.kind, content: !!o.userData.content, through: !!o.userData.through, box: { mn: I.mn, mx: I.mx }, vol: I.vol, area: I.area, type: o.geometry.type }); }); return out; };
export const obj = (id, asset, build, { turn = 0, at = [0, 0, 0], mount = 'floor' } = {}) => { const g = kit.group(); build(g); g.rotation.y = turn * Math.PI / 180; g.position.set(...at); return { id, asset, mount, onSill: false, lift: 0, parts: parts(g) }; };
export const scene = (...objects) => ({ objects, env: [], walls: [], height: 2700 });
const table = (turn = 0) => obj('table', 'baseRun', (g) => { g.add(kit.box(-600, 730, 400, 1200, 30, 800)); for (const [x, z] of [[-560, 360], [520, 360], [-560, -360], [520, -360]]) g.add(kit.box(x, 0, z, 40, 730, 40)); }, { turn });
export const gaps = [3, 0.5, 0, -1, -3, -8];
export const FIX = {
  ...Object.fromEntries(gaps.map((g) => [`book-gap${g}`, () => ({ scene: scene(table(), obj('book', 'book', (q) => q.add(kit.box(-100, 760 + g, 75, 200, 30, 150)))), pair: ['book', 'table'], dist: g })])),
  'turned-gap-2': () => ({ scene: scene(table(37), obj('book', 'book', (q) => q.add(kit.box(-100, 0, 75, 200, 30, 150)), { turn: 11, at: [100, 758, 50] })), pair: ['book', 'table'], dist: -2 }),
  'mug-on-rounded-box': () => ({ scene: scene(obj('top', 'baseRun', (g) => g.add(kit.rbox(-300, 700, 200, 600, 40, 400, 15))), obj('mug', 'mug', (g) => g.add(kit.cyl(0, 740, 0, 40, 95)))), pair: ['mug', 'top'], dist: 0 }),
  'leg-in-rug': () => ({ scene: scene(obj('rug', 'rug', (g) => g.add(kit.box(-800, 0, 600, 1600, 6, 1200)), { turn: 23 }), obj('leg', 'stool', (g) => g.add(kit.cyl(100, 2, 50, 15, 440)))), pair: ['leg', 'rug'], dist: -4 }),
  'book-off-edge': () => ({ scene: scene(table(), obj('book', 'book', (q) => q.add(kit.box(640 - 100, 760, 75, 200, 30, 150)))), moves: 'book' }),
  'book-overhang-ok': () => ({ scene: scene(table(), obj('book', 'book', (q) => q.add(kit.box(660 - 200, 760, 75, 200, 30, 150)))), stays: 'book' }),
  'kettle-over-basin': () => ({ scene: scene(obj('worktop', 'baseRun', (g) => { g.add(kit.box(-600, 870, 300, 400, 30, 600)); g.add(kit.box(200, 870, 300, 400, 30, 600)); g.add(kit.box(-200, 870, 300, 400, 30, 120)); g.add(kit.box(-200, 870, -180, 400, 30, 120)); }), obj('kettle', 'kettle', (g) => g.add(kit.cyl(-140, 900, 0, 90, 220)))), moves: 'kettle' }),
  'vase-floats': () => ({ scene: scene(table(), obj('vase', 'vase', (g) => g.add(kit.cyl(0, 775, 0, 60, 200)))), floats: 'vase', falls: 'vase' }),
};
