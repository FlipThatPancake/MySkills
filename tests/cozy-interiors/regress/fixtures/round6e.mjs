// Round 6 recipe causes (rollstats cause list by recipe, round-6/fixes/blocking-causes-by-recipe.md): each fixture is a recipe's own geometry that the gate would refuse in many homes.
import { room } from './common.mjs';
export const fixtures = [
  { name: 'good-side-table-splay-legs', from: 'rollstats 200 seeds: 32 seeds named the armchair recipe\'s side table "nothing holds it up (2 mm away)": splay legs ended 4 mm above the floor', kind: 'good',
    build({ Home }) { const { H, a } = room(Home); a.put('st', 'sideTable', [2000, 2000], 0, { group: 'g', params: { r: 240, h: 470, top: 'square', legs: 'splay', shelf: 'none', drawer: 'bar' } }); return H; } },
  { name: 'good-round-table-on-round-rug', from: 'rollstats 200 seeds (seed 11): 13 seeds named the dining set\'s round table "nothing holds it up (7 mm away)": its base rests exactly on the rug, and the contact normal of two flat faces at distance 0 points sideways', kind: 'good', replay: '../replays/round6-round-table-on-rug.json' },
  { name: 'good-coat-stand-tree-feet', from: 'rollstats 200 seeds: 13 seeds named the hallway coat stand "13 mm inside the floor": the tree form\'s three splayed feet ended at y 0, their round ends dipping 13 mm below it', kind: 'good',
    build({ Home }) { const { H, a } = room(Home); a.put('cs', 'coatStand', [2000, 290], 0, { group: 'g', params: { form: 'tree', h: 1750, items: 'none' } }); a.put('cs2', 'coatStand', [3200, 290], 0, { group: 'g', params: { form: 'pole', h: 1750, items: 'none' } }); return H; } },
];
