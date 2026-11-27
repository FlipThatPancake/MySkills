// Placement bugs from rounds 1-2 (their checks are in geom/placement.mjs). A new bug whose check does not exist yet goes here as kind 'pending': the runner reports PENDING until some check names the object, then NOW-CAUGHT: change kind to 'bug'.
import { room } from './common.mjs';
export const fixtures = [
  { name: 'mirror-over-sofa', from: 'Paul (round 1, Nov 17): who would put a mirror above a sofa; placement/checks.md rule 3', kind: 'bug', expect: { rules: ['placement-3'], ids: ['t-mirror'] },
    build({ Home }) { const { H, a, back } = room(Home); back.place('sofa', 'sofa', 3000, { group: 'g', hero: true }); back.place('mirror', 'mirror', 3000, { group: 'g', y: 1150 }); return H; } },
  { name: 'picture-too-low-over-sofa', from: 'placement/checks.md rule 1: art bottom 150-250 above the furniture top', kind: 'bug', expect: { rules: ['placement-1'], ids: ['t-pic'] },
    build({ Home }) { const { H, back } = room(Home); back.place('sofa', 'sofa', 3000, { group: 'g', hero: true }); back.place('pic', 'picture', 3000, { overlap: true, group: 'g', y: 700 }); return H; } },
  { name: 'pot-rail-far-from-hob', from: 'round-2 E1: pot rail more than 1 m from the hob; placement rule 12', kind: 'bug', expect: { rules: ['placement-12'], ids: ['t-rail'] },
    build({ Home }) { const { H, a, back } = room(Home, { W: 7000 }), R = a.run(back, 'run', 500, [{ w: 900, kind: 'hob' }, { w: 600, kind: 'doors' }], { group: 'run' }); R.on('hob', 'hob'); back.place('rail', 'potRail', 5800, { group: 'run', y: 1050 }); return H; } },
  { name: 'coffee-table-too-far', from: 'placement/checks.md rule 7: coffee table 350-500 mm from the sofa front', kind: 'bug', expect: { rules: ['placement-7'], ids: ['t-ct'] },
    build({ Home }) { const { H, a, back } = room(Home); back.place('sofa', 'sofa', 3000, { group: 'g', hero: true }); a.put('ct', 'coffeeTable', [3000, 2400], 0, { group: 'g' }); return H; } },
];
