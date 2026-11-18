import { room } from './common.mjs';
// Round 4 false alarms (round-4/a): checks that compared pieces of one area with another area's walls or bounds.
// Two areas side by side: a (x 0 to 5000) and b (placed at x 5000), b's left wall standing where a ends.
const two = (Home, sash) => {
  const H = new Home({ seed: 5, floor: 'plain' }), a = H.area('a', 'A', { rect: [0, 0, 5000, 4000] }), b = H.area('b', 'B', { O: [5000, 0], rect: [0, 0, 5000, 4000] });
  const ab = a.back(5000); const bl = b.left(4000, [{ kind: 'window', x: 1500, width: 1200, height: 1200, sill: 900, ...(sash ? { sash } : {}) }]); b.back(5000);
  a.view({ target: [2500, 700, 2000], az: 20, el: 15 }); b.view({ target: [2500, 700, 2000], az: 20, el: 15 });
  return { H, a, b, bl, ab };
};
export const fixtures = [
  { name: 'good-sill-ignores-a-tall-piece-of-the-next-area', from: 'round 4 tester: a fridge of the next area stands behind the bedroom-left wall plane and was reported as standing in front of its window (the sill rule had no own-area test)', kind: 'good',
    build({ Home }) { const { H, a, b } = two(Home); a.put('fridge', 'fridge', [4500, 2500], 90, { group: 'g' }); b.table('bt', { at: [3000, 2200], w: 1600, d: 900, chairs: 2, group: 'table set', hero: true }); return H; } },
  { name: 'good-floorcover-in-an-area-placed-away-from-the-origin', from: 'round 4 tester: floorcover converted world bounds to world again, so an area at O = [17450, 0] read 0% cover', kind: 'good', counts: ['floorcover'],
    build({ Home }) { const { H, b } = two(Home); b.table('bt', { at: [3000, 2000], w: 1600, d: 900, chairs: 2, group: 'table set', hero: true }); return H; } },
];
fixtures.push(
  { name: 'good-sofa-with-its-default-chaise', from: 'round 4 tester: a sofa with the default chaise was flagged by the seat rule until chaise: none', kind: 'good',
    build({ Home }) { const { H, a } = two(Home); a.put('sofa', 'sofa', [2500, 600], 0, { group: 'seat', hero: true }); a.coffeeTable('ct', 'sofa', { group: 'seat' }); return H; } },
  { name: 'good-fixed-window-where-the-roll-needs-no-open-window', from: 'round 4 tester: sash: fixed was refused (the window rule wants something in the sweep) although the area has only floor-bound living things', kind: 'good',
    build({ Home }) { const { H, b } = two(Home, 'fixed'); b.put('sofa', 'sofa', [2500, 3300], 180, { group: 'seat', hero: true }); b.alive([{ kind: 'cat' }]); return H; } },
  { name: 'good-seatsoft-on-a-sofa-with-a-chaise', from: 'round 4 tester: a sofa dealt a chaise got cushions in front of the seats (sunk in the rug, leaning on nothing) and a throw that slid off; the cushions belong on the seats beside the chaise', kind: 'good',
    build({ Home }) { const { H, a } = two(Home); a.put('sofa', 'sofa', [2500, 600], 0, { group: 'seat', hero: true, params: { seats: 3, chaise: 'right', arms: 'none', back: 'loose' } }); a.seatSoft('sofa', { cushions: 2, throw: 'drape', tone: 'accent', group: 'seat' }); return H; } },
  { name: 'good-seatsoft-on-a-sofa-with-a-left-chaise', from: 'round 4 tester: the chaise on the left end', kind: 'good',
    build({ Home }) { const { H, a } = two(Home); a.put('sofa', 'sofa', [2500, 600], 0, { group: 'seat', hero: true, params: { seats: 3, chaise: 'left', arms: 'rolled', back: 'tight' } }); a.seatSoft('sofa', { cushions: 2, throw: 'band', tone: 'accent', group: 'seat' }); return H; } },
  { name: 'good-sofa-with-a-chaise-backs-onto-its-wall', from: 'round 4 tester: the seating rule measured the back of a sofa from the middle of its box, which a chaise pushes 200 mm forward, so the back read 405 mm from the wall', kind: 'good',
    build({ Home }) { const { H, ab } = two(Home); ab.place('sofa', 'sofa', 2500, { group: 'seat', hero: true, params: { seats: 3, chaise: 'right', arms: 'none', back: 'loose' } }); return H; } },
  { name: 'sill-message-names-what-to-change-for-a-bench', from: 'round 4 tester: pair window (sill 450) plus a bench: the sill message told a bench owner to lower a bed headboard; it now names the sill to raise or the piece height', kind: 'bug', expect: { rules: ['sill'], ids: ['raise the window'] },
    build({ Home }) { const { H, a, back } = room(Home, { openings: [{ kind: 'window', x: 3000, width: 1400, height: 1500, sill: 450, sash: 'fixed' }] }); a.put('bench', 'bench', [3000, 250], 0, { group: 'g' }); return H; } },
  ...(() => {   // G2: every roll field that names a thing is in the scene, or a.skip says why
    const R = (a) => ({ seed: 1, areas: { t: { hero: 'a sofa', accents: [], signs: [], pieces: [], plantAt: [], passages: [], groups: ['sofa with a rug and coffee table (the hero group, on the left of the home view)'], still: [], ...a } } });
    const sofa = (a, x = 1500) => a.put('sofa', 'sofa', [x, 600], 0, { group: 'seat', hero: true, params: { seats: 3, chaise: 'none' } });
    const bug = (name, from, roll, id, extra) => ({ name, from, kind: 'bug', expect: { rules: ['rolled'], ids: [id] }, build({ Home }) { const { H, a } = room(Home); H.roll(R(roll)); sofa(a); extra?.(a); return H; } });
    return [
      bug('roll-accent-dropped', 'round 4 mistake 4: the roll names a fruit bowl as an accent and the area has none, with no a.skip', { accents: ['fruit bowl'] }, 'accent "fruit bowl"'),
      bug('roll-foreground-dropped', 'round 4 mistake 4: the roll names a footstool as the foreground piece', { foreground: 'footstool' }, 'foreground piece "footstool"'),
      bug('roll-piece-dropped', 'round 4 mistake 4: the roll lists a curtain at a window as a piece', { pieces: ['curtain at a window'] }, 'piece "curtain at a window"'),
      bug('roll-sign-dropped', 'round 4 mistake 4: the roll deals sofa scratches as a sign', { signs: ['sofa scratches'] }, 'sign "sofa scratches"'),
      bug('roll-named-extra-dropped', 'round 4 mistake 4: the roll deals a laundry hamper (hamper) among the extras', { more: ['laundry hamper (hamper)'], named: undefined }, 'extra "laundry hamper'),
      bug('roll-accent-on-not-in-tone', 'round 4 mistake 4: accentOn names the runner and no runner has tone accent', { accentOn: 'runner' }, 'puts the accent on the runner', (a) => a.put('rn', 'runner', [3000, 1800], 90, { group: 'seat', params: { w: 700, l: 2000, form: 'stripe', tone: 'lo' } })),
      bug('roll-hero-lacks-its-rug', 'round 4 mistake 4: the roll hero is a sofa with a rug and a coffee table and the hero group holds no rug', { hero: 'sofa with a rug and coffee table' }, 'hero "sofa with a rug and coffee table" needs rug'),
      bug('roll-group-not-built', 'round 4 mistake 4: the roll deals a bench group with a blanket and a basket and a chest group stands there instead (the count still matched)', { groups: ['sofa with a rug and coffee table (the hero group, on the left of the home view)', 'bench at a wall with a blanket and a basket, on the back wall, right third'] }, 'group "bench at a wall with a blanket and a basket" is not in the scene', (a) => a.put('chest', 'sideboard', [4500, 300], 0, { group: 'chest' })),
      bug('roll-hero-on-the-wrong-side', 'round 4 mistake 4: the roll puts the hero group on the right of the home view and it stands on the left', { side: 'right' }, 'puts the hero group on the right', (a) => a.put('chest', 'sideboard', [4800, 300], 0, { group: 'chest' })),
      { name: 'good-roll-fields-skipped-with-a-reason', from: 'a roll thing left out says why with a.skip, whatever field names it', kind: 'good',
        build({ Home }) { const { H, a } = room(Home); H.roll(R({ accents: ['fruit bowl'], foreground: 'footstool', signs: ['sofa scratches'], pieces: ['curtain at a window'] })); a.skip('fruitBowl', 'the hob is the subject here'); a.skip('footstool', 'no room'); a.skip('scratches', 'sofa is new'); a.skip('curtain', 'the window is bare glass'); a.put('sofa', 'sofa', [1500, 600], 0, { group: 'seat', hero: true, params: { seats: 3, chaise: 'none' } }); return H; } },
    ];
  })(),
);
