// Round 6 rollstats --build findings in the assets: each fixture is red on the code before the fix and green after it.
import { room } from './common.mjs';
export const fixtures = [
  { name: 'good-plant-stand-two-tiers-wide', from: 'rollstats --build: plantStand r 240 h 540 tiers 2 (the plant corner recipe): the legs pass through the lower tier disc 28 mm, which is joinery, not a fault', kind: 'good',
    build({ Home }) { const { H, a } = room(Home); a.put('ps', 'plantStand', [3000, 1500], 0, { group: 'g', params: { r: 240, h: 540, tiers: 2, plant: 'bush', seed: 84 } }); return H; } },
  { name: 'good-shoes-two-neat-pairs', from: 'rollstats --build: shoes neat with pairs 2 reads as 3 loose pieces (separate shoes are by design: the asset declares its pieces)', kind: 'good',
    build({ Home }) { const { H, a } = room(Home, { openings: [{ kind: 'door', x: 3000, width: 900 }] }); a.put('sh', 'shoes', [4200, 300], 0, { group: 'g', params: { arrange: 'neat', pairs: 2, kind: 'sneaker' } }); return H; } },
  { name: 'good-plant-on-round-side-table', from: 'rollstats --build: any plant on a round side table (r 260, h 560, hairpin legs) tipped over in the settle test: the top was a 40-sided cone frustum; it is now a fully rounded box', kind: 'good',
    build({ Home }) { const { H, a } = room(Home); a.put('st', 'sideTable', [3000, 1500], 0, { group: 'g', params: { r: 260, h: 560, top: 'round', legs: 'hairpin', shelf: 'none' } }); a.put('pl', 'plant', [3000, 1500], 0, { group: 'g', y: 560, mount: 'on', params: { form: 0 } }); return H; } },
  { name: 'good-armchair-shapes-stand-on-the-floor', from: 'rollstats --build: armchair shapes lounge, sling, rocking and beanbag stood 6-9 mm below the floor (the group code lifted them); each now has its lowest point at y 0', kind: 'good',
    build({ Home }) { const { H, a } = room(Home); ['lounge', 'sling', 'rocking', 'beanbag'].forEach((s, i) => a.put('ch' + i, 'armchair', [1200 + i * 1800, 1500], 0, { group: 'g' + i, params: { shape: s } })); return H; } },
  { name: 'good-cushion-on-slatted-bench', from: 'rollstats --build: a benchCushion on a slatted bench sank 33 mm into it', kind: 'good',
    build({ Home }) { const { H, a } = room(Home); a.put('b', 'bench', [3000, 1500], 0, { group: 'g', params: { form: 'slatted' } }); a.put('c', 'benchCushion', [3000, 1500], 0, { group: 'g', y: 450, mount: 'on', params: { w: 1000, d: 330 } }); return H; } },
  { name: 'good-place-setting-on-a-table', from: 'rollstats --build --stage=2: a placeSetting on a dining table read as 3 to 5 loose pieces (cutlery, glass and napkin stood 50-90 mm off the plate)', kind: 'good',
    build({ Home }) { const { H, a } = room(Home); a.put('rg', 'rug', [3000, 1500], 0, { group: 'g', params: { w: 2600, d: 1800 } }); a.put('tb', 'table', [3000, 1500], 0, { group: 'g' }); for (const [i, p] of [['p0', [2700, 1500]], ['p1', [3300, 1500]]]) a.put(i, 'placeSetting', p, 0, { group: 'g', y: 750, mount: 'on', params: { r: 140, glass: 'yes', napkin: 'yes' } }); return H; } },
  { name: 'good-read-shelf-every-form', from: 'rollstats --build --stage=2: a readShelf on a wall read as 2 loose pieces and hung on no wall', kind: 'good',
    build({ Home }) { const { H, a } = room(Home); ['ledge', 'floating', 'bracket', 'double', 'pegs'].forEach((f, i) => a.put('rs' + i, 'readShelf', [800 + i * 1100, 0], 0, { group: 'g', y: 1300, mount: 'wall', params: { form: f, w: 800 } })); return H; } },
  { name: 'good-coffee-tables-and-tripod-lamp-on-the-floor', from: 'rollstats --build --stage=2: coffee table shapes round/tray and the tripod reading lamp stood 1-4 mm below the floor', kind: 'good',
    build({ Home }) { const { H, a } = room(Home, { W: 9000 }); ['round', 'tray', 'frame', 'block'].forEach((s, i) => a.put('ct' + i, 'coffeeTable', [1000 + i * 1500, 2200], 0, { group: 'g', params: { shape: s } })); a.put('rl', 'readingLamp', [7600, 800], 0, { group: 'g', params: { form: 'tripod' } }); return H; } },
  { name: 'good-vase-of-twigs-on-a-console', from: 'rollstats --build --stage=2: a vase of branches with 7 stems fanned 1.2 m wide and reached past the console and the wall', kind: 'good',
    build({ Home }) { const { H, a } = room(Home); a.put('cs', 'console', [3000, 200], 0, { group: 'g' }); a.put('v', 'vase', [3000, 200], 0, { group: 'g', y: 800, mount: 'on', params: { stems: 7, form: 0 } }); return H; } },
];
