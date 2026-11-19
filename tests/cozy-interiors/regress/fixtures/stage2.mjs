// Round 6 stage 2 (arrange.mjs): a.still and a.wallArr build the dealt still lifes and wall arrangements so they pass the checks by their making.
import { room } from './common.mjs';
export const fixtures = [
  { name: 'good-still-two-things-on-a-console', from: 'stage 2: a.still puts the two dealt things on a console, spaced along the top', kind: 'good',
    build({ Home }) { const { H, a, back } = room(Home); back.place('con', 'console', 3000, { group: 'g', hero: true }); a.still('con', ['jars (jars)', 'mug (mug)'], { group: 'g' }); return H; } },
  { name: 'good-still-a-vase-keeps-clear-of-the-edge', from: 'stage 2: a vase of branches reaches wider than its size says, so a.still keeps it 150 mm in', kind: 'good',
    build({ Home }) { const { H, a, back } = room(Home); back.place('sb', 'sideboard', 3000, { group: 'g', hero: true }); a.still('sb', ['vase (vase)', 'mug (mug)'], { group: 'g' }); return H; } },
  { name: 'good-wall-picture-over-a-sofa', from: 'stage 2: a picture over a sofa is 0.5 to 0.8 of the sofa and hangs 170 to 230 over the back, by its real frame', kind: 'good',
    build({ Home }) { const { H, a, back } = room(Home); back.place('sofa', 'sofa', 3000, { group: 'g', hero: true }); a.wallArr('picture group over the sofa (picture)', { wall: back, xc: 3000, over: 'sofa', group: 'g' }); return H; } },
  { name: 'good-wall-open-shelf-with-things', from: 'stage 2: an open shelf hangs at its own height on open wall', kind: 'good',
    build({ Home }) { const { H, a, back } = room(Home); back.place('sb', 'sideboard', 1500, { group: 'g', hero: true }); a.wallArr('open shelf with plates and jars (openShelf)', { wall: back, xc: 4300, group: 'g2' }); return H; } },
  { name: 'good-wall-unknown-phrase-is-left-not-thrown', from: 'stage 2: a wall phrase the builder does not know is listed in left, not thrown', kind: 'good',
    build({ Home }) { const { H, a, back } = room(Home); back.place('sb', 'sideboard', 3000, { group: 'g', hero: true }); const r = a.wallArr('stained glass panel (glass)', { wall: back, xc: 4300, group: 'g2' }); if (!r.left.length) throw new Error('expected the phrase in left'); return H; } },
];
