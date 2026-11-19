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
    build({ Home }) { const { H, a } = room(Home); ['lounge', 'sling', 'rocking', 'beanbag'].forEach((s, i) => a.put('ch' + i, 'armchair', [1200 + i * 1800, 1500], 0, { group: 'g', params: { shape: s } })); return H; } },
  { name: 'good-cushion-on-slatted-bench', from: 'rollstats --build: a benchCushion on a slatted bench sank 33 mm into it', kind: 'good',
    build({ Home }) { const { H, a } = room(Home); a.put('b', 'bench', [3000, 1500], 0, { group: 'g', params: { form: 'slatted' } }); a.put('c', 'benchCushion', [3000, 1500], 0, { group: 'g', y: 450, mount: 'on', params: { w: 1000, d: 330 } }); return H; } },
];
