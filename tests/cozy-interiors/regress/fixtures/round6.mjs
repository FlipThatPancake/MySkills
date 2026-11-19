// Round 6 (checks and roll): one red and one green fixture for every new or changed check.
import { room } from './common.mjs';
const bug = (name, from, rules, ids, build) => ({ name, from: `round 6: ${from}`, kind: 'bug', expect: { rules, ids }, build });
const good = (name, from, build, counts) => ({ name, from: `round 6: ${from}`, kind: 'good', ...(counts ? { counts } : {}), build });
const win = [{ kind: 'window', x: 3000, width: 1400, height: 1200, sill: 900 }];
export const fixtures = [
  bug('r6-bed-under-window', 'item 8: the headboard stands under a window', ['placement-16'], ['t-bed'], ({ Home }) => { const { H, a } = room(Home, { openings: win }); a.put('bed', 'bed', [3000, 1077], 0, { group: 'g', hero: true }); for (const [k, x] of [['l', 1875], ['r', 4153]]) a.put('ns' + k, 'bedsideTable', [x, 200], 0, { group: 'g' }); return H; }),
  good('r6-bed-beside-window', 'item 8: the bed on solid wall, the window to the side', ({ Home }) => { const { H, a } = room(Home, { openings: [{ kind: 'window', x: 5300, width: 800, height: 1200, sill: 900 }] }); a.put('bed', 'bed', [2000, 1077], 0, { group: 'g', hero: true }); for (const [k, x] of [['l', 875], ['r', 3153]]) a.put('ns' + k, 'bedsideTable', [x, 200], 0, { group: 'g' }); return H; }, ['frame']),
  bug('r6-pendant-far-from-table', 'item 17: the pendant hangs 2 m from the table', ['placement-11'], ['t-dt-pendantLamp'], ({ Home }) => { const { H, a } = room(Home, { W: 7000 }); const T = a.table('dt', { at: [2200, 2200], w: 1600, d: 900, chairs: 4 }); a.put('dt-pendantLamp', 'pendantLamp', [5200, 2200], 0, { group: 'g', y: 1600 }); return H; }),
  bug('r6-pendant-in-corner', 'item 19: a pendant in a corner over nothing', ['placement-11'], ['t-pl'], ({ Home }) => { const { H, a } = room(Home); a.put('pl', 'pendantLamp', [300, 300], 0, { group: 'g', y: 1600 }); return H; }),
  bug('r6-wardrobe-free', 'item 18: a wardrobe stands free in the room', ['placement-18'], ['t-wd'], ({ Home }) => { const { H, a } = room(Home); a.put('wd', 'wardrobe', [3000, 2000], 0, { group: 'g' }); return H; }),
  good('r6-wardrobe-on-wall', 'item 18: the wardrobe against the wall', ({ Home }) => { const { H, back } = room(Home); back.place('wd', 'wardrobe', 3000, { group: 'g' }); return H; }),
  bug('r6-lamp-in-front-of-chair', 'item 20: a floor lamp stands in front of the reading chair', ['placement-10'], ['t-lamp'], ({ Home }) => { const { H, a, back } = room(Home); back.place('sofa', 'sofa', 3000, { group: 'g', hero: true }); a.put('lamp', 'floorLamp', [3000, 1450], 0, { group: 'g' }); return H; }),
  good('r6-lamp-behind-chair', 'item 20: the lamp beside the chair', ({ Home }) => { const { H, a, back } = room(Home); back.place('sofa', 'sofa', 3000, { group: 'g', hero: true }); a.put('lamp', 'floorLamp', [4300, 250], 0, { group: 'g' }); return H; }),
  bug('r6-sconce-near-window', 'item 7: a wall piece 200 mm from a window frame', ['casing'], ['t-sh'], ({ Home }) => { const { H, back } = room(Home, { openings: win }); back.place('sh', 'wallShelf', 3000 + 700 + 200 + 300, { group: 'g', y: 1500 }); return H; }),
  good('r6-shelf-clear-of-window', 'item 7: a wall piece 400 mm from the frame', ({ Home }) => { const { H, back } = room(Home, { openings: win }); back.place('sh', 'wallShelf', 5000, { group: 'g', y: 1500 }); return H; }),
  bug('r6-bar-stool-with-back-turned', 'item 5: a stool with a back at a table, turned away from it', ['seat'], ['t-st'], ({ Home }) => { const { H, a } = room(Home); a.table('dt', { at: [3000, 2000], w: 1600, d: 900, chairs: 2 }); a.put('st', 'stool', [3000, 2800], 0, { group: 'g', params: { form: 2 } }); return H; }),
  bug('r6-throw-on-floor', 'item 2: a folded throw lies on the floor', ['throw'], ['t-th'], ({ Home }) => { const { H, a } = room(Home); a.put('th', 'foldedThrow', [3000, 2000], 0, { group: 'g' }); return H; }),
];
fixtures.push(
  bug('r6-shoes-away-from-door', 'item 4: shoes stand in the middle of the room, far from any door', ['shoes'], ['t-sh'], ({ Home }) => { const { H, a } = room(Home); a.put('sh', 'shoes', [3000, 2500], 0, { group: 'g' }); return H; }),
  { known: true, ...good('r6-shoes-by-the-door', 'item 4: shoes inside the outside door', ({ Home }) => { const { H, a } = room(Home, { openings: [{ kind: 'door', x: 3000, width: 900 }] }); a.put('sh', 'shoes', [4000, 250], 0, { group: 'g' }); return H; }) },   /* the shoes asset still reports loose pieces (assets thread) */
);
