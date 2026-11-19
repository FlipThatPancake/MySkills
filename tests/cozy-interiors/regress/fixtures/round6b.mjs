// Round 6 rollstats --build findings in the assets: each fixture is red on the code before the fix and green after it.
import { room } from './common.mjs';
export const fixtures = [
  { name: 'good-plant-stand-two-tiers-wide', from: 'rollstats --build: plantStand r 240 h 540 tiers 2 (the plant corner recipe): the legs pass through the lower tier disc 28 mm, which is joinery, not a fault', kind: 'good',
    build({ Home }) { const { H, a } = room(Home); a.put('ps', 'plantStand', [3000, 1500], 0, { group: 'g', params: { r: 240, h: 540, tiers: 2, plant: 'bush', seed: 84 } }); return H; } },
  { name: 'good-shoes-two-neat-pairs', from: 'rollstats --build: shoes neat with pairs 2 reads as 3 loose pieces (separate shoes are by design: the asset declares its pieces)', kind: 'good',
    build({ Home }) { const { H, a } = room(Home, { openings: [{ kind: 'door', x: 3000, width: 900 }] }); a.put('sh', 'shoes', [4200, 300], 0, { group: 'g', params: { arrange: 'neat', pairs: 2, kind: 'sneaker' } }); return H; } },
];
