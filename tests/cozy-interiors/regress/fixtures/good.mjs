// Scenes that are physically right: the checks must stay silent about them (composition rules such as "needs 8 objects" are ignored).
// If one of these fails, a check has gone too strict, and the old bugs it was written for are probably still caught by luck.
import { room, run } from './common.mjs';
export const fixtures = [
  { name: 'good-desk-things', from: 'books, lamp, laptop and mug properly on a desk (a.onTop)', kind: 'good',
    build({ Home }) { const { H, a } = room(Home); a.put('desk', 'desk', [2800, 350], 0, { group: 'g', hero: true, params: { w: 1500, d: 700, h: 740 } }); a.onTop('desk', [{ id: 'lamp', asset: 'taskLamp' }, { id: 'stack', asset: 'bookStack' }, { id: 'laptop', asset: 'laptop' }, { id: 'mug', asset: 'mug' }], { at: 'back' }); a.put('chair', 'deskChair', [2800, 1000], 180, { group: 'g' }); return H; } },
  { name: 'good-pan-on-hob', from: 'a pan on the hob through R.on (hob pans are meant to stand there)', kind: 'good',
    build({ Home }) { const { H, a, back } = room(Home), R = a.run(back, 'run', 500, [{ w: 600, kind: 'doors' }, { w: 900, kind: 'hob' }, { w: 600, kind: 'drawers' }], { group: 'run' }); R.on('hob', 'hob'); R.on('hob', 'pan'); return H; } },
  { name: 'good-kettle-beside-sink', from: 'R.on(sink, kettle) puts the kettle on the next worktop module', kind: 'good',
    build({ Home }) { const { H, a, back } = room(Home), R = a.run(back, 'run', 500, [{ w: 600, kind: 'doors' }, { w: 900, kind: 'sink' }, { w: 600, kind: 'doors' }], { group: 'run' }); R.on('sink', 'kettle'); return H; } },
  { name: 'good-sofa-on-rug', from: 'a rug under the sofa front legs, a coffee table on it, seat soft things on the sofa', kind: 'good',
    build({ Home }) { const { H, a } = room(Home); a.put('rug', 'rug', [3000, 1300], 0, { group: 'g', params: { w: 2800, d: 1900 } }); a.put('sofa', 'sofa', [3000, 560], 0, { group: 'g', hero: true }); a.put('ct', 'coffeeTable', [3000, 1500], 0, { group: 'g' }); a.seatSoft('sofa', { tone: 'lo', group: 'g' }); return H; } },
  { name: 'good-table-set', from: 'a round table with four chairs on its rug, a cloth and a pendant over it', kind: 'good',
    build({ Home }) { const { H, a } = room(Home); const T = a.table('dt', { at: [3000, 2200], r: 650, chairs: 4, cloth: true }); T.over('pendantLamp'); return H; } },
  { name: 'good-books-on-shelf-top', from: 'a book stack resting on top of a shelf', kind: 'good',
    build({ Home }) { const { H, a } = room(Home); a.put('shelf', 'shelf', [3000, 185], 0, { group: 'g', params: { h: 1800 } }); a.restOn('stack', 'bookStack', 'shelf', { group: 'g' }); return H; } },
  { name: 'good-plant-on-sill', from: 'round-2 tester: a pot on a window sill is supported (onSill)', kind: 'good', known: true,
    build({ Home }) { const { H, back } = room(Home, { openings: [{ kind: 'window', x: 3000, width: 1400, height: 1200, sill: 900, sash: 'fixed' }] }); back.onSill('herbs', 'plant', 3000, { group: 'g' }); return H; } },
  { name: 'good-rotated-rugs-apart', from: 'round-2 E7: two rugs turned 45 degrees whose axis-aligned boxes overlap but whose footprints do not', kind: 'good',
    build({ Home }) { const { H, a } = room(Home); a.put('rug1', 'rug', [2000, 1800], 45, { group: 'g', params: { w: 1600, d: 600 } }); a.put('rug2', 'rug', [2566, 2366], 45, { group: 'g', params: { w: 1600, d: 600 } }); return H; } },
];
