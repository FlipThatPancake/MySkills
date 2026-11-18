// Living things (round 3): the motion rules in check-motion.mjs. Rule name 'motion'. A flier keeps off the wall at a sill perch and 4 s from another flier at the same opening; wind needs a leafy plant
// within 1.5 m of the open window; a cat's paw needs a full-width curtain panel by a solid wall or a sill (never a glass wall).
import { room } from './common.mjs';
export const fixtures = [
  { name: 'good-fliers-keep-off-the-wall-and-apart', from: 'round 3 evaluation: check-motion saw the butterfly 15 mm from the wall outside its window (a fast flier coasted past the sill spot), and a bird and a butterfly came through one window side by side', kind: 'good',
    build({ Home }) { const { H, a } = room(Home, { openings: [{ kind: 'window', x: 5300, width: 1000, height: 1200, sill: 900 }] }); a.put('pl', 'plant', [5300, 900], 0, { group: 'g', y: 0 }); a.alive([{ kind: 'butterfly' }, { kind: 'bee' }]); return H; } },
  { name: 'good-wind-with-a-sill-plant', from: 'round 3: wind counts as a mover only with a leafy plant within 1.5 m of the open window; a pot on the sill of an outward-opening window qualifies', kind: 'good',
    build({ Home }) { const { H, a, back } = room(Home, { openings: [{ kind: 'window', x: 3000, width: 1400, height: 1200, sill: 900, sash: 'out' }] }); back.onSill('herbs', 'plant', 3000, { group: 'g' }); a.alive([{ kind: 'wind' }]); return H; } },
  { name: 'wind-plant-too-far-from-window', from: 'round 3: the kitchen wind moved one plant 2.6 m from an open door and counted as a mover', kind: 'bug', expect: { rules: ['motion'], ids: [] },
    build({ Home }) { const { H, a } = room(Home, { openings: [{ kind: 'window', x: 1200, width: 1200, height: 1200, sill: 900 }] }); a.put('fp', 'floorPlant', [4500, 1500], 0, { group: 'g', y: 0 }); a.alive([{ kind: 'wind' }]); return H; } },
  { name: 'paw-on-a-glass-wall', from: 'round 3: the paw came from a thin curtain bundle on a glass wall, where no cat could hide', kind: 'bug', expect: { rules: ['motion'], ids: [] },
    build({ Home }) { const { H, a, back } = room(Home, { openings: [{ kind: 'window', style: 'wall', x: 3000, width: 3800 }] }); back.place('curtain', 'curtain', 3000, { group: 'g' }); a.alive([{ kind: 'paw' }]); return H; } },
  { name: 'good-paw-narrow-curtain-is-widened', from: 'round 3: the paw hung from a 198 mm panel; compose now widens the curtain to w 1370 (a 301 mm panel) when a paw is dealt', kind: 'good',
    build({ Home }) { const { H, a, back } = room(Home, { openings: [{ kind: 'window', x: 1200, width: 1400, height: 1200, sill: 900 }] }); back.place('curtain', 'curtain', 4200, { group: 'g', params: { w: 900 } }); a.alive([{ kind: 'paw' }]); return H; } },
  { name: 'good-bird-through-a-pair-window', from: 'round 4 M4: a bird appeared outside a pair window with its wing tips 173 mm off the middle, outside the 287 mm gap between the open sashes (the pose was folded only after it appeared)', kind: 'good',
    build({ Home }) { const { H, a } = room(Home, { openings: [{ kind: 'window', style: 'pair', x: 3000, width: 1100, height: 1500, sill: 900, open: 45 }] }); a.alive([{ kind: 'bird' }]); return H; } },
];
