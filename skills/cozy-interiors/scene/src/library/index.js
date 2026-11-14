// @js:library-index — the asset registry: scene.json's `asset` name -> generator(kit, params) returning a group (origin and axes as each generator documents).
// A run's params are { length, modules, joins, ownsTop, depth, ... }: with `length` and no `modules` the run is filled with standard widths (fillWidths); modules that fall short of `length` are topped up the same way.
import { baseRun, wallRun, fillWidths } from './runs.js';
import { fridge } from '../kitchen/fridge.js';
import { hob } from '../kitchen/hob.js';
import { hood } from '../kitchen/hood.js';
import { plant } from '../kitchen/plant.js';
import { pan } from '../kitchen/pan.js';
import { fruitBowl } from '../kitchen/fruitBowl.js';
import { cuttingBoard } from '../kitchen/cuttingBoard.js';
import { socket, lightSwitch } from '../kitchen/details.js';
import { pendantLamp, LAMP } from '../kitchen/atmosphere.js';
import { table, chair } from './dining.js';
import { sofa, armchair, coffeeTable, rug, shelf, floorLamp, picture, sideboard, bench, curtain } from './living.js';

function fitted({ length, modules, ...rest }) {
  const given = modules || [], have = given.reduce((s, m) => s + m.w, 0);
  if (length && length > have) return { ...rest, modules: [...given, ...fillWidths(length, given).fill] };
  return { ...rest, modules: given };
}
export const REGISTRY = {
  baseRun: (kit, p) => baseRun(kit, fitted(p)),
  wallRun: (kit, p) => wallRun(kit, fitted(p)),
  table, chair, sofa, armchair, coffeeTable, rug, shelf, floorLamp, picture, sideboard, bench, curtain,
  fridge, hob, hood, plant, pan, fruitBowl, cuttingBoard, socket, lightSwitch,
  // the lamp is drawn at a fixed spot in kitchen millimetres; shift it so the object's `at` is where it hangs
  pendantLamp: (kit) => { const g = kit.group(), l = pendantLamp(kit); l.position.set(-LAMP.X, 0, -LAMP.Z); g.add(l); return g; },
};
