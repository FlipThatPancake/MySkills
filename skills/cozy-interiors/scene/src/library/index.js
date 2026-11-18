import { scuff, leaf, heightChart } from './signs.js';
import { candlesticks, jug, breadBasket, placeSetting, glazedCabinet, benchCushion, wallPlates, pendantForm } from './diningset.js';
import { dishRack, utensilCrock, breadBin, toaster, mokaPot, potRail, openShelf, spiceRack, ovenGlove, wallClock, cookbookStand } from './kitchenset.js';
import { windowSeat, readingLamp, floorBooks, teaSet, readShelf } from './readset.js';
import { taskLamp, monitor, notebook, pinboard, binders, deskOrganiser, printer, globe, wallCalendar } from './officeset.js';
import { shoeRack, keyBowl, coatStand, hungHat, hungBag, boots, runner, letterTray } from './hallset.js';
import { bedsideLamp, alarmClock, glassesBook, chestOfDrawers, clothesRail, clothesChair, hamper, leaningMirror, wallSconce } from './bedset.js';
import { chair as armChair, chaise, coffeeShape, floorCushion, logBasket, woodStove, recordPlayer, magazineBox, plantStand, galleryWall, scratches } from './livingset.js';
import { cloth, armThrow, foldedThrow, tablecloth, tableRunner, duvetCloth } from './softpieces.js';
// @js:library-index — the asset registry: scene.json's `asset` name -> generator(kit, params) returning a group (origin and axes as each generator documents).
// A run's params are { length, modules, joins, ownsTop, depth, ... }: with `length` and no `modules` the run is filled with standard widths (fillWidths); modules that fall short of `length` are topped up the same way.
import { baseRun, wallRun, fillWidths } from './runs.js';
import { hob } from '../kitchen/hob.js';
import { hood } from '../kitchen/hood.js';
import { pan } from '../kitchen/pan.js';
import { fruitBowl } from '../kitchen/fruitBowl.js';
import { cuttingBoard } from '../kitchen/cuttingBoard.js';
import { socket, lightSwitch } from '../kitchen/details.js';
import { pendantLamp, LAMP } from '../kitchen/atmosphere.js';
import { table, chair } from './dining.js';
import { bookStack, mirror, wallShelf, roundTable, cat, pouf } from './decor.js';
import { sideTable, cushion, pot, mug, openBook } from './pieces.js';
import { floorPlant, plant, vase, picture, fridge, stool, basket } from './variants.js';
import { jars, kettle, herbs, trolley, teaTowel, saltPepper } from './kitchenware.js';
import { hangingPlant } from './hanging.js';
import { bed, bedsideTable, wardrobe, desk, deskChair, coatHooks, daybed, readingChair, footstool, console_ } from './rooms.js';
import { stepStool, crate, wateringCan, umbrellaStand, shoes, wasteBin, fileBox, laptop } from './small.js';
import { sofa, armchair, coffeeTable, rug, shelf, floorLamp, sideboard, bench, curtain } from './living.js';

function fitted({ length, modules, ...rest }) {
  const given = modules || [], have = given.reduce((s, m) => s + m.w, 0);
  if (length && length > have) return { ...rest, modules: [...given, ...fillWidths(length, given).fill] };
  return { ...rest, modules: given };
}
export const REGISTRY = {
  baseRun: (kit, p) => baseRun(kit, fitted(p)),
  wallRun: (kit, p) => wallRun(kit, fitted(p)),
  floorPlant, cushion, pot, cloth, armThrow, foldedThrow, tablecloth, tableRunner, duvetCloth, scuff, leaf, heightChart, mug, openBook, vase, bookStack, mirror, wallShelf, sideTable, roundTable, cat, basket, pouf,
  stepStool, crate, wateringCan, umbrellaStand, shoes, wasteBin, fileBox, laptop,
  jars, kettle, herbs, trolley, teaTowel, saltPepper, hangingPlant,
  bed, bedsideTable, wardrobe, desk, deskChair, coatHooks, daybed, readingChair, footstool, console: console_,
  candlesticks, jug, breadBasket, placeSetting, glazedCabinet, benchCushion, wallPlates, pendantForm,
  dishRack, utensilCrock, breadBin, toaster, mokaPot, potRail, openShelf, spiceRack, ovenGlove, wallClock, cookbookStand,
  windowSeat, readingLamp, floorBooks, teaSet, readShelf,
  taskLamp, monitor, notebook, pinboard, binders, deskOrganiser, printer, globe, wallCalendar,
  shoeRack, keyBowl, coatStand, hungHat, hungBag, boots, runner, letterTray,
  bedsideLamp, alarmClock, glassesBook, chestOfDrawers, clothesRail, clothesChair, hamper, leaningMirror, wallSconce,
  floorCushion, logBasket, woodStove, recordPlayer, magazineBox, plantStand, galleryWall, scratches,
  armchair: (kit, p = {}) => (p.shape && p.shape !== 'upholstered' ? armChair(kit, p) : armchair(kit, p)),
  coffeeTable: (kit, p = {}) => (p.shape && p.shape !== 'frame' ? coffeeShape(kit, p.shape, p.w ?? 1000, p.d ?? 600, p.h ?? 380) : coffeeTable(kit, p)),
  sofa: (kit, p = {}) => {
    const { chaise: side = 'none', ...rest } = p, base = sofa(kit, rest);
    if (side === 'none') return base;
    const seats = rest.seats ?? 3, w = rest.w || (seats === 2 ? 1650 : 2100), d = rest.d ?? 900, cw = (w - 400) / seats, s = side === 'left' ? -1 : 1, g = kit.group(), c = chaise(kit, { w: cw - 4, len: 820, tone: rest.tone });
    c.position.set(s * (w / 2 - 200 - cw / 2), 0, d / 2 + 400 - 30); g.add(base); g.add(c); return g;
  },
  table, chair, rug, shelf, floorLamp, picture, sideboard, bench, curtain, stool,
  fridge, hob, hood, plant, pan, fruitBowl, cuttingBoard, socket, lightSwitch,
  // the lamp is drawn at a fixed spot in kitchen millimetres; shift it so the object's `at` is where it hangs
  pendantLamp: (kit, { rim = LAMP.RIM } = {}) => { const g = kit.group(), l = pendantLamp(kit); l.position.set(-LAMP.X, rim - LAMP.RIM, -LAMP.Z); g.add(l); return g; },
};
